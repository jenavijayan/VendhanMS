import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
    apiFetchAllLeaveRequests, 
    apiFetchUserDailyWorkReports, 
    apiFetchAllDailyWorkReports, 
    apiFetchCompanyEvents,
    apiFetchAllUsers,
    apiFetchUserLeaveRequests
} from '../services/api';
import { UIMappedEvent, LeaveRequest, DailyWorkReport, CompanyEvent, User, LeaveStatus, UserRole } from '../types';
import { THEME } from '../constants';
import { calculateLeaveDays } from '../utils/dateUtils';
import { ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

const CalendarPage: React.FC = () => {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>(''); // For admin filter
    const [mappedEvents, setMappedEvents] = useState<UIMappedEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isAdmin = user?.role === UserRole.ADMIN;

    const mapDataToEvents = useCallback((
        leaves: LeaveRequest[],
        reports: DailyWorkReport[],
        companyEvents: CompanyEvent[],
        usersMap: Map<string, User>
    ): UIMappedEvent[] => {
        const events: UIMappedEvent[] = [];

        // Map Company Events & Holidays
        companyEvents.forEach(event => {
            events.push({
                id: `ce-${event.id}`,
                title: event.title,
                date: event.date,
                type: event.isHoliday ? 'holiday' : 'event',
                color: event.isHoliday ? 'blue' : 'purple',
                data: event
            });
        });
        
        // Map Approved Leave
        leaves.forEach(leave => {
            if (leave.status === LeaveStatus.APPROVED) {
                const leaveDays = calculateLeaveDays(leave.startDate, leave.endDate);
                const userName = usersMap.get(leave.userId)?.firstName || 'User';
                for (let i = 0; i < leaveDays; i++) {
                    const eventDate = new Date(leave.startDate);
                    eventDate.setUTCDate(eventDate.getUTCDate() + i);
                    events.push({
                        id: `l-${leave.id}-${i}`,
                        title: `${userName}'s Leave`,
                        date: eventDate.toISOString().split('T')[0],
                        type: 'leave',
                        color: 'red',
                        data: leave
                    });
                }
            }
        });
        
        // Map Work Reports (only for selected user or current employee)
        reports.forEach(report => {
            events.push({
                id: `wr-${report.id}`,
                title: 'Report Submitted',
                date: report.date,
                type: 'work_report',
                color: 'green',
                data: report
            });
        });

        return events;

    }, []);

    const fetchDataForMonth = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const firstDayOfMonth = new Date(year, month, 1).toISOString().split('T')[0];
            const lastDayOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0];

            let leavesPromise;
            let reportsPromise;
            let usersPromise;
            
            if (isAdmin) {
                leavesPromise = apiFetchAllLeaveRequests({ startDate: firstDayOfMonth, endDate: lastDayOfMonth });
                // Only fetch reports if a specific user is selected to avoid overload
                reportsPromise = selectedUserId ? apiFetchUserDailyWorkReports(selectedUserId, { startDate: firstDayOfMonth, endDate: lastDayOfMonth }) : Promise.resolve([]);
                usersPromise = allUsers.length > 0 ? Promise.resolve(allUsers) : apiFetchAllUsers();
            } else {
                leavesPromise = apiFetchUserLeaveRequests(user!.id); // Fetches all, can be filtered client-side
                reportsPromise = apiFetchUserDailyWorkReports(user!.id, { startDate: firstDayOfMonth, endDate: lastDayOfMonth });
                usersPromise = Promise.resolve([user!]);
            }
            
            const companyEventsPromise = apiFetchCompanyEvents();

            const [leaves, reports, companyEvents, users] = await Promise.all([
                leavesPromise, reportsPromise, companyEventsPromise, usersPromise
            ]);

            if (allUsers.length === 0) setAllUsers(users);

            const usersMap: Map<string, User> = new Map(users.map(u => [u.id, u]));

            const filteredLeaves = leaves.filter(l => {
                const leaveEnd = new Date(l.startDate);
                const leaveStart = new Date(l.endDate);
                return leaveEnd.getFullYear() === year && leaveEnd.getMonth() === month ||
                       leaveStart.getFullYear() === year && leaveStart.getMonth() === month ||
                       (leaveStart.getTime() < new Date(firstDayOfMonth).getTime() && leaveEnd.getTime() > new Date(lastDayOfMonth).getTime());
            });

            setMappedEvents(mapDataToEvents(filteredLeaves, reports, companyEvents, usersMap));
        } catch (err: any) {
            setError(err.message || 'Failed to load calendar data.');
        } finally {
            setLoading(false);
        }
    }, [currentDate, user, isAdmin, selectedUserId, mapDataToEvents, allUsers]);

    useEffect(() => {
        fetchDataForMonth();
    }, [fetchDataForMonth]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const renderCalendarGrid = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];

        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`pad-${i}`} className="border p-2 bg-gray-50"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = mappedEvents.filter(e => e.date === dayString);
            const isToday = new Date().toISOString().split('T')[0] === dayString;

            days.push(
                <div key={day} className={`border p-2 min-h-[120px] relative ${isToday ? 'bg-theme-accent' : 'bg-white'}`}>
                    <span className={`text-sm font-semibold ${isToday ? `text-white bg-${THEME.primary} rounded-full h-6 w-6 flex items-center justify-center` : 'text-gray-700'}`}>{day}</span>
                    <div className="mt-1 space-y-1">
                        {dayEvents.map(event => {
                             if(event.type === 'work_report'){
                                return <CheckCircleIcon key={event.id} className="h-5 w-5 text-green-500" title="Work Report Submitted"/>
                             }
                             return (
                                <div key={event.id} className={`text-xs p-1 rounded-md text-white bg-${event.color}-500 truncate`} title={event.title}>
                                    {event.title}
                                </div>
                             )
                        })}
                    </div>
                </div>
            );
        }
        return days;
    };
    
    const colorMapping: Record<UIMappedEvent['type'], {label: string, color: string}> = {
        leave: { label: "On Leave", color: `bg-red-500` },
        holiday: { label: "Holiday", color: `bg-blue-500` },
        event: { label: "Company Event", color: `bg-purple-500` },
        work_report: { label: "Report Submitted", color: `bg-green-500` },
    };

    return (
        <div className={`p-6 bg-white rounded-xl shadow-lg`}>
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <div className="flex items-center">
                    <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-200"><ChevronLeftIcon className="h-6 w-6" /></button>
                    <h2 className={`text-2xl font-semibold text-${THEME.primary} w-48 text-center`}>
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-200"><ChevronRightIcon className="h-6 w-6" /></button>
                </div>
                {isAdmin && (
                    <div className="flex-grow md:flex-grow-0 md:w-64">
                         <label htmlFor="userFilter" className={`block text-xs font-medium text-${THEME.accentText}`}>Filter by Employee</label>
                        <select
                            id="userFilter"
                            value={selectedUserId}
                            onChange={e => setSelectedUserId(e.target.value)}
                            className={`mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`}
                        >
                            <option value="">All Employees (Leave Only)</option>
                            {allUsers.filter(u => u.role === UserRole.EMPLOYEE).map(u => (
                                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                            ))}
                        </select>
                         <p className="text-xs text-gray-500 mt-1">Select an employee to see their submitted work reports.</p>
                    </div>
                )}
            </div>
             <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
                {Object.values(colorMapping).map(item => (
                    <div key={item.label} className="flex items-center">
                        <span className={`h-4 w-4 rounded-full ${item.color} mr-2`}></span>
                        <span className="text-sm text-gray-600">{item.label}</span>
                    </div>
                ))}
            </div>

            {loading ? (
                 <div className="text-center py-16">
                    <svg className={`animate-spin h-8 w-8 text-${THEME.primary} mx-auto mb-2`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading calendar data...
                </div>
            ) : error ? (
                <div className="p-4 bg-red-100 text-red-700 rounded-md">{error}</div>
            ) : (
                <>
                    <div className="grid grid-cols-7 gap-px bg-gray-200 border">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center font-medium text-sm py-2 bg-gray-100 text-gray-600">{day}</div>
                        ))}
                        {renderCalendarGrid()}
                    </div>
                </>
            )}
        </div>
    );
};

export default CalendarPage;