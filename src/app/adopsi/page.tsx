"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase-server"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PawPrint, Search, Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"

interface Hewan {
  id: string
  nama: string
  spesies: string
  status_kesehatan: string
  url_foto: string
  adopsi_status?: "Diadopsi" | "Tidak Diadopsi"
  adopter_name?: string
}

export default function AdopsiPage() {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [hewanList, setHewanList] = useState<Hewan[]>([])
  const [filteredHewan, setFilteredHewan] = useState<Hewan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("semua")

  useEffect(() => {
    if (!loading) {
      
      fetchHewan()
    }
  }, [user, loading])

  useEffect(() => {
    filterHewan()
  }, [searchTerm, activeTab, hewanList])

  const fetchHewan = async () => {
    try {
      setIsLoading(true)

      // Fetch all animals
      const { data: hewanData, error: hewanError } = await supabase
        .from("hewan")
        .select("id, nama, spesies, status_kesehatan, url_foto")

      if (hewanError) throw hewanError

      // Fetch current adoptions to determine which animals are adopted
      const { data: adopsiData, error: adopsiError } = await supabase
        .from("adopsi")
        .select(`
          id_hewan,
          id_adopter,
          tgl_mulai_adopsi,
          tgl_berhenti_adopsi,
          adopter:id_adopter(
            username_adopter,
            individu:individu(nama),
            organisasi:organisasi(nama_organisasi)
          )
        `)
        .lte("tgl_mulai_adopsi", new Date().toISOString())
        .gte("tgl_berhenti_adopsi", new Date().toISOString())

      if (adopsiError) throw adopsiError

      // Create a map of adopted animals
      const adoptedAnimals = new Map()
      adopsiData.forEach((adopsi) => {
        const adopterName = adopsi.adopter?.individu?.nama || adopsi.adopter?.organisasi?.nama_organisasi || "Unknown"
        adoptedAnimals.set(adopsi.id_hewan, adopterName)
      })

      // Combine data
      const combinedData = hewanData.map((hewan) => ({
        ...hewan,
        adopsi_status: adoptedAnimals.has(hewan.id) ? "Diadopsi" : "Tidak Diadopsi",
        adopter_name: adoptedAnimals.get(hewan.id) || undefined,
      }))

      setHewanList(combinedData)
      setFilteredHewan(combinedData)
    } catch (error) {
      console.error("Error fetching animals:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data hewan",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterHewan = () => {
    let filtered = [...hewanList]

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (hewan) =>
          hewan.nama?.toLowerCase().includes(searchLower) || hewan.spesies?.toLowerCase().includes(searchLower),
      )
    }

    // Apply tab filter
    if (activeTab === "diadopsi") {
      filtered = filtered.filter((hewan) => hewan.adopsi_status === "Diadopsi")
    } else if (activeTab === "tidak_diadopsi") {
      filtered = filtered.filter((hewan) => hewan.adopsi_status === "Tidak Diadopsi")
    }

    setFilteredHewan(filtered)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
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
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Program Adopsi Satwa: Bantu Mereka dengan Cinta</h1>
                  <p className="text-gray-600 mt-2">
                    Adopsi satwa secara simbolis dan bantu kami melestarikan kehidupan mereka
                  </p>
                </div>
                {userRole === "staf_admin" && (
                  <Button asChild className="bg-[#FF912F] hover:bg-[#FF912F]/90">
                    <Link href="/adopsi/admin">
                      <PawPrint className="mr-2 h-4 w-4" />
                      Kelola Adopsi
                    </Link>
                  </Button>
                )}
              </div>

              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder="Cari berdasarkan nama atau spesies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Tabs defaultValue="semua" onValueChange={handleTabChange}>
                <TabsList className="mb-6">
                  <TabsTrigger value="semua">Semua Satwa</TabsTrigger>
                  <TabsTrigger value="diadopsi">Sudah Diadopsi</TabsTrigger>
                  <TabsTrigger value="tidak_diadopsi">Belum Diadopsi</TabsTrigger>
                </TabsList>

                <TabsContent value="semua" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredHewan.map((hewan) => (
                      <Card key={hewan.id} className="overflow-hidden">
                        <div className="h-48 bg-gray-200 relative">
                          {hewan.url_foto ? (
                            <img
                              src={hewan.url_foto || "/placeholder.svg"}
                              alt={hewan.nama || "Hewan"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <PawPrint size={48} className="text-gray-400" />
                            </div>
                          )}
                          <div
                            className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full ${
                              hewan.adopsi_status === "Diadopsi"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {hewan.adopsi_status}
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-lg">{hewan.nama || "Tanpa Nama"}</h3>
                          <p className="text-gray-600 text-sm">{hewan.spesies}</p>
                          <p className="text-gray-600 text-sm">Kondisi: {hewan.status_kesehatan}</p>
                          <div className="mt-4 flex justify-end">
                            {hewan.adopsi_status === "Diadopsi" ? (
                              <Button
                                variant="outline"
                                asChild
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                              >
                                <Link href={`/adopsi/detail/${hewan.id}`}>
                                  <Info className="mr-2 h-4 w-4" />
                                  Lihat Detail
                                </Link>
                              </Button>
                            ) : (
                              <Button asChild className="bg-[#FF912F] hover:bg-[#FF912F]/90">
                                <Link href={`/adopsi/daftar/${hewan.id}`}>Daftarkan Adopter</Link>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {filteredHewan.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>Tidak ada hewan yang ditemukan.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="diadopsi" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredHewan.map((hewan) => (
                      <Card key={hewan.id} className="overflow-hidden">
                        <div className="h-48 bg-gray-200 relative">
                          {hewan.url_foto ? (
                            <img
                              src={hewan.url_foto || "/placeholder.svg"}
                              alt={hewan.nama || "Hewan"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <PawPrint size={48} className="text-gray-400" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Diadopsi
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-lg">{hewan.nama || "Tanpa Nama"}</h3>
                          <p className="text-gray-600 text-sm">{hewan.spesies}</p>
                          <p className="text-gray-600 text-sm">Kondisi: {hewan.status_kesehatan}</p>
                          <p className="text-gray-600 text-sm mt-1">
                            Diadopsi oleh: <span className="font-medium">{hewan.adopter_name}</span>
                          </p>
                          <div className="mt-4 flex justify-end">
                            <Button
                              variant="outline"
                              asChild
                              className="text-blue-600 border-blue-600 hover:bg-blue-50"
                            >
                              <Link href={`/adopsi/detail/${hewan.id}`}>
                                <Info className="mr-2 h-4 w-4" />
                                Lihat Detail
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {filteredHewan.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>Tidak ada hewan yang diadopsi saat ini.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="tidak_diadopsi" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredHewan.map((hewan) => (
                      <Card key={hewan.id} className="overflow-hidden">
                        <div className="h-48 bg-gray-200 relative">
                          {hewan.url_foto ? (
                            <img
                              src={hewan.url_foto || "/placeholder.svg"}
                              alt={hewan.nama || "Hewan"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <PawPrint size={48} className="text-gray-400" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            Tidak Diadopsi
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-lg">{hewan.nama || "Tanpa Nama"}</h3>
                          <p className="text-gray-600 text-sm">{hewan.spesies}</p>
                          <p className="text-gray-600 text-sm">Kondisi: {hewan.status_kesehatan}</p>
                          <div className="mt-4 flex justify-end">
                            <Button asChild className="bg-[#FF912F] hover:bg-[#FF912F]/90">
                              <Link href={`/adopsi/daftar/${hewan.id}`}>Daftarkan Adopter</Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {filteredHewan.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>Semua hewan sudah diadopsi.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
