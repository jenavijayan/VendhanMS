import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiFetchUserLeaveRequests, apiCancelLeaveRequest } from '../../services/api';
import { LeaveRequest, LeaveStatus } from '../../types';
import { THEME } from '../../constants';
import { TrashIcon } from '@heroicons/react/24/outline';
import { formatDate, calculateLeaveDays } from '../../utils/dateUtils'; // Import from utils

const LeaveHistoryView: React.FC = () => {
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setError('User not found. Please log in.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const requests = await apiFetchUserLeaveRequests(user.id);
      setLeaveRequests(requests);
    } catch (err: any) { 
      setError(err.message || 'Failed to load leave history.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleCancelRequest = async (requestId: string) => {
    setActionError(null);
    setActionSuccess(null);
    if (!user) {
      setActionError('User not found.');
      return;
    }
    if (!window.confirm('Are you sure you want to cancel this leave request?')) {
      return;
    }
    try {
      await apiCancelLeaveRequest(requestId, user.id);
      setActionSuccess('Leave request cancelled successfully.');
      fetchHistory(); // Refresh the list
    } catch (err: any) {
      setActionError(err.message || 'Failed to cancel leave request.');
    }
  };

  const getStatusColor = (status: LeaveStatus) => {
    switch (status) {
      case LeaveStatus.APPROVED: return 'bg-green-100 text-green-800';
      case LeaveStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
      case LeaveStatus.REJECTED: return 'bg-red-100 text-red-800';
      case LeaveStatus.CANCELLED: return 'bg-gray-100 text-gray-700';
      default: return 'bg-blue-100 text-blue-800';
    }
  };


  if (loading) {
    return (
      <div className={`p-6 bg-white rounded-xl shadow-lg text-center text-${THEME.accentText}`}>
        <svg className={`animate-spin h-8 w-8 text-${THEME.primary} mx-auto mb-2`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading leave history...
      </div>
    );
  }

  if (error) {
    return <div className={`p-6 bg-red-100 text-red-700 rounded-xl shadow-lg`}>Error: {error}</div>;
  }

  return (
    <div className={`p-6 bg-white rounded-xl shadow-lg`}>
      <h2 className={`text-2xl font-semibold text-${THEME.primary} mb-6`}>Your Leave History</h2>

      {actionError && <p className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{actionError}</p>}
      {actionSuccess && <p className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">{actionSuccess}</p>}

      {leaveRequests.length === 0 ? (
        <p className={`text-center text-gray-500 py-8`}>You have not applied for any leave yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className={`bg-gray-50 border-b-2 border-${THEME.primary}`}>
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Dates</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Days</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reason</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Requested</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaveRequests.map(request => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-700">{request.leaveType}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{formatDate(request.startDate)} - {formatDate(request.endDate)}</td>
                  <td className="py-3 px-4 text-sm text-gray-700 text-center">{calculateLeaveDays(request.startDate, request.endDate)}</td>
                  <td className="py-3 px-4 text-sm text-gray-700 max-w-xs truncate" title={request.reason}>{request.reason}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{formatDate(request.requestedAt)}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {request.status === LeaveStatus.PENDING && (
                      <button 
                        onClick={() => handleCancelRequest(request.id)}
                        className={`p-1.5 text-red-500 hover:text-red-700 transition-colors`}
                        title="Cancel Request"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeaveHistoryView;