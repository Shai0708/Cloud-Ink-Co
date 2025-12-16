

import React from 'react';
import { GithubIcon, LinkedInIcon, TwitterIcon } from './icons';

const Footer: React.FC = () => {
  return (
    <div className="h-full w-full bg-[#111827] rounded-lg shadow-md p-4 flex items-center justify-between">
      <div className="flex items-center">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
        </span>
        <span className="ml-3 text-base font-medium text-cyan-300">Database is Live</span>
      </div>
      <div className="flex items-center space-x-4">
        <a href="#" onClick={(e) => e.preventDefault()} className="text-[#6B7280] hover:text-cyan-400 transition-colors">
          <TwitterIcon className="h-6 w-6" />
        </a>
        <a href="#" onClick={(e) => e.preventDefault()} className="text-[#6B7280] hover:text-cyan-400 transition-colors">
          <GithubIcon className="h-6 w-6" />
        </a>
        <a href="#" onClick={(e) => e.preventDefault()} className="text-[#6B7280] hover:text-cyan-400 transition-colors">
          <LinkedInIcon className="h-6 w-6" />
        </a>
      </div>
    </div>
  );
};

export default Footer;