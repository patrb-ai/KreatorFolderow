'use strict';

const textarea = document.getElementById('structure');
const previewPanel = document.getElementById('preview-panel');
const outputPanel = document.getElementById('output-panel');
const treeOutput = document.getElementById('tree-output');
const scriptOutput = document.getElementById('script-output');

let activeTab = 'powershell';

function parseLines(raw) {
  return raw.split('\n').map(line => {
    const trimmed = line.trimEnd();
    const indent = trimmed.length - trimmed.trimStart().length;
    const name = trimmed.trim().replace(/\/$/, '');
    return { indent, name };
  }).filter(l => l.name);
}

function buildTree(lines) {
  let result = '';
  lines.forEach((line, i) => {
    const isLast = !lines.slice(i + 1).some(l => l.indent === line.indent);
    const prefix = '  '.repeat(line.indent / 2);
    result += prefix + (isLast ? '└── ' : '├── ') + line.name + '/\n';
  });
  return result;
}

function buildPowerShell(lines) {
  return lines.map(l => `New-Item -ItemType Directory -Force -Path "${l.name}"`.padStart(l.indent + `New-Item -ItemType Directory -Force -Path "${l.name}"`.length)).join('\n');
}

function buildBash(lines) {
  const paths = lines.map(l => '  '.repeat(l.indent / 2) + l.name);
  return 'mkdir -p \\\n' + paths.join(' \\\n');
}

document.getElementById('btn-preview').addEventListener('click', () => {
  const lines = parseLines(textarea.value);
  if (!lines.length) return;
  treeOutput.textContent = buildTree(lines);
  previewPanel.hidden = false;
});

document.getElementById('btn-generate').addEventListener('click', () => {
  const lines = parseLines(textarea.value);
  if (!lines.length) return;
  scriptOutput.textContent = activeTab === 'powershell' ? buildPowerShell(lines) : buildBash(lines);
  outputPanel.hidden = false;
});

document.getElementById('btn-clear').addEventListener('click', () => {
  textarea.value = '';
  previewPanel.hidden = true;
  outputPanel.hidden = true;
});

document.getElementById('btn-copy').addEventListener('click', () => {
  navigator.clipboard.writeText(scriptOutput.textContent);
  const btn = document.getElementById('btn-copy');
  btn.textContent = 'Skopiowano!';
  setTimeout(() => { btn.textContent = 'Kopiuj do schowka'; }, 1500);
});

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeTab = tab.dataset.tab;
    const lines = parseLines(textarea.value);
    if (lines.length) {
      scriptOutput.textContent = activeTab === 'powershell' ? buildPowerShell(lines) : buildBash(lines);
    }
  });
});
