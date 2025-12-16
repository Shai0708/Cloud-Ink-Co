
import React from 'react';
import { DashboardIcon, UsersIcon, MegaphoneIcon, ChartIcon } from './icons';
import { Department, departments, departmentIconComponents } from '../constants';
import { Page } from '../App';

interface SidebarProps {
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  currentPage: Page;
  onNavigateToDashboard: () => void;
  onNavigateToDepartment: (department: Department) => void;
  onNavigateToAnnouncementManager: () => void;
  onNavigateToAnalytics: () => void;
  userDepartment: string | null;
  isExecutive: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onMouseEnter, 
  onMouseLeave, 
  currentPage, 
  onNavigateToDashboard, 
  onNavigateToDepartment, 
  onNavigateToAnnouncementManager,
  onNavigateToAnalytics,
  userDepartment,
  isExecutive 
}) => {

  const isAuthorized = (targetDept: Department) => {
    if (!userDepartment) return false;
    // Executive access
    if (isExecutive) return true;
    
    // Standard access (Normalized)
    const uDept = userDepartment.toLowerCase().trim();
    const tDept = targetDept.toLowerCase().trim();
    return uDept === tDept;
  };

  const getLinkClass = (page: Page, authorized: boolean = true) => {
    if (!authorized) {
      return 'flex items-center p-2 text-gray-600 rounded-md cursor-not-allowed opacity-50';
    }
    return `flex items-center p-2 text-[#E0E1DD] rounded-md transition-colors ${
      currentPage === page
        ? 'bg-cyan-600 font-semibold'
        : 'hover:bg-cyan-950/50'
    }`;
  };

  const disabledLinkClass = 'flex items-center p-2 text-gray-500 rounded-md cursor-not-allowed';
  
  return (
    <div 
      className={`bg-[#111827] shadow-2xl transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0 ${isOpen ? 'w-64 p-4' : 'w-0'}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={`transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
        <nav className="flex flex-col h-full">
          <div>
            <h3 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Main</h3>
            <ul>
              <li className="mb-2">
                <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToDashboard(); }} className={getLinkClass('dashboard')}>
                  <DashboardIcon className="w-5 h-5 mr-3" />
                  Dashboard
                </a>
              </li>
            </ul>
          </div>

          <div className="mt-4">
            <h3 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Departments</h3>
            <ul>
              {departments.map(dept => {
                const Icon = departmentIconComponents[dept];
                const authorized = isAuthorized(dept);
                return (
                  <li key={dept} className="mb-2">
                    <a 
                      href="#" 
                      onClick={(e) => { 
                        e.preventDefault(); 
                        if (authorized) onNavigateToDepartment(dept); 
                      }} 
                      className={getLinkClass(dept, authorized)}
                      title={authorized ? "" : "Access Denied"}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {dept}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
          
          <div className="mt-auto">
             <h3 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Tools</h3>
            <ul>
              <li className="mb-2">
                <a 
                  href="#" 
                  onClick={(e) => { 
                    e.preventDefault(); 
                    if (isExecutive) onNavigateToAnnouncementManager(); 
                  }} 
                  className={getLinkClass('announcement-manager' as Page, isExecutive)}
                  title={isExecutive ? "" : "Access Restricted to Executives"}
                >
                  <MegaphoneIcon className="w-5 h-5 mr-3" />
                  Announcements
                </a>
              </li>
              <li className="mb-2">
                <a 
                  href="#" 
                  onClick={(e) => { 
                    e.preventDefault(); 
                    if (isExecutive) onNavigateToAnalytics(); 
                  }} 
                  className={getLinkClass('analytics' as Page, isExecutive)}
                  title={isExecutive ? "" : "Access Restricted to Executives"}
                >
                  <ChartIcon className="w-5 h-5 mr-3" />
                  Analytics
                </a>
              </li>
              <li className="mb-2">
                <a href="#" onClick={(e) => e.preventDefault()} className={disabledLinkClass}>
                  <UsersIcon className="w-5 h-5 mr-3" />
                  User Management
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
