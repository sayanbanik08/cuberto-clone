"use client";
import { useRef, useState, useEffect } from "react";
import Cursor from "@/components/Cursors/Cursor";
import Landingpage from "@/components/LandingPage/Landingpage";
import NavHeader from "@/components/NavHeader";
import Socials from "@/components/LandingPage/Socials";
import SideNav from "@/components/SideNav";
import MovieSwiper from "@/components/MovieSwiper/MovieSwiper";
import PhotoGrid from "@/components/PhotoGrid/PhotoGrid";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import VideoHeader from '@/components/VideoHeader/VideoHeader';
import ScrollAnimation from '@/components/ScrollAnimation/ScrollAnimation';
import { fetchContent, setupContentPolling } from '@/utils/contentSync';

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const stickyElement = useRef<HTMLDivElement>(null);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // State for cursor behavior with videos
  const [cursorState, setCursorState] = useState({
    isHoveringOnVideo: false,
    isVideoPlaying: false
  });

  const [headerLines, setHeaderLines] = useState(['I am a sharp,', 'skilled,', 'adept mind.']);
  const [tagline, setTagline] = useState('I am a sharp,');
  const [aboutText, setAboutText] = useState('');
  const [photoUrl, setPhotoUrl] = useState('/images/Photo.jpg');
  const [resumeUrl, setResumeUrl] = useState('/images/resume.pdf');
  const [results, setResults] = useState<Array<{id: string; title: string; description: string; imageUrl: string}>>([
    { id: '1', title: '10th Result', description: '', imageUrl: '/images/10th Result.jpg' },
    { id: '2', title: '12th Result', description: '', imageUrl: '/images/12th Result.jpg' },
    { id: '3', title: '1st Semester', description: '', imageUrl: '/images/1st Semester.jpg' },
    { id: '4', title: '2nd Semester', description: '', imageUrl: '/images/2nd Semester.jpg' },
    { id: '5', title: '3rd Semester', description: '', imageUrl: '/images/3rd Semester.jpg' },
    { id: '6', title: '4th Semester', description: '', imageUrl: '/images/4th Semester.jpg' },
    { id: '7', title: '5th Semester', description: '', imageUrl: '/images/5th Semester.jpg' },
    { id: '8', title: '6th Semester', description: '', imageUrl: '' }
  ]);

  // Toggle accordion sections on mobile
  const toggleAccordion = (section: string) => {
    setActiveAccordion(activeAccordion === section ? null : section);
  };

  // Cross-browser compatible download handler
  const handleDownload = (e: React.MouseEvent<HTMLAnchorElement>, filePath: string, fileName: string) => {
    // Prevent default behavior for iOS Safari
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream) {
      e.preventDefault();
      
      // Create a temporary iframe to handle the file download
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = filePath;
      document.body.appendChild(iframe);
      
      // Remove iframe after a short delay
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
      
      return false;
    }
    
    // For other browsers, let the download attribute handle it
    return true;
  };

  // Check if viewport is mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener("resize", handleResize);
    
    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle cross-browser video compatibility
  useEffect(() => {
    // Find all video elements
    const videoElements = document.querySelectorAll('video');
    
    // Apply iOS specific attributes programmatically to ensure compatibility
    videoElements.forEach(video => {
      // These attributes ensure inline playback on iOS
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      
      // Prevent iOS from showing controls
      video.setAttribute('controls', 'false');
      
      // Handle iOS specific pause/resume
      const handleVisibilityChange = () => {
        if (document.hidden) {
          video.pause();
        } else {
          video.play().catch(e => console.warn('Auto-play prevented:', e));
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    });
  }, []);

  // Load content from API and localStorage
  useEffect(() => {
    const loadInitialContent = async () => {
      try {
        // Try to get content from the API first
        const apiContent = await fetchContent();
        
        if (apiContent) {
          // Update the about text if available from API
          if (apiContent.siteVerifiedContent) {
            const parsedContent = JSON.parse(apiContent.siteVerifiedContent);
            if (parsedContent.aboutText !== undefined) {
              setAboutText(parsedContent.aboutText);
            }
            if (parsedContent.tagline !== undefined) {
              setTagline(parsedContent.tagline);
            }
            if (parsedContent.headerTextLines && Array.isArray(parsedContent.headerTextLines)) {
              if (parsedContent.headerTextLines.length >= 3) {
                setHeaderLines(parsedContent.headerTextLines);
              }
            }
            if (parsedContent.photoUrl !== undefined && parsedContent.photoUrl) {
              setPhotoUrl(parsedContent.photoUrl);
            }
            if (parsedContent.resumeUrl !== undefined && parsedContent.resumeUrl) {
              setResumeUrl(parsedContent.resumeUrl);
            }
            if (parsedContent.results && Array.isArray(parsedContent.results)) {
              setResults(parsedContent.results);
            }
          }
          
          // Load skills data if available
          if (apiContent.siteSkills) {
            try {
              // Dispatch a custom event for skills update
              const skillsData = JSON.parse(apiContent.siteSkills);
              const event = new CustomEvent('skillsUpdated', {
                detail: {
                  skills: skillsData
                }
              });
              window.dispatchEvent(event);
            } catch (error) {
              console.error('Error parsing skills data from API:', error);
            }
          }
        } else {
          // Fallback to localStorage if API fails
          const savedContent = localStorage.getItem('siteVerifiedContent');
          if (savedContent) {
            try {
              const parsedContent = JSON.parse(savedContent);
              
              // Update the about text if available
              if (parsedContent.aboutText !== undefined) {
                setAboutText(parsedContent.aboutText);
              }
              
              // Update the tagline if available
              if (parsedContent.tagline !== undefined) {
                setTagline(parsedContent.tagline);
              }
              
              // Update the header lines if available
              if (parsedContent.headerTextLines && Array.isArray(parsedContent.headerTextLines)) {
                if (parsedContent.headerTextLines.length >= 3) {
                  setHeaderLines(parsedContent.headerTextLines);
                }
              }
              
              // Update the photo URL if available
              if (parsedContent.photoUrl !== undefined && parsedContent.photoUrl) {
                setPhotoUrl(parsedContent.photoUrl);
              }
              
              // Update the resume URL if available
              if (parsedContent.resumeUrl !== undefined && parsedContent.resumeUrl) {
                setResumeUrl(parsedContent.resumeUrl);
              }
              
              // Update results if available
              if (parsedContent.results && Array.isArray(parsedContent.results)) {
                setResults(parsedContent.results);
              }
            } catch (error) {
              console.error('Error parsing verified content from localStorage:', error);
            }
          }
          
          // Load skills from localStorage if API fails
          const savedSkills = localStorage.getItem('siteSkills');
          if (savedSkills) {
            try {
              const skillsData = JSON.parse(savedSkills);
              const event = new CustomEvent('skillsUpdated', {
                detail: {
                  skills: skillsData
                }
              });
              window.dispatchEvent(event);
            } catch (error) {
              console.error('Error parsing skills from localStorage:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error loading initial content:', error);
      }
    };

    // Load initial content
    loadInitialContent();

    // Set up polling for content updates
    const cleanupPolling = setupContentPolling((data) => {
      if (data.siteVerifiedContent) {
        try {
          const parsedContent = JSON.parse(data.siteVerifiedContent);
          if (parsedContent.aboutText !== undefined) {
            setAboutText(parsedContent.aboutText);
          }
          if (parsedContent.tagline !== undefined) {
            setTagline(parsedContent.tagline);
          }
          if (parsedContent.headerTextLines && Array.isArray(parsedContent.headerTextLines)) {
            if (parsedContent.headerTextLines.length >= 3) {
              setHeaderLines(parsedContent.headerTextLines);
            }
          }
          if (parsedContent.photoUrl !== undefined && parsedContent.photoUrl) {
            setPhotoUrl(parsedContent.photoUrl);
          }
          if (parsedContent.resumeUrl !== undefined && parsedContent.resumeUrl) {
            setResumeUrl(parsedContent.resumeUrl);
          }
          if (parsedContent.results && Array.isArray(parsedContent.results)) {
            setResults(parsedContent.results);
          }
        } catch (error) {
          console.error('Error parsing content from API:', error);
        }
      }
      
      // Handle skills updates from API polling
      if (data.siteSkills) {
        try {
          const skillsData = JSON.parse(data.siteSkills);
          const event = new CustomEvent('skillsUpdated', {
            detail: {
              skills: skillsData
            }
          });
          window.dispatchEvent(event);
        } catch (error) {
          console.error('Error parsing skills from API polling:', error);
        }
      }
    });

    // Listen for content updates from admin panel in the same tab
    const handleContentUpdate = (event: CustomEvent) => {
      if (event.detail.type === 'aboutText') {
        setAboutText(event.detail.content);
      } else if (event.detail.type === 'tagline') {
        setTagline(event.detail.content);
      } else if (event.detail.type === 'headerTextLines') {
        setHeaderLines(event.detail.content);
      } else if (event.detail.type === 'photoUrl') {
        setPhotoUrl(event.detail.content);
      } else if (event.detail.type === 'resumeUrl') {
        setResumeUrl(event.detail.content);
      } else if (event.detail.type === 'results') {
        setResults(event.detail.content);
      }
    };

    // Add event listener for content updates
    window.addEventListener('contentUpdated', handleContentUpdate as EventListener);

    // Listen for storage events (changes from other tabs)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'siteVerifiedContent' && event.newValue) {
        try {
          const parsedContent = JSON.parse(event.newValue);
          if (parsedContent.aboutText !== undefined) {
            setAboutText(parsedContent.aboutText);
          }
          if (parsedContent.tagline !== undefined) {
            setTagline(parsedContent.tagline);
          }
          if (parsedContent.headerTextLines && Array.isArray(parsedContent.headerTextLines)) {
            if (parsedContent.headerTextLines.length >= 3) {
              setHeaderLines(parsedContent.headerTextLines);
            }
          }
          if (parsedContent.photoUrl !== undefined && parsedContent.photoUrl) {
            setPhotoUrl(parsedContent.photoUrl);
          }
          if (parsedContent.resumeUrl !== undefined && parsedContent.resumeUrl) {
            setResumeUrl(parsedContent.resumeUrl);
          }
          if (parsedContent.results && Array.isArray(parsedContent.results)) {
            setResults(parsedContent.results);
          }
        } catch (error) {
          console.error('Error parsing verified content from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup event listeners
    return () => {
      cleanupPolling();
      window.removeEventListener('contentUpdated', handleContentUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Function to format header lines with line breaks
  const formatHeaderLines = (lines: string[]) => {
    if (!lines) return null;
    
    // Split by newlines and create paragraph elements
    return lines.map((line, index) => {
      // Replace <strong> tags with actual strong elements
      const formattedLine = line.replace(/<strong>(.*?)<\/strong>/g, (match, content) => {
        return `<strong>${content}</strong>`;
      });
      
      return (
        <p key={index} className={index === 0 ? "font-medium" : ""} 
           dangerouslySetInnerHTML={{ __html: formattedLine }} />
      );
    });
  };

  // Extract filename from path for download
  const getFileNameFromUrl = (url: string) => {
    // Get the last part of the URL (after the last slash)
    const parts = url.split('/');
    const fileName = parts[parts.length - 1];
    
    // Return a default name if we couldn't extract one
    return fileName || 'Profile_Photo.jpg';
  };

  return (
    <main className="w-full min-h-screen overflow-x-hidden">
      <NavHeader ref={stickyElement} onClick={() => setIsOpen((prev) => !prev)} />
      <SideNav isOpen={isOpen} onClose={() => setIsOpen(false)} />
      
      <div className="relative">
        <ScrollAnimation>
          <Landingpage />
        </ScrollAnimation>
        <div className="circular-video-container">
          <VideoHeader videoSrc="/assets/2.mp4" />
        </div>
      </div>
      
      <div className="relative py-6" id="projects">
        <ScrollAnimation direction="fade" delay={0.2}>
          <PhotoGrid />
        </ScrollAnimation>
      </div>
      
      <div className="relative mb-0">
        <ScrollAnimation direction="up" delay={0.3}>
          <MovieSwiper />
        </ScrollAnimation>
      </div>
      
      <div className="relative bg-gray-100 py-12" id="verified">
        <div className="container mx-auto px-4 md:px-[calc(var(--spacing)*40)]">
          <ScrollAnimation direction="fade">
            <div className="text-xs text-gray-500 space-y-4">
              <p className="font-medium">{tagline}</p>
              {aboutText ? (
                <div dangerouslySetInnerHTML={{ __html: aboutText }} />
              ) : null}
            </div>
          </ScrollAnimation>
          
          <div className="mt-8 pt-8 border-t border-gray-300"></div>
          
          {/* Mobile Footer (Accordion) - Hidden on md and up */}
          <div className="mt-8 space-y-0 md:hidden">
            <div className="border-b border-gray-200">
              <h3 
                className="font-semibold text-gray-900 flex justify-between items-center py-3 px-2 cursor-pointer"
                onClick={() => toggleAccordion('photo')}
              >
                My Photo
                <span>
                  {activeAccordion === 'photo' ? '−' : '+'}
                </span>
              </h3>
              <ul className={`space-y-2 py-2 px-2 bg-gray-50 ${activeAccordion === 'photo' ? 'block' : 'hidden'}`}>
                <li className="pb-2 flex items-center">
                  <a 
                    href={photoUrl} 
                    download={getFileNameFromUrl(photoUrl)} 
                    onClick={(e) => handleDownload(e, photoUrl, getFileNameFromUrl(photoUrl))}
                    className="text-gray-600 hover:text-gray-900 flex items-center"
                  >
                    Profile Photo
                    <FontAwesomeIcon icon={faDownload} className="ml-2 text-sm" />
                  </a>
                </li>
              </ul>
            </div>
            
            <div className="border-t border-gray-200">
              <h3 
                className="font-semibold text-gray-900 flex justify-between items-center py-3 px-2 cursor-pointer"
                onClick={() => toggleAccordion('results')}
              >
                Academic Results
                <span>
                  {activeAccordion === 'results' ? '−' : '+'}
                </span>
              </h3>
              <ul className={`space-y-2 py-2 px-2 bg-gray-50 ${activeAccordion === 'results' ? 'block' : 'hidden'}`}>
                {results.map(result => (
                  result.imageUrl ? (
                    <li key={result.id} className="pb-2 flex items-center">
                      <a 
                        href={result.imageUrl} 
                        download={getFileNameFromUrl(result.imageUrl)} 
                        onClick={(e) => handleDownload(e, result.imageUrl, getFileNameFromUrl(result.imageUrl))}
                        className="text-gray-600 hover:text-gray-900 flex items-center"
                      >
                        {result.title}
                        <FontAwesomeIcon icon={faDownload} className="ml-2 text-sm" />
                      </a>
                    </li>
                  ) : null
                ))}
              </ul>
            </div>
            
            <div className="border-t border-gray-200">
              <h3 
                className="font-semibold text-gray-900 flex justify-between items-center py-3 px-2 cursor-pointer"
                onClick={() => toggleAccordion('faq')}
              >
                FAQ
                <span>
                  {activeAccordion === 'faq' ? '−' : '+'}
                </span>
              </h3>
              <ul className={`space-y-2 py-2 px-2 bg-gray-50 ${activeAccordion === 'faq' ? 'block' : 'hidden'}`}>
                <li className="pb-2 flex items-center">
                  <a 
                    href={resumeUrl} 
                    download={getFileNameFromUrl(resumeUrl)} 
                    onClick={(e) => handleDownload(e, resumeUrl, getFileNameFromUrl(resumeUrl))}
                    className="text-gray-600 hover:text-gray-900 flex items-center"
                  >
                    Resume
                    <FontAwesomeIcon icon={faDownload} className="ml-2 text-sm" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Desktop Footer (Multi-column) - Hidden on small screens, visible on md and up */}
          <div className="mt-8 hidden md:grid md:grid-cols-3 md:gap-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">My Photo</h3>
              <ul className="space-y-2">
                <li>
                  <a 
                    href={photoUrl} 
                    download={getFileNameFromUrl(photoUrl)} 
                    onClick={(e) => handleDownload(e, photoUrl, getFileNameFromUrl(photoUrl))}
                    className="text-gray-600 hover:text-gray-900 flex items-center"
                  >
                    Profile Photo
                    <FontAwesomeIcon icon={faDownload} className="ml-2 text-sm" />
                  </a>
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Academic Results</h3>
              <ul className="space-y-2">
                {results.map(result => (
                  result.imageUrl ? (
                    <li key={result.id}>
                      <a 
                        href={result.imageUrl} 
                        download={getFileNameFromUrl(result.imageUrl)} 
                        onClick={(e) => handleDownload(e, result.imageUrl, getFileNameFromUrl(result.imageUrl))}
                        className="text-gray-600 hover:text-gray-900 flex items-center"
                      >
                        {result.title}
                        <FontAwesomeIcon icon={faDownload} className="ml-2 text-sm" />
                      </a>
                    </li>
                  ) : null
                ))}
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">FAQ</h3>
              <ul className="space-y-2">
                <li>
                  <a 
                    href={resumeUrl} 
                    download={getFileNameFromUrl(resumeUrl)} 
                    onClick={(e) => handleDownload(e, resumeUrl, getFileNameFromUrl(resumeUrl))}
                    className="text-gray-600 hover:text-gray-900 flex items-center"
                  >
                    Resume
                    <FontAwesomeIcon icon={faDownload} className="ml-2 text-sm" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-300 text-sm text-gray-600">
            <p>Contact me at: <a href="mailto:sayanbanik459@gmail.com" className="text-blue-600">sayanbanik459@gmail.com</a> or connect with me on <a href="#" className="text-blue-600">LinkedIn</a>.</p>
          </div>
        </div>
      </div>
      
      <div className="relative">
        <Socials />
      </div>
      
      <Cursor
        stickyElement={stickyElement}
        isHoveringOnVideo={cursorState.isHoveringOnVideo}
        isVideoPlaying={cursorState.isVideoPlaying}
      />
    </main>
  );
}