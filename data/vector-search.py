"""
Medical Knowledge Vector Search Demo for Healio

This script demonstrates how to use the vector search function to query medical information
in the DOUBTS section of the consultation flow.
"""

import os
from dotenv import load_dotenv
from supabase import create_client
from supabase.lib.client_options import ClientOptions
import openai  # Added import for OpenAI

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
supabase = create_client(supabase_url, supabase_key, options=ClientOptions().replace(schema="healio"))

# Initialize OpenAI API
openai.api_key = os.getenv("OPENAI_API_KEY")

def get_embedding(text):
    """Generate embedding for the given text using OpenAI API"""
    response = openai.embeddings.create(
        model="text-embedding-ada-002",
        input=text
    )
    return response.data[0].embedding

def search_medical_knowledge(query: str, match_count: int = 5):
    """
    Search the medical knowledge database for information related to the query.
    
    Args:
        query: The medical question or topic to search for
        match_count: Number of results to return
        
    Returns:
        List of relevant medical information chunks with their sources
    """
    # Generate embedding for the query
    query_embedding = get_embedding(query)
    
    # Call the vector search function with pre-computed embedding
    response = supabase.rpc(
        'search_medical_knowledge',  # Updated function name
        {
            'query_embedding': query_embedding,  # Pass the embedding instead of text
            'match_count': match_count
        }
    ).execute()
    
    if hasattr(response, 'error') and response.error:
        print(f"Error searching knowledge base: {response.error}")
        return []
    
    return response.data

def format_search_results(results):
    """Format search results for presentation to the doctor."""
    if not results:
        return "No relevant information found in the medical knowledge base."
    
    formatted_output = "Here's what I found in the medical literature:\n\n"
    
    for i, result in enumerate(results, 1):
        # Extract information from the result
        chunk_text = result['chunk_text']
        similarity = result['similarity']
        article_id = result['article_id']
        pmid = result['document_id']
        title = result['title']
        
        # Format the citation information
        source = f"{title} (PMCID: {article_id}, PMID: {pmid})"
        
        # Add to formatted output
        formatted_output += f"[{i}] {chunk_text}\n"
        formatted_output += f"Source: {source}\n"
        formatted_output += f"Relevance: {similarity:.2f}\n\n"
    
    return formatted_output

def answer_medical_question(doctor_question: str):
    """
    Process a doctor's medical question during the DOUBTS section of the consultation.
    
    This function would be called from the process_chat function when:
    1. current_section == ConsultationSection.DOUBTS
    2. is_medical_question(user_input) returns True
    """
    # Search the knowledge base
    results = search_medical_knowledge(doctor_question)
    
    # Format the results
    formatted_answer = format_search_results(results)
    
    # In a real implementation, this would be integrated with the LLM to provide
    # a more conversational response with the retrieved information
    return formatted_answer

# Example usage
if __name__ == "__main__":
    # Example medical questions a doctor might ask during the DOUBTS section
    example_questions = [
        "What are the latest treatment guidelines for heart failure with reduced ejection fraction?",
        # "What are the risk factors for postoperative pneumonia?",
        # "How should hypertension be managed in patients with chronic kidney disease?",
        # "What are the diagnostic criteria for metabolic syndrome?"
    ]
    
    for question in example_questions:
        print("\n" + "=" * 80)
        print(f"DOCTOR'S QUESTION: {question}")
        print("=" * 80)
        
        answer = answer_medical_question(question)
        print(answer)