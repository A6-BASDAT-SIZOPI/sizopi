"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus } from 'lucide-react'
import { getAnimalById, getFeedingSchedules, markFeedingAsComplete } from "../../actions/feeding-actions"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { AddFeedingModal } from "@/components/feedings/add-feeding-modal"
import { EditFeedingModal } from "@/components/feedings/edit-feeding-modal"
import { DeleteFeedingModal } from "@/components/feedings/delete-feeding-modal"

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

interface FeedingSchedule {
  id: number
  id_hewan: string
  username_jh: string
  jenis_pakan: string
  jumlah_pakan: number
  jadwal: string
  status: string
}

export default function AnimalFeedingPage({ params }: { params: { id: string } }) {
  const { user, userRole, loading } = useAuth()
  const [animal, setAnimal] = useState<Animal | null>(null)
  const [feedings, setFeedings] = useState<FeedingSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedFeeding, setSelectedFeeding] = useState<FeedingSchedule | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        // Fetch animal details
        const animalResult = await getAnimalById(params.id)
        if (animalResult.success && animalResult.data) {
          setAnimal(animalResult.data)
        } else {
          console.error("Error fetching animal:", animalResult.error)
          router.push("/pemberian-pakan")
          return
        }

        // Fetch feeding schedules
        const feedingsResult = await getFeedingSchedules(params.id)
        if (feedingsResult.success && feedingsResult.data) {
          setFeedings(feedingsResult.data)
        } else {
          console.error("Error fetching feedings:", feedingsResult.error)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, params.id, router])

  const handleAddFeeding = () => {
    setIsAddModalOpen(true)
  }

  const handleEditFeeding = (feeding: FeedingSchedule) => {
    setSelectedFeeding(feeding)
    setIsEditModalOpen(true)
  }

  const handleDeleteFeeding = (feeding: FeedingSchedule) => {
    setSelectedFeeding(feeding)
    setIsDeleteModalOpen(true)
  }

  const handleMarkAsComplete = async (id: number) => {
    try {
      // Cari feeding schedule dengan id tersebut di state
      const feeding = feedings.find(f => f.id === id);
      if (!feeding) return;
      
      const result = await markFeedingAsComplete(feeding.id_hewan, feeding.jadwal)
      if (result.success) {
        // Update the local state
        setFeedings(prevFeedings =>
          prevFeedings.map(feeding =>
            feeding.id === id ? { ...feeding, status: "Selesai Diberikan" } : feeding
          )
        )
      } else {
        console.error("Error marking feeding as complete:", result.error)
      }
    } catch (error) {
      console.error("Error marking feeding as complete:", error)
    }
  }

  const refreshFeedings = async () => {
    try {
      const feedingsResult = await getFeedingSchedules(params.id)
      if (feedingsResult.success && feedingsResult.data) {
        setFeedings(feedingsResult.data)
      }
    } catch (error) {
      console.error("Error refreshing feedings:", error)
    }
  }

  const formatDateTime = (dateTimeStr: string) => {
    try {
      return format(parseISO(dateTimeStr), "yyyy-MM-dd HH:mm:ss", { locale: id })
    } catch (error) {
      return dateTimeStr
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

  if (userRole !== "penjaga_hewan") {
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
        <div className="max-w-6xl mx-auto">
          <Button variant="outline" className="mb-4" onClick={() => router.push("/pemberian-pakan")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Button>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">
                  Pemberian Pakan: {animal.nama ? animal.nama : animal.spesies}
                </h1>
                <Button onClick={handleAddFeeding}>
                  <Plus className="mr-2 h-4 w-4" /> Tambah Jadwal Pemberian Pakan
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 p-3 text-left">Jenis Pakan</th>
                      <th className="border border-gray-300 p-3 text-left">Jumlah Pakan (gram)</th>
                      <th className="border border-gray-300 p-3 text-left">Jadwal</th>
                      <th className="border border-gray-300 p-3 text-left">Status</th>
                      <th className="border border-gray-300 p-3 text-left">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedings.length > 0 ? (
                      feedings.map((feeding) => (
                        <tr key={feeding.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-3">{feeding.jenis_pakan}</td>
                          <td className="border border-gray-300 p-3">{feeding.jumlah_pakan}</td>
                          <td className="border border-gray-300 p-3">{formatDateTime(feeding.jadwal)}</td>
                          <td className="border border-gray-300 p-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                feeding.status === "Selesai Diberikan"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {feeding.status}
                            </span>
                          </td>
                          <td className="border border-gray-300 p-3 space-x-2 flex">
                            {feeding.status === "Menunggu Pemberian" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-green-100 text-green-800 hover:bg-green-200 mr-2"
                                onClick={() => handleMarkAsComplete(feeding.id)}
                              >
                                Beri Pakan
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 mr-2"
                              onClick={() => handleEditFeeding(feeding)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-red-100 text-red-800 hover:bg-red-200"
                              onClick={() => handleDeleteFeeding(feeding)}
                            >
                              Hapus
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="border border-gray-300 p-3 text-center">
                          Belum ada jadwal pemberian pakan untuk hewan ini
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
      <AddFeedingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        animalId={animal.id}
        onSuccess={refreshFeedings}
      />

      {selectedFeeding && (
        <>
          <EditFeedingModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            feeding={selectedFeeding}
            onSuccess={refreshFeedings}
          />

          <DeleteFeedingModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            feeding={selectedFeeding}
            onSuccess={refreshFeedings}
          />
        </>
      )}
    </div>
  )
}
