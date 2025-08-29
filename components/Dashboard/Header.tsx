

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { APP_NAME, THEME } from '../../constants';
import { UserIcon, ArrowRightOnRectangleIcon, Bars3Icon, BellIcon, KeyIcon } from '@heroicons/react/24/outline';
import { apiGetUnreadMessageCount } from '../../services/api'; 


interface HeaderProps {
  onMenuButtonClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuButtonClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Prepend /app to paths
  const appPath = (path: string) => `/app${path}`;

  const handleLogout = async () => {
    await logout();
    navigate('/welcome'); // Navigate to welcome page on logout
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchUnreadCount = async () => {
      if (user?.id) {
        try {
          const count = await apiGetUnreadMessageCount(user.id);
          if (isMounted) {
            setUnreadMessages(count);
          }
        } catch (error) {
          console.error("Failed to fetch unread message count:", error);
        }
      }
    };
    fetchUnreadCount();
    
    const intervalId = setInterval(fetchUnreadCount, 30000); 
    return () => {
        isMounted = false;
        clearInterval(intervalId);
    };
  }, [user]);


  const UserAvatar: React.FC = () => {
    if (user?.profilePictureUrl) {
      return <img src={user.profilePictureUrl} alt="Profile" className="h-8 w-8 rounded-full object-cover" />;
    }
    return <UserIcon className="h-8 w-8 rounded-full bg-gray-200 text-gray-600 p-1" />;
  };

  return (
    <header className={`bg-${THEME.primary} text-${THEME.primaryText} shadow-md`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={onMenuButtonClick}
              className={`p-2 rounded-md text-${THEME.primaryText} hover:bg-${THEME.secondary} focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white md:hidden`}
              aria-label="Open sidebar"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div className={`ml-2 md:ml-0 text-xl font-bold`}>{APP_NAME}</div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link to={appPath("/messages")} className="relative p-1 rounded-full text-gray-300 hover:text-white focus:outline-none">
                <span className="sr-only">View messages</span>
                <BellIcon className="h-6 w-6" aria-hidden="true" />
                {unreadMessages > 0 && (
                <span className={`absolute top-0 right-0 block h-4 w-4 transform -translate-y-1/2 translate-x-1/2 rounded-full bg-red-500 ring-1 ring-${THEME.primary} text-xs flex items-center justify-center font-bold`}>
                    {unreadMessages < 10 ? unreadMessages : '9+'} 
                </span>
                )}
            </Link>

            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-${THEME.primary} focus:ring-white p-1 hover:bg-${THEME.secondary} transition duration-150`}
                >
                  <span className="sr-only">Open user menu</span>
                  <UserAvatar />
                  <span className="ml-2 hidden md:block">{user.firstName || user.username}</span>
                </button>
                {dropdownOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className={`px-4 py-3 text-sm text-gray-700 border-b`}>
                      <div className="flex items-center mb-1">
                        <UserAvatar />
                        <div className="ml-2">
                           <p className="font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                           <p className={`text-xs text-${THEME.accentText} truncate`}>{user.email}</p>
                        </div>
                      </div>
                    </div>
                     <Link
                      to={appPath(user.role === 'admin' ? "/employee/profile" : "/employee/profile")} // Admin might not have a profile page under /employee. Adjust if admin profile is different. For now, assume it's okay or they don't use it.
                      className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                      onClick={() => setDropdownOpen(false)}
                    >
                      My Profile
                    </Link>
                    <Link
                      to={appPath("/change-password")}
                      className={`flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                      onClick={() => setDropdownOpen(false)}
                    >
                      <KeyIcon className="mr-2 h-5 w-5 text-gray-500"/>
                      Change Password
                    </Link>
                    <button
                      onClick={handleLogout}
                      className={`w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 hover:text-red-700`}
                    >
                      <ArrowRightOnRectangleIcon className="mr-2 h-5 w-5" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;