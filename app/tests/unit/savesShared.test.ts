import { beforeAll, describe, expect, it } from "vitest";

/**
 * Trivia Night and the Workbook share one copy of saved progress and settings
 * (store/savesStore.ts): what one mode saves, the other must never overwrite.
 */

const storage = new Map<string, string>();
const saved = (key: string) => JSON.parse(storage.get(key) ?? "null");
const RECORDS = "quizzical-club:records:v1";
const SETTINGS = "quizzical-club:settings:v1";

let team: typeof import("../../src/store/teamStore").useTeamStore;
let workbook: typeof import("../../src/store/workbookStore").useWorkbookStore;

beforeAll(async () => {
  const g = globalThis as Record<string, unknown>;
  g.localStorage = {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => void storage.set(k, v),
    removeItem: (k: string) => void storage.delete(k),
  };
  g.window = globalThis;
  team = (await import("../../src/store/teamStore")).useTeamStore;
  workbook = (await import("../../src/store/workbookStore")).useWorkbookStore;
});

function finishWorkbookTest() {
  const w = workbook.getState();
  w.pick("all", "easy");
  w.setQuestionCount(5);
  workbook.getState().startTest();
  for (let i = 0; i < 5; i++) {
    const q = workbook.getState().questions[i];
    workbook.getState().answerCurrent(q.answer);
    workbook.getState().nextQuestion();
  }
}

function finishTeamGame() {
  const t = team.getState();
  t.selectSet("first-words");
  team.getState().startGame(["New One", "New Two"]);
  team.getState().endGameEarly("results");
}

describe("shared saves", () => {
  it("a team game after a workbook test keeps the workbook best", () => {
    finishWorkbookTest();
    expect(saved(RECORDS).workbookBests["all|easy|5"]).toBe(5);
    finishTeamGame();
    expect(saved(RECORDS).workbookBests["all|easy|5"]).toBe(5);
    expect(saved(RECORDS).gamesPlayed).toBe(1);
  });

  it("a workbook test after a team game keeps the game count", () => {
    finishWorkbookTest();
    expect(saved(RECORDS).gamesPlayed).toBe(1);
    expect(workbook.getState().records.gamesPlayed).toBe(1);
  });

  it("changing a setting in one mode keeps the other mode's changes", () => {
    team.getState().toggleSound(); // sound off
    expect(saved(SETTINGS).sound).toBe(false);
    workbook.getState().setQuestionCount(20);
    expect(saved(SETTINGS)).toMatchObject({ sound: false, workbookCount: 20 });
    expect(team.getState().settings.workbookCount).toBe(20);
    expect(workbook.getState().settings.sound).toBe(false);
  });

  it("new team names are remembered for the next game", () => {
    expect(saved(SETTINGS).teamNames).toEqual(["New One", "New Two"]);
    expect(team.getState().settings.teamNames).toEqual(["New One", "New Two"]);
    team.getState().toggleMotion();
    expect(saved(SETTINGS).teamNames).toEqual(["New One", "New Two"]);
  });
});
