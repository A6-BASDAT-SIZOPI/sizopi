"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { useAuth } from "@/contexts/auth-context"

interface Wahana {
  nama_wahana: string
  peraturan: string
  kapasitas_max: number
  jadwal_tanggal: string
  jadwal_waktu: string
}

export default function EditWahanaPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { user, userRole } = useAuth()
  const [formData, setFormData] = useState<Wahana>({
    nama_wahana: "",
    peraturan: "",
    kapasitas_max: 50,
    jadwal_tanggal: "",
    jadwal_waktu: "10:00",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if user has permission to manage attractions
  const canManage = ["staf_admin", "penjaga_hewan"].includes(userRole || "")

  useEffect(() => {
    // Hanya cek apakah user memiliki izin untuk mengelola
    if (!user && !canManage) {
      alert("Anda tidak memiliki izin untuk mengakses halaman ini")
      router.push("/wahana")
      return
    }

    if (!id) {
      alert("ID wahana tidak ditemukan")
      router.push("/wahana")
      return
    }

    fetchData()
  }, [user, canManage, router, id])

  const fetchData = async () => {
    if (!id) return

    try {
      setIsLoading(true)

      // Fetch wahana data
      const response = await fetch(`/api/wahana/edit/${id}`)
      if (!response.ok) {
        throw new Error('Gagal mengambil data wahana')
      }
      const wahanaData = await response.json()
      
      // Format date and time from ISO string
      const jadwal = new Date(wahanaData.jadwal)
      const jadwal_tanggal = jadwal.toISOString().split('T')[0]
      const jadwal_waktu = jadwal.toTimeString().slice(0, 5)

      setFormData({
        nama_wahana: wahanaData.nama_wahana,
        peraturan: wahanaData.peraturan,
        kapasitas_max: wahanaData.kapasitas_max,
        jadwal_tanggal,
        jadwal_waktu,
      })
    } catch (error) {
      console.error("Error fetching data:", error)
      alert("Gagal memuat data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: name === "kapasitas_max" ? Number.parseInt(value) || 0 : value,
    })
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      })
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.nama_wahana) newErrors.nama_wahana = "Nama wahana harus diisi"
    if (!formData.peraturan) newErrors.peraturan = "Peraturan harus diisi"
    if (!formData.kapasitas_max || formData.kapasitas_max <= 0) newErrors.kapasitas_max = "Kapasitas harus lebih dari 0"
    if (!formData.jadwal_tanggal) newErrors.jadwal_tanggal = "Tanggal jadwal harus diisi"
    if (!formData.jadwal_waktu) newErrors.jadwal_waktu = "Waktu jadwal harus diisi"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !id) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/wahana/edit/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Gagal mengupdate wahana')
      }

      alert("Wahana berhasil diupdate!")
      router.push("/wahana")
    } catch (error) {
      console.error("Error updating wahana:", error)
      alert("Gagal mengupdate wahana")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow p-6 bg-[#FFECDB]">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="h-2 bg-[#FF912F]" />
              <div className="p-6">
                <div className="text-center py-8 text-gray-500">Memuat data...</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow p-6 bg-[#FFECDB]">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-2 bg-[#FF912F]" />
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">FORM EDIT WAHANA</h1>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="nama_wahana" className="block text-sm font-medium text-gray-700">
                    Nama Wahana:
                  </label>
                  <input
                    type="text"
                    id="nama_wahana"
                    name="nama_wahana"
                    value={formData.nama_wahana}
                    onChange={handleChange}
                    className="w-full border rounded-md p-2"
                  />
                  {errors.nama_wahana && <p className="text-red-500 text-sm">{errors.nama_wahana}</p>}
                </div>

                <div>
                  <label htmlFor="peraturan" className="block text-sm font-medium text-gray-700">
                    Peraturan:
                  </label>
                  <textarea
                    id="peraturan"
                    name="peraturan"
                    value={formData.peraturan}
                    onChange={handleChange}
                    className="w-full border rounded-md p-2"
                    rows={4}
                  />
                  {errors.peraturan && <p className="text-red-500 text-sm">{errors.peraturan}</p>}
                </div>

                <div>
                  <label htmlFor="kapasitas_max" className="block text-sm font-medium text-gray-700">
                    Kapasitas Maksimum:
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      id="kapasitas_max"
                      name="kapasitas_max"
                      value={formData.kapasitas_max}
                      onChange={handleChange}
                      min="1"
                      className="w-full border rounded-md p-2"
                    />
                    <span className="ml-2">orang</span>
                  </div>
                  {errors.kapasitas_max && <p className="text-red-500 text-sm">{errors.kapasitas_max}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="jadwal_tanggal" className="block text-sm font-medium text-gray-700">
                      Tanggal:
                    </label>
                    <input
                      type="date"
                      id="jadwal_tanggal"
                      name="jadwal_tanggal"
                      value={formData.jadwal_tanggal}
                      onChange={handleChange}
                      className="w-full border rounded-md p-2"
                    />
                    {errors.jadwal_tanggal && <p className="text-red-500 text-sm">{errors.jadwal_tanggal}</p>}
                  </div>

                  <div>
                    <label htmlFor="jadwal_waktu" className="block text-sm font-medium text-gray-700">
                      Waktu:
                    </label>
                    <input
                      type="time"
                      id="jadwal_waktu"
                      name="jadwal_waktu"
                      value={formData.jadwal_waktu}
                      onChange={handleChange}
                      className="w-full border rounded-md p-2"
                    />
                    {errors.jadwal_waktu && <p className="text-red-500 text-sm">{errors.jadwal_waktu}</p>}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => router.push("/wahana")}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
                  >
                    BATAL
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-[#FF912F] text-white rounded hover:bg-[#FF912F]/90 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "MENYIMPAN..." : "SIMPAN"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
