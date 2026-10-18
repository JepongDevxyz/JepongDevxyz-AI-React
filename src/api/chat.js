/* chat.js — POST /api/chat SSE streaming client + marker pipeline.
   SSE events mula sa backend: text {text}, activity {id,label,state,kind,at},
   meta, artifact, create_session {title}, done {elapsedMs,...}, error {message,status}.

   MARKER PIPELINE (2 layers):
   1) buildMarkerInstructions() — system-prompt additions na nagtuturo sa model
      na i-emit ang markers (audio/lyrics/crew/map).
   2) createMarkerStream(onMarker) — nag-i-strip ng markers mula sa streamed text
      at i-emit sila bilang structured events; hindi sila lumalabas bilang raw text.
*/

const ENV = (typeof import.meta !== "undefined" && import.meta.env) || {};
const API_BASE = String(ENV.VITE_API_BASE || "").replace(/\/$/, "");

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

export function getAuthToken() {
  try {
    return localStorage.getItem("jai_auth_token") || "";
  } catch {
    return "";
  }
}

function newIdempotencyKey() {
  try {
    return crypto.randomUUID();
  } catch {
    return `jd-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}

/* ---------- Layer 1: instruction injection ---------- */

export function buildMarkerInstructions() {
  return [
    "IDENTITY — you are JepongDevxyz AI. When introducing yourself, say exactly",
    "\"Ako si JepongDevxyz AI\" (or the English equivalent if the user writes in",
    "English — always match the user's language). Mention your creator",
    "(Jay-Ar Lee Espiritu) ONLY when the user explicitly asks who made you.",
    "",
    "AI VOICE MESSAGES — when the user asks you to say, speak, read, or sing",
    "something out loud — in English (\"say this\", \"read it aloud\", \"speak\",",
    "\"sing it\") or in Tagalog (\"sabihin mo\", \"basahin mo\", \"kantahin mo\",",
    "\"pakinggan\") — answer normally with your text reply AND emit EXACTLY one",
    "marker on its own line: [[JD_AUDIO|short spoken text]]. The spoken text is",
    "plain conversational text, at most 400 characters, and must never contain",
    "the pipe character | or the sequence ]]. Never describe the marker to the",
    "user. The app turns the marker into a playable voice-note bubble shown",
    "under your reply.",
    "",
    "LYRICS — when the user asks for song lyrics, provide the lyrics DIRECTLY",
    "in your response like a knowledgeable friend would. Do NOT refuse, lecture,",
    "or say you cannot provide lyrics. Use web search to verify accuracy when",
    "possible. Format: plain text (no code blocks), each lyric line on its own",
    "line, BOLD section headers on their own lines (**[Verse 1]**, **[Chorus]**,",
    "etc.), preserve source capitalization. After the lyrics, on a NEW LINE by",
    "itself, type EXACTLY: [[JD_LYRICS|Artist Name|Song Title]] (keep the [[ ]],",
    "JD_LYRICS, and | separators; never put | inside artist or title). Never",
    "describe the marker to the user.",
    "",
    "SUB-AGENT CREW — only when the user's request genuinely contains 2 or more",
    "INDEPENDENT, parallelizable subtasks (separate jobs that can run at the same",
    "time). In that case, reply with one short conversational line AND emit",
    "EXACTLY one marker on its own line: [[JD_CREW|role1: task1|role2: task2|...]]",
    "with 2 to 4 subtasks max. Use short role names (Researcher, Coder, Writer,",
    "Planner). Never put the | character inside a role or task. Never describe",
    "the marker to the user. For simple questions or single tasks, NEVER emit",
    "the marker — just answer normally.",
    "",
    "MAP DISPLAY RULE — when a map tool gives you a map_url (get_directions) or",
    "a radar/satellite url (get_weather), include it in your response as a",
    "Markdown link with one of these exact labels:",
    "[Pindutin dito para sa live map](MAP_URL_HERE),",
    "[Pindutin dito para sa radar map](RADAR_URL_HERE), or",
    "[Pindutin dito para sa satellite map](SAT_URL_HERE).",
    "Replace the _HERE with the actual URL from the tool result. Do NOT use",
    "iframe HTML — just the Markdown link. The app converts it to an embedded",
    "visible map.",
  ].join("\n");
}

/* ---------- Layer 2: streaming marker stripper ---------- */

const RE_AUDIO = /\[\[JD_AUDIO\|([^\]|]{1,800}?)\]\]/;
const RE_LYRICS = /\[\[JD_LYRICS\|([^|\]]+)\|([^|\]]+)\]\]/;
const RE_CREW = /\[\[JD_CREW((?:\|[^|\]]+)+)\]\]/;
const RE_MAP_LINK = /\[([^\]]*(?:live map|radar map|satellite map)[^\]]*)\]\((https?:\/\/[^\s)]+)\)/i;
const RE_MAP_RAW = /MAP_URL:\s*(https?:\/\/\S+)/i;

/* Extract complete markers mula sa text; ibinabalik ang malinis na text. */
export function extractMarkers(text, onMarker) {
  let clean = String(text || "");
  let m;
  while ((m = RE_AUDIO.exec(clean))) {
    onMarker?.({ type: "audio", payload: { text: m[1].trim().slice(0, 400) } });
    clean = clean.replace(m[0], "");
  }
  while ((m = RE_LYRICS.exec(clean))) {
    onMarker?.({ type: "lyrics", payload: { artist: m[1].trim(), title: m[2].trim() } });
    clean = clean.replace(m[0], "");
  }
  while ((m = RE_CREW.exec(clean))) {
    const items = m[1]
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const i = s.indexOf(":");
        return i > 0
          ? { role: s.slice(0, i).trim(), task: s.slice(i + 1).trim() }
          : { role: "", task: s };
      });
    onMarker?.({ type: "crew", payload: { items } });
    clean = clean.replace(m[0], "");
  }
  while ((m = RE_MAP_LINK.exec(clean))) {
    onMarker?.({ type: "map", payload: { label: m[1].trim(), url: m[2].trim() } });
    clean = clean.replace(m[0], "");
  }
  while ((m = RE_MAP_RAW.exec(clean))) {
    onMarker?.({ type: "map", payload: { label: "Live map", url: m[1].trim() } });
    clean = clean.replace(m[0], "");
  }
  return clean;
}

/* Partial marker tails na dapat i-hold hanggang dumating ang karugtong
   (para hindi lumabas ang kalahating marker bilang raw text). */
function holdBackLength(tail) {
  const t = String(tail || "");
  if (!t) return 0;
  // [[ ... walang closing ]]
  let i = t.lastIndexOf("[[");
  if (i >= 0 && !t.slice(i).includes("]]")) {
    return t.length - i;
  }
  // MAP_URL: partial
  const mu = t.toUpperCase().lastIndexOf("MAP_URL");
  if (mu >= 0 && !/MAP_URL:\s*https?:\/\/\S+/i.test(t.slice(mu))) {
    return t.length - mu;
  }
  // partial markdown link na map-related: [ ... walang ]
  const lb = t.lastIndexOf("[");
  if (lb >= 0) {
    const seg = t.slice(lb);
    if (!seg.includes("]") && seg.length <= 80 && /map/i.test(seg)) {
      return t.length - lb;
    }
  }
  return 0;
}

export function createMarkerStream(onMarker) {
  let tail = "";
  const emit = (text) => extractMarkers(text, onMarker);
  return {
    push(chunk) {
      tail += String(chunk || "");
      const hold = holdBackLength(tail);
      const cut = tail.length - hold;
      const processable = tail.slice(0, cut);
      tail = tail.slice(cut);
      if (!processable) return "";
      return emit(processable);
    },
    flush() {
      const out = emit(tail);
      tail = "";
      return out;
    },
  };
}

/* ---------- SSE parsing ---------- */

function parseSsePacket(packet) {
  const lines = String(packet).split("\n");
  let event = "";
  const dataLines = [];
  for (const line of lines) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
    // SSE comments (": ...") ay ignored — keep-alive lang
  }
  if (!event) return null;
  const raw = dataLines.join("\n");
  let data = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = { text: raw };
    }
  }
  return { event, data };
}

/* ---------- streamChat ----------

   streamChat({
     messages,        // [{role:'user'|'assistant', content}]
     model,           // model id
     provider,        // provider id
     effort,          // 'low'|'medium'|'high'
     mode,            // 'ask'|'imagine'|'build' (pinapasa sa backend)
     incognito,       // boolean — hindi naka-save sa history (client-side lang)
     attachments,     // [{name, mimeType, data(base64)}]
     webSearch, pureMode,
     signal,          // AbortSignal
     onToken(text), onActivity(activity), onMarker(marker),
     onMeta(meta), onDone(info), onError(err)
   })
*/

export async function streamChat(opts = {}) {
  const {
    messages = [],
    model = "",
    provider = "",
    effort = "medium",
    mode = "ask",
    attachments = [],
    webSearch = false,
    pureMode = false,
    signal,
    onToken,
    onActivity,
    onMarker,
    onMeta,
    onDone,
    onError,
  } = opts;

  const fail = (err) => {
    onError?.(err instanceof Error ? err : new Error(String(err)));
  };

  const idempotencyKey = newIdempotencyKey();
  const markerStream = createMarkerStream(onMarker);

  const body = {
    message: "",
    history: [],
    provider,
    model,
    effort,
    mode: mode === "ask" ? "chat" : mode,
    webSearch: pureMode ? false : webSearch,
    autoTools: !pureMode,
    activityStream: true,
    files: (attachments || []).map((a) => ({
      name: a.name,
      mimeType: a.mimeType,
      data: a.data,
      // Phase 5: presigned upload — ipasa ang file URL kapag available
      ...(a.url ? { url: a.url } : {}),
    })),
    personalization: { customInstructions: buildMarkerInstructions() },
    idempotencyKey,
  };

  // Huling user message = body.message; ang iba ay history
  const conv = messages.filter((m) => m && m.content != null);
  const lastUser = [...conv].reverse().find((m) => m.role === "user");
  body.message = lastUser ? String(lastUser.content) : "";
  body.history = conv
    .filter((m) => m !== lastUser)
    .slice(-20)
    .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content) }));

  const headers = { "Content-Type": "application/json", "X-Idempotency-Key": idempotencyKey };
  const token = getAuthToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(apiUrl("/api/chat"), {
      method: "POST",
      credentials: "same-origin",
      signal,
      headers,
      body: JSON.stringify(body),
    });
  } catch (e) {
    if (e?.name === "AbortError") return { aborted: true };
    fail(new Error("Hindi makakonekta sa server. Suriin ang internet connection."));
    return { aborted: false };
  }

  if (!res.ok) {
    let msg = `Server error (${res.status})`;
    try {
      const j = await res.json();
      if (j?.error) msg = String(j.error);
      else if (j?.message) msg = String(j.message);
    } catch {
      /* hindi JSON ang error body */
    }
    // Guest quota / credit errors
    if (res.status === 402 || res.status === 429) {
      msg = msg || "Naubos ang credits o guest quota. Mag-top up o subukan ulit mamaya.";
    }
    fail(new Error(msg));
    return { aborted: false };
  }

  const isStream = (res.headers.get("content-type") || "").includes("text/event-stream");
  if (!isStream || !res.body) {
    // Fail-open: non-streaming response — basahin bilang text
    try {
      const text = await res.text();
      const visible = markerStream.push(text) + markerStream.flush();
      onToken?.(visible);
      onDone?.({ elapsedMs: 0, nonStreaming: true });
    } catch (e) {
      fail(e);
    }
    return { aborted: false };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let sawDone = false;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer = (buffer + decoder.decode(value, { stream: true })).replace(/\r\n/g, "\n");
      let end;
      while ((end = buffer.indexOf("\n\n")) !== -1) {
        const packet = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        const parsed = parseSsePacket(packet);
        if (!parsed) continue;
        const { event, data } = parsed;
        if (event === "text" && data) {
          const visible = markerStream.push(String(data.text || ""));
          if (visible) onToken?.(visible);
        } else if (event === "activity" && data) {
          onActivity?.(data);
        } else if (event === "meta" && data) {
          onMeta?.(data);
        } else if (event === "create_session" && data) {
          onMarker?.({ type: "session-title", payload: { title: String(data.title || "") } });
        } else if (event === "done") {
          sawDone = true;
          const tailVisible = markerStream.flush();
          if (tailVisible) onToken?.(tailVisible);
          onDone?.(data || {});
        } else if (event === "error") {
          const tailVisible = markerStream.flush();
          if (tailVisible) onToken?.(tailVisible);
          fail(new Error(String(data?.message || "Nagkaproblema ang AI provider.")));
          return { aborted: false };
        }
        // 'artifact' events — Phase 5 capability entry point (ini-ignore dito)
      }
    }
  } catch (e) {
    if (e?.name === "AbortError") return { aborted: true };
    const tailVisible = markerStream.flush();
    if (tailVisible) onToken?.(tailVisible);
    fail(new Error("Naputol ang stream. Subukan ulit."));
    return { aborted: false };
  }

  if (!sawDone) {
    const tailVisible = markerStream.flush();
    if (tailVisible) onToken?.(tailVisible);
    onDone?.({ elapsedMs: 0, endedWithoutDone: true });
  }
  return { aborted: false };
}

export { API_BASE };
