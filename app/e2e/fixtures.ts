import { test as base, expect } from "@playwright/test";

/**
 * Gameplay specs run with Full Club unlocked so they can reach every set and
 * level. fullclub.spec.ts imports from @playwright/test directly to test the
 * free tier as a first-time visitor sees it.
 */
export const test = base.extend<{ fullClub: void }>({
  fullClub: [
    async ({ page }, use) => {
      await page.addInitScript(() =>
        localStorage.setItem("quizzical-club:entitlement:v1", JSON.stringify({ fullClub: true })),
      );
      await use();
    },
    { auto: true },
  ],
});

export { expect };
export type { Page } from "@playwright/test";
