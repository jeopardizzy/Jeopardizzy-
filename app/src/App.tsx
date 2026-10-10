import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import Home from "./pages/Home";
import Sets from "./pages/Sets";
import TeamSetup from "./pages/TeamSetup";
import TeamGame from "./pages/TeamGame";
import Workbook from "./pages/Workbook";
import Guides from "./pages/Guides";
import { unlockAudio } from "./audio/sound";

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
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sets" element={<Sets />} />
        <Route path="/setup" element={<TeamSetup />} />
        <Route path="/game" element={<TeamGame />} />
        <Route path="/workbook" element={<Workbook />} />
        <Route path="/guides" element={<Guides />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
