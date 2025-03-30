import React, { useEffect, useRef } from 'react';
import './video-header.css';

interface VideoHeaderProps {
  videoSrc: string;
  className?: string;
}

const VideoHeader: React.FC<VideoHeaderProps> = ({ videoSrc, className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Function to handle play attempt
    const attemptPlay = () => {
      video.play().catch(error => {
        // If autoplay is prevented, we'll handle it silently
        console.log("Autoplay prevented:", error);
        
        // Add a click event listener to play on user interaction
        document.addEventListener('click', () => {
          video.play().catch(e => console.log("Play failed even after interaction:", e));
        }, { once: true });
      });
    };

    // iOS Safari specific detection and handling
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isIOS && isSafari) {
      // For iOS Safari, we'll wait for user interaction
      document.addEventListener('touchstart', () => {
        attemptPlay();
      }, { once: true });
    } else {
      // For other browsers, attempt autoplay
      attemptPlay();
    }

    // Cleanup
    return () => {
      document.removeEventListener('click', attemptPlay);
      document.removeEventListener('touchstart', attemptPlay);
    };
  }, []);

  return (
    <div className={`video-header-container ${className}`}>
      <video 
        ref={videoRef}
        className="video-header"
        playsInline
        muted
        loop
        preload="auto"
      >
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoHeader; 