"use client"

import { Minus, Plus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MAX_RECOMMENDED_PEOPLE } from "@/lib/constants"

interface PeopleCounterProps {
  count: number
  onCountChange: (count: number) => void
}

export function PeopleCounter({ count, onCountChange }: PeopleCounterProps) {
  const handleDecrease = () => {
    if (count > 0) {
      onCountChange(count - 1)
    }
  }

  const handleIncrease = () => {
    if (count < MAX_RECOMMENDED_PEOPLE) {
      onCountChange(count + 1)
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <Button
        variant="outline"
        size="icon"
        onClick={handleDecrease}
        disabled={count <= 0}
        className="rounded-full w-10 h-10 bg-gray-100 border-gray-200 hover:bg-gray-200"
      >
        <Minus className="w-4 h-4" />
      </Button>

      <div className="flex items-center gap-1 bg-gray-100 px-3 py-2 rounded-full">
        <Users className="w-4 h-4 text-gray-600" />
        {count > 0 && <span className="font-medium text-gray-700">{count} Orang</span>}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={handleIncrease}
        disabled={count >= MAX_RECOMMENDED_PEOPLE}
        className="rounded-full w-10 h-10 bg-gray-100 border-gray-200 hover:bg-gray-200"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  )
}
