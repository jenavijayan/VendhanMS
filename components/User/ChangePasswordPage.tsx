

import React, { useState, FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiChangePassword } from '../../services/api';
import { THEME } from '../../constants';
import { KeyIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const ChangePasswordPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPasswordA, setNewPasswordA] = useState('');
  const [newPasswordB, setNewPasswordB] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!user) {
      setError("User not authenticated. Please log in again.");
      return;
    }
    if (!currentPassword || !newPasswordA || !newPasswordB) {
      setError("All password fields are required.");
      return;
    }
    if (newPasswordA !== newPasswordB) {
      setError("New passwords do not match.");
      return;
    }
    if (newPasswordA.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      await apiChangePassword(user.id, { currentPassword, newPasswordA, newPasswordB });
      setSuccessMessage("Password changed successfully! Please log in again with your new password.");
      setCurrentPassword('');
      setNewPasswordA('');
      setNewPasswordB('');
      // Force logout after successful password change
      setTimeout(async () => {
        await logout();
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to change password.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const inputBaseClasses = `mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`;
  const buttonPrimaryClasses = `flex items-center justify-center w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-${THEME.primaryText} bg-${THEME.primary} hover:bg-opacity-85 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.primary} disabled:opacity-50 transition`;

  return (
    <div className={`p-6 bg-white rounded-xl shadow-lg max-w-md mx-auto`}>
      <h2 className={`text-2xl font-semibold text-${THEME.primary} mb-6 flex items-center`}>
        <KeyIcon className="h-7 w-7 mr-2" />
        Change Your Password
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="currentPassword" className={`block text-sm font-medium text-${THEME.accentText}`}>Current Password</label>
          <input 
            type="password" 
            id="currentPassword" 
            value={currentPassword} 
            onChange={(e) => setCurrentPassword(e.target.value)} 
            className={inputBaseClasses}
            required 
          />
        </div>
        <div>
          <label htmlFor="newPasswordA" className={`block text-sm font-medium text-${THEME.accentText}`}>New Password</label>
          <input 
            type="password" 
            id="newPasswordA" 
            value={newPasswordA} 
            onChange={(e) => setNewPasswordA(e.target.value)} 
            className={inputBaseClasses}
            placeholder="Min. 6 characters"
            required 
          />
        </div>
        <div>
          <label htmlFor="newPasswordB" className={`block text-sm font-medium text-${THEME.accentText}`}>Confirm New Password</label>
          <input 
            type="password" 
            id="newPasswordB" 
            value={newPasswordB} 
            onChange={(e) => setNewPasswordB(e.target.value)} 
            className={inputBaseClasses}
            required 
          />
        </div>

        {error && <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md"><p>{error}</p></div>}
        {successMessage && <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-md"><p>{successMessage}</p></div>}

        <div className="pt-2">
          <button type="submit" disabled={isLoading} className={buttonPrimaryClasses}>
            {isLoading ? 'Changing Password...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordPage;