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
