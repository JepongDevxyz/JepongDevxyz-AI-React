/* JsRunner — sandboxed JavaScript runner.
   Gumagamit ng Function constructor (HINDI eval sa global scope): ang user code
   ay tumatakbo sa sariling function scope na may injected console-capture.
   AsyncFunction variant para suportahan ang top-level await at top-level return.
   Timeout guard (5s) para sa async hangs; ang DOM/network/globals ay naka-shadow
   bilang undefined (soft sandbox — huwag patakbuhin ang hindi pinagkakatiwalaang
   code na umaasa sa CPU-bound infinite loop, hindi ito mai-interrupt). */
import { useRef, useState } from "react";
import { Play, Trash2, AlertTriangle } from "lucide-react";
import Modal from "../ui/Modal.jsx";

const RUN_TIMEOUT_MS = 5000;

function fmt(v) {
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

/* Tumakbo ng code; ibalik { lines: [{kind, text}], error } */
export function runJS(code, timeoutMs = RUN_TIMEOUT_MS) {
  return new Promise((resolve) => {
    const lines = [];
    const push = (kind, args) =>
      lines.push({ kind, text: args.map(fmt).join(" ") });
    const sandboxConsole = {
      log: (...a) => push("log", a),
      info: (...a) => push("log", a),
      debug: (...a) => push("log", a),
      warn: (...a) => push("warn", a),
      error: (...a) => push("error", a),
    };

    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ lines, error });
    };
    const timer = setTimeout(
      () =>
        finish(
          `Timeout: lumampas sa ${timeoutMs / 1000}s — posibleng infinite loop o hindi natapos na async.`
        ),
      timeoutMs
    );

    const src = String(code == null ? "" : code);
    if (!src.trim()) {
      finish("Walang code na patatakbuhin.");
      return;
    }

    try {
      // Shadow ang mapanganib na globals bilang undefined (soft sandbox).
      // AsyncFunction = async na variant ng Function constructor (HINDI eval):
      // sumusuporta ng top-level await AT top-level return sa user code.
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      const fn = new AsyncFunction(
        "console",
        "document",
        "window",
        "localStorage",
        "sessionStorage",
        "fetch",
        "XMLHttpRequest",
        "location",
        "navigator",
        `"use strict";\n${src}`
      );
      const ret = fn(
        sandboxConsole,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
      );
      // Suportahan ang async (Promise return).
      Promise.resolve(ret).then(
        (v) => {
          if (v !== undefined) push("return", [`=> ${fmt(v)}`]);
          finish(null);
        },
        (e) => finish(String((e && e.stack) || e))
      );
    } catch (e) {
      finish(String((e && e.stack) || e));
    }
  });
}

const SAMPLE =
  "// Magsulat ng JavaScript dito, tapos pindutin ang Run.\n// Ang console.log output ay lalabas sa ibaba.\n// Top-level await at return ay pwede.\nconst pangalan = 'Jepong';\nconsole.log('Kumusta,', pangalan + '!');\nconsole.log('2 + 3 =', 2 + 3);\nreturn [1, 2, 3].map((x) => x * 2);";

export default function JsRunner({ onClose }) {
  const [code, setCode] = useState(SAMPLE);
  const [lines, setLines] = useState([]);
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);
  const outRef = useRef(null);

  const run = async () => {
    if (running) return;
    setRunning(true);
    setError(null);
    setLines([{ kind: "sys", text: "Tumatakbo…" }]);
    const { lines: out, error: err } = await runJS(code);
    setLines(out.length ? out : [{ kind: "sys", text: "Walang output." }]);
    setError(err);
    setRunning(false);
    requestAnimationFrame(() => {
      if (outRef.current) outRef.current.scrollTop = outRef.current.scrollHeight;
    });
  };

  const clear = () => {
    setLines([]);
    setError(null);
  };

  return (
    <Modal open onClose={onClose} title="JS Runner" wide>
      <div className="jd-cap-stack">
        <div className="jd-cap-warning">
          <AlertTriangle size={15} />
          <span>
            Sandboxed: walang DOM access. 5s timeout guard. Iwasan ang infinite
            loop — hindi ito mai-interrupt kapag CPU-bound.
          </span>
        </div>
        <textarea
          className="jd-codearea"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          aria-label="JavaScript code"
          rows={8}
        />
        <div className="jd-cap-row">
          <button type="button" className="jd-cap-btn" onClick={run} disabled={running}>
            <Play size={15} /> {running ? "Tumatakbo…" : "Run"}
          </button>
          <button type="button" className="jd-cap-btn jd-cap-btn--ghost" onClick={clear}>
            <Trash2 size={15} /> Linisin ang output
          </button>
        </div>
        <div className="jd-jsout" ref={outRef} aria-live="polite">
          {lines.map((l, i) => (
            <div key={i} className={`jd-jsout__line jd-jsout__line--${l.kind}`}>
              {l.text}
            </div>
          ))}
          {error ? (
            <div className="jd-jsout__line jd-jsout__line--error">Error: {error}</div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
