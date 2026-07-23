"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface Props {
  onSend: (text: string) => void;
  isLoading: boolean;
}

export default function AiChatInput({ onSend, isLoading }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
    // Reset tinggi textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const canSend = value.trim().length > 0 && !isLoading;

  return (
    <div
      style={{
        padding: "12px 16px",
        borderTop: "1px solid rgba(226,232,240,0.7)",
        background: "rgba(248,250,252,0.9)",
        backdropFilter: "blur(8px)",
        borderRadius: "0 0 20px 20px",
        display: "flex",
        alignItems: "flex-end",
        gap: "10px",
      }}
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        disabled={isLoading}
        placeholder="Ketik pesan... (Enter untuk kirim)"
        style={{
          flex: 1,
          resize: "none",
          border: "1.5px solid",
          borderColor: canSend ? "#3b82f6" : "rgba(203,213,225,0.8)",
          borderRadius: "14px",
          padding: "10px 14px",
          fontSize: "13.5px",
          lineHeight: "1.5",
          background: "white",
          color: "#1e293b",
          transition: "border-color 0.2s, box-shadow 0.2s",
          boxShadow: canSend ? "0 0 0 3px rgba(59,130,246,0.12)" : "none",
          maxHeight: "120px",
          overflowY: "auto",
          fontFamily: "inherit",
          outline: "none",
          cursor: isLoading ? "not-allowed" : "text",
          opacity: isLoading ? 0.6 : 1,
        }}
      />

      <button
        onClick={handleSend}
        disabled={!canSend}
        title="Kirim pesan"
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          border: "none",
          cursor: canSend ? "pointer" : "not-allowed",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: canSend
            ? "linear-gradient(135deg, #3b82f6, #06b6d4)"
            : "rgba(203,213,225,0.5)",
          boxShadow: canSend ? "0 4px 12px rgba(59,130,246,0.4)" : "none",
          transition: "all 0.2s ease",
          transform: canSend ? "scale(1)" : "scale(0.9)",
        }}
        onMouseEnter={(e) => {
          if (canSend) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
        }}
        onMouseLeave={(e) => {
          if (canSend) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        }}
      >
        <Send size={16} color={canSend ? "white" : "#94a3b8"} strokeWidth={2.5} />
      </button>
    </div>
  );
}
