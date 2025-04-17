// components/chat/index.tsx
import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, MicrophoneIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Button, Spinner } from '../shared';
import { ChatMessage, MedicalSource, ConsultationSection } from '../../types';

// Helper to format timestamp
const formatTime = (timestamp: string) => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
};

// Individual chat message component
interface MessageProps {
  message: ChatMessage;
}

export const Message: React.FC<MessageProps> = ({ message }) => {
  const isAI = message.sender === 'ai';
  
  // Handle medical sources if present (for DOUBTS section)
  const sources = (message as any).sources as MedicalSource[] | undefined;
  
  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`max-w-[80%] ${isAI ? 'order-2' : 'order-1'}`}>
        {/* Message bubble */}
        <div 
          className={`
            rounded-2xl p-4 shadow-sm
            ${isAI 
              ? 'bg-primary-50 dark:bg-primary-900/30 rounded-tl-none' 
              : 'bg-white dark:bg-neutral-800 rounded-tr-none border border-neutral-200 dark:border-neutral-700'
            }
          `}
        >
          <div className="whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">
            {message.message}
          </div>
          
          {/* Sources citation section - only for DOUBTS section */}
          {sources && sources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700">
              <h4 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                Sources:
              </h4>
              <div className="space-y-2">
                {sources.map((source, index) => (
                  <div 
                    key={index} 
                    className="text-xs p-2 bg-white dark:bg-neutral-800/50 rounded border border-neutral-200 dark:border-neutral-700"
                  >
                    <p className="font-medium">{source.title}</p>
                    <p className="text-neutral-500 dark:text-neutral-400">
                      PMCID: {source.pmcid}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Message timestamp */}
        <div className={`mt-1 text-xs text-neutral-500 ${isAI ? 'text-left' : 'text-right'}`}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};

// Chat input component
interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  currentSection: ConsultationSection | string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  disabled = false,
  currentSection
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as content grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isLoading || disabled) return;
    
    onSendMessage(message);
    setMessage('');
  };

  // Handle text input
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  // Handle keyboard shortcuts - Submit on Ctrl+Enter or Cmd+Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  // Check if we're on the complete section
  const isComplete = currentSection === ConsultationSection.COMPLETE;

  return (
    <form onSubmit={handleSubmit} className="relative">
      {isComplete ? (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
          <DocumentTextIcon className="h-6 w-6 mx-auto mb-2 text-green-600 dark:text-green-400" />
          <p className="text-green-800 dark:text-green-300 mb-1 font-medium">Consultation Complete</p>
          <p className="text-green-700 dark:text-green-400 text-sm">
            This consultation is now complete. Switch to the Summary tab to view and download the report.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-end border border-neutral-300 dark:border-neutral-700 rounded-lg focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 overflow-hidden bg-white dark:bg-neutral-800">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={
                disabled 
                  ? "Input disabled" 
                  : "Type your message..."
              }
              disabled={disabled || isLoading}
              className="w-full py-3 px-4 focus:outline-none resize-none min-h-[56px] max-h-[150px] bg-transparent text-neutral-800 dark:text-white"
              rows={1}
            />
            
            <div className="p-2 flex">
              {/* Microphone button (placeholder for now) - will implement speech to text later */}
              <button
                type="button"
                disabled={true} // Disabled as per requirements to implement later
                className="rounded-full p-2 text-neutral-400 bg-neutral-100 dark:bg-neutral-700 mr-1 opacity-50 cursor-not-allowed"
                title="Speech input will be implemented later"
              >
                <MicrophoneIcon className="h-5 w-5" />
              </button>
              
              {/* Send button */}
              <button
                type="submit"
                disabled={!message.trim() || isLoading || disabled}
                className={`
                  rounded-full p-2 
                  ${message.trim() && !isLoading && !disabled
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400 cursor-not-allowed'
                  }
                  transition-colors
                `}
              >
                {isLoading ? (
                  <Spinner size="sm" />
                ) : (
                  <PaperAirplaneIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 text-right">
            Press Ctrl+Enter to send
          </p>
        </>
      )}
    </form>
  );
};

// Chat message list component
interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ 
  messages,
  isLoading
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto py-4 px-2">
      <div className="space-y-6">
        {messages.map((message, index) => (
          <Message key={`${message.id || index}`} message={message} />
        ))}
        
        {isLoading && !messages.find(m => m.id?.startsWith('temp-ai-')) && (
          <div className="flex justify-center py-4">
            <div className="dot-loading">
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

// Complete chat interface
interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  currentSection: ConsultationSection | string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  currentSection
}) => {
  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} isLoading={isLoading} />
      <div className="border-t border-neutral-200 dark:border-neutral-700 p-4">
        <ChatInput 
          onSendMessage={onSendMessage} 
          isLoading={isLoading} 
          currentSection={currentSection}
        />
      </div>
    </div>
  );
};