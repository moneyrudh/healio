# services/document_generator.py
import os
import tempfile
import subprocess
import json
from datetime import datetime

class DocumentGenerator:
    """Service for generating documents from consultation data"""
    
    def __init__(self):
        # Path to the LaTeX template
        self.template_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'medical_record_template.tex')
        
        # Ensure template exists
        if not os.path.exists(self.template_path):
            raise FileNotFoundError(f"LaTeX template not found at {self.template_path}")
    
    def generate_pdf(self, summary_data, patient_data):
        """
        Generate PDF from structured summary data and patient information
        
        Args:
            summary_data (dict): The structured summary data with all consultation sections
            patient_data (dict): Patient information including name, DOB, MRN, etc.
            
        Returns:
            bytes: Generated PDF content
        """
        # First generate LaTeX
        latex_content = self.generate_latex(summary_data, patient_data)
        
        # Create a temporary directory for LaTeX processing
        with tempfile.TemporaryDirectory() as temp_dir:
            # Write LaTeX content to file
            tex_file_path = os.path.join(temp_dir, 'medical_record.tex')
            with open(tex_file_path, 'w') as file:
                file.write(latex_content)
            
            # Run pdflatex to generate PDF
            try:
                subprocess.run(
                    ['pdflatex', '-interaction=nonstopmode', tex_file_path],
                    cwd=temp_dir,
                    check=True,
                    capture_output=True
                )
                
                # Read generated PDF
                pdf_file_path = os.path.join(temp_dir, 'medical_record.pdf')
                with open(pdf_file_path, 'rb') as file:
                    pdf_content = file.read()
                
                return pdf_content
                
            except subprocess.CalledProcessError as e:
                # Log error and raise
                print(f"Error generating PDF: {e.stdout.decode('utf-8')}")
                print(f"LaTeX error: {e.stderr.decode('utf-8')}")
                raise Exception(f"Failed to generate PDF: {str(e)}")
    
    def generate_latex(self, summary_data, patient_data):
        """
        Generate LaTeX document from structured summary data and patient information
        
        Args:
            summary_data (dict): The structured summary data with all consultation sections
            patient_data (dict): Patient information including name, DOB, MRN, etc.
            
        Returns:
            str: Generated LaTeX document content
        """
        # Load the template
        with open(self.template_path, 'r') as file:
            template = file.read()
        
        # Format patient header data
        patient_name = patient_data.get('name', '[PATIENT NAME]')
        date = datetime.now().strftime('%B %d, %Y')
        dob = patient_data.get('dob', '[DOB]')
        mrn = patient_data.get('medical_record_number', '[MRN]')
        provider = patient_data.get('provider', '[PROVIDER]')
        
        # Replace patient header placeholders
        template = template.replace('[PATIENT_NAME]', self._escape_latex(patient_name))
        template = template.replace('[DATE]', self._escape_latex(date))
        template = template.replace('[DOB]', self._escape_latex(dob))
        template = template.replace('[MRN]', self._escape_latex(mrn))
        template = template.replace('[PROVIDER]', self._escape_latex(provider))
        
        # Process each section based on its format
        
        # Chief Complaint (numbered bullets)
        chief_complaint_items = ""
        if 'chief_complaint' in summary_data and summary_data['chief_complaint'].get('format') == 'numbered_bullet':
            for item in summary_data['chief_complaint']['items']:
                chief_complaint_items += f"  \\numberedItem{{{self._escape_latex(item)}}}\n"
        template = template.replace('[CHIEF_COMPLAINT_ITEMS]', chief_complaint_items)
        
        # History (paragraph)
        history_content = ""
        if 'history' in summary_data and summary_data['history'].get('format') == 'paragraph':
            history_content = self._escape_latex(summary_data['history']['content'])
        template = template.replace('[HISTORY_CONTENT]', history_content)
        
        # Subjective (paragraph)
        subjective_content = ""
        if 'subjective' in summary_data and summary_data['subjective'].get('format') == 'paragraph':
            subjective_content = self._escape_latex(summary_data['subjective']['content'])
        template = template.replace('[SUBJECTIVE_CONTENT]', subjective_content)
        
        # Vital Signs (bullet points)
        vital_signs_items = ""
        if 'vital_signs' in summary_data and summary_data['vital_signs'].get('format') == 'bullet':
            for item in summary_data['vital_signs']['items']:
                vital_signs_items += f"  \\bulletItem{{{self._escape_latex(item)}}}\n"
        template = template.replace('[VITAL_SIGNS_ITEMS]', vital_signs_items)
        
        # Physical (bullet points)
        physical_items = ""
        if 'physical' in summary_data and summary_data['physical'].get('format') == 'bullet':
            for item in summary_data['physical']['items']:
                physical_items += f"  \\bulletItem{{{self._escape_latex(item)}}}\n"
        template = template.replace('[PHYSICAL_ITEMS]', physical_items)
        
        # Objective (bullet points)
        objective_items = ""
        if 'objective' in summary_data and summary_data['objective'].get('format') == 'bullet':
            for item in summary_data['objective']['items']:
                objective_items += f"  \\bulletItem{{{self._escape_latex(item)}}}\n"
        template = template.replace('[OBJECTIVE_ITEMS]', objective_items)
        
        # Assessment (numbered bullets)
        assessment_items = ""
        if 'assessment' in summary_data and summary_data['assessment'].get('format') == 'numbered_bullet':
            for item in summary_data['assessment']['items']:
                assessment_items += f"  \\numberedItem{{{self._escape_latex(item)}}}\n"
        template = template.replace('[ASSESSMENT_ITEMS]', assessment_items)
        
        # Plan (numbered bullets)
        plan_items = ""
        if 'plan' in summary_data and summary_data['plan'].get('format') == 'numbered_bullet':
            for item in summary_data['plan']['items']:
                plan_items += f"  \\numberedItem{{{self._escape_latex(item)}}}\n"
        template = template.replace('[PLAN_ITEMS]', plan_items)
        
        # Medications (numbered bullets)
        medications_items = ""
        if 'medications' in summary_data and summary_data['medications'].get('format') == 'numbered_bullet':
            for item in summary_data['medications']['items']:
                medications_items += f"  \\numberedItem{{{self._escape_latex(item)}}}\n"
        template = template.replace('[MEDICATIONS_ITEMS]', medications_items)
        
        # Notes (paragraph)
        notes_content = ""
        if 'notes' in summary_data and summary_data['notes'].get('format') == 'paragraph':
            notes_content = self._escape_latex(summary_data['notes']['content'])
        template = template.replace('[NOTES_CONTENT]', notes_content)
        
        return template
    
    def _escape_latex(self, text):
        """
        Escape LaTeX special characters in text
        
        Args:
            text: Text to escape
            
        Returns:
            Escaped text
        """
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