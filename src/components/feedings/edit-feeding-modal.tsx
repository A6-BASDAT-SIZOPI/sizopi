"use client"

import type React from "react"

import { useState } from "react"
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
import { editFeedingSchedule } from "@/app/actions/feeding-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { parseISO } from "date-fns"

interface FeedingSchedule {
  id: number
  id_hewan: string
  username_jh: string
  jenis_pakan: string
  jumlah_pakan: number
  jadwal: string
  status: string
}

interface EditFeedingModalProps {
  isOpen: boolean
  onClose: () => void
  feeding: FeedingSchedule
  onSuccess: () => void
}

export function EditFeedingModal({ isOpen, onClose, feeding, onSuccess }: EditFeedingModalProps) {
  const [formData, setFormData] = useState({
    jenis_pakan: feeding.jenis_pakan,
    jumlah_pakan: feeding.jumlah_pakan.toString(),
    jadwal: parseISO(feeding.jadwal).toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:MM
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Validate form
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

      const result = await editFeedingSchedule({
        id: feeding.id,
        jenis_pakan: formData.jenis_pakan,
        jumlah_pakan: jumlahPakan,
        jadwal: formData.jadwal,
      })

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.error || "Terjadi kesalahan saat mengedit jadwal pemberian pakan")
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat mengedit jadwal pemberian pakan")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>EDIT PEMBERIAN PAKAN</DialogTitle>
          <DialogDescription>Ubah jadwal pemberian pakan</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="jenis_pakan">Jenis Pakan Baru</Label>
            <Input
              id="jenis_pakan"
              name="jenis_pakan"
              value={formData.jenis_pakan}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jumlah_pakan">Jumlah Pakan Baru (gram)</Label>
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
            <Label htmlFor="jadwal">Jadwal Baru</Label>
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
