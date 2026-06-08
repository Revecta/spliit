import crypto from 'crypto'

const SECRET = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'default-secret-key-for-shortcuts'

export function signToken(userId: string): string {
  const payload = JSON.stringify({
    userId,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 365 * 10 // 10 years expiration
  })
  const key = crypto.scryptSync(SECRET, 'salt', 32)
  const iv = Buffer.alloc(16, 0) // Static IV is safe enough for this specific token generation flow
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  let encrypted = cipher.update(payload, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return encrypted
}

export function verifyToken(token: string): string | null {
  try {
    const key = crypto.scryptSync(SECRET, 'salt', 32)
    const iv = Buffer.alloc(16, 0)
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    let decrypted = decipher.update(token, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    const parsed = JSON.parse(decrypted) as { userId: string; exp: number }
    if (parsed.exp < Date.now()) return null
    return parsed.userId
  } catch (e) {
    return null
  }
}
