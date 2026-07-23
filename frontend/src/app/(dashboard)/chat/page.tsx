"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Bot, Loader2, Send, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

type ChatMessage = { _id?: string; role: "user" | "assistant"; message: string; referencedCarIds?: { _id: string; brand: string; model: string; year: number }[] };

function getSessionId() {
  let id = localStorage.getItem("chatSessionId");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("chatSessionId", id); }
  return id;
}

export default function ChatPage() {
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const id = getSessionId();
    setSessionId(id);
    api.get<ChatMessage[]>(`/chat/history/${id}`).then((response) => setMessages(response.data)).catch(() => setMessages([]));
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || !sessionId || sending) return;
    setMessages((previous) => [...previous, { role: "user", message: text }]);
    setMessage(""); setSending(true);
    try {
      const response = await api.post("/chat", { sessionId, message: text });
      setMessages((previous) => [...previous, { role: "assistant", message: response.data.message, referencedCarIds: response.data.referencedCars }]);
    } catch {
      setMessages((previous) => [...previous, { role: "assistant", message: "Maaf, layanan AI belum dapat dijangkau. Coba lagi sesaat lagi." }]);
    } finally { setSending(false); }
  };

  const clear = async () => {
    if (!sessionId) return;
    await api.delete(`/chat/history/${sessionId}`);
    const next = crypto.randomUUID(); localStorage.setItem("chatSessionId", next); setSessionId(next); setMessages([]);
  };

  return <section className="mx-auto flex h-[calc(100vh-9rem)] max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <header className="flex items-center justify-between bg-gradient-to-r from-blue-700 to-cyan-600 p-4 text-white"><div className="flex items-center gap-3"><Bot /><div><h2 className="font-bold">Chatbot AI Mobil</h2><p className="text-xs text-blue-100">Jawaban dibatasi pada data mobil katalog</p></div></div><button onClick={clear} className="flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm hover:bg-white/25"><Trash2 className="h-4 w-4" />Hapus riwayat</button></header>
    <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4">{messages.length === 0 && <p className="rounded-xl bg-white p-4 text-sm text-slate-500">Tanyakan rekomendasi, spesifikasi, atau perbandingan mobil dari katalog.</p>}{messages.map((item, index) => <article key={item._id || index} className={`max-w-[85%] rounded-2xl p-3 text-sm ${item.role === "user" ? "ml-auto bg-blue-600 text-white" : "bg-white text-slate-700 shadow-sm"}`}><p className="whitespace-pre-wrap">{item.message}</p>{item.role === "assistant" && item.referencedCarIds && item.referencedCarIds.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{item.referencedCarIds.map((car) => <Link key={car._id} href={`/cars/${car._id}`} className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">{car.brand} {car.model} ({car.year})</Link>)}</div>}</article>)}{sending && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />AI sedang mengetik...</div>}</div>
    <form onSubmit={submit} className="flex gap-2 border-t border-slate-200 p-3"><input value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000} placeholder="Contoh: MPV bensin untuk keluarga di bawah 300 juta" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm" /><button disabled={sending || !message.trim()} className="rounded-xl bg-blue-600 p-3 text-white disabled:opacity-50"><Send className="h-4 w-4" /></button></form>
  </section>;
}
