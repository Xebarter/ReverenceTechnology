// supabase.ts
import { createClient } from '@supabase/supabase-js';

// Validate that environment variables are set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * IMPORTANT
 * - We can't throw during module evaluation because Next may import this during build/prerender.
 * - We also don't want to silently use fake credentials at runtime.
 *
 * Strategy: create a client with a placeholder only when env is missing; log once.
 * Any real usage will fail until env vars are set.
 */
const placeholderUrl = 'http://localhost:54321';
const placeholderAnonKey = 'anon';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl || placeholderUrl, supabaseAnonKey || placeholderAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  accessToken: async () => {
    if (typeof window === 'undefined') return null;
    try {
      const { firebaseAuth } = await import('./firebase');
      return (await firebaseAuth.currentUser?.getIdToken()) ?? null;
    } catch {
      return null;
    }
  },
});

// IMPORTANT: Never use the Supabase service role key in the browser. "Admin" operations must be
// performed via server routes / edge functions that hold `SUPABASE_SERVICE_ROLE_KEY`.
export const adminSupabase = supabase;

export interface Service {
  id: string;
  package_name: string;
  description: string;
  key_features: string[];
  target_audience: string[];
  suggested_pricing: string;
  display_order: number;
  created_at: string;
}

export interface Inquiry {
  id: string;
  full_name: string;
  company_name: string;
  email: string;
  phone_number: string;
  interested_package: string;
  message: string;
  created_at: string;
}

export interface HeroImage {
  id: string;
  image_url: string;
  alt_text: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Testimonial {
  id: string;
  author_name: string;
  author_title: string;
  company: string;
  content: string;
  avatar_url: string;
  rating: number;
  is_featured: boolean;
  created_at: string;
}

export interface Job {
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

export interface JobApplication {
  id: string;
  job_id: string;
  full_name: string;
  email: string;
  phone: string;
  cover_letter: string;
  resume_url: string;
  created_at: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url: string;
  author: string;
  published_at: string;
  is_published: boolean;
  meta_description: string;
  meta_title: string;
  category_id: string;
  created_at: string;
  updated_at: string;
}

export interface BlogPostsTags {
  blog_post_id: string;
  tag_id: string;
}

export interface ScheduledCall {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  company?: string;
  preferred_date?: string; // ISO date string
  preferred_time?: string;
  call_reason?: string;
  status: 'new' | 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  scheduled_at?: string; // ISO date string
  created_at: string;
  updated_at: string;
}

export interface ShopProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  stock_quantity: number;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
  specifications: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CustomerDeposit {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  product_id: string;
  product_name: string;
  product_price: number;
  deposit_amount: number;
  total_deposited: number;
  remaining_balance: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  payment_method: 'mobile_money' | 'bank_transfer' | 'cash' | 'other';
  payment_reference: string | null;
  notes: string | null;
  admin_notes: string | null;
  deposit_date: string;
  expected_completion_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  city: string;
  country: string;
  payment_method: 'mobile_money' | 'bank_transfer' | 'cash' | 'other';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_reference: string | null;
  order_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  shipping_fee: number;
  items: Array<{
    product_id: string;
    product_name: string;
    product_price: number;
    product_image: string | null;
    category: string;
    quantity: number;
    subtotal: number;
  }>;
  notes: string | null;
  admin_notes: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}