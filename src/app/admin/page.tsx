'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './admin.module.css';

// Admin sections
import HeaderLineEditor from '../../components/Admin/HeaderLineEditor';
import ProjectsManager from '../../components/Admin/ProjectsManager';
import ExpertiseManager from '../../components/Admin/ExpertiseManager';
import VerifiedManager from '../../components/Admin/VerifiedManager';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('headerline');
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simple password check - in production, use a more secure method
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === 'admin123') {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuthenticated', 'true');
    } else {
      alert('Incorrect password');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const isAuth = localStorage.getItem('adminAuthenticated') === 'true';
    setIsAuthenticated(isAuth);
    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuthenticated');
    router.push('/');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const selectTab = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false); // Close mobile menu after selecting a tab
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.loginContainer}>
        <h1>Admin Login</h1>
        <form onSubmit={handleLogin} className={styles.loginForm}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className={styles.passwordInput}
            autoFocus
          />
          <button type="submit" className={styles.loginButton}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminHeader}>
        <h1>Admin Panel</h1>
        <div className={styles.headerActions}>
          <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
          <button 
            onClick={toggleMobileMenu} 
            className={styles.mobileMenuButton}
            aria-label="Toggle menu"
          >
            <span className={mobileMenuOpen ? styles.menuIconOpen : styles.menuIcon}></span>
          </button>
        </div>
      </div>

      <div className={`${styles.adminTabs} ${mobileMenuOpen ? styles.adminTabsMobileOpen : ''}`}>
        <button 
          className={activeTab === 'headerline' ? styles.activeTab : ''} 
          onClick={() => selectTab('headerline')}
        >
          Header Line
        </button>
        <button 
          className={activeTab === 'projects' ? styles.activeTab : ''} 
          onClick={() => selectTab('projects')}
        >
          Projects
        </button>
        <button 
          className={activeTab === 'expertise' ? styles.activeTab : ''} 
          onClick={() => selectTab('expertise')}
        >
          Expertise
        </button>
        <button 
          className={activeTab === 'verified' ? styles.activeTab : ''} 
          onClick={() => selectTab('verified')}
        >
          Verified Section
        </button>
      </div>

      <div className={styles.adminContent}>
        {activeTab === 'headerline' && <HeaderLineEditor />}
        {activeTab === 'projects' && <ProjectsManager />}
        {activeTab === 'expertise' && <ExpertiseManager />}
        {activeTab === 'verified' && <VerifiedManager />}
      </div>
    </div>
  );
} 