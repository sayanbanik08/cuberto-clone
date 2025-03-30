"use client";
import React from 'react';
import Image from 'next/image';

interface UserInquiryFormProps {
  className?: string;
  title?: string;
  description?: string;
  showButtons?: boolean;
}

const UserInquiryForm: React.FC<UserInquiryFormProps> = ({ className = '', title, description, showButtons = true }) => {
  const lines = description?.split('.') || [];
  
  return (
    <div className={`relative ${className}`}>
      <Image
        src="/images/user-inq.webp"
        alt="User Inquiry Form"
        width={300}
        height={300}
        className="w-full h-auto"
      />
      
      <div className="absolute inset-0 flex flex-col items-center text-center text-white p-8">
        <div className="mt-8">
          {/* Apple TV+ logo would appear here */}
          <svg className="w-10 h-10 mb-2 mx-auto" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          
          <h2 className="text-4xl font-bold mb-6">{title || 'Friday Night Baseball'}</h2>
          
          <div className="space-y-1">
            {lines.length > 0 ? (
              lines.map((line, index) => (
                <p key={index} className="text-lg">{line.trim()}</p>
              ))
            ) : (
              <>
                <p className="text-lg">Home runs. Diving catches.</p>
                <p className="text-lg">Baseball returns. Live this Friday.</p>
              </>
            )}
          </div>
        </div>
        
        {showButtons && (
          <div className="mt-6">
            <button className="bg-white text-black px-6 py-2 rounded-full hover:bg-gray-100 transition">
              Learn more
            </button>
          </div>
        )}
        
        <div className="mt-auto mb-4 text-xs opacity-80">
          <p>© 2023 MLB</p>
        </div>
      </div>
    </div>
  );
};

export default UserInquiryForm; 