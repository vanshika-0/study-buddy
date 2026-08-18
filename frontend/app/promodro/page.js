'use client'
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Play, Pause, RotateCcw, SkipForward, Brain, Coffee, Sparkles, Settings2, Camera, Video, X, Square } from 'lucide-react'
import { useVideoPlayer } from '@/Component/VideoPlayerProvider'

const MODES = {
  focus: { label: 'Focus', icon: Brain, defaultMinutes: 25, accent: 'from-pink-500 to-purple-600' },
  short: { label: 'Short Break', icon: Coffee, defaultMinutes: 5, accent: 'from-purple-400 to-fuchsia-400' },
  long: { label: 'Long Break', icon: Sparkles, defaultMinutes: 15, accent: 'from-fuchsia-400 to-pink-400' },
}

const RADIUS = 120
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const TIMER_STORAGE_KEY = 'pomodoroTimerState'

const Page = () => {
  const {
    videoUrl, videoName, cameraStream, cameraError, recordingState,
    openCamera, stopCamera, startRecording, pauseOrResumeRecording, stopRecording,
    addVideoBlob,
  } = useVideoPlayer()
  // These states hold the timer settings and the time currently visible on screen.
  const [durations, setDurations] = useState({ focus: 25, short: 5, long: 15 })
  const [mode, setMode] = useState('focus') // Current timer mode: focus, short, or long.
  const [secondsLeft, setSecondsLeft] = useState(25 * 60) // Remaining time, always stored in seconds.
  const [isRunning, setIsRunning] = useState(false) // False means the timer is paused.
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [autoStart, setAutoStart] = useState(true)
  const [timerRestored, setTimerRestored] = useState(false)

  const intervalRef = useRef(null)
  const audioCtxRef = useRef(null)
  const studySessionStartedAtRef = useRef(null)
  // This timestamp is paired with secondsLeft while the timer runs.
  // It lets us subtract real elapsed time after a refresh or page navigation.
  const lastTickAtRef = useRef(null)
  const cameraVideoRef = useRef(null)
  const studyVideoInputRef = useRef(null)

  const totalSeconds = durations[mode] * 60

  useEffect(() => {
    // The webcam stream itself is global, but this page owns only its preview.
    if (cameraVideoRef.current && cameraStream) {
      cameraVideoRef.current.srcObject = cameraStream
    }
  }, [cameraStream])

  const selectStudyVideo = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    addVideoBlob(file, file.name)
    // Reset lets the user choose the same file again after closing it.
    event.target.value = ''
  }

  // Read the saved timer once when this page opens. localStorage survives
  // refreshes and navigation, unlike normal React state.
  useEffect(() => {
    const restoreTimer = () => {
      const savedTimer = localStorage.getItem(TIMER_STORAGE_KEY)
      if (!savedTimer) {
        setTimerRestored(true)
        return
      }

      try {
        const saved = JSON.parse(savedTimer)
        const savedDurations = { focus: 25, short: 5, long: 15, ...saved.durations }
        const savedMode = MODES[saved.mode] ? saved.mode : 'focus'
        let restoredRemainingTime = Number(saved.remainingTime)

        if (!Number.isFinite(restoredRemainingTime) || restoredRemainingTime < 0) {
          restoredRemainingTime = savedDurations[savedMode] * 60
        }

        // If it was running, calculate how much time passed while this page was closed.
        if (saved.isRunning && saved.startTime) {
          const elapsedSeconds = Math.floor((Date.now() - saved.startTime) / 1000)
          restoredRemainingTime = Math.max(0, restoredRemainingTime - elapsedSeconds)
          lastTickAtRef.current = saved.startTime + elapsedSeconds * 1000
        }

        setDurations(savedDurations)
        setMode(savedMode)
        setSessionsCompleted(Number(saved.sessionsCompleted) || 0)
        setAutoStart(saved.autoStart ?? true)
        studySessionStartedAtRef.current = saved.studySessionStartedAt || null

        if (saved.isRunning && restoredRemainingTime === 0) {
          // The timer completed while the user was away. Let the normal timer
          // completion code move it to the next Pomodoro mode immediately.
          setSecondsLeft(1)
          lastTickAtRef.current = Date.now() - 1000
          setIsRunning(true)
        } else {
          setSecondsLeft(restoredRemainingTime)
          setIsRunning(Boolean(saved.isRunning))
        }
      } catch (error) {
        // A bad saved value should never stop the timer page from opening.
        console.error('Could not restore saved Pomodoro timer:', error)
      } finally {
        setTimerRestored(true)
      }
    }

    const restoreTimerId = window.setTimeout(restoreTimer, 0)
    return () => window.clearTimeout(restoreTimerId)
  }, [])

  // Save the small timer snapshot after every change. This is localStorage only,
  // not MongoDB, so the page can restore the timer immediately after a reload.
  useEffect(() => {
    if (!timerRestored) return

    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({
      remainingTime: secondsLeft,
      isRunning,
      // startTime is the time when this remainingTime value was last accurate.
      startTime: isRunning ? lastTickAtRef.current : null,
      mode,
      durations,
      sessionsCompleted,
      autoStart,
      studySessionStartedAt: studySessionStartedAtRef.current,
    }))
  }, [timerRestored, secondsLeft, isRunning, mode, durations, sessionsCompleted, autoStart])

  const playChime = useCallback(() => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx()
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.8)
    } catch (e) {
      // no-op if audio isn't available
    }
  }, [])

  // Sends one completed focus-time chunk. It is called only when a focus timer
  // is paused, reset, skipped, switched, or finishes -- never every second.
  const saveCurrentStudySession = useCallback(async () => {
    const startedAt = studySessionStartedAtRef.current
    studySessionStartedAtRef.current = null

    // Clear the ref before the request. A second pause/completion event for the
    // same timer run then has no start time and cannot submit it twice.
    if (!startedAt) return

    const duration = Math.floor((Date.now() - startedAt) / 1000)
    if (duration <= 0) return

    const email = localStorage.getItem('email')
    if (!email) {
      console.warn('Study time was not saved because no user is logged in.')
      return
    }

    try {
      const response = await fetch('http://localhost:8000/api/pomodoro/study-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, duration }),
      })

      if (!response.ok) {
        throw new Error('Could not save study time')
      }
    } catch (error) {
      console.error('Failed to save study time:', error)
    }
  }, [])

  const goToNextMode = useCallback(() => {
    setMode((prevMode) => {
      let next
      if (prevMode === 'focus') {
        const willBeLongBreak = (sessionsCompleted + 1) % 4 === 0
        next = willBeLongBreak ? 'long' : 'short'
        setSessionsCompleted((c) => c + 1)
      } else {
        next = 'focus'
      }
      setSecondsLeft(durations[next] * 60)
      return next
    })
  }, [sessionsCompleted, durations])

  useEffect(() => {
    if (!timerRestored || !isRunning) return

    // This also covers auto-start when a break changes back to Focus mode.
    if (mode === 'focus' && !studySessionStartedAtRef.current) {
      studySessionStartedAtRef.current = Date.now()
    }
    if (!lastTickAtRef.current) lastTickAtRef.current = Date.now()

    intervalRef.current = setInterval(() => {
      setSecondsLeft((previousRemainingTime) => {
        // Use real elapsed time because browsers can slow intervals in background tabs.
        const elapsedSeconds = Math.floor((Date.now() - lastTickAtRef.current) / 1000)
        if (elapsedSeconds <= 0) return previousRemainingTime

        lastTickAtRef.current += elapsedSeconds * 1000
        const nextRemainingTime = Math.max(0, previousRemainingTime - elapsedSeconds)

        if (nextRemainingTime === 0) {
          if (mode === 'focus') saveCurrentStudySession()
          playChime()
          goToNextMode()
          lastTickAtRef.current = null
          if (!autoStart) setIsRunning(false)
        }
        return nextRemainingTime
      })
    }, 250)

    return () => clearInterval(intervalRef.current)
  }, [timerRestored, isRunning, goToNextMode, playChime, autoStart, mode, saveCurrentStudySession])

  // Calculates the exact whole seconds left when Pause is clicked, even if it
  // happens between two interval updates.
  const getCurrentRemainingTime = () => {
    if (!lastTickAtRef.current) return secondsLeft
    const elapsedSeconds = Math.floor((Date.now() - lastTickAtRef.current) / 1000)
    return Math.max(0, secondsLeft - elapsedSeconds)
  }

  const toggleRunning = () => {
    if (isRunning) {
      const remainingTime = getCurrentRemainingTime()
      if (mode === 'focus') saveCurrentStudySession()
      // A paused timer saves this exact value and does not keep a start timestamp.
      setSecondsLeft(remainingTime)
      lastTickAtRef.current = null
      setIsRunning(false)
      return
    }

    if (mode === 'focus') studySessionStartedAtRef.current = Date.now()
    // Start a fresh timestamp reference for this running part of the timer.
    lastTickAtRef.current = Date.now()
    setIsRunning(true)
  }

  const resetTimer = () => {
    if (isRunning && mode === 'focus') saveCurrentStudySession()
    lastTickAtRef.current = null
    setIsRunning(false)
    setSecondsLeft(durations[mode] * 60)
  }

  const switchMode = (nextMode) => {
    if (isRunning && mode === 'focus') saveCurrentStudySession()
    lastTickAtRef.current = null
    setIsRunning(false)
    setMode(nextMode)
    setSecondsLeft(durations[nextMode] * 60)
  }

  const skipSession = () => {
    if (isRunning && mode === 'focus') saveCurrentStudySession()
    lastTickAtRef.current = null
    setIsRunning(false)
    goToNextMode()
  }

  const updateDuration = (modeKey, minutes) => {
    const clamped = Math.min(120, Math.max(1, Number(minutes) || 1))
    setDurations((d) => ({ ...d, [modeKey]: clamped }))
    if (modeKey === mode && !isRunning) {
      setSecondsLeft(clamped * 60)
    }
  }

  const minutesStr = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secondsStr = String(secondsLeft % 60).padStart(2, '0')

  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0
  const dashOffset = CIRCUMFERENCE * (1 - progress)

  const ModeIcon = MODES[mode].icon

  const cycleDots = useMemo(() => {
    const filled = sessionsCompleted % 4
    return Array.from({ length: 4 }, (_, i) => i < filled)
  }, [sessionsCompleted])

  return (
    <div className="min-h-screen flex flex-col items-center gap-8 py-10 px-4 bg-gradient-to-b from-pink-50 to-purple-50">

      {/* Mode tabs */}
      <div className="bg-white p-1.5 rounded-full shadow-md shadow-pink-200 border border-pink-100 flex gap-1">
        {Object.entries(MODES).map(([key, m]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
              mode === key
                ? `bg-gradient-to-r ${m.accent} text-white shadow-md`
                : 'text-purple-400 hover:bg-pink-50'
            }`}
          >
            <m.icon size={15} />
            {m.label}
          </button>
        ))}
      </div>

      <div className="w-full max-w-4xl text-center">
        <h1 className="text-2xl font-bold text-gray-800">Your study space</h1>
        <p className="mt-2 text-sm text-purple-600 font-medium">Seeing yourself study can help you stay focused and accountable. Study with yourself, for yourself.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3 text-left">
          <button type="button" onClick={cameraStream ? stopCamera : openCamera} className={`rounded-2xl border p-4 transition-colors ${cameraStream ? 'border-pink-400 bg-pink-100' : 'border-pink-100 bg-white hover:bg-pink-50'}`}>
            <span className="flex items-center gap-2 font-bold text-gray-800"><Camera size={18} className="text-pink-500" /> Camera Session</span>
            <span className="mt-1 block text-xs text-gray-500">{cameraStream ? 'Close your live camera' : 'See or record yourself studying'}</span>
          </button>
          <button type="button" onClick={() => studyVideoInputRef.current?.click()} className="rounded-2xl border border-pink-100 bg-white p-4 hover:bg-pink-50 transition-colors">
            <span className="flex items-center gap-2 font-bold text-gray-800"><Video size={18} className="text-purple-500" /> Play My Study Video</span>
            <span className="mt-1 block text-xs text-gray-500">Choose a video from this device</span>
          </button>
          <div className="rounded-2xl border border-pink-100 bg-white p-4">
            <span className="flex items-center gap-2 font-bold text-gray-800"><Brain size={18} className="text-pink-500" /> Pomodoro Timer</span>
            <span className="mt-1 block text-xs text-gray-500">Focus with timed study sessions</span>
          </div>
          <input ref={studyVideoInputRef} type="file" accept="video/*" className="hidden" onChange={selectStudyVideo} />
        </div>
      </div>

      {/* Timer card */}
      
      <div className="bg-white rounded-3xl shadow-xl shadow-pink-200 border border-pink-100 p-10 flex flex-col items-center gap-6 w-full max-w-md">

        <div className="relative w-64 h-64 flex items-center justify-center">
          <svg className="w-64 h-64 -rotate-90" viewBox="0 0 260 260">
            <circle
              cx="130" cy="130" r={RADIUS}
              fill="none"
              stroke="#fce7f3"
              strokeWidth="14"
            />
            <circle
              cx="130" cy="130" r={RADIUS}
              fill="none"
              stroke="url(#pomodoroGradient)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
            <defs>
              <linearGradient id="pomodoroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 text-pink-400 text-xs font-semibold uppercase tracking-wider">
              <ModeIcon size={14} />
              {MODES[mode].label}
            </div>
            <span className="text-5xl font-bold text-gray-800 tabular-nums">
              {minutesStr}:{secondsStr}
            </span>
          </div>
        </div>

        {/* Session dots */}
        <div className="flex items-center gap-2">
          {cycleDots.map((filled, i) => (
            <span
              key={i}
              className={`w-2.5 h-2.5 rounded-full ${
                filled ? 'bg-gradient-to-br from-pink-500 to-purple-600' : 'bg-pink-100'
              }`}
            />
          ))}
          <span className="text-xs text-purple-400 ml-1">{sessionsCompleted} sessions today</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={resetTimer}
            className="w-11 h-11 rounded-full bg-pink-50 text-pink-500 hover:bg-pink-100 flex items-center justify-center transition-colors"
            aria-label="Reset"
          >
            <RotateCcw size={18} />
          </button>

          <button
            onClick={toggleRunning}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-pink-500/40 hover:scale-105 active:scale-95 transition-transform"
            aria-label={isRunning ? 'Pause' : 'Start'}
          >
            {isRunning ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" className="ml-1" />}
          </button>

          <button
            onClick={skipSession}
            className="w-11 h-11 rounded-full bg-pink-50 text-pink-500 hover:bg-pink-100 flex items-center justify-center transition-colors"
            aria-label="Skip"
          >
            <SkipForward size={18} />
          </button>
        </div>
      </div>

      {(cameraStream || videoUrl) && (
        <div className="w-full max-w-4xl grid gap-5 md:grid-cols-2">
          {cameraStream && (
            <section className="bg-white rounded-3xl shadow-lg shadow-pink-100 border border-pink-100 p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="font-bold text-gray-800 flex items-center gap-2"><Camera size={18} className="text-pink-500" /> Camera Session</h2>
                <button type="button" onClick={stopCamera} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100" aria-label="Close camera"><X size={18} /></button>
              </div>
              <video ref={cameraVideoRef} autoPlay muted playsInline className="w-full aspect-video rounded-2xl bg-gray-900 object-cover" />
              <div className="mt-4 flex flex-wrap gap-2">
                {recordingState === 'inactive' ? (
                  <button type="button" onClick={startRecording} className="rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-3 py-2 text-sm font-semibold text-white">Start Recording</button>
                ) : (
                  <>
                    <button type="button" onClick={pauseOrResumeRecording} className="rounded-xl bg-pink-100 px-3 py-2 text-sm font-semibold text-pink-700">{recordingState === 'paused' ? 'Resume Recording' : 'Pause Recording'}</button>
                    <button type="button" onClick={stopRecording} className="rounded-xl bg-rose-500 px-3 py-2 text-sm font-semibold text-white flex items-center gap-1"><Square size={14} fill="currentColor" /> Stop Recording</button>
                  </>
                )}
              </div>
              {recordingState !== 'inactive' && <p className="mt-2 text-xs font-medium text-rose-500">● {recordingState === 'paused' ? 'Recording paused' : 'Recording in progress'}</p>}
            </section>
          )}

          {videoUrl && (
            <section className="bg-white rounded-3xl shadow-lg shadow-purple-100 border border-purple-100 p-5">
              <h2 className="font-bold text-gray-800 flex items-center gap-2"><Video size={18} className="text-purple-500" /> {videoName || 'My Study Video'}</h2>
              <p className="mt-2 text-sm text-gray-500">Playing in the floating player. It will stay with you while you move between pages.</p>
            </section>
          )}
        </div>
      )}

      {cameraError && <p className="-mt-4 text-sm text-rose-600">{cameraError}</p>}

      {/* Settings toggle */}
      <button
        onClick={() => setShowSettings((s) => !s)}
        className="text-purple-400 text-sm font-medium flex items-center gap-1.5 hover:text-purple-600 transition-colors"
      >
        <Settings2 size={15} />
        {showSettings ? 'Hide settings' : 'Customize durations'}
      </button>

      {showSettings && (
        <div className="bg-white rounded-3xl shadow-lg shadow-pink-200 border border-pink-100 p-6 w-full max-w-md flex flex-col gap-4">
          {Object.entries(MODES).map(([key, m]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <m.icon size={15} className="text-pink-400" />
                {m.label}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={durations[key]}
                  onChange={(e) => updateDuration(key, e.target.value)}
                  className="w-16 p-2 text-center bg-pink-50 border border-pink-200 rounded-xl text-pink-700 outline-none focus:ring-2 focus:ring-pink-400"
                />
                <span className="text-xs text-purple-400">min</span>
              </div>
            </div>
          ))}

          <label className="flex items-center justify-between gap-4 pt-2 border-t border-pink-100">
            <span className="text-sm font-medium text-gray-700">Auto-start next session</span>
            <button
              type="button"
              onClick={() => setAutoStart((a) => !a)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                autoStart ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-pink-100'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  autoStart ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>
        </div>
      )}
    </div>
  )
}

export default Page
