import React, { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiUpdateUserProfile } from '../../services/api';
import { User, EmployeeProfileUpdateData } from '../../types';
import { THEME } from '../../constants';
import { PencilSquareIcon, CheckCircleIcon, XCircleIcon, UserCircleIcon, PhoneIcon, EnvelopeIcon, BriefcaseIcon, CalendarDaysIcon, PhotoIcon } from '@heroicons/react/24/outline';
import ImageUpload from '../Common/ImageUpload'; // Import ImageUpload

const EmployeeProfile: React.FC = () => {
  const { user, updateUserInContext } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null | undefined>(user?.profilePictureUrl);
  
  const username = user?.username || 'N/A';
  const department = user?.department || 'N/A';
  const joinDate = user?.joinDate || 'N/A';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setProfilePictureUrl(user.profilePictureUrl);
    }
  }, [user]);

  const handleEditToggle = () => {
    if (isEditing) {
      setFirstName(user?.firstName || '');
      setLastName(user?.lastName || '');
      setEmail(user?.email || '');
      setPhone(user?.phone || '');
      setProfilePictureUrl(user?.profilePictureUrl);
      setError(null);
      setSuccessMessage(null);
    }
    setIsEditing(!isEditing);
  };

  const handleImageSelected = (base64Image: string | null) => {
    setProfilePictureUrl(base64Image);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("User data not available.");
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    const profileUpdateData: EmployeeProfileUpdateData = {
      firstName,
      lastName,
      email,
      phone,
      profilePictureUrl,
    };

    try {
      const updatedUser = await apiUpdateUserProfile(user.id, profileUpdateData);
      updateUserInContext(updatedUser); 
      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };
  
  const inputBaseClasses = `mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm placeholder-gray-400`;
  const displayFieldClasses = "mt-1 text-sm text-gray-700 py-2";


  if (!user) {
    return <div className={`p-6 bg-white rounded-xl shadow-lg text-center text-${THEME.accentText}`}>Loading profile...</div>;
  }

  const ProfileAvatar: React.FC<{ size?: string }> = ({ size = "h-24 w-24" }) => {
    if (profilePictureUrl) {
      return <img src={profilePictureUrl} alt="Profile" className={`${size} rounded-full object-cover mx-auto ring-2 ring-offset-2 ring-${THEME.secondary}`} />;
    }
    return <UserCircleIcon className={`${size} text-gray-400 mx-auto`} />;
  };

  return (
    <div className={`p-6 bg-white rounded-xl shadow-lg max-w-2xl mx-auto`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-semibold text-${THEME.primary}`}>My Profile</h2>
        <button
          onClick={handleEditToggle}
          className={`p-2 rounded-md text-sm font-medium ${isEditing ? `bg-red-100 text-red-600 hover:bg-red-200` : `bg-${THEME.secondary} text-${THEME.secondaryText} hover:bg-opacity-80`} transition-colors`}
        >
          {isEditing ? <XCircleIcon className="h-5 w-5 mr-1.5 inline-block" /> : <PencilSquareIcon className="h-5 w-5 mr-1.5 inline-block" />}
          {isEditing ? 'Cancel Edit' : 'Edit Profile'}
        </button>
      </div>

      {error && <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded-md"><p>{error}</p></div>}
      {successMessage && <div className="p-3 mb-4 bg-green-100 border border-green-400 text-green-700 rounded-md"><p>{successMessage}</p></div>}
      
      <div className="text-center mb-6">
        <ProfileAvatar />
        {isEditing && (
          <div className="mt-4">
            <ImageUpload 
              onImageSelected={handleImageSelected} 
              currentImageUrl={profilePictureUrl}
              label="Change Profile Picture"
            />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label htmlFor="firstName" className={`block text-sm font-medium text-${THEME.accentText}`}>First Name</label>
            {isEditing ? (
              <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputBaseClasses} required />
            ) : (
              <p className={displayFieldClasses}>{firstName || 'N/A'}</p>
            )}
          </div>
          <div>
            <label htmlFor="lastName" className={`block text-sm font-medium text-${THEME.accentText}`}>Last Name</label>
            {isEditing ? (
              <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputBaseClasses} required />
            ) : (
              <p className={displayFieldClasses}>{lastName || 'N/A'}</p>
            )}
          </div>
          <div>
            <label htmlFor="username" className={`block text-sm font-medium text-${THEME.accentText}`}>Username</label>
            <div className="flex items-center space-x-2">
                 <UserCircleIcon className={`h-5 w-5 text-gray-400`} />
                <p className={displayFieldClasses}>{username}</p>
            </div>
          </div>
          <div>
            <label htmlFor="email" className={`block text-sm font-medium text-${THEME.accentText}`}>Email Address</label>
            <div className="flex items-center space-x-2">
                <EnvelopeIcon className={`h-5 w-5 text-gray-400`} />
                {isEditing ? (
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputBaseClasses} required />
                ) : (
                <p className={displayFieldClasses}>{email}</p>
                )}
            </div>
          </div>
          <div>
            <label htmlFor="phone" className={`block text-sm font-medium text-${THEME.accentText}`}>Phone Number</label>
             <div className="flex items-center space-x-2">
                <PhoneIcon className={`h-5 w-5 text-gray-400`} />
                {isEditing ? (
                <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputBaseClasses} placeholder="e.g., 123-456-7890" />
                ) : (
                <p className={displayFieldClasses}>{phone || 'N/A'}</p>
                )}
            </div>
          </div>
           <div>
            <label htmlFor="department" className={`block text-sm font-medium text-${THEME.accentText}`}>Department</label>
             <div className="flex items-center space-x-2">
                <BriefcaseIcon className={`h-5 w-5 text-gray-400`} />
                <p className={displayFieldClasses}>{department}</p>
            </div>
          </div>
          <div>
            <label htmlFor="joinDate" className={`block text-sm font-medium text-${THEME.accentText}`}>Join Date</label>
            <div className="flex items-center space-x-2">
                <CalendarDaysIcon className={`h-5 w-5 text-gray-400`} />
                <p className={displayFieldClasses}>{joinDate ? new Date(joinDate).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-${THEME.primaryText} bg-${THEME.primary} hover:bg-opacity-85 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.primary} disabled:opacity-50 transition`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5 mr-1.5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </form>
      {!isEditing && (
         <div className="mt-6 border-t pt-4">
            <h3 className={`text-lg font-medium text-${THEME.accentText} mb-2`}>Password</h3>
            <p className="text-sm text-gray-600">Password changes are handled separately for security. Contact admin if you need to reset your password.</p>
         </div>
      )}
    </div>
  );
};

export default EmployeeProfile;
