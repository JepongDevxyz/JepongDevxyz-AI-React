/* importChats.js — .zip import (ChatGPT / Claude / Gemini / Meta AI → sessions).
   Code-complete gaya ng vanilla; hindi pa nate-test sa totoong export. */
import { readZipEntries, entriesToText } from "./zip.js";
import { DEFAULT_MODEL } from "../../api/models.js";

function uid() {
  try {
    return crypto.randomUUID();
  } catch {
    return `imp-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}

function msg(role, content, at) {
  return { id: uid(), role, content: String(content || ""), at: at || Date.now() };
}

/* ---------- ChatGPT: conversations.json [{title, mapping}] ---------- */
function parseChatGPT(json) {
  if (!Array.isArray(json)) return null;
  const probe = json[0];
  if (!probe || typeof probe.mapping !== "object") return null;
  return json.map((conv) => {
    const nodes = Object.values(conv.mapping || {});
    // Ayusin ayon sa parent chain
    const byId = {};
    nodes.forEach((n) => {
      if (n && n.id) byId[n.id] = n;
    });
    const ordered = [];
    const visited = new Set();
    // Hanapin ang root at sundan ang children
    const roots = nodes.filter((n) => n && !n.parent);
    const walk = (n) => {
      if (!n || visited.has(n.id)) return;
      visited.add(n.id);
      const m = n.message;
      if (m && m.author && m.content && m.content.parts) {
        const role = m.author.role === "assistant" ? "assistant" : "user";
        const text = (m.content.parts || []).filter((x) => typeof x === "string").join("\n");
        if (text.trim()) ordered.push({ role, text, at: (m.create_time || 0) * 1000 });
      }
      (n.children || []).forEach((cid) => walk(byId[cid]));
    };
    roots.forEach(walk);
    // Fallback: kung walang nahanap, subukan ang flat order
    if (!ordered.length) {
      nodes.forEach((n) => {
        const m = n && n.message;
        if (m && m.author && m.content && m.content.parts) {
          const role = m.author.role === "assistant" ? "assistant" : "user";
          const text = (m.content.parts || []).filter((x) => typeof x === "string").join("\n");
          if (text.trim()) ordered.push({ role, text, at: (m.create_time || 0) * 1000 });
        }
      });
    }
    return {
      title: String(conv.title || "Imported chat").slice(0, 80),
      messages: ordered.map((o) => msg(o.role, o.text, o.at || Date.now())),
      createdAt: (conv.create_time || Date.now() / 1000) * 1000,
    };
  });
}

/* ---------- Claude: [{name, chat_messages: [{sender, text}]}] ---------- */
function parseClaude(json) {
  if (!Array.isArray(json)) return null;
  const probe = json[0];
  if (!probe || !Array.isArray(probe.chat_messages)) return null;
  return json.map((conv) => ({
    title: String(conv.name || "Imported chat").slice(0, 80),
    messages: (conv.chat_messages || [])
      .map((m) => {
        const role = m.sender === "human" ? "user" : "assistant";
        return msg(role, m.text || m.content || "", (m.created_at ? Date.parse(m.created_at) : 0) || Date.now());
      })
      .filter((m) => m.content.trim()),
    createdAt: conv.created_at ? Date.parse(conv.created_at) : Date.now(),
  }));
}

/* ---------- Generic: [{title?, messages?: [{role|sender, content|text}]}] ---------- */
function parseGeneric(json) {
  const arr = Array.isArray(json) ? json : json.conversations || json.chats || null;
  if (!Array.isArray(arr)) return null;
  const probe = arr[0];
  if (!probe || !Array.isArray(probe.messages)) return null;
  return arr.map((conv) => ({
    title: String(conv.title || conv.name || "Imported chat").slice(0, 80),
    messages: (conv.messages || [])
      .map((m) => {
        const rawRole = String(m.role || m.sender || "user").toLowerCase();
        const role = rawRole.includes("assist") || rawRole === "ai" || rawRole === "bot" ? "assistant" : "user";
        return msg(role, m.content || m.text || "", m.at || m.timestamp || Date.now());
      })
      .filter((m) => m.content.trim()),
    createdAt: conv.createdAt || conv.created_at || Date.now(),
  }));
}

function toSessions(parsed) {
  return parsed
    .filter((c) => c && c.messages && c.messages.length)
    .map((c) => ({
      id: uid(),
      title: c.title || "Imported chat",
      messages: c.messages,
      createdAt: c.createdAt || Date.now(),
      pinned: false,
      incognito: false,
      model: { ...DEFAULT_MODEL },
    }));
}

/* File (.zip) → session objects (hindi pa naka-save; caller ang mag-import). */
export async function importChatZip(file) {
  const buf = await file.arrayBuffer();
  const entries = readZipEntries(buf);
  const texts = entriesToText(await entries);

  // Unahin ang conversations.json (ChatGPT/Claude), tapos kahit anong .json
  const byName = (re) => texts.find((t) => re.test(t.name));
  const candidates = [
    byName(/conversations\.json$/i),
    byName(/\.json$/i),
    ...texts.filter((t) => /\.json$/i.test(t.name)),
  ].filter(Boolean);

  const tried = new Set();
  for (const c of candidates) {
    if (tried.has(c.name)) continue;
    tried.add(c.name);
    let json;
    try {
      json = JSON.parse(c.text);
    } catch {
      continue;
    }
    for (const parser of [parseChatGPT, parseClaude, parseGeneric]) {
      let parsed = null;
      try {
        parsed = parser(json);
      } catch {
        parsed = null;
      }
      if (parsed) {
        const sessions = toSessions(parsed);
        if (sessions.length) return { sessions, format: parser.name, file: c.name };
      }
    }
  }
  throw new Error("Walang nakitang chat export sa zip na ito");
}
