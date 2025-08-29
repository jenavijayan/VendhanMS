
import React, { useState, useEffect, FormEvent } from 'react';
import { apiFetchProjects, apiAddProject, apiUpdateProject, apiDeleteProject } from '../../services/api';
import { Project, ProjectBillingType } from '../../types';
import { THEME } from '../../constants';
import { PlusCircleIcon, PencilSquareIcon, TrashIcon, XMarkIcon, BeakerIcon, ClockIcon } from '@heroicons/react/24/outline';

const ManageProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Partial<Project> | null>(null); 
  
  const [projectName, setProjectName] = useState('');
  const [billingType, setBillingType] = useState<ProjectBillingType>('hourly');
  const [ratePerHour, setRatePerHour] = useState<number | ''>('');
  const [countMetricLabel, setCountMetricLabel] = useState('');
  const [countDivisor, setCountDivisor] = useState<number | ''>(1);
  const [countMultiplier, setCountMultiplier] = useState<number | ''>('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = projects.filter(project =>
      project.name.toLowerCase().includes(lowercasedFilter)
    );
    setFilteredProjects(filteredData);
  }, [searchTerm, projects]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedProjects = await apiFetchProjects();
      setProjects(fetchedProjects);
      // setFilteredProjects(fetchedProjects); // Handled by useEffect
    } catch (err: any) {
      setError(err.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  const resetFormFields = () => {
    setProjectName('');
    setBillingType('hourly');
    setRatePerHour('');
    setCountMetricLabel('');
    setCountDivisor(1);
    setCountMultiplier('');
    setFormError(null);
  };

  const openModalForAdd = () => {
    setCurrentProject(null);
    resetFormFields();
    setIsModalOpen(true);
  };

  const openModalForEdit = (project: Project) => {
    setCurrentProject(project);
    setProjectName(project.name);
    setBillingType(project.billingType);
    setRatePerHour(project.ratePerHour || '');
    setCountMetricLabel(project.countMetricLabel || '');
    setCountDivisor(project.countDivisor || 1);
    setCountMultiplier(project.countMultiplier || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentProject(null);
    resetFormFields();
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!projectName.trim()) {
      setFormError('Project name is required.');
      return;
    }

    let projectData: Partial<Omit<Project, 'id'>> = { 
        name: projectName.trim(),
        billingType: billingType,
    };

    if (billingType === 'hourly') {
      if (ratePerHour === '' || Number(ratePerHour) <= 0) {
        setFormError('A valid positive rate per hour is required for hourly billing.');
        return;
      }
      projectData.ratePerHour = Number(ratePerHour);
      projectData.countMetricLabel = undefined;
      projectData.countDivisor = undefined;
      projectData.countMultiplier = undefined;
    } else if (billingType === 'count_based') {
      if (!countMetricLabel.trim()) {
        setFormError('Count metric label is required for count-based billing.');
        return;
      }
      if (countMultiplier === '' || Number(countMultiplier) <= 0) {
        setFormError('A valid positive count multiplier is required.');
        return;
      }
      if (countDivisor === '' || Number(countDivisor) <= 0) {
        setFormError('A valid positive count divisor is required (e.g., 1).');
        return;
      }
      projectData.ratePerHour = undefined; 
      projectData.countMetricLabel = countMetricLabel.trim();
      projectData.countDivisor = Number(countDivisor);
      projectData.countMultiplier = Number(countMultiplier);
    }


    try {
      if (currentProject && currentProject.id) { 
        const updatedProject = await apiUpdateProject(currentProject.id, projectData);
        setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
      } else { 
        const newProject = await apiAddProject(projectData as Omit<Project, 'id'>);
        setProjects([...projects, newProject]);
      }
      closeModal();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save project.');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await apiDeleteProject(projectId);
        setProjects(projects.filter(p => p.id !== projectId));
        alert('Project deleted successfully.');
      } catch (err: any) {
         setError(err.message || 'Failed to delete project.');
         alert(`Error: ${err.message || 'Failed to delete project.'}`);
      }
    }
  };
  
  const formatCurrency = (amount?: number): string => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };
  
  const inputBaseClasses = `mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`;
  const selectBaseClasses = `mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`;


  if (loading && projects.length === 0) {
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

  if (error) {
    return <div className={`p-6 bg-red-100 text-red-700 rounded-xl shadow-lg`}>Error: {error}</div>;
  }

  return (
    <div className={`p-6 bg-white rounded-xl shadow-lg`}>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className={`text-2xl font-semibold text-${THEME.primary}`}>Manage Projects</h2>
         <input
            type="text"
            placeholder="Filter by project name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${inputBaseClasses} sm:w-64 w-full`}
        />
        <button
          onClick={openModalForAdd}
          className={`inline-flex items-center px-4 py-2 bg-${THEME.primary} text-${THEME.primaryText} text-sm font-medium rounded-md hover:bg-opacity-85 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.primary} w-full sm:w-auto justify-center`}
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          Add New Project
        </button>
      </div>
      
      {loading && <p className={`text-sm text-${THEME.accentText} my-2`}>Refreshing project list...</p>}
      {filteredProjects.length === 0 ? (
        <p className={`text-center text-gray-500 py-8`}>{searchTerm ? 'No projects match your search.' : 'No projects found. Add one to get started.'}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className={`bg-gray-50 border-b-2 border-${THEME.primary}`}>
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Project Name</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Billing Type</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Details</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map(project => (
                <tr key={project.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-700">{project.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${project.billingType === 'hourly' ? `bg-blue-100 text-blue-800` : `bg-purple-100 text-purple-800`}`}>
                      {project.billingType === 'hourly' ? <ClockIcon className="h-3 w-3 mr-1"/> : <BeakerIcon className="h-3 w-3 mr-1" />}
                      {project.billingType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {project.billingType === 'hourly' ? `Rate: ${formatCurrency(project.ratePerHour)}/hr` : 
                     `Metric: ${project.countMetricLabel || 'N/A'}, Formula: (Count / ${project.countDivisor || 1}) * ${project.countMultiplier || 'N/A'}`
                    }
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700 text-right">
                    <button 
                      onClick={() => openModalForEdit(project)}
                      className={`p-1.5 text-gray-500 hover:text-${THEME.secondary} transition-colors mr-2`}
                      title="Edit Project"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteProject(project.id)}
                      className={`p-1.5 text-gray-500 hover:text-red-600 transition-colors`}
                      title="Delete Project"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Add/Edit Project */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 overflow-y-auto">
          <div className={`bg-white p-6 rounded-lg shadow-xl w-full max-w-lg my-8`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-semibold text-${THEME.primary}`}>
                {currentProject?.id ? 'Edit Project' : 'Add New Project'}
              </h3>
              <button onClick={closeModal} className={`text-gray-400 hover:text-gray-600`}>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <label htmlFor="modalProjectName" className={`block text-sm font-medium text-${THEME.accentText}`}>Project Name</label>
                <input
                  type="text"
                  id="modalProjectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className={inputBaseClasses}
                  required
                />
              </div>
              <div>
                <label htmlFor="modalBillingType" className={`block text-sm font-medium text-${THEME.accentText}`}>Billing Type</label>
                <select 
                    id="modalBillingType" 
                    value={billingType} 
                    onChange={(e) => setBillingType(e.target.value as ProjectBillingType)} 
                    className={selectBaseClasses}
                >
                    <option value="hourly">Hourly</option>
                    <option value="count_based">Count-Based</option>
                </select>
              </div>

              {billingType === 'hourly' && (
                <div>
                  <label htmlFor="modalRatePerHour" className={`block text-sm font-medium text-${THEME.accentText}`}>Rate Per Hour ($)</label>
                  <input
                    type="number"
                    id="modalRatePerHour"
                    value={ratePerHour}
                    onChange={(e) => setRatePerHour(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    min="0.01"
                    step="0.01"
                    className={inputBaseClasses}
                    required={billingType === 'hourly'}
                  />
                </div>
              )}

              {billingType === 'count_based' && (
                <>
                  <div>
                    <label htmlFor="modalCountMetricLabel" className={`block text-sm font-medium text-${THEME.accentText}`}>Count Metric Label</label>
                    <input
                      type="text"
                      id="modalCountMetricLabel"
                      value={countMetricLabel}
                      onChange={(e) => setCountMetricLabel(e.target.value)}
                      className={inputBaseClasses}
                      placeholder="e.g., Record Count, Page Count"
                      required={billingType === 'count_based'}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="modalCountDivisor" className={`block text-sm font-medium text-${THEME.accentText}`}>Divisor for Count</label>
                      <input
                        type="number"
                        id="modalCountDivisor"
                        value={countDivisor}
                        onChange={(e) => setCountDivisor(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        min="1"
                        step="1"
                        className={inputBaseClasses}
                        placeholder="e.g., 1 or 1000"
                        required={billingType === 'count_based'}
                      />
                    </div>
                    <div>
                      <label htmlFor="modalCountMultiplier" className={`block text-sm font-medium text-${THEME.accentText}`}>Multiplier for Result</label>
                      <input
                        type="number"
                        id="modalCountMultiplier"
                        value={countMultiplier}
                        onChange={(e) => setCountMultiplier(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        min="0.001"
                        step="any"
                        className={inputBaseClasses}
                        placeholder="e.g., 0.125"
                        required={billingType === 'count_based'}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Formula: (Total Monthly Count / Divisor) * Multiplier</p>
                </>
              )}
              
              {formError && (
                <div className="mt-2 p-2 bg-red-100 border border-red-300 text-red-700 text-sm rounded-md">
                  {formError}
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className={`px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-${THEME.primaryText} bg-${THEME.primary} hover:bg-opacity-85 focus:outline-none`}
                >
                  {currentProject?.id ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProjects;
