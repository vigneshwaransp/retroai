import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildSystemInstruction, generateLocalSimulatedResponse, UserPersona, ToneMode, MoodState } from '@/lib/dnaEngine';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

// Fast low-latency web scraper helper
interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

// Fast low-latency web scraper helper
async function fastWebSearch(query: string): Promise<SearchResult[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) return [];
    const html = await res.text();
    
    const results: SearchResult[] = [];
    const resultBlocks = html.split('<div class="result results_links');
    for (const block of resultBlocks.slice(1)) {
      const urlMatch = block.match(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"/i) || block.match(/<a[^>]*href="([^"]+)"[^>]*class="[^"]*result__a[^"]*"/i);
      const titleMatch = block.match(/<a[^>]*class="[^"]*result__a[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
      const snippetMatch = block.match(/<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i) || block.match(/<div[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      
      if (urlMatch && titleMatch) {
        let cleanUrl = urlMatch[1];
        if (cleanUrl.startsWith('//duckduckgo.com/l/?uddg=')) {
          const match = cleanUrl.match(/uddg=([^&]+)/);
          if (match) cleanUrl = decodeURIComponent(match[1]);
        } else if (cleanUrl.startsWith('/l/?uddg=')) {
          const match = cleanUrl.match(/uddg=([^&]+)/);
          if (match) cleanUrl = decodeURIComponent(match[1]);
        }
        results.push({
          title: titleMatch[1].replace(/<[^>]*>/g, '').trim(),
          url: cleanUrl,
          snippet: snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, '').trim() : ''
        });
      }
    }
      
    return results.slice(0, 4);
  } catch (e) {
    console.error("Fast web search error:", e);
    return [];
  }
}

// Yahoo web scraper helper with fallback to DuckDuckGo
async function yahooWebSearch(query: string): Promise<SearchResult[]> {
  try {
    const url = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) return fastWebSearch(query);
    const html = await res.text();
    
    const results: SearchResult[] = [];
    const resultBlocks = html.split(/<div class="[^"]*algo/i);
    for (const block of resultBlocks.slice(1)) {
      const urlMatch = block.match(/<a[^>]*href="([^"]+)"[^>]*class="[^"]*th-title/i) || block.match(/<a[^>]*href="([^"]+)"/i);
      const titleMatch = block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
      const snippetMatch = block.match(/<div class="compText[^>]*>([\s\S]*?)<\/div>/i);
      if (urlMatch && titleMatch) {
        results.push({
          title: titleMatch[1].replace(/<[^>]*>/g, '').trim(),
          url: urlMatch[1],
          snippet: snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, '').trim() : ''
        });
      }
    }
      
    if (results.length === 0) {
      return fastWebSearch(query);
    }
    return results.slice(0, 4);
  } catch (e) {
    console.error("Yahoo web search error, falling back to DDG:", e);
    return fastWebSearch(query);
  }
}

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

// Helper to query Llama 3.3 via NVIDIA API for GenAI Mode
async function fetchGemma(systemPrompt: string | null, userPrompt: string, apiKey: string) {
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
      model: 'meta/llama-3.3-70b-instruct',
      max_tokens: 4096,
      temperature: 0.7,
      top_p: 0.9,
      stream: false
    })
  });

  if (!response.ok) {
    const errObj = await response.json().catch(() => ({}));
    throw new Error(errObj?.error?.message || errObj?.detail || `Status ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0]?.message;
  return {
    content: choice?.content || 'No response returned.',
    reasoning: choice?.reasoning_content || null
  };
}

// Helper to search images via Chrome Protocol
async function searchChromeImages(query: string): Promise<string[]> {
  let browser = null;
  try {
    let cleanedQuery = query.trim();
    if (cleanedQuery.length > 100) {
      cleanedQuery = cleanedQuery.split(/\s+/).slice(0, 8).join(' ');
    }

    const isLocal = process.env.NODE_ENV === 'development' || !process.env.VERCEL;
    
    const options: any = {
      args: isLocal ? ['--no-sandbox', '--disable-setuid-sandbox'] : [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 800, height: 600 },
      headless: true,
    };

    if (isLocal) {
      options.executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    } else {
      options.executablePath = await chromium.executablePath('https://github.com/Sparticuz/chromium/releases/download/v123.0.1/chromium-v123.0.1-pack.tar');
    }

    browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.goto(`https://images.search.yahoo.com/search/images?p=${encodeURIComponent(cleanedQuery)}`, {
      waitUntil: 'networkidle2',
      timeout: 15000
    });

    await page.waitForSelector('img', { timeout: 10000 });

    const urls = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      return Array.from(imgs)
        .map(img => img.src || img.getAttribute('data-src') || '')
        .filter(src => src && (src.includes('bing.net') || src.includes('yimg.com') || src.includes('tse')))
        .slice(0, 3);
    });

    return urls;
  } catch (err) {
    console.error("Puppeteer image search error:", err);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    // Add special path for Style Scanner analysis using NVIDIA model
    if (payload.action === 'analyze_style') {
      const textToAnalyze = payload.text;
      const activeKey = payload.apiKey || process.env.NVIDIA_API_KEY;
      
      if (!textToAnalyze || textToAnalyze.trim().length < 20) {
        return NextResponse.json({ error: 'Text must be at least 20 characters long.' }, { status: 400 });
      }

      if (!activeKey) {
        return NextResponse.json({ error: 'NVIDIA API key not configured.' }, { status: 400 });
      }

      const analysisPrompt = `You are a Communication DNA Analyzer. Analyze the following sample of writing to clone the user's voice, formatting your response strictly as JSON with the following schema:
{
  "description": "2-4 words summarizing the overall style tone (e.g. 'Energetic Tech Vibe', 'Academic Formal', 'Sarcastic Minimalist')",
  "clonedRules": "A specific paragraph describing the syntax rules, vocabulary rules, punctuation preference, and pacing constraints to match this style",
  "samplePhrases": ["string of exact signature phrase from the input", "another signature snippet of 3-7 words", "a third signature snippet"]
}
Input text to analyze:
"${textToAnalyze}"

Return only the valid JSON block without any markdown wrappers or surrounding explanation text.`;

      const result = await fetchNVIDIA(null, analysisPrompt, activeKey);
      
      let parsedStyle;
      try {
        const cleanContent = result.content.replace(/```json/gi, '').replace(/```/g, '').trim();
        parsedStyle = JSON.parse(cleanContent);
      } catch (err) {
        console.error('Failed to parse model style JSON response:', result.content);
        // Fallback structures if model outputs invalid JSON
        parsedStyle = {
          description: "Custom Calibrated Profile",
          clonedRules: "Maintain user sentence lengths and mimic slang keywords.",
          samplePhrases: textToAnalyze.split(/[.!?]+/).slice(0, 3).map((s: string) => s.trim()).filter((s: string) => s.length > 5)
        };
      }

      return NextResponse.json(parsedStyle);
    }

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
      engine,
      webSearchEnabled,
      webSearchModel
    } = payload;

    if (!prompt || !persona) {
      return NextResponse.json({ error: 'Missing prompt or persona DNA' }, { status: 400 });
    }

    const cleanPrompt = prompt.toLowerCase().trim();
    const imageKeywords = ['generate a cat image', 'generate an image', 'generate image', 'create an image', 'draw an image', 'generate a picture', 'create a picture'];
    const isImageQuery = imageKeywords.some(kw => cleanPrompt.includes(kw));

    if (isImageQuery) {
      const promptClean = prompt.replace(/(generate a cat image|generate an image|generate image|create an image|draw an image|create a picture|generate a picture)/gi, '').trim() || prompt;
      const promptEncoded = encodeURIComponent(promptClean);
      const imageUrl = `https://image.pollinations.ai/prompt/${promptEncoded}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;

      return NextResponse.json({
        normal: `Here is the generated image for: "${promptClean}"\n\n![Generated Image](${imageUrl})`,
        personalized: `Based on your communication DNA vibe, I have generated this custom image for you! 🎨✨\n\n![Generated Image](${imageUrl})`,
        isSandbox: false,
        engineUsed: 'pollinations-image'
      });
    }

    // Speed Web Search context injection
    let searchResults: SearchResult[] = [];
    let webScrapeContext = "";
    if (webSearchEnabled) {
      try {
        if (webSearchModel === 'yahoo') {
          searchResults = await yahooWebSearch(prompt);
        } else {
          searchResults = await fastWebSearch(prompt);
        }
        if (searchResults.length > 0) {
          webScrapeContext = searchResults.map(r => `Source: ${r.title}\nURL: ${r.url}\nContent: ${r.snippet}`).join('\n---\n');
        }
      } catch (scrapeErr) {
        console.error("Web search scraper context failed:", scrapeErr);
      }
    }

    const queryPrompt = webScrapeContext
      ? `LIVE WEB SEARCH DATA CONTEXT:\n${webScrapeContext}\n\nUSER PROMPT QUERY:\n${prompt}`
      : prompt;

    const selectedEngine = engine || 'pollinations';

    let personalizedPrompt = queryPrompt;
    if (persona && persona.language) {
      if (persona.language === 'Tamil') {
        personalizedPrompt = `${queryPrompt}\n\nIMPORTANT: You MUST write your entire response in pure Tamil language (தமிழ்) script only! Do not use English script or English translation.`;
      }
    }

    // 1. Pollinations AI Mode (Free, Keyless)
    if (selectedEngine === 'pollinations') {
      try {
        const systemInstruction = buildSystemInstruction(persona, mode, mood, memoryContext || '');

        const [normal, personalized] = await Promise.all([
          fetchPollinations(null, queryPrompt),
          fetchPollinations(systemInstruction, personalizedPrompt)
        ]);

        return NextResponse.json({
          normal,
          personalized,
          isSandbox: false,
          engineUsed: 'pollinations',
          sources: searchResults
        });
      } catch (err: any) {
        console.warn('Pollinations AI failed, falling back to offline simulator:', err);
        const simulated = generateLocalSimulatedResponse(prompt, persona, mode, mood);
        return NextResponse.json({
          normal: simulated.normal,
          personalized: `${simulated.personalized}\n\n*(Offline Sandbox fallback: free online server was rate-limited)*`,
          isSandbox: true,
          engineUsed: 'offline',
          sources: searchResults
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
          engineUsed: 'offline',
          sources: searchResults
        });
      }

      try {
        const systemInstruction = buildSystemInstruction(persona, mode, mood, memoryContext || '');

        const [normal, personalized] = await Promise.all([
          fetchOpenAI(null, queryPrompt, activeKey),
          fetchOpenAI(systemInstruction, personalizedPrompt, activeKey)
        ]);

        return NextResponse.json({
          normal,
          personalized,
          isSandbox: false,
          engineUsed: 'openai',
          sources: searchResults
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
          engineUsed: 'offline',
          sources: searchResults
        });
      }

      try {
        const systemInstruction = buildSystemInstruction(persona, mode, mood, memoryContext || '');
        const targetModel = hfModel && hfModel.trim() !== '' 
          ? hfModel 
          : (process.env.HF_MODEL || 'Qwen/Qwen2.5-72B-Instruct');

        const [normal, personalized] = await Promise.all([
          fetchHuggingFace(null, queryPrompt, activeToken, targetModel),
          fetchHuggingFace(systemInstruction, personalizedPrompt, activeToken, targetModel)
        ]);

        return NextResponse.json({
          normal,
          personalized,
          isSandbox: false,
          engineUsed: 'huggingface',
          sources: searchResults
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
          engineUsed: 'offline',
          sources: searchResults
        });
      }

      try {
        const systemInstruction = buildSystemInstruction(persona, mode, mood, memoryContext || '');
        const targetModel = groqModel || 'qwen/qwen3-32b';

        const [normal, personalized] = await Promise.all([
          fetchGroq(null, queryPrompt, activeKey, targetModel),
          fetchGroq(systemInstruction, personalizedPrompt, activeKey, targetModel)
        ]);

        return NextResponse.json({
          normal,
          personalized,
          isSandbox: false,
          engineUsed: 'groq',
          sources: searchResults
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
          engineUsed: 'offline',
          sources: searchResults
        });
      }

      const genAI = new GoogleGenerativeAI(activeKey);
      const systemInstruction = buildSystemInstruction(persona, mode, mood, memoryContext || '');

      const [normalRes, personalizedRes] = await Promise.allSettled([
        (async () => {
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const result = await model.generateContent(queryPrompt);
          return result.response.text();
        })(),
        (async () => {
          const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: systemInstruction,
          });
          const result = await model.generateContent(personalizedPrompt);
          return result.response.text();
        })()
      ]);

      const normal = normalRes.status === 'fulfilled' 
        ? normalRes.value 
        : 'Error generating standard response. Please check your network connection or API Key.';

      const personalized = personalizedRes.status === 'fulfilled' 
        ? personalizedRes.value 
        : 'Error generating personalized Cresent AI response. Please check your Gemini API key permissions.';

      return NextResponse.json({
        normal,
        personalized,
        isSandbox: false,
        engineUsed: 'gemini',
        sources: searchResults
      });
    }

    // 6. NVIDIA API Mode (moonshotai/kimi-k2.6)
    if (selectedEngine === 'nvidia') {
      const activeKey = apiKey && apiKey.trim() !== '' 
        ? apiKey 
        : process.env.NVIDIA_API_KEY;

      if (!activeKey || activeKey.trim() === '') {
        const simulated = generateLocalSimulatedResponse(prompt, persona, mode, mood);
        return NextResponse.json({
          normal: simulated.normal,
          personalized: simulated.personalized,
          isSandbox: true,
          engineUsed: 'offline',
          sources: searchResults
        });
      }

      try {
        const systemInstruction = buildSystemInstruction(persona, mode, mood, memoryContext || '');

        const [normalRes, personalizedRes] = await Promise.all([
          fetchNVIDIA(null, queryPrompt, activeKey),
          fetchNVIDIA(systemInstruction, personalizedPrompt, activeKey)
        ]);

        return NextResponse.json({
          normal: normalRes.content,
          normalReasoning: normalRes.reasoning,
          personalized: personalizedRes.content,
          personalizedReasoning: personalizedRes.reasoning,
          isSandbox: false,
          engineUsed: 'nvidia',
          sources: searchResults
        });
      } catch (err: any) {
        console.error('NVIDIA completion failed:', err);
        return NextResponse.json({ error: err.message || 'NVIDIA API completion failed' }, { status: 500 });
      }
    }

    // 7. Google DiffusionGemma Engine (GenAI Mode)
    if (selectedEngine === 'gemma') {
      const activeKey = apiKey && apiKey.trim() !== '' 
        ? apiKey 
        : (process.env.NVIDIA_API_KEY || "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");

      if (!activeKey || activeKey.trim() === '') {
        const simulated = generateLocalSimulatedResponse(prompt, persona, mode, mood);
        return NextResponse.json({
          normal: simulated.normal,
          personalized: simulated.personalized,
          isSandbox: true,
          engineUsed: 'offline',
          sources: searchResults
        });
      }

      try {
        const systemInstruction = buildSystemInstruction(persona, mode, mood, memoryContext || '');

        const imageSearchKeywords = ['pic', 'image', 'photo', 'picture', 'drawing', 'illustration', 'map', 'look like', 'draw', 'show', 'find', 'search'];
        const needsImageSearch = imageSearchKeywords.some(kw => cleanPrompt.includes(kw));

        const [normalRes, personalizedRes, images] = await Promise.all([
          fetchGemma(null, queryPrompt, activeKey),
          fetchGemma(systemInstruction, personalizedPrompt, activeKey),
          needsImageSearch ? searchChromeImages(prompt) : Promise.resolve([])
        ]);

        let imageMarkdown = '';
        if (images && images.length > 0) {
          imageMarkdown = '\n\n### Found Pictures:\n' + images.map((img: string, idx: number) => `![Result ${idx + 1}](${img})`).join('\n');
        }

        return NextResponse.json({
          normal: normalRes.content + imageMarkdown,
          normalReasoning: normalRes.reasoning,
          personalized: personalizedRes.content + imageMarkdown,
          personalizedReasoning: personalizedRes.reasoning,
          isSandbox: false,
          engineUsed: 'gemma',
          sources: searchResults
        });
      } catch (err: any) {
        console.error('Gemma completion failed:', err);
        return NextResponse.json({ error: err.message || 'Gemma completion failed' }, { status: 500 });
      }
    }

    // Fallback to offline simulator
    const simulated = generateLocalSimulatedResponse(prompt, persona, mode, mood);
    return NextResponse.json({
      normal: simulated.normal,
      personalized: simulated.personalized,
      isSandbox: true,
      engineUsed: 'offline',
      sources: searchResults
    });

  } catch (error: any) {
    console.error('Error in Cresent AI API route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
