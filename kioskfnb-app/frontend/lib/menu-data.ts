export interface MenuItem {
  id: string
  name: string
  nameEn?: string
  description: string
  descriptionEn?: string
  price: number
  image: string
  category: string
  subCategory?: string
  isRecommended?: boolean
  servingMinPeople?: number
  servingMaxPeople?: number
}

export interface Category {
  id: string
  name: string
  icon: string
  options?: any[] | null
}

export const categories: Category[] = [
  { id: "paket", name: "Paket", icon: "🎁" },
  { id: "burger", name: "Burger", icon: "🍔" },
  { id: "ayam", name: "Ayam", icon: "🍗" },
  { id: "sides", name: "Sides", icon: "🍟" },
  { id: "minuman", name: "Minuman", icon: "🥤" },
  { id: "dessert", name: "Dessert", icon: "🍦" },
]

export const menuItems: MenuItem[] = [
  // Paket
  {
    id: "paket-1",
    name: "Paket Hemat A",
    description: "1 Burger + 1 Drink",
    price: 25000,
    image: "/images/burger-package.jpg",
    category: "paket",
  },
  {
    id: "paket-2",
    name: "Paket Hemat B",
    description: "2 Burgers + 2 Drinks",
    price: 45000,
    image: "/images/burger-package.jpg",
    category: "paket",
  },
  {
    id: "paket-3",
    name: "Paket Trio",
    description: "3 Burgers + 3 Drinks + Fries",
    price: 75000,
    image: "/images/combo-package.jpg",
    category: "paket",
  },
  {
    id: "paket-4",
    name: "Paket Keluarga",
    description: "4 Burgers + 4 Drinks + 2 Fries",
    price: 120000,
    image: "/images/burger-package.jpg",
    category: "paket",
  },
  // Burger
  {
    id: "burger-1",
    name: "Classic Burger",
    description: "Beef patty dengan keju, selada, tomat, dan saus spesial",
    price: 35000,
    image: "/images/burger-package.jpg",
    category: "burger",
  },
  {
    id: "burger-2",
    name: "Cheese Burger",
    description: "Double cheese dengan beef patty premium",
    price: 42000,
    image: "/images/burger-package.jpg",
    category: "burger",
  },
  {
    id: "burger-3",
    name: "Chicken Burger",
    description: "Crispy chicken dengan mayo dan selada segar",
    price: 32000,
    image: "/images/burger-package.jpg",
    category: "burger",
  },
  {
    id: "burger-4",
    name: "Beef Burger",
    description: "Premium beef patty dengan bbq sauce",
    price: 48000,
    image: "/images/burger-package.jpg",
    category: "burger",
  },
  {
    id: "burger-5",
    name: "Veggie Burger",
    description: "Plant-based patty dengan sayuran segar",
    price: 38000,
    image: "/images/burger-package.jpg",
    category: "burger",
  },
  // Ayam
  {
    id: "ayam-1",
    name: "Ayam Goreng Crispy",
    description: "2 pcs ayam goreng crispy dengan bumbu rahasia",
    price: 28000,
    image: "/images/chicken-package.jpg",
    category: "ayam",
  },
  {
    id: "ayam-2",
    name: "Ayam Bakar",
    description: "Ayam bakar dengan sambal dan lalapan",
    price: 32000,
    image: "/images/chicken-package.jpg",
    category: "ayam",
  },
  {
    id: "ayam-3",
    name: "Chicken Wings",
    description: "6 pcs sayap ayam crispy dengan saus pilihan",
    price: 35000,
    image: "/images/chicken-package.jpg",
    category: "ayam",
  },
  {
    id: "ayam-4",
    name: "Ayam Geprek",
    description: "Ayam crispy dengan sambal korek pedas",
    price: 30000,
    image: "/images/chicken-package.jpg",
    category: "ayam",
  },
  {
    id: "ayam-5",
    name: "Chicken Steak",
    description: "Ayam panggang dengan mashed potato",
    price: 42000,
    image: "/images/chicken-package.jpg",
    category: "ayam",
  },
  // Sides
  {
    id: "sides-1",
    name: "French Fries",
    description: "Kentang goreng crispy dengan saus",
    price: 15000,
    image: "/images/french-fries.jpg",
    category: "sides",
  },
  {
    id: "sides-2",
    name: "Onion Rings",
    description: "Bawang goreng crispy dengan saus mayo",
    price: 18000,
    image: "/images/french-fries.jpg",
    category: "sides",
  },
  {
    id: "sides-3",
    name: "Nugget",
    description: "6 pcs chicken nugget dengan saus",
    price: 20000,
    image: "/images/french-fries.jpg",
    category: "sides",
  },
  {
    id: "sides-4",
    name: "Coleslaw",
    description: "Salad kubis dengan saus mayo",
    price: 12000,
    image: "/images/french-fries.jpg",
    category: "sides",
  },
  // Minuman
  {
    id: "minuman-1",
    name: "Es Teh Manis",
    description: "Teh manis dingin yang menyegarkan",
    price: 8000,
    image: "/images/es-teh.jpg",
    category: "minuman",
  },
  {
    id: "minuman-2",
    name: "Cola",
    description: "Minuman soda dingin",
    price: 12000,
    image: "/images/cola.jpg",
    category: "minuman",
  },
  {
    id: "minuman-3",
    name: "Es Jeruk",
    description: "Jus jeruk segar dengan es",
    price: 15000,
    image: "/images/es-teh.jpg",
    category: "minuman",
  },
  {
    id: "minuman-4",
    name: "Sprite",
    description: "Minuman soda lemon segar",
    price: 12000,
    image: "/images/cola.jpg",
    category: "minuman",
  },
  {
    id: "minuman-5",
    name: "Fanta",
    description: "Minuman soda orange",
    price: 12000,
    image: "/images/cola.jpg",
    category: "minuman",
  },
  {
    id: "minuman-6",
    name: "Aqua",
    description: "Air mineral",
    price: 5000,
    image: "/images/es-teh.jpg",
    category: "minuman",
  },
  // Dessert
  {
    id: "dessert-1",
    name: "Ice Cream Sundae",
    description: "Es krim vanilla dengan topping cokelat",
    price: 18000,
    image: "/images/ice-cream.jpg",
    category: "dessert",
  },
  {
    id: "dessert-2",
    name: "Brownies",
    description: "Brownies cokelat hangat dengan es krim",
    price: 22000,
    image: "/images/ice-cream.jpg",
    category: "dessert",
  },
  {
    id: "dessert-3",
    name: "Cheesecake",
    description: "New York style cheesecake",
    price: 25000,
    image: "/images/ice-cream.jpg",
    category: "dessert",
  },
  {
    id: "dessert-4",
    name: "Apple Pie",
    description: "Pie apel hangat dengan vanilla ice cream",
    price: 20000,
    image: "/images/ice-cream.jpg",
    category: "dessert",
  },
]
