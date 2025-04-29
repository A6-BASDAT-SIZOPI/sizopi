"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from 'lucide-react'
import { getKeeperFeedingHistory } from "../../actions/feeding-actions"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"

interface FeedingHistory {
  id: number
  id_hewan: string
  username_jh: string
  jenis_pakan: string
  jumlah_pakan: number
  jadwal: string
  status: string
  HEWAN: {
    id: string
    nama: string
    spesies: string
    asal_hewan: string
    tanggal_lahir: string | null
    status_kesehatan: string
    nama_habitat: string | null
  }
}

export default function FeedingHistoryPage() {
  const { user, userRole, loading } = useAuth()
  const [history, setHistory] = useState<FeedingHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.email) return

      try {
        const username = user.email.split("@")[0] // Assuming username is the part before @ in email
        const result = await getKeeperFeedingHistory(username)
        if (result.success && result.data) {
          setHistory(result.data)
        } else {
          console.error("Error fetching history:", result.error)
        }
      } catch (error) {
        console.error("Error fetching history:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
  }, [user])

  const formatDateTime = (dateTimeStr: string) => {
    try {
      return format(parseISO(dateTimeStr), "yyyy-MM-dd HH:mm:ss", { locale: id })
    } catch (error) {
      return dateTimeStr
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-"
    try {
      return format(parseISO(dateStr), "dd MMMM yyyy", { locale: id })
    } catch (error) {
      return dateStr
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
          <Button variant="outline" className="mb-4" onClick={() => router.push("/pemberian-pakan")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Button>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold">RIWAYAT PEMBERIAN PAKAN</h1>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 p-3 text-left">Nama Individu (hewan)</th>
                      <th className="border border-gray-300 p-3 text-left">Spesies</th>
                      <th className="border border-gray-300 p-3 text-left">Asal Hewan</th>
                      <th className="border border-gray-300 p-3 text-left">Tanggal Lahir</th>
                      <th className="border border-gray-300 p-3 text-left">Habitat</th>
                      <th className="border border-gray-300 p-3 text-left">Status Kesehatan</th>
                      <th className="border border-gray-300 p-3 text-left">Jenis Pakan</th>
                      <th className="border border-gray-300 p-3 text-left">Jumlah Pakan (gram)</th>
                      <th className="border border-gray-300 p-3 text-left">Jadwal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length > 0 ? (
                      history.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-3">
                            {item.HEWAN.nama || `${item.HEWAN.spesies} (Tanpa Nama)`}
                          </td>
                          <td className="border border-gray-300 p-3">{item.HEWAN.spesies}</td>
                          <td className="border border-gray-300 p-3">{item.HEWAN.asal_hewan}</td>
                          <td className="border border-gray-300 p-3">{formatDate(item.HEWAN.tanggal_lahir)}</td>
                          <td className="border border-gray-300 p-3">{item.HEWAN.nama_habitat || "-"}</td>
                          <td className="border border-gray-300 p-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.HEWAN.status_kesehatan === "Sehat"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {item.HEWAN.status_kesehatan}
                            </span>
                          </td>
                          <td className="border border-gray-300 p-3">{item.jenis_pakan}</td>
                          <td className="border border-gray-300 p-3">{item.jumlah_pakan}</td>
                          <td className="border border-gray-300 p-3">{formatDateTime(item.jadwal)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="border border-gray-300 p-3 text-center">
                          Belum ada riwayat pemberian pakan
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
    </div>
  )
}
