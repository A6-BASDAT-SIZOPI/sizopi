'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { LogOut, Menu, X, ChevronDown } from 'lucide-react'
import { useState } from 'react'

const NAV_LINK = 'px-3 py-2 rounded-md hover:bg-green-600 transition-colors whitespace-nowrap'

export function Navbar() {
  const { user, userRole, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <nav className="bg-[#FF912F] text-white shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold whitespace-nowrap">
          SIZOPI
        </Link>

        {/* Desktop Menu */}
        <ul className="hidden md:flex items-center space-x-2 flex-nowrap">
          {!user && (
            <>
              <li><Link href="/auth/login" className={NAV_LINK}>Login</Link></li>
              <li><Link href="/auth/register" className={NAV_LINK}>Register</Link></li>
            </>
          )}

          {user && (
            <>
              <li><Link href="/dashboard" className={NAV_LINK}>Dashboard</Link></li>

              {userRole === 'dokter_hewan' && (
                <>
                  <li><Link href="/rekam-medis" className={NAV_LINK}>Rekam Medis</Link></li>
                  <li><Link href="/satwa" className={NAV_LINK}>Data Satwa</Link></li>
                  <li><Link href="/jadwal-pemeriksaan" className={NAV_LINK}>Jadwal Periksa</Link></li>
                </>
              )}

              {userRole === 'penjaga_hewan' && (
                <>
                  <li><Link href="/satwa" className={NAV_LINK}>Data Satwa</Link></li>
                  <li><Link href="/habitat" className={NAV_LINK}>Data Habitat</Link></li>
                  <li><Link href="/pemberian-pakan" className={NAV_LINK}>Pemberian Pakan</Link></li>
                </>
              )}

              {userRole === 'staf_admin' && (
                <>
                  <li><Link href="/satwa" className={NAV_LINK}>Data Satwa</Link></li>
                  <li><Link href="/habitat" className={NAV_LINK}>Data Habitat</Link></li>
                  <li className="relative group">
                    <button className={`${NAV_LINK} flex items-center`}>
                      Kelola Fasilitas
                      <X className="ml-1 w-4 h-4 rotate-45" strokeWidth={2} />
                    </button>
                    <ul className="absolute left-0 mt-2 w-40 bg-white text-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50">
                      <li><Link href="/wahana" className="block px-4 py-2 hover:bg-green-100">Wahana</Link></li>
                      <li><Link href="/atraksi" className="block px-4 py-2 hover:bg-green-100">Atraksi</Link></li>
                    </ul>
                  </li>
                  <li><Link href="/reservasi/admin" className={NAV_LINK}>Kelola Reservasi</Link></li>
                  <li><Link href="/kelola-adopsi" className={NAV_LINK}>Kelola Adopsi</Link></li>
                  <li><Link href="/kelola-adopter" className={NAV_LINK}>Kelola Adopter</Link></li>
                </>
              )}

              {userRole === 'pelatih_hewan' && (
                <li><Link href="/jadwal-pertunjukan" className={NAV_LINK}>Jadwal Pertunjukan</Link></li>
              )}

              {userRole === "pengunjung" && (
                  <li className="relative group">
                    <button className={`${NAV_LINK} flex items-center`}>
                      Reservasi
                      <ChevronDown className="ml-1 w-4 h-4" />
                    </button>
                    <ul className="absolute left-0 mt-2 w-48 bg-white text-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50">
                      <li>
                        <Link href="/reservasi/booking" className="block px-4 py-2 hover:bg-orange-100">
                          Booking Tiket
                        </Link>
                      </li>
                      <li>
                        <Link href="/reservasi/tiket-anda" className="block px-4 py-2 hover:bg-orange-100">
                          Tiket Anda
                        </Link>
                      </li>
                    </ul>
                  </li>
                )}
              {userRole === 'adopter' && (
                <li><Link href="/hewan-adopsi" className={NAV_LINK}>Hewan Adopsi</Link></li>
              )}

              <li><Link href="/profile" className={NAV_LINK}>Profil</Link></li>
              <li>
                <Button variant="ghost" className="flex items-center px-3 py-2 hover:bg-green-600"  onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-1" />                  
                  Logout
                </Button>
              </li>
            </>
          )}
        </ul>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 rounded hover:bg-green-600"
          onClick={() => setOpen(o => !o)}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <ul className="md:hidden bg-[#FF912F] px-4 pb-4 space-y-1">
          {!user ? (
            <>
              <li>
                <Link href="/auth/login" className={NAV_LINK} onClick={() => setOpen(false)}>
                  Login
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className={NAV_LINK} onClick={() => setOpen(false)}>
                  Register
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link href="/dashboard" className={NAV_LINK} onClick={() => setOpen(false)}>
                  Dashboard
                </Link>
              </li>

              {userRole === 'dokter_hewan' && (
                <>
                  <li>
                    <Link href="/rekam-medis" className={NAV_LINK} onClick={() => setOpen(false)}>
                      Rekam Medis
                    </Link>
                  </li>
                  <li>
                    <Link href="/satwa" className={NAV_LINK} onClick={() => setOpen(false)}>
                      Data Satwa
                    </Link>
                  </li>
                  <li>
                    <Link href="/jadwal-pemeriksaan" className={NAV_LINK} onClick={() => setOpen(false)}>
                      Jadwal Periksa
                    </Link>
                  </li>
                </>
              )}

              {userRole === 'penjaga_hewan' && (
                <>
                  <li>
                    <Link href="/satwa" className={NAV_LINK} onClick={() => setOpen(false)}>
                      Data Satwa
                    </Link>
                  </li>
                  <li>
                    <Link href="/habitat" className={NAV_LINK} onClick={() => setOpen(false)}>
                      Data Habitat
                    </Link>
                  </li>
                  <li>
                    <Link href="/pemberian-pakan" className={NAV_LINK} onClick={() => setOpen(false)}>
                      Pemberian Pakan
                    </Link>
                  </li>
                </>
              )}

              {userRole === 'staf_admin' && (
                <>
                  <li>
                    <Link href="/satwa" className={NAV_LINK} onClick={() => setOpen(false)}>
                      Data Satwa
                    </Link>
                  </li>
                  <li>
                    <Link href="/habitat" className={NAV_LINK} onClick={() => setOpen(false)}>
                      Data Habitat
                    </Link>
                  </li>
                  <li>
                    <button
                      className={`${NAV_LINK} flex items-center justify-between w-full`}
                      onClick={(e) => {
                        // untuk toggle submenu bila mau mobile dropdown
                        const submenu = (e.currentTarget.nextElementSibling as HTMLElement)
                        submenu.classList.toggle('hidden')
                      }}
                    >
                      Kelola Fasilitas
                      <ChevronDown className="ml-1 w-4 h-4" />
                    </button>
                    <ul className="hidden pl-4 space-y-1">
                      <li>
                        <Link href="/wahana" className={NAV_LINK} onClick={() => setOpen(false)}>
                          Wahana
                        </Link>
                      </li>
                      <li>
                        <Link href="/atraksi" className={NAV_LINK} onClick={() => setOpen(false)}>
                          Atraksi
                        </Link>
                      </li>
                    </ul>
                  </li>
                  <li>
                    <Link href="/reservasi/admin" className={NAV_LINK} onClick={() => setOpen(false)}>
                      Kelola Reservasi
                    </Link>
                  </li>
                  <li>
                    <Link href="/kelola-adopsi" className={NAV_LINK} onClick={() => setOpen(false)}>
                      Kelola Adopsi
                    </Link>
                  </li>
                  <li>
                    <Link href="/kelola-adopter" className={NAV_LINK} onClick={() => setOpen(false)}>
                      Kelola Adopter
                    </Link>
                  </li>
                </>
              )}

              {userRole === 'pelatih_hewan' && (
                <li>
                  <Link href="/jadwal-pertunjukan" className={NAV_LINK} onClick={() => setOpen(false)}>
                    Jadwal Pertunjukan
                  </Link>
                </li>
              )}

              {userRole === 'pengunjung' && (
                <li>
                  <button
                    className={`${NAV_LINK} flex items-center justify-between w-full`}
                    onClick={(e) => {
                      const submenu = (e.currentTarget.nextElementSibling as HTMLElement)
                      submenu.classList.toggle('hidden')
                    }}
                  >
                    Reservasi
                    <ChevronDown className="ml-1 w-4 h-4" />
                  </button>
                  <ul className="hidden pl-4 space-y-1">
                    <li>
                      <Link href="/reservasi/booking" className={NAV_LINK} onClick={() => setOpen(false)}>
                        Booking Tiket
                      </Link>
                    </li>
                    <li>
                      <Link href="/reservasi/tiket-anda" className={NAV_LINK} onClick={() => setOpen(false)}>
                        Tiket Anda
                      </Link>
                    </li>
                  </ul>
                </li>
              )}

              {userRole === 'adopter' && (
                <li>
                  <Link href="/hewan-adopsi" className={NAV_LINK} onClick={() => setOpen(false)}>
                    Hewan Adopsi
                  </Link>
                </li>
              )}

              <li>
                <Link href="/profile" className={NAV_LINK} onClick={() => setOpen(false)}>
                  Profil
                </Link>
              </li>
              <li>
                <button
                  className={`${NAV_LINK} w-full text-left`}
                  onClick={() => {
                    signOut()
                    setOpen(false)
                  }}
                >
                  Logout
                </button>
              </li>
            </>
          )}
        </ul>
      )}
    </nav>
  )
}
