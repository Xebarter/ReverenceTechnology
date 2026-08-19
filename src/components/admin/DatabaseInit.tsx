'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function DatabaseInit() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initializeDatabase = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      // Try to create the jobs table
      const { error: jobsError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS jobs (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            title text NOT NULL,
            description text NOT NULL,
            location text NOT NULL,
            employment_type text NOT NULL,
            salary_range text,
            responsibilities jsonb NOT NULL DEFAULT '[]'::jsonb,
            requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
            benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
            is_published boolean DEFAULT false,
            application_link text,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
          );
        `
      });

      if (jobsError) {
        // If RPC doesn't work, let's try a different approach
        console.log('RPC method failed, providing manual instructions instead');
        throw new Error('RPC method not available. Please use manual SQL commands below.');
      }

      // Enable RLS
      const { error: rlsError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;'
      });

      if (rlsError) {
        console.log('RLS enabling failed, continuing...');
      }

      // Create policies
      const { error: policyError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE POLICY "Published jobs are publicly readable"
            ON jobs
            FOR SELECT
            TO anon, authenticated
            USING (is_published = true);
            
          CREATE POLICY "Admins can manage jobs"
            ON jobs
            FOR ALL
            TO authenticated
            USING (true)
            WITH CHECK (true);
        `
      });

      if (policyError) {
        console.log('Policy creation failed, continuing...');
      }

      // Create indexes
      const { error: indexError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE INDEX IF NOT EXISTS idx_jobs_is_published ON jobs(is_published);
          CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
        `
      });

      if (indexError) {
        console.log('Index creation failed, continuing...');
      }

      setResult('Database initialization commands executed! Check the database to confirm tables were created.');
    } catch (err: any) {
      console.error('Database initialization error:', err);
      setError(`Database initialization failed: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="font-admin text-2xl text-ink-deep mb-4">Database Initialization</h1>
      
      <div className="bg-paper-2 border border-rule rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-ink-deep mb-2">Warning</h2>
        <p className="text-ink">
          This tool will attempt to create the necessary database tables if they don't exist.
          Make sure you have the proper administrative permissions before proceeding.
        </p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}
      
      {result && (
        <div className="bg-paper border border-rule text-ink px-4 py-3 rounded mb-4">
          <p><strong>Success:</strong> {result}</p>
        </div>
      )}
      
      <button
        onClick={initializeDatabase}
        disabled={loading}
        className={`px-4 py-2 rounded text-paper font-medium ${ loading ? 'bg-muted' : 'bg-ink hover:bg-ink-deep' }`}
      >
        {loading ? 'Initializing...' : 'Initialize Database Tables'}
      </button>
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Manual SQL Commands</h2>
        <p className="text-ink mb-2">
          If the automatic initialization doesn't work, you can manually run these commands in your Supabase SQL editor:
        </p>
        <pre className="bg-paper p-4 rounded text-sm overflow-auto max-h-96">
{`-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  location text NOT NULL,
  employment_type text NOT NULL,
  salary_range text,
  responsibilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
  benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_published boolean DEFAULT false,
  application_link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Published jobs are publicly readable"
  ON jobs
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);
  
CREATE POLICY "Admins can manage jobs"
  ON jobs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_is_published ON jobs(is_published);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);

-- Sample job data
INSERT INTO jobs (title, description, location, employment_type, salary_range, responsibilities, requirements, benefits, is_published)
VALUES 
  ('Senior Frontend Developer', 'We are looking for an experienced frontend developer to join our team and help build cutting-edge web applications for our clients in East Africa.', 'Kampala, Uganda (Remote available)', 'Full-time', '$1,200 - $1,800', '["Develop responsive web applications using React and TypeScript", "Collaborate with UX/UI designers to implement pixel-perfect interfaces", "Optimize applications for maximum speed and scalability", "Participate in code reviews and contribute to team knowledge sharing"]'::jsonb, '["3+ years of experience with React and TypeScript", "Strong knowledge of modern CSS and responsive design", "Experience with state management libraries (Redux, Context API)", "Familiarity with testing frameworks like Jest and React Testing Library"]'::jsonb, '["Competitive salary", "Flexible working hours", "Health insurance", "Professional development opportunities"]'::jsonb, true),
  ('DevOps Engineer', 'Join our infrastructure team to design and maintain our cloud-based solutions that power businesses across East Africa.', 'Kampala, Uganda (Remote available)', 'Full-time', '$1,500 - $2,200', '["Design and implement CI/CD pipelines", "Manage cloud infrastructure on AWS/GCP", "Monitor and optimize system performance", "Ensure security and compliance of our infrastructure"]'::jsonb, '["3+ years of DevOps experience", "Strong knowledge of Docker and Kubernetes", "Experience with cloud platforms (AWS, GCP)", "Proficiency in Infrastructure as Code tools (Terraform)"]'::jsonb, '["Competitive salary", "Remote work options", "Learning budget for conferences and courses", "Stock options"]'::jsonb, true)
ON CONFLICT DO NOTHING;`}
        </pre>
      </div>
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Next Steps</h2>
        <ol className="list-decimal pl-5 space-y-2 text-ink">
          <li>Run the initialization command or manually execute the SQL commands above</li>
          <li>Navigate to the <a href="/admin/database-test" className="text-ink hover:underline">Database Test</a> page to verify the tables were created</li>
          <li>Try accessing the <a href="/admin/careers" className="text-ink hover:underline">Careers Management</a> page again</li>
        </ol>
      </div>
    </div>
  );
}