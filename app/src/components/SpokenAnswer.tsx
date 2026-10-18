import { useEffect, useRef, useState } from "react";
import { spokenTargets } from "../lib/spokenTargets";
import { listen, type KeywordTarget, type ListenSession } from "../voice/kws";
import { stopVoice } from "../audio/voice";
import { useWorkbookStore } from "../store/workbookStore";
import KWS_TOKENS from "../data/kwsTokens.json";

const TOKENS = KWS_TOKENS as Record<string, string>;

/** Can this answer be listened for? (every phrase has model tokens) */
export function canSpeak(answer: string): boolean {
  const groups = spokenTargets(answer);
  return groups.length > 0 && groups.length <= 6 && groups.every((g) => g.some((p) => TOKENS[p]));
}

function supported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof WebAssembly === "object";
}

type State = "idle" | "explain" | "listening" | "missed" | "no-mic" | "no-engine";

/** Second and later tries listen more leniently: accents and quiet voices get through. */
export const RETRY_LENIENCY = 0.6;

interface Props {
  answer: string;
  /** other answers to tell apart from the right one (wrong guesses) */
  others: string[];
  /** called with the text to submit: the answer when heard, or the wrong answer heard */
  onHeard: (text: string) => void;
  /** move to the typed answer box */
  onType: () => void;
}

/**
 * "Say it" button for a Workbook question. Listening is on-device keyword
 * spotting for this question's answer (and a few wrong answers); nothing is
 * recorded or sent. Typing always works as well.
 */
export default function SpokenAnswer({ answer, others, onHeard, onType }: Props) {
  const enabled = useWorkbookStore((s) => s.settings.spokenAnswers === true);
  const enable = useWorkbookStore((s) => s.enableSpokenAnswers);
  const [state, setState] = useState<State>("idle");
  const tries = useRef(0);
  const session = useRef<ListenSession | null>(null);

  // new question or leaving the screen: close the microphone
  useEffect(() => {
    setState("idle");
    tries.current = 0;
    return () => session.current?.stop();
  }, [answer]);

  if (!supported() || !canSpeak(answer)) return null;

  const start = () => {
    if (!enabled) return setState("explain");
    stopVoice(); // the quizmaster must not talk into the microphone
    const groups = spokenTargets(answer);
    const targets: KeywordTarget[] = groups.flatMap((g, i) =>
      g.filter((p) => TOKENS[p]).map((p) => ({ label: `g${i}`, tokens: TOKENS[p] })),
    );
    const wrong = others
      .filter((o) => o !== answer && canSpeak(o))
      .slice(0, 4)
      .map((o, i) => ({ text: o, phrase: spokenTargets(o)[0].find((p) => TOKENS[p])! , label: `x${i}` }))
      .filter((w) => !targets.some((t) => t.tokens === TOKENS[w.phrase]));
    for (const w of wrong) targets.push({ label: w.label, tokens: TOKENS[w.phrase] });

    const allHeard = (labels: string[]) => groups.every((_, i) => labels.includes(`g${i}`));
    const leniency = tries.current > 0 ? RETRY_LENIENCY : 1;
    tries.current++;
    const s = listen(targets, (labels) => allHeard(labels) || labels.some((l) => l.startsWith("x")), { leniency });
    session.current = s;
    setState("listening");
    void s.result.then(({ labels, error }) => {
      if (session.current !== s) return;
      session.current = null;
      if (error === "mic") return setState("no-mic");
      if (error === "engine") return setState("no-engine");
      if (allHeard(labels)) return onHeard(answer);
      const w = wrong.find((x) => labels.includes(x.label));
      if (w) return onHeard(w.text);
      setState("missed");
    });
  };

  if (state === "no-mic" || state === "no-engine") {
    return (
      <p role="status" className="text-center text-xs text-mute">
        {state === "no-mic"
          ? "The microphone is off for Quizzical Club. Type your answer above, or allow the microphone in your device settings."
          : "Answering out loud isn’t available on this device. Type your answer above."}
      </p>
    );
  }

  if (state === "explain") {
    return (
      <div role="dialog" aria-label="Answer out loud" className="rounded-2xl border border-line bg-cream p-4 text-sm text-ink">
        <p className="mb-2 font-semibold">🎙️ Answer out loud</p>
        <p className="mb-3 leading-relaxed text-mute">
          The microphone opens only while the button says “Listening”, for a few seconds. Your voice is
          checked on this device and never recorded, saved or sent anywhere. You can always type instead.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              enable();
              setState("idle");
            }}
            className="rounded-xl bg-sage px-4 py-2 font-semibold text-white"
          >
            Turn on
          </button>
          <button type="button" onClick={() => setState("idle")} className="rounded-xl border border-line px-4 py-2 font-semibold text-mute">
            Not now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={state === "listening" ? () => session.current?.stop() : start}
        aria-pressed={state === "listening"}
        className={`rounded-xl border px-5 py-2.5 font-semibold transition ${
          state === "listening" ? "animate-pulse border-coral bg-coral text-white" : "border-line bg-surface text-ink hover:bg-cream"
        }`}
      >
        {state === "listening" ? "🎙️ Listening… (tap to stop)" : state === "missed" ? "🎙️ Say it again" : "🎙️ Say it"}
      </button>
      {state === "missed" && (
        <div role="status" className="flex flex-col items-center gap-1 text-xs text-mute">
          <p>Didn’t catch that. Try once more (I’ll listen more closely), or type it.</p>
          <button type="button" onClick={onType} className="rounded-lg px-3 py-1 font-semibold text-sage underline">
            ⌨️ Type it instead
          </button>
        </div>
      )}
    </div>
  );
}
