"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Animal {
  id: string
  nama: string
}

interface AddMedicalRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (message?: string) => void
}

export function AddMedicalRecordModal({ isOpen, onClose, onSuccess }: AddMedicalRecordModalProps) {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [animals, setAnimals] = useState<Animal[]>([])
  const [form, setForm] = useState({
    id_hewan: "",
    tanggal_pemeriksaan: "",
    diagnosis: "",
    pengobatan: "",
    status_kesehatan: "Sehat" as "Sehat" | "Sakit",
    catatan_tindak_lanjut: ""
  })
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        const res = await fetch('/api/hewan')
        if (!res.ok) throw new Error('Gagal mengambil data hewan')
        const data = await res.json()
        setAnimals(data)
      } catch (err) {
        console.error('Error fetching animals:', err)
        setError('Gagal mengambil data hewan')
      }
    }

    if (isOpen) {
      fetchAnimals()
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const res = await fetch('/api/rekam-medis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username_dh: user.username,
          ...form
        }),
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || 'Gagal menambahkan rekam medis')
      }

      console.log('Response data:', data) // Debug log

      if (data.message) {
        setSuccessMessage(data.message)
        // Wait 2 seconds before closing to show the message
        setTimeout(() => {
          onSuccess(data.message)
          onClose()
        }, 2000)
      } else {
        onSuccess()
        onClose()
      }
    } catch (error: any) {
      console.error('Error adding medical record:', error)
      setError(error.message || 'Terjadi kesalahan saat menambahkan rekam medis')
    } finally {
      setIsSubmitting(false)
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

        {successMessage && (
          <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hewan">Hewan</Label>
            <Select
              value={form.id_hewan}
              onValueChange={(value) => setForm(f => ({ ...f, id_hewan: value }))}
            >
              <SelectTrigger className="bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500">
                <SelectValue placeholder="Pilih hewan" />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 border-gray-200">
                {animals.map((animal) => (
                  <SelectItem 
                    key={animal.id} 
                    value={animal.id}
                    className="hover:bg-gray-100 cursor-pointer"
                  >
                    {animal.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tanggal">Tanggal Pemeriksaan</Label>
            <Input
              id="tanggal"
              type="date"
              required
              value={form.tanggal_pemeriksaan}
              onChange={(e) => setForm(f => ({ ...f, tanggal_pemeriksaan: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status Kesehatan</Label>
            <Select
              value={form.status_kesehatan}
              onValueChange={(v: "Sehat" | "Sakit") => setForm(f => ({ ...f, status_kesehatan: v }))}
            >
              <SelectTrigger className="bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 border-gray-200">
                <SelectItem 
                  value="Sehat"
                  className="hover:bg-gray-100 cursor-pointer"
                >
                  Sehat
                </SelectItem>
                <SelectItem 
                  value="Sakit"
                  className="hover:bg-gray-100 cursor-pointer"
                >
                  Sakit
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.status_kesehatan === "Sakit" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Textarea
                  id="diagnosis"
                  required
                  value={form.diagnosis}
                  onChange={(e) => setForm(f => ({ ...f, diagnosis: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pengobatan">Pengobatan</Label>
                <Textarea
                  id="pengobatan"
                  required
                  value={form.pengobatan}
                  onChange={(e) => setForm(f => ({ ...f, pengobatan: e.target.value }))}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="catatan">Catatan Tindak Lanjut</Label>
            <Textarea
              id="catatan"
              value={form.catatan_tindak_lanjut}
              onChange={(e) => setForm(f => ({ ...f, catatan_tindak_lanjut: e.target.value }))}
              placeholder="Opsional"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
