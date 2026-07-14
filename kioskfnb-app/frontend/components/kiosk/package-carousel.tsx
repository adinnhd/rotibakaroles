"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { clampRecommendedPeopleCount } from "@/lib/constants"
import { getKioskMenus } from "@/lib/api"
import { translations, getMenuName, getMenuDescription, type Language } from "@/lib/i18n"

interface Package {
  id: string
  name: string
  nameEn?: string
  description: string
  descriptionEn?: string
  price: number
  image: string
  forPeople: number
  category: string
}

const packages: Package[] = [
  {
    id: "1",
    name: "Paket Hemat A",
    nameEn: "Budget Meal A",
    description: "1 Burger + 1 Minuman",
    descriptionEn: "1 Burger + 1 Drink",
    price: 25000,
    image: "/images/burger-package.jpg",
    forPeople: 1,
    category: "paket",
  },
  {
    id: "2",
    name: "Paket Hemat B",
    nameEn: "Budget Meal B",
    description: "2 Burger + 2 Minuman",
    descriptionEn: "2 Burgers + 2 Drinks",
    price: 45000,
    image: "/images/burger-package.jpg",
    forPeople: 2,
    category: "paket",
  },
  {
    id: "3",
    name: "Paket Trio",
    nameEn: "Trio Meal",
    description: "3 Burger + 3 Minuman + Kentang",
    descriptionEn: "3 Burgers + 3 Drinks + Fries",
    price: 75000,
    image: "/images/combo-package.jpg",
    forPeople: 3,
    category: "paket",
  },
  {
    id: "4",
    name: "Paket Keluarga",
    nameEn: "Family Meal",
    description: "4 Burger + 4 Minuman + 2 Kentang",
    descriptionEn: "4 Burgers + 4 Drinks + 2 Fries",
    price: 120000,
    image: "/images/burger-package.jpg",
    forPeople: 4,
    category: "paket",
  },
]

interface PackageCarouselProps {
  peopleCount: number
  onAddToCart: (pkg: Package) => void
  language?: Language
}

export function PackageCarousel({ peopleCount, onAddToCart, language = "id" }: PackageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [apiPackages, setApiPackages] = useState<Package[] | null>(null)
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let isMounted = true

    getKioskMenus()
      .then((menus) => {
        if (!isMounted) return

        const packageMenus = menus
          .filter((menu) => menu.category === "paket")
          .map((menu) => ({
            id: menu.id,
            name: menu.name,
            nameEn: menu.nameEn,
            description: menu.description,
            descriptionEn: menu.descriptionEn,
            price: menu.price,
            image: menu.image,
            forPeople: clampRecommendedPeopleCount(
              menu.servingMaxPeople ?? menu.servingMinPeople ?? 1
            ),
            category: menu.category,
          }))

        if (packageMenus.length > 0) {
          setApiPackages(packageMenus)
        }
      })
      .catch(() => {
        setApiPackages(packages)
      })


    return () => {
      isMounted = false
    }
  }, [])

  // Filter packages based on people count
  const recommendedPeopleCount = clampRecommendedPeopleCount(peopleCount)

  const resolvedPackages = apiPackages ?? []
  const filteredPackages = recommendedPeopleCount === 0
    ? resolvedPackages
    : resolvedPackages.filter(pkg => pkg.forPeople === recommendedPeopleCount)

  const displayPackages = filteredPackages.length > 0 ? filteredPackages : resolvedPackages

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % displayPackages.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + displayPackages.length) % displayPackages.length)
  }

  // Auto-play carousel (only when 0 people)
  useEffect(() => {
    const startAutoPlay = () => {
      if (recommendedPeopleCount > 0) return
      if (displayPackages.length === 0) return
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % displayPackages.length)
      }, 4000)
    }

    startAutoPlay()

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current)
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current)
    }
  }, [recommendedPeopleCount, displayPackages.length])

  const handleManualNavigation = (direction: "prev" | "next") => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current)
      autoPlayRef.current = null
    }

    if (direction === "prev") {
      prevSlide()
    } else {
      nextSlide()
    }

    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
    }
    pauseTimeoutRef.current = setTimeout(() => {
      if (recommendedPeopleCount === 0) {
        autoPlayRef.current = setInterval(() => {
          setCurrentIndex((prev) => (prev + 1) % displayPackages.length)
        }, 4000)
      }
    }, 10000)
  }

  const handleDotClick = (index: number) => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current)
      autoPlayRef.current = null
    }

    setCurrentIndex(index)

    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
    }
    pauseTimeoutRef.current = setTimeout(() => {
      if (recommendedPeopleCount === 0) {
        autoPlayRef.current = setInterval(() => {
          setCurrentIndex((prev) => (prev + 1) % displayPackages.length)
        }, 4000)
      }
    }, 10000)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID").format(price)
  }

  if (apiPackages === null || displayPackages.length === 0) {
    return (
      <div className="mt-6 px-4">
        <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-4 animate-pulse" />
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="flex">
            <div className="w-36 h-36 bg-gray-200 animate-pulse shrink-0" />
            <div className="flex-1 p-4 flex flex-col justify-center gap-3">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const safeCurrentIndex = displayPackages.length > 0
    ? Math.min(Math.max(0, isNaN(currentIndex) ? 0 : currentIndex), displayPackages.length - 1)
    : 0
  const currentPackage = displayPackages[safeCurrentIndex]

  if (!currentPackage) return null

  return (
    <div className="mt-6 px-4">
      <h2 className="text-center text-2xl font-bold text-red-600 mb-4">
        {translations[language].packageCarousel.title}
      </h2>

      <div className="relative flex items-center">
        {/* Left Arrow */}
        <button
          onClick={() => handleManualNavigation("prev")}
          className="absolute left-0 z-10 w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg flex items-center justify-center"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Package Card */}
        <div className="flex-1 mx-12">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="flex">
              <div className="relative w-36 h-36 shrink-0 bg-gray-200">
                <Image
                  src={currentPackage.image}
                  alt={currentPackage.name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>

              <div className="flex-1 p-4 flex flex-col justify-center">
                <h3 className="font-bold text-lg text-gray-900">
                  {getMenuName(currentPackage.name, currentPackage.nameEn, language)}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {getMenuDescription(currentPackage.description, currentPackage.descriptionEn, language)}
                </p>

                <div className="flex items-center justify-between mt-3">
                  <span className="bg-yellow-400 text-gray-900 font-bold px-4 py-1.5 rounded-lg text-sm">
                    Rp. {formatPrice(currentPackage.price)}
                  </span>

                  <button
                    onClick={() => onAddToCart(currentPackage)}
                    className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => handleManualNavigation("next")}
          className="absolute right-0 z-10 w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg flex items-center justify-center"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 mt-4">
        {displayPackages.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              index === safeCurrentIndex
                ? "bg-red-600 w-4"
                : "bg-red-300"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
