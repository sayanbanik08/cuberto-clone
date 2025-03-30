'use client';

import { useEffect, useState } from 'react';

// Define the interfaces
interface OnePagerContent {
  title: string;
  subtitle: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  socialLinks: SocialLink[];
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

export default function OnePagerSection() {
  const [content, setContent] = useState<OnePagerContent>({
    title: 'My Professional Profile',
    subtitle: 'Web Developer & Designer',
    description: 'This is a brief description about me and my professional services.',
    contactEmail: 'contact@example.com',
    contactPhone: '+1 (123) 456-7890',
    socialLinks: [
      {
        id: '1',
        platform: 'LinkedIn',
        url: 'https://linkedin.com/in/username'
      },
      {
        id: '2',
        platform: 'GitHub',
        url: 'https://github.com/username'
      }
    ]
  });

  useEffect(() => {
    // Check if there's custom one pager content in localStorage
    const savedContent = localStorage.getItem('siteOnePagerContent');
    if (savedContent) {
      setContent(JSON.parse(savedContent));
    }
  }, []);

  return (
    <section className="one-pager-section">
      <div className="header">
        <h1>{content.title}</h1>
        <h2>{content.subtitle}</h2>
      </div>
      
      <div className="description">
        <p>{content.description}</p>
      </div>
      
      <div className="contact-info">
        <p>Email: <a href={`mailto:${content.contactEmail}`}>{content.contactEmail}</a></p>
        <p>Phone: <a href={`tel:${content.contactPhone}`}>{content.contactPhone}</a></p>
      </div>
      
      <div className="social-links">
        {content.socialLinks.map(link => (
          <a 
            key={link.id} 
            href={link.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="social-link"
          >
            {link.platform}
          </a>
        ))}
      </div>
    </section>
  );
} 