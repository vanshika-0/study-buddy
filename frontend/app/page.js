"use client";

import { useEffect, useState } from "react";
import { Check, Moon, Palette, Save, ShieldCheck, Sun, Volume2, VolumeX } from "lucide-react";

const THEMES = {
  blossom: { label: "Blossom", preview: "bg-gradient-to-br from-pink-300 to-pink-400" },
  ocean: { label: "Ocean Calm", preview: "bg-gradient-to-br from-cyan-300 to-blue-500" },
  meadow: { label: "Soft Meadow", preview: "bg-gradient-to-br from-emerald-300 to-teal-500" },
};
const storedPreference = (key, fallback) => typeof window === "undefined" ? fallback : localStorage.getItem(key) ?? fallback;
const applyAppearance = (nextTheme, nextDark) => {
  document.documentElement.dataset.theme = nextTheme;
  document.documentElement.dataset.mode = nextDark ? "dark" : "light";
};

export default function SettingsPage() {
  const initialUsername = storedPreference("username", "Student");
  const [username, setUsername] = useState(initialUsername);
  const [draftUsername, setDraftUsername] = useState(initialUsername);
  const [theme, setTheme] = useState(storedPreference("study-theme", "blossom"));
  const [darkMode, setDarkMode] = useState(storedPreference("study-dark-mode", "false") === "true");
  const [sound, setSound] = useState(storedPreference("study-sound", "true") !== "false");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    applyAppearance(theme, darkMode);
  }, [theme, darkMode]);
  const chooseTheme = (nextTheme) => { setTheme(nextTheme); localStorage.setItem("study-theme", nextTheme); applyAppearance(nextTheme, darkMode); window.dispatchEvent(new Event("appearance-changed")); };
  const toggleDark = () => { const next = !darkMode; setDarkMode(next); localStorage.setItem("study-dark-mode", String(next)); applyAppearance(theme, next); window.dispatchEvent(new Event("appearance-changed")); };
  const toggleSound = () => { const next = !sound; setSound(next); localStorage.setItem("study-sound", String(next)); };
  const saveProfile = () => { const next = draftUsername.trim() || "Student"; setUsername(next); setDraftUsername(next); localStorage.setItem("username", next); window.dispatchEvent(new Event("auth-changed")); setSaved(true); window.setTimeout(() => setSaved(false), 1800); };

  return <main className="settings-page min-h-screen bg-pink-50 p-5 text-gray-800 transition-colors sm:p-10"><div className="mx-auto max-w-4xl"><div className="mb-8"><p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-500">Study Buddy</p><h1 className="mt-2 text-3xl font-bold">Settings</h1><p className="mt-2 text-sm text-gray-500">Make your study space feel like yours, {username}.</p></div><div className="grid gap-5 lg:grid-cols-2"><section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-lg shadow-pink-100"><div className="flex items-center gap-3"><span className="rounded-2xl bg-pink-100 p-3 text-pink-600">👤</span><div><h2 className="font-bold">Profile</h2><p className="text-xs text-gray-400">Keep your details up to date.</p></div></div><label className="mt-6 block text-sm font-semibold text-pink-700">Username<input value={draftUsername} onChange={(event) => setDraftUsername(event.target.value)} className="mt-2 w-full rounded-2xl border border-pink-200 bg-pink-50 p-3 outline-none focus:ring-2 focus:ring-pink-300" /></label><button onClick={saveProfile} className="mt-4 rounded-2xl bg-gradient-to-r from-pink-500 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white"><Save size={15} className="mr-2 inline" />{saved ? "Saved" : "Save profile"}</button></section><section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-lg shadow-pink-100"><div className="flex items-center gap-3"><span className="rounded-2xl bg-pink-100 p-3 text-pink-600"><Palette size={20} /></span><div><h2 className="font-bold">App Themes</h2><p className="text-xs text-gray-400">Choose a mood for your study space.</p></div></div><div className="mt-5 grid grid-cols-3 gap-3">{Object.entries(THEMES).map(([key, item]) => <button key={key} onClick={() => chooseTheme(key)} className={`rounded-2xl border p-2 text-left transition hover:-translate-y-0.5 ${theme === key ? "border-pink-500 ring-2 ring-pink-200" : "border-gray-100"}`}><span className={`block h-14 rounded-xl ${item.preview}`} /><span className="mt-2 block text-xs font-semibold">{item.label}</span>{theme === key && <Check size={14} className="mt-1 text-pink-600" />}</button>)}</div></section><section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-lg shadow-pink-100"><div className="flex items-center gap-3"><span className="rounded-2xl bg-indigo-100 p-3 text-indigo-600"><Moon size={20} /></span><div><h2 className="font-bold">Appearance</h2><p className="text-xs text-gray-400">Choose what feels comfortable.</p></div></div><button onClick={toggleDark} className="mt-5 flex w-full items-center justify-between rounded-2xl bg-gray-50 p-4 text-left"><span className="flex items-center gap-3 text-sm font-semibold">{darkMode ? <Moon size={18} /> : <Sun size={18} />} {darkMode ? "Dark mode" : "Light mode"}</span><span className={`h-6 w-11 rounded-full p-1 transition ${darkMode ? "bg-pink-600" : "bg-gray-200"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${darkMode ? "translate-x-5" : ""}`} /></span></button></section><section className="rounded-3xl border border-pink-100 bg-white p-6 shadow-lg shadow-pink-100"><div className="flex items-center gap-3"><span className="rounded-2xl bg-amber-100 p-3 text-amber-600">🔊</span><div><h2 className="font-bold">Sound preferences</h2><p className="text-xs text-gray-400">Control gentle game and chat sounds.</p></div></div><button onClick={toggleSound} className="mt-5 flex w-full items-center justify-between rounded-2xl bg-gray-50 p-4 text-left text-sm font-semibold">{sound ? <><Volume2 size={18} /> Sound effects on</> : <><VolumeX size={18} /> Sound effects off</>}<span className={`h-6 w-11 rounded-full p-1 ${sound ? "bg-pink-600" : "bg-gray-200"}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${sound ? "translate-x-5" : ""}`} /></span></button></section></div><div className="mt-5 flex items-center gap-2 rounded-2xl bg-white/70 p-4 text-xs text-pink-600"><ShieldCheck size={16} /> Your preferences are saved locally on this device.</div></div></main>;
}
