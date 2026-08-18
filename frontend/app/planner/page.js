"use client";
import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  Mic,
  Square,
  MoveRight,
  Clock,
  Pencil,
  Check,
  X,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
} from "lucide-react";

const Page = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState();
  const [isRecording, setIsRecording] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({
    task: "",
    description: "",
    start_time: "",
    end_time: "",
  });
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    task: "",
    description: "",
    start_time: "",
    end_time: "",
  });
  const recognitionRef = useRef(null);
  const [isLoggedIn, setIsLoggedIn] = useState(null); // null = checking, true/false = known
  const [email, setEmail] = useState(null);

  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    if (storedEmail) {
      setEmail(storedEmail);
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  function normalizeHistoryToOutput(history) {
    if (!history) return null;
    if (typeof history === "string") {
      try {
        history = JSON.parse(history);
      } catch (e) {
        console.warn("Could not parse history string as JSON:", history);
        return null;
      }
    }
    if (history.response?.schedule) {
      return history;
    }
    if (Array.isArray(history)) {
      if (history.length === 0) return null;
      const latest = history[history.length - 1];
      return normalizeHistoryToOutput(latest);
    }
    if (history.schedule) {
      return { response: { schedule: history.schedule } };
    }
    console.warn(
      "Unrecognized history shape, please check backend response:",
      history,
    );
    return null;
  }

  useEffect(() => {
    if (!isLoggedIn || !email) return;

    async function loadHistory() {
      try {
        const response = await fetch("http://localhost:8000/getHistory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await response.json();
        if (!response.ok) {
          console.error("backend error", data.details);
          return;
        }
        const normalized = normalizeHistoryToOutput(data.history);
        if (normalized) {
          setOutput({ ...normalized, docId: data._id });
        }
      } catch (error) {
        console.error("Network error while fetching history:", error);
      }
    }
    loadHistory();
  }, [isLoggedIn, email]);

  // ---- Delete task ----

  function deleteScheduleItem(originalIndex) {
    setOutput((prev) => {
      if (!prev?.response?.schedule) return prev;
      const newSchedule = prev.response.schedule.filter(
        (_, idx) => idx !== originalIndex,
      );
      return { ...prev, response: { ...prev.response, schedule: newSchedule } };
    });
  }

  async function persistTaskDelete(originalIndex) {
    const docId = output?.docId;
    if (!docId) return;
    try {
      const response = await fetch("http://localhost:8000/deleteTask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId, taskIndex: originalIndex }),
      });
      if (!response.ok) console.error("Failed to persist task deletion");
    } catch (error) {
      console.error("Network error while deleting task:", error);
    }
  }

  function handleDeleteTask(originalIndex) {
    const confirmed = window.confirm("Delete this task?");
    if (!confirmed) return;

    persistTaskDelete(originalIndex);
    deleteScheduleItem(originalIndex);

    if (editingIndex === originalIndex) setEditingIndex(null);
  }

  async function handleGenerate() {
    if (!isLoggedIn || !email) return;
    try {
      const response = await fetch("http://localhost:8000/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input, email }),
      });
      if (!response.ok) throw new Error("Failed to generate study plan");
      const data = await response.json();

      if (!data.success) {
        console.error(data.error);
        return;
      }

      setOutput({
        response: data.response,
        docId: data._id,
      });
      setSelectedDate(null);
    } catch (error) {
      console.error(error);
    }
  }

  const toggleRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input isn't supported in this browser.");
      return;
    }
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      setInput(text);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  // ---- Mark done / Edit ----

  function updateScheduleItem(originalIndex, updatedFields) {
    setOutput((prev) => {
      if (!prev?.response?.schedule) return prev;
      const newSchedule = [...prev.response.schedule];
      newSchedule[originalIndex] = {
        ...newSchedule[originalIndex],
        ...updatedFields,
      };
      return { ...prev, response: { ...prev.response, schedule: newSchedule } };
    });
  }

  async function persistTaskUpdate(originalIndex, updatedFields) {
    const item = output?.response?.schedule?.[originalIndex];
    const docId = output?.docId;
    if (!item || !docId) return;
    try {
      const response = await fetch("http://localhost:8000/updateTask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId,
          taskIndex: originalIndex,
          updates: updatedFields,
        }),
      });
      if (!response.ok) console.error("Failed to persist task update");
    } catch (error) {
      console.error("Network error while updating task:", error);
    }
  }

  function toggleDone(originalIndex, currentDone) {
    const updated = { done: !currentDone };
    updateScheduleItem(originalIndex, updated);
    persistTaskUpdate(originalIndex, updated);
  }

  // This flag is stored alongside the task in its existing MongoDB schedule item.
  function toggleRevision(originalIndex, currentRevisionRequired) {
    const updated = { revisionRequired: !currentRevisionRequired };
    updateScheduleItem(originalIndex, updated);
    persistTaskUpdate(originalIndex, updated);
  }

  function startEdit(originalIndex, task) {
    setIsAddingTask(false);
    setEditingIndex(originalIndex);
    setEditForm({
      task: task.task || "",
      description: task.description || "",
      start_time: task.start_time || "",
      end_time: task.end_time || "",
    });
  }

  function cancelEdit() {
    setEditingIndex(null);
  }

  function saveEdit(originalIndex) {
    updateScheduleItem(originalIndex, editForm);
    persistTaskUpdate(originalIndex, editForm);
    setEditingIndex(null);
  }

  // ---- Add task to any date (empty or existing) ----

  function openAddTask() {
    setEditingIndex(null);
    setNewTaskForm({ task: "", description: "", start_time: "", end_time: "" });
    setIsAddingTask(true);
  }

  function cancelAddTask() {
    setIsAddingTask(false);
  }

  async function saveNewTask() {
    if (!selectedDate || !newTaskForm.task.trim()) return;
    const docId = output?.docId;
    const newItem = { ...newTaskForm, date: selectedDate, done: false, revisionRequired: false };

    setOutput((prev) => {
      const prevSchedule = prev?.response?.schedule || [];
      const newSchedule = [...prevSchedule, newItem];
      return {
        ...(prev || {}),
        response: { ...(prev?.response || {}), schedule: newSchedule },
      };
    });
    setIsAddingTask(false);

    try {
      const response = await fetch("http://localhost:8000/addTask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId, task: newItem }),
      });
      if (!response.ok) console.error("Failed to persist new task");
    } catch (error) {
      console.error("Network error while adding task:", error);
    }
  }

  // ---- Grouping ----

  const scheduleByDate = useMemo(() => {
    const map = {};
    const schedule = output?.response?.schedule || [];
    schedule.forEach((item, idx) => {
      if (!map[item.date]) map[item.date] = [];
      map[item.date].push({
        ...item,
        done: item.done ?? false,
        originalIndex: idx,
      });
    });
    return map;
  }, [output]);

  const calendarWeeks = useMemo(() => {
    const dates = Object.keys(scheduleByDate);
    if (dates.length === 0) return [];
    const sorted = [...dates].sort();
    const first = new Date(sorted[0]);
    const year = first.getFullYear();
    const month = first.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);
    const startOffset = (firstOfMonth.getDay() + 6) % 7;
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= lastOfMonth.getDate(); d++) {
      const dateObj = new Date(year, month, d);
      const iso = dateObj.toISOString().split("T")[0];
      cells.push(iso);
    }
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  }, [scheduleByDate]);

  const monthLabel = useMemo(() => {
    const dates = Object.keys(scheduleByDate).sort();
    if (dates.length === 0) return "";
    const d = new Date(dates[0]);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [scheduleByDate]);

  const detailTasks = selectedDate ? scheduleByDate[selectedDate] || [] : [];

  function selectDate(iso) {
    setSelectedDate(iso);
    setEditingIndex(null);
    setIsAddingTask(false);
  }

  // Still checking localStorage — avoid flashing wrong UI
  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-purple-50">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  // Not logged in — hide the planner entirely
  if (isLoggedIn === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-pink-50 to-purple-50 px-4 text-center">
        <span className="text-4xl">🔒</span>
        <h2 className="text-lg font-bold text-gray-800">Please log in</h2>
        <p className="text-sm text-gray-400 max-w-xs">
          You need to be logged in to view and generate your study timetable.
        </p>
        <a
          href="/Login"
          className="mt-2 rounded-full px-5 py-2.5 bg-gradient-to-br from-pink-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Go to Login
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center gap-6 py-10 px-4 bg-gradient-to-b from-pink-50 to-purple-50">
      <div className="bg-white w-full max-w-xl p-3 flex items-center gap-2 rounded-full shadow-lg shadow-pink-200 border border-pink-100">
        <button
          onClick={toggleRecording}
          className={`rounded-full p-2.5 transition-colors ${
            isRecording
              ? "bg-rose-500 text-white animate-pulse"
              : "bg-pink-100 text-pink-600 hover:bg-pink-200"
          }`}
        >
          {isRecording ? (
            <Square size={18} fill="currentColor" />
          ) : (
            <Mic size={18} />
          )}
        </button>
        <input
          className="w-full bg-transparent border-none focus:outline-none text-gray-700 placeholder:text-gray-400 text-sm"
          value={input}
          type="text"
          placeholder={isRecording ? "Listening..." : "Enter your task..."}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          onClick={handleGenerate}
          className="rounded-full p-2.5 bg-gradient-to-br from-pink-500 to-purple-500 text-white hover:opacity-90 transition-opacity"
        >
          <MoveRight size={18} />
        </button>
      </div>

      {calendarWeeks.length > 0 && (
        <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-5">
          {/* Calendar grid — every day is clickable */}
          <div className="flex-1 bg-white rounded-3xl shadow-lg shadow-pink-200 border border-pink-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800 tracking-wide">
                {monthLabel} <span className="text-pink-400">✨</span>
              </h2>
            </div>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div
                  key={d}
                  className="text-center text-[11px] font-semibold text-purple-400 uppercase tracking-wider"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {calendarWeeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-2">
                  {week.map((iso, di) => {
                    if (!iso) return <div key={di} className="aspect-square" />;
                    const tasks = scheduleByDate[iso] || [];
                    const dayNum = new Date(iso).getDate();
                    const isSelected = selectedDate === iso;
                    const hasTasks = tasks.length > 0;

                    return (
                      <button
                        key={di}
                        onClick={() => selectDate(iso)}
                        className={`aspect-square rounded-xl p-1.5 flex flex-col items-start text-left transition-all
                          ${
                            isSelected
                              ? "bg-gradient-to-br from-pink-400 to-purple-400 text-white shadow-md scale-[1.03]"
                              : hasTasks
                                ? "bg-pink-50 border border-pink-200 hover:bg-pink-100 cursor-pointer"
                                : "bg-gray-50 border border-gray-100 hover:bg-gray-100 cursor-pointer"
                          }`}
                      >
                        <span
                          className={`text-xs font-semibold ${isSelected ? "text-white" : hasTasks ? "text-gray-700" : "text-gray-400"}`}
                        >
                          {dayNum}
                        </span>

                        <div className="flex-1 w-full flex flex-col gap-0.5 mt-1 overflow-hidden">
                          {tasks.slice(0, 2).map((t, ti) => (
                            <span
                              key={ti}
                              className={`text-[9px] leading-tight truncate rounded px-1 ${
                                isSelected
                                  ? "bg-white/25 text-white"
                                  : "bg-pink-200/60 text-pink-700"
                              } ${t.done ? "line-through opacity-60" : ""}`}
                            >
                              {t.task}
                            </span>
                          ))}
                          {tasks.length > 2 && (
                            <span
                              className={`text-[9px] ${isSelected ? "text-white/80" : "text-purple-400"}`}
                            >
                              +{tasks.length - 2} more
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Side detail box — view/edit/done/delete + add new task */}
          <div className="lg:w-80 shrink-0 bg-white rounded-3xl shadow-lg shadow-pink-200 border border-pink-100 p-6">
            {selectedDate ? (
              <>
                <h3 className="text-sm font-bold text-gray-800 mb-1">
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    weekday: "long",
                  })}
                </h3>
                <p className="text-xs text-purple-400 mb-4">
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>

                <div className="flex flex-col gap-3">
                  {detailTasks.map((t) => {
                    const isEditing = editingIndex === t.originalIndex;
                    return (
                      <div
                        key={t.originalIndex}
                        className="rounded-xl bg-pink-50 border border-pink-100 p-3"
                      >
                        {isEditing ? (
                          <div className="flex flex-col gap-2">
                            <input
                              className="text-sm font-semibold text-gray-800 bg-white rounded px-2 py-1 border border-pink-200 focus:outline-none"
                              value={editForm.task}
                              onChange={(e) =>
                                setEditForm((f) => ({
                                  ...f,
                                  task: e.target.value,
                                }))
                              }
                              placeholder="Task name"
                            />
                            <textarea
                              className="text-xs text-gray-600 bg-white rounded px-2 py-1 border border-pink-200 focus:outline-none resize-none"
                              value={editForm.description}
                              onChange={(e) =>
                                setEditForm((f) => ({
                                  ...f,
                                  description: e.target.value,
                                }))
                              }
                              placeholder="Description"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <input
                                type="time"
                                className="text-xs bg-white rounded px-2 py-1 border border-pink-200 focus:outline-none flex-1"
                                value={editForm.start_time}
                                onChange={(e) =>
                                  setEditForm((f) => ({
                                    ...f,
                                    start_time: e.target.value,
                                  }))
                                }
                              />
                              <input
                                type="time"
                                className="text-xs bg-white rounded px-2 py-1 border border-pink-200 focus:outline-none flex-1"
                                value={editForm.end_time}
                                onChange={(e) =>
                                  setEditForm((f) => ({
                                    ...f,
                                    end_time: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="flex gap-2 justify-end mt-1">
                              <button
                                onClick={cancelEdit}
                                className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
                              >
                                <X size={14} />
                              </button>
                              <button
                                onClick={() => saveEdit(t.originalIndex)}
                                className="p-1.5 rounded-full bg-green-500 text-white hover:opacity-90"
                              >
                                <Check size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-2">
                            <button
                              onClick={() =>
                                toggleDone(t.originalIndex, t.done)
                              }
                              className="mt-0.5 shrink-0 text-pink-500 hover:opacity-70"
                            >
                              {t.done ? (
                                <CheckCircle2 size={16} />
                              ) : (
                                <Circle size={16} />
                              )}
                            </button>

                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-semibold text-gray-800 ${t.done ? "line-through opacity-50" : ""}`}
                              >
                                {t.task}
                              </p>
                              {t.description && (
                                <p
                                  className={`text-xs text-gray-500 mt-1 ${t.done ? "line-through opacity-50" : ""}`}
                                >
                                  {t.description}
                                </p>
                              )}
                              <div className="flex items-center gap-1 mt-2 text-pink-500">
                                <Clock size={12} />
                                <span className="text-xs font-medium">
                                  {t.start_time} – {t.end_time}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1 shrink-0">
                              <button
                                onClick={() => toggleRevision(t.originalIndex, t.revisionRequired)}
                                className={`rounded-lg px-2 py-1 text-[10px] font-semibold transition-colors ${
                                  t.revisionRequired
                                    ? "bg-amber-200 text-amber-800 hover:bg-amber-300"
                                    : "bg-white text-purple-500 hover:bg-purple-100"
                                }`}
                              >
                                {t.revisionRequired ? "Marked for Revision" : "Mark for Revision"}
                              </button>
                              <button
                                onClick={() => startEdit(t.originalIndex, t)}
                                className="p-1 rounded-full text-purple-400 hover:bg-purple-100"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteTask(t.originalIndex)
                                }
                                className="p-1 rounded-full text-rose-400 hover:bg-rose-100"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add task form / button — works for empty days too */}
                  {isAddingTask ? (
                    <div className="rounded-xl bg-purple-50 border border-purple-100 p-3">
                      <div className="flex flex-col gap-2">
                        <input
                          className="text-sm font-semibold text-gray-800 bg-white rounded px-2 py-1 border border-purple-200 focus:outline-none"
                          value={newTaskForm.task}
                          onChange={(e) =>
                            setNewTaskForm((f) => ({
                              ...f,
                              task: e.target.value,
                            }))
                          }
                          placeholder="Task name"
                          autoFocus
                        />
                        <textarea
                          className="text-xs text-gray-600 bg-white rounded px-2 py-1 border border-purple-200 focus:outline-none resize-none"
                          value={newTaskForm.description}
                          onChange={(e) =>
                            setNewTaskForm((f) => ({
                              ...f,
                              description: e.target.value,
                            }))
                          }
                          placeholder="Description"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <input
                            type="time"
                            className="text-xs bg-white rounded px-2 py-1 border border-purple-200 focus:outline-none flex-1"
                            value={newTaskForm.start_time}
                            onChange={(e) =>
                              setNewTaskForm((f) => ({
                                ...f,
                                start_time: e.target.value,
                              }))
                            }
                          />
                          <input
                            type="time"
                            className="text-xs bg-white rounded px-2 py-1 border border-purple-200 focus:outline-none flex-1"
                            value={newTaskForm.end_time}
                            onChange={(e) =>
                              setNewTaskForm((f) => ({
                                ...f,
                                end_time: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="flex gap-2 justify-end mt-1">
                          <button
                            onClick={cancelAddTask}
                            className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
                          >
                            <X size={14} />
                          </button>
                          <button
                            onClick={saveNewTask}
                            disabled={!newTaskForm.task.trim()}
                            className="p-1.5 rounded-full bg-green-500 text-white hover:opacity-90 disabled:opacity-40"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={openAddTask}
                      className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-purple-200 text-purple-400 text-sm font-medium py-2.5 hover:bg-purple-50 transition-colors"
                    >
                      <Plus size={14} /> Add task
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <span className="text-3xl mb-2">🗓️</span>
                <p className="text-sm text-gray-400">
                  Tap a day on the calendar
                  <br />
                  to see its tasks here
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
