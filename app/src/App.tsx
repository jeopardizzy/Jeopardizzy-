import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import type { ReactNode } from "react";
import Home from "./pages/Home";
import Sets from "./pages/Sets";
import TeamSetup from "./pages/TeamSetup";
import TeamGame from "./pages/TeamGame";
import Workbook from "./pages/Workbook";
import Guides from "./pages/Guides";
import Sidebar from "./components/Sidebar";
import { unlockAudio } from "./audio/sound";

/** Shell with the permanent sidebar — hidden during an active team game. */
function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const inGame = pathname === "/game";
  return (
    <div className="min-h-dvh">
      {!inGame && <Sidebar />}
      {/* clear the sidebar on desktop and the bottom bar on mobile */}
      <div className={inGame ? "" : "pb-20 lg:pb-0 lg:pl-60"}>{children}</div>
    </div>
  );
}

export default function App() {
  // Browsers require a user gesture before audio can start.
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sets" element={<Sets />} />
          <Route path="/setup" element={<TeamSetup />} />
          <Route path="/game" element={<TeamGame />} />
          <Route path="/workbook" element={<Workbook />} />
          <Route path="/guides" element={<Guides />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </HashRouter>
  );
}
