"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { RotateCcw, ScanLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VoiceButton } from "@/components/VoiceButton"
import type { ParsedMenuItem } from "@/lib/voice-parser"
import {
  clampRecommendedPeopleCount,
  PEOPLE_DETECTED_AUDIO_BY_COUNT,
} from "@/lib/constants"
import { translations, type Language } from "@/lib/i18n"

const CV_API_URL = process.env.NEXT_PUBLIC_CV_API_URL ?? "http://127.0.0.1:8000"
const DETECTION_SAMPLE_TARGET = 5
const DETECTION_SAMPLE_DELAY_MS = 700
const MIN_STABLE_SAMPLE_COUNT = 3

type DetectionStatus = "detecting" | "locked" | "error"

interface CameraSectionProps {
  isVisible: boolean
  detectedPeopleCount: number
  hasCompletedDetection: boolean
  onPeopleCountDetected: (count: number) => void
  onDetectionReset: () => void
  onVoiceMenuParsed?: (items: ParsedMenuItem[]) => void
  language?: Language
}

export function CameraSection({
  isVisible,
  detectedPeopleCount,
  hasCompletedDetection,
  onPeopleCountDetected,
  onDetectionReset,
  onVoiceMenuParsed,
  language = "id",
}: CameraSectionProps) {
  const TC = translations[language].camera
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionRunRef = useRef(0)
  const isVisibleRef = useRef(isVisible)
  const [status, setStatus] = useState<DetectionStatus>(
    hasCompletedDetection ? "locked" : "detecting"
  )
  const [sampleCount, setSampleCount] = useState(0)
  const [lockedCount, setLockedCount] = useState<number | null>(
    hasCompletedDetection ? detectedPeopleCount : null
  )
  const [lastPreviewFrame, setLastPreviewFrame] = useState<string | null>(null)
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)

  const resumePreview = useCallback(async () => {
    const video = videoRef.current
    const stream = streamRef.current
    const videoTrack = stream?.getVideoTracks()[0]

    if (
      !video ||
      !stream ||
      !videoTrack ||
      videoTrack.readyState !== "live"
    ) {
      return
    }

    if (video.srcObject !== stream) {
      video.srcObject = stream
    }

    video.muted = true

    try {
      await video.play()
    } catch (err) {
      setIsPreviewPlaying(false)
      console.log("preview kamera gagal diputar", err)
    }
  }, [])

  const handlePreviewInterrupted = useCallback(() => {
    setIsPreviewPlaying(false)
    void resumePreview()
  }, [resumePreview])

  useEffect(() => {
    isVisibleRef.current = isVisible
  }, [isVisible])

  const playPeopleDetectedAudio = useCallback((count: number) => {
    if (!isVisibleRef.current) return

    const audioPath = PEOPLE_DETECTED_AUDIO_BY_COUNT[count]

    if (!audioPath) {
      return
    }

    const audio = new Audio(audioPath)
    audio.play().catch((err) => {
      console.log("audio deteksi orang gagal diputar", err)
    })
  }, [])

  const capturePeopleCount = useCallback(async () => {
    const video = videoRef.current

    if (
      !video ||
      video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      return null
    }

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const context = canvas.getContext("2d")

    if (!context) {
      return null
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    setLastPreviewFrame(canvas.toDataURL("image/jpeg", 0.7))

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.8)
    })

    if (!blob) {
      return null
    }

    const response = await fetch(`${CV_API_URL}/detect`, {
      method: "POST",
      headers: {
        "Content-Type": "image/jpeg",
      },
      body: blob,
    })

    if (!response.ok) {
      throw new Error("Detection request failed")
    }

    const result = await response.json()
    const detectedCount = Number(result?.data?.people_count)

    if (!Number.isFinite(detectedCount)) {
      return null
    }

    return clampRecommendedPeopleCount(detectedCount)
  }, [])

  const getStableCount = useCallback((counts: number[]) => {
    const frequency = new Map<number, number>()

    counts.forEach((count) => {
      frequency.set(count, (frequency.get(count) ?? 0) + 1)
    })

    const [mostFrequentCount, mostFrequentTotal] = [...frequency.entries()]
      .sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]

    if (mostFrequentTotal >= MIN_STABLE_SAMPLE_COUNT) {
      return mostFrequentCount
    }

    return [...counts].sort((a, b) => a - b)[Math.floor(counts.length / 2)]
  }, [])

  const restartDetection = useCallback(() => {
    detectionRunRef.current += 1
    onDetectionReset()
    setSampleCount(0)
    setLockedCount(null)
    setStatus("detecting")
  }, [onDetectionReset])

  useEffect(() => {
    let isCancelled = false

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        })

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream

        const videoTrack = stream.getVideoTracks()[0]
        if (videoTrack) {
          videoTrack.addEventListener("mute", handlePreviewInterrupted)
          videoTrack.addEventListener("unmute", resumePreview)
        }

        await resumePreview()
      } catch (err) {
        console.log("kamera gagal", err)
        setStatus("error")

      }
    }

    startCamera()

    return () => {
      isCancelled = true
      detectionRunRef.current += 1

      const videoTrack = streamRef.current?.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.removeEventListener("mute", handlePreviewInterrupted)
        videoTrack.removeEventListener("unmute", resumePreview)
      }

      streamRef.current
        ?.getTracks()
        .forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [handlePreviewInterrupted, resumePreview])

  useEffect(() => {
    const animationFrameId = requestAnimationFrame(() => {
      void resumePreview()
    })

    return () => cancelAnimationFrame(animationFrameId)
  }, [isVisible, resumePreview, status])

  useEffect(() => {
    if (status !== "detecting") {
      return
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let isCancelled = false
    const detectionRunId = detectionRunRef.current
    const detectedCounts: number[] = []

    async function detectSamples() {
      while (
        detectedCounts.length < DETECTION_SAMPLE_TARGET &&
        !isCancelled &&
        detectionRunRef.current === detectionRunId
      ) {
        try {
          const detectedCount = await capturePeopleCount()

          if (detectedCount !== null) {
            detectedCounts.push(detectedCount)
            setSampleCount(detectedCounts.length)
          }
        } catch (err) {
          console.log("deteksi orang gagal", err)
          setStatus("error")
          return
        }

        if (detectedCounts.length < DETECTION_SAMPLE_TARGET) {
          await new Promise<void>((resolve) => {
            timeoutId = setTimeout(resolve, DETECTION_SAMPLE_DELAY_MS)
          })
        }
      }

      if (
        isCancelled ||
        detectionRunRef.current !== detectionRunId ||
        detectedCounts.length === 0
      ) {
        return
      }

      const stableCount = getStableCount(detectedCounts)
      setLockedCount(stableCount)
      setStatus("locked")
      onPeopleCountDetected(stableCount)
      playPeopleDetectedAudio(stableCount)
    }

    detectSamples()

    return () => {
      isCancelled = true

      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [
    capturePeopleCount,
    getStableCount,
    onPeopleCountDetected,
    playPeopleDetectedAudio,
    status,
  ])

  return (

    <div className="flex flex-col items-center gap-3 px-4">

      <div
        className="
        relative
        w-full
        max-w-md
        h-[300px]
        rounded-2xl
        border-4
        border-yellow-400
        overflow-hidden
        bg-gray-900
        "
        style={
          lastPreviewFrame
            ? {
                backgroundImage: `url(${lastPreviewFrame})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
              }
            : undefined
        }
      >

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onPlaying={() => setIsPreviewPlaying(true)}
          onLoadedMetadata={() => void resumePreview()}
          onCanPlay={() => void resumePreview()}
          onPause={handlePreviewInterrupted}
          onStalled={handlePreviewInterrupted}
          onWaiting={handlePreviewInterrupted}
          className={`
          absolute
          inset-0
          w-full
          h-full
          object-cover
          transition-opacity duration-150
          ${isPreviewPlaying ? "opacity-100" : "opacity-0"}
          `}
        />

        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/65 px-3 py-1.5 text-xs font-medium text-white">
          <ScanLine className="h-3.5 w-3.5" />
          {status === "detecting" && (
            <span>
              {TC.detecting} {sampleCount}{TC.of}{DETECTION_SAMPLE_TARGET}
            </span>
          )}
          {status === "locked" && (
            <span>
              {lockedCount && lockedCount > 0
                ? `${lockedCount} ${TC.peopleDetected}`
                : TC.noPeople}
            </span>
          )}
          {status === "error" && <span>{TC.error}</span>}
        </div>

      </div>

      {(status === "locked" || status === "error") && (
        <div className="flex items-center gap-2">
          <VoiceButton onMenuParsed={onVoiceMenuParsed} />
          <Button
            type="button"
            variant="outline"
            onClick={restartDetection}
            className="rounded-full border-red-200 bg-white text-red-600 shadow-sm hover:bg-red-50"
          >
            <RotateCcw className="h-4 w-4" />
            {TC.redetect}
          </Button>
        </div>
      )}

    </div>

  )

}
