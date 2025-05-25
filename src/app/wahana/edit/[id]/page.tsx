"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { Navbar } from "@/components/navbar"
import { useAuth } from "@/contexts/auth-context"
import { PlusIcon, XIcon } from "lucide-react"

// Inisialisasi Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export default function EditWahanaPage() {
  const router = useRouter()
  const { id } = useParams() // Mengambil ID dari URL
  const { user, userRole, loading } = useAuth()
  const [formData, setFormData] = useState({
    nama_wahana: "",
    kapasitas_max: 50,
    jadwal_tanggal: "",
    jadwal_waktu: "10:00",
    peraturan: [""],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const nama_wahana = decodeURIComponent(id as string)

  // Check if user has permission to manage rides
  const canManage = ["staf_admin", "penjaga_hewan"].includes(userRole || "")

  useEffect(() => {
    // Fetch data regardless of auth state
    fetchData()
  }, []) // Remove loading dependency to prevent infinite loop

  const fetchData = async () => {
    try {
      setIsLoading(true)

      // Fetch wahana data
      const { data: wahanaData, error: wahanaError } = await supabase
        .from("wahana")
        .select("*")
        .eq("nama_wahana", nama_wahana)
        .single()

      if (wahanaError) throw wahanaError

      // Fetch fasilitas data
      const { data: fasilitasData, error: fasilitasError } = await supabase
        .from("fasilitas")
        .select("*")
        .eq("nama", nama_wahana)
        .single()

      if (fasilitasError) throw fasilitasError

      // Parse date and time
      const jadwalDate = new Date(fasilitasData.jadwal)
      const year = jadwalDate.getFullYear()
      const month = String(jadwalDate.getMonth() + 1).padStart(2, "0")
      const day = String(jadwalDate.getDate()).padStart(2, "0")
      const hours = String(jadwalDate.getHours()).padStart(2, "0")
      const minutes = String(jadwalDate.getMinutes()).padStart(2, "0")

      // Split peraturan by newline
      const peraturanArray = wahanaData.peraturan ? wahanaData.peraturan.split("\n") : [""]

      // Set form data
      setFormData({
        nama_wahana: wahanaData.nama_wahana,
        kapasitas_max: fasilitasData.kapasitas_max,
        jadwal_tanggal: `${year}-${month}-${day}`,
        jadwal_waktu: `${hours}:${minutes}`,
        peraturan: peraturanArray,
      })
    } catch (error) {
      console.error("Error fetching data:", error)
      alert("Gagal memuat data")
      router.push("/wahana")
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
      setIsSaving(true)

      // Combine date and time
      const jadwalDateTime = new Date(`${formData.jadwal_tanggal}T${formData.jadwal_waktu}:00`)

      // Filter out empty rules
      const filteredPeraturan = formData.peraturan.filter((p) => p.trim() !== "")
      const peraturanText = filteredPeraturan.join("\n")

      // Update fasilitas table
      const { error: fasilitasError } = await supabase
        .from("fasilitas")
        .update({
          jadwal: jadwalDateTime.toISOString(),
          kapasitas_max: formData.kapasitas_max,
        })
        .eq("nama", nama_wahana)

      if (fasilitasError) throw fasilitasError

      // Update wahana table
      const { error: wahanaError } = await supabase
        .from("wahana")
        .update({
          peraturan: peraturanText,
        })
        .eq("nama_wahana", nama_wahana)

      if (wahanaError) throw wahanaError

      alert("Wahana berhasil diperbarui!")
      router.push("/wahana")
    } catch (error) {
      console.error("Error updating wahana:", error)
      alert("Gagal memperbarui wahana")
    } finally {
      setIsSaving(false)
    }
  }

  if (loading || isLoading) {
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
                    disabled
                    className="w-full border rounded-md p-2 bg-gray-100"
                  />
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
                    disabled={isSaving}
                    className="px-4 py-2 bg-[#FF912F] text-white rounded hover:bg-[#FF912F]/90 transition-colors"
                  >
                    {isSaving ? "Menyimpan..." : "SIMPAN PERUBAHAN"}
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
