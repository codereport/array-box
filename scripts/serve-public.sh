#!/usr/bin/env bash

set -Eeuo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
state_dir="${XDG_STATE_HOME:-${HOME}/.local/state}/array-box"
manager_error_log="$state_dir/server-manager.error.log"
manager_log="$state_dir/server-manager.log"
gateway_log="$state_dir/api-gateway.log"
tunnel_log="$state_dir/cloudflared.log"
config_file="$repo_dir/config.js"
deploy=true
check_only=false

declare -a managed_names=()
declare -a managed_pids=()

usage() {
    cat <<'EOF'
Usage: npm run serve:public -- [options]

Starts the Array Box servers, production API gateway, and a Cloudflare quick
tunnel. By default it also updates config.js, commits only that file, and
pushes the commit to the current branch's upstream.

Options:
  --no-deploy  Start the stack and tunnel without changing or pushing config.js
  --check      Validate prerequisites and report currently running components
  -h, --help   Show this help
EOF
}

log() {
    printf '[%(%Y-%m-%d %H:%M:%S)T] %s\n' -1 "$*"
}

warn() {
    printf '[%(%Y-%m-%d %H:%M:%S)T] WARNING: %s\n' -1 "$*" >&2
}

die() {
    printf '[%(%Y-%m-%d %H:%M:%S)T] ERROR: %s\n' -1 "$*" >&2
    exit 1
}

while (( $# > 0 )); do
    case "$1" in
        --no-deploy)
            deploy=false
            ;;
        --check)
            check_only=true
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            usage >&2
            die "Unknown option: $1"
            ;;
    esac
    shift
done

mkdir -p "$state_dir"
chmod 700 "$state_dir" 2>/dev/null || true
cd "$repo_dir"
# Interpreter discovery and execution must not open graphical browser windows.
export ENABLE_CEF=0 DYALOG_NOPOPUPS=1

cleanup() {
    local status=$?
    local index pid

    trap - EXIT INT TERM
    if (( ${#managed_pids[@]} > 0 )); then
        log "Stopping processes started by this launcher..."
        for (( index=${#managed_pids[@]}-1; index>=0; index-- )); do
            pid="${managed_pids[$index]}"
            if kill -0 "$pid" 2>/dev/null; then
                kill -TERM "$pid" 2>/dev/null || true
            fi
        done
        for pid in "${managed_pids[@]}"; do
            wait "$pid" 2>/dev/null || true
        done
    fi
    exit "$status"
}

trap 'exit 130' INT
trap 'exit 143' TERM
trap cleanup EXIT

register_process() {
    managed_names+=("$1")
    managed_pids+=("$2")
}

require_command() {
    command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

port_is_listening() {
    ss -H -ltn "sport = :$1" 2>/dev/null | grep -q .
}

backends_healthy() {
    local endpoint
    for endpoint in \
        http://127.0.0.1:8081/health \
        http://127.0.0.1:8082/health \
        http://127.0.0.1:8084/health \
        http://127.0.0.1:8085/; do
        curl --noproxy '*' -fs --max-time 2 "$endpoint" >/dev/null || return 1
    done
}

gateway_healthy() {
    curl --noproxy '*' -fs --max-time 2 http://127.0.0.1:3000/health >/dev/null
}

show_backend_failure() {
    local endpoint
    for endpoint in http://127.0.0.1:8081/health http://127.0.0.1:8082/health \
        http://127.0.0.1:8084/health http://127.0.0.1:8085/; do
        curl --noproxy '*' -fsS --max-time 2 "$endpoint" >/dev/null \
            || warn "Unhealthy backend: $endpoint"
    done
    tail -n 30 "$manager_error_log" >&2 || true
    warn "Server manager output: $manager_log"
}

verify_deploy_preconditions() {
    local branch upstream behind ahead

    [[ -f "$config_file" ]] || die "Missing configuration file: $config_file"
    git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "$repo_dir is not a Git worktree."
    git diff --quiet -- config.js || die "config.js has uncommitted changes; commit or stash them first."
    git diff --cached --quiet -- config.js || die "config.js has staged changes; commit or unstage them first."

    branch="$(git symbolic-ref --quiet --short HEAD)" || die "Automatic deployment requires a checked-out branch."
    upstream="$(git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null)" \
        || die "Branch $branch has no upstream; configure one or use --no-deploy."
    read -r behind ahead < <(git rev-list --left-right --count "$upstream...HEAD")
    if (( behind != 0 || ahead != 0 )); then
        die "Branch $branch differs from $upstream ($behind behind, $ahead ahead); synchronize it before automatic deployment."
    fi
}

for command_name in node docker cloudflared curl git grep pgrep ss; do
    require_command "$command_name"
done

node scripts/check-public-prerequisites.cjs

if [[ "$deploy" == true ]]; then
    verify_deploy_preconditions
fi

if [[ "$check_only" == true ]]; then
    if backends_healthy; then
        log "Backend servers: healthy"
    else
        log "Backend servers: not running or unhealthy"
    fi
    if gateway_healthy; then
        log "API gateway: healthy"
    else
        log "API gateway: not running or unhealthy"
    fi
    if pgrep -x cloudflared >/dev/null 2>&1; then
        log "Cloudflare tunnel process: running"
    else
        log "Cloudflare tunnel process: not running"
    fi
    log "Preflight checks passed."
    exit 0
fi

if pgrep -x cloudflared >/dev/null 2>&1; then
    die "A cloudflared process is already running. Stop the old tunnel before launching a new one."
fi

if backends_healthy; then
    log "Backend servers are already healthy; reusing them."
else
    occupied_ports=()
    for port in 8081 8082 8084 8085 8181; do
        if port_is_listening "$port"; then
            occupied_ports+=("$port")
        fi
    done
    if (( ${#occupied_ports[@]} > 0 )); then
        die "The backend is unhealthy but these required ports are occupied: ${occupied_ports[*]}"
    fi

    # A first Docker image build can take longer than the backend startup deadline.
    node scripts/check-public-prerequisites.cjs --prepare
    : > "$manager_error_log"
    : > "$manager_log"
    log "Starting backend servers in sandbox mode..."
    node servers/server-manager.cjs --sandbox >"$manager_log" 2>"$manager_error_log" &
    manager_pid=$!
    register_process "backend servers" "$manager_pid"

    deadline=$((SECONDS + 45))
    until backends_healthy; do
        kill -0 "$manager_pid" 2>/dev/null || {
            show_backend_failure
            die "Backend server manager exited during startup."
        }
        (( SECONDS < deadline )) || {
            show_backend_failure
            die "Backend servers did not become healthy within 45 seconds."
        }
        sleep 1
    done
    log "Backend servers are healthy."
fi

if gateway_healthy; then
    log "API gateway is already healthy; reusing it."
else
    port_is_listening 3000 && die "Port 3000 is occupied by something other than a healthy Array Box gateway."

    : > "$gateway_log"
    log "Starting production API gateway..."
    node servers/api-gateway.cjs 3000 --production >"$gateway_log" 2>&1 &
    gateway_pid=$!
    register_process "API gateway" "$gateway_pid"

    deadline=$((SECONDS + 20))
    until gateway_healthy; do
        kill -0 "$gateway_pid" 2>/dev/null || {
            tail -n 30 "$gateway_log" >&2 || true
            die "API gateway exited during startup."
        }
        (( SECONDS < deadline )) || {
            tail -n 30 "$gateway_log" >&2 || true
            die "API gateway did not become healthy within 20 seconds."
        }
        sleep 1
    done
    log "API gateway is healthy."
fi

: > "$tunnel_log"
log "Starting Cloudflare quick tunnel over HTTP/2..."
cloudflared tunnel --url http://localhost:3000 --protocol http2 >"$tunnel_log" 2>&1 &
tunnel_pid=$!
register_process "Cloudflare tunnel" "$tunnel_pid"

wait_for_tunnel_url() {
    local deadline=$((SECONDS + 90))
    local candidate

    while (( SECONDS < deadline )); do
        candidate="$(grep -Eo 'https://[[:alnum:]-]+\.trycloudflare\.com' "$tunnel_log" | head -n 1 || true)"
        if [[ -n "$candidate" ]]; then
            printf '%s\n' "$candidate"
            return 0
        fi
        kill -0 "$tunnel_pid" 2>/dev/null || break
        sleep 1
    done

    tail -n 40 "$tunnel_log" >&2 || true
    return 1
}

if ! tunnel_url="$(wait_for_tunnel_url)"; then
    die "Cloudflare did not provide a quick-tunnel URL within 90 seconds."
fi
log "Tunnel URL: $tunnel_url"

deadline=$((SECONDS + 120))
until curl -fs --max-time 5 "$tunnel_url/health" >/dev/null; do
    kill -0 "$tunnel_pid" 2>/dev/null || {
        tail -n 40 "$tunnel_log" >&2 || true
        die "Cloudflare tunnel exited before its health check passed."
    }
    (( SECONDS < deadline )) || {
        tail -n 40 "$tunnel_log" >&2 || true
        die "Public tunnel health check did not pass within 120 seconds."
    }
    sleep 2
done
log "Public tunnel health check passed."

deployment_status="skipped (--no-deploy)"
if [[ "$deploy" == true ]]; then
    if node scripts/set-backend-url.mjs "$config_file" "$tunnel_url"; then
        if git commit --only -m "🔧 Update production tunnel URL" -- config.js; then
            if git push; then
                deployment_status="config.js committed and pushed"
            else
                deployment_status="commit created, but push failed; run git push manually"
                warn "$deployment_status"
            fi
        else
            deployment_status="config.js updated, but commit failed"
            warn "$deployment_status"
        fi
    else
        deployment_status="config.js update failed"
        warn "$deployment_status"
    fi
fi

printf '\n'
log "Array Box is running publicly."
log "URL: $tunnel_url"
log "Deployment: $deployment_status"
log "Dashboard: http://127.0.0.1:8085"
log "Logs: $state_dir"
log "Press Ctrl+C to stop processes started by this launcher."

health_check_counter=0
while true; do
    sleep 5
    for index in "${!managed_pids[@]}"; do
        pid="${managed_pids[$index]}"
        if ! kill -0 "$pid" 2>/dev/null; then
            set +e
            wait "$pid"
            process_status=$?
            set -e
            die "${managed_names[$index]} exited with status $process_status."
        fi
    done

    (( health_check_counter += 1 ))
    if (( health_check_counter >= 6 )); then
        health_check_counter=0
        backends_healthy || die "A backend health check failed."
        gateway_healthy || die "The API gateway health check failed."
    fi
done
