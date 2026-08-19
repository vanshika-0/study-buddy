'use client'
import React, { useState, useEffect, useRef } from "react";
import { Plus, X, Search, Trash2, Pin, Heart, Sparkles } from "lucide-react";
import { apiUrl } from "@/lib/api";

const FONT_HEADING = "'Baloo 2', ui-rounded, 'Segoe UI', sans-serif";
const FONT_BODY = "'Quicksand', ui-rounded, 'Segoe UI', sans-serif";

const PALETTE = [
  { key: "pink", bg: "#FFE3F1", border: "#FFB8DD", dot: "#FF7AC6" },
  { key: "lavender", bg: "#EFE3FF", border: "#D3B8FF", dot: "#B07CFF" },
  { key: "mint", bg: "#DFFBF0", border: "#A7EFD1", dot: "#3FCF8E" },
  { key: "yellow", bg: "#FFF6D9", border: "#FFE494", dot: "#F7C948" },
  { key: "peach", bg: "#FFE8E0", border: "#FFC2AE", dot: "#FF8A65" },
];

// Point this at your FastAPI backend
const NOTES_URL = apiUrl("/api/notes");


function hashRotate(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1000;
  return (h % 7) - 3;
}

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return min + "m ago";
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr + "h ago";
  return Math.floor(hr / 24) + "d ago";
}

function GoogleFonts() {
  useEffect(() => {
    if (document.getElementById("chotu-fonts")) return;
    const link = document.createElement("link");
    link.id = "chotu-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700&family=Quicksand:wght@400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);
  return null;
}

export default function ChotuNotes() {
  const [notes, setNotes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [saveState, setSaveState] = useState("idle");
  const [loadError, setLoadError] = useState("");
  const saveTimers = useRef({});


  // Load notes from MongoDB (via FastAPI) on mount
  useEffect(() => {
  let cancelled = false;
  async function loadNotes() {
    const email = localStorage.getItem("email");
     if(!email){
    setLoadError("Please log in to view your notes.");
    setLoaded(true);
    return;
  }

    try {
     const email = localStorage.getItem("email");
const controller = new AbortController();
const timeout = window.setTimeout(() => controller.abort(), 8000);
const res = await fetch(`${NOTES_URL}?email=${encodeURIComponent(email)}`, { signal: controller.signal });
window.clearTimeout(timeout);

if (!res.ok) throw new Error("Failed to fetch notes");

const data = await res.json();
if (cancelled) return;
setNotes((data.notes || []).map((note, index) => ({
  id: note.id || `legacy-${index}`,
  text: typeof note.text === "string" ? note.text : "",
  color: note.color || PALETTE[index % PALETTE.length].key,
  pinned: Boolean(note.pinned),
  createdAt: note.createdAt ? new Date(note.createdAt).getTime() : Date.now(),
})));
setLoadError("");
    } catch (e) {
      if (cancelled) return;
      console.error("Could not load notes:", e);
      setNotes([]);
      setLoadError(e.name === "AbortError" ? "Notes service took too long to respond. Please start the backend and try again." : "Could not load notes. Please check that the backend is running and try again.");
    }

    if (!cancelled) setLoaded(true);
  }

  loadNotes();
  return () => { cancelled = true };
}, []);


 async function addNote() {
  const email = localStorage.getItem("email");
  if(!email){
    alert("Please login first!");
    return;
  }

  try {
    const res = await fetch(NOTES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        text: "",
        color: PALETTE[notes.length % PALETTE.length].key,
        pinned: false,
      }),
    });

    if (!res.ok) throw new Error("Failed to add note");

    const newNote = await res.json();

    setNotes((prev) => [newNote, ...prev]);
  } catch (e) {
    console.error("Could not add note:", e);
  }
}

  // Debounced PUT to backend for a given note id + partial update
  function pushUpdate(id, patch) {
    setSaveState("saving");
    if (saveTimers.current[id]) clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(async () => {
      try {
        const res = await fetch(`${NOTES_URL}/${id}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(patch),
});

if (!res.ok) throw new Error("Failed to update note");
        setSaveState("saved");
      } catch (e) {
        console.error("Could not save note:", e);
        setSaveState("error");
      }
    }, 500);
  }

  function updateText(id, text) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)));
    pushUpdate(id, { text });
  }

  function updateColor(id, color) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, color } : n)));
    pushUpdate(id, { color });
  }

  function togglePin(id) {
    const note = notes.find((n) => n.id === id);
    const pinned = !note?.pinned;
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned } : n)));
    pushUpdate(id, { pinned });
  }

 async function deleteNote(id) {
  setNotes((prev) => prev.filter((n) => n.id !== id));

  try {
    const res = await fetch(`${NOTES_URL}/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Failed to delete note");
    }
  } catch (e) {
    console.error("Could not delete note:", e);
  }
}

  const filtered = notes.filter((n) =>
    (n.text || "").toLowerCase().includes(query.toLowerCase())
  );
  const pinned = filtered.filter((n) => n.pinned);
  const rest = filtered.filter((n) => !n.pinned);
  const ordered = [...pinned, ...rest];

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: "#FFF6FB", fontFamily: FONT_BODY }}
    >
      <GoogleFonts />

      {/* Header */}
      <header className="px-5 sm:px-10 pt-8 pb-4 sticky top-0 z-20 bg-[#FFF6FB]/90 backdrop-blur">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#FF7AC6]" fill="#FF7AC6" strokeWidth={0} />
            <h1
              className="text-[26px] text-[#4A2545]"
              style={{ fontFamily: FONT_HEADING, fontWeight: 700 }}
            >
              chotu chotu notes
            </h1>
            <Sparkles className="w-4 h-4 text-[#F7C948]" />
          </div>
          <p className="text-sm text-[#9C7B98] mt-1 ml-7">
            {notes.length} {notes.length === 1 ? "note" : "notes"} saved · little thoughts, safely kept
          </p>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-[#C79BC4] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="find a note..."
                className="w-full h-11 pl-10 pr-4 rounded-2xl bg-white border-2 border-[#FFD9EE] text-sm text-[#4A2545] placeholder-[#C79BC4] outline-none focus:border-[#FF7AC6] transition-colors"
                style={{ fontFamily: FONT_BODY }}
              />
            </div>
            <button
              onClick={addNote}
              className="h-11 px-5 rounded-2xl bg-[#FF7AC6] hover:bg-[#F7649F] text-white text-sm shrink-0 flex items-center gap-1.5 shadow-[0_4px_14px_rgba(255,122,198,0.45)] active:scale-95 transition-all"
              style={{ fontFamily: FONT_HEADING, fontWeight: 600 }}
            >
              <Plus className="w-4 h-4" strokeWidth={3} />
              new note
            </button>
          </div>
        </div>
      </header>

      {/* Notes grid */}
      <main className="px-5 sm:px-10 pb-24 pt-2 max-w-5xl mx-auto">
        {!loaded && <div className="rounded-2xl bg-white p-6 text-center text-sm text-[#9C7B98]">Loading your notes...</div>}
        {loadError && <div className="mb-4 rounded-2xl border border-pink-200 bg-white p-4 text-sm text-[#9C527D]">{loadError}</div>}
        {ordered.length === 0 && loaded && (
          <div className="text-center py-24">
            <p className="text-4xl mb-2">(´｡• ᵕ •｡`)</p>
            <p
              className="text-lg text-[#4A2545]"
              style={{ fontFamily: FONT_HEADING, fontWeight: 600 }}
            >
              {query ? "no notes match that" : "no notes yet"}
            </p>
            <p className="text-sm text-[#B698B3] mt-1">
              {query ? "try a different search" : "tap \u201cnew note\u201d to add your first one"}
            </p>
          </div>
        )}

        <div
          style={{
            columnCount: 1,
            columnGap: "1rem",
          }}
          className="sm:[column-count:2] lg:[column-count:3]"
        >
          {ordered.map((note) => {
            const c = PALETTE.find((p) => p.key === note.color) || PALETTE[0];
            const rot = hashRotate(note.id);
            return (
              <div
                key={note.id}
                className="break-inside-avoid mb-4 rounded-2xl p-4 group relative transition-transform hover:-translate-y-0.5 hover:rotate-0"
                style={{
                  background: c.bg,
                  border: "2px solid " + c.border,
                  transform: "rotate(" + rot + "deg)",
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    {PALETTE.map((p) => (
                      <button
                        key={p.key}
                        onClick={() => updateColor(note.id, p.key)}
                        aria-label={"set color " + p.key}
                        className="w-3.5 h-3.5 rounded-full transition-transform hover:scale-125"
                        style={{
                          background: p.dot,
                          outline: p.key === note.color ? "2px solid " + p.dot : "none",
                          outlineOffset: "2px",
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => togglePin(note.id)}
                      aria-label="pin note"
                      className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/5"
                    >
                      <Pin
                        className="w-3.5 h-3.5"
                        style={{ color: note.pinned ? c.dot : "#B698B3" }}
                        fill={note.pinned ? c.dot : "none"}
                        strokeWidth={2}
                      />
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      aria-label="delete note"
                      className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/5"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#B698B3]" strokeWidth={2} />
                    </button>
                  </div>
                </div>

                <textarea
                  id={"ta-" + note.id}
                  value={note.text}
                  onChange={(e) => updateText(note.id, e.target.value)}
                  placeholder="write something cute..."
                  rows={3}
                  className="w-full bg-transparent resize-none outline-none text-[#4A2545] text-[15px] placeholder-[#C79BC4]/70 leading-relaxed"
                  style={{ fontFamily: FONT_BODY, fontWeight: 500 }}
                />

                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] text-[#B698B3]">{timeAgo(note.createdAt)}</span>
                  {note.pinned && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{ background: c.border, color: "#4A2545" }}
                    >
                      pinned
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* floating add button, mobile */}
      <button
        onClick={addNote}
        aria-label="add note"
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#FF7AC6] text-white flex items-center justify-center shadow-[0_6px_18px_rgba(255,122,198,0.55)] active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6" strokeWidth={3} />
      </button>

      {loaded && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 sm:bottom-6 text-[11px] text-[#C79BC4]">
          {saveState === "saving" ? "saving..." : saveState === "saved" ? "all notes saved ✓" : ""}
        </div>
      )}
    </div>
  );
}
