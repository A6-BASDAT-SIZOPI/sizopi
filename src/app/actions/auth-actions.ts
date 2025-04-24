"use server"

import { supabase } from "@/lib/supabase-server"
import { v4 as uuidv4 } from "uuid"
import { revalidatePath } from "next/cache"

// Type definitions for registration forms
type PengunjungFormData = {
  username: string
  password: string
  nama_depan: string
  nama_tengah?: string
  nama_belakang: string
  email: string
  no_telepon: string
  alamat: string
  tgl_lahir: string
}

type DokterHewanFormData = {
  username: string
  password: string
  nama_depan: string
  nama_tengah?: string
  nama_belakang: string
  email: string
  no_telepon: string
  no_STR: string
  spesialisasi: string[]
}

type StaffFormData = {
  username: string
  password: string
  nama_depan: string
  nama_tengah?: string
  nama_belakang: string
  email: string
  no_telepon: string
  id_staf: string
  peran: "penjaga_hewan" | "staf_admin" | "pelatih_hewan"
}

export async function registerPengunjung(formData: PengunjungFormData) {
  try {
    console.log("1. Memulai proses registrasi pengunjung")
    
    // 1. Register auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    })

    if (authError) {
      console.error("2A. Error saat membuat auth user:", {
        code: authError.code,
        message: authError.message,
      })
      return { success: false, error: authError.message }
    }

    console.log("2B. Auth user berhasil dibuat")

    // 2. Insert ke tabel pengguna (data umum)
    const { error: userError } = await supabase
      .from("pengguna")
      .insert({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        nama_depan: formData.nama_depan,
        nama_tengah: formData.nama_tengah || null,
        nama_belakang: formData.nama_belakang,
        no_telepon: formData.no_telepon,
      })

    if (userError) {
      console.error("3A. Error saat menyimpan data pengguna:", userError)
      if (authData.user) {
        await supabase.auth.admin.deleteUser(authData.user.id)
      }
      return { success: false, error: userError.message }
    }

    console.log("3B. Data pengguna berhasil disimpan")

    // 3. Insert ke tabel pengunjung (data spesifik pengunjung)
    const { error: pengunjungError } = await supabase
      .from("pengunjung")
      .insert({
        username_p: formData.username,  // foreign key ke tabel pengguna
        alamat: formData.alamat,
        tgl_lahir: formData.tgl_lahir
      })

    if (pengunjungError) {
      console.error("4A. Error saat menyimpan data pengunjung:", pengunjungError)
      // Rollback: hapus data dari tabel pengguna
      await supabase
        .from("pengguna")
        .delete()
        .eq("username", formData.username)
      
      // Hapus auth user
      if (authData.user) {
        await supabase.auth.admin.deleteUser(authData.user.id)
      }
      
      return { success: false, error: pengunjungError.message }
    }

    console.log("4B. Data pengunjung berhasil disimpan")
    return { success: true }

  } catch (err: any) {
    console.error("5. Error tidak terduga:", err)
    return { success: false, error: err.message }
  }
}

export async function registerDokterHewan(formData: DokterHewanFormData) {
  try {
    console.log("1. Memulai proses registrasi dokter hewan")
    
    // 1. Register auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    })

    if (authError) {
      console.error("2A. Error saat membuat auth user:", {
        code: authError.code,
        message: authError.message
      })
      return { success: false, error: authError.message }
    }

    console.log("2B. Auth user berhasil dibuat")

    // 2. Insert ke tabel pengguna
    const { error: userError } = await supabase.from("pengguna").insert({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      nama_depan: formData.nama_depan,
      nama_tengah: formData.nama_tengah || null,
      nama_belakang: formData.nama_belakang,
      no_telepon: formData.no_telepon,
    })

    if (userError) {
      console.error("3A. Error saat menyimpan data pengguna:", userError)
      if (authData.user) {
        await supabase.auth.admin.deleteUser(authData.user.id)
      }
      return { success: false, error: userError.message }
    }

    console.log("3B. Data pengguna berhasil disimpan")

    // 3. Insert ke tabel dokter_hewan
    const { error: dokterError } = await supabase.from("dokter_hewan").insert({
      username_dh: formData.username,  // Sesuaikan dengan nama kolom foreign key
      no_str: formData.no_STR  // Sesuaikan dengan nama kolom di database
    })

    if (dokterError) {
      console.error("4A. Error saat menyimpan data dokter hewan:", dokterError)
      // Rollback: hapus data dari tabel pengguna
      await supabase
        .from("pengguna")
        .delete()
        .eq("username", formData.username)
      
      // Hapus auth user
      if (authData.user) {
        await supabase.auth.admin.deleteUser(authData.user.id)
      }
      return { success: false, error: dokterError.message }
    }

    console.log("4B. Data dokter hewan berhasil disimpan")

    // 4. Insert spesialisasi
    for (const spesialis of formData.spesialisasi) {
      console.log(`5. Mencoba menyimpan spesialisasi: ${spesialis}`)
      const { error: spesialisasiError } = await supabase.from("spesialisasi").insert({
        username_sh: formData.username,  // Sesuaikan dengan nama kolom foreign key
        nama_spesialisasi: spesialis
      })

      if (spesialisasiError) {
        console.error("5A. Error saat menyimpan spesialisasi:", spesialisasiError)
        // Rollback: hapus semua data
        await supabase
          .from("dokter_hewan")
          .delete()
          .eq("username_dh", formData.username)
        
        await supabase
          .from("pengguna")
          .delete()
          .eq("username", formData.username)
        
        if (authData.user) {
          await supabase.auth.admin.deleteUser(authData.user.id)
        }
        return { success: false, error: spesialisasiError.message }
      }
    }

    console.log("6. Semua data berhasil disimpan")
    return { success: true }

  } catch (err: any) {
    console.error("7. Error tidak terduga:", {
      name: err.name,
      message: err.message,
      stack: err.stack
    })
    return { success: false, error: err.message }
  }
}

export async function registerStaff(formData: StaffFormData) {
  try {
    console.log("1. Memulai proses registrasi staff:", formData.peran)
    
    // 1. Register auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    })

    if (authError) {
      console.error("2A. Error saat membuat auth user:", {
        code: authError.code,
        message: authError.message
      })
      return { success: false, error: authError.message }
    }

    console.log("2B. Auth user berhasil dibuat")

    // 2. Insert ke tabel pengguna
    const { error: userError } = await supabase.from("pengguna").insert({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      nama_depan: formData.nama_depan,
      nama_tengah: formData.nama_tengah || null,
      nama_belakang: formData.nama_belakang,
      no_telepon: formData.no_telepon,
    })

    if (userError) {
      console.error("3A. Error saat menyimpan data pengguna:", userError)
      if (authData.user) {
        await supabase.auth.admin.deleteUser(authData.user.id)
      }
      return { success: false, error: userError.message }
    }

    console.log("3B. Data pengguna berhasil disimpan")

    // Gunakan id_staf dari form, bukan generate UUID
    const staffId = formData.id_staf
    console.log("4. Menggunakan staff ID:", staffId)

    // Insert ke tabel staff sesuai peran
    if (formData.peran === "penjaga_hewan") {
      console.log("5A. Mencoba menyimpan data penjaga hewan")
      const { error: penjagaError } = await supabase.from("penjaga_hewan").insert({
        username_jh: formData.username,
        id_staf: staffId,  // gunakan ID dari form
      })

      if (penjagaError) {
        console.error("5B. Error saat menyimpan data penjaga hewan:", penjagaError)
        await rollbackStaffRegistration(formData.username, authData.user?.id)
        return { success: false, error: penjagaError.message }
      }
      console.log("5C. Data penjaga hewan berhasil disimpan")

    } else if (formData.peran === "staf_admin") {
      console.log("5A. Mencoba menyimpan data staff admin")
      const { error: adminError } = await supabase.from("staf_admin").insert({
        username_sa: formData.username,
        id_staf: staffId,
      })

      if (adminError) {
        console.error("5B. Error saat menyimpan data staff admin:", adminError)
        await rollbackStaffRegistration(formData.username, authData.user?.id)
        return { success: false, error: adminError.message }
      }
      console.log("5C. Data staff admin berhasil disimpan")

    } else if (formData.peran === "pelatih_hewan") {
      console.log("5A. Mencoba menyimpan data pelatih hewan")
      const { error: pelatihError } = await supabase.from("pelatih_hewan").insert({
        username_lh: formData.username,
        id_staf: staffId,
      })

      if (pelatihError) {
        console.error("5B. Error saat menyimpan data pelatih hewan:", pelatihError)
        await rollbackStaffRegistration(formData.username, authData.user?.id)
        return { success: false, error: pelatihError.message }
      }
      console.log("5C. Data pelatih hewan berhasil disimpan")
    }

    console.log("6. Semua data berhasil disimpan")
    return { success: true }

  } catch (err: any) {
    console.error("7. Error tidak terduga:", {
      name: err.name,
      message: err.message,
      stack: err.stack
    })
    return { success: false, error: err.message }
  }
}

// Fungsi helper untuk rollback
async function rollbackStaffRegistration(username: string, authUserId?: string) {
  console.log("Memulai proses rollback")
  
  // Hapus data dari tabel pengguna
  const { error: deleteError } = await supabase
    .from("pengguna")
    .delete()
    .eq("username", username)
  
  if (deleteError) {
    console.error("Error saat rollback data pengguna:", deleteError)
  }

  // Hapus auth user
  if (authUserId) {
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(authUserId)
    if (authDeleteError) {
      console.error("Error saat rollback auth user:", authDeleteError)
    }
  }
  
  console.log("Proses rollback selesai")
}
