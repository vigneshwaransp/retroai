import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasOpenaiKey: !!process.env.OPENAI_API_KEY,
    hasHfToken: !!process.env.HF_TOKEN,
    hasGroqKey: !!process.env.GROQ_API_KEY,
    hasNvidiaKey: !!process.env.NVIDIA_API_KEY,
    hfModel: process.env.HF_MODEL || 'ibm-granite/granite-3.0-8b-instruct',
    groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  });
}
export const dynamic = 'force-dynamic';
