"""
Medical Literature Semantic Chunking for Healio

This script processes medical literature JSON files, performs semantic chunking,
and uploads the documents and chunks to Supabase with vector embeddings.
"""

import os
import json
import time
import logging
from typing import List, Dict, Any
from langchain_experimental.text_splitter import SemanticChunker
from langchain_openai.embeddings import OpenAIEmbeddings
from supabase import create_client, Client
from supabase.lib.client_options import ClientOptions
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("processing.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY")  # Make sure to use service key to bypass RLS
supabase: Client = create_client(supabase_url, supabase_key, options=ClientOptions().replace(schema="healio"))

# Initialize OpenAI embeddings
openai_api_key = os.getenv("OPENAI_API_KEY")
embeddings_model = OpenAIEmbeddings(openai_api_key=openai_api_key)

# Initialize semantic chunker with percentile threshold
text_splitter = SemanticChunker(
    embeddings_model,
    breakpoint_threshold_type="percentile",  # Use percentile to find logical breakpoints
    min_chunk_size=100  # Ensure chunks aren't too small
)

def read_json_files(directory: str) -> List[Dict[str, Any]]:
    """Read all JSON files from the specified directory and return their contents."""
    all_articles = []
    
    for filename in os.listdir(directory):
        if filename.endswith('.json'):
            filepath = os.path.join(directory, filename)
            logger.info(f"Reading {filepath}")
            
            with open(filepath, 'r', encoding='utf-8') as f:
                articles = json.load(f)
                category = filename.replace('.json', '')
                
                # Add category to each article
                for article in articles:
                    article['category'] = category
                
                all_articles.extend(articles)
    
    logger.info(f"Loaded {len(all_articles)} articles from all files")
    return all_articles

def prepare_document(article: Dict[str, Any]) -> Dict[str, Any]:
    """Prepare document for insertion into the documents table."""
    # Combine abstract and body text for full text
    full_text = ""
    if article.get('abstract'):
        full_text += article['abstract'] + "\n\n"
    if article.get('body_text'):
        full_text += article['body_text']
    
    # Extract PMID as integer for use as primary key
    pmid_str = article.get('pmid', '')
    try:
        # Convert to integer for database storage
        pmid = int(pmid_str)
    except (ValueError, TypeError):
        raise ValueError(f"Invalid or missing PMID: {pmid_str}")
    
    # Prepare metadata - include keywords for enhanced search
    metadata = {
        'keywords': article.get('keywords', []),
        'category': article.get('category', '')
    }
    
    # Convert authors string to JSON array
    authors_data = []
    if article.get('authors'):
        authors_list = article['authors'].split(', ')
        authors_data = [{"name": author} for author in authors_list]
    
    return {
        'id': pmid,  # Using PMID (as integer) as the primary key
        'article_id': article.get('pmcid', ''),
        'title': article.get('title', ''),
        'authors': authors_data,
        'publication_date': None,  # Not available in the scraper data
        'full_text': full_text,
        'metadata': metadata
    }

def check_document_exists(pmid: int) -> bool:
    """Check if a document with the given PMID already exists."""
    try:
        result = supabase.table('documents').select('id').eq('id', pmid).execute()
        return result.data and len(result.data) > 0
    except Exception as e:
        logger.error(f"Error checking if document exists: {str(e)}")
        return False

def insert_document(document: Dict[str, Any]) -> None:
    """Insert document into the documents table."""
    try:
        result = supabase.table('documents').insert(document).execute()
        
        if not result.data or len(result.data) == 0:
            raise Exception(f"Failed to insert document: {result.error}")
    except Exception as e:
        logger.error(f"Error inserting document: {str(e)}")
        raise

def chunk_document(document_id: str, full_text: str) -> List[Dict[str, Any]]:
    """
    Chunk the document text using semantic chunking and generate embeddings.
    
    The semantic chunker analyzes sentence similarities to find natural
    breakpoints in the text, creating more coherent chunks than simple
    character-based splitting.
    """
    # Skip empty or very short texts
    if not full_text or len(full_text) < 100:
        logger.warning(f"Text too short for document {document_id}, skipping chunking")
        return []
    
    # Handle large documents by pre-splitting into manageable sections
    # to avoid token limits in the embedding model
    all_chunks = []
    
    try:
        # For large documents, pre-split by paragraphs
        if len(full_text) > 10000:
            logger.info(f"Large document detected ({len(full_text)} chars), pre-splitting by paragraphs")
            paragraphs = full_text.split('\n\n')
            
            for para in paragraphs:
                if len(para) > 200:  # Ensure paragraph has enough content
                    try:
                        # Apply semantic chunking to each paragraph
                        para_chunks = text_splitter.split_text(para)
                        all_chunks.extend(para_chunks)
                    except Exception as e:
                        logger.warning(f"Error in semantic chunking for paragraph: {str(e)}")
                        # Fall back to using paragraph as a chunk
                        all_chunks.append(para)
        else:
            # For smaller documents, use semantic chunker directly
            all_chunks = text_splitter.split_text(full_text)
    except Exception as e:
        logger.error(f"Error in semantic chunking: {str(e)}")
        # Fall back to simple paragraph splitting
        logger.info("Falling back to simple paragraph splitting")
        all_chunks = [p for p in full_text.split('\n\n') if len(p) > 100]
    
    logger.info(f"Created {len(all_chunks)} semantic chunks")
    
    # Prepare chunks with embeddings
    chunk_objects = []
    for i, chunk_text in enumerate(all_chunks):
        try:
            # Generate embedding vector for the chunk
            embedding = embeddings_model.embed_query(chunk_text)
            
            chunk_objects.append({
                'document_id': document_id,
                'chunk_text': chunk_text,
                'embedding': embedding,
                'chunk_index': i
            })
        except Exception as e:
            logger.error(f"Error generating embedding for chunk {i}: {str(e)}")
    
    return chunk_objects

def insert_chunks(chunks: List[Dict[str, Any]]):
    """Insert chunks into the chunks table."""
    if not chunks:
        return
    
    # Insert chunks in batches to avoid request size limitations
    batch_size = 20  # Smaller batch size for vector data
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i+batch_size]
        try:
            supabase.table('chunks').insert(batch).execute()
            logger.info(f"Inserted chunks {i+1}-{i+len(batch)}")
        except Exception as e:
            logger.error(f"Error inserting chunk batch: {str(e)}")
            # Try inserting one by one if batch insert fails
            for j, chunk in enumerate(batch):
                try:
                    supabase.table('chunks').insert(chunk).execute()
                except Exception as e2:
                    logger.error(f"Failed to insert individual chunk {i+j+1}: {str(e2)}")
        
        # Add delay to prevent rate limiting
        time.sleep(1)

def process_articles():
    """Process all articles, perform semantic chunking, and upload to Supabase."""
    # Read all articles from JSON files
    medical_literature_dir = 'medical_literature'
    articles = read_json_files(medical_literature_dir)
    
    logger.info(f"Starting processing of {len(articles)} articles")
    
    for i, article in enumerate(articles):
        try:
            # Skip articles without PMID (every article must have a PMID)
            if not article.get('pmid'):
                logger.warning(f"Skipping article #{i+1} - missing PMID")
                continue
                
            # Try to parse PMID as integer
            try:
                pmid = int(article['pmid'])
            except (ValueError, TypeError):
                logger.warning(f"Skipping article #{i+1} - invalid PMID format: {article['pmid']}")
                continue
            
            # Check if document already exists to avoid duplicates
            if check_document_exists(pmid):
                logger.info(f"Article with PMID {pmid} already exists, skipping")
                continue
            
            # Prepare document for insertion
            try:
                document = prepare_document(article)
            except ValueError as e:
                logger.warning(f"Skipping article #{i+1}: {str(e)}")
                continue
            
            # Skip articles without meaningful content
            if not document['title'] or not document['full_text']:
                logger.warning(f"Skipping article #{i+1} (PMID: {pmid}) - missing title or content")
                continue
            
            # Insert document into database
            insert_document(document)
            document_id = document['id']  # The integer PMID
            logger.info(f"Inserted article {i+1}/{len(articles)}: {document['title'][:50]}...")
            
            # Apply semantic chunking and create embeddings
            chunks = chunk_document(document_id, document['full_text'])
            logger.info(f"Created {len(chunks)} embedded chunks for document {document_id}")
            
            # Insert chunks with embeddings
            insert_chunks(chunks)
            
            # Add delay between processing articles
            time.sleep(0.5)
            
        except Exception as e:
            logger.error(f"Error processing article #{i+1}: {str(e)}")
            continue
        
        # Log progress periodically
        if (i + 1) % 10 == 0 or i + 1 == len(articles):
            logger.info(f"Progress: {i+1}/{len(articles)} articles processed")

if __name__ == "__main__":
    logger.info("Starting medical literature processing with semantic chunking")
    try:
        process_articles()
        logger.info("Processing completed successfully")
    except Exception as e:
        logger.error(f"Unhandled exception in main process: {str(e)}")