'use client';

import { useEffect, useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import Link from 'next/link';
import { fetchContent, setupContentPolling } from '@/utils/contentSync';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Add all Font Awesome icons to the library
library.add(fas, fab);

// Define the Skill interface
interface Skill {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  backgroundImage?: string;
  proficiencyLevel: number;
  learnMoreLink?: string;
}

export default function ExpertiseSection() {
  const [skills, setSkills] = useState<Skill[]>([
    // Default skills
    {
      id: '1',
      title: 'Web Development',
      description: 'Building responsive websites and web applications',
      icon: 'fa-code',
      iconColor: '#00ed64',
      backgroundImage: '/images/1.png',
      proficiencyLevel: 85,
      learnMoreLink: 'https://www.google.com/search?q=web+development'
    },
    {
      id: '2',
      title: 'UI/UX Design',
      description: 'Creating intuitive and beautiful user interfaces',
      icon: 'fa-palette',
      iconColor: '#00ed64',
      backgroundImage: '/images/2.png',
      proficiencyLevel: 85,
      learnMoreLink: 'https://www.google.com/search?q=ui+ux+design'
    },
    {
      id: '3',
      title: 'Python',
      description: 'Building applications with Python',
      icon: 'fab fa-python',
      iconColor: '#00ed64',
      backgroundImage: '/images/3.png',
      proficiencyLevel: 85,
      learnMoreLink: 'https://www.google.com/search?q=python'
    },
    {
      id: '4',
      title: 'Java',
      description: 'Enterprise application development',
      icon: 'fab fa-java',
      iconColor: '#00ed64',
      backgroundImage: '/images/4.png',
      proficiencyLevel: 85,
      learnMoreLink: 'https://www.google.com/search?q=java'
    }
  ]);

  useEffect(() => {
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
          }
        }
      } catch (error) {
        console.error('Error loading skills:', error);
        
        // Fallback to localStorage if API fails
        const savedSkills = localStorage.getItem('siteSkills');
        if (savedSkills) {
          try {
            setSkills(JSON.parse(savedSkills));
          } catch (e) {
            console.error('Error parsing skills from localStorage:', e);
          }
        }
      }
    };

    // Load initial skills
    loadSkills();
    
    // Set up polling for real-time updates
    const cleanupPolling = setupContentPolling((data) => {
      if (data.siteSkills) {
        try {
          setSkills(JSON.parse(data.siteSkills));
        } catch (error) {
          console.error('Error parsing skills from API:', error);
        }
      }
    });
    
    // Listen for content updates from admin panel in the same tab
    const handleContentUpdate = (event: CustomEvent) => {
      if (event.detail.type === 'skills') {
        setSkills(event.detail.content);
      }
    };
    
    // Listen for skills updates from the Home component
    const handleSkillsUpdated = (event: CustomEvent) => {
      if (event.detail.skills) {
        setSkills(event.detail.skills);
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

  // Helper function to get the correct Font Awesome icon
  const getIconComponent = (iconName: string) => {
    if (!iconName) return null;
    
    if (iconName.startsWith('fab ')) {
      // Brand icon
      const brandIcon = iconName.replace('fab ', '');
      return <FontAwesomeIcon icon={['fab', brandIcon.replace('fa-', '') as any]} className="text-5xl md:text-7xl lg:text-8xl" />;
    } else {
      // Regular or solid icon
      const solidIcon = iconName.replace('fa-', '');
      return <FontAwesomeIcon icon={['fas', solidIcon as any]} className="text-5xl md:text-7xl lg:text-8xl" />;
    }
  };

  return (
    <section className="expertise-section" id="expertise">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={15}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop={true}
        className="w-full h-[497px] md:h-[550px] lg:h-[650px] px-6 max-w-full mx-auto"
      >
        {skills.map((skill) => (
          <SwiperSlide key={skill.id} className="swiper-slide-content relative w-full h-full overflow-hidden shadow-lg transition-all duration-500">
            {/* Background Image */}
            <div className="absolute inset-0 w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${skill.backgroundImage || '/images/1.png'})` }}>
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/50 transition-opacity duration-500"></div>
            </div>
            
            {/* Content */}
            <div className="absolute bottom-16 md:bottom-20 left-6 md:left-10 max-w-2xl z-10 text-white">
              {/* Icon */}
              <div className="mb-2 md:mb-4" style={{ color: skill.iconColor || '#00ed64' }}>
                {getIconComponent(skill.icon)}
              </div>
              
              {/* Title */}
              <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-2 md:mb-3">
                {skill.title}
              </h2>
              
              {/* Description */}
              <p className="text-sm md:text-lg mb-6 md:mb-8">
                {skill.description}
              </p>
              
              {/* Learn More Link */}
              {skill.learnMoreLink && (
                <a 
                  href={skill.learnMoreLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white text-black py-2 px-6 md:py-3 md:px-8 rounded-full text-sm md:text-base font-medium hover:bg-opacity-90 transition-all inline-flex items-center"
                >
                  Learn more
                  <svg 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3 h-3 md:w-4 md:h-4 ml-2"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M9 5l7 7-7 7"
                    ></path>
                  </svg>
                </a>
              )}
            </div>
            
            {/* Proficiency Indicator */}
            <div className="absolute bottom-6 md:bottom-8 right-6 md:right-10 z-10">
              <div className="flex items-center bg-white/30 backdrop-blur-sm py-0.5 px-2 md:py-1 md:px-3 rounded-full">
                <span className="text-white text-xs md:text-sm mr-1 md:mr-2">Proficiency:</span>
                <div className="w-16 md:w-24 bg-white/30 rounded-full h-1.5 md:h-2">
                  <div 
                    className="h-1.5 md:h-2 rounded-full" 
                    style={{ 
                      width: `${skill.proficiencyLevel}%`,
                      backgroundColor: skill.iconColor || '#00ed64'
                    }}
                  ></div>
                </div>
                <span className="text-white text-xs md:text-sm ml-1 md:ml-2">{skill.proficiencyLevel}%</span>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}