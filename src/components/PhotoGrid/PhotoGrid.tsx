'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { fetchContent, setupContentPolling } from '@/utils/contentSync';

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

interface PhotoGridProps {
  photos?: Project[];
}

const PhotoGrid: React.FC<PhotoGridProps> = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showSection, setShowSection] = useState(true);
  const [activeInfoId, setActiveInfoId] = useState<string | null>(null);
  const [showInfoIndex, setShowInfoIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true when component mounts on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only update state if the new projects are actually different
    const handleProjectUpdate = (updatedProjects: Project[]) => {
      const currentIds = projects.map(p => p.id).sort().join(',');
      const newIds = updatedProjects.map(p => p.id).sort().join(',');
      
      // Only update if the list of IDs changed or if we have no projects yet
      if (currentIds !== newIds || projects.length === 0) {
        console.log('PhotoGrid - Setting updated projects:', updatedProjects.length);
        setProjects(updatedProjects);
        setShowSection(true);
      }
    };

    const loadProjects = async () => {
      try {
        // Try to get projects from the API first
        const apiContent = await fetchContent();
        console.log('PhotoGrid - API Content received:', apiContent);
        
        if (apiContent && apiContent.siteProjects) {
          try {
            const parsedProjects = JSON.parse(apiContent.siteProjects);
            console.log('PhotoGrid - Parsed projects from API:', parsedProjects);
            if (parsedProjects && Array.isArray(parsedProjects) && parsedProjects.length > 0) {
              handleProjectUpdate(parsedProjects);
            } else {
              // If no projects in API, try localStorage
              loadFromLocalStorage();
            }
          } catch (parseError) {
            console.error('PhotoGrid - Error parsing API projects:', parseError);
            // Fall back to localStorage on parse error
            loadFromLocalStorage();
          }
        } else {
          // Fallback to localStorage if API fails
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error('PhotoGrid - Error loading projects from API:', error);
        // Fall back to localStorage on API error
        loadFromLocalStorage();
      }
    };
    
    // Add helper function to read safely from localStorage with compression support
    const safelyReadFromLocalStorage = (key: string) => {
      try {
        // Check if we have compressed data
        const isCompressed = localStorage.getItem(`${key}_compressed`) === 'true';
        
        // Get the data
        const data = localStorage.getItem(key);
        
        if (!data) return null;
        
        // If not compressed, return as is
        if (!isCompressed) return data;
        
        // For compressed data, we don't need to decompress since our compression just
        // optimizes content but keeps the JSON format intact
        return data;
      } catch (error) {
        console.error(`Error reading from localStorage key ${key}:`, error);
        return null;
      }
    };

    // Helper function to load from localStorage
    const loadFromLocalStorage = () => {
      try {
        const savedProjects = safelyReadFromLocalStorage('siteProjects');
        console.log('PhotoGrid - Local storage projects:', savedProjects ? 'found' : 'not found');
        
        if (savedProjects) {
          try {
            const parsedProjects = JSON.parse(savedProjects);
            console.log('PhotoGrid - Parsed projects from localStorage:', parsedProjects);
            
            if (Array.isArray(parsedProjects) && parsedProjects.length > 0) {
              handleProjectUpdate(parsedProjects);
            } else {
              // Keep default projects if no valid projects in localStorage
              console.log('PhotoGrid - No valid projects in localStorage, using defaults');
            }
          } catch (parseError) {
            console.error('PhotoGrid - Error parsing localStorage projects:', parseError);
            // Keep default projects on parse error
          }
        } else {
          console.log('PhotoGrid - No projects in localStorage, using defaults');
        }
      } catch (error) {
        console.error('PhotoGrid - Error accessing localStorage:', error);
      }
    };

    // Load initial projects
    loadProjects();
    
    // Set up polling for real-time updates
    const cleanupPolling = setupContentPolling((data) => {
      if (data.siteProjects) {
        try {
          const parsedProjects = JSON.parse(data.siteProjects);
          console.log('PhotoGrid - Received updated projects from polling:', parsedProjects);
          if (parsedProjects && Array.isArray(parsedProjects) && parsedProjects.length > 0) {
            handleProjectUpdate(parsedProjects);
          }
        } catch (error) {
          console.error('PhotoGrid - Error parsing projects from polling:', error);
        }
      }
    });
    
    // Listen for project updates
    const handleProjectsUpdated = (event: CustomEvent) => {
      console.log('PhotoGrid - Projects updated event received:', event.detail);
      if (event.detail && event.detail.projects) {
        const updatedProjects = event.detail.projects;
        
        if (Array.isArray(updatedProjects) && updatedProjects.length > 0) {
          handleProjectUpdate(updatedProjects);
        }
      }
    };
    
    // Listen for content updates
    const handleContentUpdate = (event: CustomEvent) => {
      if (event.detail.type === 'projects') {
        console.log('PhotoGrid - Content update event received for projects');
        const updatedProjects = event.detail.content;
        if (updatedProjects && Array.isArray(updatedProjects) && updatedProjects.length > 0) {
          handleProjectUpdate(updatedProjects);
        }
      }
    };
    
    // Listen for storage events (changes from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'siteProjects' && e.newValue) {
        console.log('PhotoGrid - Storage event detected for siteProjects');
        try {
          const updatedProjects = JSON.parse(e.newValue);
          if (Array.isArray(updatedProjects) && updatedProjects.length > 0) {
            handleProjectUpdate(updatedProjects);
          }
        } catch (error) {
          console.error('PhotoGrid - Error parsing storage event data:', error);
        }
      }
    };

    // Add event listeners
    window.addEventListener('projectsUpdated', handleProjectsUpdated as EventListener);
    window.addEventListener('contentUpdated', handleContentUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);

    // Also check for updates every 2 seconds (as a backup mechanism)
    const intervalId = setInterval(() => {
      try {
        const savedProjects = safelyReadFromLocalStorage('siteProjects');
        if (savedProjects) {
          try {
            const parsedProjects = JSON.parse(savedProjects);
            if (Array.isArray(parsedProjects) && parsedProjects.length > 0) {
              // Compare IDs instead of full objects to reduce flickering
              const currentIds = projects.map(p => p.id).sort().join(',');
              const newIds = parsedProjects.map(p => p.id).sort().join(',');
              
              if (currentIds !== newIds) {
                console.log('PhotoGrid - Detected change in localStorage during interval check');
                handleProjectUpdate(parsedProjects);
              }
            }
          } catch (error) {
            // Silent catch - just for polling
          }
        }
      } catch (error) {
        // Silent catch for localStorage errors
      }
    }, 2000);

    return () => {
      if (cleanupPolling) cleanupPolling();
      clearInterval(intervalId);
      window.removeEventListener('projectsUpdated', handleProjectsUpdated as EventListener);
      window.removeEventListener('contentUpdated', handleContentUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Remove projects from dependencies to prevent re-renders

  const handleInfoClick = (id: string) => {
    setActiveInfoId(prevId => prevId === id ? null : id);
  };

  const handleInfoMouseEnter = (id: string) => {
    // Only activate on larger screens (desktop)
    if (window.innerWidth >= 768) {
      setActiveInfoId(id);
    }
  };

  const handleInfoMouseLeave = () => {
    // Only deactivate on larger screens (desktop)
    if (window.innerWidth >= 768) {
      setActiveInfoId(null);
    }
  };

  const toggleInfo = (index: number) => {
    if (isMobile) {
      setShowInfoIndex(showInfoIndex === index ? null : index);
    }
  };

  const handleMouseEnter = (index: number) => {
    if (!isMobile) {
      setShowInfoIndex(index);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setShowInfoIndex(null);
    }
  };

  // Parse CSS style string into object
  const parseStyleString = (styleString: string): React.CSSProperties => {
    if (!styleString) return {};
    
    try {
      // Convert CSS string to object
      const styleObj: Record<string, string> = {};
      
      // Split by semicolons and process each declaration
      styleString.split(';').forEach(declaration => {
        const [property, value] = declaration.split(':').map(str => str.trim());
        if (property && value) {
          // Convert kebab-case to camelCase
          const camelProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
          styleObj[camelProperty] = value;
        }
      });
      
      return styleObj as React.CSSProperties;
    } catch (error) {
      console.error('Error parsing style string:', error);
      return {};
    }
  };

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px is typical md breakpoint
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Debug current projects
  useEffect(() => {
    console.log('PhotoGrid - Current projects state:', projects);
  }, [projects]);

  // Debug image loading
  useEffect(() => {
    if (projects && projects.length > 0) {
      projects.forEach(project => {
        if (project.imageUrl) {
          console.log(`Project image for ${project.title}: ${project.imageUrl.substring(0, 50)}...`);
        }
      });
    }
  }, [projects]);

  // Use only inline SVG data URL as fallback
  const DEFAULT_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect width="200" height="200" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';

  // Prevent flicker-inducing re-renders when content hasn't changed
  const memoizedProjects = useMemo(() => projects, [projects.map(p => p.id).join(',')]);

  if (!showSection) {
    return null;
  }

  return (
    <section className="w-full bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {memoizedProjects.map((project, index) => (
          <div 
            key={project.id} 
            className="relative overflow-hidden transition-all duration-300 hover:opacity-95 h-[500px] md:h-[500px] lg:h-[650px] xl:h-[585px]"
            style={project.backgroundStyle ? parseStyleString(project.backgroundStyle) : {
              backgroundColor: '#ebf9ff',
              backgroundImage: 'linear-gradient(0deg, #ebf9ff 32%, #add1ff 50%, #2a88dd 100%)',
              color: 'black'
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center z-0">
              {project.imageUrl ? (
                <img 
                  src={project.imageUrl} 
                  alt={project.title}
                  className="w-full h-full object-contain transition-all duration-500"
                  loading="lazy"
                  style={{ objectFit: 'contain' }}
                  onError={(e) => {
                    console.error('PhotoGrid - Image failed to load:', project.title);
                    console.error('Image URL begins with:', project.imageUrl?.substring(0, 30));
                    
                    const imgElement = e.target as HTMLImageElement;
                    
                    // If it's a data URL that failed (unlikely), log it and use placeholder
                    if (project.imageUrl?.startsWith('data:')) {
                      console.error('Data URL image failed to load');
                      imgElement.src = DEFAULT_PLACEHOLDER;
                      imgElement.onerror = null;
                      return;
                    }
                    
                    // If it's a regular URL, try different paths
                    const originalSrc = project.imageUrl;
                    if (originalSrc) {
                      // 1. If it's a relative path without leading slash, add one
                      if (!originalSrc.startsWith('data:') && !originalSrc.startsWith('http') && !originalSrc.startsWith('/')) {
                        console.log('PhotoGrid - Trying with / prefix');
                        imgElement.src = `/${originalSrc}`;
                        return;
                      }
                      
                      // 2. If it's a relative path with leading slash, try without it
                      if (originalSrc.startsWith('/') && !originalSrc.startsWith('//')) {
                        console.log('PhotoGrid - Trying without / prefix');
                        imgElement.src = originalSrc.substring(1);
                        return;
                      }
                    }
                    
                    // If all paths fail, use inline SVG directly
                    console.log('PhotoGrid - Using inline SVG placeholder');
                    imgElement.src = DEFAULT_PLACEHOLDER;
                    imgElement.onerror = null; // Prevent infinite error loop
                  }}
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gray-100">
                  <img 
                    src={DEFAULT_PLACEHOLDER}
                    alt="No image available" 
                    className="w-1/2 h-1/2 object-contain opacity-50"
                  />
                </div>
              )}
            </div>

            <div 
              className="absolute inset-0 flex flex-col items-center justify-between h-full p-6 text-center z-10"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
            >
              <div 
                className={`absolute top-0 left-0 w-16 h-16 flex items-start justify-start p-4 ${!isMobile ? 'hover-trigger' : ''}`}
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
              >
                <button 
                  className="flex items-center justify-center w-8 h-8 rounded-full transition-all shadow-sm"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                  onClick={() => toggleInfo(index)}
                >
                  <FontAwesomeIcon icon={faCircleInfo} className="text-white text-sm" />
                </button>
              </div>

              {project.projectUrl && (
                <a 
                  href={project.projectUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="absolute flex items-center justify-center w-16 h-16 rounded-full transition-all hover:bg-blue-600" 
                  style={{ 
                    backgroundColor: 'rgba(59, 130, 246, 0.8)', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)' 
                  }}
                >
                  <FontAwesomeIcon icon={faPlay} className="text-white text-2xl" />
                </a>
              )}

              <h3 className="text-3xl font-semibold mb-1 text-white">{project.title}</h3>
              <p className="text-lg mb-4 text-white">{project.footer}</p>

              {showInfoIndex === index && (
                <div 
                  className="absolute inset-0 z-20 flex flex-col p-8 overflow-y-auto"
                  style={{ backgroundColor: 'rgba(245, 245, 247, 0.95)' }}
                  onMouseEnter={() => !isMobile && setShowInfoIndex(index)}
                  onMouseLeave={() => !isMobile && setShowInfoIndex(null)}
                >
                  {isMobile && (
                    <button 
                      className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 transition-all"
                      onClick={() => toggleInfo(index)}
                    >
                      <FontAwesomeIcon icon={faCircleInfo} className="text-gray-700" />
                    </button>
                  )}
                  
                  <div className="mt-8">
                    <h3 className="text-3xl font-semibold mb-4 text-gray-900">{project.title}</h3>
                    
                    <div className="mb-6">
                      <h4 className="text-xl font-medium mb-2 text-gray-800">Description</h4>
                      <p className="text-lg text-gray-700">{project.description}</p>
                    </div>
                    
                    <div className="mb-6">
                      <h4 className="text-xl font-medium mb-2 text-gray-800">Technologies</h4>
                      <ul className="flex flex-wrap gap-2">
                        {project.technologies && project.technologies.length > 0 ? (
                          project.technologies.map((tech, i) => (
                            <li key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                              {tech}
                            </li>
                          ))
                        ) : (
                          <li className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            React.js
                          </li>
                        )}
                      </ul>
                    </div>
                    
                    {project.stack && (
                      <div className="mb-6">
                        <h4 className="text-xl font-medium mb-2 text-gray-800">Stack</h4>
                        <ul className="flex flex-wrap gap-2">
                          {project.stack.split(',').map((item, i) => (
                            <li key={i} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                              {item.trim()}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PhotoGrid;