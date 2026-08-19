'use client';

import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { supabase, adminSupabase } from '../../lib/supabase';

interface Project {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  mobile_image_url: string | null;
  link: string | null;
  technologies: string[];
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const ProjectsManagement: React.FC = () => {
  // Rich text editor modules configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link'
  ];

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    technologies: '',
    is_featured: true,
    display_order: 0,
  });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [mobileImageUrl, setMobileImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [mobileImageFile, setMobileImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mobilePreviewUrl, setMobilePreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, isMobile: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (JPEG, PNG, GIF, etc.)');
        return;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      if (isMobile) {
        setMobileImageFile(file);
        setMobilePreviewUrl(URL.createObjectURL(file));
      } else {
        setImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
      }
      setError('');
    }
  };

  const handleRemoveImage = (isMobile: boolean = false) => {
    if (isMobile) {
      setMobileImageFile(null);
      setMobilePreviewUrl(null);
      if (editingProject?.mobile_image_url) {
        setMobileImageUrl(null);
      }
    } else {
      setImageFile(null);
      setPreviewUrl(null);
      if (editingProject?.image_url) {
        setImageUrl(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      // Upload images first if provided
      let uploadedImageUrl = imageUrl;
      let uploadedMobileImageUrl = mobileImageUrl;

      if (imageFile) {
        const fileName = `${Date.now()}_${imageFile.name}`;
        const { data, error } = await supabase.storage
          .from('projects')
          .upload(fileName, imageFile);

        if (error) throw error;
        uploadedImageUrl = `${supabase.storage.from('projects').getPublicUrl(data.path).data.publicUrl}`;
      }

      if (mobileImageFile) {
        const fileName = `mobile_${Date.now()}_${mobileImageFile.name}`;
        const { data, error } = await supabase.storage
          .from('projects')
          .upload(fileName, mobileImageFile);

        if (error) throw error;
        uploadedMobileImageUrl = `${supabase.storage.from('projects').getPublicUrl(data.path).data.publicUrl}`;
      }

      const projectData = {
        title: formData.title,
        description: formData.description,
        link: formData.link || null,
        technologies: formData.technologies.split(',').map(t => t.trim()).filter(t => t),
        is_featured: formData.is_featured,
        display_order: formData.display_order,
        image_url: uploadedImageUrl,
        mobile_image_url: uploadedMobileImageUrl,
      };

      if (editingProject) {
        // Update existing project using admin client
        const { error } = await adminSupabase
          .from('projects')
          .update(projectData)
          .eq('id', editingProject.id);

        if (error) throw error;
      } else {
        // Add new project using admin client
        const { error } = await adminSupabase
          .from('projects')
          .insert([projectData]);

        if (error) throw error;
      }
      
      await fetchProjects();
      resetForm();
    } catch (err: any) {
      console.error('Error saving project:', err);
      setError(err.message || 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    
    try {
      setError(null);
      const { error } = await adminSupabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchProjects();
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project');
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description,
      link: project.link || '',
      technologies: project.technologies.join(', '),
      is_featured: project.is_featured,
      display_order: project.display_order,
    });
    setImageUrl(project.image_url);
    setMobileImageUrl(project.mobile_image_url);
    setPreviewUrl(project.image_url);
    setMobilePreviewUrl(project.mobile_image_url);
    setImageFile(null);
    setMobileImageFile(null);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      link: '',
      technologies: '',
      is_featured: true,
      display_order: 0,
    });
    setImageUrl(null);
    setMobileImageUrl(null);
    setImageFile(null);
    setMobileImageFile(null);
    setPreviewUrl(null);
    setMobilePreviewUrl(null);
    setEditingProject(null);
    setShowForm(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-ink" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="font-admin text-2xl sm:text-3xl text-ink-deep">Projects</h1>
            <p className="text-muted mt-2">Manage featured projects and portfolio items</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-ink text-paper rounded-lg hover:bg-ink-deep transition-colors"
          >
            <Plus size={20} className="mr-2" />
            Add Project
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-8 bg-surface border border-rule p-6">
          <h2 className="text-xl font-bold text-ink-deep mb-4">
            {editingProject ? 'Edit Project' : 'Add New Project'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-rule bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-rule bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-ink mb-1">
                  Description *
                </label>
                <ReactQuill
                  value={formData.description}
                  onChange={(content) => setFormData({ ...formData, description: content })}
                  modules={quillModules}
                  formats={quillFormats}
                  className="bg-surface"
                  theme="snow"
                />
                <div className="text-sm text-muted mt-2">
                  You can use formatting like bold, italic, lists, and headers in the description.
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Project Link
                </label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-rule bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Technologies
                </label>
                <input
                  type="text"
                  value={formData.technologies}
                  onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                  placeholder="React, Node.js, PostgreSQL (comma separated)"
                  className="w-full px-3 py-2 border border-rule bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Desktop Image
                </label>
                <div className="flex items-center space-x-4">
                  {previewUrl ? (
                    <div className="relative">
                      <img 
                        src={previewUrl} 
                        alt="Desktop preview" 
                        className="w-16 h-16 rounded-lg object-cover border-2 border-ink"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(false)}
                        className="absolute -top-2 -right-2 bg-red-500 text-paper rounded-full p-1 hover:bg-red-600"
                        aria-label="Remove image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-paper-2 flex items-center justify-center border border-dashed border-rule">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <label className="flex items-center px-3 py-2 bg-paper text-ink rounded-lg hover:bg-paper-2 transition-colors text-sm cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      Upload Desktop Image
                      <input
                        type="file"
                        onChange={(e) => handleImageChange(e, false)}
                        accept="image/*"
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-muted mt-1">JPEG, PNG, GIF (max 10MB)</p>
                  </div>

                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Mobile Image
                </label>
                <div className="flex items-center space-x-4">
                  {mobilePreviewUrl ? (
                    <div className="relative">
                      <img 
                        src={mobilePreviewUrl} 
                        alt="Mobile preview" 
                        className="w-16 h-16 rounded-lg object-cover border-2 border-ink"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(true)}
                        className="absolute -top-2 -right-2 bg-red-500 text-paper rounded-full p-1 hover:bg-red-600"
                        aria-label="Remove mobile image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-paper-2 flex items-center justify-center border border-dashed border-rule">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <label className="flex items-center px-3 py-2 bg-paper text-ink rounded-lg hover:bg-paper-2 transition-colors text-sm cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      Upload Mobile Image
                      <input
                        type="file"
                        onChange={(e) => handleImageChange(e, true)}
                        accept="image/*"
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-muted mt-1">JPEG, PNG, GIF (max 10MB)</p>
                  </div>

                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="h-4 w-4 text-ink focus:ring-ink border-rule rounded"
                />
                <label htmlFor="isFeatured" className="ml-2 block text-sm text-ink">
                  Feature this project
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-rule text-ink rounded-md hover:bg-paper transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-ink text-paper rounded-md hover:bg-ink-deep transition-colors flex items-center disabled:opacity-50"
                disabled={submitting}
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editingProject ? 'Update Project' : 'Add Project'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-surface border border-rule overflow-hidden">
            <div className="flex">
              {project.image_url ? (
                <img 
                  src={project.image_url} 
                  alt={`${project.title} desktop`} 
                  className="w-1/2 h-24 object-cover"
                />
              ) : (
                <div className="bg-paper border-r border-rule w-1/2 h-24 flex items-center justify-center">
                  <span className="text-muted text-xs">No desktop</span>
                </div>
              )}
              
              {project.mobile_image_url ? (
                <img 
                  src={project.mobile_image_url} 
                  alt={`${project.title} mobile`} 
                  className="w-1/2 h-24 object-cover"
                />
              ) : (
                <div className="bg-paper w-1/2 h-24 flex items-center justify-center">
                  <span className="text-muted text-xs">No mobile</span>
                </div>
              )}
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-ink-deep">{project.title}</h3>
                {project.is_featured && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-paper text-ink">
                    Featured
                  </span>
                )}
              </div>
              
              <p className="mt-2 text-muted text-sm line-clamp-2">{project.description}</p>
              
              <div className="mt-4 flex flex-wrap gap-1">
                {project.technologies.slice(0, 3).map((tech, index) => (
                  <span 
                    key={index} 
                    className="px-2 py-1 bg-paper text-ink text-xs rounded"
                  >
                    {tech}
                  </span>
                ))}
                {project.technologies.length > 3 && (
                  <span className="px-2 py-1 bg-paper text-muted text-xs rounded">
                    +{project.technologies.length - 3}
                  </span>
                )}
              </div>
              
              <div className="mt-4 text-xs text-muted">
                Display order: {project.display_order}
              </div>
              
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => handleEdit(project)}
                  className="p-2 text-muted hover:text-ink"
                  title="Edit"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="p-2 text-muted hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && !loading && (
        <div className="bg-surface border border-rule p-12 text-center">
          <div className="bg-paper border border-dashed w-16 h-16 flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-ink-deep">No projects</h3>
          <p className="mt-1 text-muted">Get started by adding a new project.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 bg-ink text-paper rounded-md hover:bg-ink-deep transition-colors"
          >
            Add Project
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectsManagement;