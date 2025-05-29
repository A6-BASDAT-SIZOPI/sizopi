"use client"

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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface MedicalRecord {
  id_hewan: string
  username_dh: string
  tanggal_pemeriksaan: string
  diagnosis: string | null
  pengobatan: string | null
  status_kesehatan: string
  catatan_tindak_lanjut: string | null
  nama_hewan: string
  nama_dokter: string
}

interface DeleteMedicalRecordModalProps {
  isOpen: boolean
  onClose: () => void
  record: MedicalRecord
  onSuccess: () => void
}

export function DeleteMedicalRecordModal({ isOpen, onClose, record, onSuccess }: DeleteMedicalRecordModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setError(null)
    setIsLoading(true)

    try {
      const encodedTanggal = encodeURIComponent(record.tanggal_pemeriksaan);
      const url = `/api/rekam-medis/${record.id_hewan}/${encodedTanggal}`;
      const res = await fetch(url, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Gagal menghapus rekam medis')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menghapus rekam medis')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Hapus Rekam Medis</DialogTitle>
          <DialogDescription>
            Apakah anda yakin ingin menghapus rekam medis tanggal{" "}
            {format(new Date(record.tanggal_pemeriksaan), "dd MMMM yyyy", { locale: id })}?
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Tidak
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? "Menghapus..." : "Ya"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
