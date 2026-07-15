"use client"

import { ChevronDown } from "lucide-react"
import { translations, type Language } from "@/lib/i18n"

interface ExploreMenuProps {
  onExplore: () => void
  language?: Language
}

export function ExploreMenu({ onExplore, language = "id" }: ExploreMenuProps) {
  return (
    <div className="mt-8 pb-8">
      <button
        onClick={onExplore}
        className="flex flex-col items-center justify-center w-full gap-2 py-4 group"
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <ChevronDown className="w-6 h-6 text-primary animate-bounce" />
        </div>
        <span className="text-gray-600 font-medium">{translations[language].exploreMenu.label}</span>
      </button>
    </div>
  )
}
