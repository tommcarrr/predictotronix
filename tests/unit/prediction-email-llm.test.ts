import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  extractPredictionsWithLlm,
  getPredictionImportLlmConfig,
} from '@/lib/predictions/email-import-llm';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('prediction email LLM fallback', () => {
  it('is disabled when no API key is configured', () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    expect(getPredictionImportLlmConfig()).toBeNull();
  });

  it('uses safe defaults when configured', () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    expect(getPredictionImportLlmConfig()).toEqual({
      apiKey: 'test-key',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-5.6-luna',
      reasoningEffort: 'none',
    });
  });

  it('keeps compatible reasoning defaults for older GPT-5 models', () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    vi.stubEnv('PREDICTION_IMPORT_LLM_MODEL', 'gpt-5-nano');
    expect(getPredictionImportLlmConfig()).toMatchObject({
      model: 'gpt-5-nano',
      reasoningEffort: 'minimal',
    });
  });

  it('allows the reasoning effort to be overridden', () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    vi.stubEnv('PREDICTION_IMPORT_LLM_REASONING_EFFORT', 'low');
    expect(getPredictionImportLlmConfig()).toMatchObject({ reasoningEffort: 'low' });
  });

  it('validates structured model output against the allowed fixtures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    predictions: [
                      { fixtureId: 'fixture', homeScore: 2, awayScore: 1 },
                      { fixtureId: 'invented', homeScore: 9, awayScore: 9 },
                    ],
                  }),
                },
              },
            ],
          }),
          { status: 200 }
        )
      )
    );

    const result = await extractPredictionsWithLlm(
      'Home to beat Away two one',
      [{ id: 'fixture', homeTeamName: 'Home', awayTeamName: 'Away' }],
      {
        apiKey: 'test',
        baseUrl: 'https://example.test/v1',
        model: 'test-model',
        reasoningEffort: 'none',
      }
    );

    expect(result.predictions).toEqual([
      { fixtureId: 'fixture', homeScore: 2, awayScore: 1, method: 'llm' },
    ]);
    const request = vi.mocked(fetch).mock.calls[0];
    expect(request[0]).toBe('https://example.test/v1/chat/completions');
    expect(JSON.parse(String((request[1] as RequestInit).body))).toMatchObject({
      model: 'test-model',
      reasoning_effort: 'none',
      response_format: { type: 'json_schema' },
    });
  });

  it('returns a warning without discarding deterministic work when the provider fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 429 })));
    const result = await extractPredictionsWithLlm(
      'email',
      [{ id: 'fixture', homeTeamName: 'Home', awayTeamName: 'Away' }],
      { apiKey: 'test', baseUrl: 'https://example.test/v1', model: 'test-model' }
    );

    expect(result.predictions).toEqual([]);
    expect(result.warnings[0]).toMatch(/HTTP 429/);
  });
});
