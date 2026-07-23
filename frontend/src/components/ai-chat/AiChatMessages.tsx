"use client";

import { useEffect, useRef } from "react";
import { Bot, User } from "lucide-react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Props {
  messages: Message[];
  isLoading: boolean;
}

/** Render teks markdown sederhana: **bold** dan baris baru */
function renderContent(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    // Pecah baris baru
    return part.split("\n").map((line, j, arr) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </span>
    ));
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default function AiChatMessages({ messages, isLoading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div
      className="ai-chat-messages"
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        scrollbarWidth: "thin",
        scrollbarColor: "#cbd5e1 transparent",
      }}
    >
      {messages.map((msg) => (
        <div
          key={msg.id}
          style={{
            display: "flex",
            flexDirection: msg.role === "user" ? "row-reverse" : "row",
            alignItems: "flex-end",
            gap: "8px",
            animation: "aiMsgFadeIn 0.25s ease-out",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                msg.role === "assistant"
                  ? "linear-gradient(135deg, #3b82f6, #06b6d4)"
                  : "linear-gradient(135deg, #8b5cf6, #ec4899)",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            }}
          >
            {msg.role === "assistant" ? (
              <Bot size={14} color="white" />
            ) : (
              <User size={14} color="white" />
            )}
          </div>

          {/* Bubble + timestamp */}
          <div
            style={{
              maxWidth: "78%",
              display: "flex",
              flexDirection: "column",
              alignItems: msg.role === "user" ? "flex-end" : "flex-start",
              gap: "3px",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderRadius:
                  msg.role === "user"
                    ? "18px 18px 4px 18px"
                    : "18px 18px 18px 4px",
                background:
                  msg.role === "user"
                    ? "linear-gradient(135deg, #3b82f6, #06b6d4)"
                    : "rgba(255,255,255,0.9)",
                color: msg.role === "user" ? "white" : "#1e293b",
                fontSize: "13.5px",
                lineHeight: "1.55",
                boxShadow:
                  msg.role === "user"
                    ? "0 2px 12px rgba(59,130,246,0.35)"
                    : "0 2px 8px rgba(0,0,0,0.08)",
                border:
                  msg.role === "assistant"
                    ? "1px solid rgba(226,232,240,0.8)"
                    : "none",
                backdropFilter: "blur(8px)",
                wordBreak: "break-word",
              }}
            >
              {renderContent(msg.content)}
            </div>
            <span style={{ fontSize: "10px", color: "#94a3b8", paddingInline: "4px" }}>
              {formatTime(msg.timestamp)}
            </span>
          </div>
        </div>
      ))}

      {/* Typing indicator */}
      {isLoading && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "8px",
            animation: "aiMsgFadeIn 0.25s ease-out",
          }}
        >
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            }}
          >
            <Bot size={14} color="white" />
          </div>
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "18px 18px 18px 4px",
              background: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(226,232,240,0.8)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#94a3b8",
                  display: "inline-block",
                  animation: `aiTypingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
