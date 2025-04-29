"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase-server" // Gunakan instance supabase yang sudah ada

interface Pelatih {
  username_lh: string
  id_staf: string
  nama_lengkap?: string
}

interface Pengguna {
  username: string
  nama_depan: string
  nama_belakang: string
}

interface Hewan {
  id: string
  nama: string
  spesies: string
}

export default function EditAtraksiPage() {
  const router = useRouter()
  const { id } = useParams() // Mengambil ID dari URL
  const { user, userRole, loading } = useAuth()
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
  const nama_atraksi = decodeURIComponent(id as string)

  // Check if user has permission to manage attractions
  const canManage = ["staf_admin", "penjaga_hewan"].includes(userRole || "")

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/auth/login")
        return
      }

      if (canManage) {
        alert("Anda tidak memiliki izin untuk mengakses halaman ini")
        router.push("/atraksi")
        return
      }

      fetchData()
    }
  }, [user, loading, canManage])

  const fetchData = async () => {
    console.log("Fetching data for atraksi:", nama_atraksi)
    try {
      setIsLoading(true)

      // Fetch pelatih data
      const { data: pelatihData, error: pelatihError } = await supabase
        .from("pelatih_hewan")
        .select("username_lh, id_staf")

      if (pelatihError) {
        console.error("Error fetching pelatih:", pelatihError)
        throw pelatihError
      }

      // Fetch pengguna data untuk semua pelatih
      const usernames = pelatihData.map((p) => p.username_lh)
      const { data: penggunaData, error: penggunaError } = await supabase
        .from("pengguna")
        .select("username, nama_depan, nama_belakang")
        .in("username", usernames)

      if (penggunaError) {
        console.error("Error fetching pengguna:", penggunaError)
        throw penggunaError
      }

      // Buat mapping username ke data pengguna
      const penggunaMap: Record<string, Pengguna> = {}
      penggunaData.forEach((p) => {
        penggunaMap[p.username] = p
      })

      // Gabungkan data pelatih dengan data pengguna
      const transformedPelatihData = pelatihData.map((pelatih) => {
        const pengguna = penggunaMap[pelatih.username_lh]
        return {
          username_lh: pelatih.username_lh,
          id_staf: pelatih.id_staf,
          nama_lengkap: pengguna
            ? `${pengguna.nama_depan || ""} ${pengguna.nama_belakang || ""}`.trim()
            : pelatih.username_lh,
        }
      })

      console.log("Pelatih data:", transformedPelatihData)
      setPelatihList(transformedPelatihData || [])

      // Fetch hewan data
      const { data: hewanData, error: hewanError } = await supabase.from("hewan").select("id, nama, spesies")

      if (hewanError) {
        console.error("Error fetching hewan:", hewanError)
        throw hewanError
      }

      setHewanList(hewanData || [])

      // Fetch atraksi data
      const { data: atraksiData, error: atraksiError } = await supabase
        .from("atraksi")
        .select("*")
        .eq("nama_atraksi", nama_atraksi)
        .single()

      if (atraksiError) {
        console.error("Error fetching atraksi:", atraksiError)
        throw atraksiError
      }

      // Fetch fasilitas data
      const { data: fasilitasData, error: fasilitasError } = await supabase
        .from("fasilitas")
        .select("*")
        .eq("nama", nama_atraksi)
        .single()

      if (fasilitasError) {
        console.error("Error fetching fasilitas:", fasilitasError)
        throw fasilitasError
      }

      // Fetch jadwal penugasan data
      const { data: jadwalData, error: jadwalError } = await supabase
        .from("jadwal_penugasan")
        .select("*")
        .eq("nama_atraksi", nama_atraksi)
        .order("tgl_penugasan", { ascending: false })
        .limit(1)
        .maybeSingle() // Use maybeSingle instead of single to handle case when no data exists

      if (jadwalError && jadwalError.code !== "PGRST116") {
        // PGRST116 is "no rows returned" which is OK
        console.error("Error fetching jadwal:", jadwalError)
        throw jadwalError
      }

      // Fetch berpartisipasi data
      const { data: partisipasiData, error: partisipasiError } = await supabase
        .from("berpartisipasi")
        .select("*")
        .eq("nama_fasilitas", nama_atraksi)

      if (partisipasiError) {
        console.error("Error fetching partisipasi:", partisipasiError)
        throw partisipasiError
      }

      // Parse date and time
      const jadwalDate = new Date(fasilitasData.jadwal)
      const year = jadwalDate.getFullYear()
      const month = String(jadwalDate.getMonth() + 1).padStart(2, "0")
      const day = String(jadwalDate.getDate()).padStart(2, "0")
      const hours = String(jadwalDate.getHours()).padStart(2, "0")
      const minutes = String(jadwalDate.getMinutes()).padStart(2, "0")

      // Set form data
      setFormData({
        nama_atraksi: atraksiData.nama_atraksi,
        lokasi: atraksiData.lokasi,
        kapasitas_max: fasilitasData.kapasitas_max,
        jadwal_tanggal: `${year}-${month}-${day}`,
        jadwal_waktu: `${hours}:${minutes}`,
        pelatih: jadwalData?.username_lh || "",
        hewan_terlibat: partisipasiData.map((p) => p.id_hewan),
      })
    } catch (error) {
      console.error("Error fetching data:", error)
      console.error("Error details:", JSON.stringify(error, null, 2))
      alert("Gagal memuat data: " + (error.message || JSON.stringify(error)))
      router.push("/atraksi")
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
      // Combine date and time
      const jadwalDateTime = new Date(`${formData.jadwal_tanggal}T${formData.jadwal_waktu}:00`)

      // Update fasilitas table
      const { error: fasilitasError } = await supabase
        .from("fasilitas")
        .update({
          jadwal: jadwalDateTime.toISOString(),
          kapasitas_max: formData.kapasitas_max,
        })
        .eq("nama", nama_atraksi)

      if (fasilitasError) throw fasilitasError

      // Update atraksi table
      const { error: atraksiError } = await supabase
        .from("atraksi")
        .update({
          lokasi: formData.lokasi,
        })
        .eq("nama_atraksi", nama_atraksi)

      if (atraksiError) throw atraksiError

      // Check if pelatih has changed
      const { data: currentPelatih, error: pelatihCheckError } = await supabase
        .from("jadwal_penugasan")
        .select("username_lh")
        .eq("nama_atraksi", nama_atraksi)
        .order("tgl_penugasan", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (currentPelatih?.username_lh !== formData.pelatih) {
        // Insert new jadwal_penugasan entry
        const { error: jadwalError } = await supabase.from("jadwal_penugasan").insert({
          username_lh: formData.pelatih,
          tgl_penugasan: new Date().toISOString(),
          nama_atraksi: nama_atraksi,
        })

        if (jadwalError) throw jadwalError
      }

      // Update berpartisipasi table
      // First delete all existing entries
      const { error: deletePartisipasiError } = await supabase
        .from("berpartisipasi")
        .delete()
        .eq("nama_fasilitas", nama_atraksi)

      if (deletePartisipasiError) throw deletePartisipasiError

      // Then insert new entries
      const berpartisipasiData = formData.hewan_terlibat.map((hewanId) => ({
        nama_fasilitas: nama_atraksi,
        id_hewan: hewanId,
      }))

      const { error: partisipasiError } = await supabase.from("berpartisipasi").insert(berpartisipasiData)

      if (partisipasiError) throw partisipasiError

      alert("Atraksi berhasil diperbarui!")
      router.push("/atraksi")
    } catch (error) {
      console.error("Error updating atraksi:", error)
      alert("Gagal memperbarui atraksi")
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
              <h1 className="text-2xl font-bold text-gray-900 mb-6">FORM EDIT ATRAKSI</h1>
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
                    disabled
                    className="w-full border rounded-md p-2 bg-gray-100"
                  />
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
                  <div className="border rounded-md p-3 max-h-60 overflow-y-auto">
                    {hewanList.length === 0 ? (
                      <p className="text-gray-500">Tidak ada data hewan</p>
                    ) : (
                      <div className="space-y-2">
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
                    )}
                  </div>
                  {errors.hewan_terlibat && <p className="text-red-500 text-sm">{errors.hewan_terlibat}</p>}
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
                    SIMPAN PERUBAHAN
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
