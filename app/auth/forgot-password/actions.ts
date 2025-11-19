'use server'

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function resetPassword(formData: FormData) {
  const email = formData.get('email') as string 
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/update-password`,
  })

  if (error) {
    return redirect('/auth/forgot-password?error=true&error_description=Could not send reset email')
  }

  return redirect('/auth/forgot-password?reset=true')
}
