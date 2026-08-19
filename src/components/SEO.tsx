import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  children?: React.ReactNode;
}

export default function SEO({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  twitterTitle,
  twitterDescription,
  twitterImage,
  canonicalUrl,
  children
}: SEOProps) {
  const siteTitle = title 
    ? `${title} | Reverence Technology` 
    : 'Web Design & Software Development Company in Uganda | Reverence Technology';
    
  const siteDescription = description || 'Leading web design & software development company in Kampala, Uganda. Custom websites, mobile apps & IT solutions for East Africa. 5+ years experience. Get free quote today!';
  
  const siteKeywords = keywords || 'web design companies in Uganda, software development companies in Uganda, website developers Kampala, mobile app development Uganda, custom software developers East Africa, tech companies Uganda, IT companies Kampala, affordable web design Uganda, best software company Kampala';
  
  const siteOgTitle = ogTitle || siteTitle;
  const siteOgDescription = ogDescription || siteDescription;
  const siteOgImage = ogImage || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80';
  const siteOgUrl =
    ogUrl || (typeof window !== 'undefined' ? window.location.href : '');
  
  const siteTwitterTitle = twitterTitle || siteOgTitle;
  const siteTwitterDescription = twitterDescription || siteOgDescription;
  const siteTwitterImage = twitterImage || siteOgImage;

  return (
    <Helmet>
      <title>{siteTitle}</title>
      <meta name="description" content={siteDescription} />
      <meta name="keywords" content={siteKeywords} />
      
      {/* Open Graph */}
      <meta property="og:title" content={siteOgTitle} />
      <meta property="og:description" content={siteOgDescription} />
      <meta property="og:image" content={siteOgImage} />
      <meta property="og:url" content={siteOgUrl} />
      <meta property="og:type" content={ogType} />
      
      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={siteTwitterTitle} />
      <meta name="twitter:description" content={siteTwitterDescription} />
      <meta name="twitter:image" content={siteTwitterImage} />
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {children}
    </Helmet>
  );
}