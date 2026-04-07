"use client";

import { useState, useRef, useCallback } from "react";

interface UseVoiceInputOptions {
  lang?:           string;
  continuous?:     boolean;
  interimResults?: boolean;
  onResult?:       (transcript: string) => void;
  onError?:        (error: string) => void;
}

interface UseVoiceInputReturn {
  isRecording:    boolean;
  isSupported:    boolean;
  transcript:     string;
  startRecording: () => void;
  stopRecording:  () => void;
  toggleRecording: () => void;
}

/**
 * Hook para dictado por voz optimizado para Vercel/TypeScript.
 */
export function useVoiceInput({
  lang           = "es-ES",
  continuous     = false,
  interimResults = true,
  onResult,
  onError,
}: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript]   = useState("");

  // Usamos 'any' aquí para que TypeScript no bloquee el build en Vercel
  const recognitionRef = useRef<any>(null);

  const isSupported =
    typeof window !== "undefined" &&
    (!!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition);

  const startRecording = useCallback(() => {
    if (!isSupported) {
      onError?.("Tu navegador no soporta reconocimiento de voz");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;

    recognition.onstart = () => setIsRecording(true);

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscript(finalTranscript);
        onResult?.(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      setIsRecording(false);
      const mensajes: Record<string, string> = {
        "no-speech":          "No se detectó voz.",
        "not-allowed":        "Permiso de micrófono denegado.",
      };
      onError?.(mensajes[event.error] ?? `Error: ${event.error}`);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, lang, continuous, interimResults, onResult, onError]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isSupported,
    transcript,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
