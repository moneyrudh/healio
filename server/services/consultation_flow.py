# services/consultation_flow.py
from db.consultation import ConsultationManager, ConsultationSection
from db.chat_history import ChatHistoryManager
from db.vector_search import VectorSearch
from .llm_service import LLMService, StreamMode
import asyncio

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
    
    def is_section_complete(self, doctor_input):
        """
        Check if the current section is ready to be completed
        based on doctor's input
        
        Args:
            doctor_input: The doctor's latest message
            
        Returns:
            Boolean indicating if section should be completed
        """
        # Simple check for common completion phrases
        completion_phrases = [
            "next section", "done", "complete", "finished", "next", "move on",
            "proceed", "continue", "that's all", "that is all", "nothing else"
        ]
        
        # Normalize input and check for completion phrases
        input_lower = doctor_input.lower()
        for phrase in completion_phrases:
            if phrase in input_lower:
                return True
                
        return False
    
    def is_medical_question(self, doctor_input):
        """
        Check if the doctor's input is a medical question (for DOUBTS section)
        
        Args:
            doctor_input: The doctor's latest message
            
        Returns:
            Boolean indicating if input is a medical question
        """
        # Simple check for question patterns
        question_patterns = ["?", "what", "how", "when", "where", "which", "who", "why", "can", "could", "should", "would", "is", "are"]
        
        input_lower = doctor_input.lower()
        
        # Check if it's a question
        if "?" in input_lower:
            return True
            
        # Check for question words at the beginning
        for pattern in question_patterns:
            if input_lower.startswith(pattern + " "):
                return True
                
        return False
    
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
        
        # Store the doctor's message
        self.chat_history.store_message(
            consultation_id=consultation_id,
            sender="provider",
            message=user_message,
            section=current_section
        )
        
        # Check if section is complete
        should_transition = self.is_section_complete(user_message)
        
        if should_transition:
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
        
        # Special handling for DOUBTS section
        if current_section == ConsultationSection.DOUBTS.value and self.is_medical_question(user_message):
            # Generate AI response using vector search
            search_results = self.vector_search.search_medical_knowledge(user_message)
            formatted_results = self.vector_search.format_search_results(search_results)
            
            # Generate a system message for LLM
            system_message = ("You are a medical AI assistant helping a doctor with their questions. "
                            "Use the provided medical literature to give evidence-based answers. "
                            "Be concise and factual. Cite your sources clearly.")
            
            # Create a prompt that includes the search results
            prompt = f"""
            Doctor's Question: {user_message}
            
            Search Results:
            {formatted_results}
            
            Please provide a concise, evidence-based answer based on these sources.
            """
            
            # Stream mode is JSON for DOUBTS section
            return {
                "type": "medical_question",
                "stream_mode": StreamMode.JSON.value,
                "user_message": user_message,
                "prompt": prompt,
                "system_message": system_message,
                "current_section": current_section,
                "search_results": formatted_results
            }
        
        # For regular follow-up in other sections
        if current_section == ConsultationSection.DOUBTS.value:
            # Regular response for non-question in DOUBTS section
            ai_message = "Is there anything specific you'd like to know about this case? Or would you like to move to the next section?"
        else:
            # Regular follow-up for other sections
            ai_message = "Is there anything else to add for this section?"
        
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