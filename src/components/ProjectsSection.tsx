'use client';

import { useEffect, useState } from 'react';
import { fetchContent, setupContentPolling } from '@/utils/contentSync';

// Define the Project interface
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

// Define cache version to prevent using outdated cache formats
const CACHE_VERSION = 'v1';

export default function ProjectsSection() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showSection, setShowSection] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  // New state to track if we're using cached data
  const [usingCachedData, setUsingCachedData] = useState(false);

  // Set isClient to true when component mounts on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Use inline SVG directly as fallback
  const DEFAULT_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect width="200" height="200" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';

  // Helper function to safely store data in localStorage with version tracking
  const safelyStore = (key: string, data: string, ttl: number = 30 * 24 * 60 * 60 * 1000): void => {
    try {
      const item = {
        version: CACHE_VERSION,
        data: data,
        timestamp: Date.now(),
        expiry: Date.now() + ttl
      };
      localStorage.setItem(key, JSON.stringify(item));
      // Also store a backup copy with different key
      localStorage.setItem(`${key}_backup`, JSON.stringify(item));
      console.log(`Data stored in localStorage: ${key}`);
    } catch (storageError) {
      console.warn('Storage quota exceeded, continuing without saving to localStorage');
    }
  };

  // Helper function to safely read from localStorage with fallback to backup
  const safelyReadFromLocalStorage = (key: string) => {
    try {
      // First try to get the main data
      const rawData = localStorage.getItem(key);
      
      if (!rawData) {
        // If main data not found, try backup
        console.log(`No data found for ${key}, trying backup...`);
        const backupData = localStorage.getItem(`${key}_backup`);
        if (!backupData) return null;
        
        try {
          // Parse the backup data
          const parsedBackup = JSON.parse(backupData);
          
          // Check if backup is valid and not expired
          if (parsedBackup.version === CACHE_VERSION && parsedBackup.expiry > Date.now()) {
            console.log(`Using backup data for ${key}`);
            // Restore the main copy from backup
            localStorage.setItem(key, backupData);
            return parsedBackup.data;
          }
          return null;
        } catch (backupError) {
          console.error(`Error parsing backup data for ${key}:`, backupError);
          return null;
        }
      }
      
      try {
        // Parse the main data
        const parsedData = JSON.parse(rawData);
        
        // Check if data is valid and not expired
        if (parsedData.version === CACHE_VERSION && parsedData.expiry > Date.now()) {
          return parsedData.data;
        }
        
        // If expired, try backup
        console.log(`Data for ${key} expired, trying backup...`);
        const backupData = localStorage.getItem(`${key}_backup`);
        if (!backupData) return null;
        
        const parsedBackup = JSON.parse(backupData);
        if (parsedBackup.version === CACHE_VERSION && parsedBackup.expiry > Date.now()) {
          console.log(`Using backup data for ${key}`);
          // Restore the main copy from backup
          localStorage.setItem(key, backupData);
          return parsedBackup.data;
        }
        
        return null;
      } catch (parseError) {
        console.error(`Error parsing data for ${key}:`, parseError);
        return null;
      }
    } catch (error) {
      console.error(`Error reading from localStorage key ${key}:`, error);
      return null;
    }
  };

  // Pre-cache images to ensure they're available even offline
  const precacheImages = (projectsData: Project[]) => {
    if (!isClient) return;
    
    projectsData.forEach(project => {
      if (project.imageUrl && !project.imageUrl.startsWith('data:')) {
        const img = new Image();
        img.src = project.imageUrl;
        
        // When image loads successfully, convert to data URL and cache it
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            // Set canvas size to match image
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw image on canvas
            ctx.drawImage(img, 0, 0);
            
            // Convert to data URL
            try {
              const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
              
              // Store the data URL in a separate cache
              const imageCache = JSON.parse(localStorage.getItem('projectImagesCache') || '{}');
              imageCache[project.id] = {
                url: project.imageUrl,
                dataUrl: dataUrl,
                timestamp: Date.now()
              };
              localStorage.setItem('projectImagesCache', JSON.stringify(imageCache));
              
              // IMPORTANT: We also update the projects array with the data URL
              // This ensures the image persists even after refresh
              if (!project.imageUrl.startsWith('data:')) {
                // Find the project in our state and update its imageUrl with the data URL
                const updatedProjects = [...projects];
                const projectIndex = updatedProjects.findIndex(p => p.id === project.id);
                
                if (projectIndex !== -1) {
                  // Create a copy with the updated imageUrl
                  const updatedProject = {
                    ...updatedProjects[projectIndex],
                    imageUrl: dataUrl
                  };
                  
                  // Replace the project in the array
                  updatedProjects[projectIndex] = updatedProject;
                  
                  // Update the state
                  setProjects(updatedProjects);
                  
                  // Also update the cache with this updated array
                  safelyStore('siteProjects', JSON.stringify(updatedProjects));
                }
              }
              console.log(`Image cached for project: ${project.id}`);
            } catch (e) {
              console.error('Error creating data URL:', e);
            }
          } catch (canvasError) {
            console.error('Error creating canvas for image caching:', canvasError);
          }
        };
        
        // Handle load errors silently - we'll fall back to the URL
        img.onerror = () => {
          console.warn(`Could not pre-cache image: ${project.imageUrl}`);
        };
      }
    });
  };

  // Get cached image if available
  const getCachedImage = (project: Project): string => {
    // If the project already has a data URL, use it directly
    if (project.imageUrl && project.imageUrl.startsWith('data:')) {
      return project.imageUrl;
    }
    
    if (!isClient) return project.imageUrl || DEFAULT_PLACEHOLDER;
    
    try {
      // Check if we have this image cached
      const imageCache = JSON.parse(localStorage.getItem('projectImagesCache') || '{}');
      const cachedImage = imageCache[project.id];
      
      if (cachedImage && cachedImage.url === project.imageUrl && cachedImage.dataUrl) {
        // We have a cached version of this exact URL
        console.log(`Using cached image for project: ${project.id}`);
        
        // Here we perform an important step: update the project's URL with the data URL
        // to ensure it persists after browser refresh
        const updatedProjects = [...projects];
        const projectIndex = updatedProjects.findIndex(p => p.id === project.id);
        
        if (projectIndex !== -1 && !updatedProjects[projectIndex].imageUrl.startsWith('data:')) {
          // Create a copy with the updated imageUrl
          const updatedProject = {
            ...updatedProjects[projectIndex],
            imageUrl: cachedImage.dataUrl
          };
          
          // Replace the project in the array
          updatedProjects[projectIndex] = updatedProject;
          
          // Update the state (this won't cause a re-render if it's the same project we're currently rendering)
          setProjects(updatedProjects);
          
          // Also update the cache with this updated array
          setTimeout(() => {
            safelyStore('siteProjects', JSON.stringify(updatedProjects));
          }, 0);
        }
        
        return cachedImage.dataUrl;
      }
      
      // No cached version found, return original URL
      return project.imageUrl || DEFAULT_PLACEHOLDER;
    } catch (error) {
      console.error('Error accessing image cache:', error);
      return project.imageUrl || DEFAULT_PLACEHOLDER;
    }
  };

  const fallbackToLocalStorage = () => {
    try {
      const savedProjects = safelyReadFromLocalStorage('siteProjects');
      console.log('Local storage projects:', savedProjects);
      
      if (savedProjects) {
        try {
          const parsedProjects = JSON.parse(savedProjects);
          console.log('Parsed projects from localStorage:', parsedProjects);
          
          if (parsedProjects && Array.isArray(parsedProjects) && parsedProjects.length > 0) {
            // Check if projects have actually changed to prevent unnecessary re-renders
            const currentIds = projects.map(p => p.id).sort().join(',');
            const newIds = parsedProjects.map(p => p.id).sort().join(',');
            
            if (currentIds !== newIds || projects.length === 0) {
              setProjects(parsedProjects);
              setShowSection(true);
              setError(null);
              setUsingCachedData(true);
              
              // Try to precache images even when using cached data
              precacheImages(parsedProjects);
            }
          } else {
            console.log('No valid projects in localStorage');
            setShowSection(false);
          }
        } catch (parseError) {
          console.error('Error parsing projects from localStorage:', parseError);
          setShowSection(false);
        }
      } else {
        console.log('No projects in localStorage');
        setShowSection(false);
      }
    } catch (localStorageError) {
      console.error('Error reading from localStorage:', localStorageError);
      setShowSection(false);
    }
  };

  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // First check if we have cached data, and use that immediately
        const cachedProjects = safelyReadFromLocalStorage('siteProjects');
        if (cachedProjects) {
          try {
            const parsedCachedProjects = JSON.parse(cachedProjects);
            if (parsedCachedProjects && Array.isArray(parsedCachedProjects) && parsedCachedProjects.length > 0) {
              console.log('Using cached projects initially:', parsedCachedProjects);
              setProjects(parsedCachedProjects);
              setShowSection(true);
              setUsingCachedData(true);
              // Don't set isLoading to false yet - continue loading from API in background
              
              // Precache images for faster loading next time
              precacheImages(parsedCachedProjects);
            }
          } catch (cacheParseError) {
            console.error('Error parsing cached projects:', cacheParseError);
            // Continue to API fetch
          }
        }
      
        // Try to get projects from the API (even if we already have cached data)
        const apiContent = await fetchContent();
        console.log('API Content received:', apiContent);
        
        if (apiContent && apiContent.siteProjects) {
          try {
            const parsedProjects = JSON.parse(apiContent.siteProjects);
            console.log('Parsed projects from API:', parsedProjects);
            if (parsedProjects && Array.isArray(parsedProjects) && parsedProjects.length > 0) {
              // Check if projects have actually changed to prevent unnecessary re-renders
              const currentIds = projects.map(p => p.id).sort().join(',');
              const newIds = parsedProjects.map(p => p.id).sort().join(',');
              
              if (currentIds !== newIds || projects.length === 0) {
                // First, check if we should preserve any data URLs from the existing projects
                const enhancedProjects = parsedProjects.map(newProject => {
                  // Look for this project in our current state to see if we have a data URL for it
                  const existingProject = projects.find(p => p.id === newProject.id);
                  
                  // If the existing project has a data URL and the new project doesn't,
                  // use the data URL from existing project
                  if (existingProject && 
                      existingProject.imageUrl && 
                      existingProject.imageUrl.startsWith('data:') && 
                      newProject.imageUrl && 
                      !newProject.imageUrl.startsWith('data:') &&
                      existingProject.imageUrl !== DEFAULT_PLACEHOLDER) {
                    return {
                      ...newProject,
                      imageUrl: existingProject.imageUrl
                    };
                  }
                  
                  return newProject;
                });
                
                setProjects(enhancedProjects);
                setShowSection(true);
                setUsingCachedData(false);
                
                // Precache new images for any new projects or projects without data URLs
                precacheImages(enhancedProjects);
                
                // Also update localStorage for offline access with the enhanced projects
                safelyStore('siteProjects', JSON.stringify(enhancedProjects));
              }
            } else {
              // Only hide section if we don't have cached data already displayed
              if (!usingCachedData) {
                console.log('No projects found in API response');
                setShowSection(false);
              }
            }
          } catch (parseError) {
            console.error('Error parsing projects from API:', parseError);
            setError('Failed to parse projects data');
            
            // Only show error and fall back if we're not already showing cached data
            if (!usingCachedData) {
              fallbackToLocalStorage();
            }
          }
        } else {
          console.log('No siteProjects in API response, falling back to localStorage');
          // Only fall back if we're not already showing cached data
          if (!usingCachedData) {
            fallbackToLocalStorage();
          }
        }
      } catch (error) {
        console.error('Error loading projects from API:', error);
        setError('Failed to load projects');
        
        // Only fall back if we're not already showing cached data
        if (!usingCachedData) {
          fallbackToLocalStorage();
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Load initial projects
    loadProjects();
    
    // Set up polling for real-time updates
    const cleanupPolling = setupContentPolling((data) => {
      if (data.siteProjects) {
        try {
          const parsedProjects = JSON.parse(data.siteProjects);
          console.log('Polling: Parsed projects from API:', parsedProjects);
          
          if (parsedProjects && Array.isArray(parsedProjects) && parsedProjects.length > 0) {
            // Preserve any data URLs from current projects
            const enhancedProjects = parsedProjects.map(newProject => {
              // Look for this project in our current state to see if we have a data URL for it
              const existingProject = projects.find(p => p.id === newProject.id);
              
              // If the existing project has a data URL and the new project doesn't,
              // use the data URL from existing project
              if (existingProject && 
                  existingProject.imageUrl && 
                  existingProject.imageUrl.startsWith('data:') && 
                  newProject.imageUrl && 
                  !newProject.imageUrl.startsWith('data:') &&
                  existingProject.imageUrl !== DEFAULT_PLACEHOLDER) {
                return {
                  ...newProject,
                  imageUrl: existingProject.imageUrl
                };
              }
              
              return newProject;
            });
            
            setProjects(enhancedProjects);
            setShowSection(true);
            setError(null);
            setUsingCachedData(false);
            
            // Update cache with the enhanced projects
            safelyStore('siteProjects', JSON.stringify(enhancedProjects));
            
            // Precache images only for projects that don't already have data URLs
            const projectsToCache = enhancedProjects.filter(p => 
              p.imageUrl && !p.imageUrl.startsWith('data:'));
            
            if (projectsToCache.length > 0) {
              precacheImages(projectsToCache);
            }
          } else {
            console.log('Polling: No valid projects in API response');
            // Do not hide section if we have cached data
            if (!usingCachedData) {
              setShowSection(false);
            }
          }
        } catch (error) {
          console.error('Polling: Error parsing projects from API:', error);
          // Don't set error during polling as it might be a temporary issue
        }
      }
    });
    
    // Listen for content updates from admin panel in the same tab
    const handleContentUpdate = (event: CustomEvent) => {
      if (event.detail.type === 'projects') {
        const updatedProjects = event.detail.content;
        console.log('ProjectsSection - Updated projects from admin panel:', updatedProjects);
        
        if (updatedProjects && Array.isArray(updatedProjects) && updatedProjects.length > 0) {
          // Preserve any data URLs from current projects
          const enhancedProjects = updatedProjects.map(newProject => {
            // Look for this project in our current state to see if we have a data URL for it
            const existingProject = projects.find(p => p.id === newProject.id);
            
            // If the existing project has a data URL and the new project doesn't,
            // use the data URL from existing project
            if (existingProject && 
                existingProject.imageUrl && 
                existingProject.imageUrl.startsWith('data:') && 
                newProject.imageUrl && 
                !newProject.imageUrl.startsWith('data:') &&
                existingProject.imageUrl !== DEFAULT_PLACEHOLDER) {
              return {
                ...newProject,
                imageUrl: existingProject.imageUrl
              };
            }
            
            return newProject;
          });
          
          setProjects(enhancedProjects);
          setShowSection(true);
          setError(null);
          setUsingCachedData(false);
          
          // Update cache with stringified enhanced content
          safelyStore('siteProjects', JSON.stringify(enhancedProjects));
          
          // Precache images only for projects that don't already have data URLs
          const projectsToCache = enhancedProjects.filter(p => 
            p.imageUrl && !p.imageUrl.startsWith('data:'));
          
          if (projectsToCache.length > 0) {
            precacheImages(projectsToCache);
          }
        } else {
          // Hide section if no projects and we're not using cached data
          if (!usingCachedData) {
            setShowSection(false);
          }
        }
      }
    };
    
    // Listen for projects updates from other components
    const handleProjectsUpdated = (event: CustomEvent) => {
      console.log('ProjectsSection - projectsUpdated event received:', event.detail);
      
      if (event.detail && event.detail.projects) {
        const updatedProjects = event.detail.projects;
        console.log('ProjectsSection - Updated projects from projectsUpdated event:', updatedProjects);
        
        if (updatedProjects && Array.isArray(updatedProjects) && updatedProjects.length > 0) {
          // Preserve any data URLs from current projects
          const enhancedProjects = updatedProjects.map(newProject => {
            // Look for this project in our current state to see if we have a data URL for it
            const existingProject = projects.find(p => p.id === newProject.id);
            
            // If the existing project has a data URL and the new project doesn't,
            // use the data URL from existing project
            if (existingProject && 
                existingProject.imageUrl && 
                existingProject.imageUrl.startsWith('data:') && 
                newProject.imageUrl && 
                !newProject.imageUrl.startsWith('data:') &&
                existingProject.imageUrl !== DEFAULT_PLACEHOLDER) {
              return {
                ...newProject,
                imageUrl: existingProject.imageUrl
              };
            }
            
            return newProject;
          });
          
          setProjects(enhancedProjects);
          setShowSection(true);
          setError(null);
          setUsingCachedData(false);
          
          // Update cache with stringified enhanced content
          safelyStore('siteProjects', JSON.stringify(enhancedProjects));
          
          // Precache images only for projects that don't already have data URLs
          const projectsToCache = enhancedProjects.filter(p => 
            p.imageUrl && !p.imageUrl.startsWith('data:'));
          
          if (projectsToCache.length > 0) {
            precacheImages(projectsToCache);
          }
        } else {
          // Hide section if no projects and we're not using cached data
          if (!usingCachedData) {
            setShowSection(false);
          }
        }
      }
    };
    
    // Add event listeners
    window.addEventListener('contentUpdated', handleContentUpdate as EventListener);
    window.addEventListener('projectsUpdated', handleProjectsUpdated as EventListener);
    
    return () => {
      if (cleanupPolling) cleanupPolling();
      window.removeEventListener('contentUpdated', handleContentUpdate as EventListener);
      window.removeEventListener('projectsUpdated', handleProjectsUpdated as EventListener);
    };
  }, []);

  // If still loading and we don't have cached data to display, show a loading indicator
  if (isLoading && !usingCachedData && (!projects || projects.length === 0)) {
    return (
      <section className="w-full py-16 md:py-24" id="projects">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-12">Projects</h2>
          <div className="flex justify-center items-center min-h-[300px]">
            <p className="text-lg">Loading projects...</p>
          </div>
        </div>
      </section>
    );
  }

  // If error and no projects, show error message
  if (error && (!projects || projects.length === 0)) {
    return (
      <section className="w-full py-16 md:py-24" id="projects">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-12">Projects</h2>
          <div className="flex justify-center items-center min-h-[300px]">
            <p className="text-lg text-red-500">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  // If no projects to show, don't render the section at all
  if (!showSection || !projects || projects.length === 0) {
    return null;
  }

  // Log the projects being rendered
  console.log('Rendering projects:', projects);

  return (
    <section className="w-full py-16 md:py-24" id="projects">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-12 text-center">Our Projects</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <div 
              key={project.id} 
              className="relative overflow-hidden transition-all duration-300 hover:opacity-95 h-[500px] md:h-[500px] lg:h-[650px] xl:h-[585px]"
              style={{
                backgroundImage: project.backgroundStyle || "linear-gradient(0deg, rgb(235, 249, 255) 32%, rgb(173, 209, 255) 50%, rgb(42, 136, 221) 100%)",
                backgroundColor: "rgb(235, 249, 255)",
                color: "black"
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <img 
                  alt={project.title} 
                  className="w-full h-full object-contain transition-all duration-500" 
                  loading="lazy" 
                  src={getCachedImage(project)} 
                  style={{ objectFit: "contain" }}
                  onError={(e) => {
                    console.error('ProjectsSection - Image failed to load:', project.title);
                    console.error('Image URL begins with:', project.imageUrl?.substring(0, 30));
                    
                    const imgElement = e.target as HTMLImageElement;
                    
                    // If it's a data URL that failed (unlikely), use placeholder
                    if (project.imageUrl?.startsWith('data:')) {
                      console.error('Data URL image failed to load');
                      imgElement.src = DEFAULT_PLACEHOLDER;
                      imgElement.onerror = null;
                      return;
                    }
                    
                    // First try the image cache explicitly
                    try {
                      const imageCache = JSON.parse(localStorage.getItem('projectImagesCache') || '{}');
                      const cachedImage = imageCache[project.id];
                      
                      if (cachedImage && cachedImage.dataUrl) {
                        console.log('ProjectsSection - Using cached image data URL as fallback');
                        imgElement.src = cachedImage.dataUrl;
                        imgElement.onerror = null;
                        return;
                      }
                    } catch (cacheError) {
                      console.error('Error accessing image cache in error handler:', cacheError);
                    }
                    
                    // If it's a regular URL, try different paths
                    const originalSrc = project.imageUrl;
                    if (originalSrc) {
                      // 1. If it's a relative path without leading slash, add one
                      if (!originalSrc.startsWith('data:') && !originalSrc.startsWith('http') && !originalSrc.startsWith('/')) {
                        console.log('ProjectsSection - Trying with / prefix');
                        imgElement.src = `/${originalSrc}`;
                        return;
                      }
                      
                      // 2. If it's a relative path with leading slash, try without it
                      if (originalSrc.startsWith('/') && !originalSrc.startsWith('//')) {
                        console.log('ProjectsSection - Trying without / prefix');
                        imgElement.src = originalSrc.substring(1);
                        return;
                      }
                    }
                    
                    // If all else fails, use inline SVG placeholder
                    imgElement.src = DEFAULT_PLACEHOLDER;
                    imgElement.onerror = null; // Prevent infinite error loop
                  }}
                />
              </div>
              
              <div 
                className="flex flex-col items-center justify-between h-full p-6 text-center relative z-10" 
                style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
              >
                <div className="absolute top-0 left-0 w-16 h-16 flex items-start justify-start p-4 hover-trigger">
                  <button 
                    className="flex items-center justify-center w-8 h-8 rounded-full transition-all shadow-sm" 
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                  >
                    <svg 
                      aria-hidden="true" 
                      focusable="false" 
                      data-prefix="fas" 
                      data-icon="circle-info" 
                      className="svg-inline--fa fa-circle-info text-white text-sm" 
                      role="img" 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 512 512"
                    >
                      <path 
                        fill="currentColor" 
                        d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336l24 0 0-64-24 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l48 0c13.3 0 24 10.7 24 24l0 88 8 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-80 0c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"
                      ></path>
                    </svg>
                  </button>
                </div>
                
                {project.projectUrl && (
                  <div 
                    className="absolute" 
                    style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
                  >
                    <a 
                      href={project.projectUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center justify-center w-16 h-16 rounded-full transition-all hover:bg-blue-600" 
                      style={{ backgroundColor: "rgba(59, 130, 246, 0.8)" }}
                    >
                      <svg 
                        aria-hidden="true" 
                        focusable="false" 
                        data-prefix="fas" 
                        data-icon="play" 
                        className="svg-inline--fa fa-play text-white text-2xl" 
                        role="img" 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 384 512"
                      >
                        <path 
                          fill="currentColor" 
                          d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80L0 432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"
                        ></path>
                      </svg>
                    </a>
                  </div>
                )}
                
                <h3 className="text-3xl font-semibold mb-1 text-white">
                  {project.title || 'Untitled Project'}
                </h3>
                <p className="text-lg mb-4 text-white">
                  {project.footer || project.description || 'No description available'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}