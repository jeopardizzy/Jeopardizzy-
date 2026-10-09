import { quizJson } from "./quizJson";
import { QuizDataSchema, type QuizData } from "../lib/schema";

/**
 * The bundled trivia dataset, validated at load time. If the data ever
 * fails schema validation the app fails loudly in development instead of
 * shipping a broken board.
 */
const parsed = QuizDataSchema.safeParse(quizJson);
if (!parsed.success) {
  throw new Error(`Invalid quiz dataset: ${parsed.error.issues[0]?.message ?? "unknown"}`);
}

export const quizData: QuizData = parsed.data;
export const categoryCount = quizData.categories.length;
export const clueCount = quizData.categories.reduce((n, c) => n + c.clues.length, 0);
