'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function TestAdminUsers() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminUsers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('admin_users')
          .select('*');

        if (error) {
          setError(error.message);
          console.error('Error fetching admin users:', error);
        } else {
          setData(data || []);
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminUsers();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper p-4">
      <div className="max-w-2xl w-full border border-rule bg-surface p-6">
        <h1 className="font-admin text-2xl text-ink-deep mb-4">Admin Users Test</h1>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink mx-auto"></div>
            <p className="mt-4 text-muted">Loading admin users...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h2 className="text-lg font-semibold text-red-800">Error</h2>
            <p className="text-red-700 mt-2">{error}</p>
            <p className="text-red-600 mt-4 text-sm">
              This error indicates that either the admin_users table doesn't exist or there's a permission issue.
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold text-ink mb-2">
              Found {data.length} admin user(s)
            </h2>
            {data.length > 0 ? (
              <div className="space-y-3">
                {data.map((user) => (
                  <div key={user.id} className="border border-rule rounded-md p-4">
                    <p className="font-medium">{user.full_name || 'No name'}</p>
                    <p className="text-muted">{user.email}</p>
                    <p className="text-sm text-muted">
                      Active: {user.is_active ? 'Yes' : 'No'} | 
                      Created: {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-paper-2 border border-rule rounded-md p-4">
                <h3 className="font-medium text-ink-deep">No admin users found</h3>
                <p className="text-ink mt-1">
                  The admin_users table exists but is empty. You'll need to add admin users to access the dashboard.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}