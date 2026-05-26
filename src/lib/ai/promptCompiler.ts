import { Project, FileNode } from '../../types/project';

export interface SystemHeaders {
  projectName: string;
  domainCategory: string;
  activeFilePath: string;
  timestamp: number;
}

export function compileContextPayload(
  project: Project,
  activeFile: FileNode,
  userQuery: string,
  deepAudit: boolean = false,
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

USER OPERATIONAL INSTRUCTION:
${userQuery}

Return your changes cleanly. If diagrams are required, generate them entirely inside functional code markdown fences using standard syntax layout constructs (\`\`\`mermaid).
`.trim();

  return { prompt, headers };
}

export function compileInlineContext(
  content: string,
  cursorIndex: number,
  userQuery: string
): string {
  const textBefore = content.substring(0, cursorIndex);
  const textAfter = content.substring(cursorIndex);
  
  return `
[DOCUMENT CONTEXT BEFORE CURSOR]
${textBefore}

<INSERTION_POINT>

[DOCUMENT CONTEXT AFTER CURSOR]
${textAfter}

INSTRUCTION: ${userQuery}
Generate the text that should be placed exactly at the <INSERTION_POINT>.
Return ONLY the raw markdown content to be inserted. Do not include introductory text.
  `.trim();
}
