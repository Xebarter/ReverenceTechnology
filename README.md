# Reverence Technology Website

A modern website built with Next.js, React, and TypeScript for Reverence Technology, a Ugandan technology solutions provider.

## Features

- Responsive design with Tailwind CSS
- Content management through Supabase backend
- Admin dashboard for managing services, testimonials, blog posts, and more
- Career listings and job applications
- Blog functionality

## Tech Stack

- React 18 with TypeScript
- Next.js (App Router)
- Supabase for backend services
- Tailwind CSS for styling
- Lucide React for icons

## Deployment

### Deploy to Vercel

This application is ready for deployment to Vercel. Simply follow these steps:

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Sign in to your Vercel account
3. Click "New Project"
4. Import your Git repository
5. Configure the project:
   - Framework Preset: `Next.js`
   - Root Directory: `.`
   - Build Command: `npm run build`
6. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
7. Deploy!

### Environment Variables

For local development, create a `.env` file with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Available Scripts

In the project directory, you can run:

- `npm run dev` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm run start` - Runs the production build locally
- `npm run lint` - Runs ESLint
- `npm run typecheck` - Runs TypeScript type checking

## Project Structure

```
src/
  app/            # Next.js routes (App Router)
  components/     # React components
    admin/        # Admin dashboard components
  lib/            # Utility functions and Supabase client
  server/         # Server-only modules (PostgREST wrappers, etc.)
```

## Learn More

To learn more about the technologies used:

- [Vite Documentation](https://vitejs.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
