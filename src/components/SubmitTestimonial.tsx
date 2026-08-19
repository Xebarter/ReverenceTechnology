import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { Star, Upload } from 'lucide-react';
import { Button, FieldLabel, Input, Textarea } from './ui';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  if (!isOpen) return null;

  // Handle escape key press
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Add event listeners
  useState(() => {
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  });

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-deep/50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-md border border-rule bg-surface">
        {children}
      </div>
    </div>,
    document.body
  );
};

export default function SubmitTestimonial({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    role: '',
    content: '',
    rating: 0,
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRatingClick = (rating: number) => {
    setFormData({ ...formData, rating });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
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
    setSubmitting(true);
    setError('');

    // Validate required fields
    if (!formData.name || !formData.company || !formData.content || formData.rating === 0) {
      setError('Please fill in all required fields and provide a rating.');
      setSubmitting(false);
      return;
    }

    try {
      // Upload avatar if provided
      let uploadedAvatarUrl = null;
      if (avatarFile) {
        uploadedAvatarUrl = await uploadAvatar();
      }

      const { error: submitError } = await supabase
        .from('testimonials')
        .insert([
          {
            name: formData.name,
            company: formData.company,
            role: formData.role,
            content: formData.content,
            rating: formData.rating,
            avatar_url: uploadedAvatarUrl || null,
            is_active: false, // Default to inactive until reviewed
          }
        ]);

      if (submitError) throw submitError;

      setSubmitted(true);

      // Reset form after successful submission
      setFormData({
        name: '',
        company: '',
        role: '',
        content: '',
        rating: 0,
      });
      setAvatarFile(null);
      setAvatarPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit testimonial. Please try again.');
      console.error('Error submitting testimonial:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmitted(false);
    setFormData({
      name: '',
      company: '',
      role: '',
      content: '',
      rating: 0,
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form when closing
    setTimeout(() => {
      setSubmitted(false);
      setError('');
      setFormData({
        name: '',
        company: '',
        role: '',
        content: '',
        rating: 0,
      });
      setAvatarFile(null);
      setAvatarPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 300);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="bg-paper p-6 sm:p-8">
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="mb-2 font-serif text-2xl font-medium tracking-tight text-ink-deep md:text-3xl">
                Share Your Experience
              </h2>
              <p className="max-w-2xl text-muted">
                We'd love to hear about your experience working with us. Your feedback helps us improve and inspires others.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="ml-4 text-2xl leading-none text-muted transition hover:text-ink"
              aria-label="Close form"
            >
              &times;
            </button>
          </div>
        </div>

        {submitted ? (
          <div className="rounded-md border border-rule bg-surface p-6 text-center sm:p-8">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-md border border-rule bg-paper text-ink">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="mb-2 font-serif text-2xl font-medium text-ink-deep">Thank You!</h3>
            <p className="mb-6 text-muted">
              Your testimonial has been submitted successfully. It will be reviewed and published shortly.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button onClick={handleResetForm}>
                Submit Another Testimonial
              </Button>
              <Button variant="secondary" onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-rule bg-surface p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-md border border-rule bg-paper px-4 py-3 text-ink">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="name">Full Name *</FieldLabel>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="company">Company *</FieldLabel>
                  <Input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    required
                    placeholder="Company Name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="role">Role/Position</FieldLabel>
                  <Input
                    type="text"
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    placeholder="Your Position"
                  />
                </div>

                <div>
                  <FieldLabel>Avatar (optional)</FieldLabel>
                  <div className="flex items-center space-x-4">
                    {avatarPreview ? (
                      <div className="relative">
                        <img
                          src={avatarPreview}
                          alt="Avatar preview"
                          className="h-16 w-16 rounded-full border border-rule object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="absolute -right-2 -top-2 rounded-full bg-ink p-1 text-paper hover:bg-ink-deep"
                          aria-label="Remove avatar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-rule bg-paper">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}

                    <div className="flex-1">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload size={16} />
                        {avatarFile ? 'Change Avatar' : 'Upload Avatar'}
                      </Button>
                      <p className="mt-1 text-xs text-muted">JPEG, PNG, GIF (max 2MB)</p>
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
              </div>

              <div>
                <FieldLabel>Rating *</FieldLabel>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingClick(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="text-3xl focus:outline-none"
                    >
                      <Star
                        className={`${
                          star <= (hoverRating || formData.rating)
                            ? 'fill-gold text-gold'
                            : 'text-rule'
                        } transition-colors`}
                      />
                    </button>
                  ))}
                  <span className="ml-3 text-muted">
                    {formData.rating > 0 ? `${formData.rating} of 5 stars` : 'Select rating'}
                  </span>
                </div>
              </div>

              <div>
                <FieldLabel htmlFor="content">Your Testimonial *</FieldLabel>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="resize-none"
                  placeholder="Share your experience working with us..."
                />
              </div>

              <div className="pt-4">
                <div className="flex flex-col justify-center gap-3 sm:flex-row">
                  <Button
                    type="submit"
                    disabled={submitting}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    {submitting ? 'Submitting...' : 'Submit Testimonial'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={handleClose}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
                <p className="mt-3 text-center text-sm text-muted">
                  * Required fields
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </Modal>
  );
}
