/**
 * Client-side search using TF-IDF cosine similarity.
 *
 * No external dependencies — a lightweight ~100-line implementation
 * that ranks conversations by relevance to a search query.
 */

/** Tokenise text into lowercase word tokens. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/** Compute term frequency for a token array. */
function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  // Normalise by total token count
  for (const [term, count] of tf) {
    tf.set(term, count / tokens.length);
  }
  return tf;
}

/**
 * Compute inverse document frequency for a set of documents.
 *
 * @param documents - Array of token arrays (one per document).
 * @returns Map of term → IDF value.
 */
function inverseDocFrequency(documents: string[][]): Map<string, number> {
  const idf = new Map<string, number>();
  const n = documents.length;

  // Count how many documents contain each term
  const docCount = new Map<string, number>();
  for (const tokens of documents) {
    const seen = new Set(tokens);
    for (const term of seen) {
      docCount.set(term, (docCount.get(term) || 0) + 1);
    }
  }

  for (const [term, count] of docCount) {
    idf.set(term, Math.log((n + 1) / (count + 1)) + 1);
  }

  return idf;
}

/** Compute cosine similarity between two TF-IDF vectors. */
function cosineSimilarity(
  vecA: Map<string, number>,
  vecB: Map<string, number>
): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const [term, weightA] of vecA) {
    const weightB = vecB.get(term) || 0;
    dotProduct += weightA * weightB;
    normA += weightA * weightA;
  }

  for (const [, weightB] of vecB) {
    normB += weightB * weightB;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

export interface SearchResult {
  conversationId: string;
  score: number;
}

/**
 * Search conversations by query using TF-IDF cosine similarity.
 *
 * @param query - The search query string.
 * @param corpus - Array of { id, text } objects representing conversations.
 * @returns Ranked array of SearchResult, highest score first.
 */
export function searchConversations(
  query: string,
  corpus: { id: string; text: string }[]
): SearchResult[] {
  if (!query.trim() || corpus.length === 0) return [];

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  // Tokenise all documents
  const docTokens = corpus.map((doc) => tokenize(doc.text));

  // Include the query as a "document" for IDF calculation
  const allDocs = [...docTokens, queryTokens];
  const idf = inverseDocFrequency(allDocs);

  // Compute TF-IDF vector for the query
  const queryTF = termFrequency(queryTokens);
  const queryVec = new Map<string, number>();
  for (const [term, tf] of queryTF) {
    queryVec.set(term, tf * (idf.get(term) || 0));
  }

  // Score each document
  const results: SearchResult[] = [];
  for (let i = 0; i < corpus.length; i++) {
    const docTF = termFrequency(docTokens[i]);
    const docVec = new Map<string, number>();
    for (const [term, tf] of docTF) {
      docVec.set(term, tf * (idf.get(term) || 0));
    }

    const score = cosineSimilarity(queryVec, docVec);
    if (score > 0.01) {
      results.push({ conversationId: corpus[i].id, score });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  return results;
}
