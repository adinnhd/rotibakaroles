"use client"

import { useState, useCallback, useEffect } from "react"
import { CameraSection } from "@/components/kiosk/camera-section"
import { MascotGreeting } from "@/components/kiosk/mascot-greeting"
import { PeopleCounter } from "@/components/kiosk/people-counter"
import { PackageCarousel } from "@/components/kiosk/package-carousel"
import { CartButton } from "@/components/kiosk/cart-button"
import { CartSheet } from "@/components/kiosk/cart-sheet"
import { ExploreMenu } from "@/components/kiosk/explore-menu"
import { MenuPage } from "@/components/kiosk/menu-page"
import { PaymentPage } from "@/components/kiosk/payment-page"
import { ReceiptPage } from "@/components/kiosk/receipt-page"
import { OrderTypePage } from "@/components/kiosk/order-type-page"
import { LanguageToggle } from "@/components/kiosk/language-toggle"
import type { MenuItem } from "@/lib/menu-data"
import { createKioskOrder, getKioskMenus } from "@/lib/api"
import { clampRecommendedPeopleCount } from "@/lib/constants"
import type { Language } from "@/lib/i18n"
import { buildMenuOptionLabel, calculateMenuOptionPriceDelta, createMenuLineId, type SelectedMenuOption } from "@/lib/menu-options"
import type { ParsedMenuItem } from "@/lib/voice-parser"

interface CartItem {
  id: string
  menuId: string
  name: string
  description: string
  price: number
  basePrice: number
  image: string
  quantity: number
  category: string
  selectedOptions: SelectedMenuOption[]
  optionLabel: string
}

type AppView = "home" | "menu" | "order_type" | "payment" | "receipt"

export default function KioskPage() {
  const [language, setLanguage] = useState<Language>("id")
  const [peopleCount, setPeopleCount] = useState(0)
  const [hasCompletedDetection, setHasCompletedDetection] = useState(false)
  const [detectionSessionId, setDetectionSessionId] = useState(0)
  const [lastGreetedPeopleCount, setLastGreetedPeopleCount] = useState<number | null>(null)
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [currentView, setCurrentView] = useState<AppView>("home")
  const [orderType, setOrderType] = useState<"dine_in" | "take_away">("dine_in")
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivered" | null>(null)
  const [tableNumber, setTableNumber] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState("")
  const [orderNumber, setOrderNumber] = useState("")
  const [emailSend, setEmailSend] = useState(false)
  const [receiptItems, setReceiptItems] = useState<CartItem[] | null>(null)

  useEffect(() => {
    getKioskMenus().then(setAllMenuItems).catch(() => {})
  }, [])

  const handleAddToCart = useCallback((item: { id: string; name: string; description: string; price: number; image: string; category: string }, quantity = 1, selectedOptions: SelectedMenuOption[] = []) => {
    const quantityToAdd = Math.max(1, Math.floor(quantity))
    const optionPriceDelta = calculateMenuOptionPriceDelta(selectedOptions)
    const optionLabel = buildMenuOptionLabel(selectedOptions)
    const lineId = createMenuLineId(item.id, selectedOptions)
    const finalPrice = item.price + optionPriceDelta

    setCartItems((prev) => {
      const existingItem = prev.find((i) => i.id === lineId)
      if (existingItem) {
        return prev.map((i) =>
          i.id === lineId ? { ...i, quantity: i.quantity + quantityToAdd } : i
        )
      }
      return [...prev, {
        id: lineId,
        menuId: item.id,
        name: item.name,
        description: item.description,
        price: finalPrice,
        basePrice: item.price,
        image: item.image,
        quantity: quantityToAdd,
        category: item.category,
        selectedOptions,
        optionLabel,
      }]
    })
    setIsCartOpen(true)
  }, [])

  const handleAddMenuItemToCart = useCallback((item: MenuItem, selectedOptions: SelectedMenuOption[] = []) => {
    handleAddToCart({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
      category: item.category,
    }, 1, selectedOptions)
  }, [handleAddToCart])

  // Handle voice parsed menu items
  const handleVoiceMenuParsed = useCallback((parsedItems: ParsedMenuItem[]) => {
    for (const parsed of parsedItems) {
      handleAddToCart({
        id: parsed.menuItem.id,
        name: parsed.menuItem.name,
        description: parsed.menuItem.description,
        price: parsed.menuItem.price,
        image: parsed.menuItem.image,
        category: parsed.menuItem.category,
      }, parsed.quantity)
    }
  }, [handleAddToCart])

  const handlePeopleCountChange = useCallback((count: number) => {
    setPeopleCount(clampRecommendedPeopleCount(count))
    setHasCompletedDetection(true)
  }, [])

  const handleDetectionReset = useCallback(() => {
    setPeopleCount(0)
    setHasCompletedDetection(false)
    setDetectionSessionId((sessionId) => sessionId + 1)
    setLastGreetedPeopleCount(null)
  }, [])

  const handleGreetingComplete = useCallback((count: number) => {
    setLastGreetedPeopleCount(count)
  }, [])

  const handleUpdateQuantity = useCallback((id: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    )
  }, [])

  const handleRemoveItem = useCallback((id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const handleCheckout = useCallback(() => {
    setCurrentView("order_type")
  }, [])

  const handleOrderTypeSelect = useCallback((type: "dine_in" | "take_away", deliveryMethod?: "pickup" | "delivered" | null, tableNumber?: string | null) => {
    setOrderType(type)
    setDeliveryMethod(deliveryMethod ?? null)
    setTableNumber(tableNumber ?? null)
    setCurrentView("payment")
  }, [])

  const handlePaymentComplete = useCallback(async (method: "qris" | "credit_card" | "virtual_account", options: { email: string; sendEmail: boolean; printReceipt: boolean }) => {
    const order = await createKioskOrder({
      items: cartItems.map((item) => {
        let menuId = Number(item.menuId);
        if (isNaN(menuId)) {
          const match = String(item.menuId).match(/\d+/);
          menuId = match ? parseInt(match[0], 10) : 1;
        }
        return {
          menu_id: menuId,
          quantity: item.quantity,
          options: item.selectedOptions,
        };
      }),
      order_type: orderType,
      delivery_method: deliveryMethod,
      table_number: tableNumber,
      payment_method: method,
      customer_email: options.sendEmail ? options.email : null,
      send_email_receipt: options.sendEmail,
      print_receipt: options.printReceipt,
    })

    setPaymentMethod(order.payment_method)
    setEmailSend(order.send_email_receipt)
    setOrderNumber(order.order_number)
    setReceiptItems(cartItems.map((item) => ({
      ...item,
    })))
    setCurrentView("receipt")
  }, [cartItems, orderType, deliveryMethod, tableNumber])

  const handleNewOrder = useCallback(() => {
    setCartItems([])
    setOrderType("dine_in")
    setDeliveryMethod(null)
    setTableNumber(null)
    setPaymentMethod("")
    setOrderNumber("")
    setEmailSend(false)
    setReceiptItems(null)
    setIsCartOpen(false)
    handleDetectionReset()
    setCurrentView("home")
  }, [handleDetectionReset])

  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <>
      <div className={currentView === "home" ? "block" : "hidden"}>
        <div className="h-screen overflow-hidden bg-gray-50 flex">
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header with Cart */}
            <header className="sticky top-0 z-30 bg-white shadow-sm shrink-0">
              <div className="flex items-center justify-between px-4 py-3">
                <h1 className="text-xl font-bold text-red-600">Olivia</h1>
                <div className="flex items-center gap-2">
                  <LanguageToggle language={language} onChange={setLanguage} />
                  <CartButton itemCount={totalCartItems} onClick={() => setIsCartOpen(true)} />
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pb-20">
              {/* Camera Section */}
              <section>
                <CameraSection
                  key={detectionSessionId}
                  isVisible={currentView === "home"}
                  detectedPeopleCount={peopleCount}
                  hasCompletedDetection={hasCompletedDetection}
                  onPeopleCountDetected={handlePeopleCountChange}
                  onDetectionReset={handleDetectionReset}
                  onVoiceMenuParsed={handleVoiceMenuParsed}
                  language={language}
                />
              </section>

              {/* Mascot Greeting */}
              <section>
                <MascotGreeting
                  peopleCount={peopleCount}
                  language={language}
                  animate={lastGreetedPeopleCount !== peopleCount}
                  onAnimationComplete={handleGreetingComplete}
                />
              </section>

              {/* People Counter */}
              <section>
                <PeopleCounter count={peopleCount} onCountChange={handlePeopleCountChange} />
              </section>

              {/* Package Carousel */}
              <section>
                <PackageCarousel peopleCount={peopleCount} onAddToCart={handleAddToCart} language={language} />
              </section>

              {/* Explore Menu */}
              <section>
                <ExploreMenu onExplore={() => setCurrentView("menu")} language={language} />
              </section>
            </main>
          </div>

          {/* Cart Sidebar - visible when open (even if empty) */}
          {isCartOpen && (
            <div className="w-64 bg-white border-l border-gray-200 flex flex-col shrink-0">
              <CartSheet
                isOpen={true}
                onClose={() => setIsCartOpen(false)}
                items={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onCheckout={handleCheckout}
                language={language}
              />
            </div>
          )}
        </div>
      </div>

      {currentView === "menu" && (
      <MenuPage
        cartItems={cartItems}
        onAddToCart={handleAddMenuItemToCart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
        onBack={() => setCurrentView("home")}
        isCartOpen={isCartOpen}
        onOpenCart={() => setIsCartOpen(true)}
        onCloseCart={() => setIsCartOpen(false)}
        onVoiceMenuParsed={handleVoiceMenuParsed}
        language={language}
        onLanguageChange={setLanguage}
      />
      )}

      {currentView === "order_type" && (
      <OrderTypePage
        onSelect={handleOrderTypeSelect}
        onBack={() => setCurrentView(cartItems.length > 0 ? "menu" : "home")}
        language={language}
        onLanguageChange={setLanguage}
      />
      )}

      {currentView === "payment" && (
      <PaymentPage
        cartItems={cartItems}
        menuItems={allMenuItems}
        onBack={() => setCurrentView("home")}
        onAddToCart={handleAddMenuItemToCart}
        onPaymentComplete={handlePaymentComplete}
        language={language}
        onLanguageChange={setLanguage}
      />
      )}

      {currentView === "receipt" && (
      <ReceiptPage
        cartItems={receiptItems ?? cartItems}
        paymentMethod={paymentMethod}
        orderNumber={orderNumber}
        emailSend={emailSend}
        onNewOrder={handleNewOrder}
        language={language}
      />
      )}
    </>
  )
}
