import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/shortcutsToken'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const userId = verifyToken(token)
    if (!userId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const body = (await req.json()) as {
      title?: string
      amount?: number
      category?: string
      expenseDate?: string
    }
    const { title, amount, category, expenseDate } = body

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (amount === undefined || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
    }

    if (!category || typeof category !== 'string') {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/
    if (!expenseDate || typeof expenseDate !== 'string' || !datePattern.test(expenseDate)) {
      return NextResponse.json({ error: 'Valid expenseDate (YYYY-MM-DD) is required' }, { status: 400 })
    }

    // Initialize Supabase admin client using the service role key to insert under user's UUID
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false
      }
    })

    const { data, error } = await supabase
      .from('spese_personal_expense')
      .insert({
        user_id: userId,
        title: title.trim(),
        amount: Math.round(amount * 100), // convert Euros to cents (e.g. 12.50 -> 1250)
        category: category,
        expense_date: expenseDate
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, expense: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 })
  }
}
