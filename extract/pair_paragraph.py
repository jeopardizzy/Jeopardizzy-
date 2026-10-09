"""Pass 3b: paragraph-mode extraction, fixed intro offset + answer overrun."""
import json
import os
import re
from pypdf import PdfReader

HERE = os.path.dirname(__file__)
RAW = os.path.join(HERE, "raw")
SRC = os.path.join(HERE, "..", "source_pdfs")

ANSWERS_MARK = re.compile(r"(?i)^answers\s*\*?\s*$")
SKILL_WORDS = ("memory", "attention", "executive", "language", "processing",
               "visual", "logic", "reasoning", "knowledge", "multitasking")
SKILLS_LINE = re.compile(r"(?i)^(long-term|short-term|working|executive|visual|spatial|attention|processing|language|logic|memory)")


def clean(s):
    s = re.sub(r"\s+", " ", s).strip()
    s = (s.replace("ﬁ", "fi").replace("ﬂ", "fl").replace("’", "'").replace("‘", "'")
          .replace("“", '"').replace("”", '"').replace("–", "-"))
    s = re.sub(r"\s+([,.;:!?])", r"\1", s)
    return s.strip()


def looks_like_qa(q, a):
    if not q or not a:
        return False
    qw, aw = len(q.split()), len(a.split())
    return 3 <= qw <= 70 and 1 <= aw <= 10 and len(a) <= 70


def main():
    games = json.load(open(os.path.join(RAW, "games_raw.json"), encoding="utf-8"))
    paired = json.load(open(os.path.join(RAW, "paired.json"), encoding="utf-8"))

    known_titles = {g["title"].strip().lower() for g in games}

    # drop previously added bad paragraph-mode entries (identified by book=b3 and
    # page in the set we added) — we recompute them all here
    recompute = {(g["book"], g["page"]) for g in games
                 if g["book"] == "b3" and len(g["questions"]) == 0
                 and len(g.get("inline_answers", {})) >= 4}
    paired = [c for c in paired if (c["book"], c["page"]) not in recompute]

    r = PdfReader(os.path.join(SRC, "magic book 3.pdf"))
    pages_text = [(r.pages[i].extract_text() or "") for i in range(len(r.pages))]

    added = 0
    for g in games:
        if (g["book"], g["page"]) not in recompute:
            continue
        start = g["page"] - 1
        qs, ans = [], []
        mode = "intro"
        buf = ""
        pending = None
        stop = False
        for p in range(start, min(start + 2, len(pages_text))):
            if stop:
                break
            lines = [l.strip() for l in pages_text[p].split("\n") if l.strip()]
            if p == start:
                lines = lines[1:]
                while lines and any(k in lines[0].lower() for k in SKILL_WORDS) and len(lines[0]) < 130:
                    lines = lines[1:]
            for li, ln in enumerate(lines):
                low = ln.lower().strip("* ")
                if ANSWERS_MARK.match(ln) or ln.lower().startswith("answers*"):
                    if buf.strip():
                        qs.append(buf.strip())
                        buf = ""
                    mode = "a"
                    continue
                if mode in ("intro", "q"):
                    mode = "q"
                    buf = (buf + " " + ln).strip()
                    if re.search(r"[?.!]['\"]?\s*$", ln):
                        qs.append(buf.strip())
                        buf = ""
                else:  # answers mode — use delayed buffer so a title line
                    # directly before a skills line never lands in answers
                    if SKILLS_LINE.match(ln):
                        stop = True
                        break
                    if low in known_titles:
                        stop = True
                        break
                    if ln == ln.upper() and len(ln) > 3 and len(ln.split()) <= 5 \
                            and not re.search(r"[0-9]", ln):
                        stop = True
                        break
                    if pending is not None:
                        ans.append(pending)
                    pending = ln
        if buf.strip() and mode == "q":
            qs.append(buf.strip())
        if not stop and pending is not None:
            ans.append(pending)

        # intro offset: one more question paragraph than answers → drop the intro
        if len(qs) == len(ans) + 1:
            qs = qs[1:]
        elif len(qs) > len(ans) + 1:
            continue  # unreliable
        pairs = []
        for q, a in zip(qs, ans):
            q, a = clean(q), clean(a)
            if looks_like_qa(q, a):
                pairs.append({"clue": q, "answer": a})
        if len(pairs) >= 4:
            paired.append({"title": g["title"], "book": "b3",
                           "page": g["page"], "pairs": pairs})
            added += 1

    paired.sort(key=lambda c: (c["book"], c["page"]))
    print(f"recomputed {len(recompute)} candidates, added {added}; total categories {len(paired)}")
    with open(os.path.join(RAW, "paired.json"), "w", encoding="utf-8") as f:
        json.dump(paired, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
