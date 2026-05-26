import { useState, useCallback } from 'react';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { SkillIntent } from '../types/workspace';

interface StreamState {
  isLoading: boolean;
  error: string | null;
}

export function useOpenRouterStream() {
  const [state, setState] = useState<StreamState>({ isLoading: false, error: null });

  const sendQuery = useCallback(async (
    prompt: string,
    modelId: string,
    skill: SkillIntent,
    onChunk: (chunk: string) => void,
    onComplete: (full: string) => void,
  ) => {
    setState({ isLoading: true, error: null });

    try {
      const openrouter = createOpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '',
      });

      const model = openrouter(modelId);

      const result = await generateText({
        model,
        prompt,
      });

      onChunk(result.text);
      onComplete(result.text);
    } catch (err: any) {
      setState({ isLoading: false, error: err.message || 'Stream request failed' });
      return;
    }

    setState({ isLoading: false, error: null });
  }, []);

  return { ...state, sendQuery };
}
