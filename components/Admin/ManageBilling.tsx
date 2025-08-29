
import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { 
    apiFetchBillingRecords, 
    apiDeleteBillingRecord,
    apiFetchAllUsers,
    apiFetchProjects,
    apiAddBillingRecord,
    apiSendInternalMessage
} from '../../services/api';
import { BillingRecord, BillingStatus, User, Project, EmployeeProjectBillingDetail, NewManualBillingRecordData, NewCalculatedBillingRecordData } from '../../types';
import { THEME } from '../../constants';
import { PlusCircleIcon, PencilSquareIcon, TrashIcon, EyeIcon, XMarkIcon, ArrowUpTrayIcon, DocumentMagnifyingGlassIcon, PaperAirplaneIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/dateUtils';
import { parseCSVToObjects } from '../../utils/csvParser'; 
import { exportToCSV } from '../../utils/csvExport';


const ManageBilling: React.FC = () => {
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<BillingRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState<BillingRecord | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importFeedback, setImportFeedback] = useState<{ success: string[], errors: string[] }>({ success: [], errors: [] });
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sendNotificationStatus, setSendNotificationStatus] = useState<{ recordId: string | null, sending: boolean, error: string | null, success: string | null }>({ recordId: null, sending: false, error: null, success: null });


  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [fetchedRecords, fetchedUsers, fetchedProjects] = await Promise.all([
        // Pass date filters to API if backend supports it. For now, API mock handles it.
        apiFetchBillingRecords({ startDate: filterStartDate || undefined, endDate: filterEndDate || undefined }),
        apiFetchAllUsers(),
        apiFetchProjects()
      ]);
      setBillingRecords(fetchedRecords.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setUsers(fetchedUsers);
      setProjects(fetchedProjects);
    } catch (err: any) {
      setError(err.message || 'Failed to load billing data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load data on initial mount and when date filters change
    loadData();
  }, [filterStartDate, filterEndDate]); // Removed loadData from deps array to prevent loop

  useEffect(() => {
    // Client-side search filtering (runs after data is loaded/reloaded by date filters)
    const lowercasedFilter = searchTerm.toLowerCase();
    let dateFilteredRecords = billingRecords; // Use billingRecords which is already date-filtered by API mock

    // If API mock wasn't filtering by date, you'd add client-side date filtering here:
    // if (filterStartDate) {
    //   dateFilteredRecords = dateFilteredRecords.filter(r => new Date(r.date) >= new Date(filterStartDate));
    // }
    // if (filterEndDate) {
    //   dateFilteredRecords = dateFilteredRecords.filter(r => new Date(r.date) <= new Date(filterEndDate));
    // }
    
    const searchFilteredData = dateFilteredRecords.filter(record => {
        const userName = getUserName(record.userId).toLowerCase();
        const projectName = record.projectName?.toLowerCase() || projects.find(p=>p.id === record.projectId)?.name?.toLowerCase() || '';
        const clientName = record.clientName.toLowerCase();
        return userName.includes(lowercasedFilter) || 
               projectName.includes(lowercasedFilter) ||
               clientName.includes(lowercasedFilter);
    });
    setFilteredRecords(searchFilteredData);
  }, [searchTerm, billingRecords, users, projects]); // billingRecords dependency ensures this runs when date-filtered data changes


  const handleDeleteRecord = async (recordId: string) => {
    if (window.confirm('Are you sure you want to delete this billing record?')) {
      try {
        await apiDeleteBillingRecord(recordId);
        // Optimistically update UI or reload data
        setBillingRecords(prevRecords => prevRecords.filter(r => r.id !== recordId));
        // loadData(); // Alternatively, reload all data
        alert('Billing record deleted successfully.');
      } catch (err: any) {
        setError(err.message || 'Failed to delete billing record.');
        alert(`Error: ${err.message || 'Failed to delete billing record.'}`);
      }
    }
  };

  const getUserName = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
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

  const openDetailsModal = (record: BillingRecord) => {
    setSelectedRecordForDetails(record);
    setIsDetailsModalOpen(true);
  };
  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedRecordForDetails(null);
  };

  // CSV Import Handlers
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setCsvFile(event.target.files[0]);
      setImportFeedback({ success: [], errors: [] }); 
    }
  };
  
  const handleDownloadTemplate = () => {
    const templateForExport = [
        { employeeIdentifier: 'employee1', projectIdentifier: 'proj1', clientName: 'Client Alpha', date: '2023-10-25', status: 'pending', isCountBased: 'false', hoursBilled: '8', rateApplied: '75', calculatedAmount: '', achievedCountTotal: '', countMetricLabelUsed: '', notes: 'Hourly work example' },
        { employeeIdentifier: 'employee2', projectIdentifier: 'proj3', clientName: 'Client Beta', date: '2023-10-26', status: 'pending', isCountBased: 'true', hoursBilled: '', rateApplied: '', calculatedAmount: '125', achievedCountTotal: '250', countMetricLabelUsed: '', notes: 'Count-based work example' }
    ];
    exportToCSV(templateForExport, 'billing_import_template.csv');
  };

  const handleImportCSV = async () => {
    if (!csvFile) {
      alert("Please select a CSV file to import.");
      return;
    }
    setIsImporting(true);
    setImportFeedback({ success: [], errors: [] });
    const reader = new FileReader();
    reader.onload = async (event) => {
        const csvString = event.target?.result as string;
        const parseOutput = parseCSVToObjects(csvString);

        if ('error' in parseOutput) {
            setImportFeedback(prev => ({ ...prev, errors: [parseOutput.error] }));
            setIsImporting(false);
            return;
        }

        const { headers, data: csvData, skippedRows } = parseOutput;
        let localSuccess: string[] = [];
        let localErrors: string[] = [];

        if (skippedRows && skippedRows.length > 0) {
            skippedRows.forEach(skipped => {
                localErrors.push(`Row ${skipped.rowNumber}: Skipped - ${skipped.reason} (Content: "${skipped.rowContent.substring(0,50)}...")`);
            });
        }
        
        const requiredHeaders = ['employeeIdentifier', 'projectIdentifier', 'clientName', 'date', 'status', 'isCountBased'];
        const missingHeaders = requiredHeaders.filter(h => !headers.map(header => header.toLowerCase()).includes(h.toLowerCase()));
        if (missingHeaders.length > 0) {
            localErrors.push(`Missing required CSV headers: ${missingHeaders.join(', ')}`);
            setImportFeedback(prev => ({ ...prev, errors: localErrors }));
            setIsImporting(false);
            return;
        }
        

        for (let i = 0; i < csvData.length; i++) {
            const row = csvData[i];
            const rowIndex = (skippedRows?.filter(sr => sr.rowNumber <= i + 1).length || 0) + i + 2; 
            try {
                const getVal = (headerName: string) => Object.entries(row).find(([key, _]) => key.toLowerCase() === headerName.toLowerCase())?.[1]?.trim() || '';

                const employeeIdentifier = getVal('employeeIdentifier');
                const projectIdentifier = getVal('projectIdentifier');
                const clientName = getVal('clientName');
                const date = getVal('date');
                const statusStr = getVal('status');
                const isCountBasedStr = getVal('isCountBased')?.toLowerCase();

                if (!employeeIdentifier || !projectIdentifier || !clientName || !date || !statusStr || isCountBasedStr === '') {
                    localErrors.push(`Row ${rowIndex}: Missing required fields (employeeIdentifier, projectIdentifier, clientName, date, status, isCountBased).`);
                    continue;
                }

                const user = users.find(u => u.id === employeeIdentifier || u.username.toLowerCase() === employeeIdentifier.toLowerCase() || `${u.firstName.toLowerCase()} ${u.lastName.toLowerCase()}` === employeeIdentifier.toLowerCase());
                const project = projects.find(p => p.id === projectIdentifier || p.name.toLowerCase() === projectIdentifier.toLowerCase());

                if (!user) { localErrors.push(`Row ${rowIndex}: Employee "${employeeIdentifier}" not found.`); continue; }
                if (!project) { localErrors.push(`Row ${rowIndex}: Project "${projectIdentifier}" not found.`); continue; }

                const status = statusStr.toLowerCase() as BillingStatus;
                if (!Object.values(BillingStatus).includes(status)) {
                     localErrors.push(`Row ${rowIndex}: Invalid status "${statusStr}". Must be one of: ${Object.values(BillingStatus).join(', ')}.`); continue;
                }
                
                let recordPayload: NewManualBillingRecordData | NewCalculatedBillingRecordData;

                if (isCountBasedStr === 'true') {
                    const calculatedAmountStr = getVal('calculatedAmount');
                    if (calculatedAmountStr === '' || isNaN(parseFloat(calculatedAmountStr))) {
                        localErrors.push(`Row ${rowIndex}: 'calculatedAmount' is required and must be a number for count-based records.`); continue;
                    }
                    const achievedCountTotalStr = getVal('achievedCountTotal');
                    const countMetricLabelUsed = getVal('countMetricLabelUsed') || project.countMetricLabel;

                    recordPayload = {
                        userId: user.id, projectId: project.id, projectName: project.name, clientName, date, status, isCountBased: true,
                        calculatedAmount: parseFloat(calculatedAmountStr),
                        achievedCountTotal: achievedCountTotalStr !== '' ? parseFloat(achievedCountTotalStr) : undefined,
                        countMetricLabelUsed: countMetricLabelUsed, notes: getVal('notes'),
                    };
                } else { // Hourly
                    const hoursBilledStr = getVal('hoursBilled');
                    const rateAppliedStr = getVal('rateApplied');

                    if (hoursBilledStr === '' || isNaN(parseFloat(hoursBilledStr)) || parseFloat(hoursBilledStr) <=0) {
                        localErrors.push(`Row ${rowIndex}: 'hoursBilled' is required and must be a positive number for hourly records.`); continue;
                    }
                    const rate = rateAppliedStr !== '' ? parseFloat(rateAppliedStr) : project.ratePerHour;
                    if (rate === undefined || rate === null || isNaN(rate) || rate <= 0) {
                         localErrors.push(`Row ${rowIndex}: 'rateApplied' is required and must be a positive number (or project default rate) for hourly records.`); continue;
                    }
                    const hoursBilled = parseFloat(hoursBilledStr);

                    recordPayload = {
                        userId: user.id, projectId: project.id, clientName, date, status, 
                        hoursBilled, notes: getVal('notes'),
                    };
                }
                await apiAddBillingRecord(recordPayload);
                localSuccess.push(`Row ${rowIndex}: Record for ${user.username} / ${project.name} imported.`);

            } catch (apiErr: any) {
                localErrors.push(`Row ${rowIndex}: API Error - ${apiErr.message || 'Failed to add record.'}`);
            }
        }
        setImportFeedback({ success: localSuccess, errors: localErrors });
        if (localSuccess.length > 0) loadData(); 
    };
    reader.onerror = () => {
        setImportFeedback({ success:[], errors: ["Failed to read the CSV file."]});
        setIsImporting(false);
    };
    reader.onloadend = () => {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = ''; 
    };
    reader.readAsText(csvFile);
  };
  
  const handleSendRecordToEmployee = async (record: BillingRecord) => {
    setSendNotificationStatus({ recordId: record.id, sending: true, error: null, success: null });
    const employeeName = getUserName(record.userId);
    const project = projects.find(p => p.id === record.projectId);
    const projectName = record.projectName || project?.name || "N/A";

    let messageContent = `Hello ${employeeName.split(' ')[0]},\n\nHere is an update on one of your billing records:\n\n`;
    messageContent += `*Date/Period:* ${record.billingPeriodStartDate ? `${formatDate(record.billingPeriodStartDate)} to ${formatDate(record.billingPeriodEndDate || record.date)}` : formatDate(record.date)}\n`;
    messageContent += `*Project:* ${projectName}\n`;
    messageContent += `*Client:* ${record.clientName}\n`;
    messageContent += `*Amount:* ${formatCurrency(record.calculatedAmount)}\n`;
    messageContent += `*Status:* ${record.status.charAt(0).toUpperCase() + record.status.slice(1)}\n`;

    if (record.isCountBased) {
        messageContent += `*Type:* Count-Based\n`;
        if(record.achievedCountTotal !== undefined) messageContent += `*Total Achieved:* ${record.achievedCountTotal} ${record.countMetricLabelUsed || ''}\n`;
    } else {
        messageContent += `*Type:* Hourly\n`;
        if(record.hoursBilled !== undefined) messageContent += `*Hours Billed:* ${record.hoursBilled.toFixed(2)}\n`;
        if(record.rateApplied !== undefined) messageContent += `*Rate:* ${formatCurrency(record.rateApplied)}/hr\n`;
    }

    if (record.attendanceSummary) {
        messageContent += `\n*Attendance Summary for Period:*\n- Days Present: ${record.attendanceSummary.daysPresent}\n- Days on Leave (Approved): ${record.attendanceSummary.daysOnLeave}`;
    }

    if (record.notes) {
        messageContent += `\n\n*Notes from Admin:*\n${record.notes}\n`;
    }
    
    if (record.details && record.details.length > 0) {
        messageContent += `\n\nA detailed project breakdown is available in the "My Billing" section on your dashboard.`
    }

    messageContent += `\n\nYou can view full details in the "My Billing" section.`;

    try {
        await apiSendInternalMessage({
            senderId: 'SYSTEM', 
            recipientId: record.userId,
            content: messageContent,
            relatedEntityType: 'BillingRecord',
            relatedEntityId: record.id 
        });
        setSendNotificationStatus({ recordId: record.id, sending: false, error: null, success: `Record sent to ${employeeName}.` });
        setTimeout(() => setSendNotificationStatus({ recordId: null, sending: false, error: null, success: null }), 4000);
    } catch (err: any) {
        setSendNotificationStatus({ recordId: record.id, sending: false, error: `Failed to send notification: ${err.message}`, success: null });
        setTimeout(() => setSendNotificationStatus({ recordId: null, sending: false, error: null, success: null }), 4000);
    }
  };

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert("No data to export.");
      return;
    }
    const dataToExport = filteredRecords.map(record => ({
      'Date': formatDate(record.date),
      'Employee Name': getUserName(record.userId),
      'Project Name': record.projectName || projects.find(p => p.id === record.projectId)?.name || 'N/A',
      'Client Name': record.clientName,
      'Amount': record.calculatedAmount, // Raw number for CSV
      'Status': record.status,
      'Type': record.isCountBased ? 'Count-Based' : 'Hourly',
      'Hours Billed': !record.isCountBased && record.hoursBilled !== undefined ? record.hoursBilled.toFixed(2) : 'N/A',
      'Rate Applied': !record.isCountBased && record.rateApplied !== undefined ? record.rateApplied.toFixed(2) : 'N/A',
      'Achieved Count': record.isCountBased && record.achievedCountTotal !== undefined ? record.achievedCountTotal : 'N/A',
      'Metric Label': record.isCountBased ? (record.countMetricLabelUsed || 'N/A') : 'N/A',
      'Billing Period Start': record.billingPeriodStartDate ? formatDate(record.billingPeriodStartDate) : 'N/A',
      'Billing Period End': record.billingPeriodEndDate ? formatDate(record.billingPeriodEndDate) : 'N/A',
      'Notes': record.notes || '',
    }));
    exportToCSV(dataToExport, `billing_records_${new Date().toISOString().split('T')[0]}.csv`);
  };


  const inputBaseClasses = `mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm placeholder-gray-400`;
  const buttonPrimaryClasses = `inline-flex items-center px-4 py-2 bg-${THEME.primary} text-${THEME.primaryText} text-sm font-medium rounded-md hover:bg-opacity-85 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.primary}`;
  const buttonSecondaryClasses = `inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`;
  const buttonTertiaryClasses = `inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`;



  if (loading && billingRecords.length === 0) {
    return (
      <div className={`p-6 bg-white rounded-xl shadow-lg text-center text-${THEME.accentText}`}>
        <svg className={`animate-spin h-8 w-8 text-${THEME.primary} mx-auto mb-2`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading billing records...
      </div>
    );
  }

  if (error) {
    return <div className={`p-6 bg-red-100 text-red-700 rounded-xl shadow-lg`}>Error: {error}</div>;
  }
  
  return (
    <div className={`p-6 bg-white rounded-xl shadow-lg`}>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className={`text-2xl font-semibold text-${THEME.primary}`}>Manage Billing Records</h2>
      </div>
      
      <div className="mb-6 p-4 border rounded-md bg-gray-50 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-1">
            <label htmlFor="searchTerm" className={`block text-xs font-medium text-gray-700 mb-1`}>Search</label>
            <input
                type="text"
                id="searchTerm"
                placeholder="By employee, project, client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${inputBaseClasses} w-full`}
            />
          </div>
          <div>
            <label htmlFor="filterStartDate" className={`block text-xs font-medium text-gray-700 mb-1`}>Start Date</label>
            <input type="date" id="filterStartDate" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className={inputBaseClasses} />
          </div>
          <div>
            <label htmlFor="filterEndDate" className={`block text-xs font-medium text-gray-700 mb-1`}>End Date</label>
            <input type="date" id="filterEndDate" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className={inputBaseClasses} />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full pt-2">
             <button 
                onClick={loadData} // Re-fetch data with new date filters
                className={`${buttonPrimaryClasses} w-full sm:w-auto justify-center`}
            >
                Apply Date Filters
            </button>
            <button 
                onClick={handleExportCSV} 
                className={`${buttonTertiaryClasses} w-full sm:w-auto justify-center`}
                disabled={filteredRecords.length === 0}
            >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" /> Export CSV
            </button>
            <button 
                onClick={() => setIsImportModalOpen(true)} 
                className={`${buttonSecondaryClasses} w-full sm:w-auto justify-center`}
            >
                <ArrowUpTrayIcon className="h-5 w-5 mr-2" /> Import CSV
            </button>
            <Link
            to="/app/admin/billing/new"
            className={`${buttonPrimaryClasses} w-full sm:w-auto justify-center`}
            >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            Add New Record
            </Link>
        </div>
      </div>
      
      {loading && <p className={`text-sm text-${THEME.accentText} my-2`}>Refreshing records...</p>}
      
      {sendNotificationStatus.error && sendNotificationStatus.recordId && (
        <div className="my-2 p-2 bg-red-100 text-red-700 text-xs rounded-md">
            Error sending to {getUserName(billingRecords.find(r=>r.id === sendNotificationStatus.recordId)?.userId || '')}: {sendNotificationStatus.error}
        </div>
      )}
      {sendNotificationStatus.success && sendNotificationStatus.recordId && (
          <div className="my-2 p-2 bg-green-100 text-green-700 text-xs rounded-md">
              {sendNotificationStatus.success}
          </div>
      )}

      {filteredRecords.length === 0 ? (
        <p className={`text-center text-gray-500 py-8`}>{searchTerm || filterStartDate || filterEndDate ? 'No records match your search criteria.' : 'No billing records found.'}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className={`bg-gray-50 border-b-2 border-${THEME.primary}`}>
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Project</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Client</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Amount</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">Type</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRecords.map(record => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-700">{formatDate(record.date)}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{getUserName(record.userId)}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{record.projectName || projects.find(p=>p.id === record.projectId)?.name || 'N/A'}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{record.clientName}</td>
                  <td className="py-3 px-4 text-sm text-gray-700 text-right font-semibold">{formatCurrency(record.calculatedAmount)}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500 text-center">
                    {record.isCountBased ? 'Count-Based' : 'Hourly'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700 text-right">
                    <div className="flex items-center justify-end space-x-1">
                        {(record.details && record.details.length > 0) || record.attendanceSummary ? (
                            <button
                            onClick={() => openDetailsModal(record)}
                            className={`p-1.5 text-blue-500 hover:text-blue-700 transition-colors`}
                            title="View Details"
                            >
                            <DocumentMagnifyingGlassIcon className="h-5 w-5" />
                            </button>
                        ): <span className="inline-block w-7"></span>} {/* Placeholder for alignment */}
                        <Link to={`/app/admin/billing/edit/${record.id}`} className={`p-1.5 text-gray-500 hover:text-${THEME.secondary} transition-colors`} title="Edit Record">
                        <PencilSquareIcon className="h-5 w-5" />
                        </Link>
                        <button
                            onClick={() => handleSendRecordToEmployee(record)}
                            disabled={sendNotificationStatus.sending && sendNotificationStatus.recordId === record.id}
                            className={`p-1.5 text-blue-500 hover:text-blue-700 transition-colors`}
                            title="Send to Employee"
                        >
                            {sendNotificationStatus.sending && sendNotificationStatus.recordId === record.id ? 
                                <svg className="animate-spin h-5 w-5 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg> : 
                                <PaperAirplaneIcon className="h-5 w-5 transform rotate-45" />
                            }
                        </button>
                        <button onClick={() => handleDeleteRecord(record.id)} className={`p-1.5 text-gray-500 hover:text-red-600 transition-colors`} title="Delete Record">
                        <TrashIcon className="h-5 w-5" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

        {/* Details Modal */}
        {isDetailsModalOpen && selectedRecordForDetails && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 overflow-y-auto">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-xl my-8">
                <div className="flex justify-between items-center mb-4">
                <h3 className={`text-xl font-semibold text-${THEME.primary}`}>
                    Billing Details for {getUserName(selectedRecordForDetails.userId)}
                </h3>
                <button onClick={closeDetailsModal} className={`text-gray-400 hover:text-gray-600`}>
                    <XMarkIcon className="h-6 w-6" />
                </button>
                </div>
                <div className="text-sm space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                    <p><strong>Period:</strong> {selectedRecordForDetails.billingPeriodStartDate ? `${formatDate(selectedRecordForDetails.billingPeriodStartDate)} to ${formatDate(selectedRecordForDetails.billingPeriodEndDate || selectedRecordForDetails.date)}` : formatDate(selectedRecordForDetails.date)}</p>
                    <p><strong>Project:</strong> {selectedRecordForDetails.projectName || projects.find(p=>p.id === selectedRecordForDetails.projectId)?.name || 'N/A'}</p>
                    <p><strong>Client:</strong> {selectedRecordForDetails.clientName}</p>
                    <p><strong>Total Amount:</strong> {formatCurrency(selectedRecordForDetails.calculatedAmount)}</p>
                    
                    {selectedRecordForDetails.attendanceSummary && (
                        <div className="mt-3 p-3 border rounded-md bg-indigo-50">
                        <h4 className="text-xs font-semibold text-indigo-700 mb-1">Attendance Summary:</h4>
                        <p className="text-xs text-indigo-600">Days Present: {selectedRecordForDetails.attendanceSummary.daysPresent}</p>
                        <p className="text-xs text-indigo-600">Days on Leave (Approved): {selectedRecordForDetails.attendanceSummary.daysOnLeave}</p>
                        </div>
                    )}

                    {selectedRecordForDetails.details && selectedRecordForDetails.details.length > 0 && (
                        <div className="mt-3">
                        <h4 className="text-xs font-semibold text-gray-700 mb-1">Project Earnings Breakdown:</h4>
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
                                {selectedRecordForDetails.details.map(detail => (
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
                        </div>
                    )}
                    {selectedRecordForDetails.notes && (
                        <div className="mt-3 pt-2 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-600">Notes:</p>
                            <p className="text-xs text-gray-500 whitespace-pre-wrap">{selectedRecordForDetails.notes}</p>
                        </div>
                    )}
                     {(!selectedRecordForDetails.details || selectedRecordForDetails.details.length === 0) && !selectedRecordForDetails.attendanceSummary && (
                         <p className="text-xs text-gray-500 italic">No detailed breakdown available for this record (e.g. manually added hourly record or basic CSV import).</p>
                     )}
                </div>
                <div className="mt-6 text-right">
                    <button type="button" onClick={closeDetailsModal} className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50`}>Close</button>
                </div>
            </div>
            </div>
        )}
         {/* CSV Import Modal */}
        {isImportModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                <h3 className={`text-xl font-semibold text-${THEME.primary}`}>Import Billing Records from CSV</h3>
                <button onClick={() => setIsImportModalOpen(false)} className={`text-gray-400 hover:text-gray-600`}>
                    <XMarkIcon className="h-6 w-6" />
                </button>
                </div>
                <div className="space-y-4">
                <div>
                    <label htmlFor="csvFile" className={`block text-sm font-medium text-${THEME.accentText}`}>Upload CSV File</label>
                     <div className="flex items-center gap-x-3">
                        <input
                            type="file"
                            id="csvFile"
                            ref={fileInputRef}
                            accept=".csv"
                            onChange={handleFileChange}
                            className={`mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-${THEME.accent} file:text-${THEME.accentText} hover:file:bg-opacity-80`}
                        />
                        <button
                            type="button"
                            onClick={handleDownloadTemplate}
                            className={`mt-1 inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none`}
                            title="Download a CSV template with the correct headers and example data"
                        >
                            <ArrowDownTrayIcon className="h-4 w-4 mr-1.5"/> Template
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Required headers: employeeIdentifier, projectIdentifier, clientName, date, status, isCountBased.
                    </p>
                </div>

                {isImporting && <p className="text-sm text-blue-600">Importing records, please wait...</p>}
                
                {importFeedback.errors.length > 0 && (
                    <div className="max-h-40 overflow-y-auto mt-2 p-2 bg-red-50 border border-red-200 rounded-md text-xs">
                    <p className="font-semibold text-red-700 mb-1">Import Errors:</p>
                    <ul className="list-disc list-inside text-red-600">
                        {importFeedback.errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                    </div>
                )}
                {importFeedback.success.length > 0 && (
                    <div className="max-h-40 overflow-y-auto mt-2 p-2 bg-green-50 border border-green-200 rounded-md text-xs">
                    <p className="font-semibold text-green-700 mb-1">Successfully Imported:</p>
                    <ul className="list-disc list-inside text-green-600">
                        {importFeedback.success.map((msg, i) => <li key={i}>{msg}</li>)}
                    </ul>
                    </div>
                )}

                <div className="flex justify-end space-x-3 pt-2">
                    <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50`}
                    >
                    Cancel
                    </button>
                    <button
                    type="button"
                    onClick={handleImportCSV}
                    disabled={!csvFile || isImporting}
                    className={`px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50`}
                    >
                    {isImporting ? 'Processing...' : 'Import Records'}
                    </button>
                </div>
                </div>
            </div>
            </div>
        )}
    </div>
  );
};

export default ManageBilling;
