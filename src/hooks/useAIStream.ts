import { useCallback, useRef } from 'react';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export type StreamErrorType = 'no_endpoint' | 'rate_limit' | 'network' | 'unknown';

export interface StreamError {
  type: StreamErrorType;
  message: string;
}

interface StreamCallbacks {
  onChunk: (text: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: StreamError) => void;
}

// Initialize the OpenAI provider wrapper tailored for 9Router
const nineRouter = createOpenAI({
  baseURL: process.env.AI_BASE_URL || 'http://localhost:20128/v1',
  apiKey: process.env.AI_API_KEY || '9router-local-placeholder',
});

function classifyStreamError(err: any, modelId: string): StreamError {
  const status = err.statusCode ?? err.status;

  if (status === 429 || status === 503 || err.message?.includes('high demand') || err.message?.includes('Quota exceeded')) {
    return { type: 'rate_limit', message: '9Router rate limit reached.' };
  }
  if (err.message?.includes('fetch failed')) {
    return { type: 'network', message: 'Network error. Is 9Router running on port 20128?' };
  }
  return { type: 'unknown', message: `${modelId} returned an error: ${err.message}` };
}

export function useAIStream() {
  const abortRef = useRef<AbortController | null>(null);

  function logApiCall(modelId: string, prompt: string) {
    console.log(
      `%c[9Router] %c${modelId}`,
      'color: #10b981; font-weight: bold;',
      'color: #a1a1aa;',
      `prompt: ${prompt.slice(0, 120)}${prompt.length > 120 ? '...' : ''} (${prompt.length} chars)`,
    );
  }

  function logApiSuccess(modelId: string, outputLength: number) {
    console.log(
      `%c[9Router] %c${modelId} %c✓ ${outputLength} chars`,
      'color: #10b981; font-weight: bold;',
      'color: #a1a1aa;',
      'color: #22c55e;',
    );
  }

  function logApiError(modelId: string, errorType: string) {
    console.log(
      `%c[9Router] %c${modelId} %c✗ ${errorType}`,
      'color: #10b981; font-weight: bold;',
      'color: #a1a1aa;',
      'color: #ef4444;',
    );
  }

  const sendQuery = useCallback(async (
    prompt: string,
    modelIds: string | string[],
    callbacks: StreamCallbacks,
  ) => {
    // With 9Router, we rely on the internal fallback combo (e.g., 'free-combo')
    // so we just take the first model passed in.
    const modelsToTry = Array.isArray(modelIds) ? modelIds : [modelIds];
    const targetModel = modelsToTry[0].replace('9router:', '');
    
    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated = '';

    logApiCall(targetModel, prompt);

    try {
      const result = await streamText({
        model: nineRouter(targetModel),
        prompt,
        abortSignal: controller.signal,
      });

      for await (const chunk of result.textStream) {
        accumulated += chunk;
        callbacks.onChunk(accumulated);
      }

      logApiSuccess(targetModel, accumulated.length);
      callbacks.onComplete(accumulated);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log(`%c[9Router] %c${targetModel} %caborted`, 'color: #10b981; font-weight: bold;', 'color: #a1a1aa;', 'color: #f59e0b;');
        callbacks.onComplete(accumulated);
        return;
      }
      const streamError = classifyStreamError(err, targetModel);
      logApiError(targetModel, streamError.type);
      callbacks.onError(streamError);
    }
  }, []);

  const sendSilentQuery = useCallback(async (
    prompt: string,
    modelIds: string | string[],
    signal?: AbortSignal,
  ): Promise<{ text: string; error?: StreamError }> => {
    const modelsToTry = Array.isArray(modelIds) ? modelIds : [modelIds];
    const targetModel = modelsToTry[0].replace('9router:', '');
    
    let accumulated = '';

    logApiCall(targetModel, prompt);

    try {
      const result = await streamText({
        model: nineRouter(targetModel),
        prompt,
        abortSignal: signal,
      });

      for await (const chunk of result.textStream) {
        accumulated += chunk;
      }

      logApiSuccess(targetModel, accumulated.length);
      return { text: accumulated };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { text: accumulated };
      }
      const error = classifyStreamError(err, targetModel);
      logApiError(targetModel, error.type);
      return { text: '', error };
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const isAborting = useCallback(() => abortRef.current !== null, []);

  return { sendQuery, sendSilentQuery, abort, isAborting };
}
