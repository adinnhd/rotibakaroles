"use client"

import { useCallback, useEffect, useState } from "react"
import { Mic, MicOff, Loader2, CheckCircle, XCircle } from "lucide-react"
import { useWhisperTranscribe } from "@/hooks/useWhisperTranscribe"
import { parseVoiceToMenu, type ParsedMenuItem } from "@/lib/voice-parser"
import { menuItems } from "@/lib/menu-data"
import type { MenuItem } from "@/lib/menu-data"

interface VoiceButtonProps {
  onResult?: (text: string) => void
  onMenuParsed?: (items: ParsedMenuItem[]) => void
}

type Feedback =
  | { type: "none" }
  | { type: "matched"; items: ParsedMenuItem[] }
  | { type: "no_match"; transcript: string }
  | { type: "empty" }

export function VoiceButton({ onResult, onMenuParsed }: VoiceButtonProps) {
  const [feedback, setFeedback] = useState<Feedback>({ type: "none" })

  const handleTranscribed = useCallback((transcript: string) => {
    const text = transcript.trim()

    if (!text) {
      setFeedback({ type: "empty" })
      return
    }

    onResult?.(text)

    const parsed = parseVoiceToMenu(text, menuItems)
    if (parsed.length > 0) {
      setFeedback({ type: "matched", items: parsed })
      onMenuParsed?.(parsed)
    } else {
      setFeedback({ type: "no_match", transcript: text })
    }
  }, [onResult, onMenuParsed])

  const { isRecording, isTranscribing, error, startRecording, stopRecording, resetTranscript } =
    useWhisperTranscribe(handleTranscribed)

  const handleClick = () => {
    if (isTranscribing) return

    if (isRecording) {
      stopRecording()
    } else {
      resetTranscript()
      setFeedback({ type: "none" })
      startRecording()
    }
  }

  // Auto-dismiss feedback setelah 4 detik
  useEffect(() => {
    if (feedback.type === "none") return
    const timer = setTimeout(() => setFeedback({ type: "none" }), 4000)
    return () => clearTimeout(timer)
  }, [feedback])

  const getButtonContent = () => {
    if (error) return <MicOff className="w-5 h-5 text-red-500" />
    if (isTranscribing) return <Loader2 className="w-5 h-5 animate-spin" />
    return <Mic className="w-5 h-5" />
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={!!error || isTranscribing}
        className={`
          flex items-center justify-center w-12 h-12 rounded-full transition-all
          ${isRecording
            ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
            : isTranscribing
              ? "bg-yellow-600 text-white cursor-wait"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }
          ${error ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
        title={error || (isRecording ? "Klik untuk berhenti merekam" : isTranscribing ? "Sedang memproses..." : "Klik untuk mulai rekam")}
      >
        {getButtonContent()}
      </button>

      {feedback.type !== "none" && (
        <div className="absolute right-0 top-14 z-50 w-64 rounded-xl border bg-white shadow-lg p-3 text-sm">
          {feedback.type === "matched" && (
            <div>
              <div className="flex items-center gap-1.5 font-medium text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span>Ditambahkan ke keranjang</span>
              </div>
              <ul className="mt-1.5 space-y-0.5 text-gray-700">
                {feedback.items.map((item, i) => (
                  <li key={i} className="text-xs">• {item.menuItem.name} x{item.quantity}</li>
                ))}
              </ul>
            </div>
          )}
          {feedback.type === "no_match" && (
            <div>
              <div className="flex items-center gap-1.5 font-medium text-red-600">
                <XCircle className="w-4 h-4" />
                <span>Tidak dikenali</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">&quot;{feedback.transcript}&quot;</p>
              <p className="mt-0.5 text-xs text-gray-400">Coba sebutkan nama menu lebih jelas.</p>
            </div>
          )}
          {feedback.type === "empty" && (
            <div>
              <div className="flex items-center gap-1.5 font-medium text-orange-500">
                <XCircle className="w-4 h-4" />
                <span>Suara tidak terdeteksi</span>
              </div>
              <p className="mt-0.5 text-xs text-gray-400">Coba bicara lebih keras atau dekat ke mikrofon.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Helper to convert ParsedMenuItem to MenuItem for cart
export function parsedToCartItem(parsed: ParsedMenuItem[]): Array<{ menu: MenuItem; quantity: number }> {
  return parsed.map(p => ({
    menu: p.menuItem,
    quantity: p.quantity,
  }))
}
