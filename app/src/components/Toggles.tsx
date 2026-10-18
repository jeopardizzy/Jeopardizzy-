import { useTeamStore } from "../store/teamStore";
import { sfx } from "../audio/sound";
import { isVoiceAvailable } from "../audio/voice";

export default function Toggles() {
  const settings = useTeamStore((s) => s.settings);
  const toggleSound = useTeamStore((s) => s.toggleSound);
  const toggleMotion = useTeamStore((s) => s.toggleMotion);
  const toggleVoice = useTeamStore((s) => s.toggleVoice);
  const voiceOn = settings.voice !== false;

  return (
    <div className="flex gap-2">
      {isVoiceAvailable() && (
        <button
          onClick={toggleVoice}
          aria-pressed={voiceOn}
          aria-label={voiceOn ? "Turn off the quizmaster voice" : "Turn on the quizmaster voice"}
          title={voiceOn ? "Quizmaster voice on" : "Quizmaster voice off"}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-card transition hover:bg-butter-soft"
        >
          {voiceOn ? "🗣️" : "🤐"}
        </button>
      )}
      <button
        onClick={toggleSound}
        aria-pressed={settings.sound}
        aria-label={settings.sound ? "Mute sound" : "Unmute sound"}
        title={settings.sound ? "Sound on" : "Sound off"}
        className="rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-card transition hover:bg-butter-soft"
      >
        {settings.sound ? "🔊" : "🔇"}
      </button>
      <button
        onClick={() => {
          toggleMotion();
          sfx.tick();
        }}
        aria-pressed={settings.reduceMotion}
        aria-label={settings.reduceMotion ? "Enable animations" : "Reduce animations"}
        title={settings.reduceMotion ? "Reduced motion on" : "Reduced motion off"}
        className="rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-card transition hover:bg-butter-soft"
      >
        {settings.reduceMotion ? "🐢" : "✨"}
      </button>
    </div>
  );
}
