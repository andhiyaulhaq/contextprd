import JSZip from 'jszip';
import { Project, FileNode } from '../types/project';

/**
 * Triggers a file download in the browser.
 */
function triggerDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Recursively flattens a file tree into an array of markdown files.
 */
function flattenMarkdownFiles(nodes: FileNode[]): FileNode[] {
  let files: FileNode[] = [];
  for (const node of nodes) {
    if (node.type === 'markdown') {
      files.push(node);
    }
    if (node.children) {
      files = files.concat(flattenMarkdownFiles(node.children));
    }
  }
  return files;
}

/**
 * Exports the entire project as a single concatenated Markdown file.
 * Includes a Table of Contents at the top.
 */
export function exportAsSingleFile(project: Project) {
  const files = flattenMarkdownFiles(project.fileTree);
  
  if (files.length === 0) {
    alert('Project is empty.');
    return;
  }

  let content = `# ${project.name} - Product Requirements Document\n\n`;
  
  // Generate Table of Contents
  content += `## Table of Contents\n\n`;
  files.forEach((file) => {
    // Convert filename to anchor link format (lowercase, spaces to hyphens, remove special chars)
    // Wait, the anchor will be based on the H1 tag inside the file content.
    // Let's parse the first H1 if possible, or just link to the filename.
    const titleMatch = file.content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : file.name.replace(/\.md$/i, '');
    const anchor = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    content += `- [${title}](#${anchor})\n`;
  });
  content += `\n---\n\n`;

  // Append file contents
  files.forEach((file) => {
    content += `${file.content}\n\n`;
  });

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const filename = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_prd.md`;
  triggerDownload(blob, filename);
}

/**
 * Recursively adds files to a JSZip folder instance.
 */
function addFilesToZip(zipFolder: JSZip, nodes: FileNode[]) {
  for (const node of nodes) {
    if (node.type === 'markdown') {
      zipFolder.file(node.name, node.content);
    } else if (node.type === 'directory' && node.children) {
      const subFolder = zipFolder.folder(node.name);
      if (subFolder) {
        addFilesToZip(subFolder, node.children);
      }
    }
  }
}

/**
 * Exports the project as a ZIP archive, preserving the folder structure.
 */
export async function exportAsZip(project: Project) {
  if (project.fileTree.length === 0) {
    alert('Project is empty.');
    return;
  }

  const zip = new JSZip();
  const rootFolder = zip.folder(project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase());
  
  if (rootFolder) {
    addFilesToZip(rootFolder, project.fileTree);
  }

  try {
    const blob = await zip.generateAsync({ type: 'blob' });
    const filename = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.zip`;
    triggerDownload(blob, filename);
  } catch (error) {
    console.error('Error generating zip:', error);
    alert('Failed to generate ZIP file.');
  }
}
