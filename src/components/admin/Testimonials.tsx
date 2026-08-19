'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Star, Loader2, Upload, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Testimonial {
  id: string;
  name: string;
  company: string;
  role: string | null;
  content: string;
  rating: number;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    role: '',
    content: '',
    rating: 5,
    is_active: true,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [existingAvatarUrl, setExistingAvatarUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTestimonials(data || []);
    } catch (err) {
      console.error('Error fetching testimonials:', err);
      setError('Failed to fetch testimonials');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (JPEG, PNG, GIF, etc.)');
        return;
      }
      
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('File size must be less than 2MB');
        return;
      }
      
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return null;
    
    try {
      // Validate file type and size (max 2MB)
      if (!avatarFile.type.match('image.*')) {
        throw new Error('Please select a valid image file (JPEG, PNG, GIF)');
      }
      if (avatarFile.size > 2 * 1024 * 1024) {
        throw new Error('Image size must be less than 2MB');
      }

      // Generate unique file name
      const fileExt = avatarFile.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('testimonials')
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('testimonials')
        .getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error('Failed to generate public URL');
      }

      return publicUrl;
    } catch (err) {
      console.error('Error uploading avatar:', err);
      throw new Error(err instanceof Error ? err.message : 'Failed to upload avatar image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      
      if (!formData.name.trim() || !formData.company.trim() || !formData.content.trim()) {
        throw new Error('Please fill in all required fields');
      }
      
      if (formData.rating < 1 || formData.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Upload avatar if provided
      let avatarUrl = existingAvatarUrl;
      if (avatarFile) {
        avatarUrl = await uploadAvatar();
      }

      if (editingTestimonial) {
        // Update existing testimonial
        const { error } = await supabase
          .from('testimonials')
          .update({
            name: formData.name.trim(),
            company: formData.company.trim(),
            role: formData.role.trim() || null,
            content: formData.content.trim(),
            rating: formData.rating,
            avatar_url: avatarUrl,
            is_active: formData.is_active,
          })
          .eq('id', editingTestimonial.id);

        if (error) throw error;
      } else {
        // Add new testimonial
        const { error } = await supabase
          .from('testimonials')
          .insert({
            name: formData.name.trim(),
            company: formData.company.trim(),
            role: formData.role.trim() || null,
            content: formData.content.trim(),
            rating: formData.rating,
            avatar_url: avatarUrl,
            is_active: formData.is_active,
          });

        if (error) throw error;
      }
      
      await fetchTestimonials();
      resetForm();
    } catch (err) {
      console.error('Error saving testimonial:', err);
      setError(err instanceof Error ? err.message : 'Failed to save testimonial');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this testimonial?')) return;
    
    try {
      setError(null);
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchTestimonials();
    } catch (err) {
      console.error('Error deleting testimonial:', err);
      setError('Failed to delete testimonial');
    }
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      name: testimonial.name,
      company: testimonial.company,
      role: testimonial.role || '',
      content: testimonial.content,
      rating: testimonial.rating,
      is_active: testimonial.is_active,
    });
    setExistingAvatarUrl(testimonial.avatar_url);
    setAvatarPreview(testimonial.avatar_url);
    setAvatarFile(null);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      company: '',
      role: '',
      content: '',
      rating: 5,
      is_active: true,
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setExistingAvatarUrl(null);
    setEditingTestimonial(null);
    setShowForm(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${i < rating ? 'text-gold fill-current' : 'text-rule'}`}
          />
        ))}
      </div>
    );
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-admin text-3xl text-ink-deep">Testimonials</h1>
            <p className="text-muted mt-2">Manage customer testimonials and reviews</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center px-4 py-2 bg-ink text-paper rounded-lg hover:bg-ink-deep transition-colors"
          >
            <Plus size={20} className="mr-2" />
            Add Testimonial
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
            {editingTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-rule bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Company *
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 border border-rule bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Role/Position
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-rule bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Avatar Image
                </label>
                <div className="flex items-center space-x-4">
                  {avatarPreview ? (
                    <div className="relative">
                      <img 
                        src={avatarPreview} 
                        alt="Avatar preview" 
                        className="w-16 h-16 rounded-full object-cover border-2 border-ink"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="absolute -top-2 -right-2 bg-red-500 text-paper rounded-full p-1 hover:bg-red-600"
                        aria-label="Remove avatar"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-paper-2 flex items-center justify-center border border-dashed border-rule">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center px-3 py-2 bg-paper text-ink rounded-lg hover:bg-paper-2 transition-colors text-sm"
                    >
                      <Upload className="mr-2" size={16} />
                      {avatarFile ? 'Change Image' : 'Upload Image'}
                    </button>
                    <p className="text-xs text-muted mt-1">JPEG, PNG, GIF (max 2MB)</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-ink mb-1">
                  Testimonial Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-rule bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Rating
                </label>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="text-2xl focus:outline-none"
                    >
                      <Star 
                        className={`${star <= formData.rating ? 'text-gold fill-current' : 'text-rule'}`} 
                        size={24}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-muted">({formData.rating}/5)</span>
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-ink focus:ring-ink border-rule rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-ink">
                  Publish testimonial
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
                {editingTestimonial ? 'Update Testimonial' : 'Add Testimonial'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {testimonials.map((testimonial) => (
          <div key={testimonial.id} className="bg-surface border border-rule p-6">
            <div className="flex items-start">
              <img
                src={testimonial.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=2DBE7E&color=fff`}
                alt={testimonial.name}
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://placehold.co/100x100?text=Avatar';
                }}
              />
              <div className="ml-4 flex-1">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold text-ink-deep">{testimonial.name}</h3>
                    <p className="text-sm text-muted">{testimonial.role}, {testimonial.company}</p>
                  </div>
                  {testimonial.is_active && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-paper text-ink">
                      Published
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  {renderStars(testimonial.rating)}
                </div>
                <p className="mt-3 text-ink italic">"{testimonial.content}"</p>
                <div className="mt-4 text-sm text-muted">
                  {new Date(testimonial.created_at).toLocaleDateString()}
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => handleEdit(testimonial)}
                    className="p-2 text-muted hover:text-ink"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(testimonial.id)}
                    className="p-2 text-muted hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {testimonials.length === 0 && !loading && (
        <div className="bg-surface border border-rule p-12 text-center">
          <Star className="mx-auto text-muted" size={48} />
          <h3 className="mt-4 text-lg font-medium text-ink-deep">No testimonials</h3>
          <p className="mt-1 text-muted">Get started by adding a new testimonial.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 bg-ink text-paper rounded-md hover:bg-ink-deep transition-colors"
          >
            Add Testimonial
          </button>
        </div>
      )}
    </div>
  );
}