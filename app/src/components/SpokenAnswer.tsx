import { useEffect, useRef, useState } from "react";
import { accentVariants, spokenTargets } from "../lib/spokenTargets";
import { listen, type KeywordTarget, type ListenSession } from "../voice/kws";
import { preloadAsr, transcribe } from "../voice/asr";
import { heardIn } from "../lib/spokenMatch";
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

type State = "idle" | "explain" | "preparing" | "listening" | "checking" | "missed" | "no-mic" | "no-engine" | "no-audio";

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
  /** what speech-to-text heard on the last miss, shown so the player knows why */
  const [heardText, setHeardText] = useState<string | null>(null);
  /** technical detail of the last failure, shown small so device problems can be diagnosed */
  const [problem, setProblem] = useState<string | null>(null);
  const tries = useRef(0);
  const session = useRef<ListenSession | null>(null);

  // new question or leaving the screen: close the microphone
  useEffect(() => {
    setState("idle");
    setHeardText(null);
    tries.current = 0;
    return () => {
      session.current?.stop();
      session.current = null;
    };
  }, [answer]);

  if (!supported() || !canSpeak(answer)) return null;

  const start = () => {
    if (!enabled) return setState("explain");
    stopVoice(); // the quizmaster must not talk into the microphone
    const groups = spokenTargets(answer);
    // every spelling of the answer, plus accent respellings ("SLOTH" → "SLOT", "ESLOTH"…)
    const targets: KeywordTarget[] = groups.flatMap((g, i) =>
      [...g, ...g.flatMap(accentVariants)].filter((p) => TOKENS[p]).map((p) => ({ label: `g${i}`, tokens: TOKENS[p] })),
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
    // called straight from the tap: iOS only starts web audio during a user gesture
    const s = listen(targets, (labels) => allHeard(labels) || labels.some((l) => l.startsWith("x")), {
      leniency,
      onOpen: () => {
        if (session.current !== s) return;
        setState("listening");
        // warm the second pass while the player speaks — only now, so the two
        // engines never load at the same moment (phones have little memory to spare)
        preloadAsr();
      },
    });
    session.current = s;
    setState("preparing");
    setHeardText(null);
    void s.result.then(async ({ labels, error, detail, audio }) => {
      if (session.current !== s) return;
      setProblem(detail ?? null);
      if (error === "mic") return done(s, () => setState("no-mic"));
      if (error === "engine") return done(s, () => setState("no-engine"));
      if (error === "audio") return done(s, () => setState("no-audio"));
      if (allHeard(labels)) return done(s, () => onHeard(answer));
      const w = wrong.find((x) => labels.includes(x.label));
      if (w) return done(s, () => onHeard(w.text));
      // second pass: transcribe what was said and match it like an answer
      if (audio && audio.length > 0) {
        setState("checking");
        try {
          const text = await transcribe(audio);
          if (session.current !== s) return;
          if (heardIn(text, answer)) return done(s, () => onHeard(answer));
          const other = others.find((o) => o !== answer && heardIn(text, o));
          if (other) return done(s, () => onHeard(other));
          setHeardText(text.trim() || null);
        } catch {
          /* engine unavailable or slow: fall back to "didn't catch that" */
        }
      }
      done(s, () => setState("missed"));
    });
  };

  const done = (s: ListenSession, then: () => void) => {
    if (session.current !== s) return;
    session.current = null;
    then();
  };

  if (state === "no-mic" || state === "no-engine") {
    return (
      <div role="status" className="flex flex-col items-center gap-1 text-center text-xs text-mute">
        <p>
          {state === "no-mic"
            ? "The microphone isn’t available to Quizzical Club. Type your answer above, or allow the microphone in Settings › Quizzical Club."
            : "Answering out loud couldn’t start on this device. Type your answer above."}
        </p>
        {problem && <p className="font-mono text-[10px] opacity-70">({problem})</p>}
        <button type="button" onClick={start} className="rounded-lg px-3 py-1 font-semibold text-sage underline">
          Try again
        </button>
      </div>
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
        <p className="mb-3 leading-relaxed text-mute">
          Answer in a short sentence, like “I think it’s Mount Everest”: it’s heard more reliably than a single
          word, whatever your accent.
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
        onClick={state === "listening" || state === "preparing" ? () => session.current?.stop() : start}
        disabled={state === "checking"}
        aria-pressed={state === "listening"}
        className={`rounded-xl border px-5 py-2.5 font-semibold transition disabled:opacity-60 ${
          state === "listening"
            ? "animate-pulse border-coral bg-coral text-white"
            : state === "preparing"
              ? "border-coral/40 bg-coral/10 text-ink"
              : "border-line bg-surface text-ink hover:bg-cream"
        }`}
      >
        {state === "listening"
          ? "🎙️ Listening… (tap to stop)"
          : state === "preparing"
            ? "🎙️ Getting ready… (tap to cancel)"
            : state === "checking"
            ? "🎙️ Checking…"
            : state === "missed" || state === "no-audio"
              ? "🎙️ Say it again"
              : "🎙️ Say it"}
      </button>
      {state === "no-audio" && (
        <div role="status" className="flex flex-col items-center gap-1 text-center text-xs text-mute">
          <p>The microphone opened, but no sound reached the app. Try once more, or type your answer.</p>
          {problem && <p className="font-mono text-[10px] opacity-70">({problem})</p>}
          <button type="button" onClick={onType} className="rounded-lg px-3 py-1 font-semibold text-sage underline">
            ⌨️ Type it instead
          </button>
        </div>
      )}
      {state === "missed" && (
        <div role="status" className="flex flex-col items-center gap-1 text-xs text-mute">
          <p>
            {heardText ? `I heard “${heardText}”. ` : "Didn’t catch that. "}
            Try once more (I’ll listen more closely), or type it.
          </p>
          <p>Tip: a short sentence works best, like “I think it’s …”.</p>
          <button type="button" onClick={onType} className="rounded-lg px-3 py-1 font-semibold text-sage underline">
            ⌨️ Type it instead
          </button>
        </div>
      )}
    </div>
  );
}
