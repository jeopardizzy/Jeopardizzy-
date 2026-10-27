import { useState } from "react";
import { guideFor } from "../data/taskGuides";

/**
 * "How to play" on a clue card: opens the guide for this clue's task right
 * there (rule, worked example, tips), so nobody has to leave the game.
 */
export default function HowToPlay({ category, clue }: { category: string; clue: string }) {
  const [open, setOpen] = useState(false);
  const g = guideFor(category, clue);
  return (
    <div className="mb-4 text-center">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-sage-deep transition hover:bg-cream"
      >
        {open ? "Hide guide" : "❓ How to play"}
      </button>
      {open && (
        <div role="region" aria-label={`How to play ${g.name}`} className="mt-3 rounded-2xl bg-cream px-4 py-3 text-left text-sm leading-relaxed text-ink">
          <p className="mb-1 font-display text-base text-sage-deep">{g.name}</p>
          <p className="mb-2">{g.how}</p>
          <div
            className="mb-2 rounded-xl bg-butter-soft px-3 py-2"
            // Static bundled guide content (trusted, authored for this app)
            dangerouslySetInnerHTML={{ __html: g.example }}
          />
          <ul className="list-disc space-y-0.5 pl-5 text-ink/85">
            {g.tips.slice(0, 3).map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
