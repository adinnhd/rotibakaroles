"use client"

import { useState, useRef, useCallback, useEffect } from "react"

const STT_API_URL = process.env.NEXT_PUBLIC_STT_API_URL ?? "http://127.0.0.1:8020"

interface UseWhisperTranscribeReturn {
  isRecording: boolean
  isTranscribing: boolean
  transcript: string
  error: string | null
  startRecording: () => void
  stopRecording: () => void
  resetTranscript: () => void
}

export function useWhisperTranscribe(
  onTranscribed?: (text: string) => void
): UseWhisperTranscribeReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const isBusyRef = useRef(false)
  const onTranscribedRef = useRef(onTranscribed)

  useEffect(() => {
    onTranscribedRef.current = onTranscribed
  }, [onTranscribed])

  const startRecording = useCallback(() => {
    if (isBusyRef.current) return

    // Check browser support
    if (typeof window === "undefined") {
      setError("Browser tidak support")
      return
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Browser tidak support MediaRecorder")
      return
    }

    isBusyRef.current = true

    // Reset state
    setError(null)
    setTranscript("")
    audioChunksRef.current = []

    // Request microphone permission and start recording
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        streamRef.current = stream

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "audio/webm;codecs=opus",
        })

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        mediaRecorder.onstop = async () => {
          console.log("[STT] recording stopped, chunks:", audioChunksRef.current.length)

          // Stop all tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
          }

          // Create audio blob
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
          console.log("[STT] audio blob size:", audioBlob.size, "bytes")

          // Send to Whisper backend
          setIsTranscribing(true)

          try {
            const formData = new FormData()
            formData.append("audio", audioBlob, "recording.webm")

            console.log("[STT] sending to", STT_API_URL)
            const response = await fetch(`${STT_API_URL}/transcribe`, {
              method: "POST",
              body: formData,
            })

            if (!response.ok) {
              throw new Error(`HTTP error: ${response.status}`)
            }

            const result = await response.json()
            const transcribedText = (result.data?.text ?? "").trim()

            console.log("[STT] transcript:", transcribedText || "(kosong)")
            setTranscript(transcribedText)
            setError(null)
            onTranscribedRef.current?.(transcribedText)
          } catch (err) {
            console.error("Transcription error:", err)
            setError(err instanceof Error ? err.message : "Transcription failed")
          } finally {
            isBusyRef.current = false
            setIsTranscribing(false)
            setIsRecording(false)
          }
        }

        mediaRecorderRef.current = mediaRecorder
        mediaRecorder.start(100) // Collect data every 100ms

        setIsRecording(true)
        setError(null)
      })
      .catch((err) => {
        console.error("Microphone access error:", err)
        isBusyRef.current = false
        setError("Tidak bisa akses mikrofon")
        setIsRecording(false)
      })
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      setIsRecording(false)
      mediaRecorderRef.current.stop()
    }
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript("")
    setError(null)
    audioChunksRef.current = []
  }, [])

  return {
    isRecording,
    isTranscribing,
    transcript,
    error,
    startRecording,
    stopRecording,
    resetTranscript,
  }
}
