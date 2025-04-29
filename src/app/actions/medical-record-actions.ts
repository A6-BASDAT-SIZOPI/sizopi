"use server"

import { supabase } from "@/lib/supabase-client"
import { revalidatePath } from "next/cache"

// Type definitions for medical record forms
type MedicalRecordFormData = {
  id_hewan: string
  username_dh: string
  tanggal_pemeriksaan: string
  diagnosis?: string
  pengobatan?: string
  status_kesehatan: "Sehat" | "Sakit"
  catatan_tindak_lanjut?: string
}

type EditMedicalRecordFormData = {
  id_hewan: string
  tanggal_pemeriksaan: string
  diagnosis: string
  pengobatan: string
  catatan_tindak_lanjut?: string
}

export async function getMedicalRecords(animalId: string) {

  try {
    const { data, error } = await supabase
      .from("catatan_medis")
      .select(`
        *,
        DOKTER_HEWAN(
          PENGGUNA(nama_depan, nama_tengah, nama_belakang)
        )
      `)
      .eq("id_hewan", animalId)
      .order("tanggal_pemeriksaan", { ascending: false })

    if (error) {
      return { success: false, error: error.message, data: null }
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message, data: null }
  }
}

export async function getAnimalById(animalId: string) {

  try {
    const { data, error } = await supabase.from("hewan").select("*").eq("id", animalId).single()

    if (error) {
      return { success: false, error: error.message, data: null }
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message, data: null }
  }
}

export async function getAllAnimals() {

  try {
    const { data, error } = await supabase.from("hewan").select("*").order("nama", { ascending: true })

    if (error) {
      return { success: false, error: error.message, data: null }
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message, data: null }
  }
}

export async function addMedicalRecord(formData: MedicalRecordFormData) {

  try {
    // Check if a record with the same animal ID and examination date already exists
    const { data: existingRecord, error: checkError } = await supabase
      .from("catatan_medis")
      .select("*")
      .eq("id_hewan", formData.id_hewan)
      .eq("tanggal_pemeriksaan", formData.tanggal_pemeriksaan)
      .maybeSingle()

    if (checkError) {
      return { success: false, error: checkError.message }
    }

    if (existingRecord) {
      return { success: false, error: "Rekam medis untuk tanggal ini sudah ada" }
    }

    // Insert the new medical record
    const { error } = await supabase.from("catatan_medis").insert({
      id_hewan: formData.id_hewan,
      username_dh: formData.username_dh,
      tanggal_pemeriksaan: formData.tanggal_pemeriksaan,
      diagnosis: formData.status_kesehatan === "Sakit" ? formData.diagnosis : null,
      pengobatan: formData.status_kesehatan === "Sakit" ? formData.pengobatan : null,
      status_kesehatan: formData.status_kesehatan,
      catatan_tindak_lanjut: null, // Initially empty, will be filled during edit
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // Update the animal's health status
    const { error: updateError } = await supabase
      .from("hewan")
      .update({ status_kesehatan: formData.status_kesehatan })
      .eq("id", formData.id_hewan)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    revalidatePath(`/rekam-medis/${formData.id_hewan}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function editMedicalRecord(formData: EditMedicalRecordFormData) {

  try {
    const { error } = await supabase
      .from("catatan_medis")
      .update({
        diagnosis: formData.diagnosis,
        pengobatan: formData.pengobatan,
        catatan_tindak_lanjut: formData.catatan_tindak_lanjut,
      })
      .eq("id_hewan", formData.id_hewan)
      .eq("tanggal_pemeriksaan", formData.tanggal_pemeriksaan)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/rekam-medis/${formData.id_hewan}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteMedicalRecord(animalId: string, examinationDate: string) {

  try {
    const { error } = await supabase
      .from("catatan_medis")
      .delete()
      .eq("id_hewan", animalId)
      .eq("tanggal_pemeriksaan", examinationDate)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/rekam-medis/${animalId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getMedicalRecordsByAnimalId(id_hewan: string) {
  const { data, error } = await supabase
    .from("catatan_medis")
    .select("*")
    .eq("id_hewan", id_hewan)
    .order("tanggal_pemeriksaan", { ascending: false })

  if (error) throw error
  return data
}
