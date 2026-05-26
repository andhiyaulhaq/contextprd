import { useCallback, useRef } from 'react';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export type StreamErrorType = 'no_key' | 'no_endpoint' | 'rate_limit' | 'network' | 'unknown';

export interface StreamError {
  type: StreamErrorType;
  message: string;
}

interface StreamCallbacks {
  onChunk: (text: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: StreamError) => void;
}

const NO_KEY_ERROR: StreamError = {
  type: 'no_key',
  message: 'OpenRouter API key not configured. Set NEXT_PUBLIC_OPENROUTER_API_KEY in .env.local',
};

function classifyStreamError(err: any, modelId: string): StreamError {
  const status = err.statusCode ?? err.status;

  if (status === 401 || status === 403) {
    return { type: 'no_key', message: 'OpenRouter auth error. Check your API key.' };
  }
  if (status === 429) {
    return { type: 'rate_limit', message: 'Rate limited by OpenRouter. Please wait a moment and try again.' };
  }
  if (err.message?.includes('fetch failed')) {
    return { type: 'network', message: 'Network error. Check your internet connection.' };
  }
  return { type: 'no_endpoint', message: `${modelId} is not available.` };
}

export function useOpenRouterStream() {
  const abortRef = useRef<AbortController | null>(null);

  const sendQuery = useCallback(async (
    prompt: string,
    modelId: string,
    callbacks: StreamCallbacks,
  ) => {
    const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    if (!apiKey) {
      callbacks.onError(NO_KEY_ERROR);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated = '';

    try {
      const openrouter = createOpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey,
      });

      const model = openrouter(modelId);

      const result = streamText({
        model,
        prompt,
        abortSignal: controller.signal,
        maxRetries: 0,
      });

      for await (const part of result.fullStream) {
        if (part.type === 'error') {
          const streamError = classifyStreamError(part.error, modelId);
          callbacks.onError(streamError);
          return;
        }
        if (part.type === 'text-delta') {
          accumulated += part.text;
          callbacks.onChunk(accumulated);
        }
      }

      callbacks.onComplete(accumulated);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        callbacks.onComplete(accumulated);
        return;
      }
      const streamError = classifyStreamError(err, modelId);
      callbacks.onError(streamError);
    } finally {
      abortRef.current = null;
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const isAborting = useCallback(() => abortRef.current !== null, []);

  return { sendQuery, abort, isAborting };
}
