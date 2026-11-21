import React, { useState, useEffect } from 'react';
import { X, Play, Info } from 'lucide-react';
import styles from './BottomBar.module.css';
// Static Analysis
import AnalysisView from '../StaticAnalysis/AnalysisView';

interface TestCase {
    id: string;
    input: string;
    expectedOutput: string;
}

interface TestResult {
    status: string;
    runtime: string;
    memory: string;
    memoryTooltip?: string;
    exitCode: number;
    compiler: string;
    executeAt: string;
    output: string;
}

interface TestTab {
    id: string;
    name: string;
    testCase: TestCase;
    result: TestResult;
}

interface BackendResultItem {
    id: string;
    passed: boolean;
    actual_output: string;
    error?: string;
    duration_ms: number;
    memory_kb: number;
    compiler_version: string;
}

interface LineDiffInfo {
    isLineDiff: boolean;
    charDiffs: boolean[];
}

interface SideBySideDiff {
    expected: LineDiffInfo[];
    actual: LineDiffInfo[];
}

function diffLineChars(expLine: string, actLine: string): { expDiffs: boolean[]; actDiffs: boolean[] } {
    const expChars = Array.from(expLine);
    const actChars = Array.from(actLine);
    const n = expChars.length;
    const m = actChars.length;

    const expDiffs = new Array<boolean>(n).fill(false);
    const actDiffs = new Array<boolean>(m).fill(false);

    let prefix = 0;
    while (prefix < n && prefix < m && expChars[prefix] === actChars[prefix]) {
        prefix++;
    }

    let suffix = 0;
    while (
        suffix < n - prefix &&
        suffix < m - prefix &&
        expChars[n - 1 - suffix] === actChars[m - 1 - suffix]
    ) {
        suffix++;
    }

    const remN = n - prefix - suffix;
    const remM = m - prefix - suffix;

    if (remN === 0 && remM === 0) {
        return { expDiffs, actDiffs };
    }

    if (remN === 0) {
        for (let j = prefix; j < m - suffix; j++) actDiffs[j] = true;
        return { expDiffs, actDiffs };
    }

    if (remM === 0) {
        for (let i = prefix; i < n - suffix; i++) expDiffs[i] = true;
        return { expDiffs, actDiffs };
    }

    if (remN * remM <= 40000) {
        const dp = new Int32Array((remN + 1) * (remM + 1));
        const stride = remM + 1;

        for (let i = remN - 1; i >= 0; i--) {
            for (let j = remM - 1; j >= 0; j--) {
                if (expChars[prefix + i] === actChars[prefix + j]) {
                    dp[i * stride + j] = dp[(i + 1) * stride + (j + 1)] + 1;
                } else {
                    const down = dp[(i + 1) * stride + j];
                    const right = dp[i * stride + (j + 1)];
                    dp[i * stride + j] = down >= right ? down : right;
                }
            }
        }

        let i = 0;
        let j = 0;
        while (i < remN && j < remM) {
            if (expChars[prefix + i] === actChars[prefix + j]) {
                i++;
                j++;
            } else if (dp[(i + 1) * stride + j] >= dp[i * stride + (j + 1)]) {
                expDiffs[prefix + i] = true;
                i++;
            } else {
                actDiffs[prefix + j] = true;
                j++;
            }
        }
        while (i < remN) {
            expDiffs[prefix + i] = true;
            i++;
        }
        while (j < remM) {
            actDiffs[prefix + j] = true;
            j++;
        }
    } else {
        for (let i = prefix; i < n - suffix; i++) expDiffs[i] = true;
        for (let j = prefix; j < m - suffix; j++) actDiffs[j] = true;
    }

    return { expDiffs, actDiffs };
}

function computeSideBySideDiff(expected: string, actual: string): SideBySideDiff {
    const expLines = expected.replace(/\r\n/g, '\n').split('\n');
    const actLines = actual.replace(/\r\n/g, '\n').split('\n');
    const n = expLines.length;
    const m = actLines.length;

    const expResult: LineDiffInfo[] = expLines.map(line => ({
        isLineDiff: false,
        charDiffs: new Array<boolean>(Array.from(line).length).fill(false)
    }));
    const actResult: LineDiffInfo[] = actLines.map(line => ({
        isLineDiff: false,
        charDiffs: new Array<boolean>(Array.from(line).length).fill(false)
    }));

    const anchors: Array<[number, number]> = [];
    let prefix = 0;
    while (prefix < n && prefix < m && expLines[prefix] === actLines[prefix]) {
        anchors.push([prefix, prefix]);
        prefix++;
    }

    let suffix = 0;
    while (
        suffix < n - prefix &&
        suffix < m - prefix &&
        expLines[n - 1 - suffix] === actLines[m - 1 - suffix]
    ) {
        suffix++;
    }

    const remN = n - prefix - suffix;
    const remM = m - prefix - suffix;

    if (remN > 0 && remM > 0 && remN * remM <= 10000) {
        const dp = new Int32Array((remN + 1) * (remM + 1));
        const stride = remM + 1;

        for (let i = remN - 1; i >= 0; i--) {
            for (let j = remM - 1; j >= 0; j--) {
                if (expLines[prefix + i] === actLines[prefix + j]) {
                    dp[i * stride + j] = dp[(i + 1) * stride + (j + 1)] + 1;
                } else {
                    const down = dp[(i + 1) * stride + j];
                    const right = dp[i * stride + (j + 1)];
                    dp[i * stride + j] = down >= right ? down : right;
                }
            }
        }

        let i = 0;
        let j = 0;
        while (i < remN && j < remM) {
            if (expLines[prefix + i] === actLines[prefix + j]) {
                anchors.push([prefix + i, prefix + j]);
                i++;
                j++;
            } else if (dp[(i + 1) * stride + j] >= dp[i * stride + (j + 1)]) {
                i++;
            } else {
                j++;
            }
        }
    }

    for (let k = suffix - 1; k >= 0; k--) {
        anchors.push([n - 1 - k, m - 1 - k]);
    }
    anchors.push([n, m]);

    let prevExp = 0;
    let prevAct = 0;

    for (const [nextExp, nextAct] of anchors) {
        const gapExp = nextExp - prevExp;
        const gapAct = nextAct - prevAct;
        const pairedCount = Math.min(gapExp, gapAct);

        for (let offset = 0; offset < pairedCount; offset++) {
            const eIdx = prevExp + offset;
            const aIdx = prevAct + offset;
            const { expDiffs, actDiffs } = diffLineChars(expLines[eIdx], actLines[aIdx]);
            expResult[eIdx].charDiffs = expDiffs;
            actResult[aIdx].charDiffs = actDiffs;
        }

        for (let offset = pairedCount; offset < gapExp; offset++) {
            const eIdx = prevExp + offset;
            expResult[eIdx].isLineDiff = true;
            expResult[eIdx].charDiffs.fill(true);
        }

        for (let offset = pairedCount; offset < gapAct; offset++) {
            const aIdx = prevAct + offset;
            actResult[aIdx].isLineDiff = true;
            actResult[aIdx].charDiffs.fill(true);
        }

        prevExp = nextExp + 1;
        prevAct = nextAct + 1;
    }

    return { expected: expResult, actual: actResult };
}

function getWhitespaceMismatchHint(actual: string, expected: string): string | null {
    const normActual = actual.replace(/\r\n/g, '\n');
    const normExpected = expected.replace(/\r\n/g, '\n');

    if (normActual === normExpected) return null;

    if (normActual.trim() === normExpected.trim()) {
        const actualTrailingNl = (normActual.match(/\n+$/)?.[0].length) ?? 0;
        const expectedTrailingNl = (normExpected.match(/\n+$/)?.[0].length) ?? 0;

        if (actualTrailingNl !== expectedTrailingNl) {
            return `Output content matches, but trailing newline count differs (Your Output: ${actualTrailingNl} newline, Expected: ${expectedTrailingNl} newline).`;
        }
        return 'Output content matches, but leading or trailing spaces differ.';
    }

    if (
        normActual.replace(/\s+/g, ' ').trim() ===
        normExpected.replace(/\s+/g, ' ').trim()
    ) {
        return 'Output values match, but spacing or line breaks inside the output differ.';
    }

    return null;
}

function formatTextMeta(text: string): string {
    const normalized = text.replace(/\r\n/g, '\n');
    const chars = normalized.length;
    const lines = normalized.split('\n').length;
    return `${lines} ${lines === 1 ? 'line' : 'lines'} · ${chars} ${chars === 1 ? 'char' : 'chars'}`;
}

function renderFormattedText(
    text: string,
    showWhitespace: boolean,
    lineDiffs?: LineDiffInfo[]
): React.ReactNode {
    const normalized = text.replace(/\r\n/g, '\n');
    const lines = normalized.split('\n');

    return lines.map((line, lineIdx) => {
        const lineDiff = lineDiffs?.[lineIdx];

        if (!showWhitespace && !lineDiff) {
            return (
                <div key={lineIdx} className={styles.ioLine}>
                    {line}
                </div>
            );
        }

        const isEmptyLine = line === '';

        const chars = Array.from(line).map((ch, charIdx) => {
            const isDiff = lineDiff?.charDiffs[charIdx] ?? false;

            if (ch === ' ') {
                if (!showWhitespace) {
                    return (
                        <span key={charIdx} className={isDiff ? styles.diffChar : undefined}>
                            {' '}
                        </span>
                    );
                }
                return (
                    <span
                        key={charIdx}
                        className={`${styles.wsSpace} ${isDiff ? styles.wsDiffSpace : ''}`}
                    >
                        {' '}
                    </span>
                );
            }

            if (ch === '\t') {
                if (!showWhitespace) {
                    return (
                        <span key={charIdx} className={isDiff ? styles.diffChar : undefined}>
                            {'\t'}
                        </span>
                    );
                }
                return (
                    <span
                        key={charIdx}
                        className={`${styles.wsTab} ${isDiff ? styles.wsDiffTab : ''}`}
                    >
                        {'\t'}
                    </span>
                );
            }

            return isDiff ? (
                <span key={charIdx} className={styles.diffChar}>
                    {ch}
                </span>
            ) : (
                <React.Fragment key={charIdx}>{ch}</React.Fragment>
            );
        });

        return (
            <div key={lineIdx} className={styles.ioLine}>
                {chars}
                {showWhitespace && isEmptyLine && (
                    <span
                        className={`${styles.wsNewline} ${lineDiff?.isLineDiff ? styles.wsNewlineDiff : ''}`}
                        aria-hidden="true"
                    >
                        ↵
                    </span>
                )}
            </div>
        );
    });
}

function BottomBar() {

    /* The current active menu */
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [tabs, setTabs] = useState<TestTab[]>([]);
    const [activeTabId, setActiveTabId] = useState<string | null>(null);
    const [whitespaceOverride, setWhitespaceOverride] = useState<boolean | null>(null);
    // Static Analysis
    const [activeView, setActiveView] = useState<'tests' | 'analysis'>('tests');

    /* Adjustable bottom bar height */
    const [bottomBarHeight, setBottomBarHeight] = useState(280);

    useEffect(() => {
        const publishState = () => {
            window.dispatchEvent(new CustomEvent('onBottomBarStateChange', { detail: { isOpen, activeView } }));
        };

        publishState();
        window.addEventListener('onRequestBottomBarState', publishState);

        return () => window.removeEventListener('onRequestBottomBarState', publishState);
    }, [isOpen, activeView]);

    useEffect(() => {
        if (activeTabId && !tabs.find(t => t.id === activeTabId)) {
            setActiveTabId(tabs[0]?.id || null);
        }
    }, [tabs, activeTabId]);

    useEffect(() => {
        const handleTestResults = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            const results: BackendResultItem[] = detail.results;
            const batchName: string = detail.name || 'Test Result';
            const testCasesMap = detail.testCasesMap || {};

            setIsOpen(true);
            // Static Analysis: hasil test kembali menampilkan Test Results.
            setActiveView('tests');

            const now = new Date();
            const executeAtStr = now.toLocaleTimeString('en-US', { hour12: false });

            setTabs(prevTabs => {
                let updated = [...prevTabs];

                results.forEach((res, index) => {
                    const existingTab = updated.find(t => t.id === res.id);
                    const matchingTestCase = testCasesMap[res.id];
                    const testCaseData: TestCase = existingTab ? existingTab.testCase : (matchingTestCase || {
                        id: res.id,
                        input: '',
                        expectedOutput: ''
                    });

                    // Gunakan perbandingan string kosong murni (tanpa .trim()) agar spasi kosong (" ") tetap dianggap valid
                    const currentExpected = matchingTestCase ? matchingTestCase.expectedOutput : testCaseData.expectedOutput;
                    const expectedIsEmpty = !currentExpected || currentExpected === '';
                    let statusStr = res.error ? 'RUNTIME ERROR' : (res.passed ? 'ACCEPTED' : 'WRONG ANSWER');

                    if (!res.error && expectedIsEmpty) {
                        statusStr = 'FINISHED';
                    }

                    const isMemoryUnavailable = res.memory_kb < 0;
                    const memoryStr = isMemoryUnavailable ? 'N/A' : `${res.memory_kb} KB`;
                    const memoryTooltip = isMemoryUnavailable
                        ? 'Memory usage unavailable: process terminated too quickly before OS metrics could be sampled.'
                        : 'Peak working set memory usage';

                    const outputStr = res.error ? res.error : res.actual_output;
                    const newResult: TestResult = {
                        status: statusStr,
                        runtime: `${res.duration_ms} ms`,
                        memory: memoryStr,
                        memoryTooltip,
                        exitCode: res.error ? 1 : 0,
                        compiler: res.compiler_version || 'GCC 13.2.0 -O2',
                        executeAt: executeAtStr,
                        output: outputStr
                    };

                    const tabName = results.length === 1 ? batchName : `Test Case ${index + 1}`;

                    if (existingTab) {
                        updated = updated.map(t => t.id === res.id ? { 
                            ...t, 
                            result: newResult, 
                            name: tabName, 
                            testCase: matchingTestCase ? matchingTestCase : t.testCase 
                        } : t);
                    } else {
                        updated.push({
                            id: res.id,
                            name: tabName,
                            testCase: testCaseData,
                            result: newResult
                        });
                    }
                });

                updated.sort((a, b) => {
                    const matchA = a.name.match(/Test Case (\d+)/);
                    const matchB = b.name.match(/Test Case (\d+)/);
                    if (matchA && matchB) {
                        return parseInt(matchA[1], 10) - parseInt(matchB[1], 10);
                    }
                    return 0;
                });

                if (results.length > 0 && !activeTabId) {
                    setActiveTabId(results[0].id);
                }

                return updated;
            });
        };

        const handleDelete = (e: Event) => {
            const { id } = (e as CustomEvent).detail;
            setTabs(prev => prev.filter(t => t.id !== id));
        };

        // Static Analysis: toggle tetap menutup panel jika mode yang sama sedang aktif.
        const handleToggle = () => {
            setIsOpen(prev => activeView === 'tests' ? !prev : true);
            setActiveView('tests');
        };

        const handleToggleAnalysis = () => {
            setIsOpen(prev => activeView === 'analysis' ? !prev : true);
            setActiveView('analysis');
        };

        window.addEventListener('onTestResultsComputed', handleTestResults);
        window.addEventListener('onDeleteTestCase', handleDelete);
        window.addEventListener('onToggleBottomBar', handleToggle);
        window.addEventListener('onToggleAnalysis', handleToggleAnalysis);

        return () => {
            window.removeEventListener('onTestResultsComputed', handleTestResults);
            window.removeEventListener('onDeleteTestCase', handleDelete);
            window.removeEventListener('onToggleBottomBar', handleToggle);
            window.removeEventListener('onToggleAnalysis', handleToggleAnalysis);
        };
    }, [activeTabId, activeView]); 

    function closeTab(e: React.MouseEvent, id: string) {
        e.stopPropagation();
        setTabs(prev => prev.filter(t => t.id !== id));
    }

    const MIN_HEIGHT = 150;
    const MAX_HEIGHT = 600;

    function handleResizeStart(event: React.PointerEvent<HTMLDivElement>) {
        event.currentTarget.setPointerCapture(event.pointerId);
        const startY = event.clientY;
        const startHeight = bottomBarHeight;

        function handleResize(event: PointerEvent) {
            const delta = startY - event.clientY;
            const newHeight = Math.min(
                MAX_HEIGHT,
                Math.max(MIN_HEIGHT, startHeight + delta)
            );
            setBottomBarHeight(newHeight);
        }

        function handleResizeEnd() {
            window.removeEventListener("pointermove", handleResize);
            window.removeEventListener("pointerup", handleResizeEnd);
            document.body.classList.remove(styles["resizing-body"]);
        }

        document.body.classList.add(styles["resizing-body"]);
        window.addEventListener("pointermove", handleResize);
        window.addEventListener("pointerup", handleResizeEnd);
    }

    const activeTabData = tabs.find(t => t.id === activeTabId);
    const isWhitespaceVisible =
        whitespaceOverride !== null
            ? whitespaceOverride
            : activeTabData?.result.status === 'WRONG ANSWER';

    const isWrongAnswer = activeTabData?.result.status === 'WRONG ANSWER';

    const whitespaceMismatchHint =
        activeTabData && isWrongAnswer
            ? getWhitespaceMismatchHint(
                  activeTabData.result.output,
                  activeTabData.testCase.expectedOutput
              )
            : null;

    const sideBySideDiff =
        activeTabData && isWrongAnswer
            ? computeSideBySideDiff(
                  activeTabData.testCase.expectedOutput,
                  activeTabData.result.output
              )
            : null;

    if (!isOpen) return null;

    return (
        <>
            {/* The menu views when any menu is active */}
            {isOpen && (
                <div className={styles.container} style={{ height: bottomBarHeight }}>
                    {/* Sidebar resize handler */}
                    <div
                        className={styles.resizer}
                        onPointerDown={handleResizeStart} 
                    />

                    <div className={styles.header}>
                        <div className={styles.headerTitle}>
                            <span>{activeView === 'analysis' ? 'Analysis' : 'Test Results'}</span>
                        </div>
                        
                        <div className={styles.tabsContainer}>
                            {activeView === 'tests' && tabs.map(tab => {
                                const isActive = activeTabId === tab.id;
                                return (
                                    <div 
                                        key={tab.id}
                                        className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
                                        onClick={() => setActiveTabId(tab.id)}
                                    >
                                        <span>{tab.name}</span>
                                        <div 
                                            className={styles.closeBtn}
                                            onClick={(e) => closeTab(e, tab.id)}
                                            title="Close"
                                        >
                                            <X size={14} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {activeView === 'tests' && activeTabData && (
                            <div className={styles.headerActions}>
                                <button
                                    type="button"
                                    className={`${styles.wsToggleBtn} ${isWhitespaceVisible ? styles.wsToggleBtnActive : ''}`}
                                    onClick={() => setWhitespaceOverride(!isWhitespaceVisible)}
                                    title="Toggle visible spaces (·) and newlines (↵)"
                                >
                                    <span className={styles.wsPilcrow}>¶</span>
                                    <span>Whitespace</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className={styles.content}>
                        {activeView === 'analysis' ? (
                            <AnalysisView />
                        ) : activeTabData ? (
                            <div className={styles.resultLayout}>
                                <div className={styles.statsPanel}>
                                    {[
                                        { label: 'Status', value: activeTabData.result.status, isBadge: true },
                                        { label: 'Runtime', value: activeTabData.result.runtime },
                                        { label: 'Memory', value: activeTabData.result.memory, tooltip: activeTabData.result.memoryTooltip },
                                        { label: 'Exit Code', value: activeTabData.result.exitCode },
                                        { label: 'Compiler', value: activeTabData.result.compiler },
                                        { label: 'Execute At', value: activeTabData.result.executeAt },
                                    ].map((item) => (
                                        <div key={item.label} className={styles.statRow}>
                                            <span className={styles.statLabel}>{item.label}</span>
                                            {item.isBadge ? (
                                                <span className={`${styles.statusBadge} ${
                                                    item.value === 'ACCEPTED' ? styles.statusAccepted : 
                                                    item.value === 'FINISHED' ? styles.statusFinished : 
                                                    styles.statusFailed
                                                }`}>
                                                    {item.value}
                                                </span>
                                            ) : (
                                                <span
                                                    className={styles.statValue}
                                                    title={item.tooltip}
                                                    style={item.tooltip ? { cursor: 'help' } : undefined}
                                                >
                                                    {item.value}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className={styles.ioPanel}>
                                    {whitespaceMismatchHint && (
                                        <div className={styles.mismatchBanner}>
                                            <Info size={14} className={styles.mismatchIcon} />
                                            <span>{whitespaceMismatchHint}</span>
                                        </div>
                                    )}

                                    <div className={styles.ioRow}>
                                        <div className={styles.ioGroup}>
                                            <div className={styles.ioLabelRow}>
                                                <span className={styles.ioLabel}>Input</span>
                                                {activeTabData.testCase.input !== '' && (
                                                    <span className={styles.ioMeta}>
                                                        {formatTextMeta(activeTabData.testCase.input)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={styles.ioBox}>
                                                {activeTabData.testCase.input !== ''
                                                    ? renderFormattedText(activeTabData.testCase.input, isWhitespaceVisible)
                                                    : <span className={styles.emptyText}>Empty</span>}
                                            </div>
                                        </div>
                                        <div className={styles.ioGroup}>
                                            <div className={styles.ioLabelRow}>
                                                <span className={styles.ioLabel}>Expected Output</span>
                                                {activeTabData.testCase.expectedOutput !== '' && (
                                                    <span className={styles.ioMeta}>
                                                        {formatTextMeta(activeTabData.testCase.expectedOutput)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={styles.ioBox}>
                                                {activeTabData.testCase.expectedOutput !== ''
                                                    ? renderFormattedText(
                                                          activeTabData.testCase.expectedOutput,
                                                          isWhitespaceVisible,
                                                          sideBySideDiff?.expected
                                                      )
                                                    : <span className={styles.emptyText}>Empty</span>}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className={styles.ioGroup} style={{ width: '100%' }}>
                                        <div className={styles.ioLabelRow}>
                                            <span className={styles.ioLabel}>Your Output</span>
                                            {activeTabData.result.output !== '' && activeTabData.result.status !== 'RUNTIME ERROR' && (
                                                <span className={styles.ioMeta}>
                                                    {formatTextMeta(activeTabData.result.output)}
                                                </span>
                                            )}
                                        </div>
                                        <div className={styles.ioBox}>
                                            {activeTabData.result.output !== ''
                                                ? renderFormattedText(
                                                      activeTabData.result.output,
                                                      isWhitespaceVisible && activeTabData.result.status !== 'RUNTIME ERROR',
                                                      sideBySideDiff?.actual
                                                  )
                                                : <span className={styles.emptyText}>Empty</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIconWrapper}>
                                    <Play size={18} className={styles.playHintIcon} />
                                </div>
                                <span className={styles.emptyStateTitle}>No Test Cases Executed Yet</span>
                                <span className={styles.emptyStateSub}>
                                    Open the <span className={styles.highlightRun}>Test Cases</span> panel on the right sidebar and click the <span className={styles.highlightRun}>Run</span> button to evaluate your code.
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

export default BottomBar;
