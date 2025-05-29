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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

interface EditMedicalRecordModalProps {
  isOpen: boolean
  onClose: () => void
  record: MedicalRecord
  onSuccess: () => void
}

export function EditMedicalRecordModal({ isOpen, onClose, record, onSuccess }: EditMedicalRecordModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    diagnosis: record.diagnosis || "",
    pengobatan: record.pengobatan || "",
    status_kesehatan: record.status_kesehatan,
    catatan_tindak_lanjut: record.catatan_tindak_lanjut || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const res = await fetch(`/api/rekam-medis/${record.id_hewan}/${record.tanggal_pemeriksaan}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Gagal mengupdate rekam medis')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengupdate rekam medis')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Rekam Medis</DialogTitle>
          <DialogDescription>
            Edit rekam medis untuk {record.nama_hewan} pada tanggal{" "}
            {format(new Date(record.tanggal_pemeriksaan), "dd MMMM yyyy", { locale: id })}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Textarea
                id="diagnosis"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                placeholder="Masukkan diagnosis"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pengobatan">Pengobatan</Label>
              <Textarea
                id="pengobatan"
                value={formData.pengobatan}
                onChange={(e) => setFormData({ ...formData, pengobatan: e.target.value })}
                placeholder="Masukkan pengobatan"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status_kesehatan">Status Kesehatan</Label>
              <Input
                id="status_kesehatan"
                value={formData.status_kesehatan}
                onChange={(e) => setFormData({ ...formData, status_kesehatan: e.target.value })}
                placeholder="Masukkan status kesehatan"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="catatan_tindak_lanjut">Catatan Tindak Lanjut</Label>
              <Textarea
                id="catatan_tindak_lanjut"
                value={formData.catatan_tindak_lanjut}
                onChange={(e) => setFormData({ ...formData, catatan_tindak_lanjut: e.target.value })}
                placeholder="Masukkan catatan tindak lanjut"
              />
            </div>
          </div>

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
