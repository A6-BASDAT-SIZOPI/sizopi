"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { getAllAnimals } from "../actions/medical-record-actions"
import { supabase } from "@/lib/supabase-client"

interface Animal {
  id: string
  nama: string
  spesies: string
  asal_hewan: string
  tanggal_lahir: string | null
  status_kesehatan: string
  nama_habitat: string | null
  url_foto: string
  frekuensi_pemeriksaan?: number
}

interface Schedule {
  id_hewan: string
  tgl_pemeriksaan_selanjutnya: string
  freq_pemeriksaan_rutin: number
}

export default function JadwalPemeriksaanPage() {
  const { user, userRole, loading } = useAuth()
  const [animals, setAnimals] = useState<Animal[]>([])
  const [filteredAnimals, setFilteredAnimals] = useState<Animal[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const fetchAnimals = async () => {
      if (!user) return

      try {
        const result = await getAllAnimals()
        if (result.success && result.data) {
          setAnimals(result.data)
          setFilteredAnimals(result.data)
        }
      } catch (error) {
        console.error("Error fetching animals:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnimals()
  }, [user])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredAnimals(animals)
    } else {
      const filtered = animals.filter(
        (animal) =>
          animal.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          animal.spesies.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredAnimals(filtered)
    }
  }, [searchTerm, animals])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Sehat":
        return "bg-green-100 text-green-800"
      case "Sakit":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <p>Loading...</p>
        </main>
      </div>
    )
  }

  if (userRole !== "dokter_hewan") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <p>Anda tidak memiliki akses ke halaman ini</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow p-6 bg-gradient-to-b from-green-50 to-green-100">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-center px-4 py-1">JADWAL PEMERIKSAAN KESEHATAN</h1>
              </div>

              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Cari hewan berdasarkan nama atau spesies..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 p-3 text-left">Nama Hewan</th>
                      <th className="border border-gray-300 p-3 text-left">Spesies</th>
                      <th className="border border-gray-300 p-3 text-left">Status Kesehatan</th>
                      <th className="border border-gray-300 p-3 text-left">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAnimals.length > 0 ? (
                      filteredAnimals.map((animal) => (
                        <tr key={animal.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-3">
                            {animal.nama ? animal.nama : `${animal.spesies} (Tanpa Nama)`}
                          </td>
                          <td className="border border-gray-300 p-3">{animal.spesies}</td>
                          <td className="border border-gray-300 p-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                animal.status_kesehatan,
                              )}`}
                            >
                              {animal.status_kesehatan}
                            </span>
                          </td>
                          <td className="border border-gray-300 p-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                              onClick={() => router.push(`/jadwal-pemeriksaan/${animal.id}`)}
                            >
                              Lihat Jadwal
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="border border-gray-300 p-3 text-center">
                          Tidak ada hewan yang ditemukan
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* <AddHealthScheduleModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        animalId={filteredAnimals[0]?.id || ""}
        onSuccess={() => {}}
      /> */}

      <footer className="bg-green-800 text-white p-4 text-center">
        <p>&copy; {new Date().getFullYear()} SIZOPI - Sistem Informasi Zoo Pintar</p>
      </footer>
    </div>
  )
}
