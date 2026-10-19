import { useEffect, useRef, useState } from "react";
import { listen, type ListenSession } from "../voice/kws";
import { preloadAsr, transcribe } from "../voice/asr";
import { stopVoice } from "../audio/voice";

/** A phrase nobody can say: the listener just records until time's up or "done". */
const NOTHING = [{ label: "__none", tokens: "Z Z Z Z Z Z" }];
const LISTEN_MS = 6000;

type State = "idle" | "preparing" | "listening" | "checking" | "missed" | "no-mic" | "no-engine";

function supported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof WebAssembly === "object";
}

/**
 * "Say it" on a team's phone in several-phones play. The phone doesn't know
 * the answer, so it turns a few seconds of speech into text on the device and
 * hands over only the text (the host checks it). No audio leaves the phone.
 */
export default function PhoneSpeak({ onText, resetKey }: { onText: (text: string) => void; resetKey: string }) {
  const [state, setState] = useState<State>("idle");
  const [heard, setHeard] = useState<string | null>(null);
  const session = useRef<ListenSession | null>(null);

  // a new clue, or leaving: close the microphone
  useEffect(() => {
    setState("idle");
    setHeard(null);
    return () => {
      session.current?.stop();
      session.current = null;
    };
  }, [resetKey]);

  if (!supported()) return null;

  const start = () => {
    stopVoice();
    setHeard(null);
    // straight from the tap: iOS only starts web audio during a user gesture
    const s = listen(NOTHING, () => false, {
      timeoutMs: LISTEN_MS,
      onOpen: () => {
        if (session.current !== s) return;
        setState("listening");
        preloadAsr();
      },
    });
    session.current = s;
    setState("preparing");
    void s.result.then(async ({ error, audio }) => {
      if (session.current !== s) return;
      if (error === "mic") return finish(s, "no-mic");
      if (error === "engine" || error === "audio") return finish(s, "no-engine");
      if (!audio || audio.length === 0) return finish(s, "missed");
      setState("checking");
      try {
        const text = (await transcribe(audio)).trim();
        if (session.current !== s) return;
        if (!text) return finish(s, "missed");
        setHeard(text);
        session.current = null;
        setState("idle");
        onText(text);
      } catch {
        finish(s, "no-engine");
      }
    });
  };

  const finish = (s: ListenSession, next: State) => {
    if (session.current !== s) return;
    session.current = null;
    setState(next);
  };

  const busy = state === "preparing" || state === "listening";
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={busy ? () => session.current?.stop() : start}
        disabled={state === "checking"}
        aria-pressed={state === "listening"}
        className={`w-full rounded-xl border px-5 py-3 font-semibold transition disabled:opacity-60 ${
          state === "listening" ? "animate-pulse border-coral bg-coral text-white" : "border-line bg-surface text-ink"
        }`}
      >
        {state === "listening"
          ? "🎙️ Listening… tap when done"
          : state === "preparing"
            ? "🎙️ Getting ready…"
            : state === "checking"
              ? "🎙️ Checking…"
              : "🎙️ Say it"}
      </button>
      {heard && <p className="text-xs text-mute">Sent: “{heard}”</p>}
      {state === "missed" && <p className="text-xs text-mute">Didn't catch that — try again, or type it.</p>}
      {state === "no-mic" && (
        <p className="text-center text-xs text-mute">The microphone isn't available — type your answer instead.</p>
      )}
      {state === "no-engine" && (
        <p className="text-center text-xs text-mute">Answering out loud couldn't start on this phone — type it instead.</p>
      )}
      <p className="text-center text-[11px] text-mute/80">
        Turned into text on this phone; only the words go to the host, never your voice.
      </p>
    </div>
  );
}
