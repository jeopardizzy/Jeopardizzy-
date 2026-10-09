"""Extract trivia Q&A pairs — pass 2, handles next-page answer keys."""
import json
import os
import re
from pypdf import PdfReader

SRC = os.path.join(os.path.dirname(__file__), "..", "source_pdfs")
OUT = os.path.join(os.path.dirname(__file__), "raw")

SKILL_WORDS = (
    "memory", "attention", "executive", "language", "processing",
    "visual", "logic", "reasoning", "knowledge", "concentration",
    "multitasking", "spatial", "math", "vocabulary", "recall",
)
TITLE_RE = re.compile(r"^[A-Z0-9 ,&'\-\?!:\.\*#\(\)/]+$")
NUM_Q_RE = re.compile(r"^\s*(\d{1,2})\s*[\.\)]\s+(.*)")
SOLUTION_RE = re.compile(r"^\s*\*?\s*Solutions?\s*:\s*(.+)", re.IGNORECASE)
ANSWERS_MARK = re.compile(r"(?i)^answers\s*\*?\s*$")


def norm_title(t):
    t = re.sub(r"\s+", " ", t.strip().upper())
    fixes = {
        "FASHI ON FORWARD": "FASHION FORWARD",
        "I N THE KI TCHEN": "IN THE KITCHEN",
    }
    return fixes.get(t, t)


def is_game_start(lines):
    if len(lines) < 2:
        return False
    first = lines[0].strip().strip("*").strip()
    if not (3 < len(first) < 60):
        return False
    if not TITLE_RE.match(first) or first != first.upper():
        return False
    up = first.upper()
    if any(bad in up for bad in ("SOLUTION", "CHAPTER", "CONTENTS", "ANSWERS", "INTRODUCTION")):
        return False
    head = " ".join(lines[1:3]).lower()[:200]
    return any(k in head for k in SKILL_WORDS)


def split_numbered(text_lines):
    items = {}
    cur = None
    for ln in text_lines:
        ln = ln.strip()
        if not ln:
            continue
        m = NUM_Q_RE.match(ln)
        if m:
            cur = int(m.group(1))
            items[cur] = m.group(2).strip()
        elif cur is not None and not ANSWERS_MARK.match(ln):
            items[cur] = (items[cur] + " " + ln).strip()
    return items


def extract_book(pdf_path, book_id):
    r = PdfReader(pdf_path)
    pages = [(r.pages[i].extract_text() or "") for i in range(len(r.pages))]

    games = []
    solutions = {}
    cur = None            # current game dict
    mode = None           # 'q' collecting questions | 'a' collecting answers

    def flush():
        nonlocal cur, mode
        if cur is not None:
            cur.pop("_qbuf", None)
            cur.pop("_abuf", None)
            games.append(cur)
        cur = None
        mode = None

    for pno, text in enumerate(pages):
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        if not lines:
            continue

        # *Solution: TITLE blocks (book 3 style)
        sol_i = None
        for idx, l in enumerate(lines[:3]):
            m = SOLUTION_RE.match(l)
            if m:
                sol_i = idx
                sol_title = norm_title(m.group(1))
                break
        if sol_i is not None:
            flush()
            sols = split_numbered(lines[sol_i + 1:])
            if sols:
                solutions.setdefault(sol_title, {}).update(sols)
            continue

        if is_game_start(lines):
            flush()
            cur = {"title": norm_title(lines[0].strip("*").strip()),
                   "page": pno + 1, "book": book_id,
                   "questions": {}, "inline_answers": {}}
            mode = "q"
            # skip skills line(s) after title
            rest = lines[1:]
            while rest and not NUM_Q_RE.match(rest[0]) and any(k in rest[0].lower() for k in SKILL_WORDS) and len(rest[0]) < 130:
                rest = rest[1:]
            lines = rest
            if not lines:
                continue

        if cur is None:
            continue

        for ln in lines:
            if ANSWERS_MARK.match(ln) or ln.lower().startswith("answers*"):
                mode = "a"
                continue
            m = NUM_Q_RE.match(ln)
            if mode == "q":
                if m:
                    cur["questions"][int(m.group(1))] = m.group(2).strip()
                elif cur["questions"]:
                    k = max(cur["questions"])
                    cur["questions"][k] += " " + ln.strip()
                # intro text before first question: ignore
            elif mode == "a":
                if m:
                    cur["inline_answers"][int(m.group(1))] = m.group(2).strip()
                elif cur["inline_answers"]:
                    k = max(cur["inline_answers"])
                    cur["inline_answers"][k] += " " + ln.strip()

    flush()
    return games, solutions


def main():
    os.makedirs(OUT, exist_ok=True)
    files = [("magic book 1.pdf", "b1"), ("magic book 3.pdf", "b3"), ("magic book 4.pdf", "b4")]
    all_games, all_sols = [], {}
    for fname, bid in files:
        print(f"Extracting {fname} ...", flush=True)
        games, sols = extract_book(os.path.join(SRC, fname), bid)
        with_q = sum(1 for g in games if len(g["questions"]) >= 4)
        with_a = sum(1 for g in games if len(g["inline_answers"]) >= 4)
        print(f"  games: {len(games)} | with >=4 questions: {with_q} | with >=4 inline answers: {with_a} | solution blocks: {len(sols)}")
        all_games.extend(games)
        for k, v in sols.items():
            all_sols.setdefault(k, {}).update(v)

    with open(os.path.join(OUT, "games_raw.json"), "w", encoding="utf-8") as f:
        json.dump(all_games, f, ensure_ascii=False, indent=1)
    with open(os.path.join(OUT, "solutions_raw.json"), "w", encoding="utf-8") as f:
        json.dump(all_sols, f, ensure_ascii=False, indent=1)
    print("done.")


if __name__ == "__main__":
    main()
