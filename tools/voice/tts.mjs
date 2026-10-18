// Alibaba Model Studio (Qwen-Audio TTS) client shared by the voice bake
// (tools/voice/bake.mjs) and the accent test set (tools/kws/accent-samples.mjs).
//
// environment (never pass secrets on the command line):
//   DASHSCOPE_API_KEY        Model Studio API key (Singapore region)
//   DASHSCOPE_WORKSPACE_ID   optional workspace id; the endpoint becomes
//                            https://<id>.ap-southeast-1.maas.aliyuncs.com/...
//                            (default: https://dashscope-intl.aliyuncs.com/...)
//   DASHSCOPE_TTS_URL        optional full endpoint override

export function endpoint() {
  if (process.env.DASHSCOPE_TTS_URL) return process.env.DASHSCOPE_TTS_URL;
  const ws = process.env.DASHSCOPE_WORKSPACE_ID;
  // without a workspace id, the older shared international host still serves the same API
  const host = ws ? `${ws}.ap-southeast-1.maas.aliyuncs.com` : "dashscope-intl.aliyuncs.com";
  return `https://${host}/api/v1/services/audio/tts/SpeechSynthesizer`;
}

export function apiKey() {
  const k = process.env.DASHSCOPE_API_KEY;
  if (!k) throw new Error("set DASHSCOPE_API_KEY in the environment (not on the command line)");
  return k;
}

/** Fail fast, before any work, when the credentials are missing. */
export function checkCredentials() {
  endpoint();
  apiKey();
}

/** Request body for one line. "next" models take a described voice; the others a named voice. */
export function requestBody(voice, say, sampleRate) {
  if (voice.model.includes("tts-next")) {
    return {
      model: voice.model,
      input: {
        text_prompt: `${voice.prompt}: ${say}`,
        ...(voice.references ? { references: voice.references } : {}),
        format: "wav",
        sample_rate: sampleRate,
        channels: 1,
        rate: voice.rate ?? 1.0,
        seed: voice.seed ?? 42,
      },
    };
  }
  return {
    model: voice.model,
    input: {
      text: say,
      voice: voice.voice,
      ...(voice.instruction ? { instruction: voice.instruction } : {}),
      format: "wav",
      sample_rate: sampleRate,
      rate: voice.rate ?? 1.0,
      language_hints: ["en"],
      ...(voice.seed !== undefined ? { seed: voice.seed } : {}),
    },
  };
}

/** One line of speech as WAV bytes. Retries rate limits and server errors. */
export async function synthesize(voice, say, sampleRate, attempt = 1) {
  const res = await fetch(endpoint(), {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify(requestBody(voice, say, sampleRate)),
  });
  const body = await res.json().catch(() => ({}));
  const url = body?.output?.audio?.url;
  if (!res.ok || !url) {
    if (attempt < 3 && (res.status === 429 || res.status >= 500)) {
      await new Promise((r) => setTimeout(r, 1500 * attempt));
      return synthesize(voice, say, sampleRate, attempt + 1);
    }
    throw new Error(`TTS ${res.status} ${body?.code ?? ""} ${body?.message ?? ""}`.trim());
  }
  const audio = await fetch(url);
  if (!audio.ok) throw new Error(`audio download ${audio.status}`);
  return Buffer.from(await audio.arrayBuffer());
}

/** Run `fn` over `items`, `concurrency` at a time; logs failures, returns how many failed. */
export async function pool(items, fn, concurrency = 3) {
  let next = 0, done = 0, failed = 0;
  const worker = async () => {
    while (next < items.length) {
      const item = items[next++];
      try { await fn(item); } catch (e) { failed++; console.error(`✗ ${item.id}: ${e.message}`); }
      if (++done % 25 === 0 || done === items.length) console.log(`${done}/${items.length}${failed ? ` (${failed} failed)` : ""}`);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  return failed;
}
