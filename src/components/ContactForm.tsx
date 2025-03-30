import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Loader, WifiOff } from "lucide-react";

// API base URL from your backend
const API_BASE_URL = "https://sayan-fs-be.onrender.com/api";
// OTP expiration time in minutes
const OTP_EXPIRATION_MINUTES = 15;
// Max number of retries for failed API calls
const MAX_RETRIES = 3;

interface ContactFormProps {
  isVisible: boolean;
  onClose: () => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ isVisible, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    otp: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [otpTimer, setOtpTimer] = useState(OTP_EXPIRATION_MINUTES * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(30);
  const [apiStatus, setApiStatus] = useState({ checked: false, available: true, retries: 0 });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check API availability on component mount and when online status changes
  useEffect(() => {
    if (isOnline && isVisible) {
      checkApiStatus();
    }
  }, [isOnline, isVisible]);

  // Function to check API status with retry logic
  const checkApiStatus = async (retryCount = 0) => {
    if (retryCount > MAX_RETRIES) {
      console.error('Max retries reached for API health check');
      setApiStatus({ checked: true, available: false, retries: retryCount });
      return;
    }

    try {
      // Use a timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Try to connect to the health endpoint
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        // Prevent caching issues on mobile
        cache: 'no-cache',
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('API is available');
        setApiStatus({ checked: true, available: true, retries: retryCount });
      } else {
        console.error('API health check failed');
        // If first failure, retry immediately
        if (retryCount === 0) {
          return checkApiStatus(retryCount + 1);
        }
        setApiStatus({ checked: true, available: false, retries: retryCount });
      }
    } catch (error) {
      console.error('API connection error:', error);
      // Exponential backoff for retries
      const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 5000);
      setTimeout(() => checkApiStatus(retryCount + 1), backoffDelay);
    }
  };

  // OTP timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prevTime => prevTime - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      // OTP expired
      if (showOTP) {
        toast('OTP has expired. Please request a new one.', 'error');
        setShowOTP(false);
        resetForm();
      }
    }
    return () => clearInterval(interval);
  }, [timerActive, otpTimer, showOTP]);

  // Resend countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showOTP && !canResend && resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown(prevTime => {
          const newTime = prevTime - 1;
          if (newTime <= 0) {
            setCanResend(true);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOTP, canResend, resendCountdown]);

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Simple toast notification
  const toast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500'
    };
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `${colors[type]} text-white py-2 px-4 rounded shadow-lg fixed top-4 right-4 z-50 transition-opacity duration-300`;
    toast.textContent = message;
    
    // Add to DOM
    document.body.appendChild(toast);
    
    // Remove after 5 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 5000);
  };

  // Validate form inputs
  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Basic validation rules
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Email is invalid";
    if (!formData.phone.trim()) errors.phone = "Phone is required";
    else if (!/^\d{10,15}$/.test(formData.phone.replace(/[^0-9]/g, ''))) errors.phone = "Phone number is invalid";
    if (!formData.subject.trim()) errors.subject = "Subject is required";
    if (!formData.message.trim()) errors.message = "Message is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Execute fetch with retry logic
  const fetchWithRetry = async (url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> => {
    try {
      // Use timeout to prevent hanging requests
      const controller = new AbortController();
      const signal = controller.signal;
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, { 
        ...options, 
        signal,
        // Prevent caching issues on mobile
        cache: 'no-cache', 
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (retries <= 0) throw error;
      
      console.log(`Retrying... ${retries} attempts left`);
      // Add exponential backoff
      const backoffDelay = Math.min(1000 * Math.pow(2, MAX_RETRIES - retries), 5000);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      
      return fetchWithRetry(url, options, retries - 1);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Check if device is online
    if (!isOnline) {
      toast("You're offline. Please check your internet connection.", "error");
      return;
    }

    // Check if API is available
    if (!apiStatus.available) {
      toast("Server is not available. Please try again later.", "error");
      // Try to check API status again
      checkApiStatus();
      return;
    }

    // Validate form before submission
    if (!validateForm()) {
      toast("Please fix the errors in the form", "error");
      return;
    }

    setIsLoading(true);

    try {
      console.log(`Submitting form to ${API_BASE_URL}/submit`);

      // Use the configured API URL with retry logic
      const response = await fetchWithRetry(`${API_BASE_URL}/submit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Add a timestamp to prevent caching issues
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      // Check the status code to determine the type of response
      if (response.ok) {
        if (result.message === 'OTP_REQUIRED') {
          toast('OTP has been sent to your email address', 'success');
          setShowOTP(true);
          // Start the timer
          setOtpTimer(OTP_EXPIRATION_MINUTES * 60);
          setTimerActive(true);
          // Reset resend ability
          setCanResend(false);
          setResendCountdown(30);
        } else {
          toast(result.message || 'Form submitted', 'info');
        }
      } else {
        // Handle error responses with proper messages
        if (response.status === 400) {
          // This is likely a validation error
          toast(result.message || 'Please check your form data and try again.', 'error');
        } else if (response.status === 500) {
          toast(result.message || 'Server error. Please try again later.', 'error');
        } else {
          toast(result.message || 'An error occurred', 'error');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      // This is a true connection error
      toast('Connection error. Please check your internet and try again.', 'error');
      setApiStatus(prev => ({ ...prev, available: false }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    // Check if device is online
    if (!isOnline) {
      toast("You're offline. Please check your internet connection.", "error");
      return;
    }

    if (!apiStatus.available) {
      toast("Server is not available. Please try again later.", "error");
      return;
    }

    if (!formData.otp.trim()) {
      toast('Please enter the OTP sent to your email', 'error');
      return;
    }

    setIsLoading(true);

    try {
      console.log(`Verifying OTP at ${API_BASE_URL}/verify`);

      // Use the configured API URL with retry logic
      const response = await fetchWithRetry(`${API_BASE_URL}/verify`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Add a timestamp to prevent caching issues
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      // Check the status code to determine the type of response
      if (response.ok) {
        if (result.message === 'Data saved successfully.') {
          toast('Your message has been received. Thank you for contacting us!', 'success');
          setShowOTP(false);
          setTimerActive(false);
          setFormData({
            name: '',
            email: '',
            phone: '',
            subject: '',
            message: '',
            otp: ''
          });
          onClose();
        } else {
          toast(result.message || 'Submission processed', 'info');
        }
      } else {
        // Handle error responses with proper messages
        if (response.status === 400) {
          // This is likely an invalid OTP
          toast(result.message || 'Invalid OTP. Please try again.', 'error');
        } else {
          toast(result.message || 'Server error. Please try again later.', 'error');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      // This is a true connection error
      toast('Connection error. Please check your internet and try again.', 'error');
      setApiStatus(prev => ({ ...prev, available: false }));
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setShowOTP(false);
    setIsLoading(false);
    setTimerActive(false);
    setCanResend(false);
    setResendCountdown(30);
  };

  const requestNewOTP = () => {
    if (!canResend) return;

    setShowOTP(false);
    setTimerActive(false);
    setCanResend(false);
    setResendCountdown(30);
    handleSubmit();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 20 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className={`fixed right-0 top-0 h-full w-full sm:w-[450px] md:w-[500px] bg-white shadow-lg ${
        isVisible ? "block" : "hidden"
      }`}
      style={{ zIndex: 50, backgroundColor: "#ffffff" }}
    >
      <div className="flex flex-col h-full p-4 sm:p-6 relative overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close contact form"
        >
          <X size={20} />
        </button>
        
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="flex flex-col items-center">
              <Loader size={36} className="animate-spin text-black" />
              <p className="mt-3 text-gray-700">Processing...</p>
            </div>
          </div>
        )}

        {/* Offline status indicator */}
        {!isOnline && (
          <div className="bg-red-50 p-2 rounded-md mb-4 mt-8 flex items-center">
            <WifiOff size={16} className="text-red-500 mr-2 flex-shrink-0" />
            <p className="text-xs text-red-600">You're offline. Please check your connection.</p>
          </div>
        )}
        
        {showOTP ? (
          <div className="flex flex-col mt-10">
            <h2 className="text-xl sm:text-2xl font-light-regular mb-4">Verify OTP</h2>
            
            <div className="bg-gray-50 p-3 rounded-md mb-4">
              <p className="text-sm text-gray-600">We've sent a verification code to your email.</p>
              <div className="mt-1 text-sm">
                <span className="text-gray-500">Time: </span>
                <span className={`font-medium ${otpTimer < 60 ? 'text-red-500' : 'text-gray-700'}`}>
                  {formatTime(otpTimer)}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col gap-1 mb-4">
              <label htmlFor="otp" className="text-sm text-black/60 font-light-regular">Enter OTP</label>
              <input 
                type="text" 
                id="otp"
                name="otp"
                placeholder="Enter code" 
                className="p-2.5 border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black/20 text-center text-lg tracking-wider"
                value={formData.otp}
                onChange={handleChange}
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
              />
            </div>
            
            <button 
              onClick={handleVerifyOTP} 
              className="py-2.5 px-5 bg-black text-white rounded-md hover:bg-black/80 transition-colors"
              disabled={isLoading || !isOnline}
            >
              Verify
            </button>
            
            <div className="flex justify-between mt-3">
              <button 
                onClick={resetForm} 
                className="py-1.5 px-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-gray-700 text-sm"
                disabled={isLoading}
              >
                Cancel
              </button>
              
              <button 
                onClick={requestNewOTP} 
                className={`py-1.5 px-3 text-sm ${canResend ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-500'} rounded-md transition-colors`}
                disabled={isLoading || !canResend || !isOnline}
              >
                {canResend ? 'Resend OTP' : `Resend in ${resendCountdown}s`}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl sm:text-2xl font-light-regular mt-8 mb-4">Contact us</h2>
            
            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-1">
                <label htmlFor="name" className="text-xs text-black/60 font-light-regular">Name</label>
                <input 
                  type="text" 
                  id="name"
                  name="name" 
                  placeholder="Your name" 
                  className={`p-2 border ${formErrors.name ? 'border-red-400' : 'border-gray-200'} rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black/20`}
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {formErrors.name && <p className="text-red-500 text-xs">{formErrors.name}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="email" className="text-xs text-black/60 font-light-regular">Email</label>
                  <input 
                    type="email" 
                    id="email"
                    name="email" 
                    placeholder="Your email" 
                    className={`p-2 border ${formErrors.email ? 'border-red-400' : 'border-gray-200'} rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black/20`}
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    inputMode="email"
                  />
                  {formErrors.email && <p className="text-red-500 text-xs">{formErrors.email}</p>}
                </div>
                
                <div className="flex flex-col gap-1">
                  <label htmlFor="phone" className="text-xs text-black/60 font-light-regular">Phone</label>
                  <input 
                    type="tel" 
                    id="phone"
                    name="phone" 
                    placeholder="Phone number" 
                    className={`p-2 border ${formErrors.phone ? 'border-red-400' : 'border-gray-200'} rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black/20`}
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={isLoading}
                    inputMode="tel"
                  />
                  {formErrors.phone && <p className="text-red-500 text-xs">{formErrors.phone}</p>}
                </div>
              </div>
              
              <div className="flex flex-col gap-1">
                <label htmlFor="subject" className="text-xs text-black/60 font-light-regular">Subject</label>
                <input 
                  type="text" 
                  id="subject"
                  name="subject" 
                  placeholder="Subject" 
                  className={`p-2 border ${formErrors.subject ? 'border-red-400' : 'border-gray-200'} rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black/20`}
                  value={formData.subject}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {formErrors.subject && <p className="text-red-500 text-xs">{formErrors.subject}</p>}
              </div>
              
              <div className="flex flex-col gap-1">
                <label htmlFor="message" className="text-xs text-black/60 font-light-regular">Message</label>
                <textarea 
                  id="message"
                  name="message" 
                  rows={3} 
                  placeholder="Your message" 
                  className={`p-2 border ${formErrors.message ? 'border-red-400' : 'border-gray-200'} rounded-md bg-gray-50 resize-none focus:outline-none focus:ring-2 focus:ring-black/20`}
                  value={formData.message}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {formErrors.message && <p className="text-red-500 text-xs">{formErrors.message}</p>}
              </div>
              
              <button 
                type="submit" 
                className="mt-2 py-2.5 px-5 bg-black text-white rounded-md hover:bg-black/80 transition-colors"
                disabled={isLoading || !isOnline}
              >
                Send message
              </button>
            </form>
          </div>
        )}
        
        {!showOTP && (
          <div className="mt-auto pt-4">
            <p className="text-xs text-black/60">You can also reach us at:</p>
            <a href="mailto:sayanbanik459@gmail.com" className="text-sm font-light-regular hover:underline">sayanbanik459@gmail.com</a>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ContactForm; 