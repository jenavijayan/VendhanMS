
import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import { 
    apiFetchProjects, 
    apiFetchAllUsers, 
    apiFetchUserDailyWorkReports, 
    apiFetchAllLeaveRequests,
    apiFetchAllAttendanceRecords,
    apiAddBillingRecord, 
    apiSendInternalMessage 
} from '../../services/api';
import { 
    Project, 
    User, 
    BillingStatus, 
    EmployeePeriodBillingSummary, 
    NewCalculatedBillingRecordData, 
    EmployeeProjectBillingDetail,
    DailyWorkReport,
    LeaveRequest,
    LeaveStatus,
    AttendanceRecord,
    UserRole
} from '../../types';
import { THEME } from '../../constants';
import { UserCircleIcon, CalculatorIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { formatDate, calculateLeaveDays } from '../../utils/dateUtils';

const AdminBillingCalculator: React.FC = () => {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allEmployees, setAllEmployees] = useState<User[]>([]);
  
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  const [calculatedSummaries, setCalculatedSummaries] = useState<EmployeePeriodBillingSummary[]>([]);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingInitialData(true);
      setError(null);
      try {
        const [fetchedProjects, fetchedUsers] = await Promise.all([
          apiFetchProjects(),
          apiFetchAllUsers()
        ]);
        setAllProjects(fetchedProjects.filter(p => p.billingType === 'count_based')); 
        setAllEmployees(fetchedUsers.filter(u => u.role === UserRole.EMPLOYEE)); 
      } catch (err: any) {
        setError(err.message || 'Failed to load initial projects and users.');
      } finally {
        setIsLoadingInitialData(false);
      }
    };
    loadInitialData();
  }, []);

  const handleCalculateBilling = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setCalculatedSummaries([]);
    setExpandedUserId(null);

    if (!startDate || !endDate) {
      setError('Please select both a Start Date and an End Date.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
        setError('Start Date cannot be after End Date.');
        return;
    }

    setIsCalculating(true);
    const newSummaries: EmployeePeriodBillingSummary[] = [];

    try {
      for (const user of allEmployees) {
        const userWorkReportsPromise = apiFetchUserDailyWorkReports(user.id, { startDate, endDate });
        const userLeaveRequestsPromise = apiFetchAllLeaveRequests({ 
            userId: user.id, 
            status: LeaveStatus.APPROVED, 
            startDate, 
            endDate 
        });
        const userAttendanceRecordsPromise = apiFetchAllAttendanceRecords({ userId: user.id, startDate, endDate });
        
        const [userWorkReports, userLeaveRequests, userAttendanceRecords] = await Promise.all([
            userWorkReportsPromise, userLeaveRequestsPromise, userAttendanceRecordsPromise
        ]);
        
        const presentDates = new Set<string>();
        userAttendanceRecords.forEach(att => {
            if (att.clockInTime) presentDates.add(att.date);
        });
        const daysPresent = presentDates.size;

        let daysOnLeave = 0;
        userLeaveRequests.forEach(leave => {
            const leaveStart = new Date(leave.startDate + "T00:00:00.000Z"); 
            const leaveEnd = new Date(leave.endDate + "T23:59:59.999Z"); 
            const periodStart = new Date(startDate + "T00:00:00.000Z");
            const periodEnd = new Date(endDate + "T23:59:59.999Z");

            const overlapStartMs = Math.max(leaveStart.getTime(), periodStart.getTime());
            const overlapEndMs = Math.min(leaveEnd.getTime(), periodEnd.getTime());

            if (overlapStartMs <= overlapEndMs) {
                const overlapStartDate = new Date(overlapStartMs).toISOString().split('T')[0];
                const overlapEndDate = new Date(overlapEndMs).toISOString().split('T')[0];
                daysOnLeave += calculateLeaveDays(overlapStartDate, overlapEndDate);
            }
        });

        const projectDetailsMap = new Map<string, EmployeeProjectBillingDetail>();
        let userGrandTotal = 0;

        userWorkReports.forEach(report => {
          report.projectLogs.forEach(log => {
            const project = allProjects.find(p => p.id === log.projectId);
            if (project && log.achievedCount !== undefined && log.achievedCount > 0) {
              const currentDetail = projectDetailsMap.get(project.id) || {
                projectId: project.id,
                projectName: project.name,
                totalAchievedCount: 0,
                metricLabel: project.countMetricLabel || 'Units',
                formulaApplied: `(Achieved / ${project.countDivisor || 1}) * ${project.countMultiplier || 0}`,
                calculatedAmountForProject: 0,
              };
              
              currentDetail.totalAchievedCount += log.achievedCount;
              currentDetail.calculatedAmountForProject = (currentDetail.totalAchievedCount / (project.countDivisor || 1)) * (project.countMultiplier || 0);
              projectDetailsMap.set(project.id, currentDetail);
            }
          });
        });
        
        const finalProjectDetails: EmployeeProjectBillingDetail[] = [];
        projectDetailsMap.forEach(detail => {
            detail.calculatedAmountForProject = parseFloat(detail.calculatedAmountForProject.toFixed(2));
            userGrandTotal += detail.calculatedAmountForProject;
            finalProjectDetails.push(detail);
        });

        if (finalProjectDetails.length > 0 || daysPresent > 0 || daysOnLeave > 0) {
          newSummaries.push({
            userId: user.id,
            userName: `${user.firstName} ${user.lastName}`,
            userProfilePictureUrl: user.profilePictureUrl,
            projectDetails: finalProjectDetails,
            attendanceSummary: { daysPresent, daysOnLeave },
            grandTotalAmount: parseFloat(userGrandTotal.toFixed(2)),
          });
        }
      }
      setCalculatedSummaries(newSummaries.sort((a,b) => b.grandTotalAmount - a.grandTotalAmount));
      if(newSummaries.length === 0) {
        setSuccessMessage("No billable work or attendance data found for any employee in the selected period for count-based projects.");
      }

    } catch (err: any) {
      setError(err.message || 'Failed to calculate billing.');
      console.error(err);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleFinalizeBilling = async () => {
    const relevantSummaries = calculatedSummaries.filter(s => s.grandTotalAmount > 0 || s.projectDetails.length > 0);
    if (relevantSummaries.length === 0) {
      alert("No calculations with earnings to finalize.");
      return;
    }
    if (!window.confirm(`Are you sure you want to finalize billing for ${relevantSummaries.length} employee(s) for the period ${startDate} to ${endDate}? This will generate billing records and notify employees.`)) {
      return;
    }

    setIsFinalizing(true);
    setError(null);
    setSuccessMessage(null);
    let successCount = 0;
    const clientNameForPeriod = `Period: ${formatDate(startDate)} to ${formatDate(endDate)}`;

    try {
      for (const summary of relevantSummaries) {
        const recordData: NewCalculatedBillingRecordData = {
          userId: summary.userId,
          // Use a generic project ID or the first project if available for the main record. Details are in summary.
          projectId: summary.projectDetails[0]?.projectId || 'SUMMARY_BILLING_COUNT_BASED', 
          projectName: summary.projectDetails[0]?.projectName || 'Period Summary (Count-Based)',
          clientName: clientNameForPeriod,
          date: endDate, 
          status: BillingStatus.PENDING,
          calculatedAmount: summary.grandTotalAmount,
          isCountBased: true, 
          details: summary.projectDetails,
          attendanceSummary: summary.attendanceSummary,
          billingPeriodStartDate: startDate,
          billingPeriodEndDate: endDate,
          notes: `Automated count-based billing summary for ${summary.userName} for period ${formatDate(startDate)} to ${formatDate(endDate)}.`
        };
        await apiAddBillingRecord(recordData);

        await apiSendInternalMessage({
            senderId: 'SYSTEM', // Or admin user ID
            recipientId: summary.userId,
            content: `Count-based billing for the period ${formatDate(startDate)} to ${formatDate(endDate)} has been processed. \nGrand Total: $${summary.grandTotalAmount.toFixed(2)}. \nAttendance: ${summary.attendanceSummary.daysPresent} days present, ${summary.attendanceSummary.daysOnLeave} days on leave. \nPlease check "My Billing" for a detailed breakdown.`,
            relatedEntityType: 'BillingRecord',
            // A more specific ID might be needed if apiAddBillingRecord returns the new ID
            relatedEntityId: '#/employee/my-billing' 
        });
        successCount++;
      }
      setSuccessMessage(`${successCount} billing records generated and notifications sent successfully!`);
      setCalculatedSummaries([]); 
      setExpandedUserId(null);
    } catch (err: any) {
      setError(err.message || 'An error occurred during finalization.');
      console.error(err);
    } finally {
      setIsFinalizing(false);
    }
  };
  
  const toggleExpandUser = (userId: string) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  const inputBaseClasses = `mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`;
  const buttonPrimaryClasses = `flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-${THEME.primaryText} bg-${THEME.primary} hover:bg-opacity-85 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.primary} disabled:opacity-50 transition`;

  if (isLoadingInitialData) {
     return (
        <div className={`p-6 bg-white rounded-xl shadow-lg text-center text-${THEME.accentText}`}>
            <svg className={`animate-spin h-8 w-8 text-${THEME.primary} mx-auto mb-2`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading initial data (projects & users)...
        </div>
    );
  }
   if (allProjects.length === 0) {
    return <div className={`p-6 bg-white rounded-xl shadow-lg text-center text-${THEME.accentText}`}>No count-based projects found. Please add count-based projects to use this calculator.</div>;
  }
  if (allEmployees.length === 0) {
    return <div className={`p-6 bg-white rounded-xl shadow-lg text-center text-${THEME.accentText}`}>No employees found. Please add employees to calculate billing.</div>;
  }


  return (
    <div className={`p-6 bg-white rounded-xl shadow-lg`}>
      <h2 className={`text-2xl font-semibold text-${THEME.primary} mb-6 flex items-center`}>
        <CalculatorIcon className="h-7 w-7 mr-2" />
        Employee Billing Calculator (Count-Based Projects)
      </h2>

      <form onSubmit={handleCalculateBilling} className="space-y-4 md:flex md:space-y-0 md:space-x-4 md:items-end mb-6 p-4 border rounded-md bg-gray-50">
        <div className="flex-1">
          <label htmlFor="startDate" className={`block text-sm font-medium text-${THEME.accentText}`}>Start Date</label>
          <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputBaseClasses} required />
        </div>
        <div className="flex-1">
          <label htmlFor="endDate" className={`block text-sm font-medium text-${THEME.accentText}`}>End Date</label>
          <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputBaseClasses} required />
        </div>
        <div>
          <button type="submit" disabled={isCalculating || isLoadingInitialData} className={`${buttonPrimaryClasses} w-full md:w-auto`}>
            {isCalculating ? 'Calculating...' : 'Calculate Billing'}
          </button>
        </div>
      </form>

      {error && <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded-md"><p>{error}</p></div>}
      {successMessage && <div className="p-3 mb-4 bg-green-100 border border-green-400 text-green-700 rounded-md"><p>{successMessage}</p></div>}

      {isCalculating && (
          <div className="text-center py-8">
              <svg className={`animate-spin h-8 w-8 text-${THEME.primary} mx-auto mb-2`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Calculating billing data... this may take a moment.
          </div>
      )}

      {!isCalculating && calculatedSummaries.length > 0 && (
        <div className="mt-8">
          <h3 className={`text-xl font-semibold text-${THEME.secondary} mb-4`}>
            Billing Summary for Period: {formatDate(startDate)} to {formatDate(endDate)}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className={`bg-gray-50 border-b-2 border-${THEME.primary}`}>
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-10"></th> {/* Expand icon */}
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Attendance (Present/Leave)</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Grand Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {calculatedSummaries.map(summary => (
                  <React.Fragment key={summary.userId}>
                    <tr className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {(summary.projectDetails.length > 0 || summary.attendanceSummary.daysPresent > 0 || summary.attendanceSummary.daysOnLeave > 0) && (
                             <button onClick={() => toggleExpandUser(summary.userId)} className="p-1 text-gray-500 hover:text-gray-700">
                                {expandedUserId === summary.userId ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                            </button>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                          <div className="flex items-center">
                          {summary.userProfilePictureUrl ? (
                              <img src={summary.userProfilePictureUrl} alt={summary.userName} className="w-8 h-8 rounded-full object-cover mr-2" />
                          ) : (
                              <UserCircleIcon className="w-8 h-8 text-gray-400 mr-2" />
                          )}
                          {summary.userName}
                          </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {summary.attendanceSummary.daysPresent} / {summary.attendanceSummary.daysOnLeave}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 text-right font-semibold">${summary.grandTotalAmount.toFixed(2)}</td>
                    </tr>
                    {expandedUserId === summary.userId && (
                      <tr>
                        <td colSpan={4} className="p-0">
                          <div className="p-4 bg-indigo-50 border-l-4 border-indigo-500">
                            <h4 className="text-sm font-semibold text-indigo-700 mb-2">Details for {summary.userName}:</h4>
                            {summary.attendanceSummary && (
                                <div className="mb-3 text-xs">
                                    <p><strong>Attendance:</strong> {summary.attendanceSummary.daysPresent} days present, {summary.attendanceSummary.daysOnLeave} days on approved leave.</p>
                                </div>
                            )}
                            {summary.projectDetails.length > 0 ? (
                                <table className="min-w-full bg-white text-xs mb-2">
                                <caption className="text-left text-xs font-medium text-indigo-600 mb-1">Project Earnings:</caption>
                                <thead className="bg-indigo-100">
                                    <tr>
                                    <th className="py-2 px-3 text-left font-medium text-indigo-800">Project</th>
                                    <th className="py-2 px-3 text-left font-medium text-indigo-800">Achieved Count</th>
                                    <th className="py-2 px-3 text-left font-medium text-indigo-800">Metric</th>
                                    <th className="py-2 px-3 text-left font-medium text-indigo-800">Formula Applied</th>
                                    <th className="py-2 px-3 text-right font-medium text-indigo-800">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summary.projectDetails.map(detail => (
                                    <tr key={detail.projectId} className="border-b border-indigo-200">
                                        <td className="py-2 px-3 text-indigo-700">{detail.projectName}</td>
                                        <td className="py-2 px-3 text-indigo-700">{detail.totalAchievedCount}</td>
                                        <td className="py-2 px-3 text-indigo-700">{detail.metricLabel}</td>
                                        <td className="py-2 px-3 text-indigo-600 text-xs italic">{detail.formulaApplied}</td>
                                        <td className="py-2 px-3 text-indigo-700 text-right font-medium">${detail.calculatedAmountForProject.toFixed(2)}</td>
                                    </tr>
                                    ))}
                                </tbody>
                                </table>
                            ) : <p className="text-xs text-gray-500 italic">No count-based project earnings for this period.</p> }
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 text-right">
            <button 
                onClick={handleFinalizeBilling} 
                disabled={isFinalizing || isCalculating || calculatedSummaries.filter(s => s.grandTotalAmount > 0 || s.projectDetails.length > 0).length === 0} 
                className={`px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition`}
            >
              {isFinalizing ? 'Finalizing...' : 'Finalize & Generate Billing Record(s)'}
            </button>
          </div>
        </div>
      )}
       {!isCalculating && !isLoadingInitialData && calculatedSummaries.length === 0 && startDate && endDate && !error && (
        <div className="mt-8 text-center text-gray-500">
          <p>No billable activities or attendance found for employees within the selected period for count-based projects.</p>
          <p className="text-xs italic">Ensure employees have submitted work reports with achieved counts for count-based projects and have clock-in/leave records within the date range.</p>
        </div>
      )}
    </div>
  );
};

export default AdminBillingCalculator;
