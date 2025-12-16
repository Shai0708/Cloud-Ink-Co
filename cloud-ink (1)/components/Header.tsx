import React from 'react';
import { LogoIcon, LogoutIcon } from './icons';

interface HeaderProps {
  onLogoEnter: () => void;
  onLogoLeave: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogoEnter, onLogoLeave, onLogout }) => {
  return (
    <div className="relative flex items-center justify-between h-full p-4 md:p-6">
      <div className="flex items-center space-x-4">
        <div onMouseEnter={onLogoEnter} onMouseLeave={onLogoLeave}>
          <LogoIcon className="h-16 w-16 text-[#E0E1DD] cursor-pointer transition-all duration-300 hover:scale-110 hover:[filter:drop-shadow(0_0_4px_theme(colors.cyan.500))]" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-wider text-white">
          Cloud Ink
        </h1>
      </div>
      <button
        onClick={onLogout}
        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-300 bg-transparent border border-gray-600 rounded-lg hover:bg-cyan-950/50 hover:text-white hover:border-cyan-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1F2937] focus:ring-cyan-500"
        aria-label="Logout"
      >
        <LogoutIcon className="w-5 h-5" />
        <span>Logout</span>
      </button>
    </div>
  );
};

export default Header;