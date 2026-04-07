"use client";

import { useState, useRef, useCallback } from "react";

interface UseVoiceInputOptions {
  lang?:         string;
  continuous?:   boolean;
  interimResults?: boolean;
  onResult?:     (transcript: string) => void;
  onError?:      (error: string) => void;
}

interface UseVoiceInputReturn {
  isRecording:  boolean;
  isSupported:  boolean;
  transcript:   string;
  startRecording: () => void;
  stopRecording:  () => void;
  toggleRecording: () => void;
}

/**
 * Hook para dictado por voz usando la Web Speech API.
 * Compatible con Chrome y Safari (con prefijo webkit).
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

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startRecording = useCallback(() => {
    if (!isSupported) {
      onError?.("Tu navegador no soporta reconocimiento de voz");
      return;
    }

    // Limpiar instancia anterior
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const SpeechRecognitionAPI =
      (window as typeof window & { webkitSpeechRecognition: typeof SpeechRecognition })
        .SpeechRecognition ??
      (window as typeof window & { webkitSpeechRecognition: typeof SpeechRecognition })
        .webkitSpeechRecognition;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang           = lang;
    recognition.continuous     = continuous;
    recognition.interimResults = interimResults;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend   = () => setIsRecording(false);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
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

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsRecording(false);
      const mensajes: Record<string, string> = {
        "no-speech":          "No se detectó voz. Inténtalo de nuevo.",
        "audio-capture":      "No se puede acceder al micrófono.",
        "not-allowed":        "Permiso de micrófono denegado.",
        "network":            "Error de red durante el reconocimiento.",
        "aborted":            "Reconocimiento cancelado.",
        "service-not-allowed":"Servicio de voz no disponible.",
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
