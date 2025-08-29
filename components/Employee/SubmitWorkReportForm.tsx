
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiSubmitDailyWorkReport, apiFetchProjects, apiGetDailyWorkReport } from '../../services/api';
import { Project, ProjectLogItemData, NewDailyWorkReportData } from '../../types';
import { THEME } from '../../constants';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const SubmitWorkReportForm: React.FC = () => {
  const { user } = useAuth();
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [projectLogs, setProjectLogs] = useState<ProjectLogItemData[]>([]);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProjects, setIsFetchingProjects] = useState(true);
  const [isFetchingReport, setIsFetchingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      setIsFetchingProjects(true);
      try {
        const projects = await apiFetchProjects();
        setAvailableProjects(projects);
      } catch (err: any) {
        setError(err.message || 'Failed to load projects.');
      } finally {
        setIsFetchingProjects(false);
      }
    };
    loadProjects();
  }, []);

  const fetchExistingReport = useCallback(async () => {
    if (!user || !date) return;
    setIsFetchingReport(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const existingReport = await apiGetDailyWorkReport(user.id, date);
      if (existingReport) {
        setProjectLogs(existingReport.projectLogs.map(log => ({
          projectId: log.projectId,
          hoursWorked: log.hoursWorked,
          description: log.description,
          achievedCount: log.achievedCount, // Ensure this is populated
        })));
        setSuccessMessage('Existing report loaded for this date. You can edit and resubmit.');
      } else {
        setProjectLogs([]); 
      }
    } catch (err: any) {
      setError('Failed to fetch existing report data.');
    } finally {
      setIsFetchingReport(false);
    }
  }, [user, date]);

  useEffect(() => {
    fetchExistingReport();
  }, [fetchExistingReport]);


  const addProjectLogEntry = () => {
    setProjectLogs([...projectLogs, { projectId: '', hoursWorked: 0, description: '', achievedCount: undefined }]);
  };

  const handleProjectLogChange = (index: number, field: keyof ProjectLogItemData, value: string | number | undefined) => {
    const updatedLogs = [...projectLogs];
    const currentLog = { ...updatedLogs[index] };

    if (field === 'hoursWorked' || field === 'achievedCount') {
      currentLog[field] = value === '' || value === undefined ? undefined : parseFloat(String(value));
    } else {
      currentLog[field] = String(value);
    }
    
    // If projectId changes, reset achievedCount if the new project is not count-based or has a different metric
    if (field === 'projectId') {
        const selectedProj = availableProjects.find(p => p.id === String(value));
        if (selectedProj?.billingType !== 'count_based') {
            currentLog.achievedCount = undefined;
        }
    }

    updatedLogs[index] = currentLog;
    setProjectLogs(updatedLogs);
  };

  const removeProjectLogEntry = (index: number) => {
    const updatedLogs = projectLogs.filter((_, i) => i !== index);
    setProjectLogs(updatedLogs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!user) {
      setError('User not found. Please log in again.');
      return;
    }
    if (projectLogs.length === 0) {
      setError('Please add at least one project entry.');
      return;
    }
    for (const log of projectLogs) {
      if (!log.projectId) {
        setError('Please select a project for all entries.');
        return;
      }
      const projectDetails = availableProjects.find(p => p.id === log.projectId);
      if (projectDetails?.billingType === 'count_based') {
        if (log.achievedCount === undefined || log.achievedCount < 0) {
          setError(`Please enter a valid ${projectDetails.countMetricLabel || 'count'} for project "${projectDetails.name}".`);
          return;
        }
      }
      if (log.hoursWorked < 0) {
         setError(`Hours worked cannot be negative for project "${projectDetails?.name || log.projectId}".`);
         return;
      }
    }

    setIsLoading(true);
    const reportData: NewDailyWorkReportData = {
      userId: user.id,
      date,
      projectLogs,
    };

    try {
      await apiSubmitDailyWorkReport(reportData);
      setSuccessMessage('Work report submitted successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to submit work report.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const inputBaseClasses = `mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm placeholder-gray-400`;
  const selectBaseClasses = `mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`;
  const buttonPrimaryClasses = `flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-${THEME.primaryText} bg-${THEME.primary} hover:bg-opacity-85 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.primary} disabled:opacity-50 transition duration-150 ease-in-out`;
  const buttonSecondaryClasses = `flex items-center justify-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.secondary} transition`;


  if (isFetchingProjects) {
    return (
      <div className={`p-6 bg-white rounded-xl shadow-lg text-center text-${THEME.accentText}`}>
        <svg className={`animate-spin h-8 w-8 text-${THEME.primary} mx-auto mb-2`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading projects...
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white rounded-xl shadow-lg max-w-3xl mx-auto`}>
      <h2 className={`text-2xl font-semibold text-${THEME.primary} mb-6`}>Submit Daily Work Report</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="reportDate" className={`block text-sm font-medium text-${THEME.accentText}`}>Date of Work</label>
          <input 
            type="date" 
            id="reportDate" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            className={inputBaseClasses}
            required 
          />
        </div>

        {isFetchingReport && <p className={`text-sm text-${THEME.accentText}`}>Loading report for selected date...</p>}

        {projectLogs.map((log, index) => {
          const selectedProjectDetails = availableProjects.find(p => p.id === log.projectId);
          return (
            <div key={index} className={`p-4 border border-gray-200 rounded-md space-y-3 relative bg-gray-50`}>
              <h3 className={`text-md font-medium text-${THEME.secondary}`}>Project Entry #{index + 1}</h3>
              {projectLogs.length > 0 && (
                  <button 
                      type="button" 
                      onClick={() => removeProjectLogEntry(index)}
                      className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700"
                      title="Remove this project entry"
                  >
                      <TrashIcon className="h-5 w-5" />
                  </button>
              )}
              <div>
                <label htmlFor={`project-${index}`} className={`block text-sm font-medium text-${THEME.accentText}`}>Project</label>
                <select 
                  id={`project-${index}`} 
                  value={log.projectId} 
                  onChange={(e) => handleProjectLogChange(index, 'projectId', e.target.value)} 
                  className={selectBaseClasses}
                  required
                >
                  <option value="" disabled>Select a project</option>
                  {availableProjects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
              
              {selectedProjectDetails?.billingType === 'count_based' && (
                <div>
                  <label htmlFor={`achievedCount-${index}`} className={`block text-sm font-medium text-${THEME.accentText}`}>
                    {selectedProjectDetails.countMetricLabel || 'Achieved Count'}
                  </label>
                  <input 
                    type="number" 
                    id={`achievedCount-${index}`} 
                    value={log.achievedCount === undefined ? '' : log.achievedCount}
                    onChange={(e) => handleProjectLogChange(index, 'achievedCount', e.target.value)} 
                    min="0" 
                    step="1" // Or allow decimals if needed
                    className={inputBaseClasses}
                    placeholder={`Enter ${selectedProjectDetails.countMetricLabel || 'count'}`}
                    required 
                  />
                </div>
              )}

              <div> {/* Hours worked can always be logged */}
                <label htmlFor={`hours-${index}`} className={`block text-sm font-medium text-${THEME.accentText}`}>Hours Worked</label>
                <input 
                  type="number" 
                  id={`hours-${index}`} 
                  value={log.hoursWorked === 0 && !log.projectId ? '' : log.hoursWorked} 
                  onChange={(e) => handleProjectLogChange(index, 'hoursWorked', e.target.value)} 
                  min="0" 
                  step="0.1" 
                  className={inputBaseClasses}
                  // Not strictly required if count-based has achievedCount, but good to have
                />
              </div>

              <div>
                <label htmlFor={`description-${index}`} className={`block text-sm font-medium text-${THEME.accentText}`}>Description / Tasks Completed</label>
                <textarea 
                  id={`description-${index}`} 
                  value={log.description} 
                  onChange={(e) => handleProjectLogChange(index, 'description', e.target.value)} 
                  rows={3} 
                  className={inputBaseClasses}
                  required
                />
              </div>
            </div>
          );
        })}

        <div>
          <button 
            type="button" 
            onClick={addProjectLogEntry} 
            className={`${buttonSecondaryClasses} w-full md:w-auto`}
            disabled={isFetchingProjects || availableProjects.length === 0}
          >
            <PlusIcon className="h-5 w-5 mr-1.5" />
            Add Another Project Entry
          </button>
           {availableProjects.length === 0 && !isFetchingProjects && (
            <p className="text-sm text-red-600 mt-2">No projects available to log time against. Please contact an administrator.</p>
          )}
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
            disabled={isLoading || isFetchingProjects || isFetchingReport || projectLogs.length === 0} 
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
            ) : 'Submit Work Report'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitWorkReportForm;
    