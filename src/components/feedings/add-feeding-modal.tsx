"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addFeedingSchedule } from "@/app/actions/feeding-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AddFeedingModalProps {
  isOpen: boolean
  onClose: () => void
  animals: {id: string, nama: string}[]
  onSuccess: () => void
}

export function AddFeedingModal({ isOpen, onClose, animals, onSuccess }: AddFeedingModalProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    id_hewan: "",
    jenis_pakan: "",
    jumlah_pakan: "",
    jadwal: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:MM
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (!user?.email) {
        setError("User tidak terautentikasi")
        return
      }

      // Validate form
      if (!formData.id_hewan) {
        setError("Pilih hewan terlebih dahulu")
        setIsLoading(false)
        return
      }

      if (!formData.jenis_pakan.trim()) {
        setError("Jenis pakan harus diisi")
        setIsLoading(false)
        return
      }

      const jumlahPakan = parseInt(formData.jumlah_pakan, 10)
      if (isNaN(jumlahPakan) || jumlahPakan <= 0) {
        setError("Jumlah pakan harus berupa angka positif")
        setIsLoading(false)
        return
      }

      const username = user.email.split("@")[0] // Assuming username is the part before @ in email

      // Convert date format from DD/MM/YYYY HH:mm to YYYY-MM-DD HH:mm:ss
      const [datePart, timePart] = formData.jadwal.split(" ")
      const [day, month, year] = datePart.split("/")
      const formattedDate = `${year}-${month}-${day} ${timePart}:00`

      const result = await addFeedingSchedule({
        id_hewan: formData.id_hewan,
        username_jh: username,
        jenis_pakan: formData.jenis_pakan,
        jumlah_pakan: jumlahPakan,
        jadwal: formattedDate,
      })

      if (result.success) {
        onSuccess()
        onClose()
        // Reset form
        setFormData({
          id_hewan: "",
          jenis_pakan: "",
          jumlah_pakan: "",
          jadwal: new Date().toISOString().slice(0, 16),
        })
      } else {
        setError(result.error || "Terjadi kesalahan saat menambahkan jadwal pemberian pakan")
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat menambahkan jadwal pemberian pakan")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>FORM TAMBAH PEMBERIAN PAKAN</DialogTitle>
          <DialogDescription>Tambahkan jadwal pemberian pakan baru</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="id_hewan">Pilih Hewan</Label>
            <select
              id="id_hewan"
              name="id_hewan"
              value={formData.id_hewan}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="">Pilih hewan...</option>
              {animals.map((animal) => (
                <option key={animal.id} value={animal.id}>
                  {animal.nama}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jenis_pakan">Jenis Pakan</Label>
            <Input
              id="jenis_pakan"
              name="jenis_pakan"
              value={formData.jenis_pakan}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jumlah_pakan">Jumlah Pakan (gram)</Label>
            <Input
              id="jumlah_pakan"
              name="jumlah_pakan"
              type="number"
              min="1"
              value={formData.jumlah_pakan}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jadwal">Jadwal</Label>
            <Input
              id="jadwal"
              name="jadwal"
              type="datetime-local"
              value={formData.jadwal}
              onChange={handleChange}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              BATAL
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "SIMPAN"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
