"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { useAuth } from "@/contexts/auth-context"
import { PlusIcon, XIcon } from "lucide-react"
import { supabase } from "@/lib/supabase-server" // Gunakan instance supabase yang sudah ada

export default function CreateWahanaPage() {
  const router = useRouter()
  const { user, userRole } = useAuth()
  const [formData, setFormData] = useState({
    nama_wahana: "",
    kapasitas_max: 50,
    jadwal_tanggal: "",
    jadwal_waktu: "10:00",
    peraturan: [""],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Check if user has permission to manage rides
  const canManage = ["staf_admin", "penjaga_hewan"].includes(userRole || "")

  useEffect(() => {
    // Hanya cek apakah user memiliki izin untuk mengelola
    if (user && !canManage) {
      alert("Anda tidak memiliki izin untuk mengakses halaman ini")
      router.push("/wahana")
    }
  }, [user, canManage, router])

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

  const handlePeraturanChange = (index: number, value: string) => {
    const updatedPeraturan = [...formData.peraturan]
    updatedPeraturan[index] = value
    setFormData({
      ...formData,
      peraturan: updatedPeraturan,
    })
  }

  const addPeraturan = () => {
    setFormData({
      ...formData,
      peraturan: [...formData.peraturan, ""],
    })
  }

  const removePeraturan = (index: number) => {
    const updatedPeraturan = [...formData.peraturan]
    updatedPeraturan.splice(index, 1)
    setFormData({
      ...formData,
      peraturan: updatedPeraturan,
    })
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.nama_wahana) newErrors.nama_wahana = "Nama wahana harus diisi"
    if (!formData.kapasitas_max || formData.kapasitas_max <= 0) newErrors.kapasitas_max = "Kapasitas harus lebih dari 0"
    if (!formData.jadwal_tanggal) newErrors.jadwal_tanggal = "Tanggal jadwal harus diisi"
    if (!formData.jadwal_waktu) newErrors.jadwal_waktu = "Waktu jadwal harus diisi"
    if (formData.peraturan.length === 0 || !formData.peraturan.some((p) => p.trim() !== "")) {
      newErrors.peraturan = "Minimal satu peraturan harus diisi"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      setIsLoading(true)

      // Combine date and time
      const jadwalDateTime = new Date(`${formData.jadwal_tanggal}T${formData.jadwal_waktu}:00`)

      // Filter out empty rules
      const filteredPeraturan = formData.peraturan.filter((p) => p.trim() !== "")
      const peraturanText = filteredPeraturan.join("\n")

      // First insert into fasilitas table
      const { error: fasilitasError } = await supabase.from("fasilitas").insert({
        nama: formData.nama_wahana,
        jadwal: jadwalDateTime.toISOString(),
        kapasitas_max: formData.kapasitas_max,
      })

      if (fasilitasError) throw fasilitasError

      // Insert into wahana table
      const { error: wahanaError } = await supabase.from("wahana").insert({
        nama_wahana: formData.nama_wahana,
        peraturan: peraturanText,
      })

      if (wahanaError) {
        // Rollback fasilitas insert
        await supabase.from("fasilitas").delete().eq("nama", formData.nama_wahana)
        throw wahanaError
      }

      alert("Wahana berhasil ditambahkan!")
      router.push("/wahana")
    } catch (error) {
      console.error("Error adding wahana:", error)
      alert("Gagal menambahkan wahana")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow p-6 bg-[#FFECDB]">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-2 bg-[#FF912F]" />
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">FORM TAMBAH WAHANA</h1>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Peraturan:</label>
                  {formData.peraturan.map((peraturan, index) => (
                    <div key={index} className="flex items-start mb-2">
                      <textarea
                        value={peraturan}
                        onChange={(e) => handlePeraturanChange(index, e.target.value)}
                        className="w-full border rounded-md p-2 mr-2"
                        rows={2}
                        placeholder={`Peraturan ${index + 1}`}
                      />
                      {formData.peraturan.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePeraturan(index)}
                          className="p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                        >
                          <XIcon size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addPeraturan}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800 mt-1"
                  >
                    <PlusIcon size={16} className="mr-1" />
                    <span>Tambah Peraturan</span>
                  </button>
                  {errors.peraturan && <p className="text-red-500 text-sm mt-1">{errors.peraturan}</p>}
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
                    disabled={isLoading}
                    className="px-4 py-2 bg-[#FF912F] text-white rounded hover:bg-[#FF912F]/90 transition-colors"
                  >
                    {isLoading ? "Menyimpan..." : "SIMPAN"}
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
