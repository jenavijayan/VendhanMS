


import React, { useState, useEffect } from 'react';
import { fetchAdminDashboardData } from '../../services/api';
import { AdminDashboardData } from '../../types';
import { THEME, POSITIVE_MESSAGES } from '../../constants';
import { useAuth } from '../../hooks/useAuth'; 
import { UsersIcon, UserGroupIcon, BriefcaseIcon, CalendarDaysIcon, UserMinusIcon, UserPlusIcon, CalculatorIcon, PaperAirplaneIcon, DocumentChartBarIcon, ClockIcon as ReportClockIcon, CreditCardIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';


const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; bgColorClass: string; textColorClass: string }> = ({ title, value, icon, bgColorClass, textColorClass }) => (
  <div className={`p-6 rounded-xl shadow-lg flex items-center space-x-4 ${bgColorClass}`}>
    <div className={`p-3 rounded-full bg-white bg-opacity-30 ${textColorClass}`}>
      {icon}
    </div>
    <div>
      <p className={`text-sm font-medium ${textColorClass} opacity-80`}>{title}</p>
      <p className={`text-3xl font-bold ${textColorClass}`}>{value}</p>
    </div>
  </div>
);


const AdminDashboard: React.FC = () => {
  const { user } = useAuth(); 
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [positiveMessage, setPositiveMessage] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const adminData = await fetchAdminDashboardData(); 
        setData(adminData);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    loadData();

    if (POSITIVE_MESSAGES.length > 0) {
      const randomIndex = Math.floor(Math.random() * POSITIVE_MESSAGES.length);
      setPositiveMessage(POSITIVE_MESSAGES[randomIndex]);
    }
  }, []);

  if (loading) {
    return <div className={`text-center p-10 text-${THEME.accentText}`}>Loading admin data...</div>;
  }

  if (error) {
    return <div className={`text-center p-10 text-red-600`}>Error: {error}</div>;
  }

  if (!data) {
    return <div className={`text-center p-10 text-${THEME.accentText}`}>No data available.</div>;
  }

  return (
    <div className="space-y-6">
      {user && (
        <h1 className={`text-2xl font-medium text-${THEME.secondary} mb-1`}>
          Welcome, {user.firstName || user.username}!
        </h1>
      )}
      <h2 className={`text-3xl font-semibold text-${THEME.primary}`}>Admin Dashboard</h2>
      {positiveMessage && (
        <p className={`text-md text-${THEME.accentText} -mt-2 mb-4`}>{positiveMessage}</p>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard 
            title="Total Employees" 
            value={data.totalEmployees} 
            icon={<UserGroupIcon className="h-8 w-8" />}
            bgColorClass={`bg-${THEME.primary}`}
            textColorClass={`text-${THEME.primaryText}`}
        />
        <StatCard 
            title="Active Users" 
            value={data.activeUsers} 
            icon={<UsersIcon className="h-8 w-8" />}
            bgColorClass={`bg-${THEME.secondary}`}
            textColorClass={`text-${THEME.secondaryText}`}
        />
        <StatCard 
            title="Present Today" 
            value={data.presentToday} 
            icon={<UserPlusIcon className="h-8 w-8" />}
            bgColorClass={`bg-blue-500`}
            textColorClass={`text-white`}
        />
        <StatCard 
            title="Absent Today" 
            value={data.absentToday} 
            icon={<UserMinusIcon className="h-8 w-8" />}
            bgColorClass={`bg-orange-500`}
            textColorClass={`text-white`}
        />
      </div>

      <div className={`mt-8 p-6 bg-white rounded-xl shadow-lg`}>
        <h3 className={`text-xl font-semibold text-${THEME.accentText} mb-4`}>Ongoing Projects</h3>
        {data.ongoingProjects && data.ongoingProjects.length > 0 ? (
            <ul className={`text-sm text-gray-700 space-y-2`}>
                {data.ongoingProjects.map(project => (
                    <li key={project.id} className={`p-2 bg-gray-50 rounded-md flex items-center`}>
                        <BriefcaseIcon className={`h-4 w-4 mr-2 text-${THEME.secondary}`} />
                        {project.name}
                    </li>
                ))}
            </ul>
        ) : (
            <p className={`text-sm text-gray-500`}>No ongoing projects listed currently.</p>
        )}
      </div>

       <div className={`mt-8 p-6 bg-white rounded-xl shadow-lg`}>
        <h3 className={`text-xl font-semibold text-${THEME.accentText} mb-4`}>Quick Links & Reports</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <Link to="/app/admin/employees" className={`flex items-center justify-center text-center px-4 py-3 bg-${THEME.primary} text-${THEME.primaryText} rounded-md hover:bg-opacity-80 transition`}>
              <UserGroupIcon className="h-5 w-5 mr-2 hidden sm:inline-block"/> Manage Employees</Link>
            <Link to="/app/admin/projects" className={`flex items-center justify-center text-center px-4 py-3 bg-${THEME.primary} text-${THEME.primaryText} rounded-md hover:bg-opacity-80 transition`}>
              <BriefcaseIcon className="h-5 w-5 mr-2 hidden sm:inline-block"/>Manage Projects</Link>
            <Link to="/app/admin/billing" className={`flex items-center justify-center text-center px-4 py-3 bg-${THEME.secondary} text-${THEME.secondaryText} rounded-md hover:bg-opacity-80 transition`}>
              <CreditCardIcon className="h-5 w-5 mr-2 hidden sm:inline-block"/>Billing Records</Link>
            <Link to="/app/admin/billing-calculator" className={`flex items-center justify-center text-center px-4 py-3 bg-${THEME.secondary} text-${THEME.secondaryText} rounded-md hover:bg-opacity-80 transition`}>
              <CalculatorIcon className="h-5 w-5 mr-2 hidden sm:inline-block"/>Billing Calculator</Link>
            <Link to="/app/admin/leave-requests" className={`flex items-center justify-center text-center px-4 py-3 bg-${THEME.secondary} text-${THEME.secondaryText} rounded-md hover:bg-opacity-80 transition`}>
              <CalendarDaysIcon className="h-5 w-5 mr-2 hidden sm:inline-block"/>Leave Requests</Link>
            <Link to="/app/admin/training" className={`flex items-center justify-center text-center px-4 py-3 border border-${THEME.primary} text-${THEME.primary} rounded-md hover:bg-${THEME.accent} transition`}>
              <AcademicCapIcon className="h-5 w-5 mr-2 hidden sm:inline-block"/>Manage Training</Link>
            <Link to="/app/admin/send-notification" className={`flex items-center justify-center text-center px-4 py-3 border border-${THEME.primary} text-${THEME.primary} rounded-md hover:bg-${THEME.accent} transition`}>
              <PaperAirplaneIcon className="h-5 w-5 mr-2 hidden sm:inline-block"/>Send Message</Link>
            <Link to="/app/admin/attendance-reports" className={`flex items-center justify-center text-center px-4 py-3 border border-${THEME.primary} text-${THEME.primary} rounded-md hover:bg-${THEME.accent} transition`}>
              <ReportClockIcon className="h-5 w-5 mr-2 hidden sm:inline-block"/>Attendance Reports</Link>
            <Link to="/app/admin/work-reports" className={`flex items-center justify-center text-center px-4 py-3 border border-${THEME.primary} text-${THEME.primary} rounded-md hover:bg-${THEME.accent} transition`}>
              <DocumentChartBarIcon className="h-5 w-5 mr-2 hidden sm:inline-block"/>Work Reports</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;