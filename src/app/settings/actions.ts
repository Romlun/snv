"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type TeamMemberRole = 'Staff' | 'Volunteer';
type ProfileRole = 'Admin' | 'Staff' | 'Volunteer';

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

interface AdminCaller {
  id: string;
  org_id: string | null;
}

function validateRole(role: string): role is TeamMemberRole {
  return role === 'Staff' || role === 'Volunteer';
}

async function getAdminCaller(): Promise<{ supabase: Awaited<ReturnType<typeof createClient>>; caller?: AdminCaller; error?: string }> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { supabase, error: "You must be signed in to manage team members." };
  }

  const { data: callerProfile, error: callerProfileError } = await supabase
    .from('profiles')
    .select('role, org_id')
    .eq('id', user.id)
    .single();

  if (callerProfileError || callerProfile?.role !== 'Admin') {
    return { supabase, error: "Only Admins can manage team members." };
  }

  return {
    supabase,
    caller: {
      id: user.id,
      org_id: callerProfile.org_id || null,
    },
  };
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

    const { error: callerError } = await getAdminCaller();
    if (callerError) {
      return { success: false, error: callerError };
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

export async function deleteTeamMember(userId: string): Promise<AddTeamMemberResult> {
  try {
    if (!userId) {
      return { success: false, error: "Missing team member id." };
    }

    const { supabase, caller, error: callerError } = await getAdminCaller();
    if (callerError || !caller) {
      return { success: false, error: callerError || "Only Admins can manage team members." };
    }

    if (userId === caller.id) {
      return { success: false, error: "You cannot delete your own account." };
    }

    const { data: targetProfile, error: targetError } = await supabase
      .from('profiles')
      .select('id, role, org_id')
      .eq('id', userId)
      .single();

    if (targetError || !targetProfile) {
      return { success: false, error: "Team member not found." };
    }

    if (targetProfile.org_id !== caller.org_id) {
      return { success: false, error: "Team member not found." };
    }

    const targetRole = targetProfile.role as ProfileRole;
    if (targetRole === 'Admin') {
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', caller.org_id)
        .eq('role', 'Admin');

      if (countError) {
        return { success: false, error: countError.message };
      }

      if ((count || 0) <= 1) {
        return { success: false, error: "Cannot delete the last Admin." };
      }
    }

    const supabaseAdmin = createAdminClient();
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    revalidatePath('/settings');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unable to delete team member." };
  }
}
