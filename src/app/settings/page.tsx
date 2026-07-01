"use client";

import { useEffect, useMemo, useState } from "react";
import { KeyRound, Loader2, Plus, Trash2, Users } from "lucide-react";
import { addTeamMember, deleteTeamMember, resetTeamMemberPassword } from "./actions";
import { createClient } from "@/lib/supabase/client";

type TeamMemberRole = 'Admin' | 'Staff' | 'Volunteer';
type NewUserRole = 'Staff' | 'Volunteer';

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string;
  role: TeamMemberRole;
}

interface AddUserFormData {
  email: string;
  full_name: string;
  password: string;
  role: NewUserRole;
}

interface PasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

const initialFormData: AddUserFormData = {
  email: "",
  full_name: "",
  password: "",
  role: "Staff",
};

const initialPasswordFormData: PasswordFormData = {
  newPassword: "",
  confirmPassword: "",
};

const teamMemberRoles: TeamMemberRole[] = ['Admin', 'Staff', 'Volunteer'];

function getDisplayName(member: TeamMember) {
  return member.full_name || member.email;
}

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [formData, setFormData] = useState<AddUserFormData>(initialFormData);
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>(initialPasswordFormData);
  const [resetPasswordForm, setResetPasswordForm] = useState<PasswordFormData>(initialPasswordFormData);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [resettingPasswordId, setResettingPasswordId] = useState<string | null>(null);
  const [showResetPasswordId, setShowResetPasswordId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  async function fetchTeamMembers() {
    try {
      setLoading(true);
      setTeamError(null);

      const { data: authData } = await supabase.auth.getUser();

      setCurrentUserId(authData.user?.id || null);

      if (authData.user) {
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();
        const userIsAdmin = currentProfile?.role === 'Admin';
        setIsAdmin(userIsAdmin);

        if (userIsAdmin) {
          const { data: members, error: membersError } = await supabase
            .from('profiles')
            .select('id, full_name, email, role')
            .order('full_name', { ascending: true, nullsFirst: false });

          if (membersError) throw membersError;
          setTeamMembers((members || []) as TeamMember[]);
        } else {
          setTeamMembers([]);
        }
      } else {
        setIsAdmin(false);
        setTeamMembers([]);
      }
    } catch (err) {
      setTeamError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTeamMembers();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMessage(null);
    setError(null);

    try {
      const result = await addTeamMember(formData);

      if (!result.success) {
        setError(result.error || "Unable to add team member.");
        return;
      }

      setFormData(initialFormData);
      setShowAddUser(false);
      setFormMessage("Team member created.");
      await fetchTeamMembers();
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setError(null);
    setPasswordMessage(null);

    try {
      if (passwordForm.newPassword.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (updateError) throw updateError;

      setPasswordForm(initialPasswordFormData);
      setPasswordMessage("Password updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleRoleChange = async (member: TeamMember, role: TeamMemberRole) => {
    if (!isAdmin || member.id === currentUserId || member.role === role) return;

    const previousRole = member.role;
    setSavingRoleId(member.id);
    setError(null);
    setFormMessage(null);
    setTeamMembers(prev => prev.map(item => item.id === member.id ? { ...item, role } : item));

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', member.id);

      if (updateError) throw updateError;
      setFormMessage("Role updated.");
    } catch (err) {
      setTeamMembers(prev => prev.map(item => item.id === member.id ? { ...item, role: previousRole } : item));
      setError(err instanceof Error ? err.message : "Error updating role");
    } finally {
      setSavingRoleId(null);
    }
  };

  const handleDeleteMember = async (member: TeamMember) => {
    if (!isAdmin || member.id === currentUserId) return;

    const confirmed = window.confirm(`Are you sure you want to delete ${getDisplayName(member)}? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingMemberId(member.id);
    setError(null);
    setFormMessage(null);

    try {
      const result = await deleteTeamMember(member.id);

      if (!result.success) {
        setError(result.error || "Unable to delete team member.");
        return;
      }

      setFormMessage("Team member deleted.");
      await fetchTeamMembers();
    } finally {
      setDeletingMemberId(null);
    }
  };

  const handleResetPassword = async (member: TeamMember) => {
    if (!isAdmin) return;

    setResettingPasswordId(member.id);
    setError(null);
    setFormMessage(null);

    try {
      if (resetPasswordForm.newPassword.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }

      if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      const result = await resetTeamMemberPassword(member.id, resetPasswordForm.newPassword);

      if (!result.success) {
        setError(result.error || "Unable to reset password.");
        return;
      }

      setResetPasswordForm(initialPasswordFormData);
      setShowResetPasswordId(null);
      setFormMessage(`Password updated. Share it with ${getDisplayName(member)} directly - it won't be shown again.`);
    } finally {
      setResettingPasswordId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-zinc-500">Manage team members and access roles.</p>
        </div>
        {isAdmin ? (
          <button
            type="button"
            onClick={() => {
              setShowAddUser(value => !value);
              setFormMessage(null);
              setError(null);
            }}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>
        ) : null}
      </div>

      {formMessage ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {formMessage}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {passwordMessage ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {passwordMessage}
        </div>
      ) : null}

      <section className="bg-white border rounded-xl p-6 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-zinc-400" />
          <h2 className="font-semibold">Change Password</h2>
        </div>
        <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">New Password</label>
            <input
              required
              type="password"
              minLength={6}
              className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
              value={passwordForm.newPassword}
              onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm New Password</label>
            <input
              required
              type="password"
              minLength={6}
              className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
              value={passwordForm.confirmPassword}
              onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={changingPassword}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {changingPassword ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Change Password
            </button>
          </div>
        </form>
      </section>

      {showAddUser && isAdmin ? (
        <section className="bg-white border rounded-xl p-6 dark:bg-zinc-900 dark:border-zinc-800">
          <h2 className="font-semibold mb-4">Add Team Member</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input
                required
                type="email"
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <input
                required
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.full_name}
                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Temporary Password</label>
              <input
                required
                type="password"
                minLength={6}
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <select
                className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value as NewUserRole })}
              >
                <option value="Staff">Staff</option>
                <option value="Volunteer">Volunteer</option>
              </select>
            </div>
            <div className="md:col-span-2 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Create User
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddUser(false);
                  setFormData(initialFormData);
                }}
                className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="bg-white border rounded-xl overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
        <div className="p-4 border-b bg-zinc-50 dark:bg-zinc-800/50 dark:border-zinc-800 flex items-center gap-2">
          <Users className="h-4 w-4 text-zinc-400" />
          <h2 className="font-semibold">Team Members</h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="mt-4 text-zinc-500">Loading team members...</p>
          </div>
        ) : teamError ? (
          <div className="p-8 text-center bg-red-50">
            <p className="text-red-600">Error loading settings: {teamError}</p>
            <button onClick={fetchTeamMembers} className="mt-4 text-sm font-bold text-red-700 underline">Try again</button>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Users className="h-8 w-8 text-zinc-300" />
            <p className="mt-4 text-zinc-500">No team members found.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b dark:bg-zinc-800/50 dark:border-zinc-800 text-zinc-500 font-medium">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3 text-right">Role</th>
                {isAdmin ? <th className="px-6 py-3 text-right">Action</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-zinc-800">
              {teamMembers.map(member => {
                const isCurrentUser = member.id === currentUserId;
                const isSavingRole = savingRoleId === member.id;
                const isDeletingMember = deletingMemberId === member.id;

                return (
                  <tr key={member.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-50">
                      {getDisplayName(member)}
                      {isCurrentUser ? <span className="ml-2 text-xs font-medium text-zinc-500">(You)</span> : null}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{member.email}</td>
                    <td className="px-6 py-4 text-right">
                      {isAdmin && !isCurrentUser ? (
                        <div className="inline-flex items-center gap-2">
                          {isSavingRole ? <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> : null}
                          <select
                            className="px-3 py-1.5 border rounded-lg text-sm dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                            value={member.role}
                            disabled={isSavingRole}
                            onChange={e => handleRoleChange(member, e.target.value as TeamMemberRole)}
                          >
                            {teamMemberRoles.map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {member.role}
                        </span>
                      )}
                    </td>
                    {isAdmin ? (
                      <td className="px-6 py-4 text-right">
                        {isCurrentUser ? (
                          <span className="text-xs font-medium text-zinc-500">Protected</span>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowResetPasswordId(member.id);
                                setResetPasswordForm(initialPasswordFormData);
                                setError(null);
                                setFormMessage(null);
                              }}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                              Reset Password
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMember(member)}
                              disabled={isDeletingMember}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:hover:bg-red-950/20"
                            >
                              {isDeletingMember ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
      {isAdmin && showResetPasswordId ? (
        <section className="bg-white border rounded-xl p-6 dark:bg-zinc-900 dark:border-zinc-800">
          {(() => {
            const member = teamMembers.find(item => item.id === showResetPasswordId);
            if (!member) return null;

            return (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-zinc-400" />
                  <h2 className="font-semibold">Reset Password for {getDisplayName(member)}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">New Password</label>
                    <input
                      required
                      type="password"
                      minLength={6}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                      value={resetPasswordForm.newPassword}
                      onChange={e => setResetPasswordForm({ ...resetPasswordForm, newPassword: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Confirm New Password</label>
                    <input
                      required
                      type="password"
                      minLength={6}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
                      value={resetPasswordForm.confirmPassword}
                      onChange={e => setResetPasswordForm({ ...resetPasswordForm, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    disabled={resettingPasswordId === member.id}
                    onClick={() => handleResetPassword(member)}
                    className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {resettingPasswordId === member.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Save Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetPasswordId(null);
                      setResetPasswordForm(initialPasswordFormData);
                    }}
                    className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          })()}
        </section>
      ) : null}
    </div>
  );
}
