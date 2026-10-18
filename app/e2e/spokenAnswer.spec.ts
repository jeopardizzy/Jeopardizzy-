import { expect, test } from "./fixtures";

/**
 * "Say it" must always be stoppable and always time out, even when the
 * browser never delivers audio — what iPhone web views do to web audio not
 * started during a tap. A fake microphone stands in for the real one.
 */
test.use({
  permissions: ["microphone"],
  launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] },
});

test.beforeEach(async ({ page }) => {
  // spoken answers already turned on (skips the one-time explainer)
  await page.addInitScript(() => {
    const key = "quizzical-club:settings:v1";
    const s = JSON.parse(localStorage.getItem(key) ?? "null") ?? { version: 1, sound: true, reduceMotion: true, teamNames: ["Team Sage", "Team Butter"] };
    localStorage.setItem(key, JSON.stringify({ ...s, spokenAnswers: true }));
  });
});

async function openClue(page: import("@playwright/test").Page) {
  await page.goto("/#/sets");
  await page.getByRole("button", { name: /^Play Idiom Arena I · Part 1 of 2$/ }).click();
  await page.getByRole("button", { name: "Start the game" }).click();
  await page.locator("[role='gridcell']:not([disabled])").first().click();
}

/** A real audio processor that never delivers sound, as on iOS when web audio is blocked. */
async function freezeAudio(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const real = AudioContext.prototype.createScriptProcessor;
    AudioContext.prototype.createScriptProcessor = function (...args: Parameters<typeof real>) {
      const node = real.apply(this, args);
      Object.defineProperty(node, "onaudioprocess", { set() {}, get: () => null });
      return node;
    };
  });
}

test("tap to stop ends listening even when no audio ever arrives", async ({ page }) => {
  test.setTimeout(90_000);
  await freezeAudio(page);
  await openClue(page);
  await page.getByRole("button", { name: /Say it/ }).click();
  const listening = page.getByRole("button", { name: /Listening/ });
  await expect(listening).toBeVisible({ timeout: 45_000 }); // the engine loads first
  await listening.click();
  await expect(page.getByRole("button", { name: /Say it again/ })).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText(/Didn’t catch that|I heard/)).toBeVisible();
});

test("listening times out on its own even when no audio ever arrives", async ({ page }) => {
  test.setTimeout(90_000);
  await freezeAudio(page);
  await openClue(page);
  await page.getByRole("button", { name: /Say it/ }).click();
  await expect(page.getByRole("button", { name: /Listening/ })).toBeVisible({ timeout: 45_000 });
  await expect(page.getByRole("button", { name: /Say it again/ })).toBeVisible({ timeout: 12_000 });
});

test("with a working microphone, stopping still ends cleanly", async ({ page }) => {
  test.setTimeout(90_000);
  await openClue(page);
  await page.getByRole("button", { name: /Say it/ }).click();
  const listening = page.getByRole("button", { name: /Listening/ });
  await expect(listening).toBeVisible({ timeout: 45_000 });
  await page.waitForTimeout(1500); // the fake microphone plays a beep, not an answer
  await listening.click();
  await expect(page.getByRole("button", { name: /Say it again/ })).toBeVisible({ timeout: 45_000 });
});
