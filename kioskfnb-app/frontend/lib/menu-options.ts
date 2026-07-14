export interface MenuOptionChoice {
  id: string
  label: string
  priceDelta?: number
}

export interface MenuOptionGroup {
  id: string
  label: string
  choices: MenuOptionChoice[]
}

export interface SelectedMenuOption {
  groupId: string
  groupLabel: string
  optionId: string
  optionLabel: string
  priceDelta: number
}

export function getMenuOptionGroups(options: any[] | null | undefined): MenuOptionGroup[] {
  if (!options || !Array.isArray(options)) {
    return []
  }
  return options as MenuOptionGroup[]
}

export function buildMenuOptionLabel(options: SelectedMenuOption[]): string {
  return options.map((option) => `${option.groupLabel}: ${option.optionLabel}`).join(", ")
}

export function calculateMenuOptionPriceDelta(options: SelectedMenuOption[]): number {
  return options.reduce((sum, option) => sum + option.priceDelta, 0)
}

export function createMenuLineId(menuId: string, options: SelectedMenuOption[]): string {
  if (options.length === 0) {
    return menuId
  }

  const signature = options
    .map((option) => `${option.groupId}:${option.optionId}`)
    .join("|")

  return `${menuId}::${signature}`
}
