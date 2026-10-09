'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Eye, Upload, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  cover_image_url: string | null;
  category_id: string | null;
  category?: {
    id: string;
    name: string;
  };
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at: string;
}

export default function BlogManagement() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'categories'>('posts');
  const [showCreatePostForm, setShowCreatePostForm] = useState(false);
  const [showCreateCategoryForm, setShowCreateCategoryForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    author: '',
    category_id: '',
    cover_image_url: '',
    is_published: false
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: ''
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      // Fetch posts with category info
      const { data: postsData, error: postsError } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(id, name)
        `)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      setCategories(categoriesData || []);
      setPosts(postsData || []);
    } catch (error) {
      console.error('Error fetching blog data:', error);
      alert('Error fetching blog data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (editingPost) {
      setFormData({
        title: editingPost.title,
        content: editingPost.content,
        excerpt: editingPost.excerpt || '',
        author: editingPost.author,
        category_id: editingPost.category_id || '',
        cover_image_url: editingPost.cover_image_url || '',
        is_published: editingPost.is_published
      });
    } else {
      setFormData({
        title: '',
        content: '',
        excerpt: '',
        author: '',
        category_id: '',
        cover_image_url: '',
        is_published: false
      });
    }
  }, [editingPost]);

  useEffect(() => {
    if (editingCategory) {
      setCategoryFormData({
        name: editingCategory.name,
        description: editingCategory.description || ''
      });
    } else {
      setCategoryFormData({
        name: '',
        description: ''
      });
    }
  }, [editingCategory]);

  const handleCreatePost = () => {
    setEditingPost(null);
    setShowCreatePostForm(true);
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setShowCreatePostForm(true);
  };

  const handleDeletePost = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
      try {
        const { error } = await supabase
          .from('blog_posts')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setPosts(posts.filter(post => post.id !== id));
        alert('Blog post deleted successfully!');
      } catch (error) {
        console.error('Error deleting blog post:', error);
        alert('Error deleting blog post. Please try again.');
      }
    }
  };

  const togglePublishStatus = async (id: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      const updateData: any = { is_published: newStatus };
      
      if (newStatus) {
        updateData.published_at = new Date().toISOString();
      } else {
        updateData.published_at = null;
      }

      const { error } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) throw error;

      setPosts(posts.map(post => 
        post.id === id 
          ? { 
              ...post, 
              is_published: newStatus,
              published_at: newStatus ? new Date().toISOString() : null
            } 
          : post
      ));

      alert(`Blog post ${newStatus ? 'published' : 'unpublished'} successfully!`);
    } catch (error) {
      console.error('Error updating publish status:', error);
      alert('Error updating publish status. Please try again.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setError(null);
      const file = e.target.files?.[0];
      
      if (!file) return;

      // Validate file type and size (max 2MB)
      if (!file.type.match('image.*')) {
        throw new Error('Please select a valid image file (JPEG, PNG, GIF)');
      }
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Image size must be less than 2MB');
      }

      // Generate unique file name
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error('Failed to generate public URL');
      }

      // Update form data
      setFormData(prev => ({ ...prev, cover_image_url: publicUrl }));
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

  const handleRemoveCoverImage = () => {
    setFormData(prev => ({ ...prev, cover_image_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePostFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Generate slug from title
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const postData = {
        title: formData.title,
        slug: slug,
        content: formData.content,
        excerpt: formData.excerpt,
        author: formData.author,
        category_id: formData.category_id || null,
        cover_image_url: formData.cover_image_url || null,
        is_published: formData.is_published,
        // Set published_at to current time if post is being published and doesn't already have a published_at value
        published_at: formData.is_published ? 
          (editingPost?.published_at || new Date().toISOString()) : 
          null
      };

      if (editingPost) {
        // Update existing post
        const { data, error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', editingPost.id)
          .select(`
            *,
            category:blog_categories(id, name)
          `);

        if (error) throw error;

        // Update post in state
        setPosts(posts.map(post => post.id === editingPost.id ? {...data[0]} : post));
        alert('Blog post updated successfully!');
      } else {
        // Create new post
        const { data, error } = await supabase
          .from('blog_posts')
          .insert([postData])
          .select(`
            *,
            category:blog_categories(id, name)
          `);

        if (error) throw error;

        // Add new post to state
        setPosts([data[0], ...posts]);
        alert('Blog post created successfully!');
      }

      // Reset form
      setShowCreatePostForm(false);
      setEditingPost(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error saving blog post:', error);
      alert('Error saving blog post. Please try again.');
    }
  };

  const handleCategoryFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Generate slug from name
      const slug = categoryFormData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const categoryData = {
        name: categoryFormData.name,
        slug: slug,
        description: categoryFormData.description
      };

      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('blog_categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) throw error;

        // Update category in state
        setCategories(categories.map(cat => cat.id === editingCategory.id ? 
          { ...cat, ...categoryData } : cat));
        alert('Category updated successfully!');
      } else {
        // Create new category
        const { error } = await supabase
          .from('blog_categories')
          .insert([categoryData]);

        if (error) throw error;

        // Refresh categories list
        fetchData();
        alert('Category created successfully!');
      }

      // Reset form
      setShowCreateCategoryForm(false);
      setEditingCategory(null);
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category. Please try again.');
    }
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setShowCreateCategoryForm(true);
  };

  const handleEditCategory = (category: BlogCategory) => {
    setEditingCategory(category);
    setShowCreateCategoryForm(true);
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the category "${name}"? This will not delete posts in this category, but they will become uncategorized. This action cannot be undone.`)) {
      try {
        const { error } = await supabase
          .from('blog_categories')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setCategories(categories.filter(cat => cat.id !== id));
        // Update posts that had this category to remove the category association
        setPosts(posts.map(post => 
          post.category_id === id ? { ...post, category_id: null, category: undefined } : post
        ));
        
        alert('Category deleted successfully!');
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category. Please try again.');
      }
    }
  };

  const handlePostInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [id]: val
    }));
  };

  const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    
    setCategoryFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  if (loading) {
    return (
      <div>
        <div className="border border-rule bg-surface p-6">
          <h2 className="font-admin text-2xl sm:text-3xl text-ink-deep mb-6">Blog Management</h2>
          <p>Loading blog posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-admin text-2xl sm:text-3xl text-ink-deep mb-4">Blog Management</h1>
        <div className="border-b border-rule">
          <nav className="-mb-px flex flex-wrap gap-x-8 gap-y-2">
            <button
              onClick={() => setActiveTab('posts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${ activeTab === 'posts' ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink hover:border-rule' }`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${ activeTab === 'categories' ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink hover:border-rule' }`}
            >
              Categories
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'posts' && (
        <>
          <div className="mb-6 flex justify-end">
            <button
              onClick={handleCreatePost}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-ink text-paper rounded-md hover:bg-ink-deep transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Post
            </button>
          </div>

          {showCreatePostForm ? (
            <div className="border border-rule bg-surface p-6 mb-6">
              <h3 className="text-xl font-bold text-ink mb-4">
                {editingPost ? 'Edit Blog Post' : 'Create New Blog Post'}
              </h3>
              <form onSubmit={handlePostFormSubmit} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-ink mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    required
                    className="w-full px-3 py-2 border border-rule bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink"
                    value={formData.title}
                    onChange={handlePostInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="excerpt" className="block text-sm font-medium text-ink mb-1">
                    Excerpt
                  </label>
                  <textarea
                    id="excerpt"
                    rows={3}
                    className="w-full px-3 py-2 border border-rule bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink"
                    value={formData.excerpt}
                    onChange={handlePostInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-ink mb-1">
                    Content
                  </label>
                  <ReactQuill
                    theme="snow"
                    value={formData.content}
                    onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link', 'image'],
                        ['clean']
                      ]
                    }}
                    className="bg-surface h-64"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="author" className="block text-sm font-medium text-ink mb-1">
                      Author
                    </label>
                    <input
                      type="text"
                      id="author"
                      required
                      className="w-full px-3 py-2 border border-rule bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink"
                      value={formData.author}
                      onChange={handlePostInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="category_id" className="block text-sm font-medium text-ink mb-1">
                      Category
                    </label>
                    <select
                      id="category_id"
                      className="w-full px-3 py-2 border border-rule bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink"
                      value={formData.category_id}
                      onChange={handlePostInputChange}
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">
                    Cover Image
                  </label>
                  <div className="mt-1 flex items-center">
                    {formData.cover_image_url ? (
                      <div className="relative">
                        <img 
                          src={formData.cover_image_url} 
                          alt="Cover preview" 
                          className="h-32 w-32 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveCoverImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-paper rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-32 w-32 border border-dashed border-rule rounded-md">
                        <Upload className="h-8 w-8 text-muted" />
                      </div>
                    )}
                    <div className="ml-4">
                      <div className="flex items-center">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept="image/*"
                          className="hidden"
                          id="cover-image-upload"
                          disabled={uploading}
                        />
                        <label
                          htmlFor="cover-image-upload"
                          className={`cursor-pointer bg-surface py-2 px-3 border border-rule rounded-md text-sm leading-4 font-medium text-ink hover:bg-paper focus:outline-none focus:ring-1 focus:ring-ink ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {uploading ? 'Uploading...' : 'Choose File'}
                        </label>
                      </div>
                      <p className="mt-2 text-sm text-muted">
                        PNG, JPG, GIF up to 2MB
                      </p>
                    </div>
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-600">{error}</p>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_published"
                    className="h-4 w-4 text-ink focus:ring-ink border-rule rounded"
                    checked={formData.is_published}
                    onChange={handlePostInputChange}
                  />
                  <label htmlFor="is_published" className="ml-2 block text-sm text-ink-deep">
                    Published
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreatePostForm(false);
                      setEditingPost(null);
                    }}
                    className="w-full sm:w-auto px-4 py-2 border border-rule text-ink rounded-md hover:bg-paper transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full sm:w-auto px-4 py-2 bg-ink text-paper rounded-md hover:bg-ink-deep transition-colors disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-paper" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Uploading...
                        </span>
                      </>
                    ) : (
                      editingPost ? 'Update Post' : 'Create Post'
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          <div className="border border-rule bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-rule">
                <thead className="bg-paper">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted sm:px-6">
                      Title
                    </th>
                    <th scope="col" className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted sm:table-cell">
                      Category
                    </th>
                    <th scope="col" className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted md:table-cell">
                      Author
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted sm:px-6">
                      Status
                    </th>
                    <th scope="col" className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted md:table-cell">
                      Created
                    </th>
                    <th scope="col" className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted sm:px-6">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-rule">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-paper">
                      <td className="px-3 py-4 sm:px-6">
                        <div className="max-w-[12rem] text-sm font-medium text-ink-deep sm:max-w-none">{post.title}</div>
                        <div className="max-w-[12rem] truncate text-sm text-muted sm:max-w-none">{post.slug}</div>
                      </td>
                      <td className="hidden px-6 py-4 whitespace-nowrap sm:table-cell">
                        <div className="text-sm text-ink-deep">{post.category?.name || 'Uncategorized'}</div>
                      </td>
                      <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-muted md:table-cell">
                        {post.author}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ post.is_published ? 'bg-paper text-ink' : 'bg-paper-2 text-gold' }`}>
                          {post.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-muted md:table-cell">
                        {new Date(post.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-4 text-right text-sm font-medium sm:px-6">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => togglePublishStatus(post.id, post.is_published)}
                            className={`p-1 rounded hover:bg-paper-2 ${ post.is_published ? 'text-yellow-600' : 'text-ink' }`}
                            title={post.is_published ? 'Unpublish' : 'Publish'}
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEditPost(post)}
                            className="p-1 rounded text-ink hover:bg-paper-2"
                            title="Edit"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1 rounded text-red-600 hover:bg-paper-2"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {posts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted">No blog posts found.</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'categories' && (
        <>
          <div className="mb-6 flex justify-end">
            <button
              onClick={handleCreateCategory}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-ink text-paper rounded-md hover:bg-ink-deep transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Category
            </button>
          </div>

          {showCreateCategoryForm ? (
            <div className="border border-rule bg-surface p-6 mb-6">
              <h3 className="text-xl font-bold text-ink mb-4">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <form onSubmit={handleCategoryFormSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-ink mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    className="w-full px-3 py-2 border border-rule bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink"
                    value={categoryFormData.name}
                    onChange={handleCategoryInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-ink mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    className="w-full px-3 py-2 border border-rule bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink"
                    value={categoryFormData.description}
                    onChange={handleCategoryInputChange}
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateCategoryForm(false);
                      setEditingCategory(null);
                    }}
                    className="w-full sm:w-auto px-4 py-2 border border-rule text-ink rounded-md hover:bg-paper transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2 bg-ink text-paper rounded-md hover:bg-ink-deep transition-colors"
                  >
                    {editingCategory ? 'Update Category' : 'Create Category'}
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          <div className="border border-rule bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-rule">
                <thead className="bg-paper">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Slug
                    </th>
                    <th scope="col" className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted sm:table-cell">
                      Description
                    </th>
                    <th scope="col" className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted md:table-cell">
                      Created
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-rule">
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-paper">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-ink-deep">{category.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                        {category.slug}
                      </td>
                      <td className="hidden px-6 py-4 text-sm text-muted sm:table-cell">
                        {category.description || 'No description'}
                      </td>
                      <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-muted md:table-cell">
                        {new Date(category.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="p-1 rounded text-ink hover:bg-paper-2"
                            title="Edit"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id, category.name)}
                            className="p-1 rounded text-red-600 hover:bg-paper-2"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {categories.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted">No categories found.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}