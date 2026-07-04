let activeAudio: HTMLAudioElement | null = null;

export function cancelSpeech() {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
}

export async function speak(text: string, onSpeaking?: (on: boolean) => void) {
  cancelSpeech();
  try {
    onSpeaking?.(true);
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        voiceConfig: { name: "en-US-Journey-O", languageCode: "en-US" },
      }),
    });
    
    if (!res.ok) throw new Error("TTS failed");
    
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    activeAudio = audio;
    
    audio.onended = () => {
      onSpeaking?.(false);
      URL.revokeObjectURL(url);
      if (activeAudio === audio) activeAudio = null;
    };
    
    await audio.play();
  } catch (err) {
    console.error("Speech error", err);
    onSpeaking?.(false);
  }
}
