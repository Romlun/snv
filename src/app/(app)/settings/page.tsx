"use client";

import { useEffect, useMemo, useState } from "react";
import { KeyRound, Loader2, Plus, Trash2, Users } from "lucide-react";
import { addTeamMember, deleteTeamMember, resetTeamMemberPassword } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";

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
    <div className="space-y-gutter">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-headline-lg font-semibold text-on-surface">
            Settings
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Manage team members and access roles.
          </p>
        </div>

        {isAdmin ? (
          <Button
            type="button"
            icon={Plus}
            onClick={() => {
              setShowAddUser(value => !value);
              setFormMessage(null);
              setError(null);
            }}
          >
            Add User
          </Button>
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

      <Card padding="lg" className="relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-primary-container" />
        <div className="pl-2">
          <div className="mb-6 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <h2 className="font-headline text-headline-md text-on-surface">
              Change Password
            </h2>
          </div>
          <form onSubmit={handleChangePassword} className="grid grid-cols-1 gap-gutter md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">
                New Password
              </label>
              <Input
                required
                type="password"
                minLength={6}
                variant="box"
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">
                Confirm New Password
              </label>
              <Input
                required
                type="password"
                minLength={6}
                variant="box"
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={changingPassword}>
                {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Change Password
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {showAddUser && isAdmin ? (
        <Card padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-primary-container" />
          <div className="pl-2">
            <div className="mb-6 flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              <h2 className="font-headline text-headline-md text-on-surface">
                Add Team Member
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-gutter md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">
                  Email
                </label>
                <Input
                  required
                  type="email"
                  variant="box"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">
                  Full Name
                </label>
                <Input
                  required
                  variant="box"
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">
                  Temporary Password
                </label>
                <Input
                  required
                  type="password"
                  minLength={6}
                  variant="box"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">
                  Role
                </label>
                <Select
                  variant="box"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as NewUserRole })}
                >
                  <option value="Staff">Staff</option>
                  <option value="Volunteer">Volunteer</option>
                </Select>
              </div>
              <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row">
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Create User
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowAddUser(false);
                    setFormData(initialFormData);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </Card>
      ) : null}

      <Card padding="none" className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-outline-variant/15 bg-surface-container/50 px-6 py-4">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="font-headline text-headline-md text-on-surface">
            Team Members
          </h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-on-surface-variant">Loading team members...</p>
          </div>
        ) : teamError ? (
          <div className="bg-red-50 p-8 text-center">
            <p className="text-red-600">Error loading settings: {teamError}</p>
            <button onClick={fetchTeamMembers} className="mt-4 text-sm font-bold text-red-700 underline">Try again</button>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Users className="h-8 w-8 text-on-surface-variant/50" />
            <p className="mt-4 text-on-surface-variant">No team members found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-outline-variant/15 bg-surface-container/40 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3 text-right">Role</th>
                  {isAdmin ? <th className="px-6 py-3 text-right">Action</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {teamMembers.map(member => {
                  const isCurrentUser = member.id === currentUserId;
                  const isSavingRole = savingRoleId === member.id;
                  const isDeletingMember = deletingMemberId === member.id;
                  return (
                    <tr key={member.id} className="transition-colors hover:bg-primary-container/5">
                      <td className="px-6 py-4 font-semibold text-on-surface">
                        {getDisplayName(member)}
                        {isCurrentUser ? <span className="ml-2 text-xs font-medium text-on-surface-variant">(You)</span> : null}
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant">{member.email}</td>
                      <td className="px-6 py-4 text-right">
                        {isAdmin && !isCurrentUser ? (
                          <div className="inline-flex items-center gap-2">
                            {isSavingRole ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : null}
                            <select
                              className="focus-ring rounded-lg border border-outline-variant/20 bg-surface px-3 py-1.5 text-sm text-on-surface outline-none transition-colors disabled:opacity-50"
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
                          <Badge variant="info">{member.role}</Badge>
                        )}
                      </td>
                      {isAdmin ? (
                        <td className="px-6 py-4 text-right">
                          {isCurrentUser ? (
                            <span className="text-xs font-medium text-on-surface-variant">Protected</span>
                          ) : (
                            <div className="inline-flex items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setShowResetPasswordId(member.id);
                                  setResetPasswordForm(initialPasswordFormData);
                                  setError(null);
                                  setFormMessage(null);
                                }}
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                                Reset Password
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteMember(member)}
                                disabled={isDeletingMember}
                              >
                                {isDeletingMember ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                Delete
                              </Button>
                            </div>
                          )}
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {isAdmin && showResetPasswordId ? (
        <Card padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-primary-container" />
          {(() => {
            const member = teamMembers.find(item => item.id === showResetPasswordId);
            if (!member) return null;

            return (
              <div className="space-y-6 pl-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  <h2 className="font-headline text-headline-md text-on-surface">
                    Reset Password for {getDisplayName(member)}
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-on-surface">
                      New Password
                    </label>
                    <Input
                      required
                      type="password"
                      minLength={6}
                      variant="box"
                      value={resetPasswordForm.newPassword}
                      onChange={e => setResetPasswordForm({ ...resetPasswordForm, newPassword: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-on-surface">
                      Confirm New Password
                    </label>
                    <Input
                      required
                      type="password"
                      minLength={6}
                      variant="box"
                      value={resetPasswordForm.confirmPassword}
                      onChange={e => setResetPasswordForm({ ...resetPasswordForm, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    disabled={resettingPasswordId === member.id}
                    onClick={() => handleResetPassword(member)}
                  >
                    {resettingPasswordId === member.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Save Password
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowResetPasswordId(null);
                      setResetPasswordForm(initialPasswordFormData);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            );
          })()}
        </Card>
      ) : null}
    </div>
  );
}
