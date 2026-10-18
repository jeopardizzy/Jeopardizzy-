import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/archivo-black";
import "@fontsource-variable/inter";
import "./index.css";
import App from "./App";
import { useTeamStore } from "./store/teamStore";

// Test hook: drive the game store directly in local e2e runs (never in production).
if (typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(location.hostname)) {
  (window as unknown as { __teamStore: typeof useTeamStore }).__teamStore = useTeamStore;
}

// Diagnostic builds only (VITE_VOICE_SELFTEST=1): check the voice engines on a device at launch.
if (import.meta.env.VITE_VOICE_SELFTEST === "1") {
  setTimeout(() => void import("./voice/selftest").then((m) => m.runVoiceSelftest()), 2000);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
