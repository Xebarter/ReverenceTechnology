'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function DatabaseTest() {
  const [tables, setTables] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkDatabase();
  }, []);

  const checkDatabase = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check what tables exist
      const { data: tableData, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (tableError) {
        throw new Error(`Error fetching tables: ${tableError.message}`);
      }
      
      setTables(tableData || []);
      
      // Check if jobs table exists and has data
      try {
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select('*')
          .limit(5);
        
        if (jobError) {
          setError(`Jobs table error: ${jobError.message}`);
        } else {
          setJobs(jobData || []);
        }
      } catch (jobErr: any) {
        setError(`Error accessing jobs table: ${jobErr.message || jobErr}`);
      }
    } catch (err: any) {
      console.error('Database check error:', err);
      setError(`Database check failed: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const refreshSchema = async () => {
    try {
      setRefreshing(true);
      // Try to reload the schema
      const { error } = await supabase.rpc('reload_schema');
      if (error) {
        // If the RPC function doesn't exist, try a different approach
        console.log('Schema reload RPC not available, checking database again...');
      }
      // Wait a bit for changes to take effect
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Check database again
      await checkDatabase();
    } catch (err) {
      console.error('Error refreshing schema:', err);
      setError('Failed to refresh schema');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper p-4">
      <div className="max-w-4xl w-full border border-rule bg-surface p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-admin text-2xl text-ink-deep">Database Connection Test</h1>
          <button
            onClick={refreshSchema}
            disabled={refreshing}
            className="px-4 py-2 bg-ink text-paper rounded hover:bg-ink-deep disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh Schema'}
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p><strong>Error:</strong> {error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ink"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Database Tables</h2>
              {tables.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {tables.map((table, index) => (
                    <li key={index} className={`text-ink ${table.table_name === 'jobs' ? 'font-bold text-ink' : ''}`}>
                      {table.table_name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No tables found</p>
              )}
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-2">Jobs Table Data</h2>
              {jobs.length > 0 ? (
                <div>
                  <p className="mb-2 text-ink font-medium">Found {jobs.length} job(s)</p>
                  <pre className="bg-paper p-4 rounded text-sm overflow-auto max-h-64">
                    {JSON.stringify(jobs, null, 2)}
                  </pre>
                </div>
              ) : (
                <p className="text-muted">No jobs found or jobs table doesn't exist</p>
              )}
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-2">Instructions</h2>
              <div className="bg-paper-2 border border-rule p-4 rounded">
                <p className="text-ink-deep mb-2">
                  If you're seeing errors about missing tables:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-ink-deep">
                  <li>Make sure you've run all database migrations</li>
                  <li>If using Supabase CLI, run: <code className="bg-paper px-1 rounded">supabase db push</code></li>
                  <li>If using Supabase dashboard, manually run the SQL files in the <code className="bg-paper px-1 rounded">supabase/migrations</code> folder</li>
                  <li>Click "Refresh Schema" button above to reload the database schema cache</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}