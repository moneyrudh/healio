# db/chat_history.py
import uuid
import datetime
from .client import get_supabase

class ChatHistoryManager:
    """Manages chat message history for consultation sessions"""
    
    def __init__(self):
        self.supabase = get_supabase()
    
    def store_message(self, consultation_id, sender, message, section, message_type=None, sources=None):
        """
        Store a chat message with structured JSON format
        
        Args:
            consultation_id: The consultation session UUID
            sender: Who sent the message ('provider' or 'ai')
            message: The message content (dict with type/content or string content)
            section: The current section when message was sent
            message_type: The type of message ('text', 'rag', etc.)
            sources: Optional sources for 'rag' type messages
            
        Returns:
            Stored message data
        """
        # Validate sender
        if sender not in ['provider', 'ai']:
            raise ValueError("Sender must be either 'provider' or 'ai'")
        
        section_value = section.value if hasattr(section, 'value') else section
        
        # Format message as JSONB structure
        message_json = None
        
        # If message is already a dict, use it as is
        if isinstance(message, dict) and 'type' in message:
            message_json = message
        # If message_type is rag, include sources
        elif message_type == "rag":
            message_json = {
                "type": "rag",
                "content": message if isinstance(message, str) else "",
                "sources": sources or []
            }
        # Default to text type
        else:
            message_json = {
                "type": message_type or "text",
                "content": message if isinstance(message, str) else ""
            }
    
        # Create message record
        message_data = {
            "id": str(uuid.uuid4()),
            "consultation_session_id": consultation_id,
            "sender": sender,
            "message": message_json,
            "section": section_value,
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "created_at": datetime.datetime.utcnow().isoformat()
        }
        
        # Insert into database
        result = self.supabase.table('chat_messages').insert(message_data).execute()
        
        if hasattr(result, 'error') and result.error:
            raise Exception(f"Error storing message: {result.error}")
            
        return result.data[0] if result.data else None
    
    def get_messages(self, consultation_id, section=None):
        """
        Retrieve chat messages for a consultation
        
        Args:
            consultation_id: The consultation session UUID
            section: Optional section filter
            
        Returns:
            List of chat messages in chronological order
        """
        query = self.supabase.table('chat_messages').select('*').eq('consultation_session_id', consultation_id)
        
        if section:
            # Filter by section if provided
            section_value = section.value if hasattr(section, 'value') else section
            query = query.eq('section', section_value)
        
        result = query.order('timestamp').execute()
        
        if hasattr(result, 'error') and result.error:
            raise Exception(f"Error retrieving messages: {result.error}")
            
        return result.data
    
    def get_latest_messages(self, consultation_id, limit=10):
        """
        Retrieve most recent chat messages for a consultation
        
        Args:
            consultation_id: The consultation session UUID
            limit: Maximum number of messages to retrieve
            
        Returns:
            List of most recent chat messages in reverse chronological order
        """
        result = self.supabase.table('chat_messages').select('*').eq('consultation_session_id', consultation_id).order('timestamp', desc=True).limit(limit).execute()
        
        if hasattr(result, 'error') and result.error:
            raise Exception(f"Error retrieving messages: {result.error}")
            
        # Reverse to get chronological order
        return list(reversed(result.data))