"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ArrowLeft, CheckCircle2, CreditCard, Landmark, Loader2, Mail, Plus, Printer, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LanguageToggle } from "@/components/kiosk/language-toggle"
import { type MenuItem } from "@/lib/menu-data"
import { cn } from "@/lib/utils"
import { translations, type Language } from "@/lib/i18n"

interface CartItem {
  id: string
  menuId?: string
  name: string
  price: number
  quantity: number
  category?: string
  optionLabel?: string
}

interface PaymentPageProps {
  cartItems: CartItem[]
  menuItems: MenuItem[]
  onBack: () => void
  onAddToCart: (item: MenuItem) => void
  onPaymentComplete: (method: "qris" | "credit_card" | "virtual_account", options: { email: string; sendEmail: boolean; printReceipt: boolean }) => Promise<void>
  language?: Language
  onLanguageChange?: (lang: Language) => void
}

interface AddOnSuggestion {
  item: MenuItem
  reason: string
}

interface DynamicAddon {
  id: number
  recommended_menu_id: number
  is_global: boolean
  target_menu_id: number | null
  reason_id: string
  reason_en: string | null
  is_active: boolean
  recommended_menu?: { id: number, name: string, image_url: string, price: number, is_available: boolean }
}

function formatPrice(price: number) {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

export function PaymentPage({ cartItems, menuItems, onBack, onAddToCart, onPaymentComplete, language = "id", onLanguageChange }: PaymentPageProps) {
  const T = translations[language].payment

  const paymentMethods = [
    { id: "qris", name: "QRIS", icon: QrCode, description: T.qrisDesc },
    { id: "credit_card", name: "Credit Card", icon: CreditCard, description: "Visa, Mastercard, JCB" },
    { id: "virtual_account", name: "Virtual Account", icon: Landmark, description: "BCA, Mandiri, BNI, BRI" },
  ] as const

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [sendEmail, setSendEmail] = useState(false)
  const [printReceipt, setPrintReceipt] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [dynamicAddons, setDynamicAddons] = useState<DynamicAddon[]>([])

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
    fetch(`${apiUrl}/kiosk/addon-recommendations`)
      .then(res => res.json())
      .then(resData => {
        const data = resData.data;
        if (Array.isArray(data)) {
          setDynamicAddons(data.filter((a: DynamicAddon) => a.is_active))
        }
      })
      .catch(err => console.error("Failed to fetch addon recommendations", err))
  }, [])

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = Math.round(subtotal * 0.10)
  const total = subtotal + tax

  const cartMenuIds = new Set(cartItems.map((item) => item.menuId || item.id))
  const cartCategories = new Set(cartItems.map((item) => item.category).filter(Boolean) as string[])
  const addonSuggestions: AddOnSuggestion[] = []
  const suggestedIds = new Set<string>()

  // Prioritize dynamic addons
  for (const addon of dynamicAddons) {
    if (addonSuggestions.length >= 3) break
    const strMenuId = addon.recommended_menu_id.toString()
    
    // Skip if already in cart or already suggested
    if (cartMenuIds.has(strMenuId) || suggestedIds.has(strMenuId)) continue

    const isMatch = addon.is_global || (addon.target_menu_id && cartMenuIds.has(addon.target_menu_id.toString()))
    if (isMatch) {
      const item = menuItems.find(m => m.id === strMenuId)
      if (item) {
        addonSuggestions.push({
          item,
          reason: language === "en" && addon.reason_en ? addon.reason_en : addon.reason_id
        })
        suggestedIds.add(strMenuId)
      }
    }
  }



  const handlePay = async () => {
    if (!selectedMethod || isPaying) return

    setErrorMessage("")
    setIsPaying(true)

    try {
      await Promise.all([
        onPaymentComplete(selectedMethod as "qris" | "credit_card" | "virtual_account", { email, sendEmail, printReceipt }),
        new Promise((resolve) => setTimeout(resolve, 1200)),
      ])
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : T.paymentFailed)
      setIsPaying(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="flex-1 text-lg font-bold text-gray-900">{T.headerTitle}</h1>
          {onLanguageChange && (
            <LanguageToggle language={language} onChange={onLanguageChange} />
          )}
        </div>
      </header>

      <main className="flex-1 p-4 pb-32">
        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-3">{T.orderSummary}</h2>
          <div className="space-y-2 text-sm">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between text-gray-600">
                <div className="min-w-0 pr-3">
                  <p className="truncate">{item.name} x{item.quantity}</p>
                  {item.optionLabel && (
                    <p className="text-[11px] text-gray-400 truncate">{item.optionLabel}</p>
                  )}
                </div>
                <span>Rp. {formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex justify-between text-gray-600">
                <span>{T.subtotal}</span>
                <span>Rp. {formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>{T.tax}</span>
                <span>Rp. {formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-base mt-2">
                <span>{T.total}</span>
                <span>Rp. {formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Add-on Suggestions */}
        {addonSuggestions.length > 0 && (
          <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-red-100">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="font-semibold text-gray-900">{T.addonTitle}</h2>
                <p className="text-sm text-gray-500">{T.addonSubtitle}</p>
              </div>
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                {T.addonBadge}
              </span>
            </div>

            <div className="space-y-3">
              {addonSuggestions.map(({ item, reason }) => (
                <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">{reason}</p>
                    <p className="mt-1 text-sm font-bold text-red-600">Rp. {formatPrice(item.price)}</p>
                  </div>

                  <Button
                    type="button"
                    onClick={() => onAddToCart(item)}
                    className="shrink-0 rounded-xl bg-red-600 px-3 text-white hover:bg-red-700"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    {T.addonAdd}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Receipt Options */}
        <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-3">{T.receiptTitle}</h2>
          <div className="space-y-3">
            {/* Email Option */}
            <button
              onClick={() => setSendEmail(!sendEmail)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                sendEmail ? "border-red-600 bg-red-50" : "border-gray-200"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                sendEmail ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"
              )}>
                <Mail className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">{T.sendEmail}</p>
                <p className="text-sm text-gray-500">{T.sendEmailSub}</p>
              </div>
              {sendEmail && <CheckCircle2 className="w-5 h-5 text-red-600" />}
            </button>

            {sendEmail && (
              <div className="px-3">
                <Input
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-50"
                />
              </div>
            )}

            {/* Print Option */}
            <button
              onClick={() => setPrintReceipt(!printReceipt)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                printReceipt ? "border-red-600 bg-red-50" : "border-gray-200"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                printReceipt ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"
              )}>
                <Printer className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">{T.printReceipt}</p>
                <p className="text-sm text-gray-500">{T.printReceiptSub}</p>
              </div>
              {printReceipt && <CheckCircle2 className="w-5 h-5 text-red-600" />}
            </button>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3">
          {paymentMethods.map((method) => {
            const Icon = method.icon
            return (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all bg-white",
                  selectedMethod === method.id
                    ? "border-red-600 bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  selectedMethod === method.id
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-600"
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900">{method.name}</p>
                  <p className="text-sm text-gray-500">{method.description}</p>
                </div>
                {selectedMethod === method.id && (
                  <CheckCircle2 className="w-6 h-6 text-red-600" />
                )}
              </button>
            )
          })}
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}
      </main>

      {/* Pay Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <Button
          onClick={handlePay}
          disabled={!selectedMethod || isPaying}
          className="w-full h-14 bg-red-600 hover:bg-red-700 text-white text-lg font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPaying ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              {T.processing}
            </span>
          ) : (
            <>{T.payButton} {formatPrice(total)}</>
          )}
        </Button>
      </div>
    </div>
  )
}
