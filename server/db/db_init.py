# db/init_db.py
from .client import get_supabase
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def initialize_database():
    """
    Initialize the database schema if tables don't exist
    """
    supabase = get_supabase()
    
    # Check if the required tables exist and create them if they don't
    # Note: In practice with Supabase, you might manage migrations differently
    # This is a simplified example
    
    try:
        # Create patients table
        supabase.table('patients').select('id').limit(1).execute()
        print("Patients table exists")
    except Exception as e:
        if "relation 'patients' does not exist" in str(e):
            create_patients_table(supabase)
            print("Created patients table")
        else:
            print(f"Error checking patients table: {e}")
    
    try:
        # Create consultation_sessions table
        supabase.table('consultation_sessions').select('id').limit(1).execute()
        print("Consultation sessions table exists")
    except Exception as e:
        if "relation 'consultation_sessions' does not exist" in str(e):
            create_consultation_sessions_table(supabase)
            print("Created consultation_sessions table")
        else:
            print(f"Error checking consultation_sessions table: {e}")
    
    try:
        # Create chat_messages table
        supabase.table('chat_messages').select('id').limit(1).execute()
        print("Chat messages table exists")
    except Exception as e:
        if "relation 'chat_messages' does not exist" in str(e):
            create_chat_messages_table(supabase)
            print("Created chat_messages table")
        else:
            print(f"Error checking chat_messages table: {e}")
    
    try:
        # Create consultation_data table
        supabase.table('consultation_data').select('id').limit(1).execute()
        print("Consultation data table exists")
    except Exception as e:
        if "relation 'consultation_data' does not exist" in str(e):
            create_consultation_data_table(supabase)
            print("Created consultation_data table")
        else:
            print(f"Error checking consultation_data table: {e}")
    
    try:
        # Create consultation_summaries table
        supabase.table('consultation_summaries').select('id').limit(1).execute()
        print("Consultation summaries table exists")
    except Exception as e:
        if "relation 'consultation_summaries' does not exist" in str(e):
            create_consultation_summaries_table(supabase)
            print("Created consultation_summaries table")
        else:
            print(f"Error checking consultation_summaries table: {e}")

def create_patients_table(supabase):
    """Create patients table"""
    query = """
    CREATE TABLE patients (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        dob TEXT NOT NULL,
        medical_record_number TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL
    );
    """
    supabase.rpc('healio_execute_sql', {'sql': query}).execute()

def create_consultation_sessions_table(supabase):
    """Create consultation_sessions table"""
    query = """
    CREATE TABLE consultation_sessions (
        id UUID PRIMARY KEY,
        patient_id UUID NOT NULL REFERENCES patients(id),
        provider_id TEXT NOT NULL,
        session_date TIMESTAMP NOT NULL,
        status TEXT NOT NULL,
        current_section TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL
    );
    """
    supabase.rpc('healio_execute_sql', {'sql': query}).execute()

def create_chat_messages_table(supabase):
    """Create chat_messages table"""
    query = """
    CREATE TABLE chat_messages (
        id UUID PRIMARY KEY,
        consultation_session_id UUID NOT NULL REFERENCES consultation_sessions(id),
        sender TEXT NOT NULL,
        message TEXT NOT NULL,
        section TEXT NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL
    );
    """
    supabase.rpc('healio_execute_sql', {'sql': query}).execute()

def create_consultation_data_table(supabase):
    """Create consultation_data table"""
    query = """
    CREATE TABLE consultation_data (
        id UUID PRIMARY KEY,
        consultation_session_id UUID NOT NULL REFERENCES consultation_sessions(id),
        section TEXT NOT NULL,
        content JSONB NOT NULL,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL
    );
    """
    supabase.rpc('healio_execute_sql', {'sql': query}).execute()

def create_consultation_summaries_table(supabase):
    """Create consultation_summaries table"""
    query = """
    CREATE TABLE consultation_summaries (
        id UUID PRIMARY KEY,
        consultation_session_id UUID NOT NULL REFERENCES consultation_sessions(id),
        summary_data JSONB NOT NULL,
        latex_template_version TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL
    );
    """
    supabase.rpc('healio_execute_sql', {'sql': query}).execute()

if __name__ == "__main__":
    initialize_database()