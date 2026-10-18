import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { joinRouteFor } from "./connection";

/**
 * In the apps, a scanned join link (https://<relay>/join#CODE/KEY) opens the
 * app instead of the browser; this takes it to that room's join screen,
 * whether the app was already running or just launched by the link.
 */
export default function AppLinks() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const go = (url: string | undefined) => {
      const route = url ? joinRouteFor(url) : null;
      if (route) navigate(route);
    };
    void App.getLaunchUrl().then((launch) => go(launch?.url));
    const handle = App.addListener("appUrlOpen", (e) => go(e.url));
    return () => {
      void handle.then((h) => h.remove());
    };
  }, [navigate]);
  return null;
}
