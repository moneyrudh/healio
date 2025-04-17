# services/llm_service.py (updated)
import json
import asyncio
from enum import Enum
import openai
from db.client import get_openai

class StreamMode(Enum):
    """Enumeration of LLM stream response modes"""
    TEXT = "text"          # Regular text stream
    JSON = "json"          # JSON structured response stream

class LLMService:
    """Service for interacting with the LLM"""
    
    def __init__(self):
        self.openai = get_openai()
        self.model = "gpt-4-turbo"  # Can be configurable
    
    async def stream_response(self, prompt, mode=StreamMode.TEXT, system_message=None):
        """
        Generate a streaming response from the LLM
        
        Args:
            prompt: The user prompt text
            mode: The stream mode (text or JSON)
            system_message: Optional system message to guide LLM behavior
            
        Yields:
            Streamed response chunks
        """
        # Set up messages
        messages = []
        
        # Add system message if provided
        if system_message:
            messages.append({"role": "system", "content": system_message})
        
        # Add prompt
        messages.append({"role": "user", "content": prompt})
        
        # Different formatting based on mode
        if mode == StreamMode.JSON:
            if not system_message:
                messages.insert(0, {
                    "role": "system", 
                    "content": "You are a medical AI assistant that responds in JSON format. "
                    "Your responses must always be valid JSON objects. "
                    "All text content should be contained within JSON fields, never outside the JSON structure."
                    "After each complete JSON object (including the last one), include the exact string literal '//U001E//N' to indicate the end of the object."
                    "Limit your response to a maximum of 3 JSON objects."
                })
        
        # Create stream
        try:
            stream = await self.openai.chat.completions.create(
                model=self.model,
                messages=messages,
                stream=True
            )
            
            # Process stream based on mode
            if mode == StreamMode.TEXT:
                # Simple text streaming
                async for chunk in stream:
                    if hasattr(chunk.choices[0].delta, 'content') and chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content
            
            elif mode == StreamMode.JSON:
                # JSON streaming with special handling
                json_buffer = ""
                delimiter = "//U001E//N"
                
                async for chunk in stream:
                    if hasattr(chunk.choices[0].delta, 'content') and chunk.choices[0].delta.content:
                        content = chunk.choices[0].delta.content
                        json_buffer += content
                        
                        # Check for delimiter
                        if delimiter in json_buffer:
                            parts = json_buffer.split(delimiter)
                            for i in range(len(parts) - 1):  # All complete parts
                                try:
                                    # Parse complete JSON object
                                    parsed_json = json.loads(parts[i])
                                    yield json.dumps(parsed_json)
                                except json.JSONDecodeError:
                                    # Skip malformed JSON
                                    continue
                            
                            # Keep any incomplete part
                            json_buffer = parts[-1]
                
                # Handle any remaining buffer content
                if json_buffer:
                    try:
                        parsed_json = json.loads(json_buffer)
                        yield json.dumps(parsed_json)
                    except json.JSONDecodeError:
                        # If we still can't parse, just send the raw buffer
                        yield json_buffer
        
        except Exception as e:
            yield str({"error": str(e)})
    
    def get_section_prompt(self, section):
        """
        Get AI-generated prompt for a consultation section
        
        Args:
            section: The consultation section
            
        Returns:
            AI-generated prompt text for the section
        """
        # Create system message for prompt generation
        section_key = section.value if hasattr(section, 'value') else section
        
        system_message = """
        You are an AI medical assistant helping guide a doctor through a patient consultation.
        Generate a natural, professional prompt to ask the doctor for information about the current section.
        Your prompt should be direct, clear, and encourage detailed medical information.
        Do not use any medical jargon that would confuse a patient.
        Keep your response to a single question or request for information.
        """
        
        # Section descriptions to provide context
        section_descriptions = {
            "chief_complaint": "The patient's primary reason for the visit, in their own words",
            "history": "The chronological development of the patient's current medical issue",
            "subjective": "Symptoms reported by the patient, including pain, discomfort, or other experiences",
            "vital_signs": "Patient measurements like temperature, blood pressure, pulse, etc.",
            "physical": "Findings from the doctor's physical examination of the patient",
            "objective": "Results from tests, labs, imaging, or other objective measurements",
            "assessment": "The doctor's diagnosis or clinical impression of the patient's condition",
            "plan": "The proposed treatment, follow-up, or management strategy",
            "doubts": "Any questions or uncertainties the doctor has about diagnosis or treatment",
            "medications": "Prescriptions or medication changes being made for the patient",
            "notes": "Any additional information that doesn't fit in other sections"
        }
        
        description = section_descriptions.get(section_key, "Information for this section of the consultation")
        
        # Create the user prompt
        user_prompt = f"Generate a prompt asking the doctor for information about the '{section_key}' section. This refers to: {description}"
        
        # Get response
        response = self.openai.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_prompt}
            ]
        )
        
        # Extract and return the prompt
        return response.choices[0].message.content.strip()
    
    def classify_doctor_response(self, section, doctor_input):
        """
        Classify the doctor's response to determine next action
        
        Args:
            section: The current consultation section
            doctor_input: The doctor's message
            
        Returns:
            ResponseClassification enum value
        """
        from services.consultation_flow import ResponseClassification
        
        # System message for classification
        system_message = """
        You are an AI medical assistant helping guide a doctor through a patient consultation.
        Your task is to classify the doctor's response to determine the next action.
        Respond ONLY with one of these classifications:
        - SECTION_COMPLETE: The doctor has finished providing information for this section
        - NEEDS_FOLLOWUP: The doctor has provided information but might have more to add
        - MEDICAL_QUESTION: The doctor has asked a medical question that requires evidence-based answering
        - GENERAL_QUESTION: The doctor has asked a general question that doesn't require research
        """
        
        # Create prompt with context
        section_key = section.value if hasattr(section, 'value') else section
        
        prompt = f"""
        Current consultation section: {section_key}
        
        Doctor's message: "{doctor_input}"
        
        Classify this response to determine the next action. Consider:
        1. Does the message indicate the doctor is finished with this section?
        2. Does the message contain information that needs follow-up questions?
        3. Is the doctor asking a medical question that requires evidence-based information?
        4. Is the doctor asking a general question?
        """
        
        # Get response
        response = self.openai.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt}
            ]
        )
        
        # Extract classification
        classification_text = response.choices[0].message.content.strip()
        
        # Map to enum
        if "SECTION_COMPLETE" in classification_text:
            return ResponseClassification.SECTION_COMPLETE
        elif "MEDICAL_QUESTION" in classification_text:
            return ResponseClassification.MEDICAL_QUESTION
        elif "GENERAL_QUESTION" in classification_text:
            return ResponseClassification.GENERAL_QUESTION
        else:
            return ResponseClassification.NEEDS_FOLLOWUP
    
    def generate_section_summary(self, section, messages):
        """
        Generate a structured summary for a consultation section
        
        Args:
            section: The consultation section
            messages: List of chat messages for this section
            
        Returns:
            Structured summary data for the section
        """
        from db.consultation import ConsultationSection, SECTION_FORMATS, SectionFormat
        
        # Get section format
        section_enum = None
        if isinstance(section, str):
            try:
                section_enum = ConsultationSection(section)
            except ValueError:
                for s in ConsultationSection:
                    if s.value == section:
                        section_enum = s
                        break
        else:
            section_enum = section
            
        if not section_enum:
            raise ValueError(f"Invalid section: {section}")
            
        # Get the format for this section
        section_format = SECTION_FORMATS.get(section_enum, SectionFormat.PARAGRAPH)
        
        # Prepare messages for LLM
        conversation = []
        for msg in messages:
            if msg['sender'] == 'provider':
                conversation.append(f"Doctor: {msg['message']}")
            else:
                conversation.append(f"AI: {msg['message']}")
        
        conversation_text = "\n".join(conversation)
        
        # Create prompt based on the section format
        if section_format == SectionFormat.NUMBERED_BULLET:
            system_prompt = (f"You are a medical AI assistant that helps organize medical consultation notes. "
                           f"Based on the conversation about the {section} section, create a numbered list of key points. "
                           f"Return ONLY a JSON with the format: {{\"format\": \"numbered_bullet\", \"items\": [\"point 1\", \"point 2\", ...]}}")
                           
        elif section_format == SectionFormat.BULLET:
            system_prompt = (f"You are a medical AI assistant that helps organize medical consultation notes. "
                           f"Based on the conversation about the {section} section, create a bulleted list of key points. "
                           f"Return ONLY a JSON with the format: {{\"format\": \"bullet\", \"items\": [\"point 1\", \"point 2\", ...]}}")
                           
        else:  # PARAGRAPH
            system_prompt = (f"You are a medical AI assistant that helps organize medical consultation notes. "
                           f"Based on the conversation about the {section} section, create a concise paragraph summary. "
                           f"Return ONLY a JSON with the format: {{\"format\": \"paragraph\", \"content\": \"Your paragraph text here\"}}")
        
        # Create prompt for LLM
        prompt = f"Here is the conversation about the {section} section:\n\n{conversation_text}\n\nPlease summarize this information according to the required format."
        
        # Get response
        response = self.openai.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
        )
        
        # Extract and parse response
        content = response.choices[0].message.content
        
        try:
            # Extract JSON if it's wrapped in markdown code blocks
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
                
            summary_data = json.loads(content)
            return summary_data
            
        except json.JSONDecodeError as e:
            # Fallback handling if JSON parsing fails
            if section_format == SectionFormat.PARAGRAPH:
                return {"format": "paragraph", "content": content}
            else:
                # Try to extract items from text
                lines = content.strip().split('\n')
                items = [line.strip().lstrip('*-0123456789.').strip() for line in lines if line.strip()]
                format_type = "numbered_bullet" if section_format == SectionFormat.NUMBERED_BULLET else "bullet"
                return {"format": format_type, "items": items}