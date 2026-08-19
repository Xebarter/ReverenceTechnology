'use client';

import { useState, useEffect } from 'react';
import { authJson } from '../../lib/authFetch';

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      const data = await authJson<{ users: AdminUser[] }>('/api/admin/users');
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      setMessage({ type: 'error', text: 'Failed to load admin users' });
    } finally {
      setLoading(false);
    }
  };

  const addAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authJson('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ email, full_name: fullName || null }),
      });
      setMessage({ type: 'success', text: 'Admin user added successfully' });
      setEmail('');
      setFullName('');
      fetchAdminUsers();
    } catch (error) {
      console.error('Error adding admin user:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to add admin user',
      });
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await authJson('/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify({ id: userId, is_active: !currentStatus }),
      });
      setMessage({
        type: 'success',
        text: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
      fetchAdminUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      setMessage({ type: 'error', text: 'Failed to update user status' });
    }
  };

  const removeAdminUser = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Are you sure you want to remove ${userEmail} as an admin?`)) {
      return;
    }
    try {
      await authJson(`/api/admin/users?id=${encodeURIComponent(userId)}`, { method: 'DELETE' });
      setMessage({ type: 'success', text: 'Admin user removed successfully' });
      fetchAdminUsers();
    } catch (error) {
      console.error('Error removing admin user:', error);
      setMessage({ type: 'error', text: 'Failed to remove admin user' });
    }
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-admin text-2xl text-ink-deep sm:text-3xl">User Management</h1>
        </div>
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-ink" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-admin text-2xl text-ink-deep sm:text-3xl">User Management</h1>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-md p-4 ${message.type === 'success' ? 'bg-paper text-ink' : 'bg-red-50 text-red-800'}`}
        >
          {message.text}
        </div>
      )}

      <div className="mb-8 border border-rule bg-surface p-6">
        <h2 className="mb-4 text-lg font-medium text-ink-deep">Add New Admin User</h2>
        <form onSubmit={addAdminUser} className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full border border-rule bg-surface px-3 py-2 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink sm:text-sm"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-ink">
              Full Name (Optional)
            </label>
            <input
              type="text"
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full border border-rule bg-surface px-3 py-2 focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink sm:text-sm"
              placeholder="John Doe"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-ink px-4 py-2.5 text-sm font-medium text-paper hover:bg-ink-deep focus:outline-none focus:ring-1 focus:ring-ink sm:w-auto"
            >
              Add Admin User
            </button>
          </div>
        </form>
      </div>

      <div className="border border-rule bg-surface">
        <div className="border-b border-rule px-6 py-5">
          <h2 className="text-lg font-medium text-ink-deep">Current Admin Users</h2>
        </div>
        <ul className="divide-y divide-rule">
          {users.map((user) => (
            <li key={user.id} className="px-6 py-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-paper">
                    <span className="font-medium text-ink">
                      {user.full_name ? user.full_name.charAt(0) : user.email.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-ink-deep">{user.full_name || 'No name provided'}</h3>
                    <p className="text-sm text-muted">{user.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      user.is_active ? 'bg-paper text-ink' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => toggleUserStatus(user.id, user.is_active)}
                    className="inline-flex items-center rounded-md border border-rule bg-surface px-3 py-1 text-sm font-medium text-ink hover:bg-paper focus:outline-none focus:ring-1 focus:ring-ink"
                  >
                    {user.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => removeAdminUser(user.id, user.email)}
                    className="inline-flex items-center rounded-md border border-transparent px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
