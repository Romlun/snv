"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type TeamMemberRole = 'Staff' | 'Volunteer';

interface AddTeamMemberInput {
  email: string;
  full_name: string;
  password: string;
  role: TeamMemberRole;
}

interface AddTeamMemberResult {
  success: boolean;
  error?: string;
}

function validateRole(role: string): role is TeamMemberRole {
  return role === 'Staff' || role === 'Volunteer';
}

export async function addTeamMember(input: AddTeamMemberInput): Promise<AddTeamMemberResult> {
  try {
    const email = input.email.trim();
    const fullName = input.full_name.trim();
    const password = input.password;
    const role = input.role;

    if (!email || !fullName || !password) {
      return { success: false, error: "Email, full name, and temporary password are required." };
    }

    if (!validateRole(role)) {
      return { success: false, error: "Role must be Staff or Volunteer." };
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "You must be signed in to add a team member." };
    }

    const { data: callerProfile, error: callerProfileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (callerProfileError || callerProfile?.role !== 'Admin') {
      return { success: false, error: "Only Admins can add team members." };
    }

    const supabaseAdmin = createAdminClient();
    const { data: createdUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createUserError || !createdUser.user) {
      return { success: false, error: createUserError?.message || "Unable to create user." };
    }

    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: fullName,
        role,
      })
      .eq('id', createdUser.user.id)
      .select('id')
      .single();

    if (profileUpdateError) {
      return { success: false, error: profileUpdateError.message };
    }

    revalidatePath('/settings');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unable to add team member." };
  }
}
