"use client"

import type { FormEvent, ReactNode } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  BarChart3,
  ClipboardList,
  CreditCard,
  ImageIcon,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  PlusCircle,
  Save,
  Search,
  Settings,
  ShoppingBag,
  Tags,
  Trash2,
  TrendingUp,
  Utensils,
  Wallet,
  X,
} from "lucide-react"
import { AddonsSection } from "@/components/admin/addons-section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ApiError,
  apiRequest,
  getCurrentAdmin,
  logoutAdmin,
  type AdminUser,
} from "@/lib/admin-api"
import { cn } from "@/lib/utils"

interface AdminCategory {
  id: number
  name: string
  slug: string
  icon: string | null
  sort_order: number
  is_active: boolean
  menus_count: number
  options: any[] | null
}

interface AdminMenu {
  id: number
  menu_category_id: number
  name: string
  slug: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
  is_recommended: boolean
  serving_min_people: number
  serving_max_people: number
  category: {
    id: number
    name: string
    slug: string
    icon: string | null
  }
}

interface AdminOrderItem {
  id: number
  menu_id: number
  menu_name: string
  unit_price: number
  quantity: number
  line_total: number
}

interface AdminOrder {
  id: number
  order_number: string
  status: string
  payment_status: string
  payment_method: string
  order_type: string
  delivery_method: string | null
  table_number: string | null
  subtotal: number
  tax: number
  total: number
  customer_email: string | null
  send_email_receipt: boolean
  print_receipt: boolean
  created_at: string
  items: AdminOrderItem[]
}

interface SalesSummary {
  period: {
    from: string
    to: string
  }
  total_revenue: number
  order_count: number
  item_count: number
  average_order_value: number
  top_products: Array<{
    menu_id: number
    menu_name: string
    quantity_sold: number
    total_revenue: number
  }>
  payment_methods: Array<{
    payment_method: string
    order_count: number
    total_revenue: number
  }>
  recent_orders: AdminOrder[]
}

interface CategoryForm {
  id?: number
  name: string
  slug: string
  icon: string
  sort_order: string
  is_active: boolean
  options: string
}

interface MenuForm {
  id?: number
  menu_category_id: string
  name: string
  slug: string
  description: string
  price: string
  image_url: string
  is_available: boolean
  is_recommended: boolean
  serving_min_people: string
  serving_max_people: string
}

const emptyCategoryForm: CategoryForm = {
  name: "",
  slug: "",
  icon: "",
  sort_order: "0",
  is_active: true,
  options: "",
}

const emptyMenuForm: MenuForm = {
  menu_category_id: "",
  name: "",
  slug: "",
  description: "",
  price: "",
  image_url: "",
  is_available: true,
  is_recommended: false,
  serving_min_people: "1",
  serving_max_people: "1",
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID").format(price)
}

function formatCurrency(price: number) {
  return `Rp ${formatPrice(price)}`
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function formatPaymentMethod(method: string) {
  const labels: Record<string, string> = {
    qris: "QRIS",
    credit_card: "Kartu Kredit",
    virtual_account: "Virtual Account",
  }

  return labels[method] ?? method
}

type AdminTab = "dashboard" | "orders" | "categories" | "menus" | "addons"
type SalesRange = "today" | "7d" | "30d"

function getSalesRangeQuery(range: SalesRange) {
  const to = new Date()
  const from = new Date()

  if (range === "7d") {
    from.setDate(to.getDate() - 6)
  }

  if (range === "30d") {
    from.setDate(to.getDate() - 29)
  }

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
  }

  return `from=${formatDate(from)}&to=${formatDate(to)}`
}

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard")
  const [salesRange, setSalesRange] = useState<SalesRange>("today")
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [menus, setMenus] = useState<AdminMenu[]>([])
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null)
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategoryForm)
  const [menuForm, setMenuForm] = useState<MenuForm>(emptyMenuForm)
  const [menuImageFile, setMenuImageFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")

  const sortedMenus = useMemo(() => {
    return [...menus].sort((a, b) => a.name.localeCompare(b.name))
  }, [menus])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError("")

    try {
      const [categoryResponse, menuResponse, orderResponse, summaryResponse] = await Promise.all([
        apiRequest<AdminCategory[]>("/admin/categories", { cache: "no-store" }),
        apiRequest<AdminMenu[]>("/admin/menus", { cache: "no-store" }),
        apiRequest<AdminOrder[]>("/admin/orders", { cache: "no-store" }),
        apiRequest<SalesSummary>(`/admin/orders/summary?${getSalesRangeQuery(salesRange)}`, {
          cache: "no-store",
        }),
      ])

      setCategories(categoryResponse.data)
      setMenus(menuResponse.data)
      setOrders(orderResponse.data)
      setSalesSummary(summaryResponse.data)
      setMenuForm((current) => ({
        ...current,
        menu_category_id: current.menu_category_id || String(categoryResponse.data[0]?.id ?? ""),
      }))
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        router.replace("/admin/login")
        return
      }

      setError(caughtError instanceof Error ? caughtError.message : "Gagal memuat data")
    } finally {
      setIsLoading(false)
    }
  }, [router, salesRange])

  const checkSession = useCallback(async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await getCurrentAdmin()

      if (response.data.user.role !== "admin") {
        router.replace("/admin/login")
        return
      }

      setAdminUser(response.data.user)
      await loadData()
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        router.replace("/admin/login")
        return
      }

      setError(caughtError instanceof Error ? caughtError.message : "Gagal memeriksa sesi admin")
      setIsLoading(false)
    }
  }, [loadData, router])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void checkSession()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [checkSession])

  async function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError("")
    setNotice("")

    let parsedOptions = null
    if (categoryForm.options.trim()) {
      try {
        parsedOptions = JSON.parse(categoryForm.options)
      } catch (e) {
        setError("Format JSON Options tidak valid")
        setIsSaving(false)
        return
      }
    }

    const payload = {
      name: categoryForm.name,
      slug: categoryForm.slug || null,
      icon: categoryForm.icon || null,
      sort_order: Number(categoryForm.sort_order),
      is_active: categoryForm.is_active,
      options: parsedOptions,
    }

    try {
      const path = categoryForm.id ? `/admin/categories/${categoryForm.id}` : "/admin/categories"
      const method = categoryForm.id ? "PUT" : "POST"
      const response = await apiRequest<AdminCategory>(path, {
        method,
        body: JSON.stringify(payload),
      })

      setNotice(response.message)
      setCategoryForm(emptyCategoryForm)
      await loadData()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Gagal menyimpan kategori")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleMenuSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError("")
    setNotice("")

    const formData = new FormData()
    formData.append("menu_category_id", menuForm.menu_category_id)
    formData.append("name", menuForm.name)
    formData.append("slug", menuForm.slug)
    formData.append("description", menuForm.description)
    formData.append("price", menuForm.price)
    formData.append("image_url", menuForm.image_url)
    formData.append("is_available", menuForm.is_available ? "1" : "0")
    formData.append("is_recommended", menuForm.is_recommended ? "1" : "0")
    formData.append("serving_min_people", menuForm.serving_min_people)
    formData.append("serving_max_people", menuForm.serving_max_people)

    if (menuImageFile) {
      formData.append("image", menuImageFile)
    }

    try {
      const path = menuForm.id ? `/admin/menus/${menuForm.id}` : "/admin/menus"
      const response = await apiRequest<AdminMenu>(path, {
        method: "POST",
        body: formData,
      })

      setNotice(response.message)
      setMenuForm({
        ...emptyMenuForm,
        menu_category_id: String(categories[0]?.id ?? ""),
      })
      setMenuImageFile(null)
      await loadData()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Gagal menyimpan menu")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleLogout() {
    setError("")

    try {
      await logoutAdmin()
      router.replace("/admin/login")
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Gagal logout")
    }
  }

  async function deleteCategory(category: AdminCategory) {
    if (!confirm(`Hapus kategori ${category.name}?`)) return

    try {
      const response = await apiRequest<null>(`/admin/categories/${category.id}`, {
        method: "DELETE",
      })
      setNotice(response.message)
      await loadData()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Gagal menghapus kategori")
    }
  }

  async function deleteMenu(menu: AdminMenu) {
    if (!confirm(`Hapus menu ${menu.name}?`)) return

    try {
      const response = await apiRequest<null>(`/admin/menus/${menu.id}`, {
        method: "DELETE",
      })
      setNotice(response.message)
      await loadData()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Gagal menghapus menu")
    }
  }

  function editCategory(category: AdminCategory) {
    setActiveTab("categories")
    setCategoryForm({
      id: category.id,
      name: category.name,
      slug: category.slug,
      icon: category.icon ?? "",
      sort_order: String(category.sort_order),
      is_active: category.is_active,
      options: category.options ? JSON.stringify(category.options, null, 2) : "",
    })
  }

  function editMenu(menu: AdminMenu) {
    setActiveTab("menus")
    setMenuImageFile(null)
    setMenuForm({
      id: menu.id,
      menu_category_id: String(menu.menu_category_id),
      name: menu.name,
      slug: menu.slug,
      description: menu.description ?? "",
      price: String(menu.price),
      image_url: menu.image_url ?? "",
      is_available: menu.is_available,
      is_recommended: menu.is_recommended,
      serving_min_people: String(menu.serving_min_people),
      serving_max_people: String(menu.serving_max_people),
    })
  }

  if (!adminUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <RefreshCw className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold">Admin Olivia</h1>
            <p className="text-sm text-zinc-500">Manajemen kategori dan menu kiosk</p>
          </div>
          <div className="flex items-center gap-2">
            {adminUser && (
              <span className="hidden text-sm text-zinc-500 sm:inline">
                {adminUser.name}
              </span>
            )}
            <Button variant="outline" onClick={loadData} disabled={isLoading}>
              <RefreshCw className={cn(isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {(notice || error) && (
          <div
            className={cn(
              "mb-4 rounded-md border px-4 py-3 text-sm",
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700",
            )}
          >
            {error || notice}
          </div>
        )}

        <div className="mb-5 inline-flex flex-wrap rounded-md border bg-white p-1">
          <button
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded px-4 text-sm font-medium",
              activeTab === "dashboard" ? "bg-zinc-900 text-white" : "text-zinc-600",
            )}
            onClick={() => setActiveTab("dashboard")}
          >
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </button>
          <button
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded px-4 text-sm font-medium",
              activeTab === "orders" ? "bg-zinc-900 text-white" : "text-zinc-600",
            )}
            onClick={() => setActiveTab("orders")}
          >
            <ClipboardList className="h-4 w-4" />
            Order
          </button>
          <button
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded px-4 text-sm font-medium",
              activeTab === "categories" ? "bg-zinc-900 text-white" : "text-zinc-600",
            )}
            onClick={() => setActiveTab("categories")}
          >
            <Tags className="h-4 w-4" />
            Kategori
          </button>
          <button
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded px-4 text-sm font-medium",
              activeTab === "menus" ? "bg-zinc-900 text-white" : "text-zinc-600",
            )}
            onClick={() => setActiveTab("menus")}
          >
            <Utensils className="h-4 w-4" />
            Menu
          </button>
          <button
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded px-4 text-sm font-medium",
              activeTab === "addons" ? "bg-zinc-900 text-white" : "text-zinc-600",
            )}
            onClick={() => setActiveTab("addons")}
          >
            <PlusCircle className="h-4 w-4" />
            Rekomendasi
          </button>
        </div>

        {activeTab === "dashboard" && (
          <DashboardSection
            salesRange={salesRange}
            summary={salesSummary}
            onSalesRangeChange={setSalesRange}
          />
        )}

        {activeTab === "orders" && <OrdersSection orders={orders} />}

        {activeTab === "categories" && (
          <section className="grid gap-5 lg:grid-cols-[380px_1fr]">
            <form className="rounded-md border bg-white p-4" onSubmit={handleCategorySubmit}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold">
                  {categoryForm.id ? "Edit Kategori" : "Tambah Kategori"}
                </h2>
                {categoryForm.id && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setCategoryForm(emptyCategoryForm)}
                  >
                    <X />
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <Field label="Nama">
                  <Input
                    value={categoryForm.name}
                    onChange={(event) =>
                      setCategoryForm({ ...categoryForm, name: event.target.value })
                    }
                    required
                  />
                </Field>
                <Field label="Slug">
                  <Input
                    value={categoryForm.slug}
                    placeholder="otomatis jika dikosongkan"
                    onChange={(event) =>
                      setCategoryForm({ ...categoryForm, slug: event.target.value })
                    }
                  />
                </Field>
                <div className="grid grid-cols-[1fr_120px] gap-3">
                  <Field label="Icon">
                    <Input
                      value={categoryForm.icon}
                      placeholder="🍔"
                      onChange={(event) =>
                        setCategoryForm({ ...categoryForm, icon: event.target.value })
                      }
                    />
                  </Field>
                  <Field label="Urutan">
                    <Input
                      type="number"
                      min="0"
                      value={categoryForm.sort_order}
                      onChange={(event) =>
                        setCategoryForm({ ...categoryForm, sort_order: event.target.value })
                      }
                      required
                    />
                  </Field>
                </div>
                <Field label="Options (JSON)">
                  <Textarea
                    value={categoryForm.options}
                    placeholder={'[\n  {\n    "id": "size",\n    "label": "Ukuran",\n    "choices": [\n      { "id": "regular", "label": "Regular", "priceDelta": 0 }\n    ]\n  }\n]'}
                    onChange={(event) =>
                      setCategoryForm({ ...categoryForm, options: event.target.value })
                    }
                    className="font-mono text-xs"
                    rows={8}
                  />
                  <p className="text-xs text-zinc-500 mt-1">Isi dengan format JSON yang valid untuk opsi variasi menu (misal: Size, Level Es, dsb).</p>
                </Field>
                <CheckboxField
                  label="Aktif"
                  checked={categoryForm.is_active}
                  onChange={(checked) =>
                    setCategoryForm({ ...categoryForm, is_active: checked })
                  }
                />
                <Button className="w-full" type="submit" disabled={isSaving}>
                  {categoryForm.id ? <Save /> : <Plus />}
                  {categoryForm.id ? "Simpan Kategori" : "Tambah Kategori"}
                </Button>
              </div>
            </form>

            <div className="overflow-hidden rounded-md border bg-white">
              <DataHeader title="Daftar Kategori" count={categories.length} />
              <div className="divide-y">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_auto]"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{category.icon || "□"}</span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{category.name}</p>
                          <p className="text-xs text-zinc-500">
                            {category.slug} · {category.menus_count} menu · urutan{" "}
                            {category.sort_order}
                          </p>
                        </div>
                      </div>
                    </div>
                    <RowActions
                      isActive={category.is_active}
                      onEdit={() => editCategory(category)}
                      onDelete={() => deleteCategory(category)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === "menus" && (
          <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
            <form className="rounded-md border bg-white p-4" onSubmit={handleMenuSubmit}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold">
                  {menuForm.id ? "Edit Menu" : "Tambah Menu"}
                </h2>
                {menuForm.id && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setMenuImageFile(null)
                      setMenuForm({
                        ...emptyMenuForm,
                        menu_category_id: String(categories[0]?.id ?? ""),
                      })
                    }}
                  >
                    <X />
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <Field label="Kategori">
                  <select
                    className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                    value={menuForm.menu_category_id}
                    onChange={(event) =>
                      setMenuForm({ ...menuForm, menu_category_id: event.target.value })
                    }
                    required
                  >
                    <option value="">Pilih kategori</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon ? `${category.icon} ` : ""}
                        {category.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Nama">
                  <Input
                    value={menuForm.name}
                    onChange={(event) => setMenuForm({ ...menuForm, name: event.target.value })}
                    required
                  />
                </Field>
                <Field label="Slug">
                  <Input
                    value={menuForm.slug}
                    placeholder="otomatis jika dikosongkan"
                    onChange={(event) => setMenuForm({ ...menuForm, slug: event.target.value })}
                  />
                </Field>
                <Field label="Deskripsi">
                  <Textarea
                    value={menuForm.description}
                    onChange={(event) =>
                      setMenuForm({ ...menuForm, description: event.target.value })
                    }
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Harga">
                    <Input
                      type="number"
                      min="0"
                      value={menuForm.price}
                      onChange={(event) => setMenuForm({ ...menuForm, price: event.target.value })}
                      required
                    />
                  </Field>
                  <Field label="Min Orang">
                    <Input
                      type="number"
                      min="1"
                      value={menuForm.serving_min_people}
                      onChange={(event) =>
                        setMenuForm({ ...menuForm, serving_min_people: event.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field label="Max Orang">
                    <Input
                      type="number"
                      min="1"
                      value={menuForm.serving_max_people}
                      onChange={(event) =>
                        setMenuForm({ ...menuForm, serving_max_people: event.target.value })
                      }
                      required
                    />
                  </Field>
                </div>
                <Field label="Gambar">
                  <Input
                    value={menuForm.image_url}
                    placeholder="/images/burger-package.jpg"
                    onChange={(event) =>
                      setMenuForm({ ...menuForm, image_url: event.target.value })
                    }
                  />
                </Field>
                <Field label="Upload Gambar">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setMenuImageFile(event.target.files?.[0] ?? null)}
                  />
                  {menuImageFile && (
                    <p className="text-xs text-zinc-500">{menuImageFile.name}</p>
                  )}
                </Field>
                <div className="flex flex-wrap gap-4">
                  <CheckboxField
                    label="Tersedia"
                    checked={menuForm.is_available}
                    onChange={(checked) =>
                      setMenuForm({ ...menuForm, is_available: checked })
                    }
                  />
                  <CheckboxField
                    label="Rekomendasi"
                    checked={menuForm.is_recommended}
                    onChange={(checked) =>
                      setMenuForm({ ...menuForm, is_recommended: checked })
                    }
                  />
                </div>
                <Button className="w-full" type="submit" disabled={isSaving}>
                  {menuForm.id ? <Save /> : <Plus />}
                  {menuForm.id ? "Simpan Menu" : "Tambah Menu"}
                </Button>
              </div>
            </form>

            <div className="overflow-hidden rounded-md border bg-white">
              <DataHeader title="Daftar Menu" count={sortedMenus.length} />
              <div className="divide-y">
                {sortedMenus.map((menu) => (
                  <div key={menu.id} className="grid gap-3 px-4 py-3 lg:grid-cols-[1fr_auto]">
                    <div className="flex min-w-0 gap-3">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-100">
                        {menu.image_url ? (
                          <Image
                            src={menu.image_url}
                            alt={menu.name}
                            width={64}
                            height={64}
                            unoptimized
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-zinc-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{menu.name}</p>
                        <p className="text-sm font-semibold text-red-600">
                          Rp {formatPrice(menu.price)}
                        </p>
                        <p className="line-clamp-1 text-xs text-zinc-500">
                          {menu.category.icon ? `${menu.category.icon} ` : ""}
                          {menu.category.name} · {menu.slug}
                        </p>
                      </div>
                    </div>
                    <RowActions
                      isActive={menu.is_available}
                      activeLabel={menu.is_recommended ? "Rekomendasi" : "Tersedia"}
                      inactiveLabel="Tidak tersedia"
                      onEdit={() => editMenu(menu)}
                      onDelete={() => deleteMenu(menu)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === "addons" && (
          <AddonsSection menus={menus} />
        )}
      </div>
    </main>
  )
}

function DashboardSection({
  salesRange,
  summary,
  onSalesRangeChange,
}: {
  salesRange: SalesRange
  summary: SalesSummary | null
  onSalesRangeChange: (range: SalesRange) => void
}) {
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Ringkasan Kiosk</h2>
          <p className="text-sm text-zinc-500">
            Pendapatan dihitung dari order paid dan tidak cancelled.
          </p>
        </div>
        <div className="inline-flex rounded-md border bg-white p-1">
          {([
            ["today", "Hari ini"],
            ["7d", "7 hari"],
            ["30d", "30 hari"],
          ] as Array<[SalesRange, string]>).map(([range, label]) => (
            <button
              key={range}
              className={cn(
                "h-8 rounded px-3 text-sm font-medium",
                salesRange === range ? "bg-zinc-900 text-white" : "text-zinc-600",
              )}
              onClick={() => onSalesRangeChange(range)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard
          icon={<Wallet className="h-5 w-5" />}
          label="Pendapatan"
          value={formatCurrency(summary?.total_revenue ?? 0)}
        />
        <SummaryCard
          icon={<ClipboardList className="h-5 w-5" />}
          label="Order"
          value={String(summary?.order_count ?? 0)}
        />
        <SummaryCard
          icon={<ShoppingBag className="h-5 w-5" />}
          label="Item Terjual"
          value={String(summary?.item_count ?? 0)}
        />
        <SummaryCard
          icon={<BarChart3 className="h-5 w-5" />}
          label="Rata-rata Order"
          value={formatCurrency(summary?.average_order_value ?? 0)}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="overflow-hidden rounded-md border bg-white">
          <DataHeader title="Produk Terlaris" count={summary?.top_products.length ?? 0} />
          <div className="divide-y">
            {summary?.top_products.length ? (
              summary.top_products.map((product) => (
                <div
                  key={`${product.menu_id}-${product.menu_name}`}
                  className="grid gap-2 px-4 py-3 sm:grid-cols-[1fr_auto]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{product.menu_name}</p>
                    <p className="text-sm text-zinc-500">
                      {product.quantity_sold} item terjual
                    </p>
                  </div>
                  <p className="font-semibold text-red-600">
                    {formatCurrency(product.total_revenue)}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState text="Belum ada produk terjual pada periode ini." />
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-md border bg-white">
          <DataHeader title="Metode Pembayaran" count={summary?.payment_methods.length ?? 0} />
          <div className="divide-y">
            {summary?.payment_methods.length ? (
              summary.payment_methods.map((method) => (
                <div
                  key={method.payment_method}
                  className="grid gap-2 px-4 py-3 sm:grid-cols-[1fr_auto]"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-zinc-400" />
                    <div>
                      <p className="font-medium">{formatPaymentMethod(method.payment_method)}</p>
                      <p className="text-sm text-zinc-500">{method.order_count} order</p>
                    </div>
                  </div>
                  <p className="font-semibold">{formatCurrency(method.total_revenue)}</p>
                </div>
              ))
            ) : (
              <EmptyState text="Belum ada pembayaran pada periode ini." />
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border bg-white">
        <DataHeader title="Order Terbaru" count={summary?.recent_orders.length ?? 0} />
        <OrderList orders={summary?.recent_orders ?? []} compact />
      </div>
    </section>
  )
}

function OrdersSection({ orders }: { orders: AdminOrder[] }) {
  return (
    <section className="overflow-hidden rounded-md border bg-white">
      <DataHeader title="Recap Order" count={orders.length} />
      <OrderList orders={orders} />
    </section>
  )
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-md border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-500">{label}</p>
        <span className="text-zinc-400">{icon}</span>
      </div>
      <p className="text-2xl font-semibold tracking-normal">{value}</p>
    </div>
  )
}

function OrderList({ orders, compact = false }: { orders: AdminOrder[]; compact?: boolean }) {
  if (orders.length === 0) {
    return <EmptyState text="Belum ada order kiosk yang tersimpan." />
  }

  return (
    <div className="divide-y">
      {orders.map((order) => (
        <div
          key={order.id}
          className={cn(
            "grid gap-4 px-4 py-4",
            compact ? "lg:grid-cols-[1fr_auto]" : "xl:grid-cols-[280px_1fr_auto]",
          )}
        >
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <p className="font-semibold">{order.order_number}</p>
              <OrderStatusBadge status={order.status} />
              <span className={cn(
                "rounded px-2 py-1 text-xs font-medium",
                order.order_type === "take_away" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
              )}>
                {order.order_type === "take_away" ? "Take Away" : "Dine In"}
                {order.order_type === "dine_in" && order.delivery_method === "pickup" && " - Ambil Sendiri"}
                {order.order_type === "dine_in" && order.delivery_method === "delivered" && ` - Diantar (Meja ${order.table_number})`}
              </span>
            </div>
            <p className="text-sm text-zinc-500">{formatDateTime(order.created_at)}</p>
            <p className="text-sm text-zinc-500">{formatPaymentMethod(order.payment_method)}</p>
          </div>

          {!compact && (
            <div className="min-w-0">
              <p className="mb-2 text-xs font-semibold uppercase text-zinc-400">Item struk</p>
              <div className="space-y-1">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_auto] gap-3 text-sm text-zinc-600"
                  >
                    <span className="truncate">
                      {item.quantity}x {item.menu_name}
                    </span>
                    <span>{formatCurrency(item.line_total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-left xl:text-right">
            <p className="text-xs font-semibold uppercase text-zinc-400">Total</p>
            <p className="text-lg font-semibold text-red-600">{formatCurrency(order.total)}</p>
            {!compact && (
              <p className="text-xs text-zinc-500">
                Subtotal {formatCurrency(order.subtotal)} + pajak {formatCurrency(order.tax)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function OrderStatusBadge({ status }: { status: string }) {
  const isCancelled = status === "cancelled"

  return (
    <span
      className={cn(
        "rounded px-2 py-1 text-xs font-medium",
        isCancelled ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700",
      )}
    >
      {status}
    </span>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="px-4 py-6 text-sm text-zinc-500">{text}</p>
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm font-medium">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-zinc-300"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  )
}

function DataHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between border-b px-4 py-3">
      <h2 className="text-base font-semibold">{title}</h2>
      <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">
        {count} data
      </span>
    </div>
  )
}

function RowActions({
  isActive,
  activeLabel = "Aktif",
  inactiveLabel = "Nonaktif",
  onEdit,
  onDelete,
}: {
  isActive: boolean
  activeLabel?: string
  inactiveLabel?: string
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "rounded px-2 py-1 text-xs font-medium",
          isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500",
        )}
      >
        {isActive ? activeLabel : inactiveLabel}
      </span>
      <Button variant="outline" size="icon-sm" onClick={onEdit}>
        <Pencil />
      </Button>
      <Button variant="outline" size="icon-sm" onClick={onDelete}>
        <Trash2 />
      </Button>
    </div>
  )
}
