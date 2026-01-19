import { pipeline, type FeatureExtractionPipeline } from '@xenova/transformers';

let embeddingPipeline: FeatureExtractionPipeline | null = null;
let initializationPromise: Promise<void> | null = null;

export async function initializeEmbeddings(): Promise<void> {
  if (embeddingPipeline) return;

  // Prevent multiple concurrent initializations
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    console.log('[Embeddings] Loading model...');
    const startTime = Date.now();

    embeddingPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',
      { quantized: true }
    );

    const elapsed = Date.now() - startTime;
    console.log(`[Embeddings] Model loaded in ${elapsed}ms`);
  })();

  return initializationPromise;
}

export async function generateEmbedding(text: string): Promise<Float32Array> {
  if (!embeddingPipeline) {
    await initializeEmbeddings();
  }

  // Truncate text if too long (model max is ~512 tokens)
  const truncated = text.slice(0, 2000);

  const output = await embeddingPipeline!(truncated, {
    pooling: 'mean',
    normalize: true
  });

  return new Float32Array(output.data as Float32Array);
}

export async function generateEmbeddings(texts: string[]): Promise<Float32Array[]> {
  return Promise.all(texts.map(t => generateEmbedding(t)));
}

export function isEmbeddingModelLoaded(): boolean {
  return embeddingPipeline !== null;
}

export function getEmbeddingDimensions(): number {
  return 384; // all-MiniLM-L6-v2 produces 384-dimensional embeddings
}
