"use client"

import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CartButtonProps {
  itemCount: number
  onClick: () => void
}

export function CartButton({ itemCount, onClick }: CartButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="relative w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white"
    >
      <ShoppingCart className="w-6 h-6" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full flex items-center justify-center">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Button>
  )
}
