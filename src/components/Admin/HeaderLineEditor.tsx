'use client';

import { useState, useEffect } from 'react';
import styles from '../../app/admin/admin.module.css';
import { fetchContent, updateContent } from '@/utils/contentSync';

export default function HeaderLineEditor() {
  const [headerLines, setHeaderLines] = useState(['I am a sharp,', 'skilled,', 'adept', 'mind.']);
  const [isEditing, setIsEditing] = useState(false);
  const [editedLines, setEditedLines] = useState(['', '', '', '']);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const loadHeaderLines = async () => {
      try {
        // Try to get content from the API first
        const apiContent = await fetchContent();
        
        if (apiContent && apiContent.siteVerifiedContent) {
          const parsedContent = JSON.parse(apiContent.siteVerifiedContent);
          if (parsedContent.headerTextLines && Array.isArray(parsedContent.headerTextLines)) {
            const lines = [...headerLines];
            if (parsedContent.headerTextLines.length >= 1) lines[0] = parsedContent.headerTextLines[0];
            if (parsedContent.headerTextLines.length >= 2) lines[1] = parsedContent.headerTextLines[1];
            if (parsedContent.headerTextLines.length >= 3) lines[2] = parsedContent.headerTextLines[2];
            if (parsedContent.headerTextLines.length >= 4) lines[3] = parsedContent.headerTextLines[3];
            setHeaderLines(lines);
          }
          setLastSyncTime(new Date());
        } else {
          // Fallback to localStorage
          const savedContent = localStorage.getItem('siteVerifiedContent');
          if (savedContent) {
            try {
              const parsedContent = JSON.parse(savedContent);
              if (parsedContent.headerTextLines && Array.isArray(parsedContent.headerTextLines)) {
                const lines = [...headerLines];
                if (parsedContent.headerTextLines.length >= 1) lines[0] = parsedContent.headerTextLines[0];
                if (parsedContent.headerTextLines.length >= 2) lines[1] = parsedContent.headerTextLines[1];
                if (parsedContent.headerTextLines.length >= 3) lines[2] = parsedContent.headerTextLines[2];
                if (parsedContent.headerTextLines.length >= 4) lines[3] = parsedContent.headerTextLines[3];
                setHeaderLines(lines);
              }
            } catch (error) {
              console.error('Error parsing content from localStorage:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error loading header lines:', error);
      }
    };

    loadHeaderLines();
  }, []);

  const handleEdit = () => {
    setEditedLines([...headerLines]);
    setIsEditing(true);
    setSaveMessage({ text: '', type: '' });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage({ text: 'Saving changes...', type: 'info' });
    
    try {
      // Get current content
      const savedContent = localStorage.getItem('siteVerifiedContent');
      let contentObj = savedContent ? JSON.parse(savedContent) : {};
      
      // Update header lines
      contentObj = {
        ...contentObj,
        headerTextLines: editedLines
      };
      
      // Save to localStorage
      const contentJson = JSON.stringify(contentObj);
      localStorage.setItem('siteVerifiedContent', contentJson);
      
      // Save to API for cross-device sync
      await updateContent('siteVerifiedContent', contentJson);
      setLastSyncTime(new Date());
      
      // Dispatch a custom event to notify other components
      const event = new CustomEvent('contentUpdated', { 
        detail: { type: 'headerTextLines', content: editedLines }
      });
      window.dispatchEvent(event);
      
      setHeaderLines([...editedLines]);
      setSaveMessage({ text: 'Changes saved successfully!', type: 'success' });
      
      // Auto-close the editor after successful save
      setTimeout(() => {
        setIsEditing(false);
        setSaveMessage({ text: '', type: '' });
      }, 2000);
    } catch (error) {
      console.error('Error saving header lines:', error);
      setSaveMessage({ text: 'Error saving changes. Please try again.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveMessage({ text: '', type: '' });
  };

  const handleLineChange = (index: number, value: string) => {
    const newLines = [...editedLines];
    newLines[index] = value;
    setEditedLines(newLines);
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
      <div className={styles.adminContentHeader}>
        <h2 className={styles.sectionTitle}>Header Line Editor</h2>
        
        {lastSyncTime && (
          <div className={styles.syncStatus}>
            <span>Last synced: {formatSyncTime()}</span>
          </div>
        )}
      </div>
      
      {/* Save message notification */}
      {saveMessage.text && (
        <div className={`${styles.messageBox} ${styles[saveMessage.type]}`}>
          {saveMessage.text}
        </div>
      )}
      
      {!isEditing ? (
        <div className={styles.itemCard}>
          <p><strong>Current Header Lines:</strong></p>
          <div className={styles.headerLinesPreview}>
            {headerLines.map((line, index) => (
              <p key={index} className={styles.headerLine}>{line || <em>Empty line</em>}</p>
            ))}
          </div>
          <button onClick={handleEdit} className={styles.actionButton}>
            Edit Header Lines
          </button>
        </div>
      ) : (
        <div className={styles.adminForm}>
          <div className={styles.formGroup}>
            <p className={styles.adminFormNote}>
              Edit the header lines that appear on the homepage. Keep each line concise for the best appearance.
            </p>
            
            {editedLines.map((line, index) => (
              <div key={index} className={styles.headerLineInput}>
                <label htmlFor={`headerLine${index + 1}`}>Line {index + 1}:</label>
                <input
                  type="text"
                  id={`headerLine${index + 1}`}
                  value={editedLines[index]}
                  onChange={(e) => handleLineChange(index, e.target.value)}
                  placeholder={`Enter line ${index + 1}`}
                  className={isSaving ? styles.disabledInput : ''}
                  disabled={isSaving}
                  maxLength={30}
                />
              </div>
            ))}
            
            <div className={styles.charLimitNote}>
              <small>Recommended: Keep each line under 30 characters for optimal display on all devices.</small>
            </div>
            
            <div className={styles.formActions}>
              <button 
                onClick={handleSave} 
                className={styles.actionButton} 
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                onClick={handleCancel} 
                className={`${styles.actionButton} ${styles.cancelButton}`}
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}