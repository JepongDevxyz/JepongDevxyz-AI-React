/* MessageList.jsx — listahan ng messages + streaming message. */
import { useEffect, useRef } from "react";
import Message from "./Message.jsx";

export default function MessageList({ messages, streamingMessageId, streamingText, onReply, onDictate }) {
  const bottomRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, streamingText]);

  return (
    <div className="jd-chat__inner" ref={scrollRef}>
      {messages.map((m) => {
        if (m.id === streamingMessageId) {
          return (
            <Message
              key={m.id}
              message={{ ...m, content: streamingText || m.content }}
              isStreaming
              onReply={onReply}
              onDictate={onDictate}
            />
          );
        }
        return (
          <Message key={m.id} message={m} onReply={onReply} onDictate={onDictate} />
        );
      })}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}
