import React, { useState, useEffect, useRef } from 'react';
import { IoClose, IoArrowBack, IoMenu, IoSearch, IoAdd, IoLibrary, IoLockClosed, IoEllipsisVertical, IoPrint, IoConstructOutline, IoRefreshOutline } from 'react-icons/io5';
import Swal from 'sweetalert2';
import appLogo from '../assets/app-logo.png';
import docLogo from '../assets/doc-logo.png';
import GridTestSection from './GridTestSection';

export default function ReportWorkspace({ initialSelect, onEdit, onAdd }) {
    const [allTemplates, setAllTemplates] = useState([]);
    const [activeReportLines, setActiveReportLines] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [isHistoryMode, setIsHistoryMode] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [currentReportId, setCurrentReportId] = useState(null);
    const reportBottomRef = useRef(null);
    const lastBatchRef = useRef(null);

    const [patientInfo, setPatientInfo] = useState({
        name: "WALK-IN PATIENT",
        id: "AL-2026-...",
        age: "32",
        gender: "Male",
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
        labNo: "10928",
        refBy: localStorage.getItem('lastRefBy') || "DR. SALMAN KHAN"
    });

    // Fetch initial sequential ID
    useEffect(() => {
        if (!isHistoryMode && activeReportLines.length === 0) {
            updatePatientId();
        }
    }, []);
    const [searchTerm, setSearchTerm] = useState("");
    const [labInfo, setLabInfo] = useState({
        name: "AL-IMRAN",
        brand: " LABORATORY",
        tagline: "Advanced Diagnostic & Research Center",
    });
    const [printerStatus, setPrinterStatus] = useState({ name: 'Checking...', status: 'Offline' });

    // Load Printer Status
    useEffect(() => {
        const fetchStatus = async () => {
            if (window.electronAPI && window.electronAPI.getPrinterStatus) {
                const status = await window.electronAPI.getPrinterStatus();
                setPrinterStatus(status);
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const filteredTemplates = allTemplates.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        loadTemplates();
        if (initialSelect && !initialSelect.isHistory) {
            setIsHistoryMode(false);
            addToReport(initialSelect);
        }
    }, [initialSelect]);

    useEffect(() => {
        if (initialSelect && initialSelect.isHistory) {
            setIsHistoryMode(true);
            loadSavedReport(initialSelect.id);
        }
    }, [initialSelect]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeMenuId && !event.target.closest('.test-menu-container')) {
                setActiveMenuId(null);
            }
            if (isMenuOpen && !event.target.closest('.global-settings-menu')) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeMenuId, isMenuOpen]);

    const loadSavedReport = async (id) => {
        try {

            // Clear current state first
            setActiveReportLines([]);
            const result = await window.electronAPI.getReportById(id);
            if (result) {
                setCurrentReportId(result.id);
                const data = JSON.parse(result.report_data);
                setPatientInfo(data.patientInfo || { name: "", id: "", age: "", gender: "", date: "", labNo: "", refBy: "" });
                setLabInfo(data.labInfo || {});
                setActiveReportLines(data.activeReportLines || []);
            }
        } catch (err) {
            console.error("Failed to load archived report", err);
        }
    };

    const loadTemplates = async () => {
        if (window.electronAPI) {
            const data = await window.electronAPI.getTestTemplates();
            setAllTemplates(data || []);
        }
    };

    const addToReport = (template) => {
        try {
            // Automatically assign next patient ID if it's currently empty/default and we're starting a report
            // We do this non-blockingly to avoid UI hang
            if (!isHistoryMode && activeReportLines.length === 0 && (patientInfo.name === "" || patientInfo.name === "WALK-IN PATIENT")) {
                updatePatientId();
            }

            const parsed = JSON.parse(template.items);
            let rows = [];
            let meta = {};

            if (Array.isArray(parsed)) {
                rows = parsed;
            } else {
                rows = parsed.rows || [];
                meta = parsed.meta || {};
            }

            const batchId = `batch-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;

            // Initial config from meta
            let currentConfig = {
                showTest: meta.showTest !== false,
                showUnit: meta.showUnit !== false,
                showValue: meta.showValue !== false,
                showResult: meta.showResult !== false,
                testLabel: meta.testLabel || "Investigation",
                unitLabel: meta.unitLabel || "Unit",
                valueLabel: meta.valueLabel || "Reference Range",
                resultLabel: meta.resultLabel || "Result"
            };

            // Capture initial fixed config for the main top header
            const initialConfig = { ...currentConfig };

            let currentGridHeader = null;

            const processedRows = rows.map(r => {
                if (r.type === 'subheading') {
                    // Subheadings can override column visibility for subsequent tests
                    currentConfig = {
                        ...currentConfig,
                        showTest: r.showTest !== false,
                        showUnit: r.showUnit !== false,
                        showValue: r.showValue !== false,
                        showResult: r.showResult !== false,
                        // Labels can also be overridden if present in subheading r
                        testLabel: r.testLabel || currentConfig.testLabel,
                        unitLabel: r.unitLabel || currentConfig.unitLabel,
                        valueLabel: r.valueLabel || currentConfig.valueLabel,
                        resultLabel: r.resultLabel || currentConfig.resultLabel
                    };

                    // Track grid header for subsequent test rows
                    if (r.isGridHeader && r.gridLabels && r.gridLabels.length > 0) {
                        currentGridHeader = {
                            gridLabels: r.gridLabels,
                            isGridHeader: true
                        };
                    } else {
                        currentGridHeader = null;
                    }
                }

                // Pass grid configuration to test rows
                const rowData = { ...r, columnConfig: { ...currentConfig }, parentTemplateId: template.id, batchId };
                if (currentGridHeader && r.type === 'test') {
                    rowData.gridConfig = currentGridHeader;
                    // Initialize gridResults if not present
                    if (!rowData.gridResults) {
                        rowData.gridResults = {};
                    }
                }

                if (r.type === 'matrix') {
                    rowData.matrixRows = (r.matrixRows || []).map(row => ({
                        ...row,
                        values: row.values && row.values.length === r.headers.length
                            ? [...row.values]
                            : r.headers.map(() => "")
                    }));
                }

                return rowData;
            });

            const newLines = [
                {
                    type: 'header_main',
                    text: template.name,
                    subtitle: meta.subtitle,
                    batchId,
                    columnConfig: initialConfig // Use the captured initialConfig to prevent subheading leakage
                },
                ...processedRows
            ];

            setActiveReportLines(prev => [...prev, ...newLines]);
            lastBatchRef.current = batchId;
        } catch (e) {
            console.error("Failed to add template to report", e);
        }
    };

    const updatePatientId = async () => {
        if (window.electronAPI && window.electronAPI.getNextPatientId) {
            const nextId = await window.electronAPI.getNextPatientId();
            setPatientInfo(prev => ({ ...prev, id: nextId }));
        }
    };

    // Auto-scroll effect
    useEffect(() => {
        if (lastBatchRef.current) {
            const element = document.getElementById(lastBatchRef.current);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                lastBatchRef.current = null; // Reset to avoid flickering/repeated scrolls
            }
        }
    }, [activeReportLines]);

    const removeBatch = (batchId) => {
        setActiveReportLines(prev => prev.filter(line => line.batchId !== batchId));
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        const result = await Swal.fire({
            title: 'Delete Template?',
            text: "Permanently delete this test template from the system?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, Delete'
        });

        if (result.isConfirmed) {
            await window.electronAPI.deleteTestTemplate(id);
            loadTemplates();
            setActiveMenuId(null);
            Swal.fire({
                title: 'Deleted!',
                text: 'Template has been removed.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        }
    };

    const handleLabChange = (field, value) => {
        setLabInfo(prev => ({ ...prev, [field]: value }));
    };

    const handlePatientChange = (field, value) => {
        setPatientInfo(prev => {
            const updated = { ...prev, [field]: value };
            if (field === 'refBy') {
                localStorage.setItem('lastRefBy', value);
            }
            return updated;
        });
    };

    const handleLineChange = (index, field, value) => {
        const updated = [...activeReportLines];
        updated[index] = { ...updated[index], [field]: value };
        setActiveReportLines(updated);
    };

    const handleMatrixValueChange = (index, rowIndex, colIndex, value) => {
        setActiveReportLines(prev => {
            const updated = [...prev];
            if (!updated[index]) return prev;

            const line = { ...updated[index] };
            if (!line.matrixRows) return prev;

            line.matrixRows = line.matrixRows.map((row, rIdx) => {
                if (rIdx === rowIndex) {
                    const rowValues = [...(row.values || [])];
                    if (rowValues.length <= colIndex) {
                        // Ensure the array is long enough if it somehow isn't
                        while (rowValues.length <= colIndex) rowValues.push("");
                    }
                    rowValues[colIndex] = value;
                    return { ...row, values: rowValues };
                }
                return row;
            });

            updated[index] = line;
            return updated;
        });
    };


    const getReportGridStyle = (config) => {
        if (!config) return { display: 'grid', gridTemplateColumns: '3.5fr 0.7fr 2.3fr 1.5fr', gap: '1rem' };
        const parts = [];
        if (config.showTest) parts.push("3.5fr");
        if (config.showUnit) parts.push("0.7fr");
        if (config.showValue) parts.push("2.3fr");
        if (config.showResult) parts.push("1.5fr");
        return {
            display: 'grid',
            gridTemplateColumns: parts.join(" "),
            gap: '1rem'
        };
    };

    const handleSaveReport = async (isSilent = false) => {
        if (isSaving) return false; // Prevent duplicate clicks

        if (!patientInfo.name || activeReportLines.length === 0) {
            Swal.fire({
                title: 'Missing Data',
                text: 'Please ensure patient name is entered and report has lines.',
                icon: 'warning',
                confirmButtonColor: '#0f172a'
            });
            return false;
        }

        const report = {
            id: currentReportId,
            patient_name: patientInfo.name,
            patient_id: patientInfo.id,
            report_data: {
                patientInfo,
                labInfo,
                activeReportLines
            }
        };

        try {
            setIsSaving(true);
            let result;
            if (currentReportId) {
                result = await window.electronAPI.updateReport(report);
            } else {
                result = await window.electronAPI.saveReport(report);
                if (result.success) {
                    setCurrentReportId(result.id);
                }
            }

            if (!isSilent) {
                Swal.fire({
                    title: 'Success!',
                    text: 'Report saved successfully to archive.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            // If it's a new report, we should refresh the sequential ID for the next one
            if (!isHistoryMode) {
                updatePatientId();
            }
            return true;
        } catch (err) {
            console.error("Save failed", err);
            Swal.fire({
                title: 'Failed!',
                text: 'Failed to save report.',
                icon: 'error',
                confirmButtonColor: '#0f172a'
            });
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrintWorkflow = async () => {
        if (isSaving) return; // Prevent duplicate clicks

        try {
            setIsSaving(true);

            // 1. Prepare for printing (Save if in composer mode or update if existing)
            if (!isHistoryMode) {
                // Prepare report data
                const report = {
                    id: currentReportId,
                    patient_name: patientInfo.name,
                    patient_id: patientInfo.id,
                    report_data: { patientInfo, labInfo, activeReportLines }
                };

                // Validate before saving
                if (!patientInfo.name || activeReportLines.length === 0) {
                    Swal.fire({
                        title: 'Missing Data',
                        text: 'Please enter patient name and add modules before printing.',
                        icon: 'warning',
                        confirmButtonColor: '#0f172a'
                    });
                    setIsSaving(false);
                    return;
                }

                // Save or Update
                if (currentReportId) {
                    await window.electronAPI.updateReport(report);
                } else {
                    const result = await window.electronAPI.saveReport(report);
                    if (result.success) {
                        setCurrentReportId(result.id);
                    }
                }

                // Do NOT updatePatientId here if we want to keep working on SAME report
                // ID should only refresh on handleReset for NEW patient
            }

            // 2. Trigger Print Dialog
            // We await it so IS_SAVING stays true while the dialog is active
            if (window.electronAPI && window.electronAPI.printWindow) {
                await window.electronAPI.printWindow();
            } else {
                window.print();
            }
        } catch (err) {
            console.error("Print workflow failed:", err);
            // Don't show error if it was just a manual cancel in main process
        } finally {
            // Short delay to prevent accidental double-tap logic
            setTimeout(() => setIsSaving(false), 500);
        }
    };

    const handleExport = async () => {
        if (window.electronAPI && window.electronAPI.exportDb) {
            const result = await window.electronAPI.exportDb();
            if (result.success) {
                Swal.fire({
                    title: 'Exported!',
                    text: result.message,
                    icon: 'success',
                    confirmButtonColor: '#0f172a'
                });
            } else if (result.message !== 'Export cancelled') {
                Swal.fire({
                    title: 'Export Failed',
                    text: result.message,
                    icon: 'error',
                    confirmButtonColor: '#0f172a'
                });
            }
        }
    };

    const handleImport = async () => {
        if (window.electronAPI && window.electronAPI.importDb) {
            const result = await window.electronAPI.importDb();
            if (result.success) {
                Swal.fire({
                    title: 'Imported!',
                    text: result.message,
                    icon: 'success',
                    confirmButtonColor: '#0f172a'
                });
                loadTemplates(); // Refresh lists
            } else if (result.message !== 'Import cancelled') {
                Swal.fire({
                    title: 'Import Failed',
                    text: result.message,
                    icon: 'error',
                    confirmButtonColor: '#0f172a'
                });
            }
        }
    };

    const handleDeleteAll = async () => {
        const result1 = await Swal.fire({
            title: 'EXTREME WARNING',
            text: "This will PERMANENTLY delete ALL patient records and reports. This action cannot be undone. Are you absolutely sure?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, Wipe Everything'
        });

        if (!result1.isConfirmed) return;

        const result2 = await Swal.fire({
            title: 'FINAL VERIFICATION',
            text: "You are about to wipe the entire patient database. Click confirm to proceed.",
            icon: 'error',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Confirm Permanent Destruction'
        });

        if (!result2.isConfirmed) return;

        if (window.electronAPI && window.electronAPI.deleteAllReports) {
            const result = await window.electronAPI.deleteAllReports();
            if (result.success) {
                Swal.fire({
                    title: 'Wiped!',
                    text: result.message,
                    icon: 'success',
                    confirmButtonColor: '#0f172a'
                });
                handleReset(true);
            } else {
                Swal.fire({
                    title: 'Error',
                    text: result.message,
                    icon: 'error',
                    confirmButtonColor: '#0f172a'
                });
            }
        }
    };

    const handleDeleteAllTemplates = async () => {
        const result1 = await Swal.fire({
            title: 'Wipe All Templates?',
            text: "This will PERMANENTLY delete ALL test templates from your inventory. This cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, Delete All Templates'
        });

        if (!result1.isConfirmed) return;

        const result2 = await Swal.fire({
            title: 'Final Confirmation',
            text: "Are you absolutely sure you want to destroy all templates?",
            icon: 'error',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Confirm Destruction'
        });

        if (!result2.isConfirmed) return;

        if (window.electronAPI && window.electronAPI.deleteAllTestTemplates) {
            const result = await window.electronAPI.deleteAllTestTemplates();
            if (result.success) {
                Swal.fire({
                    title: 'Wiped!',
                    text: result.message,
                    icon: 'success',
                    confirmButtonColor: '#0f172a'
                });
                loadTemplates(); // Refresh lists
            } else {
                Swal.fire({
                    title: 'Error',
                    text: result.message,
                    icon: 'error',
                    confirmButtonColor: '#0f172a'
                });
            }
        }
    };

    const handleReset = async (skipConfirm = false) => {
        if (!skipConfirm) {
            const result = await Swal.fire({
                title: 'Clear Canvas?',
                text: 'All unsaved data in the current report will be lost.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#0f172a',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Yes, Reset'
            });
            if (!result.isConfirmed) return;
        }

        setActiveReportLines([]);
        setCurrentReportId(null);
        const nextId = await window.electronAPI.getNextPatientId();
        setPatientInfo({
            name: "",
            id: nextId,
            age: "",
            gender: "Male",
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
            labNo: "",
            refBy: localStorage.getItem('lastRefBy') || "DR. SALMAN KHAN"
        });
        setIsHistoryMode(false);
    };

    const renderPages = () => {
        const pages = [];
        let currentHeight = 0;
        const HEIGHT_LIMIT = 900; // Increased to better utilize A4 space below letterhead
        const SIGNATURE_HEIGHT = 0;

        if (activeReportLines.length === 0) {
            pages.push([]);
        } else {
            // Group lines by batchId to keep tests together
            const groups = [];
            activeReportLines.forEach((line, idx) => {
                const indexedLine = { ...line, originalIndex: idx };
                if (groups.length > 0 && groups[groups.length - 1].batchId === line.batchId) {
                    groups[groups.length - 1].lines.push(indexedLine);
                } else {
                    groups.push({ batchId: line.batchId, lines: [indexedLine] });
                }
            });

            groups.forEach((group, groupIdx) => {
                // Calculate total height of the group
                let groupHeight = 0;
                let mainHeader = null;
                group.lines.forEach(line => {
                    let itemHeight = 45;
                    if (line.type === 'header_main') {
                        itemHeight = 130;
                        mainHeader = line;
                    }
                    if (line.type === 'subheading') itemHeight = 65;
                    if (line.isGenderSpecific) itemHeight = 80;
                    if (line.type === 'matrix') {
                        itemHeight = 60 + ((line.matrixRows || []).length * 40);
                    }
                    groupHeight += itemHeight;
                });

                const isLastGroup = groupIdx === groups.length - 1;
                const effectiveLimit = isLastGroup ? (HEIGHT_LIMIT - SIGNATURE_HEIGHT) : HEIGHT_LIMIT;

                if (currentHeight + groupHeight > effectiveLimit) {
                    // It doesn't fit on this page
                    if (currentHeight > 0) {
                        // There's already content. Check if it fits on a clean page.
                        if (groupHeight <= HEIGHT_LIMIT) {
                            // Fits on a new page entirely - move it all
                            pages.push([...group.lines]);
                            currentHeight = groupHeight;
                        } else {
                            // Too big even for a fresh page - we must start it here and split
                            // or better, if there's enough space, start it here, otherwise fresh page
                            if (currentHeight < HEIGHT_LIMIT * 0.3) {
                                // Already at top-ish, start and split
                                fillAndSplit(group, pages, currentHeight, HEIGHT_LIMIT, mainHeader);
                                currentHeight = calculateRemainingHeight(pages[pages.length - 1], HEIGHT_LIMIT);
                            } else {
                                // Too late on page, move to fresh page then split
                                pages.push([]);
                                fillAndSplit(group, pages, 0, HEIGHT_LIMIT, mainHeader);
                                currentHeight = calculateRemainingHeight(pages[pages.length - 1], HEIGHT_LIMIT);
                            }
                        }
                    } else {
                        // First group on page and it's too big, must split
                        fillAndSplit(group, pages, 0, HEIGHT_LIMIT, mainHeader);
                        currentHeight = calculateRemainingHeight(pages[pages.length - 1], HEIGHT_LIMIT);
                    }
                } else {
                    // Fits perfectly
                    if (pages.length === 0) pages.push([]);
                    pages[pages.length - 1].push(...group.lines);
                    currentHeight += groupHeight;
                }
            });
        }

        // Helper to fill current page and split remainder
        function fillAndSplit(group, pages, currentH, limit, mainH) {
            let h = currentH;
            if (pages.length === 0) pages.push([]);

            group.lines.forEach((line, lIdx) => {
                let itemH = 45;
                if (line.type === 'header_main') itemH = 130;
                if (line.type === 'subheading') itemH = 65;
                if (line.isGenderSpecific) itemH = 80;
                if (line.type === 'matrix') {
                    itemH = 60 + ((line.matrixRows || []).length * 40);
                }

                if (h + itemH > limit) {
                    // Move to new page
                    const nextBatchLine = { ...line };
                    // If we split a test, it's professional to repeat the header on next page
                    const newPage = [];
                    if (mainH && line.type !== 'header_main') {
                        // Only repeat the main text, remove subtitle for (Contd.) pages
                        newPage.push({
                            ...mainH,
                            text: `${mainH.text} (Contd.)`,
                            subtitle: "", // Remove sub-main heading on repeated pages
                            isRepeated: true
                        });
                        h = 130 + itemH;
                    } else {
                        h = itemH;
                    }
                    newPage.push(nextBatchLine);
                    pages.push(newPage);
                } else {
                    pages[pages.length - 1].push(line);
                    h += itemH;
                }
            });
        }

        // Helper to find ending height of a page
        function calculateRemainingHeight(lines, limit) {
            let h = 0;
            if (!lines) return 0;
            lines.forEach(line => {
                let ih = 45;
                if (line.type === 'header_main') ih = 130;
                if (line.type === 'subheading') ih = 65;
                if (line.isGenderSpecific) ih = 80;
                if (line.type === 'matrix') ih = 60 + ((line.matrixRows || []).length * 40);
                h += ih;
            });
            return h;
        }

        return pages.map((pageLines, pageIdx) => (
            <div key={pageIdx} className="a4-page mb-10 mx-auto">
                {/* LAB LETTERHEAD - Professional Pathology Style */}
                <div className="border-b-4 border-slate-900 pb-4 mb-4 relative">
                    <div className="flex justify-between items-end">
                        <div className="flex gap-4 items-center">
                            <img src={docLogo} alt="Lab Logo" className="h-40 w-auto object-contain" />
                            <div className="text-left">
                                <h1 className="text-3xl font-black text-slate-900 uppercase leading-none whitespace-nowrap">
                                    {labInfo.name || "AL-IMRAN"}&nbsp; <span className="text-slate-800">{labInfo.brand || "LABORATORY"}</span>
                                </h1>
                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">{labInfo.tagline || "Advanced Diagnostic & Research Center"}</p>
                            </div>
                        </div>
                        <div className="text-right text-[8px] font-bold text-slate-600 space-y-0.5 pb-1">
                            <p>Luqman Banda</p>
                            <p>AL</p>
                            <p>PHONE: +880 1234 567890</p>
                        </div>
                    </div>
                </div>

                {/* PATIENT INFO HEADER - Tabular Professional Style */}
                <div className="grid grid-cols-[1fr_1fr] gap-x-8 gap-y-1 mb-8 px-2 py-3 bg-slate-50 border border-slate-200 rounded-lg no-print-inputs">
                    <div className="space-y-1 pr-4 border-r border-slate-200">
                        <div className="grid grid-cols-[80px_1fr] items-center">
                            <span className="font-black text-slate-900 uppercase text-[7px] tracking-widest">Name:</span>
                            <input type="text" value={patientInfo.name} readOnly={isHistoryMode} onChange={(e) => handlePatientChange('name', e.target.value)} className={`font-black text-slate-900 uppercase text-[10px] bg-transparent outline-none w-full border-b border-transparent transition-all px-1 ${!isHistoryMode && 'focus:border-slate-900 hover:bg-slate-50'}`} placeholder="ENTER PATIENT NAME" />
                        </div>
                        <div className="grid grid-cols-[80px_1fr] items-center">
                            <span className="font-black text-slate-900 uppercase text-[7px] tracking-widest">Age/Sex:</span>
                            <div className="flex gap-1">
                                <input type="text" value={patientInfo.age} readOnly={isHistoryMode} onChange={(e) => handlePatientChange('age', e.target.value)} className={`font-black text-slate-900 uppercase text-[10px] bg-transparent outline-none w-10 border-b border-transparent transition-all px-1 ${!isHistoryMode && 'focus:border-slate-900 hover:bg-slate-50'}`} placeholder="Age" />
                                <div className="text-slate-300">/</div>
                                {isHistoryMode ? (
                                    <input type="text" value={patientInfo.gender} readOnly className="font-black text-slate-900 uppercase text-[10px] bg-transparent outline-none w-full border-b border-transparent transition-all px-1" />
                                ) : (
                                    <select
                                        value={patientInfo.gender}
                                        onChange={(e) => handlePatientChange('gender', e.target.value)}
                                        className="font-black text-slate-900 uppercase text-[10px] bg-transparent outline-none w-full border-b border-transparent focus:border-slate-900 transition-all px-1 cursor-pointer hover:bg-slate-50 appearance-none"
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-[80px_1fr] items-center">
                            <span className="font-black text-slate-900 uppercase text-[7px] tracking-widest">Pat. ID:</span>
                            <input type="text" value={patientInfo.id} readOnly={isHistoryMode} onChange={(e) => handlePatientChange('id', e.target.value)} className={`font-black text-slate-900 uppercase text-[10px] bg-transparent outline-none w-full border-b border-transparent transition-all px-1 ${!isHistoryMode && 'focus:border-slate-900 hover:bg-slate-50'}`} />
                        </div>
                    </div>
                    <div className="space-y-1 pl-4">
                        <div className="grid grid-cols-[80px_1fr] items-center">
                            <span className="font-black text-slate-900 uppercase text-[7px] tracking-widest">Date:</span>
                            <input type="text" value={patientInfo.date} readOnly={isHistoryMode} onChange={(e) => handlePatientChange('date', e.target.value)} className={`font-black text-slate-900 uppercase text-[10px] bg-transparent outline-none w-full border-b border-transparent transition-all px-1 ${!isHistoryMode && 'focus:border-slate-900 hover:bg-slate-50'}`} />
                        </div>
                        <div className="grid grid-cols-[80px_1fr] items-center">
                            <span className="font-black text-slate-900 uppercase text-[7px] tracking-widest">Time:</span>
                            <input type="text" value={patientInfo.time || ""} readOnly={isHistoryMode} onChange={(e) => handlePatientChange('time', e.target.value)} className={`font-black text-slate-900 uppercase text-[10px] bg-transparent outline-none w-full border-b border-transparent transition-all px-1 ${!isHistoryMode && 'focus:border-slate-900 hover:bg-slate-50'}`} />
                        </div>

                        <div className="grid grid-cols-[80px_1fr] items-center">
                            <span className="font-black text-slate-900 uppercase text-[7px] tracking-widest">Ref By:</span>
                            <input type="text" value={patientInfo.refBy} readOnly={isHistoryMode} onChange={(e) => handlePatientChange('refBy', e.target.value)} className={`font-black text-slate-900 uppercase text-[10px] bg-transparent outline-none w-full border-b border-transparent transition-all px-1 ${!isHistoryMode && 'focus:border-slate-900 hover:bg-slate-50'}`} />
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-h-[400px]">
                    {pageLines.length > 0 ? (
                        pageLines.map((line) => {
                            const idx = line.originalIndex;
                            if (line.type === 'header_main') {
                                const config = line.columnConfig || {};
                                return (
                                    <div key={idx} id={line.batchId} className="mt-8 mb-6 text-center relative group/header">
                                        <input
                                            type="text"
                                            value={line.text}
                                            readOnly={true}
                                            className="text-lg font-black uppercase tracking-[0.2em] text-slate-900 border-y-2 border-slate-900 py-1.5 w-full text-center bg-transparent outline-none cursor-default"
                                        />
                                        {line.subtitle && (
                                            <input
                                                type="text"
                                                value={line.subtitle}
                                                readOnly={true}
                                                className="text-[10px] font-bold text-slate-700 mt-2 uppercase tracking-[0.3em] w-full text-center bg-transparent outline-none cursor-default"
                                            />
                                        )}
                                        {/* Undo / Remove Button */}
                                        {!isHistoryMode && (
                                            <button
                                                onClick={() => removeBatch(line.batchId)}
                                                className="absolute -top-4 -right-4 bg-white text-slate-400 hover:text-black hover:bg-slate-100 p-2 rounded-lg shadow-lg border border-slate-200 opacity-0 group-hover/header:opacity-100 transition-all no-print"
                                                title="Remove Test Module"
                                            >
                                                <IoClose className="w-5 h-5" />
                                            </button>
                                        )}

                                        {/* DYNAMIC COLUMN HEADERS - Only show on first instance, not on repeated (Contd.) headers */}
                                        {!line.isRepeated && (
                                            <div style={getReportGridStyle(config)} className="report-table-header items-center mt-6">
                                                {config.showTest && <span className="text-left">{config.testLabel || "Investigation"}</span>}
                                                {config.showUnit && <span className="text-center">{config.unitLabel || "Unit"}</span>}
                                                {config.showValue && <span className="text-center">{config.valueLabel || "Reference Range"}</span>}
                                                {config.showResult && <span className="text-right whitespace-nowrap">{config.resultLabel || "Result"}</span>}
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                            // Handle grid sections with GridTestSection component
                            if (line.type === 'subheading' && line.isGridHeader && line.gridLabels && line.gridLabels.length > 0) {
                                // Find all test rows that belong to this grid section
                                const gridTests = [];
                                let nextIdx = idx + 1;
                                while (nextIdx < activeReportLines.length &&
                                    activeReportLines[nextIdx].type === 'test' &&
                                    activeReportLines[nextIdx].gridConfig?.isGridHeader) {
                                    gridTests.push({
                                        ...activeReportLines[nextIdx],
                                        originalIndex: nextIdx
                                    });
                                    nextIdx++;
                                }

                                // Render using GridTestSection component
                                return (
                                    <GridTestSection
                                        key={idx}
                                        section={line}
                                        tests={gridTests}
                                        isHistoryMode={isHistoryMode}
                                        onResultChange={(testIdx, gridIdx, value) => {
                                            const actualIndex = gridTests[testIdx].originalIndex;
                                            const newGridResults = { ...(activeReportLines[actualIndex].gridResults || {}) };
                                            newGridResults[gridIdx] = value;
                                            handleLineChange(actualIndex, 'gridResults', newGridResults);
                                        }}
                                    />
                                );
                            }

                            if (line.type === 'matrix') {
                                return (
                                    <div key={idx} className="mt-8 mb-8 page-break-inside-avoid px-2">
                                        {line.title && (
                                            <div className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-900 border-b-2 border-slate-900 pb-1.5 mb-6 text-center italic">
                                                {line.title}
                                            </div>
                                        )}
                                        <div className="w-full">
                                            {/* Dynamic Matrix Header */}
                                            <div className="flex border-b-2 border-slate-900 pb-2 mb-2">
                                                <div className="w-1/3 font-black text-[10px] uppercase text-slate-500 tracking-widest pl-2">{line.rowLabel || "Test"}</div>
                                                <div className="flex-1 flex justify-around">
                                                    {(line.headers || []).map((h, hi) => (
                                                        <div key={hi} className="text-center font-black text-[10px] uppercase text-slate-900 w-full px-1">
                                                            {h}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Matrix Rows */}
                                            {(line.matrixRows || []).map((row, ri) => (
                                                <div key={ri} className="flex border-b border-slate-100 py-3 items-center hover:bg-slate-50 transition-colors group">
                                                    <div className="w-1/3 font-bold text-[10px] text-slate-800 uppercase tracking-tight pl-2">
                                                        {row.name}
                                                    </div>
                                                    <div className="flex-1 flex justify-around">
                                                        {(row.values || []).map((val, ci) => (
                                                            <div key={ci} className="w-full px-2">
                                                                {line.isPredefined ? (
                                                                    <select
                                                                        value={val || ""}
                                                                        onChange={(e) => handleMatrixValueChange(idx, ri, ci, e.target.value)}
                                                                        className="w-full text-center border-b border-slate-200 font-bold bg-transparent transition-all text-[11px] outline-none hover:border-slate-900 appearance-none cursor-pointer focus:border-blue-500 text-slate-900"
                                                                    >
                                                                        <option value="">---</option>
                                                                        {(line.resultOptions || [])
                                                                            .filter(opt => {
                                                                                if (!opt) return false;
                                                                                const t = opt.trim();
                                                                                // Filter out strings that are just dashes or empty
                                                                                return t !== "" && t !== "---" && t !== "(---)";
                                                                            })
                                                                            .map((opt, oi) => (
                                                                                <option key={oi} value={opt}>{opt}</option>
                                                                            ))}
                                                                    </select>
                                                                ) : (
                                                                    <input
                                                                        type="text"
                                                                        value={val || ""}
                                                                        onChange={(e) => handleMatrixValueChange(idx, ri, ci, e.target.value)}
                                                                        className="w-full text-center border-b border-slate-200 font-bold bg-transparent transition-all text-[11px] outline-none hover:border-slate-900 focus:border-blue-500 text-slate-900"
                                                                        placeholder="---"
                                                                    />
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }

                            // Handle standard subheadings (non-grid)
                            if (line.type === 'subheading') {
                                const hasTitle = line.text && line.text.trim() !== "";
                                const hasSubtext = line.subtext && line.subtext.trim() !== "";

                                if (!hasTitle && !hasSubtext) return null;

                                return (
                                    <div key={idx} className="mt-8 mb-4">
                                        {hasTitle && (
                                            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 border-y-2 border-slate-900 py-1.5 w-full text-center">
                                                {line.text}
                                            </div>
                                        )}
                                        {hasSubtext && (
                                            <div className={`${hasTitle ? 'text-[9px] font-bold text-slate-600 mt-2 uppercase tracking-[0.3em]' : 'text-[10px] font-black uppercase tracking-[0.15em] text-slate-900'} w-full text-center`}>
                                                {line.subtext}
                                            </div>
                                        )}

                                        {/* GRID HEADER MODE - Show custom column labels */}
                                        {line.isGridHeader && line.gridLabels && line.gridLabels.length > 0 && (
                                            <div className="mt-4 flex items-center gap-2">
                                                <div className="flex-1"></div>
                                                {line.gridLabels.map((label, gIdx) => (
                                                    <div key={gIdx} className="w-20 text-center">
                                                        <div className="text-[9px] font-black uppercase text-slate-900 border-b-2 border-slate-900 pb-1">
                                                            {label}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                            // Skip grid-mode test rows - they're rendered by GridTestSection component
                            if (line.type === 'test' && line.gridConfig && line.gridConfig.isGridHeader && line.gridConfig.gridLabels) {
                                return null;
                            }

                            // Standard test row rendering
                            return (
                                <div key={idx} style={getReportGridStyle(line.columnConfig)} className="report-row items-start">
                                    {line.columnConfig?.showTest && (
                                        <div className="font-black text-slate-900 uppercase text-[10px] leading-tight break-words py-1">
                                            {line.name}
                                        </div>
                                    )}
                                    {line.columnConfig?.showUnit && (
                                        <input
                                            type="text"
                                            value={line.unit}
                                            readOnly={true}
                                            className="text-center italic font-serif text-[9px] text-slate-900 bg-transparent outline-none w-full cursor-default"
                                        />
                                    )}
                                    {line.columnConfig?.showValue && (
                                        <div className="text-center text-[9px] font-bold text-slate-800 flex items-center justify-center gap-1 w-full">
                                            {line.isMultiRange ? (
                                                <div className="flex flex-col items-center w-full space-y-0.5">
                                                    {(line.multiRanges || [""]).map((range, rIdx) => (
                                                        <input
                                                            key={rIdx}
                                                            type="text"
                                                            value={range}
                                                            readOnly={true}
                                                            className="w-full text-center bg-transparent outline-none font-bold text-[8px] border-b border-transparent cursor-default"
                                                        />
                                                    ))}
                                                </div>
                                            ) : line.isGenderSpecific ? (
                                                (line.maleLow || line.maleHigh || line.femaleLow || line.femaleHigh) ? (
                                                    <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                                        <input type="text" value={line.maleLow} readOnly={true} className="w-4 bg-transparent outline-none text-center cursor-default" />
                                                        <span>-</span>
                                                        <input type="text" value={line.maleHigh} readOnly={true} className="w-4 bg-transparent outline-none text-center cursor-default" />
                                                        <span className="text-[6px] opacity-60">(M)</span>
                                                        <span className="mx-1 opacity-20">|</span>
                                                        <input type="text" value={line.femaleLow} readOnly={true} className="w-4 bg-transparent outline-none text-center cursor-default" />
                                                        <span>-</span>
                                                        <input type="text" value={line.femaleHigh} readOnly={true} className="w-4 bg-transparent outline-none text-center cursor-default" />
                                                        <span className="text-[6px] opacity-60">(F)</span>
                                                    </div>
                                                ) : null
                                            ) : (
                                                line.isSingleValue ? (
                                                    <input
                                                        type="text"
                                                        value={line.normalLow}
                                                        readOnly={true}
                                                        className="text-center bg-transparent outline-none w-full font-bold cursor-default"
                                                    />
                                                ) : (
                                                    (line.normalLow || line.normalHigh) ? (
                                                        <div className="flex items-center gap-1">
                                                            <input type="text" value={line.normalLow} readOnly={true} className="w-8 bg-transparent outline-none text-right cursor-default" />
                                                            <span>-</span>
                                                            <input type="text" value={line.normalHigh} readOnly={true} className="w-8 bg-transparent outline-none text-left cursor-default" />
                                                        </div>
                                                    ) : null
                                                )
                                            )}
                                        </div>
                                    )}
                                    {line.columnConfig?.showResult && (
                                        <div className="flex items-center justify-end gap-2 w-full h-7">
                                            {line.isPredefined ? (
                                                <select
                                                    value={line.result || ""}
                                                    onChange={(e) => handleLineChange(idx, 'result', e.target.value)}
                                                    className="w-full text-right border-b border-slate-100 font-black bg-transparent transition-all text-[11px] outline-none hover:border-slate-300 appearance-none cursor-pointer"
                                                >
                                                    {(line.resultOptions || []).map((opt, oIdx) => (
                                                        <option key={oIdx} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <textarea
                                                    value={line.result || ""}
                                                    readOnly={isHistoryMode}
                                                    rows={1}
                                                    onChange={(e) => handleLineChange(idx, 'result', e.target.value)}
                                                    className={`w-full text-right border-b outline-none font-black bg-transparent transition-all resize-none overflow-hidden py-0.5 ${isHistoryMode ? 'border-transparent' : 'border-slate-100 hover:border-slate-300'} text-black ${(line.result || "").length > 25 ? 'text-[7px] leading-[1.1]' :
                                                        (line.result || "").length > 15 ? 'text-[9px] leading-tight' :
                                                            'text-[11px]'
                                                        }`}
                                                    placeholder="0.00"
                                                    style={{ height: '28px' }}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30 py-20">
                            <div className="relative mb-4">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm">
                                    <IoConstructOutline className="w-8 h-8 text-slate-200" />
                                </div>
                            </div>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Composer Idle</h2>
                            <p className="text-[8px] mt-2 font-bold text-slate-300 uppercase tracking-widest">Select modules from inventory to begin</p>
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-2 border-t border-slate-200 text-center">
                    <div className="flex items-center justify-between text-[6px] font-black text-slate-400 uppercase tracking-widest">
                        <div className="flex items-center gap-4">
                            {pageIdx === pages.length - 1 && (
                                <>
                                    <span>End of Report</span>
                                    <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                </>
                            )}
                            <span>Page {pageIdx + 1} of {pages.length}</span>
                        </div>
                    </div>
                </div>
            </div>
        ));
    };

    return (
        <div className="min-h-screen bg-white flex relative overflow-hidden">
            {/* TOP NAVIGATION CLUSTER */}
            <div className="fixed top-6 left-6 z-50 flex items-center gap-2 no-print">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2.5 bg-white border border-slate-200 text-slate-900 rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all flex items-center justify-center outline-none"
                    title={isSidebarOpen ? "Close Inventory" : "Open Inventory"}
                >
                    {isSidebarOpen ? <IoClose className="w-4 h-4" /> : <IoMenu className="w-4 h-4" />}
                </button>

                {isSidebarOpen && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-300">
                        {/* History Navigation Buttons */}
                        {isHistoryMode && (
                            <button
                                onClick={() => onEdit({ isHistory: true })}
                                className="px-3 py-2 bg-slate-800 text-white rounded-lg shadow-lg font-black text-[8px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-slate-700 hover:bg-black active:scale-95"
                                title="Back to Records List"
                            >
                                <IoArrowBack className="w-3.5 h-3.5" />
                                <span>Back to List</span>
                            </button>
                        )}

                        {/* Action Toggle (History / New Test) */}
                        <button
                            onClick={async () => {
                                if (isHistoryMode) {
                                    handleReset(true);
                                } else {
                                    onEdit({ isHistory: true });
                                }
                            }}
                            className={`px-3 py-2 rounded-lg shadow-lg font-black text-[8px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 border active:scale-95 ${isHistoryMode
                                ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700'
                                : 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700'
                                }`}
                            title={isHistoryMode ? "Perform New Test" : "View History"}
                        >
                            {isHistoryMode ? <IoAdd className="w-3.5 h-3.5" /> : <IoLibrary className="w-3.5 h-3.5" />}
                            <span>{isHistoryMode ? "New Test" : "History"}</span>
                        </button>

                        {!isHistoryMode && (
                            <>
                                <button
                                    onClick={() => handleReset()}
                                    className="p-2 bg-white border border-slate-200 text-slate-400 rounded-lg shadow-lg hover:text-indigo-600 hover:scale-110 active:scale-95 transition-all flex items-center justify-center outline-none"
                                    title="Clear Canvas (Reset)"
                                >
                                    <IoRefreshOutline className="w-3.5 h-3.5" />
                                </button>

                                <div className="relative global-settings-menu">
                                    <button
                                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                                        className={`p-2 rounded-lg shadow-lg transition-all flex items-center justify-center border outline-none ${isMenuOpen ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200 hover:text-slate-900'}`}
                                        title="Database Management"
                                    >
                                        <IoEllipsisVertical className="w-3.5 h-3.5" />
                                    </button>

                                    {isMenuOpen && (
                                        <div className="absolute left-0 mt-3 w-56 bg-white border border-slate-200 shadow-2xl rounded-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="px-4 py-2 border-b border-slate-50 mb-1">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Vault</h4>
                                            </div>
                                            <button
                                                onClick={() => { handleExport(); setIsMenuOpen(false); }}
                                                className="w-full text-left px-4 py-3 text-[11px] font-black text-slate-700 hover:bg-slate-900 hover:text-white transition-all flex items-center gap-3"
                                            >
                                                <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                                                Export Data
                                            </button>
                                            <button
                                                onClick={() => { handleImport(); setIsMenuOpen(false); }}
                                                className="w-full text-left px-4 py-3 text-[11px] font-black text-slate-700 hover:bg-slate-900 hover:text-white transition-all flex items-center gap-3"
                                            >
                                                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                                Import Data
                                            </button>
                                            <div className="h-px bg-slate-100 my-1 mx-2"></div>
                                            <button
                                                onClick={() => { handleDeleteAll(); setIsMenuOpen(false); }}
                                                className="w-full text-left px-4 py-3 text-[11px] font-black text-rose-600 hover:bg-rose-600 hover:text-white transition-all flex items-center gap-3"
                                            >
                                                <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                                                Delete All Records
                                            </button>
                                            <button
                                                onClick={() => { handleDeleteAllTemplates(); setIsMenuOpen(false); }}
                                                className="w-full text-left px-4 py-3 text-[11px] font-black text-rose-600 hover:bg-rose-600 hover:text-white transition-all flex items-center gap-3"
                                            >
                                                <div className="w-2 h-2 rounded-full bg-red-600"></div>
                                                Wipe All Templates
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* SIDEBAR */}
            <aside className={`no-print fixed inset-y-0 left-0 z-40 w-72 bg-slate-50 border-r border-slate-200 transform transition-transform duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>


                <div className="flex flex-col h-full pt-20 px-4 pb-4">
                    <div className="flex items-center gap-3 mb-6 ml-2">
                        <div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Inventory</h3>
                            <p className="text-[9px] font-bold text-slate-400 mt-0.5"> Total Tests {allTemplates.length}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Search tests..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                disabled={isHistoryMode}
                                className={`w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold focus:border-slate-400 outline-none transition-all shadow-sm ${isHistoryMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                            <IoSearch className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                        </div>
                        <button
                            onClick={onAdd}
                            disabled={isHistoryMode}
                            className={`p-2.5 bg-slate-900 text-white rounded-xl shadow-md hover:bg-black transition-all active:scale-90 ${isHistoryMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={isHistoryMode ? "Cannot add templates in history mode" : "Create New Template"}
                        >
                            <IoAdd className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                        {isHistoryMode ? (
                            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-6 text-center">
                                <div className="w-16 h-16 bg-indigo-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                                    <IoLockClosed className="w-8 h-8 text-indigo-600" />
                                </div>
                                <h3 className="text-[10px] font-black text-indigo-900 uppercase tracking-wider mb-2">Finalized Report</h3>
                                <p className="text-[9px] font-bold text-indigo-700 leading-relaxed">
                                    This is a previous test report and cannot be modified. To create a new report, click "Back to Composer" above.
                                </p>
                            </div>
                        ) : (
                            filteredTemplates.map((t, index) => (
                                <div key={t.id} className="group relative flex items-center bg-white hover:bg-indigo-50 rounded-xl border border-slate-100 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all pr-2 overflow-visible">
                                    <button
                                        onClick={() => addToReport(t)}
                                        className="flex-1 text-left p-3 flex flex-col gap-0.5 overflow-hidden active:scale-[0.98] transition-transform"
                                    >
                                        <span className="text-[6px] font-black uppercase tracking-widest text-slate-400">T-{t.id}</span>
                                        <span className="text-[10px] font-black truncate text-slate-800">{t.name}</span>
                                    </button>

                                    <div className="relative test-menu-container">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === t.id ? null : t.id); }}
                                            className={`p-1.5 rounded-lg transition-all ${activeMenuId === t.id ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
                                        >
                                            <IoEllipsisVertical className="w-4 h-4" />
                                        </button>

                                        {activeMenuId === t.id && (
                                            <div className={`absolute right-0 ${(index >= 3 && index > filteredTemplates.length - 4) ? 'bottom-full mb-1' : 'top-full mt-1'} w-32 bg-white border border-slate-200 shadow-xl rounded-xl py-1.5 z-50 overflow-hidden animate-in zoom-in-95 duration-200`}>
                                                <div className="flex items-center justify-between px-3 py-1 bg-slate-50 border-b border-slate-100 mb-1">
                                                    <span className="text-[5px] font-black text-slate-400 uppercase tracking-widest">Options</span>
                                                    <button
                                                        onClick={() => setActiveMenuId(null)}
                                                        className="p-0.5 text-slate-300 hover:text-rose-500 transition-colors"
                                                    >
                                                        <IoClose className="w-2.5 h-2.5" />
                                                    </button>
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); onEdit(t); setActiveMenuId(null); }} className="w-full text-left px-3 py-1.5 text-[9px] font-black text-slate-600 hover:bg-slate-900 hover:text-white flex items-center gap-2">
                                                    <div className="w-1 h-1 rounded-full bg-slate-400 group-hover:bg-white"></div>
                                                    <span>Edit Test</span>
                                                </button>
                                                <div className="h-px bg-slate-50 mx-2 my-1"></div>
                                                <button
                                                    onClick={(e) => handleDelete(e, t.id)}
                                                    className="w-full text-left px-3 py-1.5 text-[9px] font-black text-rose-500 hover:bg-rose-600 hover:text-white flex items-center gap-2 transition-colors"
                                                >
                                                    <div className="w-1 h-1 rounded-full bg-rose-200"></div>
                                                    <span>Delete Test</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>


                    <div className="mt-6 pt-6 border-t border-slate-200 no-print space-y-3">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[120px]">
                                    {printerStatus.name}
                                </span>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${printerStatus.status === 'Online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}></div>
                                    <span className={`text-[8px] font-black uppercase tracking-widest ${printerStatus.status === 'Online' ? 'text-green-600' : 'text-red-600'}`}>
                                        {printerStatus.status}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={handlePrintWorkflow}
                                className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all hover:bg-black active:scale-95 flex items-center justify-center gap-3"
                            >
                                <IoPrint className="w-4 h-4" />
                                {isHistoryMode ? "Print Report" : "Print & Save Report"}
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN AREA */}
            <main className={`flex-1 transition-all duration-500 ease-in-out ${isSidebarOpen ? 'pl-72' : 'pl-0'} print:pl-0 bg-slate-100/50 overflow-y-auto custom-scrollbar`}>
                <div className="a4-container py-16 px-10">
                    {renderPages()}
                </div>
            </main>
        </div>
    );
}
