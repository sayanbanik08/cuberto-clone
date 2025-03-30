'use client';

import { useState, useEffect, useRef } from 'react';
import styles from '../../app/admin/admin.module.css';
import { fetchContent, updateContent, setupContentPolling } from '@/utils/contentSync';

interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  footer: string;
  backgroundStyle: string;
  technologies: string[];
  stack: string;
  projectUrl: string;
}

interface ImageData {
  name: string;
  data: string;
  type: string;
  size: number;
  timestamp: number;
}

export default function ProjectsManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [techInput, setTechInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    imageUrl: '',
    footer: '',
    backgroundStyle: '',
    technologies: [] as string[],
    stack: '',
    projectUrl: ''
  });

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const apiContent = await fetchContent();
        if (apiContent && apiContent.siteProjects) {
          try {
            const parsedProjects = JSON.parse(apiContent.siteProjects);
            console.log('ProjectsManager - Loaded projects from API:', parsedProjects.length);
            
            // Debug image URLs
            parsedProjects.forEach((project: Project) => {
              if (project.imageUrl) {
                console.log(`Project ${project.title} has image URL starting with: ${project.imageUrl.substring(0, 30)}`);
              }
            });
            
            setProjects(parsedProjects);
          } catch (error) {
            console.error('Error parsing API projects:', error);
            loadFromLocalStorage();
          }
        } else {
          console.log('No projects in API, checking localStorage');
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error('Error loading projects:', error);
        loadFromLocalStorage();
      }
    };

    // Helper to load from localStorage
    const loadFromLocalStorage = () => {
      try {
        const savedProjects = localStorage.getItem('siteProjects');
        if (savedProjects) {
          const parsedProjects = JSON.parse(savedProjects);
          console.log('ProjectsManager - Loaded projects from localStorage:', parsedProjects.length);
          setProjects(parsedProjects);
        } else {
          console.log('No projects in localStorage');
          setProjects([]);
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error);
        setProjects([]);
      }
    };

    loadProjects();
    loadUploadedImages();
    
    // Set up polling for real-time updates
    const cleanupPolling = setupContentPolling((data) => {
      if (data.siteProjects) {
        try {
          setProjects(JSON.parse(data.siteProjects));
        } catch (error) {
          console.error('Error parsing projects from API:', error);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleTechInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTechInput(e.target.value);
  };

  const handleAddTech = () => {
    if (techInput.trim()) {
      setFormData({
        ...formData,
        technologies: [...formData.technologies, techInput.trim()]
      });
      setTechInput('');
    }
  };

  const handleRemoveTech = (index: number) => {
    const updatedTechs = [...formData.technologies];
    updatedTechs.splice(index, 1);
    setFormData({
      ...formData,
      technologies: updatedTechs
    });
  };

  const handleAddNew = () => {
    setFormData({
      id: '',
      title: '',
      description: '',
      imageUrl: '',
      footer: '',
      backgroundStyle: '',
      technologies: [],
      stack: '',
      projectUrl: ''
    });
    setTechInput('');
    setIsAdding(true);
    setEditingId(null);
  };

  const handleEdit = (project: Project) => {
    setFormData({
      id: project.id,
      title: project.title || '',
      description: project.description || '',
      imageUrl: project.imageUrl || '',
      footer: project.footer || '',
      backgroundStyle: project.backgroundStyle || '',
      technologies: project.technologies || [],
      stack: project.stack || '',
      projectUrl: project.projectUrl || ''
    });
    setEditingId(project.id);
    setIsAdding(false);
  };

  // Add a helper function to compress images if they're too large
  const optimizeImageIfNeeded = (imageUrl: string): string => {
    // If it's not a base64 image, return as is
    if (!imageUrl || !imageUrl.startsWith('data:image')) {
      return imageUrl;
    }
    
    try {
      // For base64 images, check if they're too large
      const sizeInBytes = Math.ceil((imageUrl.length * 3) / 4);
      const sizeInMB = sizeInBytes / (1024 * 1024);
      
      // Log the image size for debugging
      console.log(`Image size: ${sizeInMB.toFixed(2)}MB`);
      
      // IMPORTANT: No longer truncate base64 data as it breaks images
      // Instead, just return the original image data
      return imageUrl;
    } catch (e) {
      console.error('Error optimizing image:', e);
      return imageUrl;
    }
  };

  // Helper function to safely store data in localStorage with compression if needed
  const safelyStoreInLocalStorage = (key: string, data: string): boolean => {
    try {
      // Try to store directly first
      localStorage.setItem(key, data);
      return true;
    } catch (storageError) {
      console.warn('Storage error, attempting with compression:', storageError);
      
      try {
        // If direct storage fails, try to compress the data
        const compressedData = compressData(data);
        localStorage.setItem(key, compressedData);
        localStorage.setItem(`${key}_compressed`, 'true');
        console.log(`Successfully stored compressed data for ${key}`);
        return true;
      } catch (compressionError) {
        console.error('Failed even with compression:', compressionError);
        return false;
      }
    }
  };
  
  // Simple data compression function
  const compressData = (data: string): string => {
    // We should avoid modifying the images in the compression function
    try {
      // First, try parsing the JSON
      const parsed = JSON.parse(data);
      
      if (Array.isArray(parsed)) {
        // For arrays of projects, don't modify the image data but log their sizes
        const totalSizeBefore = data.length / (1024 * 1024); // Size in MB
        console.log(`Project data size before optimizing: ${totalSizeBefore.toFixed(2)}MB`);
        
        let totalImageSize = 0;
        parsed.forEach(item => {
          // Just log image sizes for debugging
          if (item && typeof item === 'object' && 'imageUrl' in item && 
              typeof item.imageUrl === 'string' && item.imageUrl.startsWith('data:image')) {
            const imgSize = item.imageUrl.length / (1024 * 1024);
            totalImageSize += imgSize;
            console.log(`Image in ${item.title || 'unknown'}: ${imgSize.toFixed(2)}MB`);
          }
        });
        console.log(`Total images size: ${totalImageSize.toFixed(2)}MB`);
      }
      
      // Return the original data unmodified
      return data;
    } catch (e) {
      console.error('Error in compression:', e);
      return data;
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        const updatedProjects = projects.filter(project => project.id !== id);
        
        // Update local state first for immediate UI update
        setProjects(updatedProjects);
        
        // Save projects to API and localStorage
        try {
          // Create a deep copy to avoid reference issues
          const projectsCopy = JSON.parse(JSON.stringify(updatedProjects));
          
          // Convert to JSON
          const projectsJson = JSON.stringify(projectsCopy);
          
          // Save to localStorage for immediate local updates
          const savedLocally = safelyStoreInLocalStorage('siteProjects', projectsJson);
          if (!savedLocally) {
            console.warn('Failed to save to localStorage due to quota - continuing with API only');
          }
          
          // Then save to API for cross-device synchronization
          updateContent('siteProjects', projectsJson)
            .then(() => {
              console.log('Projects saved to API successfully after delete');
              // Broadcast updates after successful delete
              broadcastProjectsUpdate(projectsCopy);
            })
            .catch((apiError: Error) => {
              console.error('Error saving projects to API after delete:', apiError);
              // Even if API save fails, we've already updated localStorage
              alert(`Warning: Changes saved locally but not synced to server. Error: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
            });
        } catch (deleteError) {
          console.error('Error in handleDelete:', deleteError);
          alert(`Error deleting project: ${deleteError instanceof Error ? deleteError.message : 'Please try again.'}`);
          // Revert the state change if we couldn't save
          setProjects(projects);
        }
      } catch (operationError) {
        console.error('Error in delete operation:', operationError);
        alert(`Failed to delete project: ${operationError instanceof Error ? operationError.message : 'Unknown error'}`);
      }
    }
  };

  const handleSaveProject = async () => {
    try {
      setIsSaving(true);
      const timestamp = Date.now();
      
      // Validate required fields
      if (!formData.title || !formData.description) {
        alert('Title and Description are required fields.');
        setIsSaving(false);
        return;
      }
      
      let projectId = formData.id;
      if (!projectId) {
        // Generate a new ID for new projects
        projectId = `project_${timestamp}`;
      }
      
      // Ensure image is always stored as data URL
      let imageUrl = formData.imageUrl;
      
      // If the image is not already a data URL and it's a valid URL, attempt to convert it
      if (imageUrl && !imageUrl.startsWith('data:') && (imageUrl.startsWith('http') || imageUrl.startsWith('/'))) {
        try {
          // Create a temporary image element to load the URL
          const img = new Image();
          
          // Create a promise to wait for the image to load
          const imageLoaded = new Promise<string>((resolve, reject) => {
            img.onload = function() {
              try {
                // Create a canvas to convert to data URL
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                
                if (ctx) {
                  // Draw image to canvas
                  ctx.drawImage(img, 0, 0);
                  
                  // Convert to data URL
                  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                  resolve(dataUrl);
                } else {
                  // If canvas context fails, use original URL
                  resolve(imageUrl);
                }
              } catch (error) {
                console.error('Error converting image to data URL:', error);
                resolve(imageUrl);
              }
            };
            
            img.onerror = function() {
              console.error('Failed to load image for conversion to data URL');
              resolve(imageUrl);
            };
          });
          
          // Set up a timeout to avoid hanging
          const timeout = new Promise<string>((resolve) => {
            setTimeout(() => resolve(imageUrl), 3000);
          });
          
          // Start loading the image
          img.src = imageUrl;
          
          // Wait for image to load or timeout
          imageUrl = await Promise.race([imageLoaded, timeout]);
          console.log('Image converted to data URL:', imageUrl.substring(0, 30) + '...');
        } catch (error) {
          console.error('Error processing image URL:', error);
          // Keep original URL if conversion fails
        }
      }
      
      // Create the final project object with the potentially converted image URL
      const updatedProject = {
        ...formData,
        id: projectId,
        imageUrl: imageUrl
      };
      
      // Get current projects
      let updatedProjects = [...projects];
      
      if (editingId) {
        // Update existing project
        const index = updatedProjects.findIndex(p => p.id === editingId);
        if (index !== -1) {
          updatedProjects[index] = updatedProject;
        }
      } else {
        // Add new project
        updatedProjects = [...updatedProjects, updatedProject];
      }
      
      // Log the image URLs for debugging
      console.log(`Project "${updatedProject.title}" image URL starts with: ${updatedProject.imageUrl.substring(0, 30)}...`);
      
      // Update state
      setProjects(updatedProjects);
      
      // Store in localStorage and API
      const projectsString = JSON.stringify(updatedProjects);
      const stored = safelyStoreInLocalStorage('siteProjects', projectsString);
      
      if (!stored) {
        console.warn('Projects data is too large for localStorage. Trying compression...');
        const compressedData = compressData(projectsString);
        const storedCompressed = safelyStoreInLocalStorage('siteProjects', compressedData);
        
        if (storedCompressed) {
          // Mark as compressed
          safelyStoreInLocalStorage('siteProjects_compressed', 'true');
        } else {
          console.error('Failed to store projects data even after compression');
        }
      } else {
        // Not compressed
        try {
          localStorage.removeItem('siteProjects_compressed');
        } catch (e) {
          // Ignore errors with localStorage removal
        }
      }
      
      // Send to API
      try {
        await updateContent('siteProjects', projectsString);
        console.log('Projects updated successfully in API');
      } catch (apiError) {
        console.error('Error updating projects in API:', apiError);
        alert('Projects saved locally but failed to update on server. Changes may not be visible to others until you reconnect.');
      }
      
      // Reset form and state
      setFormData({
        id: '',
        title: '',
        description: '',
        imageUrl: '',
        footer: '',
        backgroundStyle: '',
        technologies: [],
        stack: '',
        projectUrl: ''
      });
      setIsAdding(false);
      setEditingId(null);
      
      // Broadcast the update to other components
      broadcastProjectsUpdate(updatedProjects);
      
      // Show confirmation
      alert('Project saved successfully!');
    } catch (error) {
      console.error('Error saving project:', error);
      alert('An error occurred while saving the project. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      id: '',
      title: '',
      description: '',
      imageUrl: '',
      footer: '',
      backgroundStyle: '',
      technologies: [],
      stack: '',
      projectUrl: ''
    });
    setTechInput('');
  };

  // Helper function to broadcast project updates
  const broadcastProjectsUpdate = (updatedProjects: Project[]) => {
    console.log('Broadcasting project updates to all components:', updatedProjects);
    
    try {
      // First ensure the projects are valid
      if (!Array.isArray(updatedProjects)) {
        console.error('broadcastProjectsUpdate: projects is not an array');
        return;
      }
      
      // Make a clean copy to avoid reference issues or circular structures
      const safeCopy = updatedProjects.map(project => ({
        id: project.id,
        title: project.title || '',
        description: project.description || '',
        imageUrl: project.imageUrl || '',
        footer: project.footer || '',
        backgroundStyle: project.backgroundStyle || '',
        technologies: Array.isArray(project.technologies) ? [...project.technologies] : [],
        stack: project.stack || '',
        projectUrl: project.projectUrl || ''
      }));
      
      // Dispatch projectsUpdated event for real-time updates
      const projectsEvent = new CustomEvent('projectsUpdated', {
        detail: { projects: safeCopy }
      });
      window.dispatchEvent(projectsEvent);
      
      // Also dispatch contentUpdated event for components that listen to that
      const contentEvent = new CustomEvent('contentUpdated', {
        detail: { type: 'projects', content: safeCopy }
      });
      window.dispatchEvent(contentEvent);
      
      // Force a storage event to notify other tabs
      try {
        const projectsJson = JSON.stringify(safeCopy);
        localStorage.setItem('siteProjects', projectsJson);
        
        // This trick forces a storage event in the same tab
        const tempKey = 'temp_projects_' + Date.now();
        localStorage.setItem(tempKey, '1');
        localStorage.removeItem(tempKey);
      } catch (storageError) {
        console.error('Error forcing storage event:', storageError);
      }
      
      console.log('Broadcast complete - project updates sent to all components');
    } catch (error) {
      console.error('Error in broadcastProjectsUpdate:', error);
    }
  };

  // Handle file selection for project image upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      // Basic validation
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Check file size and warn if it's too large
      if (file.size > 3 * 1024 * 1024) {
        alert('Image size is larger than 3MB. It will be automatically optimized to prevent storage issues.');
      }

      // Start upload process
      setUploadingImage(true);
      setUploadProgress(10);
      
      // Optimize image before storing
      const optimizedImage = await optimizeImageUpload(file);
      setUploadProgress(80);

      // Update form data with the optimized image
      setFormData(prev => ({
        ...prev,
        imageUrl: optimizedImage
      }));
      
      // Complete the upload process
      setUploadProgress(100);
      setTimeout(() => {
        setUploadingImage(false);
        setUploadProgress(0);
      }, 500);
      
    } catch (error) {
      console.error('Error in handleFileChange:', error);
      setUploadingImage(false);
      setUploadProgress(0);
      alert('Failed to upload image. Please try again.');
    }
  };
  
  // Function to optimize image upload
  const optimizeImageUpload = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = function(event) {
        if (event.target && event.target.result) {
          try {
            const img = new Image();
            const resultString = event.target.result.toString();
            
            // Log file details for debugging
            console.log(`Image upload: type=${file.type}, size=${(file.size / (1024 * 1024)).toFixed(2)}MB, name=${file.name}`);
            
            // Load the image to process
            img.onload = function() {
              try {
                // Create a canvas to resize the image
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                if (!ctx) {
                  // If canvas isn't supported, just return the original
                  console.log('Canvas not supported, using original image');
                  resolve(resultString);
                  return;
                }
                
                // Get image dimensions
                const originalWidth = img.width;
                const originalHeight = img.height;
                console.log(`Original image dimensions: ${originalWidth}x${originalHeight}`);
                
                // Define target size - limited to max 1000px in either dimension
                // while maintaining aspect ratio
                const MAX_SIZE = 1000;
                let targetWidth = originalWidth;
                let targetHeight = originalHeight;
                
                // Resize if needed
                if (originalWidth > MAX_SIZE || originalHeight > MAX_SIZE) {
                  if (originalWidth > originalHeight) {
                    targetWidth = MAX_SIZE;
                    targetHeight = Math.round(originalHeight * (MAX_SIZE / originalWidth));
                  } else {
                    targetHeight = MAX_SIZE;
                    targetWidth = Math.round(originalWidth * (MAX_SIZE / originalHeight));
                  }
                  console.log(`Resizing to: ${targetWidth}x${targetHeight}`);
                }
                
                // Set canvas dimensions
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                
                // Draw resized image on canvas
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                
                // Convert to data URL with appropriate format and quality
                let dataUrl;
                
                // Use appropriate format based on file type
                if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
                  dataUrl = canvas.toDataURL('image/jpeg', 0.85); // 85% quality JPEG
                } else if (file.type === 'image/png') {
                  dataUrl = canvas.toDataURL('image/png'); // PNG is lossless
                } else if (file.type === 'image/webp') {
                  dataUrl = canvas.toDataURL('image/webp', 0.85); // 85% quality WebP
                } else {
                  // Default to JPEG for other formats
                  dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                }
                
                // Log the size of the resulting data URL
                const resultSize = (dataUrl.length / (1024 * 1024)).toFixed(2);
                console.log(`Optimized image size: ${resultSize}MB`);
                
                // Use the optimized image
                resolve(dataUrl);
              } catch (canvasError) {
                console.error('Error processing image in canvas:', canvasError);
                // Fall back to original if optimization fails
                resolve(resultString);
              }
            };
            
            img.onerror = function() {
              console.error('Error loading image for optimization');
              // Fall back to original
              resolve(resultString);
            };
            
            // Set the source to start loading
            img.src = resultString;
            
          } catch (processingError) {
            console.error('Error during image processing:', processingError);
            // Fall back to original if there's an error
            if (event.target && event.target.result) {
              resolve(event.target.result.toString());
            } else {
              reject(new Error('Failed to process image'));
            }
          }
        } else {
          reject(new Error('Failed to load file'));
        }
      };
      
      reader.onerror = function() {
        console.error('FileReader error:', reader.error);
        reject(reader.error);
      };
      
      // Read the file as data URL
      reader.readAsDataURL(file);
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
      <h2 className={styles.sectionTitle}>Projects Manager</h2>
      
      {!isAdding && !editingId && (
        <button onClick={handleAddNew} className={styles.actionButton}>
          Add New Project
        </button>
      )}
      
      {(isAdding || editingId) && (
        <form onSubmit={(e) => e.preventDefault()} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="title">Project Title:</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Todo Application"
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
              placeholder="Detailed description of your project"
              rows={4}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="footer">Project Footer Text:</label>
            <input
              type="text"
              id="footer"
              name="footer"
              value={formData.footer}
              onChange={handleInputChange}
              placeholder="e.g., Organize your tasks seamlessly"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="backgroundStyle">Background Style (CSS):</label>
            <textarea
              id="backgroundStyle"
              name="backgroundStyle"
              value={formData.backgroundStyle}
              onChange={handleInputChange}
              placeholder="e.g., background-color: #e3e3e3; background-image: linear-gradient(0deg, #e3e3e3 34%, #97D9E1 63%);"
              rows={3}
            />
            <small>Enter CSS background properties. You can use colors, gradients, etc.</small>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="stack">Technology Stack:</label>
            <input
              type="text"
              id="stack"
              name="stack"
              value={formData.stack}
              onChange={handleInputChange}
              placeholder="e.g., MERN Stack, LAMP Stack"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Technologies Used:</label>
            <div className={styles.techInputContainer}>
              <input
                type="text"
                value={techInput}
                onChange={handleTechInputChange}
                placeholder="e.g., React, Node.js"
              />
              <button 
                type="button" 
                onClick={handleAddTech}
                className={styles.addTechButton}
              >
                Add
              </button>
            </div>
            
            {formData.technologies.length > 0 && (
              <div className={styles.techList}>
                {formData.technologies.map((tech, index) => (
                  <div key={index} className={styles.techItem}>
                    <span>{tech}</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveTech(index)}
                      className={styles.removeTechButton}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="projectUrl">Project URL (for play button):</label>
            <input
              type="text"
              id="projectUrl"
              name="projectUrl"
              value={formData.projectUrl}
              onChange={handleInputChange}
              placeholder="https://example.com/project"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="imageUrl">Project Image:</label>
            <div className={styles.imageUploadContainer}>
              <input
                type="text"
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
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
            {formData.imageUrl && (
              <div className={styles.imagePreview}>
                <img 
                  src={formData.imageUrl} 
                  alt="Project preview" 
                  style={{ maxWidth: '100%', maxHeight: '200px', marginTop: '10px' }}
                />
              </div>
            )}
          </div>
          
          <div className={styles.formActions}>
            <button type="button" onClick={handleSaveProject} className={styles.saveButton}>
              {editingId ? 'Update Project' : 'Add Project'}
            </button>
            <button type="button" onClick={handleCancel} className={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </form>
      )}
      
      <div className={styles.itemsList}>
        <h3>Current Projects</h3>
        {projects.length === 0 ? (
          <p>No projects added yet.</p>
        ) : (
          <div className={styles.responsiveGrid}>
            {projects.map(project => (
              <div key={project.id} className={styles.responsiveItemCard}>
                <h4 className={styles.projectTitle}>{project.title}</h4>
                <p className={styles.projectDescription}>{project.description}</p>
                
                <div className={styles.projectDetails}>
                  {project.footer && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Footer:</span> 
                      <span className={styles.detailValue}>{project.footer}</span>
                    </div>
                  )}
                  {project.stack && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Stack:</span> 
                      <span className={styles.detailValue}>{project.stack}</span>
                    </div>
                  )}
                  {project.projectUrl && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>URL:</span> 
                      <span className={styles.detailValue}>
                        <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" className={styles.projectLink}>
                          {project.projectUrl.replace(/^https?:\/\//, '')}
                        </a>
                      </span>
                    </div>
                  )}
                </div>
                
                {project.technologies && project.technologies.length > 0 && (
                  <div className={styles.techContainer}>
                    <span className={styles.techLabel}>Technologies:</span>
                    <div className={styles.techTags}>
                      {project.technologies.map((tech, index) => (
                        <span key={index} className={styles.techTag}>{tech}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {project.backgroundStyle && (
                  <div className={styles.bgStyleContainer}>
                    <span className={styles.bgStyleLabel}>Background:</span>
                    <div 
                      className={styles.bgStylePreview} 
                      style={{ ...parseStyleString(project.backgroundStyle) }}
                    ></div>
                  </div>
                )}
                
                {project.imageUrl && (
                  <div className={styles.responsiveImageContainer}>
                    <img 
                      src={project.imageUrl} 
                      alt={`${project.title} preview`} 
                      className={styles.responsiveImage}
                    />
                  </div>
                )}
                
                <div className={styles.responsiveItemActions}>
                  <button 
                    onClick={() => handleEdit(project)} 
                    className={`${styles.actionButton} ${styles.editButton}`}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(project.id)} 
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

// Helper function to parse CSS style string into object
function parseStyleString(styleString: string): React.CSSProperties {
  if (!styleString) return {};
  
  try {
    const styleObject: Record<string, string> = {};
    const styles = styleString.split(';');
    
    styles.forEach(style => {
      const [property, value] = style.split(':');
      if (property && value) {
        const formattedProperty = property.trim();
        const formattedValue = value.trim();
        
        // Convert kebab-case to camelCase for React
        const camelCaseProperty = formattedProperty.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        
        styleObject[camelCaseProperty] = formattedValue;
      }
    });
    
    return styleObject as React.CSSProperties;
  } catch (error) {
    console.error('Error parsing style string:', error);
    return {};
  }
}