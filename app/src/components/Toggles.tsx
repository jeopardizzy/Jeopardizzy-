import { useGameStore } from "../store/gameStore";
import { sfx } from "../audio/sound";

export default function Toggles() {
  const settings = useGameStore((s) => s.settings);
  const toggleSound = useGameStore((s) => s.toggleSound);
  const toggleMotion = useGameStore((s) => s.toggleMotion);

  return (
    <div className="flex gap-2">
      <button
        onClick={toggleSound}
        aria-pressed={settings.sound}
        aria-label={settings.sound ? "Mute sound" : "Unmute sound"}
        title={settings.sound ? "Sound on" : "Sound off"}
        className="rounded-lg border border-edge bg-board px-3 py-2 text-sm transition hover:bg-tile"
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
        className="rounded-lg border border-edge bg-board px-3 py-2 text-sm transition hover:bg-tile"
      >
        {settings.reduceMotion ? "🐢" : "✨"}
      </button>
    </div>
  );
}
