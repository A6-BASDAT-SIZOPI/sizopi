"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Search } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { getAllFeedings } from "../actions/feeding-actions"
import { ArrowLeft, Plus } from 'lucide-react'
import { markFeedingAsComplete } from "@/app/actions/feeding-actions"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { AddFeedingModal } from "@/components/feedings/add-feeding-modal"
import { EditFeedingModal } from "@/components/feedings/edit-feeding-modal"
import { DeleteFeedingModal } from "@/components/feedings/delete-feeding-modal"

interface FeedingSchedule {
  id?: number
  id_hewan: string
  jadwal: string
  jenis: string
  jumlah: number
  status: string
  username_jh?: string
}

export default function PemberianPakanPage() {
  const { user, userRole, loading } = useAuth()
  const [feedings, setFeedings] = useState<FeedingSchedule[]>([])
  const [filteredFeedings, setFilteredFeedings] = useState<FeedingSchedule[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedFeeding, setSelectedFeeding] = useState<FeedingSchedule | null>(null)
  const [animals, setAnimals] = useState<{id: string, nama: string}[]>([])

  useEffect(() => {
    const fetchFeedings = async () => {
      if (!user) return

      try {
        const result = await getAllFeedings()
        if (result.success && result.data) {
          setFeedings(result.data)
          setFilteredFeedings(result.data)
        }
      } catch (error) {
        console.error("Error fetching feedings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeedings()
  }, [user])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredFeedings(feedings)
    } else {
      const filtered = feedings.filter(
        (feeding) =>
          feeding.jenis.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredFeedings(filtered)
    }
  }, [searchTerm, feedings])

  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        const res = await fetch('/api/hewan')
        if (!res.ok) throw new Error('Gagal mengambil data hewan')
        const data = await res.json()
        setAnimals(data)
      } catch (error) {
        console.error('Error fetching animals:', error)
      }
    }

    fetchAnimals()
  }, [])

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

  const handleMarkAsComplete = async (id_hewan: string, jadwal: string) => {
    try {
      const result = await markFeedingAsComplete(id_hewan, jadwal)
      if (result.success) {
        // Update the local state
        setFeedings(prevFeedings =>
          prevFeedings.map(feeding =>
            feeding.id_hewan === id_hewan && feeding.jadwal === jadwal 
              ? { ...feeding, status: "Selesai Diberikan" } 
              : feeding
          )
        )
        setFilteredFeedings(prevFeedings =>
          prevFeedings.map(feeding =>
            feeding.id_hewan === id_hewan && feeding.jadwal === jadwal 
              ? { ...feeding, status: "Selesai Diberikan" } 
              : feeding
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
      const result = await getAllFeedings()
      if (result.success && result.data) {
        setFeedings(result.data)
        setFilteredFeedings(result.data)
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow p-6 bg-gradient-to-b from-green-50 to-green-100">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">PEMBERIAN PAKAN</h1>
                <Button onClick={handleAddFeeding}>
                  <Plus className="mr-2 h-4 w-4" /> Tambah Jadwal Pemberian Pakan
                </Button>
              </div>

              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Cari jadwal berdasarkan jenis pakan..."
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
                      <th className="border border-gray-300 p-3 text-left">Jenis Pakan</th>
                      <th className="border border-gray-300 p-3 text-left">Jumlah Pakan (gram)</th>
                      <th className="border border-gray-300 p-3 text-left">Jadwal</th>
                      <th className="border border-gray-300 p-3 text-left">Status</th>
                      <th className="border border-gray-300 p-3 text-left">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFeedings.length > 0 ? (
                      filteredFeedings.map((feeding) => (
                        <tr key={`${feeding.id_hewan}-${feeding.jadwal}`} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-3">{feeding.jenis}</td>
                          <td className="border border-gray-300 p-3">{feeding.jumlah}</td>
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
                                onClick={() => handleMarkAsComplete(feeding.id_hewan, feeding.jadwal)}
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
                          Tidak ada jadwal pemberian pakan yang ditemukan
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

      {/* Modals */}
      <AddFeedingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        animals={animals}
        onSuccess={refreshFeedings}
      />

      {selectedFeeding && (
        <>
          <EditFeedingModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            feeding={{
              id: 0,
              id_hewan: selectedFeeding.id_hewan,
              jadwal: selectedFeeding.jadwal,
              jenis_pakan: selectedFeeding.jenis,
              jumlah_pakan: selectedFeeding.jumlah,
              username_jh: selectedFeeding.username_jh || "",
              status: selectedFeeding.status
            }}
            onSuccess={refreshFeedings}
          />

          <DeleteFeedingModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            feeding={{
              id: 0,
              id_hewan: selectedFeeding.id_hewan,
              jadwal: selectedFeeding.jadwal,
              jenis_pakan: selectedFeeding.jenis,
              jumlah_pakan: selectedFeeding.jumlah,
              username_jh: selectedFeeding.username_jh || "",
              status: selectedFeeding.status
            }}
            onSuccess={refreshFeedings}
          />
        </>
      )}
    </div>
  )
}
