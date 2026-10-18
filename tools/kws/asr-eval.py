"""Transcribes the accent test set with candidate on-device speech-to-text models.

Part of choosing a stronger second pass for spoken Workbook answers (see
tools/kws/accent-eval.mjs for the keyword spotter's scores). Runs on the Mac
with sherpa-onnx's Python package and k2-fsa's released models, one thread,
int8 weights: roughly what a phone's web view would run.

usage:
  python asr-eval.py <models dir> <accent dir> <out.json>
"""
import json
import pathlib
import sys
import time
import wave

import numpy as np
import sherpa_onnx

models_dir, accent_dir, out_path = map(pathlib.Path, sys.argv[1:4])


def candidates():
    w = models_dir / "sherpa-onnx-whisper-tiny.en"
    yield "whisper-tiny.en", lambda: sherpa_onnx.OfflineRecognizer.from_whisper(
        encoder=str(w / "tiny.en-encoder.int8.onnx"), decoder=str(w / "tiny.en-decoder.int8.onnx"),
        tokens=str(w / "tiny.en-tokens.txt"), num_threads=1)
    b = models_dir / "sherpa-onnx-whisper-base.en"
    yield "whisper-base.en", lambda: sherpa_onnx.OfflineRecognizer.from_whisper(
        encoder=str(b / "base.en-encoder.int8.onnx"), decoder=str(b / "base.en-decoder.int8.onnx"),
        tokens=str(b / "base.en-tokens.txt"), num_threads=1)
    m2 = models_dir / "sherpa-onnx-moonshine-tiny-en-quantized-2026-02-27"
    yield "moonshine-tiny-2026", lambda: sherpa_onnx.OfflineRecognizer.from_moonshine_v2(
        encoder=str(m2 / "encoder_model.ort"), decoder=str(m2 / "decoder_model_merged.ort"),
        tokens=str(m2 / "tokens.txt"), num_threads=1)
    m1 = models_dir / "sherpa-onnx-moonshine-tiny-en-int8"
    yield "moonshine-tiny-int8", lambda: sherpa_onnx.OfflineRecognizer.from_moonshine(
        preprocessor=str(m1 / "preprocess.onnx"), encoder=str(m1 / "encode.int8.onnx"),
        uncached_decoder=str(m1 / "uncached_decode.int8.onnx"), cached_decoder=str(m1 / "cached_decode.int8.onnx"),
        tokens=str(m1 / "tokens.txt"), num_threads=1)


def read_wav(path):
    with wave.open(str(path)) as f:
        assert f.getsampwidth() == 2 and f.getnchannels() == 1
        rate = f.getframerate()
        pcm = np.frombuffer(f.readframes(f.getnframes()), dtype=np.int16)
    return rate, pcm.astype(np.float32) / 32768.0


index = json.loads((accent_dir / "index.json").read_text())
audio = {s["id"]: read_wav(accent_dir / f"{s['id']}.wav") for s in index}
results = {}
for name, make in candidates():
    t0 = time.time()
    rec = make()
    load = time.time() - t0
    texts, secs, audio_secs = {}, 0.0, 0.0
    for s in index:
        rate, samples = audio[s["id"]]
        st = rec.create_stream()
        st.accept_waveform(rate, samples)
        t = time.time()
        rec.decode_stream(st)
        secs += time.time() - t
        audio_secs += len(samples) / rate
        texts[s["id"]] = st.result.text.strip()
    results[name] = {"load_s": round(load, 2), "decode_s": round(secs, 2), "audio_s": round(audio_secs, 1), "texts": texts}
    print(f"{name}: load {load:.1f}s, {secs:.1f}s to decode {audio_secs:.0f}s of audio (RTF {secs / audio_secs:.3f})", flush=True)

out_path.write_text(json.dumps(results, indent=1))
print(f"-> {out_path}")
