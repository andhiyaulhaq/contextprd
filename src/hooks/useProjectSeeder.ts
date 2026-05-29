import { useCallback } from 'react';
import { useAIStream } from './useAIStream';
import { useProjectStore } from '../store/useProjectStore';
import {
  compileManifestPrompt,
  compileBlueprintSeedPrompt,
} from '../lib/ai/promptCompiler';
import { resolveModelEndpoints } from '../lib/ai/router';

export type SeedProgressPhase = 'manifest' | 'files';

export interface SeedProgress {
  phase: SeedProgressPhase;
  done: number;
  total: number;
}

export function useProjectSeeder() {
  const { sendSilentQuery } = useAIStream();
  // NOTE: Do NOT subscribe to `projects` via useProjectStore here.
  // seedProject is called immediately after createProject in the same event
  // handler, before React has had a chance to re-render with the new project
  // in the store. Reading from the hook closure would give a stale snapshot
  // that doesn't contain the just-created project.
  // Instead, use getState() inside the async function to always get the
  // live Zustand state at call time.
  const updateFileContent = useProjectStore((s) => s.updateFileContent);

  const seedProject = useCallback(
    async (
      projectId: string,
      description: string,
      onProgress: (progress: SeedProgress) => void,
      signal: AbortSignal,
    ): Promise<void> => {
      // Read live state — not the render-time closure snapshot
      const project = useProjectStore.getState().projects[projectId];
      if (!project) {
        console.error('[useProjectSeeder] Project not found in store:', projectId);
        return;
      }

      const startTime = performance.now();
      console.log(`%c[Seed] %cStarted generating project: ${project.name}`, 'color: #8b5cf6; font-weight: bold;', 'color: #a1a1aa;');

      const files = project.fileTree.filter((f) => f.type === 'markdown');
      const models = resolveModelEndpoints('SKILL_WRITER').map((r) => r.modelId);

      // ── Phase 1: Generate the Project Manifest ──────────────────────────────
      // One single LLM call that produces a structured source-of-truth.
      // All Phase 2 file generations receive this manifest so they stay
      // internally consistent (same tech stack, features, user roles, etc.).
      onProgress({ phase: 'manifest', done: 0, total: 1 });

      const manifestPrompt = compileManifestPrompt(
        project.name,
        project.profile.category,
        description,
      );

      const { text: manifest, error: manifestError } = await sendSilentQuery(
        manifestPrompt,
        models,
        signal,
      );

      // Graceful degradation: if manifest call fails, use the raw description
      // as the cohesion anchor so Phase 2 still runs with some context.
      // However, if the error is a hard quota/key limit, stop entirely.
      if (manifestError?.type === 'rate_limit') {
        const duration = ((performance.now() - startTime) / 1000).toFixed(1);
        console.log(`%c[Seed] %cAborted after ${duration}s due to provider limits`, 'color: #8b5cf6; font-weight: bold;', 'color: #ef4444;');
        return; // Abort early, project will just use static templates
      }
      
      const cohesionContext = manifestError || !manifest ? description : manifest;

      onProgress({ phase: 'manifest', done: 1, total: 1 });

      if (signal.aborted) {
        const duration = ((performance.now() - startTime) / 1000).toFixed(1);
        console.log(`%c[Seed] %cAborted by user after ${duration}s`, 'color: #8b5cf6; font-weight: bold;', 'color: #f59e0b;');
        return;
      }

      // ── Phase 2: Chunked per-file generation ───────────────────────────────
      // Generate files in small batches to prevent hitting LLM provider rate limits
      // (e.g. Gemini free tier allows ~5 requests burst).
      let filesCompleted = 0;
      const CONCURRENCY_LIMIT = 1;

      // Immediately signal the UI that we have moved to Phase 2 (0/6 progress)
      onProgress({ phase: 'files', done: filesCompleted, total: files.length });

      for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
        if (signal.aborted) break;
        
        const chunk = files.slice(i, i + CONCURRENCY_LIMIT);
        
        await Promise.all(
          chunk.map(async (file) => {
            if (signal.aborted) return;

            const prompt = compileBlueprintSeedPrompt(
              project.name,
              project.profile.category,
              description,
              cohesionContext,
              file.name,
              file.content, // static template used as structural scaffold
            );

            const { text, error } = await sendSilentQuery(prompt, models, signal);

            if (text && !error && !signal.aborted) {
              // Strip preamble and markdown wrappers if the LLM ignored instructions
              let cleanText = text.trim();
              const mdMatch = cleanText.match(/```markdown\s*\n([\s\S]*)\n```/i);
              if (mdMatch && mdMatch[1]) {
                cleanText = mdMatch[1].trim();
              } else if (cleanText.startsWith('```') && cleanText.endsWith('```')) {
                // Fallback for when it's wrapped in generic ``` without the 'markdown' tag and without preamble
                cleanText = cleanText.replace(/^```[a-z]*\s*\n/i, '').replace(/\n```\s*$/, '').trim();
              }
              
              updateFileContent(projectId, file.id, cleanText);
            }

            filesCompleted += 1;
            onProgress({ phase: 'files', done: filesCompleted, total: files.length });
          })
        );

      }

      const totalDuration = ((performance.now() - startTime) / 1000).toFixed(1);
      if (signal.aborted) {
        console.log(`%c[Seed] %cAborted by user after ${totalDuration}s`, 'color: #8b5cf6; font-weight: bold;', 'color: #f59e0b;');
      } else {
        console.log(`%c[Seed] %cSuccessfully generated ${filesCompleted} files in ${totalDuration}s`, 'color: #8b5cf6; font-weight: bold;', 'color: #22c55e;');
      }
    },
    [updateFileContent, sendSilentQuery],
  );

  return { seedProject };
}
