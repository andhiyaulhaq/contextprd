import { useCallback, useRef } from 'react';
import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

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
  message: 'Google AI Studio API key not configured. Set NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY in .env.local',
};

function classifyStreamError(err: any, modelId: string): StreamError {
  const status = err.statusCode ?? err.status;

  if (status === 401 || status === 403) {
    return { type: 'no_key', message: 'Google Auth error. Check your API key.' };
  }
  if (status === 429) {
    return { type: 'rate_limit', message: 'Rate limited by Google. Please wait a moment and try again.' };
  }
  if (err.message?.includes('fetch failed')) {
    return { type: 'network', message: 'Network error. Check your internet connection.' };
  }
  return { type: 'unknown', message: `${modelId} returned an error: ${err.message}` };
}

export function useAIStream() {
  const abortRef = useRef<AbortController | null>(null);

  function logApiCall(modelId: string, prompt: string) {
    console.log(
      `%c[Google AI] %c${modelId}`,
      'color: #10b981; font-weight: bold;',
      'color: #a1a1aa;',
      `prompt: ${prompt.slice(0, 120)}${prompt.length > 120 ? '...' : ''} (${prompt.length} chars)`,
    );
  }

  function logApiSuccess(modelId: string, outputLength: number) {
    console.log(
      `%c[Google AI] %c${modelId} %c✓ ${outputLength} chars`,
      'color: #10b981; font-weight: bold;',
      'color: #a1a1aa;',
      'color: #22c55e;',
    );
  }

  function logApiError(modelId: string, errorType: string) {
    console.log(
      `%c[Google AI] %c${modelId} %c✗ ${errorType}`,
      'color: #10b981; font-weight: bold;',
      'color: #a1a1aa;',
      'color: #ef4444;',
    );
  }

  const sendQuery = useCallback(async (
    prompt: string,
    modelId: string,
    callbacks: StreamCallbacks,
  ) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      callbacks.onError(NO_KEY_ERROR);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated = '';
    logApiCall(modelId, prompt);

    try {
      const google = createGoogleGenerativeAI({
        apiKey,
      });

      const model = google(modelId);

      const result = streamText({
        model,
        prompt,
        abortSignal: controller.signal,
        maxRetries: 0,
      });

      for await (const chunk of result.textStream) {
        accumulated += chunk;
        callbacks.onChunk(accumulated);
      }

      logApiSuccess(modelId, accumulated.length);
      callbacks.onComplete(accumulated);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log(`%c[Google AI] %c${modelId} %caborted`, 'color: #10b981; font-weight: bold;', 'color: #a1a1aa;', 'color: #f59e0b;');
        callbacks.onComplete(accumulated);
        return;
      }
      const streamError = classifyStreamError(err, modelId);
      logApiError(modelId, streamError.type);
      callbacks.onError(streamError);
    } finally {
      abortRef.current = null;
    }
  }, []);

  const sendSilentQuery = useCallback(async (
    prompt: string,
    modelId: string,
    signal?: AbortSignal,
  ): Promise<{ text: string; error?: StreamError }> => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return { text: '', error: NO_KEY_ERROR };
    }

    let accumulated = '';
    logApiCall(modelId, prompt);

    try {
      const google = createGoogleGenerativeAI({ apiKey });
      const model = google(modelId);

      const result = streamText({
        model,
        prompt,
        abortSignal: signal,
        maxRetries: 0,
      });

      for await (const chunk of result.textStream) {
        accumulated += chunk;
      }

      logApiSuccess(modelId, accumulated.length);
      return { text: accumulated };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { text: accumulated };
      }
      const error = classifyStreamError(err, modelId);
      logApiError(modelId, error.type);
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
