# services/consultation_flow.py (updated)
from db.consultation import ConsultationManager, ConsultationSection
from db.chat_history import ChatHistoryManager
from db.vector_search import VectorSearch
from .llm_service import LLMService, StreamMode
import asyncio
from enum import Enum, auto
import json

class ResponseClassification(Enum):
    """Classification of doctor's responses for flow control"""
    SECTION_COMPLETE = auto()  # Doctor has finished with this section
    NEEDS_FOLLOWUP = auto()    # Doctor has provided info but may have more
    MEDICAL_QUESTION = auto()  # Doctor has asked a medical question requiring evidence
    GENERAL_QUESTION = auto()  # Doctor has asked a general question

class ConsultationFlow:
    """Manages the flow of a medical consultation through its sections"""
    
    def __init__(self):
        self.consultation_manager = ConsultationManager()
        self.chat_history = ChatHistoryManager()
        self.vector_search = VectorSearch()
        self.llm_service = LLMService()
    
    def get_next_section(self, current_section):
        """
        Determine the next section in the consultation flow
        
        Args:
            current_section: The current section
            
        Returns:
            Next section in the flow
        """
        section_order = [
            ConsultationSection.CHIEF_COMPLAINT,
            ConsultationSection.HISTORY,
            ConsultationSection.SUBJECTIVE,
            ConsultationSection.VITAL_SIGNS,
            ConsultationSection.PHYSICAL,
            ConsultationSection.OBJECTIVE,
            ConsultationSection.ASSESSMENT,
            ConsultationSection.PLAN,
            ConsultationSection.DOUBTS,
            ConsultationSection.MEDICATIONS,
            ConsultationSection.NOTES,
            ConsultationSection.COMPLETE
        ]
        
        # Get current section as enum if it's a string
        if isinstance(current_section, str):
            try:
                current_section_enum = ConsultationSection(current_section)
            except ValueError:
                # Try to match by value
                for section in ConsultationSection:
                    if section.value == current_section:
                        current_section_enum = section
                        break
                else:
                    raise ValueError(f"Invalid section: {current_section}")
        else:
            current_section_enum = current_section
        
        # Find current index and return next section
        current_index = section_order.index(current_section_enum)
        if current_index < len(section_order) - 1:
            return section_order[current_index + 1]
        else:
            return ConsultationSection.COMPLETE
    
    async def process_medical_question(self, consultation_id, user_message, current_section):
        """
        Process a medical question in the DOUBTS section
        
        Args:
            consultation_id: The consultation session ID
            user_message: The doctor's question
            current_section: Current section (should be DOUBTS)
            
        Returns:
            Dictionary with response data for streaming
        """
        # Generate AI response using vector search
        search_results = self.vector_search.search_medical_knowledge(user_message)
        formatted_results = self.vector_search.format_search_results(search_results)
        
        # Create a system message for LLM
        system_message = """
        You are a medical AI assistant helping a doctor with their questions.
        Use the provided medical literature to give evidence-based answers.
        Format your response as valid JSON with the following structure:
        {
            "type": "rag",
            "content": "Your evidence-based answer here",
            "sources": ["source_id_1", "source_id_2"]
        }
        
        Include only the source IDs (the "id" field from the chunks and NOT the "article_id" field) you actually use in your answer.
        Limit to 3 sources maximum.
        After each complete JSON object, include the string literal "//U001E//N".
        """
        
        # Extract source IDs for reference
        source_ids = []
        for source in formatted_results.get('sources', []):
            source_ids.append(source.get('id', ''))
        
        # Create a prompt that includes the search results
        prompt = f"""
        Doctor's Question: {user_message}
        
        Search Results:
        {json.dumps(formatted_results, indent=2)}
        
        Source IDs available: {source_ids}
        
        Please provide a concise, evidence-based answer based on these sources.
        Format as a JSON object as specified in the system instructions.
        """
        
        # Return streaming response configuration
        return {
            "type": "medical_question",
            "stream_mode": StreamMode.JSON.value,
            "user_message": user_message,
            "prompt": prompt,
            "system_message": system_message,
            "current_section": current_section,
            "search_results": formatted_results,
            "source_ids": source_ids
        }
    
    async def process_chat_message(self, consultation_id, user_message):
        """
        Process a chat message and generate a response
        
        Args:
            consultation_id: The consultation session ID
            user_message: The message from the doctor
            
        Returns:
            Response data including AI message and section information
        """
        # Get current consultation state
        consultation = self.consultation_manager.get_consultation(consultation_id)
        if not consultation:
            raise ValueError(f"Consultation not found: {consultation_id}")
            
        current_section = consultation["current_section"]

        if current_section == ConsultationSection.COMPLETE.value or current_section == "complete":
            # Still store the doctor's message
            self.chat_history.store_message(
                consultation_id=consultation_id,
                sender="provider",
                message=user_message,
                section=current_section
            )
            
            # Return a completion message
            completion_message = "The consultation session is complete. You can now view and download the summary report."
            
            # Store AI response
            self.chat_history.store_message(
                consultation_id=consultation_id,
                sender="ai",
                message=completion_message,
                section=current_section
            )
            
            return {
                "type": "completion_acknowledgment",
                "message": completion_message,
                "current_section": current_section
            }
        
        # Store the doctor's message
        self.chat_history.store_message(
            consultation_id=consultation_id,
            sender="provider",
            message=user_message,
            section=current_section
        )
        
        # Use AI to classify the doctor's response
        classification = self.llm_service.classify_doctor_response(current_section, user_message)
        
        # Handle section completion
        if classification == ResponseClassification.SECTION_COMPLETE:
            # Get next section
            next_section = self.get_next_section(current_section)
            
            # If we're completing a section, generate summary data
            if current_section != ConsultationSection.DOUBTS.value:
                # Get all messages for this section
                section_messages = self.chat_history.get_messages(consultation_id, current_section)
                
                # Generate section summary
                summary_data = self.llm_service.generate_section_summary(current_section, section_messages)
                
                # Store the summary data
                self.consultation_manager.store_section_data(consultation_id, current_section, summary_data)
            
            # Update consultation with new section
            self.consultation_manager.update_consultation_section(consultation_id, next_section)
            
            # Generate prompt for next section
            ai_message = self.llm_service.get_section_prompt(next_section)
            
            # Store AI response
            self.chat_history.store_message(
                consultation_id=consultation_id,
                sender="ai",
                message=ai_message,
                section=next_section
            )
            
            # Return transition response
            return {
                "type": "section_transition",
                "message": ai_message,
                "previous_section": current_section,
                "current_section": next_section.value if hasattr(next_section, 'value') else next_section
            }
        
        # Special handling for medical questions in DOUBTS section
        if current_section == ConsultationSection.DOUBTS.value and classification == ResponseClassification.MEDICAL_QUESTION:
            return await self.process_medical_question(consultation_id, user_message, current_section)
        
        # For general questions in DOUBTS section
        if current_section == ConsultationSection.DOUBTS.value and classification == ResponseClassification.GENERAL_QUESTION:
            # Create system message for general questions
            system_message = """
            You are a medical AI assistant helping a doctor during a consultation.
            Answer the doctor's general question based on your medical knowledge.
            You don't need to provide citations for general questions.
            """
            
            prompt = f"Doctor's general question: {user_message}"
            
            # Return regular text streaming response
            return {
                "type": "general_question",
                "stream_mode": StreamMode.TEXT.value,
                "user_message": user_message,
                "prompt": prompt,
                "system_message": system_message,
                "current_section": current_section
            }
        
        # For follow-up in any section
        ai_message = None
        
        if current_section == ConsultationSection.DOUBTS.value:
            # Follow-up prompt for DOUBTS section
            ai_message = "Is there anything specific you'd like to know about this case? Or would you like to move to the next section?"
        else:
            # AI-generated follow-up question
            ai_message = self.llm_service.generate_followup_question(
                current_section, 
                user_message  # Pass the doctor's current message for context
            )
        # Store AI response
        self.chat_history.store_message(
            consultation_id=consultation_id,
            sender="ai",
            message=ai_message,
            section=current_section
        )
        
        # Return follow-up response
        return {
            "type": "follow_up",
            "message": ai_message,
            "current_section": current_section,
            "stream_mode": StreamMode.TEXT.value
        }
    
    def complete_consultation(self, consultation_id):
        """
        Complete a consultation and generate the final summary
        
        Args:
            consultation_id: The consultation session ID
            
        Returns:
            Complete summary data
        """
        # Get all section data
        all_section_data = self.consultation_manager.get_all_section_data(consultation_id)
        
        # Mark consultation as complete
        self.consultation_manager.complete_consultation(consultation_id)
        
        # Store the complete summary
        self.consultation_manager.store_consultation_summary(consultation_id, all_section_data)
        
        return all_section_data