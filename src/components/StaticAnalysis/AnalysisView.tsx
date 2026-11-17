import { useEffect, useState } from 'react';

import {
  Search,
  CircleAlert,
  TriangleAlert,
  Info,
  ChevronDown,
  FileCode2,
} from 'lucide-react';

import styles from './AnalysisView.module.css';

import { useTabStore } from '../CodeEditor/useTabStore';
import { useAnalysisStore } from '../CodeEditor/analysisStore';

import type {
  AnalysisSeverity,
} from '../CodeEditor/analysisStore';

function getFileName(path: string): string {
  return path.split(/[\\/]/).pop() || path;
}

function normalizeDiagnosticPath(path: string): string {
  return path
    .replace(/^\\\\\?\\/, '')
    .replace(/\\/g, '/')
    .toLowerCase();
}

function SeverityIcon({
  severity,
}: {
  severity: AnalysisSeverity;
}) {
  if (severity === 'error') {
    return (
      <CircleAlert
        size={15}
        className={styles.errorColor}
      />
    );
  }

  if (severity === 'warning') {
    return (
      <TriangleAlert
        size={15}
        className={styles.warningColor}
      />
    );
  }

  return (
    <Info
      size={15}
      className={styles.infoColor}
    />
  );
}

function AnalysisView() {
  const activeFileId = useTabStore(
    (state) => state.activeFileId
  );

  const activeFile = useTabStore((state) =>
    state.activeFileId
      ? state.openFiles.get(state.activeFileId)
      : undefined
  );

  const result = useAnalysisStore((state) =>
    activeFileId
      ? state.results[activeFileId]
      : undefined
  );

  const [filter, setFilter] = useState('');

  const [selectedIssueId, setSelectedIssueId] =
    useState<string | null>(null);

  useEffect(() => {
    setFilter('');
    setSelectedIssueId(null);
  }, [activeFileId]);

  const query = filter.trim().toLowerCase();

  const visibleIssues = (result?.issues ?? []).filter(
    (issue) =>
      [
        issue.message,
        issue.option ?? '',
        issue.severity,
        issue.filePath,
        String(issue.line),
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
  );

  const selectedIssue =
    visibleIssues.find(
      (issue) => issue.id === selectedIssueId
    ) ?? visibleIssues[0];

  const isCFile = Boolean(
    activeFile?.path &&
    /\.c$/i.test(activeFile.path)
  );

  const isStale = Boolean(
    result &&
    activeFile &&
    (
      activeFile.path !== result.filePath ||
      activeFile.content !== result.sourceSnapshot
    )
  );

  const snippetLines =
    result?.sourceSnapshot.split(/\r?\n/) ?? [];

  const isSameSource = Boolean(
    selectedIssue &&
    result &&
    normalizeDiagnosticPath(selectedIssue.filePath) ===
      normalizeDiagnosticPath(result.filePath)
  );

  const snippetStart = selectedIssue
    ? Math.max(1, selectedIssue.line - 2)
    : 1;

  const snippetEnd = selectedIssue
    ? Math.min(
        snippetLines.length,
        selectedIssue.line + 2
      )
    : 1;

  let emptyMessage =
    'Pilih file .c untuk melihat hasil analisis.';

  if (activeFile && !activeFile.path) {
    emptyMessage =
      'File ini belum memiliki lokasi di disk.';
  } else if (activeFile && !isCFile) {
    emptyMessage =
      'Static analysis saat ini hanya untuk file .c.';
  } else if (isCFile && !result) {
    emptyMessage =
      'Belum ada hasil. Tutup lalu buka kembali file ini untuk memicu analisis.';
  } else if (result?.status === 'running') {
    emptyMessage =
      'GCC sedang menganalisis file...';
  } else if (result?.status === 'failed') {
    emptyMessage =
      'Gagal menjalankan analisis. Periksa Raw GCC Output.';
  } else if (result && !result.success) {
    emptyMessage =
      'GCC selesai dengan kegagalan. Periksa Raw GCC Output.';
  } else if (
    result &&
    result.issues.length === 0 &&
    !result.output.trim()
  ) {
    emptyMessage =
      'GCC tidak mengeluarkan diagnostic untuk file ini.';
  } else if (
    result &&
    result.issues.length === 0
  ) {
    emptyMessage =
      'Output tersedia, tetapi belum berhasil diparse. Periksa Raw GCC Output.';
  } else if (visibleIssues.length === 0) {
    emptyMessage =
      'Tidak ada issue yang cocok dengan filter.';
  }

  return (
    <div className={styles.layout}>
      <div className={styles.listPanel}>
        <div className={styles.filterRow}>
          <Search size={14} />

          <input
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value)
            }
            placeholder="Filter issues..."
            aria-label="Filter analysis issues"
          />
        </div>

        <div className={styles.issueList}>
          <div
            className={styles.fileGroup}
            title={activeFile?.path ?? ''}
          >
            <ChevronDown size={14} />

            <FileCode2
              size={16}
              className={styles.infoColor}
            />

            <span className={styles.fileName}>
              {activeFile?.title ?? 'No active file'}
            </span>

            <span className={styles.countBadge}>
              {result?.issues.length ?? 0}
            </span>
          </div>

          {result?.status === 'running' ? (
            <div className={styles.listMessage}>
              Analyzing...
            </div>
          ) : visibleIssues.length > 0 ? (
            visibleIssues.map((issue) => (
              <button
                type="button"
                key={issue.id}
                className={`${styles.issueItem} ${
                  selectedIssue?.id === issue.id
                    ? styles.issueSelected
                    : ''
                }`}
                onClick={() =>
                  setSelectedIssueId(issue.id)
                }
                title={issue.message}
              >
                <SeverityIcon
                  severity={issue.severity}
                />

                <span className={styles.issueMessage}>
                  {issue.message}
                </span>

                <span className={styles.issueLocation}>
                  Ln {issue.line}, Col {issue.column}
                </span>
              </button>
            ))
          ) : (
            <div className={styles.listMessage}>
              {emptyMessage}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {result?.status === 'running'
            ? 'Analyzing'
            : result?.status === 'failed'
              ? 'Analysis failed'
              : result
                ? `${result.issues.length} diagnostics · Exit ${
                    result.exitCode ?? '-'
                  }`
                : 'Waiting for analysis'}
        </div>
      </div>

      <div className={styles.detailPanel}>
        {isStale && (
          <div className={styles.staleNotice}>
            Kode atau lokasi file sudah berubah.
            Hasil ini berasal dari snapshot sebelumnya,
            bukan perubahan editor terbaru.
          </div>
        )}

        {selectedIssue ? (
          <>
            <div className={styles.detailHeading}>
              <span
                className={`${styles.severityBadge} ${
                  selectedIssue.severity === 'error'
                    ? styles.errorBadge
                    : selectedIssue.severity === 'warning'
                      ? styles.warningBadge
                      : styles.infoBadge
                }`}
              >
                <SeverityIcon
                  severity={selectedIssue.severity}
                />

                {selectedIssue.severity}
              </span>

              <span className={styles.detailTitle}>
                {selectedIssue.message}
              </span>
            </div>

            <div className={styles.metadataRow}>
              <span className={styles.muted}>
                Location
              </span>

              <span title={selectedIssue.filePath}>
                {getFileName(selectedIssue.filePath)}
                {' '}[Ln {selectedIssue.line}, Col{' '}
                {selectedIssue.column}]
              </span>
            </div>

            {/* {selectedIssue.option && (
              <div className={styles.metadataRow}>
                <span className={styles.muted}>
                  Rule
                </span>

                <code>
                  {selectedIssue.option}
                </code>
              </div>
            )} */}

            <section className={styles.detailSection}>
              <h3>Diagnostic</h3>
              <p>{selectedIssue.message}</p>
            </section>

            {isSameSource &&
              selectedIssue.line > 0 &&
              selectedIssue.line <= snippetLines.length && (
                <section className={styles.detailSection}>
                  <h3>Code Snippet</h3>

                  <div className={styles.codeSnippet}>
                    {snippetLines
                      .slice(
                        snippetStart - 1,
                        snippetEnd
                      )
                      .map((line, index) => {
                        const lineNumber =
                          snippetStart + index;

                        return (
                          <div
                            key={lineNumber}
                            className={`${styles.codeLine} ${
                              lineNumber === selectedIssue.line
                                ? styles.highlightLine
                                : ''
                            }`}
                          >
                            <span className={styles.lineNumber}>
                              {lineNumber}
                            </span>

                            <code>
                              {line || ' '}
                            </code>
                          </div>
                        );
                      })}
                  </div>
                </section>
              )}

            <section className={styles.detailSection}>
              <h3>GCC Details</h3>

              <pre className={styles.rawOutput}>
                {selectedIssue.raw}
              </pre>
            </section>
          </>
        ) : (
          <div className={styles.emptyState}>
            <FileCode2 size={28} />
            <span>{emptyMessage}</span>
          </div>
        )}

        {result &&
          result.status !== 'running' && (
            <details
              className={styles.rawDetails}
              open={
                result.status === 'failed' ||
                !result.success
              }
            >
              <summary>
                Raw GCC Output
              </summary>

              <pre className={styles.rawOutput}>
                {result.output ||
                  'GCC tidak mengeluarkan diagnostic.'}
              </pre>
            </details>
          )}
      </div>
    </div>
  );
}

export default AnalysisView;