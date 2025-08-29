import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
    apiFetchFeatureSuggestions, 
    apiAddFeatureSuggestion, 
    apiVoteForFeature 
} from '../../services/api';
import { UIFeatureSuggestion, NewFeatureSuggestionData } from '../../types';
import { THEME } from '../../constants';
import { LightBulbIcon, PlusIcon, UserCircleIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import { ArrowUpIcon as ArrowUpSolidIcon } from '@heroicons/react/24/solid';
import { formatDate } from '../../utils/dateUtils';

const FeatureVotingPage: React.FC = () => {
    const { user } = useAuth();
    const [suggestions, setSuggestions] = useState<UIFeatureSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const loadSuggestions = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const fetchedSuggestions = await apiFetchFeatureSuggestions(user.id);
            setSuggestions(fetchedSuggestions);
        } catch (err: any) {
            setError(err.message || "Failed to load suggestions.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadSuggestions();
    }, [loadSuggestions]);

    const handleVote = async (suggestionId: string) => {
        if (!user) return;
        
        const originalSuggestions = [...suggestions];
        
        // Optimistic UI update
        setSuggestions(prevSuggestions => 
            prevSuggestions.map(s => {
                if (s.id === suggestionId) {
                    const hasVoted = s.currentUserHasVoted;
                    return {
                        ...s,
                        voteCount: hasVoted ? s.voteCount - 1 : s.voteCount + 1,
                        currentUserHasVoted: !hasVoted,
                    };
                }
                return s;
            })
        );
        
        try {
            await apiVoteForFeature(suggestionId, user.id);
        } catch (err: any) {
            // Revert UI on error
            setError(`Failed to update vote: ${err.message}`);
            setSuggestions(originalSuggestions);
        }
    };

    const handleSuggestionSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user) {
            setFormError("You must be logged in to submit a suggestion.");
            return;
        }
        if (!title.trim() || !description.trim()) {
            setFormError("Both title and description are required.");
            return;
        }
        
        setIsSubmitting(true);
        setFormError(null);
        
        const suggestionData: NewFeatureSuggestionData = {
            title,
            description,
            submittedByUserId: user.id,
        };
        
        try {
            await apiAddFeatureSuggestion(suggestionData);
            setTitle('');
            setDescription('');
            await loadSuggestions(); // Reload to get the new list with our auto-vote
        } catch (err: any) {
            setFormError(err.message || "Failed to submit suggestion.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const inputBaseClasses = `mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`;
    const buttonPrimaryClasses = `inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-${THEME.primaryText} bg-${THEME.primary} hover:bg-opacity-85 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.primary} disabled:opacity-50`;

    return (
        <div className="space-y-6">
            <div className={`p-6 bg-white rounded-xl shadow-lg`}>
                <h2 className={`text-2xl font-semibold text-${THEME.primary} flex items-center mb-2`}>
                    <LightBulbIcon className="h-7 w-7 mr-2" />
                    Feature Suggestions & Voting
                </h2>
                <p className={`text-sm text-${THEME.accentText}`}>Have an idea for a new feature? Suggest it here! Upvote the features you'd like to see implemented.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Suggestions List */}
                <div className="lg:col-span-2 space-y-4">
                     {loading ? (
                        <p className="text-center text-gray-500 py-8">Loading suggestions...</p>
                    ) : error ? (
                        <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>
                    ) : suggestions.length === 0 ? (
                         <p className="text-center text-gray-500 py-8">No suggestions yet. Be the first to add one!</p>
                    ) : (
                        suggestions.map(suggestion => (
                            <div key={suggestion.id} className="bg-white p-4 rounded-xl shadow-lg flex items-start gap-4">
                                <button 
                                    onClick={() => handleVote(suggestion.id)}
                                    className={`flex flex-col items-center justify-center p-2 rounded-md transition-colors ${suggestion.currentUserHasVoted ? `bg-${THEME.primary} text-white` : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                                >
                                    {suggestion.currentUserHasVoted ? <ArrowUpSolidIcon className="h-6 w-6"/> : <ArrowUpIcon className="h-6 w-6"/>}
                                    <span className="text-lg font-bold">{suggestion.voteCount}</span>
                                </button>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg text-gray-800">{suggestion.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                                    <div className="flex items-center mt-3 text-xs text-gray-500">
                                        {suggestion.submittedByUserProfilePictureUrl ? (
                                            <img src={suggestion.submittedByUserProfilePictureUrl} alt={suggestion.submittedByUserName} className="w-5 h-5 rounded-full object-cover mr-1.5" />
                                        ) : (
                                            <UserCircleIcon className="w-5 h-5 text-gray-400 mr-1.5" />
                                        )}
                                        <span>Suggested by <strong>{suggestion.submittedByUserName}</strong> on {formatDate(suggestion.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Suggestion Form */}
                <div className="lg:col-span-1">
                     <form onSubmit={handleSuggestionSubmit} className="bg-white p-4 rounded-xl shadow-lg space-y-4 sticky top-6">
                        <h3 className="font-semibold text-lg text-gray-800">Suggest a New Feature</h3>
                         <div>
                            <label htmlFor="title" className={`block text-sm font-medium text-${THEME.accentText}`}>Feature Title</label>
                            <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputBaseClasses} required placeholder="e.g., Dark Mode" />
                        </div>
                        <div>
                            <label htmlFor="description" className={`block text-sm font-medium text-${THEME.accentText}`}>Description</label>
                            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputBaseClasses} required placeholder="Describe your idea..."></textarea>
                        </div>
                        {formError && <p className="text-sm text-red-600">{formError}</p>}
                        <button type="submit" disabled={isSubmitting} className={`${buttonPrimaryClasses} w-full justify-center`}>
                            <PlusIcon className="h-5 w-5 mr-2" />
                            {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default FeatureVotingPage;
