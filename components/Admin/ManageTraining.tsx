import React, { useState, useEffect, FormEvent } from 'react';
import { 
    apiFetchTrainingMaterials, 
    apiAddTrainingMaterial, 
    apiUpdateTrainingMaterial, 
    apiDeleteTrainingMaterial 
} from '../../services/api';
import { 
    TrainingMaterial, 
    TrainingCategory, 
    TrainingMaterialType,
    NewTrainingMaterialData,
    UpdateTrainingMaterialData
} from '../../types';
import { THEME } from '../../constants';
import { PlusCircleIcon, PencilSquareIcon, TrashIcon, XMarkIcon, AcademicCapIcon, DocumentTextIcon, VideoCameraIcon, LinkIcon, PresentationChartLineIcon } from '@heroicons/react/24/outline';

const ManageTraining: React.FC = () => {
    const [materials, setMaterials] = useState<TrainingMaterial[]>([]);
    const [filteredMaterials, setFilteredMaterials] = useState<TrainingMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentMaterial, setCurrentMaterial] = useState<Partial<TrainingMaterial> | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<TrainingCategory>(TrainingCategory.ONBOARDING);
    const [type, setType] = useState<TrainingMaterialType>(TrainingMaterialType.DOCUMENT_PDF);
    const [url, setUrl] = useState('');
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [duration, setDuration] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadMaterials();
    }, []);

    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filteredData = materials.filter(material =>
            material.title.toLowerCase().includes(lowercasedFilter) ||
            material.description.toLowerCase().includes(lowercasedFilter) ||
            material.category.toLowerCase().includes(lowercasedFilter)
        );
        setFilteredMaterials(filteredData);
    }, [searchTerm, materials]);

    const loadMaterials = async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedMaterials = await apiFetchTrainingMaterials();
            setMaterials(fetchedMaterials);
        } catch (err: any) {
            setError(err.message || 'Failed to load training materials.');
        } finally {
            setLoading(false);
        }
    };

    const resetFormFields = () => {
        setTitle('');
        setDescription('');
        setCategory(TrainingCategory.ONBOARDING);
        setType(TrainingMaterialType.DOCUMENT_PDF);
        setUrl('');
        setThumbnailUrl('');
        setDuration('');
        setFormError(null);
    };

    const openModalForAdd = () => {
        setCurrentMaterial(null);
        resetFormFields();
        setIsModalOpen(true);
    };

    const openModalForEdit = (material: TrainingMaterial) => {
        setCurrentMaterial(material);
        setTitle(material.title);
        setDescription(material.description);
        setCategory(material.category);
        setType(material.type);
        setUrl(material.url);
        setThumbnailUrl(material.thumbnailUrl || '');
        setDuration(material.duration || '');
        setFormError(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentMaterial(null);
        resetFormFields();
    };

    const handleFormSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!title.trim() || !url.trim()) {
            setFormError('Title and URL are required.');
            return;
        }

        const materialData: NewTrainingMaterialData = {
            title: title.trim(),
            description: description.trim(),
            category,
            type,
            url: url.trim(),
            thumbnailUrl: thumbnailUrl.trim() || undefined,
            duration: duration.trim() || undefined,
        };
        
        setIsSubmitting(true);
        try {
            if (currentMaterial && currentMaterial.id) {
                const updateData: UpdateTrainingMaterialData = materialData;
                await apiUpdateTrainingMaterial(currentMaterial.id, updateData);
            } else {
                await apiAddTrainingMaterial(materialData);
            }
            await loadMaterials();
            closeModal();
        } catch (err: any) {
            setFormError(err.message || 'Failed to save training material.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteMaterial = async (materialId: string) => {
        if (window.confirm('Are you sure you want to delete this training material?')) {
            try {
                await apiDeleteTrainingMaterial(materialId);
                await loadMaterials();
            } catch (err: any) {
                setError(err.message || 'Failed to delete material.');
            }
        }
    };
    
    const getIconForType = (type: TrainingMaterialType) => {
        const iconProps = { className: "h-5 w-5" };
        switch (type) {
            case TrainingMaterialType.DOCUMENT_PDF: return <DocumentTextIcon {...iconProps} />;
            case TrainingMaterialType.VIDEO: return <VideoCameraIcon {...iconProps} />;
            case TrainingMaterialType.EXTERNAL_LINK: return <LinkIcon {...iconProps} />;
            case TrainingMaterialType.PRESENTATION: return <PresentationChartLineIcon {...iconProps} />;
            default: return <AcademicCapIcon {...iconProps} />;
        }
    };

    const inputBaseClasses = `mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`;
    const selectBaseClasses = `mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`;
    const buttonPrimaryClasses = `inline-flex items-center px-4 py-2 bg-${THEME.primary} text-${THEME.primaryText} text-sm font-medium rounded-md hover:bg-opacity-85 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.primary}`;

    return (
        <div className={`p-6 bg-white rounded-xl shadow-lg`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className={`text-2xl font-semibold text-${THEME.primary} flex items-center`}>
                    <AcademicCapIcon className="h-7 w-7 mr-2"/>
                    Manage Training Materials
                </h2>
                <input
                    type="text"
                    placeholder="Filter by title, description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`${inputBaseClasses} sm:w-64 w-full`}
                />
                <button
                    onClick={openModalForAdd}
                    className={`${buttonPrimaryClasses} w-full sm:w-auto justify-center`}
                >
                    <PlusCircleIcon className="h-5 w-5 mr-2" />
                    Add New Material
                </button>
            </div>
            
            {/* Loading/Error states */}
            {loading && (
                <div className="text-center py-8">
                    <svg className={`animate-spin h-8 w-8 text-${THEME.primary} mx-auto mb-2`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading materials...
                </div>
            )}
            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
            
            {/* Table */}
            {!loading && !error && (
                filteredMaterials.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No training materials found. Add one to get started.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white">
                            <thead className={`bg-gray-50 border-b-2 border-${THEME.primary}`}>
                                <tr>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Duration</th>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredMaterials.map(material => (
                                    <tr key={material.id} className="hover:bg-gray-50">
                                        <td className="py-3 px-4 text-sm text-gray-700 font-medium">{material.title}</td>
                                        <td className="py-3 px-4 text-sm text-gray-500">{material.category}</td>
                                        <td className="py-3 px-4 text-sm text-gray-500">
                                            <span className="inline-flex items-center gap-x-1.5">
                                                {getIconForType(material.type)}
                                                {material.type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-500">{material.duration || 'N/A'}</td>
                                        <td className="py-3 px-4 text-sm text-gray-700 text-right">
                                            <button
                                                onClick={() => openModalForEdit(material)}
                                                className={`p-1.5 text-gray-500 hover:text-${THEME.secondary} transition-colors mr-2`}
                                                title="Edit Material"
                                            >
                                                <PencilSquareIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteMaterial(material.id)}
                                                className={`p-1.5 text-gray-500 hover:text-red-600 transition-colors`}
                                                title="Delete Material"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 overflow-y-auto">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg my-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-xl font-semibold text-${THEME.primary}`}>
                                {currentMaterial?.id ? 'Edit Training Material' : 'Add New Training Material'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleFormSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            <div>
                                <label htmlFor="title" className={`block text-sm font-medium text-${THEME.accentText}`}>Title</label>
                                <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputBaseClasses} required />
                            </div>
                            <div>
                                <label htmlFor="description" className={`block text-sm font-medium text-${THEME.accentText}`}>Description</label>
                                <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inputBaseClasses}></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="category" className={`block text-sm font-medium text-${THEME.accentText}`}>Category</label>
                                    <select id="category" value={category} onChange={e => setCategory(e.target.value as TrainingCategory)} className={selectBaseClasses}>
                                        {Object.values(TrainingCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="type" className={`block text-sm font-medium text-${THEME.accentText}`}>Type</label>
                                    <select id="type" value={type} onChange={e => setType(e.target.value as TrainingMaterialType)} className={selectBaseClasses}>
                                        {Object.values(TrainingMaterialType).map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                             <div>
                                <label htmlFor="url" className={`block text-sm font-medium text-${THEME.accentText}`}>URL (Link to material, PDF, or video embed)</label>
                                <input id="url" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/doc.pdf" className={inputBaseClasses} required />
                            </div>
                            <div>
                                <label htmlFor="thumbnailUrl" className={`block text-sm font-medium text-${THEME.accentText}`}>Thumbnail Image URL (Optional)</label>
                                <input id="thumbnailUrl" type="url" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} placeholder="https://example.com/image.png" className={inputBaseClasses} />
                            </div>
                            <div>
                                <label htmlFor="duration" className={`block text-sm font-medium text-${THEME.accentText}`}>Duration (Optional)</label>
                                <input id="duration" type="text" value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g., 15 min read, 1 hour video" className={inputBaseClasses} />
                            </div>

                            {formError && <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md">{formError}</p>}
                            
                            <div className="flex justify-end space-x-3 pt-2">
                                <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className={`${buttonPrimaryClasses} disabled:opacity-50`}>
                                    {isSubmitting ? 'Saving...' : (currentMaterial?.id ? 'Save Changes' : 'Add Material')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageTraining;
