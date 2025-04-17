// components/providers/index.tsx
import React, { useState, useEffect } from 'react';
import { UserCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Provider } from '../../types';
import * as api from '../../api';
import { Spinner } from '../shared';

// Individual provider card component
interface ProviderCardProps {
  provider: Provider;
  isSelected: boolean;
  onClick: () => void;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({ 
  provider, 
  isSelected, 
  onClick 
}) => {
  return (
    <div 
      className={`
        group relative overflow-hidden rounded-xl p-4 
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
      
      <div className="flex flex-col items-center text-center p-4">
        {/* Provider avatar */}
        {provider.photo ? (
          <img 
            src={provider.photo} 
            alt={provider.name} 
            className={`
              h-24 w-24 rounded-full object-cover mb-4
              ${isSelected ? 'ring-4 ring-primary-500' : 'ring-2 ring-neutral-200 dark:ring-neutral-700'}
            `}
          />
        ) : (
          <div className={`
            h-24 w-24 rounded-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-700 mb-4
            ${isSelected ? 'ring-4 ring-primary-500' : 'ring-2 ring-neutral-200 dark:ring-neutral-700'}
          `}>
            <UserCircleIcon className="h-16 w-16 text-neutral-400 dark:text-neutral-500" />
          </div>
        )}
        
        {/* Provider details */}
        <h3 className="text-lg font-medium text-neutral-900 dark:text-white">
          {provider.name}
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {provider.specialty}
        </p>
      </div>
    </div>
  );
};

// Provider selector component
interface ProviderSelectorProps {
  onSelect: (provider: Provider) => void;
  selectedProvider: Provider | null;
}

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({ 
  onSelect, 
  selectedProvider 
}) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProviders = async () => {
      try {
        setIsLoading(true);
        const data = await api.getProviders();
        setProviders(data);
        setError(null);
      } catch (err) {
        console.error('Error loading providers:', err);
        setError('Unable to load providers. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProviders();
  }, []);

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
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-light mb-6 text-neutral-800 dark:text-neutral-200">
        Select a Provider
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            isSelected={selectedProvider?.id === provider.id}
            onClick={() => onSelect(provider)}
          />
        ))}
      </div>
    </div>
  );
};

// Provider indicator component (shows in header/sidebar during session)
interface ProviderIndicatorProps {
  provider: Provider;
}

export const ProviderIndicator: React.FC<ProviderIndicatorProps> = ({ provider }) => {
  return (
    <div className="flex items-center px-4 py-2 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-lg border border-neutral-200 dark:border-neutral-700">
      {provider.photo ? (
        <img 
          src={provider.photo} 
          alt={provider.name} 
          className="h-10 w-10 rounded-full object-cover ring-2 ring-primary-100 dark:ring-primary-900"
        />
      ) : (
        <div className="h-10 w-10 rounded-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-700 ring-2 ring-primary-100 dark:ring-primary-900">
          <UserCircleIcon className="h-7 w-7 text-neutral-500 dark:text-neutral-400" />
        </div>
      )}
      
      <div className="ml-3">
        <p className="text-sm font-medium text-neutral-900 dark:text-white">
          {provider.name}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {provider.specialty}
        </p>
      </div>
    </div>
  );
};