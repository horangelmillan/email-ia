export interface LocalModelInfo {
  id: string;
  path: string;
  sizeBytes?: number;
}

export interface PullProgress {
  completed: number;
  total?: number;
  status?: string;
}

export type PullProgressCallback = (progress: PullProgress) => void;

export interface ModelManagerPort {
  listLocalModels(): Promise<LocalModelInfo[]>;
  pullModel(name: string, onProgress?: PullProgressCallback): Promise<LocalModelInfo>;
  removeModel(name: string): Promise<void>;
  getModelPath(name: string): Promise<string | null>;
}
