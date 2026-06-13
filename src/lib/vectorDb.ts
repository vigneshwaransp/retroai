/**
 * Lightweight, client-side Vector Database Simulation
 * Uses Term Frequency - Inverse Document Frequency (TF-IDF) cosine similarity
 * for semantic-style retrieval of patterns.
 * Stores user conversations and learns patterns recursively.
 */

export interface VectorDocument {
  id: string;
  query: string;
  response: string;
  timestamp: string;
  tags: string[];
  vector?: Record<string, number>;
}

// Common stopwords to filter for better TF-IDF relevance
const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'cant', 'cannot', 'could',
  'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down', 'during', 'each', 'few', 'for', 'from', 'further',
  'had', 'hadnt', 'has', 'hasnt', 'have', 'havent', 'having', 'he', 'hed', 'hell', 'hes', 'her', 'here', 'heres',
  'hers', 'herself', 'him', 'himself', 'his', 'how', 'hows', 'i', 'id', 'ill', 'im', 'ive', 'if', 'in', 'into', 'is',
  'isnt', 'it', 'its', 'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself', 'no', 'nor', 'not', 'of',
  'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same',
  'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some', 'such', 'than', 'that', 'thats',
  'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres', 'these', 'they', 'theyd', 'theyll',
  'theyre', 'theyve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasnt',
  'we', 'wed', 'well', 'were', 'weve', 'werent', 'what', 'whats', 'when', 'whens', 'where', 'wheres', 'which',
  'while', 'who', 'whos', 'whom', 'why', 'whys', 'with', 'wont', 'would', 'wouldnt', 'you', 'youd', 'youll',
  'youre', 'youve', 'your', 'yours', 'yourself', 'yourselves'
]);

// Basic suffix stemmer to improve match rates
function stem(word: string): string {
  if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
  if (word.endsWith('sses')) return word.slice(0, -2);
  if (word.endsWith('sing')) return word.slice(0, -4);
  if (word.endsWith('ing')) return word.slice(0, -3);
  if (word.endsWith('ers')) return word.slice(0, -3);
  if (word.endsWith('ed')) return word.slice(0, -2);
  if (word.endsWith('ly')) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('us') && !word.endsWith('is')) return word.slice(0, -1);
  return word;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 1 && !STOPWORDS.has(token))
    .map(stem);
}

function cosineSimilarity(vecA: Record<string, number>, vecB: Record<string, number>): number {
  const intersection = Object.keys(vecA).filter(x => Object.keys(vecB).includes(x));
  if (intersection.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  Object.values(vecA).forEach(val => normA += val * val);
  Object.values(vecB).forEach(val => normB += val * val);

  intersection.forEach(key => {
    dotProduct += vecA[key] * vecB[key];
  });

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class SimpleVectorDB {
  private documents: VectorDocument[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('cresent_vector_db');
      if (stored) {
        this.documents = JSON.parse(stored);
        this.recomputeAllVectors();
      }
    } catch (e) {
      console.error('Failed to load Vector DB from storage', e);
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('cresent_vector_db', JSON.stringify(this.documents));
    } catch (e) {
      console.error('Failed to save Vector DB to storage', e);
    }
  }

  // Compute IDF dynamically across the current document corpus
  private computeCorpusIDF(): Record<string, number> {
    const N = this.documents.length;
    const df: Record<string, number> = {};
    
    this.documents.forEach(doc => {
      const tokens = new Set(tokenize(doc.query));
      tokens.forEach(t => {
        df[t] = (df[t] || 0) + 1;
      });
    });

    const idf: Record<string, number> = {};
    Object.keys(df).forEach(t => {
      // Smooth IDF formula to prevent division by zero
      idf[t] = Math.log(1 + (N / df[t]));
    });

    return idf;
  }

  // Compute TF-IDF vector for a set of tokens using computed IDF
  private computeTFIDF(tokens: string[], idf: Record<string, number>): Record<string, number> {
    const tf: Record<string, number> = {};
    if (tokens.length === 0) return tf;

    tokens.forEach(token => {
      tf[token] = (tf[token] || 0) + 1;
    });

    const total = tokens.length;
    const tfidf: Record<string, number> = {};

    Object.keys(tf).forEach(key => {
      const termTF = tf[key] / total;
      // Default IDF fallback for queries with out-of-vocabulary terms
      const termIDF = idf[key] !== undefined ? idf[key] : Math.log(1 + this.documents.length);
      tfidf[key] = termTF * termIDF;
    });

    return tfidf;
  }

  // Recomputes TF-IDF representation dynamically
  private recomputeAllVectors() {
    const idf = this.computeCorpusIDF();
    this.documents.forEach(doc => {
      doc.vector = this.computeTFIDF(tokenize(doc.query), idf);
    });
  }

  public insert(query: string, response: string, tags: string[] = []): VectorDocument {
    // Temp document to run recomputation
    const doc: VectorDocument = {
      id: Math.random().toString(36).substring(2, 11),
      query,
      response,
      timestamp: new Date().toISOString(),
      tags
    };

    // Prevent duplicate exact queries
    const existingIdx = this.documents.findIndex(d => d.query.toLowerCase().trim() === query.toLowerCase().trim());
    if (existingIdx !== -1) {
      this.documents[existingIdx] = doc;
    } else {
      this.documents.push(doc);
    }

    // Cap at 100 entries to maintain memory budget
    if (this.documents.length > 100) {
      this.documents.shift();
    }

    // Recompute with the new corpus
    this.recomputeAllVectors();
    this.saveToStorage();
    
    // Return document
    return this.documents.find(d => d.query === query) || doc;
  }

  public search(query: string, topK: number = 3): { document: VectorDocument; score: number }[] {
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0 || this.documents.length === 0) return [];
    
    const idf = this.computeCorpusIDF();
    const queryVector = this.computeTFIDF(queryTokens, idf);
    
    const results = this.documents.map(doc => {
      // Ensure vector is updated
      const docVector = doc.vector || this.computeTFIDF(tokenize(doc.query), idf);
      const score = cosineSimilarity(queryVector, docVector);
      return { document: doc, score };
    });

    // Tune threshold to 0.15 (optimized from Youden index evaluation)
    return results
      .filter(r => r.score >= 0.15)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  public getAll(): VectorDocument[] {
    return [...this.documents];
  }

  public clear() {
    this.documents = [];
    this.saveToStorage();
  }

  public deleteItem(id: string) {
    this.documents = this.documents.filter(doc => doc.id !== id);
    this.recomputeAllVectors();
    this.saveToStorage();
  }
}
