"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase-client"

interface Props {
  isOpen: boolean
  onClose: () => void
  animalId: string
  onSuccess: () => void
}

export function AddScheduleModal({ isOpen, onClose, animalId, onSuccess }: Props) {
  const [date, setDate] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from("jadwal_pemeriksaan_kesehatan")
        .insert([
          {
            id_hewan: animalId,
            tgl_pemeriksaan_selanjutnya: date,
            // freq_pemeriksaan_rutin akan menggunakan default value atau diisi dari backend
          }
        ])

      if (error) throw error

      onSuccess()
      onClose()
      setDate("")
    } catch (err: any) {
      setError(err.message || "Gagal menambah jadwal pemeriksaan")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Jadwal Pemeriksaan</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="date" className="text-sm font-medium">
              Tanggal Pemeriksaan Selanjutnya
            </label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}