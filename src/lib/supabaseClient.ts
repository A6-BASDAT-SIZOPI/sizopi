// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// Ambil URL dan Key dari environment variables
const supabaseUrl: string = 'https://bltsnkrqjmilgdworvmg.supabase.co'
const supabaseKey: string = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsdHNua3Jxam1pbGdkd29ydm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0OTEyNDMsImV4cCI6MjA2MDA2NzI0M30.A-ib0qA9R6CKNh8SHIGOoHIctO7iyqBNwi8lijhI3xg'

// Buat client Supabase
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
