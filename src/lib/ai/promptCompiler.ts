import { Workspace, FileNode } from '../../types/workspace';

export interface SystemHeaders {
  workspaceName: string;
  domainCategory: string;
  activeFilePath: string;
  timestamp: number;
}

export function compileContextPayload(
  workspace: Workspace,
  activeFile: FileNode,
  userQuery: string,
  deepAudit: boolean = false,
): { prompt: string; headers: SystemHeaders } {
  const headers: SystemHeaders = {
    workspaceName: workspace.name,
    domainCategory: workspace.profile.category,
    activeFilePath: activeFile.path,
    timestamp: Date.now(),
  };

  const auditDirective = deepAudit
    ? `\n[DEEP AUDIT MODE] Perform a thorough cross-section analysis. Consider edge cases, platform constraints, and downstream impacts.`
    : '';

  const prompt = `
SYSTEM PROMPT CONSTRAINTS:
You are an expert software application architect. You must adhere strictly to the target environment's technical ecosystem constraints.
Target Category Context: ${workspace.profile.category}
Guardrail Assertions: ${workspace.profile.systemGuardrails}
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
