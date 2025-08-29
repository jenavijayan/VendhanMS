import React, { useState, useEffect, useMemo } from 'react';
import { apiFetchTrainingMaterials } from '../../services/api';
import { TrainingMaterial, TrainingCategory, TrainingMaterialType } from '../../types';
import { THEME } from '../../constants';
import { AcademicCapIcon, MagnifyingGlassIcon, DocumentTextIcon, VideoCameraIcon, LinkIcon, PresentationChartLineIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Video Modal Component
const VideoModal: React.FC<{ url: string; title: string; onClose: () => void; }> = ({ url, title, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b">
                <h3 className={`text-lg font-semibold text-${THEME.primary}`}>{title}</h3>
                <button onClick={onClose} className={`text-gray-400 hover:text-gray-600`}>
                    <XMarkIcon className="h-6 w-6" />
                </button>
            </div>
            <div className="aspect-w-16 aspect-h-9 bg-black">
                <iframe
                    src={url}
                    title={title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                ></iframe>
            </div>
        </div>
    </div>
);


const TrainingPage: React.FC = () => {
    const [materials, setMaterials] = useState<TrainingMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<TrainingCategory | 'All'>('All');
    
    const [videoModal, setVideoModal] = useState<{ isOpen: boolean; url: string; title: string; }>({ isOpen: false, url: '', title: '' });

    useEffect(() => {
        const loadMaterials = async () => {
            setLoading(true);
            setError(null);
            try {
                const fetchedMaterials = await apiFetchTrainingMaterials();
                setMaterials(fetchedMaterials);
            } catch (err: any) {
                setError(err.message || 'Failed to load training materials.');
            } finally {
                setLoading(false);
            }
        };
        loadMaterials();
    }, []);

    const filteredMaterials = useMemo(() => {
        return materials
            .filter(material => selectedCategory === 'All' || material.category === selectedCategory)
            .filter(material => 
                material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                material.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [materials, selectedCategory, searchTerm]);

    const handleViewMaterial = (material: TrainingMaterial) => {
        if (material.type === TrainingMaterialType.VIDEO) {
            setVideoModal({ isOpen: true, url: material.url, title: material.title });
        } else {
            // For PDFs, we can't show them directly. Link to them.
            // For external links, open them.
            window.open(material.url, '_blank', 'noopener,noreferrer');
        }
    };
    
    const getIconForType = (type: TrainingMaterialType) => {
        switch (type) {
            case TrainingMaterialType.DOCUMENT_PDF: return <DocumentTextIcon className="h-8 w-8 text-white" />;
            case TrainingMaterialType.VIDEO: return <VideoCameraIcon className="h-8 w-8 text-white" />;
            case TrainingMaterialType.EXTERNAL_LINK: return <LinkIcon className="h-8 w-8 text-white" />;
            case TrainingMaterialType.PRESENTATION: return <PresentationChartLineIcon className="h-8 w-8 text-white" />;
            default: return <AcademicCapIcon className="h-8 w-8 text-white" />;
        }
    };

    const categories: (TrainingCategory | 'All')[] = ['All', ...Object.values(TrainingCategory)];

    if (loading) {
        return (
            <div className={`p-6 bg-white rounded-xl shadow-lg text-center text-${THEME.accentText}`}>
                <svg className={`animate-spin h-8 w-8 text-${THEME.primary} mx-auto mb-2`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading Training Materials...
            </div>
        );
    }

    if (error) {
        return <div className={`p-6 bg-red-100 text-red-700 rounded-xl shadow-lg`}>Error: {error}</div>;
    }
    
    return (
        <div className="space-y-6">
            <div className={`p-6 bg-${THEME.primary} text-white rounded-xl shadow-lg`}>
                <div className="flex items-center space-x-4">
                    <AcademicCapIcon className="h-12 w-12"/>
                    <div>
                        <h1 className="text-3xl font-bold">Training & Development Center</h1>
                        <p className="text-lg opacity-90">Your one-stop shop for learning and growth.</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className={`p-4 bg-white rounded-xl shadow-lg`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label htmlFor="search" className={`block text-sm font-medium text-gray-700`}>Search Materials</label>
                        <div className="relative mt-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input
                                type="search"
                                name="search"
                                id="search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`block w-full rounded-md border-gray-300 pl-10 focus:border-${THEME.secondary} focus:ring-${THEME.secondary} sm:text-sm`}
                                placeholder="Search by title or description..."
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="category" className={`block text-sm font-medium text-gray-700`}>Category</label>
                         <select
                            id="category"
                            name="category"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value as TrainingCategory | 'All')}
                            className={`mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-${THEME.secondary} focus:outline-none focus:ring-${THEME.secondary} sm:text-sm`}
                        >
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Materials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMaterials.length > 0 ? (
                    filteredMaterials.map(material => (
                        <div key={material.id} className="flex flex-col bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
                            <div className="relative">
                                <img className="h-48 w-full object-cover" src={material.thumbnailUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=60'} alt={material.title} />
                                <div className={`absolute top-0 right-0 m-2 p-2 bg-${THEME.secondary} bg-opacity-80 rounded-full`}>
                                    {getIconForType(material.type)}
                                </div>
                            </div>
                            <div className="p-4 flex flex-col flex-grow">
                                <p className={`text-xs font-semibold uppercase tracking-wide text-${THEME.secondary}`}>{material.category}</p>
                                <h3 className="mt-1 text-lg font-semibold text-gray-800">{material.title}</h3>
                                <p className="mt-2 text-sm text-gray-600 flex-grow">{material.description}</p>
                                <div className="mt-4 flex justify-between items-center">
                                    <button
                                        onClick={() => handleViewMaterial(material)}
                                        className={`px-4 py-2 bg-${THEME.primary} text-white text-sm font-medium rounded-md hover:bg-opacity-85 transition-colors`}
                                    >
                                        {material.type === TrainingMaterialType.VIDEO ? 'Watch Now' : 'View Content'}
                                    </button>
                                    {material.duration && <span className="text-xs text-gray-500">{material.duration}</span>}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="md:col-span-2 lg:col-span-3 text-center py-16 text-gray-500">
                        <h3 className="text-xl font-semibold">No materials found</h3>
                        <p>Try adjusting your search or filter criteria.</p>
                    </div>
                )}
            </div>

            {videoModal.isOpen && (
                <VideoModal url={videoModal.url} title={videoModal.title} onClose={() => setVideoModal({ isOpen: false, url: '', title: '' })} />
            )}
        </div>
    );
};

export default TrainingPage;
