type TranscriptCallback = (transcript: string, isFinal: boolean) => void;
type ErrorCallback = (error: string) => void;
type SpeechCallback = () => void;

class VoiceService {
  private recognition: any = null;

  speak(text: string, onEnd?: SpeechCallback) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
  }

  stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  startListening(onTranscript: TranscriptCallback, onError: ErrorCallback) {
    if (typeof window === 'undefined') {
      onError('Reconhecimento de voz indisponível');
      return;
    }

    const browserWindow = window as any;
    const Recognition = browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;
    if (!Recognition) {
      onError('Seu navegador não oferece reconhecimento de voz');
      return;
    }

    this.stopListening();
    this.recognition = new Recognition();
    this.recognition.lang = 'pt-BR';
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0]?.transcript || '';
      onTranscript(transcript, Boolean(result.isFinal));
    };
    this.recognition.onerror = (event: any) => onError(event.error || 'Falha no reconhecimento de voz');
    this.recognition.onend = () => {
      this.recognition = null;
    };

    try {
      this.recognition.start();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Não foi possível iniciar o microfone');
    }
  }

  stopListening() {
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch {
      // O reconhecimento pode já ter sido encerrado pelo navegador.
    }
    this.recognition = null;
  }
}

export const voiceService = new VoiceService();

