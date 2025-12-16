
import React, { useState, useEffect } from 'react';
import FactCard from './FactCard';
import DepartmentCard from './DepartmentCard';
import Footer from './Footer';
import Announcements from './Announcements';
import Hero from './Hero';
import AnimatedWrapper from './AnimatedWrapper';
import { Department, Announcement, departments, departmentDescriptions, factTitles, factIconColors, factIcons, departmentIconComponents } from '../constants';
import { getCount, getSum } from '../lib/supabase';

interface DashboardProps {
  onNavigateToDepartment: (department: Department) => void;
  userDepartment: string | null;
  isExecutive: boolean;
  announcements: Announcement[];
  onEditAnnouncement?: (announcement: Announcement) => void;
  onDeleteAnnouncement?: (title: string, content: string) => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  onNavigateToDepartment, 
  userDepartment, 
  isExecutive,
  announcements,
}) => {
  const [factData, setFactData] = useState<(number | null)[]>(Array(factTitles.length).fill(null));

  useEffect(() => {
    const fetchFactData = async () => {
      try {
        const dataPromises = [
          // Total Employees
          getCount('employees'),
          // Patients Admitted (total patients)
          getCount('patients'),
          // Pending Bills
          getCount('billing_and_insurance', [{ column: 'payment_status', value: 'Pending' }]),
          // Medicine Stocks
          getSum('medications', 'quantity_stock'),
          // Appointments Scheduled (Status = Scheduled)
          getCount('appointments', [{ column: 'status', value: 'Scheduled' }])
        ];

        const results = await Promise.all(dataPromises);
        setFactData(results);

      } catch (error) {
        console.error("Failed to fetch fact data:", error);
        // Set to 0 on error to prevent infinite loading state
        setFactData(Array(factTitles.length).fill(0));
      }
    };

    fetchFactData();
  }, []);

  const isAuthorized = (targetDept: Department) => {
    if (!userDepartment) return false;
    if (isExecutive) return true;
    
    const uDept = userDepartment.toLowerCase().trim();
    const tDept = targetDept.toLowerCase().trim();
    return uDept === tDept;
  };

  return (
    <div className="grid grid-cols-5 gap-8 w-full">
      <div className="col-span-5">
        <AnimatedWrapper delay={100}>
          <Hero />
        </AnimatedWrapper>
      </div>

      <div className="col-span-5 p-8 bg-[#111827]/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl shadow-2xl shadow-cyan-500/10 transition-all duration-300 hover:shadow-cyan-glow">
        <div className="grid grid-cols-5 gap-8">
          {factTitles.map((title, index) => (
            <div key={index} className="col-span-1">
              <AnimatedWrapper delay={(index + 2) * 100}>
                <FactCard
                  title={title}
                  value={factData[index]}
                  icon={factIcons[index]}
                  borderColor={factIconColors[index]}
                />
              </AnimatedWrapper>
            </div>
          ))}

          <div className="col-span-5 mt-8 flex items-center">
            <AnimatedWrapper delay={(factTitles.length + 2) * 100}>
              <h2 className="text-2xl font-bold text-white tracking-wider border-b-2 border-cyan-500/50 pb-2">
                Departments
              </h2>
            </AnimatedWrapper>
          </div>

          {departments.map((dept, index) => {
            const IconComponent = departmentIconComponents[dept];
            const authorized = isAuthorized(dept);
            return (
              <div key={dept} className="col-span-1">
                  <AnimatedWrapper delay={(factTitles.length + index + 3) * 100}>
                  <DepartmentCard 
                    department={dept}
                    icon={<IconComponent className={`h-20 w-20 transition-colors duration-200 delay-200 ${authorized ? 'text-[#E0E1DD] group-hover:text-white' : 'text-gray-600'}`} />}
                    description={departmentDescriptions[dept]} 
                    onNavigate={onNavigateToDepartment}
                    disabled={!authorized}
                  />
                </AnimatedWrapper>
              </div>
            )
          })}

          <div className="col-span-5 mt-8">
            <AnimatedWrapper delay={(factTitles.length + departments.length + 3) * 100}>
              <Announcements 
                announcements={announcements} 
              />
            </AnimatedWrapper>
          </div>

          <div className="col-span-5 mt-8">
              <AnimatedWrapper delay={(factTitles.length + departments.length + 4) * 100}>
              <Footer />
            </AnimatedWrapper>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
