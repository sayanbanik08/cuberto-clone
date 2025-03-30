import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation } from 'swiper/modules';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDatabase, 
  faServer, 
  faCode,
  faFileCode,
  faLaptopCode
} from '@fortawesome/free-solid-svg-icons';
import {
  faNodeJs,
  faReact, 
  faHtml5, 
  faCss3Alt, 
  faJs, 
  faJava,
  faPython
} from '@fortawesome/free-brands-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { fetchContent, setupContentPolling } from '@/utils/contentSync';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// Add all Font Awesome icons to the library
library.add(fas, fab);

interface Skill {
  id: number;
  title: string;
  description: string;
  icon: any;
  color: string;
  bgGradient: string;
  image: string;
  docsUrl: string;
  proficiencyLevel: number;
}

// Default skills array
const defaultSkills: Skill[] = [
  {
    id: 1,
    title: 'MongoDB',
    description: 'NoSQL database for modern applications with flexible document schemas',
    icon: faDatabase,
    color: '#00ED64',
    bgGradient: 'linear-gradient(to right, #003300, #005500)',
    image: '/images/1.png',
    docsUrl: 'https://www.mongodb.com/docs/',
    proficiencyLevel: 85
  },
  {
    id: 2,
    title: 'Express.js',
    description: 'Fast, unopinionated, minimalist web framework for Node.js',
    icon: faServer,
    color: '#00ED64',
    bgGradient: 'linear-gradient(to right, #000033, #000066)',
    image: '/images/2.png',
    docsUrl: 'https://expressjs.com/',
    proficiencyLevel: 85
  },
  {
    id: 3,
    title: 'React.js',
    description: 'A JavaScript library for building user interfaces',
    icon: faReact,
    color: '#00ED64',
    bgGradient: 'linear-gradient(to right, #003366, #006699)',
    image: '/images/3.png',
    docsUrl: 'https://reactjs.org/docs/getting-started.html',
    proficiencyLevel: 85
  },
  {
    id: 4,
    title: 'Node.js',
    description: 'JavaScript runtime built on Chrome\'s V8 JavaScript engine',
    icon: faNodeJs,
    color: '#00ED64',
    bgGradient: 'linear-gradient(to right, #003300, #006600)',
    image: '/images/4.png',
    docsUrl: 'https://nodejs.org/en/docs/',
    proficiencyLevel: 85
  }
];

const MovieSwiper: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [showSection, setShowSection] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  
  useEffect(() => {
    const loadSkills = async () => {
      try {
        // Try to get skills from the API first
        const apiContent = await fetchContent();
        
        if (apiContent && apiContent.siteSkills) {
          const parsedSkills = JSON.parse(apiContent.siteSkills);
          if (parsedSkills && Array.isArray(parsedSkills) && parsedSkills.length > 0) {
            mapAndSetSkills(parsedSkills);
            setShowSection(true);
          } else {
            // Hide section if no skills in API
            setShowSection(false);
          }
        } else {
          // Fallback to localStorage if API fails
          const savedSkills = localStorage.getItem('siteSkills');
          if (savedSkills) {
            const parsedSkills = JSON.parse(savedSkills);
            if (parsedSkills && Array.isArray(parsedSkills) && parsedSkills.length > 0) {
              mapAndSetSkills(parsedSkills);
              setShowSection(true);
            } else {
              // Hide section if no skills in localStorage
              setShowSection(false);
            }
          } else {
            // No skills found anywhere, hide section
            setShowSection(false);
          }
        }
      } catch (error) {
        console.error('Error loading skills:', error);
        
        // Fallback to localStorage if API fails
        const savedSkills = localStorage.getItem('siteSkills');
        if (savedSkills) {
          try {
            const parsedSkills = JSON.parse(savedSkills);
            if (parsedSkills && Array.isArray(parsedSkills) && parsedSkills.length > 0) {
              mapAndSetSkills(parsedSkills);
              setShowSection(true);
            } else {
              // Hide section if no skills in localStorage
              setShowSection(false);
            }
          } catch (e) {
            console.error('Error parsing skills from localStorage:', e);
            setShowSection(false);
          }
        } else {
          // No skills found anywhere, hide section
          setShowSection(false);
        }
      }
    };

    // Load initial skills
    loadSkills();
    
    // Set up polling for real-time updates
    const cleanupPolling = setupContentPolling((data) => {
      if (data.siteSkills) {
        try {
          const parsedSkills = JSON.parse(data.siteSkills);
          if (parsedSkills && Array.isArray(parsedSkills) && parsedSkills.length > 0) {
            mapAndSetSkills(parsedSkills);
            setShowSection(true);
          } else {
            // Hide section if no skills in API
            setShowSection(false);
          }
        } catch (error) {
          console.error('Error parsing skills from API:', error);
          setShowSection(false);
        }
      }
    });
    
    // Listen for content updates from admin panel in the same tab
    const handleContentUpdate = (event: CustomEvent) => {
      if (event.detail.type === 'skills') {
        const updatedSkills = event.detail.content;
        if (updatedSkills && Array.isArray(updatedSkills) && updatedSkills.length > 0) {
          mapAndSetSkills(updatedSkills);
          setShowSection(true);
        } else {
          // Hide section if no skills
          setShowSection(false);
        }
      }
    };
    
    // Listen for skills updates from the Home component
    const handleSkillsUpdated = (event: CustomEvent) => {
      if (event.detail.skills) {
        const updatedSkills = event.detail.skills;
        if (updatedSkills && Array.isArray(updatedSkills) && updatedSkills.length > 0) {
          mapAndSetSkills(updatedSkills);
          setShowSection(true);
        } else {
          // Hide section if no skills
          setShowSection(false);
        }
      }
    };
    
    // Add event listeners
    window.addEventListener('contentUpdated', handleContentUpdate as EventListener);
    window.addEventListener('skillsUpdated', handleSkillsUpdated as EventListener);
    
    return () => {
      if (cleanupPolling) cleanupPolling();
      window.removeEventListener('contentUpdated', handleContentUpdate as EventListener);
      window.removeEventListener('skillsUpdated', handleSkillsUpdated as EventListener);
    };
  }, []);

  // Helper function to map admin skills to component skills
  const mapAndSetSkills = (adminSkills: any[]) => {
    if (!adminSkills || !Array.isArray(adminSkills) || adminSkills.length === 0) {
      console.log('No skills found or empty skills array, hiding section');
      setShowSection(false);
      return;
    }
    
    console.log('Admin skills received:', adminSkills);
    
    const mappedSkills = adminSkills.map((skill: any, index: number) => {
      // Get the appropriate icon based on the skill.icon string
      let iconToUse = getIconFromString(skill.icon);
      
      // Ensure background image path is valid
      const backgroundImage = skill.backgroundImage && skill.backgroundImage.trim() !== '' 
        ? skill.backgroundImage 
        : `/images/${(index % 4) + 1}.png`;
      
      // Ensure learn more link is valid
      let learnMoreLink = skill.learnMoreLink && skill.learnMoreLink.trim() !== ''
        ? skill.learnMoreLink
        : 'https://www.google.com/search?q=' + encodeURIComponent(skill.title || 'Skill');
      
      // Add https:// if the link doesn't have a protocol
      if (learnMoreLink && !learnMoreLink.startsWith('http://') && !learnMoreLink.startsWith('https://')) {
        learnMoreLink = 'https://' + learnMoreLink;
      }
      
      console.log(`Skill ${index} background image:`, backgroundImage);
      console.log(`Skill ${index} learn more link:`, learnMoreLink);
      
      return {
        id: index + 1,
        title: skill.title || 'Skill',
        description: skill.description || 'Description',
        icon: iconToUse,
        color: skill.iconColor || '#00ED64',
        bgGradient: 'linear-gradient(to right, #003300, #005500)', // Default gradient
        image: backgroundImage, // Use the validated background image
        docsUrl: learnMoreLink, // Use the validated learn more link
        proficiencyLevel: skill.proficiencyLevel || 85
      };
    });
    
    console.log('Mapped skills:', mappedSkills);
    
    // Only update if we have skills to show
    if (mappedSkills.length > 0) {
      setSkills(mappedSkills);
      setShowSection(true);
    } else {
      // Hide section if no skills
      setShowSection(false);
    }
  };

  // Helper function to get the correct icon from string
  const getIconFromString = (iconString: string) => {
    if (!iconString) return faCode; // Default icon
    
    // Handle brand icons
    if (iconString.includes('fa-java') || iconString.includes('fab fa-java')) return faJava;
    if (iconString.includes('fa-python') || iconString.includes('fab fa-python')) return faPython;
    if (iconString.includes('fa-react') || iconString.includes('fab fa-react')) return faReact;
    if (iconString.includes('fa-node') || iconString.includes('fab fa-node')) return faNodeJs;
    if (iconString.includes('fa-html5') || iconString.includes('fab fa-html5')) return faHtml5;
    if (iconString.includes('fa-css3') || iconString.includes('fab fa-css3')) return faCss3Alt;
    if (iconString.includes('fa-js') || iconString.includes('fab fa-js')) return faJs;
    
    // Handle solid icons
    if (iconString.includes('fa-database')) return faDatabase;
    if (iconString.includes('fa-server')) return faServer;
    if (iconString.includes('fa-file-code')) return faFileCode;
    if (iconString.includes('fa-laptop-code')) return faLaptopCode;
    
    // Default to code icon
    return faCode;
  };

  // If no skills to show, don't render the section at all
  if (!showSection) {
    return null;
  }

  // Handle slide change to track the active index
  const handleSlideChange = (swiper: any) => {
    setActiveIndex(swiper.realIndex);
  };

  return (
    <>
      <section className="w-full relative z-10 bg-white" id="skillsSlider">
        <Swiper
          slidesPerView={1.3}
          breakpoints={{
            640: {
              slidesPerView: 1.3
            },
            768: {
              slidesPerView: 1.3
            },
            1024: {
              slidesPerView: 1.3
            },
            1280: {
              slidesPerView: 1.3
            },
            1536: {
              slidesPerView: 1.3
            }
          }}
          spaceBetween={15}
          centeredSlides={true}
          initialSlide={0}
          loop={true}
          pagination={{
            clickable: true,
            el: '.swiper-custom-pagination',
            type: 'bullets',
            renderBullet: function (index, className) {
              return `<span class="${className} rounded-full"></span>`;
            },
          }}
          navigation={{
            prevEl: '.swiper-button-prev',
            nextEl: '.swiper-button-next',
          }}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          modules={[Pagination, Autoplay, Navigation]}
          className="w-full h-[497px] md:h-[550px] lg:h-[650px] px-6 max-w-full mx-auto"
          onSlideChange={handleSlideChange}
        >
          {skills.map((skill, index) => (
            <SwiperSlide key={skill.id} className="relative w-full h-full overflow-hidden shadow-lg swiper-slide-content transition-all duration-500">
              <div 
                className="absolute inset-0 w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${skill.image})` }}
              >
                {/* Conditional gradient overlay - only show on non-active slides */}
                <div 
                  className={`absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/50 transition-opacity duration-500 ${
                    index === activeIndex ? 'opacity-0' : 'opacity-100'
                  }`}
                ></div>
              </div>
              
              <div className="absolute bottom-16 md:bottom-20 left-6 md:left-10 max-w-2xl z-10 text-white">
                <div className="mb-2 md:mb-4">
                  <FontAwesomeIcon 
                    icon={skill.icon} 
                    style={{ color: skill.color }} 
                    className="text-5xl md:text-7xl lg:text-8xl"
                  />
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-2 md:mb-3">{skill.title}</h2>
                <p className="text-sm md:text-lg mb-6 md:mb-8">{skill.description}</p>
                <a 
                  href={skill.docsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-white text-black py-2 px-6 md:py-3 md:px-8 rounded-full text-sm md:text-base font-medium hover:bg-opacity-90 transition-all inline-flex items-center"
                >
                  Learn more
                  <svg className="w-3 h-3 md:w-4 md:h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>

              <div className="absolute bottom-6 md:bottom-8 right-6 md:right-10 z-10">
                <div className="flex items-center bg-white/30 backdrop-blur-sm py-0.5 px-2 md:py-1 md:px-3 rounded-full">
                  <span className="text-white text-xs md:text-sm mr-1 md:mr-2">Proficiency:</span>
                  <div className="w-16 md:w-24 bg-white/30 rounded-full h-1.5 md:h-2">
                    <div 
                      className="h-1.5 md:h-2 rounded-full" 
                      style={{ 
                        width: `${skill.proficiencyLevel}%`, 
                        backgroundColor: skill.color 
                      }}
                    ></div>
                  </div>
                  <span className="text-white text-xs md:text-sm ml-1 md:ml-2">{skill.proficiencyLevel}%</span>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="swiper-button-prev !text-white !opacity-70 !w-8 !h-8 md:!w-12 md:!h-12 !left-1 md:!left-6"></div>
        <div className="swiper-button-next !text-white !opacity-70 !w-8 !h-8 md:!w-12 md:!h-12 !right-1 md:!right-6"></div>
      </section>
      
      {/* Pagination placed in the gap between expertise and verified sections */}
      <div className="w-full py-6 bg-white">
        <div className="swiper-custom-pagination flex justify-center items-center my-2">
          {/* Pagination bullets will be inserted here by Swiper */}
        </div>
      </div>

      {/* Add CSS for Apple TV+ style pagination bullets and slide effects */}
      <style jsx>{`
        :global(.swiper-pagination-bullet) {
          opacity: 0.3;
          background-color: #000000;
          width: 6px !important;
          height: 6px !important;
          margin: 0 4px !important;
          transition: opacity 0.3s ease;
        }
        :global(.swiper-pagination-bullet-active) {
          opacity: 1;
          background-color: #000000 !important;
          width: 6px !important;
          height: 6px !important;
        }
        
        /* Navigation arrow styles for better mobile display */
        :global(.swiper-button-prev),
        :global(.swiper-button-next) {
          background-color: transparent;
          padding: 0;
          border-radius: 0;
          color: white !important;
          opacity: 0.7 !important;
        }
        
        @media (max-width: 767px) {
          :global(.swiper-button-prev),
          :global(.swiper-button-next) {
            background-color: transparent;
            padding: 0;
          }
        }
        
        :global(.swiper-button-prev:after),
        :global(.swiper-button-next:after) {
          font-size: 1.2rem !important;
          font-weight: 900;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        @media (min-width: 768px) {
          :global(.swiper-button-prev:after),
          :global(.swiper-button-next:after) {
            font-size: 1.5rem !important;
          }
        }
        
        /* Slide transition effects */
        :global(.swiper-slide-active) {
          z-index: 2;
          transform: scale(1);
          opacity: 1;
        }
        
        :global(.swiper-slide-prev),
        :global(.swiper-slide-next) {
          z-index: 1;
          transform: scale(0.95);
          opacity: 0.8;
        }
      `}</style>
    </>
  );
};

export default MovieSwiper;