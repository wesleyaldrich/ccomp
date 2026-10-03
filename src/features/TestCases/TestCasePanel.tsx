import { useState, useEffect } from 'react';
import { Minus, Play, Plus, X } from 'lucide-react';
import { load } from '@tauri-apps/plugin-store'; 
import styles from './TestCasePanel.module.css';

interface TestCase {
    id: string;
    input: string;
    expectedOutput: string;
}

interface TestCasePanelProps {
    onClose: () => void;
}

export default function TestCasePanel({ onClose }: TestCasePanelProps) {
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load data
    useEffect(() => {
        async function loadData() {
            try {
                const store = await load('ccomp_test_cases.json', { autoSave: false });
                const savedData = await store.get<TestCase[]>('testcases');
                
                if (savedData && savedData.length > 0) {
                    setTestCases(savedData);
                } else {
                    setTestCases([{ id: crypto.randomUUID(), input: '', expectedOutput: '' }]);
                }
            } catch (e) {
                console.error("Gagal memuat test cases dari disk", e);
                setTestCases([{ id: crypto.randomUUID(), input: '', expectedOutput: '' }]);
            } finally {
                setIsLoaded(true);
            }
        }
        
        void loadData();
    }, []);

    // Save data
    useEffect(() => {
        async function saveData() {
            if (isLoaded) {
                const store = await load('ccomp_test_cases.json', { autoSave: false });
                await store.set('testcases', testCases);
                await store.save();
            }
        }

        void saveData();
    }, [testCases, isLoaded]);

    function updateTestCase(id: string, field: keyof TestCase, value: string) {
        setTestCases(prev => prev.map(tc => 
            tc.id === id ? { ...tc, [field]: value } : tc
        ));
    }

    function addTestCase() {
        setTestCases(prev => [...prev, { id: crypto.randomUUID(), input: '', expectedOutput: '' }]);
    }

    function deleteTestCase(id: string) {
        setTestCases(prev => prev.filter(tc => tc.id !== id));
    }

    return (
        <div className={styles.container}>
            {/* Top Main Header */}
            <div className={styles.mainHeader}>
                <span className={styles.title}>TESTS</span>
                <div className={styles.headerIcons}>
                    <Minus size={16} strokeWidth={2} onClick={onClose} />
                </div>
            </div>

            {/* Sub Header */}
            <div className={styles.subHeader}>
                <span className={styles.subTitle}>Test Cases</span>
                <button className={styles.runAllBtn}>
                    <Play size={13} strokeWidth={2.5} /> Run All
                </button>
            </div>

            {/* Column Labels */}
            <div className={styles.labelsRow}>
                <span className={styles.labelNum}></span>
                <span className={styles.labelText}>Input</span>
                <span className={styles.labelText}>Expected Output</span>
                <span className={styles.labelAction}></span>
            </div>

            {/* Test Cases List */}
            <div className={styles.list}>
                {testCases.map((tc, index) => (
                    <div key={tc.id} className={styles.testRow}>
                        <div className={styles.testNumber}>{index + 1}</div>
                        
                        <textarea
                            className={styles.textarea}
                            value={tc.input}
                            onChange={(e) => updateTestCase(tc.id, 'input', e.target.value)}
                            spellCheck={false}
                        />
                        
                        <textarea
                            className={styles.textarea}
                            value={tc.expectedOutput}
                            onChange={(e) => updateTestCase(tc.id, 'expectedOutput', e.target.value)}
                            spellCheck={false}
                        />
                        
                        <div className={styles.actionButtons}>
                            <button className={styles.runBtn} title="Run Test Case">
                                <Play size={16} strokeWidth={2} />
                            </button>
                            
                            <button 
                                className={styles.deleteBtn} 
                                title="Delete Test Case"
                                onClick={() => deleteTestCase(tc.id)}
                            >
                                <X size={16} strokeWidth={2} />
                            </button>
                        </div>
                    </div>
                ))}
                
                <button className={styles.addBtn} onClick={addTestCase}>
                    <Plus size={14} /> Add Test Case
                </button>
            </div>
        </div>
    );
}
