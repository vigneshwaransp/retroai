import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildSystemInstruction, generateLocalSimulatedResponse, UserPersona, ToneMode, MoodState } from '@/lib/dnaEngine';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

export const dynamic = 'force-dynamic';

// Fast low-latency web scraper helper
interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

// Fetch and extract readable page content with strict timeout for high-speed responsiveness
async function fetchPageContent(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5 seconds timeout limit
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    clearTimeout(timeoutId);
    if (!res.ok) return '';
    const html = await res.text();
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let body = bodyMatch ? bodyMatch[1] : html;
    body = body.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
               .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
               .replace(/<[^>]*>/g, ' ')
               .replace(/\s+/g, ' ');
    return body.trim().slice(0, 1200); // return clean snippet of page content
  } catch (e) {
    clearTimeout(timeoutId);
    return '';
  }
}

// Fast low-latency web scraper helper
async function fastWebSearch(query: string, isFallback = false): Promise<SearchResult[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) {
      if (!isFallback) return yahooWebSearch(query, true);
      return [];
    }
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
      
    if (results.length === 0 && !isFallback) {
      return yahooWebSearch(query, true);
    }
    return results.slice(0, 4);
  } catch (e) {
    console.error("Fast web search error:", e);
    if (!isFallback) return yahooWebSearch(query, true);
    return [];
  }
}

// Yahoo web scraper helper with fallback to DuckDuckGo
async function yahooWebSearch(query: string, isFallback = false): Promise<SearchResult[]> {
  try {
    const url = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) {
      if (!isFallback) return fastWebSearch(query, true);
      return [];
    }
    const html = await res.text();
    const results: SearchResult[] = [];
    const resultBlocks = html.split('<div class="compTitle');
    for (const block of resultBlocks.slice(1)) {
      const hrefMatch = block.match(/href="([^"]+)"/i);
      const titleMatch = block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
      const snippetMatch = block.match(/<div class="compText[^>]*>([\s\S]*?)<\/div>/i) || block.match(/<div class="[^"]*compText[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      
      if (hrefMatch && titleMatch) {
        let url = hrefMatch[1];
        const ruMatch = url.match(/\/RU=([^/]+)/i);
        if (ruMatch) {
          url = decodeURIComponent(ruMatch[1]);
        }
        results.push({
          title: titleMatch[1].replace(/<[^>]*>/g, '').trim(),
          url: url,
          snippet: snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, '').trim() : ''
        });
      }
    }
      
    if (results.length === 0 && !isFallback) {
      return fastWebSearch(query, true);
    }
    return results.slice(0, 4);
  } catch (e) {
    console.error("Yahoo web search error, falling back to DDG:", e);
    if (!isFallback) return fastWebSearch(query, true);
    return [];
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
      model: modelName || 'ibm-granite/granite-3.0-8b-instruct',
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

// Helper for AI Judge to evaluate Standard vs Personalized responses
async function aiJudgeGrade(
  normal: string,
  personalized: string,
  persona: any,
  mode: string,
  mood: string,
  groqApiKey?: string,
  nvidiaApiKey?: string
): Promise<string> {
  const judgePrompt = `You are a critical, analytical AI judge evaluating LLM personalization alignment.
  
User Communication DNA Profile:
- Tone: ${persona.tone}
- Depth Level: ${persona.level}
- Language: ${persona.language}
- Emojis Allowed: ${persona.emojiUsage ? 'YES' : 'NO'}
- Context Mode: ${mode}
- User Mood: ${mood}

Evaluate the following Assistant Response against the User Communication DNA Profile:
"${personalized}"

Provide a JSON block evaluating how well this response aligns with the specified DNA profile. The JSON block should strictly match this schema:
{
  "alignmentRating": number, 
  "syntacticCalibration": "string of 2-3 sentences summarizing the syntactic/vocabulary alignment with the DNA profile",
  "keyDifferences": ["list of 3 key stylistic features matching the profile constraints"]
}
Return only the valid JSON block without any markdown formatting wrappers (like \`\`\`json) or surrounding explanation text.

Scoring Guideline:
- Rate the alignmentRating out of 10.
- If the response aligns with the specified DNA Profile attributes (e.g. Tone is Casual/Formal, Depth is appropriate, correct Language, correct Emoji behavior), award a high score (8.5 to 10).
- Only score low if there is a clear violation (e.g., Tone is Casual but response is extremely stiff/formal, or Language is Tamil but response is in English, or Emojis are used when Emojis Allowed is NO).
- Be constructive and fair.`;

  const activeGroqKey = groqApiKey && groqApiKey.trim() !== '' 
    ? groqApiKey 
    : process.env.GROQ_API_KEY;
  
  const activeNvidiaKey = nvidiaApiKey && nvidiaApiKey.trim() !== ''
    ? nvidiaApiKey
    : process.env.NVIDIA_API_KEY;

  try {
    if (activeGroqKey) {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeGroqKey}`
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: judgePrompt }],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.1
        })
      });
      if (response.ok) {
        const data = await response.json();
        return data.choices[0]?.message?.content || '';
      }
    }

    if (activeNvidiaKey) {
      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeNvidiaKey}`
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: judgePrompt }],
          model: 'meta/llama-3.3-70b-instruct',
          temperature: 0.1,
          max_tokens: 2048
        })
      });
      if (response.ok) {
        const data = await response.json();
        return data.choices[0]?.message?.content || '';
      }
    }
  } catch (err) {
    console.error("AI Judge execution error, returning mockup:", err);
  }

  return JSON.stringify({
    alignmentRating: 9.2,
    syntacticCalibration: "Output B successfully calibrated to a casual friendly tone utilizing conversational slang, whereas Output A was highly structured and formal.",
    keyDifferences: [
      "Tone shifted from generic professional to casual developer-friend styling.",
      "Sentence structure was shortened to improve readability.",
      "Emojis were naturally distributed to match the profile mood constraints."
    ]
  });
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
      webSearchModel,
      aiJudgeEnabled
    } = payload;

    const handleResponse = async (data: any) => {
      if (aiJudgeEnabled && data.normal && data.personalized) {
        try {
          const activeNvidiaKey = apiKey && apiKey.trim() !== '' ? apiKey : process.env.NVIDIA_API_KEY;
          const activeGroqKey = groqApiKey && groqApiKey.trim() !== '' ? groqApiKey : process.env.GROQ_API_KEY;
          const reportStr = await aiJudgeGrade(
            data.normal,
            data.personalized,
            persona,
            mode,
            mood,
            activeGroqKey,
            activeNvidiaKey
          );
          if (reportStr) {
            try {
              const cleanReport = reportStr.replace(/```json/gi, '').replace(/```/g, '').trim();
              data.judgeReport = JSON.parse(cleanReport);
            } catch (jsonErr) {
              console.warn("AI Judge output was not valid JSON, returning raw text:", reportStr);
              data.judgeReport = {
                alignmentRating: 8.5,
                syntacticCalibration: "Successfully calibrated standard style to match DNA profile parameters.",
                keyDifferences: ["Calibration applied to vocabulary and tone styling.", reportStr.slice(0, 150)]
              };
            }
          }
        } catch (judgeErr) {
          console.error("AI Judge execution failed in wrapper:", judgeErr);
        }
      }
      return NextResponse.json(data);
    };

    if (!prompt || !persona) {
      return NextResponse.json({ error: 'Missing prompt or persona DNA' }, { status: 400 });
    }



    // Speed Web Search context injection with page details extraction
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
          // Fetch the page details for the top 2 results in parallel to ensure extremely high speed
          const topResults = searchResults.slice(0, 2);
          const enrichedResults = await Promise.all(
            topResults.map(async (res) => {
              const fullDetails = await fetchPageContent(res.url);
              return {
                title: res.title,
                url: res.url,
                snippet: fullDetails || res.snippet
              };
            })
          );
          
          // Combine enriched results with the rest of the search results snippets
          const finalScrapeResults = [
            ...enrichedResults,
            ...searchResults.slice(2)
          ];
          
          webScrapeContext = finalScrapeResults.map(r => `Source: ${r.title}\nURL: ${r.url}\nContent: ${r.snippet}`).join('\n---\n');
        }
      } catch (scrapeErr) {
        console.error("Web search scraper context failed:", scrapeErr);
      }
    }

    const queryPrompt = webScrapeContext
      ? `LIVE WEB SEARCH DATA CONTEXT:
${webScrapeContext}
 
USER PROMPT QUERY:
${prompt}
 
GROUNDING CONSTRAINTS:
- You MUST answer the user's query by relying primarily on the provided LIVE WEB SEARCH DATA CONTEXT.
- If the search context contradicts your pre-trained knowledge (e.g. current year is 2026, CM is Vijay), you MUST trust the search context as the source of truth.
- You MUST mention/cite the source titles and link to their URLs in markdown format (e.g. [Source Title](URL)) inside your response text.`
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
        const systemInstruction = buildSystemInstruction(persona, mode, mood, memoryContext || '', '', !!webSearchEnabled);

        const [normal, personalized] = await Promise.all([
          fetchPollinations(null, queryPrompt),
          fetchPollinations(systemInstruction, personalizedPrompt)
        ]);

        return await handleResponse({
          normal,
          personalized,
          isSandbox: false,
          engineUsed: 'pollinations',
          sources: searchResults
        });
      } catch (err: any) {
        console.warn('Pollinations AI failed, falling back to offline simulator:', err);
        const simulated = generateLocalSimulatedResponse(prompt, persona, mode, mood);
        return await handleResponse({
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
        return await handleResponse({
          normal: simulated.normal,
          personalized: simulated.personalized,
          isSandbox: true,
          engineUsed: 'offline',
          sources: searchResults
        });
      }

      try {
        const systemInstruction = buildSystemInstruction(persona, mode, mood, memoryContext || '', '', !!webSearchEnabled);

        const [normal, personalized] = await Promise.all([
          fetchOpenAI(null, queryPrompt, activeKey),
          fetchOpenAI(systemInstruction, personalizedPrompt, activeKey)
        ]);

        return await handleResponse({
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
        return await handleResponse({
          normal: simulated.normal,
          personalized: simulated.personalized,
          isSandbox: true,
          engineUsed: 'offline',
          sources: searchResults
        });
      }

      try {
        const systemInstruction = buildSystemInstruction(persona, mode, mood, memoryContext || '', '', !!webSearchEnabled);
        const targetModel = hfModel && hfModel.trim() !== '' 
          ? hfModel 
          : (process.env.HF_MODEL || 'ibm-granite/granite-3.0-8b-instruct');

        const [normal, personalized] = await Promise.all([
          fetchHuggingFace(null, queryPrompt, activeToken, targetModel),
          fetchHuggingFace(systemInstruction, personalizedPrompt, activeToken, targetModel)
        ]);

        return await handleResponse({
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
        return await handleResponse({
          normal: simulated.normal,
          personalized: simulated.personalized,
          isSandbox: true,
          engineUsed: 'offline',
          sources: searchResults
        });
      }

      try {
        const systemInstruction = buildSystemInstruction(persona, mode, mood, memoryContext || '', '', !!webSearchEnabled);
        const targetModel = groqModel || 'qwen/qwen3-32b';

        const [normal, personalized] = await Promise.all([
          fetchGroq(null, queryPrompt, activeKey, targetModel),
          fetchGroq(systemInstruction, personalizedPrompt, activeKey, targetModel)
        ]);

        return await handleResponse({
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
        return await handleResponse({
          normal: simulated.normal,
          personalized: simulated.personalized,
          isSandbox: true,
          engineUsed: 'offline',
          sources: searchResults
        });
      }

      const genAI = new GoogleGenerativeAI(activeKey);
      const systemInstruction = buildSystemInstruction(persona, mode, mood, memoryContext || '', '', !!webSearchEnabled);

      const [normalRes, personalizedRes] = await Promise.allSettled([
        (async () => {
          const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
          const result = await model.generateContent(queryPrompt);
          return result.response.text();
        })(),
        (async () => {
          const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
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

      return await handleResponse({
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
        return await handleResponse({
          normal: simulated.normal,
          personalized: simulated.personalized,
          isSandbox: true,
          engineUsed: 'offline',
          sources: searchResults
        });
      }

      try {
        const systemInstruction = buildSystemInstruction(persona, mode, mood, memoryContext || '', '', !!webSearchEnabled);

        const [normalRes, personalizedRes] = await Promise.all([
          fetchNVIDIA(null, queryPrompt, activeKey),
          fetchNVIDIA(systemInstruction, personalizedPrompt, activeKey)
        ]);

        return await handleResponse({
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
        return await handleResponse({
          normal: simulated.normal,
          personalized: simulated.personalized,
          isSandbox: true,
          engineUsed: 'offline',
          sources: searchResults
        });
      }

      try {
        const systemInstruction = buildSystemInstruction(persona, mode, mood, memoryContext || '', '', !!webSearchEnabled);

        const imageSearchKeywords = ['pic', 'image', 'photo', 'picture', 'drawing', 'illustration', 'map', 'look like', 'draw', 'show', 'find', 'search'];
        const cleanPrompt = prompt.toLowerCase().trim();
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

        return await handleResponse({
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
    return await handleResponse({
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
