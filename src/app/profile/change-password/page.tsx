"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase-server"

export default function ChangePassword() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading])

  const validateForm = () => {
    let isValid = true
    const newErrors = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Password saat ini harus diisi"
      isValid = false
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "Password baru harus diisi"
      isValid = false
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Password baru minimal 6 karakter"
      isValid = false
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi password harus diisi"
      isValid = false
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi password tidak cocok"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Verify current password
      const { data: userData, error: userError } = await supabase
        .from("pengguna")
        .select("password")
        .eq("username", user.username)
        .single()

      if (userError) throw userError

      if (userData.password !== formData.currentPassword) {
        setErrors((prev) => ({
          ...prev,
          currentPassword: "Password saat ini tidak valid",
        }))
        setIsLoading(false)
        return
      }

      // Update password
      const { error: updateError } = await supabase
        .from("pengguna")
        .update({ password: formData.newPassword })
        .eq("username", user.username)

      if (updateError) throw updateError

      toast({
        title: "Sukses",
        description: "Password berhasil diubah",
      })

      // Redirect back to profile page
      router.push("/profile")
    } catch (error) {
      console.error("Error changing password:", error)
      toast({
        title: "Error",
        description: "Gagal mengubah password: " + (error.message || JSON.stringify(error)),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="flex justify-center items-center h-[60vh]">
            <p>Memuat...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-8">
        <div className="max-w-md mx-auto bg-white shadow-md rounded-lg overflow-hidden">
          <div className="border-b p-4 text-center">
            <h1 className="text-xl font-bold">UBAH PASSWORD</h1>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Password Saat Ini:</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  required
                />
                {errors.currentPassword && <p className="text-sm text-red-500 mt-1">{errors.currentPassword}</p>}
              </div>

              <div>
                <Label htmlFor="newPassword">Password Baru:</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  required
                />
                {errors.newPassword && <p className="text-sm text-red-500 mt-1">{errors.newPassword}</p>}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Konfirmasi Password Baru:</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
                {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>}
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => router.push("/profile")}>
                  KEMBALI
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                  {isLoading ? "Menyimpan..." : "SIMPAN"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
