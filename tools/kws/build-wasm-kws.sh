#!/bin/zsh
# Builds the on-device keyword spotter used for spoken Workbook answers:
# sherpa-onnx (k2-fsa) compiled to WebAssembly, with the 3.3M-parameter
# GigaSpeech English keyword model packed in. Runs on the Mac build host.
#
# usage: tools/kws/build-wasm-kws.sh <repo root>
# output: <repo>/app/public/kws/{sherpa-onnx-wasm-kws-main.js,.wasm,.data}
#
# Two changes to upstream's wasm/kws build, applied with sed so a version bump
# stays a one-line edit:
#   - export SherpaOnnxCreateKeywordStreamWithKeywords, so every question can
#     listen for its own answer without reloading the model;
#   - start at 64 MB of memory (upstream: 512 MB), which iPhone web views
#     may refuse; it still grows on demand.
set -euo pipefail

REPO=${1:?repo root}
SHERPA_TAG=v1.13.8
EMSDK_VERSION=4.0.23
MODEL=sherpa-onnx-kws-zipformer-gigaspeech-3.3M-2024-01-01
WORK=$HOME/development/kws-build
export PATH=/opt/homebrew/bin:$PATH
# emsdk needs Python 3.10+; macOS ships 3.9 (brew install python@3.12)
export EMSDK_PYTHON=/opt/homebrew/bin/python3.12

mkdir -p "$WORK"
cd "$WORK"

if [[ ! -d emsdk ]]; then
  git clone --depth 1 https://github.com/emscripten-core/emsdk.git
fi
./emsdk/emsdk install $EMSDK_VERSION
./emsdk/emsdk activate $EMSDK_VERSION
source ./emsdk/emsdk_env.sh >/dev/null

if [[ ! -d sherpa-onnx ]]; then
  git clone --depth 1 --branch $SHERPA_TAG https://github.com/k2-fsa/sherpa-onnx.git
fi
cd sherpa-onnx
git checkout -- wasm/kws  # undo the previous run's edits

if [[ ! -d "$WORK/$MODEL" ]]; then
  curl -fsSL -o "$WORK/$MODEL.tar.bz2" \
    "https://github.com/k2-fsa/sherpa-onnx/releases/download/kws-models/$MODEL.tar.bz2"
  tar -xjf "$WORK/$MODEL.tar.bz2" -C "$WORK"
fi

# model files go into the packed virtual filesystem under upstream's names
# (its CMake checks for them); the int8 encoder/joiner keep the download small
M=epoch-12-avg-2-chunk-16-left-64
rm -rf wasm/kws/assets && mkdir -p wasm/kws/assets
cp "$WORK/$MODEL/encoder-$M.int8.onnx" wasm/kws/assets/encoder-$M.onnx
cp "$WORK/$MODEL/decoder-$M.onnx" wasm/kws/assets/decoder-$M.onnx
cp "$WORK/$MODEL/joiner-$M.int8.onnx" wasm/kws/assets/joiner-$M.onnx
cp "$WORK/$MODEL/tokens.txt" wasm/kws/assets/tokens.txt
# the spotter refuses to start without at least one keyword; questions bring their own
printf '▁THE @the\n' > wasm/kws/assets/keywords.txt

sed -i '' 's/  SherpaOnnxCreateKeywordStream$/  SherpaOnnxCreateKeywordStream\
  SherpaOnnxCreateKeywordStreamWithKeywords/' wasm/kws/CMakeLists.txt
sed -i '' 's/INITIAL_MEMORY=512MB/INITIAL_MEMORY=64MB/' wasm/kws/CMakeLists.txt
grep -q SherpaOnnxCreateKeywordStreamWithKeywords wasm/kws/CMakeLists.txt
grep -q INITIAL_MEMORY=64MB wasm/kws/CMakeLists.txt

./build-wasm-simd-kws.sh

OUT="$REPO/app/public/kws"
mkdir -p "$OUT"
cp build-wasm-simd-kws/install/bin/wasm/sherpa-onnx-wasm-kws-main.{js,wasm,data} "$OUT/"
# upstream's JS wrapper (createKws builds the spotter config); src/voice/kws.ts loads it
cp wasm/kws/sherpa-onnx-kws.js "$OUT/"
# bpe.model lets tools/kws/keywords.py turn answers into model tokens at build time
cp "$WORK/$MODEL/bpe.model" "$REPO/tools/kws/bpe.model"
ls -lh "$OUT"
