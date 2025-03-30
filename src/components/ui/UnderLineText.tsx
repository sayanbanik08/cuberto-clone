import React, { ReactNode } from "react";

const UnderLineText = ({ children, className }: { children: ReactNode, className?: string }) => {
  return (
    <div className={`underline-text-wrapper ${className}`}>
      <button className="underline-text font-light-regular border-b-1 border-black/30 ">{children}</button>

      <style jsx>{`
        .underline-text-wrapper {
          display: inline-block;
        }

        .underline-text {
          color: #000;
          cursor: pointer;
          position: relative;
          transition: color 400ms cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        .underline-text:hover,
        .underline-text:focus {
          color: #000;
        }

        .underline-text::after {
          content: "";
          pointer-events: none;
          bottom: -2px;
          left: 50%;
          position: absolute;
          width: 0%;
          height: 1px;
          background-color: #000;
          transition: width 400ms cubic-bezier(0.25, 0.8, 0.25, 1),
                      left 400ms cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        .underline-text:hover::after,
        .underline-text:focus::after {
          width: 100%;
          left: 0%;
        }
      `}</style>
    </div>
  );
};

export default UnderLineText;
