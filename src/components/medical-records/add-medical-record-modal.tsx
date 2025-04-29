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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { addMedicalRecord } from "@/app/actions/medical-record-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AddMedicalRecordModalProps {
  isOpen: boolean
  onClose: () => void
  animalId: string
  onSuccess: () => void
}

export function AddMedicalRecordModal({ isOpen, onClose, animalId, onSuccess }: AddMedicalRecordModalProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    tanggal_pemeriksaan: new Date().toISOString().split("T")[0],
    nama_dokter: "",
    status_kesehatan: "Sehat" as "Sehat" | "Sakit",
    diagnosis: "",
    pengobatan: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleStatusChange = (value: "Sehat" | "Sakit") => {
    setFormData((prev) => ({ ...prev, status_kesehatan: value }))
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

      const result = await addMedicalRecord({
        id_hewan: animalId,
        username_dh: user.email.split("@")[0], // Assuming username is the part before @ in email
        tanggal_pemeriksaan: formData.tanggal_pemeriksaan,
        diagnosis: formData.diagnosis,
        pengobatan: formData.pengobatan,
        status_kesehatan: formData.status_kesehatan,
      })

      if (result.success) {
        onSuccess()
        onClose()
        // Reset form
        setFormData({
          tanggal_pemeriksaan: new Date().toISOString().split("T")[0],
          nama_dokter: "",
          status_kesehatan: "Sehat",
          diagnosis: "",
          pengobatan: "",
        })
      } else {
        setError(result.error || "Terjadi kesalahan saat menambahkan rekam medis")
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat menambahkan rekam medis")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Rekam Medis</DialogTitle>
          <DialogDescription>Isi form berikut untuk menambahkan rekam medis baru</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tanggal_pemeriksaan">Tanggal Pemeriksaan</Label>
            <Input
              id="tanggal_pemeriksaan"
              name="tanggal_pemeriksaan"
              type="date"
              value={formData.tanggal_pemeriksaan}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nama_dokter">Nama Dokter</Label>
            <Input id="nama_dokter" name="nama_dokter" value={formData.nama_dokter} onChange={handleChange} required />
          </div>

          <div className="space-y-2">
            <Label>Status Kesehatan</Label>
            <RadioGroup value={formData.status_kesehatan} onValueChange={handleStatusChange}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Sehat" id="sehat" />
                <Label htmlFor="sehat">Sehat</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Sakit" id="sakit" />
                <Label htmlFor="sakit">Sakit</Label>
              </div>
            </RadioGroup>
          </div>

          {formData.status_kesehatan === "Sakit" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosa</Label>
                <Textarea
                  id="diagnosis"
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleChange}
                  required={formData.status_kesehatan === "Sakit"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pengobatan">Pengobatan</Label>
                <Textarea
                  id="pengobatan"
                  name="pengobatan"
                  value={formData.pengobatan}
                  onChange={handleChange}
                  required={formData.status_kesehatan === "Sakit"}
                />
              </div>
            </>
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
