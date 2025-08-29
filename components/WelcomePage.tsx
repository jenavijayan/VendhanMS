

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { THEME } from '../../constants';
import { ArrowRightIcon, BuildingOffice2Icon } from '@heroicons/react/24/solid';
import { apiFetchCompanyDetails } from '../../services/api';
import { Company } from '../../types';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const companyDetails = await apiFetchCompanyDetails();
        if (companyDetails) {
          setCompany(companyDetails);
        } else {
          navigate('/setup', { replace: true });
        }
      } catch (error) {
        console.error("Failed to check app setup:", error);
        // In a real app, you might want a dedicated error component here
        setCompany(null); // Ensure no company data is shown on error
      } finally {
        setLoading(false);
      }
    };
    checkSetup();
  }, [navigate]);

  const handleProceedToLogin = () => {
    navigate('/login');
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-${THEME.accent}`}>
        <div className="flex flex-col items-center">
            <svg className={`animate-spin h-12 w-12 text-${THEME.primary}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className={`mt-4 text-lg font-semibold text-${THEME.accentText}`}>Loading...</p>
        </div>
      </div>
    );
  }
  
  // This state is very brief as navigate() will have been called.
  // Returning null prevents a flicker of the un-styled page.
  if (!company) {
    return null;
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-${THEME.accent} via-white to-${THEME.accent} p-6 text-center`}>
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='52' height='26' viewBox='0 0 52 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%234A7C59' fill-opacity='0.2'%3E%3Cpath d='M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414zM41 0c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zM52 26c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zM28.464 24.05l8.486-8.486 1.414 1.414-8.486 8.486-1.414-1.414z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>
      
      <main className="z-10 animate-fadeIn">
        {company.logoUrl ? (
          <img src={company.logoUrl} alt={`${company.name} Logo`} className="max-h-24 mx-auto mb-4" />
        ) : (
          <BuildingOffice2Icon className={`w-20 h-20 text-${THEME.primary} mx-auto mb-4`} />
        )}

        <h1 className={`text-5xl md:text-6xl font-bold text-${THEME.primary} drop-shadow-lg`}>
          Welcome to {company.name}
        </h1>
        <p className={`mt-4 text-xl md:text-2xl text-${THEME.secondary} font-light`}>
          Employee Management System
        </p>
        <button
          onClick={handleProceedToLogin}
          className={`mt-12 inline-flex items-center px-10 py-4 bg-${THEME.primary} text-${THEME.primaryText} text-lg font-semibold rounded-lg shadow-xl hover:bg-opacity-85 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.primary} transition-all duration-300 ease-in-out hover:scale-105 transform`}
          aria-label="Proceed to Login"
        >
          Proceed to Login
          <ArrowRightIcon className="ml-3 h-6 w-6" />
        </button>
      </main>

      <footer className={`absolute bottom-6 text-center text-sm text-gray-500 z-10`}>
        <p>&copy; {new Date().getFullYear()} {company.name}. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default WelcomePage;