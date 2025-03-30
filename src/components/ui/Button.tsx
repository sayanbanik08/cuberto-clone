import React from 'react'
import FlipText from '../FlipText'

interface IButton {
    children: string;
    url?: string;
    className?: string;
    padding?: string;
}

const Button = ({ children, url, className, padding }: IButton) => {
    return (
        <div className={`button-wrapper ${className}`}>
            <button className="button2 w-full h-full">
                <FlipText href={`${url}`} className={`w-full h-full ${padding}`}>
                    {children}
                </FlipText>
            </button>
            <style>
                {`
                    .button-wrapper {
                        display: inline-block;
                        transition: all 0.3s ease-in-out;
                        position: relative;
                        overflow: hidden;
                        z-index: 1;
                        cursor: pointer;
                        text-align: center;
                    }

                    .button-wrapper:hover {
                        transform: scale(1.05);
                        color: #ffffff;
                    }

                    /* Scale down slightly when clicked */
                    .button-wrapper:active {
                        transform: scale(0.95);
                    }
                    .button-wrapper::before {
                        content: "";
                        position: absolute;
                        left: 50%;
                        transform: translateX(-50%) scaleY(1) scaleX(1.25);
                        top: 100%;
                        width: 140%;
                        height: 180%;
                        background-color: #000;
                        border-radius: 50%;
                        display: block;
                        transition: all 0.5s 0.1s cubic-bezier(0.55, 0, 0.1, 1);
                        z-index: -1;
                    }
                    .button-wrapper::after {
                        content: "";
                        position: absolute;
                        left: 55%;
                        transform: translateX(-50%) scaleY(1) scaleX(1.45);
                        top: 180%;
                        width: 160%;
                        height: 190%;
                        border-radius: 50%;
                        display: block;
                        transition: all 0.5s 0.1s cubic-bezier(0.55, 0, 0.1, 1);
                        z-index: -1;
                    }
                    .button-wrapper:hover::before {
                        top: -35%;
                        background-color: #000;
                        transform: translateX(-50%) scaleY(1.3) scaleX(0.8);
                    }
                    .button-wrapper:hover::after {
                        top: -45%;
                        background-color: #000;
                        transform: translateX(-50%) scaleY(1.3) scaleX(0.8);
                    }
        `}
            </style>
        </div>
    );
};

export default Button;