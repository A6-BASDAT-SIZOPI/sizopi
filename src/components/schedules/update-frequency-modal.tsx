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
import { updateAnimalExaminationFrequency } from "@/app/actions/schedule-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UpdateFrequencyModalProps {
  isOpen: boolean
  onClose: () => void
  animalId: string
  currentFrequency: number
  onSuccess: () => void
}

export function UpdateFrequencyModal({
  isOpen,
  onClose,
  animalId,
  currentFrequency,
  onSuccess,
}: UpdateFrequencyModalProps) {
  const [frequency, setFrequency] = useState(currentFrequency.toString())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Validate frequency
      const frequencyValue = Number.parseInt(frequency, 10)
      if (isNaN(frequencyValue) || frequencyValue <= 0 || frequencyValue > 12) {
        setError("Frekuensi harus berupa angka antara 1-12")
        setIsLoading(false)
        return
      }

      const result = await updateAnimalExaminationFrequency(animalId, frequencyValue)

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.error || "Terjadi kesalahan saat mengubah frekuensi pemeriksaan")
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat mengubah frekuensi pemeriksaan")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ubah Frekuensi Pemeriksaan</DialogTitle>
          <DialogDescription>Ubah frekuensi pemeriksaan rutin untuk hewan ini</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="frequency">Frekuensi Pemeriksaan (bulan)</Label>
            <Input
              id="frequency"
              type="number"
              min="1"
              max="12"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              required
            />
            <p className="text-sm text-gray-500">Masukkan angka 1-12 untuk menentukan frekuensi dalam bulan</p>
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
