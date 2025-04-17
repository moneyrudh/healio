// components/summary/SummaryView.tsx
import React from 'react';
import { ConsultationSummary, Patient, Provider, ConsultationSection } from '../../types';
import { Button, Spinner, EmptyState } from '../shared';
import { DocumentArrowDownIcon, DocumentTextIcon, LockClosedIcon } from '@heroicons/react/24/outline';

interface SummaryViewProps {
  summary: ConsultationSummary | null;
  patient: Patient | null;
  provider: Provider | null;
  isComplete: boolean;
  isLoading: boolean;
  onDownload: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

// Helper function to format date
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
};

export const SummaryView: React.FC<SummaryViewProps> = ({
  summary,
  patient,
  provider,
  isComplete,
  isLoading,
  onDownload,
  onRefresh
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <Spinner size="lg" className="mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">Loading summary...</p>
        </div>
      </div>
    );
  }

  if (!isComplete) {
    return (
      <EmptyState
        title="Consultation In Progress"
        description="Complete all sections of the consultation to generate a summary."
        icon={<LockClosedIcon className="h-12 w-12" />}
      />
    );
  }

  if (!summary) {
    return (
      <EmptyState
        title="Summary Not Available"
        description="The summary for this consultation is not available yet."
        icon={<DocumentTextIcon className="h-12 w-12" />}
        action={
          <Button 
            onClick={onRefresh} 
            variant="primary"
            icon={<DocumentTextIcon className="h-5 w-5" />}
          >
            Generate Summary
          </Button>
        }
      />
    );
  }

  const summaryData = summary.summary_data;

  // Function to render different section formats
  const renderSection = (sectionKey: string, sectionData: any) => {
    if (!sectionData) return null;

    const format = sectionData.format;

    switch (format) {
      case 'paragraph':
        return (
          <div className="whitespace-pre-wrap">
            {sectionData.content}
          </div>
        );
      case 'bullet':
        return (
          <ul className="list-disc pl-5 space-y-1">
            {sectionData.items?.map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        );
      case 'numbered_bullet':
        return (
          <ol className="list-decimal pl-5 space-y-1">
            {sectionData.items?.map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ol>
        );
      default:
        // For unknown formats, try to render content sensibly
        if (sectionData.content) {
          return <div>{sectionData.content}</div>;
        } else if (sectionData.items) {
          return (
            <ul className="list-disc pl-5 space-y-1">
              {sectionData.items.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          );
        } else {
          return <pre>{JSON.stringify(sectionData, null, 2)}</pre>;
        }
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md max-w-4xl mx-auto my-6">
      {/* Header with download button */}
      <div className="bg-primary-50 dark:bg-primary-900/30 px-8 py-6 rounded-t-xl border-b border-primary-100 dark:border-primary-800 flex justify-between items-center">
        <h2 className="text-2xl font-light text-primary-800 dark:text-primary-200">
          Medical Record
        </h2>
        <Button
          onClick={onDownload}
          icon={<DocumentArrowDownIcon className="h-5 w-5" />}
        >
          Download PDF
        </Button>
      </div>

      {/* Patient information header */}
      <div className="border-b border-neutral-200 dark:border-neutral-700 px-8 py-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Patient Name</p>
            <p className="text-lg text-neutral-900 dark:text-white">{patient?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Date</p>
            <p className="text-lg text-neutral-900 dark:text-white">
              {formatDate(new Date().toISOString())}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Date of Birth</p>
            <p className="text-lg text-neutral-900 dark:text-white">
              {patient?.dob ? formatDate(patient.dob) : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">MRN</p>
            <p className="text-lg text-neutral-900 dark:text-white">{patient?.medical_record_number || 'N/A'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Provider</p>
            <p className="text-lg text-neutral-900 dark:text-white">{provider?.name || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Summary content */}
      <div className="px-8 py-6 space-y-8">
        {/* Chief Complaint */}
        {summaryData.chief_complaint && (
          <div>
            <h3 className="text-xl font-medium text-neutral-900 dark:text-white mb-3">
              Chief Complaint
            </h3>
            <div className="text-neutral-800 dark:text-neutral-200">
              {renderSection('chief_complaint', summaryData.chief_complaint)}
            </div>
          </div>
        )}

        {/* History */}
        {summaryData.history && (
          <div>
            <h3 className="text-xl font-medium text-neutral-900 dark:text-white mb-3">
              History of Present Illness
            </h3>
            <div className="text-neutral-800 dark:text-neutral-200">
              {renderSection('history', summaryData.history)}
            </div>
          </div>
        )}

        {/* Subjective */}
        {summaryData.subjective && (
          <div>
            <h3 className="text-xl font-medium text-neutral-900 dark:text-white mb-3">
              Subjective
            </h3>
            <div className="text-neutral-800 dark:text-neutral-200">
              {renderSection('subjective', summaryData.subjective)}
            </div>
          </div>
        )}

        {/* Vital Signs */}
        {summaryData.vital_signs && (
          <div>
            <h3 className="text-xl font-medium text-neutral-900 dark:text-white mb-3">
              Vital Signs
            </h3>
            <div className="text-neutral-800 dark:text-neutral-200">
              {renderSection('vital_signs', summaryData.vital_signs)}
            </div>
          </div>
        )}

        {/* Physical */}
        {summaryData.physical && (
          <div>
            <h3 className="text-xl font-medium text-neutral-900 dark:text-white mb-3">
              Physical Examination
            </h3>
            <div className="text-neutral-800 dark:text-neutral-200">
              {renderSection('physical', summaryData.physical)}
            </div>
          </div>
        )}

        {/* Objective */}
        {summaryData.objective && (
          <div>
            <h3 className="text-xl font-medium text-neutral-900 dark:text-white mb-3">
              Objective
            </h3>
            <div className="text-neutral-800 dark:text-neutral-200">
              {renderSection('objective', summaryData.objective)}
            </div>
          </div>
        )}

        {/* Assessment */}
        {summaryData.assessment && (
          <div>
            <h3 className="text-xl font-medium text-neutral-900 dark:text-white mb-3">
              Assessment
            </h3>
            <div className="text-neutral-800 dark:text-neutral-200">
              {renderSection('assessment', summaryData.assessment)}
            </div>
          </div>
        )}

        {/* Plan */}
        {summaryData.plan && (
          <div>
            <h3 className="text-xl font-medium text-neutral-900 dark:text-white mb-3">
              Plan
            </h3>
            <div className="text-neutral-800 dark:text-neutral-200">
              {renderSection('plan', summaryData.plan)}
            </div>
          </div>
        )}

        {/* Medications */}
        {summaryData.medications && (
          <div>
            <h3 className="text-xl font-medium text-neutral-900 dark:text-white mb-3">
              Medications
            </h3>
            <div className="text-neutral-800 dark:text-neutral-200">
              {renderSection('medications', summaryData.medications)}
            </div>
          </div>
        )}

        {/* Notes */}
        {summaryData.notes && (
          <div>
            <h3 className="text-xl font-medium text-neutral-900 dark:text-white mb-3">
              Additional Notes
            </h3>
            <div className="text-neutral-800 dark:text-neutral-200">
              {renderSection('notes', summaryData.notes)}
            </div>
          </div>
        )}
      </div>

      {/* Footer with download button again */}
      <div className="border-t border-neutral-200 dark:border-neutral-700 px-8 py-6 rounded-b-xl flex justify-center">
        <Button
          onClick={onDownload}
          icon={<DocumentArrowDownIcon className="h-5 w-5" />}
          size="lg"
        >
          Download PDF Report
        </Button>
      </div>
    </div>
  );
};

export default SummaryView;