import { useTeamStore } from "../store/teamStore";
import { sfx } from "../audio/sound";

export default function Toggles() {
  const settings = useTeamStore((s) => s.settings);
  const toggleSound = useTeamStore((s) => s.toggleSound);
  const toggleMotion = useTeamStore((s) => s.toggleMotion);

  return (
    <div className="flex gap-2">
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
