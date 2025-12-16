
import React from 'react';
import { Announcement } from '../constants';

const BellIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
  </svg>
);

interface AnnouncementsProps {
  announcements: Announcement[];
}

const Announcements: React.FC<AnnouncementsProps> = ({ announcements }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date not available';
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    try {
        return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
        return 'Invalid Date';
    }
  };

  return (
    <div className="w-full bg-[#111827] rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4 justify-between">
        <div className="flex items-center">
            <BellIcon className="h-6 w-6 mr-3 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-wider">Latest Announcements</h2>
        </div>
      </div>
      <div className="space-y-4">
        {announcements.length === 0 ? (
             <div className="p-4 text-gray-400 italic">No announcements yet.</div>
        ) : announcements.map((item, index) => (
          <div key={item.id || index} className="bg-[#1F2937]/50 p-4 rounded-md border-l-4 border-cyan-500 hover:bg-cyan-950/50 transition-colors relative group">
            <div className="flex justify-between items-baseline pr-4">
              <h3 className="font-semibold text-[#E0E1DD]">{item.title}</h3>
              <p className="text-xs text-[#A9B4C2] whitespace-nowrap ml-2">{formatDate(item.created_at)}</p>
            </div>
            <p className="mt-2 text-sm text-[#A9B4C2] whitespace-pre-wrap">{item.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Announcements;
