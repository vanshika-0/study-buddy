"use client";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { apiUrl } from "@/lib/api";

const API = apiUrl("");
const TYPES = [
  ["MCQ", "Multiple choice"],
  ["Short Answer", "Non-MCQ / Short Answer"],
  ["Mixed", "MCQ + Short Answer"],
];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

export default function TestPage() {
  const [topic, setTopic] = useState(""),
    [count, setCount] = useState(5),
    [difficulty, setDifficulty] = useState("Medium"),
    [questionType, setQuestionType] = useState("MCQ");
  const [questions, setQuestions] = useState(null),
    [answers, setAnswers] = useState({}),
    [index, setIndex] = useState(0),
    [started, setStarted] = useState(0),
    [result, setResult] = useState(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const current = questions?.[index];

  async function generate(e) {
    e?.preventDefault();
    const email = localStorage.getItem("email");
    if (!topic.trim()) return setError("Please enter a topic.");
    if (!email) return setError("Please log in first.");
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`${API}/generateTest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          topic,
          numQuestions: count,
          difficulty,
          questionType,
          testMode: "Practice",
        }),
      });
      const d = await r.json();
      if (!r.ok || !d.questions?.length)
        throw new Error(d.error || "No questions generated.");
      setQuestions(d.questions);
      setAnswers({});
      setIndex(0);
      setStarted(Date.now());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  async function submit() {
    try {
      const r = await fetch(`${API}/api/tests/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: localStorage.getItem("email"),
          topic,
          questions,
          answers,
          difficulty,
          questionType,
          testMode: "Practice",
          timeTaken: Math.floor((Date.now() - started) / 1000),
          advancedOptions: {},
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Could not save result");
      setResult(d.result);
    } catch (err) {
      setError(err.message);
    }
  }
  if (result)
    return (
      <main className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 p-6">
        <section className="mx-auto mt-16 max-w-xl rounded-3xl border border-pink-100 bg-white p-10 text-center shadow-xl shadow-pink-200">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-500">
            Test complete
          </p>
          <h1 className="mt-3 text-3xl font-bold text-gray-800">Final score</h1>
          <p className="mt-4 text-6xl font-bold text-purple-600">
            {result.score}/{questions.length}
          </p>
          <p className="mt-2 text-purple-500">{result.accuracy}%</p>
          <button
            onClick={() => {
              setQuestions(null);
              setResult(null);
              setAnswers({});
              setError("");
            }}
            className="mt-8 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 font-semibold text-white"
          >
            <RotateCcw size={16} className="mr-1 inline" />
            New test
          </button>
        </section>
      </main>
    );
  if (!questions)
    return (
      <main className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 p-4">
        <form
          onSubmit={generate}
          className="mx-auto mt-8 w-full max-w-lg rounded-3xl border border-pink-100 bg-white p-8 shadow-xl shadow-pink-200"
        >
          <div className="text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-white">
              <ClipboardList />
            </span>
            <h1 className="mt-3 text-2xl font-bold">Create a Test</h1>
            <p className="text-sm text-purple-400">
              Choose how you want to demonstrate understanding.
            </p>
          </div>
          <label className="mt-6 block text-sm font-semibold text-pink-700">
            Topic
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-pink-200 bg-pink-50 p-4"
              placeholder="Dynamic Programming..."
            />
          </label>
          <p className="mt-4 text-sm font-semibold text-pink-700">
            Question Type
          </p>
          <div className="mt-1 grid gap-2">
            {TYPES.map(([value, label]) => (
              <button
                type="button"
                key={value}
                onClick={() => setQuestionType(value)}
                className={`rounded-xl border p-3 text-left text-sm ${questionType === value ? "border-transparent bg-gradient-to-r from-pink-500 to-purple-600 text-white" : "border-pink-200 bg-pink-50 text-purple-600"}`}
              >
                <b>{value}</b>
                <span className="ml-2 text-xs opacity-80">{label}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <label className="text-sm font-semibold text-pink-700">
              Questions
              <input
                type="number"
                min="1"
                max="20"
                value={count}
                onChange={(e) =>
                  setCount(Math.min(20, Math.max(1, +e.target.value || 1)))
                }
                className="mt-1 w-full rounded-2xl border border-pink-200 bg-pink-50 p-4"
              />
            </label>
            <div>
              <p className="text-sm font-semibold text-pink-700">Difficulty</p>
              <div className="mt-1 flex rounded-2xl border border-pink-200 bg-pink-50 p-1">
                {DIFFICULTIES.map((x) => (
                  <button
                    type="button"
                    key={x}
                    onClick={() => setDifficulty(x)}
                    className={`flex-1 rounded-xl py-2 text-xs font-bold ${difficulty === x ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white" : "text-pink-500"}`}
                  >
                    {x}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
          <button
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 p-4 font-semibold text-white disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 inline animate-spin" size={16} />
                Generating...
              </>
            ) : (
              "Generate Test"
            )}
          </button>
        </form>
      </main>
    );
  const answerIsText =
    questionType === "Short Answer" ||
    (questionType === "Mixed" &&
      current.questionType !== "MCQ" &&
      !Array.isArray(current.options));
  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 p-6">
      <div className="mx-auto max-w-2xl">
        <div className="flex justify-between text-sm font-semibold text-purple-500">
          <span>
            Question {index + 1} of {questions.length}
          </span>
          <span>{topic}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-pink-100">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-purple-600"
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </div>
        <section className="mt-5 rounded-3xl border border-pink-100 bg-white p-7 shadow-xl shadow-pink-200">
          <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-600">
            {current.questionType || questionType}
          </span>
          <h1 className="mt-5 text-lg font-bold">{current.question}</h1>
          {answerIsText ? (
            <textarea
              value={answers[index] || ""}
              onChange={(e) =>
                setAnswers((old) => ({ ...old, [index]: e.target.value }))
              }
              rows="5"
              placeholder="Write your answer..."
              className="mt-5 w-full rounded-2xl border border-pink-200 bg-pink-50 p-4 outline-none"
            />
          ) : (
            <div className="mt-5 space-y-3">
              {(current.options || []).map((option, optionIndex) => (
                <button
                  key={optionIndex}
                  onClick={() =>
                    setAnswers((old) => ({ ...old, [index]: optionIndex }))
                  }
                  className={`w-full rounded-2xl border px-4 py-3 text-left ${answers[index] === optionIndex ? "border-transparent bg-gradient-to-r from-pink-500 to-purple-600 text-white" : "border-pink-200 bg-pink-50"}`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </section>
        <div className="mt-5 flex justify-between">
          <button
            disabled={!index}
            onClick={() => setIndex((x) => x - 1)}
            className="rounded-2xl bg-white px-4 py-2 text-pink-600 disabled:opacity-40"
          >
            <ChevronLeft className="inline" size={16} />
            Previous
          </button>
          {index === questions.length - 1 ? (
            <button
              onClick={submit}
              className="rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-2 font-semibold text-white"
            >
              Submit Test
            </button>
          ) : (
            <button
              onClick={() => setIndex((x) => x + 1)}
              className="rounded-2xl bg-white px-4 py-2 text-pink-600"
            >
              Next
              <ChevronRight className="inline" size={16} />
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
