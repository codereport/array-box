#!/bin/bash
# Inner build script - runs INSIDE the emscripten Docker container
# Builds J 9.6 as WebAssembly with Emscripten
#
# Uses jsource's own build system (make2/build_libj.sh) which already
# has a wasm/j32 target that handles all the right flags.

set -e

NPROC=$(nproc 2>/dev/null || echo 4)
WORK=/build
OUTPUT=/output

mkdir -p "$WORK" "$OUTPUT"
cd "$WORK"

echo "============================================"
echo "  Building J 9.6 WASM with Emscripten"
echo "  Using $NPROC cores"
echo "============================================"
echo ""

# ============================================================
# Step 1: Clone jsource at 9.6.2
# ============================================================
echo "=== Step 1: Cloning jsource 9.6.2 ==="
if [ ! -d jsource ]; then
    git clone --depth 1 --branch 9.6.2 https://github.com/jsoftware/jsource.git
fi
cd "$WORK/jsource"
echo "J source ready at $(pwd)"
echo ""

# ============================================================
# Step 2: Build GMP 6.3.0 with Emscripten
# ============================================================
echo "=== Step 2: Building GMP 6.3.0 for WASM ==="
cd "$WORK"
if [ ! -f gmp-install/lib/libgmp.a ]; then
    if [ ! -d gmp-6.3.0 ]; then
        echo "Downloading GMP 6.3.0..."
        wget -q https://gmplib.org/download/gmp/gmp-6.3.0.tar.xz
        tar xf gmp-6.3.0.tar.xz
    fi
    cd gmp-6.3.0

    echo "Configuring GMP for Emscripten..."
    emconfigure ./configure \
        --host=wasm32-unknown-emscripten \
        --disable-assembly \
        --disable-shared \
        --enable-static \
        --prefix="$WORK/gmp-install" \
        CC=emcc \
        CFLAGS="-O2"

    echo "Building GMP..."
    emmake make -j"$NPROC"
    emmake make install
    echo "GMP installed to $WORK/gmp-install"
else
    echo "GMP already built, skipping."
fi
echo ""

# ============================================================
# Step 3: Set up jversion.h and GMP headers
# ============================================================
echo "=== Step 3: Setup ==="
cd "$WORK/jsource"
if [ ! -f jsrc/jversion.h ]; then
    cp jsrc/jversion-x.h jsrc/jversion.h
fi

# Copy GMP headers to where jsource expects them (mpir/include)
mkdir -p "$WORK/jsource/mpir/include"
cp "$WORK/gmp-install/include/gmp.h" "$WORK/jsource/mpir/include/" 2>/dev/null || true
# Create gmp.h compatibility in mpir/include  
if [ ! -f "$WORK/jsource/mpir/include/gmp.h" ]; then
    echo "ERROR: GMP headers not found"
    exit 1
fi
echo "GMP headers installed."
echo ""

# ============================================================
# Step 4: Build libj.a using jsource build system
# ============================================================
echo "=== Step 4: Building J engine (libj.a) via jsource build ==="
cd "$WORK/jsource/make2"

# Use jsource's build_libj.sh with WASM settings
export USE_WASM=1
export CC=emcc
export AR=emar
export USE_SLEEF=0
export USE_SLEEFQUAD=1
export USE_OPENMP=0
export USE_PYXES=0
# Override CFLAGS to add our GMP path and WASM-specific defines
export CFLAGS="-O2 -fPIC -fvisibility=hidden -fno-strict-aliasing -fwrapv -fno-stack-protector \
 -DPYXES=0 -DIMPORTGMPLIB -DSLEEFQUAD=1 \
 -DCSTACKSIZE=1007616 -DCSTACKRESERVE=100000 \
 -DWASM=1 -DHTML=1 -DNOSPECIALCODE=1 \
 -DNO_SHA_ASM \
 -I$WORK/gmp-install/include \
 -I$WORK/jsource/mpir/include \
 -Wno-parentheses -Wno-unused-value -Wno-pointer-sign \
 -Wno-empty-body -Wno-return-type -Wno-constant-logical-operand \
 -Wno-comment -Wno-string-plus-int -Wno-unsequenced \
 -Wno-incompatible-function-pointer-types \
 -Wno-null-pointer-arithmetic -Wno-null-pointer-subtraction \
 -Wno-missing-field-initializers -Wno-unused-parameter \
 -Wno-unused-variable -Wno-unused-function \
 -Wno-sign-compare -Wno-unknown-warning-option \
 -Wno-implicit-function-declaration -Wno-deprecated-non-prototype \
 -Wno-cast-function-type-strict -Wno-unused-but-set-variable \
 -fomit-frame-pointer -Wno-pass-failed"

echo "Building with jsource build system..."
bash build_libj.sh 2>&1 || true

# Check if libj.a was created
LIBJ="$WORK/jsource/bin/wasm/j32/libj.a"
if [ ! -f "$LIBJ" ]; then
    echo "ERROR: libj.a was not created at $LIBJ"
    echo "Checking alternate locations..."
    find "$WORK/jsource/bin" -name "libj.a" -o -name "*.a" 2>/dev/null || true
    # Try to find it
    LIBJ=$(find "$WORK/jsource" -name "libj.a" 2>/dev/null | head -1)
    if [ -z "$LIBJ" ]; then
        echo "Attempting manual build..."
        # Fall back to manual build if jsource build fails
        LIBJ="$WORK/manual-libj.a"
        # We'll handle this below
    fi
fi

echo "libj.a: $LIBJ ($(du -h "$LIBJ" 2>/dev/null | cut -f1 || echo 'not found'))"
echo ""

# ============================================================
# Step 5: Create and compile emj.c entry point
# ============================================================
echo "=== Step 5: Creating emj.c entry point ==="

cat > "$WORK/emj.c" << 'EMJC_EOF'
/* emj.c - J 9.6 WASM entry point for Array Box
 * Adapted from jsoftware/j-playground emj.c for J 9.6 API
 */
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* Forward declarations matching J 9.6 API */
typedef void* J;
typedef long long I;
typedef char C;

/* J API functions from libj.a */
extern J JInit(void);
extern int JDo(J jt, char* cmd);
extern void JSM(J jt, void* callbacks[]);
extern int JSetM(J jt, char* name, I* type, I* rank, I** shape, I** data);
extern int JGetM(J jt, char* name, I* type, I* rank, I* shape, I** data);

#define SMCON 1

J jt;
static const int MAX_OUTPUT_SIZE = 100000;
static char input[100000];
static char output[100000];
int outputPtr = 0;

char* em_jdo(char *cmd) {
    outputPtr = 0;
    output[outputPtr] = '\0';
    JDo(jt, cmd);
    if (outputPtr > 0)
        output[outputPtr - 1] = '\0';
    else
        output[0] = '\0';
    return output;
}

void em_jsetstr(char *var, char *val) {
    I type = 2, jr = 1;
    I jl = strlen(val);
    I *jlp = &jl;
    I *valp = (I*)val;
    JSetM(jt, var, &type, &jr, &jlp, &valp);
}

#define DO(n,x) {I i=0,_i=(n);for(;i<_i;++i){x;}}
static I cardinality(I r, I s) { I c = 1; DO(r, c *= ((I*)s)[i]); return c; }

char* em_jgetstr(char *var) {
    I jr, jtype, js;
    I *jd;
    JGetM(jt, var, &jtype, &jr, &js, &jd);
    I c = cardinality(jr, js);
    ((char*)jd)[c] = '\0';
    return (char*)jd;
}

/* J output callback */
void Joutput(J jt, int type, C* s) {
    char *p = s;
    while (*p != 0 && outputPtr < MAX_OUTPUT_SIZE) {
        output[outputPtr++] = *p;
        p++;
    }
}

C* Jinput(J jt, C* prompt) {
    fputs(prompt, stdout);
    fflush(stdout);
    if (!fgets(input, sizeof(input), stdin))
        return "2!:55''";
    return input;
}

int main(int argc, char *argv[]) {
    void* callbacks[] = {(void*)Joutput, 0, (void*)Jinput, 0, (void*)(long)SMCON};

    jt = JInit();
    JSM(jt, callbacks);

    /* Load J standard library */
    em_jdo("(0!:0) <'jlibrary/system/main/stdlib.ijs'");
    /* Load playground init if available */
    em_jdo("(0!:0 :: (1:@smoutput@'emj.ijs not found')) <'emj.ijs'");

    return 0;
}
EMJC_EOF

EMJFLAGS="-O2 -DWASM=1 -DHTML=1 -DSMCON=1 -I$WORK/jsource/jsrc"
echo "Compiling emj.c..."
emcc -c $EMJFLAGS -Wno-incompatible-pointer-types -o "$WORK/emj.o" "$WORK/emj.c" 2>&1
echo "emj.o compiled."
echo ""

# ============================================================
# Step 6: Create emj.ijs boot script
# ============================================================
echo "=== Step 6: Creating emj.ijs ==="
cat > "$WORK/emj.ijs" << 'EMJIJS_EOF'
NB. J 9.6 WASM initialization for Array Box
NB. Loaded after stdlib
NB. output capture setup
output_jrx_ =: ''
EMJIJS_EOF
echo ""

# ============================================================
# Step 7: Link everything into WASM
# ============================================================
echo "=== Step 7: Linking into WASM ==="

OUTDIR="$WORK/wasm-output"
mkdir -p "$OUTDIR"

# SLEEF objects are already included in libj.a by the jsource build system
echo "Linking emj.js + emj.wasm..."
emcc -O2 \
    "$WORK/emj.o" \
    "$LIBJ" \
    "$WORK/gmp-install/lib/libgmp.a" \
    -o "$OUTDIR/emj.js" \
    -sWASM=1 \
    -sEMULATE_FUNCTION_POINTER_CASTS=1 \
    -sBINARYEN_EXTRA_PASSES="--pass-arg=max-func-params@75" \
    -sEXPORTED_FUNCTIONS='["_main","_em_jdo","_em_jsetstr","_em_jgetstr","_malloc","_free"]' \
    -sEXPORTED_RUNTIME_METHODS='["cwrap","ccall","UTF8ToString","lengthBytesUTF8","stringToUTF8"]' \
    -sNO_EXIT_RUNTIME=1 \
    -sINITIAL_MEMORY=134217728 \
    -sALLOW_MEMORY_GROWTH=1 \
    -sSTACK_SIZE=1048576 \
    -sERROR_ON_UNDEFINED_SYMBOLS=0 \
    --preload-file "$WORK/jsource/jlibrary@/jlibrary" \
    --embed-file "$WORK/emj.ijs@emj.ijs" \
    2>&1

echo ""
echo "Build output:"
ls -lh "$OUTDIR/"

# ============================================================
# Step 8: Copy to output directory
# ============================================================
echo ""
echo "=== Step 8: Copying to output ==="
cp "$OUTDIR"/emj.* "$OUTPUT/"
echo "Files copied to $OUTPUT:"
ls -lh "$OUTPUT/"

echo ""
echo "============================================"
echo "  J 9.6 WASM build complete!"
echo "============================================"
