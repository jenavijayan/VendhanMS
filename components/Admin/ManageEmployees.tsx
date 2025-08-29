import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { apiFetchAllUsers, apiAdminUpdateUser, apiAdminResetPassword, apiDeleteUser } from '../../services/api';
import { User, AdminUserUpdateData, UserRole } from '../../types';
import { THEME } from '../../constants';
import { UserPlusIcon, PencilSquareIcon, TrashIcon, KeyIcon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import ImageUpload from '../Common/ImageUpload';

const ManageEmployees: React.FC = () => {
    const { user: currentAdmin } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editFormData, setEditFormData] = useState<AdminUserUpdateData>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: '',
        joinDate: '',
        role: UserRole.EMPLOYEE,
        profilePictureUrl: null,
        reportsTo: null
    });
    const [isSavingUser, setIsSavingUser] = useState(false);
    const [editFormError, setEditFormError] = useState<string | null>(null);

    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordResetError, setPasswordResetError] = useState<string | null>(null);
    const [passwordResetSuccess, setPasswordResetSuccess] = useState<string | null>(null);

    useEffect(() => {
        const loadUsers = async () => {
            setLoading(true);
            try {
                const fetchedUsers = await apiFetchAllUsers();
                setUsers(fetchedUsers);
            } catch (err: any) {
                setError(err.message || 'Failed to load users.');
            } finally {
                setLoading(false);
            }
        };
        loadUsers();
    }, []);

    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filteredData = users.filter(user =>
            user.username.toLowerCase().includes(lowercasedFilter) ||
            user.firstName.toLowerCase().includes(lowercasedFilter) ||
            user.lastName.toLowerCase().includes(lowercasedFilter) ||
            user.email.toLowerCase().includes(lowercasedFilter)
        );
        setFilteredUsers(filteredData);
    }, [searchTerm, users]);

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setEditFormData({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone || '',
            department: user.department || '',
            joinDate: user.joinDate || '',
            role: user.role,
            profilePictureUrl: user.profilePictureUrl,
            reportsTo: user.reportsTo || null
        });
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingUser(null);
        setEditFormError(null);
        setPasswordResetError(null);
        setPasswordResetSuccess(null);
        setNewPassword('');
        setConfirmNewPassword('');
    };

    const handleEditFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleImageSelected = (base64Image: string | null) => {
        setEditFormData(prev => ({...prev, profilePictureUrl: base64Image}));
    };

    const handleEditFormSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        
        setIsSavingUser(true);
        setEditFormError(null);
        try {
            const updatedUser = await apiAdminUpdateUser(editingUser.id, editFormData);
            setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
            closeEditModal();
        } catch (err: any) {
            setEditFormError(err.message || 'Failed to update user.');
        } finally {
            setIsSavingUser(false);
        }
    };
    
    const handlePasswordResetSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        
        setPasswordResetError(null);
        setPasswordResetSuccess(null);

        if (newPassword !== confirmNewPassword) {
            setPasswordResetError("Passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            setPasswordResetError("Password must be at least 6 characters.");
            return;
        }
        
        setIsSavingUser(true);
        try {
            await apiAdminResetPassword(editingUser.id, newPassword);
            setPasswordResetSuccess("Password reset successfully.");
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (err: any) {
            setPasswordResetError(err.message || 'Failed to reset password.');
        } finally {
            setIsSavingUser(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (currentAdmin && userId === currentAdmin.id) {
            alert("You cannot delete your own account.");
            return;
        }
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                await apiDeleteUser(userId, currentAdmin!.id);
                setUsers(users.filter(u => u.id !== userId));
            } catch (err: any) {
                setError(err.message || 'Failed to delete user.');
            }
        }
    };

    const inputBaseClasses = `mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`;
    const selectBaseClasses = `mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`;

    if (loading) {
        return <div className={`p-6 bg-white rounded-xl shadow-lg text-center text-${THEME.accentText}`}>Loading users...</div>;
    }

    if (error) {
        return <div className={`p-6 bg-red-100 text-red-700 rounded-xl shadow-lg`}>Error: {error}</div>;
    }

    return (
        <div className={`p-6 bg-white rounded-xl shadow-lg`}>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className={`text-2xl font-semibold text-${THEME.primary}`}>Manage Employees</h2>
                <input
                    type="text"
                    placeholder="Filter by name, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`${inputBaseClasses} sm:w-64 w-full`}
                />
                <Link
                    to="/app/admin/register"
                    className={`inline-flex items-center px-4 py-2 bg-${THEME.primary} text-${THEME.primaryText} text-sm font-medium rounded-md hover:bg-opacity-85 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.primary} w-full sm:w-auto justify-center`}
                >
                    <UserPlusIcon className="h-5 w-5 mr-2" />
                    Add New User
                </Link>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead className={`bg-gray-50 border-b-2 border-${THEME.primary}`}>
                        <tr>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Username</th>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredUsers.map(user => (
                            <tr key={user.id}>
                                <td className="py-3 px-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                            {user.profilePictureUrl ? (
                                                <img className="h-10 w-10 rounded-full object-cover" src={user.profilePictureUrl} alt="" />
                                            ) : (
                                                <UserCircleIcon className="h-10 w-10 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-500">{user.username}</td>
                                <td className="py-3 px-4">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === UserRole.ADMIN ? `bg-indigo-100 text-indigo-800` : `bg-green-100 text-green-800`}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-500">{user.department}</td>
                                <td className="py-3 px-4 text-right text-sm font-medium">
                                    <button onClick={() => openEditModal(user)} className={`p-1.5 text-gray-500 hover:text-${THEME.secondary} transition-colors mr-2`} title="Edit User">
                                        <PencilSquareIcon className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => handleDeleteUser(user.id)} className={`p-1.5 text-gray-500 hover:text-red-600 transition-colors`} title="Delete User">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isEditModalOpen && editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 overflow-y-auto">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl my-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-xl font-semibold text-${THEME.primary}`}>Edit User: {editingUser.firstName} {editingUser.lastName}</h3>
                            <button onClick={closeEditModal} className={`text-gray-400 hover:text-gray-600`}>
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleEditFormSubmit} className="space-y-4 max-h-[calc(70vh-100px)] overflow-y-auto pr-2">
                            <ImageUpload onImageSelected={handleImageSelected} currentImageUrl={editFormData.profilePictureUrl} label="Profile Picture"/>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="editFirstName" className={`block text-sm font-medium text-${THEME.accentText}`}>First Name</label>
                                    <input type="text" name="firstName" id="editFirstName" value={editFormData.firstName} onChange={handleEditFormChange} className={inputBaseClasses} />
                                </div>
                                <div>
                                    <label htmlFor="editLastName" className={`block text-sm font-medium text-${THEME.accentText}`}>Last Name</label>
                                    <input type="text" name="lastName" id="editLastName" value={editFormData.lastName} onChange={handleEditFormChange} className={inputBaseClasses} />
                                </div>
                                <div>
                                    <label htmlFor="editEmail" className={`block text-sm font-medium text-${THEME.accentText}`}>Email</label>
                                    <input type="email" name="email" id="editEmail" value={editFormData.email} onChange={handleEditFormChange} className={inputBaseClasses} />
                                </div>
                                <div>
                                    <label htmlFor="editPhone" className={`block text-sm font-medium text-${THEME.accentText}`}>Phone</label>
                                    <input type="text" name="phone" id="editPhone" value={editFormData.phone} onChange={handleEditFormChange} className={inputBaseClasses} />
                                </div>
                                <div>
                                    <label htmlFor="editDepartment" className={`block text-sm font-medium text-${THEME.accentText}`}>Department</label>
                                    <input type="text" name="department" id="editDepartment" value={editFormData.department} onChange={handleEditFormChange} className={inputBaseClasses} />
                                </div>
                                <div>
                                    <label htmlFor="editJoinDate" className={`block text-sm font-medium text-${THEME.accentText}`}>Join Date</label>
                                    <input type="date" name="joinDate" id="editJoinDate" value={editFormData.joinDate} onChange={handleEditFormChange} className={inputBaseClasses} />
                                </div>
                                <div>
                                    <label htmlFor="editRole" className={`block text-sm font-medium text-${THEME.accentText}`}>Role</label>
                                    <select name="role" id="editRole" value={editFormData.role} onChange={handleEditFormChange} className={selectBaseClasses}>
                                        <option value={UserRole.EMPLOYEE}>Employee</option>
                                        <option value={UserRole.ADMIN}>Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="editReportsTo" className={`block text-sm font-medium text-${THEME.accentText}`}>Reports To</label>
                                    <select name="reportsTo" id="editReportsTo" value={editFormData.reportsTo || ''} onChange={handleEditFormChange} className={selectBaseClasses}>
                                        <option value="">-- None (Top Level) --</option>
                                        {users.filter(u => u.id !== editingUser.id).map(manager => (
                                        <option key={manager.id} value={manager.id}>{manager.firstName} {manager.lastName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {editFormError && <div className="p-2 bg-red-100 text-red-700 rounded text-sm">{editFormError}</div>}
                            <div className="flex justify-end space-x-3 pt-2">
                                <button type="submit" disabled={isSavingUser} className={`px-4 py-2 bg-${THEME.primary} text-${THEME.primaryText} rounded-md text-sm font-medium hover:bg-opacity-85 disabled:opacity-50`}>
                                    {isSavingUser ? 'Saving Details...' : 'Save Details'}
                                </button>
                            </div>
                        </form>
                        
                        <form onSubmit={handlePasswordResetSubmit} className="space-y-4 mt-6 pt-4 border-t">
                            <h4 className={`text-md font-semibold text-${THEME.secondary} border-b pb-1 mb-3 flex items-center`}>
                                <KeyIcon className="h-5 w-5 mr-2"/> Reset Password
                            </h4>
                            <div>
                                <label htmlFor="newPassword" className={`block text-sm font-medium text-${THEME.accentText}`}>New Password</label>
                                <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputBaseClasses} placeholder="Min. 6 characters"/>
                            </div>
                            <div>
                                <label htmlFor="confirmNewPassword" className={`block text-sm font-medium text-${THEME.accentText}`}>Confirm New Password</label>
                                <input type="password" id="confirmNewPassword" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className={inputBaseClasses} />
                            </div>
                            {passwordResetError && <div className="p-2 bg-red-100 text-red-700 rounded text-sm">{passwordResetError}</div>}
                            {passwordResetSuccess && <div className="p-2 bg-green-100 text-green-700 rounded text-sm">{passwordResetSuccess}</div>}
                            <div className="flex justify-end space-x-3 pt-2">
                                <button type="submit" disabled={isSavingUser} className={`px-4 py-2 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600 disabled:opacity-50`}>
                                    {isSavingUser ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </div>
                        </form>
                        
                        <div className="mt-6 text-right">
                            <button type="button" onClick={closeEditModal} className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50`}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageEmployees;
