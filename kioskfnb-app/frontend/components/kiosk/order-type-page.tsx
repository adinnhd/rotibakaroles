"use client"

import { useState } from "react"
import { Store, ShoppingBag, ArrowLeft, UtensilsCrossed, Delete } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LanguageToggle } from "@/components/kiosk/language-toggle"
import { translations, type Language } from "@/lib/i18n"

export type OrderType = "dine_in" | "take_away"
export type DeliveryMethod = "pickup" | "delivered"

interface OrderTypePageProps {
  onSelect: (type: OrderType, deliveryMethod?: DeliveryMethod | null, tableNumber?: string | null) => void
  onBack: () => void
  language?: Language
  onLanguageChange?: (lang: Language) => void
}

export function OrderTypePage({ onSelect, onBack, language = "id", onLanguageChange }: OrderTypePageProps) {
  const T = translations[language].orderType
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [orderType, setOrderType] = useState<OrderType | null>(null)
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | null>(null)
  const [tableNumber, setTableNumber] = useState("")

  const handleOrderTypeSelect = (type: OrderType) => {
    setOrderType(type)
    if (type === "take_away") {
      onSelect(type, null, null)
    } else {
      setStep(2)
    }
  }

  const handleDeliverySelect = (method: DeliveryMethod) => {
    setDeliveryMethod(method)
    if (method === "pickup") {
      onSelect(orderType!, method, null)
    } else {
      setStep(3)
    }
  }

  const handleNumpadPress = (num: string) => {
    if (tableNumber.length < 3) {
      setTableNumber(prev => prev + num)
    }
  }

  const handleNumpadDelete = () => {
    setTableNumber(prev => prev.slice(0, -1))
  }

  const handleTableNumberSubmit = () => {
    if (tableNumber) {
      onSelect(orderType!, deliveryMethod, tableNumber)
    }
  }

  const handleBack = () => {
    if (step === 3) setStep(2)
    else if (step === 2) setStep(1)
    else onBack()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white shadow-sm shrink-0">
        <div className="flex items-center px-4 py-3 gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="flex-1 text-xl font-bold text-gray-900">
            {step === 1 ? T.headerStep1 : step === 2 ? T.headerStep2 : T.headerStep3}
          </h1>
          {onLanguageChange && (
            <LanguageToggle language={language} onChange={onLanguageChange} />
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {step === 1 && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{T.selectTitle}</h2>
              <p className="text-gray-500">{T.selectSubtitle}</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl justify-center">
              <button
                onClick={() => handleOrderTypeSelect("dine_in")}
                className="flex-1 flex flex-col items-center gap-4 bg-white p-8 rounded-3xl shadow-sm border-2 border-transparent hover:border-red-500 hover:shadow-md transition-all group"
              >
                <div className="w-32 h-32 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <Store className="w-16 h-16 text-red-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{T.dineIn}</h3>
                  <p className="text-gray-500 text-sm">{T.dineInSub}</p>
                </div>
              </button>

              <button
                onClick={() => handleOrderTypeSelect("take_away")}
                className="flex-1 flex flex-col items-center gap-4 bg-white p-8 rounded-3xl shadow-sm border-2 border-transparent hover:border-red-500 hover:shadow-md transition-all group"
              >
                <div className="w-32 h-32 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <ShoppingBag className="w-16 h-16 text-red-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{T.takeAway}</h3>
                  <p className="text-gray-500 text-sm">{T.takeAwaySub}</p>
                </div>
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="text-center mb-8 animate-in fade-in slide-in-from-right-8 duration-300">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{T.deliveryTitle}</h2>
              <p className="text-gray-500">{T.deliverySubtitle}</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl justify-center animate-in fade-in slide-in-from-right-8 duration-300">
              <button
                onClick={() => handleDeliverySelect("pickup")}
                className="flex-1 flex flex-col items-center gap-4 bg-white p-8 rounded-3xl shadow-sm border-2 border-transparent hover:border-red-500 hover:shadow-md transition-all group"
              >
                <div className="w-32 h-32 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <ShoppingBag className="w-16 h-16 text-red-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{T.pickup}</h3>
                  <p className="text-gray-500 text-sm">{T.pickupSub}</p>
                </div>
              </button>

              <button
                onClick={() => handleDeliverySelect("delivered")}
                className="flex-1 flex flex-col items-center gap-4 bg-white p-8 rounded-3xl shadow-sm border-2 border-transparent hover:border-red-500 hover:shadow-md transition-all group"
              >
                <div className="w-32 h-32 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <UtensilsCrossed className="w-16 h-16 text-red-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{T.delivered}</h3>
                  <p className="text-gray-500 text-sm">{T.deliveredSub}</p>
                </div>
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="w-full max-w-sm animate-in fade-in slide-in-from-right-8 duration-300 flex flex-col items-center">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{T.tableTitle}</h2>
              <p className="text-gray-500 text-sm mb-4">{T.tableSubtitle}</p>
              
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 text-center text-4xl font-bold text-gray-900 min-h-[5rem] flex items-center justify-center mb-8 shadow-inner tracking-widest">
                {tableNumber || <span className="text-gray-300">___</span>}
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumpadPress(num.toString())}
                    className="h-16 rounded-2xl bg-white shadow-sm border border-gray-100 text-2xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-red-200 hover:text-red-600 transition-all active:scale-95"
                  >
                    {num}
                  </button>
                ))}
                <div />
                <button
                  onClick={() => handleNumpadPress("0")}
                  className="h-16 rounded-2xl bg-white shadow-sm border border-gray-100 text-2xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-red-200 hover:text-red-600 transition-all active:scale-95"
                >
                  0
                </button>
                <button
                  onClick={handleNumpadDelete}
                  className="h-16 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-50 hover:border-red-200 hover:text-red-600 transition-all active:scale-95"
                >
                  <Delete className="w-6 h-6" />
                </button>
              </div>

              <Button
                onClick={handleTableNumberSubmit}
                disabled={!tableNumber}
                className="w-full h-14 text-lg rounded-xl bg-red-600 hover:bg-red-700"
              >
                {T.tableContinue}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
