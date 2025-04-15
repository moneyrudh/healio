# db/chat_history.py
import uuid
import datetime
from .client import get_supabase

class ChatHistoryManager:
    """Manages chat message history for consultation sessions"""
    
    def __init__(self):
        self.supabase = get_supabase()
    
    def store_message(self, consultation_id, sender, message, section):
        """
        Store a chat message
        
        Args:
            consultation_id: The consultation session UUID
            sender: Who sent the message ('provider' or 'ai')
            message: The message content
            section: The current section when message was sent
            
        Returns:
            Stored message data
        """
        # Validate sender
        if sender not in ['provider', 'ai']:
            raise ValueError("Sender must be either 'provider' or 'ai'")
        
        # Create message record
        message_data = {
            "id": str(uuid.uuid4()),
            "consultation_session_id": consultation_id,
            "sender": sender,
            "message": message,
            "section": section,
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