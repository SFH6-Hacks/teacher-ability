let activeAudio: HTMLAudioElement | null = null;
let activeCallback: ((on: boolean) => void) | null = null;
let speechId = 0;

export function cancelSpeech() {
  speechId++; // invalidate any in-flight fetches
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
  if (activeCallback) {
    activeCallback(false);
    activeCallback = null;
  }
}

export async function speak(text: string, onSpeaking?: (on: boolean) => void) {
  cancelSpeech();
  const currentId = speechId;
  activeCallback = onSpeaking || null;
  
  try {
    activeCallback?.(true);
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        voiceConfig: { name: "en-US-Journey-O", languageCode: "en-US" },
      }),
    });
    
    if (currentId !== speechId) return; // a new speech started while we were fetching
    if (!res.ok) throw new Error("TTS failed");
    
    const blob = await res.blob();
    if (currentId !== speechId) return; 

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    activeAudio = audio;
    
    audio.onended = () => {
      if (activeAudio === audio) {
        activeCallback?.(false);
        activeCallback = null;
        activeAudio = null;
      }
      URL.revokeObjectURL(url);
    };
    
    await audio.play();
  } catch (err) {
    console.error("Speech error", err);
    if (currentId === speechId) {
      activeCallback?.(false);
      activeCallback = null;
    }
  }
}
