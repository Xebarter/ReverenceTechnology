import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { authJson } from '../lib/authFetch';
import { X, Upload, CheckCircle, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { useUser } from '../UserContext';
import { Button, FieldLabel, Input, Textarea } from './ui';

interface JobApplicationFormProps {
  jobId: string;
  jobTitle: string;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export default function JobApplicationForm({ jobId, jobTitle, onClose, onSubmitSuccess }: JobApplicationFormProps) {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    cover_letter: ''
  });

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const redirectToAuth = useMemo(() => `/auth?redirect=${encodeURIComponent(`/job/${jobId}?apply=1`)}`, [jobId]);

  useEffect(() => {
    if (!user) {
      setError('Please sign in to apply for this role.');
      return;
    }
    const userEmail = user.email || '';
    const userFullName = (user.user_metadata?.full_name as string | undefined) || '';
    setFormData(prev => ({
      ...prev,
      email: prev.email || userEmail,
      full_name: prev.full_name || userFullName
    }));
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

      if (!validTypes.includes(file.type)) {
        setError('Please upload a PDF or Word document');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setResumeFile(file);
      setError(null);
    }
  };

  const uploadResume = async () => {
    if (!resumeFile) return null;
    const fileExt = resumeFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, resumeFile);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('resumes')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!user) {
        setError('Please sign in to apply for this role.');
        return;
      }

      let resumeUrl = null;
      if (resumeFile) {
        setUploading(true);
        resumeUrl = await uploadResume();
        setUploading(false);
      }

      await authJson('/api/job-applications', {
        method: 'POST',
        body: JSON.stringify({
          job_id: jobId,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          cover_letter: formData.cover_letter,
          resume_url: resumeUrl,
        }),
      });

      setSuccess(true);
      setTimeout(() => {
        onSubmitSuccess();
        onClose();
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application.');
      setUploading(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-deep/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-md border border-rule bg-surface">

        <div className="flex items-center justify-between border-b border-rule bg-paper px-8 py-6">
          <div>
            <h2 className="font-serif text-xl font-medium text-ink-deep">Apply for Position</h2>
            <p className="text-sm font-medium text-muted">{jobTitle}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-2 text-muted transition-colors hover:bg-paper-2 hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-8">
          {success ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-md border border-rule bg-paper text-ink">
                <CheckCircle size={40} />
              </div>
              <h3 className="mb-2 font-serif text-2xl font-medium text-ink-deep">Application Sent!</h3>
              <p className="mx-auto max-w-xs text-muted">
                Thank you for applying. Our talent team will review your profile and contact you shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle size={18} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              {!user && (
                <div className="rounded-md border border-rule bg-paper px-4 py-4 text-sm font-medium text-ink">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>To submit an application, you need an account.</div>
                    <a
                      href={redirectToAuth}
                      className="rounded-md bg-ink px-4 py-2 font-medium text-paper hover:bg-ink-deep"
                    >
                      Sign in / Create account
                    </a>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="app-full-name">Full Name</FieldLabel>
                  <Input
                    required
                    id="app-full-name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="app-email">Email Address</FieldLabel>
                  <Input
                    required
                    type="email"
                    id="app-email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <FieldLabel htmlFor="app-phone">Phone Number</FieldLabel>
                <Input
                  type="tel"
                  id="app-phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+256..."
                />
              </div>

              <div>
                <FieldLabel>Resume / CV</FieldLabel>
                <label
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed p-6 transition-all ${resumeFile
                      ? 'border-ink bg-paper'
                      : 'border-rule bg-paper hover:border-ink'
                    }`}
                >
                  <input type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.doc,.docx" />
                  {resumeFile ? (
                    <div className="flex items-center gap-3 text-ink">
                      <FileText size={28} />
                      <div className="text-left">
                        <p className="max-w-[200px] truncate text-sm font-medium">{resumeFile.name}</p>
                        <p className="text-[10px] uppercase tracking-[0.16em] text-muted">Click to replace</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="mb-2 text-muted" size={24} />
                      <p className="text-sm font-medium text-ink">Click to upload or drag and drop</p>
                      <p className="mt-1 text-xs text-muted">PDF or Word (Max 5MB)</p>
                    </>
                  )}
                </label>
              </div>

              <div>
                <FieldLabel htmlFor="app-cover">Cover Letter (Optional)</FieldLabel>
                <Textarea
                  rows={4}
                  id="app-cover"
                  name="cover_letter"
                  value={formData.cover_letter}
                  onChange={handleInputChange}
                  placeholder="Tell us why you're a great fit..."
                  className="resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !resumeFile || !user}
                  className="flex-[2]"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {uploading ? 'Uploading Resume...' : 'Submitting...'}
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
