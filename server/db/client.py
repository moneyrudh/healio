# db/client.py
import os
import openai
from supabase import create_client
from supabase.lib.client_options import ClientOptions
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
def init_supabase():
    """Initialize and return Supabase client"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not supabase_url or not supabase_key:
        raise EnvironmentError("Missing Supabase credentials. Check your .env file.")
    
    return create_client(
        supabase_url, 
        supabase_key, 
        options=ClientOptions().replace(schema="healio")
    )

# Initialize OpenAI client
def init_openai():
    """Initialize OpenAI client"""
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        raise EnvironmentError("Missing OpenAI API key. Check your .env file.")
    
    openai.api_key = api_key
    return openai

# Get embedding from OpenAI
def get_embedding(text):
    """Generate embedding for the given text using OpenAI API"""
    openai_client = init_openai()
    response = openai_client.embeddings.create(
        model="text-embedding-ada-002",
        input=text
    )
    return response.data[0].embedding

# Singleton instances
_supabase_client = None
_openai_client = None

# Accessor functions
def get_supabase():
    """Get or create Supabase client instance"""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = init_supabase()
    return _supabase_client

def get_openai():
    """Get or create OpenAI client instance"""
    global _openai_client
    if _openai_client is None:
        _openai_client = init_openai()
    return _openai_client