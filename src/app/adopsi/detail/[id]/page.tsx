"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase-server"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { PawPrint, Calendar, FileText, AlertTriangle } from "lucide-react"

interface Hewan {
  id: string
  nama: string
  spesies: string
  asal_hewan: string
  tanggal_lahir: string | null
  status_kesehatan: string
  nama_habitat: string | null
  url_foto: string
}

interface Adopsi {
  id_adopter: string
  id_hewan: string
  status_pembayaran: string
  tgl_mulai_adopsi: string
  tgl_berhenti_adopsi: string
  kontribusi_finansial: number
  adopter?: {
    username_adopter: string
    individu?: {
      nik: string
      nama: string
    }
    organisasi?: {
      npp: string
      nama_organisasi: string
    }
  }
}

interface CatatanMedis {
  id_hewan: string
  username_dh: string
  tanggal_pemeriksaan: string
  diagnosis: string
  pengobatan: string
  status_kesehatan: string
  catatan_tindak_lanjut: string
  dokter?: {
    nama_depan: string
    nama_belakang: string
  }
}

export default function DetailAdopsiPage() {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [hewan, setHewan] = useState<Hewan | null>(null)
  const [adopsi, setAdopsi] = useState<Adopsi | null>(null)
  const [catatanMedis, setCatatanMedis] = useState<CatatanMedis[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdopter, setIsAdopter] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showTerminateDialog, setShowTerminateDialog] = useState(false)
  const hewanId = params.id as string

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/auth/login")
        return
      }

      //setIsAdmin(userRole === "staf_admin")
      fetchData()
    }
  }, [user, loading, hewanId])

  const fetchData = async () => {
    try {
      setIsLoading(true)

      // Fetch animal data
      const { data: hewanData, error: hewanError } = await supabase.from("hewan").select("*").eq("id", hewanId).single()

      if (hewanError) throw hewanError

      setHewan(hewanData)

      // Fetch current adoption data
      const { data: adopsiData, error: adopsiError } = await supabase
        .from("adopsi")
        .select(`
          *,
          adopter:id_adopter(
            username_adopter,
            individu:individu(nik, nama),
            organisasi:organisasi(npp, nama_organisasi)
          )
        `)
        .eq("id_hewan", hewanId)
        .lte("tgl_mulai_adopsi", new Date().toISOString())
        .gte("tgl_berhenti_adopsi", new Date().toISOString())
        .maybeSingle()

      if (adopsiError && adopsiError.code !== "PGRST116") {
        // PGRST116 is "no rows returned" which is OK
        throw adopsiError
      }

      setAdopsi(adopsiData || null)

      // Check if current user is the adopter
      if (adopsiData && userRole === "pengunjung") {
        const { data: adopterData } = await supabase
          .from("adopter")
          .select("username_adopter")
          .eq("id_adopter", adopsiData.id_adopter)
          .single()

        setIsAdopter(adopterData?.username_adopter === user.username)
      }

      // Fetch medical records
      const { data: medisData, error: medisError } = await supabase
        .from("catatan_medis")
        .select(`
          *,
          dokter:username_dh(
            nama_depan,
            nama_belakang
          )
        `)
        .eq("id_hewan", hewanId)
        .order("tanggal_pemeriksaan", { ascending: false })

      if (medisError) throw medisError

      setCatatanMedis(medisData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data detail adopsi",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTerminateAdoption = async () => {
    if (!adopsi) return

    try {
      const { error } = await supabase
        .from("adopsi")
        .update({
          tgl_berhenti_adopsi: new Date().toISOString().split("T")[0],
        })
        .eq("id_adopter", adopsi.id_adopter)
        .eq("id_hewan", adopsi.id_hewan)
        .eq("tgl_mulai_adopsi", adopsi.tgl_mulai_adopsi)

      if (error) throw error

      toast({
        title: "Sukses",
        description: "Adopsi berhasil dihentikan",
      })

      setShowTerminateDialog(false)
      fetchData() // Refresh data
    } catch (error) {
      console.error("Error terminating adoption:", error)
      toast({
        title: "Error",
        description: "Gagal menghentikan adopsi",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-"
    try {
      return format(new Date(dateStr), "dd MMMM yyyy", { locale: id })
    } catch (error) {
      return dateStr
    }
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

  if (!hewan) {
    return (
      <div className="min-h-screen bg-[#FFECDB]">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6 text-center">
              <p className="mb-4">Hewan tidak ditemukan</p>
              <Button asChild>
                <Link href="/adopsi">Kembali ke Program Adopsi</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFECDB]">
      <Navbar />
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <Button variant="outline" asChild>
              <Link href="/adopsi">Kembali</Link>
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-2 bg-[#FF912F]" />
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3">
                  <div className="rounded-lg overflow-hidden border h-64">
                    {hewan.url_foto ? (
                      <img
                        src={hewan.url_foto || "/placeholder.svg"}
                        alt={hewan.nama}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <PawPrint size={64} className="text-gray-400" />
                      </div>
                    )}
                  </div>

                  {adopsi && (
                    <Card className="mt-4">
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">Status Adopsi</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Status:</span>
                            <span
                              className={`font-medium ${
                                adopsi.status_pembayaran === "Lunas" ? "text-green-600" : "text-yellow-600"
                              }`}
                            >
                              {adopsi.status_pembayaran}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Mulai:</span>
                            <span>{formatDate(adopsi.tgl_mulai_adopsi)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Berakhir:</span>
                            <span>{formatDate(adopsi.tgl_berhenti_adopsi)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Kontribusi:</span>
                            <span>Rp {adopsi.kontribusi_finansial.toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="w-full md:w-2/3">
                  <h1 className="text-2xl font-bold mb-2">{hewan.nama || "Tanpa Nama"}</h1>
                  <p className="text-gray-600 mb-4">{hewan.spesies}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Asal Hewan</h3>
                      <p>{hewan.asal_hewan}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Tanggal Lahir</h3>
                      <p>{formatDate(hewan.tanggal_lahir)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Status Kesehatan</h3>
                      <p>{hewan.status_kesehatan}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Habitat</h3>
                      <p>{hewan.nama_habitat || "-"}</p>
                    </div>
                  </div>

                  {adopsi && (
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold mb-2">Informasi Adopter</h2>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        {adopsi.adopter?.individu ? (
                          <>
                            <p>
                              <span className="font-medium">Nama:</span> {adopsi.adopter.individu.nama}
                            </p>
                            <p>
                              <span className="font-medium">NIK:</span> {adopsi.adopter.individu.nik}
                            </p>
                          </>
                        ) : adopsi.adopter?.organisasi ? (
                          <>
                            <p>
                              <span className="font-medium">Organisasi:</span>{" "}
                              {adopsi.adopter.organisasi.nama_organisasi}
                            </p>
                            <p>
                              <span className="font-medium">NPP:</span> {adopsi.adopter.organisasi.npp}
                            </p>
                          </>
                        ) : (
                          <p>Data adopter tidak tersedia</p>
                        )}
                      </div>
                    </div>
                  )}

                  <Tabs defaultValue="catatan_medis">
                    <TabsList className="mb-4">
                      <TabsTrigger value="catatan_medis">Catatan Medis</TabsTrigger>
                      {(isAdopter || isAdmin) && adopsi && (
                        <TabsTrigger value="sertifikat">Sertifikat Adopsi</TabsTrigger>
                      )}
                    </TabsList>

                    <TabsContent value="catatan_medis" className="space-y-4">
                      {catatanMedis.length > 0 ? (
                        catatanMedis.map((catatan, index) => (
                          <Card key={index}>
                            <CardHeader className="py-3">
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-sm font-medium">
                                  Pemeriksaan {formatDate(catatan.tanggal_pemeriksaan)}
                                </CardTitle>
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    catatan.status_kesehatan === "Sehat"
                                      ? "bg-green-100 text-green-800"
                                      : catatan.status_kesehatan === "Sakit"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {catatan.status_kesehatan}
                                </span>
                              </div>
                            </CardHeader>
                            <CardContent className="py-2">
                              <div className="space-y-2">
                                <div>
                                  <span className="text-sm font-medium">Dokter:</span>{" "}
                                  <span className="text-sm">
                                    {catatan.dokter
                                      ? `${catatan.dokter.nama_depan} ${catatan.dokter.nama_belakang}`
                                      : "Tidak diketahui"}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-sm font-medium">Diagnosis:</span>{" "}
                                  <span className="text-sm">{catatan.diagnosis}</span>
                                </div>
                                <div>
                                  <span className="text-sm font-medium">Pengobatan:</span>{" "}
                                  <span className="text-sm">{catatan.pengobatan}</span>
                                </div>
                                <div>
                                  <span className="text-sm font-medium">Catatan Tindak Lanjut:</span>{" "}
                                  <span className="text-sm">{catatan.catatan_tindak_lanjut}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>Belum ada catatan medis untuk hewan ini.</p>
                        </div>
                      )}
                    </TabsContent>

                    {(isAdopter || isAdmin) && adopsi && (
                      <TabsContent value="sertifikat">
                        <Card>
                          <CardContent className="p-6 text-center">
                            <h2 className="text-2xl font-bold mb-4">Sertifikat Adopsi Satwa</h2>
                            <p className="mb-6">Sertifikat ini diberikan kepada</p>
                            <p className="text-xl font-semibold mb-2">
                              {adopsi.adopter?.individu?.nama ||
                                adopsi.adopter?.organisasi?.nama_organisasi ||
                                "Adopter"}
                            </p>
                            <p className="mb-6">yang telah mengadopsi satwa</p>
                            <p className="text-xl font-semibold mb-2">
                              {hewan.spesies} bernama {hewan.nama || "Tanpa Nama"}
                            </p>
                            <p className="mb-6">
                              di taman safari secara simbolis dari {formatDate(adopsi.tgl_mulai_adopsi)} hingga{" "}
                              {formatDate(adopsi.tgl_berhenti_adopsi)}.
                            </p>
                            <p>
                              Kami sangat berterima kasih atas kepedulian dan kontribusi Anda terhadap kelestarian satwa
                              di taman safari.
                            </p>
                            <div className="mt-8 flex justify-center">
                              <Calendar className="h-16 w-16 text-[#FF912F]" />
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    )}
                  </Tabs>

                  {isAdopter && adopsi && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                            <FileText className="mr-2 h-4 w-4" />
                            Perpanjang Periode Adopsi
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Perpanjang Periode Adopsi</DialogTitle>
                            <DialogDescription>
                              Untuk memperpanjang periode adopsi, silakan kunjungi taman safari dan hubungi staf
                              administrasi.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter className="sm:justify-start">
                            <DialogClose asChild>
                              <Button type="button" variant="secondary">
                                Tutup
                              </Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50">
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Berhenti Adopsi
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Apakah Anda yakin ingin menghentikan adopsi ini?</DialogTitle>
                            <DialogDescription>
                              Tindakan ini akan mengakhiri periode adopsi Anda terhadap hewan ini.
                            </DialogDescription>
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
                  )}

                  {!adopsi && (
                    <div className="mt-6">
                      <Button asChild className="bg-[#FF912F] hover:bg-[#FF912F]/90">
                        <Link href={`/adopsi/daftar/${hewan.id}`}>Daftarkan Adopter</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
