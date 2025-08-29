

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
    apiAddBillingRecord, 
    apiFetchAllUsers, 
    apiFetchProjects,
    apiUpdateBillingRecord,
    apiFetchBillingRecords 
} from '../../services/api';
import { NewManualBillingRecordData, BillingStatus, User, Project, BillingRecord, UserRole as AppUserRole, ProjectBillingType } from '../../types'; 
import { THEME } from '../../constants';


interface BillingFormProps {
  // existingRecordId prop is removed, will use useParams
}

const BillingForm: React.FC<BillingFormProps> = () => {
  const navigate = useNavigate();
  const { recordId: existingRecordId } = useParams<{ recordId: string }>(); 

  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  const [clientName, setClientName] = useState('');
  const [projectId, setProjectId] = useState(''); 
  const [userId, setUserId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); 
  const [hoursBilled, setHoursBilled] = useState<number | ''>('');
  const [rateApplied, setRateApplied] = useState<number | ''>(''); 
  const [status, setStatus] = useState<BillingStatus>(BillingStatus.PENDING);
  const [notes, setNotes] = useState('');
  const [isCountBasedRecord, setIsCountBasedRecord] = useState(false);
  const [currentBillingType, setCurrentBillingType] = useState<ProjectBillingType | null>(null);


  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingInitialData, setIsFetchingInitialData] = useState(true);


  useEffect(() => {
    const loadInitialData = async () => {
      setIsFetchingInitialData(true);
      setError(null);
      try {
        const [fetchedUsers, fetchedProjects] = await Promise.all([
          apiFetchAllUsers(),
          apiFetchProjects()
        ]);
        
        setUsers(fetchedUsers.filter(u => u.role === AppUserRole.EMPLOYEE));
        setProjects(fetchedProjects);

        if (existingRecordId) {
          const allRecords = await apiFetchBillingRecords(); 
          const recordToEdit = allRecords.find(r => r.id === existingRecordId);
          if (recordToEdit) {
            setClientName(recordToEdit.clientName);
            setProjectId(recordToEdit.projectId); 
            setUserId(recordToEdit.userId);
            setDate(recordToEdit.date);
            setHoursBilled(recordToEdit.hoursBilled ?? '');
            setStatus(recordToEdit.status);
            setNotes(recordToEdit.notes || '');
            setIsCountBasedRecord(recordToEdit.isCountBased);

            const projectOfRecord = fetchedProjects.find(p => p.id === recordToEdit.projectId);
            if (projectOfRecord) {
                setCurrentBillingType(projectOfRecord.billingType);
                if (projectOfRecord.billingType === 'hourly') {
                    setRateApplied(recordToEdit.rateApplied !== undefined ? recordToEdit.rateApplied : (projectOfRecord.ratePerHour || ''));
                } else {
                    setRateApplied('');
                }
            }
          } else {
            setError('Billing record not found for editing.');
            navigate('/app/admin/billing'); 
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load initial data.');
        console.error(err);
      } finally {
        setIsFetchingInitialData(false);
      }
    };
    loadInitialData();
  }, [existingRecordId, navigate]);

  useEffect(() => {
    if (projectId) {
      const selectedProject = projects.find(p => p.id === projectId);
      if (selectedProject) {
        setCurrentBillingType(selectedProject.billingType);
        if (selectedProject.billingType === 'hourly' && !isCountBasedRecord) {
           if (!existingRecordId || (existingRecordId && selectedProject.id !== projects.find(p => p.id === projectId)?.id) ) {
             setRateApplied(selectedProject.ratePerHour !== undefined ? selectedProject.ratePerHour : '');
           }
        } else {
          setRateApplied(''); 
        }
      } else {
        setRateApplied(''); 
        setCurrentBillingType(null);
      }
    } else {
      setRateApplied('');
      setCurrentBillingType(null);
    }
  }, [projectId, projects, existingRecordId, isCountBasedRecord]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (existingRecordId) {
        let updatePayload: Partial<BillingRecord>;
        
        if (isCountBasedRecord) {
          // For count-based records, only allow updating non-calculated fields from this form.
          updatePayload = {
            status,
            notes,
          };
        } else {
          // Full payload for hourly records
          if (hoursBilled === '' || Number(hoursBilled) <= 0) throw new Error('Valid positive hours billed are required for hourly projects.');
          if (rateApplied === '' || Number(rateApplied) <= 0) throw new Error('Valid positive rate applied is required for hourly projects.');
          
          updatePayload = {
            clientName, projectId, userId, date, status, notes,
            hoursBilled: Number(hoursBilled),
            rateApplied: Number(rateApplied),
            isCountBased: false,
          };
        }
        await apiUpdateBillingRecord(existingRecordId, updatePayload);
        alert('Billing record updated successfully!');
      } else {
        // Creating a new record (must be hourly from this form)
        if (currentBillingType !== 'hourly') throw new Error("This form only supports creating hourly billing records. Use the Billing Calculator for count-based records.");
        if (hoursBilled === '' || Number(hoursBilled) <= 0) throw new Error('Valid positive hours billed are required.');
        if (rateApplied === '' || Number(rateApplied) <= 0) throw new Error('Valid positive rate applied is required.');

        const newRecordForApi: NewManualBillingRecordData = {
            clientName, projectId, userId, date, status, notes,
            hoursBilled: Number(hoursBilled),
        };
        await apiAddBillingRecord(newRecordForApi); 
        alert('Billing record created successfully!');
      }
      navigate('/app/admin/billing');
    } catch (err: any) {
      setError(err.message || 'Failed to save billing record.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const inputBaseClasses = `mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm placeholder-gray-400`;
  const selectBaseClasses = `mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`;
  const buttonPrimaryClasses = `w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-${THEME.primaryText} bg-${THEME.primary} hover:bg-opacity-85 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.primary} disabled:opacity-50 transition duration-150 ease-in-out`;


  if (isFetchingInitialData) {
    return (
        <div className={`p-6 bg-white rounded-xl shadow-lg max-w-2xl mx-auto text-center text-${THEME.accentText}`}>
            <svg className={`animate-spin h-8 w-8 text-${THEME.primary} mx-auto mb-2`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading form data...
        </div>
    );
  }

  return (
    <div className={`p-6 bg-white rounded-xl shadow-lg max-w-2xl mx-auto`}>
      <h2 className={`text-2xl font-semibold text-${THEME.primary} mb-6`}>
        {existingRecordId ? (isCountBasedRecord ? 'View/Edit Count-Based Record' : 'Edit Hourly Record') : 'Add New Billing Record (Hourly)'}
      </h2>

       {isCountBasedRecord && (
        <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 text-blue-800 text-sm">
            <p className="font-bold">This is a count-based record.</p>
            <p>It was likely generated by the Billing Calculator. You can only edit fields like Status and Notes here. To recalculate amounts, please use the <Link to="/app/admin/billing-calculator" className="underline font-semibold hover:text-blue-600">Billing Calculator</Link>.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="clientName" className={`block text-sm font-medium text-${THEME.accentText}`}>Client Name</label>
          <input type="text" id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} className={`${inputBaseClasses} ${isCountBasedRecord ? 'bg-gray-100' : ''}`} required disabled={isCountBasedRecord} />
        </div>

        <div>
          <label htmlFor="projectId" className={`block text-sm font-medium text-${THEME.accentText}`}>Project</label>
          <select id="projectId" value={projectId} onChange={(e) => setProjectId(e.target.value)} className={`${selectBaseClasses} ${isCountBasedRecord ? 'bg-gray-100' : ''}`} required disabled={isCountBasedRecord}>
            <option value="" disabled>Select a project</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name} ({project.billingType})</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="userId" className={`block text-sm font-medium text-${THEME.accentText}`}>Assign to Employee</label>
          <select id="userId" value={userId} onChange={(e) => setUserId(e.target.value)} className={`${selectBaseClasses} ${isCountBasedRecord ? 'bg-gray-100' : ''}`} required disabled={isCountBasedRecord}>
            <option value="" disabled>Select an employee</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.firstName} {user.lastName} ({user.username})</option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="date" className={`block text-sm font-medium text-${THEME.accentText}`}>Date</label>
                <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputBaseClasses} ${isCountBasedRecord ? 'bg-gray-100' : ''}`} required disabled={isCountBasedRecord} />
            </div>
            <div>
                <label htmlFor="status" className={`block text-sm font-medium text-${THEME.accentText}`}>Status</label>
                <select id="status" value={status} onChange={(e) => setStatus(e.target.value as BillingStatus)} className={selectBaseClasses} required>
                    {Object.values(BillingStatus).map(sVal => (
                        <option key={sVal} value={sVal}>{sVal.charAt(0).toUpperCase() + sVal.slice(1)}</option>
                    ))}
                </select>
            </div>
        </div>

        {currentBillingType === 'hourly' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="hoursBilled" className={`block text-sm font-medium text-${THEME.accentText}`}>Hours Billed</label>
                <input 
                    type="number" 
                    id="hoursBilled" 
                    value={hoursBilled} 
                    onChange={(e) => setHoursBilled(e.target.value === '' ? '' : parseFloat(e.target.value))} 
                    min="0.01" step="0.01" 
                    className={`${inputBaseClasses} ${isCountBasedRecord ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    readOnly={isCountBasedRecord}
                    required={!isCountBasedRecord} 
                />
            </div>
            <div>
                <label htmlFor="rateApplied" className={`block text-sm font-medium text-${THEME.accentText}`}>Rate Applied ($/hour)</label>
                <input 
                    type="number" 
                    id="rateApplied" 
                    value={rateApplied} 
                    onChange={(e) => setRateApplied(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className={`${inputBaseClasses} ${isCountBasedRecord ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    readOnly={isCountBasedRecord}
                    required={!isCountBasedRecord} 
                    title={isCountBasedRecord ? "Rate is not applicable for count-based records here." : "Rate is determined by the project for new records."}
                />
            </div>
            </div>
        )}
        
        {currentBillingType === 'count_based' && existingRecordId && (
            <div>
                 <p className="text-sm text-gray-500 mt-1">This form does not support editing calculated amounts for count-based projects. Please use the Billing Calculator.</p>
            </div>
        )}


        <div>
          <label htmlFor="notes" className={`block text-sm font-medium text-${THEME.accentText}`}>Notes (Optional)</label>
          <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputBaseClasses}></textarea>
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            <p>{error}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-2">
            <button
                type="button"
                onClick={() => navigate('/app/admin/billing')}
                className={`px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.secondary} transition`}
            >
                Cancel
            </button>
            <button type="submit" disabled={isLoading || isFetchingInitialData} className={buttonPrimaryClasses}>
            {isLoading ? (
                <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
                </>
            ) : (existingRecordId ? 'Save Changes' : 'Create Record')}
            </button>
        </div>
      </form>
    </div>
  );
};

export default BillingForm;