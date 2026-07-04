import { NextRequest, NextResponse } from 'next/server';
import { synthesizeSpeech } from '../../../lib/tts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, voiceConfig } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const audioContent = await synthesizeSpeech(text, voiceConfig);

    if (!audioContent) {
      return NextResponse.json({ error: 'Failed to synthesize speech' }, { status: 500 });
    }

    // Return the audio content as a buffer
    return new NextResponse(audioContent as BodyInit, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioContent.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Error synthesizing speech:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
