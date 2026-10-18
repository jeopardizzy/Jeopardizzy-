"""Turns Workbook answer phrases into keyword-model tokens.

The on-device spotter (sherpa-onnx, GigaSpeech 3.3M zipformer) matches BPE
pieces, not text, so every phrase is encoded once at build time with the
model's own bpe.model, the same way sherpa-onnx's text2token does.

usage (on the Mac, from the repo root):
  python3.12 -m venv ~/development/kws-build/venv
  ~/development/kws-build/venv/bin/pip install sentencepiece
  ~/development/kws-build/venv/bin/python tools/kws/keywords.py tmp/kws-phrases.json app/src/data/kwsTokens.json
"""
import json
import pathlib
import sys

import sentencepiece as spm

src, dst = sys.argv[1], sys.argv[2]
sp = spm.SentencePieceProcessor(model_file=str(pathlib.Path(__file__).with_name("bpe.model")))
phrases = json.loads(pathlib.Path(src).read_text(encoding="utf-8"))
tokens = {p: " ".join(sp.encode(p.upper(), out_type=str)) for p in phrases}
pathlib.Path(dst).write_text(json.dumps(tokens, ensure_ascii=False, indent=0, sort_keys=True) + "\n", encoding="utf-8")
print(f"{len(tokens)} phrases -> {dst}")
