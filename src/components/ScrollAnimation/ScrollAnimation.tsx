import React, { ReactNode, useEffect, useState, useRef } from 'react';
import { motion, useScroll, useInView } from 'framer-motion';

interface ScrollAnimationProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
  distance?: number;
  once?: boolean;
  threshold?: number;
}

const ScrollAnimation: React.FC<ScrollAnimationProps> = ({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  distance = 50,
  once = false,
  threshold = 0.1,
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { 
    once, 
    amount: threshold 
  });
  
  // Initial animation states based on direction
  let initial = {};
  let animate = { y: 0, x: 0, opacity: 1 };
  
  switch (direction) {
    case 'up':
      initial = { y: distance, opacity: 0 };
      break;
    case 'down':
      initial = { y: -distance, opacity: 0 };
      break;
    case 'left':
      initial = { x: distance, opacity: 0 };
      break;
    case 'right':
      initial = { x: -distance, opacity: 0 };
      break;
    case 'fade':
      initial = { opacity: 0 };
      break;
    default:
      initial = { y: distance, opacity: 0 };
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={initial}
      animate={isInView ? animate : initial}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.25, 0.1, 0.25, 1.0], // Smooth easing
      }}
    >
      {children}
    </motion.div>
  );
};

export default ScrollAnimation; 