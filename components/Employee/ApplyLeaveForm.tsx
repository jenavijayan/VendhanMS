import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiApplyForLeave } from '../../services/api';
import { LeaveType, NewLeaveRequestData } from '../../types';
import { THEME } from '../../constants';

const ApplyLeaveForm: React.FC = () => {
  const { user } = useAuth();
  const [leaveType, setLeaveType] = useState<LeaveType>(LeaveType.ANNUAL);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!user) {
      setError('User not found. Please log in again.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Please select both start and end dates.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date.');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason for your leave.');
      return;
    }

    setIsLoading(true);
    const leaveRequestData: NewLeaveRequestData = {
      userId: user.id,
      leaveType,
      startDate,
      endDate,
      reason: reason.trim(),
    };

    try {
      await apiApplyForLeave(leaveRequestData);
      setSuccessMessage('Leave request submitted successfully!');
      // Reset form
      setLeaveType(LeaveType.ANNUAL);
      setStartDate('');
      setEndDate('');
      setReason('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit leave request.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const today = new Date().toISOString().split('T')[0];

  const inputBaseClasses = `mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm placeholder-gray-400`;
  const selectBaseClasses = `mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`;
  const buttonPrimaryClasses = `flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-${THEME.primaryText} bg-${THEME.primary} hover:bg-opacity-85 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.primary} disabled:opacity-50 transition duration-150 ease-in-out`;

  return (
    <div className={`p-6 bg-white rounded-xl shadow-lg max-w-lg mx-auto`}>
      <h2 className={`text-2xl font-semibold text-${THEME.primary} mb-6`}>Apply for Leave</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="leaveType" className={`block text-sm font-medium text-${THEME.accentText}`}>Leave Type</label>
          <select 
            id="leaveType" 
            value={leaveType} 
            onChange={(e) => setLeaveType(e.target.value as LeaveType)} 
            className={selectBaseClasses}
            required
          >
            {Object.values(LeaveType).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className={`block text-sm font-medium text-${THEME.accentText}`}>Start Date</label>
            <input 
              type="date" 
              id="startDate" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className={inputBaseClasses}
              min={today}
              required 
            />
          </div>
          <div>
            <label htmlFor="endDate" className={`block text-sm font-medium text-${THEME.accentText}`}>End Date</label>
            <input 
              type="date" 
              id="endDate" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className={inputBaseClasses}
              min={startDate || today}
              required 
            />
          </div>
        </div>

        <div>
          <label htmlFor="reason" className={`block text-sm font-medium text-${THEME.accentText}`}>Reason</label>
          <textarea 
            id="reason" 
            value={reason} 
            onChange={(e) => setReason(e.target.value)} 
            rows={4} 
            className={inputBaseClasses}
            required
            placeholder="Please provide a brief reason for your leave request."
          />
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            <p>{error}</p>
          </div>
        )}
        {successMessage && !error && (
          <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
            <p>{successMessage}</p>
          </div>
        )}

        <div className="pt-2">
          <button 
            type="submit" 
            disabled={isLoading} 
            className={`${buttonPrimaryClasses} w-full`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplyLeaveForm;