// hooks/useSpeechRecognition.ts
import { useState, useEffect, useCallback, useRef } from 'react';

// Define the SpeechRecognition interface
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  error: any;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal?: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: (event: Event) => void;
  start(): void;
  stop(): void;
  abort(): void;
}

// Define a constructor
interface SpeechRecognitionConstructor {
  new(): SpeechRecognition;
  prototype: SpeechRecognition;
}

interface SpeechRecognitionHook {
  transcript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
  isSupported: boolean;
}

// Extend Window interface
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const cumulativeTranscriptRef = useRef('');
  // Add a separate ref to track manual stop state
  const isManualStopRef = useRef(false);
  
  // Check if browser supports the Web Speech API
  useEffect(() => {
    // Check if the Web Speech API is available
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser.');
    }
  }, []);

  // Start listening function
  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setError('Speech recognition is not supported in this browser.');
        return;
      }
      
      // Create a new instance each time to avoid issues with reusing instances
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      // Reset the manual stop flag when starting new recognition
      isManualStopRef.current = false;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        // Don't clear transcript when starting - keep previous content
        // Use the current transcript as the starting point
        cumulativeTranscriptRef.current = transcript;
      };

      recognition.onresult = (event) => {
        // Get the current speech segment
        const lastResult = event.results[event.results.length - 1];
        const currentSpeechSegment = lastResult[0].transcript;
        
        // Combine with previous transcript to maintain continuity
        const updatedTranscript = cumulativeTranscriptRef.current + ' ' + currentSpeechSegment;
        
        // Update transcript state
        setTranscript(updatedTranscript.trim());
        
        // If this is a final result (user paused speaking)
        if (lastResult.isFinal) {
          // Update the cumulative reference for next segments
          cumulativeTranscriptRef.current = updatedTranscript.trim();
        }
      };

      recognition.onerror = (event) => {
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        // Only restart if this wasn't a manual stop
        if (recognitionRef.current && !isManualStopRef.current) {
          try {
            recognition.start();
          } catch (e) {
            // Ignore errors when restarting
          }
        }
      };

      recognition.start();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to start speech recognition: ${errorMessage}`);
      setIsListening(false);
    }
  }, [isSupported, transcript]);

  // Stop listening function
  const stopListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) return;

    try {
      // Store the final transcript reference to preserve for next start
      cumulativeTranscriptRef.current = transcript;
      
      // Set the manual stop flag to prevent auto-restart
      isManualStopRef.current = true;
      
      // Properly clean up and stop the recognition
      recognitionRef.current.stop();
      
      // We don't set isListening to false here because the onend event will do that
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to stop speech recognition: ${errorMessage}`);
    }
  }, [isSupported, transcript]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    error,
    isSupported
  };
};

export default useSpeechRecognition;