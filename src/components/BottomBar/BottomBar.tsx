import React, { useState, useEffect } from 'react';
import { X, Play } from 'lucide-react'; 
import styles from './BottomBar.module.css';

interface TestCase {
    id: string;
    input: string;
    expectedOutput: string;
}

interface TestResult {
    status: string;
    runtime: string;
    memory: string;
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

function BottomBar() {

    /* The current active menu */
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [tabs, setTabs] = useState<TestTab[]>([]);
    const [activeTabId, setActiveTabId] = useState<string | null>(null);

    /* Adjustable bottom bar height */
    const [bottomBarHeight, setBottomBarHeight] = useState(280);

    useEffect(() => {
        window.dispatchEvent(new CustomEvent('onBottomBarStateChange', { detail: { isOpen } }));
    }, [isOpen]);

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

                    const expectedIsEmpty = !testCaseData.expectedOutput || testCaseData.expectedOutput.trim() === '';
                    let statusStr = res.error ? 'RUNTIME ERROR' : (res.passed ? 'ACCEPTED' : 'WRONG ANSWER');

                    if (!res.error && expectedIsEmpty) {
                        statusStr = 'FINISHED';
                    }

                    const outputStr = res.error ? res.error : res.actual_output;
                    const newResult: TestResult = {
                        status: statusStr,
                        runtime: `${res.duration_ms} ms`,
                        memory: `${res.memory_kb} KB`,
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

        const handleToggle = () => setIsOpen(prev => !prev);

        window.addEventListener('onTestResultsComputed', handleTestResults);
        window.addEventListener('onDeleteTestCase', handleDelete);
        window.addEventListener('onToggleBottomBar', handleToggle);

        return () => {
            window.removeEventListener('onTestResultsComputed', handleTestResults);
            window.removeEventListener('onDeleteTestCase', handleDelete);
            window.removeEventListener('onToggleBottomBar', handleToggle);
        };
    }, [activeTabId]); 

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
                    <span>Test Results</span>
                </div>
                
                <div className={styles.tabsContainer}>
                    {tabs.map(tab => {
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
            </div>

            <div className={styles.content}>
                {activeTabData ? (
                    <div className={styles.resultLayout}>
                        <div className={styles.statsPanel}>
                            {[
                                { label: 'Status', value: activeTabData.result.status, isBadge: true },
                                { label: 'Runtime', value: activeTabData.result.runtime },
                                { label: 'Memory', value: activeTabData.result.memory },
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
                                        <span className={styles.statValue}>{item.value}</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className={styles.ioPanel}>
                            <div className={styles.ioRow}>
                                <div className={styles.ioGroup}>
                                    <span className={styles.ioLabel}>Input</span>
                                    <div className={styles.ioBox}>
                                        {activeTabData.testCase.input || <span className={styles.emptyText}>Empty</span>}
                                    </div>
                                </div>
                                <div className={styles.ioGroup}>
                                    <span className={styles.ioLabel}>Expected Output</span>
                                    <div className={styles.ioBox}>
                                        {activeTabData.testCase.expectedOutput || <span className={styles.emptyText}>Empty</span>}
                                    </div>
                                </div>
                            </div>
                            
                            <div className={styles.ioGroup} style={{ width: '100%' }}>
                                <span className={styles.ioLabel}>Your Output</span>
                                <div className={styles.ioBox}>
                                    {activeTabData.result.output || <span className={styles.emptyText}>Empty</span>}
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
