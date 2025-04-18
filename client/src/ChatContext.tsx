// ChatContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Provider,
    Patient,
    ConsultationSession,
    ChatMessage,
    ConsultationSummary,
    ConsultationSection,
    MessageContent,
    AIResponse
} from './types';
import * as api from './api';

interface ChatContextType {
    // Selection state
    selectedProvider: Provider | null;
    selectedPatient: Patient | null;
    setSelectedProvider: (provider: Provider | null) => void;
    setSelectedPatient: (patient: Patient | null) => void;

    // Session state
    currentSession: ConsultationSession | null;
    isCreatingSession: boolean;
    createSession: () => Promise<void>;
    loadSession: (sessionId: string) => Promise<void>;

    // Chat state
    messages: ChatMessage[];
    isLoading: boolean;
    currentSection: ConsultationSection | string;

    // Message handling
    sendMessage: (message: string) => Promise<void>;

    // Summary state
    summary: ConsultationSummary | null;
    loadSummary: () => Promise<void>;
    generateAndDownloadPDF: () => Promise<void>;

    // Reset state
    resetState: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const navigate = useNavigate();

    // Selection state
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    // Session state
    const [currentSession, setCurrentSession] = useState<ConsultationSession | null>(null);
    const [isCreatingSession, setIsCreatingSession] = useState(false);

    // Chat state
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentSection, setCurrentSection] = useState<ConsultationSection | string>(
        ConsultationSection.CHIEF_COMPLAINT
    );

    // Summary state
    const [summary, setSummary] = useState<ConsultationSummary | null>(null);

    // Load messages for current session
    useEffect(() => {
        if (currentSession) {
            loadMessages();
            setCurrentSection(currentSession.current_section);
        }
    }, [currentSession]);

    const transformMessage = (message: any): MessageContent => {
        if (typeof message === 'string') {
          return {
            type: 'text',
            content: message
          };
        }
        return message as MessageContent;
    };

    const loadMessages = async () => {
        if (!currentSession) return;

        try {
            setIsLoading(true);
            const chatHistory = await api.getChatHistory(currentSession.id);
            setMessages(chatHistory);
        } catch (error) {
            console.error('Error loading chat history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const createSession = async () => {
        if (!selectedProvider || !selectedPatient) {
            throw new Error('Provider and patient must be selected before creating a session');
        }

        try {
            setIsCreatingSession(true);
            const result = await api.createConsultation(selectedPatient.id, selectedProvider.id);

            setCurrentSession(result.consultation);

            // Add initial AI message
            const initialMessage: ChatMessage = {
                id: 'initial',
                consultation_session_id: result.consultation.id,
                sender: 'ai',
                message: transformMessage(result.initial_message),
                section: result.consultation.current_section,
                timestamp: new Date().toISOString(),
                created_at: new Date().toISOString()
            };

            setMessages([initialMessage]);
            setCurrentSection(result.consultation.current_section);

            // Navigate to the new session
            navigate(`/chat/${result.consultation.id}`);
        } catch (error) {
            console.error('Error creating consultation session:', error);
            throw error;
        } finally {
            setIsCreatingSession(false);
        }
    };

    const loadSession = async (sessionId: string) => {
        try {
            setIsLoading(true);
            const session = await api.getConsultationById(sessionId);
            setCurrentSession(session);

            // Load provider and patient details
            const provider = await api.getProviderById(session.provider_id);
            setSelectedProvider(provider);

            const patient = await api.getPatientById(session.patient_id);
            setSelectedPatient(patient);

            setCurrentSection(session.current_section);
        } catch (error) {
            console.error('Error loading session:', error);
            navigate('/chat');
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async (message: string) => {
        if (!currentSession) return;

        try {
            setIsLoading(true);

            // Optimistically add user message to the UI
            const userMessage: ChatMessage = {
                id: `temp-${Date.now()}`,
                consultation_session_id: currentSession.id,
                sender: 'provider',
                message: transformMessage(message),
                section: currentSection,
                timestamp: new Date().toISOString(),
                created_at: new Date().toISOString()
            };

            setMessages(prev => [...prev, userMessage]);

            // Send the message to the API
            const response = await api.sendChatMessage(currentSession.id, message);

            // Handle different response types
            if (response.headers.get('content-type')?.includes('text/event-stream')) {
                // Handle streaming response
                const reader = response.body?.getReader();
                if (!reader) throw new Error('Unable to read stream');

                let aiMessageBuffer = '';
                const decoder = new TextDecoder();

                // Create temporary AI message for streaming updates
                const tempAiMessage: ChatMessage = {
                    id: `temp-ai-${Date.now()}`,
                    consultation_session_id: currentSession.id,
                    sender: 'ai',
                    message: {
                      type: 'text',
                      content: ''
                    },
                    section: currentSection,
                    timestamp: new Date().toISOString(),
                    created_at: new Date().toISOString()
                };

                setMessages(prev => [...prev, tempAiMessage]);

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    aiMessageBuffer += chunk;

                    // Process the event stream
                    const events = aiMessageBuffer.split('\n\n');
                    aiMessageBuffer = events.pop() || '';

                    for (const event of events) {
                        if (!event.startsWith('data: ')) continue;

                        try {
                            const jsonData = JSON.parse(event.slice(6));

                            // Update AI message based on event type
                            if (jsonData.type === 'start') {
                                // Initial event, update current section if provided
                                if (jsonData.current_section) {
                                    setCurrentSection(jsonData.current_section);
                                }
                            } else if (jsonData.type === 'text') {
                                // Text content update
                                setMessages(prev =>
                                    prev.map(msg =>
                                        msg.id === tempAiMessage.id
                                            ? {
                                                ...msg,
                                                message: {
                                                    type: 'text',
                                                    content: msg.message.content + (jsonData.content || '')
                                                }
                                            }
                                            : msg
                                    )
                                );
                            } else if (jsonData.type === 'rag') {
                                // Evidence-based answer with sources
                                setMessages(prev =>
                                    prev.map(msg =>
                                        msg.id === tempAiMessage.id
                                            ? {
                                                ...msg,
                                                message: {
                                                    type: 'rag',
                                                    content: jsonData.content || '',
                                                    sources: jsonData.sources || []
                                                }
                                            }
                                            : msg
                                    )
                                );
                            } else if (jsonData.type === 'end') {
                                // Stream completed - refresh session data
                                refreshSession();
                            }
                        } catch (e) {
                            console.error('Error parsing event:', e);
                        }
                    }

                }
            } else {
                // Handle direct JSON response
                const jsonResponse = await response.json();

                if (jsonResponse.type === 'section_transition') {
                    // Update current section
                    setCurrentSection(jsonResponse.current_section);

                    // Add AI message
                    const aiMessage: ChatMessage = {
                        id: `ai-${Date.now()}`,
                        consultation_session_id: currentSession.id,
                        sender: 'ai',
                        message: jsonResponse.message,
                        section: jsonResponse.current_section,
                        timestamp: new Date().toISOString(),
                        created_at: new Date().toISOString()
                    };

                    setMessages(prev => [...prev, aiMessage]);

                    // Refresh session data
                    refreshSession();
                } else if (jsonResponse.type === 'follow_up') {
                    // Add AI follow-up message
                    const aiMessage: ChatMessage = {
                        id: `ai-${Date.now()}`,
                        consultation_session_id: currentSession.id,
                        sender: 'ai',
                        message: transformMessage(jsonResponse.message),
                        section: jsonResponse.current_section,
                        timestamp: new Date().toISOString(),
                        created_at: new Date().toISOString()
                    };

                    setMessages(prev => [...prev, aiMessage]);
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshSession = async () => {
        if (!currentSession) return;

        try {
            const session = await api.getConsultationById(currentSession.id);
            setCurrentSession(session);
            setCurrentSection(session.current_section);
        } catch (error) {
            console.error('Error refreshing session:', error);
        }
    };

    const loadSummary = async () => {
        if (!currentSession) return;

        try {
            setIsLoading(true);
            const summaryData = await api.getConsultationSummary(currentSession.id);
            setSummary(summaryData);
        } catch (error) {
            console.error('Error loading summary:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const generateAndDownloadPDF = async () => {
        if (!currentSession) return;

        try {
            setIsLoading(true);
            const pdfBlob = await api.generatePDF(currentSession.id);

            // Create download link
            const url = window.URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `consultation_${currentSession.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const resetState = () => {
        setSelectedProvider(null);
        setSelectedPatient(null);
        setCurrentSession(null);
        setMessages([]);
        setSummary(null);
        setCurrentSection(ConsultationSection.CHIEF_COMPLAINT);
    };

    const value = {
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
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = (): ChatContextType => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};