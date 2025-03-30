'use client';

import { useState, useEffect, useRef } from 'react';
import styles from '../../app/admin/admin.module.css';
import { fetchContent, updateContent, setupContentPolling } from '@/utils/contentSync';

interface Skill {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  backgroundImage: string;
  proficiencyLevel: number;
  learnMoreLink: string;
}

interface ImageData {
  name: string;
  data: string;
  type: string;
  size: number;
  timestamp: number;
}

export default function ExpertiseManager() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: '',
    iconColor: '#0066ff',
    backgroundImage: '',
    proficiencyLevel: 80,
    learnMoreLink: ''
  });

  useEffect(() => {
    loadSkills();
    loadUploadedImages();
    
    // Set up polling for real-time updates
    const cleanupPolling = setupContentPolling((data) => {
      if (data.siteSkills) {
        try {
          setSkills(JSON.parse(data.siteSkills));
        } catch (error) {
          console.error('Error parsing skills from API:', error);
        }
      }
      
      if (data.uploadedImages) {
        try {
          const apiImages = JSON.parse(data.uploadedImages);
          localStorage.setItem('uploadedImages', JSON.stringify(apiImages));
        } catch (error) {
          console.error('Error parsing uploaded images from API:', error);
        }
      }
    });
    
    return () => {
      if (cleanupPolling) cleanupPolling();
    };
  }, []);

  const loadSkills = async () => {
    try {
      // Try to get skills from the API first
      const apiContent = await fetchContent();
      
      if (apiContent && apiContent.siteSkills) {
        setSkills(JSON.parse(apiContent.siteSkills));
      } else {
        // Fallback to localStorage if API fails
        const savedSkills = localStorage.getItem('siteSkills');
        if (savedSkills) {
          setSkills(JSON.parse(savedSkills));
        } else {
          // Default skills if none exist
          const defaultSkills = [
            {
              id: '1',
              title: 'Web Development',
              description: 'Building responsive websites and web applications',
              icon: 'fa-code',
              iconColor: '#0066ff',
              backgroundImage: '/images/web-dev-bg.jpg',
              proficiencyLevel: 90,
              learnMoreLink: 'https://example.com/web-development'
            },
            {
              id: '2',
              title: 'UI/UX Design',
              description: 'Creating intuitive and beautiful user interfaces',
              icon: 'fa-palette',
              iconColor: '#ff6600',
              backgroundImage: '/images/uiux-bg.jpg',
              proficiencyLevel: 85,
              learnMoreLink: 'https://example.com/ui-ux-design'
            }
          ];
          setSkills(defaultSkills);
          saveSkills(defaultSkills);
        }
      }
    } catch (error) {
      console.error('Error loading skills:', error);
    }
  };

  const loadUploadedImages = async () => {
    try {
      // Try to get uploaded images from the API first
      const apiContent = await fetchContent();
      
      if (apiContent && apiContent.uploadedImages) {
        localStorage.setItem('uploadedImages', apiContent.uploadedImages);
      }
    } catch (error) {
      console.error('Error loading uploaded images:', error);
    }
  };

  const saveSkills = async (updatedSkills: Skill[]) => {
    // Save to localStorage for immediate local updates
    localStorage.setItem('siteSkills', JSON.stringify(updatedSkills));
    
    // Save to API for cross-device synchronization
    try {
      await updateContent('siteSkills', JSON.stringify(updatedSkills));
      
      // Dispatch a custom event for real-time updates within the same tab
      const event = new CustomEvent('contentUpdated', {
        detail: {
          type: 'skills',
          content: updatedSkills
        }
      });
      window.dispatchEvent(event);
      
      // Also dispatch the skillsUpdated event for the ExpertiseSection component
      const skillsEvent = new CustomEvent('skillsUpdated', {
        detail: {
          skills: updatedSkills
        }
      });
      window.dispatchEvent(skillsEvent);
    } catch (error) {
      console.error('Error saving skills to API:', error);
    }
  };

  const saveUploadedImages = async (images: ImageData[]) => {
    // Save to localStorage for immediate local updates
    localStorage.setItem('uploadedImages', JSON.stringify(images));
    
    // Save to API for cross-device synchronization
    try {
      await updateContent('uploadedImages', JSON.stringify(images));
    } catch (error) {
      console.error('Error saving uploaded images to API:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: parseInt(value, 10)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleAddNew = () => {
    setFormData({
      title: '',
      description: '',
      icon: '',
      iconColor: '#0066ff',
      backgroundImage: '',
      proficiencyLevel: 80,
      learnMoreLink: ''
    });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleEdit = (skill: Skill) => {
    setFormData({
      title: skill.title,
      description: skill.description,
      icon: skill.icon,
      iconColor: skill.iconColor || '#0066ff',
      backgroundImage: skill.backgroundImage || '',
      proficiencyLevel: skill.proficiencyLevel || 80,
      learnMoreLink: skill.learnMoreLink || ''
    });
    setEditingId(skill.id);
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this skill?')) {
      const updatedSkills = skills.filter(skill => skill.id !== id);
      setSkills(updatedSkills);
      saveSkills(updatedSkills);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      // Update existing skill
      const updatedSkills = skills.map(skill => 
        skill.id === editingId ? { ...skill, ...formData } : skill
      );
      setSkills(updatedSkills);
      saveSkills(updatedSkills);
      setEditingId(null);
    } else {
      // Add new skill
      const newSkill = {
        id: Date.now().toString(),
        ...formData
      };
      const updatedSkills = [...skills, newSkill];
      setSkills(updatedSkills);
      saveSkills(updatedSkills);
      setIsAdding(false);
    }
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      icon: '',
      iconColor: '#0066ff',
      backgroundImage: '',
      proficiencyLevel: 80,
      learnMoreLink: ''
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      icon: '',
      iconColor: '#0066ff',
      backgroundImage: '',
      proficiencyLevel: 80,
      learnMoreLink: ''
    });
  };

  // Handle file selection for background image upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      setUploadProgress(0);
      
      // Create a simulated upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Convert the file to base64
      const base64 = await convertFileToBase64(file);
      
      // Store the image in localStorage and API
      const timestamp = Date.now();
      const imageName = `expertise_bg_${timestamp}_${file.name.replace(/\s+/g, '_')}`;
      const imageData = {
        name: imageName,
        data: base64,
        type: file.type,
        size: file.size,
        timestamp
      };

      // Get existing images or create new array
      const existingImagesStr = localStorage.getItem('uploadedImages') || '[]';
      const existingImages = JSON.parse(existingImagesStr);
      
      // Add new image to array
      existingImages.push(imageData);
      
      // Save to localStorage and API
      await saveUploadedImages(existingImages);
      
      // Update form data with the image URL (using data URL for immediate display)
      setFormData({
        ...formData,
        backgroundImage: base64
      });

      // Complete progress
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Reset after a short delay
      setTimeout(() => {
        setUploadingImage(false);
        setUploadProgress(0);
      }, 500);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadingImage(false);
      setUploadProgress(0);
      alert('Failed to upload image. Please try again.');
    }
  };

  // Convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div>
      <h2 className={styles.sectionTitle}>Expertise Manager</h2>
      
      {!isAdding && !editingId && (
        <button onClick={handleAddNew} className={styles.actionButton}>
          Add New Skill
        </button>
      )}
      
      {(isAdding || editingId) && (
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="title">Skill Title:</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="description">Description:</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="icon">Font Awesome Icon Code:</label>
            <input
              type="text"
              id="icon"
              name="icon"
              value={formData.icon}
              onChange={handleInputChange}
              required
            />
            <small>Enter the Font Awesome icon code (e.g., 'fa-code', 'fa-palette')</small>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="iconColor">Icon Color:</label>
            <div className={styles.colorPickerContainer}>
              <input
                type="color"
                id="iconColor"
                name="iconColor"
                value={formData.iconColor}
                onChange={handleInputChange}
              />
              <input
                type="text"
                value={formData.iconColor}
                onChange={handleInputChange}
                name="iconColor"
              />
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="backgroundImage">Background Image:</label>
            <div className={styles.imageUploadContainer}>
              <input
                type="text"
                id="backgroundImage"
                name="backgroundImage"
                value={formData.backgroundImage}
                onChange={handleInputChange}
                placeholder="Enter image URL or upload an image"
              />
              <button 
                type="button" 
                onClick={triggerFileInput}
                className={styles.uploadButton}
                disabled={uploadingImage}
              >
                {uploadingImage ? 'Uploading...' : 'Upload Image'}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </div>
            {uploadingImage && (
              <div className={styles.progressContainer}>
                <div 
                  className={styles.progressBar} 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
                <span>{uploadProgress}%</span>
              </div>
            )}
            {formData.backgroundImage && (
              <div className={styles.imagePreview}>
                <img 
                  src={formData.backgroundImage} 
                  alt="Background preview" 
                  style={{ maxWidth: '100%', maxHeight: '150px', marginTop: '10px' }}
                />
              </div>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="proficiencyLevel">Proficiency Level (%):</label>
            <input
              type="number"
              id="proficiencyLevel"
              name="proficiencyLevel"
              value={formData.proficiencyLevel}
              onChange={handleInputChange}
              min="0"
              max="100"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="learnMoreLink">Learn More Link:</label>
            <input
              type="text"
              id="learnMoreLink"
              name="learnMoreLink"
              value={formData.learnMoreLink}
              onChange={handleInputChange}
              placeholder="https://example.com"
            />
          </div>
          
          <div className={styles.formActions}>
            <button type="submit" className={styles.saveButton}>
              {editingId ? 'Update Skill' : 'Add Skill'}
            </button>
            <button type="button" onClick={handleCancel} className={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </form>
      )}
      
      <div className={styles.itemsList}>
        <h3>Current Skills</h3>
        {skills.length === 0 ? (
          <p>No skills added yet.</p>
        ) : (
          <div className={styles.responsiveGrid}>
            {skills.map(skill => (
              <div key={skill.id} className={styles.responsiveItemCard}>
                <h4 className={styles.skillTitle}>{skill.title}</h4>
                <p className={styles.skillDescription}>{skill.description}</p>
                
                <div className={styles.skillDetails}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Icon:</span> 
                    <span className={styles.detailValue}>{skill.icon}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Color:</span> 
                    <span className={styles.detailValue}>
                      <span style={{ 
                        display: 'inline-block', 
                        width: '14px', 
                        height: '14px', 
                        backgroundColor: skill.iconColor,
                        marginRight: '5px',
                        borderRadius: '2px'
                      }}></span>
                      {skill.iconColor}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Proficiency:</span> 
                    <span className={styles.detailValue}>{skill.proficiencyLevel}%</span>
                  </div>
                </div>
                
                {skill.backgroundImage && (
                  <div className={styles.responsiveImageContainer}>
                    <img 
                      src={skill.backgroundImage} 
                      alt={`${skill.title} background`} 
                      className={styles.responsiveImage}
                    />
                  </div>
                )}
                
                <div className={styles.responsiveItemActions}>
                  <button 
                    onClick={() => handleEdit(skill)} 
                    className={`${styles.actionButton} ${styles.editButton}`}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(skill.id)} 
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}