import type { SelectedMenuOption } from "@/lib/menu-options";
import type { Category, MenuItem } from "@/lib/menu-data";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
const BACKEND_BASE = API_URL.replace(/\/api$/, "");

interface ApiResponse<T> {
  message: string;
  data: T;
}

interface KioskCategoryResponse {
  id: string;
  name: string;
  icon: string | null;
  slug: string;
  options?: any[] | null;
}

interface KioskMenuResponse {
  id: number;
  name: string;
  name_en: string | null;
  description: string | null;
  description_en: string | null;
  price: number;
  image: string | null;
  image_url: string | null;
  category: string;
  sub_category: string | null;
  is_recommended: boolean;
  serving_min_people: number;
  serving_max_people: number;
}

export interface CreateKioskOrderItem {
  menu_id: number;
  quantity: number;
  options?: SelectedMenuOption[];
}

export interface CreateKioskOrderPayload {
  items: CreateKioskOrderItem[];
  order_type: "dine_in" | "take_away";
  delivery_method?: "pickup" | "delivered" | null;
  table_number?: string | null;
  payment_method: "qris" | "credit_card" | "virtual_account";
  customer_email?: string | null;
  send_email_receipt: boolean;
  print_receipt: boolean;
}

export interface KioskOrder {
  id: number;
  order_number: string;
  order_type: "dine_in" | "take_away";
  delivery_method?: "pickup" | "delivered" | null;
  table_number?: string | null;
  status: string;
  payment_status: string;
  payment_method: "qris" | "credit_card" | "virtual_account";
  subtotal: number;
  tax: number;
  total: number;
  customer_email: string | null;
  send_email_receipt: boolean;
  print_receipt: boolean;
  created_at: string | null;
  items: Array<{
    id: number;
    menu_id: number;
    menu_name: string;
    unit_price: number;
    quantity: number;
    line_total: number;
    options?: SelectedMenuOption[];
  }>;
}

export async function getHealth() {
  const response = await fetch(`${API_URL}/health`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch API health");
  }

  return response.json();
}

export async function getKioskCategories(): Promise<Category[]> {
  const response = await fetch(`${API_URL}/kiosk/categories`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }

  const json = (await response.json()) as ApiResponse<KioskCategoryResponse[]>;

  return json.data.map((category) => ({
    id: category.slug || category.id,
    name: category.name,
    icon: category.icon || "□",
    options: category.options,
  }));
}

export async function getKioskMenus(): Promise<MenuItem[]> {
  const response = await fetch(`${API_URL}/kiosk/menus`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch menus");
  }

  const json = (await response.json()) as ApiResponse<KioskMenuResponse[]>;

  return json.data.map((menu) => {
    const rawImage = menu.image || menu.image_url || ""
    const image = rawImage.startsWith("/uploads/")
      ? `${BACKEND_BASE}${rawImage}`
      : rawImage || "/placeholder.jpg"
    return {
      id: String(menu.id),
      name: menu.name,
      nameEn: menu.name_en ?? undefined,
      description: menu.description ?? "",
      descriptionEn: menu.description_en ?? undefined,
      price: menu.price,
      image,
      category: menu.category,
      subCategory: menu.sub_category ?? undefined,
      isRecommended: menu.is_recommended,
      servingMinPeople: menu.serving_min_people,
      servingMaxPeople: menu.serving_max_people,
    }
  });
}

export async function createKioskOrder(payload: CreateKioskOrderPayload): Promise<KioskOrder> {
  const response = await fetch(`${API_URL}/kiosk/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = (await response.json()) as ApiResponse<KioskOrder>;

  if (!response.ok) {
    throw new Error(json.message || "Failed to create order");
  }

  return json.data;
}
