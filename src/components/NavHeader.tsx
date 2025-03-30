"use client"
import React, { forwardRef, useEffect, useState } from 'react'

// eslint-disable-next-line
const NavHeader = forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(function NavHeader({ onClick, ...props }, ref) {
    const [isIOS, setIsIOS] = useState(false);
    
    useEffect(() => {
        // Detect iOS devices
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        setIsIOS(isIOSDevice);
    }, []);
    
    // For iOS, use a white hamburger menu since the screenshot shows a dark background
    if (isIOS) {
        return (
            <div
                ref={ref}
                className="fixed flex flex-col justify-center items-center gap-[2px] sm:gap-[2.5px] md:gap-[3px] z-50 top-0 right-0 mt-3 sm:mt-4 mr-4 sm:mr-6 md:mr-8 p-4 sm:p-5 md:p-6 cursor-pointer hamburger-menu"
                onClick={onClick}
                data-ios-nav="true"
            >
                <span className="w-6 sm:w-7 md:w-8 h-0.5 bg-white"></span>
                <span className="w-6 sm:w-7 md:w-8 h-0.5 bg-white"></span>
            </div>
        );
    }
    
    // For non-iOS devices, use the original implementation with mix-blend-difference
    return (
        <div
            ref={ref}
            className='fixed flex flex-col justify-center items-center gap-[2px] sm:gap-[2.5px] md:gap-[3px] z-50 mix-blend-difference top-0 right-0 mt-3 sm:mt-4 mr-4 sm:mr-6 md:mr-8 p-4 sm:p-5 md:p-6 cursor-pointer'
            onClick={onClick}
        >
            <span className='w-6 sm:w-7 md:w-8 h-0.5 mix-blend-difference bg-white'></span>
            <span className='w-6 sm:w-7 md:w-8 h-0.5 mix-blend-difference bg-white'></span>
        </div>
    );
})

export default NavHeader