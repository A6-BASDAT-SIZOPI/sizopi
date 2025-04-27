"use client"

import { Navbar } from "@/components/navbar"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { ArrowRight } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import { useEffect, useState } from "react"

// Inisialisasi Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export default function Home() {
  const { user, userRole, loading } = useAuth()
  const [animalImages, setAnimalImages] = useState({
    harimau: "/placeholder.svg?height=400&width=600",
    orangutan: "/placeholder.svg?height=400&width=600",
    rubah: "/placeholder.svg?height=400&width=600",
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchAnimalImages() {
      try {
        // Fetch Harimau Bengal Claw image
        const { data: harimauData, error: harimauError } = await supabase
          .from("hewan")
          .select("url_foto")
          .eq("nama", "Harimau Bengal Claw")
          .single()

        // Fetch Orangutan Borneo Kawan image
        const { data: orangutanData, error: orangutanError } = await supabase
          .from("hewan")
          .select("url_foto")
          .eq("nama", "Orangutan Borneo Kawan")
          .single()

        // Fetch Rubah Arktik Blitz image
        const { data: rubahData, error: rubahError } = await supabase
          .from("hewan")
          .select("url_foto")
          .eq("nama", "Rubah Arktik Blitz")
          .single()

        // Update state with fetched images
        setAnimalImages({
          harimau: harimauData?.url_foto || "/placeholder.svg?height=400&width=600",
          orangutan: orangutanData?.url_foto || "/placeholder.svg?height=400&width=600",
          rubah: rubahData?.url_foto || "/placeholder.svg?height=400&width=600",
        })

        // Log any errors
        if (harimauError) console.error("Error fetching harimau image:", harimauError)
        if (orangutanError) console.error("Error fetching orangutan image:", orangutanError)
        if (rubahError) console.error("Error fetching rubah image:", rubahError)
      } catch (error) {
        console.error("Error fetching animal images:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnimalImages()
  }, [])

  const getWelcomeMessage = () => {
    if (!user) return "Selamat Datang di SIZOPI"

    if (userRole === "pengunjung") {
      return `Selamat Berkunjung, ${user.nama_depan}`
    }
    return `Selamat Datang, ${user.nama_depan}`
  }

  const getRoleMessage = () => {
    if (!userRole) return ""

    if (userRole === "pengunjung") {
      return "Semoga harimu menyenangkan!"
    }
    return "Selamat bekerja dan semoga harimu menyenangkan!"
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <div className="relative h-[80vh] flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1518013895739-f7b24b50adf9?q=80&w=2304&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
          }}
        >
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg">
            {getWelcomeMessage()}
          </h1>

          {user ? (
            <div className="space-y-4">
              <p className="text-2xl text-white">
                Role: <span className="font-semibold">{userRole}</span>
              </p>
              <p className="text-xl text-white">{getRoleMessage()}</p>
            </div>
          ) : (
            <>
              <p className="text-xl sm:text-2xl text-white mb-8 max-w-3xl mx-auto drop-shadow-lg">
                Sistem Informasi Zoo Pintar - Mengelola kebun binatang dengan lebih efisien
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-[#FF912F] hover:bg-[#E87F20] text-white hover:bg-white/20 font-bold"
                >
                  <Link href="/auth/login">Masuk</Link>
                </Button>
                <Button asChild size="lg" className="bg-[#39B33A] text-white hover:bg-white/20 font-bold">
                  <Link href="/auth/register">Daftar Sekarang</Link>
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ArrowRight className="h-8 w-8 text-white rotate-90" />
        </div>
      </div>

      {/* Featured Animals - Simple Version */}
      <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Satwa Unggulan Kami</h2>
            <p className="mt-4 text-lg text-gray-600">Temui penghuni istimewa kebun binatang kami</p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="h-64 w-full relative">
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="w-10 h-10 border-4 border-[#FF912F] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <Image
                    src={animalImages.harimau || "/placeholder.svg"}
                    alt="Harimau Bengal Claw"
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Harimau Bengal Claw</h3>
                <p className="text-gray-600 mb-4">Spesies harimau yang terkenal dengan kekuatan dan kecepatannya.</p>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-[#FF912F] text-[#FF912F] hover:bg-[#FF912F] hover:text-white"
                >
                  <Link href="#">Pelajari Lebih Lanjut</Link>
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="h-64 w-full relative">
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="w-10 h-10 border-4 border-[#FF912F] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <Image
                    src={animalImages.orangutan || "/placeholder.svg"}
                    alt="Orangutan Borneo Kawan"
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Orangutan Borneo Kawan</h3>
                <p className="text-gray-600 mb-4">Primata cerdas yang hanya ditemukan di hutan hujan Kalimantan.</p>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-[#FF912F] text-[#FF912F] hover:bg-[#FF912F] hover:text-white"
                >
                  <Link href="#">Pelajari Lebih Lanjut</Link>
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="h-64 w-full relative">
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="w-10 h-10 border-4 border-[#FF912F] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <Image
                    src={animalImages.rubah || "/placeholder.svg"}
                    alt="Rubah Arktik Blitz"
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Rubah Arktik Blitz</h3>
                <p className="text-gray-600 mb-4">
                  Rubah dengan bulu putih tebal yang beradaptasi dengan lingkungan dingin Arktik.
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-[#FF912F] text-[#FF912F] hover:bg-[#FF912F] hover:text-white"
                >
                  <Link href="#">Pelajari Lebih Lanjut</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-white p-8 mt-auto" style={{ backgroundColor: "#FF912F" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">SIZOPI</h3>
              <p className="mb-4">Sistem Informasi Zoo Pintar - Mengelola kebun binatang dengan lebih efisien</p>
              <div className="flex space-x-4">
                <a href="#" className="hover:text-white/80">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a href="#" className="hover:text-white/80">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a href="#" className="hover:text-white/80">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27a8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07a4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Tautan Cepat</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="hover:underline">
                    Tentang Kami
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Fitur SIZOPI
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Panduan Pengguna
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Hubungi Kami
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Kontak</h3>
              <ul className="space-y-2">
                <li>Jl. Raya Kebun Binatang No. 123</li>
                <li>Kota Indah, Indonesia</li>
                <li>Telepon: (021) 1234-5678</li>
                <li>Email: info@sizopi.com</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 mt-8 pt-8 text-center">
            <p>&copy; {new Date().getFullYear()} SIZOPI - Sistem Informasi Zoo Pintar Basis Data A6</p>
          </div>
        </div>
      </footer>
    </div>
  )
}