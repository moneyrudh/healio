// components/sections/SectionProgress.tsx
import React from 'react';
import { ConsultationSection } from '../../types';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

// Map sections to display names
const sectionDisplayNames: Record<string, string> = {
  [ConsultationSection.CHIEF_COMPLAINT]: 'Chief Complaint',
  [ConsultationSection.HISTORY]: 'History',
  [ConsultationSection.SUBJECTIVE]: 'Subjective',
  [ConsultationSection.VITAL_SIGNS]: 'Vital Signs',
  [ConsultationSection.PHYSICAL]: 'Physical',
  [ConsultationSection.OBJECTIVE]: 'Objective',
  [ConsultationSection.ASSESSMENT]: 'Assessment',
  [ConsultationSection.PLAN]: 'Plan',
  [ConsultationSection.DOUBTS]: 'Doubts',
  [ConsultationSection.MEDICATIONS]: 'Medications',
  [ConsultationSection.NOTES]: 'Notes',
  [ConsultationSection.COMPLETE]: 'Complete'
};

interface SectionProgressProps {
  currentSection: ConsultationSection | string;
  className?: string;
}

export const SectionProgress: React.FC<SectionProgressProps> = ({
  currentSection,
  className = ''
}) => {
  // Get ordered list of sections
  const orderedSections = Object.values(ConsultationSection).filter(
    section => section !== ConsultationSection.COMPLETE
  );
  
  // Determine current section index
  const currentSectionIndex = orderedSections.findIndex(
    section => section === currentSection
  );

  return (
    <div className={`${className}`}>
      <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-200 mb-4">
        Consultation Progress
      </h3>
      
      <div className="space-y-3">
        {orderedSections.map((section, index) => {
          // Determine section status
          const isCompleted = index < currentSectionIndex;
          const isCurrent = index === currentSectionIndex;
          const isPending = index > currentSectionIndex;
          
          // Status styling
          let statusClasses = '';
          
          if (isCompleted) {
            statusClasses = 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
          } else if (isCurrent) {
            statusClasses = 'bg-primary-100 text-primary-800 border-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-800';
          } else {
            statusClasses = 'bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700';
          }
          
          return (
            <div 
              key={section}
              className={`
                flex items-center p-3 rounded-lg border
                ${statusClasses}
                ${isCurrent ? 'animate-pulse' : ''}
                transition-colors duration-300
              `}
            >
              <div className="mr-3">
                {isCompleted ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <div 
                    className={`
                      h-5 w-5 rounded-full
                      ${isCurrent ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-600'}
                    `}
                  ></div>
                )}
              </div>
              <span>
                {sectionDisplayNames[section] || section}
              </span>
            </div>
          );
        })}
        
        {/* Complete section - only shown when complete */}
        {currentSection === ConsultationSection.COMPLETE && (
          <div className="flex items-center p-3 rounded-lg border bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
            <div className="mr-3">
              <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <span>Complete</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Current section indicator - for mobile/compact displays
interface CurrentSectionIndicatorProps {
  currentSection: ConsultationSection | string;
  className?: string;
}

export const CurrentSectionIndicator: React.FC<CurrentSectionIndicatorProps> = ({
  currentSection,
  className = ''
}) => {
  return (
    <div className={`${className}`}>
      <div className="flex items-center space-x-2">
        <div className="h-3 w-3 rounded-full bg-primary-500 animate-pulse"></div>
        <span className="font-medium text-primary-800 dark:text-primary-300">
          Current Section:
        </span>
        <span className="text-neutral-700 dark:text-neutral-300">
          {sectionDisplayNames[currentSection] || currentSection}
        </span>
      </div>
    </div>
  );
};

export default SectionProgress;