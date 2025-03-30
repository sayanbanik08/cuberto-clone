import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import FlipText from "./FlipText";
import UnderLineText from "./ui/UnderLineText";
import ContactForm from "./ContactForm";
import PDFViewer from "./PDFViewer";
import { fetchContent, setupContentPolling } from '@/utils/contentSync';

const socialLinks = ["Linkedin", "Behance", "Dribbble", "Instagram", "Youtube", "Twitter", "Github"];
const menuItems = ["Expertise", "Projects", "Verified", "One-Pager", "Contacts"];

const SideNav = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const [isContactFormVisible, setIsContactFormVisible] = useState(false);
    const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
    const [resumeUrl, setResumeUrl] = useState('/images/resume.jpg');

    // Load resume URL from content
    useEffect(() => {
        const loadResumeUrl = async () => {
            try {
                // Try to get content from the API first
                const apiContent = await fetchContent();
                
                if (apiContent && apiContent.siteVerifiedContent) {
                    const parsedContent = JSON.parse(apiContent.siteVerifiedContent);
                    if (parsedContent.resumeUrl && parsedContent.resumeUrl.trim() !== '') {
                        setResumeUrl(parsedContent.resumeUrl);
                    }
                } else {
                    // Fallback to localStorage if API fails
                    const savedContent = localStorage.getItem('siteVerifiedContent');
                    if (savedContent) {
                        try {
                            const parsedContent = JSON.parse(savedContent);
                            if (parsedContent.resumeUrl && parsedContent.resumeUrl.trim() !== '') {
                                setResumeUrl(parsedContent.resumeUrl);
                            }
                        } catch (error) {
                            console.error('Error parsing content from localStorage:', error);
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading resume URL:', error);
            }
        };

        loadResumeUrl();
        
        // Set up polling to check for updates
        const cleanupPolling = setupContentPolling((data) => {
            if (data.siteVerifiedContent) {
                try {
                    const parsedContent = JSON.parse(data.siteVerifiedContent);
                    if (parsedContent.resumeUrl && parsedContent.resumeUrl.trim() !== '') {
                        setResumeUrl(parsedContent.resumeUrl);
                    }
                } catch (error) {
                    console.error('Error parsing content from API:', error);
                }
            }
        });
        
        // Listen for content updates from admin panel in the same tab
        const handleContentUpdate = (event: CustomEvent) => {
            if (event.detail.type === 'resumeUrl') {
                setResumeUrl(event.detail.content);
            }
        };
        
        // Add event listener for content updates
        window.addEventListener('contentUpdated', handleContentUpdate as EventListener);
        
        // Listen for storage events (changes from other tabs)
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'siteVerifiedContent' && event.newValue) {
                try {
                    const parsedContent = JSON.parse(event.newValue);
                    if (parsedContent.resumeUrl && parsedContent.resumeUrl.trim() !== '') {
                        setResumeUrl(parsedContent.resumeUrl);
                    }
                } catch (error) {
                    console.error('Error parsing content from storage event:', error);
                }
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            cleanupPolling();
            window.removeEventListener('contentUpdated', handleContentUpdate as EventListener);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const handleMenuItemClick = (item: string) => {
        if (item === "Contacts") {
            setIsContactFormVisible(true);
        } else if (item === "Expertise") {
            // First close the side menu
            onClose();
            
            // Use setTimeout to allow the menu closing animation to complete
            setTimeout(() => {
                // Find the skills slider section and scroll to it
                const skillsSection = document.getElementById("skillsSlider");
                if (skillsSection) {
                    // Get the element's position
                    const rect = skillsSection.getBoundingClientRect();
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    
                    // Calculate position with offset (80px from the top)
                    const offsetPosition = rect.top + scrollTop - 80;
                    
                    // Scroll with offset
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }, 300); // 300ms should be enough for the menu to start closing
        } else if (item === "Projects") {
            // First close the side menu
            onClose();
            
            // Use setTimeout to allow the menu closing animation to complete
            setTimeout(() => {
                // Find the projects section (with todo and inquiry boxes) and scroll to it
                const projectsSection = document.getElementById("projects");
                if (projectsSection) {
                    projectsSection.scrollIntoView({ behavior: "smooth" });
                }
            }, 300);
        } else if (item === "Verified") {
            // First close the side menu
            onClose();
            
            // Use setTimeout to allow the menu closing animation to complete
            setTimeout(() => {
                // Find the verified section (with My Photo, Academic Results, and FAQ) and scroll to it
                const verifiedSection = document.getElementById("verified");
                if (verifiedSection) {
                    verifiedSection.scrollIntoView({ behavior: "smooth" });
                }
            }, 300);
        } else if (item === "One-Pager") {
            // First close the side menu
            onClose();
            
            // Open resume in a cross-browser compatible way
            setTimeout(() => {
                // Detect iOS devices
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
                // Detect Android devices
                const isAndroid = /Android/.test(navigator.userAgent);
                
                // Create a hidden anchor element for cross-browser compatibility
                const link = document.createElement('a');
                link.href = resumeUrl;
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
                
                // If on mobile, attempt different approaches
                if (isIOS || isAndroid) {
                    // Try to open PDF in new tab first
                    const newWindow = window.open(resumeUrl, '_blank');
                    
                    // If window.open was blocked or unsuccessful, fall back to embedded viewer
                    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                        setIsPdfViewerOpen(true);
                    }
                } else {
                    // For desktop browsers, try the standard approach
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            }, 300);
        }
    };

    const handleContactFormClose = () => {
        setIsContactFormVisible(false);
    };
    
    const handlePdfViewerClose = () => {
        setIsPdfViewerOpen(false);
    };

    return (
        <>
            {/* Overlay for closing SideNav when clicking outside */}
            <div
                className={`fixed inset-0 bg-black transition-opacity duration-500 ${isOpen ? "opacity-50 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                onClick={onClose}
                style={{ zIndex: 30 }}
            ></div>

            {/* Contact Form */}
            <ContactForm isVisible={isContactFormVisible && isOpen} onClose={handleContactFormClose} />
            
            {/* Contact Form Backdrop */}
            {isContactFormVisible && isOpen && (
                <div 
                    className="fixed inset-0 bg-black/30 transition-opacity duration-300"
                    onClick={handleContactFormClose}
                    style={{ zIndex: 45 }}
                ></div>
            )}
            
            {/* PDF Viewer */}
            <PDFViewer 
                pdfUrl={resumeUrl} 
                isOpen={isPdfViewerOpen} 
                onClose={handlePdfViewerClose} 
            />

            {/* Side Navigation Menu */}
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: isOpen ? "0%" : "100%" }}
                transition={{ type: "tween", duration: 0.6, ease: "easeInOut" }}
                className="fixed top-0 right-0 h-full w-full sm:w-3/4 md:w-1/2 bg-white/90 backdrop-blur-[0.1px] text-black shadow-lg flex flex-col items-center justify-center gap-6 z-40 transition-opacity duration-700"
            >
                <div className="px-8 sm:px-10 md:px-16 lg:px-20 pt-20 sm:pt-24 md:pt-36 pb-12 sm:pb-16 md:pb-24 w-full h-full flex flex-col">
                    <motion.div className="flex transition-opacity duration-700" transition={{ type: "", duration: 0.6, ease: "easeInOut" }}>
                        <div className="hidden sm:flex sm:flex-col h-full w-1/2">
                            <h1 className="text-xs text-black/30 font-light-regular pb-6 sm:pb-8 md:pb-12">Social media</h1>
                            <div className="text-sm font-light-regular flex flex-col">
                                {socialLinks.map((link, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: isOpen ? 1 : 0 }}
                                        transition={{ duration: 0.6, delay: index * 0.1 }}
                                    >
                                        <FlipText className="pb-3 sm:pb-4 w-fit">{link}</FlipText>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col h-full w-full sm:w-1/2">
                            <h1 className="text-xs text-black/30 font-light-regular pb-6 sm:pb-8 md:pb-8">menu</h1>
                            <div className="text-3xl sm:text-4xl md:text-5xl font-light-regular flex flex-col tracking-tighter">
                                {menuItems.map((item, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: isOpen ? 1 : 0 }}
                                        transition={{ duration: 0.6, delay: index * 0.1 }}
                                    >
                                        <div 
                                          onClick={() => handleMenuItemClick(item)}
                                          className="cursor-pointer"
                                        >
                                          <FlipText className="pb-4 sm:pb-5 md:pb-6 w-fit">{item}</FlipText>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                    <div className="flex flex-col h-full justify-end mt-12 sm:mt-8 md:mt-0">
                        <h1 className="text-base sm:text-lg md:text-xs text-black/30 font-light-regular pb-3 sm:pb-4">Get in touch</h1>
                        <div className="flex text-base sm:text-lg md:text-xl">
                            <UnderLineText className="w-full">sayanbanik459@gmail.com</UnderLineText>
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
    );
};

export default SideNav;
