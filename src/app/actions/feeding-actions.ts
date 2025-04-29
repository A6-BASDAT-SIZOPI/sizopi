"use server"

import { supabase } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

// Type definitions for feeding forms
type FeedingFormData = {
  id_hewan: string
  username_jh: string
  jenis_pakan: string
  jumlah_pakan: number
  jadwal: string
}

type EditFeedingFormData = {
  id: number
  jenis_pakan: string
  jumlah_pakan: number
  jadwal: string
}

export async function getFeedingSchedules(animalId: string) {
  try {
    const { data, error } = await supabase
      .from("pakan")
      .select("*")
      .eq("id_hewan", animalId)

    if (error) {
      throw error
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Error fetching feeding schedules:", error)
    return { success: false, error: error.message }
  }
}

export async function getKeeperFeedingHistory(username: string) {
  try {
    
    // 1. Dapatkan semua id_hewan yang pernah diberi pakan oleh penjaga ini
    const { data: memberiData, error: memberiError } = await supabase
      .from("memberi")
      .select("id_hewan")
      .eq("username_jh", username)
      .order("id_hewan");
    
    if (memberiError) {
      console.error("Error fetching memberi data:", memberiError);
      throw memberiError;
    }
    
    // Ekstrak unique id_hewan saja
    const animalIds = [...new Set(memberiData.map(item => item.id_hewan))];
    
    if (animalIds.length === 0) {
      return { success: true, data: [] };
    }
    
    // 2. Dapatkan semua data pakan untuk hewan-hewan tersebut
    const result = [];
    
    for (const animalId of animalIds) {
      // Dapatkan data pakan
      const { data: pakanData, error: pakanError } = await supabase
        .from("pakan")
        .select("*")
        .eq("id_hewan", animalId);
      
      if (pakanError) {
        console.error(`Error fetching pakan data for animal ${animalId}:`, pakanError);
        continue;
      }
      
      // Dapatkan data hewan
      const { data: hewanData, error: hewanError } = await supabase
        .from("hewan")
        .select("*")
        .eq("id", animalId)
        .single();
      
      if (hewanError) {
        console.error(`Error fetching hewan data for animal ${animalId}:`, hewanError);
        continue;
      }
      
      // Tambahkan setiap data pakan ke hasil
      for (const pakan of pakanData) {
        result.push({
          id: result.length + 1,
          id_hewan: animalId,
          username_jh: username,
          jenis_pakan: pakan.jenis,
          jumlah_pakan: pakan.jumlah,
          jadwal: pakan.jadwal,
          status: pakan.status,
          HEWAN: hewanData
        });
      }
    }
    
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error getting keeper feeding history:', error);
    return { success: false, error: error.message };
  }
}

export async function addFeedingSchedule(formData: FeedingFormData) {

  try {
    const { error } = await supabase.from("pemberian_pakan").insert({
      id_hewan: formData.id_hewan,
      username_jh: formData.username_jh,
      jenis_pakan: formData.jenis_pakan,
      jumlah_pakan: formData.jumlah_pakan,
      jadwal: formData.jadwal,
      status: "Menunggu Pemberian"
    })

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/pemberian-pakan/${formData.id_hewan}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function editFeedingSchedule(formData: EditFeedingFormData) {

  try {
    const { error } = await supabase
      .from("pemberian_pakan")
      .update({
        jenis_pakan: formData.jenis_pakan,
        jumlah_pakan: formData.jumlah_pakan,
        jadwal: formData.jadwal
      })
      .eq("id", formData.id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/pemberian-pakan`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteFeedingSchedule(id: number) {

  try {
    const { error } = await supabase
      .from("pemberian_pakan")
      .delete()
      .eq("id", id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath(`/pemberian-pakan`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function markFeedingAsComplete(id_hewan: string, jadwal: string) {
  try {
    // Update status di tabel pakan
    const { error: updateError } = await supabase
      .from("pakan")
      .update({ status: "selesai" })
      .eq("id_hewan", id_hewan)
      .eq("jadwal", jadwal)
    
    if (updateError) throw updateError
    
    revalidatePath(`/pemberian-pakan`)
    return { success: true }
  } catch (error: any) {
    console.error("Error marking feeding as complete:", error)
    return { success: false, error: error.message }
  }
}

export async function getAllAnimals() {

  try {
    const { data, error } = await supabase
      .from("hewan")
      .select("*")
      .order("nama", { ascending: true })

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
    const { data, error } = await supabase
      .from("hewan")
      .select("*")
      .eq("id", animalId)
      .single()

    if (error) {
      return { success: false, error: error.message, data: null }
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message, data: null }
  }
}

export async function getAllFeedings() {
  try {
    const { data, error } = await supabase
      .from("pakan")
      .select("*")
      .order("jadwal", { ascending: true })

    if (error) {
      throw error
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Error fetching all feedings:", error)
    return { success: false, error: error.message }
  }
}
