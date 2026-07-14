"use client"

import Image from "next/image"
import { Minus, Plus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { translations, type Language } from "@/lib/i18n"

interface CartItem {
  id: string
  name: string
  description: string
  price: number
  image: string
  quantity: number
  optionLabel?: string
}

interface CartSheetProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemoveItem: (id: string) => void
  onCheckout?: () => void
  language?: Language
}

export function CartSheet({ isOpen, onClose, items, onUpdateQuantity, onRemoveItem, onCheckout, language = "id" }: CartSheetProps) {
  const T = translations[language].cart

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID").format(price)
  }

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  if (!isOpen) return null

  return (
    <>
      {/* Sidebar - right side, no fixed so it works in flex container */}
      <div className="flex flex-col bg-white border-l border-gray-200 h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{T.title}</h2>
            <p className="text-sm text-gray-500">{totalItems} item</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full touch-manipulation"
            aria-label={T.close}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Items */}
        <div className="overflow-y-auto p-4 space-y-4 max-h-[40vh]">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl">🛒</span>
              <p className="text-gray-500 mt-2">{T.empty}</p>
              <p className="text-sm text-gray-400 mt-1">{T.emptyHint}</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h3>
                  {item.optionLabel && (
                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{item.optionLabel}</p>
                  )}
                  <p className="text-red-600 font-bold text-sm">Rp. {formatPrice(item.price)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      className="w-6 h-6 rounded-full"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-full"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveItem(item.id)}
                      className="w-6 h-6 text-red-500 hover:text-red-600 hover:bg-red-50 ml-auto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t bg-white shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600">{T.total}</span>
              <span className="text-xl font-bold text-gray-900">Rp. {formatPrice(totalPrice)}</span>
            </div>
            <Button
              onClick={onCheckout}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-base font-semibold rounded-xl"
            >
              {T.checkout}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
