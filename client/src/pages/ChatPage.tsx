// pages/ChatPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChatBubbleLeftRightIcon, 
  DocumentTextIcon, 
  ArrowLeftIcon,
  UserCircleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

// Components
import { ProviderSelector, ProviderIndicator } from '../components/providers';
import { PatientSelector } from '../components/patients';
import { SectionProgress, CurrentSectionIndicator } from '../components/sections/SectionProgress';
import { ChatInterface } from '../components/chat';
import SummaryView from '../components/summary/SummaryView';
import { Button, TabToggle, Spinner, EmptyState } from '../components/shared';

// Context
import { useChat } from '../ChatContext';
import { ConsultationSection } from '../types';

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: sessionId } = useParams<{ id: string }>();
  
  const {
    selectedProvider,
    selectedPatient,
    setSelectedProvider,
    setSelectedPatient,
    currentSession,
    isCreatingSession,
    createSession,
    loadSession,
    messages,
    isLoading,
    currentSection,
    sendMessage,
    summary,
    loadSummary,
    generateAndDownloadPDF,
    resetState
  } = useChat();

  // Local UI state
  const [activeTab, setActiveTab] = useState<'conversation' | 'summary'>('conversation');
  
  // Session creation phases
  const [creationPhase, setCreationPhase] = useState<'provider' | 'patient'>('provider');
  
  // Load session data if URL has a session ID
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    } else {
      // Reset state when on the main /chat page with no session
      resetState();
    }
  }, [sessionId]);

  // Load summary when switching to summary tab if session is complete
  useEffect(() => {
    if (
      activeTab === 'summary' && 
      currentSession && 
      (currentSection === ConsultationSection.COMPLETE || currentSession.status === 'completed') && 
      !summary
    ) {
      loadSummary();
    }
  }, [activeTab, currentSession, currentSection, summary]);

  // Handle session creation
  const handleCreateSession = async () => {
    if (!selectedProvider || !selectedPatient) return;
    
    try {
      await createSession();
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  // Handle provider selection
  const handleProviderSelected = (provider: React.SetStateAction<any>) => {
    setSelectedProvider(provider);
    setCreationPhase('patient');
  };

  // Handle patient selection
  const handlePatientSelected = (patient: React.SetStateAction<any>) => {
    setSelectedPatient(patient);
  };

  // Reset session creation process
  const handleBackToProviders = () => {
    setCreationPhase('provider');
  };

  // Determine if the consultation is complete
  const isComplete = currentSection === ConsultationSection.COMPLETE || currentSession?.status === 'completed';

  // Render the session creation phase
  const renderCreationPhase = () => {
    if (creationPhase === 'provider') {
      return (
        <div className="max-w-4xl mx-auto">
          <ProviderSelector
            onSelect={handleProviderSelected}
            selectedProvider={selectedProvider}
          />
        </div>
      );
    } else {
      return (
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center">
            <Button 
              variant="text" 
              onClick={handleBackToProviders}
              icon={<ArrowLeftIcon className="h-5 w-5" />}
            >
              Back to Providers
            </Button>
            
            {selectedProvider && (
              <div className="ml-6">
                <ProviderIndicator provider={selectedProvider} />
              </div>
            )}
          </div>
          <PatientSelector
            onSelect={handlePatientSelected}
            selectedPatient={selectedPatient}
          />
          
          {/* Start session button */}
          {selectedPatient && (
            <div className="mt-8 flex justify-center">
              <Button 
                onClick={handleCreateSession} 
                size="lg"
                disabled={isCreatingSession}
              >
                {isCreatingSession ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Starting Consultation...
                  </>
                ) : (
                  'Start Consultation'
                )}
              </Button>
            </div>
          )}
        </div>
      );
    }
  };

  // Render active session
  const renderActiveSession = () => {
    return (
      <div className="h-full grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Desktop only */}
        <div className="hidden lg:block lg:col-span-1 space-y-6">
          {/* Provider indicator */}
          {selectedProvider && (
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-4 border border-neutral-200 dark:border-neutral-700">
              <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-3">
                Active Provider
              </h3>
              <ProviderIndicator provider={selectedProvider} />
            </div>
          )}
          
          {/* Patient indicator */}
          {selectedPatient && (
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-4 border border-neutral-200 dark:border-neutral-700">
              <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-3">
                Current Patient
              </h3>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400">
                  <UserCircleIcon className="h-7 w-7" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">
                    {selectedPatient.name}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    MRN: {selectedPatient.medical_record_number}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Section progress */}
          <SectionProgress currentSection={currentSection} />
        </div>
        
        {/* Main content */}
        <div className="col-span-1 lg:col-span-3 flex flex-col h-full">
          {/* Mobile header with current session info */}
          <div className="lg:hidden mb-4 space-y-3">
            <div className="flex flex-wrap gap-3">
              {selectedProvider && (
                <ProviderIndicator provider={selectedProvider} />
              )}
              
              {selectedPatient && (
                <div className="flex items-center px-4 py-2 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <UserCircleIcon className="h-5 w-5 text-neutral-500 dark:text-neutral-400 mr-2" />
                  <span className="text-sm text-neutral-800 dark:text-neutral-200">
                    {selectedPatient.name}
                  </span>
                </div>
              )}
            </div>
            
            {/* Mobile current section indicator */}
            <CurrentSectionIndicator currentSection={currentSection} />
          </div>
          
          {/* Tabs */}
          <div className="mb-4">
            <TabToggle
              tabs={[
                { key: 'conversation', label: 'Conversation' },
                { key: 'summary', label: 'Summary' }
              ]}
              activeTab={activeTab}
              onChange={(tab) => setActiveTab(tab as 'conversation' | 'summary')}
            />
          </div>
          
          {/* Tab content */}
          <div className="flex-1 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            {/* Conversation tab */}
            {activeTab === 'conversation' && (
              <ChatInterface
                messages={messages}
                onSendMessage={sendMessage}
                isLoading={isLoading}
                currentSection={currentSection}
              />
            )}
            
            {/* Summary tab */}
            {activeTab === 'summary' && (
              <div className="h-full overflow-y-auto">
                <SummaryView
                  summary={summary}
                  patient={selectedPatient}
                  provider={selectedProvider}
                  isComplete={isComplete}
                  isLoading={isLoading}
                  onDownload={generateAndDownloadPDF}
                  onRefresh={loadSummary}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="container-custom py-20 lg:py-28 flex flex-col h-[calc(100vh-80px)]">
      {/* Back button - only shown for active sessions */}
      {sessionId && (
        <div className="mb-6">
          <Button
            variant="text"
            onClick={() => navigate('/chat')}
            icon={<ArrowLeftIcon className="h-5 w-5" />}
            className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            Back to Sessions
          </Button>
        </div>
      )}
      
      {/* Page title */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-4xl font-extralight tracking-tight text-neutral-900 dark:text-white mb-4 md:mb-0">
          {sessionId ? 'Consultation Session' : 'New Consultation'}
        </h1>
      </div>
      
      {/* Main content */}
      <div className="flex-1">
        {isLoading && !sessionId ? (
          <div className="flex justify-center items-center h-full">
            <Spinner size="lg" />
          </div>
        ) : sessionId ? (
          // Active session content
          renderActiveSession()
        ) : (
          // Session creation phases
          renderCreationPhase()
        )}
      </div>
    </div>
  );
};

export default ChatPage;