import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AutomationDetailClient } from "./automation-detail-client"

interface Props {
  params: Promise<{ id: string }>
}

export default async function AutomationDetailPage({ params }: Props) {
  const { id } = await params
  let automation = null
  let enrollments: {
    id: string
    contact_id: string
    status: string
    current_step_id: string | null
    current_step_index: number
    enrolled_at: string
    completed_at: string | null
    steps_completed: number
  }[] = []

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    const { data: member } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .single()

    if (member) {
      const { data } = await supabase
        .from("automations")
        .select("*")
        .eq("id", id)
        .eq("organization_id", member.organization_id)
        .single()

      if (data) {
        automation = data
      }

      const { data: enrollmentData } = await supabase
        .from("automation_enrollments")
        .select("id, contact_id, status, current_step_id, current_step_index, enrolled_at, completed_at, steps_completed")
        .eq("automation_id", id)
        .order("enrolled_at", { ascending: false })
        .limit(10)

      if (enrollmentData) {
        enrollments = enrollmentData
      }
    }
  } catch {
    // Fall through to client with null
  }

  return (
    <AutomationDetailClient
      automation={automation}
      enrollments={enrollments}
    />
  )
}
