// pages/SummaryPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CalendarIcon,
    UserCircleIcon,
    UserIcon,
    DocumentTextIcon,
    ClockIcon,
    ArrowTopRightOnSquareIcon,
    AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

// API and types
import * as api from '../api';
import { ConsultationHistoryItem, ConsultationSession, Patient, Provider } from '../types';

// Components
import { Button, Spinner, EmptyState, Modal } from '../components/shared';
import { ProviderIndicator } from '../components/providers';

// Helper to format date
const formatDate = (dateString: string, includeTime = false) => {
    try {
        const date = new Date(dateString);
        const dateOptions: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };

        if (includeTime) {
            return date.toLocaleString(undefined, {
                ...dateOptions,
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        return date.toLocaleDateString(undefined, dateOptions);
    } catch (e) {
        return dateString;
    }
};

// Session Card Component
interface SessionCardProps {
    session: ConsultationHistoryItem;
    onClick: () => void;
}

const SessionCard: React.FC<SessionCardProps> = ({
    session,
    onClick
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-neutral-800 rounded-xl shadow-md hover:shadow-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden transition-all duration-300 h-full cursor-pointer"
            onClick={onClick}
        >
            {/* Status Indicator - Color bar at top */}
            <div className={`h-2 w-full ${session.status === 'completed' ? 'bg-green-500' : 'bg-primary-500'}`}></div>

            <div className="p-6">
                {/* Date and status */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center text-primary-600 dark:text-primary-400">
                        <CalendarIcon className="h-5 w-5 mr-2" />
                        <span className="text-sm font-medium">{formatDate(session.session_date, true)}</span>
                    </div>

                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${session.status === 'completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300'
                        }`}>
                        {session.status === 'completed' ? 'Completed' : 'In Progress'}
                    </div>
                </div>

                {/* Patient info */}
                <div className="mb-4">
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-1 line-clamp-1">
                        {session.patient_name}
                    </h3>
                </div>

                {/* Provider info */}
                <div className="flex items-center mb-4">
                    <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center mr-2">
                            <UserCircleIcon className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                        </div>
                        <div className="text-sm">
                            <span className="text-neutral-800 dark:text-neutral-200 font-medium">{session.provider_name}</span>
                            <div className="text-neutral-500 dark:text-neutral-400 text-xs">{session.provider_specialty}</div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700">
                    <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                        <DocumentTextIcon className="h-4 w-4 mr-2" />
                        <span>
                            {session.current_section === 'complete'
                                ? 'All sections completed'
                                : `Current: ${session.current_section.replace(/_/g, ' ')}`}
                        </span>
                    </div>
                    <Button
                        variant="text"
                        size="sm"
                        icon={<ArrowTopRightOnSquareIcon className="h-4 w-4" />}
                    >
                        Open
                    </Button>
                </div>
            </div>
        </motion.div>
    );
};

// Filter Dropdown Component
interface FilterProps {
    providers: Provider[];
    selectedProviderId: string | null;
    onProviderChange: (providerId: string | null) => void;
    onToggleFilterPanel: () => void;
    isOpen: boolean;
}

const FilterDropdown: React.FC<FilterProps> = ({
    providers,
    selectedProviderId,
    onProviderChange,
    onToggleFilterPanel,
    isOpen
}) => {
    return (
        <div className="relative">
            <Button
                variant="secondary"
                onClick={onToggleFilterPanel}
                icon={<AdjustmentsHorizontalIcon className="h-5 w-5" />}
                className={isOpen ? 'bg-neutral-200 dark:bg-neutral-600' : ''}
            >
                {selectedProviderId ? 'Filtered' : 'Filter'}
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-72 z-100 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 z-10"
                    >
                        <div className="p-4">
                            <h3 className="text-sm font-medium text-neutral-800 dark:text-white mb-3">
                                Filter by Provider
                            </h3>

                            <div className="space-y-2">
                                <div
                                    className={`p-2 rounded-lg cursor-pointer transition-colors ${selectedProviderId === null
                                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300'
                                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-700'
                                        }`}
                                    onClick={() => onProviderChange(null)}
                                >
                                    <div className="flex items-center">
                                        <div className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center mr-2">
                                            <UserCircleIcon className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                                        </div>
                                        <span className="text-sm font-medium">All Providers</span>
                                    </div>
                                </div>

                                {providers.map((provider) => (
                                    <div
                                        key={provider.id}
                                        className={`p-2 rounded-lg cursor-pointer transition-colors ${selectedProviderId === provider.id
                                                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300'
                                                : 'hover:bg-neutral-50 dark:hover:bg-neutral-700'
                                            }`}
                                        onClick={() => onProviderChange(provider.id)}
                                    >
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center mr-2">
                                                <UserCircleIcon className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                                            </div>
                                            <div className="text-sm">
                                                <span className="font-medium">{provider.name}</span>
                                                <div className="text-neutral-500 dark:text-neutral-400 text-xs">{provider.specialty}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Main Summary Page Component
const HistoryPage: React.FC = () => {
    const navigate = useNavigate();

    // State management - simplified
    const [consultations, setConsultations] = useState<ConsultationHistoryItem[]>([]);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Load data - much simpler now
    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);

                // Load providers for the filter dropdown only
                const providersData = await api.getProviders();
                setProviders(providersData);

                // Single API call to get all the data we need
                const historyData = await api.getConsultationHistory();
                setConsultations(historyData);

                setError(null);
            } catch (err) {
                console.error('Error loading history data:', err);
                setError('Failed to load consultation history. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    // Filter consultations by provider
    const filteredConsultations = selectedProviderId
        ? consultations.filter(session => session.provider_id === selectedProviderId)
        : consultations;

    // Group consultations by date for better organization
    const groupedConsultations: Record<string, ConsultationHistoryItem[]> = {};
    filteredConsultations.forEach(session => {
        const date = new Date(session.session_date).toLocaleDateString();
        if (!groupedConsultations[date]) {
            groupedConsultations[date] = [];
        }
        groupedConsultations[date].push(session);
    });

    // Convert to sorted array for rendering
    const sortedDates = Object.keys(groupedConsultations).sort((a, b) => {
        return new Date(b).getTime() - new Date(a).getTime(); // Sort newest first
    });

    // Handle session click
    const handleSessionClick = (sessionId: string) => {
        navigate(`/chat/${sessionId}`);
    };

    // Reset filters
    const handleResetFilters = () => {
        setSelectedProviderId(null);
    };

    // Handle filter toggle
    const toggleFilterPanel = () => {
        setIsFilterOpen(!isFilterOpen);
    };

    // Close filter when clicking elsewhere
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isFilterOpen) {
                setIsFilterOpen(false);
            }
        };

        // Add click event only when filter is open
        if (isFilterOpen) {
            setTimeout(() => {
                document.addEventListener('click', handleClickOutside);
            }, 0);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isFilterOpen]);

    return (
        <div className="container-custom py-28">
            {/* Page header */}
            <div className="mb-8">
                <div className="flex flex-row items-center justify-between mb-6">
                    <h1 className="text-xl md:text-2xl lg:text-4xl font-extralight tracking-tight text-neutral-900 dark:text-white mb-4 md:mb-0">
                        Patient History
                    </h1>

                    <div className="flex items-center space-x-4" onClick={(e) => e.stopPropagation()}>
                        {/* Filter Controls */}
                        <FilterDropdown
                            providers={providers}
                            selectedProviderId={selectedProviderId}
                            onProviderChange={setSelectedProviderId}
                            onToggleFilterPanel={toggleFilterPanel}
                            isOpen={isFilterOpen}
                        />

                        {/* Reset Filters button - only show when filters are applied */}
                        {selectedProviderId && (
                            <Button variant="outline" onClick={handleResetFilters}>
                                Reset Filters
                            </Button>
                        )}
                    </div>
                </div>

                <p className="text-lg text-neutral-600 dark:text-neutral-400 font-light">
                    View and access past consultation sessions
                </p>
            </div>

            {/* Loading state */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-20">
                    <Spinner size="lg" className="mb-4" />
                    <p className="text-neutral-600 dark:text-neutral-400">Loading consultation history...</p>
                </div>
            )}

            {/* Error state */}
            {error && !isLoading && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-8 text-center">
                    <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                    <Button onClick={() => window.location.reload()}>
                        Try Again
                    </Button>
                </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && filteredConsultations.length === 0 && (
                <EmptyState
                    title="No consultations found"
                    description={selectedProviderId ? "No sessions found with selected filters. Try changing your filter options." : "There are no consultation sessions recorded yet."}
                    icon={<DocumentTextIcon className="h-12 w-12" />}
                    action={
                        selectedProviderId ? (
                            <Button onClick={handleResetFilters}>
                                Reset Filters
                            </Button>
                        ) : (
                            <Button onClick={() => navigate("/chat")}>
                                Start a New Consultation
                            </Button>
                        )
                    }
                />
            )}

            {/* Sessions list - grouped by date */}
            {!isLoading && !error && filteredConsultations.length > 0 && (
                <div className="space-y-10">
                    {sortedDates.map(dateKey => (
                        <div key={dateKey} className="relative">
                            {/* Date heading */}
                            <div className="sticky top-0 bg-neutral-50 dark:bg-neutral-900 p-2 mb-4 border-b border-neutral-200 dark:border-neutral-700">
                                <h2 className="text-xl font-light text-neutral-700 dark:text-neutral-300 flex items-center">
                                    <CalendarIcon className="h-5 w-5 mr-2 text-neutral-500 dark:text-neutral-400" />
                                    {formatDate(dateKey)}
                                </h2>
                            </div>

                            {/* Session cards grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {groupedConsultations[dateKey].map(session => (
                                    <SessionCard
                                        key={session.id}
                                        session={session}
                                        onClick={() => handleSessionClick(session.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HistoryPage;