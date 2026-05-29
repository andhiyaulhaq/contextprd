import { Project, FileNode } from '../../types/project';

export interface SystemHeaders {
  projectName: string;
  domainCategory: string;
  activeFilePath: string;
  timestamp: number;
}

function findFileById(nodes: FileNode[], id: string): FileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findFileById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function compileContextPayload(
  project: Project,
  activeFile: FileNode,
  userQuery: string,
  deepAudit: boolean = false,
  mentionedFileIds: string[] = [],
): { prompt: string; headers: SystemHeaders } {
  const headers: SystemHeaders = {
    projectName: project.name,
    domainCategory: project.profile.category,
    activeFilePath: activeFile.path,
    timestamp: Date.now(),
  };

  const auditDirective = deepAudit
    ? `\n[DEEP AUDIT MODE] Perform a thorough cross-section analysis. Consider edge cases, platform constraints, and downstream impacts.`
    : '';

  // Resolve mentioned files contents
  let mentionedContexts = '';
  if (mentionedFileIds.length > 0) {
    const resolvedFiles: FileNode[] = [];
    mentionedFileIds.forEach((id) => {
      const file = findFileById(project.fileTree, id);
      if (file && file.id !== activeFile.id && file.type === 'markdown') {
        resolvedFiles.push(file);
      }
    });

    if (resolvedFiles.length > 0) {
      mentionedContexts = '\nMENTIONED FILE CONTEXTS:\n';
      resolvedFiles.forEach((file) => {
        mentionedContexts += `<file path="${file.path}">\n${file.content}\n</file>\n`;
      });
    }
  }

  const prompt = `
SYSTEM PROMPT CONSTRAINTS:
You are an expert software application architect. You must adhere strictly to the target environment's technical ecosystem constraints.
Target Category Context: ${project.profile.category}
Guardrail Assertions: ${project.profile.systemGuardrails}
Project Description: ${project.profile.description || 'Not specified'}
${auditDirective}

ACTIVE FILE RECORD CONTENT UNDER EVALUATION:
\`\`\`markdown
File Path: ${activeFile.path}
${activeFile.content}
\`\`\`
${mentionedContexts}
USER OPERATIONAL INSTRUCTION:
${userQuery}

Return your changes cleanly. 
If diagrams are required:
1. Generate them entirely inside functional code markdown fences using standard syntax layout constructs (\`\`\`mermaid).
2. If the diagram contains multiple disconnected subgraphs, you MUST link them sequentially using invisible links (~~~) to force correct chronological left-to-right rendering order.
`.trim();

  return { prompt, headers };
}

export function compileInlineContext(
  textBefore: string,
  textAfter: string,
  userQuery: string,
  selectedText: string = ''
): string {
  
  return `
You are an advanced AI editor assistant. Your task is to generate content to insert into a Markdown document based on the user's instruction.

[DOCUMENT CONTEXT BEFORE INSERTION POINT]
${textBefore}

${selectedText ? `[TEXT SELECTED BY USER TO BE REPLACED/EDITED]\n${selectedText}\n` : ''}
<INSERTION_POINT>

[DOCUMENT CONTEXT AFTER INSERTION POINT]
${textAfter}

USER INSTRUCTION: ${userQuery}

Generate the exact Markdown content to be placed at the <INSERTION_POINT>.
CRITICAL RULES:
1. Do NOT repeat or rewrite the surrounding context.
2. Output ONLY the new content to be inserted.
3. Do NOT include conversational filler like "Here is the diagram".
4. If generating a diagram, output the raw \`\`\`mermaid fence directly.
5. If a Mermaid diagram contains multiple disconnected subgraphs, you MUST link them sequentially using invisible links (~~~) to force correct chronological left-to-right rendering order.
  `.trim();
}

// ─── Seeding Prompts ──────────────────────────────────────────────────────────

/**
 * Phase 1 of project seeding.
 * Generates a short structured manifest that anchors all per-file generations
 * to the same tech stack, features, and user roles.
 */
export function compileManifestPrompt(
  projectName: string,
  category: string,
  description: string,
): string {
  return `
You are a software architect. Based on the project description below, produce a concise Project Manifest.
This manifest will be shared across all PRD documents to guarantee internal consistency.

PROJECT:
- Name: ${projectName}
- Domain: ${category}
- Description: ${description}

Output a markdown block with EXACTLY these five fields and NO other text:
## Project Manifest
- **App Name:** <specific name>
- **Core Features:** <comma-separated list of 4–6 specific features>
- **Target Users:** <specific user roles and context>
- **Tech Stack:** <comma-separated specific technologies>
- **Key Constraints:** <comma-separated constraints, e.g. GDPR, offline-first, mobile-first>

Be specific. Do not use generic placeholders. Output ONLY the manifest block.
  `.trim();
}

/**
 * Phase 2 of project seeding.
 * Generates the content for a single PRD file, anchored to the shared manifest
 * so all files reference the same stack, features, and users.
 */
export function compileBlueprintSeedPrompt(
  projectName: string,
  category: string,
  description: string,
  manifest: string,
  fileName: string,
  templateContent: string,
): string {
  return `
You are an expert software architect generating a PRD document for a real project.

PROJECT CONTEXT:
- Name: ${projectName}
- Domain: ${category}
- Description: ${description}

PROJECT MANIFEST (authoritative — all files must be consistent with this):
${manifest}

DOCUMENT TO GENERATE: ${fileName}

Use the following as a structural template. Keep the EXACT same headings and markdown structure.
Replace ALL placeholder content with real, specific content consistent with the manifest.
Do NOT contradict the manifest. Do NOT invent features not mentioned in the description or manifest.

CRITICAL INSTRUCTIONS FOR MARKDOWN:
1. You MUST preserve all markdown formatting (tables using |, lists, code blocks, bold text).
2. Do NOT strip markdown table pipes (|). If you modify a table, ensure it remains a valid markdown table.
3. Output the final markdown directly. Do NOT wrap your entire response in \`\`\`markdown tags.
4. For Mermaid diagrams, if a node label contains special characters like parentheses or brackets, you MUST enclose the label in double quotes (e.g., \`id["Label (Extra)"]\`).

TEMPLATE STRUCTURE:
\`\`\`markdown
${templateContent}
\`\`\`

Output ONLY the final markdown content. No preamble. No explanation.
  `.trim();
}
