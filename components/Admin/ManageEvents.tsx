import React, { useState, useEffect, FormEvent } from 'react';
import { apiFetchCompanyEvents, apiAddCompanyEvent, apiDeleteCompanyEvent } from '../../services/api';
import { CompanyEvent, NewCompanyEventData } from '../../types';
import { THEME } from '../../constants';
import { PlusCircleIcon, TrashIcon, FlagIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/dateUtils';

const ManageEvents: React.FC = () => {
    const [events, setEvents] = useState<CompanyEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state for new event
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [isHoliday, setIsHoliday] = useState(false);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const loadEvents = async () => {
        setLoading(true);
        setError(null);
        try {
            const fetchedEvents = await apiFetchCompanyEvents();
            setEvents(fetchedEvents.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (err: any) {
            setError(err.message || 'Failed to load events.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEvents();
    }, []);

    const resetForm = () => {
        setTitle('');
        setDate('');
        setIsHoliday(false);
        setDescription('');
        setFormError(null);
    };

    const handleFormSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setFormError(null);
        if (!title || !date) {
            setFormError("Event title and date are required.");
            return;
        }

        setIsSubmitting(true);
        const newEventData: NewCompanyEventData = { title, date, isHoliday, description };
        try {
            await apiAddCompanyEvent(newEventData);
            resetForm();
            loadEvents(); // Reload the list
        } catch (err: any) {
            setFormError(err.message || "Failed to add event.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (window.confirm("Are you sure you want to delete this event?")) {
            try {
                await apiDeleteCompanyEvent(eventId);
                loadEvents(); // Reload list
            } catch (err: any) {
                setError(err.message || "Failed to delete event.");
            }
        }
    };

    const inputBaseClasses = `mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`;
    const buttonPrimaryClasses = `inline-flex items-center px-4 py-2 bg-${THEME.primary} text-${THEME.primaryText} text-sm font-medium rounded-md hover:bg-opacity-85 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.primary} disabled:opacity-50`;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add Event Form */}
            <div className={`lg:col-span-1 p-6 bg-white rounded-xl shadow-lg`}>
                <h3 className={`text-xl font-semibold text-${THEME.primary} mb-4 flex items-center`}>
                    <PlusCircleIcon className="h-6 w-6 mr-2" />
                    Add Event or Holiday
                </h3>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="title" className={`block text-sm font-medium text-${THEME.accentText}`}>Title</label>
                        <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className={inputBaseClasses} required />
                    </div>
                    <div>
                        <label htmlFor="date" className={`block text-sm font-medium text-${THEME.accentText}`}>Date</label>
                        <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className={inputBaseClasses} required />
                    </div>
                    <div>
                        <label htmlFor="description" className={`block text-sm font-medium text-${THEME.accentText}`}>Description (Optional)</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inputBaseClasses}></textarea>
                    </div>
                    <div className="flex items-center">
                        <input
                            id="isHoliday"
                            type="checkbox"
                            checked={isHoliday}
                            onChange={e => setIsHoliday(e.target.checked)}
                            className={`h-4 w-4 rounded border-gray-300 text-${THEME.primary} focus:ring-${THEME.secondary}`}
                        />
                        <label htmlFor="isHoliday" className={`ml-2 block text-sm text-${THEME.accentText}`}>Mark as Public Holiday</label>
                    </div>
                    {formError && <p className="text-sm text-red-600">{formError}</p>}
                    <button type="submit" disabled={isSubmitting} className={`${buttonPrimaryClasses} w-full justify-center`}>
                        {isSubmitting ? 'Adding...' : 'Add Event'}
                    </button>
                </form>
            </div>

            {/* Event List */}
            <div className={`lg:col-span-2 p-6 bg-white rounded-xl shadow-lg`}>
                <h2 className={`text-2xl font-semibold text-${THEME.primary} mb-6 flex items-center`}>
                    <FlagIcon className="h-7 w-7 mr-2" />
                    Manage Company Events
                </h2>
                {loading ? (
                    <p>Loading events...</p>
                ) : error ? (
                    <p className="text-red-600">{error}</p>
                ) : events.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No events found. Add one to get started.</p>
                ) : (
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {events.map(event => (
                            <div key={event.id} className={`p-3 border rounded-md flex justify-between items-start ${event.isHoliday ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'}`}>
                                <div>
                                    <p className={`font-semibold ${event.isHoliday ? 'text-blue-800' : 'text-purple-800'}`}>{event.title}</p>
                                    <p className={`text-sm ${event.isHoliday ? 'text-blue-700' : 'text-purple-700'}`}>{formatDate(event.date)}</p>
                                    {event.description && <p className="text-xs text-gray-600 mt-1">{event.description}</p>}
                                </div>
                                <button onClick={() => handleDeleteEvent(event.id)} className="p-1.5 text-gray-500 hover:text-red-600 transition-colors" title="Delete Event">
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageEvents;
