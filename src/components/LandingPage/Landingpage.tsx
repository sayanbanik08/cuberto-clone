import React, { useState, useEffect } from 'react'
import { TextAnimate } from '../ui/magicui/text-animate'
import * as motion from "motion/react-client"
import { fetchContent, setupContentPolling } from '@/utils/contentSync';

const Landingpage = () => {
    const [line1, setLine1] = useState('I am a sharp,');
    const [line2, setLine2] = useState('skilled,');
    const [line3, setLine3] = useState('adept');
    const [line4, setLine4] = useState('mind.');

    // Load header lines from content
    useEffect(() => {
        const loadHeaderLines = async () => {
            try {
                // Try to get content from the API first
                const apiContent = await fetchContent();
                
                if (apiContent && apiContent.siteVerifiedContent) {
                    const parsedContent = JSON.parse(apiContent.siteVerifiedContent);
                    if (parsedContent.headerTextLines && Array.isArray(parsedContent.headerTextLines)) {
                        if (parsedContent.headerTextLines.length >= 1) setLine1(parsedContent.headerTextLines[0]);
                        if (parsedContent.headerTextLines.length >= 2) setLine2(parsedContent.headerTextLines[1]);
                        if (parsedContent.headerTextLines.length >= 3) setLine3(parsedContent.headerTextLines[2]);
                        if (parsedContent.headerTextLines.length >= 4) setLine4(parsedContent.headerTextLines[3]);
                    }
                } else {
                    // Fallback to localStorage
                    const savedContent = localStorage.getItem('siteVerifiedContent');
                    if (savedContent) {
                        try {
                            const parsedContent = JSON.parse(savedContent);
                            if (parsedContent.headerTextLines && Array.isArray(parsedContent.headerTextLines)) {
                                if (parsedContent.headerTextLines.length >= 1) setLine1(parsedContent.headerTextLines[0]);
                                if (parsedContent.headerTextLines.length >= 2) setLine2(parsedContent.headerTextLines[1]);
                                if (parsedContent.headerTextLines.length >= 3) setLine3(parsedContent.headerTextLines[2]);
                                if (parsedContent.headerTextLines.length >= 4) setLine4(parsedContent.headerTextLines[3]);
                            }
                        } catch (error) {
                            console.error('Error parsing content from localStorage:', error);
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading header lines:', error);
            }
        };

        loadHeaderLines();
        
        // Set up polling to check for updates
        const cleanupPolling = setupContentPolling((data) => {
            if (data.siteVerifiedContent) {
                try {
                    const parsedContent = JSON.parse(data.siteVerifiedContent);
                    if (parsedContent.headerTextLines && Array.isArray(parsedContent.headerTextLines)) {
                        if (parsedContent.headerTextLines.length >= 1) setLine1(parsedContent.headerTextLines[0]);
                        if (parsedContent.headerTextLines.length >= 2) setLine2(parsedContent.headerTextLines[1]);
                        if (parsedContent.headerTextLines.length >= 3) setLine3(parsedContent.headerTextLines[2]);
                        if (parsedContent.headerTextLines.length >= 4) setLine4(parsedContent.headerTextLines[3]);
                    }
                } catch (error) {
                    console.error('Error parsing content from API:', error);
                }
            }
        });
        
        // Listen for content updates from admin panel in the same tab
        const handleContentUpdate = (event: CustomEvent) => {
            if (event.detail.type === 'headerTextLines') {
                if (Array.isArray(event.detail.content)) {
                    if (event.detail.content.length >= 1) setLine1(event.detail.content[0]);
                    if (event.detail.content.length >= 2) setLine2(event.detail.content[1]);
                    if (event.detail.content.length >= 3) setLine3(event.detail.content[2]);
                    if (event.detail.content.length >= 4) setLine4(event.detail.content[3]);
                }
            }
        };
        
        // Add event listener for content updates
        window.addEventListener('contentUpdated', handleContentUpdate as EventListener);
        
        // Listen for storage events (changes from other tabs)
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'siteVerifiedContent' && event.newValue) {
                try {
                    const parsedContent = JSON.parse(event.newValue);
                    if (parsedContent.headerTextLines && Array.isArray(parsedContent.headerTextLines)) {
                        if (parsedContent.headerTextLines.length >= 1) setLine1(parsedContent.headerTextLines[0]);
                        if (parsedContent.headerTextLines.length >= 2) setLine2(parsedContent.headerTextLines[1]);
                        if (parsedContent.headerTextLines.length >= 3) setLine3(parsedContent.headerTextLines[2]);
                        if (parsedContent.headerTextLines.length >= 4) setLine4(parsedContent.headerTextLines[3]);
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

    return (
        <div className='h-[75vh] sm:h-[80vh] md:h-[85vh] lg:h-[80vh] w-full flex flex-col relative mb-[-160px] sm:mb-[-140px] md:mb-[-150px] lg:mb-[20px]'>
            <div className='flex justify-between items-center pt-4 sm:pt-5 md:pt-6 w-full px-5 sm:px-6 md:px-8 lg:px-12'>
                <h1 className='text-xl sm:text-xl md:text-2xl font-semibold'>sayan</h1>
            </div>
            <div className='h-full mx-4 sm:mx-8 md:mx-16 lg:mx-32 xl:mx-40 mt-[-120px] sm:mt-[-100px] md:mt-[-60px] lg:mt-[10px] mb-6 sm:my-10 md:my-16 lg:my-20 flex flex-col justify-center'>
                <TextAnimate
                    animation="slideUp"
                    by="word"
                    className='font-regular text-4xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl'
                    style={{ animationDelay: "0s" }}
                >
                    {line1}
                </TextAnimate>

                <div className='flex items-center mt-1 sm:mt-2 gap-3 sm:gap-4 md:gap-5'>
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            duration: 0.4,
                            scale: { type: "spring", visualDuration: 1, bounce: 0 },
                        }}
                    >
                        <div className="ios-video-container">
                            <video 
                                src="/assets/header.mp4" 
                                autoPlay 
                                muted 
                                loop 
                                playsInline 
                                webkit-playsinline="true"
                                x-webkit-airplay="allow"
                                disablePictureInPicture
                                disableRemotePlayback
                            />
                        </div>
                    </motion.div>
                    <div style={{
                        position: "relative",
                        display: "inline-block",
                        translate: "none",
                        rotate: "none",
                        scale: "none",
                        transform: "translate(0px, 0%)",
                        padding: "0.2em",
                        willChange: "auto"
                    }}>
                        <TextAnimate
                            animation="slideUp"
                            by="word"
                            className='font-light-italic text-4xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl'
                            delay={0.3}
                        >
                            {line2}
                        </TextAnimate>
                    </div>
                    <TextAnimate
                        animation="slideUp"
                        by="word"
                        className='font-regular text-4xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl'
                        delay={0.6}
                    >
                        {line3}
                    </TextAnimate>
                </div>
                
                <TextAnimate
                    animation="slideUp"
                    by="word"
                    className='font-regular text-4xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl'
                    delay={0.9}
                >
                    {line4}
                </TextAnimate>
            </div>
        </div>
    )
}

export default Landingpage
