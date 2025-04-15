# services/llm_service.py
import json
import asyncio
from enum import Enum
import openai
from ..db.client import get_openai

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
                
                async for chunk in stream:
                    if hasattr(chunk.choices[0].delta, 'content') and chunk.choices[0].delta.content:
                        content = chunk.choices[0].delta.content
                        json_buffer += content
                        
                        try:
                            # Try to parse as JSON to see if we have a complete object
                            parsed_json = json.loads(json_buffer)
                            yield json.dumps(parsed_json)
                            json_buffer = ""  # Reset buffer after successful parse
                        except json.JSONDecodeError:
                            # Not yet a complete JSON, continue collecting
                            continue
                
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
        Get the appropriate prompt for a consultation section
        
        Args:
            section: The consultation section
            
        Returns:
            Prompt text for the section
        """
        prompts = {
            "chief_complaint": "What is the chief complaint of the patient?",
            "history": "What is the history of the present illness?",
            "subjective": "What subjective information did the patient report?",
            "vital_signs": "What are the patient's vital signs?",
            "physical": "What were your findings from the physical examination?",
            "objective": "What objective findings do you have from tests or measurements?",
            "assessment": "What is your assessment of the patient's condition?",
            "plan": "What is your treatment plan for the patient?",
            "doubts": "Do you have any medical questions or doubts about this case?",
            "medications": "What medications are you prescribing or continuing?",
            "notes": "Are there any additional notes you'd like to include?"
        }
        
        section_key = section.value if hasattr(section, 'value') else section
        return prompts.get(section_key, "Please provide the relevant information for this section.")
    
    def generate_section_summary(self, section, messages):
        """
        Generate a structured summary for a consultation section
        
        Args:
            section: The consultation section
            messages: List of chat messages for this section
            
        Returns:
            Structured summary data for the section
        """
        from ..db.consultation import ConsultationSection, SECTION_FORMATS, SectionFormat
        
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