import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      nama_depan: string
      nama_belakang: string
    }
  }
} 