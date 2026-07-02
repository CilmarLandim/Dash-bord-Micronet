// Serviço de reconhecimento de voz e síntese de fala

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  isFinal: boolean;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export class VoiceService {
  private recognition: any;
  private isListening = false;
  private transcript = '';

  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'pt-BR';

    this.recognition.onstart = () => {
      this.isListening = true;
      this.transcript = '';
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    this.recognition.onerror = (event: any) => {
      console.error('Erro de reconhecimento de voz:', event.error);
      this.isListening = false;
    };
  }

  /**
   * Inicia o reconhecimento de voz
   */
  startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError?: (error: string) => void
  ): void {
    if (!this.recognition) {
      onError?.('Reconhecimento de voz não suportado neste navegador');
      return;
    }

    this.transcript = '';

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';

      for (let i = event.results.length - 1; i >= 0; i--) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          this.transcript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      const finalTranscript = this.transcript.trim();
      const displayTranscript = finalTranscript || interimTranscript;
      const isFinal = event.isFinal;

      onResult(displayTranscript, isFinal);
    };

    try {
      this.recognition.start();
    } catch (error) {
      onError?.('Erro ao iniciar reconhecimento de voz');
    }
  }

  /**
   * Para o reconhecimento de voz
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  /**
   * Verifica se está ouvindo
   */
  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  /**
   * Síntese de fala (Text-to-Speech)
   */
  speak(text: string, onEnd?: () => void): void {
    if (!('speechSynthesis' in window)) {
      console.error('Síntese de fala não suportada');
      return;
    }

    // Cancela qualquer fala anterior
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      onEnd?.();
    };

    utterance.onerror = (event) => {
      console.error('Erro na síntese de fala:', event);
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Para a síntese de fala
   */
  stopSpeaking(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Grava áudio do microfone
   */
  async recordAudio(durationMs: number = 5000): Promise<Blob | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorder.start();

      return new Promise((resolve) => {
        setTimeout(() => {
          mediaRecorder.stop();
          stream.getTracks().forEach((track) => track.stop());

          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            resolve(blob);
          };
        }, durationMs);
      });
    } catch (error) {
      console.error('Erro ao gravar áudio:', error);
      return null;
    }
  }

  /**
   * Reproduz um arquivo de áudio
   */
  playAudio(audioBlob: Blob, onEnd?: () => void): void {
    const url = URL.createObjectURL(audioBlob);
    const audio = new Audio(url);

    audio.onended = () => {
      URL.revokeObjectURL(url);
      onEnd?.();
    };

    audio.play().catch((error) => {
      console.error('Erro ao reproduzir áudio:', error);
    });
  }
}

// Instância singleton
export const voiceService = new VoiceService();
