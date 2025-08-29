import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Company, NotebookEntry, NewNotebookEntryData } from '../../types';
import { apiFetchCompanyDetails, apiFetchUserNotebookEntries, apiAddOrUpdateNotebookEntry, apiDeleteNotebookEntry } from '../../services/api';
import { THEME } from '../../constants';
import { BookOpenIcon, PlusIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/dateUtils';

// Define the structure for themes and fonts
const FONT_STYLES: { name: string; value: NotebookEntry['fontStyle'] }[] = [
    { name: 'Sans Serif', value: 'font-sans' },
    { name: 'Serif', value: 'font-serif' },
    { name: 'Monospace', value: 'font-mono' },
];

const COLOR_THEMES: { name: string; value: NotebookEntry['colorTheme']; bg: string; text: string; }[] = [
    { name: 'Classic', value: 'classic', bg: 'bg-notebook-classic-bg', text: 'text-notebook-classic-text' },
    { name: 'Pastel', value: 'pastel', bg: 'bg-notebook-pastel-bg', text: 'text-notebook-pastel-text' },
    { name: 'Ocean', value: 'ocean', bg: 'bg-notebook-ocean-bg', text: 'text-notebook-ocean-text' },
    { name: 'Forest', value: 'forest', bg: 'bg-notebook-forest-bg', text: 'text-notebook-forest-text' },
];


const PersonalNotebook: React.FC = () => {
    const { user } = useAuth();
    const [company, setCompany] = useState<Company | null>(null);
    const [entries, setEntries] = useState<NotebookEntry[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    
    // Editor state
    const [currentContent, setCurrentContent] = useState('');
    const [currentFontStyle, setCurrentFontStyle] = useState<NotebookEntry['fontStyle']>('font-sans');
    const [currentColorTheme, setCurrentColorTheme] = useState<NotebookEntry['colorTheme']>('classic');
    const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const loadNotebookData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const [companyDetails, userEntries] = await Promise.all([
                apiFetchCompanyDetails(),
                apiFetchUserNotebookEntries(user.id)
            ]);
            setCompany(companyDetails);
            setEntries(userEntries);
        } catch (err: any) {
            setError(err.message || "Failed to load notebook data.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadNotebookData();
    }, [loadNotebookData]);

    // Effect to update editor when selectedDate or entries list changes
    useEffect(() => {
        const entryForSelectedDate = entries.find(e => e.date === selectedDate);
        if (entryForSelectedDate) {
            setCurrentContent(entryForSelectedDate.content);
            setCurrentFontStyle(entryForSelectedDate.fontStyle);
            setCurrentColorTheme(entryForSelectedDate.colorTheme);
            setCurrentEntryId(entryForSelectedDate.id);
        } else {
            // Reset to default for a new entry
            setCurrentContent('');
            setCurrentFontStyle('font-sans');
            setCurrentColorTheme('classic');
            setCurrentEntryId(null);
        }
    }, [selectedDate, entries]);

    const handleDateSelect = (date: string) => {
        setSelectedDate(date);
    };

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        if (!user) {
            setError("Cannot save, user is not logged in.");
            return;
        }
        setIsSaving(true);
        setError(null);

        const entryData: NewNotebookEntryData = {
            userId: user.id,
            date: selectedDate,
            content: currentContent,
            fontStyle: currentFontStyle,
            colorTheme: currentColorTheme,
        };

        try {
            await apiAddOrUpdateNotebookEntry(entryData);
            await loadNotebookData(); // Refresh list after saving
        } catch (err: any) {
            setError(err.message || "Failed to save entry.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!currentEntryId || !user) {
            setError("No entry selected to delete.");
            return;
        }
        if (!window.confirm("Are you sure you want to delete this entry? This action cannot be undone.")) {
            return;
        }

        setIsSaving(true);
        setError(null);
        try {
            await apiDeleteNotebookEntry(currentEntryId, user.id);
            // After deleting, select today's date to show a fresh page
            setSelectedDate(new Date().toISOString().split('T')[0]);
            await loadNotebookData();
        } catch (err: any) {
            setError(err.message || "Failed to delete entry.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const activeTheme = COLOR_THEMES.find(t => t.value === currentColorTheme) || COLOR_THEMES[0];
    
    if (loading) {
        return (
            <div className={`p-6 bg-white rounded-xl shadow-lg text-center text-${THEME.accentText}`}>
                <svg className={`animate-spin h-8 w-8 text-${THEME.primary} mx-auto mb-2`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Opening your notebook...
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
            {/* Left Panel: Entry List */}
            <aside className="lg:w-1/3 bg-white p-4 rounded-xl shadow-lg">
                <h2 className={`text-xl font-semibold text-${THEME.primary} mb-4 flex items-center`}>
                    <BookOpenIcon className="h-6 w-6 mr-2"/>
                    My Diary Entries
                </h2>
                <button 
                    onClick={() => handleDateSelect(new Date().toISOString().split('T')[0])}
                    className={`w-full flex items-center justify-center mb-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-${THEME.primaryText} bg-${THEME.secondary} hover:bg-opacity-85`}
                >
                    <PlusIcon className="h-5 w-5 mr-2"/>
                    New Entry for Today
                </button>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {entries.map(entry => (
                        <div 
                            key={entry.id}
                            onClick={() => handleDateSelect(entry.date)}
                            className={`p-2 rounded-md cursor-pointer transition-colors ${selectedDate === entry.date ? `bg-${THEME.primary} text-white` : `bg-gray-100 hover:bg-${THEME.accent}`}`}
                        >
                            <p className={`font-semibold text-sm ${selectedDate === entry.date ? '' : `text-${THEME.accentText}`}`}>{formatDate(entry.date, { dateStyle: 'full' })}</p>
                            <p className="text-xs truncate">{entry.content || 'Empty entry'}</p>
                        </div>
                    ))}
                    {entries.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No entries yet. Create one!</p>}
                </div>
            </aside>

            {/* Right Panel: Editor */}
            <main className="lg:w-2/3">
                <form onSubmit={handleSave} className={`flex flex-col h-full bg-white p-4 rounded-xl shadow-lg`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 p-2 rounded-t-lg border-b-2 border-gray-200">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">{company?.name || 'My Notebook'}</h3>
                            <p className="text-sm text-gray-500">{formatDate(selectedDate, { dateStyle: 'full' })}</p>
                        </div>
                        {/* Toolbar */}
                        <div className="flex items-center gap-4 mt-2 sm:mt-0">
                            <div>
                                <span className="text-xs font-medium text-gray-500">Font:</span>
                                <div className="flex items-center gap-1 mt-1">
                                    {FONT_STYLES.map(font => (
                                        <button key={font.value} type="button" onClick={() => setCurrentFontStyle(font.value)} className={`px-2 py-1 text-xs rounded-md ${currentFontStyle === font.value ? `bg-${THEME.secondary} text-white` : 'bg-gray-200 hover:bg-gray-300'}`}>{font.name}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <span className="text-xs font-medium text-gray-500">Theme:</span>
                                <div className="flex items-center gap-1 mt-1">
                                    {COLOR_THEMES.map(theme => (
                                        <button key={theme.value} type="button" onClick={() => setCurrentColorTheme(theme.value)} className={`h-6 w-6 rounded-full ${theme.bg} border-2 ${currentColorTheme === theme.value ? `border-${THEME.secondary}` : 'border-transparent'}`} title={theme.name}></button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <textarea 
                        value={currentContent}
                        onChange={(e) => setCurrentContent(e.target.value)}
                        placeholder="Start writing your thoughts..."
                        className={`flex-grow w-full p-4 text-base resize-none focus:outline-none transition-colors duration-300 rounded-b-lg ${activeTheme.bg} ${activeTheme.text} ${currentFontStyle}`}
                        style={{ lineHeight: '1.7' }}
                    />

                     {error && <div className="mt-2 p-2 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

                    <div className="flex justify-between items-center mt-4">
                        <button 
                            type="submit" 
                            disabled={isSaving}
                            className={`px-4 py-2 text-sm font-medium rounded-md flex items-center justify-center bg-${THEME.primary} text-white hover:bg-opacity-85 disabled:opacity-50`}
                        >
                            <CheckIcon className="h-5 w-5 mr-2" />
                            {isSaving ? 'Saving...' : 'Save Entry'}
                        </button>
                        {currentEntryId && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isSaving}
                                className="px-4 py-2 text-sm font-medium rounded-md flex items-center text-red-600 bg-red-100 hover:bg-red-200 disabled:opacity-50"
                            >
                                <TrashIcon className="h-5 w-5 mr-2" />
                                Delete
                            </button>
                        )}
                    </div>
                </form>
            </main>
        </div>
    );
};

export default PersonalNotebook;
