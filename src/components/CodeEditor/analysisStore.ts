import { create } from 'zustand';

export type AnalysisSeverity = 'error' | 'warning' | 'info';

export interface AnalysisIssue {
  id: string;
  filePath: string;
  line: number;
  column: number;
  severity: AnalysisSeverity;
  message: string;
  option: string | null;
  raw: string;
}

export interface FileAnalysis {
  fileId: string;
  filePath: string;
  status: 'running' | 'done' | 'failed';
  success: boolean;
  exitCode: number | null;
  output: string;
  issues: AnalysisIssue[];
  sourceSnapshot: string;
}

interface AnalysisStore {
  results: Record<string, FileAnalysis>;
  setResult: (result: FileAnalysis) => void;
}

export const useAnalysisStore = create<AnalysisStore>((set) => ({
  results: {},

  setResult: (result) =>
    set((state) => ({
      results: {
        ...state.results,
        [result.fileId]: result,
      },
    })),
}));