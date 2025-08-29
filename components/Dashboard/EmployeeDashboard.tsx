

import React, { useState, useEffect, useCallback } from 'react';
import { fetchEmployeeDashboardData, apiClockIn, apiClockOut, apiGetUserTodayAttendanceStatus, apiFetchAllAttendanceRecords } from '../../services/api';
import { EmployeeDashboardData, UserAttendanceStatus } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { THEME, POSITIVE_MESSAGES } from '../../constants';
import { PhoneIcon, BuildingOfficeIcon, CalendarDaysIcon, CogIcon, ClockIcon as HeroClockIcon, PlayCircleIcon, StopCircleIcon, DocumentPlusIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { getCurrentDateTime, formatTime, calculateDuration } from '../../utils/dateUtils';


interface InfoCardProps {
  label: string;
  value?: string;
  icon: React.ReactNode;
}

const InfoCard: React.FC<InfoCardProps> = ({ label, value, icon }) => (
  <div className={`bg-white p-4 rounded-lg shadow flex items-start space-x-3`}>
    <div className={`p-2 rounded-full bg-${THEME.accent} text-${THEME.primary}`}>
      {icon}
    </div>
    <div>
      <p className={`text-xs text-gray-500`}>{label}</p>
      <p className={`text-md font-semibold text-${THEME.accentText}`}>{value || 'N/A'}</p>
    </div>
  </div>
);


const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<EmployeeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [positiveMessage, setPositiveMessage] = useState<string>('');

  // Attendance State
  const [attendanceStatus, setAttendanceStatus] = useState<UserAttendanceStatus | null>(null);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(getCurrentDateTime());
  const [sessionDuration, setSessionDuration] = useState<string>("0h 0m");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentDateTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (attendanceStatus?.isClockedIn && attendanceStatus.lastClockInTime) {
      const interval = setInterval(() => {
        setSessionDuration(calculateDuration(attendanceStatus.lastClockInTime!));
      }, 1000); // Update duration every second
      return () => clearInterval(interval);
    } else {
      setSessionDuration("0h 0m"); // Reset if not clocked in
    }
  }, [attendanceStatus]);


  const fetchAttendanceStatus = useCallback(async () => {
    if (!user?.id) return;
    setIsAttendanceLoading(true);
    setAttendanceError(null);
    try {
      const status = await apiGetUserTodayAttendanceStatus(user.id);
      setAttendanceStatus(status);
      if (status.isClockedIn && status.lastClockInTime) {
        setSessionDuration(calculateDuration(status.lastClockInTime));
      } else {
         // Check if there was a previous session today to show its duration
        const todayRecords = (await apiFetchAllAttendanceRecords({userId: user.id, date: new Date().toISOString().split('T')[0]})); 
        const lastCompletedSession = todayRecords.filter(r => r.clockOutTime).sort((a,b) => new Date(b.clockOutTime!).getTime() - new Date(a.clockOutTime!).getTime())[0];
        if (lastCompletedSession && lastCompletedSession.totalHours) {
            const hours = Math.floor(lastCompletedSession.totalHours);
            const minutes = Math.round((lastCompletedSession.totalHours - hours) * 60);
            setSessionDuration(`${hours}h ${minutes}m`); // Display last completed session duration
        } else {
            setSessionDuration("0h 0m");
        }
      }
    } catch (err: any) {
      setAttendanceError(err.message || 'Failed to fetch attendance status.');
    } finally {
      setIsAttendanceLoading(false);
    }
  }, [user?.id]);


  useEffect(() => {
    const loadData = async () => {
      if (user?.id) {
        setLoading(true);
        setError(null);
        try {
          const employeeDataPromise = fetchEmployeeDashboardData(user.id);
          const attendanceStatusPromise = apiGetUserTodayAttendanceStatus(user.id);
          
          const [employeeData, status] = await Promise.all([employeeDataPromise, attendanceStatusPromise]);
          
          setData(employeeData);
          setAttendanceStatus(status);
          if (status.isClockedIn && status.lastClockInTime) {
            setSessionDuration(calculateDuration(status.lastClockInTime));
          } else {
             const todayRecords = (await apiFetchAllAttendanceRecords({userId: user.id, date: new Date().toISOString().split('T')[0]}));
             const lastCompletedSession = todayRecords.filter(r => r.clockOutTime).sort((a,b) => new Date(b.clockOutTime!).getTime() - new Date(a.clockOutTime!).getTime())[0];
             if (lastCompletedSession && lastCompletedSession.totalHours) {
                 const hours = Math.floor(lastCompletedSession.totalHours);
                 const minutes = Math.round((lastCompletedSession.totalHours - hours) * 60);
                 setSessionDuration(`${hours}h ${minutes}m`);
             } else {
                 setSessionDuration("0h 0m");
             }
          }

        } catch (err: any) {
          setError(err.message || 'Failed to load dashboard data.');
        } finally {
          setLoading(false);
          setIsAttendanceLoading(false); // Combined loading state
        }
      } else {
        setError('User ID not found.');
        setLoading(false);
      }
    };
    loadData();

    if (POSITIVE_MESSAGES.length > 0) {
      const randomIndex = Math.floor(Math.random() * POSITIVE_MESSAGES.length);
      setPositiveMessage(POSITIVE_MESSAGES[randomIndex]);
    }

  }, [user]);

  const handleClockIn = async () => {
    if (!user?.id) return;
    setIsAttendanceLoading(true);
    setAttendanceError(null);
    try {
      await apiClockIn(user.id);
      await fetchAttendanceStatus(); // Refresh status
    } catch (err: any) {
      setAttendanceError(err.message || 'Clock-in failed.');
    } finally {
      setIsAttendanceLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!user?.id) return;
    setIsAttendanceLoading(true);
    setAttendanceError(null);
    try {
      await apiClockOut(user.id);
      await fetchAttendanceStatus(); // Refresh status
    } catch (err: any) {
      setAttendanceError(err.message || 'Clock-out failed.');
    } finally {
      setIsAttendanceLoading(false);
    }
  };


  if (loading) {
    return <div className={`text-center p-10 text-${THEME.accentText}`}>Loading employee data...</div>;
  }

  if (error) {
    return <div className={`text-center p-10 text-red-600`}>Error: {error}</div>;
  }

  if (!data) {
    return <div className={`text-center p-10 text-${THEME.accentText}`}>No data available.</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className={`text-3xl font-semibold text-${THEME.primary}`}>Welcome, {user?.firstName || user?.username}!</h2>
      {positiveMessage && (
        <p className={`text-lg text-${THEME.secondary} -mt-2 mb-4`}>{positiveMessage}</p>
      )}

      {/* Attendance Clock Widget */}
      <div className={`p-6 bg-white rounded-xl shadow-lg`}>
        <h3 className={`text-xl font-semibold text-${THEME.accentText} mb-2`}>Attendance Clock</h3>
        <div className={`text-sm text-gray-600 mb-1`}>{currentTime.date}</div>
        <div className={`text-3xl font-mono font-bold text-${THEME.primary} mb-4`}>{currentTime.time}</div>

        {isAttendanceLoading && <p className={`text-sm text-${THEME.accentText}`}>Updating status...</p>}
        {attendanceError && <p className={`text-sm text-red-600`}>{attendanceError}</p>}
        
        {attendanceStatus && !isAttendanceLoading && (
          <div className="space-y-3">
            {attendanceStatus.isClockedIn ? (
              <>
                <p className={`text-green-600 font-semibold`}>You are CLOCKED IN.</p>
                <p className={`text-xs text-gray-500`}>Clocked in at: {formatTime(attendanceStatus.lastClockInTime)}</p>
                <p className={`text-sm text-${THEME.secondary}`}>Current Session: {sessionDuration}</p>
                <button
                  onClick={handleClockOut}
                  disabled={isAttendanceLoading}
                  className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition`}
                >
                  <StopCircleIcon className="h-5 w-5 mr-2" />
                  Clock Out
                </button>
              </>
            ) : (
              <>
                <p className={`text-red-600 font-semibold`}>You are CLOCKED OUT.</p>
                {attendanceStatus.lastClockInTime && ( // Implies a previous session today
                     <p className={`text-sm text-${THEME.secondary}`}>Last Session: {sessionDuration}</p>
                )}
                <button
                  onClick={handleClockIn}
                  disabled={isAttendanceLoading}
                  className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition`}
                >
                  <PlayCircleIcon className="h-5 w-5 mr-2" />
                  Clock In
                </button>
              </>
            )}
          </div>
        )}
      </div>
      
      <div className={`p-6 bg-white rounded-xl shadow-lg`}>
        <h3 className={`text-xl font-semibold text-${THEME.accentText} mb-4`}>Your Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoCard label="Phone" value={data.personalInfo.phone} icon={<PhoneIcon className="h-5 w-5"/>} />
            <InfoCard label="Department" value={data.personalInfo.department} icon={<BuildingOfficeIcon className="h-5 w-5"/>} />
            <InfoCard label="Join Date" value={data.personalInfo.joinDate} icon={<CalendarDaysIcon className="h-5 w-5"/>} />
        </div>
         <Link to="/app/employee/profile">
            <button className={`mt-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-${THEME.secondaryText} bg-${THEME.secondary} hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.secondary}`}>
                <CogIcon className="h-4 w-4 mr-1.5" />
                View/Edit Profile
            </button>
        </Link>
      </div>

      <div className={`p-6 bg-white rounded-xl shadow-lg`}>
        <h3 className={`text-xl font-semibold text-${THEME.accentText} mb-4`}>Quick Actions</h3>
        <div className="space-y-3">
          <Link to="/app/employee/submit-report" className={`flex items-center w-full text-left p-3 bg-${THEME.accent} text-${THEME.accentText} rounded-md hover:bg-gray-200 transition duration-150`}>
             <DocumentPlusIcon className="h-5 w-5 mr-3" />
            Submit Daily Work Report
          </Link>
          <Link to="/app/employee/apply-leave" className={`flex items-center w-full text-left p-3 bg-${THEME.accent} text-${THEME.accentText} rounded-md hover:bg-gray-200 transition duration-150`}>
             <CalendarDaysIcon className="h-5 w-5 mr-3" />
            Apply for Leave
          </Link>
          <Link to="/app/employee/training" className={`flex items-center w-full text-left p-3 bg-${THEME.accent} text-${THEME.accentText} rounded-md hover:bg-gray-200 transition duration-150`}>
            <AcademicCapIcon className="h-5 w-5 mr-3" />
            Training Center
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;