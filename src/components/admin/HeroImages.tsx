'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface HeroImage {
  id: string;
  title: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
}

export default function HeroImages() {
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingImage, setEditingImage] = useState<HeroImage | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    is_active: true,
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchHeroImages();
  }, []);

  const fetchHeroImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('hero_images')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHeroImages(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch hero images';
      console.error('Error fetching hero images:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.image_url.trim()) {
      setError('Image URL is required');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);

      if (editingImage) {
        // Update existing image
        const { error } = await supabase
          .from('hero_images')
          .update({
            title: formData.title.trim(),
            image_url: formData.image_url.trim(),
            is_active: formData.is_active
          })
          .eq('id', editingImage.id);

        if (error) throw error;
      } else {
        // Add new image
        const { error } = await supabase
          .from('hero_images')
          .insert({
            title: formData.title.trim(),
            image_url: formData.image_url.trim(),
            is_active: formData.is_active
          });

        if (error) throw error;
      }
      
      await fetchHeroImages();
      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save hero image';
      console.error('Error saving hero image:', err);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this hero image? This action cannot be undone.')) return;
    
    try {
      setError(null);
      const { error } = await supabase
        .from('hero_images')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchHeroImages();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete hero image';
      console.error('Error deleting hero image:', err);
      setError(message);
    }
  };

  const handleEdit = (image: HeroImage) => {
    setEditingImage(image);
    setFormData({
      title: image.title,
      image_url: image.image_url,
      is_active: image.is_active,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      image_url: '',
      is_active: true,
    });
    setEditingImage(null);
    setShowForm(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setError(null);
      const file = e.target.files?.[0];
      
      if (!file) return;

      // Validate file type and size (max 5MB)
      if (!file.type.match('image.*')) {
        throw new Error('Please select a valid image file (JPEG, PNG, GIF)');
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5MB');
      }

      // Generate unique file name
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('hero-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('hero-images')
        .getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error('Failed to generate public URL');
      }

      // Update form data
      setFormData(prev => ({ ...prev, image_url: publicUrl }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload image';
      console.error('Error uploading image:', err);
      setError(message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, image_url: url }));
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-admin text-2xl text-ink-deep">Hero Images</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center px-4 py-2 bg-ink text-paper rounded-lg hover:bg-ink-deep transition-colors disabled:opacity-50"
          disabled={submitting}
        >
          <Plus size={20} className="mr-2" />
          Add New Image
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {showForm && (
        <div className="border border-rule bg-surface p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-ink-deep">
              {editingImage ? 'Edit Hero Image' : 'Add New Hero Image'}
            </h2>
            <button
              onClick={resetForm}
              className="text-muted hover:text-muted"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter image title"
                className="w-full px-3 py-2 border border-rule bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:border-ink focus:ring-1 focus:ring-ink"
                required
                disabled={submitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Image URL <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-3 py-2 border border-rule bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:border-ink focus:ring-1 focus:ring-ink"
                  disabled={uploading || submitting}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={triggerFileInput}
                  disabled={uploading || submitting}
                  className="px-3 py-2 bg-paper text-ink rounded-md hover:bg-paper-2 transition-colors flex items-center whitespace-nowrap disabled:opacity-50"
                  title="Upload from device"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Upload size={16} className="mr-1" />
                  )}
                  Upload
                </button>
              </div>
            </div>
            
            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-ink focus:ring-ink border-rule rounded"
                  disabled={submitting}
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-ink">
                  Set as active
                </label>
              </div>
            </div>
            
            {formData.image_url && (
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Image Preview
                </label>
                <div className="border border-rule rounded-md overflow-hidden bg-paper">
                  <img 
                    src={formData.image_url} 
                    alt="Preview"
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const container = target.parentElement;
                      if (container) {
                        container.innerHTML = '<div class="flex items-center justify-center h-40 text-muted text-sm">Invalid image URL</div>';
                      }
                    }}
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4">
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
                className="px-6 py-2 bg-ink text-paper rounded-md hover:bg-ink-deep transition-colors flex items-center disabled:opacity-50"
                disabled={uploading || submitting || !formData.title.trim() || !formData.image_url.trim()}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {editingImage ? 'Update Image' : 'Add Image'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {heroImages.map((image) => (
          <div key={image.id} className="border border-rule bg-surface overflow-hidden">
            <div className="relative">
              <img 
                src={image.image_url} 
                alt={image.title}
                className="w-full h-40 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://placehold.co/400x300/gray/white?text=Image+Not+Found';
                }}
              />
              {image.is_active && (
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-1 bg-ink text-paper text-xs font-medium rounded">
                    Active
                  </span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-medium text-ink-deep truncate">{image.title}</h3>
              <p className="text-xs text-muted mt-1">
                Added: {new Date(image.created_at).toLocaleDateString()}
              </p>
              <div className="flex justify-end space-x-2 mt-3">
                <button
                  onClick={() => handleEdit(image)}
                  className="p-2 text-muted hover:text-ink transition-colors"
                  title="Edit"
                  aria-label="Edit image"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(image.id)}
                  className="p-2 text-muted hover:text-red-600 transition-colors"
                  title="Delete"
                  aria-label="Delete image"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {heroImages.length === 0 && !loading && (
        <div className="border border-rule bg-surface p-8 text-center">
          <ImageIcon className="mx-auto text-muted" size={48} />
          <h3 className="mt-4 text-lg font-medium text-ink-deep">No Hero Images</h3>
          <p className="mt-1 text-muted">Get started by adding a new hero image.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 bg-ink text-paper rounded-md hover:bg-ink-deep transition-colors flex items-center mx-auto"
          >
            <Plus size={16} className="mr-2" />
            Add Image
          </button>
        </div>
      )}
    </div>
  );
}