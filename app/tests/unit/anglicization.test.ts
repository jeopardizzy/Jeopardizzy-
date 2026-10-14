import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/** Recursively collect source files under dir. */
function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx|css|html)$/.test(entry)) out.push(p);
  }
  return out;
}

const CYRILLIC = /[А-Яа-яЁё]/;

describe("anglicization (TZ2)", () => {
  it("no Cyrillic anywhere in app source — text, JSX, aria, placeholders, data", () => {
    const files = [...walk("src"), "index.html"];
    const offenders: string[] = [];
    for (const f of files) {
      const content = readFileSync(f, "utf-8");
      if (CYRILLIC.test(content)) offenders.push(f);
    }
    expect(offenders, `Cyrillic found in: ${offenders.join(", ")}`).toEqual([]);
  });

  it("index.html is declared English", () => {
    const html = readFileSync("index.html", "utf-8");
    expect(html).toContain('lang="en"');
  });
});
