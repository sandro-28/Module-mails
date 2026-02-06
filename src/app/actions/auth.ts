'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { generateSlug } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface AuthResult {
  error?: string
}

/* -------------------------------------------------------------------------- */
/*  Sign In                                                                   */
/* -------------------------------------------------------------------------- */

export async function signIn(formData: FormData): Promise<AuthResult> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Invalid email or password.' }
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Please verify your email address before signing in.' }
    }
    return { error: error.message }
  }

  redirect('/dashboard')
}

/* -------------------------------------------------------------------------- */
/*  Sign Up                                                                   */
/* -------------------------------------------------------------------------- */

export async function signUp(formData: FormData): Promise<AuthResult> {
  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const organizationName = formData.get('organizationName') as string

  // Validation
  if (!fullName || !email || !password || !confirmPassword || !organizationName) {
    return { error: 'All fields are required.' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters long.' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  const supabase = await createClient()

  // Create the user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      return { error: 'An account with this email already exists.' }
    }
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Failed to create account. Please try again.' }
  }

  // Use the admin client to create org and membership (bypasses RLS)
  const adminSupabase = createAdminClient()

  const slug = generateSlug(organizationName)

  // Check if slug already exists and make it unique if needed
  const { data: existingOrg } = await adminSupabase
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single()

  const finalSlug = existingOrg
    ? `${slug}-${Date.now().toString(36)}`
    : slug

  // Create the organization
  const { data: organization, error: orgError } = await adminSupabase
    .from('organizations')
    .insert({
      name: organizationName,
      slug: finalSlug,
      plan: 'free',
    })
    .select()
    .single()

  if (orgError || !organization) {
    console.error('Failed to create organization:', orgError)
    return { error: 'Account created but failed to set up organization. Please contact support.' }
  }

  // Create the organization membership with owner role
  const { error: memberError } = await adminSupabase
    .from('organization_members')
    .insert({
      organization_id: organization.id,
      user_id: authData.user.id,
      role: 'owner',
    })

  if (memberError) {
    console.error('Failed to create membership:', memberError)
    return { error: 'Account created but failed to set up membership. Please contact support.' }
  }

  redirect('/verify-email')
}

/* -------------------------------------------------------------------------- */
/*  Sign Out                                                                  */
/* -------------------------------------------------------------------------- */

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

/* -------------------------------------------------------------------------- */
/*  Reset Password                                                            */
/* -------------------------------------------------------------------------- */

export async function resetPassword(formData: FormData): Promise<AuthResult> {
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Email is required.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  // Always return success to prevent email enumeration
  return {}
}

/* -------------------------------------------------------------------------- */
/*  Accept Invitation                                                         */
/* -------------------------------------------------------------------------- */

export async function acceptInvitation(token: string): Promise<AuthResult> {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to accept an invitation.' }
  }

  // Look up the invitation
  const { data: invitation, error: inviteError } = await adminSupabase
    .from('invitations')
    .select('*, organizations(name)')
    .eq('token', token)
    .eq('status', 'pending')
    .single()

  if (inviteError || !invitation) {
    return { error: 'Invalid or expired invitation.' }
  }

  // Check if the invitation email matches the logged-in user
  if (invitation.email !== user.email) {
    return { error: 'This invitation was sent to a different email address.' }
  }

  // Check if user is already a member
  const { data: existingMember } = await adminSupabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', invitation.organization_id)
    .eq('user_id', user.id)
    .single()

  if (existingMember) {
    // Update invitation status
    await adminSupabase
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id)

    return { error: 'You are already a member of this organization.' }
  }

  // Create the membership
  const { error: memberError } = await adminSupabase
    .from('organization_members')
    .insert({
      organization_id: invitation.organization_id,
      user_id: user.id,
      role: invitation.role,
    })

  if (memberError) {
    console.error('Failed to create membership from invitation:', memberError)
    return { error: 'Failed to join organization. Please try again.' }
  }

  // Update invitation status
  await adminSupabase
    .from('invitations')
    .update({ status: 'accepted' })
    .eq('id', invitation.id)

  redirect('/dashboard')
}

/* -------------------------------------------------------------------------- */
/*  Decline Invitation                                                        */
/* -------------------------------------------------------------------------- */

export async function declineInvitation(token: string): Promise<AuthResult> {
  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase
    .from('invitations')
    .update({ status: 'declined' })
    .eq('token', token)
    .eq('status', 'pending')

  if (error) {
    return { error: 'Failed to decline invitation.' }
  }

  redirect('/login')
}
