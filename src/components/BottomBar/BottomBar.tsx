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
        const createMockResult = (expectedOutput: string): TestResult => {
            const now = new Date();
            return {
                status: 'ACCEPTED', 
                runtime: `${Math.floor(Math.random() * 10) + 1} ms`,
                memory: '256 KB',
                exitCode: 0,
                compiler: 'GCC 13.2.0 -O2',
                executeAt: now.toLocaleTimeString('en-US', { hour12: false }),
                output: expectedOutput || 'No output'
            };
        };

        const handleRunSingle = (e: Event) => {
            const { testCase, name } = (e as CustomEvent).detail;
            setIsOpen(true);
            setTabs(prev => {
                const existing = prev.find(t => t.id === testCase.id);
                if (existing) {
                    return prev.map(t => t.id === testCase.id 
                        ? { ...t, result: createMockResult(testCase.expectedOutput), name } 
                        : t
                    );
                }
                return [...prev, { id: testCase.id, name, testCase, result: createMockResult(testCase.expectedOutput) }];
            });
            setActiveTabId(testCase.id);
        };

        const handleRunAll = (e: Event) => {
            const { testCases } = (e as CustomEvent).detail;
            setIsOpen(true);
            
            setTabs(() => {
                const newTabs: TestTab[] = testCases.map((tc: TestCase, i: number) => ({
                    id: tc.id,
                    name: `Test Case ${i + 1}`,
                    testCase: tc,
                    result: createMockResult(tc.expectedOutput)
                }));
                if (newTabs.length > 0) setActiveTabId(newTabs[0].id);
                return newTabs;
            });
        };

        const handleDelete = (e: Event) => {
            const { id } = (e as CustomEvent).detail;
            setTabs(prev => prev.filter(t => t.id !== id));
        };

        const handleToggle = () => setIsOpen(prev => !prev);

        window.addEventListener('onRunSingleTest', handleRunSingle);
        window.addEventListener('onRunAllTests', handleRunAll);
        window.addEventListener('onDeleteTestCase', handleDelete);
        window.addEventListener('onToggleBottomBar', handleToggle);

        return () => {
            window.removeEventListener('onRunSingleTest', handleRunSingle);
            window.removeEventListener('onRunAllTests', handleRunAll);
            window.removeEventListener('onDeleteTestCase', handleDelete);
            window.removeEventListener('onToggleBottomBar', handleToggle);
        };
    }, []); 

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
                                                <span className={styles.statusBadge}>{item.value}</span>
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
