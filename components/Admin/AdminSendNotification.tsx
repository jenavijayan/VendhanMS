
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiFetchAllUsers } from '../../services/api';
import { THEME } from '../../constants';
import { PaperAirplaneIcon, UserIcon as UserOutlineIcon, UsersIcon as UsersOutlineIcon } from '@heroicons/react/24/outline';
import ComposeMessageModal from '../User/ComposeMessageModal'; 
import { User } from '../../types';

const AdminSendNotification: React.FC = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [initialRecipient, setInitialRecipient] = useState<'ALL_USERS' | string>('ALL_USERS');
  const [initialMessage, setInitialMessage] = useState(''); // Not used here, but part of modal props

  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch users when component mounts or when needed for specific user selection
  const fetchUsersForModal = async () => {
    if (allUsers.length > 0 && !isLoadingUsers) return; // Don't refetch if already loaded
    setIsLoadingUsers(true);
    setError(null);
    try {
      const fetchedUsers = await apiFetchAllUsers();
      // Exclude the current admin from the list of potential individual recipients
      setAllUsers(fetchedUsers.filter(u => u.id !== user?.id)); 
    } catch (err) {
      setError("Failed to load users for recipient selection.");
      console.error("Failed to load users:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };
  
  useEffect(() => {
    // Pre-load users if admin is likely to send to specific user
    // For simplicity, we can call it when "Send to Specific User" is clicked if not already loaded
  }, []);


  const handleOpenModal = async (recipientType: 'ALL_USERS' | 'SPECIFIC_USER' = 'ALL_USERS') => {
    setError(null);
    setSuccessMessage(null);
    setInitialMessage(''); // Reset content for new message
    
    if (recipientType === 'SPECIFIC_USER') {
      await fetchUsersForModal(); // Ensure users are loaded before opening for specific selection
      setInitialRecipient(''); // Default to empty so user has to select
    } else {
      setInitialRecipient('ALL_USERS');
    }
    setIsModalOpen(true);
  };

  const handleMessageSent = () => {
    setSuccessMessage('Message sent successfully!');
    setIsModalOpen(false);
  };

  const handleModalError = (errMsg: string) => {
    setError(errMsg); // Display error from modal
    // Modal remains open for user to correct or cancel
  };
  
  const buttonPrimaryClasses = `flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-${THEME.primaryText} bg-${THEME.primary} hover:bg-opacity-85 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.primary} disabled:opacity-50 transition duration-150 ease-in-out`;


  return (
    <div className={`p-6 bg-white rounded-xl shadow-lg max-w-xl mx-auto`}>
      <h2 className={`text-2xl font-semibold text-${THEME.primary} mb-6 flex items-center`}>
        <PaperAirplaneIcon className="h-7 w-7 mr-2" />
        Send Internal Message
      </h2>
      
      {error && (
        <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <p>{error}</p>
        </div>
      )}
      {successMessage && !error && (
        <div className="p-3 mb-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
          <p>{successMessage}</p>
        </div>
      )}

      <div className="space-y-4">
        <button
          onClick={() => handleOpenModal('ALL_USERS')}
          className={`${buttonPrimaryClasses} w-full`}
          disabled={isLoadingUsers}
        >
          <UsersOutlineIcon className="h-5 w-5 mr-2" />
          {isLoadingUsers ? 'Loading Users...' : 'Send Message to ALL Users'}
        </button>
        <button
          onClick={() => handleOpenModal('SPECIFIC_USER')}
          className={`${buttonPrimaryClasses} w-full bg-${THEME.secondary} hover:bg-opacity-85`}
          disabled={isLoadingUsers}
        >
          <UserOutlineIcon className="h-5 w-5 mr-2" />
          {isLoadingUsers ? 'Loading Users...' : 'Send Message to Specific User'}
        </button>
      </div>

      {isModalOpen && user && (
        <ComposeMessageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          currentUser={user}
          allUsers={allUsers}
          onMessageSent={handleMessageSent}
          onError={handleModalError}
          initialRecipientId={initialRecipient} // This sets the modal's initial recipient
          initialContent={initialMessage}
          allowRecipientChange={initialRecipient !== 'ALL_USERS'} 
          forceBroadcast={initialRecipient === 'ALL_USERS'}
        />
      )}
    </div>
  );
};

export default AdminSendNotification;
