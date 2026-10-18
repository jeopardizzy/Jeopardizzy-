// Speech-to-text second pass for spoken Workbook answers: Moonshine tiny
// (English) in sherpa-onnx WebAssembly, built by tools/kws/build-wasm-asr.sh.
// Runs in its own worker so it never collides with the keyword spotter's
// Emscripten module and never blocks the page. Audio arrives in memory,
// is transcribed, and is dropped; nothing is stored or sent anywhere.
//
// messages in:  { id, samples: Float32Array (16 kHz mono) }
// messages out: { ready: true } once loaded, then { id, text } or { id, error }
//
// Everything of ours lives in this closure: the imported Emscripten scripts
// share the worker's global scope and define globals of their own (run(),
// onmessage), which would silently replace same-named functions here.
/* global OfflineRecognizer */
(() => {
  let recognizer = null;
  const queue = [];

  function transcribeOne({ id, samples }) {
    let stream = null;
    try {
      stream = recognizer.createStream();
      stream.acceptWaveform(16000, samples);
      recognizer.decode(stream);
      self.postMessage({ id, text: recognizer.getResult(stream).text || "" });
    } catch (e) {
      self.postMessage({ id, error: String(e) });
    } finally {
      if (stream) stream.free();
    }
  }

  self.addEventListener("message", (e) => {
    if (!e.data || typeof e.data.id !== "number") return;
    if (recognizer) transcribeOne(e.data);
    else queue.push(e.data);
  });

  self.Module = {
    locateFile: (path) => path,
    onRuntimeInitialized() {
      if (recognizer) return;
      try {
        recognizer = new OfflineRecognizer(
          {
            modelConfig: {
              moonshine: { encoder: "./encoder_model.ort", mergedDecoder: "./decoder_model_merged.ort" },
              tokens: "./tokens.txt",
              numThreads: 1,
              debug: 0,
            },
          },
          self.Module,
        );
        self.postMessage({ ready: true });
        queue.splice(0).forEach(transcribeOne);
      } catch (e) {
        self.postMessage({ failed: String(e) });
      }
    },
  };
})();
importScripts("sherpa-onnx-asr.js", "sherpa-onnx-wasm-main-vad-asr.js");
