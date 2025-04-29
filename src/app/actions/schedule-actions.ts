"use server"

import { supabase } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

// Type definitions for schedule forms
type ScheduleFormData = {
  id_hewan: string
  tanggal_pemeriksaan: string
}

export async function getExaminationSchedules(animalId: string) {

  try {
    const { data, error } = await supabase
      .from("jadwal_pemeriksaan_kesehatan")
      .select("*")
      .eq("id_hewan", animalId)
      .order("tgl_pemeriksaan_selanjutnya", { ascending: true })

    if (error) {
      return { success: false, error: error.message, data: null }
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message, data: null }
  }
}

export async function getAnimalExaminationFrequency(animalId: string) {

  try {
    const { data, error } = await supabase
      .from("jadwal_pemeriksaan_kesehatan")
      .select("freq_pemeriksaan_rutin")
      .eq("id_hewan", animalId)
      .single();

    if (error) {
      return { success: false, error: error.message, data: null }
    }

    return { success: true, data: data?.freq_pemeriksaan_rutin || 3 } // Default ke 3 bulan jika tidak ada data
  } catch (error: any) {
    return { success: false, error: error.message, data: null }
  }
}

export async function addExaminationSchedule(formData: ScheduleFormData) {

  try {
    // Check if a schedule with the same date already exists
    const { data: existingSchedule, error: checkError } = await supabase
      .from("jadwal_pemeriksaan_kesehatan")
      .select("*")
      .eq("id_hewan", formData.id_hewan)
      .eq("tgl_pemeriksaan_selanjutnya", formData.tanggal_pemeriksaan)
      .maybeSingle()

    if (checkError) {
      return { success: false, error: checkError.message }
    }

    if (existingSchedule) {
      return { success: false, error: "Jadwal pemeriksaan untuk tanggal ini sudah ada" }
    }

    // Insert the new schedule
    const { error } = await supabase.from("jadwal_pemeriksaan_kesehatan").insert({
      id_hewan: formData.id_hewan,
      tgl_pemeriksaan_selanjutnya: formData.tanggal_pemeriksaan,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/jadwal-pemeriksaan/${formData.id_hewan}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteExaminationSchedule(animalId: string, examinationDate: string) {

  try {
    const { error } = await supabase
      .from("jadwal_pemeriksaan_kesehatan")
      .delete()
      .eq("id_hewan", animalId)
      .eq("tgl_pemeriksaan_selanjutnya", examinationDate)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/jadwal-pemeriksaan/${animalId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateAnimalExaminationFrequency(animalId: string, frequency: number) {
  try {
    // Update freq_pemeriksaan_rutin di tabel jadwal_pemeriksaan_kesehatan
    const { error } = await supabase
      .from("jadwal_pemeriksaan_kesehatan")
      .update({ freq_pemeriksaan_rutin: frequency })
      .eq("id_hewan", animalId);

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/jadwal-pemeriksaan/${animalId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
