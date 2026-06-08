import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/supabaseServer'
import { signToken } from '@/lib/shortcutsToken'

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const token = signToken(user.id)
  return NextResponse.json({ token })
}
