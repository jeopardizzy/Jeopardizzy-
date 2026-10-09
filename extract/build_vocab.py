"""Build an English vocabulary from the books' own clean text for NUL-ligature repair."""
import json
import os
import re
from collections import Counter
from pypdf import PdfReader

HERE = os.path.dirname(__file__)
SRC = os.path.join(HERE, "..", "source_pdfs")

def main():
    counts = Counter()
    for fname in ("magic book 1.pdf", "magic book 3.pdf", "magic book 4.pdf"):
        r = PdfReader(os.path.join(SRC, fname))
        for i in range(len(r.pages)):
            t = r.pages[i].extract_text() or ""
            t = t.replace("\x00", " ")  # skip broken ligature words
            for w in re.findall(r"[a-zA-Z]{3,}", t):
                counts[w.lower()] += 1
    vocab = {w for w, n in counts.items() if n >= 2}
    print("vocab size:", len(vocab))
    with open(os.path.join(HERE, "vocab.json"), "w", encoding="utf-8") as f:
        json.dump(sorted(vocab), f)
    # keep frequencies too — used as tiebreak when two repairs are both real words
    with open(os.path.join(HERE, "vocab_freq.json"), "w", encoding="utf-8") as f:
        json.dump(dict(counts), f)
    # sanity
    for w in ("offer", "first", "film", "officer", "flapping", "fire", "coffee"):
        print(w, w in vocab)

if __name__ == "__main__":
    main()
