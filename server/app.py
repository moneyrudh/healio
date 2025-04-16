# app.py
from flask import Flask, request, jsonify, Response, stream_with_context
import os
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import services and managers
from db.patients import PatientManager
from db.consultation import ConsultationManager
from db.chat_history import ChatHistoryManager
from services.consultation_flow import ConsultationFlow
from services.document_generator import DocumentGenerator
from services.llm_service import LLMService, StreamMode
from db.providers import ProviderManager

# Create Flask app
app = Flask(__name__)

# Initialize services
patient_manager = PatientManager()
consultation_manager = ConsultationManager()
chat_history = ChatHistoryManager()
consultation_flow = ConsultationFlow()
document_generator = DocumentGenerator()
llm_service = LLMService()
provider_manager = ProviderManager()

# Global async event loop
async_loop = None

@app.before_first_request
def initialize_async():
    global async_loop
    async_loop = asyncio.new_event_loop()
    asyncio.set_event_loop(async_loop)

# Routes
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy"})

# Add provider endpoint
@app.route('/api/providers', methods=['GET'])
def get_providers():
    """Get all available providers"""
    providers = provider_manager.get_all_providers()
    return jsonify(providers)

@app.route('/api/patients', methods=['GET'])
def get_patients():
    """Get all patients or a specific patient"""
    patient_id = request.args.get('id')
    mrn = request.args.get('mrn')
    
    if patient_id:
        # Get specific patient by ID
        patient = patient_manager.get_patient(patient_id)
        if not patient:
            return jsonify({"error": "Patient not found"}), 404
        return jsonify(patient)
    
    elif mrn:
        # Get patient by MRN
        patient = patient_manager.get_patient_by_mrn(mrn)
        if not patient:
            return jsonify({"error": "Patient not found"}), 404
        return jsonify(patient)
    
    else:
        # Get all patients with pagination
        limit = int(request.args.get('limit', 100))
        offset = int(request.args.get('offset', 0))
        patients = patient_manager.get_all_patients(limit, offset)
        return jsonify(patients)

@app.route('/api/patients', methods=['POST'])
def create_patient():
    """Create a new patient"""
    data = request.json
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Validate required fields
    if 'name' not in data:
        return jsonify({"error": "Patient name is required"}), 400
    if 'dob' not in data:
        return jsonify({"error": "Date of birth is required"}), 400
    
    try:
        patient = patient_manager.create_patient(
            name=data['name'],
            dob=data['dob'],
            other_info=data.get('other_info')
        )
        return jsonify(patient), 201
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/consultations', methods=['GET'])
def get_consultations():
    """Get consultations for a patient"""
    patient_id = request.args.get('patient_id')
    consultation_id = request.args.get('id')
    
    if consultation_id:
        # Get specific consultation
        consultation = consultation_manager.get_consultation(consultation_id)
        if not consultation:
            return jsonify({"error": "Consultation not found"}), 404
        return jsonify(consultation)
    
    elif patient_id:
        # Get consultations for patient
        consultations = consultation_manager.get_patient_consultations(patient_id)
        return jsonify(consultations)
    
    else:
        return jsonify({"error": "Either patient_id or consultation id is required"}), 400

@app.route('/api/consultations', methods=['POST'])
def create_consultation():
    """Create a new consultation session"""
    data = request.json
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Validate required fields
    if 'patient_id' not in data:
        return jsonify({"error": "Patient ID is required"}), 400
    if 'provider_id' not in data:
        return jsonify({"error": "Provider ID is required"}), 400
    
    try:
        consultation = consultation_manager.create_consultation(
            patient_id=data['patient_id'],
            provider_id=data['provider_id']
        )
        
        # Add initial AI message asking for chief complaint
        initial_message = llm_service.get_section_prompt("chief_complaint")
        chat_history.store_message(
            consultation_id=consultation['id'],
            sender="ai",
            message=initial_message,
            section="chief_complaint"
        )
        
        return jsonify({
            "consultation": consultation,
            "initial_message": initial_message
        }), 201
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat/history', methods=['GET'])
def get_chat_history():
    """Get chat history for a consultation"""
    consultation_id = request.args.get('consultation_id')
    
    if not consultation_id:
        return jsonify({"error": "Consultation ID is required"}), 400
    
    try:
        messages = chat_history.get_messages(consultation_id)
        return jsonify(messages)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """Process a chat message and return a streamed response"""
    data = request.json
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Validate required fields
    if 'consultation_id' not in data:
        return jsonify({"error": "Consultation ID is required"}), 400
    if 'message' not in data:
        return jsonify({"error": "Message is required"}), 400
    
    # Process message async
    consultation_id = data['consultation_id']
    user_message = data['message']
    
    # Run in async loop
    global async_loop
    response_data = async_loop.run_until_complete(
        consultation_flow.process_chat_message(consultation_id, user_message)
    )
    
    # If section transition or follow-up, return direct response
    if response_data['type'] in ['section_transition', 'follow_up']:
        return jsonify(response_data)
    
    # For streaming responses (medical questions or general questions)
    if response_data['type'] in ['medical_question', 'general_question']:
        # Determine stream mode
        stream_mode = StreamMode.JSON if response_data.get('stream_mode') == 'json' else StreamMode.TEXT
        
        def generate():
            # Initial response data
            yield f"data: {{'type': 'start', 'current_section': '{response_data['current_section']}'}}\n\n"
            
            # For medical questions with RAG
            if response_data['type'] == 'medical_question' and stream_mode == StreamMode.JSON:
                # Get source mapping for enriching responses
                source_mapping = {}
                for source in response_data.get('search_results', {}).get('sources', []):
                    source_id = source.get('id')
                    if source_id:
                        source_mapping[source_id] = {
                            "id": source_id,
                            "pmcid": source.get('article_id', 'N/A'),
                            "title": source.get('title', 'Unknown'),
                            "authors": source.get('authors', [])
                        }
                
                # Stream LLM response
                for chunk in async_loop.run_until_complete(
                    llm_service.stream_response(
                        response_data['prompt'],
                        mode=stream_mode,
                        system_message=response_data.get('system_message')
                    )
                ):
                    try:
                        # Parse JSON chunk
                        json_response = json.loads(chunk)
                        
                        # Enrich with source details
                        source_ids = json_response.get('sources', [])
                        enriched_sources = []
                        
                        for source_id in source_ids:
                            if source_id in source_mapping:
                                enriched_sources.append(source_mapping[source_id])
                        
                        # Replace source IDs with enriched sources
                        json_response['sources'] = enriched_sources
                        
                        # Send to client
                        yield f"data: {json.dumps(json_response)}\n\n"
                        
                    except json.JSONDecodeError:
                        # Handle non-JSON chunks
                        yield f"data: {{'type': 'text', 'content': {json.dumps(chunk)}}}\n\n"
                
            else:
                # Regular text streaming for other responses
                for chunk in async_loop.run_until_complete(
                    llm_service.stream_response(
                        response_data['prompt'],
                        mode=stream_mode,
                        system_message=response_data.get('system_message')
                    )
                ):
                    if stream_mode == StreamMode.TEXT:
                        yield f"data: {{'type': 'text', 'content': {json.dumps(chunk)}}}\n\n"
                    else:
                        yield f"data: {chunk}\n\n"
            
            # Final message
            yield f"data: {{'type': 'end'}}\n\n"
            
            # Prepare message for storing in chat history
            final_message = "[Streamed response]"
            if response_data['type'] == 'medical_question':
                final_message = "[Evidence-based answer with sources]"
            elif response_data['type'] == 'general_question':
                final_message = "[Response to general question]"
            
            # Store in chat history
            chat_history.store_message(
                consultation_id=consultation_id,
                sender="ai",
                message=final_message,
                section=response_data['current_section']
            )
        
        return Response(stream_with_context(generate()), mimetype='text/event-stream')
    
    # Fallback
    return jsonify(response_data)

@app.route('/api/summary', methods=['GET'])
def get_summary():
    """Get summary for a consultation"""
    consultation_id = request.args.get('consultation_id')
    
    if not consultation_id:
        return jsonify({"error": "Consultation ID is required"}), 400
    
    try:
        # Get consultation
        consultation = consultation_manager.get_consultation(consultation_id)
        if not consultation:
            return jsonify({"error": "Consultation not found"}), 404
        
        # Get summary data
        summary = consultation_manager.get_consultation_summary(consultation_id)
        
        # If no summary exists, generate it from section data
        if not summary:
            # Check if consultation is complete
            if consultation['current_section'] != 'complete':
                return jsonify({"error": "Consultation is not complete"}), 400
            
            # Generate summary from section data
            all_section_data = consultation_manager.get_all_section_data(consultation_id)
            summary = consultation_manager.store_consultation_summary(consultation_id, all_section_data)
        
        return jsonify(summary)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate-pdf', methods=['GET'])
def generate_pdf():
    """Generate and download PDF for a consultation"""
    consultation_id = request.args.get('consultation_id')
    
    if not consultation_id:
        return jsonify({"error": "Consultation ID is required"}), 400
    
    try:
        # Get consultation
        consultation = consultation_manager.get_consultation(consultation_id)
        if not consultation:
            return jsonify({"error": "Consultation not found"}), 404
        
        # Get patient data
        patient_id = consultation['patient_id']
        patient = patient_manager.get_patient(patient_id)
        if not patient:
            return jsonify({"error": "Patient not found"}), 404
        
        # Get summary data
        summary = consultation_manager.get_consultation_summary(consultation_id)
        
        # If no summary exists, generate it from section data
        if not summary:
            # Check if consultation is complete
            if consultation['current_section'] != 'complete':
                return jsonify({"error": "Consultation is not complete"}), 400
            
            # Generate summary from section data
            all_section_data = consultation_manager.get_all_section_data(consultation_id)
            summary_data = all_section_data
        else:
            summary_data = summary['summary_data']
        
        # Add provider info to patient data
        patient['provider'] = consultation.get('provider_id', 'Unknown Provider')
        
        # Generate PDF
        pdf_content = document_generator.generate_pdf(summary_data, patient)
        
        # Return PDF for download
        return Response(
            pdf_content,
            mimetype='application/pdf',
            headers={
                'Content-Disposition': f'attachment; filename=patient_summary_{consultation_id}.pdf'
            }
        )
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)