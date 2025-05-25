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
import { deleteFeedingSchedule } from "@/app/actions/feeding-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FeedingSchedule {
  id: number
  id_hewan: string
  username_jh: string
  jenis_pakan: string
  jumlah_pakan: number
  jadwal: string
  status: string
}

interface DeleteFeedingModalProps {
  isOpen: boolean
  onClose: () => void
  feeding: FeedingSchedule
  onSuccess: () => void
}

export function DeleteFeedingModal({ isOpen, onClose, feeding, onSuccess }: DeleteFeedingModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setError(null)
    setIsLoading(true)

    try {
      const result = await deleteFeedingSchedule(feeding.id)

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.error || "Terjadi kesalahan saat menghapus jadwal pemberian pakan")
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat menghapus jadwal pemberian pakan")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>HAPUS PEMBERIAN PAKAN</DialogTitle>
          <DialogDescription>Apakah anda yakin ingin menghapus data pemberian pakan ini?</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            TIDAK
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? "Menghapus..." : "YA"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
