
import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { apiFetchAllLeaveRequests, apiUpdateLeaveRequestStatus, apiBulkUpdateLeaveRequestStatus } from '../../services/api';
import { LeaveRequest, LeaveStatus } from '../../types';
import { THEME } from '../../constants';
import { CheckCircleIcon, XCircleIcon, PencilIcon, XMarkIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { formatDate, calculateLeaveDays } from '../../utils/dateUtils'; // Import from utils

const ManageLeaveRequests: React.FC = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filterStatus, setFilterStatus] = useState<LeaveStatus | ''>(LeaveStatus.PENDING);
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  const [selectedRequestIds, setSelectedRequestIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<LeaveRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionToPerform, setActionToPerform] = useState<'approve' | 'reject' | null>(null);
  
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);


  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    setActionError(null);
    setActionSuccess(null);
    try {
      const filters: { status?: LeaveStatus, userId?: string, startDate?: string, endDate?: string } = {};
      if (filterStatus) filters.status = filterStatus;
      if (filterStartDate) filters.startDate = filterStartDate;
      if (filterEndDate) filters.endDate = filterEndDate;
      
      const requests = await apiFetchAllLeaveRequests(filters);
      setLeaveRequests(requests);
      setSelectedRequestIds(new Set()); // Clear selection on new fetch
    } catch (err: any) {
      setError(err.message || 'Failed to load leave requests.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterStartDate, filterEndDate]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);
  
  const openActionModal = (request: LeaveRequest, action: 'approve' | 'reject') => {
    setCurrentRequest(request);
    setActionToPerform(action);
    setAdminNotes(request.adminNotes || ''); 
    setIsModalOpen(true);
  };

  const closeActionModal = () => {
    setIsModalOpen(false);
    setCurrentRequest(null);
    setAdminNotes('');
    setActionToPerform(null);
  };

  const handleActionSubmit = async () => {
    if (!currentRequest || !actionToPerform) return;
    
    setActionError(null);
    setActionSuccess(null);
    setLoading(true); 

    const newStatus = actionToPerform === 'approve' ? LeaveStatus.APPROVED : LeaveStatus.REJECTED;

    try {
      await apiUpdateLeaveRequestStatus(currentRequest.id, newStatus, adminNotes);
      setActionSuccess(`Request ${actionToPerform}d successfully.`);
      fetchRequests(); 
      closeActionModal();
    } catch (err: any) {
      setActionError(err.message || `Failed to ${actionToPerform} request.`);
    } finally {
        setLoading(false); 
    }
  };

  const handleCheckboxChange = (requestId: string, checked: boolean) => {
    setSelectedRequestIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(requestId);
      } else {
        newSet.delete(requestId);
      }
      return newSet;
    });
  };

  const handleSelectAllPendingChange = (e: ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      const allPendingIds = leaveRequests
        .filter(req => req.status === LeaveStatus.PENDING)
        .map(req => req.id);
      setSelectedRequestIds(new Set(allPendingIds));
    } else {
      setSelectedRequestIds(new Set());
    }
  };
  
  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedRequestIds.size === 0) {
        alert("No requests selected.");
        return;
    }
    const newStatus = action === 'approve' ? LeaveStatus.APPROVED : LeaveStatus.REJECTED;
    const notes = prompt(`Enter optional admin notes for ${action === 'approve' ? 'approving' : 'rejecting'} ${selectedRequestIds.size} request(s):`);

    setIsProcessingBulk(true);
    setActionError(null);
    setActionSuccess(null);
    try {
        await apiBulkUpdateLeaveRequestStatus(Array.from(selectedRequestIds), newStatus, notes || undefined);
        setActionSuccess(`${selectedRequestIds.size} requests ${action}d successfully.`);
        fetchRequests(); // Refreshes the list and clears selection
    } catch (err: any) {
        setActionError(err.message || `Failed to ${action} selected requests.`);
    } finally {
        setIsProcessingBulk(false);
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

  const inputBaseClasses = `py-1.5 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} text-sm`;
  const buttonPrimaryClasses = `inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-${THEME.primary} hover:bg-opacity-85 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.primary} disabled:opacity-50`;


  if (loading && leaveRequests.length === 0) { 
    return (
      <div className={`p-6 bg-white rounded-xl shadow-lg text-center text-${THEME.accentText}`}>
        <svg className={`animate-spin h-8 w-8 text-${THEME.primary} mx-auto mb-2`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading leave requests...
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white rounded-xl shadow-lg`}>
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <h2 className={`text-2xl font-semibold text-${THEME.primary} flex items-center`}>
          <CalendarDaysIcon className="h-7 w-7 mr-2" />
          Manage Leave Requests
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="flex-1 min-w-[150px]">
            <label htmlFor="statusFilter" className={`block text-xs font-medium text-gray-700 mb-1`}>Status</label>
            <select 
              id="statusFilter" 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value as LeaveStatus | '')}
              className={inputBaseClasses}
            >
              <option value="">All</option>
              {Object.values(LeaveStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
             <label htmlFor="filterStartDate" className={`block text-xs font-medium text-gray-700 mb-1`}>Start Date</label>
            <input type="date" id="filterStartDate" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className={inputBaseClasses} />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label htmlFor="filterEndDate" className={`block text-xs font-medium text-gray-700 mb-1`}>End Date</label>
            <input type="date" id="filterEndDate" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className={inputBaseClasses} />
          </div>
          <button onClick={fetchRequests} className={`${buttonPrimaryClasses} self-end h-9 mt-1 sm:mt-0`}>Apply Filters</button>
        </div>
      </div>
      
      {(actionError || error) && <p className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{actionError || error}</p>}
      {actionSuccess && <p className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">{actionSuccess}</p>}
      
      {loading && <p className={`text-sm text-${THEME.accentText} mb-2`}>Refreshing list...</p>}

      {leaveRequests.filter(req => req.status === LeaveStatus.PENDING).length > 0 && selectedRequestIds.size > 0 && (
          <div className="my-4 flex space-x-3">
              <button 
                  onClick={() => handleBulkAction('approve')}
                  disabled={isProcessingBulk}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 flex items-center`}
              >
                  <CheckCircleIcon className="h-4 w-4 mr-1.5" /> Approve Selected ({selectedRequestIds.size})
              </button>
              <button 
                  onClick={() => handleBulkAction('reject')}
                  disabled={isProcessingBulk}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center`}
              >
                  <XCircleIcon className="h-4 w-4 mr-1.5" /> Reject Selected ({selectedRequestIds.size})
              </button>
          </div>
      )}


      {leaveRequests.length === 0 ? (
        <p className={`text-center text-gray-500 py-8`}>No leave requests found matching the criteria.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className={`bg-gray-50 border-b-2 border-${THEME.primary}`}>
              <tr>
                <th className="py-3 px-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-10">
                  {leaveRequests.some(req => req.status === LeaveStatus.PENDING) && (
                    <input 
                      type="checkbox"
                      className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      onChange={handleSelectAllPendingChange}
                      checked={
                        leaveRequests.filter(req => req.status === LeaveStatus.PENDING).length > 0 &&
                        selectedRequestIds.size === leaveRequests.filter(req => req.status === LeaveStatus.PENDING).length
                      }
                      title="Select/Deselect all PENDING requests"
                    />
                  )}
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Dates</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">Days</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reason</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Requested</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaveRequests.map(request => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="py-3 px-2">
                    {request.status === LeaveStatus.PENDING && (
                      <input 
                        type="checkbox"
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        checked={selectedRequestIds.has(request.id)}
                        onChange={(e) => handleCheckboxChange(request.id, e.target.checked)}
                      />
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">{request.userFirstName} {request.userLastName}</td>
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
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => openActionModal(request, 'approve')}
                          className={`p-1.5 text-green-500 hover:text-green-700 transition-colors`}
                          title="Approve Request"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => openActionModal(request, 'reject')}
                          className={`p-1.5 text-red-500 hover:text-red-700 transition-colors`}
                          title="Reject Request"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                     {(request.status === LeaveStatus.APPROVED || request.status === LeaveStatus.REJECTED) && request.adminNotes && (
                         <button 
                            onClick={() => { setCurrentRequest(request); setAdminNotes(request.adminNotes || ''); setIsModalOpen(true); setActionToPerform(null);}} 
                            className={`p-1.5 text-gray-500 hover:text-gray-700 transition-colors`}
                            title="View Admin Notes"
                        >
                            <PencilIcon className="h-5 w-5" />
                        </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Modal */}
      {isModalOpen && currentRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className={`bg-white p-6 rounded-lg shadow-xl w-full max-w-md`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-semibold text-${THEME.primary}`}>
                {actionToPerform ? `${actionToPerform.charAt(0).toUpperCase() + actionToPerform.slice(1)} Leave Request` : 'Leave Request Details'}
              </h3>
              <button onClick={closeActionModal} className={`text-gray-400 hover:text-gray-600`}>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="mb-4 space-y-1">
                <p><span className="font-semibold">Employee:</span> {currentRequest.userFirstName} {currentRequest.userLastName}</p>
                <p><span className="font-semibold">Type:</span> {currentRequest.leaveType}</p>
                <p><span className="font-semibold">Dates:</span> {formatDate(currentRequest.startDate)} to {formatDate(currentRequest.endDate)} ({calculateLeaveDays(currentRequest.startDate, currentRequest.endDate)} days)</p>
                <p><span className="font-semibold">Reason:</span> {currentRequest.reason}</p>
            </div>
            
            <div>
              <label htmlFor="adminNotes" className={`block text-sm font-medium text-${THEME.accentText}`}>
                Admin Notes {actionToPerform ? '(Optional)' : ''}
              </label>
              <textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`}
                readOnly={!actionToPerform && currentRequest.status !== LeaveStatus.PENDING} 
              />
            </div>
            {actionError && (
                <div className="mt-2 p-2 bg-red-100 border border-red-300 text-red-700 text-sm rounded-md">
                    {actionError}
                </div>
            )}
            {actionToPerform && (
                <div className="flex justify-end space-x-3 pt-4">
                    <button
                    type="button"
                    onClick={closeActionModal}
                    className={`px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none`}
                    >
                    Cancel
                    </button>
                    <button
                    type="button"
                    onClick={handleActionSubmit}
                    disabled={loading || isProcessingBulk}
                    className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${actionToPerform === 'approve' ? `bg-green-600 hover:bg-green-700` : `bg-red-600 hover:bg-red-700`} focus:outline-none disabled:opacity-50`}
                    >
                    {loading ? 'Processing...' : (actionToPerform === 'approve' ? 'Approve' : 'Reject')}
                    </button>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageLeaveRequests;