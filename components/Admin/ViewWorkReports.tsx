
import React, { useState, useEffect, useCallback } from 'react';
import { apiFetchAllDailyWorkReports, apiFetchAllUsers, apiFetchProjects } from '../../services/api';
import { DailyWorkReport, User, Project, ProjectLogItem } from '../../types';
import { THEME } from '../../constants';
import { DocumentChartBarIcon, UserCircleIcon, BriefcaseIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/dateUtils';
import { exportToCSV } from '../../utils/csvExport';

const ViewWorkReports: React.FC = () => {
  const [workReports, setWorkReports] = useState<DailyWorkReport[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterUserId, setFilterUserId] = useState<string>('');
  const [filterProjectId, setFilterProjectId] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  const fetchInitialDataAndReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let currentUsers = users;
      let currentProjects = projects;

      if (currentUsers.length === 0) {
        currentUsers = await apiFetchAllUsers();
        setUsers(currentUsers);
      }
      if (currentProjects.length === 0) {
        currentProjects = await apiFetchProjects();
        setProjects(currentProjects);
      }
      
      const fetchedReports = await apiFetchAllDailyWorkReports({ 
        userId: filterUserId || undefined,
        projectId: filterProjectId || undefined,
        startDate: filterStartDate || undefined,
        endDate: filterEndDate || undefined,
      });
      setWorkReports(fetchedReports);

    } catch (err: any) {
      setError(err.message || 'Failed to load work report data.');
    } finally {
      setLoading(false);
    }
  }, [filterUserId, filterProjectId, filterStartDate, filterEndDate, users, projects]); // users and projects are dependencies

  useEffect(() => {
    fetchInitialDataAndReports();
  }, [fetchInitialDataAndReports]); // fetchInitialDataAndReports will change when filters change OR users/projects change

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
  };

  const getUserProfilePic = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.profilePictureUrl;
  };
  
  const handleExportCSV = () => {
    if (workReports.length === 0) {
      alert("No data to export.");
      return;
    }
    const dataToExport: any[] = [];
    workReports.forEach(report => {
        report.projectLogs.forEach(log => {
            const projectDetails = projects.find(p => p.id === log.projectId);
            dataToExport.push({
                Date: formatDate(report.date),
                Employee: getUserName(report.userId),
                Project: log.projectName,
                HoursWorked: log.hoursWorked.toFixed(2),
                AchievedCount: projectDetails?.billingType === 'count_based' ? (log.achievedCount ?? 'N/A') : 'N/A',
                Metric: projectDetails?.billingType === 'count_based' ? (projectDetails?.countMetricLabel ?? 'Units') : 'N/A',
                Description: log.description,
                SubmittedAt: new Date(report.submittedAt).toLocaleString(),
            });
        });
    });
    exportToCSV(dataToExport, `work_reports_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const inputBaseClasses = `mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`;
  const selectBaseClasses = `mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`;
  const buttonPrimaryClasses = `flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-${THEME.primaryText} bg-${THEME.primary} hover:bg-opacity-85 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.primary} disabled:opacity-50 transition`;

  return (
    <div className={`p-6 bg-white rounded-xl shadow-lg`}>
      <h2 className={`text-2xl font-semibold text-${THEME.primary} mb-6 flex items-center`}>
        <DocumentChartBarIcon className="h-7 w-7 mr-2" />
        Employee Work Reports
      </h2>

      <div className="mb-6 p-4 border rounded-md bg-gray-50 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label htmlFor="userFilter" className={`block text-sm font-medium text-${THEME.accentText}`}>Employee</label>
              <select id="userFilter" value={filterUserId} onChange={e => setFilterUserId(e.target.value)} className={selectBaseClasses}>
                <option value="">All Employees</option>
                {users.map(user => <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="projectFilter" className={`block text-sm font-medium text-${THEME.accentText}`}>Project</label>
              <select id="projectFilter" value={filterProjectId} onChange={e => setFilterProjectId(e.target.value)} className={selectBaseClasses}>
                <option value="">All Projects</option>
                {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="startDateFilter" className={`block text-sm font-medium text-${THEME.accentText}`}>Start Date</label>
              <input type="date" id="startDateFilter" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className={inputBaseClasses} />
            </div>
            <div>
              <label htmlFor="endDateFilter" className={`block text-sm font-medium text-${THEME.accentText}`}>End Date</label>
              <input type="date" id="endDateFilter" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className={inputBaseClasses} />
            </div>
        </div>
        <button onClick={fetchInitialDataAndReports} className={`${buttonPrimaryClasses} w-full sm:w-auto mt-2 sm:mt-0`}>Apply Filters</button>
      </div>


      {error && <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded-md"><p>{error}</p></div>}
      
      <div className="flex justify-end mb-4">
        <button
            onClick={handleExportCSV}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50`}
            disabled={workReports.length === 0 || loading}
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
            Loading work reports...
        </div>
      ) : workReports.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No work reports found matching your criteria.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className={`bg-gray-50 border-b-2 border-${THEME.primary}`}>
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Project</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Hours</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Achieved Count</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {workReports.map(report => 
                report.projectLogs.map((log, index) => {
                  const projectDetails = projects.find(p => p.id === log.projectId);
                  return (
                    <tr key={`${report.id}-${log.id}`} className="hover:bg-gray-50">
                      {index === 0 && (
                        <>
                          <td rowSpan={report.projectLogs.length} className="py-3 px-4 text-sm text-gray-700 align-top border-r">{formatDate(report.date)}</td>
                          <td rowSpan={report.projectLogs.length} className="py-3 px-4 text-sm text-gray-700 align-top border-r">
                            <div className="flex items-center">
                                {getUserProfilePic(report.userId) ? (
                                    <img src={getUserProfilePic(report.userId)!} alt={getUserName(report.userId)} className="w-7 h-7 rounded-full object-cover mr-2" />
                                ) : (
                                    <UserCircleIcon className="w-7 h-7 text-gray-400 mr-2" />
                                )}
                                {getUserName(report.userId)}
                            </div>
                          </td>
                        </>
                      )}
                      <td className="py-3 px-4 text-sm text-gray-700">
                        <div className="flex items-center">
                            <BriefcaseIcon className="h-4 w-4 mr-1.5 text-gray-400"/>
                            {log.projectName}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">{log.hoursWorked.toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {projectDetails?.billingType === 'count_based' ? (log.achievedCount ?? 'N/A') : <span className="text-xs italic text-gray-400">N/A</span>}
                        {projectDetails?.billingType === 'count_based' && <span className="ml-1 text-xs text-gray-500">{projectDetails.countMetricLabel}</span>}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 whitespace-pre-wrap max-w-md" title={log.description}>{log.description}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ViewWorkReports;
