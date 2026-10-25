import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { builderCategories, customGame } from "../lib/board";
import { displayClue } from "../lib/displayClue";
import { useTeamStore } from "../store/teamStore";
import { useEntitlement } from "../store/entitlementStore";
import type { CustomPick } from "../data/games";

const MAX = 5;
const MIN = 3;

/**
 * Build your own board: pick the categories (or roll them at random), and for
 * any category choose its five questions yourself, or leave them random.
 * Full Club, since it opens up every clue in the app.
 */
export default function BoardBuilder() {
  const navigate = useNavigate();
  const selectCustom = useTeamStore((s) => s.selectCustom);
  const fullClub = useEntitlement((s) => s.fullClub);
  const openSheet = useEntitlement((s) => s.openSheet);
  const all = useMemo(() => builderCategories(), []);
  const [picks, setPicks] = useState<CustomPick[]>([]);
  const [query, setQuery] = useState("");
  const [choosing, setChoosing] = useState<string | null>(null);

  const picked = (name: string) => picks.some((p) => p.name === name);
  const toggle = (name: string) =>
    setPicks((ps) => (ps.some((p) => p.name === name) ? ps.filter((p) => p.name !== name) : ps.length < MAX ? [...ps, { name }] : ps));
  const random = () => {
    const keep = picks.slice(0, MAX);
    const pool = all.filter((c) => !keep.some((p) => p.name === c.name));
    const out = [...keep];
    while (out.length < MAX && pool.length > 0) out.push({ name: pool.splice(Math.floor(Math.random() * pool.length), 1)[0].name });
    setPicks(out);
  };
  const setClues = (name: string, clues: number[] | undefined) =>
    setPicks((ps) => ps.map((p) => (p.name === name ? { name, ...(clues && clues.length ? { clues } : {}) } : p)));

  const start = () => {
    if (!fullClub) return openSheet();
    // fill partly chosen categories up to five clues at random, keep easy → hard order
    const ready = picks.map((p) => {
      if (!p.clues || p.clues.length === 0 || p.clues.length === 5) return p;
      const cat = all.find((c) => c.name === p.name)!;
      const rest = cat.clues.map((_, i) => i).filter((i) => !p.clues!.includes(i));
      const chosen = [...p.clues];
      while (chosen.length < 5 && rest.length) chosen.push(rest.splice(Math.floor(Math.random() * rest.length), 1)[0]);
      return { name: p.name, clues: chosen.sort((a, b) => a - b) };
    });
    selectCustom(customGame(ready));
    navigate("/setup");
  };

  const q = query.trim().toLowerCase();
  const shown = all.filter((c) => !q || c.name.toLowerCase().includes(q));

  return (
    <main className="stage-bg min-h-dvh px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <button onClick={() => navigate("/sets")} className="mb-4 text-sm font-semibold text-mute hover:text-ink">
          ← Back to boards
        </button>
        <h1 className="font-display mb-1 text-3xl text-ink">Build your own board</h1>
        <p className="mb-6 text-mute">
          Pick {MIN}–{MAX} categories, or roll them at random. Each category gets five clues, cheapest first: random ones,
          or the exact questions you choose.
          {!fullClub && " Part of Full Club."}
        </p>

        <section aria-label="Your board" className="mb-6 rounded-3xl border border-line bg-surface p-5 shadow-card">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="font-display mr-auto text-lg text-sage-deep">
              Your board ({picks.length}/{MAX})
            </h2>
            <button onClick={random} className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-cream">
              🎲 {picks.length ? "Fill at random" : "Random categories"}
            </button>
            <button
              onClick={start}
              disabled={picks.length < MIN}
              className="rounded-xl bg-sage px-5 py-2 text-sm font-bold text-white transition enabled:hover:bg-sage-deep disabled:opacity-40"
            >
              {fullClub ? "Use this board →" : "🔒 Full Club"}
            </button>
          </div>
          {picks.length === 0 && <p className="text-sm text-mute">No categories yet — pick some below.</p>}
          <ol className="space-y-2">
            {picks.map((p, i) => {
              const cat = all.find((c) => c.name === p.name)!;
              const open = choosing === p.name;
              return (
                <li key={p.name} className="rounded-2xl border border-line bg-cream px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink">
                      {i + 1}. {p.name}
                    </span>
                    <span className="text-xs text-mute">
                      {p.clues?.length ? `${p.clues.length} chosen${p.clues.length < 5 ? ", rest random" : ""}` : "random clues"}
                    </span>
                    <button
                      onClick={() => setChoosing(open ? null : p.name)}
                      aria-expanded={open}
                      className="ml-auto text-xs font-semibold text-sage-deep underline"
                    >
                      {open ? "Done" : "Choose questions"}
                    </button>
                    <button onClick={() => toggle(p.name)} aria-label={`Remove ${p.name}`} className="px-1 text-mute hover:text-coral">
                      ✕
                    </button>
                  </div>
                  {open && (
                    <ul className="mt-3 max-h-80 space-y-1 overflow-y-auto" aria-label={`Questions in ${p.name}`}>
                      {cat.clues.map((c, n) => {
                        const on = p.clues?.includes(n) ?? false;
                        const full = (p.clues?.length ?? 0) >= 5;
                        return (
                          <li key={n}>
                            <label className={`flex gap-2 rounded-lg px-2 py-1.5 text-sm ${on ? "bg-sage-soft" : ""}`}>
                              <input
                                type="checkbox"
                                checked={on}
                                disabled={!on && full}
                                onChange={() =>
                                  setClues(p.name, on ? p.clues!.filter((x) => x !== n) : [...(p.clues ?? []), n].sort((a, b) => a - b))
                                }
                              />
                              <span className="text-ink">
                                {displayClue(c.clue)} <span className="text-mute">— {c.answer}</span>
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        <label htmlFor="cat-search" className="sr-only">
          Search categories
        </label>
        <input
          id="cat-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${all.length} categories…`}
          className="mb-3 w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-ink"
        />
        <ul className="grid gap-2 sm:grid-cols-2" aria-label="Categories">
          {shown.map((c) => (
            <li key={c.name}>
              <button
                onClick={() => toggle(c.name)}
                aria-pressed={picked(c.name)}
                disabled={!picked(c.name) && picks.length >= MAX}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm transition disabled:opacity-40 ${
                  picked(c.name) ? "border-sage bg-sage-soft font-semibold text-sage-deep" : "border-line bg-surface text-ink hover:bg-cream"
                }`}
              >
                <span>{c.name}</span>
                <span className="text-xs text-mute">{c.clues.length}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
