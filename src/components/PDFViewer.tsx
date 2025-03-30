import React, { useEffect, useState } from 'react';

interface PDFViewerProps {
  pdfUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl, isOpen, onClose }) => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // Detect if the user is on a mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      setIsMobile(/android|iPad|iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent));
    };
    
    checkMobile();
    
    // If the PDF viewer is open, prevent body scrolling
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    // Cleanup function
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div className="pdf-container">
      <div className="fixed top-4 right-4 z-50">
        <button 
          onClick={onClose} 
          className="bg-gray-800 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-700"
        >
          ×
        </button>
      </div>
      
      {isMobile ? (
        // Mobile view - provide download option since many mobile browsers struggle with embedded PDFs
        <div className="flex flex-col items-center justify-center h-full p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
            <h3 className="text-xl font-semibold mb-4">Resume PDF</h3>
            <p className="mb-6">Your device may not support in-browser PDF viewing. Please use one of these options:</p>
            
            <div className="space-y-4">
              <a 
                href={pdfUrl} 
                download="resume.pdf"
                className="block w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
              >
                Download PDF
              </a>
              
              <a 
                href={pdfUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full py-2 px-4 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300"
              >
                Open in New Tab
              </a>
            </div>
          </div>
        </div>
      ) : (
        // Desktop view - embedded PDF
        <object 
          data={pdfUrl} 
          type="application/pdf" 
          className="pdf-object"
        >
          <p>
            Your browser does not support PDFs.
            <a href={pdfUrl} download="resume.pdf">Download the PDF</a> instead.
          </p>
        </object>
      )}
    </div>
  );
};

export default PDFViewer; 