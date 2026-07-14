"use client"

import { useState, useRef, useCallback } from "react"

interface SpeechRecognitionResult {
  text: string
  confidence: number
}

export function useSpeechRecognition() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [lastResult, setLastResult] = useState<SpeechRecognitionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  const startRecording = useCallback(() => {
    // Cek browser support
    if (typeof window === "undefined") {
      setError("Browser tidak support")
      return
    }

    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setError("Browser tidak support Speech Recognition")
      return
    }

    // @ts-expect-error Webkit Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "id-ID"
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsRecording(true)
      setError(null)
    }

    recognition.onresult = (event: any) => {
      const result = event.results[0][0]
      const text = result.transcript
      const confidence = result.confidence

      setTranscript(text)
      setLastResult({ text, confidence })
      setIsRecording(false)
    }

    recognition.onerror = (event: { error: string }) => {
      console.error("Speech recognition error:", event.error)
      setError(event.error)
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript("")
    setLastResult(null)
    setError(null)
  }, [])

  return {
    isRecording,
    isProcessing,
    transcript,
    lastResult,
    error,
    startRecording,
    stopRecording,
    resetTranscript,
  }
}
