/* ChatContext — sessions, messages, SSE streaming, marker results.
   Persist sa localStorage (incognito sessions HINDI naka-save). */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { streamChat } from "../api/chat.js";
import { prepareAttachments } from "../api/uploads.js";
import { registerChatFiles } from "../components/capabilities/vfs.js";
import { DEFAULT_MODEL, modelLabel } from "../api/models.js";

const ChatContext = createContext(null);

const LS_SESSIONS = "jai_sessions_v1";
const LS_ACTIVE = "jai_active_session_v1";
const LS_MODEL = "jai_model_v1";
const LS_EFFORT = "jai_effort_v1";

function uid() {
  try {
    return crypto.randomUUID();
  } catch {
    return `m-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}

function emptySession(overrides = {}) {
  return {
    id: uid(),
    title: "Bagong chat",
    messages: [],
    createdAt: Date.now(),
    pinned: false,
    incognito: false,
    model: { ...DEFAULT_MODEL },
    ...overrides,
  };
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function sessionTitleFrom(text) {
  const t = String(text || "").trim().replace(/\s+/g, " ");
  if (!t) return "Bagong chat";
  return t.length > 42 ? t.slice(0, 42) + "…" : t;
}

export function ChatProvider({ children }) {
  const [sessions, setSessions] = useState(() => {
    const saved = readJson(LS_SESSIONS, []);
    const list = Array.isArray(saved) ? saved.filter((s) => s && !s.incognito) : [];
    return list.length ? list : [emptySession()];
  });
  const [activeSessionId, setActiveSessionId] = useState(() => {
    const id = readJson(LS_ACTIVE, null);
    return typeof id === "string" ? id : null;
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  const [activityStatus, setActivityStatus] = useState(null); // {label, state, kind}
  const [activitySteps, setActivitySteps] = useState([]); // thoughts sheet
  const [effort, setEffort] = useState(() => readJson(LS_EFFORT, "medium"));
  const [pureMode, setPureMode] = useState(false);
  const [instantMode, setInstantMode] = useState(false);
  const [chatMode, setChatMode] = useState("ask"); // ask | imagine | build
  const [incognito, setIncognito] = useState(false);
  const abortRef = useRef(null);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) || sessions[0] || null,
    [sessions, activeSessionId]
  );
  const messages = activeSession?.messages || [];
  const activeModel = activeSession?.model || { ...DEFAULT_MODEL };

  /* ---------- persistence (incognito sessions excluded) ---------- */
  useEffect(() => {
    try {
      const savable = sessions.filter((s) => !s.incognito);
      localStorage.setItem(LS_SESSIONS, JSON.stringify(savable.slice(0, 100)));
      if (activeSession && !activeSession.incognito) {
        localStorage.setItem(LS_ACTIVE, JSON.stringify(activeSession.id));
      }
    } catch {
      /* storage unavailable */
    }
  }, [sessions, activeSession]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_EFFORT, JSON.stringify(effort));
    } catch {
      /* ignore */
    }
  }, [effort]);

  const patchSession = useCallback((id, patch) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  }, []);

  const patchMessage = useCallback((sessionId, messageId, patch) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          messages: s.messages.map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
        };
      })
    );
  }, []);

  const addMarkerToMessage = useCallback(
    (sessionId, messageId, marker) => {
      if (!marker || marker.type === "session-title") return;
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s;
          return {
            ...s,
            messages: s.messages.map((m) =>
              m.id === messageId
                ? { ...m, markers: [...(m.markers || []), marker] }
                : m
            ),
          };
        })
      );
    },
    []
  );

  /* ---------- session ops ---------- */
  const newSession = useCallback(
    (opts = {}) => {
      const s = emptySession({
        incognito: !!opts.incognito || incognito,
        model: opts.model || activeModel,
      });
      setSessions((prev) => [s, ...prev]);
      setActiveSessionId(s.id);
      return s.id;
    },
    [incognito, activeModel]
  );

  const renameSession = useCallback(
    (id, title) => {
      const t = String(title || "").trim();
      if (!t) return;
      patchSession(id, { title: t.slice(0, 80) });
    },
    [patchSession]
  );

  const pinSession = useCallback(
    (id) => {
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s))
      );
    },
    []
  );

  const deleteSession = useCallback(
    (id) => {
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        return next.length ? next : [emptySession()];
      });
      setActiveSessionId((cur) => {
        if (cur !== id) return cur;
        return null; // babalik sa sessions[0] via activeSession memo
      });
    },
    []
  );

  const clearSession = useCallback(
    (id) => {
      const sid = id || activeSessionId;
      if (!sid) return;
      patchSession(sid, { messages: [], title: "Bagong chat" });
    },
    [activeSessionId, patchSession]
  );

  /* Import mula sa .zip (ChatGPT/Claude/Gemini/Meta AI) — Phase 3 */
  const importSessions = useCallback((list) => {
    const cleaned = (Array.isArray(list) ? list : [])
      .filter((s) => s && Array.isArray(s.messages) && s.messages.length)
      .map((s) => ({
        ...emptySession(),
        ...s,
        id: typeof s.id === "string" && s.id ? s.id : uid(),
        incognito: false,
        model: s.model || { ...DEFAULT_MODEL },
      }));
    if (!cleaned.length) return 0;
    setSessions((prev) => [...cleaned, ...prev]);
    setActiveSessionId(cleaned[0].id);
    return cleaned.length;
  }, []);

  const setSessionModel = useCallback(
    (provider, modelId) => {
      const sid = activeSessionId || sessions[0]?.id;
      if (!sid) return;
      patchSession(sid, { model: { provider, id: modelId } });
      try {
        localStorage.setItem(LS_MODEL, JSON.stringify({ provider, id: modelId }));
      } catch {
        /* ignore */
      }
    },
    [activeSessionId, sessions, patchSession]
  );

  /* ---------- streaming ---------- */
  const stopStream = useCallback(() => {
    try {
      abortRef.current?.abort();
    } catch {
      /* ignore */
    }
  }, []);

  const sendMessage = useCallback(
    async (text, opts = {}) => {
      const content = String(text || "").trim();
      if (!content || isStreaming) return null;

      const rawAtts = Array.isArray(opts.attachments) ? opts.attachments : [];
      // Phase 5: subukang i-upload via presigned URL (/api/uploads);
      // tahimik na fallback sa base64-local kapag walang backend.
      let atts = rawAtts;
      try {
        atts = await prepareAttachments(rawAtts);
      } catch {
        atts = rawAtts;
      }
      // Text attachments → virtual FS para sa FileEditor "Edit" action sa chat.
      try {
        registerChatFiles(rawAtts);
      } catch {
        /* hindi kritikal */
      }
      const useIncognito = opts.incognito ?? incognito;
      const useModel = opts.model || activeModel;
      const useEffort = instantMode ? "low" : opts.effort || effort;
      const useMode = opts.mode || chatMode;

      // Siguraduhing may active session — puwedeng i-override via opts.sessionId
      // (hal. "jd:goal-chat" mula sa Goals: bagong session + goal context prompt)
      let sid = opts.sessionId || activeSessionId || sessions[0]?.id;
      if (!sid) {
        const s = emptySession({ incognito: useIncognito, model: useModel });
        setSessions([s]);
        setActiveSessionId(s.id);
        sid = s.id;
      }
      // Incognito toggle mid-session → bagong session
      const cur = sessions.find((s) => s.id === sid);
      if (cur && cur.incognito !== useIncognito && cur.messages.length === 0) {
        patchSession(sid, { incognito: useIncognito });
      } else if (cur && cur.incognito !== useIncognito) {
        const s = emptySession({ incognito: useIncognito, model: useModel });
        setSessions((prev) => [s, ...prev]);
        setActiveSessionId(s.id);
        sid = s.id;
      }

      const userMsg = {
        id: uid(),
        role: "user",
        content,
        attachments: atts.map((a) => ({ name: a.name, mimeType: a.mimeType })),
        at: Date.now(),
      };
      const asstMsg = {
        id: uid(),
        role: "assistant",
        content: "",
        streaming: true,
        markers: [],
        model: { ...useModel },
        at: Date.now(),
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sid) return s;
          const title =
            s.messages.length === 0 ? sessionTitleFrom(content) : s.title;
          return { ...s, title, messages: [...s.messages, userMsg, asstMsg] };
        })
      );

      setIsStreaming(true);
      setStreamingText("");
      setStreamingMessageId(asstMsg.id);
      setActivityStatus({ label: "Nag-iisip…", state: "running", kind: "generate" });
      setActivitySteps([]);

      const controller = new AbortController();
      abortRef.current = controller;

      const historyForApi = (sessions.find((s) => s.id === sid)?.messages || [])
        .filter((m) => !m.streaming)
        .map((m) => ({ role: m.role, content: m.content }))
        .concat([{ role: "user", content }]);

      let acc = "";
      let aborted = false;

      try {
        const result = await streamChat({
          messages: historyForApi,
          model: useModel.id,
          provider: useModel.provider,
          effort: useEffort,
          mode: useMode,
          incognito: useIncognito,
          attachments: atts,
          webSearch: !!opts.webSearch,
          pureMode: pureMode || instantMode,
          signal: controller.signal,
          onToken: (chunk) => {
            acc += chunk;
            setStreamingText(acc);
          },
          onActivity: (a) => {
            if (!a) return;
            const label = String(a.label || "Nag-iisip…");
            setActivityStatus({ label, state: a.state || "running", kind: a.kind || "" });
            setActivitySteps((prev) => {
              const step = {
                id: String(a.id || `step-${prev.length}`),
                label,
                state: a.state || "running",
                kind: a.kind || "",
                at: a.at || Date.now(),
              };
              const idx = prev.findIndex((p) => p.id === step.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = step;
                return next;
              }
              return [...prev.slice(-29), step];
            });
          },
          onMarker: (marker) => {
            if (!marker) return;
            if (marker.type === "session-title") {
              const t = marker.payload?.title;
              if (t) patchSession(sid, { title: String(t).slice(0, 80) });
              return;
            }
            addMarkerToMessage(sid, asstMsg.id, marker);
          },
          onDone: () => {
            /* finalized sa finally */
          },
          onError: (err) => {
            const msg = err?.message || "Nagkaproblema. Subukan ulit.";
            acc = acc ? `${acc}\n\n⚠️ ${msg}` : `⚠️ ${msg}`;
            setStreamingText(acc);
          },
        });
        aborted = !!result?.aborted;
      } finally {
        const finalText = acc;
        patchMessage(sid, asstMsg.id, {
          content: finalText,
          streaming: false,
          stopped: aborted || undefined,
        });
        setIsStreaming(false);
        setStreamingText("");
        setStreamingMessageId(null);
        setActivityStatus(null);
        abortRef.current = null;
      }
      return asstMsg.id;
    },
    [
      isStreaming,
      incognito,
      activeModel,
      effort,
      chatMode,
      pureMode,
      instantMode,
      activeSessionId,
      sessions,
      patchSession,
      patchMessage,
      addMarkerToMessage,
    ]
  );

  /* Kapag nagpalit ng active session habang nag-stream, itigil ang stream */
  const selectSession = useCallback(
    (id) => {
      if (isStreaming) stopStream();
      setActiveSessionId(id);
    },
    [isStreaming, stopStream]
  );

  const value = useMemo(
    () => ({
      sessions,
      activeSession,
      activeSessionId: activeSession?.id || null,
      messages,
      activeModel,
      modelDisplayName: modelLabel(activeModel.provider, activeModel.id),
      isStreaming,
      streamingText,
      streamingMessageId,
      activityStatus,
      activitySteps,
      effort,
      setEffort,
      pureMode,
      setPureMode,
      instantMode,
      setInstantMode,
      chatMode,
      setChatMode,
      incognito,
      setIncognito,
      sendMessage,
      stopStream,
      newSession,
      selectSession,
      renameSession,
      pinSession,
      deleteSession,
      clearSession,
      importSessions,
      setSessionModel,
    }),
    [
      sessions,
      activeSession,
      messages,
      activeModel,
      isStreaming,
      streamingText,
      streamingMessageId,
      activityStatus,
      activitySteps,
      effort,
      pureMode,
      instantMode,
      chatMode,
      incognito,
      sendMessage,
      stopStream,
      newSession,
      selectSession,
      renameSession,
      pinSession,
      deleteSession,
      clearSession,
      importSessions,
      setSessionModel,
    ]
  );

  // Tandaan ang huling ginamit na model (para sa bagong sessions)
  useEffect(() => {
    const saved = readJson(LS_MODEL, null);
    if (saved?.provider && saved?.id) {
      setSessions((prev) =>
        prev.map((s) =>
          s.messages.length === 0
            ? { ...s, model: { provider: saved.provider, id: saved.id } }
            : s
        )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within <ChatProvider>");
  return ctx;
}
