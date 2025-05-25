"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase-server"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { PawPrint, Calendar, FileText, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface Adopsi {
  id_adopter: string
  id_hewan: string
  status_pembayaran: string
  tgl_mulai_adopsi: string
  tgl_berhenti_adopsi: string
  kontribusi_finansial: number
  hewan: {
    id: string
    nama: string
    spesies: string
    url_foto: string
  }
}

export default function MyAdoptionsPage() {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [adopsiList, setAdopsiList] = useState<Adopsi[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAdopsi, setSelectedAdopsi] = useState<Adopsi | null>(null)
  const [showTerminateDialog, setShowTerminateDialog] = useState(false)
  const [showCertificateDialog, setShowCertificateDialog] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login")
        return
      }

      if (userRole !== "pengunjung") {
        toast({
          title: "Akses Ditolak",
          description: "Halaman ini hanya untuk pengunjung",
          variant: "destructive",
        })
        router.push("/adopsi")
        return
      }

      fetchMyAdoptions()
    }
  }, [user, loading])

  const fetchMyAdoptions = async () => {
    try {
      setIsLoading(true)

      // First get the adopter ID for this user
      const { data: adopterData, error: adopterError } = await supabase
        .from("adopter")
        .select("id_adopter")
        .eq("username_adopter", user.username)
        .maybeSingle()

      if (adopterError && adopterError.code !== "PGRST116") {
        throw adopterError
      }

      if (!adopterData) {
        // User has no adoptions yet
        setAdopsiList([])
        setIsLoading(false)
        return
      }

      // Then get all adoptions for this adopter
      const { data: adopsiData, error: adopsiError } = await supabase
        .from("adopsi")
        .select(`
          *,
          hewan:id_hewan(
            id,
            nama,
            spesies,
            url_foto
          )
        `)
        .eq("id_adopter", adopterData.id_adopter)
        .order("tgl_mulai_adopsi", { ascending: false })

      if (adopsiError) throw adopsiError

      setAdopsiList(adopsiData || [])
    } catch (error) {
      console.error("Error fetching adoptions:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data adopsi",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTerminateAdoption = async () => {
    if (!selectedAdopsi) return

    try {
      const { error } = await supabase
        .from("adopsi")
        .update({
          tgl_berhenti_adopsi: new Date().toISOString().split("T")[0],
        })
        .eq("id_adopter", selectedAdopsi.id_adopter)
        .eq("id_hewan", selectedAdopsi.id_hewan)
        .eq("tgl_mulai_adopsi", selectedAdopsi.tgl_mulai_adopsi)

      if (error) throw error

      toast({
        title: "Sukses",
        description: "Adopsi berhasil dihentikan",
      })

      setShowTerminateDialog(false)
      fetchMyAdoptions() // Refresh data
    } catch (error) {
      console.error("Error terminating adoption:", error)
      toast({
        title: "Error",
        description: "Gagal menghentikan adopsi",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd MMMM yyyy", { locale: id })
    } catch (error) {
      return dateStr
    }
  }

  const isAdoptionActive = (adopsi: Adopsi) => {
    return new Date(adopsi.tgl_berhenti_adopsi) >= new Date()
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-[#FFECDB]">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="flex justify-center items-center h-[60vh]">
            <p>Memuat...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFECDB]">
      <Navbar />
      <div className="container mx-auto py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-2 bg-[#FF912F]" />
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Hewan yang Sedang Anda Adopsi</h1>
                  <p className="text-gray-600 mt-2">
                    Terima kasih telah mewujudkan kepedulian Anda terhadap satwa dengan menjadi adopter simbolis!
                  </p>
                </div>
                <Button asChild className="bg-[#FF912F] hover:bg-[#FF912F]/90">
                  <Link href="/adopsi">Lihat Semua Hewan</Link>
                </Button>
              </div>

              {adopsiList.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Anda belum mengadopsi hewan apapun.</p>
                  <Button asChild className="mt-4 bg-[#FF912F] hover:bg-[#FF912F]/90">
                    <Link href="/adopsi">Adopsi Hewan Sekarang</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {adopsiList.map((adopsi, index) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="h-48 bg-gray-200 relative">
                        {adopsi.hewan?.url_foto ? (
                          <img
                            src={adopsi.hewan.url_foto || "/placeholder.svg"}
                            alt={adopsi.hewan.nama || "Hewan"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <PawPrint size={48} className="text-gray-400" />
                          </div>
                        )}
                        <div
                          className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full ${
                            isAdoptionActive(adopsi) ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {isAdoptionActive(adopsi) ? "Aktif" : "Kadaluarsa"}
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg">{adopsi.hewan?.nama || "Tanpa Nama"}</h3>
                        <p className="text-gray-600 text-sm">{adopsi.hewan?.spesies}</p>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                            <span>
                              {formatDate(adopsi.tgl_mulai_adopsi)} - {formatDate(adopsi.tgl_berhenti_adopsi)}
                            </span>
                          </div>
                          <p className="text-sm">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                adopsi.status_pembayaran === "Lunas"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {adopsi.status_pembayaran}
                            </span>
                          </p>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              setSelectedAdopsi(adopsi)
                              setShowCertificateDialog(true)
                            }}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Lihat Sertifikat
                          </Button>
                          {isAdoptionActive(adopsi) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => {
                                setSelectedAdopsi(adopsi)
                                setShowTerminateDialog(true)
                              }}
                            >
                              <AlertTriangle className="mr-2 h-4 w-4" />
                              Berhenti Adopsi
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Dialog */}
      <Dialog open={showCertificateDialog} onOpenChange={setShowCertificateDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Sertifikat Adopsi Satwa</DialogTitle>
          </DialogHeader>
          {selectedAdopsi && (
            <div className="p-6 border rounded-lg bg-gray-50 text-center">
              <h2 className="text-2xl font-bold mb-4">Sertifikat Adopsi Satwa</h2>
              <p className="mb-6">Sertifikat ini diberikan kepada</p>
              <p className="text-xl font-semibold mb-2">
                {user.nama_depan} {user.nama_belakang}
              </p>
              <p className="mb-6">yang telah mengadopsi satwa</p>
              <p className="text-xl font-semibold mb-2">
                {selectedAdopsi.hewan?.spesies} bernama {selectedAdopsi.hewan?.nama || "Tanpa Nama"}
              </p>
              <p className="mb-6">
                di taman safari secara simbolis dari {formatDate(selectedAdopsi.tgl_mulai_adopsi)} hingga{" "}
                {formatDate(selectedAdopsi.tgl_berhenti_adopsi)}.
              </p>
              <p>
                Kami sangat berterima kasih atas kepedulian dan kontribusi Anda terhadap kelestarian satwa di taman
                safari.
              </p>
              <div className="mt-8 flex justify-center">
                <Calendar className="h-16 w-16 text-[#FF912F]" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowCertificateDialog(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terminate Adoption Dialog */}
      <Dialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apakah Anda yakin ingin berhenti mengadopsi satwa ini?</DialogTitle>
            <DialogDescription>Tindakan ini akan mengakhiri periode adopsi Anda terhadap hewan ini.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTerminateDialog(false)} className="mr-2">
              Batal
            </Button>
            <Button variant="destructive" onClick={handleTerminateAdoption}>
              Ya, Hentikan Adopsi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
