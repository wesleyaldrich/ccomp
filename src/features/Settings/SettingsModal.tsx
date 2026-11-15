import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Search,
    X,
    Star,
    Plus,
    Trash2,
    RotateCcw,
    Cpu,
    Info,
    MoreVertical,
    Check,
    Settings as SettingsIcon,
} from 'lucide-react';
import {
    AppSettings,
    DEFAULT_RULES,
    DEFAULT_SETTINGS,
    RuleSeverity,
    SettingsTab,
} from './settingsTypes';
import { loadAppSettings, saveAppSettings } from './useSettingsStore';
import styles from './SettingsModal.module.css';

interface SettingsModalProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function SettingsModal({ isOpen: controlledIsOpen, onClose }: SettingsModalProps) {
    const [internalOpen, setInternalOpen] = useState<boolean>(false);
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;

    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [draft, setDraft] = useState<AppSettings>(() => structuredClone(DEFAULT_SETTINGS));
    const [isSaving, setIsSaving] = useState<boolean>(false);

    // State untuk Rules bulk selection
    const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);

    // State untuk form + Add Compiler & dropdown titik tiga
    const [showAddCompiler, setShowAddCompiler] = useState<boolean>(false);
    const [newCompilerName, setNewCompilerName] = useState<string>('');
    const [newCompilerPath, setNewCompilerPath] = useState<string>('');
    const [newCompilerVersion, setNewCompilerVersion] = useState<string>('');
    const [openCompilerMenuId, setOpenCompilerMenuId] = useState<string | null>(null);

    const dropdownContainerRef = useRef<HTMLDivElement | null>(null);

    const handleClose = () => {
        setShowAddCompiler(false);
        setOpenCompilerMenuId(null);
        setSearchQuery('');
        if (onClose) {
            onClose();
        } else {
            setInternalOpen(false);
        }
    };

    // Sinkronkan status aktif ikon Settings di SidebarLeft
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('onSettingsStateChange', { detail: { isOpen } }));
    }, [isOpen]);

    // Dengarkan event global agar bisa dibuka dari SidebarLeft maupun komponen lain
    useEffect(() => {
        const handleOpenEvent = () => setInternalOpen(true);
        const handleToggleEvent = () => setInternalOpen(prev => !prev);

        window.addEventListener('onOpenSettings', handleOpenEvent);
        window.addEventListener('onToggleSettings', handleToggleEvent);

        return () => {
            window.removeEventListener('onOpenSettings', handleOpenEvent);
            window.removeEventListener('onToggleSettings', handleToggleEvent);
        };
    }, []);

    // Tutup dropdown titik tiga jika klik di luar area menu
    useEffect(() => {
        if (!openCompilerMenuId) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownContainerRef.current &&
                !dropdownContainerRef.current.contains(e.target as Node)
            ) {
                setOpenCompilerMenuId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openCompilerMenuId]);

    // Muat pengaturan hanya saat modal pertama kali dibuka
    useEffect(() => {
        if (!isOpen) return;
        let mounted = true;

        loadAppSettings().then(loaded => {
            if (mounted) {
                setDraft(loaded);
                setSelectedRuleIds([]);
                setOpenCompilerMenuId(null);
            }
        });

        return () => {
            mounted = false;
        };
    }, [isOpen]);

    // Handle tombol Escape untuk menutup dropdown terlebih dahulu atau modal
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (openCompilerMenuId) {
                    setOpenCompilerMenuId(null);
                } else {
                    handleClose();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, openCompilerMenuId]);

    // Statistik dinamis untuk tab Rules
    const ruleStats = useMemo(() => {
        const total = draft.rules.length;
        const enabledRules = draft.rules.filter(r => r.enabled);
        const warnings = enabledRules.filter(r => r.severity === 'Warning').length;
        const errors = enabledRules.filter(r => r.severity === 'Error').length;
        return {
            total,
            enabled: enabledRules.length,
            warnings,
            errors,
        };
    }, [draft.rules]);

    // Filter rules berdasarkan search query
    const filteredRules = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return draft.rules;
        return draft.rules.filter(
            r =>
                r.id.toLowerCase().includes(q) ||
                r.name.toLowerCase().includes(q) ||
                r.category.toLowerCase().includes(q) ||
                r.description.toLowerCase().includes(q)
        );
    }, [draft.rules, searchQuery]);

    // Filter compilers berdasarkan search query
    const filteredCompilers = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return draft.compiler.compilers;
        return draft.compiler.compilers.filter(
            c =>
                c.name.toLowerCase().includes(q) ||
                c.path.toLowerCase().includes(q) ||
                c.version.toLowerCase().includes(q)
        );
    }, [draft.compiler.compilers, searchQuery]);

    const activeCompiler = useMemo(() => {
        return (
            draft.compiler.compilers.find(c => c.isDefault) ||
            draft.compiler.compilers[0]
        );
    }, [draft.compiler.compilers]);

    // Otomatis pindah tab jika user mengetik kata kunci spesifik di Search
    useEffect(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return;

        const matchesGeneral =
            'auto save delay font family font size tab size editor'.includes(q) ||
            q.includes('save') ||
            q.includes('font');
        const matchesRules = draft.rules.some(
            r => r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)
        );
        const matchesCompiler =
            'gcc mingw compiler standard optimization flag time limit tle'.includes(q) ||
            draft.compiler.compilers.some(c => c.name.toLowerCase().includes(q));

        if (activeTab === 'general' && !matchesGeneral) {
            if (matchesRules) setActiveTab('rules');
            else if (matchesCompiler) setActiveTab('compiler');
        } else if (activeTab === 'rules' && !matchesRules) {
            if (matchesGeneral) setActiveTab('general');
            else if (matchesCompiler) setActiveTab('compiler');
        } else if (activeTab === 'compiler' && !matchesCompiler) {
            if (matchesGeneral) setActiveTab('general');
            else if (matchesRules) setActiveTab('rules');
        }
    }, [searchQuery]);

    // Handlers untuk Rules
    const toggleRuleEnabled = (id: string) => {
        setDraft(prev => ({
            ...prev,
            rules: prev.rules.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
        }));
    };

    const updateRuleSeverity = (id: string, severity: RuleSeverity) => {
        setDraft(prev => ({
            ...prev,
            rules: prev.rules.map(r => (r.id === id ? { ...r, severity } : r)),
        }));
    };

    const toggleSelectAllRules = () => {
        if (selectedRuleIds.length === filteredRules.length && filteredRules.length > 0) {
            setSelectedRuleIds([]);
        } else {
            setSelectedRuleIds(filteredRules.map(r => r.id));
        }
    };

    const toggleSelectRule = (id: string) => {
        setSelectedRuleIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const bulkSetRulesEnabled = (enabled: boolean) => {
        setDraft(prev => ({
            ...prev,
            rules: prev.rules.map(r =>
                selectedRuleIds.includes(r.id) ? { ...r, enabled } : r
            ),
        }));
    };

    const resetRulesToDefault = () => {
        setDraft(prev => ({
            ...prev,
            rules: structuredClone(DEFAULT_RULES),
        }));
        setSelectedRuleIds([]);
    };

    // Handlers untuk Compiler
    const setDefaultCompiler = (id: string) => {
        setDraft(prev => ({
            ...prev,
            compiler: {
                ...prev.compiler,
                compilers: prev.compiler.compilers.map(c => ({
                    ...c,
                    isDefault: c.id === id,
                })),
            },
        }));
        setOpenCompilerMenuId(null);
    };

    const handleAddCompiler = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCompilerName.trim() || !newCompilerPath.trim()) return;

        const newEntry = {
            id: `custom-${crypto.randomUUID()}`,
            name: newCompilerName.trim(),
            path: newCompilerPath.trim(),
            version: newCompilerVersion.trim() || 'Custom',
            language: 'C',
            available: true,
            isDefault: false,
            isBuiltIn: false,
        };

        setDraft(prev => ({
            ...prev,
            compiler: {
                ...prev.compiler,
                compilers: [...prev.compiler.compilers, newEntry],
            },
        }));

        setNewCompilerName('');
        setNewCompilerPath('');
        setNewCompilerVersion('');
        setShowAddCompiler(false);
    };

    const removeCustomCompiler = (id: string) => {
        setDraft(prev => {
            const remaining = prev.compiler.compilers.filter(c => c.id !== id);
            const hasDefault = remaining.some(c => c.isDefault);
            if (!hasDefault && remaining.length > 0) {
                remaining[0].isDefault = true;
            }
            return {
                ...prev,
                compiler: {
                    ...prev.compiler,
                    compilers: remaining,
                },
            };
        });
        setOpenCompilerMenuId(null);
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            await saveAppSettings(draft);
            handleClose();
        } catch (err) {
            alert(`Gagal menyimpan pengaturan: ${err}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                {/* Left Navigation Sidebar */}
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <div className={styles.logoBadge}>
                            <SettingsIcon size={15} />
                        </div>
                        <span className={styles.modalTitle}>Settings</span>
                    </div>

                    <div className={styles.searchWrapper}>
                        <Search size={13} className={styles.searchIcon} />
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search settings..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                className={styles.clearSearchBtn}
                                onClick={() => setSearchQuery('')}
                                title="Clear search"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    <nav className={styles.navList}>
                        <button
                            type="button"
                            className={`${styles.navItem} ${activeTab === 'general' ? styles.navItemActive : ''}`}
                            onClick={() => setActiveTab('general')}
                        >
                            General
                        </button>
                        <button
                            type="button"
                            className={`${styles.navItem} ${activeTab === 'rules' ? styles.navItemActive : ''}`}
                            onClick={() => setActiveTab('rules')}
                        >
                            Rules
                        </button>
                        <button
                            type="button"
                            className={`${styles.navItem} ${activeTab === 'compiler' ? styles.navItemActive : ''}`}
                            onClick={() => setActiveTab('compiler')}
                        >
                            Compiler
                        </button>
                    </nav>
                </aside>

                {/* Right Main Content */}
                <div className={styles.mainArea}>
                    <div className={styles.scrollContent}>
                        {/* TAB 1: GENERAL */}
                        {activeTab === 'general' && (
                            <div className={styles.sectionContainer}>
                                <div className={styles.groupHeader}>
                                    <span className={styles.groupTitle}>Application</span>
                                    <div className={styles.groupLine} />
                                </div>

                                <div className={styles.settingRow}>
                                    <div className={styles.settingInfo}>
                                        <span className={styles.settingLabel}>Auto Save</span>
                                        <span className={styles.settingDesc}>
                                            Automatically save active C source files after edits
                                        </span>
                                    </div>
                                    <label className={styles.switch}>
                                        <input
                                            type="checkbox"
                                            checked={draft.general.autoSave}
                                            onChange={e =>
                                                setDraft(prev => ({
                                                    ...prev,
                                                    general: {
                                                        ...prev.general,
                                                        autoSave: e.target.checked,
                                                    },
                                                }))
                                            }
                                        />
                                        <span className={styles.slider} />
                                    </label>
                                </div>

                                <div className={styles.settingRow}>
                                    <div className={styles.settingInfo}>
                                        <span className={styles.settingLabel}>Auto Save Delay</span>
                                        <span className={styles.settingDesc}>
                                            Delay in milliseconds before auto-saving changes
                                        </span>
                                    </div>
                                    <select
                                        className={styles.selectInput}
                                        disabled={!draft.general.autoSave}
                                        value={draft.general.autoSaveDelayMs}
                                        onChange={e =>
                                            setDraft(prev => ({
                                                ...prev,
                                                general: {
                                                    ...prev.general,
                                                    autoSaveDelayMs: Number(e.target.value),
                                                },
                                            }))
                                        }
                                    >
                                        <option value={500}>500 ms</option>
                                        <option value={1000}>1000 ms (1s)</option>
                                        <option value={2000}>2000 ms (2s)</option>
                                        <option value={5000}>5000 ms (5s)</option>
                                    </select>
                                </div>

                                <div className={styles.groupHeader} style={{ marginTop: 28 }}>
                                    <span className={styles.groupTitle}>Editor Appearance</span>
                                    <div className={styles.groupLine} />
                                </div>

                                <div className={styles.settingRow}>
                                    <div className={styles.settingInfo}>
                                        <span className={styles.settingLabel}>Font Family</span>
                                        <span className={styles.settingDesc}>
                                            Editor monospace font family
                                        </span>
                                    </div>
                                    <select
                                        className={styles.selectInput}
                                        value={draft.general.fontFamily}
                                        onChange={e =>
                                            setDraft(prev => ({
                                                ...prev,
                                                general: {
                                                    ...prev.general,
                                                    fontFamily: e.target.value,
                                                },
                                            }))
                                        }
                                    >
                                        <option value="JetBrains Mono">JetBrains Mono</option>
                                        <option value="Fira Code">Fira Code</option>
                                        <option value="Cascadia Code">Cascadia Code</option>
                                        <option value="Consolas">Consolas</option>
                                    </select>
                                </div>

                                <div className={styles.settingRow}>
                                    <div className={styles.settingInfo}>
                                        <span className={styles.settingLabel}>Font Size</span>
                                        <span className={styles.settingDesc}>
                                            Editor font size in pixels
                                        </span>
                                    </div>
                                    <select
                                        className={styles.selectInput}
                                        value={draft.general.fontSize}
                                        onChange={e =>
                                            setDraft(prev => ({
                                                ...prev,
                                                general: {
                                                    ...prev.general,
                                                    fontSize: Number(e.target.value),
                                                },
                                            }))
                                        }
                                    >
                                        <option value={12}>12px</option>
                                        <option value={13}>13px</option>
                                        <option value={14}>14px</option>
                                        <option value={15}>15px</option>
                                        <option value={16}>16px</option>
                                        <option value={18}>18px</option>
                                    </select>
                                </div>

                                <div className={styles.settingRow}>
                                    <div className={styles.settingInfo}>
                                        <span className={styles.settingLabel}>Tab Size</span>
                                        <span className={styles.settingDesc}>
                                            Number of spaces equivalent to a tab
                                        </span>
                                    </div>
                                    <select
                                        className={styles.selectInput}
                                        value={draft.general.tabSize}
                                        onChange={e =>
                                            setDraft(prev => ({
                                                ...prev,
                                                general: {
                                                    ...prev.general,
                                                    tabSize: Number(e.target.value),
                                                },
                                            }))
                                        }
                                    >
                                        <option value={2}>2 spaces</option>
                                        <option value={4}>4 spaces</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: RULES */}
                        {activeTab === 'rules' && (
                            <div className={styles.sectionContainer}>
                                <div className={styles.pageHeaderRow}>
                                    <div>
                                        <h2 className={styles.pageTitle}>Rules</h2>
                                        <p className={styles.pageSubtitle}>
                                            Configure static analysis rules used by the Rules Engine.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className={styles.resetLinkBtn}
                                        onClick={resetRulesToDefault}
                                    >
                                        <RotateCcw size={13} />
                                        Reset to Default
                                    </button>
                                </div>

                                {/* 4 Summary Cards */}
                                <div className={styles.statsGrid}>
                                    <div className={styles.statCard}>
                                        <span className={styles.statCardLabel}>Total Rules</span>
                                        <span className={styles.statCardValue}>{ruleStats.total}</span>
                                    </div>
                                    <div className={styles.statCard}>
                                        <span className={`${styles.statCardLabel} ${styles.textGreen}`}>
                                            Enabled
                                        </span>
                                        <span className={`${styles.statCardValue} ${styles.textGreen}`}>
                                            {ruleStats.enabled}
                                        </span>
                                    </div>
                                    <div className={styles.statCard}>
                                        <span className={`${styles.statCardLabel} ${styles.textAmber}`}>
                                            Warnings
                                        </span>
                                        <span className={`${styles.statCardValue} ${styles.textAmber}`}>
                                            {ruleStats.warnings}
                                        </span>
                                    </div>
                                    <div className={styles.statCard}>
                                        <span className={`${styles.statCardLabel} ${styles.textRed}`}>
                                            Errors
                                        </span>
                                        <span className={`${styles.statCardValue} ${styles.textRed}`}>
                                            {ruleStats.errors}
                                        </span>
                                    </div>
                                </div>

                                {/* Bulk Action Bar jika ada checkbox yang dipilih */}
                                {selectedRuleIds.length > 0 && (
                                    <div className={styles.bulkBar}>
                                        <span>{selectedRuleIds.length} rule(s) selected</span>
                                        <div className={styles.bulkActions}>
                                            <button
                                                type="button"
                                                className={styles.secondarySmallBtn}
                                                onClick={() => bulkSetRulesEnabled(true)}
                                            >
                                                Enable Selected
                                            </button>
                                            <button
                                                type="button"
                                                className={styles.secondarySmallBtn}
                                                onClick={() => bulkSetRulesEnabled(false)}
                                            >
                                                Disable Selected
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Rules Table */}
                                <div className={styles.tableWrapper}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th style={{ width: 36 }}>
                                                    <input
                                                        type="checkbox"
                                                        className={styles.checkbox}
                                                        checked={
                                                            filteredRules.length > 0 &&
                                                            selectedRuleIds.length === filteredRules.length
                                                        }
                                                        onChange={toggleSelectAllRules}
                                                    />
                                                </th>
                                                <th className={styles.rulesColHeader}>Rules</th>
                                                <th>Category</th>
                                                <th>Severity</th>
                                                <th>Status</th>
                                                <th>Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredRules.map(rule => (
                                                <tr key={rule.id}>
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            className={styles.checkbox}
                                                            checked={selectedRuleIds.includes(rule.id)}
                                                            onChange={() => toggleSelectRule(rule.id)}
                                                        />
                                                    </td>
                                                    <td className={styles.rulesColCell}>
                                                        <div className={styles.ruleNameCell}>
                                                            <span className={styles.ruleId}>{rule.id}</span>
                                                            <span className={styles.ruleName}>{rule.name}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`${styles.badge} ${
                                                                styles[`cat${rule.category}`]
                                                            }`}
                                                        >
                                                            {rule.category}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <select
                                                            className={`${styles.severitySelect} ${
                                                                styles[`sev${rule.severity}`]
                                                            }`}
                                                            value={rule.severity}
                                                            onChange={e =>
                                                                updateRuleSeverity(
                                                                    rule.id,
                                                                    e.target.value as RuleSeverity
                                                                )
                                                            }
                                                        >
                                                            <option value="Error">Error</option>
                                                            <option value="Warning">Warning</option>
                                                            <option value="Info">Info</option>
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <label className={styles.switch}>
                                                            <input
                                                                type="checkbox"
                                                                checked={rule.enabled}
                                                                onChange={() => toggleRuleEnabled(rule.id)}
                                                            />
                                                            <span className={styles.slider} />
                                                        </label>
                                                    </td>
                                                    <td className={styles.descCell}>{rule.description}</td>
                                                </tr>
                                            ))}
                                            {filteredRules.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className={styles.emptyTableCell}>
                                                        No matching rules found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: COMPILER */}
                        {activeTab === 'compiler' && (
                            <div className={styles.sectionContainer}>
                                <div className={styles.pageHeaderRow}>
                                    <div>
                                        <h2 className={styles.pageTitle}>Compiler</h2>
                                        <p className={styles.pageSubtitle}>
                                            Manage and configure compilers used for building and running your code.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className={styles.primaryBtn}
                                        onClick={() => setShowAddCompiler(prev => !prev)}
                                    >
                                        <Plus size={14} />
                                        Add Compiler
                                    </button>
                                </div>

                                {/* Inline Form Tambah Compiler */}
                                {showAddCompiler && (
                                    <form className={styles.addCompilerCard} onSubmit={handleAddCompiler}>
                                        <div className={styles.addCompilerGrid}>
                                            <input
                                                type="text"
                                                className={styles.textInput}
                                                placeholder="Compiler Name (e.g. MinGW GCC 14)"
                                                value={newCompilerName}
                                                onChange={e => setNewCompilerName(e.target.value)}
                                                required
                                            />
                                            <input
                                                type="text"
                                                className={styles.textInput}
                                                placeholder="Executable Path (e.g. C:\mingw64\bin\gcc.exe)"
                                                value={newCompilerPath}
                                                onChange={e => setNewCompilerPath(e.target.value)}
                                                required
                                            />
                                            <input
                                                type="text"
                                                className={styles.textInput}
                                                placeholder="Version (e.g. 14.2.0)"
                                                value={newCompilerVersion}
                                                onChange={e => setNewCompilerVersion(e.target.value)}
                                            />
                                        </div>
                                        <div className={styles.addCompilerActions}>
                                            <button
                                                type="button"
                                                className={styles.cancelBtn}
                                                onClick={() => setShowAddCompiler(false)}
                                            >
                                                Cancel
                                            </button>
                                            <button type="submit" className={styles.primaryBtn}>
                                                Add to List
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* Active Compiler Card */}
                                {activeCompiler && (
                                    <div className={styles.activeCompilerCard}>
                                        <div className={styles.activeCompilerHeader}>Active Compiler</div>
                                        <div className={styles.activeCompilerBody}>
                                            <div className={styles.activeCompilerName}>
                                                {activeCompiler.name} ({activeCompiler.version})
                                            </div>
                                            <div className={styles.activeCompilerPath}>{activeCompiler.path}</div>
                                            <div className={styles.activeCompilerLang}>{activeCompiler.language}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Build & Execution Flags */}
                                <div className={styles.groupHeader} style={{ marginTop: 22 }}>
                                    <span className={styles.groupTitle}>Build & Execution Options</span>
                                    <div className={styles.groupLine} />
                                </div>

                                <div className={styles.buildOptionsGrid}>
                                    <div className={styles.buildOptionItem}>
                                        <label className={styles.settingLabel}>C Language Standard</label>
                                        <select
                                            className={styles.selectInputFull}
                                            value={draft.compiler.cStandard}
                                            onChange={e =>
                                                setDraft(prev => ({
                                                    ...prev,
                                                    compiler: {
                                                        ...prev.compiler,
                                                        cStandard: e.target.value,
                                                    },
                                                }))
                                            }
                                        >
                                            <option value="gnu11">GNU11 (-std=gnu11)</option>
                                            <option value="c11">ISO C11 (-std=c11)</option>
                                            <option value="c17">ISO C17 (-std=c17)</option>
                                            <option value="c99">ISO C99 (-std=c99)</option>
                                        </select>
                                    </div>

                                    <div className={styles.buildOptionItem}>
                                        <label className={styles.settingLabel}>Optimization Level</label>
                                        <select
                                            className={styles.selectInputFull}
                                            value={draft.compiler.optimizationLevel}
                                            onChange={e =>
                                                setDraft(prev => ({
                                                    ...prev,
                                                    compiler: {
                                                        ...prev.compiler,
                                                        optimizationLevel: e.target.value,
                                                    },
                                                }))
                                            }
                                        >
                                            <option value="-O2">-O2 (Competitive Standard)</option>
                                            <option value="-O0">-O0 (No Optimization / Debug)</option>
                                            <option value="-O3">-O3 (Maximum Speed)</option>
                                            <option value="-Og">-Og (Optimize Debugging)</option>
                                        </select>
                                    </div>

                                    <div className={styles.buildOptionItem}>
                                        <label className={styles.settingLabel}>Execution Time Limit (TLE)</label>
                                        <select
                                            className={styles.selectInputFull}
                                            value={draft.compiler.timeLimitMs}
                                            onChange={e =>
                                                setDraft(prev => ({
                                                    ...prev,
                                                    compiler: {
                                                        ...prev.compiler,
                                                        timeLimitMs: Number(e.target.value),
                                                    },
                                                }))
                                            }
                                        >
                                            <option value={1000}>1000 ms (1.0s)</option>
                                            <option value={2000}>2000 ms (2.0s)</option>
                                            <option value={3000}>3000 ms (3.0s)</option>
                                            <option value={5000}>5000 ms (5.0s)</option>
                                        </select>
                                    </div>

                                    <div className={styles.buildOptionItem}>
                                        <label className={styles.settingLabel}>Compiler Warnings (-Wall -Wextra)</label>
                                        <div style={{ display: 'flex', alignItems: 'center', height: 34 }}>
                                            <label className={styles.switch}>
                                                <input
                                                    type="checkbox"
                                                    checked={draft.compiler.enableAllWarnings}
                                                    onChange={e =>
                                                        setDraft(prev => ({
                                                            ...prev,
                                                            compiler: {
                                                                ...prev.compiler,
                                                                enableAllWarnings: e.target.checked,
                                                            },
                                                        }))
                                                    }
                                                />
                                                <span className={styles.slider} />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Installed Compiler Table */}
                                <h3 className={styles.subSectionTitle}>Installed Compiler</h3>
                                <div className={styles.tableWrapper}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>Compiler</th>
                                                <th>Version</th>
                                                <th>Language</th>
                                                <th>Status</th>
                                                <th style={{ textAlign: 'center' }}>Default</th>
                                                <th style={{ width: 44 }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredCompilers.map(comp => {
                                                const isMenuOpen = openCompilerMenuId === comp.id;
                                                return (
                                                    <tr key={comp.id}>
                                                        <td>
                                                            <div className={styles.compilerInfoCell}>
                                                                <div className={styles.compilerIconBox}>
                                                                    <Cpu size={14} />
                                                                </div>
                                                                <div>
                                                                    <div className={styles.compilerName}>{comp.name}</div>
                                                                    <div className={styles.compilerPath}>{comp.path}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>{comp.version}</td>
                                                        <td>{comp.language}</td>
                                                        <td>
                                                            <span className={styles.statusAvailable}>
                                                                <span className={styles.statusDot} />
                                                                Available
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <button
                                                                type="button"
                                                                className={styles.starBtn}
                                                                onClick={() => setDefaultCompiler(comp.id)}
                                                                title={
                                                                    comp.isDefault
                                                                        ? 'Default compiler'
                                                                        : 'Set as default compiler'
                                                                }
                                                            >
                                                                <Star
                                                                    size={16}
                                                                    fill={comp.isDefault ? '#2563eb' : 'none'}
                                                                    color={comp.isDefault ? '#2563eb' : '#64748b'}
                                                                />
                                                            </button>
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <div
                                                                className={styles.actionMenuWrapper}
                                                                ref={isMenuOpen ? dropdownContainerRef : null}
                                                            >
                                                                <button
                                                                    type="button"
                                                                    className={styles.moreBtn}
                                                                    onClick={e => {
                                                                        e.stopPropagation();
                                                                        setOpenCompilerMenuId(prev =>
                                                                            prev === comp.id ? null : comp.id
                                                                        );
                                                                    }}
                                                                    title="More actions"
                                                                >
                                                                    <MoreVertical size={15} />
                                                                </button>

                                                                {isMenuOpen && (
                                                                    <div className={styles.dropdownMenu}>
                                                                        <button
                                                                            type="button"
                                                                            className={styles.dropdownItem}
                                                                            disabled={comp.isDefault}
                                                                            onClick={() => setDefaultCompiler(comp.id)}
                                                                        >
                                                                            <Check size={13} />
                                                                            <span>Set as Default</span>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className={`${styles.dropdownItem} ${
                                                                                comp.isBuiltIn
                                                                                    ? styles.dropdownItemDisabled
                                                                                    : styles.dropdownItemDanger
                                                                            }`}
                                                                            disabled={comp.isBuiltIn}
                                                                            title={
                                                                                comp.isBuiltIn
                                                                                    ? 'Bundled compiler cannot be removed'
                                                                                    : 'Remove this compiler'
                                                                            }
                                                                            onClick={() => {
                                                                                if (!comp.isBuiltIn) {
                                                                                    removeCustomCompiler(comp.id);
                                                                                }
                                                                            }}
                                                                        >
                                                                            <Trash2 size={13} />
                                                                            <span>Remove Compiler</span>
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    <div className={styles.tableFooterHint}>
                                        <Info size={14} color="#3b82f6" />
                                        <span>
                                            Click the star icon or action menu to set the default compiler or remove custom compilers.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sticky Footer Actions */}
                    <footer className={styles.footer}>
                        <button
                            type="button"
                            className={styles.cancelBtn}
                            onClick={handleClose}
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className={styles.primaryBtn}
                            onClick={handleSaveChanges}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </footer>
                </div>
            </div>
        </div>
    );
}
