
import React from 'react';
import { Department } from '../constants';

interface DepartmentCardProps {
  department: Department;
  icon: React.ReactNode;
  description: string;
  onNavigate: (department: Department) => void;
  disabled?: boolean;
}

const DepartmentCard: React.FC<DepartmentCardProps> = ({ department, icon, description, onNavigate, disabled = false }) => {
  if (disabled) {
    return (
        <div className="group min-h-[24rem] w-full bg-[#111827]/50 rounded-lg flex flex-col items-center justify-around gap-2 p-6 relative border border-gray-800 opacity-60 cursor-not-allowed">
            <div className="grayscale opacity-50">
                {icon}
            </div>
            <div className="text-center grayscale opacity-50">
                <p className="font-semibold text-xl text-gray-500 tracking-wider">
                    {department}
                </p>
                <p className="mt-2 text-sm text-gray-600 px-2">
                    Access Restricted
                </p>
            </div>
        </div>
    );
  }

  return (
    <div className="group min-h-[24rem] w-full bg-[#111827] rounded-lg flex flex-col items-center justify-around gap-2 p-6 relative after:absolute after:h-full after:bg-cyan-600 z-20 shadow-lg after:-z-20 after:w-full after:inset-0 after:rounded-lg transition-all duration-300 after:transition-all after:duration-500 overflow-hidden cursor-pointer after:-translate-y-full after:hover:translate-y-0">
        <div className="transition-all duration-300 group-hover:-translate-y-2">
            {icon}
        </div>
        <div className="text-center">
            <p className="font-semibold text-xl text-[#E0E1DD] tracking-wider group-hover:text-white transition-colors duration-200 delay-200">
                {department}
            </p>
            <p className="mt-2 text-sm text-[#A9B4C2] group-hover:text-white transition-colors duration-200 delay-200 px-2">
                {description}
            </p>
        </div>
        <button 
          onClick={() => onNavigate(department)}
          className="opacity-0 group-hover:opacity-100 transform scale-95 translate-y-2 group-hover:scale-100 group-hover:translate-y-0 transition-all duration-300 delay-300 text-sm font-semibold bg-transparent border border-white text-white py-2 px-4 rounded-full hover:bg-white hover:text-cyan-600 focus:outline-none focus:ring-2 focus:ring-white"
        >
            Go to Department
        </button>
    </div>
  );
};

export default DepartmentCard;
