import type { MenuItem } from "./menu-data"

// Keyword mapping for voice input variations — key harus sama dengan menu item ID
const menuKeywords: Record<string, string[]> = {
  // Paket
  "paket-1": ["paket hemat a", "paket hemat 1", "paket satu", "paket a"],
  "paket-2": ["paket hemat b", "paket hemat 2", "paket dua", "paket b"],
  "paket-3": ["paket trio", "paket tiga"],
  "paket-4": ["paket keluarga", "paket empat"],

  // Burger
  "burger-1": ["classic burger", "burger classic", "burger biasa", "burger standar"],
  "burger-2": ["cheese burger", "burger keju", "cheeseburger"],
  "burger-3": ["chicken burger", "burger ayam"],
  "burger-4": ["beef burger", "burger sapi", "burger beef"],
  "burger-5": ["veggie burger", "burger veggie", "burger sayur", "burger vegetarian"],

  // Ayam
  "ayam-1": ["ayam goreng crispy", "ayam goreng", "fried chicken", "ayam crispy", "ayam krispi"],
  "ayam-2": ["ayam bakar", "bakaran"],
  "ayam-3": ["chicken wings", "sayap ayam", "wings", "wing"],
  "ayam-4": ["ayam geprek", "geprek"],
  "ayam-5": ["chicken steak", "steak ayam"],

  // Sides
  "sides-1": ["french fries", "kentang goreng", "fries", "kentang"],
  "sides-2": ["onion rings", "bawang goreng", "onion"],
  "sides-3": ["nugget", "nuggets"],
  "sides-4": ["coleslaw", "salad kubis"],

  // Minuman
  "minuman-1": ["es teh manis", "es teh", "teh manis", "teh"],
  "minuman-2": ["cola", "coca cola", "coke", "kola"],
  "minuman-3": ["es jeruk", "jeruk", "orange juice"],
  "minuman-4": ["sprite"],
  "minuman-5": ["fanta"],
  "minuman-6": ["aqua", "air putih", "air mineral", "mineral water"],

  // Dessert
  "dessert-1": ["ice cream sundae", "es krim", "ice cream", "sundae"],
  "dessert-2": ["brownies", "brownie"],
  "dessert-3": ["cheesecake", "cake keju"],
  "dessert-4": ["apple pie", "pie apel"],
}

// Number words to quantity mapping
const numberWords: Record<string, number> = {
  "satu": 1,
  "dua": 2,
  "tiga": 3,
  "empat": 4,
  "lima": 5,
  "enam": 6,
  "tujuh": 7,
  "delapan": 8,
  "sembilan": 9,
  "sepuluh": 10,
  "sebelas": 11,
  "sepasang": 2,
  "plus": 1, // e.g., "burger plus"
  "pertama": 1,
  "kedua": 2,
}

export interface ParsedMenuItem {
  menuItem: MenuItem
  quantity: number
  matchedPhrase: string
}

export function parseVoiceToMenu(transcript: string, menuItems: MenuItem[]): ParsedMenuItem[] {
  const normalizedTranscript = transcript.toLowerCase().trim()
  const results: ParsedMenuItem[] = []
  const usedMenuIds = new Set<string>()

  // Split transcript into potential menu mentions
  // Handle patterns like: "paket hemat satu dan es teh dua"
  const segments = normalizedTranscript
    .replace(/saya mau|aku mau|pesan|mau /gi, " ")
    .split(/\s+(?:dan|,|plus)\s+/i)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  for (const segment of segments) {
    // Extract quantity from segment
    let quantity = 1
    let menuPhrase = segment

    // Check for number words at the start or end
    for (const [word, num] of Object.entries(numberWords)) {
      if (segment.startsWith(word + " ")) {
        quantity = num
        menuPhrase = segment.slice(word.length + 1).trim()
        break
      }
      if (segment.endsWith(" " + word)) {
        quantity = num
        menuPhrase = segment.slice(0, -word.length - 1).trim()
        break
      }
    }

    // Try to match with menu keywords
    let matched = false

    // First, try exact menu name matching
    for (const menu of menuItems) {
      const menuNameLower = menu.name.toLowerCase()

      // Direct name match
      if (menuPhrase.includes(menuNameLower)) {
        if (!usedMenuIds.has(menu.id)) {
          results.push({
            menuItem: menu,
            quantity,
            matchedPhrase: menu.name,
          })
          usedMenuIds.add(menu.id)
          matched = true
          break
        }
      }

      // Check keyword mappings
      const keywords = menuKeywords[menu.id]
      if (keywords) {
        for (const keyword of keywords) {
          if (menuPhrase.includes(keyword)) {
            if (!usedMenuIds.has(menu.id)) {
              results.push({
                menuItem: menu,
                quantity,
                matchedPhrase: keyword,
              })
              usedMenuIds.add(menu.id)
              matched = true
              break
            }
          }
        }
        if (matched) break
      }
    }

    // If no match, try partial matching (fuzzy)
    if (!matched) {
      for (const menu of menuItems) {
        if (usedMenuIds.has(menu.id)) continue

        const menuNameLower = menu.name.toLowerCase()
        const menuParts = menuNameLower.split(" ")

        // Check if significant words match (length > 3)
        const significantParts = menuParts.filter(p => p.length > 3)
        const matchCount = significantParts.filter(part => menuPhrase.includes(part)).length

        // If more than half of significant parts match, consider it a match
        if (significantParts.length > 0 && matchCount >= Math.ceil(significantParts.length / 2)) {
          results.push({
            menuItem: menu,
            quantity,
            matchedPhrase: menu.name,
          })
          usedMenuIds.add(menu.id)
          break
        }
      }
    }
  }

  return results
}

// Utility function to check if transcript contains any menu item
export function transcriptContainsMenu(transcript: string, menuItems: MenuItem[]): boolean {
  return parseVoiceToMenu(transcript, menuItems).length > 0
}

// Get all matched menu names from transcript (for debugging/display)
export function getMatchedMenuNames(transcript: string, menuItems: MenuItem[]): string[] {
  return parseVoiceToMenu(transcript, menuItems).map(p => p.menuItem.name)
}