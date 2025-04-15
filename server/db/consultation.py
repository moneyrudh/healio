# db/consultation.py
import uuid
import datetime
import json
from enum import Enum, auto
from .client import get_supabase

class ConsultationSection(Enum):
    """Enumeration of consultation sections"""
    CHIEF_COMPLAINT = "chief_complaint"
    HISTORY = "history"
    SUBJECTIVE = "subjective"
    VITAL_SIGNS = "vital_signs"
    PHYSICAL = "physical"
    OBJECTIVE = "objective"
    ASSESSMENT = "assessment"
    PLAN = "plan"
    DOUBTS = "doubts"
    MEDICATIONS = "medications"
    NOTES = "notes"
    COMPLETE = "complete"

class SectionFormat(Enum):
    """Enumeration of section format types"""
    NUMBERED_BULLET = "numbered_bullet"
    BULLET = "bullet"
    PARAGRAPH = "paragraph"

# Map each section to its expected format
SECTION_FORMATS = {
    ConsultationSection.CHIEF_COMPLAINT: SectionFormat.NUMBERED_BULLET,
    ConsultationSection.HISTORY: SectionFormat.PARAGRAPH,
    ConsultationSection.SUBJECTIVE: SectionFormat.PARAGRAPH,
    ConsultationSection.VITAL_SIGNS: SectionFormat.BULLET,
    ConsultationSection.PHYSICAL: SectionFormat.BULLET,
    ConsultationSection.OBJECTIVE: SectionFormat.BULLET,
    ConsultationSection.ASSESSMENT: SectionFormat.NUMBERED_BULLET,
    ConsultationSection.PLAN: SectionFormat.NUMBERED_BULLET,
    ConsultationSection.MEDICATIONS: SectionFormat.NUMBERED_BULLET,
    ConsultationSection.NOTES: SectionFormat.PARAGRAPH,
}

class ConsultationManager:
    """Manages consultation sessions and related data"""
    
    def __init__(self):
        self.supabase = get_supabase()
    
    def create_consultation(self, patient_id, provider_id):
        """
        Create a new consultation session
        
        Args:
            patient_id: The patient's UUID
            provider_id: The healthcare provider's UUID
            
        Returns:
            Consultation session data including ID
        """
        # Create session with initial state
        consultation_data = {
            "id": str(uuid.uuid4()),
            "patient_id": patient_id,
            "provider_id": provider_id,
            "session_date": datetime.datetime.utcnow().isoformat(),
            "status": "in_progress",
            "current_section": ConsultationSection.CHIEF_COMPLAINT.value,
            "created_at": datetime.datetime.utcnow().isoformat(),
            "updated_at": datetime.datetime.utcnow().isoformat()
        }
        
        # Insert into database
        result = self.supabase.table('consultation_sessions').insert(consultation_data).execute()
        
        if hasattr(result, 'error') and result.error:
            raise Exception(f"Error creating consultation: {result.error}")
            
        return result.data[0] if result.data else None
    
    def get_consultation(self, consultation_id):
        """
        Retrieve consultation by ID
        
        Args:
            consultation_id: The consultation session UUID
            
        Returns:
            Consultation data or None if not found
        """
        result = self.supabase.table('consultation_sessions').select('*').eq('id', consultation_id).execute()
        
        if hasattr(result, 'error') and result.error:
            raise Exception(f"Error retrieving consultation: {result.error}")
            
        return result.data[0] if result.data else None
    
    def get_patient_consultations(self, patient_id):
        """
        Retrieve all consultations for a patient
        
        Args:
            patient_id: The patient's UUID
            
        Returns:
            List of consultation session data
        """
        result = self.supabase.table('consultation_sessions').select('*').eq('patient_id', patient_id).order('session_date', desc=True).execute()
        
        if hasattr(result, 'error') and result.error:
            raise Exception(f"Error retrieving consultations: {result.error}")
            
        return result.data
    
    def update_consultation_section(self, consultation_id, new_section):
        """
        Update the current section of a consultation
        
        Args:
            consultation_id: The consultation session UUID
            new_section: The new section value (from ConsultationSection enum)
            
        Returns:
            Updated consultation data
        """
        updates = {
            "current_section": new_section.value if isinstance(new_section, ConsultationSection) else new_section,
            "updated_at": datetime.datetime.utcnow().isoformat()
        }
        
        result = self.supabase.table('consultation_sessions').update(updates).eq('id', consultation_id).execute()
        
        if hasattr(result, 'error') and result.error:
            raise Exception(f"Error updating consultation: {result.error}")
            
        return result.data[0] if result.data else None
    
    def complete_consultation(self, consultation_id):
        """
        Mark a consultation as completed
        
        Args:
            consultation_id: The consultation session UUID
            
        Returns:
            Updated consultation data
        """
        updates = {
            "status": "completed",
            "current_section": ConsultationSection.COMPLETE.value,
            "updated_at": datetime.datetime.utcnow().isoformat()
        }
        
        result = self.supabase.table('consultation_sessions').update(updates).eq('id', consultation_id).execute()
        
        if hasattr(result, 'error') and result.error:
            raise Exception(f"Error completing consultation: {result.error}")
            
        return result.data[0] if result.data else None
    
    def store_section_data(self, consultation_id, section, content):
        """
        Store or update structured data for a consultation section
        
        Args:
            consultation_id: The consultation session UUID
            section: The section (from ConsultationSection enum)
            content: The structured content (will be stored as JSON)
            
        Returns:
            Section data entry
        """
        section_value = section.value if isinstance(section, ConsultationSection) else section
        
        # Check if entry already exists
        check_result = self.supabase.table('consultation_data').select('id').eq('consultation_session_id', consultation_id).eq('section', section_value).execute()
        
        if check_result.data:
            # Update existing entry
            entry_id = check_result.data[0]['id']
            result = self.supabase.table('consultation_data').update({
                "content": json.dumps(content),
                "updated_at": datetime.datetime.utcnow().isoformat()
            }).eq('id', entry_id).execute()
        else:
            # Create new entry
            result = self.supabase.table('consultation_data').insert({
                "id": str(uuid.uuid4()),
                "consultation_session_id": consultation_id,
                "section": section_value,
                "content": json.dumps(content),
                "created_at": datetime.datetime.utcnow().isoformat(),
                "updated_at": datetime.datetime.utcnow().isoformat()
            }).execute()
        
        if hasattr(result, 'error') and result.error:
            raise Exception(f"Error storing section data: {result.error}")
            
        return result.data[0] if result.data else None
    
    def get_section_data(self, consultation_id, section):
        """
        Retrieve the stored data for a consultation section
        
        Args:
            consultation_id: The consultation session UUID
            section: The section (from ConsultationSection enum)
            
        Returns:
            Section data or None if not found
        """
        section_value = section.value if isinstance(section, ConsultationSection) else section
        
        result = self.supabase.table('consultation_data').select('*').eq('consultation_session_id', consultation_id).eq('section', section_value).execute()
        
        if hasattr(result, 'error') and result.error:
            raise Exception(f"Error retrieving section data: {result.error}")
            
        if not result.data:
            return None
            
        data = result.data[0]
        if isinstance(data['content'], str):
            data['content'] = json.loads(data['content'])
            
        return data
    
    def get_all_section_data(self, consultation_id):
        """
        Retrieve all stored data for a consultation
        
        Args:
            consultation_id: The consultation session UUID
            
        Returns:
            Dictionary of section data keyed by section name
        """
        result = self.supabase.table('consultation_data').select('*').eq('consultation_session_id', consultation_id).execute()
        
        if hasattr(result, 'error') and result.error:
            raise Exception(f"Error retrieving section data: {result.error}")
        
        section_data = {}
        for data in result.data:
            section = data['section']
            if isinstance(data['content'], str):
                data['content'] = json.loads(data['content'])
            section_data[section] = data['content']
            
        return section_data
    
    def store_consultation_summary(self, consultation_id, summary_data):
        """
        Store or update the summary data for a consultation
        
        Args:
            consultation_id: The consultation session UUID
            summary_data: Structured summary data (will be stored as JSON)
            
        Returns:
            Summary data entry
        """
        # Check if entry already exists
        check_result = self.supabase.table('consultation_summaries').select('id').eq('consultation_session_id', consultation_id).execute()
        
        if check_result.data:
            # Update existing entry
            entry_id = check_result.data[0]['id']
            result = self.supabase.table('consultation_summaries').update({
                "summary_data": json.dumps(summary_data),
                "updated_at": datetime.datetime.utcnow().isoformat()
            }).eq('id', entry_id).execute()
        else:
            # Create new entry
            result = self.supabase.table('consultation_summaries').insert({
                "id": str(uuid.uuid4()),
                "consultation_session_id": consultation_id,
                "summary_data": json.dumps(summary_data),
                "latex_template_version": "1.0", # Current template version
                "created_at": datetime.datetime.utcnow().isoformat(),
                "updated_at": datetime.datetime.utcnow().isoformat()
            }).execute()
        
        if hasattr(result, 'error') and result.error:
            raise Exception(f"Error storing summary data: {result.error}")
            
        return result.data[0] if result.data else None
    
    def get_consultation_summary(self, consultation_id):
        """
        Retrieve the summary data for a consultation
        
        Args:
            consultation_id: The consultation session UUID
            
        Returns:
            Summary data or None if not found
        """
        result = self.supabase.table('consultation_summaries').select('*').eq('consultation_session_id', consultation_id).execute()
        
        if hasattr(result, 'error') and result.error:
            raise Exception(f"Error retrieving summary data: {result.error}")
            
        if not result.data:
            return None
            
        data = result.data[0]
        if isinstance(data['summary_data'], str):
            data['summary_data'] = json.loads(data['summary_data'])
            
        return data