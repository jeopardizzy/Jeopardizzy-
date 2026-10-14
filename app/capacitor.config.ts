import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor wrapper for Quizzical Club.
 * webDir points at the Vite production build — run `npm run build` first,
 * then `npx cap sync` to copy it into the native projects.
 *
 * To rename the package for your company accounts, change appId here AND
 * in android/app/build.gradle (applicationId), then re-sync.
 */
const config: CapacitorConfig = {
  appId: "com.quizzicalclub.app",
  appName: "Quizzical Club",
  webDir: "dist",
  android: {
    // let the web view draw under the system bars; CSS env(safe-area-*) handles padding
    adjustMarginsForEdgeToEdge: "disable",
  },
  ios: {
    contentInset: "never",
  },
};

export default config;
