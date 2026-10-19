import { useState } from "react";
import { useTeamStore } from "../store/teamStore";
import { phonesOn, usePartyHost } from "../party/hostSession";
import QrCode from "./QrCode";

/**
 * Trivia Night on several phones: the room's join code, QR code and which
 * teams have a phone in. Shown above the scoreboard while a room is open.
 */
export default function PartyBar() {
  const room = usePartyHost((s) => s.room);
  const code = usePartyHost((s) => s.code);
  const link = usePartyHost((s) => s.link);
  const status = usePartyHost((s) => s.status);
  const members = usePartyHost((s) => s.members);
  const online = usePartyHost((s) => s.online);
  const teams = useTeamStore((s) => s.teams);
  const anyPhones = teams.some((t) => phonesOn(t.id, { members, online }) > 0);
  const [showQr, setShowQr] = useState(true);

  if (!room) return null;
  const qrOpen = showQr || !anyPhones;

  return (
    <section aria-label="Phones" className="mb-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-card">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-mute">📱 Join code</span>
        <span aria-label="Join code" className="font-display text-2xl tracking-[0.25em] text-ink">
          {code ?? "…"}
        </span>
        <ul className="flex flex-wrap gap-2 text-xs" aria-label="Phones per team">
          {teams.map((t) => (
            <li key={t.id} className="flex items-center gap-1 rounded-full border border-line px-2 py-0.5">
              <span className="h-2 w-2 rounded-full" style={{ background: t.color }} aria-hidden />
              {t.name} 📱{phonesOn(t.id, { members, online })}
            </li>
          ))}
        </ul>
        {status !== "open" && <span className="text-xs font-semibold text-coral">Connection: {status}</span>}
        <button
          type="button"
          onClick={() => setShowQr(!qrOpen)}
          className="ml-auto rounded-lg border border-line px-3 py-1 text-xs font-semibold text-mute hover:text-ink"
        >
          {qrOpen ? "Hide QR code" : "Show QR code"}
        </button>
      </div>
      {qrOpen && link && (
        <div className="mt-3 flex flex-col items-center gap-2">
          <QrCode text={link} label="QR code to join this game" />
          <p className="text-center text-xs text-mute">
            Scan with the phone's camera. Phones with Quizzical Club open the app; others open the website.
          </p>
          <a href={link} target="_blank" rel="noreferrer" data-testid="join-link" className="break-all text-xs text-sage-deep underline">
            {link}
          </a>
        </div>
      )}
    </section>
  );
}
