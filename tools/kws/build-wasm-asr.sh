#!/bin/zsh
# Builds the second pass for spoken Workbook answers: sherpa-onnx's offline
# speech-to-text compiled to WebAssembly with Moonshine tiny (English,
# quantized 2026-02-27) packed in. Used only when keyword spotting misses.
# Runs on the Mac build host after tools/kws/build-wasm-kws.sh (shares its
# emsdk and sherpa-onnx checkout).
#
# usage: tools/kws/build-wasm-asr.sh <repo root>
# output: <repo>/app/public/asr/{sherpa-onnx-wasm-main-vad-asr.js,.wasm,.data, sherpa-onnx-asr.js}
#
# Upstream's wasm/vad-asr target is used because it exports the offline
# recognizer; its one change here: start at 128 MB of memory (upstream:
# 512 MB, which phone web views may refuse); it still grows on demand.
set -euo pipefail

REPO=${1:?repo root}
EMSDK_VERSION=4.0.23
MODEL=sherpa-onnx-moonshine-tiny-en-quantized-2026-02-27
WORK=$HOME/development/kws-build
export PATH=/opt/homebrew/bin:$PATH
export EMSDK_PYTHON=/opt/homebrew/bin/python3.12

cd "$WORK"
./emsdk/emsdk activate $EMSDK_VERSION >/dev/null
source ./emsdk/emsdk_env.sh >/dev/null

if [[ ! -d "$WORK/$MODEL" ]]; then
  curl -fsSL -o "$WORK/$MODEL.tar.bz2" \
    "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/$MODEL.tar.bz2"
  tar -xjf "$WORK/$MODEL.tar.bz2" -C "$WORK"
fi
if [[ ! -f "$WORK/silero_vad.onnx" ]]; then
  curl -fsSL -o "$WORK/silero_vad.onnx" \
    "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/silero_vad.onnx"
fi

cd sherpa-onnx
git checkout -- wasm/vad-asr  # undo the previous run's edits
rm -rf wasm/vad-asr/assets && mkdir -p wasm/vad-asr/assets
cp "$WORK/$MODEL/encoder_model.ort" wasm/vad-asr/assets/encoder_model.ort
cp "$WORK/$MODEL/decoder_model_merged.ort" wasm/vad-asr/assets/decoder_model_merged.ort
cp "$WORK/$MODEL/tokens.txt" wasm/vad-asr/assets/tokens.txt
cp "$WORK/silero_vad.onnx" wasm/vad-asr/assets/silero_vad.onnx

sed -i '' 's/INITIAL_MEMORY=512MB/INITIAL_MEMORY=128MB/' wasm/vad-asr/CMakeLists.txt
grep -q INITIAL_MEMORY=128MB wasm/vad-asr/CMakeLists.txt

rm -rf build-wasm-simd-vad-asr
./build-wasm-simd-vad-asr.sh

OUT="$REPO/app/public/asr"
mkdir -p "$OUT"
cp build-wasm-simd-vad-asr/install/bin/wasm/vad-asr/sherpa-onnx-wasm-main-vad-asr.{js,wasm,data} "$OUT/"
cp wasm/vad-asr/sherpa-onnx-asr.js "$OUT/"
ls -lh "$OUT"
