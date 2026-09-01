import { describe, expect, it, vi } from 'vitest';
import { PromptService } from './prompt.service.js';
import { PromptError } from '@email-ia/core';
import type { AIProviderPort, PromptTemplate } from '@email-ia/core';

function makeTemplates(): PromptTemplate[] {
  return [
    {
      name: 'summarize-email',
      version: '1.0.0',
      description: 'v1',
      variables: [
        { name: 'subject', type: 'string', required: false },
        { name: 'body', type: 'string', required: true },
      ],
      messages: [
        { role: 'system', content: 'Resume:' },
        { role: 'user', content: 'Asunto: {{subject}} Cuerpo: {{body}}' },
      ],
    },
    {
      name: 'summarize-email',
      version: '1.1.0',
      variables: [
        { name: 'subject', type: 'string', required: false },
        { name: 'body', type: 'string', required: true },
        { name: 'tone', type: 'string', required: false },
      ],
      messages: [{ role: 'user', content: 'Tone {{tone}}: {{body}}' }],
    },
    {
      name: 'classify-email',
      version: '1.0.0',
      variables: [
        { name: 'subject', type: 'string', required: true },
        { name: 'priority', type: 'number', required: false },
      ],
      messages: [{ role: 'user', content: 'Subj {{subject}} prio {{priority}}' }],
    },
  ];
}

function fakeAi(responses: string[]): AIProviderPort {
  let i = 0;
  return {
    chat: vi.fn(async () => ({ content: responses[i++] ?? '', model: 'fake' })),
    embed: vi.fn(async () => []),
    listModels: vi.fn(async () => []),
    pullModel: vi.fn(async () => {}),
  } as unknown as AIProviderPort;
}

describe('PromptService', () => {
  it('get returns latest when version omitted', async () => {
    const svc = new PromptService(makeTemplates());
    const tpl = await svc.get('summarize-email');
    expect(tpl?.version).toBe('1.1.0');
  });

  it('get returns specific version', async () => {
    const svc = new PromptService(makeTemplates());
    const tpl = await svc.get('summarize-email', '1.0.0');
    expect(tpl?.version).toBe('1.0.0');
  });

  it('get returns null for unknown', async () => {
    const svc = new PromptService(makeTemplates());
    expect(await svc.get('unknown')).toBeNull();
  });

  it('list returns all templates', async () => {
    const svc = new PromptService(makeTemplates());
    const all = await svc.list();
    expect(all).toHaveLength(3);
  });

  it('render interpolates variables', async () => {
    const svc = new PromptService(makeTemplates());
    const msgs = await svc.render('summarize-email', { body: 'hola', subject: 'hi' }, '1.0.0');
    expect(msgs[1]?.content).toBe('Asunto: hi Cuerpo: hola');
  });

  it('render throws PromptError when required missing', async () => {
    const svc = new PromptService(makeTemplates());
    await expect(svc.render('summarize-email', {}, '1.0.0')).rejects.toBeInstanceOf(PromptError);
  });

  it('render throws on type mismatch', async () => {
    const svc = new PromptService(makeTemplates());
    await expect(
      svc.render('classify-email', { subject: 'hi', priority: 'high' as unknown as number }),
    ).rejects.toBeInstanceOf(PromptError);
  });

  it('render allows number variable correctly', async () => {
    const svc = new PromptService(makeTemplates());
    const msgs = await svc.render('classify-email', { subject: 'hi', priority: 5 });
    expect(msgs[0]?.content).toContain('5');
  });

  it('render throws when prompt not found', async () => {
    const svc = new PromptService(makeTemplates());
    await expect(svc.render('nope', {})).rejects.toBeInstanceOf(PromptError);
  });

  it('evaluate checks expectedContains case-insensitive', async () => {
    const ai = fakeAi(['Esta es una reunión importante', 'otra cosa']);
    const svc = new PromptService(makeTemplates(), ai);
    const result = await svc.evaluate([
      {
        id: 'c1',
        promptName: 'summarize-email',
        version: '1.0.0',
        variables: { body: 'x' },
        expectedContains: 'reunión',
      },
      {
        id: 'c2',
        promptName: 'summarize-email',
        version: '1.0.0',
        variables: { body: 'y' },
        expectedContains: 'nope',
      },
    ]);
    expect(result.total).toBe(2);
    expect(result.passed).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.cases[0]?.passed).toBe(true);
  });

  it('evaluate checks exact expected', async () => {
    const ai = fakeAi(['hello']);
    const svc = new PromptService(makeTemplates(), ai);
    const res = await svc.evaluate([
      {
        id: 'c1',
        promptName: 'summarize-email',
        version: '1.0.0',
        variables: { body: 'x' },
        expected: 'hello',
      },
    ]);
    expect(res.passed).toBe(1);
  });

  it('evaluate throws if AI not configured', async () => {
    const svc = new PromptService(makeTemplates(), null);
    await expect(
      svc.evaluate([{ id: '1', promptName: 'summarize-email', variables: { body: 'x' } }]),
    ).rejects.toBeInstanceOf(PromptError);
  });

  it('evaluate returns empty for no cases', async () => {
    const ai = fakeAi([]);
    const svc = new PromptService(makeTemplates(), ai);
    const res = await svc.evaluate([]);
    expect(res.total).toBe(0);
  });

  it('handles version semver ordering 1.1.0 > 1.0.10', async () => {
    const templates: PromptTemplate[] = [
      {
        name: 'a',
        version: '1.0.10',
        variables: [],
        messages: [{ role: 'user', content: 'v1010' }],
      },
      { name: 'a', version: '1.0.2', variables: [], messages: [{ role: 'user', content: 'v102' }] },
      { name: 'a', version: '1.1.0', variables: [], messages: [{ role: 'user', content: 'v110' }] },
    ];
    const svc = new PromptService(templates);
    const latest = await svc.get('a');
    expect(latest?.version).toBe('1.1.0');
  });
});
