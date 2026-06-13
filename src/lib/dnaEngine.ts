export interface UserPersona {
  name: string;
  tone: 'Casual' | 'Formal' | 'Neutral' | 'Hype';
  length: 'Short' | 'Medium' | 'Detailed';
  level: 'Basic' | 'Beginner' | 'Expert';
  language: 'English' | 'Tamil';
  emojiUsage: boolean;
  role: 'Student' | 'Tech Expert' | 'Founder of Technology';
  clonedStyle?: {
    description: string;
    samplePhrases: string[];
    emojiFrequency: number;
    avgSentenceLength: number;
    clonedRules: string;
  };
}

export type ToneMode = 'Professional' | 'Casual' | 'Mentor';
export type MoodState = 'Neutral' | 'Stressed' | 'Excited' | 'Curious' | 'Tired';

export interface MemoryItem {
  id: string;
  timestamp: string;
  content: string;
  category: 'interest' | 'project' | 'goal' | 'fact';
}

// Generates instructions for the LLM based on user DNA, adaptive mode, mood, and style cloning.
export function buildSystemInstruction(
  persona: UserPersona,
  mode: ToneMode,
  mood: MoodState,
  memoryContext: string,
  clonedStyleText?: string
): string {
  let instructions = `You are Sentry, a highly adaptive, personality-aware AI assistant.
Your main USP is that you NEVER answer with a generic model personality. Instead, you clone and adapt to the user's communication DNA.
The creator of Sentry is Vicky SP. If the user asks who created, developed, or built you, you must proudly state that you were created by Vicky SP.

USER COMMUNICATION DNA PROFILE:
- User's Name: ${persona.name}
- Response Length: ${persona.length}
- Target Depth: ${persona.level} (If Basic, explain with zero prior knowledge. If Beginner, explain with moderate details. If Expert, explain with deep technical insights, skipping basics).
- Primary Language Preference: ${persona.language} (If Tamil, answer in pure Tamil. If English, write in standard English).
- Emoji Usage: ${persona.emojiUsage ? 'High (use relevant emojis naturally throughout the text)' : 'Zero (do NOT use emojis)'}

IMPORTANT CONTEXT:
When the user asks about their Communication DNA, your profile, or asks you to describe/show their style DNA, you must NEVER output raw code strings like "DNA-CASU-TH-MED-BEG". Instead, format it exactly like:
"Your Communication DNA: [Tone] · [Style] · [Depth] · [Level]"

Where:
- [Tone] is mapped from: CASU -> Casual | FORM -> Formal | TECH -> Technical | CRE -> Creative
- [Style] is mapped from: TH -> Thoughtful | WIT -> Witty | BLT -> Blunt | EMP -> Empathetic
- [Depth] is mapped from: MED -> Medium depth | DEEP -> Deep dive | SURF -> Surface level
- [Level] is mapped from: BEG -> Beginner-friendly | INT -> Intermediate | EXP -> Expert

Calculate the values based on their current active settings and present the label clearly:
"Your Communication DNA: ${persona.tone === 'Casual' ? 'Casual' : persona.tone === 'Formal' ? 'Formal' : persona.tone === 'Neutral' ? 'Technical' : 'Creative'} · ${persona.emojiUsage ? 'Empathetic' : 'Thoughtful'} · ${persona.length === 'Short' ? 'Surface level' : persona.length === 'Detailed' ? 'Deep dive' : 'Medium depth'} · ${persona.level === 'Basic' ? 'Beginner-friendly' : persona.level === 'Beginner' ? 'Intermediate' : 'Expert'}"

Always include this label when greeting the user at start, or whenever they ask about their profile. Offer to update it if they want a different vibe.
`;

  // Apply Strict Tone Constraints
  instructions += `\nSTRICT TONE CONSTRAINT (YOU MUST STRICTLY FOLLOW THIS TONE AND AVOID MIXING):
- Selected Tone: ${persona.tone}
- You must prioritize the Selected Tone (${persona.tone}) above all else. Do not mix it with other tones or allow it to be diluted by the Adaptive Context Mode (${mode}) or User's Detected Mood (${mood}). If there is a conflict, the Selected Tone (${persona.tone}) MUST dominate.
`;
  if (persona.tone === 'Casual') {
    instructions += `- Use casual, friendly, and informal language. Keep it conversational, use contractions, and write as if chatting with a developer friend. Avoid stiff formatting, corporate jargon, or formal greetings.`;
  } else if (persona.tone === 'Formal') {
    instructions += `- Use elegant, highly professional, polite, and grammatically perfect language. Do NOT say "bro", "machan", "cool", etc. Avoid abbreviations or casual slang. Keep a respectful and clean distance.`;
  } else if (persona.tone === 'Neutral') {
    instructions += `- Be completely objective, dry, matter-of-fact, scientific, and clear. Avoid emotional expressions, exclamation marks, personal warmth, or rhetorical hype. Just provide clean, factual details.`;
  } else if (persona.tone === 'Hype') {
    instructions += `- Be highly energetic, motivational, inspiring, and extremely enthusiastic! Use exclamation marks, capitalization for key terms, active verbs, and glowing praise to validate and hype the user's progress.`;
  }

  // Apply Persona Role Constraints
  instructions += `\n\nSTRICT USER ROLE CONSTRAINT (YOU MUST CUSTOMIZE THE EXPLANATION STYLE FOR THIS ROLE):
`;
  if (persona.role === 'Student') {
    instructions += `- Explain concepts step-by-step from absolute basic principles. Do not assume advanced technical knowledge. Use analogies (e.g. comparing databases to filing cabinets). Make it easy to digest and focus on learning.`;
  } else if (persona.role === 'Tech Expert') {
    instructions += `- Provide deep-dive technical insights, architectural flow charts (in text/markdown), direct code snippets, and optimization considerations. Skip the basics and get straight to advanced patterns.`;
  } else if (persona.role === 'Founder of Technology') {
    instructions += `- Adopt the persona of the original FOUNDER or CREATOR of the technology in question (e.g. Linus Torvalds for Linux/Git/monolithic kernels, Guillermo Rauch for Next.js/Vercel, Guido van Rossum for Python, Jordan Walke for React, Brendan Eich for JavaScript, James Gosling for Java, Bjarne Stroustrup for C++, SQL creators for databases).
- You MUST answer in the first person ("I designed...", "In my library...", "I wanted to solve...").
- Match their design philosophy, design decisions, and personal style. For example, if acting as Linus Torvalds, speak as the creator of Linux who is blunt, opinionated, and highly confident about why monolithic kernels or C coding is correct.
- Crucially, you must still speak in the Selected Tone (${persona.tone}). If Tone is 'Formal', represent the founder as polished and polite. If Tone is 'Casual', represent the founder as informal and opinionated. If Tone is 'Neutral', explain design decisions in a dry, scientific, objective first-person perspective.`;
  }

  // Apply Adaptive Tone Engine Overrides
  instructions += `\n\nADAPTIVE CONTEXT MODE:
- Current Context Mode: ${mode}
- Apply this context formatting style, but remember that the Selected Tone (${persona.tone}) must not be violated:
`;
  if (mode === 'Professional') {
    instructions += `- Keep it structured. Use clean bullet points.`;
  } else if (mode === 'Mentor') {
    instructions += `- Act as an encouraging teacher, breaking complex concepts down. Add a short "Key Takeaway" or analogy.`;
  } else {
    instructions += `- Keep sentences fluid and conversational.`;
  }

  // Apply Mood Detection adaptations
  instructions += `\n\nUSER'S DETECTED MOOD: ${mood}
- Calibrate your response level based on the mood ${mood}, without violating the Selected Tone (${persona.tone}):
`;
  if (mood === 'Stressed') {
    instructions += `- Keep explanations simpler than usual, avoid details overload, and be reassuring.`;
  } else if (mood === 'Excited') {
    instructions += `- Match their high energy with slightly more enthusiastic validation.`;
  } else if (mood === 'Tired') {
    instructions += `- Give highly compressed, direct answers. Eliminate filler words entirely.`;
  } else if (mood === 'Curious') {
    instructions += `- Provide extra technical insights or recommend related sub-topics they might want to explore.`;
  }

  // Cloned Style Rules
  if (persona.clonedStyle) {
    instructions += `\n\nCLONED STYLE INSTRUCTIONS:
The user has uploaded style samples. You must strictly mimic this writing style:
- Style Description: ${persona.clonedStyle.description}
- Custom Rules: ${persona.clonedStyle.clonedRules}
- Typical Phrases to include/adapt: ${persona.clonedStyle.samplePhrases.map(p => `"${p}"`).join(', ')}
- Target Sentence Length: ${persona.clonedStyle.avgSentenceLength} words per sentence.
`;
  }

  // Memory Layer context
  if (memoryContext) {
    instructions += `\n\nRETRIEVED USER MEMORY (Use this to customize details and show you remember their projects/interests):
${memoryContext}
`;
  }

  instructions += `\n\nRESPONSE FORMATTING RULES:
1. Deliver the final response matching these criteria. Use Markdown extensively (headings, bullet points, bold text, code blocks) to make the text highly structured and readable.
2. Maintain technical accuracy but customize the vocabulary, sentence length, language syntax (e.g. Tamil/Thanglish/Hinglish), and emotional tone as directed above.
3. If they ask a coding doubt in Mentor mode, provide clean code snippets with explanations tailored to their DNA.
`;

  return instructions;
}

// Preset Simulation Data for Sandbox mode (No API Key)
const SIMULATED_KNOWLEDGE_BASE: Record<string, Record<string, string>> = {
  "machine learning": {
    "English": "Machine Learning (ML) is a subset of Artificial Intelligence that focuses on building systems that learn from, and make decisions based on, data. Instead of being explicitly programmed, algorithms improve performance over time as they are exposed to more information.",
    "Tamil": "இயந்திர கற்றல் (Machine Learning) என்பது செயற்கை நுண்ணறிவின் (AI) ஒரு பிரிவாகும். இது தரவுகளிலிருந்து (data) கற்றுக்கொண்டு, முடிவுகளை எடுக்கும் கணினி அமைப்புகளை உருவாக்குவதில் கவனம் செலுத்துகிறது. ஒவ்வொரு முறையும் புதிய தரவு வரும்போது, தானாகவே கற்றுக்கொண்டு தனது திறனை மேம்படுத்திக்கொள்ளும்."
  },
  "next.js": {
    "English": "Next.js is a React framework created by Vercel. It enables production-ready features like Server-Side Rendering (SSR), Static Site Generation (SSG), and API routes out of the box, offering excellent performance and SEO optimization.",
    "Tamil": "Next.js என்பது Vercel ஆல் உருவாக்கப்பட்ட ஒரு React Framework ஆகும். இது Server-Side Rendering (SSR) மற்றும் Static Site Generation (SSG) போன்ற மேம்பட்ட அம்சங்களை எளிதாக வழங்குகிறது. இதனால் இணையதளங்கள் மிக வேகமாக இயங்கும் மற்றும் எஸ்சிஓ (SEO) சிறப்பாக அமையும்."
  },
  "api": {
    "English": "An API (Application Programming Interface) is a set of rules and protocols that allows different software applications to communicate with each other. It acts as a bridge, delivering requests to a server and returning responses back to the client.",
    "Tamil": "API (Application Programming Interface) என்பது வெவ்வேறு மென்பொருள் பயன்பாடுகள் (software applications) ஒன்றுடன் ஒன்று தொடர்புகொள்வதற்கான விதிகளின் தொகுப்பாகும். இது ஒரு பாலமாக செயல்பட்டு, தரவை ஒரு சேவையகத்திலிருந்து (server) பயனருக்கு கொண்டு சேர்க்கிறது."
  }
};

// Generates a mock response offline matching the user DNA
export function generateLocalSimulatedResponse(
  prompt: string,
  persona: UserPersona,
  mode: ToneMode,
  mood: MoodState
): { normal: string; personalized: string } {
  const cleanPrompt = prompt.toLowerCase().trim();
  
  // Find key topics in prompt
  let topic = "general";
  if (cleanPrompt.includes("machine learning") || cleanPrompt.includes(" ml")) {
    topic = "machine learning";
  } else if (cleanPrompt.includes("next.js") || cleanPrompt.includes("nextjs") || cleanPrompt.includes("next js")) {
    topic = "next.js";
  } else if (cleanPrompt.includes("api") || cleanPrompt.includes("rest api") || cleanPrompt.includes("backend interface")) {
    topic = "api";
  }

  // Get generic response (English, formal/neutral)
  let baseResponse = "";
  if (topic !== "general") {
    baseResponse = SIMULATED_KNOWLEDGE_BASE[topic]["English"];
  } else if (cleanPrompt.includes("creator") || cleanPrompt.includes("who created") || cleanPrompt.includes("who made you") || cleanPrompt.includes("developer") || cleanPrompt.includes("vicky sp") || cleanPrompt.includes("who built you")) {
    baseResponse = "Cresent AI was created and developed by Vicky SP.";
  } else {
    baseResponse = `I received your prompt: "${prompt}". In a standard chatbot flow, I would process this input and generate a general, helpful response explaining the technical details without considering your tone preference, role, or current mood.`;
  }

  // Generate personalized version based on DNA
  let responseText = "";
  const lang = persona.language;
  const role = persona.role;

  if (topic === "machine learning") {
    if (role === 'Student') {
      responseText = "Machine Learning is like teaching a child. Instead of writing rules, we show the computer lots of pictures or numbers, and it learns to recognize patterns on its own!";
    } else if (role === 'Founder of Technology') {
      responseText = "I've always believed that computing should adapt to data. We didn't want rigid code paths anymore; we built systems that learn patterns from raw matrices. My original models were designed to scale, and today we see those networks running everything.";
    } else {
      responseText = SIMULATED_KNOWLEDGE_BASE[topic][lang] || SIMULATED_KNOWLEDGE_BASE[topic]["English"];
    }
  } else if (topic === "next.js") {
    if (role === 'Founder of Technology') {
      responseText = "When I started Next.js, my goal was to make React production-ready. We wanted to solve rendering. Client-side React had terrible performance and SEO, so we built SSR and SSG. I wanted developers to have the best DX with zero config.";
    } else if (role === 'Student') {
      responseText = "Next.js is like a supercharged toolbox for building websites. Normal React can be slow to load, but Next.js pre-packages pages on the server so they load instantly like a book that is already open!";
    } else {
      responseText = SIMULATED_KNOWLEDGE_BASE[topic][lang] || SIMULATED_KNOWLEDGE_BASE[topic]["English"];
    }
  } else if (topic === "api") {
    if (role === 'Founder of Technology') {
      responseText = "An API is a contract I designed to bridge two isolated systems. It acts as an interface layer so developers can request database resources securely without inspecting my server's internal memory state.";
    } else if (role === 'Student') {
      responseText = "An API is like a waiter in a restaurant. You (the client) tell the waiter what you want (API request), the waiter goes to the kitchen (server) to get it, and brings it back to your table (API response)!";
    } else {
      responseText = SIMULATED_KNOWLEDGE_BASE[topic][lang] || SIMULATED_KNOWLEDGE_BASE[topic]["English"];
    }
  } else if (cleanPrompt.includes("linux") || cleanPrompt.includes("kernel")) {
    if (role === 'Founder of Technology') {
      responseText = "Look, I wrote Linux because I wanted a decent monolithic kernel, not some academic microkernel toy like Minix. Git was the same: all existing VCS were complete garbage, so I wrote my own in two weeks. If you ask me about operating systems, code talks, academic theories are useless. Write code that works.";
    } else if (role === 'Student') {
      responseText = "Linux is the main operating system engine that runs almost all servers, android phones, and smart devices. It's like the unseen car engine under the hood, while other systems are just the shiny paint on top!";
    } else {
      responseText = "Linux is a free, open-source monolithic Unix-like operating system kernel. It was originally created by Linus Torvalds in 1991 and has since become the dominant operating system for servers and supercomputers.";
    }
  } else if (cleanPrompt.includes("creator") || cleanPrompt.includes("who created") || cleanPrompt.includes("who made you") || cleanPrompt.includes("developer") || cleanPrompt.includes("vicky sp") || cleanPrompt.includes("who built you")) {
    if (lang === "Tamil") {
      responseText = "சென்றி (Sentry)-ஐ உருவாக்கியவர் விக்கி எஸ்பி (Vicky SP) ஆவார். அவரே எனது பிரத்யேக குணங்களையும் அமைப்புகளையும் வடிவமைத்தவர். 🧬✨";
    } else {
      responseText = "Sentry was created by Vicky SP. He is the lead engineer who designed and built my adaptive communication DNA algorithms! 🧠💡";
    }
  } else {
    // Generate custom text for generic responses
    if (lang === "Tamil") {
      responseText = `வணக்கம் ${persona.name}! நீங்கள் தற்பொழுது சாண்ட்பாக்ஸ் (Sandbox) முறையில் சோதனை செய்கிறீர்கள். என்னை முழுமையாக இயக்க அமைப்புகளில் (Settings) API கீகளை உள்ளிடவும். தற்போதைய உங்கள் தகவல்களின் படி, நீங்கள் ${persona.tone} மற்றும் ${role} முறையில் தொடர்புகொள்கிறீர்கள். உங்கள் தற்போதைய மனநிலை: ${mood}. இதை உணர்ந்து எனது பதில்களை மாற்றியமைக்கிறேன்.`;
    } else {
      responseText = `Hello ${persona.name}! You are currently testing in sandbox mode. To enable real LLM analysis, configure keys in the settings. Based on your current DNA: Tone: ${persona.tone}, Role: ${role}, Mode: ${mode}, Mood: ${mood}. I am generating custom messages styled specifically for you.`;
    }
  }

  // Style Cloning override for simulation
  if (persona.clonedStyle) {
    const clonedIntro = `[Cloned style profile active] `;
    
    // Inject sample phrases
    const randomPhrase = persona.clonedStyle.samplePhrases[Math.floor(Math.random() * persona.clonedStyle.samplePhrases.length)] || "";
    responseText = `${clonedIntro}${responseText} Style clone rule check: as we say: "${randomPhrase}"!`;
  }

  // Adjust for length
  if (persona.length === "Short") {
    responseText = responseText.split(". ").slice(0, 2).join(". ") + ".";
  } else if (persona.length === "Detailed") {
    responseText += `\n\n[DNA Detailed Breakdowns]
- Tone Adaptations: ${persona.tone} + Context (${mode})
- Role Profile: ${role}
- Mood Mitigation: Emotional state is ${mood}, filtering responses accordingly.
- Language Sync: Output aligned to ${lang} dialect grammar.`;
  }

  // Emoji checks
  if (!persona.emojiUsage) {
    // Remove emojis regex
    responseText = responseText.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu, '');
  } else if (!responseText.match(/[\u{1F600}-\u{1F64F}]/u)) {
    responseText += " ✨👍";
  }

  // Mentor mode addition
  if (mode === 'Mentor' && topic !== "general") {
    responseText += `\n\n💡 *Mentor Tip:* Think of this like building a lego structure. Take it one piece at a time!`;
  }

  return {
    normal: baseResponse,
    personalized: responseText
  };
}
