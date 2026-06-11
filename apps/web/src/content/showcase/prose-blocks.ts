export function parseNonEmptyLines(text: string): readonly string[] {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.length > 1 ? lines : [];
}

export function chunkSentences(text: string, maxChars: number): readonly string[] {
  const sentences = splitSentences(text);
  if (sentences.length <= 1) {
    return splitOversizedChunk(text, maxChars);
  }

  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const candidate = current.length > 0 ? `${current} ${sentence}` : sentence;

    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current.length > 0) {
      chunks.push(current);
      current = "";
    }

    if (sentence.length <= maxChars) {
      current = sentence;
      continue;
    }

    chunks.push(...splitOversizedChunk(sentence, maxChars));
  }

  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks;
}

function splitSentences(text: string): readonly string[] {
  const sentences = text
    .split(/(?<=[.!?…])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);

  return sentences.length > 0 ? sentences : [text];
}

function splitOversizedChunk(text: string, maxChars: number): readonly string[] {
  if (text.length <= maxChars) {
    return [text];
  }

  const words = text.split(/\s+/).filter((word) => word.length > 0);
  if (words.length <= 1) {
    return [text];
  }

  const chunks: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current.length > 0 ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current.length > 0) {
      chunks.push(current);
    }
    current = word;
  }

  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks.length > 0 ? chunks : [text];
}
