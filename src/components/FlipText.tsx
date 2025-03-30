import React from 'react'
import * as motion from "motion/react-client"

const DURATION = 0.2;
const STAGGER = 0;

interface IFlipText {
    children: string;
    href?: string;
    duration?: number;
    stagger?: number;
    className?: string
}

const FlipText = ({ children, href, duration = DURATION, stagger = STAGGER, className }: IFlipText) => {
    return (
        <motion.a
            initial="initial"
            whileHover="hovered"
            href={href}
            className={`relative block overflow-hidden ${className}`}
        >
            <div className="relative overflow-hidden w-full h-full flex items-center justify-center">
                <motion.span
                    variants={{
                        initial: {
                            y: 0,
                        },
                        hovered: {
                            y: "-105%",
                        },
                    }}
                    transition={{
                        duration: duration,
                        ease: "easeInOut",
                        delay: stagger,
                    }}
                    className="inline-block whitespace-nowrap"
                >
                    {children}
                </motion.span>

                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.span
                        variants={{
                            initial: {
                                y: "100%",
                            },
                            hovered: {
                                y: 0,
                            },
                        }}
                        transition={{
                            duration: duration,
                            ease: "easeInOut",
                            delay: stagger,
                        }}
                        className="inline-block whitespace-nowrap"
                    >
                        {children}
                    </motion.span>
                </div>
            </div>
        </motion.a>
    )
}

export default FlipText