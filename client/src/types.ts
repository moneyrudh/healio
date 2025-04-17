// types.ts
export interface Provider {
    id: string;
    name: string;
    specialty: string;
    photo?: string; // URL to provider photo/avatar
  }
  
  export interface Patient {
    id: string;
    name: string;
    dob: string;
    medical_record_number: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface ConsultationSession {
    id: string;
    patient_id: string;
    provider_id: string;
    session_date: string;
    status: 'in_progress' | 'completed';
    current_section: ConsultationSection;
    created_at: string;
    updated_at: string;
  }
  
  export enum ConsultationSection {
    CHIEF_COMPLAINT = "chief_complaint",
    HISTORY = "history",
    SUBJECTIVE = "subjective",
    VITAL_SIGNS = "vital_signs",
    PHYSICAL = "physical",
    OBJECTIVE = "objective",
    ASSESSMENT = "assessment",
    PLAN = "plan",
    DOUBTS = "doubts",
    MEDICATIONS = "medications",
    NOTES = "notes",
    COMPLETE = "complete"
  }
  
  export interface ChatMessage {
    id: string;
    consultation_session_id: string;
    sender: 'provider' | 'ai';
    message: string;
    section: ConsultationSection | string;
    timestamp: string;
    created_at: string;
  }
  
  export interface SectionData {
    id: string;
    consultation_session_id: string;
    section: ConsultationSection | string;
    content: any;
    created_at: string;
    updated_at: string;
  }
  
  export interface ConsultationSummary {
    id: string;
    consultation_session_id: string;
    summary_data: Record<string, any>;
    latex_template_version: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface MedicalSource {
    id: string;
    pmcid: string;
    title: string;
    authors: string[];
  }
  
  export interface AIResponse {
    type: 'start' | 'text' | 'rag' | 'end' | 'section_transition' | 'follow_up';
    content?: string;
    message?: string;
    previous_section?: ConsultationSection | string;
    current_section?: ConsultationSection | string;
    sources?: MedicalSource[];
  }
  
  export interface NewPatientFormData {
    name: string;
    dob: string;
    other_info?: Record<string, any>;
  }