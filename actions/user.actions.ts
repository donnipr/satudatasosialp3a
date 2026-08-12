'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function enforceAdminRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Anda harus masuk untuk melakukan aksi ini.')
  }

  // Check admin explicitly
  if (user.email === 'admin@dinsos.go.id') {
    return true
  }

  // Check profiles table for IAM & ADMIN role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'IAM & ADMIN') {
    throw new Error('Anda tidak memiliki izin untuk melakukan aksi ini.')
  }

  return true
}

export async function addUserAction(formData: any) {
  await enforceAdminRole()
  
  const { name, email, password, role, status } = formData

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: name,
      role: role
    }
  })

  if (error) {
    console.error('SUPABASE CREATE USER ERROR:', error)
    throw new Error(error.message)
  }

  // Since we also want to set status, and assuming the trigger creates the profile,
  // we might want to update the profile immediately to set the status if it's passed.
  if (data.user) {
    await supabaseAdmin.from('profiles').update({ status }).eq('id', data.user.id)
  }

  revalidatePath('/dashboard/users')
  return { success: true, message: 'User added successfully' }
}

export async function updateUserAction(userId: string, formData: any) {
  await enforceAdminRole()
  
  const { name, email, password, role, status } = formData

  // Update profiles table directly
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ full_name: name, role, status })
    .eq('id', userId)

  if (profileError) {
    console.error('SUPABASE PROFILE UPDATE ERROR:', profileError)
    throw new Error(profileError.message)
  }

  // Optional: Update the auth metadata and email/password if provided
  const updatePayload: any = {
    user_metadata: { full_name: name, role }
  }
  
  // if user changes password
  if (password && password.trim() !== '') {
    updatePayload.password = password
  }
  // if email needs to be changed
  if (email && email.trim() !== '') {
    updatePayload.email = email
    updatePayload.email_confirm = true
  }

  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, updatePayload)

  if (authError) {
    console.error('SUPABASE AUTH UPDATE ERROR:', authError)
    throw new Error(authError.message)
  }

  revalidatePath('/dashboard/users')
  return { success: true, message: 'User updated successfully' }
}

export async function deleteUserAction(userId: string) {
  await enforceAdminRole()
  
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  
  if (error) {
    console.error('SUPABASE DELETE USER ERROR:', error)
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/users')
  return { success: true, message: 'User deleted successfully' }
}
