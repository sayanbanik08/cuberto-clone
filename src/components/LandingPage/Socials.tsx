import React from 'react'
import { VelocityScroll } from '../ui/magicui/scroll-based-velocity'
import CircularPing from '../ui/CircularPing'
import { ArrowUpRight } from 'lucide-react'
import SocialLinkRibbon from './SocialLinkRibbon'
import { TextAnimate } from '../ui/magicui/text-animate'
import Button from '../ui/Button'

const socials = [
    { key: "1", platform: "Linkedin", link: "www.instagram.com", icon: <ArrowUpRight className='h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12' /> },
    { key: "2", platform: "Behance", link: "www.instagram.com", icon: <ArrowUpRight className='h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12' /> },
    { key: "3", platform: "Dribbble", link: "www.instagram.com", icon: <ArrowUpRight className='h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12' /> },
    { key: "4", platform: "Youtube", link: "www.instagram.com", icon: <ArrowUpRight className='h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12' /> },
    { key: "5", platform: "Twitter", link: "www.instagram.com", icon: <ArrowUpRight className='h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12' /> },
    { key: "6", platform: "Github", link: "www.instagram.com", icon: <ArrowUpRight className='h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12' /> },
]

const Socials = () => {
    return (
        <div className='w-full min-h-screen bg-black pt-12 sm:pt-16 md:pt-20 lg:pt-28 xl:pt-32'>
            <VelocityScroll numRows={1} defaultVelocity={100}>
                <h1 className='text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[12rem] text-white font-regular px-4 sm:px-6 md:px-10 tracking-tighter'>Follow Us</h1>
                <CircularPing />
            </VelocityScroll>

            <div className='w-full'>
                <h1 className='uppercase text-base sm:text-lg md:text-sm text-white font-light-regular px-4 sm:px-6 md:px-12 lg:px-16 xl:px-20 pt-10 sm:pt-12 md:pt-16 pb-6 sm:pb-8 md:pb-12 border-b-1 border-white/20'>Social media and contacts</h1>

                {socials.map((social) => {
                    return (
                        <SocialLinkRibbon key={social.key} platform={social.platform} link={social.link} icon={social.icon} />
                    )
                })}
            </div>

            <div className="mx-4 sm:mx-6 md:mx-10 lg:mx-16 xl:mx-20 flex flex-col md:flex-row bg-black py-16 sm:py-20 md:py-24">
                <div className="w-full md:w-1/2 flex flex-col text-light-regular">
                    <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 md:gap-8 lg:gap-4'>
                        <TextAnimate className="text-white text-base sm:text-lg md:text-xs items-center uppercase">
                            Main Base
                        </TextAnimate>
                        <TextAnimate className="text-white text-2xl sm:text-2xl md:text-2xl lg:text-2xl xl:text-3xl">
                            Salkia
                        </TextAnimate>
                    </div>
                    <TextAnimate className="text-white text-2xl sm:text-2xl md:text-2xl lg:text-2xl xl:text-3xl mt-1 sm:mt-0">
                        Howrah, WB 711106
                    </TextAnimate>
                    <Button className='border-1 border-white rounded-4xl w-fit text-white font-light-regular text-base sm:text-xl md:text-2xl lg:text-2xl xl:text-3xl mt-6 sm:mt-8 hover:invert' padding='pt-3 pb-2 sm:pt-4 sm:pb-2 md:py-2 px-4 sm:px-6 md:px-4 uppercase'>sayanbanik459@gmail.com</Button>
                </div>

                <div className="w-full md:w-1/2 flex flex-col text-light-regular py-16 sm:py-24 md:py-0">
                    <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 md:gap-8 lg:gap-4'>
                        <TextAnimate className="text-white text-base sm:text-lg md:text-xs items-center uppercase">
                            Main Base
                        </TextAnimate>
                        <TextAnimate className="text-white text-2xl sm:text-2xl md:text-2xl lg:text-2xl xl:text-3xl">
                            Salkia
                        </TextAnimate>
                    </div>
                    <TextAnimate className="text-white text-2xl sm:text-2xl md:text-2xl lg:text-2xl xl:text-3xl mt-1 sm:mt-0">
                        Howrah, WB 711106
                    </TextAnimate>
                    <Button className='border-1 border-white rounded-4xl w-fit text-white font-light-regular text-base sm:text-xl md:text-2xl lg:text-2xl mt-6 sm:mt-8 hover:invert' padding='pt-3 pb-2 sm:pt-4 sm:pb-2 md:py-2 px-4 sm:px-6 md:px-4 uppercase'>+91 9674084634</Button>
                </div>
            </div>
        </div>
    )
}

export default Socials