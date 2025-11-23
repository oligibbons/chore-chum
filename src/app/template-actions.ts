// src/app/template-actions.ts
'use server'

import { createSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { DbTemplate } from '@/types/database'

export type TemplateState = {
  success: boolean
  message: string
}

async function getHouseholdId() {
  const supabase = await createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('household_id')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) throw new Error('No household found')
  return { householdId: profile.household_id, userId: user.id }
}

export async function getTemplates(): Promise<DbTemplate[]> {
  const supabase = await createSupabaseClient()
  try {
    const { householdId } = await getHouseholdId()

    const { data, error } = await supabase
      .from('chore_templates')
      .select('*')
      .eq('household_id', householdId)
      .order('name', { ascending: true })

    if (error) throw error
    return (data || []) as DbTemplate[]
  } catch (error) {
    console.error('Error fetching templates:', error)
    return []
  }
}

export async function createTemplate(formData: FormData): Promise<TemplateState> {
  const supabase = await createSupabaseClient()
  
  try {
    const { householdId, userId } = await getHouseholdId()
    
    const name = formData.get('name') as string
    const rawSubtasks = formData.get('subtasks') as string
    
    if (!name || name.trim().length < 2) {
      return { success: false, message: 'Name is required' }
    }

    let subtasks: string[] = []
    try {
        subtasks = JSON.parse(rawSubtasks)
    } catch {
        subtasks = []
    }

    const { error } = await supabase
      .from('chore_templates')
      .insert({
        household_id: householdId,
        created_by: userId,
        name: name.trim(),
        subtasks: subtasks, // Supabase handles string[] to jsonb conversion usually, or we cast
        icon: 'Sparkles' // Default icon for now
      } as any)

    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true, message: 'Template saved!' }

  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to save template' }
  }
}

export async function deleteTemplate(templateId: number): Promise<TemplateState> {
  const supabase = await createSupabaseClient()
  
  try {
    const { error } = await supabase
      .from('chore_templates')
      .delete()
      .eq('id', templateId)

    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true, message: 'Template deleted' }
  } catch (error: any) {
    return { success: false, message: 'Failed to delete template' }
  }
}