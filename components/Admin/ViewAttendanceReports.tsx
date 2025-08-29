
import React, { useState, useEffect, useCallback } from 'react';
import { apiFetchAllAttendanceRecords, apiFetchAllUsers } from '../../services/api';
import { AttendanceRecord, User } from '../../types';
import { THEME } from '../../constants';
import { ClockIcon, UserCircleIcon,ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { formatDate, formatTime, calculateDuration } from '../../utils/dateUtils';
import { exportToCSV } from '../../utils/csvExport';

const ViewAttendanceReports: React.FC = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterUserId, setFilterUserId] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  const fetchUsersAndRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch users only once or if users array is empty
      let currentUsers = users;
      if (currentUsers.length === 0) {
          currentUsers = await apiFetchAllUsers();
          setUsers(currentUsers);
      }

      const fetchedRecords = await apiFetchAllAttendanceRecords({ 
        userId: filterUserId || undefined,
        startDate: filterStartDate || undefined,
        endDate: filterEndDate || undefined,
      });
      setAttendanceRecords(fetchedRecords);
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance data.');
    } finally {
      setLoading(false);
    }
  }, [filterUserId, filterStartDate, filterEndDate, users]); // users is a dependency here

  useEffect(() => {
    // Initial fetch or fetch when filters change
    fetchUsersAndRecords();
  }, [fetchUsersAndRecords]); // This will run once on mount due to users being initially empty

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
  };
  
  const getUserProfilePic = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.profilePictureUrl;
  };

  const handleExportCSV = () => {
    if (attendanceRecords.length === 0) {
      alert("No data to export.");
      return;
    }
    const dataToExport = attendanceRecords.map(record => ({
      Date: formatDate(record.date),
      Employee: getUserName(record.userId),
      ClockIn: formatTime(record.clockInTime),
      ClockOut: record.clockOutTime ? formatTime(record.clockOutTime) : 'N/A (Still Clocked In)',
      TotalHours: record.totalHours !== undefined ? record.totalHours.toFixed(2) : (record.clockOutTime ? calculateDuration(record.clockInTime, record.clockOutTime) : 'Ongoing'),
      Notes: record.notes || '',
    }));
    exportToCSV(dataToExport, `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
  };
  
  const inputBaseClasses = `mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`;
  const selectBaseClasses = `mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`;
  const buttonPrimaryClasses = `flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-${THEME.primaryText} bg-${THEME.primary} hover:bg-opacity-85 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.primary} disabled:opacity-50 transition`;


  return (
    <div className={`p-6 bg-white rounded-xl shadow-lg`}>
      <h2 className={`text-2xl font-semibold text-${THEME.primary} mb-6 flex items-center`}>
        <ClockIcon className="h-7 w-7 mr-2" />
        Employee Attendance Reports
      </h2>

      <div className="mb-6 p-4 border rounded-md bg-gray-50 space-y-4 sm:space-y-0 sm:flex sm:items-end sm:space-x-4">
        <div className="flex-1 min-w-[150px]">
          <label htmlFor="userFilter" className={`block text-sm font-medium text-${THEME.accentText}`}>Employee</label>
          <select id="userFilter" value={filterUserId} onChange={e => setFilterUserId(e.target.value)} className={selectBaseClasses}>
            <option value="">All Employees</option>
            {users.map(user => <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label htmlFor="startDateFilter" className={`block text-sm font-medium text-${THEME.accentText}`}>Start Date</label>
          <input type="date" id="startDateFilter" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className={inputBaseClasses} />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label htmlFor="endDateFilter" className={`block text-sm font-medium text-${THEME.accentText}`}>End Date</label>
          <input type="date" id="endDateFilter" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className={inputBaseClasses} />
        </div>
        <button onClick={fetchUsersAndRecords} className={`${buttonPrimaryClasses} w-full sm:w-auto`}>Apply Filters</button>
      </div>

      {error && <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded-md"><p>{error}</p></div>}
      
      <div className="flex justify-end mb-4">
        <button
            onClick={handleExportCSV}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50`}
            disabled={attendanceRecords.length === 0 || loading}
        >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Export to CSV
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
            <svg className={`animate-spin h-8 w-8 text-${THEME.primary} mx-auto mb-2`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading attendance records...
        </div>
      ) : attendanceRecords.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No attendance records found matching your criteria.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className={`bg-gray-50 border-b-2 border-${THEME.primary}`}>
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Clock In</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Clock Out</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Hours</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {attendanceRecords.map(record => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-700">{formatDate(record.date)}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    <div className="flex items-center">
                        {getUserProfilePic(record.userId) ? (
                            <img src={getUserProfilePic(record.userId)!} alt={getUserName(record.userId)} className="w-7 h-7 rounded-full object-cover mr-2" />
                        ) : (
                            <UserCircleIcon className="w-7 h-7 text-gray-400 mr-2" />
                        )}
                        {getUserName(record.userId)}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">{formatTime(record.clockInTime)}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {record.clockOutTime ? formatTime(record.clockOutTime) : <span className="text-xs italic text-gray-500">Still Clocked In</span>}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {record.totalHours !== undefined 
                      ? record.totalHours.toFixed(2) 
                      : (record.clockOutTime ? calculateDuration(record.clockInTime, record.clockOutTime) : <span className="text-xs italic text-gray-500">Ongoing</span>)
                    }
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500 max-w-xs truncate" title={record.notes}>{record.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ViewAttendanceReports;
