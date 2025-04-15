import json
import re
from datetime import datetime

def generate_latex_from_template(summary_data, patient_data):
    """
    Generate LaTeX document from structured summary data and patient information
    
    Args:
        summary_data (dict): The structured summary data with all consultation sections
        patient_data (dict): Patient information including name, DOB, MRN, etc.
    
    Returns:
        str: Generated LaTeX document content
    """
    # Load the LaTeX template
    with open('medical_record_template.tex', 'r') as file:
        template = file.read()
    
    # Format patient header data
    patient_name = patient_data.get('name', '[PATIENT NAME]')
    date = datetime.now().strftime('%B %d, %Y')
    dob = patient_data.get('dob', '[DOB]')
    mrn = patient_data.get('medical_record_number', '[MRN]')
    provider = patient_data.get('provider', '[PROVIDER]')
    
    # Replace patient header placeholders
    template = template.replace('[PATIENT_NAME]', patient_name)
    template = template.replace('[DATE]', date)
    template = template.replace('[DOB]', dob)
    template = template.replace('[MRN]', mrn)
    template = template.replace('[PROVIDER]', provider)
    
    # Helper function to escape LaTeX special characters
    def escape_latex(text):
        if not text:
            return ""
        # Replace LaTeX special characters
        replacements = {
            '&': r'\&',
            '%': r'\%',
            '$': r'\$',
            '#': r'\#',
            '_': r'\_',
            '{': r'\{',
            '}': r'\}',
            '~': r'\textasciitilde{}',
            '^': r'\^{}',
            '\\': r'\textbackslash{}',
        }
        for char, replacement in replacements.items():
            text = text.replace(char, replacement)
        return text
    
    # Process each section based on its format
    
    # Chief Complaint (numbered bullets)
    chief_complaint_items = ""
    if 'chief_complaint' in summary_data and summary_data['chief_complaint']['format'] == 'numbered_bullet':
        for item in summary_data['chief_complaint']['items']:
            chief_complaint_items += f"  \\numberedItem{{{escape_latex(item)}}}\n"
    template = template.replace('[CHIEF_COMPLAINT_ITEMS]', chief_complaint_items)
    
    # History (paragraph)
    history_content = ""
    if 'history' in summary_data and summary_data['history']['format'] == 'paragraph':
        history_content = escape_latex(summary_data['history']['content'])
    template = template.replace('[HISTORY_CONTENT]', history_content)
    
    # Subjective (paragraph)
    subjective_content = ""
    if 'subjective' in summary_data and summary_data['subjective']['format'] == 'paragraph':
        subjective_content = escape_latex(summary_data['subjective']['content'])
    template = template.replace('[SUBJECTIVE_CONTENT]', subjective_content)
    
    # Vital Signs (bullet points)
    vital_signs_items = ""
    if 'vital_signs' in summary_data and summary_data['vital_signs']['format'] == 'bullet':
        for item in summary_data['vital_signs']['items']:
            vital_signs_items += f"  \\bulletItem{{{escape_latex(item)}}}\n"
    template = template.replace('[VITAL_SIGNS_ITEMS]', vital_signs_items)
    
    # Physical (bullet points)
    physical_items = ""
    if 'physical' in summary_data and summary_data['physical']['format'] == 'bullet':
        for item in summary_data['physical']['items']:
            physical_items += f"  \\bulletItem{{{escape_latex(item)}}}\n"
    template = template.replace('[PHYSICAL_ITEMS]', physical_items)
    
    # Objective (bullet points)
    objective_items = ""
    if 'objective' in summary_data and summary_data['objective']['format'] == 'bullet':
        for item in summary_data['objective']['items']:
            objective_items += f"  \\bulletItem{{{escape_latex(item)}}}\n"
    template = template.replace('[OBJECTIVE_ITEMS]', objective_items)
    
    # Assessment (numbered bullets)
    assessment_items = ""
    if 'assessment' in summary_data and summary_data['assessment']['format'] == 'numbered_bullet':
        for item in summary_data['assessment']['items']:
            assessment_items += f"  \\numberedItem{{{escape_latex(item)}}}\n"
    template = template.replace('[ASSESSMENT_ITEMS]', assessment_items)
    
    # Plan (numbered bullets)
    plan_items = ""
    if 'plan' in summary_data and summary_data['plan']['format'] == 'numbered_bullet':
        for item in summary_data['plan']['items']:
            plan_items += f"  \\numberedItem{{{escape_latex(item)}}}\n"
    template = template.replace('[PLAN_ITEMS]', plan_items)
    
    # Medications (numbered bullets)
    medications_items = ""
    if 'medications' in summary_data and summary_data['medications']['format'] == 'numbered_bullet':
        for item in summary_data['medications']['items']:
            medications_items += f"  \\numberedItem{{{escape_latex(item)}}}\n"
    template = template.replace('[MEDICATIONS_ITEMS]', medications_items)
    
    # Notes (paragraph)
    notes_content = ""
    if 'notes' in summary_data and summary_data['notes']['format'] == 'paragraph':
        notes_content = escape_latex(summary_data['notes']['content'])
    template = template.replace('[NOTES_CONTENT]', notes_content)
    
    return template

# Example usage
if __name__ == "__main__":
    # Sample data
    summary_data = {
        "chief_complaint": {
            "format": "numbered_bullet",
            "items": ["Progressive dyspnea on exertion.", "Intermittent chest pain.", "Palpitations."]
        },
        "history": {
            "format": "paragraph",
            "content": "Mr. John Doe, a 52-year-old male, presents with a three-month history of progressive dyspnea on exertion and intermittent chest pain..."
        },
        # Add other sections as per the JSON schema
        "subjective": {"format": "paragraph", "content": "Mr. Doe reports progressive shortness of breath..."},
        "vital_signs": {"format": "bullet", "items": ["Blood pressure: 140/90 mmHg", "Pulse: 76 beats per minute"]},
        "physical": {"format": "bullet", "items": ["Patient appears well-nourished and in no acute distress."]},
        "objective": {"format": "bullet", "items": ["Blood pressure measured at 140/90 mmHg."]},
        "assessment": {"format": "numbered_bullet", "items": ["Stable angina pectoris."]},
        "plan": {"format": "numbered_bullet", "items": ["Stress echocardiogram to evaluate for myocardial ischemia."]},
        "medications": {"format": "numbered_bullet", "items": ["Atorvastatin 20 mg daily for cholesterol management."]},
        "notes": {"format": "paragraph", "content": "Mr. Doe is advised to maintain a heart-healthy lifestyle..."}
    }
    
    patient_data = {
        "name": "John Doe",
        "dob": "Jan 15, 1973",
        "medical_record_number": "MRN-12345678",
        "provider": "Dr. Sarah Johnson"
    }
    
    # Generate LaTeX
    latex_content = generate_latex_from_template(summary_data, patient_data)
    
    # Write to file
    with open('generated_medical_record.tex', 'w') as file:
        file.write(latex_content)
    
    print("LaTeX document generated successfully as 'generated_medical_record.tex'")