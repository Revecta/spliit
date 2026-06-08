'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase'
import { useUser } from '@/lib/useUser'

export interface PersonalExpense {
  id: string
  title: string
  amount: number // in cents
  category: string
  expenseDate: string // YYYY-MM-DD
  createdAt?: string
}

export function usePersonalExpenses() {
  const { user, loading: userLoading } = useUser()
  const [expenses, setExpenses] = useState<PersonalExpense[]>([])
  const [monthlyLimit, setMonthlyLimit] = useState<number>(60000) // 600€ in cents
  const [loading, setLoading] = useState(true)

  // Local storage helpers
  const getLocalData = useCallback(() => {
    try {
      const storedExpenses = localStorage.getItem('spese_personal_expenses')
      const storedLimit = localStorage.getItem('spese_personal_limit')
      
      if (storedExpenses) {
        setExpenses(JSON.parse(storedExpenses) as PersonalExpense[])
      } else {
        setExpenses([])
      }
      
      if (storedLimit) {
        setMonthlyLimit(Number(storedLimit))
      } else {
        setMonthlyLimit(60000)
      }
    } catch (e) {
      console.error('Error reading localStorage:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  // Sync / Load data
  useEffect(() => {
    if (userLoading) return

    if (!user) {
      // Anonymous flow: load from local storage
      getLocalData()
      return
    }

    const userId = user.id

    // Authenticated flow: load from Supabase
    const supabase = getSupabaseBrowser()
    if (!supabase) {
      getLocalData()
      return
    }

    setLoading(true)

    async function loadFromSupabase() {
      try {
        // Fetch budget limit
        const { data: budgetData, error: budgetError } = await supabase!
          .from('spese_personal_budget')
          .select('monthly_limit')
          .eq('user_id', userId)
          .single()

        if (budgetData) {
          setMonthlyLimit(budgetData.monthly_limit)
        } else if (budgetError && budgetError.code === 'PGRST116') {
          // Record not found, insert default limit
          await supabase!.from('spese_personal_budget').insert({
            user_id: userId,
            monthly_limit: 60000
          })
          setMonthlyLimit(60000)
        }

        // Fetch personal expenses
        const { data: expenseData, error: expenseError } = await supabase!
          .from('spese_personal_expense')
          .select('*')
          .eq('user_id', userId)
          .order('expense_date', { ascending: false })

        if (expenseData) {
          setExpenses(
            expenseData.map((exp: any) => ({
              id: exp.id,
              title: exp.title,
              amount: exp.amount,
              category: exp.category,
              expenseDate: exp.expense_date,
              createdAt: exp.created_at,
            }))
          )
        }
      } catch (e) {
        console.error('Error loading from Supabase:', e)
        // Fallback to local
        getLocalData()
      } finally {
        setLoading(false)
      }
    }

    loadFromSupabase()
  }, [user, userLoading, getLocalData])

  // Save budget limit
  const updateMonthlyLimit = useCallback(async (newLimitCents: number) => {
    setMonthlyLimit(newLimitCents)
    if (!user) {
      localStorage.setItem('spese_personal_limit', String(newLimitCents))
      return
    }

    const supabase = getSupabaseBrowser()
    if (!supabase) return

    try {
      await supabase.from('spese_personal_budget').upsert({
        user_id: user.id,
        monthly_limit: newLimitCents,
        updated_at: new Date().toISOString(),
      })
    } catch (e) {
      console.error('Error updating budget limit in Supabase:', e)
    }
  }, [user])

  // Add expense
  const addExpense = useCallback(async (expense: Omit<PersonalExpense, 'id'>) => {
    const tempId = typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(2)
    const newExpense: PersonalExpense = {
      ...expense,
      id: tempId,
      createdAt: new Date().toISOString()
    }

    // Update local state first (optimistic update)
    setExpenses(prev => [newExpense, ...prev])

    if (!user) {
      // Local storage sync
      const stored = localStorage.getItem('spese_personal_expenses')
      const currentList = stored ? (JSON.parse(stored) as PersonalExpense[]) : []
      localStorage.setItem('spese_personal_expenses', JSON.stringify([newExpense, ...currentList]))
      return newExpense
    }

    const supabase = getSupabaseBrowser()
    if (!supabase) return newExpense

    try {
      const { data, error } = await supabase
        .from('spese_personal_expense')
        .insert({
          user_id: user.id,
          title: expense.title,
          amount: expense.amount,
          category: expense.category,
          expense_date: expense.expenseDate,
        })
        .select()
        .single()

      if (data) {
        // Replace optimistic entry with database entry
        const dbExpense: PersonalExpense = {
          id: data.id,
          title: data.title,
          amount: data.amount,
          category: data.category,
          expenseDate: data.expense_date,
          createdAt: data.created_at
        }
        setExpenses(prev => prev.map(item => item.id === tempId ? dbExpense : item))
        return dbExpense
      }
    } catch (e) {
      console.error('Error saving expense to Supabase:', e)
    }

    return newExpense
  }, [user])

  // Delete expense
  const deleteExpense = useCallback(async (id: string) => {
    setExpenses(prev => prev.filter(item => item.id !== id))

    if (!user) {
      const stored = localStorage.getItem('spese_personal_expenses')
      if (stored) {
        const currentList = JSON.parse(stored) as PersonalExpense[]
        localStorage.setItem('spese_personal_expenses', JSON.stringify(currentList.filter((item: PersonalExpense) => item.id !== id)))
      }
      return
    }

    const supabase = getSupabaseBrowser()
    if (!supabase) return

    try {
      await supabase
        .from('spese_personal_expense')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
    } catch (e) {
      console.error('Error deleting expense in Supabase:', e)
    }
  }, [user])

  return {
    expenses,
    monthlyLimit,
    loading: loading || userLoading,
    updateMonthlyLimit,
    addExpense,
    deleteExpense,
    user,
  }
}
