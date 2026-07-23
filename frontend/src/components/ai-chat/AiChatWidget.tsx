"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Bot, X, Minimize2, RefreshCw, Wifi, WifiOff } from "lucide-react";
import AiChatMessages, { Message } from "./AiChatMessages";
import AiChatInput from "./AiChatInput";
import { QUICK_REPLIES, WELCOME_MESSAGE } from "./systemPrompt";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const CSS_KEYFRAMES = `
@keyframes aiPulseRing {
  0%   { transform: scale(1);   opacity: 0.6; }
  70%  { transform: scale(1.45); opacity: 0; }
  100% { transform: scale(1.45); opacity: 0; }
}
@keyframes aiSlideUp {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)   scale(1); }
}
@keyframes aiMsgFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
`;

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("ai-chat-keyframes")) return;
  const style = document.createElement("style");
  style.id = "ai-chat-keyframes";
  style.textContent = CSS_KEYFRAMES;
  document.head.appendChild(style);
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function makeWelcome(): Message {
  return {
    id: makeId(),
    role: "assistant",
    content: WELCOME_MESSAGE,
    timestamp: new Date(),
  };
}

export default function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [hasNewMsg, setHasNewMsg] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      injectStyles();
      // Initialize or retrieve session ID
      let savedSessionId = localStorage.getItem("chatSessionId");
      if (!savedSessionId) {
        savedSessionId = makeId() + makeId();
        localStorage.setItem("chatSessionId", savedSessionId);
      }
      setSessionId(savedSessionId);
      setMessages([makeWelcome()]);
    }
  }, []);

  const open = () => {
    setIsOpen(true);
    setHasNewMsg(false);
  };
  const close = () => {
    setIsOpen(false);
  };

  const reset = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/chat/history/${sessionId}`);
      const newSessionId = makeId() + makeId();
      localStorage.setItem("chatSessionId", newSessionId);
      setSessionId(newSessionId);
      setMessages([makeWelcome()]);
    } catch (error) {
      console.error("Failed to reset history", error);
    }
  };

  const sendMessage = useCallback(
    async (text: string) => {
      if (isLoading) return;

      const userMsg: Message = {
        id: makeId(),
        role: "user",
        content: text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setIsOnline(true);

      const assistantId = makeId();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "...",
          timestamp: new Date(),
        },
      ]);

      try {
        const response = await axios.post(`${API_BASE_URL}/chat`, {
          sessionId,
          message: text,
        });

        setIsOnline(true);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: response.data.message } : m
          )
        );

        if (!isOpen) {
          setHasNewMsg(true);
        }
      } catch (err: any) {
        setIsOnline(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    "⚠️ Maaf, saya tidak dapat terhubung ke server. Pastikan layanan backend dan Ollama berjalan dengan baik.",
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, sessionId, isOpen]
  );

  const handleQuickReply = (text: string) => {
    const clean = text.replace(/^[^\w\u00C0-\u024F\u4E00-\u9FFF]+/, "").trim();
    sendMessage(clean);
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: "28px",
          right: "28px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "12px",
        }}
      >
        {!isOpen && (
          <div
            style={{
              background: "rgba(15,23,42,0.85)",
              color: "white",
              fontSize: "12px",
              fontWeight: 600,
              padding: "6px 12px",
              borderRadius: "20px",
              backdropFilter: "blur(8px)",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
              animation: "aiMsgFadeIn 0.3s ease-out",
            }}
          >
            💬 Atlas — Asisten Mobil
          </div>
        )}

        <div style={{ position: "relative" }}>
          {!isOpen && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "rgba(59,130,246,0.4)",
                animation: "aiPulseRing 2s ease-out infinite",
                pointerEvents: "none",
              }}
            />
          )}

          {hasNewMsg && !isOpen && (
            <div
              style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: "#ef4444",
                border: "2px solid white",
                zIndex: 1,
              }}
            />
          )}

          <button
            onClick={isOpen ? close : open}
            title={isOpen ? "Tutup chat" : "Buka chat AI"}
            style={{
              width: "58px",
              height: "58px",
              borderRadius: "50%",
              border: "none",
              cursor: "pointer",
              background: isOpen
                ? "linear-gradient(135deg, #475569, #334155)"
                : "linear-gradient(135deg, #3b82f6, #06b6d4)",
              boxShadow: isOpen
                ? "0 4px 20px rgba(71,85,105,0.5)"
                : "0 6px 24px rgba(59,130,246,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
              position: "relative",
              zIndex: 1,
            }}
          >
            {isOpen ? <X size={22} color="white" strokeWidth={2.5} /> : <Bot size={24} color="white" strokeWidth={2} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "100px",
            right: "28px",
            width: "min(400px, calc(100vw - 40px))",
            height: "min(560px, calc(100vh - 140px))",
            zIndex: 9998,
            display: "flex",
            flexDirection: "column",
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "0 25px 60px rgba(0,0,0,0.18), 0 8px 24px rgba(59,130,246,0.12)",
            animation: "aiSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)",
            background: "rgba(241,246,255,0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.7)",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1d4ed8, #0891b2)",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                border: "2px solid rgba(255,255,255,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Bot size={20} color="white" />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "white", fontWeight: 700, fontSize: "14px" }}>
                Atlas — Asisten Mobil
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
                {isOnline ? <Wifi size={10} color="rgba(255,255,255,0.8)" /> : <WifiOff size={10} color="#fca5a5" />}
                <span style={{ color: isOnline ? "rgba(255,255,255,0.8)" : "#fca5a5", fontSize: "11px" }}>
                  {isLoading ? "Sedang mencari data..." : isOnline ? "Online • Siap membantu" : "Koneksi terputus"}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={reset} title="Reset percakapan" style={{ background: "transparent", border: "none", cursor: "pointer" }}>
                <RefreshCw size={16} color="white" />
              </button>
              <button onClick={close} title="Tutup" style={{ background: "transparent", border: "none", cursor: "pointer" }}>
                <Minimize2 size={18} color="white" />
              </button>
            </div>
          </div>

          <AiChatMessages messages={messages} isLoading={isLoading} />

          {messages.length === 1 && (
            <div style={{ padding: "8px 16px", display: "flex", flexWrap: "wrap", gap: "6px", borderTop: "1px solid rgba(226,232,240,0.5)" }}>
              {QUICK_REPLIES.map((qr) => (
                <button
                  key={qr}
                  onClick={() => handleQuickReply(qr)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "20px",
                    border: "1px solid rgba(59,130,246,0.3)",
                    background: "white",
                    color: "#2563eb",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {qr}
                </button>
              ))}
            </div>
          )}

          <AiChatInput onSend={sendMessage} isLoading={isLoading} />
        </div>
      )}
    </>
  );
}
