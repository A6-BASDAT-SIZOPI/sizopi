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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { editMedicalRecord } from "@/app/actions/medical-record-actions"
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
  nama_dokter: string
}

interface EditMedicalRecordModalProps {
  isOpen: boolean
  onClose: () => void
  record: MedicalRecord
  onSuccess: () => void
}

export function EditMedicalRecordModal({ isOpen, onClose, record, onSuccess }: EditMedicalRecordModalProps) {
  const [formData, setFormData] = useState({
    diagnosis: record.diagnosis || "",
    pengobatan: record.pengobatan || "",
    catatan_tindak_lanjut: record.catatan_tindak_lanjut || "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await editMedicalRecord({
        id_hewan: record.id_hewan,
        tanggal_pemeriksaan: record.tanggal_pemeriksaan,
        diagnosis: formData.diagnosis,
        pengobatan: formData.pengobatan,
        catatan_tindak_lanjut: formData.catatan_tindak_lanjut,
      })

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.error || "Terjadi kesalahan saat mengedit rekam medis")
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat mengedit rekam medis")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDoctorName = () => record.nama_dokter || record.username_dh

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Rekam Medis</DialogTitle>
          <DialogDescription>
            Edit rekam medis tanggal {format(new Date(record.tanggal_pemeriksaan), "dd MMMM yyyy", { locale: id })}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tanggal Pemeriksaan</Label>
            <p className="text-sm text-gray-700">
              {format(new Date(record.tanggal_pemeriksaan), "dd MMMM yyyy", { locale: id })}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Nama Dokter</Label>
            <p className="text-sm text-gray-700">{formatDoctorName()}</p>
          </div>

          <div className="space-y-2">
            <Label>Status Kesehatan</Label>
            <p className="text-sm text-gray-700">{record.status_kesehatan}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnosa Baru</Label>
            <Textarea id="diagnosis" name="diagnosis" value={formData.diagnosis} onChange={handleChange} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pengobatan">Pengobatan Baru</Label>
            <Textarea id="pengobatan" name="pengobatan" value={formData.pengobatan} onChange={handleChange} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="catatan_tindak_lanjut">Catatan Tindak Lanjut</Label>
            <Textarea
              id="catatan_tindak_lanjut"
              name="catatan_tindak_lanjut"
              value={formData.catatan_tindak_lanjut}
              onChange={handleChange}
              placeholder="Opsional"
            />
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
