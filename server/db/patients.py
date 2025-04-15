# db/patients.py
import uuid
import datetime
from .client import get_supabase

class PatientManager:
    """Manages patient data in the database"""
    
    def __init__(self):
        self.supabase = get_supabase()
    
    def create_patient(self, name, dob, other_info=None):
        """
        Create a new patient record
        
        Args:
            name: Patient's full name
            dob: Date of birth (can be string in format 'YYYY-MM-DD')
            other_info: Dictionary of additional patient information
            
        Returns:
            Patient data including ID and MRN
        """
        # Generate a unique medical record number
        mrn = f"MRN-{uuid.uuid4().hex[:8].upper()}"
        
        # Prepare patient data
        patient_data = {
            "id": str(uuid.uuid4()),
            "name": name,
            "dob": dob,
            "medical_record_number": mrn,
            "created_at": datetime.datetime.utcnow().isoformat(),
            "updated_at": datetime.datetime.utcnow().isoformat()
        }
        
        # Add any additional info
        if other_info and isinstance(other_info, dict):
            for key, value in other_info.items():
                if key not in patient_data:
                    patient_data[key] = value
        
        # Insert into database
        result = self.supabase.table('patients').insert(patient_data).execute()
        
        if hasattr(result, 'error') and result.error:
            raise Exception(f"Error creating patient: {result.error}")
            
        return result.data[0] if result.data else None
    
    def get_patient(self, patient_id):
        """
        Retrieve patient by ID
        
        Args:
            patient_id: The patient's UUID
            
        Returns:
            Patient data or None if not found
        """
        result = self.supabase.table('patients').select('*').eq('id', patient_id).execute()
        
        if hasattr(result, 'error') and result.error:
            raise Exception(f"Error retrieving patient: {result.error}")
            
        return result.data[0] if result.data else None
    
    def get_patient_by_mrn(self, mrn):
        """
        Retrieve patient by Medical Record Number
        
        Args:
            mrn: Medical Record Number
            
        Returns:
            Patient data or None if not found
        """
        result = self.supabase.table('patients').select('*').eq('medical_record_number', mrn).execute()
        
        if hasattr(result, 'error') and result.error:
            raise Exception(f"Error retrieving patient: {result.error}")
            
        return result.data[0] if result.data else None
    
    def get_all_patients(self, limit=100, offset=0):
        """
        Retrieve all patients with pagination
        
        Args:
            limit: Maximum number of records to return
            offset: Number of records to skip
            
        Returns:
            List of patient data
        """
        result = self.supabase.table('patients').select('*').range(offset, offset + limit - 1).execute()
        
        if hasattr(result, 'error') and result.error:
            raise Exception(f"Error retrieving patients: {result.error}")
            
        return result.data
    
    def update_patient(self, patient_id, updates):
        """
        Update patient information
        
        Args:
            patient_id: The patient's UUID
            updates: Dictionary of fields to update
            
        Returns:
            Updated patient data
        """
        # Add updated timestamp
        updates["updated_at"] = datetime.datetime.utcnow().isoformat()
        
        result = self.supabase.table('patients').update(updates).eq('id', patient_id).execute()
        
        if hasattr(result, 'error') and result.error:
            raise Exception(f"Error updating patient: {result.error}")
            
        return result.data[0] if result.data else None