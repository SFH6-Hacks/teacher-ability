import textToSpeech from '@google-cloud/text-to-speech';

// Instantiates a client. It automatically picks up credentials
// from the GOOGLE_APPLICATION_CREDENTIALS environment variable.
const client = new textToSpeech.TextToSpeechClient();

export interface VoiceConfig {
  languageCode?: string;
  name?: string;
  ssmlGender?: 'MALE' | 'FEMALE' | 'NEUTRAL' | 'SSML_VOICE_GENDER_UNSPECIFIED';
}

export async function synthesizeSpeech(text: string, voiceConfig?: VoiceConfig): Promise<Uint8Array | string | null | undefined> {
  const request = {
    input: { text },
    // Select the language and SSML voice gender (optional)
    voice: {
      languageCode: voiceConfig?.languageCode || 'en-US',
      name: voiceConfig?.name,
      ssmlGender: voiceConfig?.ssmlGender || 'NEUTRAL',
    },
    // select the type of audio encoding
    audioConfig: { audioEncoding: 'MP3' as const },
  };

  // Performs the text-to-speech request
  const [response] = await client.synthesizeSpeech(request);
  return response.audioContent;
}
