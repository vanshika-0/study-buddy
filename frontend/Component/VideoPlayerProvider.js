'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Download, Minimize2, X } from 'lucide-react'
import { usePathname } from 'next/navigation'

const VideoPlayerContext = createContext(null)
const DB_NAME = 'study-video-player'
const STORE_NAME = 'player'
const VIDEO_KEY = 'current-video'
const STATE_KEY = 'current-state'

// A tiny IndexedDB helper keeps the video Blob out of localStorage, which is
// too small for videos. Both the selected file and recordings use this store.
const withStore = (mode, action) => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, 1)
  request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME)
  request.onerror = () => reject(request.error)
  request.onsuccess = () => {
    const transaction = request.result.transaction(STORE_NAME, mode)
    const store = transaction.objectStore(STORE_NAME)
    action(store, resolve, reject)
    transaction.onerror = () => reject(transaction.error)
  }
})

const readValue = (key) => withStore('readonly', (store, resolve, reject) => {
  const request = store.get(key)
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error)
})

const writeValue = (key, value) => withStore('readwrite', (store, resolve, reject) => {
  const request = store.put(value, key)
  request.onsuccess = () => resolve()
  request.onerror = () => reject(request.error)
})

const deleteValue = (key) => withStore('readwrite', (store, resolve, reject) => {
  const request = store.delete(key)
  request.onsuccess = () => resolve()
  request.onerror = () => reject(request.error)
})

export const useVideoPlayer = () => {
  const context = useContext(VideoPlayerContext)
  if (!context) throw new Error('useVideoPlayer must be used inside VideoPlayerProvider')
  return context
}

export default function VideoPlayerProvider({ children }) {
  const pathname = usePathname()
  const [videoUrl, setVideoUrl] = useState('')
  const [videoName, setVideoName] = useState('')
  const [isReady, setIsReady] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [cameraStream, setCameraStream] = useState(null)
  const [recordingState, setRecordingState] = useState('inactive')
  const videoRef = useRef(null)
  const objectUrlRef = useRef('')
  const savedStateRef = useRef({ position: 0, wasPlaying: false })
  const previousPathRef = useRef(pathname)
  const pausingForRouteRef = useRef(false)
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])
  const cameraStreamRef = useRef(null)

  const replaceObjectUrl = useCallback((blob) => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    const nextUrl = URL.createObjectURL(blob)
    objectUrlRef.current = nextUrl
    setVideoUrl(nextUrl)
  }, [])

  // Restore the Blob and last playback point after a browser reload.
  useEffect(() => {
    let cancelled = false
    const restoreVideo = async () => {
      try {
        const [blob, savedState] = await Promise.all([readValue(VIDEO_KEY), readValue(STATE_KEY)])
        if (cancelled || !blob) return
        savedStateRef.current = savedState || { position: 0, wasPlaying: false }
        setVideoName(savedState?.name || 'My study video')
        replaceObjectUrl(blob)
      } catch (error) {
        console.error('Could not restore saved study video:', error)
      } finally {
        if (!cancelled) setIsReady(true)
      }
    }
    restoreVideo()
    return () => {
      cancelled = true
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [replaceObjectUrl])

  const savePlaybackState = useCallback((position, wasPlaying) => {
    const state = { position, wasPlaying, name: videoName || 'My study video' }
    savedStateRef.current = state
    writeValue(STATE_KEY, state).catch((error) => console.error('Could not save video position:', error))
  }, [videoName])

  const addVideoBlob = useCallback(async (blob, name = 'My study video') => {
    if (!blob) return
    try {
      await writeValue(VIDEO_KEY, blob)
      const nextState = { position: 0, wasPlaying: false, name }
      await writeValue(STATE_KEY, nextState)
      savedStateRef.current = nextState
      setVideoName(name)
      replaceObjectUrl(blob)
      setIsMinimized(false)
    } catch (error) {
      console.error('Could not save study video:', error)
    }
  }, [replaceObjectUrl])

  // Camera and MediaRecorder are held here, above every route. This is why a
  // live recording keeps running even when promodro/page.js unmounts.
  const openCamera = useCallback(async () => {
    if (cameraStreamRef.current) return
    setCameraError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      cameraStreamRef.current = stream
      setCameraStream(stream)
    } catch (error) {
      console.error('Could not access camera:', error)
      setCameraError('Camera access was not granted. Please allow it and try again.')
    }
  }, [])

  const startRecording = useCallback(() => {
    const stream = cameraStreamRef.current
    if (!stream || !window.MediaRecorder || mediaRecorderRef.current?.state === 'recording') return

    recordedChunksRef.current = []
    const recorder = new MediaRecorder(stream)
    mediaRecorderRef.current = recorder
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunksRef.current.push(event.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'video/webm' })
      mediaRecorderRef.current = null
      setRecordingState('inactive')
      addVideoBlob(blob, 'study-recording.webm')
    }
    recorder.start()
    setRecordingState('recording')
  }, [addVideoBlob])

  const pauseOrResumeRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (!recorder) return
    if (recorder.state === 'recording') {
      recorder.pause()
      setRecordingState('paused')
    } else if (recorder.state === 'paused') {
      recorder.resume()
      setRecordingState('recording')
    }
  }, [])

  const stopRecording = useCallback(() => {
    // Optional chaining prevents `null.stop()` while never touching a live
    // recorder unless the user explicitly presses Stop Recording.
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current.stop()
  }, [])

  const stopCamera = useCallback(() => {
    // Closing the camera is an explicit action, so it may stop a live recording.
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current.stop()
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop())
    cameraStreamRef.current = null
    setCameraStream(null)
  }, [])

  const removeVideo = useCallback(async () => {
    const position = videoRef.current?.currentTime || 0
    videoRef.current?.pause()
    try {
      await Promise.all([deleteValue(VIDEO_KEY), deleteValue(STATE_KEY)])
    } catch (error) {
      console.error('Could not remove saved study video:', error)
    }
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    objectUrlRef.current = ''
    setVideoUrl('')
    setVideoName('')
    savedStateRef.current = { position, wasPlaying: false }
  }, [])

  const handleLoadedMetadata = () => {
    const player = videoRef.current
    if (!player) return
    player.currentTime = Math.min(savedStateRef.current.position || 0, player.duration || 0)
    if (savedStateRef.current.wasPlaying) {
      // Browsers may block sound autoplay after a reload. The player remains at
      // the exact position and the user can continue with one click if blocked.
      player.play().catch(() => {})
    }
  }

  const handleTimeUpdate = () => {
    const player = videoRef.current
    if (player && Math.floor(player.currentTime) !== Math.floor(savedStateRef.current.position || 0)) {
      savePlaybackState(player.currentTime, !player.paused)
    }
  }

  useEffect(() => {
    const previousPath = previousPathRef.current
    const player = videoRef.current

    // Only normal playback pauses on navigation away from the Pomodoro page.
    // The camera/MediaRecorder state above is deliberately not touched here.
    if (previousPath === '/promodro' && pathname !== '/promodro' && player) {
      const wasPlaying = !player.paused
      savePlaybackState(player.currentTime, wasPlaying)
      pausingForRouteRef.current = true
      player.pause()
    }

    if (previousPath !== '/promodro' && pathname === '/promodro' && player) {
      const { position, wasPlaying } = savedStateRef.current
      player.currentTime = position || 0
      if (wasPlaying) player.play().catch(() => {})
    }

    previousPathRef.current = pathname
  }, [pathname, videoUrl, savePlaybackState])

  useEffect(() => {
    const saveBeforeReload = () => {
      const player = videoRef.current
      if (player) savePlaybackState(player.currentTime, !player.paused)
    }
    // Capture the final fraction of a second that may not have reached the
    // regular timeupdate handler before a refresh or browser close.
    window.addEventListener('pagehide', saveBeforeReload)
    return () => window.removeEventListener('pagehide', saveBeforeReload)
  }, [savePlaybackState])

  useEffect(() => () => {
    // The provider only unmounts when the app closes. It is intentionally not
    // tied to route changes, so navigation cannot stop an active recording.
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current.stop()
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop())
  }, [])

  const contextValue = {
    videoUrl, videoName, isReady, addVideoBlob, removeVideo,
    cameraStream, cameraError, recordingState,
    openCamera, stopCamera, startRecording, pauseOrResumeRecording, stopRecording,
  }

  return (
    <VideoPlayerContext.Provider value={contextValue}>
      {children}
      {videoUrl && (
        <aside className={`fixed bottom-4 right-4 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-purple-200 bg-white shadow-2xl shadow-purple-300/40 ${isMinimized ? 'w-auto' : ''}`}>
          {isMinimized ? (
            <button type="button" onClick={() => setIsMinimized(false)} className="px-4 py-3 text-sm font-semibold text-purple-700">▶ Continue: {videoName}</button>
          ) : (
            <>
              <div className="flex items-center gap-2 px-3 py-2">
                <p className="flex-1 truncate text-sm font-semibold text-gray-800">{videoName}</p>
                <button type="button" onClick={() => setIsMinimized(true)} className="rounded p-1 text-gray-500 hover:bg-gray-100" aria-label="Minimize video"><Minimize2 size={16} /></button>
                <button type="button" onClick={removeVideo} className="rounded p-1 text-gray-500 hover:bg-gray-100" aria-label="Close video"><X size={17} /></button>
              </div>
              <video ref={videoRef} src={videoUrl} controls playsInline onLoadedMetadata={handleLoadedMetadata} onTimeUpdate={handleTimeUpdate} onPlay={() => savePlaybackState(videoRef.current?.currentTime || 0, true)} onPause={() => {
                if (pausingForRouteRef.current) {
                  pausingForRouteRef.current = false
                  return
                }
                savePlaybackState(videoRef.current?.currentTime || 0, false)
              }} className="block w-full bg-gray-950" />
              <a href={videoUrl} download={videoName || 'study-video.webm'} className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-purple-700 hover:text-purple-900"><Download size={14} /> Download video</a>
            </>
          )}
        </aside>
      )}
    </VideoPlayerContext.Provider>
  )
}
