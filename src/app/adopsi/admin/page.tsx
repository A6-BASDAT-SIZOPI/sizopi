"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase-server"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Search, PlusIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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
  }
  adopter: {
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

export default function AdminAdopsiPage() {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [adopsiList, setAdopsiList] = useState<Adopsi[]>([])
  const [filteredAdopsi, setFilteredAdopsi] = useState<Adopsi[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedAdopsi, setSelectedAdopsi] = useState<Adopsi | null>(null)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [showTerminateDialog, setShowTerminateDialog] = useState(false)
  const [newStatus, setNewStatus] = useState<"Tertunda" | "Lunas">("Lunas")

  const fetchAdopsi = async () => {
    try {
      setIsLoading(true)

      // Fetch all adoptions with animal and adopter details
      const { data, error } = await supabase
        .from("adopsi")
        .select(`
          *,
          hewan:id_hewan(
            id,
            nama,
            spesies
          ),
          adopter:id_adopter(
            username_adopter,
            individu:individu(nik, nama),
            organisasi:organisasi(npp, nama_organisasi)
          )
        `)
        .order("tgl_mulai_adopsi", { ascending: false })

      if (error) throw error

      setAdopsiList(data || [])
      setFilteredAdopsi(data || [])
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

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login")
        return
      }

      if (userRole !== "staf_admin") {
        toast({
          title: "Akses Ditolak",
          description: "Anda tidak memiliki izin untuk mengakses halaman ini",
          variant: "destructive",
        })
        router.push("/adopsi")
        return
      }

      fetchAdopsi()
    }
  }, [user, loading, router, userRole, toast])

  useEffect(() => {
    filterAdopsi()
  }, [searchTerm, statusFilter, adopsiList])

  const filterAdopsi = () => {
    let filtered = [...adopsiList]

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.hewan?.nama?.toLowerCase().includes(searchLower) ||
          item.hewan?.spesies?.toLowerCase().includes(searchLower) ||
          item.adopter?.username_adopter?.toLowerCase().includes(searchLower) ||
          item.adopter?.individu?.nama?.toLowerCase().includes(searchLower) ||
          item.adopter?.organisasi?.nama_organisasi?.toLowerCase().includes(searchLower),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => {
        if (statusFilter === "active") {
          return new Date(item.tgl_berhenti_adopsi) >= new Date()
        } else if (statusFilter === "expired") {
          return new Date(item.tgl_berhenti_adopsi) < new Date()
        } else {
          return item.status_pembayaran === statusFilter
        }
      })
    }

    setFilteredAdopsi(filtered)
  }

  const handleUpdateStatus = async () => {
    if (!selectedAdopsi) return

    try {
      const { error } = await supabase
        .from("adopsi")
        .update({ status_pembayaran: newStatus })
        .eq("id_adopter", selectedAdopsi.id_adopter)
        .eq("id_hewan", selectedAdopsi.id_hewan)
        .eq("tgl_mulai_adopsi", selectedAdopsi.tgl_mulai_adopsi)

      if (error) throw error

      toast({
        title: "Sukses",
        description: "Status pembayaran berhasil diperbarui",
      })

      setShowUpdateDialog(false)
      fetchAdopsi() // Refresh data
    } catch (error) {
      console.error("Error updating payment status:", error)
      toast({
        title: "Error",
        description: "Gagal memperbarui status pembayaran",
        variant: "destructive",
      })
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
      fetchAdopsi() // Refresh data
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
      return format(new Date(dateStr), "dd MMM yyyy", { locale: id })
    } catch (error) {
      return dateStr
    }
  }

  const getAdopterName = (adopsi: Adopsi) => {
    return (
      adopsi.adopter?.individu?.nama ||
      adopsi.adopter?.organisasi?.nama_organisasi ||
      adopsi.adopter?.username_adopter ||
      "Unknown"
    )
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
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-2 bg-[#FF912F]" />
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Manajemen Program Adopsi</h1>
                <Button asChild className="bg-[#FF912F] hover:bg-[#FF912F]/90">
                  <Link href="/adopsi">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Kembali ke Daftar Hewan
                  </Link>
                </Button>
              </div>

              <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder="Cari berdasarkan nama hewan, spesies, atau adopter..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="w-full md:w-64">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="expired">Kadaluarsa</SelectItem>
                      <SelectItem value="Tertunda">Pembayaran Tertunda</SelectItem>
                      <SelectItem value="Lunas">Pembayaran Lunas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filteredAdopsi.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Tidak ada data adopsi yang ditemukan.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hewan</TableHead>
                        <TableHead>Adopter</TableHead>
                        <TableHead>Periode</TableHead>
                        <TableHead>Kontribusi</TableHead>
                        <TableHead>Status Pembayaran</TableHead>
                        <TableHead>Status Adopsi</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAdopsi.map((adopsi, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{adopsi.hewan?.nama || "Unknown"}</div>
                              <div className="text-sm text-gray-500">{adopsi.hewan?.spesies}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{getAdopterName(adopsi)}</div>
                              <div className="text-sm text-gray-500">{adopsi.adopter?.username_adopter}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{formatDate(adopsi.tgl_mulai_adopsi)}</div>
                              <div>s/d</div>
                              <div>{formatDate(adopsi.tgl_berhenti_adopsi)}</div>
                            </div>
                          </TableCell>
                          <TableCell>Rp {adopsi.kontribusi_finansial.toLocaleString()}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                adopsi.status_pembayaran === "Lunas"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {adopsi.status_pembayaran}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                isAdoptionActive(adopsi) ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {isAdoptionActive(adopsi) ? "Aktif" : "Kadaluarsa"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-blue-600 border-blue-600 hover:bg-blue-50"
                                onClick={() => {
                                  setSelectedAdopsi(adopsi)
                                  setNewStatus(adopsi.status_pembayaran === "Lunas" ? "Tertunda" : "Lunas")
                                  setShowUpdateDialog(true)
                                }}
                              >
                                Update Status
                              </Button>
                              {isAdoptionActive(adopsi) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2 text-red-600 border-red-600 hover:bg-red-50"
                                  onClick={() => {
                                    setSelectedAdopsi(adopsi)
                                    setShowTerminateDialog(true)
                                  }}
                                >
                                  Hentikan
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Update Status Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status Pembayaran</DialogTitle>
            <DialogDescription>
              Ubah status pembayaran untuk adopsi {selectedAdopsi?.hewan?.nama} oleh{" "}
              {selectedAdopsi ? getAdopterName(selectedAdopsi) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newStatus} onValueChange={(value) => setNewStatus(value as "Tertunda" | "Lunas")}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih status pembayaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tertunda">Tertunda</SelectItem>
                <SelectItem value="Lunas">Lunas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)} className="mr-2">
              Batal
            </Button>
            <Button onClick={handleUpdateStatus}>Simpan Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terminate Adoption Dialog */}
      <Dialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hentikan Adopsi</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghentikan adopsi {selectedAdopsi?.hewan?.nama} oleh{" "}
              {selectedAdopsi ? getAdopterName(selectedAdopsi) : ""}?
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
  )
}
