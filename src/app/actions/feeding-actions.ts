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
    const { data: memberiData, error: memberiError } = await supabase
      .from("MEMBERI")
      .select("id_hewan")
      .eq("username_jh", username)
      .order("id_hewan");
    
    if (memberiError) {
      console.error("Error fetching memberi data:", memberiError);
      throw memberiError;
    }
    
    const animalIds = [...new Set(memberiData.map(item => item.id_hewan))];
    
    if (animalIds.length === 0) {
      return { success: true, data: [] };
    }
    
    const result = [];
    
    for (const animalId of animalIds) {
      const { data: pakanData, error: pakanError } = await supabase
        .from("pakan")
        .select("*")
        .eq("id_hewan", animalId);
      
      if (pakanError) {
        console.error(`Error fetching pakan data for animal ${animalId}:`, pakanError);
        continue;
      }
      
      const { data: hewanData, error: hewanError } = await supabase
        .from("HEWAN")
        .select("*")
        .eq("id", animalId)
        .single();
      
      if (hewanError) {
        console.error(`Error fetching hewan data for animal ${animalId}:`, hewanError);
        continue;
      }
      
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
    // Validate input
    if (!formData.id_hewan || !formData.username_jh || !formData.jenis_pakan || !formData.jadwal) {
      return { success: false, error: "Semua field harus diisi" }
    }

    if (formData.jumlah_pakan <= 0) {
      return { success: false, error: "Jumlah pakan harus lebih dari 0" }
    }

    // Format the date properly
    console.log("Received jadwal:", formData.jadwal)
    
    // Handle date format
    let formattedDate
    try {
      // Extract only the valid date and time parts
      const dateTimeMatch = formData.jadwal.match(/(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
      if (!dateTimeMatch) {
        console.error("Could not extract valid date and time")
        return { success: false, error: "Format tanggal tidak valid" }
      }

      const [, datePart, timePart] = dateTimeMatch
      formattedDate = `${datePart}T${timePart}:00`
      
      console.log("Formatted date:", formattedDate)
    } catch (error) {
      console.error("Error formatting date:", error)
      return { success: false, error: "Format tanggal tidak valid" }
    }

    // Check if feeding schedule already exists for this animal and time
    const { data: existingSchedule, error: checkError } = await supabase
      .from("pakan")
      .select("*")
      .eq("id_hewan", formData.id_hewan)
      .eq("jadwal", formattedDate)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking existing schedule:", checkError)
      return { success: false, error: "Gagal memeriksa jadwal yang sudah ada" }
    }

    if (existingSchedule) {
      return { success: false, error: "Jadwal pemberian pakan untuk waktu ini sudah ada" }
    }

    // Insert new feeding schedule into pakan table
    const { data: pakanData, error: insertError } = await supabase
      .from("pakan")
      .insert({
        id_hewan: formData.id_hewan,
        jenis: formData.jenis_pakan,
        jumlah: formData.jumlah_pakan,
        jadwal: formattedDate,
        status: "Menunggu Pemberian"
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error inserting feeding schedule:", insertError)
      return { success: false, error: insertError.message }
    }

    // Insert into memberi table to record which keeper is responsible
    const { error: memberiError } = await supabase
      .from("memberi")
      .insert({
        id_hewan: formData.id_hewan,
        username_jh: formData.username_jh,
        jadwal: formattedDate
      })

    if (memberiError) {
      console.error("Error recording keeper assignment:", memberiError)
      // If this fails, we should probably delete the pakan entry
      await supabase
        .from("pakan")
        .delete()
        .eq("id_hewan", formData.id_hewan)
        .eq("jadwal", formattedDate)
      return { success: false, error: "Gagal mencatat penjaga yang bertugas" }
    }

    revalidatePath("/pemberian-pakan")
    return { success: true }
  } catch (error: any) {
    console.error("Error in addFeedingSchedule:", error)
    return { success: false, error: error.message }
  }
}

export async function editFeedingSchedule(formData: EditFeedingFormData) {
  try {
    const { error } = await supabase
      .from("pakan")
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
      .from("pakan")
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
      .from("HEWAN")
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
      .from("HEWAN")
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
