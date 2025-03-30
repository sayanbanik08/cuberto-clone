"use client";
import React from 'react';
import Image from 'next/image';

interface TodoProps {
  className?: string;
  title?: string;
  description?: string;
  showButtons?: boolean;
}

const Todo: React.FC<TodoProps> = ({ className = '', title, description, showButtons = true }) => {
  // Special formatting for iPad air title
  const formatTitle = (title: string = '') => {
    if (title.toLowerCase() === 'ipad air') {
      return (
        <>
          <span className="font-semibold">iPad</span> <span className="font-light italic">air</span>
        </>
      );
    }
    return title;
  };

  return (
    <div className={`relative ${className}`}>
      <Image
        src="/images/todo.webp"
        alt="Todo List"
        width={300}
        height={300}
        className="w-full h-auto"
      />
      
      <div className="absolute inset-0 flex flex-col p-8">
        <div className="text-center mb-4">
          <h2 className="text-4xl mb-1">{formatTitle(title)}</h2>
          <p className="text-xl">{description || 'Now supercharged by the M3 chip.'}</p>
        </div>
        
        {showButtons && (
          <div className="flex justify-center space-x-4 mt-4">
            <button className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition">
              Learn more
            </button>
            <button className="bg-transparent border border-gray-400 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-100 transition">
              Buy
            </button>
          </div>
        )}
        
        <div className="flex-grow flex justify-center items-center mt-6">
          {/* iPad device image would appear here */}
        </div>
        
        {title?.toLowerCase() === 'ipad air' && (
          <div className="text-center mt-auto">
            <p className="text-sm text-blue-500 font-medium">Built for Apple Intelligence.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Todo; 