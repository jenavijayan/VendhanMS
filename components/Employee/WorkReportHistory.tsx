
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiFetchUserDailyWorkReports, apiFetchProjects } from '../../services/api';
import { DailyWorkReport, ProjectLogItem, Project } from '../../types';
import { THEME } from '../../constants';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';

const WorkReportHistory: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<DailyWorkReport[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setError('User not found. Please log in.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const [fetchedReports, fetchedProjects] = await Promise.all([
            apiFetchUserDailyWorkReports(user.id),
            apiFetchProjects()
        ]);
        setReports(fetchedReports);
        setProjects(fetchedProjects);
      } catch (err: any) {
        setError(err.message || 'Failed to load work report history or project data.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const toggleExpandReport = (reportId: string) => {
    setExpandedReportId(expandedReportId === reportId ? null : reportId);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };
   const formatSubmittedAt = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  };

  const getProjectDetails = (projectId: string): Project | undefined => {
    return projects.find(p => p.id === projectId);
  }


  if (loading) {
    return (
      <div className={`p-6 bg-white rounded-xl shadow-lg text-center text-${THEME.accentText}`}>
        <svg className={`animate-spin h-8 w-8 text-${THEME.primary} mx-auto mb-2`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading work report history...
      </div>
    );
  }

  if (error) {
    return <div className={`p-6 bg-red-100 text-red-700 rounded-xl shadow-lg`}>Error: {error}</div>;
  }

  return (
    <div className={`p-6 bg-white rounded-xl shadow-lg`}>
      <h2 className={`text-2xl font-semibold text-${THEME.primary} mb-6`}>Your Work Report History</h2>
      
      {reports.length === 0 ? (
        <p className={`text-center text-gray-500 py-8`}>No work reports found. Submit your first report!</p>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className={`border border-gray-200 rounded-lg shadow-sm`}>
              <button
                onClick={() => toggleExpandReport(report.id)}
                className={`w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 focus:outline-none ${expandedReportId === report.id ? `bg-${THEME.accent}` : ''}`}
              >
                <div>
                  <p className={`text-lg font-medium text-${THEME.primary}`}>{formatDate(report.date)}</p>
                  <p className={`text-xs text-gray-500`}>
                    Submitted: {formatSubmittedAt(report.submittedAt)} - {report.projectLogs.length} project entry(s)
                  </p>
                </div>
                {expandedReportId === report.id ? <ChevronUpIcon className={`h-6 w-6 text-${THEME.secondary}`} /> : <ChevronDownIcon className={`h-6 w-6 text-${THEME.secondary}`} />}
              </button>
              {expandedReportId === report.id && (
                <div className="p-4 border-t border-gray-200 bg-white">
                  {report.projectLogs.length > 0 ? (
                    <ul className="space-y-3">
                      {report.projectLogs.map((log) => {
                        const projectDetails = getProjectDetails(log.projectId);
                        return (
                            <li key={log.id} className="p-3 border rounded-md bg-gray-50">
                            <p className={`font-semibold text-${THEME.accentText}`}>{log.projectName}</p>
                            {log.hoursWorked > 0 && <p className="text-sm text-gray-600"><strong>Hours:</strong> {log.hoursWorked}</p>}
                            {projectDetails?.billingType === 'count_based' && log.achievedCount !== undefined && (
                                <p className="text-sm text-gray-600">
                                <strong>{projectDetails?.countMetricLabel || 'Achieved Count'}:</strong> {log.achievedCount}
                                </p>
                            )}
                            <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap"><strong>Description:</strong> {log.description}</p>
                            </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No project details logged for this day.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkReportHistory;
