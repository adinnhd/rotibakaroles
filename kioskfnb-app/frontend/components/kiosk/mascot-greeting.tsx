"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { translations, type Language } from "@/lib/i18n"

interface MascotGreetingProps {
  peopleCount: number
  language?: Language
  animate?: boolean
  onAnimationComplete?: (peopleCount: number) => void
}

export function MascotGreeting({
  peopleCount,
  language = "id",
  animate = true,
  onAnimationComplete,
}: MascotGreetingProps) {
  const clampedCount = Math.min(Math.max(peopleCount, 0), 5) as 0 | 1 | 2 | 3 | 4 | 5
  const greeting = translations[language].greetings[clampedCount]

  return (
    <div className="flex items-start gap-3 px-4 mt-4">
      <div className="relative w-28 h-28 shrink-0 animate-bounce-slow">
        <Image
          src="/images/mascot.png"
          alt="Mascot"
          fill
          className="object-contain"
          priority
        />
      </div>

      <div className="flex-1 relative bg-white rounded-2xl rounded-tl-none p-3 shadow-lg border border-gray-100 mt-4 min-h-12.5">
        <TypewriterText
          key={greeting}
          text={greeting}
          animate={animate}
          completionValue={clampedCount}
          onComplete={onAnimationComplete}
        />
      </div>
    </div>
  )
}

function TypewriterText({
  text,
  animate,
  completionValue,
  onComplete,
}: {
  text: string
  animate: boolean
  completionValue: number
  onComplete?: (peopleCount: number) => void
}) {
  const [displayedText, setDisplayedText] = useState(animate ? "" : text)
  const isTyping = displayedText.length < text.length

  useEffect(() => {
    if (!animate) {
      return
    }

    let index = 0

    const intervalId = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1))
        index++
      } else {
        clearInterval(intervalId)
        onComplete?.(completionValue)
      }
    }, 50)

    return () => {
      clearInterval(intervalId)
    }
  }, [animate, completionValue, onComplete, text])

  return (
    <p className="text-sm text-gray-700 leading-relaxed">
      {displayedText}
      {isTyping && <span className="animate-pulse">|</span>}
    </p>
  )
}
