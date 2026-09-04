import { PromptError } from '@email-ia/core';
import type {
  AIProviderPort,
  ChatMessage,
  GoldenCase,
  EvaluationResult,
  PromptPort,
  PromptTemplate,
} from '@email-ia/core';

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((n) => Number.parseInt(n, 10));
  const pb = b.split('.').map((n) => Number.parseInt(n, 10));
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const av = pa[i] ?? 0;
    const bv = pb[i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

function interpolate(template: string, variables: Record<string, unknown>): string {
  return template.replaceAll(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => {
    const v = variables[key];
    if (v === undefined || v === null) return '';
    return String(v);
  });
}

function validateVariables(tpl: PromptTemplate, variables: Record<string, unknown>): void {
  for (const v of tpl.variables) {
    const val = variables[v.name];
    if (v.required && (val === undefined || val === null || val === '')) {
      throw new PromptError(`Missing required variable: ${v.name}`, {
        variable: v.name,
      });
    }
    if (val !== undefined && val !== null && val !== '') {
      const t = typeof val;
      if (v.type === 'string' && t !== 'string') {
        throw new PromptError(`Variable ${v.name} expected string got ${t}`, {
          variable: v.name,
        });
      }
      if (v.type === 'number' && t !== 'number') {
        throw new PromptError(`Variable ${v.name} expected number got ${t}`, {
          variable: v.name,
        });
      }
      if (v.type === 'boolean' && t !== 'boolean') {
        throw new PromptError(`Variable ${v.name} expected boolean got ${t}`, {
          variable: v.name,
        });
      }
    }
  }
}

export class PromptService implements PromptPort {
  private readonly byName = new Map<string, PromptTemplate[]>();

  constructor(
    templates: PromptTemplate[],
    private readonly ai: AIProviderPort | null = null,
  ) {
    for (const t of templates) {
      const arr = this.byName.get(t.name) ?? [];
      arr.push(t);
      this.byName.set(t.name, arr);
    }
    for (const [, arr] of this.byName) {
      arr.sort((a, b) => compareVersions(a.version, b.version));
    }
  }

  async get(name: string, version?: string | undefined): Promise<PromptTemplate | null> {
    const arr = this.byName.get(name);
    if (!arr || arr.length === 0) return null;
    if (version !== undefined) {
      return arr.find((t) => t.version === version) ?? null;
    }
    return arr[arr.length - 1] ?? null;
  }

  async list(): Promise<PromptTemplate[]> {
    const all: PromptTemplate[] = [];
    for (const arr of this.byName.values()) all.push(...arr);
    return all;
  }

  async render(
    name: string,
    variables: Record<string, unknown>,
    version?: string | undefined,
  ): Promise<ChatMessage[]> {
    const tpl = await this.get(name, version);
    if (!tpl) throw new PromptError(`Prompt not found: ${name}@${version ?? 'latest'}`);
    validateVariables(tpl, variables);
    return tpl.messages.map((m) => ({
      role: m.role,
      content: interpolate(m.content, variables),
    }));
  }

  async evaluate(cases: GoldenCase[]): Promise<EvaluationResult> {
    if (!this.ai) throw new PromptError('AI provider not configured for evaluation');
    if (cases.length === 0) return { total: 0, passed: 0, failed: 0, cases: [] };
    const results: EvaluationResult['cases'] = [];
    let passed = 0;
    for (const c of cases) {
      const messages = await this.render(c.promptName, c.variables, c.version);
      let actual = '';
      try {
        const res = await this.ai.chat(messages);
        actual = res.content;
      } catch (e) {
        if (e instanceof PromptError) throw e;
        throw new PromptError('Failed to evaluate prompt', e);
      }
      const expected = c.expected ?? c.expectedContains ?? '';
      const ok =
        c.expected !== undefined
          ? actual === c.expected
          : c.expectedContains !== undefined
            ? actual.toLowerCase().includes(c.expectedContains.toLowerCase())
            : true;
      if (ok) passed++;
      results.push({ id: c.id, passed: ok, actual, expected });
    }
    return { total: cases.length, passed, failed: cases.length - passed, cases: results };
  }
}
