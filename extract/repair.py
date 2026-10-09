"""Repair PDF ligature NULs (\x00 = ff / fi / ffi / fl glyph) and doubled-capital
artifacts using web2 wordlist + the books' own vocabulary."""
import json
import os
import re

from english_words import get_english_words_set

HERE = os.path.dirname(__file__)

_WEB2 = get_english_words_set(["web2"], lower=True, alpha=True)
_BOOK = set(json.load(open(os.path.join(HERE, "vocab.json"), encoding="utf-8")))
_FREQ = json.load(open(os.path.join(HERE, "vocab_freq.json"), encoding="utf-8"))


def _freq(word):
    """In-corpus frequency, 0 if unseen — final tiebreak between real words."""
    return _FREQ.get(word.lower(), 0)

LIGATURES = ("ff", "fi", "fl", "ffi", "ffl")  # preference order on ties


def _stem_forms(w):
    out = [w]
    for suf in ("ing", "es", "s", "ed", "d", "ly"):
        if w.endswith(suf) and len(w) > len(suf) + 2:
            base = w[: -len(suf)]
            out.append(base)
            # flapping -> flapp -> flap
            if len(base) >= 2 and base[-1] == base[-2]:
                out.append(base[:-1])
    if w.endswith("ies"):
        out.append(w[:-3] + "y")
    return out


def _score(word):
    """Higher is better; stem matches get a fractional bonus by stem length."""
    wl = word.lower()
    if wl in _WEB2:
        return 4.0
    if wl in _BOOK:
        return 3.0
    best = 0.0
    for s in _stem_forms(wl)[1:]:
        if s in _WEB2:
            best = max(best, 2.0 + len(s) / 100.0)
        elif s in _BOOK:
            best = max(best, 1.0 + len(s) / 100.0)
    return best


def _resolve_token(token):
    """Replace every \x00 in one token, best-scoring ligature first."""
    while "\x00" in token:
        best, best_key = None, (-1.0, -1)
        for lig in LIGATURES:
            cand = token.replace("\x00", lig, 1)
            core = re.sub(r"[^a-zA-Z]", "", cand.replace("\x00", ""))
            # score only when no NUL remains, else partial score by clean prefix
            sc = _score(core) if "\x00" not in cand else 0
            key = (sc, _freq(core))
            if key > best_key:
                best, best_key = cand, key
        token = best if best is not None else token.replace("\x00", "ff", 1)
    return token


def repair_text(s, stats=None):
    if "\x00" in s:
        s = re.sub(r"[A-Za-z]*\x00[A-Za-z]*", lambda m: _resolve_token(m.group(0)), s)
        if stats is not None:
            stats["nul"] += 1
    # doubled capital artifact: "IIdentified" -> "Identified"
    s = re.sub(r"\b([A-Z])\1(?=[a-z]{3,})", lambda m: dedup_cap_full(m), s)
    return s


def dedup_cap_full(m):
    w = m.group(0)
    fixed = w[1:]
    if _score(fixed) >= 2 and _score(w) == 0:
        return fixed
    return w


if __name__ == "__main__":
    tests = [
        "to o\x00er something", "Flu\x00ys", "co\x00ee", "\x00ight of steps",
        "rebu\x00", "\x00nal part", "cu\x00", "handcu\x00", "\x00ngernail",
        "\x00ftieth", "\x00rewood", "jelly\x00sh", "Cli\x00 Huxtable",
        "Tru\x00es", "\x00ags of Israel", "classi\x00eds", "\x00ow from",
        "Grand \x00nale", "\x00ve US state", "Paci\x00c", "o\x00cer",
        "\x00rst", "\x00lm", "\x00ctional", "Sti\x00e!", "\x00apping its wings",
        "Sur\x00ng", "\x00avoring", "De\x00ciency", "Su\x00x", "Gol\x00ng",
        "\x00at rate", "\x00ts this", "\x00xture", "\x00op", "\x00ght",
        "o\x00ense", "Bu\x00et", "\x00ghter", "inde\x00nite", "\x00nd on",
        "II dentified".replace(" ", ""), "Flower/\x00our", "O\x00 spring",
    ]
    for t in tests:
        print(repr(t), "->", repr(repair_text(t)))
