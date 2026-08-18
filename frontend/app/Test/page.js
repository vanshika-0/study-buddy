'use client'

import { useMemo, useState } from 'react'
import { ClipboardList, ChevronLeft, ChevronRight, Loader2, RotateCcw } from 'lucide-react'

const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

export default function Page() {
  const [topic, setTopic] = useState('')
  const [numQuestions, setNumQuestions] = useState(5)
  const [difficulty, setDifficulty] = useState('Medium')
  const [questions, setQuestions] = useState(null)
  const [answers, setAnswers] = useState({})
  const [index, setIndex] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const score = useMemo(() => submitted && questions ? questions.reduce((total, question, questionIndex) => total + (answers[questionIndex] === question.correct_answer ? 1 : 0), 0) : 0, [answers, questions, submitted])

  async function generate(event) {
    event.preventDefault()
    const email = localStorage.getItem('email')
    if (!topic.trim()) return setError('Please enter a topic.')
    if (!email) return setError('Please log in first.')
    setLoading(true); setError('')
    try {
      const response = await fetch('http://localhost:8000/generateTest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, topic, numQuestions, difficulty, questionType: 'MCQ', testMode: 'Practice' }) })
      const data = await response.json()
      if (!response.ok || !data.questions?.length) throw new Error(data.detail || data.error || 'No questions generated.')
      setQuestions(data.questions); setAnswers({}); setIndex(0); setSubmitted(false)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  async function submitTest() {
    setSubmitted(true)
    const finalScore = questions.reduce((total, question, questionIndex) => total + (answers[questionIndex] === question.correct_answer ? 1 : 0), 0)
    try {
      await fetch('http://localhost:8000/storeScore', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: localStorage.getItem('email'), score: finalScore }) })
    } catch (err) { console.error('Could not store score:', err) }
  }

  if (!questions) return <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-purple-50 p-4"><form onSubmit={generate} className="w-full max-w-lg rounded-3xl border border-pink-100 bg-white p-8 shadow-xl shadow-pink-200"><div className="text-center"><span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-white"><ClipboardList /></span><h1 className="mt-3 text-xl font-bold">Create a Test</h1><p className="text-sm text-purple-400">Enter a topic and we&apos;ll build one for you.</p></div><label className="mt-6 block text-sm font-semibold text-pink-700">Topic<input value={topic} onChange={(e) => setTopic(e.target.value)} className="mt-1 w-full rounded-2xl border border-pink-200 bg-pink-50 p-4" placeholder="Dynamic Programming, World War II..." /></label><div className="mt-4 grid grid-cols-2 gap-4"><label className="text-sm font-semibold text-pink-700">Questions<input type="number" min="1" max="20" value={numQuestions} onChange={(e) => setNumQuestions(Math.min(20, Math.max(1, +e.target.value || 1)))} className="mt-1 w-full rounded-2xl border border-pink-200 bg-pink-50 p-4" /></label><div><p className="text-sm font-semibold text-pink-700">Difficulty</p><div className="mt-1 flex rounded-2xl border border-pink-200 bg-pink-50 p-1">{DIFFICULTIES.map((item) => <button type="button" onClick={() => setDifficulty(item)} key={item} className={`flex-1 rounded-xl py-2 text-xs font-bold ${difficulty === item ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white' : 'text-pink-500'}`}>{item}</button>)}</div></div></div>{error && <p className="mt-4 text-sm text-rose-600">{error}</p>}<button disabled={loading} className="mt-6 w-full rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 p-4 font-semibold text-white disabled:opacity-60">{loading ? <><Loader2 className="mr-2 inline animate-spin" size={16}/>Generating...</> : 'Generate Test'}</button></form></main>

  if (submitted) return <main className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 p-6"><section className="mx-auto max-w-2xl rounded-3xl border border-pink-100 bg-white p-8 text-center shadow-xl shadow-pink-200"><h1 className="text-2xl font-bold">You scored {score}/{questions.length}</h1><p className="mt-2 text-purple-500">{Math.round(score / questions.length * 100)}% on {topic} ({difficulty})</p><button onClick={() => { setQuestions(null); setTopic(''); setSubmitted(false) }} className="mt-6 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-3 font-semibold text-white"><RotateCcw className="mr-1 inline" size={16}/>Try another topic</button></section><div className="mx-auto mt-5 max-w-2xl space-y-3">{questions.map((question, questionIndex) => <section key={questionIndex} className="rounded-2xl bg-white p-5 shadow"><p className="font-semibold">{questionIndex + 1}. {question.question}</p><p className="mt-2 text-sm text-purple-500">{question.explanation}</p></section>)}</div></main>

  const question = questions[index]
  return <main className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 p-6"><div className="mx-auto max-w-2xl"><div className="flex justify-between text-sm font-semibold text-purple-500"><span>Question {index + 1} of {questions.length}</span><span>{topic}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-pink-100"><div className="h-full bg-gradient-to-r from-pink-500 to-purple-600" style={{ width: `${(index + 1) / questions.length * 100}%` }}/></div><section className="mt-5 rounded-3xl border border-pink-100 bg-white p-7 shadow-xl shadow-pink-200"><h1 className="text-lg font-bold">{question.question}</h1><div className="mt-5 space-y-3">{question.options.map((option, optionIndex) => <button onClick={() => setAnswers((old) => ({ ...old, [index]: optionIndex }))} key={optionIndex} className={`w-full rounded-2xl border px-4 py-3 text-left ${answers[index] === optionIndex ? 'border-transparent bg-gradient-to-r from-pink-500 to-purple-600 text-white' : 'border-pink-200 bg-pink-50'}`}>{option}</button>)}</div></section><div className="mt-5 flex justify-between"><button disabled={!index} onClick={() => setIndex((value) => value - 1)} className="rounded-2xl bg-white px-4 py-2 text-pink-600 disabled:opacity-40"><ChevronLeft className="inline" size={16}/>Previous</button>{index === questions.length - 1 ? <button onClick={submitTest} className="rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-2 font-semibold text-white">Submit Test</button> : <button onClick={() => setIndex((value) => value + 1)} className="rounded-2xl bg-white px-4 py-2 text-pink-600">Next<ChevronRight className="inline" size={16}/></button>}</div></div></main>
}
