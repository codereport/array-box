# NARS2000 integration plan and runner contract

## Goal

Add NARS2000 as ArrayBox's seventh language without representing Dyalog APL as
NARS2000. NARS2000 should be usable immediately as an editing language, and code
execution should become available only when a real NARS2000-backed adapter is
configured.

NARS2000 is an Extended APL implementation. Its published application is
primarily Windows-oriented, and its source command line accepts a workspace file
rather than exposing a portable stdin-to-stdout evaluator. That makes a small
platform adapter the honest boundary between ArrayBox and the native runtime.

Official references:

- [NARS2000 home and documentation](https://wiki.nars2000.org/index.php?title=Main_Page)
- [Language features](https://wiki.nars2000.org/index.php?title=Language_Features)
- [Character names and keyboard layout](https://wiki.nars2000.org/index.php?title=Character_names)
- [Supported platforms](https://wiki.nars2000.org/index.php?title=Platforms)

## Implementation plan

### 1. Language identity and editor plumbing

- Add `nars2000` to the selector, canonical language order, permalink state,
  output classes, history, comments, formatter assignment rules, metrics, and
  dashboard.
- Give it its own logo and font class, while using the bundled APL387 font as the
  glyph-capable fallback.
- Include it in site descriptions and generated Open Graph images.

Acceptance criteria: switching to NARS2000 is stable; code and result text use an
APL-capable font; permalinks preserve `lang=nars2000`; telemetry uses a distinct
`nars2000` bucket.

### 2. Language-aware authoring

- Implement the published US NARS2000 keyboard as ArrayBox's backtick-prefix
  mapping, including NARS extensions such as `√`, `π`, `‼`, `∫`, `∂`, `⌻`,
  `⍡`, `⍦`, and `χ`.
- Add syntax classifications for common APL primitives, NARS2000 extensions,
  `⍝` comments, system names, exact rational/variable-precision numeric suffixes,
  and the `..` multi-character primitive.
- Add hover/search documentation for NARS2000 extensions and link entries to the
  official wiki.
- Treat common APL spellings as NARS2000 equivalents in primitive comparison and
  translation, while leaving room for explicit NARS-only overrides.

Acceptance criteria: keyboard insertion, highlighting, comments, primitive
search, docs, comparison, and translation work independently of an evaluator.

### 3. Evaluation boundary

- Expose the same browser-facing shape as other server languages:
  `POST /api/nars2000/eval` with `{ "code": "..." }`.
- Put NARS2000 behind its own bridge and port (`8086`), with two mutually
  exclusive adapter modes: a local runner process or an upstream compatible
  bridge.
- Never pass user code in command-line arguments and never invoke a shell.
- Bound request size, output size, evaluation time, and concurrency.
- Return a degraded health response and a clear setup error when no adapter is
  configured.

Acceptance criteria: the unconfigured state is safe and diagnosable; a contract
runner can successfully evaluate through the full HTTP surface; malformed,
oversized, timed-out, and busy requests fail predictably.

### 4. Operations and observability

- Start the bridge from the server manager, route it through the API gateway, and
  surface it in public/local health checks.
- Record NARS2000 evaluations independently in recent activity, charts, and
  aggregate language cards.
- Make readiness mean a runner/upstream is configured, not merely that the bridge
  process is listening.

Acceptance criteria: local and public dashboards expose readiness, requests are
logged as `nars2000`, and an unconfigured production deployment is visibly
degraded.

### 5. Verification and documentation

- Unit-test keyboard, syntax, editor metadata, documentation, primitive fallback,
  runner configuration, protocol validation, HTTP errors, and a successful fake
  adapter round trip.
- Extend health-check and browser test language lists. Native-runtime tests skip
  cleanly when NARS2000 reports `ready: false`.
- Document installation boundaries, runner protocol, configuration, and rollout.

Acceptance criteria: Node tests pass without NARS2000 installed; browser tests
retain the existing runtime behavior; a configured test adapter is exercised.

## Local runner protocol

Set `NARS2000_RUNNER` to an absolute executable path. Optional arguments are set
with `NARS2000_RUNNER_ARGS`, encoded as a JSON array of strings. ArrayBox starts a
fresh process for each request with `shell: false` and writes exactly one UTF-8
JSON document to stdin:

```json
{"protocolVersion":1,"code":"1+2"}
```

The runner must write exactly one JSON document to stdout and then exit:

```json
{"success":true,"output":"3"}
```

Interpreter errors are valid completed evaluations and should use HTTP-success
semantics at the bridge boundary:

```json
{"success":false,"output":"DOMAIN ERROR"}
```

Write diagnostics to stderr. A non-zero exit, empty/invalid response, timeout, or
excessive output is treated as an adapter failure. The wrapper is responsible for
driving a genuine NARS2000 instance on its platform—for example through a
Windows-specific automation layer or a purpose-built headless build—and for
resetting interpreter state between requests.

Configuration defaults:

| Variable | Default | Purpose |
| --- | ---: | --- |
| `NARS2000_TIMEOUT_MS` | `10000` | Per-evaluation wall-clock limit |
| `NARS2000_MAX_BODY_BYTES` | `65536` | HTTP request body limit |
| `NARS2000_MAX_OUTPUT_BYTES` | `1048576` | Combined adapter response guard |
| `NARS2000_MAX_CONCURRENCY` | `2` | Simultaneous evaluations |

## Upstream mode

Set `NARS2000_UPSTREAM_URL` instead of `NARS2000_RUNNER`. The upstream must expose
`POST <base>/eval`, accept `{ "code": "..." }`, and return the same
`{ "success", "output" }` response. ArrayBox applies its timeout and response
size checks to the upstream call.

## Health behavior

`GET /health` always returns bridge diagnostics as JSON:

- `status: "ok", ready: true` for a configured runner or upstream.
- `status: "degraded", ready: false, mode: "unconfigured"` when neither exists.
- `status: "degraded", ready: false, mode: "invalid"` for conflicting or invalid
  settings.

The readiness check verifies configuration, not a complete native evaluation.
Deployment smoke tests should therefore also submit a small expression such as
`1+2` and verify the NARS2000-produced result.

## Deployment checklist

1. Install and validate NARS2000 on a Windows host (or another environment where
   it has been deliberately made operational).
2. Implement the protocol wrapper and test it directly with the JSON example.
3. Configure exactly one of `NARS2000_RUNNER` or `NARS2000_UPSTREAM_URL`.
4. Start `node servers/server-manager.cjs` and confirm port `8086` reports ready.
5. Submit `1+2` to `/eval`, then through `/api/nars2000/eval` on the gateway.
6. Confirm the dashboard records a NARS2000 success and a deliberate interpreter
   error separately.
7. Publish only after the external `/api/nars2000/health` route is healthy.

## Out of scope

- Bundling or redistributing the NARS2000 executable.
- Claiming complete Dyalog/NARS semantic equivalence.
- Treating a Dyalog result as a NARS2000 result.
- Supplying an OS-specific GUI automation wrapper in this cross-platform repo.
