"use client"

import { useEffect, useState, use } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus } from "lucide-react"
import { getAnimalById } from "../../actions/medical-record-actions"
import { getAnimalExaminationFrequency, getExaminationSchedules } from "../../actions/schedule-actions"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { AddScheduleModal } from "@/components/schedules/add-schedule-modal"
import { UpdateFrequencyModal } from "@/components/schedules/update-frequency-modal"

interface Animal {
  id: string
  nama: string
  spesies: string
  asal_hewan: string
  tanggal_lahir: string | null
  status_kesehatan: string
  nama_habitat: string | null
  url_foto: string
}

interface ExaminationSchedule {
  id_hewan: string
  tgl_pemeriksaan_selanjutnya: string
  freq_pemeriksaan_rutin?: number
}

export default function AnimalSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { user, userRole, loading } = useAuth()
  const [animal, setAnimal] = useState<Animal | null>(null)
  const [schedules, setSchedules] = useState<ExaminationSchedule[]>([])
  const [frequency, setFrequency] = useState<number>(3) // Default to 3 months
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isFrequencyModalOpen, setIsFrequencyModalOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        // Fetch animal details
        const animalResult = await getAnimalById(resolvedParams.id)
        if (animalResult.success && animalResult.data) {
          setAnimal(animalResult.data)
        } else {
          console.error("Error fetching animal:", animalResult.error)
          router.push("/jadwal-pemeriksaan")
          return
        }

        // Fetch examination frequency
        const frequencyResult = await getAnimalExaminationFrequency(resolvedParams.id)
        if (frequencyResult.success) {
          setFrequency(frequencyResult.data)
        }

        // Fetch examination schedules
        const schedulesResult = await getExaminationSchedules(resolvedParams.id)
        if (schedulesResult.success && schedulesResult.data) {
          setSchedules(schedulesResult.data)
        } else {
          console.error("Error fetching schedules:", schedulesResult.error)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, resolvedParams.id, router])

  const handleAddSchedule = () => {
    setIsAddModalOpen(true)
  }

  const handleUpdateFrequency = () => {
    setIsFrequencyModalOpen(true)
  }

  const refreshSchedules = async () => {
    try {
      const schedulesResult = await getExaminationSchedules(resolvedParams.id)
      if (schedulesResult.success && schedulesResult.data) {
        setSchedules(schedulesResult.data)
      }

      const frequencyResult = await getAnimalExaminationFrequency(resolvedParams.id)
      if (frequencyResult.success) {
        setFrequency(frequencyResult.data)
      }
    } catch (error) {
      console.error("Error refreshing data:", error)
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

  if (!animal) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <p>Hewan tidak ditemukan</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow p-6 bg-gradient-to-b from-green-50 to-green-100">
        <div className="max-w-4xl mx-auto">
          <Button variant="outline" className="mb-4" onClick={() => router.push("/jadwal-pemeriksaan")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Button>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Jadwal Pemeriksaan: {animal.nama ? animal.nama : animal.spesies}</h1>
              </div>

              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <span className="font-medium">Frekuensi Pemeriksaan Rutin:</span>
                  <span className="ml-2">{frequency} bulan sekali</span>
                  <Button variant="outline" size="sm" className="ml-4" onClick={handleUpdateFrequency}>
                    Ubah
                  </Button>
                </div>
                <Button onClick={handleAddSchedule}>
                  <Plus className="mr-2 h-4 w-4" /> Tambah Jadwal Pemeriksaan
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 p-3 text-left">Tanggal Pemeriksaan Selanjutnya</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.length > 0 ? (
                      schedules.map((schedule) => (
                        <tr key={schedule.tgl_pemeriksaan_selanjutnya} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-3">
                            {format(new Date(schedule.tgl_pemeriksaan_selanjutnya), "dd MMMM yyyy", { locale: id })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="border border-gray-300 p-3 text-center">
                          Belum ada jadwal pemeriksaan untuk hewan ini
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

      <footer className="bg-green-800 text-white p-4 text-center">
        <p>&copy; {new Date().getFullYear()} SIZOPI - Sistem Informasi Zoo Pintar</p>
      </footer>

      {/* Modals */}
      <AddScheduleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        animalId={animal.id}
        onSuccess={refreshSchedules}
      />

      <UpdateFrequencyModal
        isOpen={isFrequencyModalOpen}
        onClose={() => setIsFrequencyModalOpen(false)}
        animalId={animal.id}
        currentFrequency={frequency}
        onSuccess={refreshSchedules}
      />
    </div>
  )
}
