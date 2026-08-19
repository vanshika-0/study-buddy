"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, BookOpen, Send, Sparkles, X } from "lucide-react";
import { apiUrl } from "@/lib/api";

const API = apiUrl("");
const SUGGESTIONS = ["Explain this concept", "Solve this problem", "Help me revise"];
const welcome = { id: "welcome", role: "assistant", text: "Hi! I’m Study Buddy 🤓 Ask me about a subject, concept, problem, or study plan.", time: "" };
const timeLabel = () => new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(new Date());

export default function StudyBuddyChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([welcome]);
  const endRef = useRef(null);

  useEffect(() => {
    const applySavedAppearance = () => {
      document.documentElement.dataset.theme = localStorage.getItem("study-theme") || "blossom";
      document.documentElement.dataset.mode = localStorage.getItem("study-dark-mode") === "true" ? "dark" : "light";
    };
    applySavedAppearance();
    window.addEventListener("appearance-changed", applySavedAppearance);
    return () => window.removeEventListener("appearance-changed", applySavedAppearance);
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async (value = input) => {
    const text = value.trim();
    if (!text || loading) return;
    const userMessage = { id: `${Date.now()}-user`, role: "user", text, time: timeLabel() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: localStorage.getItem("email"),
          messages: nextMessages.filter((message) => message.id !== "welcome").map(({ role, text: content }) => ({ role, content })),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.detail || payload.error || `Request failed (${response.status})`);
      if (!payload.answer) throw new Error("The AI returned no answer.");
      setMessages((items) => [...items, { id: `${Date.now()}-assistant`, role: "assistant", text: payload.answer, time: timeLabel() }]);
    } catch (error) {
      setMessages((items) => [...items, { id: `${Date.now()}-error`, role: "assistant", text: `Sorry, I couldn’t reach Study Buddy: ${error.message}`, time: timeLabel(), error: true }]);
    } finally {
      setLoading(false);
    }
  };

  return <><button onClick={() => setOpen((value) => !value)} aria-label={open ? "Close Study Buddy" : "Open Study Buddy"} className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-xl shadow-purple-300/50 transition hover:scale-105">{open ? <X size={23} /> : <Bot size={25} />}</button>{open && <section className="study-chat fixed bottom-24 right-5 z-[60] flex h-[min(34rem,calc(100vh-8rem))] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-2xl shadow-purple-300/30"><header className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 text-white"><div className="flex items-center gap-3"><span className="rounded-2xl bg-white/20 p-2"><Sparkles size={19} /></span><div><h2 className="font-bold">Study Buddy AI</h2><p className="text-xs text-white/80">Here to make learning feel lighter</p></div></div></header><div className="flex-1 space-y-3 overflow-y-auto bg-pink-50/60 p-4">{messages.map((message) => <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${message.role === "user" ? "rounded-br-md bg-purple-600 text-white" : `rounded-bl-md bg-white text-gray-700 shadow-sm ${message.error ? "border border-rose-200 text-rose-600" : ""}`}`}><p className="whitespace-pre-wrap">{message.text}</p>{message.id !== "welcome" && <time className={`mt-1 block text-[10px] ${message.role === "user" ? "text-white/65" : "text-gray-400"}`}>{message.time}</time>}</div></div>)}{loading && <div className="flex items-center gap-1 text-purple-500"><span className="rounded-2xl bg-white px-4 py-3 shadow-sm"><i className="chat-dot" /> <i className="chat-dot" /> <i className="chat-dot" /></span></div>}<div ref={endRef} /></div>{messages.length === 1 && <div className="flex gap-2 overflow-x-auto border-t border-pink-100 bg-white px-3 py-2">{SUGGESTIONS.map((suggestion) => <button key={suggestion} onClick={() => send(suggestion)} className="shrink-0 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-600 hover:bg-purple-100">{suggestion}</button>)}</div>}<form onSubmit={(event) => { event.preventDefault(); send(); }} className="flex items-center gap-2 border-t border-pink-100 bg-white p-3"><BookOpen size={17} className="text-purple-400" /><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask a study question..." disabled={loading} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 disabled:opacity-60" /><button type="submit" aria-label="Send message" disabled={loading} className="rounded-xl bg-purple-600 p-2 text-white transition hover:bg-purple-700 disabled:opacity-50"><Send size={16} /></button></form></section>}</>;
}
