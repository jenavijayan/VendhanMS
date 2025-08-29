
import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiSetupInitialAdmin, apiFetchCompanyDetails } from '../services/api';
import { UserRole } from '../types';
import { THEME } from '../constants';
import ImageUpload from '../components/Common/ImageUpload';

const SetupPage: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [companyName, setCompanyName] = useState('');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // On mount, check if setup is already complete. If so, redirect away.
    useEffect(() => {
        const checkSetup = async () => {
            try {
                const company = await apiFetchCompanyDetails();
                if (company) {
                    navigate('/welcome', { replace: true });
                }
            } catch (e) {
                console.error("Error checking setup status", e);
            }
        };
        checkSetup();
    }, [navigate]);

    const handleImageSelected = (base64Image: string | null) => {
        setLogoUrl(base64Image);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        // --- Validation ---
        if (!companyName.trim() || !firstName.trim() || !lastName.trim() || !username.trim() || !email.trim() || !password) {
            setError("All fields are required.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }
        // --- End Validation ---

        setIsLoading(true);
        try {
            await apiSetupInitialAdmin({
                companyName,
                logoUrl,
                adminData: {
                    firstName,
                    lastName,
                    username,
                    email,
                    password,
                    role: UserRole.ADMIN,
                }
            });
            alert('Setup successful! Please log in with your new administrator account.');
            navigate('/login');
        } catch (err: any) {
            setError(err.message || 'An error occurred during setup.');
        } finally {
            setIsLoading(false);
        }
    };

    const inputBaseClasses = `mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm placeholder-gray-400`;
    const buttonPrimaryClasses = `w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-${THEME.primaryText} bg-${THEME.primary} hover:bg-opacity-85 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.primary} disabled:opacity-50 transition duration-150 ease-in-out`;

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-${THEME.accent} via-white to-${THEME.accent} p-6`}>
            <div className={`w-full max-w-2xl bg-white p-8 rounded-xl shadow-2xl`}>
                <h1 className={`text-4xl font-bold text-center text-${THEME.primary} mb-2`}>Initial Setup</h1>
                <h2 className={`text-xl font-semibold text-center text-${THEME.secondary} mb-8`}>Configure your Company and Admin Account</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Company Details */}
                    <fieldset className="border p-4 rounded-md">
                        <legend className={`text-lg font-medium text-${THEME.accentText} px-2`}>Company Details</legend>
                        <div className="space-y-4 pt-2">
                             <div>
                                <label htmlFor="companyName" className={`block text-sm font-medium text-${THEME.accentText}`}>Company Name</label>
                                <input type="text" id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputBaseClasses} required />
                            </div>
                            <ImageUpload onImageSelected={handleImageSelected} label="Company Logo (Optional)" />
                        </div>
                    </fieldset>
                    
                    {/* Admin Account Details */}
                     <fieldset className="border p-4 rounded-md">
                        <legend className={`text-lg font-medium text-${THEME.accentText} px-2`}>Administrator Account</legend>
                        <div className="space-y-4 pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="firstName" className={`block text-sm font-medium text-${THEME.accentText}`}>First Name</label>
                                    <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputBaseClasses} required />
                                </div>
                                <div>
                                    <label htmlFor="lastName" className={`block text-sm font-medium text-${THEME.accentText}`}>Last Name</label>
                                    <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputBaseClasses} required />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="username" className={`block text-sm font-medium text-${THEME.accentText}`}>Admin Username</label>
                                <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className={inputBaseClasses} required />
                            </div>
                            <div>
                                <label htmlFor="email" className={`block text-sm font-medium text-${THEME.accentText}`}>Admin Email</label>
                                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputBaseClasses} required />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="password" className={`block text-sm font-medium text-${THEME.accentText}`}>Password</label>
                                    <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputBaseClasses} required />
                                </div>
                                <div>
                                    <label htmlFor="confirmPassword" className={`block text-sm font-medium text-${THEME.accentText}`}>Confirm Password</label>
                                    <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputBaseClasses} required />
                                </div>
                            </div>
                        </div>
                    </fieldset>

                    {error && (
                        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                            <p>{error}</p>
                        </div>
                    )}

                    <div>
                        <button type="submit" disabled={isLoading} className={buttonPrimaryClasses}>
                            {isLoading ? 'Processing...' : 'Complete Setup'}
                        </button>
                    </div>
                </form>
            </div>
             <footer className="mt-8 text-center text-sm text-gray-500 z-10">
                <p>&copy; {new Date().getFullYear()} Employee Management System. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default SetupPage;