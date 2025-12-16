
import React, { useState, useRef, useEffect, useMemo } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import DepartmentPage from './components/DepartmentPage';
import AnnouncementManager from './components/AnnouncementManager';
import AnalyticsPage from './components/AnalyticsPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { Department, Announcement } from './constants';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from './lib/supabase';

export type Page = 'login' | 'dashboard' | Department | 'announcement-manager' | 'analytics';

interface UserInfo {
    department: string;
    jobTitle: string;
    name: string;
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const fetchAnnouncements = async () => {
      try {
          const data = await getAnnouncements();
          setAnnouncements(data || []);
      } catch (error: any) {
          console.error("Failed to load announcements:", error.message || error);
      }
  };

  useEffect(() => {
      fetchAnnouncements();
  }, []);

  const handleLogin = (userInfo: UserInfo) => {
    setCurrentUser(userInfo);
    setCurrentPage('dashboard');
    fetchAnnouncements();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('login');
  };

  const handlePostAnnouncement = async (title: string, content: string) => {
      await createAnnouncement(title, content);
      await fetchAnnouncements();
  };

  const handleDeleteAnnouncement = async (title: string, content: string) => {
      await deleteAnnouncement(title, content);
      await fetchAnnouncements();
  };

  const handleUpdateAnnouncement = async (oldTitle: string, oldContent: string, newTitle: string, newContent: string) => {
      await updateAnnouncement(oldTitle, oldContent, newTitle, newContent);
      await fetchAnnouncements();
  };

  // Robust Executive Access Logic
  // Updated: Restricted strictly to Executive Departments to prevent job title based leaks (e.g., Pharmacy Manager accessing HR).
  const isExecutive = useMemo(() => {
      if (!currentUser) return false;
      const dept = (currentUser.department || '').toLowerCase();
      
      const execDepts = ['administration', 'executive', 'management', 'admin'];
      
      return execDepts.some(d => dept.includes(d));
  }, [currentUser]);

  const isAuthorized = (targetDept: Department) => {
    if (!currentUser) return false;
    // Executive access grants access to everything
    if (isExecutive) return true;
    
    // Normalize strings for comparison to ensure matching works correctly
    const userDept = (currentUser.department || '').toLowerCase().trim();
    const target = targetDept.toLowerCase().trim();

    return userDept === target;
  };

  const navigateToDepartment = (department: Department) => {
    if (isAuthorized(department)) {
      setCurrentPage(department);
    } else {
      alert("Access Denied: You do not have permission to view this department.");
    }
  };

  const navigateToDashboard = () => {
    setCurrentPage('dashboard');
    fetchAnnouncements();
  };

  const navigateToAnnouncementManager = () => {
    if (isExecutive) {
      setCurrentPage('announcement-manager');
      fetchAnnouncements();
    } else {
       alert("Access Denied: Only Executive staff can manage announcements.");
    }
  };

  const navigateToAnalytics = () => {
      if (isExecutive) {
          setCurrentPage('analytics');
      } else {
          alert("Access Denied: Only Executive staff can access Analytics.");
      }
  };

  const openSidebar = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    closeTimer.current = window.setTimeout(() => {
      setSidebarOpen(false);
    }, 200);
  };

  if (currentPage === 'login') {
    return (
      <div className="bg-[#1F2937] min-h-screen">
        <LoginPage onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#1F2937] text-[#E0E1DD] font-sans overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onMouseEnter={openSidebar} 
        onMouseLeave={closeSidebar} 
        currentPage={currentPage}
        onNavigateToDashboard={navigateToDashboard}
        onNavigateToDepartment={navigateToDepartment}
        onNavigateToAnnouncementManager={navigateToAnnouncementManager}
        onNavigateToAnalytics={navigateToAnalytics}
        userDepartment={currentUser?.department || null}
        isExecutive={isExecutive}
      />
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <div className="sticky top-0 z-30 bg-[#1F2937]/80 backdrop-blur-sm p-6">
          <Header 
            onLogoEnter={openSidebar} 
            onLogoLeave={closeSidebar}
            onLogout={handleLogout} 
          />
        </div>
        <main className="flex-1 p-6 pt-0">
          {currentPage === 'dashboard' ? (
            <Dashboard 
              onNavigateToDepartment={navigateToDepartment} 
              userDepartment={currentUser?.department || null}
              isExecutive={isExecutive}
              announcements={announcements}
              onDeleteAnnouncement={handleDeleteAnnouncement}
            />
          ) : currentPage === 'announcement-manager' ? (
            <AnnouncementManager 
              announcements={announcements} 
              onPost={handlePostAnnouncement} 
              onDelete={handleDeleteAnnouncement}
              onUpdate={handleUpdateAnnouncement}
              onRefresh={fetchAnnouncements}
            />
          ) : currentPage === 'analytics' ? (
            <AnalyticsPage />
          ) : (
            <DepartmentPage department={currentPage as Department} />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
