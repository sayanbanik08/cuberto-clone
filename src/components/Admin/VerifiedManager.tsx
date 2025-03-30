'use client';

import { useState, useEffect, useRef } from 'react';
import styles from '../../app/admin/admin.module.css';
import { fetchContent, updateContent, setupContentPolling } from '@/utils/contentSync';

interface VerifiedContent {
  aboutText: string;
  tagline: string;
  photoUrl: string;
  resumeUrl: string;
  results: Result[];
}

interface Result {
  id: string;
  title: string;
  imageUrl: string;
}

export default function VerifiedManager() {
  const [content, setContent] = useState<VerifiedContent>({
    aboutText: '',
    tagline: '',
    photoUrl: '',
    resumeUrl: '',
    results: []
  });
  
  const [activeSection, setActiveSection] = useState('about');
  const [editingAbout, setEditingAbout] = useState(false);
  const [editingTagline, setEditingTagline] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [editingResume, setEditingResume] = useState(false);
  const [editingResultId, setEditingResultId] = useState<string | null>(null);
  const [addingResult, setAddingResult] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const [aboutForm, setAboutForm] = useState('');
  const [taglineForm, setTaglineForm] = useState('');
  const [photoForm, setPhotoForm] = useState('');
  const [resultForm, setResultForm] = useState({
    title: '',
    imageUrl: ''
  });
  
  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  
  // Auto-correct state
  const [autoCorrectEnabled, setAutoCorrectEnabled] = useState(true);
  
  // Character limit states
  const [taglineCharCounts, setTaglineCharCounts] = useState<number[]>([]);
  const [aboutCharCounts, setAboutCharCounts] = useState<number[]>([]);
  const CHAR_LIMIT = 80; // Recommended character limit per line
  
  // Sync status
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Check if viewport is mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener("resize", handleResize);
    
    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load content from API and localStorage
  useEffect(() => {
    const loadContent = async () => {
      // Try to get content from the API first
      const apiContent = await fetchContent();
      
      if (apiContent && apiContent.siteVerifiedContent) {
        // If API has content, use it
        const parsedContent = JSON.parse(apiContent.siteVerifiedContent);
        
        // Ensure we maintain the structure even if some fields are missing
        setContent({
          aboutText: parsedContent.aboutText || '',
          tagline: parsedContent.tagline || '',
          photoUrl: parsedContent.photoUrl || '',
          resumeUrl: parsedContent.resumeUrl || '',
          results: parsedContent.results || []
        });
        
        setLastSyncTime(new Date());
      } else {
        // Otherwise, try localStorage as fallback
        const savedContent = localStorage.getItem('siteVerifiedContent');
        if (savedContent) {
          const parsedContent = JSON.parse(savedContent);
          
          // Ensure we maintain the structure even if some fields are missing
          setContent({
            aboutText: parsedContent.aboutText || '',
            tagline: parsedContent.tagline || '',
            photoUrl: parsedContent.photoUrl || '',
            resumeUrl: parsedContent.resumeUrl || '',
            results: parsedContent.results || []
          });
          
          // Also update the API with this content
          await updateContent('siteVerifiedContent', savedContent);
        } else {
          // Default content if none exists
          const defaultContent = {
            aboutText: 'Sayan has developed a solid foundation in <strong>programming and software development</strong>, gaining expertise in multiple languages such as <strong>C, C++, Java, and Python</strong>. His deep interest in <strong>web development</strong> has led him to master <strong>HTML, CSS, and JavaScript</strong>, along with advanced frameworks and backend technologies like <strong>React.js, Node.js, Express.js, and MongoDB</strong>, making him a proficient full-stack developer. His ability to work across both <strong>frontend and backend technologies</strong> enables him to build highly efficient, scalable, and user-friendly applications.',
            tagline: 'I am a sharp,',
            photoUrl: '/images/profile.jpg',
            resumeUrl: '/images/resume.jpg',
            results: [
              {
                id: '1',
                title: 'Academic Result 1',
                imageUrl: '/images/result1.jpg'
              }
            ]
          };
          setContent(defaultContent);
          
          // Save to localStorage and API
          localStorage.setItem('siteVerifiedContent', JSON.stringify(defaultContent));
          await updateContent('siteVerifiedContent', JSON.stringify(defaultContent));
        }
      }

      // Check for tagline in API
      if (apiContent && apiContent.siteTagline) {
        setContent(prev => ({ ...prev, tagline: apiContent.siteTagline }));
      } else {
        // Try localStorage as fallback for tagline
        const savedTagline = localStorage.getItem('siteTagline');
        if (savedTagline) {
          setContent(prev => ({ ...prev, tagline: savedTagline }));
          
          // Update API with this tagline
          await updateContent('siteTagline', savedTagline);
        }
      }
    };

    loadContent();
    
    // Set up polling to check for updates from other devices
    const cleanupPolling = setupContentPolling((data) => {
      // Only update if we're not in edit mode to avoid overwriting changes
      if (!editingAbout && !editingTagline && !editingPhoto && !editingResume && !editingResultId && !addingResult) {
        if (data.siteVerifiedContent) {
          try {
            const parsedContent = JSON.parse(data.siteVerifiedContent);
            
            // Ensure we maintain the structure even if some fields are missing
            setContent({
              aboutText: parsedContent.aboutText || content.aboutText,
              tagline: parsedContent.tagline || content.tagline,
              photoUrl: parsedContent.photoUrl || content.photoUrl,
              resumeUrl: parsedContent.resumeUrl || content.resumeUrl,
              results: parsedContent.results || content.results
            });
            
            setLastSyncTime(new Date());
          } catch (error) {
            console.error('Error parsing content from API:', error);
          }
        }
        
        if (data.siteTagline) {
          setContent(prev => ({ ...prev, tagline: data.siteTagline }));
        }
      }
    }, 2000); // Check every 2 seconds
    
    return () => {
      cleanupPolling();
    };
  }, [editingAbout, editingTagline, editingPhoto, editingResume, editingResultId, addingResult]);

  // Calculate character counts for tagline when form changes
  useEffect(() => {
    if (taglineForm) {
      const lines = taglineForm.split('\n');
      const counts = lines.map(line => {
        // Remove HTML tags for character count
        const plainText = line.replace(/<[^>]*>/g, '');
        return plainText.length;
      });
      setTaglineCharCounts(counts);
    } else {
      setTaglineCharCounts([]);
    }
  }, [taglineForm]);

  // Calculate character counts for about text when form changes
  useEffect(() => {
    if (aboutForm) {
      // Split by periods or other sentence endings to approximate lines
      const sentences = aboutForm.split(/(?<=[.!?])\s+/);
      const counts = sentences.map(sentence => {
        // Remove HTML tags for character count
        const plainText = sentence.replace(/<[^>]*>/g, '');
        return plainText.length;
      });
      setAboutCharCounts(counts);
    } else {
      setAboutCharCounts([]);
    }
  }, [aboutForm]);

  // Auto-correct function for tagline
  const handleTaglineChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    if (autoCorrectEnabled) {
      // Split the text into lines
      const lines = value.split('\n');
      
      // Process each line to auto-correct if needed
      const correctedLines = lines.map(line => {
        // Remove HTML tags for character counting
        const plainText = line.replace(/<[^>]*>/g, '');
        
        // If line exceeds character limit, find a good breaking point
        if (plainText.length > CHAR_LIMIT) {
          // Find the last space before the character limit
          const lastSpaceIndex = line.lastIndexOf(' ', CHAR_LIMIT);
          
          // If there's a space to break at, return the line broken at that point
          if (lastSpaceIndex !== -1) {
            return line.substring(0, lastSpaceIndex);
          }
        }
        
        // Return the original line if no correction needed
        return line;
      });
      
      // Join the lines back together
      const correctedText = correctedLines.join('\n');
      
      // If the corrected text is different and shorter than the original,
      // it means we've removed text that should go to the next line
      if (correctedText.length < value.length) {
        // Get the text that was removed
        const remainingText = value.substring(correctedText.length);
        
        // Add it as a new line
        setTaglineForm(correctedText + '\n' + remainingText.trim());
      } else {
        // Otherwise just set the text as is
        setTaglineForm(value);
      }
    } else {
      // If auto-correct is disabled, just set the text as is
      setTaglineForm(value);
    }
  };

  // About section handlers
  const handleEditAbout = () => {
    setAboutForm(content.aboutText);
    setEditingAbout(true);
  };

  const handleSaveAbout = async () => {
    const updatedContent = { ...content, aboutText: aboutForm };
    setContent(updatedContent);
    
    // Save to localStorage
    const contentJson = JSON.stringify(updatedContent);
    localStorage.setItem('siteVerifiedContent', contentJson);
    
    // Save to API for cross-device sync
    await updateContent('siteVerifiedContent', contentJson);
    setLastSyncTime(new Date());
    
    // Dispatch a custom event to notify other components about the content change
    const event = new CustomEvent('contentUpdated', { 
      detail: { type: 'aboutText', content: aboutForm }
    });
    window.dispatchEvent(event);
    
    setEditingAbout(false);
  };

  // Tagline section handlers
  const handleEditTagline = () => {
    setTaglineForm(content.tagline);
    setEditingTagline(true);
  };

  const handleSaveTagline = async () => {
    const updatedContent = { ...content, tagline: taglineForm };
    setContent(updatedContent);
    
    // Save to localStorage
    const contentJson = JSON.stringify(updatedContent);
    localStorage.setItem('siteVerifiedContent', contentJson);
    localStorage.setItem('siteTagline', taglineForm);
    
    // Save to API for cross-device sync
    await updateContent('siteVerifiedContent', contentJson);
    await updateContent('siteTagline', taglineForm);
    setLastSyncTime(new Date());
    
    // Dispatch a custom event to notify other components about the tagline change
    const event = new CustomEvent('contentUpdated', { 
      detail: { type: 'tagline', content: taglineForm }
    });
    window.dispatchEvent(event);
    
    setEditingTagline(false);
  };

  // Get character count status class
  const getCharCountClass = (count: number) => {
    if (count > CHAR_LIMIT * 1.5) return styles.charCountExceeded;
    if (count > CHAR_LIMIT) return styles.charCountWarning;
    return styles.charCountGood;
  };

  // Photo handlers
  const handleEditPhoto = () => {
    setPreviewUrl(content.photoUrl);
    setEditingPhoto(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    
    if (!file) {
      return;
    }
    
    // Check file type
    if (!file.type.match('image.*')) {
      setUploadError('Please select an image file (JPEG, PNG, etc.)');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5MB limit');
      return;
    }
    
    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file to upload');
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to upload file');
      }
      
      // Update content with the new photo URL
      const updatedContent = { ...content, photoUrl: result.fileUrl };
      setContent(updatedContent);
      
      // Save to localStorage
      const contentJson = JSON.stringify(updatedContent);
      localStorage.setItem('siteVerifiedContent', contentJson);
      
      // Save to API for cross-device sync
      await updateContent('siteVerifiedContent', contentJson);
      setLastSyncTime(new Date());
      
      // Dispatch a custom event to notify other components about the photo URL change
      const event = new CustomEvent('contentUpdated', { 
        detail: { type: 'photoUrl', content: result.fileUrl }
      });
      window.dispatchEvent(event);
      
      // Reset states
      setSelectedFile(null);
      setEditingPhoto(false);
      setIsUploading(false);
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload file');
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (confirm('Are you sure you want to remove the profile photo?')) {
      const updatedContent = { ...content, photoUrl: '' };
      setContent(updatedContent);
      
      // Save to localStorage
      const contentJson = JSON.stringify(updatedContent);
      localStorage.setItem('siteVerifiedContent', contentJson);
      
      // Save to API for cross-device sync
      await updateContent('siteVerifiedContent', contentJson);
      setLastSyncTime(new Date());
      
      setEditingPhoto(false);
    }
  };

  // Resume handlers
  const handleEditResume = () => {
    setPreviewUrl(content.resumeUrl);
    setEditingResume(true);
  };

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    
    if (!file) {
      return;
    }
    
    // Check file type
    if (!file.type.match('image.*')) {
      setUploadError('Please select an image file (JPEG, PNG, etc.)');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5MB limit');
      return;
    }
    
    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadResume = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file to upload');
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to upload file');
      }
      
      // Update content with the new resume URL
      const updatedContent = { ...content, resumeUrl: result.fileUrl };
      setContent(updatedContent);
      
      // Save to localStorage
      const contentJson = JSON.stringify(updatedContent);
      localStorage.setItem('siteVerifiedContent', contentJson);
      
      // Save to API for cross-device sync
      await updateContent('siteVerifiedContent', contentJson);
      setLastSyncTime(new Date());
      
      // Dispatch a custom event to notify other components about the resume URL change
      const event = new CustomEvent('contentUpdated', { 
        detail: { type: 'resumeUrl', content: result.fileUrl }
      });
      window.dispatchEvent(event);
      
      // Reset states
      setSelectedFile(null);
      setEditingResume(false);
      setIsUploading(false);
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload file');
      setIsUploading(false);
    }
  };

  // Results handlers
  const handleAddResult = () => {
    setResultForm({
      title: '',
      imageUrl: ''
    });
    setAddingResult(true);
    setEditingResultId(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
  };

  const handleEditResult = (result: Result) => {
    setResultForm({
      title: result.title,
      imageUrl: result.imageUrl
    });
    setEditingResultId(result.id);
    setAddingResult(false);
    setSelectedFile(null);
    setPreviewUrl(result.imageUrl);
    setUploadError(null);
  };

  const handleDeleteResult = async (id: string) => {
    if (confirm('Are you sure you want to delete this result?')) {
      const updatedResults = content.results.filter(result => result.id !== id);
      const updatedContent = { ...content, results: updatedResults };
      setContent(updatedContent);
      
      // Save to localStorage
      const contentJson = JSON.stringify(updatedContent);
      localStorage.setItem('siteVerifiedContent', contentJson);
      
      // Save to API for cross-device sync
      await updateContent('siteVerifiedContent', contentJson);
      setLastSyncTime(new Date());
    }
  };

  const handleResultFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    
    if (!file) {
      return;
    }
    
    // Check file type
    if (!file.type.match('image.*')) {
      setUploadError('Please select an image file (JPEG, PNG, etc.)');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5MB limit');
      return;
    }
    
    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadResultImage = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file to upload');
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to upload file');
      }
      
      // Update result form with the new image URL
      setResultForm({
        ...resultForm,
        imageUrl: result.fileUrl
      });
      
      // Reset states
      setSelectedFile(null);
      setIsUploading(false);
      
      // Show success message
      setUploadError('File uploaded successfully! Click "Add Result" or "Update Result" to save.');
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload file');
      setIsUploading(false);
    }
  };

  const handleSaveResult = async () => {
    let updatedResults;
    
    if (editingResultId) {
      // Update existing result
      updatedResults = content.results.map(result => 
        result.id === editingResultId ? { ...result, ...resultForm } : result
      );
    } else {
      // Add new result
      const newResult = {
        id: Date.now().toString(),
        ...resultForm
      };
      updatedResults = [...content.results, newResult];
    }
    
    const updatedContent = { ...content, results: updatedResults };
    setContent(updatedContent);
    
    // Save to localStorage
    const contentJson = JSON.stringify(updatedContent);
    localStorage.setItem('siteVerifiedContent', contentJson);
    
    // Save to API for cross-device sync
    await updateContent('siteVerifiedContent', contentJson);
    setLastSyncTime(new Date());
    
    // Dispatch a custom event to notify other components about the results change
    const event = new CustomEvent('contentUpdated', { 
      detail: { type: 'results', content: updatedResults }
    });
    window.dispatchEvent(event);
    
    setEditingResultId(null);
    setAddingResult(false);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  // Format the last sync time
  const formatSyncTime = () => {
    if (!lastSyncTime) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSyncTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins === 1) {
      return '1 minute ago';
    } else if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else {
      return lastSyncTime.toLocaleTimeString();
    }
  };

  return (
    <div className={styles.adminSection}>
      <h2 className={styles.sectionTitle}>Verified Section Manager</h2>
      
      {lastSyncTime && (
        <div className={styles.syncStatus}>
          <span>Last synced: {formatSyncTime()}</span>
        </div>
      )}
      
      <div className={styles.responsiveTabs}>
        <button 
          className={`${styles.responsiveTab} ${activeSection === 'about' ? styles.activeTab : ''}`}
          onClick={() => setActiveSection('about')}
          aria-label="About Text Section"
        >
          About Text
        </button>
        <button 
          className={`${styles.responsiveTab} ${activeSection === 'tagline' ? styles.activeTab : ''}`}
          onClick={() => setActiveSection('tagline')}
          aria-label="Tagline Section"
        >
          Tagline
        </button>
        <button 
          className={`${styles.responsiveTab} ${activeSection === 'photo' ? styles.activeTab : ''}`}
          onClick={() => setActiveSection('photo')}
          aria-label="Profile Photo Section"
        >
          Profile Photo
        </button>
        <button 
          className={`${styles.responsiveTab} ${activeSection === 'resume' ? styles.activeTab : ''}`}
          onClick={() => setActiveSection('resume')}
          aria-label="Resume Section"
        >
          Resume
        </button>
        <button 
          className={`${styles.responsiveTab} ${activeSection === 'results' ? styles.activeTab : ''}`}
          onClick={() => setActiveSection('results')}
          aria-label="Academic Results Section"
        >
          Academic Results
        </button>
      </div>
      
      <div className={styles.adminTabContent}>
        {/* About Text Section */}
        {activeSection === 'about' && (
          <div>
            <div className={styles.adminContentHeader}>
              <h3>About Text</h3>
              {!editingAbout && (
                <button 
                  className={styles.adminEditButton}
                  onClick={handleEditAbout}
                >
                  Edit
                </button>
              )}
            </div>
            
            {editingAbout ? (
              <div className={styles.adminForm}>
                <p className={styles.adminFormNote}>
                  You can use HTML tags like &lt;strong&gt;text&lt;/strong&gt; for bold text. 
                  Leave empty if you want this section to be blank on the viewer side.
                  <br />
                  <span className={styles.charLimitNote}>
                    Recommended: Keep each sentence under {CHAR_LIMIT} characters for better readability.
                  </span>
                </p>
                <textarea
                  className={styles.adminTextarea}
                  value={aboutForm}
                  onChange={(e) => setAboutForm(e.target.value)}
                  rows={10}
                  placeholder="Enter about text (HTML allowed)"
                />
                
                {aboutCharCounts.length > 0 && (
                  <div className={styles.charCountContainer}>
                    <h4>Sentence Length Analysis:</h4>
                    <ul className={styles.charCountList}>
                      {aboutCharCounts.map((count, index) => (
                        <li key={index} className={getCharCountClass(count)}>
                          Sentence {index + 1}: {count} characters 
                          {count > CHAR_LIMIT && count <= CHAR_LIMIT * 1.5 && " (Getting long)"}
                          {count > CHAR_LIMIT * 1.5 && " (Too long - consider breaking up)"}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className={styles.adminFormActions}>
                  <button 
                    className={styles.adminCancelButton}
                    onClick={() => setEditingAbout(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className={styles.adminSaveButton}
                    onClick={handleSaveAbout}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.adminPreview}>
                {content.aboutText ? (
                  <div dangerouslySetInnerHTML={{ __html: content.aboutText }} />
                ) : (
                  <p className={styles.adminEmptyState}>No about text added yet.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tagline Section */}
        {activeSection === 'tagline' && (
          <div>
            <div className={styles.adminContentHeader}>
              <h3>Tagline</h3>
              {!editingTagline && (
                <button 
                  className={styles.adminEditButton}
                  onClick={handleEditTagline}
                >
                  Edit
                </button>
              )}
            </div>
            
            {editingTagline ? (
              <div className={styles.adminForm}>
                <p className={styles.adminFormNote}>
                  Enter your tagline text. Only &lt;strong&gt; tags are allowed for formatting.
                  Press Enter for line breaks. Leave empty if you want this section to be blank.
                  <br />
                  <span className={styles.charLimitNote}>
                    Recommended: Keep each line under {CHAR_LIMIT} characters for better visual appearance.
                  </span>
                </p>
                
                <div className={styles.autoCorrectToggle}>
                  <label>
                    <input 
                      type="checkbox" 
                      checked={autoCorrectEnabled}
                      onChange={() => setAutoCorrectEnabled(!autoCorrectEnabled)}
                    />
                    Auto-correct line breaks (automatically adds line breaks when text exceeds {CHAR_LIMIT} characters)
                  </label>
                </div>
                
                <textarea
                  className={styles.adminTextarea}
                  value={taglineForm}
                  onChange={handleTaglineChange}
                  rows={3}
                  placeholder="Enter tagline text"
                />
                
                {taglineCharCounts.length > 0 && (
                  <div className={styles.charCountContainer}>
                    <h4>Line Length Analysis:</h4>
                    <ul className={styles.charCountList}>
                      {taglineCharCounts.map((count, index) => (
                        <li key={index} className={getCharCountClass(count)}>
                          Line {index + 1}: {count} characters 
                          {count > CHAR_LIMIT && count <= CHAR_LIMIT * 1.5 && " (Getting long)"}
                          {count > CHAR_LIMIT * 1.5 && " (Too long - consider breaking up)"}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className={styles.adminFormActions}>
                  <button 
                    className={styles.adminCancelButton}
                    onClick={() => setEditingTagline(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className={styles.adminSaveButton}
                    onClick={handleSaveTagline}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.adminPreview}>
                {content.tagline ? (
                  <div>
                    {content.tagline.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                ) : (
                  <p className={styles.adminEmptyState}>No tagline added yet.</p>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Profile Photo Section */}
        {activeSection === 'photo' && (
          <div>
            <h3>Profile Photo</h3>
            
            {!editingPhoto ? (
              <div className={styles.itemCard}>
                <div style={{ marginBottom: '15px' }}>
                  {content.photoUrl ? (
                    <img 
                      src={content.photoUrl} 
                      alt="Profile" 
                      style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'cover' }} 
                    />
                  ) : (
                    <div className={styles.adminEmptyState}>No profile photo added yet.</div>
                  )}
                </div>
                {content.photoUrl && (
                  <div style={{ marginBottom: '10px' }}>
                    <a 
                      href={content.photoUrl} 
                      download="Profile_Photo.jpg" 
                      className={styles.downloadLink}
                    >
                      Download Photo
                      <svg 
                        aria-hidden="true" 
                        focusable="false" 
                        data-prefix="fas" 
                        data-icon="download" 
                        className="svg-inline--fa fa-download ml-2 text-sm" 
                        role="img" 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 512 512"
                        style={{ width: '14px', height: '14px', marginLeft: '5px' }}
                      >
                        <path 
                          fill="currentColor" 
                          d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 242.7-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7 288 32zM64 352c-35.3 0-64 28.7-64 64l0 32c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-32c0-35.3-28.7-64-64-64l-101.5 0-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352 64 352zm368 56a24 24 0 1 1 0 48 24 24 0 1 1 0-48z"
                        />
                      </svg>
                    </a>
                  </div>
                )}
                <button onClick={handleEditPhoto} className={styles.actionButton}>
                  Change Photo
                </button>
              </div>
            ) : (
              <div className={styles.formGroup}>
                <div className={styles.fileUploadContainer}>
                  {previewUrl && (
                    <div className={styles.imagePreview}>
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'cover' }} 
                      />
                    </div>
                  )}
                  
                  <div className={styles.fileInputWrapper}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className={styles.fileInput}
                      id="photoUpload"
                      multiple={false}
                    />
                    <label htmlFor="photoUpload" className={styles.fileInputLabel}>
                      Select Photo
                    </label>
                    <span className={styles.selectedFileName}>
                      {selectedFile ? selectedFile.name : 'No file selected'}
                    </span>
                  </div>
                  
                  {uploadError && (
                    <div className={styles.uploadError}>
                      {uploadError}
                    </div>
                  )}
                  
                  <div className={styles.uploadActions}>
                    <button 
                      onClick={handleUploadPhoto} 
                      className={styles.actionButton}
                      disabled={isUploading || !selectedFile}
                    >
                      {isUploading ? 'Uploading...' : 'Upload Photo'}
                    </button>
                    
                    {content.photoUrl && (
                      <button 
                        onClick={handleDeletePhoto} 
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        disabled={isUploading}
                      >
                        Delete Photo
                      </button>
                    )}
                    
                    <button 
                      onClick={() => {
                        setEditingPhoto(false);
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        setUploadError(null);
                      }} 
                      className={`${styles.actionButton} ${styles.cancelButton}`}
                      disabled={isUploading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Resume Section */}
        {activeSection === 'resume' && (
          <div>
            <h3>Resume</h3>
            
            {!editingResume ? (
              <div className={styles.itemCard}>
                {content.resumeUrl ? (
                  <div>
                    <div style={{ marginBottom: '15px' }}>
                      <img 
                        src={content.resumeUrl} 
                        alt="Resume" 
                        style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }} 
                      />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                      <a 
                        href={content.resumeUrl} 
                        download={getFileNameFromUrl(content.resumeUrl)} 
                        className={styles.downloadLink}
                      >
                        Download Resume
                        <svg 
                          aria-hidden="true" 
                          focusable="false" 
                          data-prefix="fas" 
                          data-icon="download" 
                          className="svg-inline--fa fa-download ml-2 text-sm" 
                          role="img" 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 512 512"
                          style={{ width: '14px', height: '14px', marginLeft: '5px' }}
                        >
                          <path 
                            fill="currentColor" 
                            d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 242.7-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7 288 32zM64 352c-35.3 0-64 28.7-64 64l0 32c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-32c0-35.3-28.7-64-64-64l-101.5 0-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352 64 352zm368 56a24 24 0 1 1 0 48 24 24 0 1 1 0-48z"
                          />
                        </svg>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className={styles.adminEmptyState}>No resume image uploaded yet.</div>
                )}
                <button onClick={handleEditResume} className={styles.actionButton}>
                  {content.resumeUrl ? 'Update Resume' : 'Upload Resume'}
                </button>
              </div>
            ) : (
              <div className={styles.formGroup}>
                <div className={styles.fileUploadContainer}>
                  {previewUrl && (
                    <div className={styles.imagePreview}>
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }} 
                      />
                    </div>
                  )}
                  
                  <div className={styles.fileInputWrapper}>
                    <input
                      type="file"
                      ref={resumeInputRef}
                      onChange={handleResumeFileChange}
                      accept="image/*"
                      className={styles.fileInput}
                      id="resumeUpload"
                      multiple={false}
                    />
                    <label htmlFor="resumeUpload" className={styles.fileInputLabel}>
                      Select Image
                    </label>
                    <span className={styles.selectedFileName}>
                      {selectedFile ? selectedFile.name : 'No file selected'}
                    </span>
                  </div>
                  
                  {uploadError && (
                    <div className={styles.uploadError}>
                      {uploadError}
                    </div>
                  )}
                  
                  <div className={styles.uploadActions}>
                    <button 
                      onClick={handleUploadResume} 
                      className={styles.actionButton}
                      disabled={isUploading || !selectedFile}
                    >
                      {isUploading ? 'Uploading...' : 'Upload Resume'}
                    </button>
                    
                    {content.resumeUrl && (
                      <button 
                        onClick={() => {
                          if (confirm('Are you sure you want to remove the resume image?')) {
                            const updatedContent = { ...content, resumeUrl: '' };
                            setContent(updatedContent);
                            
                            // Save to localStorage
                            const contentJson = JSON.stringify(updatedContent);
                            localStorage.setItem('siteVerifiedContent', contentJson);
                            
                            // Save to API for cross-device sync
                            updateContent('siteVerifiedContent', contentJson);
                            setLastSyncTime(new Date());
                            
                            // Dispatch a custom event to notify other components about the resume URL change
                            const event = new CustomEvent('contentUpdated', { 
                              detail: { type: 'resumeUrl', content: '' }
                            });
                            window.dispatchEvent(event);
                            
                            setEditingResume(false);
                          }
                        }} 
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        disabled={isUploading}
                      >
                        Delete Resume
                      </button>
                    )}
                    
                    <button 
                      onClick={() => {
                        setEditingResume(false);
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        setUploadError(null);
                      }} 
                      className={`${styles.actionButton} ${styles.cancelButton}`}
                      disabled={isUploading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Academic Results Section */}
        {activeSection === 'results' && (
          <div className={styles.responsiveSection}>
            <h3>Academic Results</h3>
            
            {!addingResult && !editingResultId && (
              <div className={styles.mobileActionContainer}>
                <button onClick={handleAddResult} className={styles.actionButton}>
                  Add New Result
                </button>
              </div>
            )}
            
            {(addingResult || editingResultId) && (
              <div className={styles.formGroup}>
                <h4>{editingResultId ? 'Edit Result' : 'Add New Result'}</h4>
                
                <div className={styles.formGroup}>
                  <label htmlFor="resultTitle">Title:</label>
                  <input
                    type="text"
                    id="resultTitle"
                    value={resultForm.title}
                    onChange={(e) => setResultForm({...resultForm, title: e.target.value})}
                    required
                  />
                </div>
                
                <div className={styles.responsiveFileUpload}>
                  <label htmlFor="resultImage">Result Image:</label>
                  
                  {previewUrl && (
                    <div className={styles.responsiveImagePreview}>
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} 
                      />
                    </div>
                  )}
                  
                  <div className={styles.fileInputWrapper}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleResultFileChange}
                      accept="image/*"
                      className={styles.fileInput}
                      id="resultImageUpload"
                      multiple={false}
                    />
                    <label htmlFor="resultImageUpload" className={styles.fileInputLabel}>
                      Select Image
                    </label>
                    <span className={styles.selectedFileName}>
                      {selectedFile ? selectedFile.name : 'No file selected'}
                    </span>
                  </div>
                  
                  <button 
                    onClick={handleUploadResultImage} 
                    className={styles.actionButton}
                    disabled={isUploading || !selectedFile}
                    style={{ marginTop: '10px' }}
                  >
                    {isUploading ? 'Uploading...' : 'Upload Image'}
                  </button>
                  
                  {uploadError && (
                    <div className={uploadError.includes('successfully') ? styles.uploadSuccess : styles.uploadError}>
                      {uploadError}
                    </div>
                  )}
                  
                  {!selectedFile && resultForm.imageUrl && (
                    <div className={styles.currentImageUrl}>
                      <p>Current image URL: {resultForm.imageUrl}</p>
                    </div>
                  )}
                </div>
                
                <div className={styles.formActions}>
                  <button onClick={handleSaveResult} className={styles.actionButton}>
                    {editingResultId ? 'Update Result' : 'Add Result'}
                  </button>
                  <button 
                    onClick={() => {
                      setAddingResult(false);
                      setEditingResultId(null);
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setUploadError(null);
                    }} 
                    className={`${styles.actionButton} ${styles.cancelButton}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            <div className={styles.responsiveItemsList}>
              <h4>Existing Results</h4>
              <div className={styles.resultsGrid}>
                {content.results.map(result => (
                  <div key={result.id} className={styles.responsiveItemCard}>
                    <h5>{result.title}</h5>
                    
                    {result.imageUrl && (
                      <div className={styles.responsiveImageContainer}>
                        <img 
                          src={result.imageUrl} 
                          alt={result.title} 
                          className={styles.responsiveImage}
                        />
                      </div>
                    )}
                    
                    <div className={styles.responsiveItemActions}>
                      <button 
                        onClick={() => handleEditResult(result)} 
                        className={`${styles.actionButton} ${styles.editButton}`}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteResult(result.id)} 
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {content.results.length === 0 && (
                <p className={styles.emptyState}>No results added yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getFileNameFromUrl(url: string) {
  const urlParts = url.split('/');
  return urlParts[urlParts.length - 1];
}