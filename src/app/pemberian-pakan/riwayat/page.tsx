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
import Link from "next/link"

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

      <footer className="text-white p-8 mt-auto" style={{ backgroundColor: "#FF912F" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">SIZOPI</h3>
              <p className="mb-4">Sistem Informasi Zoo Pintar - Mengelola kebun binatang dengan lebih efisien</p>
              <div className="flex space-x-4">
                <a href="#" className="hover:text-white/80">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a href="#" className="hover:text-white/80">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Tautan Cepat</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="hover:underline">
                    Tentang Kami
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Fitur SIZOPI
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Panduan Pengguna
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Hubungi Kami
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Kontak</h3>
              <ul className="space-y-2">
                <li>Jl. Raya Kebun Binatang No. 123</li>
                <li>Kota Indah, Indonesia</li>
                <li>Telepon: (021) 1234-5678</li>
                <li>Email: info@sizopi.com</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 mt-8 pt-8 text-center">
            <p>&copy; {new Date().getFullYear()} SIZOPI - Sistem Informasi Zoo Pintar Basis Data A6</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
