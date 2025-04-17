// api.ts
import { 
    Provider, 
    Patient, 
    ConsultationSession, 
    ChatMessage, 
    ConsultationSummary,
    NewPatientFormData
  } from './types';
  
  const API_BASE_URL = process.env.HEALIO_SERVER_URL || 'http://localhost:5001';
  
  // Error handling utility
  const handleResponse = async (response: Response) => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Error: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }
    return response.json();
  };
  
  // Providers API
  export const getProviders = async (): Promise<Provider[]> => {
    const response = await fetch(`${API_BASE_URL}/api/providers`);
    return handleResponse(response);
  };
  
  export const getProviderById = async (id: string): Promise<Provider> => {
    const providers = await getProviders();
    const provider = providers.find(p => p.id === id);
    if (!provider) {
      throw new Error(`Provider with id ${id} not found`);
    }
    return provider;
  };
  
  // Patients API
  export const getPatients = async (): Promise<Patient[]> => {
    const response = await fetch(`${API_BASE_URL}/api/patients`);
    return handleResponse(response);
  };
  
  export const getPatientById = async (id: string): Promise<Patient> => {
    const response = await fetch(`${API_BASE_URL}/api/patients?id=${id}`);
    return handleResponse(response);
  };
  
  export const createPatient = async (patientData: NewPatientFormData): Promise<Patient> => {
    const response = await fetch(`${API_BASE_URL}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patientData),
    });
    return handleResponse(response);
  };
  
  // Consultations API
  export const getConsultations = async (patientId?: string): Promise<ConsultationSession[]> => {
    const url = patientId 
      ? `${API_BASE_URL}/api/consultations?patient_id=${patientId}` 
      : `${API_BASE_URL}/api/consultations`;
    
    const response = await fetch(url);
    return handleResponse(response);
  };
  
  export const getConsultationById = async (id: string): Promise<ConsultationSession> => {
    const response = await fetch(`${API_BASE_URL}/api/consultations?id=${id}`);
    return handleResponse(response);
  };
  
  export const createConsultation = async (patientId: string, providerId: string): Promise<{consultation: ConsultationSession, initial_message: string}> => {
    const response = await fetch(`${API_BASE_URL}/api/consultations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patient_id: patientId,
        provider_id: providerId,
      }),
    });
    return handleResponse(response);
  };
  
  // Chat API
  export const getChatHistory = async (consultationId: string): Promise<ChatMessage[]> => {
    const response = await fetch(`${API_BASE_URL}/api/chat/history?consultation_id=${consultationId}`);
    return handleResponse(response);
  };
  
  export const sendChatMessage = async (consultationId: string, message: string): Promise<Response> => {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        consultation_id: consultationId,
        message,
      }),
    });
    
    // For streaming responses, return the raw response
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      return response;
    }
    
    // For JSON responses, parse and return
    return response;
  };
  
  // Summary API
  export const getConsultationSummary = async (consultationId: string): Promise<ConsultationSummary> => {
    const response = await fetch(`${API_BASE_URL}/api/summary?consultation_id=${consultationId}`);
    return handleResponse(response);
  };
  
  export const generatePDF = async (consultationId: string): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/api/generate-pdf?consultation_id=${consultationId}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Error: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }
    return response.blob();
  };