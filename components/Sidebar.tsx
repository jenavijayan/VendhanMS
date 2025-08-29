



import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';
import { APP_NAME, THEME } from '../../constants';
import { 
  HomeIcon, 
  UserGroupIcon, 
  UserPlusIcon, 
  ArrowRightOnRectangleIcon, 
  XMarkIcon, 
  CreditCardIcon, 
  BriefcaseIcon,
  DocumentPlusIcon, 
  ClockIcon,
  CalendarDaysIcon,
  CalculatorIcon, 
  PaperAirplaneIcon, 
  DocumentChartBarIcon, 
  KeyIcon,
  FlagIcon,
  BookOpenIcon,
  AcademicCapIcon,
  SitemapIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/welcome'); // Navigate to welcome page on logout
    setIsOpen(false);
  };

  const commonLinkClasses = `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-150`;
  const activeLinkClasses = `bg-${THEME.primary} text-${THEME.primaryText}`;
  const inactiveLinkClasses = `text-${THEME.accentText} hover:bg-${THEME.secondary} hover:text-${THEME.secondaryText}`;
  
  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `${commonLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`;

  // Prepend /app to all NavLink 'to' props
  const appPath = (path: string) => `/app${path === '/' ? '' : path}`;


  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black opacity-50 md:hidden" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <div 
        className={`fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-white border-r border-gray-200 shadow-lg transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div className={`flex items-center justify-between h-16 px-4 border-b bg-${THEME.primary} text-${THEME.primaryText}`}>
          <span className="text-xl font-bold">{APP_NAME}</span>
          <button
            onClick={() => setIsOpen(false)}
            className={`p-1 rounded-md text-${THEME.primaryText} hover:bg-${THEME.secondary} md:hidden`}
            aria-label="Close sidebar"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* == Common Links == */}
          <NavLink to={appPath("/")} end className={navLinkClass} onClick={() => setIsOpen(false)}>
            <HomeIcon className="h-5 w-5 mr-3" />
            Dashboard
          </NavLink>
          <NavLink to={appPath("/notebook")} className={navLinkClass} onClick={() => setIsOpen(false)}>
            <BookOpenIcon className="h-5 w-5 mr-3" />
            Personal Notebook
          </NavLink>
          <NavLink to={appPath("/calendar")} className={navLinkClass} onClick={() => setIsOpen(false)}>
            <CalendarDaysIcon className="h-5 w-5 mr-3" />
            Calendar
          </NavLink>
          <NavLink to={appPath("/feature-voting")} className={navLinkClass} onClick={() => setIsOpen(false)}>
            <LightBulbIcon className="h-5 w-5 mr-3" />
            Feature Voting
          </NavLink>

          {/* == Admin Links == */}
          {user?.role === UserRole.ADMIN && (
            <>
              <NavLink to={appPath("/admin/employees")} className={navLinkClass} onClick={() => setIsOpen(false)}>
                <UserGroupIcon className="h-5 w-5 mr-3" />
                Manage Employees
              </NavLink>
               <NavLink to={appPath("/admin/register")} className={navLinkClass} onClick={() => setIsOpen(false)}>
                <UserPlusIcon className="h-5 w-5 mr-3" />
                Add New User
              </NavLink>
              <NavLink to={appPath("/admin/org-chart")} className={navLinkClass} onClick={() => setIsOpen(false)}>
                <SitemapIcon className="h-5 w-5 mr-3" />
                Org Chart
              </NavLink>
              <NavLink to={appPath("/admin/projects")} className={navLinkClass} onClick={() => setIsOpen(false)}>
                <BriefcaseIcon className="h-5 w-5 mr-3" />
                Manage Projects
              </NavLink>
              <NavLink to={appPath("/admin/billing")} className={navLinkClass} onClick={() => setIsOpen(false)}>
                <CreditCardIcon className="h-5 w-5 mr-3" />
                Manage Billing
              </NavLink>
              <NavLink to={appPath("/admin/billing-calculator")} className={navLinkClass} onClick={() => setIsOpen(false)}>
                <CalculatorIcon className="h-5 w-5 mr-3" />
                Billing Calculator
              </NavLink>
              <NavLink to={appPath("/admin/leave-requests")} className={navLinkClass} onClick={() => setIsOpen(false)}>
                <CalendarDaysIcon className="h-5 w-5 mr-3" />
                Manage Leave Requests
              </NavLink>
              <NavLink to={appPath("/admin/attendance-reports")} className={navLinkClass} onClick={() => setIsOpen(false)}>
                <ClockIcon className="h-5 w-5 mr-3" />
                Attendance Reports
              </NavLink>
              <NavLink to={appPath("/admin/work-reports")} className={navLinkClass} onClick={() => setIsOpen(false)}>
                <DocumentChartBarIcon className="h-5 w-5 mr-3" />
                Work Reports
              </NavLink>
              <NavLink to={appPath("/admin/events")} className={navLinkClass} onClick={() => setIsOpen(false)}>
                <FlagIcon className="h-5 w-5 mr-3" />
                Manage Events
              </NavLink>
              <NavLink to={appPath("/admin/training")} className={navLinkClass} onClick={() => setIsOpen(false)}>
                <AcademicCapIcon className="h-5 w-5 mr-3" />
                Manage Training
              </NavLink>
              <NavLink to={appPath("/admin/send-notification")} className={navLinkClass} onClick={() => setIsOpen(false)}>
                <PaperAirplaneIcon className="h-5 w-5 mr-3" />
                Send Message
              </NavLink>
            </>
          )}
          
          {/* == Employee Links == */}
          {user?.role === UserRole.EMPLOYEE && (
            <>
              <NavLink to={appPath("/employee/profile")} className={navLinkClass} onClick={() => setIsOpen(false)}>
                <UserGroupIcon className="h-5 w-5 mr-3" />
                My Profile
              </NavLink>
              <NavLink to={appPath("/employee/submit-report")} className={navLinkClass} onClick={() => setIsOpen(false)}>
                <DocumentPlusIcon className="h-5 w-5 mr-3" />
                Submit Work Report
              </NavLink>
              <NavLink to={appPath("/employee/report-history")} className={navLinkClass} onClick={() => setIsOpen(false)}>
                <ClockIcon className="h-5 w-5 mr-3" />
                Work Report History
              </NavLink>
              <NavLink to={appPath("/employee/apply-leave")} className={navLinkClass} onClick={() => setIsOpen(false)}>
                <CalendarDaysIcon className="h-5 w-5 mr-3" />
                Apply for Leave
              </NavLink>
              <NavLink to={appPath("/employee/leave-history")} className={navLinkClass} onClick={() => setIsOpen(false)}>
                <CalendarDaysIcon className="h-5 w-5 mr-3" /> 
                Leave History
              </NavLink>
              <NavLink to={appPath("/employee/training")} className={navLinkClass} onClick={() => setIsOpen(false)}>
                <AcademicCapIcon className="h-5 w-5 mr-3" />
                Training Center
              </NavLink>
              <NavLink to={appPath("/employee/my-billing")} className={navLinkClass} onClick={() => setIsOpen(false)}>
                <CreditCardIcon className="h-5 w-5 mr-3" />
                My Billing
              </NavLink>
            </>
          )}

          {/* == Common Account Links == */}
           <NavLink to={appPath("/change-password")} className={navLinkClass} onClick={() => setIsOpen(false)}>
            <KeyIcon className="h-5 w-5 mr-3" />
            Change Password
          </NavLink>
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className={`${commonLinkClasses} w-full text-red-600 hover:bg-red-100 hover:text-red-700`}
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;