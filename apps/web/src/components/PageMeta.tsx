import { useEffect } from 'react';

interface PageMetaProps {
  title: string;
  description: string;
  path: string;
}

export default function PageMeta({ title, description, path }: PageMetaProps) {
  useEffect(() => {
    document.title = `${title} | DealPilot AI`;
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
      if (!el) { el = document.createElement('meta'); (name.startsWith('og:') || name.startsWith('twitter:')) ? el.setAttribute('property', name) : el.setAttribute('name', name); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    setMeta('description', description);
    setMeta('og:title', `${title} | DealPilot AI`);
    setMeta('og:description', description);
    setMeta('og:url', `https://dealpilot.ai${path}`);
    setMeta('twitter:title', `${title} | DealPilot AI`);
    setMeta('twitter:description', description);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = `https://dealpilot.ai${path}`;
  }, [title, description, path]);

  return null;
}
