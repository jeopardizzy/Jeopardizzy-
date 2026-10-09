"""Build the final curated, anonymized quiz dataset.

- Keeps only manually verified categories (KEEP list by book+page).
- Drops pairs with merged-question artifacts or over-long list answers.
- Assigns difficulty tier by source page (books get harder chapter by chapter).
- Emits src data as JSON — no book titles, authors, or page numbers anywhere.
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from repair import repair_text

HERE = os.path.dirname(__file__)
RAW = os.path.join(HERE, "raw")

# verified aligned: (book, page) -> friendly category name
KEEP = {
    ("b3", 85): "Wood Shop",
    ("b3", 105): "First Names",
    ("b3", 108): "Colorful Titles",
    ("b3", 135): "Homonyms",
    ("b3", 148): "Just Johns",
    ("b3", 194): "The Year 1939",
    ("b3", 205): "Hidden Body Parts",
    ("b3", 209): "Backwords",
    ("b3", 224): "Body-Part Titles",
    ("b3", 240): "England",
    ("b3", 244): "Homonyms II",
    ("b3", 255): "Food History",
    ("b3", 263): "Backwords II",
    ("b3", 265): "Word Parts",
    ("b3", 267): "Golden Age of Radio",
    ("b3", 322): "Place-Name Titles",
    ("b3", 353): "Geographical Doubles",
    ("b3", 355): "Born in Ohio",
    ("b3", 376): "Homonyms III",
    ("b3", 398): "First Ladies",
    ("b3", 423): "Compound Words",
    ("b3", 428): "Name the Condiment",
    ("b3", 442): "History of Medicine",
    ("b3", 463): "Compound Words II",
    ("b3", 470): "Body-Part Titles II",
    ("b3", 505): "Extreme Geography",
    ("b3", 514): "Guess the Category",
    ("b3", 527): "Russia",
    ("b3", 551): "Word Parts II",
    ("b3", 559): "Famous Fathers",
    ("b3", 570): "Nicknames",
    ("b3", 573): "Food",
    ("b3", 643): "Alphabet Geography",
    ("b3", 669): "Colorful Titles II",
    ("b3", 672): "Saints",
    ("b3", 705): "Color Associations",
    ("b3", 709): "Homonyms IV",
    ("b3", 711): "Marine Life",
    ("b3", 723): "Film Biographies",
    ("b3", 726): "Classic Reading List",
    ("b3", 830): "European Countries",
    ("b3", 844): "Working Women",
    ("b3", 851): "Nickname Places",
    ("b3", 893): "Geographical Foods",
    ("b3", 906): "Homonyms V",
    ("b3", 954): "Rivers",
    ("b4", 51): "Letter A Trivia",
    ("b4", 62): "TP Initials",
    ("b4", 66): "Word Sums",
    ("b4", 139): "Compound Words III",
    ("b4", 142): "Letter C Trivia",
    ("b4", 145): "Two...",
    ("b4", 159): "Heteronyms",
    ("b4", 198): "Letter D Trivia",
    ("b4", 352): "R Initials",
    ("b4", 407): "Letter I Trivia",
    ("b4", 439): "Compound Words IV",
    ("b4", 562): "A Initials",
    ("b4", 593): "Heteronyms II",
    ("b4", 659): "Letter N Trivia",
    ("b4", 689): "Compound Words V",
    ("b4", 753): "C & D Initials",
    ("b4", 881): "I Initials",
    ("b4", 896): "Letter S Trivia",
    ("b4", 987): "Letter U Trivia",
    ("b4", 997): "TV Characters",
    ("b4", 1003): "P & A Initials",
    ("b4", 1023): "Letter V Trivia",
    ("b4", 1065): "Heteronyms III",
    ("b4", 1068): "Letter W Trivia",
    ("b4", 1119): "Military Ranks",
    ("b4", 1122): "Letter X Trivia",
    ("b4", 1130): "Compound Words VI",
}

MERGED_CLUE = re.compile(r"\S\s+\d{1,2}\.\s+\S")  # "text 3. more text" artifact
JUNK_TAIL = re.compile(r"\s*(Hints|Answers)\s*\*?\s*$", re.IGNORECASE)

# Hand-tuned difficulty by content review (1 = round 1, 2 = double round, 3 = spicy)
TIER = {
    ("b3", 85): 1, ("b3", 105): 2, ("b3", 108): 1, ("b3", 135): 1, ("b3", 148): 1,
    ("b3", 194): 2, ("b3", 205): 1, ("b3", 209): 2, ("b3", 224): 1, ("b3", 240): 1,
    ("b3", 244): 1, ("b3", 255): 1, ("b3", 263): 2, ("b3", 265): 2, ("b3", 267): 3,
    ("b3", 322): 2, ("b3", 353): 1, ("b3", 355): 3, ("b3", 376): 2, ("b3", 398): 2,
    ("b3", 423): 1, ("b3", 428): 1, ("b3", 442): 3, ("b3", 463): 1, ("b3", 470): 2,
    ("b3", 505): 1, ("b3", 514): 2, ("b3", 527): 1, ("b3", 551): 2, ("b3", 559): 2,
    ("b3", 570): 1, ("b3", 573): 1, ("b3", 643): 2, ("b3", 669): 1, ("b3", 672): 2,
    ("b3", 705): 2, ("b3", 709): 2, ("b3", 711): 2, ("b3", 723): 3, ("b3", 726): 2,
    ("b3", 830): 2, ("b3", 844): 3, ("b3", 851): 2, ("b3", 893): 1, ("b3", 906): 2,
    ("b3", 954): 1,
    ("b4", 51): 1, ("b4", 62): 2, ("b4", 66): 2, ("b4", 139): 1, ("b4", 142): 1,
    ("b4", 145): 2, ("b4", 159): 2, ("b4", 198): 1, ("b4", 352): 2, ("b4", 407): 1,
    ("b4", 439): 2, ("b4", 562): 2, ("b4", 593): 2, ("b4", 659): 2, ("b4", 689): 1,
    ("b4", 753): 2, ("b4", 881): 2, ("b4", 896): 1, ("b4", 987): 3, ("b4", 997): 1,
    ("b4", 1003): 2, ("b4", 1023): 2, ("b4", 1065): 3, ("b4", 1068): 2,
    ("b4", 1119): 2, ("b4", 1122): 2, ("b4", 1130): 1,
}

# Merge short 4-clue categories into full-strength themed ones:
# ((book, page), ...) keys -> merged name + tier
MERGES = [
    ((("b3", 573), ("b3", 428), ("b3", 893), ("b3", 255)), "Food & Drink", 1),
    ((("b3", 240), ("b3", 527), ("b3", 505)), "World Spots", 1),
    ((("b3", 398), ("b3", 844)), "Remarkable Women", 2),
    ((("b3", 148), ("b3", 105)), "Names, Names", 2),
]
MERGED_FROM = {k for keys, _name, _tier in MERGES for k in keys}


def clean_final(s):
    s = re.sub(r"\s+", " ", s).strip()
    s = repair_text(s)  # fix PDF ligature NULs before any char stripping
    s = (s.replace("ﬁ", "fi").replace("ﬂ", "fl").replace("ﬀ", "ff")
          .replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
          .replace("–", "-").replace("…", "..."))
    s = re.sub(r"\s+([,.;:!?])", r"\1", s)
    s = JUNK_TAIL.sub("", s)  # trailing "Hints*" / "Answers*" artifacts
    # drop lingering non-latin junk chars
    s = re.sub(r"[^\x20-\x7E\u00C0-\u017F\u2013\u2014]", "", s)
    return s.strip()


def pair_ok(p):
    q, a = p["clue"], p["answer"]
    if MERGED_CLUE.search(q):
        return False
    if q.count("___") > 6:
        return False
    if len(a) > 60:
        return False
    low_q = q.lower()
    if any(h in low_q for h in ("test your", "here's just", "here are", "how well do you")):
        return False
    return True


def main():
    cats = json.load(open(os.path.join(RAW, "screened.json"), encoding="utf-8"))
    out = []
    merged_clues = {}  # merge-name -> {tier, clues}
    for c in cats:
        k = (c["book"], c["page"])
        if k not in KEEP:
            continue
        pairs = []
        for p in c["pairs"]:
            q = clean_final(p["clue"])
            a = clean_final(p["answer"])
            pp = {"clue": q, "answer": a}
            if pair_ok(pp):
                pairs.append(pp)
        # dedupe identical clues
        seen, dedup = set(), []
        for p in pairs:
            if p["clue"] not in seen:
                seen.add(p["clue"])
                dedup.append(p)
        if k in MERGED_FROM:
            for keys, name, tier in MERGES:
                if k in keys:
                    merged_clues.setdefault(name, {"tier": tier, "clues": []})
                    merged_clues[name]["clues"].extend(dedup)
            continue
        if len(dedup) >= 4:
            out.append({
                "name": KEEP[k],
                "difficulty": TIER.get(k, 2),
                "clues": dedup,
            })

    for name, m in merged_clues.items():
        if len(m["clues"]) >= 4:
            out.append({"name": name, "difficulty": m["tier"], "clues": m["clues"]})

    out.sort(key=lambda c: (c["difficulty"], c["name"]))
    for i, c in enumerate(out):
        c["id"] = f"cat-{i+1:03d}"
        # reorder keys: id first
        out[i] = {"id": c["id"], "name": c["name"], "difficulty": c["difficulty"], "clues": c["clues"]}

    total = sum(len(c["clues"]) for c in out)
    from collections import Counter
    print(f"final categories: {len(out)} | total clues: {total}")
    print("tiers:", Counter(c["difficulty"] for c in out))
    boardable = Counter(c["difficulty"] for c in out if len(c["clues"]) >= 5)
    print("board-eligible (>=5 clues) by tier:", boardable)
    with open(os.path.join(HERE, "quiz_data.json"), "w", encoding="utf-8") as f:
        json.dump({"categories": out}, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
