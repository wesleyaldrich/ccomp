import { invoke } from '@tauri-apps/api/core';
import { useTabStore } from './useTabStore';
import { useAnalysisStore } from './analysisStore';
import type {
  AnalysisIssue,
  AnalysisSeverity,
} from './analysisStore';

export interface AnalysisResult {
  success: boolean;
  exit_code: number | null;
  stdout: string;
  stderr: string;
}

export interface AnalysisEventDetail {
  fileId: string;
  filePath: string;
  success: boolean;
  exitCode: number | null;
  output: string;
}

const requests = new Map<string, symbol>();

function cleanOutput(text: string): string {
  return text
    .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '')
    .replace(/\r\n/g, '\n');
}

function parseDiagnostics(output: string): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];
  let current: AnalysisIssue | null = null;

  for (const text of output.split('\n')) {
    const match = text.match(
      /^(.*?):(\d+):(?:(\d+):)?\s*(fatal error|error|warning|note):\s*(.*)$/
    );

    if (!match) {
      if (current) {
        current.raw += `\n${text}`;
      }
      continue;
    }

    const [, filePath, line, column, kind, diagnostic] = match;

    // Notes biasanya merupakan informasi pendukung issue sebelumnya.
    if (kind === 'note' && current) {
      current.raw += `\n${text}`;
      continue;
    }

    const optionMatch = diagnostic.match(/\s+\[(-W[^\]]+)\]\s*$/);

    const severity: AnalysisSeverity =
      kind === 'warning'
        ? 'warning'
        : kind === 'note'
          ? 'info'
          : 'error';

    current = {
      id: `issue-${issues.length}`,
      filePath: filePath.trim(),
      line: Number(line),
      column: Number(column || 1),
      severity,
      message: diagnostic.replace(/\s+\[(-W[^\]]+)\]\s*$/, ''),
      option: optionMatch?.[1] ?? null,
      raw: text,
    };

    issues.push(current);
  }

  return issues;
}

export async function analyzeFile(
  fileId: string,
  filePath: string
): Promise<boolean> {
  const file = useTabStore.getState().openFiles.get(fileId);

  if (!file || !filePath || !/\.c$/i.test(filePath)) {
    return false;
  }

  const request = Symbol(fileId);
  requests.set(fileId, request);

  // Backend membaca file di disk, bukan perubahan editor yang belum disimpan.
  const sourceSnapshot = file.savedContent;

  useAnalysisStore.getState().setResult({
    fileId,
    filePath,
    status: 'running',
    success: false,
    exitCode: null,
    output: '',
    issues: [],
    sourceSnapshot,
  });

  try {
    const result = await invoke<AnalysisResult>('analyze_file', {
      filePath,
    });

    if (requests.get(fileId) !== request) {
      return false;
    }

    if (!useTabStore.getState().openFiles.has(fileId)) {
      return false;
    }

    const output = cleanOutput(
      [result.stdout, result.stderr].filter(Boolean).join('\n')
    );

    const issues = parseDiagnostics(output);

    useAnalysisStore.getState().setResult({
      fileId,
      filePath,
      status: 'done',
      success: result.success,
      exitCode: result.exit_code,
      output,
      issues,
      sourceSnapshot,
    });

    const detail: AnalysisEventDetail = {
      fileId,
      filePath,
      success: result.success,
      exitCode: result.exit_code,
      output,
    };

    window.dispatchEvent(
      new CustomEvent<AnalysisEventDetail>('onAnalysisCompleted', {
        detail,
      })
    );

    console.log('[ANALYZE RESULT]', result);
    console.log('[ANALYZE ISSUES]', issues);
    console.log('[ANALYZE OUTPUT]\n' + output);

    return true;
  } catch (error) {
    if (requests.get(fileId) !== request) {
      return false;
    }

    if (!useTabStore.getState().openFiles.has(fileId)) {
      return false;
    }

    const output = String(error);

    useAnalysisStore.getState().setResult({
      fileId,
      filePath,
      status: 'failed',
      success: false,
      exitCode: null,
      output,
      issues: [],
      sourceSnapshot,
    });

    window.dispatchEvent(
      new CustomEvent<AnalysisEventDetail>('onAnalysisCompleted', {
        detail: {
          fileId,
          filePath,
          success: false,
          exitCode: null,
          output,
        },
      })
    );

    console.error('[ANALYZE] Gagal menjalankan analisis:', error);
    return false;
  } finally {
    if (requests.get(fileId) === request) {
      requests.delete(fileId);
    }
  }
}

export async function analyzeActiveFile(): Promise<boolean> {
  const state = useTabStore.getState();
  const fileId = state.activeFileId;

  if (!fileId) return false;

  const file = state.openFiles.get(fileId);

  if (!file?.path) return false;

  return analyzeFile(fileId, file.path);
}