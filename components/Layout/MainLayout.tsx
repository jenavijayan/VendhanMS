

import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../Dashboard/Header';
import Sidebar from '../Dashboard/Sidebar';
import BackButton from '../Common/BackButton'; 
import { THEME } from '../../constants';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const location = useLocation();

  // Determine if the current path is the root of the app's authenticated section
  const isAppRoot = location.pathname === '/app' || location.pathname === '/app/';

  return (
    <div className={`flex h-screen bg-${THEME.accent}`}>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuButtonClick={() => setSidebarOpen(true)} />
        <main className={`flex-1 overflow-x-hidden overflow-y-auto bg-${THEME.accent} p-6`}>
          {!isAppRoot && <BackButton />} {/* Conditionally render BackButton */}
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;