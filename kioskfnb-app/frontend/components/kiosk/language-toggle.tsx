"use client"

import type { Language } from "@/lib/i18n"

interface LanguageToggleProps {
  language: Language
  onChange: (lang: Language) => void
}

export function LanguageToggle({ language, onChange }: LanguageToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full px-1 py-1 shadow-sm">
      <button
        onClick={() => onChange("id")}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
          language === "id"
            ? "bg-red-600 text-white shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        ID
      </button>
      <button
        onClick={() => onChange("en")}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
          language === "en"
            ? "bg-red-600 text-white shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        EN
      </button>
    </div>
  )
}
