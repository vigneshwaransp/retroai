import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildSystemInstruction, generateLocalSimulatedResponse, UserPersona, ToneMode, MoodState } from '@/lib/dnaEngine';

// Helper to query Pollinations AI (keyless GPT-4o-mini model)
async function fetchPollinations(systemPrompt: string | null, userPrompt: string) {
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userPrompt });

  const response = await fetch('https://text.pollinations.ai/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      model: 'openai', // Default model for Pollinations (GPT-4o-mini)
      seed: 42
    })
  });

  if (!response.ok) {
    throw new Error(`Pollinations AI error: ${response.status} ${response.statusText}`);
  }

  return await response.text();
}

// Helper to query OpenAI API (GPT-4o-mini)
async function fetchOpenAI(systemPrompt: string | null, userPrompt: string, apiKey: string) {
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userPrompt });

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      messages,
      model: 'gpt-4o-mini',
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errObj = await response.json().catch(() => ({}));
    throw new Error(errObj?.error?.message || `OpenAI error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'No response returned from OpenAI.';
}

// Helper to query Hugging Face Router
async function fetchHuggingFace(systemPrompt: string | null, userPrompt: string, token: string, modelName: string) {
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userPrompt });

  const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      messages,
      model: modelName || 'Qwen/Qwen2.5-72B-Instruct',
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errObj = await response.json().catch(() => ({}));
    throw new Error(errObj?.error?.message || `HuggingFace error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'No response returned from Hugging Face.';
}

// Helper to query Groq API (OpenAI-compatible)
async function fetchGroq(systemPrompt: string | null, userPrompt: string, apiKey: string, modelName: string) {
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userPrompt });

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      messages,
      model: modelName || 'llama-3.3-70b-versatile',
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errObj = await response.json().catch(() => ({}));
    throw new Error(errObj?.error?.message || `Groq error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'No response returned from Groq.';
}

// Helper to query NVIDIA API (moonshotai/kimi-k2.6)
async function fetchNVIDIA(systemPrompt: string | null, userPrompt: string, apiKey: string) {
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userPrompt });

  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      messages,
      model: 'moonshotai/kimi-k2.6',
      max_tokens: 16384,
      temperature: 1.00,
      top_p: 1.00,
      stream: false
    })
  });

  if (!response.ok) {
    const errObj = await response.json().catch(() => ({}));
    throw new Error(errObj?.error?.message || `NVIDIA error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0]?.message;
  return {
    content: choice?.content || 'No response returned from NVIDIA.',
    reasoning: choice?.reasoning_content || null
  };
}

export async function POST(request: Request) {
  try {
    const { 
      prompt, 
      persona, 
      mode, 
      mood, 
      memoryContext, 
      apiKey, 
      openaiApiKey, 
      hfToken, 
      hfModel, 
      groqApiKey,
      groqModel,
      engine 
    } = await request.json();

    if (!prompt || !persona) {
      return NextResponse.json({ error: 'Missing prompt or persona DNA' }, { status: 400 });
    }

    const selectedEngine = engine || 'pollinations';

    // 1. Pollinations AI Mode (Free, Keyless)
    if (selectedEngine === 'pollinations') {
      try {
        const systemInstruction = buildSystemInstruction(persona, mode, mood, memoryContext || '');

        const [normal, personalized] = await Promise.all([
          fetchPollinations(null, prompt),
          fetchPollinations(systemInstruction, prompt)
        ]);

        return NextResponse.json({
          normal,
          personalized,
          isSandbox: false,
          engineUsed: 'pollinations'
        });
      } catch (err: any) {
        console.warn('Pollinations AI failed, falling back to offline simulator:', err);
        const simulated = generateLocalSimulatedResponse(prompt, persona, mode, mood);
        return NextResponse.json({
          normal: simulated.normal,
          personalized: `${simulated.personalized}\n\n*(Offline Sandbox fallback: free online server was rate-limited)*`,
          isSandbox: true,
          engineUsed: 'offline'
        });
      }
    }

    // 2. OpenAI API Mode (Requires OpenAI Key)
    if (selectedEngine === 'openai') {
      const activeKey = openaiApiKey && openaiApiKey.trim() !== '' 
        ? openaiApiKey 
        : process.env.OPENAI_API_KEY;

      if (!activeKey || activeKey.trim() === '') {
        const simulated = generateLocalSimulatedResponse(prompt, persona, mode, mood);
        return NextResponse.json({
          normal: simulated.normal,
          personalized: simulated.personalized,
          isSandbox: true,
          engineUsed: 'offline'
        });
      }

      try {
        const systemInstruction = buildSystemInstruction(persona, mode, mood, memoryContext || '');

        const [normal, personalized] = await Promise.all([
          fetchOpenAI(null, prompt, activeKey),
          fetchOpenAI(systemInstruction, prompt, activeKey)
        ]);

        return NextResponse.json({
          normal,
          personalized,
          isSandbox: false,
          engineUsed: 'openai'
        });
      } catch (err: any) {
        return NextResponse.json({ error: err.message || 'OpenAI API completion failed' }, { status: 500 });
      }
    }

    // 3. Hugging Face Router Mode (Requires HF Token & Model ID)
    if (selectedEngine === 'huggingface') {
      const activeToken = hfToken && hfToken.trim() !== '' 
        ? hfToken 
        : process.env.HF_TOKEN;

      if (!activeToken || activeToken.trim() === '') {
        const simulated = generateLocalSimulatedResponse(prompt, persona, mode, mood);
        return NextResponse.json({
          normal: simulated.normal,
          personalized: simulated.personalized,
          isSandbox: true,
          engineUsed: 'offline'
        });
      }

      try {
        const systemInstruction = buildSystemInstruction(persona, mode, mood, memoryContext || '');
        const targetModel = hfModel && hfModel.trim() !== '' 
          ? hfModel 
          : (process.env.HF_MODEL || 'Qwen/Qwen2.5-72B-Instruct');

        const [normal, personalized] = await Promise.all([
          fetchHuggingFace(null, prompt, activeToken, targetModel),
          fetchHuggingFace(systemInstruction, prompt, activeToken, targetModel)
        ]);

        return NextResponse.json({
          normal,
          personalized,
          isSandbox: false,
          engineUsed: 'huggingface'
        });
      } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Hugging Face API completion failed' }, { status: 500 });
      }
    }

    // 4. Groq API Mode (Requires Groq Key)
    if (selectedEngine === 'groq') {
      const activeKey = groqApiKey && groqApiKey.trim() !== '' 
        ? groqApiKey 
        : process.env.GROQ_API_KEY;

      if (!activeKey || activeKey.trim() === '') {
        const simulated = generateLocalSimulatedResponse(prompt, persona, mode, mood);
        return NextResponse.json({
          normal: simulated.normal,
          personalized: simulated.personalized,
          isSandbox: true,
          engineUsed: 'offline'
        });
      }

      try {
        const systemInstruction = buildSystemInstruction(persona, mode, mood, memoryContext || '');
        const targetModel = groqModel || 'llama-3.3-70b-versatile';

        const [normal, personalized] = await Promise.all([
          fetchGroq(null, prompt, activeKey, targetModel),
          fetchGroq(systemInstruction, prompt, activeKey, targetModel)
        ]);

        return NextResponse.json({
          normal,
          personalized,
          isSandbox: false,
          engineUsed: 'groq'
        });
      } catch (err: any) {
        console.error('Groq completion failed:', err);
        return NextResponse.json({ error: err.message || 'Groq API completion failed' }, { status: 500 });
      }
    }

    // 5. Gemini API Mode (Requires Gemini Key)
    if (selectedEngine === 'gemini') {
      const activeKey = apiKey && apiKey.trim() !== '' 
        ? apiKey 
        : process.env.GEMINI_API_KEY;

      if (!activeKey || activeKey.trim() === '') {
        const simulated = generateLocalSimulatedResponse(prompt, persona, mode, mood);
        return NextResponse.json({
          normal: simulated.normal,
          personalized: simulated.personalized,
          isSandbox: true,
          engineUsed: 'offline'
        });
      }

      const genAI = new GoogleGenerativeAI(activeKey);
      const systemInstruction = buildSystemInstruction(persona, mode, mood, memoryContext || '');

      const [normalRes, personalizedRes] = await Promise.allSettled([
        (async () => {
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const result = await model.generateContent(prompt);
          return result.response.text();
        })(),
        (async () => {
          const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: systemInstruction,
          });
          const result = await model.generateContent(prompt);
          return result.response.text();
        })()
      ]);

      const normal = normalRes.status === 'fulfilled' 
        ? normalRes.value 
        : 'Error generating standard response. Please check your network connection or API Key.';

      const personalized = personalizedRes.status === 'fulfilled' 
        ? personalizedRes.value 
        : 'Error generating personalized Retero response. Please check your Gemini API key permissions.';

      return NextResponse.json({
        normal,
        personalized,
        isSandbox: false,
        engineUsed: 'gemini'
      });
    }

    // 6. NVIDIA API Mode (moonshotai/kimi-k2.6)
    if (selectedEngine === 'nvidia') {
      const activeKey = apiKey && apiKey.trim() !== '' 
        ? apiKey 
        : (process.env.NVIDIA_API_KEY || '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');

      if (!activeKey || activeKey.trim() === '') {
        const simulated = generateLocalSimulatedResponse(prompt, persona, mode, mood);
        return NextResponse.json({
          normal: simulated.normal,
          personalized: simulated.personalized,
          isSandbox: true,
          engineUsed: 'offline'
        });
      }

      try {
        const systemInstruction = buildSystemInstruction(persona, mode, mood, memoryContext || '');

        const [normalRes, personalizedRes] = await Promise.all([
          fetchNVIDIA(null, prompt, activeKey),
          fetchNVIDIA(systemInstruction, prompt, activeKey)
        ]);

        return NextResponse.json({
          normal: normalRes.content,
          normalReasoning: normalRes.reasoning,
          personalized: personalizedRes.content,
          personalizedReasoning: personalizedRes.reasoning,
          isSandbox: false,
          engineUsed: 'nvidia'
        });
      } catch (err: any) {
        console.error('NVIDIA completion failed:', err);
        return NextResponse.json({ error: err.message || 'NVIDIA API completion failed' }, { status: 500 });
      }
    }

    // Fallback to offline simulator
    const simulated = generateLocalSimulatedResponse(prompt, persona, mode, mood);
    return NextResponse.json({
      normal: simulated.normal,
      personalized: simulated.personalized,
      isSandbox: true,
      engineUsed: 'offline'
    });

  } catch (error: any) {
    console.error('Error in Retero AI API route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
