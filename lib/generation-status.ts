export type GenerationStatus = {
  status: 'processing' | 'complete' | 'failed';
  images: string[];
  error?: string;
  updatedAt: number;
};

const generationStatusStore = new Map<string, GenerationStatus>();

export function setGenerationStatus(sessionId: string, status: GenerationStatus) {
  generationStatusStore.set(sessionId, status);
  return status;
}

export function getGenerationStatus(sessionId: string) {
  return generationStatusStore.get(sessionId);
}
