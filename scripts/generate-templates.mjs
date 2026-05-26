import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatesDir = path.join(__dirname, '../src/lib/templates');
const outputFile = path.join(templatesDir, 'generated.ts');

const domains = ['WEB_APP', 'NATIVE_DESKTOP', 'MOBILE_APP', 'GENERAL_SAAS'];
const generatedCode = [];

generatedCode.push(`// AUTO-GENERATED FILE - DO NOT EDIT`);
generatedCode.push(`import { DomainCategory } from '../../types/workspace';\n`);
generatedCode.push(`export const TEMPLATES: Record<DomainCategory, Record<string, string>> = {`);

for (const domain of domains) {
  const domainDir = path.join(templatesDir, domain.toLowerCase());
  if (!fs.existsSync(domainDir)) {
    console.warn(`Warning: Directory not found for ${domain}`);
    continue;
  }

  generatedCode.push(`  ${domain}: {`);
  const files = fs.readdirSync(domainDir).filter(f => f.endsWith('.md'));
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(domainDir, file), 'utf8');
    // Safely stringify the content to handle all backticks, quotes, and newlines
    const safeContent = JSON.stringify(content);
    generatedCode.push(`    '/${file}': ${safeContent},`);
  }
  generatedCode.push(`  },`);
}

generatedCode.push(`};\n`);

fs.writeFileSync(outputFile, generatedCode.join('\n'));
console.log('Successfully generated src/lib/templates/generated.ts');
