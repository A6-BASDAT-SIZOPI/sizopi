"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { useAuth } from "@/contexts/auth-context"

interface Pelatih {
  username_lh: string
  id_staf: string
  nama_lengkap?: string
}

interface Hewan {
  id: string
  nama: string
  spesies: string
}

export default function CreateAtraksiPage() {
  const router = useRouter()
  const { user, userRole } = useAuth()
  const [formData, setFormData] = useState({
    nama_atraksi: "",
    lokasi: "",
    kapasitas_max: 50,
    jadwal_tanggal: "",
    jadwal_waktu: "10:00",
    pelatih: "",
    hewan_terlibat: [] as string[],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pelatihList, setPelatihList] = useState<Pelatih[]>([])
  const [hewanList, setHewanList] = useState<Hewan[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Check if user has permission to manage attractions
  const canManage = ["staf_admin", "penjaga_hewan"].includes(userRole || "")

  useEffect(() => {
    // Hanya cek apakah user memiliki izin untuk mengelola
    if (!user && !canManage) {
      alert("Anda tidak memiliki izin untuk mengakses halaman ini")
      router.push("/atraksi")
      return
    }

    fetchData()
  }, [user, canManage, router])

  const fetchData = async () => {
    try {
      setIsLoading(true)

      // Fetch pelatih data
      const response = await fetch('/api/pelatih')
      if (!response.ok) {
        throw new Error('Gagal mengambil data pelatih')
      }
      const pelatihData = await response.json()
      setPelatihList(pelatihData)

      // Fetch hewan data
      const hewanResponse = await fetch('/api/hewan')
      if (!hewanResponse.ok) {
        throw new Error('Gagal mengambil data hewan')
      }
      const hewanData = await hewanResponse.json()
      setHewanList(hewanData)
    } catch (error) {
      console.error("Error fetching data:", error)
      alert("Gagal memuat data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  const handleHewanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target
    if (checked) {
      setFormData({
        ...formData,
        hewan_terlibat: [...formData.hewan_terlibat, value],
      })
    } else {
      setFormData({
        ...formData,
        hewan_terlibat: formData.hewan_terlibat.filter((id) => id !== value),
      })
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.nama_atraksi) newErrors.nama_atraksi = "Nama atraksi harus diisi"
    if (!formData.lokasi) newErrors.lokasi = "Lokasi harus diisi"
    if (!formData.kapasitas_max || formData.kapasitas_max <= 0) newErrors.kapasitas_max = "Kapasitas harus lebih dari 0"
    if (!formData.jadwal_tanggal) newErrors.jadwal_tanggal = "Tanggal jadwal harus diisi"
    if (!formData.jadwal_waktu) newErrors.jadwal_waktu = "Waktu jadwal harus diisi"
    if (!formData.pelatih) newErrors.pelatih = "Pelatih harus dipilih"
    if (formData.hewan_terlibat.length === 0) newErrors.hewan_terlibat = "Minimal satu hewan harus dipilih"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      const response = await fetch('/api/atraksi/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Gagal menambahkan atraksi')
      }

      alert("Atraksi berhasil ditambahkan!")
      router.push("/atraksi")
    } catch (error) {
      console.error("Error adding atraksi:", error)
      alert("Gagal menambahkan atraksi")
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
              <h1 className="text-2xl font-bold text-gray-900 mb-6">FORM TAMBAH ATRAKSI</h1>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="nama_atraksi" className="block text-sm font-medium text-gray-700">
                    Nama Atraksi:
                  </label>
                  <input
                    type="text"
                    id="nama_atraksi"
                    name="nama_atraksi"
                    value={formData.nama_atraksi}
                    onChange={handleChange}
                    className="w-full border rounded-md p-2"
                  />
                  {errors.nama_atraksi && <p className="text-red-500 text-sm">{errors.nama_atraksi}</p>}
                </div>

                <div>
                  <label htmlFor="lokasi" className="block text-sm font-medium text-gray-700">
                    Lokasi:
                  </label>
                  <textarea
                    id="lokasi"
                    name="lokasi"
                    value={formData.lokasi}
                    onChange={handleChange}
                    className="w-full border rounded-md p-2"
                    rows={2}
                  />
                  {errors.lokasi && <p className="text-red-500 text-sm">{errors.lokasi}</p>}
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

                <div>
                  <label htmlFor="pelatih" className="block text-sm font-medium text-gray-700">
                    Pelatih Pertunjukan:
                  </label>
                  <select
                    id="pelatih"
                    name="pelatih"
                    value={formData.pelatih}
                    onChange={handleChange}
                    className="w-full border rounded-md p-2"
                  >
                    <option value="">Pilih Pelatih</option>
                    {pelatihList.map((pelatih) => (
                      <option key={pelatih.username_lh} value={pelatih.username_lh}>
                        {pelatih.nama_lengkap || pelatih.username_lh}
                      </option>
                    ))}
                  </select>
                  {errors.pelatih && <p className="text-red-500 text-sm">{errors.pelatih}</p>}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hewan yang Terlibat:</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {hewanList.map((hewan) => (
                      <div key={hewan.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`hewan-${hewan.id}`}
                          value={hewan.id}
                          checked={formData.hewan_terlibat.includes(hewan.id)}
                          onChange={handleHewanChange}
                          className="mr-2"
                        />
                        <label htmlFor={`hewan-${hewan.id}`} className="text-sm">
                          {hewan.nama} ({hewan.spesies})
                        </label>
                      </div>
                    ))}
                  </div>
                  {errors.hewan_terlibat && <p className="text-red-500 text-sm mt-1">{errors.hewan_terlibat}</p>}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => router.push("/atraksi")}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
                  >
                    BATAL
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#FF912F] text-white rounded hover:bg-[#FF912F]/90 transition-colors"
                  >
                    SIMPAN
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
