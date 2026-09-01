import type { ChatMessage, ChatRole } from './ai-provider.port.js';

export type PromptVariableType = 'string' | 'number' | 'boolean';

export interface PromptVariable {
  name: string;
  type: PromptVariableType;
  required?: boolean | undefined;
  description?: string | undefined;
}

export interface PromptMetadata {
  description?: string | undefined;
  tags?: string[] | undefined;
  author?: string | undefined;
  createdAt?: string | undefined;
}

export interface PromptMessageTemplate {
  role: ChatRole;
  content: string;
}

export interface PromptTemplate {
  name: string;
  version: string;
  description?: string | undefined;
  metadata?: PromptMetadata | undefined;
  modelSelector?: string[] | undefined;
  variables: PromptVariable[];
  messages: PromptMessageTemplate[];
}

export interface GoldenCase {
  id: string;
  promptName: string;
  version?: string | undefined;
  variables: Record<string, unknown>;
  expectedContains?: string | undefined;
  expected?: string | undefined;
}

export interface EvaluationCaseResult {
  id: string;
  passed: boolean;
  actual: string;
  expected: string;
}

export interface EvaluationResult {
  total: number;
  passed: number;
  failed: number;
  cases: EvaluationCaseResult[];
}

export interface PromptPort {
  get(name: string, version?: string | undefined): Promise<PromptTemplate | null>;
  list(): Promise<PromptTemplate[]>;
  render(
    name: string,
    variables: Record<string, unknown>,
    version?: string | undefined,
  ): Promise<ChatMessage[]>;
  evaluate(cases: GoldenCase[]): Promise<EvaluationResult>;
}
