"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { ArrowLeft, Check, Search, Plus } from "lucide-react"
import { VoiceButton } from "@/components/VoiceButton"
import { CartButton } from "@/components/kiosk/cart-button"
import { CartSheet } from "@/components/kiosk/cart-sheet"
import { LanguageToggle } from "@/components/kiosk/language-toggle"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { getKioskCategories, getKioskMenus } from "@/lib/api"
import {
  categories as fallbackCategories,
  menuItems as fallbackMenuItems,
  type Category,
  type MenuItem,
} from "@/lib/menu-data"
import { calculateMenuOptionPriceDelta, getMenuOptionGroups, type MenuOptionGroup, type SelectedMenuOption } from "@/lib/menu-options"
import { cn } from "@/lib/utils"
import { translations, getCategoryName, getMenuName, getMenuDescription, type Language } from "@/lib/i18n"

export interface CartItem extends MenuItem {
  quantity: number
}

interface MenuPageProps {
  cartItems: CartItem[]
  onAddToCart: (item: MenuItem, selectedOptions?: SelectedMenuOption[]) => void
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemoveItem: (id: string) => void
  onCheckout: () => void
  onBack: () => void
  isCartOpen: boolean
  onOpenCart: () => void
  onCloseCart: () => void
  onVoiceMenuParsed?: (items: ParsedMenuItem[]) => void
  language?: Language
  onLanguageChange?: (lang: Language) => void
}

function formatPrice(price: number) {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

export function MenuPage({ cartItems, onAddToCart, onUpdateQuantity, onRemoveItem, onCheckout, onBack, isCartOpen, onOpenCart, onCloseCart, onVoiceMenuParsed, language = "id", onLanguageChange }: MenuPageProps) {
  const TM = translations[language].menuPage
  const [categories, setCategories] = useState<Category[]>(fallbackCategories)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState(fallbackCategories[0].id)
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoadingMenu, setIsLoadingMenu] = useState(true)
  const [hasMenuError, setHasMenuError] = useState(false)
  const [optionMenu, setOptionMenu] = useState<MenuItem | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})

  const optionGroups = useMemo<MenuOptionGroup[]>(() => {
    if (!optionMenu) {
      return []
    }

    const category = categories.find((c) => c.id === optionMenu.category)
    return getMenuOptionGroups(category?.options)
  }, [optionMenu])

  useEffect(() => {
    let isMounted = true

    async function loadMenuData() {
      setIsLoadingMenu(true)
      setHasMenuError(false)

      try {
        const [apiCategories, apiMenus] = await Promise.all([
          getKioskCategories(),
          getKioskMenus(),
        ])

        if (!isMounted) return

        setCategories(apiCategories)
        setMenuItems(apiMenus)
        setSelectedCategory(apiCategories[0]?.id ?? "")
      } catch {
        if (!isMounted) return

        setHasMenuError(true)
      } finally {
        if (isMounted) {
          setIsLoadingMenu(false)
        }
      }
    }

    loadMenuData()

    return () => {
      isMounted = false
    }
  }, [])

  const currentCategoryItems = menuItems.filter(item => item.category === selectedCategory)
  const subCategories = Array.from(
    new Set(currentCategoryItems.map(item => item.subCategory).filter(Boolean))
  ).sort((a, b) => {
    if (a === "Lainnya") return 1
    if (b === "Lainnya") return -1
    return (a as string).localeCompare(b as string, "id")
  }) as string[]

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())

    if (searchQuery !== "") return matchesSearch

    const matchesCategory = item.category === selectedCategory
    const matchesSubCategory = !selectedSubCategory || item.subCategory === selectedSubCategory
    return matchesCategory && matchesSubCategory && matchesSearch
  })

  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const openAddToCart = (item: MenuItem) => {
    const category = categories.find((c) => c.id === item.category)
    const groups = getMenuOptionGroups(category?.options)

    if (groups.length === 0) {
      onAddToCart(item)
      return
    }

    const defaults = Object.fromEntries(groups.map((group) => [group.id, group.choices[0]?.id ?? ""]))
    setOptionMenu(item)
    setSelectedOptions(defaults)
  }

  const handleConfirmOptions = () => {
    if (!optionMenu) {
      return
    }

    const category = categories.find((c) => c.id === optionMenu.category)
    const groups = getMenuOptionGroups(category?.options)
    const resolvedOptions = groups
      .map((group) => {
        const selectedChoice = group.choices.find((choice) => choice.id === selectedOptions[group.id]) ?? group.choices[0]

        if (!selectedChoice) {
          return null
        }

        return {
          groupId: group.id,
          groupLabel: group.label,
          optionId: selectedChoice.id,
          optionLabel: selectedChoice.label,
          priceDelta: selectedChoice.priceDelta ?? 0,
        } satisfies SelectedMenuOption
      })
      .filter((option): option is SelectedMenuOption => option !== null)

    onAddToCart(optionMenu, resolvedOptions)
    setOptionMenu(null)
    setSelectedOptions({})
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex">
      {/* Menu Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={TM.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-100 border-0 focus-visible:ring-primary"
              />
            </div>

            {onLanguageChange && (
              <LanguageToggle language={language} onChange={onLanguageChange} />
            )}

            <VoiceButton onMenuParsed={onVoiceMenuParsed} />

            <CartButton itemCount={totalCartItems} onClick={onOpenCart} />
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Categories */}
          <aside className="w-24 bg-white border-r border-gray-200 flex flex-col items-center py-4 shrink-0 overflow-y-auto">
            <div className="flex flex-col gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id)
                    setSelectedSubCategory(null)
                    setSearchQuery("")
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
                    selectedCategory === category.id
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  <span className="text-3xl">{category.icon}</span>
                  <span className="text-xs font-medium truncate w-full text-center">
                    {getCategoryName(category.id, language)}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          {/* Menu Grid */}
          <main className="flex-1 p-4 overflow-y-auto pb-24">
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              {searchQuery ? `Hasil pencarian: "${searchQuery}"` : getCategoryName(selectedCategory, language)}
            </h2>

            {!searchQuery && subCategories.length > 1 && (
              <div className="flex gap-2 flex-wrap mb-4">
                <button
                  onClick={() => setSelectedSubCategory(null)}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium transition-all",
                    !selectedSubCategory
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {language === "en" ? "All" : "Semua"}
                </button>
                {subCategories.map(sub => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubCategory(sub)}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium transition-all",
                      selectedSubCategory === sub
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}

            {hasMenuError && (
              <div className="mb-4 rounded-md px-3 py-2 text-sm bg-yellow-50 text-yellow-700">
                {TM.apiError}
              </div>
            )}

            {isLoadingMenu ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-200" />
                    <div className="p-3 flex flex-col gap-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-7 bg-gray-200 rounded w-1/2 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>Tidak ada menu ditemukan</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                  >
                    <div className="relative aspect-square">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">
                        {getMenuName(item.name, item.nameEn, language)}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {getMenuDescription(item.description, item.descriptionEn, language)}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="bg-yellow-400 text-gray-900 font-bold px-3 py-1 rounded-lg text-xs">
                          Rp. {formatPrice(item.price)}
                        </span>
                        <Button
                          size="icon"
                          onClick={() => openAddToCart(item)}
                          className="w-8 h-8 rounded-full bg-primary hover:bg-primary/90 text-white"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Cart Sidebar - inside flex container, visible when open (even if empty) */}
      {isCartOpen && (
        <div className="w-64 bg-white border-l border-gray-200 flex flex-col shrink-0">
          <CartSheet
            isOpen={true}
            onClose={onCloseCart}
            items={cartItems}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
            onCheckout={onCheckout}
            language={language}
          />
        </div>
      )}

      <Dialog open={Boolean(optionMenu)} onOpenChange={(open) => {
        if (!open) {
          setOptionMenu(null)
          setSelectedOptions({})
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pilih Variasi Menu</DialogTitle>
            <DialogDescription>
              {optionMenu ? `${optionMenu.name} akan ditambahkan ke keranjang.` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {optionGroups.map((group) => (
              <div key={group.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">{group.label}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {group.choices.map((choice) => {
                    const isSelected = selectedOptions[group.id] === choice.id

                    return (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={() => setSelectedOptions((prev) => ({ ...prev, [group.id]: choice.id }))}
                        className={cn(
                          "flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all",
                          isSelected ? "border-primary bg-primary/5" : "border-gray-200 bg-white hover:border-gray-300"
                        )}
                      >
                        <span className="text-sm font-medium text-gray-900">{choice.label}</span>
                        {choice.priceDelta && choice.priceDelta > 0 ? (
                          <span className="text-xs font-semibold text-primary">+Rp. {formatPrice(choice.priceDelta)}</span>
                        ) : (
                          <Check className={cn("h-4 w-4", isSelected ? "text-primary" : "text-transparent")} />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOptionMenu(null)}>
              Batal
            </Button>
            <Button onClick={handleConfirmOptions} className="bg-primary hover:bg-primary/90 text-white">
              Tambah ke Keranjang
              {(() => {
                if (!optionMenu || optionGroups.length === 0) return null;
                const extraPrice = calculateMenuOptionPriceDelta(
                  optionGroups
                    .map((group) => {
                      const selectedChoice =
                        group.choices.find((choice) => choice.id === selectedOptions[group.id]) ??
                        group.choices[0];
                      return selectedChoice
                        ? {
                            groupId: group.id,
                            groupLabel: group.label,
                            optionId: selectedChoice.id,
                            optionLabel: selectedChoice.label,
                            priceDelta: selectedChoice.priceDelta ?? 0,
                          }
                        : null;
                    })
                    .filter((option): option is SelectedMenuOption => option !== null)
                );

                if (extraPrice <= 0) return null;

                return (
                  <span className="ml-2 text-xs opacity-90">
                    +Rp. {formatPrice(extraPrice)}
                  </span>
                );
              })()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
