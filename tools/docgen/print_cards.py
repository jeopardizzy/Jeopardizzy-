"""Printable cards: one PDF per playable game part — cover, board grids,
host clue pages. Data comes from boards.json (dump-boards.mjs)."""
import json
import os
import re

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle, PageBreak)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..", "..")
OUT = os.path.join(ROOT, "docs", "print")

SAGE = HexColor("#4F7A5D")
SAGE_SOFT = HexColor("#E3EFE4")
BUTTER = HexColor("#C99700")
BUTTER_SOFT = HexColor("#FBF4D3")
INK = HexColor("#2E3A33")
MUTE = HexColor("#7A857D")
LINE = HexColor("#E6E3D6")
CREAM = HexColor("#F6F4EC")

ST_TITLE = ParagraphStyle("title", fontName="Helvetica-Bold", fontSize=30, leading=36, textColor=INK, alignment=TA_CENTER)
ST_SUB = ParagraphStyle("sub", fontName="Helvetica", fontSize=13, leading=17, textColor=MUTE, alignment=TA_CENTER)
ST_H = ParagraphStyle("h", fontName="Helvetica-Bold", fontSize=16, leading=20, textColor=INK, alignment=TA_LEFT)
ST_CAT = ParagraphStyle("cat", fontName="Helvetica-Bold", fontSize=11, leading=14, textColor=HexColor("#FFFFFF"))
ST_CELL = ParagraphStyle("cell", fontName="Helvetica-Bold", fontSize=14, leading=17, textColor=BUTTER, alignment=TA_CENTER)
ST_CLUE = ParagraphStyle("clue", fontName="Helvetica", fontSize=10.5, textColor=INK, leading=14)
ST_ANS = ParagraphStyle("ans", fontName="Helvetica-Oblique", fontSize=10, textColor=SAGE, leading=13, leftIndent=8 * mm)
ST_NOTE = ParagraphStyle("note", fontName="Helvetica-Oblique", fontSize=8.5, textColor=MUTE, leading=11, leftIndent=8 * mm)


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def safe_name(game_id, name):
    slug = re.sub(r"[^a-z0-9]+", "-", game_id.lower()).strip("-")
    return slug or "game"


def cover(game):
    n_rounds = len(game["rounds"])
    n_clues = sum(len(r["tiles"]) for r in game["rounds"])
    return [
        Spacer(1, 70 * mm),
        Paragraph("QUIZZICAL CLUB", ParagraphStyle("brand", parent=ST_TITLE, textColor=SAGE, fontSize=16)),
        Spacer(1, 6 * mm),
        Paragraph(esc(game["name"]), ST_TITLE),
        Spacer(1, 4 * mm),
        Paragraph("Printable host pack — play offline, no device needed", ST_SUB),
        Spacer(1, 14 * mm),
        Paragraph(f"{game['series']} · {game['level']} · {n_rounds} board(s) · {n_clues} clues", ST_SUB),
        Spacer(1, 20 * mm),
        Paragraph("How to play", ParagraphStyle("h2c", parent=ST_H, alignment=TA_CENTER)),
        Spacer(1, 4 * mm),
        Paragraph(
            "1. Cut out or just read: the host holds the clue pages.<br/>"
            "2. Teams pick a category and a value; the host reads the clue aloud.<br/>"
            "3. Reveal the answer from the same line; award the points and strike the cell on the board page.<br/>"
            "4. Nobody got it? Strike the cell, no points — it lands in your drill list.<br/>"
            "5. Higher values are harder. The answer key is always right under the clue.",
            ParagraphStyle("howto", parent=ST_CLUE, fontSize=12, leading=18, alignment=TA_LEFT, leftIndent=45 * mm),
        ),
        PageBreak(),
    ]


def board_page(game, rnd):
    cols = len(rnd["categories"])
    data = []
    data.append([Paragraph(esc(c), ST_CAT) for c in rnd["categories"]])
    values = sorted({t["value"] for t in rnd["tiles"]})
    for v in values:
        row = []
        for c in rnd["categories"]:
            tile = next((t for t in rnd["tiles"] if t["category"] == c and t["value"] == v), None)
            row.append(Paragraph(str(v), ST_CELL) if tile else Paragraph("", ST_CELL))
        data.append(row)
    width = (180 * mm) / cols
    t = Table(data, colWidths=[width] * cols, rowHeights=[16 * mm] + [22 * mm] * len(values))
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), SAGE),
        ("BACKGROUND", (0, 1), (-1, -1), CREAM),
        ("GRID", (0, 0), (-1, -1), 0.75, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ]))
    return [
        Paragraph(f"{esc(game['name'])} — Board {rnd['round']}", ST_H),
        Spacer(1, 3 * mm),
        Paragraph("Strike a cell when its clue is played.", ParagraphStyle("hint", parent=ST_CLUE, textColor=MUTE)),
        Spacer(1, 5 * mm),
        t,
        Spacer(1, 8 * mm),
        Paragraph(f"Round multiplier: values as printed (this is round {rnd['round']} of the part).",
                  ParagraphStyle("mult", parent=ST_NOTE)),
        PageBreak(),
    ]


def clue_pages(game, rnd):
    flow = [Paragraph(f"{esc(game['name'])} — Board {rnd['round']} · Host clues", ST_H), Spacer(1, 4 * mm)]
    for cat in rnd["categories"]:
        band = Table([[Paragraph(esc(cat), ST_CAT)]], colWidths=[180 * mm])
        band.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), SAGE),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        flow += [band, Spacer(1, 2 * mm)]
        tiles = sorted([t for t in rnd["tiles"] if t["category"] == cat], key=lambda t: t["value"])
        for t in tiles:
            head = f'<font color="#C99700"><b>{t["value"]}</b></font>&nbsp;&nbsp;{esc(t["clue"])}'
            flow.append(Paragraph(head, ST_CLUE))
            ans = f'→ <b>{esc(t["answer"])}</b>'
            flow.append(Paragraph(ans, ST_ANS))
            if t.get("note"):
                flow.append(Paragraph(esc(t["note"]), ST_NOTE))
            flow.append(Spacer(1, 3.2 * mm))
        flow.append(Spacer(1, 3 * mm))
    flow.append(PageBreak())
    return flow


def footer(game_name):
    def draw(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(MUTE)
        canvas.drawString(20 * mm, 10 * mm, game_name)
        canvas.drawRightString(190 * mm, 10 * mm, f"p. {doc.page}")
        canvas.restoreState()
    return draw


def main():
    games = json.load(open(os.path.join(HERE, "boards.json"), encoding="utf-8"))
    os.makedirs(OUT, exist_ok=True)
    for game in games:
        path = os.path.join(OUT, safe_name(game["id"], game["name"]) + ".pdf")
        doc = SimpleDocTemplate(
            path, pagesize=A4,
            leftMargin=15 * mm, rightMargin=15 * mm, topMargin=18 * mm, bottomMargin=16 * mm,
            title=f"Quizzical Club — {game['name']} (printable)",
        )
        flow = cover(game)
        for rnd in game["rounds"]:
            flow += board_page(game, rnd)
            flow += clue_pages(game, rnd)
        doc.build(flow, onFirstPage=footer(game["name"]), onLaterPages=footer(game["name"]))
        print("wrote", os.path.basename(path))


if __name__ == "__main__":
    main()
