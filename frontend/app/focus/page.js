"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { apiUrl } from "@/lib/api";
import {
  ArrowLeft,
  Check,
  ImagePlus,
  Pause,
  Play,
  Settings2,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

const scenes = {
  Rain: ["#0f172a", "#164e63"],
  Blue: ["#1d4ed8", "#38bdf8"],
  Forest: ["#052e16", "#134e4a"],
  Cafe: ["#451a03", "#78350f"],
  Night: ["#111827", "#312e81"],
  Fireplace: ["#450a0a", "#c2410c"],
  Ocean: ["#083344", "#1e3a8a"],
};
const sceneVisuals = {
  Rain: "radial-gradient(circle at 70% 20%, rgba(125,211,252,.28), transparent 28%), linear-gradient(135deg,#07111f 0%,#164e63 52%,#0f172a 100%)",
  Blue: "radial-gradient(circle at 50% 20%, rgba(186,230,253,.8), transparent 23%), linear-gradient(145deg,#172554 0%,#2563eb 50%,#0e7490 100%)",
  Forest: "radial-gradient(circle at 25% 20%, rgba(74,222,128,.32), transparent 25%), linear-gradient(135deg,#032617 0%,#115e59 55%,#052e16 100%)",
  Cafe: "radial-gradient(circle at 70% 25%, rgba(253,186,116,.38), transparent 24%), linear-gradient(135deg,#271106 0%,#92400e 55%,#451a03 100%)",
  Night: "radial-gradient(circle at 52% 18%, rgba(129,140,248,.5), transparent 22%), linear-gradient(135deg,#090b18 0%,#312e81 58%,#111827 100%)",
  Fireplace: "radial-gradient(circle at 52% 55%, rgba(251,146,60,.65), transparent 20%), linear-gradient(135deg,#2b0707 0%,#9a3412 58%,#450a0a 100%)",
  Ocean: "radial-gradient(circle at 60% 18%, rgba(103,232,249,.4), transparent 25%), linear-gradient(145deg,#042f3d 0%,#0369a1 52%,#1e3a8a 100%)",
};
const themeLibrary = [
  ["Focus Bloom", "Night", "Soft"],
  ["Countryside Morning", "Meadow", "Warm"],
  ["Toto Forest", "Forest", "Bright"],
  ["Lofi Clouds", "Cloud", "Soft"],
  ["Rainy Window", "Rain", "Cool"],
  ["Cozy Café", "Cafe", "Warm"],
  ["Sunset Beach", "Beach", "Warm"],
  ["Ocean Waves", "Ocean", "Cool"],
  ["Misty Mountains", "Mountain", "Cool"],
  ["Autumn Forest", "Forest", "Warm"],
  ["Winter Snow", "Snow", "Cool"],
  ["Night Sky", "Night", "Dark"],
  ["Starry Galaxy", "Galaxy", "Dark"],
  ["Waterfall", "Water", "Cool"],
  ["Zen Garden", "Garden", "Soft"],
  ["Cozy Fireplace", "Fire", "Warm"],
  ["Desert Sunset", "Desert", "Warm"],
  ["Tropical Paradise", "Tropical", "Bright"],
  ["Moonlit Lake", "Lake", "Dark"],
  ["Cherry Blossom", "Garden", "Soft"],
  ["Peaceful Meadow", "Meadow", "Bright"],
  ["Dark Academia", "Study", "Dark"],
  ["Minimal Study Room", "Study", "Soft"],
  ["Blueberry Sky", "Blue", "Bright"],
  ["Lavender Bunny", "Garden", "Soft"],
  ["Peachy Bloom", "Garden", "Warm"],
  ["Minty Garden", "Garden", "Bright"],
  ["Cloud Kitty", "Cloud", "Soft"],
];
const themeImages = {
  "Countryside Morning": "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=85",
  "Toto Forest": "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=85",
  "Lofi Clouds": "https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=900&q=85",
  "Ocean Waves": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85",
  "Misty Mountains": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=85",
  "Cozy Fireplace": "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=900&q=85",
  "Cherry Blossom": "https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=900&q=85",
  "Peaceful Meadow": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85",
};
const ambientForEnvironment = { Rain: "Rain", Forest: "Forest", Ocean: "Ocean", Fire: "Fireplace", Night: "Night", Cafe: "Cafe", Beach: "Ocean", Lake: "Ocean", Mountain: "Wind", Meadow: "Wind", Garden: "Wind", Cloud: "Wind", Snow: "Wind" };
const worldVisuals = {
  "Focus Bloom": "radial-gradient(circle at 25% 28%, rgba(254,240,138,.65), transparent 18%), linear-gradient(145deg,#831843,#ec4899 55%,#9d174d)",
  "Lofi Clouds": "#7dd3fc",
  "Rainy Window": "#164e63",
  "Cozy CafÃ©": "#78350f",
  "Sunset Beach": "#f59e0b",
  "Winter Snow": "#bfdbfe",
  "Starry Galaxy": "#312e81",
  Waterfall: "#0e7490",
  "Zen Garden": "#65a30d",
  "Desert Sunset": "#c2410c",
  "Tropical Paradise": "#0f766e",
  "Moonlit Lake": "#1e3a8a",
  "Dark Academia": "#292524",
  "Minimal Study Room": "#64748b",
  "Blueberry Sky": "#3b82f6",
  "Lavender Bunny": "#c4b5fd",
  "Peachy Bloom": "#fda4af",
  "Minty Garden": "#86efac",
  "Cloud Kitty": "#bae6fd",
};
Object.assign(worldVisuals, {
  "Lofi Clouds": "radial-gradient(circle at 30% 35%, rgba(255,255,255,.75), transparent 18%), linear-gradient(145deg,#bae6fd,#818cf8 65%,#c4b5fd)",
  "Rainy Window": sceneVisuals.Rain,
  "Cozy CafÃƒÂ©": sceneVisuals.Cafe,
  "Sunset Beach": "radial-gradient(circle at 70% 35%, rgba(254,215,170,.9), transparent 20%), linear-gradient(145deg,#fb7185,#f97316 55%,#7c2d12)",
  "Winter Snow": "radial-gradient(circle at 35% 25%, rgba(255,255,255,.9), transparent 18%), linear-gradient(145deg,#dbeafe,#93c5fd 55%,#6366f1)",
  "Starry Galaxy": "radial-gradient(circle at 70% 30%, rgba(196,181,253,.65), transparent 14%), linear-gradient(145deg,#111827,#4c1d95 55%,#1e1b4b)",
  Waterfall: "radial-gradient(ellipse at 50% 10%, rgba(165,243,252,.7), transparent 22%), linear-gradient(145deg,#164e63,#0891b2 55%,#172554)",
  "Zen Garden": "radial-gradient(circle at 25% 28%, rgba(254,240,138,.65), transparent 18%), linear-gradient(145deg,#365314,#65a30d 55%,#115e59)",
  "Desert Sunset": "radial-gradient(circle at 68% 28%, rgba(254,215,170,.8), transparent 18%), linear-gradient(145deg,#7c2d12,#ea580c 58%,#f59e0b)",
  "Tropical Paradise": "radial-gradient(circle at 72% 22%, rgba(153,246,228,.65), transparent 20%), linear-gradient(145deg,#134e4a,#0f766e 55%,#0369a1)",
  "Moonlit Lake": "radial-gradient(circle at 65% 20%, rgba(224,231,255,.75), transparent 12%), linear-gradient(145deg,#0f172a,#1e3a8a 55%,#312e81)",
  "Dark Academia": "radial-gradient(circle at 38% 24%, rgba(251,191,36,.25), transparent 16%), linear-gradient(145deg,#1c1917,#44403c 58%,#292524)",
  "Minimal Study Room": "radial-gradient(circle at 70% 25%, rgba(255,255,255,.55), transparent 18%), linear-gradient(145deg,#334155,#64748b 55%,#475569)",
  "Blueberry Sky": "radial-gradient(circle at 28% 25%, rgba(255,255,255,.85), transparent 18%), linear-gradient(145deg,#172554,#3b82f6 55%,#38bdf8)",
  "Lavender Bunny": "radial-gradient(circle at 70% 30%, rgba(255,255,255,.75), transparent 16%), linear-gradient(145deg,#4c1d95,#a78bfa 55%,#f0abfc)",
  "Peachy Bloom": "radial-gradient(circle at 32% 28%, rgba(255,255,255,.7), transparent 16%), linear-gradient(145deg,#9f1239,#fb7185 55%,#fdba74)",
  "Minty Garden": "radial-gradient(circle at 65% 25%, rgba(236,253,245,.7), transparent 18%), linear-gradient(145deg,#064e3b,#34d399 55%,#99f6e4)",
  "Cloud Kitty": "radial-gradient(circle at 32% 28%, rgba(255,255,255,.8), transparent 20%), linear-gradient(145deg,#0369a1,#7dd3fc 55%,#e0f2fe)",
});
const audioSources = {
  Rain: "/audio/rain.mp3",
  Cafe: "/audio/cafe.mp3",
  Fireplace: "/audio/fireplace.mp3",
  Ocean: "/audio/ocean.mp3",
};
const audioOptions = [
  ["Rain", "🌧️", "Calming rain"],
  ["Cafe", "☕", "Cafe noise"],
  ["Fireplace", "🔥", "Cozy fireplace"],
  ["Ocean", "🌊", "Soothing ocean waves"],
  ["Forest", "🌲", "Forest ambience"],
  ["White noise", "✨", "Soft white noise"],
];
const readFocusPreference = (key, fallback) => typeof window === "undefined" ? fallback : localStorage.getItem(key) || fallback;
// Focus Session opens with the requested soft pink default.
// Other themes remain available after opening and can still be selected for
// the current session.
const initialWorldTheme = "Focus Bloom";
const initialWorldData = themeLibrary.find(([name]) => name === initialWorldTheme) || themeLibrary[3];
const themeColors = {
  Cool: ["#172554", "#0e7490"],
  Warm: ["#7c2d12", "#a16207"],
  Dark: ["#111827", "#312e81"],
  Soft: ["#4c1d95", "#be185d"],
  Bright: ["#0369a1", "#16a34a"],
};
const themes = {
  Glass: ["bg-white/10 border-white/25", "font-light"],
  Neon: [
    "bg-slate-950/50 border-cyan-300/50 shadow-[0_0_50px_rgba(34,211,238,.25)]",
    "font-mono text-cyan-100",
  ],
  Minimal: ["bg-black/25 border-white/10", "font-mono"],
  Pastel: ["bg-rose-200/15 border-rose-100/35", "font-serif text-rose-50"],
  Circular: ["bg-emerald-950/25 border-emerald-200/30", "font-light"],
};
const quotes = [
  "The work is quiet. The result will speak.",
  "One focused hour changes more than a busy day.",
  "Small progress becomes momentum.",
  "Protect your attention.",
];
const format = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const TIMER_STORAGE_KEY = "study-buddy-focus-timer";

export default function FocusPage() {
  const [mode, setMode] = useState("pomodoro"),
    [minutes, setMinutes] = useState(25),
    [seconds, setSeconds] = useState(1500),
    [running, setRunning] = useState(false);
  const [timerReady, setTimerReady] = useState(false);
  const [scene, setScene] = useState(initialWorldData[1] in scenes ? initialWorldData[1] : "Night"),
    [theme, setTheme] = useState("Glass"),
    [image, setImage] = useState(themeImages[initialWorldTheme] || ""),
    [imageName, setImageName] = useState(initialWorldTheme),
    [backgroundOverride, setBackgroundOverride] = useState(themeImages[initialWorldTheme] ? "" : (worldVisuals[initialWorldTheme] || "")),
    [activeWorldTheme, setActiveWorldTheme] = useState(initialWorldTheme);
  const [blur, setBlur] = useState(0),
    [overlay, setOverlay] = useState(48),
    [brightness, setBrightness] = useState(75),
    [panel, setPanel] = useState(false);
  const [task, setTask] = useState("Deep work"),
    [tasks, setTasks] = useState([]),
    [newTask, setNewTask] = useState(""),
    [quote, setQuote] = useState(quotes[0]),
    [quotesOn, setQuotesOn] = useState(true),
    [quoteWhen, setQuoteWhen] = useState("always");
  const [youtube, setYoutube] = useState(""),
    [mediaOn, setMediaOn] = useState(false),
    [volume, setVolume] = useState(35),
    [sound, setSound] = useState(readFocusPreference("focus-audio", "Rain")),
    [spotify, setSpotify] = useState(""),
    [spotifyConnected, setSpotifyConnected] = useState(false),
    [saved, setSaved] = useState("");
  const [myQuote, setMyQuote] = useState(""),
    [quoteDraft, setQuoteDraft] = useState("");
  const started = useRef(null),
    tick = useRef(null),
    secondsRef = useRef(1500),
    runningRef = useRef(false),
    modeRef = useRef("pomodoro"),
    minutesRef = useRef(25),
    audio = useRef(null),
    trackAudio = useRef(null),
    fileRef = useRef(null);
  const total = mode === "stopwatch" ? Math.max(seconds, 1) : minutes * 60;
  const progress = mode === "stopwatch" ? 0 : (total - seconds) / total;

  const liveSeconds = () => {
    if (!runningRef.current || !tick.current) return secondsRef.current;
    const elapsed = Math.floor((Date.now() - tick.current) / 1000);
    return modeRef.current === "stopwatch"
      ? secondsRef.current + elapsed
      : Math.max(0, secondsRef.current - elapsed);
  };
  const persistTimer = ({ nextSeconds = liveSeconds(), nextRunning = runningRef.current, nextMode = modeRef.current, nextMinutes = minutesRef.current } = {}) => {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({
      seconds: nextSeconds,
      running: nextRunning,
      mode: nextMode,
      minutes: nextMinutes,
      startedAt: started.current,
      savedAt: Date.now(),
    }));
  };
  const clearPersistedTimer = () => localStorage.removeItem(TIMER_STORAGE_KEY);

  useEffect(() => {
    const restore = () => {
      try {
        const savedTimer = JSON.parse(localStorage.getItem(TIMER_STORAGE_KEY) || "null");
        if (savedTimer) {
          const restoredMode = savedTimer.mode || "pomodoro";
          const restoredMinutes = Number(savedTimer.minutes) || 25;
          const elapsed = savedTimer.running ? Math.max(0, Math.floor((Date.now() - Number(savedTimer.savedAt || Date.now())) / 1000)) : 0;
          const baseSeconds = Number.isFinite(Number(savedTimer.seconds))
            ? Number(savedTimer.seconds)
            : restoredMode === "stopwatch" ? 0 : restoredMinutes * 60;
          const restoredSeconds = restoredMode === "stopwatch" ? baseSeconds + elapsed : Math.max(0, baseSeconds - elapsed);
          const restoredRunning = Boolean(savedTimer.running) && (restoredMode === "stopwatch" || restoredSeconds > 0);
          setMode(restoredMode); setMinutes(restoredMinutes); setSeconds(restoredSeconds); setRunning(restoredRunning);
          modeRef.current = restoredMode; minutesRef.current = restoredMinutes; secondsRef.current = restoredSeconds; runningRef.current = restoredRunning;
          started.current = restoredRunning ? Number(savedTimer.startedAt || Date.now()) : null;
          tick.current = Date.now();
        }
      } catch {
        clearPersistedTimer();
      } finally {
        setTimerReady(true);
      }
    };
    const id = window.setTimeout(restore, 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    secondsRef.current = seconds; runningRef.current = running; modeRef.current = mode; minutesRef.current = minutes;
  }, [seconds, running, mode, minutes]);

  useEffect(() => {
    const saveBeforeLeave = () => persistTimer();
    window.addEventListener("pagehide", saveBeforeLeave);
    return () => window.removeEventListener("pagehide", saveBeforeLeave);
  }, []);

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (!email) return;
    fetch(
      apiUrl(`/api/dashboard/today-schedule?email=${encodeURIComponent(email)}`),
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.tasks && setTasks(d.tasks.map((x) => x.task)))
      .catch(() => {});
  }, []);
  useEffect(() => {
    const id = window.setTimeout(() => {
      const value = localStorage.getItem("myMotivationalQuote") || "";
      setMyQuote(value);
      setQuoteDraft(value);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);
  const saveChunk = async () => {
    const start = started.current;
    started.current = null;
    const email = localStorage.getItem("email");
    const duration = start ? Math.floor((Date.now() - start) / 1000) : 0;
    if (!email || mode !== "pomodoro" || duration < 1) return;
    try {
      const r = await fetch(apiUrl("/api/pomodoro/study-time"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, duration }),
      });
      setSaved(r.ok ? "Study time saved" : "Could not save session");
    } catch {
      setSaved("Could not save session");
    }
  };
  useEffect(() => {
    if (!timerReady || !running) return;
    if (!tick.current) tick.current = Date.now();
    const id = setInterval(() => {
      const e = Math.floor((Date.now() - tick.current) / 1000);
      if (!e) return;
      tick.current += e * 1000;
      setSeconds((v) => {
        const n = mode === "stopwatch" ? v + e : Math.max(0, v - e);
        secondsRef.current = n;
        if (!n) {
          runningRef.current = false;
          setRunning(false);
          saveChunk();
        }
        persistTimer({ nextSeconds: n, nextRunning: Boolean(n) || mode === "stopwatch" });
        return n;
      });
    }, 250);
    return () => clearInterval(id);
  }, [running, mode, timerReady]);
  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image);
      audio.current?.close?.();
      trackAudio.current?.pause();
      if (trackAudio.current) trackAudio.current.currentTime = 0;
    },
    [image],
  );
  useEffect(() => {
    audio.current?.close?.();
    audio.current = null;
    trackAudio.current?.pause();
    if (trackAudio.current) trackAudio.current.currentTime = 0;
    trackAudio.current = null;
    if (!mediaOn) return undefined;
    if (audioSources[sound]) {
      const track = new Audio(audioSources[sound]);
      track.loop = true;
      track.volume = Number(volume) / 100;
      trackAudio.current = track;
      track.play().catch(() => setMediaOn(false));
      return () => { track.pause(); track.currentTime = 0; };
    }
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return undefined;
      const ctx = new Ctx(), master = ctx.createGain();
      master.gain.value = (Number(volume) / 100) * 0.22;
      master.connect(ctx.destination);
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate), data = buffer.getChannelData(0);
      let brown = 0;
      for (let i = 0; i < data.length; i += 1) { const white = Math.random() * 2 - 1; brown = (brown + 0.025 * white) / 1.025; data[i] = brown * 3.5; }
      const source = ctx.createBufferSource(); source.buffer = buffer; source.loop = true;
      const filter = ctx.createBiquadFilter(); filter.type = sound === "Ocean" || sound === "Wind" ? "lowpass" : "bandpass"; filter.frequency.value = sound === "Ocean" ? 520 : sound === "Fireplace" ? 1500 : sound === "Forest" ? 2400 : 1100; filter.Q.value = 0.45;
      source.connect(filter).connect(master); source.start(); audio.current = ctx;
      return () => { source.stop?.(); ctx.close?.(); };
    } catch { return undefined; }
  }, [mediaOn, sound, volume]);
  const toggle = () => {
    if (running) {
      const pausedSeconds = liveSeconds();
      secondsRef.current = pausedSeconds;
      saveChunk();
      runningRef.current = false;
      setRunning(false);
      setSeconds(pausedSeconds);
      tick.current = null;
      persistTimer({ nextSeconds: pausedSeconds, nextRunning: false });
    } else {
      started.current = Date.now();
      tick.current = Date.now();
      runningRef.current = true;
      setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
      setSaved("");
      setRunning(true);
      persistTimer({ nextSeconds: secondsRef.current, nextRunning: true });
    }
  };
  const changeMode = (m) => {
    if (running) saveChunk();
    const nextSeconds = m === "stopwatch" ? 0 : minutes * 60;
    modeRef.current = m; secondsRef.current = nextSeconds; runningRef.current = false;
    setRunning(false);
    tick.current = null;
    setMode(m);
    setSeconds(nextSeconds);
    persistTimer({ nextMode: m, nextSeconds, nextRunning: false });
  };
  const upload = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (image) URL.revokeObjectURL(image);
    setImage(URL.createObjectURL(f));
    setBackgroundOverride("");
    setActiveWorldTheme(f.name);
    setImageName(f.name);
    e.target.value = "";
  };
  const chooseScene = (nextScene) => {
    setScene(nextScene);
    setImage("");
    setBackgroundOverride("");
    setActiveWorldTheme(nextScene);
    localStorage.setItem("focus-world-theme", nextScene);
    setMediaOn(false);
  };
  const chooseWorldTheme = (name, environment, color) => {
    const nextImage = themeImages[name] || "";
    setScene(environment in scenes ? environment : "Night");
    setImage(nextImage);
    setBackgroundOverride(nextImage ? "" : (worldVisuals[name] || sceneVisuals[environment]));
    setImageName(name);
    setActiveWorldTheme(name);
    localStorage.setItem("focus-world-theme", name);
    setMediaOn(false);
  };
  const chooseAudio = (nextAudio) => {
    setMediaOn(false);
    setSound(nextAudio);
    localStorage.setItem("focus-audio", nextAudio);
  };
  // const addTask = () => {
  //   if (!newTask.trim()) return;
  //   setTasks((x) => [...new Set([...x, newTask.trim()])]);
  //   setTask(newTask.trim());
  //   setNewTask("");
  // };
  const youtubeId = youtube.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^?&/]+)/,
  )?.[1];
  const bg = image
    ? `linear-gradient(rgba(0,0,0,${overlay / 100}),rgba(0,0,0,${overlay / 100})),url(${image})`
    : backgroundOverride || sceneVisuals[scene] || sceneVisuals.Rain;
  const isFocusBloom = activeWorldTheme === initialWorldTheme && !image;
  const activeTheme = themes[theme];
  const saveQuote = () => {
    const value = quoteDraft.trim();
    localStorage.setItem("myMotivationalQuote", value);
    setMyQuote(value);
    setQuote(value || quotes[0]);
    setSaved(value ? "Your quote was saved" : "Your quote was cleared");
  };

  return (
    <div
      className="focus-session-page fixed inset-0 z-50 h-[100dvh] w-full overflow-y-auto bg-black text-white selection:bg-white/30"
      style={{
        background: bg,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        filter: isFocusBloom ? "none" : `brightness(${brightness}%)`,
      }}
    >
      <div className={`pointer-events-none absolute inset-0 ${isFocusBloom ? "hidden" : "bg-[radial-gradient(circle_at_center,rgba(255,255,255,.12),transparent_42%),linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.3))]"}`} style={{ backdropFilter: isFocusBloom ? "none" : `blur(${blur}px)` }} />
      <header className="relative flex items-center justify-between px-5 py-6 sm:px-10 sm:py-8">
        <Link
          href="/Dashboard"
          className="flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-4 py-2 text-xs text-white/85 backdrop-blur-xl transition hover:bg-black/35"
        >
          <ArrowLeft size={15} /> Exit focus
        </Link>
        <span className="hidden rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-semibold tracking-[.32em] text-white/75 backdrop-blur sm:block">
          STUDY BUDDY · FOCUS
        </span>
        <button
          onClick={() => setPanel(!panel)}
          className="rounded-full border border-white/20 bg-white/90 px-4 py-2 text-xs font-bold text-slate-900 shadow-lg shadow-black/10 transition hover:bg-white"
        >
          <Settings2 size={14} className="inline mr-1" /> Customize
        </button>
      </header>
      <main className="relative mx-auto flex min-h-[calc(100vh-106px)] max-w-5xl flex-col items-center justify-center px-5 pb-20 text-center">
        {quotesOn && (quoteWhen === "always" || running) && <p className="mb-8 max-w-2xl text-xl font-medium leading-relaxed tracking-tight text-white drop-shadow-lg sm:text-3xl">“{quote}”</p>}
        <div className="mb-8 flex rounded-full border border-white/20 bg-black/20 p-1 shadow-lg backdrop-blur-xl">
          {["pomodoro", "countdown", "stopwatch"].map((m) => (
            <button
              key={m}
              onClick={() => changeMode(m)}
              className={`rounded-full px-4 py-2 text-xs capitalize ${mode === m ? "bg-white text-slate-900" : "text-white/65"}`}
            >
              {m}
            </button>
          ))}
        </div>
        {/* <select
          value={task}
          onChange={(e) => setTask(e.target.value)}
          className="mb-5 rounded-full border border-white/20 bg-black/25 px-4 py-2 text-sm outline-none"
        >
          <option value="Deep work" className="bg-slate-900">
            Deep work
          </option>
          {tasks.map((t) => (
            <option key={t} className="bg-slate-900">
              {t}
            </option>
          ))}
        </select> */}
        <section
          className="w-full max-w-4xl rounded-[3rem] border border-white/10 bg-white/[0.06] p-7 shadow-2xl shadow-black/10 backdrop-blur-md transition-all sm:p-12"
        >
          <p className="mb-6 text-[11px] uppercase tracking-[.3em] text-white/60">
            {mode} session
          </p>
          <div className="relative mx-auto flex items-center justify-center py-2 sm:py-4">
            <span className={`text-[5.5rem] font-semibold leading-none tracking-[-.08em] tabular-nums drop-shadow-2xl sm:text-[9.5rem] ${activeTheme[1]}`}>
              {format(seconds)}
            </span>
          </div>
          <p className="mt-3 text-[11px] uppercase tracking-[.3em] text-white/55">
            {mode === "stopwatch"
              ? "Elapsed time"
              : `${Math.round(progress * 100)}% complete`}
          </p>
          <div className="mt-9 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                saveChunk();
                runningRef.current = false;
                secondsRef.current = mode === "stopwatch" ? 0 : minutes * 60;
                setRunning(false);
                setSeconds(mode === "stopwatch" ? 0 : minutes * 60);
                tick.current = null;
                clearPersistedTimer();
              }}
              className="rounded-full border border-white/20 bg-black/15 px-4 py-3 text-xs text-white/80 backdrop-blur transition hover:bg-black/30"
            >
              End
            </button>
            <button
              onClick={toggle}
              className="grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full bg-white text-slate-900 shadow-2xl shadow-black/25 transition hover:scale-105"
            >
              {running ? (
                <Pause fill="currentColor" />
              ) : (
                <Play fill="currentColor" className="ml-1" />
              )}
            </button>
            <button
              onClick={() => {
                runningRef.current = false;
                secondsRef.current = mode === "stopwatch" ? 0 : minutes * 60;
                setRunning(false);
                setSeconds(mode === "stopwatch" ? 0 : minutes * 60);
                tick.current = null;
                clearPersistedTimer();
              }}
              className="rounded-full border border-white/20 bg-black/15 px-4 py-3 text-xs text-white/80 backdrop-blur transition hover:bg-black/30"
            >
              Reset
            </button>
          </div>
        </section>
        {false && quotesOn && (quoteWhen === "always" || running) && (
          <p className="mt-8 max-w-md text-sm italic text-white/70">
            “{quote}”
          </p>
        )}
        {saved && (
          <p className="mt-3 flex items-center gap-1 text-xs text-emerald-200">
            <Check size={13} /> {saved}
          </p>
        )}
      </main>

      {panel && (
        <aside className="fixed bottom-4 right-4 top-20 z-10 w-[min(27rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-[2rem] border-2 border-pink-200/80 bg-gradient-to-b from-pink-50/95 via-pink-50/90 to-pink-50/95 p-5 text-left text-gray-700 shadow-2xl shadow-pink-300/30 backdrop-blur-2xl sm:right-6 sm:w-[min(27rem,calc(100vw-3rem))]">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <b className="flex items-center gap-1.5 text-base font-bold text-pink-700">
                <Sparkles size={15} className="text-pink-400" /> Focus settings
              </b>
              <p className="mt-0.5 text-xs text-pink-400">
                Personal to this session only
              </p>
            </div>
            <button
              onClick={() => setPanel(false)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/80 text-pink-500 shadow-sm transition hover:bg-white"
              aria-label="Close customize panel"
            >
              <X size={15} />
            </button>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-pink-100 bg-white/70 p-3 text-sm text-pink-700">
            Minutes
            <input
              type="number"
              min="1"
              max="180"
              disabled={mode === "stopwatch"}
              value={minutes}
              onChange={(e) => {
                const v = Math.max(1, Number(e.target.value) || 1);
                setMinutes(v);
                minutesRef.current = v;
                if (!running && mode !== "stopwatch") {
                  secondsRef.current = v * 60;
                  setSeconds(v * 60);
                  persistTimer({ nextSeconds: v * 60, nextMinutes: v, nextRunning: false });
                }
              }}
              className="ml-auto w-20 rounded-full border border-pink-200 bg-white p-2 text-center text-pink-700 outline-none focus:ring-2 focus:ring-pink-300"
            />
          </label>

          {/* <p className="mt-5 text-xs uppercase tracking-wider text-white/50">
            Task
          </p> */}
          {/* <div className="mt-2 flex gap-2">
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Add current task"
              className="min-w-0 flex-1 rounded-xl bg-white/10 p-2.5 text-sm"
            />
            <button
              onClick={addTask}
              className="rounded-xl bg-white px-3 text-xs font-bold text-slate-900"
            >
              Add
            </button>
          </div> */}

          <section className="mt-5 rounded-3xl border border-pink-200/80 bg-white/45 p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <div>
              <p className="text-sm font-bold text-pink-700">Scenes &amp; Ambient Worlds</p>
              <p className="text-[11px] text-pink-400">Choose a visual atmosphere for your focus space.</p>
            </div>
            <span className="rounded-full bg-pink-100 px-2.5 py-1 text-[10px] font-semibold text-pink-600">Visuals</span>
          </div>
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-pink-600">
            🌸 Scene
          </p>
          <div className="grid grid-cols-3 gap-2">
            {Object.keys(scenes).map((s) => (
              <button
                key={s}
                onClick={() => chooseScene(s)}
                className={`rounded-2xl p-3 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 ${activeWorldTheme === s ? "ring-2 ring-pink-400 ring-offset-2 ring-offset-pink-50" : ""}`}
                style={{
                  background: `linear-gradient(135deg,${scenes[s][0]},${scenes[s][1]})`,
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-4 border-t border-pink-200/80 pt-4">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-pink-600">
              ðŸŒ™ Ambient worlds
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {themeLibrary.map(([name, environment, color]) => (
                <button
                  key={name}
                  onClick={() => chooseWorldTheme(name, environment, color)}
                  className={`group overflow-hidden rounded-2xl border-2 border-pink-100 text-left text-[11px] shadow-sm transition hover:-translate-y-0.5 hover:border-pink-300 ${activeWorldTheme === name ? "ring-2 ring-pink-400" : ""}`}
                  style={{
                    background: themeImages[name]
                      ? `linear-gradient(rgba(0,0,0,.08),rgba(0,0,0,.22)),url(${themeImages[name]})`
                      : (worldVisuals[name] || sceneVisuals[environment]),
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <span className="block aspect-[1.7/1]" />
                  <span className="block bg-white/85 px-2 py-1.5 font-semibold text-pink-700 backdrop-blur-sm">{name}</span>
                </button>
              ))}
            </div>
          </div>
          </section>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={upload}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-pink-300 bg-white/60 p-3 text-xs font-medium text-pink-500 transition hover:bg-white"
          >
            <ImagePlus size={15} /> {imageName || "Upload background image"}
          </button>

          {image && (
            <div className="mt-3 space-y-3 rounded-2xl border border-pink-100 bg-white/70 p-3 text-xs text-pink-600">
              {[
                ["Blur", blur, 20, setBlur],
                ["Overlay", overlay, 85, setOverlay],
                ["Brightness", brightness, 120, setBrightness],
              ].map(([label, value, max, setter]) => (
                <label key={label} className="block">
                  {label}: {value}
                  <input
                    type="range"
                    min="0"
                    max={max}
                    value={value}
                    onChange={(e) => setter(Number(e.target.value))}
                    className="mt-1 block w-full accent-pink-400"
                  />
                </label>
              ))}
            </div>
          )}

          <p className="mb-2 mt-5 inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-pink-600">
            💫 Timer theme
          </p>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(themes).map((t) => (
              <button
                key={t}
                onClick={() => { setTheme(t); setMediaOn(false); }}
                className={`rounded-full border-2 p-2 text-xs font-semibold transition ${theme === t ? "border-pink-400 bg-pink-400 text-white shadow-sm" : "border-pink-200 bg-white/70 text-pink-600 hover:bg-white"}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between rounded-2xl border border-pink-100 bg-white/70 p-3 text-sm text-pink-700">
            Quotes
            <button
              onClick={() => setQuotesOn(!quotesOn)}
              className={`h-6 w-11 rounded-full transition ${quotesOn ? "bg-gradient-to-r from-pink-400 to-pink-400" : "bg-pink-100"}`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${quotesOn ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </button>
          </div>
          {quotesOn && (
            <select
              value={quoteWhen}
              onChange={(e) => setQuoteWhen(e.target.value)}
              className="mt-2 w-full rounded-full border border-pink-200 bg-white/80 p-2 text-xs text-pink-700 outline-none"
            >
              <option value="always">Always</option>
              <option value="start">Only while running</option>
            </select>
          )}

          <p className="mb-2 mt-5 inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-pink-600">
            🎧 Ambient / media
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {audioOptions.map(([value, icon, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => chooseAudio(value)}
                className={`rounded-2xl border-2 p-2 text-left transition ${sound === value ? "border-pink-400 bg-pink-100 shadow-sm" : "border-pink-100 bg-white/70 hover:bg-white"}`}
              >
                <span className="text-lg">{icon}</span>
                <span className="mt-1 block text-[11px] font-semibold text-pink-700">{value}</span>
                <span className="block truncate text-[10px] text-pink-400">{label}</span>
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-pink-100 bg-white/70 p-2">
            <button
              onClick={() => setMediaOn(!mediaOn)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pink-100 text-pink-500"
            >
              {mediaOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
            <select
              value={sound}
              onChange={(e) => chooseAudio(e.target.value)}
              className="flex-1 rounded-full border border-pink-200 bg-white p-2 text-xs text-pink-700 outline-none"
            >
              <option>Rain</option>
              <option>Cafe</option>
              <option>Forest</option>
              <option>Fireplace</option>
              <option>Ocean</option>
              <option>White noise</option>
            </select>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className="w-20 accent-pink-400"
            />
          </div>
          <input
            value={youtube}
            onChange={(e) => setYoutube(e.target.value)}
            placeholder="Paste YouTube URL (official embed)"
            className="mt-3 w-full rounded-full border border-pink-200 bg-white/80 p-2 text-xs text-pink-700 outline-none placeholder:text-pink-300"
          />
          {youtubeId && (
            <iframe
              title="Ambient YouTube"
              className="mt-2 aspect-video w-full rounded-2xl border border-pink-100"
              src={`https://www.youtube.com/embed/${youtubeId}?controls=1`}
              allow="autoplay; encrypted-media"
            />
          )}

          <p className="mb-2 mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-600">
            🎵 Spotify
          </p>
          <div className="flex gap-2">
            <input
              value={spotify}
              onChange={(e) => setSpotify(e.target.value)}
              placeholder="Spotify track/playlist URL"
              className="min-w-0 flex-1 rounded-full border border-pink-200 bg-white/80 p-2 text-xs text-pink-700 outline-none placeholder:text-pink-300"
            />
            <button
              onClick={() => setSpotifyConnected(!spotifyConnected)}
              className={`shrink-0 rounded-full px-3 text-xs font-bold transition ${spotifyConnected ? "bg-gray-200 text-gray-600" : "bg-gradient-to-r from-pink-400 to-pink-400 text-white shadow-sm"}`}
            >
              {spotifyConnected ? "Disconnect" : "Connect"}
            </button>
          </div>
          {spotifyConnected && spotify && (
            <iframe
              title="Spotify"
              className="mt-2 h-80 w-full rounded-2xl border border-pink-100"
              src={spotify.replace(
                "open.spotify.com/",
                "open.spotify.com/embed/",
              )}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            />
          )}

          {false && <div className="mt-5 border-t-2 border-dashed border-pink-200 pt-4">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-pink-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-pink-600">
              🌙 Ambient worlds
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {themeLibrary.map(([name, environment, color]) => (
                <button
                  key={name}
                  onClick={() => chooseWorldTheme(name, environment, color)}
                  className={`group overflow-hidden rounded-2xl border-2 border-pink-100 text-left text-[11px] shadow-sm transition hover:-translate-y-0.5 hover:border-pink-300 ${activeWorldTheme === name ? "ring-2 ring-pink-400" : ""}`}
                  style={{
                    background: themeImages[name]
                      ? `linear-gradient(rgba(0,0,0,.08),rgba(0,0,0,.22)),url(${themeImages[name]})`
                      : (worldVisuals[name] || sceneVisuals[environment]),
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <span className="block aspect-[1.7/1]" />
                  <span className="block bg-white/85 px-2 py-1.5 font-semibold text-pink-700 backdrop-blur-sm">
                    {name}
                  </span>
                </button>
              ))}
            </div>
          </div>}
        </aside>
      )}
      {false && <section className="relative mx-auto mb-8 max-w-4xl px-5">
        <div className="rounded-3xl border border-white/20 bg-black/25 p-5 backdrop-blur-xl">
          <p className="text-sm font-semibold">
            Ambient Worlds{" "}
            <span className="text-xs text-white/60">· all free</span>
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {themeLibrary.map(([name, environment, color]) => (
              <button
                key={name}
                onClick={() => {
                  setScene(environment in scenes ? environment : "Night");
                  setImage(themeImages[name] || "");
                  setBackgroundOverride(themeImages[name] ? "" : (worldVisuals[name] || sceneVisuals[environment]));
                  setImageName(name);
                  setSound(ambientForEnvironment[environment] || "Wind");
                  setMediaOn(false);
                }}
                className={`group overflow-hidden rounded-2xl border border-white/10 text-left text-xs transition hover:-translate-y-0.5 hover:border-white/40 ${scene === environment ? "ring-2 ring-white" : ""}`}
                style={{
                  backgroundImage: themeImages[name]
                    ? `linear-gradient(rgba(0,0,0,.08),rgba(0,0,0,.22)),url(${themeImages[name]})`
                    : `linear-gradient(135deg,${themeColors[color][0]},${themeColors[color][1]})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <span className="block aspect-[1.7/1]" />
                <span className="block bg-black/35 px-3 py-2 font-medium text-white backdrop-blur-sm">{name}</span>
              </button>
            ))}
          </div>
          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="text-sm font-semibold">My Motivational Quote</p>
            <textarea
              value={quoteDraft}
              onChange={(e) => setQuoteDraft(e.target.value)}
              placeholder="Write your own quote..."
              rows="2"
              className="mt-2 w-full resize-none rounded-lg bg-white/10 p-2 text-xs"
            />
            <button
              onClick={saveQuote}
              className="mt-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-900"
            >
              Save Quote
            </button>
            {myQuote && (
              <p className="mt-2 text-xs italic text-white/70">“{myQuote}”</p>
            )}
          </div>
        </div>
      </section>}
    </div>
  );
}
