# db/vector_search.py
from .client import get_supabase, get_embedding

class VectorSearch:
    """
    Handles medical knowledge vector search for the DOUBTS section.
    Only to be used during the DOUBTS consultation section.
    """
    
    def __init__(self):
        self.supabase = get_supabase()
    
    def search_medical_knowledge(self, query, match_count=5):
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
        response = self.supabase.rpc(
            'search_medical_knowledge',
            {
                'query_embedding': query_embedding,
                'match_count': match_count
            }
        ).execute()
        
        if hasattr(response, 'error') and response.error:
            print(f"Error searching knowledge base: {response.error}")
            return []
        
        return response.data
    
    def format_search_results(self, results, max_sources=3):
        """
        Format search results for presentation to the doctor.
        Limits to maximum number of sources specified.
        
        Args:
            results: List of search results
            max_sources: Maximum number of sources to include
            
        Returns:
            Dict containing formatted search results with citations
        """
        if not results:
            return {
                "answer": "No relevant information found in the medical knowledge base.",
                "sources": []
            }
        
        # Deduplicate sources and limit to max_sources
        unique_sources = {}
        for result in results:
            source_id = result.get('document_id')
            if source_id not in unique_sources and len(unique_sources) < max_sources:
                unique_sources[source_id] = {
                    "id": source_id,
                    "title": result.get('title', 'Unknown Source'),
                    "article_id": result.get('article_id', 'N/A'),
                    "similarity": result.get('similarity', 0),
                    "chunks": []
                }
            
            if source_id in unique_sources:
                unique_sources[source_id]["chunks"].append({
                    "text": result.get('chunk_text', ''),
                    "chunk_index": result.get('chunk_index', 0)
                })
        
        return {
            "sources": list(unique_sources.values())
        }
    
    def answer_medical_question(self, question):
        """
        Process a doctor's medical question during the DOUBTS section.
        
        Args:
            question: The doctor's medical question
            
        Returns:
            Formatted search results with citations
        """
        results = self.search_medical_knowledge(question)
        return self.format_search_results(results)