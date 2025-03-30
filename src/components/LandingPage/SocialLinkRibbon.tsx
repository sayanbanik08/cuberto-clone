"use client";
import React, { ReactNode, useState } from "react";
import { VelocityScroll } from "../ui/magicui/scroll-based-velocity";
import { motion } from "framer-motion";

interface ILinkRibbon {
    platform: string;
    link: string;
    icon: ReactNode;
}

// eslint-disable-next-line
const SocialLinkRibbon = ({ platform, link, icon }: ILinkRibbon) => {
    const [isHovered, setIsHovered] = useState<boolean>(false);

    return (
        <div
            className="w-full border-y border-white/20 relative overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="w-full h-full flex justify-between items-center px-4 sm:px-6 md:px-12 lg:px-16 xl:px-20 py-6 sm:py-7 md:py-8 font-regular text-base sm:text-xl md:text-2xl lg:text-3xl text-white relative z-10">
                <h1 className="w-full text-left">{platform}</h1>
                <div className="w-full flex justify-end">{icon}</div>
            </div>

            <motion.div
                className="absolute w-full h-full bg-white text-black top-0 left-0 z-20 flex justify-center items-center"
                initial={{ clipPath: "inset(50% 0 50% 0)" }}
                animate={{
                    clipPath: isHovered ? "inset(0% 0 0% 0)" : "inset(50% 0 50% 0)",
                    transition: { duration: 0.3, ease: "easeInOut" },
                }}
            >
                <VelocityScroll
                    className="w-full h-full flex justify-center items-center space-x-8 sm:space-x-12 md:space-x-16 lg:space-x-20 overflow-hidden"
                    numRows={1}
                    defaultVelocity={100}
                >
                    {/* Duplicating content for smooth infinite scroll */}
                    <div className="flex space-x-8 sm:space-x-12 md:space-x-16 lg:space-x-20">
                        {Array(5)
                            .fill(null)
                            .map((_, index) => (
                                <span key={index} className="flex justify-center items-center gap-4 sm:gap-6 md:gap-8 lg:gap-12 text-base sm:text-xl md:text-2xl lg:text-3xl">
                                    {platform} {icon}
                                </span>
                            ))}
                    </div>
                </VelocityScroll>
            </motion.div>
        </div>
    );
};

export default SocialLinkRibbon;
