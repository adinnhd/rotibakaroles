"use client"

import { useState, useEffect, type FormEvent } from "react"
import { Plus, Trash2, Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { MenuItem } from "@/lib/menu-data"
import { apiRequest } from "@/lib/admin-api"

interface AddonRecommendation {
  id: number
  recommended_menu_id: number
  is_global: boolean
  target_menu_id: number | null
  reason_id: string
  reason_en: string | null
  is_active: boolean
  recommended_menu?: MenuItem
  target_menu?: MenuItem
}

export function AddonsSection({ menus }: { menus: MenuItem[] }) {
  const [addons, setAddons] = useState<AddonRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [recommendedMenuId, setRecommendedMenuId] = useState<string>("")
  const [isGlobal, setIsGlobal] = useState(false)
  const [targetMenuId, setTargetMenuId] = useState<string>("")
  const [reasonId, setReasonId] = useState("")
  const [reasonEn, setReasonEn] = useState("")

  const fetchAddons = async () => {
    try {
      const res = await apiRequest<AddonRecommendation[]>("/admin/addon-recommendations")
      setAddons(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAddons()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!recommendedMenuId || !reasonId) {
      alert("Produk rekomendasi dan alasan (ID) wajib diisi.")
      return
    }
    if (!isGlobal && !targetMenuId) {
      alert("Target produk wajib diisi jika tidak bersifat global.")
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await apiRequest("/admin/addon-recommendations", {
        method: "POST",
        body: JSON.stringify({
          recommended_menu_id: parseInt(recommendedMenuId),
          is_global: isGlobal,
          target_menu_id: !isGlobal && targetMenuId ? parseInt(targetMenuId) : null,
          reason_id: reasonId,
          reason_en: reasonEn || null,
          is_active: true
        })
      })
      
      setRecommendedMenuId("")
      setIsGlobal(false)
      setTargetMenuId("")
      setReasonId("")
      setReasonEn("")
      
      await fetchAddons()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan")
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (addon: AddonRecommendation) => {
    try {
      await apiRequest(`/admin/addon-recommendations/${addon.id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: !addon.is_active })
      })
      await fetchAddons()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengubah status")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus rekomendasi ini?")) return
    try {
      await apiRequest(`/admin/addon-recommendations/${id}`, {
        method: "DELETE"
      })
      await fetchAddons()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus")
    }
  }

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-gray-900">Manajemen Rekomendasi (Add-on)</h2>
        <p className="text-sm text-gray-500">
          Atur produk yang akan direkomendasikan saat pelanggan berada di halaman pembayaran.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Form Tambah */}
        <div className="md:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Tambah Rekomendasi Baru</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Produk yang Direkomendasikan *</Label>
              <select 
                value={recommendedMenuId} 
                onChange={(e) => setRecommendedMenuId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                required
              >
                <option value="">Pilih Produk...</option>
                {menus.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 cursor-pointer" onClick={() => setIsGlobal(!isGlobal)}>
              <Label className="cursor-pointer pointer-events-none">Tawarkan ke Semua Pembeli</Label>
              <input type="checkbox" checked={isGlobal} onChange={(e) => setIsGlobal(e.target.checked)} className="w-5 h-5 cursor-pointer pointer-events-none text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" />
            </div>

            {!isGlobal && (
              <div className="space-y-2">
                <Label>Picu Jika Pembeli Membeli Produk Ini *</Label>
                <select 
                  value={targetMenuId} 
                  onChange={(e) => setTargetMenuId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  required={!isGlobal}
                >
                  <option value="">Pilih Produk Pemicu...</option>
                  {menus.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Alasan (Teks Bahasa Indonesia) *</Label>
              <Input 
                placeholder="Contoh: Cocok banget buat temen makan kamu!" 
                value={reasonId} 
                onChange={e => setReasonId(e.target.value)} 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label>Alasan (Teks Bahasa Inggris)</Label>
              <Input 
                placeholder="Example: Perfect pairing for your meal!" 
                value={reasonEn} 
                onChange={e => setReasonEn(e.target.value)} 
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Tambah Rekomendasi
            </Button>
          </form>
        </div>

        {/* Daftar Rekomendasi */}
        <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                <tr>
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Alasan (ID)</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {addons.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Belum ada rekomendasi yang diatur.
                    </td>
                  </tr>
                ) : addons.map((addon) => (
                  <tr key={addon.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {addon.recommended_menu?.name || 'Produk Dihapus'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {addon.is_global ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Semua Produk
                        </span>
                      ) : (
                        <span>{addon.target_menu?.name || 'Produk Dihapus'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{addon.reason_id}</td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => toggleActive(addon)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${addon.is_active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                      >
                        {addon.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(addon.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
