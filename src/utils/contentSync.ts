/**
 * Utility functions for content synchronization across devices
 */

// Base URL for API calls - dynamically set based on environment
const getBaseUrl = () => {
  // In production or when accessing via IP, use the current hostname
  return window.location.origin;
};

/**
 * Fetch content from the server
 */
export const fetchContent = async () => {
  try {
    const response = await fetch(`${getBaseUrl()}/api/content`);
    if (!response.ok) {
      throw new Error('Failed to fetch content');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching content:', error);
    return null;
  }
};

/**
 * Update content on the server
 */
export const updateContent = async (type: string, content: any) => {
  try {
    const response = await fetch(`${getBaseUrl()}/api/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, content }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update content');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating content:', error);
    return { success: false };
  }
};

/**
 * Set up polling to check for content updates
 */
export const setupContentPolling = (callback: (data: any) => void, interval = 3000) => {
  let lastUpdated = 0;
  
  const checkForUpdates = async () => {
    const data = await fetchContent();
    if (data && data.lastUpdated > lastUpdated) {
      lastUpdated = data.lastUpdated;
      callback(data);
    }
  };
  
  // Initial check
  checkForUpdates();
  
  // Set up polling interval
  const intervalId = setInterval(checkForUpdates, interval);
  
  // Return cleanup function
  return () => clearInterval(intervalId);
};
