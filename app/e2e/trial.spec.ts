import { expect, test, type Page } from "@playwright/test";

/**
 * The free week as an iPhone sees it: a stand-in for the native bridge answers
 * the store calls like the App Store does (Full Club $7.99, a free
 * "7-Day Trial" product, nothing bought yet).
 */
async function asIPhone(page: Page, trialRecord?: object) {
  await page.addInitScript((rec) => {
    if (rec && !localStorage.getItem("quizzical-club:trial:v1"))
      localStorage.setItem("quizzical-club:trial:v1", JSON.stringify(rec));
    (window as unknown as { webkit: unknown }).webkit = { messageHandlers: { bridge: { postMessage: () => {} } } };
    const answers: Record<string, (o: { productIdentifier?: string; productIdentifiers?: string[] }) => unknown> = {
      getProducts: (o) => ({
        products: (o.productIdentifiers ?? []).map((id) => ({
          identifier: id,
          priceString: id === "full_club" ? "$7.99" : "Free",
        })),
      }),
      getPurchases: () => ({ purchases: [] }),
      purchaseProduct: (o) => ({ productIdentifier: o.productIdentifier, purchaseDate: new Date().toISOString() }),
    };
    (window as unknown as { Capacitor: unknown }).Capacitor = {
      PluginHeaders: [
        {
          name: "NativePurchases",
          methods: ["getProducts", "getPurchases", "purchaseProduct"]
            .map((name) => ({ name, rtype: "promise" }))
            .concat([{ name: "addListener", rtype: "callback" }]),
        },
      ],
      nativePromise: async (_plugin: string, method: string, opts: object) => answers[method]?.(opts) ?? {},
      nativeCallback: () => "cb-1",
    };
  }, trialRecord ?? null);
}

test("a locked game offers the free week; starting it unlocks everything", async ({ page }) => {
  await asIPhone(page);
  await page.goto("/#/sets");
  await page.getByRole("button", { name: /Play Championship.* — Full Club/ }).click();
  const sheet = page.getByRole("dialog", { name: "Full Club" });
  await expect(sheet.getByText(/Nothing is charged automatically/)).toContainText("for $7.99");
  await expect(sheet.getByRole("button", { name: "Unlock for $7.99" })).toBeVisible();
  await sheet.getByRole("button", { name: "Try everything free for 7 days" }).click();
  await expect(sheet).toBeHidden();

  await expect(page.getByRole("button", { name: "⏳ Free trial · 7 days left" })).toBeVisible();
  await expect(page.locator("main button[aria-label$='Full Club']")).toHaveCount(0);
  await page.getByRole("button", { name: /Play Championship/ }).first().click();
  await expect(page).toHaveURL(/#\/setup/);

  // the sheet during the trial: a countdown, a way to buy, no second trial
  await page.goto("/#/sets");
  await page.getByRole("button", { name: "⏳ Free trial · 7 days left" }).click();
  await expect(sheet.getByText("⏳ Free trial: 7 days left.", { exact: false })).toBeVisible();
  await expect(sheet.getByRole("button", { name: /Try everything free/ })).toHaveCount(0);
  await expect(sheet.getByRole("button", { name: "Unlock for $7.99" })).toBeVisible();
});

test("after the week the sheet says so once, and the locks are back", async ({ page }) => {
  await asIPhone(page, { startedAt: Date.now() - 8 * 24 * 60 * 60 * 1000, warned: true });
  await page.goto("/#/sets");
  const sheet = page.getByRole("dialog", { name: "Full Club" });
  await expect(sheet.getByText(/Your free week is over/)).toBeVisible();
  await expect(sheet.getByRole("button", { name: /Try everything free/ })).toHaveCount(0);
  await sheet.getByRole("button", { name: "Not now" }).click();
  await expect(page.locator("main button[aria-label$='Full Club']").first()).toBeVisible();
  await page.reload();
  await expect(page.locator("main button[aria-label$='Full Club']").first()).toBeVisible();
  await expect(sheet).toHaveCount(0);
});
