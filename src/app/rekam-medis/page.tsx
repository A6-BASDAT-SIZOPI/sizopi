"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Search, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase-client"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { AddMedicalRecordModal } from "@/components/medical-records/add-medical-record-modal"
import { EditMedicalRecordModal } from "@/components/medical-records/edit-medical-record-modal"

interface MedicalRecord {
  id_hewan: string
  username_dh: string
  tanggal_pemeriksaan: string
  diagnosis: string | null
  pengobatan: string | null
  status_kesehatan: "Sehat" | "Sakit"
  catatan_tindak_lanjut: string | null
  nama_hewan: string
  nama_dokter: string
}

export default function RekamMedisPage() {
  const { user, userRole, loading } = useAuth()
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<MedicalRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedAnimalId, setSelectedAnimalId] = useState("")
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null)

  const fetchMedicalRecords = async () => {
      if (!user) return

      try {
      // 1. Ambil semua catatan medis
      const { data: medis, error: errorMedis } = await supabase
        .from("catatan_medis")
        .select(`
          *,
          hewan (
            nama
          )
        `)
        .order("tanggal_pemeriksaan", { ascending: false })

      if (errorMedis) {
        console.error("Error fetching catatan_medis:", errorMedis)
        return
      }

      // 2. Ambil semua pengguna dokter yang diperlukan
      const usernames = [...new Set(medis.map(r => r.username_dh))]
      const { data: pengguna, error: errorPengguna } = await supabase
        .from("pengguna")
        .select("username, nama_depan, nama_tengah, nama_belakang")
        .in("username", usernames)

      if (errorPengguna) {
        console.error("Error fetching pengguna:", errorPengguna)
        return
      }

      // 3. Mapping username ke nama lengkap
      const usernameToNama = Object.fromEntries(
        pengguna.map(u => [
          u.username,
          `Dr. ${u.nama_depan} ${u.nama_tengah ? u.nama_tengah + " " : ""}${u.nama_belakang}`
        ])
      )

      // 4. Mapping data akhir
      const formattedRecords = medis.map((record) => ({
        ...record,
        nama_hewan: record.hewan?.nama || `Hewan ID: ${record.id_hewan}`,
        nama_dokter: usernameToNama[record.username_dh] || record.username_dh,
      }))

      setMedicalRecords(formattedRecords)
      setFilteredRecords(formattedRecords)
      } catch (error) {
      console.error("Error fetching medical records:", error)
      } finally {
        setIsLoading(false)
      }
    }

  useEffect(() => {
    fetchMedicalRecords()
  }, [user])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredRecords(medicalRecords)
    } else {
      const filtered = medicalRecords.filter(
        (record) =>
          record.nama_hewan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.nama_dokter?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (record.diagnosis && record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      setFilteredRecords(filtered)
    }
  }, [searchTerm, medicalRecords])

  function formatDoctorName(doctor: any) {
    if (!doctor) return "Unknown Doctor"
    return `Dr. ${doctor.nama_depan} ${doctor.nama_tengah ? doctor.nama_tengah + " " : ""}${doctor.nama_belakang}`
  }

  const handleDelete = async (animalId: string, date: string) => {
    if (confirm("Yakin ingin menghapus rekam medis ini?")) {
      try {
        const { error } = await supabase
          .from("catatan_medis")
          .delete()
          .eq("id_hewan", animalId)
          .eq("tanggal_pemeriksaan", date)

        if (error) {
          console.error("Error deleting medical record:", error)
          return
        }

        setMedicalRecords((prev) =>
          prev.filter((record) => !(record.id_hewan === animalId && record.tanggal_pemeriksaan === date)),
        )
        setFilteredRecords((prev) =>
          prev.filter((record) => !(record.id_hewan === animalId && record.tanggal_pemeriksaan === date)),
        )
      } catch (error) {
        console.error("Error deleting medical record:", error)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "sehat":
        return "bg-green-100 text-green-800"
      case "sakit":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleAddRecord = () => {
    // Bisa pakai modal atau redirect ke halaman tambah
    router.push("/rekam-medis/tambah")
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
                <h1 className="text-3xl font-bold text-center px-4 py-1">REKAM MEDIS</h1>
                <Button 
                  onClick={() => setShowAddModal(true)} 
                  className="flex items-center bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                >
                  <Plus className="mr-2 h-5 w-5" /> Tambah Rekam Medis
                </Button>
              </div>

              <div className="mb-6">
                <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
                    placeholder="Cari berdasarkan nama hewan, dokter, atau diagnosa..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
                  </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-800">
                  <thead>
                    <tr>
                      <th className="border border-gray-800 p-3 text-left">Tanggal Pemeriksaan</th>
                      <th className="border border-gray-800 p-3 text-left">Nama Dokter</th>
                      <th className="border border-gray-800 p-3 text-left">Status Kesehatan</th>
                      <th className="border border-gray-800 p-3 text-left">Diagnosa</th>
                      <th className="border border-gray-800 p-3 text-left">Pengobatan</th>
                      <th className="border border-gray-800 p-3 text-left">Catatan Tindak Lanjut</th>
                      <th className="border border-gray-800 p-3 text-left">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((record) => (
                        <tr key={`${record.id_hewan}-${record.tanggal_pemeriksaan}`} className="hover:bg-gray-50">
                          <td className="border border-gray-800 p-3">
                            {format(new Date(record.tanggal_pemeriksaan), "yyyy-MM-dd")}
                          </td>
                          <td className="border border-gray-800 p-3">{record.nama_dokter}</td>
                          <td className="border border-gray-800 p-3">
                      <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status_kesehatan)}`}
                            >
                              {record.status_kesehatan}
                      </span>
                          </td>
                          <td className="border border-gray-800 p-3">
                            {record.status_kesehatan?.toLowerCase() === "sakit" ? record.diagnosis || "-" : "-"}
                          </td>
                          <td className="border border-gray-800 p-3">
                            {record.status_kesehatan?.toLowerCase() === "sakit" ? record.pengobatan || "-" : "-"}
                          </td>
                          <td className="border border-gray-800 p-3">{record.catatan_tindak_lanjut || "-"}</td>
                          <td className="border border-gray-800 p-3 space-x-2 flex">
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 mr-2"
                              onClick={() => {
                                setEditingRecord(record)
                                setShowEditModal(true)
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-red-100 text-red-800 hover:bg-red-200"
                              onClick={() => handleDelete(record.id_hewan, record.tanggal_pemeriksaan)}
                            >
                              Hapus
                      </Button>
                          </td>
                        </tr>
              ))
            ) : (
                      <tr>
                        <td colSpan={7} className="border border-gray-800 p-3 text-center">
                          Tidak ada rekam medis yang ditemukan
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

      <AddMedicalRecordModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        animalId={selectedAnimalId}
        onSuccess={() => {
          fetchMedicalRecords()
          setShowAddModal(false)
        }}
      />

      {editingRecord && (
        <EditMedicalRecordModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          record={editingRecord}
          onSuccess={() => {
            fetchMedicalRecords()
            setShowEditModal(false)
            setEditingRecord(null)
          }}
        />
      )}
    </div>
  )
}
