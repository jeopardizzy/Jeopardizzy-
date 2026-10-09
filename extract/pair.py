"""Pair questions with answers using page-aware solution matching (book 3),
inline next-page answers (book 4). Emits cleaned candidate categories."""
import json
import os
import re
from pypdf import PdfReader

HERE = os.path.dirname(__file__)
RAW = os.path.join(HERE, "raw")
SRC = os.path.join(HERE, "..", "source_pdfs")

SOLUTION_RE = re.compile(r"^\s*\*?\s*Solutions?\s*:\s*(.+)", re.IGNORECASE)
NUM_RE = re.compile(r"^\s*(\d{1,2})\s*[\.\)]\s+(.*)")
TITLE_RE = re.compile(r"^[A-Z0-9 ,&'\-\?!:\.\*#\(\)/]+$")
ANSWERS_MARK = re.compile(r"(?i)^answers\s*\*?\s*$")


def clean(s):
    s = re.sub(r"\s+", " ", s).strip()
    s = (s.replace("ﬁ", "fi").replace("ﬂ", "fl").replace("’", "'").replace("‘", "'")
          .replace("“", '"').replace("”", '"').replace("–", "-"))
    s = re.sub(r"\s+([,.;:!?])", r"\1", s)
    return s.strip()


def key(t):
    return re.sub(r"[^A-Z0-9]", "", t.upper())


def split_numbered(lines):
    items, cur = {}, None
    for ln in lines:
        m = NUM_RE.match(ln)
        if m:
            cur = int(m.group(1))
            items[cur] = m.group(2).strip()
        elif cur is not None:
            items[cur] = (items[cur] + " " + ln.strip()).strip()
    return items


def looks_like_qa(q, a):
    if not q or not a:
        return False
    qw, aw = len(q.split()), len(a.split())
    if qw < 3 or qw > 60 or aw < 1 or aw > 8 or len(a) > 60:
        return False
    low = a.lower()
    if any(b in low for b in ("answers", "solution", "page ", "chapter")):
        return False
    if a.count(";") >= 2:
        return False
    return True


def extract_book3_solutions():
    """Return list of solution blocks: {title, page, answers}."""
    r = PdfReader(os.path.join(SRC, "magic book 3.pdf"))
    pages = [(r.pages[i].extract_text() or "") for i in range(len(r.pages))]
    blocks = []
    i = 0
    while i < len(pages):
        lines = [l.strip() for l in pages[i].split("\n") if l.strip()]
        header = None
        for idx, l in enumerate(lines[:3]):
            m = SOLUTION_RE.match(l)
            if m:
                header = (idx, m.group(1).strip())
                break
        if header:
            idx, title = header
            ans_lines = list(lines[idx + 1:])
            # continuation: following pages that start with numbered lines
            j = i + 1
            while j < len(pages):
                nl = [l.strip() for l in pages[j].split("\n") if l.strip()]
                if not nl:
                    j += 1
                    continue
                if NUM_RE.match(nl[0]) and not SOLUTION_RE.match(nl[0]):
                    # stop if a game title appears on this page
                    if any(TITLE_RE.match(x) and x == x.upper() and len(x) > 3 for x in nl[:2]):
                        break
                    ans_lines.extend(nl)
                    j += 1
                else:
                    break
            blocks.append({"title": title, "page": i + 1,
                           "answers": split_numbered(ans_lines)})
            i = j
        else:
            i += 1
    return blocks


def main():
    games = json.load(open(os.path.join(RAW, "games_raw.json"), encoding="utf-8"))
    sol_blocks = extract_book3_solutions()
    print(f"book3 solution blocks: {len(sol_blocks)}")

    def find_solution(title, page):
        k = key(title)
        best = None
        for b in sol_blocks:
            if key(b["title"]) == k and b["page"] >= page - 1:
                if best is None or b["page"] < best["page"]:
                    best = b
        return best["answers"] if best else None

    categories = []
    for g in games:
        qs = {int(k): v for k, v in g["questions"].items()}
        ans = {int(k): v for k, v in g.get("inline_answers", {}).items()}
        if len(ans) < 4 and g["book"] == "b3":
            found = find_solution(g["title"], g["page"])
            if found:
                ans = {int(k): v for k, v in found.items()}
        if len(qs) < 4 or len(ans) < 4:
            continue
        pairs = []
        for n in sorted(qs):
            if n in ans:
                q, a = clean(qs[n]), clean(ans[n])
                if looks_like_qa(q, a):
                    pairs.append({"clue": q, "answer": a})
        if len(pairs) >= 4:
            categories.append({
                "title": g["title"].strip(),
                "book": g["book"], "page": g["page"],
                "pairs": pairs,
            })

    total = sum(len(c["pairs"]) for c in categories)
    print(f"categories: {len(categories)} | total pairs: {total}")
    with open(os.path.join(RAW, "paired.json"), "w", encoding="utf-8") as f:
        json.dump(categories, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
