import { useNavigate } from "react-router-dom";

export default function HowTo() {
  const navigate = useNavigate();
  return (
    <main className="stage-bg min-h-dvh px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => navigate("/")}
          className="mb-6 rounded-lg border border-edge bg-board px-3 py-1.5 text-sm font-semibold text-muted transition hover:text-cream"
        >
          ← Back
        </button>

        <h1 className="font-display mb-6 text-3xl text-gold sm:text-4xl">How to play</h1>

        <div className="space-y-6 text-cream/90">
          <section className="rounded-2xl border border-edge bg-board p-5">
            <h2 className="mb-2 font-display text-lg text-sky">The board</h2>
            <p>
              Five categories, five clues each. Higher values are harder. Pick any tile, read the
              clue, and answer.
            </p>
          </section>

          <section className="rounded-2xl border border-edge bg-board p-5">
            <h2 className="mb-2 font-display text-lg text-sky">Answering</h2>
            <p>
              Type your answer and hit <strong>Answer</strong> — close spelling counts. Right: win
              the points. Wrong: lose them. Playing out loud with friends? Hit{" "}
              <strong>Reveal</strong> instead and grade yourselves with{" "}
              <strong>Got it / Missed it</strong>.
            </p>
          </section>

          <section className="rounded-2xl border border-edge bg-board p-5">
            <h2 className="mb-2 font-display text-lg text-sky">Rounds</h2>
            <p>
              Clear the board to unlock <strong>Double Quizzical</strong> — a fresh board worth
              double. After that, one <strong>Final Quizzical</strong> clue: check the category,
              wager up to your whole score, and answer.
            </p>
          </section>

          <section className="rounded-2xl border border-edge bg-board p-5">
            <h2 className="mb-2 font-display text-lg text-sky">Daily Challenge</h2>
            <p>
              One seeded board per UTC day — the same categories and clues for everyone, every
              time you play that day. Your daily score is saved on this device.
            </p>
          </section>

          <section className="rounded-2xl border border-edge bg-board p-5">
            <h2 className="mb-2 font-display text-lg text-sky">Good to know</h2>
            <ul className="list-inside list-disc space-y-1 text-muted">
              <li>Scores, streaks and records are stored locally in your browser only.</li>
              <li>Sound can be muted and animations reduced with the toggles (top right).</li>
              <li>Everything runs offline after the first load — no accounts, no servers.</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
