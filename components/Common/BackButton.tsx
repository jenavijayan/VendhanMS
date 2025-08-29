

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { THEME } from '../../constants';

const BackButton: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <button
      onClick={handleBack}
      className={`mb-4 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-${THEME.secondaryText} bg-${THEME.secondary} hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.secondary} transition-colors`}
      aria-label="Go back"
    >
      <ArrowLeftIcon className="h-5 w-5 mr-2" />
      Back
    </button>
  );
};

export default BackButton;