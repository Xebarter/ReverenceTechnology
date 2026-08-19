'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  employment_type: string;
  salary_range: string | null;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  is_published: boolean;
  application_link: string | null;
  created_at: string;
  updated_at: string;
}

// Helper function to ensure we're working with arrays
const ensureArray = (data: any): string[] => {
  if (Array.isArray(data)) {
    return data;
  }
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      return data ? [data] : [];
    }
  }
  return [];
};

interface JobApplication {
  id: string;
  job_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  cover_letter: string | null;
  resume_url: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  job?: Job; // For displaying job title
}

export default function CareersManagement() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications'>('jobs');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [viewingApplication, setViewingApplication] = useState<JobApplication | null>(null);
  const [formData, setFormData] = useState<Omit<Job, 'id' | 'created_at' | 'updated_at'>>({
    title: '',
    description: '',
    location: '',
    employment_type: '',
    salary_range: '',
    responsibilities: [],
    requirements: [],
    benefits: [],
    is_published: false,
    application_link: ''
  });
  const [newListItem, setNewListItem] = useState({
    responsibility: '',
    requirement: '',
    benefit: ''
  });

  useEffect(() => {
    fetchJobs();
    if (activeTab === 'applications') {
      fetchApplications();
    }
  }, [activeTab]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      try {
        console.error('Error details:', {
          message: (error as any)?.message,
          status: (error as any)?.status,
          details: (error as any)?.details
        });
      } catch (err) { }
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          job:jobs(title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingJob) {
        // Update existing job
        const { error } = await supabase
          .from('jobs')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingJob.id);

        if (error) throw error;
      } else {
        // Create new job
        const { error } = await supabase
          .from('jobs')
          .insert([{
            ...formData,
            salary_range: formData.salary_range || null,
            application_link: formData.application_link || null
          }]);

        if (error) throw error;
      }

      // Reset form and close modal
      resetForm();
      setIsModalOpen(false);
      fetchJobs();
    } catch (error) {
      console.error('Error saving job:', error);
      try {
        console.error('Error details:', {
          message: (error as any)?.message,
          status: (error as any)?.status,
          details: (error as any)?.details
        });
      } catch (err) { }
      alert('Error saving job. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;

    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Error deleting job. Please try again.');
    }
  };

  const handleStatusChange = async (applicationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', applicationId);

      if (error) throw error;
      fetchApplications();
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Error updating application status. Please try again.');
    }
  };

  const resetForm = () => {
    setEditingJob(null);
    setFormData({
      title: '',
      description: '',
      location: '',
      employment_type: '',
      salary_range: '',
      responsibilities: [],
      requirements: [],
      benefits: [],
      is_published: false,
      application_link: ''
    });
    setNewListItem({
      responsibility: '',
      requirement: '',
      benefit: ''
    });
  };

  const openEditModal = (job: Job) => {
    // Debugging: log the job data being passed to the edit modal
    console.log('Editing job:', job);
    console.log('Job responsibilities:', job.responsibilities);
    console.log('Job requirements:', job.requirements);
    console.log('Job benefits:', job.benefits);
    
    setEditingJob(job);
    setFormData({
      title: job.title,
      description: job.description,
      location: job.location,
      employment_type: job.employment_type,
      salary_range: job.salary_range || '',
      responsibilities: ensureArray(job.responsibilities),
      requirements: ensureArray(job.requirements),
      benefits: ensureArray(job.benefits),
      is_published: job.is_published,
      application_link: job.application_link || ''
    });
    setNewListItem({
      responsibility: '',
      requirement: '',
      benefit: ''
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const addListItem = (type: 'responsibility' | 'requirement' | 'benefit') => {
    const newItem = newListItem[type].trim();
    if (!newItem) return;

    setFormData(prev => {
      // Fix the pluralization for 'responsibility'
      const key = type === 'responsibility' ? 'responsibilities' : `${type}s` as keyof typeof formData;
      const currentList = Array.isArray(prev[key]) ? [...prev[key] as string[]] : [];
      return {
        ...prev,
        [key]: [...currentList, newItem]
      };
    });

    setNewListItem(prev => ({
      ...prev,
      [type]: ''
    }));
  };

  const removeListItem = (type: 'responsibility' | 'requirement' | 'benefit', index: number) => {
    setFormData(prev => {
      // Fix the pluralization for 'responsibility'
      const key = type === 'responsibility' ? 'responsibilities' : `${type}s` as keyof typeof formData;
      const currentList = Array.isArray(prev[key]) ? [...prev[key] as string[]] : [];
      return {
        ...prev,
        [key]: currentList.filter((_: string, i: number) => i !== index)
      };
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent, type: 'responsibility' | 'requirement' | 'benefit') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addListItem(type);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div>
      <div className="mb-4 sm:mb-6 max-w-7xl mx-auto">
        <h1 className="font-admin text-2xl sm:text-3xl text-ink-deep">Careers Management</h1>
        <p className="text-muted mt-1 sm:mt-2 text-sm sm:text-base">
          Manage job postings and applications
        </p>
      </div>

      <div className="border-b border-rule mb-4 sm:mb-6 max-w-7xl mx-auto">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === 'jobs' ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink hover:border-rule' }`}
          >
            Job Postings ({jobs.length})
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === 'applications' ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink hover:border-rule' }`}
          >
            Applications ({applications.length})
          </button>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-48 sm:h-64">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-ink"></div>
          </div>
        ) : activeTab === 'jobs' ? (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={openCreateModal}
                className="bg-ink text-paper px-3 py-2 sm:px-4 sm:py-2 rounded-md hover:bg-ink-deep transition-colors text-sm"
              >
                Create New Job
              </button>
            </div>

            {jobs.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-muted text-sm sm:text-base">No job postings yet.</p>
              </div>
            ) : (
              <div className="border border-rule bg-surface overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-rule">
                    <thead className="bg-paper">
                      <tr>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider sm:px-6">
                          Position
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider sm:px-6 hidden sm:table-cell">
                          Location
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider sm:px-6 hidden sm:table-cell">
                          Type
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider sm:px-6 hidden md:table-cell">
                          Status
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider sm:px-6 hidden sm:table-cell">
                          Posted
                        </th>
                        <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider sm:px-6">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-surface divide-y divide-rule">
                      {jobs.map((job) => (
                        <tr key={job.id} className="hover:bg-paper">
                          <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                            <div className="text-sm font-medium text-ink-deep">{job.title}</div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap sm:px-6 hidden sm:table-cell">
                            <div className="text-sm text-muted">{job.location}</div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap sm:px-6 hidden sm:table-cell">
                            <div className="text-sm text-muted">{job.employment_type}</div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap sm:px-6 hidden md:table-cell">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${job.is_published ? 'bg-paper text-ink' : 'bg-paper-2 text-gold' }`}>
                              {job.is_published ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-muted sm:px-6 hidden sm:table-cell">
                            {formatDate(job.created_at)}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium sm:px-6">
                            <button
                              onClick={() => openEditModal(job)}
                              className="text-ink hover:text-ink-deep mr-3 text-xs sm:text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(job.id)}
                              className="text-red-600 hover:text-red-900 text-xs sm:text-sm"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            {applications.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-muted text-sm sm:text-base">No job applications yet.</p>
              </div>
            ) : (
              <div className="border border-rule bg-surface overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-rule">
                    <thead className="bg-paper">
                      <tr>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider sm:px-6">
                          Applicant
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider sm:px-6 hidden sm:table-cell">
                          Position
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider sm:px-6 hidden sm:table-cell">
                          Applied
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider sm:px-6 hidden md:table-cell">
                          Status
                        </th>
                        <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider sm:px-6">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-surface divide-y divide-rule">
                      {applications.map((application) => (
                        <tr key={application.id} className="hover:bg-paper">
                          <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                            <div className="text-sm font-medium text-ink-deep">{application.full_name}</div>
                            <div className="text-xs text-muted sm:text-sm">{application.email}</div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap sm:px-6 hidden sm:table-cell">
                            <div className="text-sm text-ink-deep">{application.job?.title || 'Unknown Position'}</div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-muted sm:px-6 hidden sm:table-cell">
                            {formatDate(application.created_at)}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap sm:px-6 hidden md:table-cell">
                            <select
                              value={application.status}
                              onChange={(e) => handleStatusChange(application.id, e.target.value)}
                              className="text-xs sm:text-sm rounded-md border-rule focus:border-ink focus:ring focus:ring-ink focus:ring-opacity-50"
                            >
                              <option value="new">New</option>
                              <option value="reviewed">Reviewed</option>
                              <option value="interview">Interview</option>
                              <option value="rejected">Rejected</option>
                              <option value="hired">Hired</option>
                            </select>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium sm:px-6">
                            <button
                              onClick={() => {
                                setViewingApplication(application);
                                setIsApplicationModalOpen(true);
                              }}
                              className="text-ink hover:text-ink-deep text-xs sm:text-sm"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="border border-rule bg-surface max-w-full sm:max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-ink-deep">
                  {editingJob ? 'Edit Job Posting' : 'Create New Job Posting'}
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="text-muted hover:text-ink"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-ink">Job Title *</label>
                    <input
                      type="text"
                      id="title"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-1 block w-full border border-rule bg-surface py-2 px-3 focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-ink">Location *</label>
                    <input
                      type="text"
                      id="location"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="mt-1 block w-full border border-rule bg-surface py-2 px-3 focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="employment_type" className="block text-sm font-medium text-ink">Employment Type *</label>
                    <select
                      id="employment_type"
                      required
                      value={formData.employment_type}
                      onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                      className="mt-1 block w-full border border-rule bg-surface py-2 px-3 focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink text-sm"
                    >
                      <option value="">Select type</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                      <option value="Freelance">Freelance</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="salary_range" className="block text-sm font-medium text-ink">Salary Range</label>
                    <input
                      type="text"
                      id="salary_range"
                      placeholder="$1,200 - $1,800"
                      value={formData.salary_range || ''}
                      onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                      className="mt-1 block w-full border border-rule bg-surface py-2 px-3 focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-ink">Description *</label>
                    <textarea
                      id="description"
                      required
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 block w-full border border-rule bg-surface py-2 px-3 focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-ink mb-2">Responsibilities</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={newListItem.responsibility}
                        onChange={(e) => setNewListItem({ ...newListItem, responsibility: e.target.value })}
                        onKeyPress={(e) => handleKeyPress(e, 'responsibility')}
                        className="flex-1 border border-rule bg-surface py-2 px-3 focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink text-sm"
                        placeholder="Add a responsibility"
                      />
                      <button
                        type="button"
                        onClick={() => addListItem('responsibility')}
                        className="bg-paper-2 border border-rule rounded-md px-4 py-2 text-ink hover:bg-paper-2 text-sm whitespace-nowrap"
                      >
                        Add
                      </button>
                    </div>
                    {ensureArray(formData.responsibilities).length > 0 && (
                      <div className="mt-3 max-h-32 overflow-y-auto">
                        <div className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Added Responsibilities:</div>
                        <ul className="space-y-1">
                          {ensureArray(formData.responsibilities).map((item, index) => (
                            <li key={index} className="flex items-center justify-between bg-paper px-3 py-2 rounded border border-rule text-sm">
                              <span className="text-ink truncate">• {item}</span>
                              <button
                                type="button"
                                onClick={() => removeListItem('responsibility', index)}
                                className="text-red-500 hover:text-red-700 ml-2"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-ink mb-2">Requirements</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={newListItem.requirement}
                        onChange={(e) => setNewListItem({ ...newListItem, requirement: e.target.value })}
                        onKeyPress={(e) => handleKeyPress(e, 'requirement')}
                        className="flex-1 border border-rule bg-surface py-2 px-3 focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink text-sm"
                        placeholder="Add a requirement"
                      />
                      <button
                        type="button"
                        onClick={() => addListItem('requirement')}
                        className="bg-paper-2 border border-rule rounded-md px-4 py-2 text-ink hover:bg-paper-2 text-sm whitespace-nowrap"
                      >
                        Add
                      </button>
                    </div>
                    {ensureArray(formData.requirements).length > 0 && (
                      <div className="mt-3 max-h-32 overflow-y-auto">
                        <div className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Added Requirements:</div>
                        <ul className="space-y-1">
                          {ensureArray(formData.requirements).map((item, index) => (
                            <li key={index} className="flex items-center justify-between bg-paper-2 px-3 py-2 rounded border border-rule text-sm">
                              <span className="text-ink truncate">• {item}</span>
                              <button
                                type="button"
                                onClick={() => removeListItem('requirement', index)}
                                className="text-red-500 hover:text-red-700 ml-2"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-ink mb-2">Benefits</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={newListItem.benefit}
                        onChange={(e) => setNewListItem({ ...newListItem, benefit: e.target.value })}
                        onKeyPress={(e) => handleKeyPress(e, 'benefit')}
                        className="flex-1 border border-rule bg-surface py-2 px-3 focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink text-sm"
                        placeholder="Add a benefit"
                      />
                      <button
                        type="button"
                        onClick={() => addListItem('benefit')}
                        className="bg-paper-2 border border-rule rounded-md px-4 py-2 text-ink hover:bg-paper-2 text-sm whitespace-nowrap"
                      >
                        Add
                      </button>
                    </div>
                    {ensureArray(formData.benefits).length > 0 && (
                      <div className="mt-3 max-h-32 overflow-y-auto">
                        <div className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Added Benefits:</div>
                        <ul className="space-y-1">
                          {ensureArray(formData.benefits).map((item, index) => (
                            <li key={index} className="flex items-center justify-between bg-paper px-3 py-2 rounded border border-rule text-sm">
                              <span className="text-ink truncate">• {item}</span>
                              <button
                                type="button"
                                onClick={() => removeListItem('benefit', index)}
                                className="text-red-500 hover:text-red-700 ml-2"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <div className="flex items-center">
                      <input
                        id="is_published"
                        type="checkbox"
                        checked={formData.is_published}
                        onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                        className="h-4 w-4 text-ink border-rule rounded focus:ring-ink"
                      />
                      <label htmlFor="is_published" className="ml-2 block text-sm text-ink-deep">
                        Publish this job posting
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-rule rounded-md text-xs sm:text-sm font-medium text-ink bg-surface hover:bg-paper focus:outline-none focus:ring-1 focus:ring-ink w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md text-xs sm:text-sm font-medium text-paper bg-ink hover:bg-ink-deep focus:outline-none focus:ring-1 focus:ring-ink w-full sm:w-auto"
                  >
                    {editingJob ? 'Update Job' : 'Create Job'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Application Detail Modal */}
      {isApplicationModalOpen && viewingApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="border border-rule bg-surface max-w-full sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-ink-deep">Application Details</h2>
                <button
                  onClick={() => {
                    setIsApplicationModalOpen(false);
                    setViewingApplication(null);
                  }}
                  className="text-muted hover:text-ink"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-ink-deep text-sm sm:text-base">{viewingApplication.full_name}</h3>
                  <p className="text-muted text-sm">{viewingApplication.job?.title || 'Unknown Position'}</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-ink">Email</label>
                    <p className="mt-1 text-sm text-ink-deep">{viewingApplication.email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink">Phone</label>
                    <p className="mt-1 text-sm text-ink-deep">
                      {viewingApplication.phone || 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink">Applied</label>
                    <p className="mt-1 text-sm text-ink-deep">{formatDate(viewingApplication.created_at)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink">Status</label>
                    <select
                      value={viewingApplication.status}
                      onChange={(e) => handleStatusChange(viewingApplication.id, e.target.value)}
                      className="mt-1 text-sm rounded-md border-rule focus:border-ink focus:ring focus:ring-ink focus:ring-opacity-50"
                    >
                      <option value="new">New</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="interview">Interview</option>
                      <option value="rejected">Rejected</option>
                      <option value="hired">Hired</option>
                    </select>
                  </div>
                </div>

                {viewingApplication.cover_letter && (
                  <div>
                    <label className="block text-sm font-medium text-ink">Cover Letter</label>
                    <div className="mt-1 bg-paper p-3 sm:p-4 rounded-md max-h-48 overflow-y-auto">
                      <p className="text-sm text-ink-deep whitespace-pre-wrap">{viewingApplication.cover_letter}</p>
                    </div>
                  </div>
                )}

                {viewingApplication.resume_url && (
                  <div>
                    <label className="block text-sm font-medium text-ink">Resume</label>
                    <div className="mt-1">
                      <a
                        href={viewingApplication.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 border border-rule text-xs sm:text-sm font-medium rounded-md text-ink bg-surface hover:bg-paper focus:outline-none focus:ring-1 focus:ring-ink"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-muted" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clipRule="evenodd" />
                        </svg>
                        Download Resume
                      </a>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-ink">Internal Notes</label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={viewingApplication.notes || ''}
                    onChange={async (e) => {
                      const newNotes = e.target.value;
                      setViewingApplication({ ...viewingApplication, notes: newNotes });

                      try {
                        await supabase
                          .from('job_applications')
                          .update({ notes: newNotes, updated_at: new Date().toISOString() })
                          .eq('id', viewingApplication.id);
                      } catch (error) {
                        console.error('Error updating notes:', error);
                      }
                    }}
                    className="mt-1 block w-full border border-rule bg-surface py-2 px-3 focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}