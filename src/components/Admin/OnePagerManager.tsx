'use client';

import { useState, useEffect } from 'react';
import styles from '../../app/admin/admin.module.css';

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

export default function OnePagerManager() {
  const [content, setContent] = useState<OnePagerContent>({
    title: '',
    subtitle: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    socialLinks: []
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingSocialId, setEditingSocialId] = useState<string | null>(null);
  const [addingSocial, setAddingSocial] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    contactEmail: '',
    contactPhone: ''
  });
  
  const [socialForm, setSocialForm] = useState({
    platform: '',
    url: ''
  });

  useEffect(() => {
    // In a real app, fetch one pager content from your database or API
    const savedContent = localStorage.getItem('siteOnePagerContent');
    if (savedContent) {
      setContent(JSON.parse(savedContent));
    } else {
      // Default content if none exists
      const defaultContent = {
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
      };
      setContent(defaultContent);
      localStorage.setItem('siteOnePagerContent', JSON.stringify(defaultContent));
    }
  }, []);

  // Main content handlers
  const handleEditContent = () => {
    setFormData({
      title: content.title,
      subtitle: content.subtitle,
      description: content.description,
      contactEmail: content.contactEmail,
      contactPhone: content.contactPhone
    });
    setIsEditing(true);
  };

  const handleSaveContent = () => {
    const updatedContent = { 
      ...content,
      title: formData.title,
      subtitle: formData.subtitle,
      description: formData.description,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone
    };
    setContent(updatedContent);
    localStorage.setItem('siteOnePagerContent', JSON.stringify(updatedContent));
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Social links handlers
  const handleAddSocial = () => {
    setSocialForm({
      platform: '',
      url: ''
    });
    setAddingSocial(true);
    setEditingSocialId(null);
  };

  const handleEditSocial = (social: SocialLink) => {
    setSocialForm({
      platform: social.platform,
      url: social.url
    });
    setEditingSocialId(social.id);
    setAddingSocial(false);
  };

  const handleDeleteSocial = (id: string) => {
    if (confirm('Are you sure you want to delete this social link?')) {
      const updatedLinks = content.socialLinks.filter(link => link.id !== id);
      const updatedContent = { ...content, socialLinks: updatedLinks };
      setContent(updatedContent);
      localStorage.setItem('siteOnePagerContent', JSON.stringify(updatedContent));
    }
  };

  const handleSaveSocial = () => {
    let updatedLinks;
    
    if (editingSocialId) {
      // Update existing social link
      updatedLinks = content.socialLinks.map(link => 
        link.id === editingSocialId ? { ...link, ...socialForm } : link
      );
    } else {
      // Add new social link
      const newLink = {
        id: Date.now().toString(),
        ...socialForm
      };
      updatedLinks = [...content.socialLinks, newLink];
    }
    
    const updatedContent = { ...content, socialLinks: updatedLinks };
    setContent(updatedContent);
    localStorage.setItem('siteOnePagerContent', JSON.stringify(updatedContent));
    
    setEditingSocialId(null);
    setAddingSocial(false);
  };

  return (
    <div>
      <h2 className={styles.sectionTitle}>One Pager Manager</h2>
      
      <div className={styles.itemCard}>
        <h3>Main Content</h3>
        
        {!isEditing ? (
          <div>
            <p><strong>Title:</strong> {content.title}</p>
            <p><strong>Subtitle:</strong> {content.subtitle}</p>
            <p><strong>Description:</strong> {content.description}</p>
            <p><strong>Contact Email:</strong> {content.contactEmail}</p>
            <p><strong>Contact Phone:</strong> {content.contactPhone}</p>
            
            <button onClick={handleEditContent} className={styles.actionButton}>
              Edit Content
            </button>
          </div>
        ) : (
          <div>
            <div className={styles.formGroup}>
              <label htmlFor="title">Title:</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="subtitle">Subtitle:</label>
              <input
                type="text"
                id="subtitle"
                name="subtitle"
                value={formData.subtitle}
                onChange={handleInputChange}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="description">Description:</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="contactEmail">Contact Email:</label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="contactPhone">Contact Phone:</label>
              <input
                type="text"
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <button onClick={handleSaveContent} className={styles.actionButton}>
                Save Changes
              </button>
              <button 
                onClick={() => setIsEditing(false)} 
                className={`${styles.actionButton} ${styles.deleteButton}`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className={styles.itemCard}>
        <h3>Social Links</h3>
        
        {!addingSocial && !editingSocialId && (
          <button onClick={handleAddSocial} className={styles.actionButton}>
            Add New Social Link
          </button>
        )}
        
        {(addingSocial || editingSocialId) && (
          <div className={styles.formGroup}>
            <h4>{editingSocialId ? 'Edit Social Link' : 'Add New Social Link'}</h4>
            
            <div className={styles.formGroup}>
              <label htmlFor="platform">Platform:</label>
              <input
                type="text"
                id="platform"
                value={socialForm.platform}
                onChange={(e) => setSocialForm({...socialForm, platform: e.target.value})}
                placeholder="e.g., LinkedIn, Twitter, GitHub"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="url">URL:</label>
              <input
                type="url"
                id="url"
                value={socialForm.url}
                onChange={(e) => setSocialForm({...socialForm, url: e.target.value})}
                placeholder="https://..."
                required
              />
            </div>
            
            <div>
              <button onClick={handleSaveSocial} className={styles.actionButton}>
                {editingSocialId ? 'Update Link' : 'Add Link'}
              </button>
              <button 
                onClick={() => {
                  setAddingSocial(false);
                  setEditingSocialId(null);
                }} 
                className={`${styles.actionButton} ${styles.deleteButton}`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        <div className={styles.itemsList}>
          <h4>Existing Social Links</h4>
          {content.socialLinks.map(link => (
            <div key={link.id} className={styles.itemCard}>
              <p><strong>{link.platform}:</strong> <a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a></p>
              
              <div className={styles.itemActions}>
                <button 
                  onClick={() => handleEditSocial(link)} 
                  className={`${styles.actionButton} ${styles.editButton}`}
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDeleteSocial(link.id)} 
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 