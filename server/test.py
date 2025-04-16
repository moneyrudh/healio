#!/usr/bin/env python3

import requests
import json
import time
import os
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5001/api"
OUTPUT_DIR = "output"

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Helper functions
def print_separator():
    print("\n" + "="*80 + "\n")

def print_ai_message(message):
    print(f"\033[94mAI:\033[0m {message}")

def print_doctor_message(message):
    print(f"\033[92mDoctor:\033[0m {message}")

def get_user_input(prompt):
    return input(f"\033[93m{prompt}\033[0m ")

# Main simulation script
def run_consultation_simulation():
    print_separator()
    print("HEALIO CONSULTATION SIMULATION")
    print_separator()
    
    # Step 1: Create a patient
    print("PATIENT CREATION")
    patient_name = get_user_input("Enter patient name: ")
    
    # Validate date format
    while True:
        patient_dob = get_user_input("Enter patient date of birth (YYYY-MM-DD): ")
        try:
            datetime.strptime(patient_dob, "%Y-%m-%d")
            break
        except ValueError:
            print("Invalid date format. Please use YYYY-MM-DD format.")
    
    print(f"\nCreating patient: {patient_name}, DOB: {patient_dob}")
    
    try:
        patient_response = requests.post(f"{BASE_URL}/patients", json={
            "name": patient_name,
            "dob": patient_dob
        })
        patient_data = patient_response.json()
        patient_id = patient_data["id"]
        print(f"Patient created successfully with ID: {patient_id}")
        print(f"Medical Record Number: {patient_data['medical_record_number']}")
    except Exception as e:
        print(f"Error creating patient: {e}")
        return
    
    print_separator()
    
    # Step 2: Create a consultation session
    print("CONSULTATION SESSION CREATION")
    provider_id = get_user_input("Enter provider ID (or press Enter for default): ") or "doctor-001"
    
    try:
        consultation_response = requests.post(f"{BASE_URL}/consultations", json={
            "patient_id": patient_id,
            "provider_id": provider_id
        })
        consultation_data = consultation_response.json()
        consultation_id = consultation_data["consultation"]["id"]
        print(f"Consultation created successfully with ID: {consultation_id}")
        
        # Display initial AI message
        initial_message = consultation_data["initial_message"]
        print_ai_message(initial_message)
    except Exception as e:
        print(f"Error creating consultation: {e}")
        return
    
    print_separator()
    
    # Step 3: Simulate the consultation flow through all sections
    current_section = "chief_complaint"
    conversation_log = []
    
    # Define section descriptions for better user guidance
    section_guides = {
        "chief_complaint": "Enter the patient's main health concern(s)",
        "history": "Enter the patient's history of present illness",
        "subjective": "Enter subjective information reported by the patient",
        "vital_signs": "Enter the patient's vital signs (BP, pulse, etc.)",
        "physical": "Enter findings from physical examination",
        "objective": "Enter objective test results or measurements",
        "assessment": "Enter your assessment/diagnosis of the patient's condition",
        "plan": "Enter your treatment plan",
        "doubts": "Enter any medical questions you have about this case",
        "medications": "Enter medications you're prescribing",
        "notes": "Enter any additional notes about the case"
    }
    
    # This will simulate the entire consultation flow
    while current_section != "complete":
        print(f"CURRENT SECTION: {current_section.upper()}")
        
        if current_section in section_guides:
            print(f"Guidance: {section_guides[current_section]}")
        
        # For demonstration, provide sample responses for each section
        sample_responses = {
            "chief_complaint": ["Severe headache for the past 3 days", "Also experiencing nausea"],
            "history": ["Patient reports throbbing pain in the right side of head", "Pain is worse with movement and light"],
            "subjective": ["Patient rates pain as 8/10", "Reports difficulty sleeping due to pain"],
            "vital_signs": ["BP 140/90 mmHg", "Pulse 88 bpm", "Temp 98.6 F"],
            "physical": ["No visible head trauma", "Pupils equal and reactive to light"],
            "objective": ["CT scan negative for hemorrhage", "Blood tests within normal limits"],
            "assessment": ["Migraine with aura", "Possible tension component"],
            "plan": ["Sumatriptan 50mg PRN for acute episodes", "Follow-up in 2 weeks"],
            "doubts": ["What's the latest evidence on preventive treatment for chronic migraine?", "Is there a correlation between this type of migraine and sleep disorders?"],
            "medications": ["Sumatriptan 50mg", "Acetaminophen 500mg PRN"],
            "notes": ["Patient education provided on migraine triggers", "Lifestyle modifications discussed"]
        }
        
        # If we have sample responses for this section, show them as examples
        if current_section in sample_responses:
            print("\nSample responses for this section:")
            for i, sample in enumerate(sample_responses[current_section], 1):
                print(f"  {i}. {sample}")
        
        # Process the section with multiple messages before completing
        section_complete = False
        while not section_complete:
            # Get doctor's message
            print("\nOptions:")
            print("  - Enter your text for this section")
            print("  - Type 'next' to complete this section and move to the next")
            print("  - Type 'sample X' to use sample response X (if available)")
            
            doctor_input = get_user_input("\nYour input: ")
            
            # Check if user wants to use a sample response
            if doctor_input.lower().startswith("sample ") and current_section in sample_responses:
                try:
                    sample_num = int(doctor_input.split()[1]) - 1
                    if 0 <= sample_num < len(sample_responses[current_section]):
                        doctor_input = sample_responses[current_section][sample_num]
                        print_doctor_message(doctor_input)
                    else:
                        print("Invalid sample number. Please try again.")
                        continue
                except (ValueError, IndexError):
                    print("Invalid sample format. Please try again.")
                    continue
            
            # Check if user wants to complete the section
            if doctor_input.lower() == "next":
                doctor_input = "next section"
                print_doctor_message(doctor_input)
                section_complete = True
            else:
                print_doctor_message(doctor_input)
            
            # Send message to API
            try:
                chat_response = requests.post(f"{BASE_URL}/chat", json={
                    "consultation_id": consultation_id,
                    "message": doctor_input
                })
                
                response_data = chat_response.json()
                conversation_log.append({"sender": "doctor", "message": doctor_input})
                
                # Handle section transition
                if response_data.get("type") == "section_transition":
                    print_ai_message(response_data["message"])
                    conversation_log.append({"sender": "ai", "message": response_data["message"]})
                    
                    # Update current section
                    current_section = response_data["current_section"]
                    section_complete = True
                    print_separator()
                    break
                
                # Handle follow-up in the same section
                elif response_data.get("type") == "follow_up":
                    print_ai_message(response_data["message"])
                    conversation_log.append({"sender": "ai", "message": response_data["message"]})
                
                # Special handling for the DOUBTS section - it might return streaming data
                # In a real command-line client, you'd handle the streaming response
                # For simplicity, we just show a placeholder message
                elif response_data.get("type") == "medical_question":
                    print_ai_message("(Streaming response for medical question... In a real client, this would show evidence-based information.)")
                    conversation_log.append({"sender": "ai", "message": "(Medical information response)"})
                
                else:
                    # Generic response handling
                    message = response_data.get("message", "Response received.")
                    print_ai_message(message)
                    conversation_log.append({"sender": "ai", "message": message})
                
            except Exception as e:
                print(f"Error sending message: {e}")
                continue
    
    print("CONSULTATION COMPLETED")
    print_separator()
    
    # Step 4: Generate summary
    print("GENERATING SUMMARY...")
    try:
        summary_response = requests.get(f"{BASE_URL}/summary?consultation_id={consultation_id}")
        summary_data = summary_response.json()
        
        print("Summary generated successfully!")
        print("\nSummary Data Preview:")
        # Print just a few sections as preview
        for section in ["chief_complaint", "assessment", "plan"]:
            if section in summary_data["summary_data"]:
                print(f"\n{section.upper()}:")
                section_data = summary_data["summary_data"][section]
                if "items" in section_data:
                    for idx, item in enumerate(section_data["items"], 1):
                        print(f"  {idx}. {item}")
                elif "content" in section_data:
                    print(f"  {section_data['content']}")
    except Exception as e:
        print(f"Error generating summary: {e}")
    
    # Step 5: Generate PDF
    print_separator()
    print("GENERATING PDF...")
    try:
        pdf_response = requests.get(
            f"{BASE_URL}/generate-pdf?consultation_id={consultation_id}", 
            stream=True
        )
        
        if pdf_response.status_code == 200:
            # Generate filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            pdf_filename = os.path.join(OUTPUT_DIR, f"consultation_{consultation_id}_{timestamp}.pdf")
            
            # Save the PDF
            with open(pdf_filename, "wb") as f:
                for chunk in pdf_response.iter_content(chunk_size=1024):
                    f.write(chunk)
            
            print(f"PDF generated successfully and saved to: {pdf_filename}")
        else:
            print(f"Error generating PDF. Status code: {pdf_response.status_code}")
            print(f"Response: {pdf_response.text}")
    except Exception as e:
        print(f"Error generating PDF: {e}")
    
    print_separator()
    print("CONSULTATION SIMULATION COMPLETE")
    print(f"Patient ID: {patient_id}")
    print(f"Consultation ID: {consultation_id}")
    print_separator()

# Run the simulation
if __name__ == "__main__":
    run_consultation_simulation()