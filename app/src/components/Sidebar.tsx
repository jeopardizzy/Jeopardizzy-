import { NavLink, useNavigate } from "react-router-dom";

/**
 * Permanent app navigation (per the home-screen redesign):
 * logo on top, then Today / Guides / Workbook / Trivia Night. One nav element:
 * bottom bar on mobile, left sidebar on desktop. Hidden during an active
 * team game (the shell drops it).
 */
const ITEMS = [
  // the Daily Board (home): on phones the logo is hidden, so this is the way back
  { to: "/", emoji: "☀️", label: "Today", end: true },
  { to: "/guides", emoji: "📖", label: "Guides" },
  { to: "/workbook", emoji: "✏️", label: "Workbook" },
  { to: "/sets", emoji: "🎯", label: "Trivia Night" },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const linkCls = (active: boolean) =>
    `flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition lg:flex-row lg:gap-3 lg:px-4 lg:py-3 lg:text-sm ${
      active ? "bg-sage-soft text-sage-deep" : "text-mute hover:bg-cream hover:text-ink"
    }`;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-line bg-surface px-2 py-2 lg:inset-y-0 lg:right-auto lg:left-0 lg:w-60 lg:flex-col lg:justify-start lg:border-r lg:border-t-0 lg:px-4 lg:py-6"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <button
        onClick={() => navigate("/")}
        className="mb-8 hidden items-center gap-2.5 px-2 text-left lg:flex"
        aria-label="Quizzical Club — home"
      >
        <span className="font-display flex h-10 w-10 items-center justify-center rounded-xl bg-sage text-lg text-butter shadow-card">
          Q
        </span>
        <span className="font-display text-lg leading-tight text-ink">
          Quizzical
          <span className="block text-xs uppercase tracking-[0.3em] text-sage">Club</span>
        </span>
      </button>

      <div className="contents lg:flex lg:flex-col lg:gap-1">
        {ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => linkCls(isActive)}>
            <span aria-hidden className="text-xl lg:text-base">
              {item.emoji}
            </span>
            {item.label}
          </NavLink>
        ))}
      </div>

      <p className="mt-auto hidden px-2 text-xs leading-relaxed text-mute lg:block">
        One device, one host,
        <br />
        trivia night done right.
      </p>
    </nav>
  );
}
