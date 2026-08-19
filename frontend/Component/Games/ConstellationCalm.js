"use client";
import { useState } from "react";
import { RotateCcw } from "lucide-react";

const NAMES = [
  "The Calm Mind",
  "The Dreamer",
  "The Night Owl",
  "The Peaceful Path",
];
export default function ConstellationCalm({ onResume }) {
  const stars = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: 8 + ((i * 37) % 84),
    y: 8 + ((i * 53) % 80),
  }));
  const [selected, setSelected] = useState([]),
    [name, setName] = useState("");
  const complete = selected.length >= 6;
  const choose = (id) => {
    if (!selected.includes(id) && !complete)
      setSelected((items) => [...items, id]);
  };
  const reset = () => {
    setSelected([]);
    setName("");
  };
  return (
    <section className="rounded-3xl border border-indigo-300/30 bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 p-5 text-white shadow-lg shadow-indigo-200/30">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-3xl">🌌</span>
          <h2 className="mt-2 text-xl font-bold">Constellation Calm</h2>
          <p className="mt-1 text-sm text-indigo-200">
            Connect a few stars and let your thoughts settle.
          </p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-indigo-100">
          1–2 min
        </span>
      </div>
      <div className="relative mt-4 h-64 overflow-hidden rounded-2xl bg-black/30">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          {selected.slice(1).map((id, i) => {
            const a = stars[selected[i]],
              b = stars[id];
            return (
              <line
                key={`${a.id}-${b.id}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#c4b5fd"
                strokeWidth=".45"
              />
            );
          })}
          {stars.map((star) => (
            <circle
              key={star.id}
              cx={star.x}
              cy={star.y}
              r={selected.includes(star.id) ? 1.7 : 1}
              fill={selected.includes(star.id) ? "#fef08a" : "#c4b5fd"}
              className="cursor-pointer transition-all hover:r-[1.8]"
              onClick={() => choose(star.id)}
            />
          ))}
        </svg>
        {complete && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-950/75 text-center backdrop-blur-sm">
            <span className="text-3xl">✨</span>
            <p className="mt-2 font-bold">You Created a Constellation!</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                NAMES[selected.reduce((a, b) => a + b, 0) % NAMES.length]
              }
              className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-center text-xs text-white outline-none placeholder:text-indigo-200"
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={reset}
                className="rounded-xl bg-white/10 px-3 py-2 text-xs"
              >
                <RotateCcw size={13} className="mr-1 inline" />
                Another
              </button>
              <button
                onClick={onResume}
                className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-indigo-900"
              >
                Resume Focus
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="mt-3 text-center text-xs text-indigo-200">
        {complete
          ? `Name it ${name || NAMES[selected.reduce((a, b) => a + b, 0) % NAMES.length]}`
          : `${selected.length}/6 stars connected`}
      </p>
    </section>
  );
}
