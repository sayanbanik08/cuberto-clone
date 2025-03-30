"use client"
import React, { ReactNode, useEffect, useState } from 'react'
import { ReactLenis } from "@studio-freight/react-lenis"

interface SmoothScrollingProps {
    children: ReactNode;
}

// Define the options type based on what ReactLenis accepts
type LenisOptionsType = {
    lerp?: number;
    duration?: number;
    smoothTouch?: boolean;
    touchMultiplier?: number;
    syncTouch?: boolean;
    gestureOrientation?: "vertical" | "horizontal" | "both";
    smoothWheel?: boolean;
    wheelMultiplier?: number;
    touchInertiaMultiplier?: number;
    infinite?: boolean;
}

const SmoothScrolling: React.FC<SmoothScrollingProps> = ({ children }) => {
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Detect iOS devices
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        setIsIOS(isIOSDevice);
        
        // Add iOS-specific class to body for CSS targeting
        if (isIOSDevice) {
            document.body.classList.add('ios-device');
            
            // Disable momentum scrolling on specific elements that might cause lag
            const scrollableElements = document.querySelectorAll('.scrollable');
            scrollableElements.forEach(element => {
                element.classList.add('ios-scrollable');
            });
        }
    }, []);

    // Use different settings for iOS devices
    const scrollOptions: LenisOptionsType = isIOS 
        ? { 
            lerp: 0.03,  // Even lower lerp value for iOS to reduce lag
            duration: 0.8,  // Shorter duration for iOS
            smoothTouch: false,  // Disable smooth touch for iOS
            touchMultiplier: 1.0,  // Default touch sensitivity
            syncTouch: true,  // Sync with native touch
            gestureOrientation: "vertical", // Ensure vertical scrolling
            smoothWheel: true, // Keep smooth wheel scrolling
            wheelMultiplier: 0.5, // Reduce wheel multiplier for smoother scrolling
            touchInertiaMultiplier: 0.6, // Reduce inertia for smoother stops
            infinite: false // Disable infinite scrolling which can cause lag
          } 
        : { 
            lerp: 0.1, 
            duration: 1.5 
          };

    // For iOS, we'll use a simpler approach to avoid lag
    if (isIOS) {
        return (
            <div className="ios-scroll-container">
                {children}
            </div>
        );
    }

    // For other browsers, use ReactLenis
    return (
        <ReactLenis root options={scrollOptions}>
            {children}
        </ReactLenis>
    );
}

export default SmoothScrolling