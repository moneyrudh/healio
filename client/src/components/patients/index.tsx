// components/patients/index.tsx
import React, { useState, useEffect } from 'react';
import { UserIcon, CheckCircleIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { Patient, NewPatientFormData } from '../../types';
import * as api from '../../api';
import { Spinner, Button, Modal, Alert } from '../shared';

// Patient Card component
interface PatientCardProps {
  patient: Patient;
  isSelected: boolean;
  onClick: () => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({ 
  patient, 
  isSelected, 
  onClick 
}) => {
  // Format patient date of birth
  const formatDOB = (dob: string) => {
    try {
      const date = new Date(dob);
      return date.toLocaleDateString();
    } catch (e) {
      return dob;
    }
  };

  // Calculate age from DOB
  const calculateAge = (dob: string) => {
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch (e) {
      return '';
    }
  };

  return (
    <div 
      className={`
        relative overflow-hidden rounded-xl p-4 
        ${isSelected 
          ? 'bg-primary-50 border-2 border-primary-500 dark:bg-primary-900/30 dark:border-primary-500' 
          : 'bg-white border border-neutral-200 hover:border-primary-200 dark:bg-neutral-800 dark:border-neutral-700 dark:hover:border-primary-700'
        }
        cursor-pointer transition-all duration-200 h-full
      `}
      onClick={onClick}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 text-primary-500">
          <CheckCircleIcon className="h-6 w-6" />
        </div>
      )}
      
      <div className="flex items-start">
        {/* Patient avatar/icon */}
        <div className={`
          h-12 w-12 rounded-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-700 mr-4
          ${isSelected ? 'ring-2 ring-primary-500' : ''}
        `}>
          <UserIcon className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />
        </div>
        
        {/* Patient details */}
        <div>
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white">
            {patient.name}
          </h3>
          <div className="text-sm text-neutral-500 dark:text-neutral-400 space-y-1">
            <p>DOB: {formatDOB(patient.dob)} ({calculateAge(patient.dob)} y/o)</p>
            <p>MRN: {patient.medical_record_number}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add Patient Modal component
interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientAdded: (patient: Patient) => void;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({
  isOpen,
  onClose,
  onPatientAdded
}) => {
  const [formData, setFormData] = useState<NewPatientFormData>({
    name: '',
    dob: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Simple validation
    if (!formData.name.trim()) {
      setError('Patient name is required');
      return;
    }
    
    if (!formData.dob) {
      setError('Date of birth is required');
      return;
    }
    
    try {
      setIsLoading(true);
      const newPatient = await api.createPatient(formData);
      setSuccess(true);
      onPatientAdded(newPatient);
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({ name: '', dob: '' });
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error creating patient:', err);
      setError(err instanceof Error ? err.message : 'Failed to create patient');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Patient">
      {success ? (
        <div className="py-4">
          <Alert type="success" title="Success">
            Patient added successfully!
          </Alert>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert type="error" className="mb-4">
              {error}
            </Alert>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 py-2 px-3 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter patient's full name"
              />
            </div>
            
            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                id="dob"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 py-2 px-3 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
              Add Patient
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

// Patient Selector component
interface PatientSelectorProps {
  onSelect: (patient: Patient) => void;
  selectedPatient: Patient | null;
}

export const PatientSelector: React.FC<PatientSelectorProps> = ({ 
  onSelect, 
  selectedPatient 
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const data = await api.getPatients();
      setPatients(data);
      setError(null);
    } catch (err) {
      console.error('Error loading patients:', err);
      setError('Unable to load patients. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handlePatientAdded = (newPatient: Patient) => {
    setPatients(prev => [...prev, newPatient]);
    onSelect(newPatient);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
        <p className="text-red-800 dark:text-red-300">{error}</p>
        <button 
          className="mt-2 text-red-600 dark:text-red-400 underline" 
          onClick={loadPatients}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-light text-neutral-800 dark:text-neutral-200">
          Select a Patient
        </h2>
        
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          icon={<PlusCircleIcon className="h-5 w-5" />}
        >
          Add Patient
        </Button>
      </div>
      
      {patients.length === 0 ? (
        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-8 text-center">
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            No patients found. Add a new patient to continue.
          </p>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            icon={<PlusCircleIcon className="h-5 w-5" />}
          >
            Add Patient
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              isSelected={selectedPatient?.id === patient.id}
              onClick={() => onSelect(patient)}
            />
          ))}
        </div>
      )}
      
      <AddPatientModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPatientAdded={handlePatientAdded}
      />
    </div>
  );
};