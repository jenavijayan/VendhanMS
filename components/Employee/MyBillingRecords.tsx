
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiFetchBillingRecords, apiFetchProjects } from '../../services/api'; // Added apiFetchProjects
import { BillingRecord, BillingStatus, Project } from '../../types'; // Removed EmployeeProjectBillingDetail as it's part of BillingRecord
import { THEME } from '../../constants';
import { CreditCardIcon, ChevronDownIcon, ChevronUpIcon, CalendarDaysIcon, BriefcaseIcon } from '@heroicons/react/24/outline'; // Removed CurrencyDollarIcon
import { formatDate } from '../../utils/dateUtils';

const MyBillingRecords: React.FC = () => {
  const { user } = useAuth();
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]); // To resolve project names if not in record
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  useEffect(() => {
    const loadBillingData = async () => {
      if (!user?.id) {
        setError("User not authenticated.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const [records, fetchedProjects] = await Promise.all([
            apiFetchBillingRecords({ userId: user.id }),
            apiFetchProjects()
        ]);
        setBillingRecords(records.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setProjects(fetchedProjects);
      } catch (err: any) {
        setError(err.message || 'Failed to load billing records or project data.');
      } finally {
        setLoading(false);
      }
    };
    loadBillingData();
  }, [user]);

  const getProjectName = (record: BillingRecord): string => {
    if (record.projectName) return record.projectName;
    const project = projects.find(p => p.id === record.projectId);
    return project?.name || 'N/A';
  };

  const formatCurrency = (amount?: number): string => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getStatusColor = (status: BillingStatus) => {
    switch (status) {
      case BillingStatus.PAID: return 'bg-green-100 text-green-800';
      case BillingStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
      case BillingStatus.OVERDUE: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleExpandRecord = (recordId: string) => {
    setExpandedRecordId(expandedRecordId === recordId ? null : recordId);
  };

  if (loading) {
    return (
      <div className={`p-6 bg-white rounded-xl shadow-lg text-center text-${THEME.accentText}`}>
        <svg className={`animate-spin h-8 w-8 text-${THEME.primary} mx-auto mb-2`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading your billing records...
      </div>
    );
  }

  if (error) {
    return <div className={`p-6 bg-red-100 text-red-700 rounded-xl shadow-lg`}>Error: {error}</div>;
  }

  return (
    <div className={`p-6 bg-white rounded-xl shadow-lg`}>
      <h2 className={`text-2xl font-semibold text-${THEME.primary} mb-6 flex items-center`}>
        <CreditCardIcon className="h-7 w-7 mr-2" />
        My Billing Records
      </h2>
      
      {billingRecords.length === 0 ? (
        <p className={`text-center text-gray-500 py-8`}>No billing records found for you yet.</p>
      ) : (
        <div className="space-y-4">
          {billingRecords.map(record => (
            <div key={record.id} className={`border border-gray-200 rounded-lg shadow-sm`}>
              <div 
                className={`p-4 flex justify-between items-center ${(record.details && record.details.length > 0) || record.attendanceSummary ? 'cursor-pointer hover:bg-gray-50' : ''}`} 
                onClick={() => (record.details && record.details.length > 0) || record.attendanceSummary ? toggleExpandRecord(record.id) : undefined}
                role={(record.details && record.details.length > 0) || record.attendanceSummary ? "button" : undefined}
                tabIndex={(record.details && record.details.length > 0) || record.attendanceSummary ? 0 : undefined}
                onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && ((record.details && record.details.length > 0) || record.attendanceSummary)) {
                        toggleExpandRecord(record.id);
                    }
                }}
                aria-expanded={expandedRecordId === record.id}
                aria-controls={`details-${record.id}`}
              >
                <div>
                  <p className="text-sm text-gray-500">
                    Billing Period: {record.billingPeriodStartDate ? `${formatDate(record.billingPeriodStartDate)} to ${formatDate(record.billingPeriodEndDate || record.date)}` : formatDate(record.date)}
                  </p>
                  <p className={`text-xl font-semibold text-${THEME.primary}`}>{formatCurrency(record.calculatedAmount)}</p>
                  <p className="text-sm text-gray-600">
                    {getProjectName(record)} - {record.clientName}
                  </p>
                   <span className={`mt-1 px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                </div>
                {((record.details && record.details.length > 0) || record.attendanceSummary) && (
                    expandedRecordId === record.id ? <ChevronUpIcon className={`h-6 w-6 text-${THEME.secondary}`} /> : <ChevronDownIcon className={`h-6 w-6 text-${THEME.secondary}`} />
                )}
              </div>

              {expandedRecordId === record.id && ((record.details && record.details.length > 0) || record.attendanceSummary) && (
                <div id={`details-${record.id}`} className="p-4 border-t border-gray-200 bg-gray-50">
                  {record.attendanceSummary && (
                    <div className="mb-4 p-3 border rounded-md bg-indigo-50">
                      <h4 className="text-sm font-semibold text-indigo-700 mb-1 flex items-center"><CalendarDaysIcon className="h-4 w-4 mr-1.5"/>Attendance Summary for Period:</h4>
                      <p className="text-xs text-indigo-600">Days Present: {record.attendanceSummary.daysPresent}</p>
                      <p className="text-xs text-indigo-600">Days on Leave (Approved): {record.attendanceSummary.daysOnLeave}</p>
                    </div>
                  )}
                  {record.details && record.details.length > 0 && (
                    <>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center"><BriefcaseIcon className="h-4 w-4 mr-1.5"/>Project Earnings Breakdown:</h4>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                        <thead className="bg-gray-100">
                            <tr>
                            <th className="py-1 px-2 text-left font-medium text-gray-600">Project</th>
                            <th className="py-1 px-2 text-left font-medium text-gray-600">Achieved</th>
                            <th className="py-1 px-2 text-left font-medium text-gray-600">Metric</th>
                            <th className="py-1 px-2 text-right font-medium text-gray-600">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {record.details.map(detail => (
                            <tr key={detail.projectId} className="border-b border-gray-200 last:border-b-0">
                                <td className="py-1 px-2 text-gray-600">{detail.projectName}</td>
                                <td className="py-1 px-2 text-gray-600">{detail.totalAchievedCount}</td>
                                <td className="py-1 px-2 text-gray-600">{detail.metricLabel}</td>
                                <td className="py-1 px-2 text-gray-600 text-right font-medium">{formatCurrency(detail.calculatedAmountForProject)}</td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                    </>
                  )}
                   {record.notes && (
                    <div className="mt-3 pt-2 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-600">Notes from Admin:</p>
                        <p className="text-xs text-gray-500 whitespace-pre-wrap">{record.notes}</p>
                    </div>
                  )}
                  {(!record.details || record.details.length === 0) && !record.attendanceSummary && (
                     <p className="text-xs text-gray-500 italic">Detailed breakdown (e.g., project summary, attendance for period) is not available for this record.</p>
                  )}
                </div>
              )}
               {/* Fallback display for older records or non-calculator generated ones which don't have the 'details' structure */}
               {!( (record.details && record.details.length > 0) || record.attendanceSummary ) && (
                 <div className="px-4 pb-2 text-xs text-gray-500">
                    {record.isCountBased ? (
                        <span>Achieved: {record.achievedCountTotal ?? 0} {record.countMetricLabelUsed || 'units'}</span>
                    ) : (
                        <span>Hours: {record.hoursBilled?.toFixed(2) || '0.00'} @ {formatCurrency(record.rateApplied || 0)}/hr</span>
                    )}
                     {record.notes && <span className="block mt-1">Notes: {record.notes}</span>}
                  </div>
               )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBillingRecords;