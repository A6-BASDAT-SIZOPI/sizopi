"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { LogOut, Menu, X } from "lucide-react"
import { useState } from "react"

export function Navbar() {
  const { user, userRole, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <nav style={{ backgroundColor: '#FF912F' }} className="text-white shadow-md">      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="font-bold text-xl">SIZOPI</span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/dashboard" className="px-3 py-2 rounded-md hover:bg-green-600">
                  Dashboard
                </Link>

                {userRole === "dokter_hewan" && (
                  <Link href="/rekam-medis" className="px-3 py-2 rounded-md hover:bg-green-600">
                    Rekam Medis Hewan
                  </Link>
                )}

                {userRole === "penjaga_hewan" && (
                  <Link href="/catatan-perawatan" className="px-3 py-2 rounded-md hover:bg-green-600">
                    Catatan Perawatan Hewan
                  </Link>
                )}

                {userRole === "staf_admin" && (
                  <>
                    <Link href="/kelola-pengunjung" className="px-3 py-2 rounded-md hover:bg-green-600">
                      Kelola Pengunjung
                    </Link>
                    <Link href="/kelola-adopsi" className="px-3 py-2 rounded-md hover:bg-green-600">
                      Kelola Adopsi
                    </Link>
                    <Link href="/kelola-adopter" className="px-3 py-2 rounded-md hover:bg-green-600">
                      Kelola Adopter
                    </Link>
                  </>
                )}

                {userRole === "pelatih_hewan" && (
                  <Link href="/jadwal-pertunjukan" className="px-3 py-2 rounded-md hover:bg-green-600">
                    Jadwal Pertunjukan
                  </Link>
                )}

                {userRole === "pengunjung" && (
                  <>
                    <Link href="/informasi-kebun" className="px-3 py-2 rounded-md hover:bg-green-600">
                      Informasi Kebun Binatang
                    </Link>
                    <Link href="/hewan-adopsi" className="px-3 py-2 rounded-md hover:bg-green-600">
                      Hewan Adopsi
                    </Link>
                  </>
                )}

                <Link href="/profile" className="px-3 py-2 rounded-md hover:bg-green-600">
                  Pengaturan Profil
                </Link>

                <Button className="text-white hover:bg-green-600 hover:text-white" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="px-3 py-2 rounded-md hover:bg-green-600">
                  Login
                </Link>
                <Link href="/auth/register" className="px-3 py-2 rounded-md hover:bg-green-600">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-green-600 focus:outline-none"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {user ? (
              <>
                <Link href="/dashboard" className="block px-3 py-2 rounded-md hover:bg-green-600" onClick={toggleMenu}>
                  Dashboard
                </Link>

                {userRole === "dokter_hewan" && (
                  <Link
                    href="/rekam-medis"
                    className="block px-3 py-2 rounded-md hover:bg-green-600"
                    onClick={toggleMenu}
                  >
                    Rekam Medis Hewan
                  </Link>
                )}

                {userRole === "penjaga_hewan" && (
                  <Link
                    href="/catatan-perawatan"
                    className="block px-3 py-2 rounded-md hover:bg-green-600"
                    onClick={toggleMenu}
                  >
                    Catatan Perawatan Hewan
                  </Link>
                )}

                {userRole === "staf_admin" && (
                  <>
                    <Link
                      href="/kelola-pengunjung"
                      className="block px-3 py-2 rounded-md hover:bg-green-600"
                      onClick={toggleMenu}
                    >
                      Kelola Pengunjung
                    </Link>
                    <Link
                      href="/kelola-adopsi"
                      className="block px-3 py-2 rounded-md hover:bg-green-600"
                      onClick={toggleMenu}
                    >
                      Kelola Adopsi
                    </Link>
                    <Link
                      href="/kelola-adopter"
                      className="block px-3 py-2 rounded-md hover:bg-green-600"
                      onClick={toggleMenu}
                    >
                      Kelola Adopter
                    </Link>
                  </>
                )}

                {userRole === "pelatih_hewan" && (
                  <Link
                    href="/jadwal-pertunjukan"
                    className="block px-3 py-2 rounded-md hover:bg-green-600"
                    onClick={toggleMenu}
                  >
                    Jadwal Pertunjukan
                  </Link>
                )}

                {userRole === "pengunjung" && (
                  <>
                    <Link
                      href="/informasi-kebun"
                      className="block px-3 py-2 rounded-md hover:bg-green-600"
                      onClick={toggleMenu}
                    >
                      Informasi Kebun Binatang
                    </Link>
                    <Link
                      href="/hewan-adopsi"
                      className="block px-3 py-2 rounded-md hover:bg-green-600"
                      onClick={toggleMenu}
                    >
                      Hewan Adopsi
                    </Link>
                  </>
                )}

                <Link href="/profile" className="block px-3 py-2 rounded-md hover:bg-green-600" onClick={toggleMenu}>
                  Pengaturan Profil
                </Link>

                <button
                  onClick={() => {
                    signOut()
                    toggleMenu()
                  }}
                  className="w-full text-left block px-3 py-2 rounded-md hover:bg-green-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block px-3 py-2 rounded-md hover:bg-green-600" onClick={toggleMenu}>
                  Login
                </Link>
                <Link href="/register" className="block px-3 py-2 rounded-md hover:bg-green-600" onClick={toggleMenu}>
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
