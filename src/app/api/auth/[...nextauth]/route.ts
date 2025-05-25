import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getUserRole(username: string): Promise<string | null> {
  const roleChecks: [string, string, string][] = [
    ["pengunjung", "pengunjung", "username_p"],
    ["dokter_hewan", "dokter_hewan", "username_dh"],
    ["penjaga_hewan", "penjaga_hewan", "username_jh"],
    ["staf_admin", "staf_admin", "username_sa"],
    ["pelatih_hewan", "pelatih_hewan", "username_lh"],
  ]
  for (const [role, table, field] of roleChecks) {
    const { data } = await supabase.from(table).select("*").eq(field, username).single()
    if (data) return role
  }
  return null
}

interface CustomUser {
  id: string
  email: string
  nama_depan: string
  nama_belakang: string
  role: string
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Cek ke tabel pengguna
        const { data: user, error } = await supabase
          .from("pengguna")
          .select("*")
          .eq("email", credentials?.email)
          .eq("password", credentials?.password)
          .single()
        if (error || !user) return null

        // Cek role user
        const role = await getUserRole(user.username)
        if (!role) return null

        // Return user object untuk session
        return {
          id: user.username,
          email: user.email,
          nama_depan: user.nama_depan,
          nama_belakang: user.nama_belakang,
          role,
        }
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as CustomUser
        token.id = u.id
        token.email = u.email
        token.nama_depan = u.nama_depan
        token.nama_belakang = u.nama_belakang
        token.role = u.role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.nama_depan = token.nama_depan as string
        session.user.nama_belakang = token.nama_belakang as string
        (session.user as any).role = token.role as string
      }
      return session
    }
  },
  pages: { signIn: "/auth/login" }
})

export { handler as GET, handler as POST } 