import { useState } from 'react';

export function useSelfHealingOrchestrator() {
  const [retryCounter, setRetryCounter] = useState<number>(0);

  const executeHealCycle = (
    brokenChartCode: string,
    errorString: string,
    retryCallback: (fixedCode: string) => void,
    onDeadLetter: () => void,
  ) => {
    if (retryCounter >= 1) {
      onDeadLetter();
      return;
    }

    setRetryCounter((prev) => prev + 1);

    const repairPrompt = `
Your previous output failed layout compilation validation checks.
Error Output Log: ${errorString}
Broken Code Chunk Sent:
\`\`\`mermaid
${brokenChartCode}
\`\`\`

Task: Fix the structural design layout definitions. Return ONLY the valid compiled code output block enclosed within appropriate markdown blocks.
    `;

    retryCallback(repairPrompt);
  };

  return { executeHealCycle, retryCounter };
}
