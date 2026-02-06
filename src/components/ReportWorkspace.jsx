import React, { useState, useEffect } from 'react';
import appLogo from '../assets/app-logo.jpg';
import docLogo from '../assets/doc-logo.png';

export default function ReportWorkspace({ initialSelect, onEdit, onAdd }) {
    const [allTemplates, setAllTemplates] = useState([]);
    const [activeReportLines, setActiveReportLines] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [isHistoryMode, setIsHistoryMode] = useState(false);

    const [patientInfo, setPatientInfo] = useState({
        name: "WALK-IN PATIENT",
        id: "AL-2026-001",
        age: "32",
        gender: "Male",
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
        labNo: "10928",
        refBy: localStorage.getItem('lastRefBy') || "DR. SALMAN KHAN"
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [labInfo, setLabInfo] = useState({
        name: "AL-IMRAN",
        brand: " LABORATORY",
        tagline: "Advanced Diagnostic & Research Center",
        certification: "ISO 9001:2015",
        footerTagline: "Precision Diagnostic"
    });

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
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeMenuId]);

    const loadSavedReport = async (id) => {
        try {

            // Clear current state first
            setActiveReportLines([]);
            const result = await window.electronAPI.getReportById(id);
            if (result) {
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
            const parsed = JSON.parse(template.items);
            let rows = [];
            let meta = {};

            if (Array.isArray(parsed)) {
                rows = parsed;
            } else {
                rows = parsed.rows || [];
                meta = parsed.meta || {};
            }

            const batchId = Date.now() + Math.random();
            const newLines = [
                { type: 'header_main', text: template.name, subtitle: meta.subtitle, batchId },
                ...rows.map(r => ({ ...r, parentTemplateId: template.id, batchId }))
            ];

            setActiveReportLines(prev => [...prev, ...newLines]);
        } catch (e) {
            console.error("Failed to add template to report", e);
        }
    };

    const removeBatch = (batchId) => {
        setActiveReportLines(prev => prev.filter(line => line.batchId !== batchId));
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (confirm("Permanently delete this test template from the system?")) {
            await window.electronAPI.deleteTestTemplate(id);
            loadTemplates();
            setActiveMenuId(null);
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

    const checkAbnormal = (line) => {
        if (!line.result || isNaN(line.result)) return { isAbnormal: false, flag: "" };
        const val = parseFloat(line.result);
        const gender = (patientInfo.gender || "").toLowerCase();

        if (line.isGenderSpecific) {
            const isMale = gender.includes('m');
            const low = parseFloat(isMale ? line.maleLow : line.femaleLow);
            const high = parseFloat(isMale ? line.maleHigh : line.femaleHigh);
            if (!isNaN(low) && val < low) return { isAbnormal: true, flag: "↓" };
            if (!isNaN(high) && val > high) return { isAbnormal: true, flag: "↑" };
        } else if (!line.isSingleValue && !line.isMultiRange) {
            const low = parseFloat(line.normalLow);
            const high = parseFloat(line.normalHigh);
            if (!isNaN(low) && val < low) return { isAbnormal: true, flag: "↓" };
            if (!isNaN(high) && val > high) return { isAbnormal: true, flag: "↑" };
        }
        return { isAbnormal: false, flag: "" };
    };

    const handleSaveReport = async (isSilent = false) => {
        if (!patientInfo.name || activeReportLines.length === 0) {
            alert("Please ensure patient name is entered and report has lines.");
            return false;
        }

        const report = {
            patient_name: patientInfo.name,
            patient_id: patientInfo.id,
            report_data: {
                patientInfo,
                labInfo,
                activeReportLines
            }
        };

        try {
            await window.electronAPI.saveReport(report);
            if (!isSilent) alert("Report saved successfully to archive.");
            return true;
        } catch (err) {
            console.error("Save failed", err);
            alert("Failed to save report.");
            return false;
        }
    };

    const handlePrintWorkflow = async () => {
        if (isHistoryMode) {
            // In history mode, we just print the existing record
            window.print();
        } else {
            // In composer mode, we save a copy to archives THEN print
            const saved = await handleSaveReport(true);
            if (saved) {
                window.print();
            }
        }
    };

    const renderPages = () => {
        const pages = [];
        let currentHeight = 0;
        const HEIGHT_LIMIT = 780; // Calibrated for 20mm margins + clinical letterhead
        const SIGNATURE_HEIGHT = 180; // Space needed for signature area

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
            group.lines.forEach(line => {
                let itemHeight = 45;
                if (line.type === 'header_main') itemHeight = 130;
                if (line.type === 'subheading') itemHeight = 65;
                if (line.isGenderSpecific) itemHeight = 80;
                groupHeight += itemHeight;
            });

            const isLastGroup = groupIdx === groups.length - 1;
            const effectiveLimit = isLastGroup ? (HEIGHT_LIMIT - SIGNATURE_HEIGHT) : HEIGHT_LIMIT;

            // DECISION: Does the entire group fit on the current page?
            const currentPageExists = pages.length > 0;
            const targetPageIdx = currentPageExists ? pages.length - 1 : 0;
            if (!currentPageExists) pages.push([]);

            if (currentHeight + groupHeight > effectiveLimit) {
                // If it's not the first group on the page and it doesn't fit
                if (currentHeight > 0) {
                    pages.push([...group.lines]);
                    currentHeight = groupHeight;
                } else {
                    // It's the first group and still doesn't fit (oversized)
                    // We must split it
                    group.lines.forEach((line) => {
                        let itemHeight = 45;
                        if (line.type === 'header_main') itemHeight = 130;
                        if (line.type === 'subheading') itemHeight = 65;
                        if (line.isGenderSpecific) itemHeight = 80;

                        if (currentHeight + itemHeight > HEIGHT_LIMIT) {
                            pages.push([line]);
                            currentHeight = itemHeight;
                        } else {
                            pages[pages.length - 1].push(line);
                            currentHeight += itemHeight;
                        }
                    });
                }
            } else {
                // Fits on current page
                pages[pages.length - 1].push(...group.lines);
                currentHeight += groupHeight;
            }
        });

        if (pages.length === 0) return null;

        return pages.map((pageLines, pageIdx) => (
            <div key={pageIdx} className="a4-page mb-10 mx-auto">
                {/* LAB LETTERHEAD - Professional Pathology Style */}
                <div className="border-b-4 border-slate-900 pb-4 mb-4 relative">
                    <div className="flex justify-between items-end">
                        <div className="flex gap-4 items-center">
                            <img src={docLogo} alt="Lab Logo" className="h-40 w-auto object-contain" />
                            <div className="text-left">
                                <h1 className="text-3xl font-black text-slate-900 uppercase leading-none whitespace-nowrap">AL-IMRAN&nbsp; <span className="text-slate-800">LABORATORY</span></h1>
                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">Advanced Diagnostic & Research Center</p>
                                <div className="flex gap-2 mt-2">
                                    <span className="text-[7px] font-black bg-slate-100 px-1 py-0.5 rounded uppercase">ISO 9001:2015</span>
                                    <span className="text-[7px] font-black bg-slate-100 px-1 py-0.5 rounded uppercase">NABL ACCREDITED</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right text-[8px] font-bold text-slate-600 space-y-0.5 pb-1">
                            <p>HOUSE #24, ROAD #03, DHANMONDI</p>
                            <p>DHAKA-1205, BANGLADESH</p>
                            <p>PHONE: +880 1234 567890</p>
                        </div>
                    </div>
                </div>

                {/* PATIENT INFO HEADER - Tabular Professional Style */}
                <div className="grid grid-cols-[1fr_1fr] gap-x-8 gap-y-1 mb-8 px-2 py-3 bg-slate-50 border border-slate-200 rounded-lg no-print-inputs">
                    <div className="space-y-1 pr-4 border-r border-slate-200">
                        <div className="grid grid-cols-[80px_1fr] items-center">
                            <span className="font-black text-slate-900 uppercase text-[7px] tracking-widest">Name:</span>
                            <input type="text" value={patientInfo.name} readOnly={isHistoryMode} onChange={(e) => handlePatientChange('name', e.target.value)} className={`font-black text-slate-900 uppercase text-[10px] bg-transparent outline-none w-full border-b border-transparent transition-all px-1 ${!isHistoryMode && 'focus:border-slate-900 hover:bg-slate-50'}`} />
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
                                        <option value="Transgender">Transgender</option>
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
                            <span className="font-black text-slate-900 uppercase text-[7px] tracking-widest">Lab No:</span>
                            <input type="text" value={patientInfo.labNo} readOnly={isHistoryMode} onChange={(e) => handlePatientChange('labNo', e.target.value)} className={`font-black text-slate-900 uppercase text-[10px] bg-transparent outline-none w-full border-b border-transparent transition-all px-1 ${!isHistoryMode && 'focus:border-slate-900 hover:bg-slate-50'}`} />
                        </div>
                        <div className="grid grid-cols-[80px_1fr] items-center">
                            <span className="font-black text-slate-900 uppercase text-[7px] tracking-widest">Ref By:</span>
                            <input type="text" value={patientInfo.refBy} readOnly={isHistoryMode} onChange={(e) => handlePatientChange('refBy', e.target.value)} className={`font-black text-slate-900 uppercase text-[10px] bg-transparent outline-none w-full border-b border-transparent transition-all px-1 ${!isHistoryMode && 'focus:border-slate-900 hover:bg-slate-50'}`} />
                        </div>
                    </div>
                </div>

                <div className="flex-1">
                    {pageLines.map((line) => {
                        const idx = line.originalIndex;
                        if (line.type === 'header_main') {
                            return (
                                <div key={idx} className="mt-8 mb-6 text-center relative group/header">
                                    <input
                                        type="text"
                                        value={line.text}
                                        readOnly={isHistoryMode}
                                        onChange={(e) => handleLineChange(idx, 'text', e.target.value)}
                                        className={`text-lg font-black uppercase tracking-[0.2em] text-slate-900 border-y-2 border-slate-900 py-1.5 w-full text-center bg-transparent outline-none transition-colors ${!isHistoryMode && 'hover:bg-slate-50'}`}
                                    />
                                    {line.subtitle && (
                                        <input
                                            type="text"
                                            value={line.subtitle}
                                            readOnly={isHistoryMode}
                                            onChange={(e) => handleLineChange(idx, 'subtitle', e.target.value)}
                                            className={`text-[10px] font-bold text-slate-700 mt-2 uppercase tracking-[0.3em] w-full text-center bg-transparent outline-none transition-colors ${!isHistoryMode && 'hover:bg-slate-50'}`}
                                        />
                                    )}
                                    {/* Undo / Remove Button */}
                                    {!isHistoryMode && (
                                        <button
                                            onClick={() => removeBatch(line.batchId)}
                                            className="absolute -top-4 -right-4 bg-white text-slate-400 hover:text-black hover:bg-slate-100 p-2 rounded-lg shadow-lg border border-slate-200 opacity-0 group-hover/header:opacity-100 transition-all no-print"
                                            title="Remove Test Module"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
                                            </svg>
                                        </button>
                                    )}

                                    {/* DYNAMIC COLUMN HEADERS - Positioned after the Test Name Title */}
                                    <div className="report-table-header grid grid-cols-[3fr_1fr_2fr_1fr] items-center gap-4 mt-6">
                                        <span className="text-left">Investigation</span>
                                        <span className="text-center">Unit</span>
                                        <span className="text-center">Reference Range</span>
                                        <span className="text-right whitespace-nowrap">Result</span>
                                    </div>
                                </div>
                            );
                        }
                        if (line.type === 'subheading') {
                            return (
                                <div key={idx} className="mt-8 mb-4 border-l-4 border-slate-900 pl-4 py-1">
                                    <input
                                        type="text"
                                        value={line.text}
                                        readOnly={isHistoryMode}
                                        onChange={(e) => handleLineChange(idx, 'text', e.target.value)}
                                        className={`text-sm font-black uppercase tracking-wider text-slate-900 w-full bg-transparent outline-none transition-colors ${!isHistoryMode && 'hover:bg-slate-50'}`}
                                    />
                                </div>
                            );
                        }
                        return (
                            <div key={idx} className="report-row grid grid-cols-[3fr_1fr_2fr_1fr] items-center gap-4">
                                <input
                                    type="text"
                                    value={line.name}
                                    readOnly={isHistoryMode}
                                    onChange={(e) => handleLineChange(idx, 'name', e.target.value)}
                                    className="font-black text-slate-900 uppercase text-[10px] break-words bg-transparent outline-none w-full"
                                />
                                <input
                                    type="text"
                                    value={line.unit}
                                    readOnly={isHistoryMode}
                                    onChange={(e) => handleLineChange(idx, 'unit', e.target.value)}
                                    className="text-center italic font-serif text-[9px] text-slate-900 bg-transparent outline-none w-full"
                                />
                                <div className="text-center text-[9px] font-bold text-slate-800 flex items-center justify-center gap-1 w-full">
                                    {line.isMultiRange ? (
                                        <div className="flex flex-col items-center w-full space-y-0.5">
                                            {(line.multiRanges || [""]).map((range, rIdx) => (
                                                <input
                                                    key={rIdx}
                                                    type="text"
                                                    value={range}
                                                    readOnly={isHistoryMode}
                                                    onChange={(e) => {
                                                        const newMulti = [...(line.multiRanges || [""])];
                                                        newMulti[rIdx] = e.target.value;
                                                        handleLineChange(idx, 'multiRanges', newMulti);
                                                    }}
                                                    className={`w-full text-center bg-transparent outline-none font-bold text-[8px] border-b border-transparent ${!isHistoryMode && 'hover:border-slate-100'}`}
                                                />
                                            ))}
                                        </div>
                                    ) : line.isGenderSpecific ? (
                                        <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                            <input type="text" value={line.maleLow} readOnly={isHistoryMode} onChange={(e) => handleLineChange(idx, 'maleLow', e.target.value)} className="w-4 bg-transparent outline-none text-center" />
                                            <span>-</span>
                                            <input type="text" value={line.maleHigh} readOnly={isHistoryMode} onChange={(e) => handleLineChange(idx, 'maleHigh', e.target.value)} className="w-4 bg-transparent outline-none text-center" />
                                            <span className="text-[6px] opacity-60">(M)</span>
                                            <span className="mx-1 opacity-20">|</span>
                                            <input type="text" value={line.femaleLow} readOnly={isHistoryMode} onChange={(e) => handleLineChange(idx, 'femaleLow', e.target.value)} className="w-4 bg-transparent outline-none text-center" />
                                            <span>-</span>
                                            <input type="text" value={line.femaleHigh} readOnly={isHistoryMode} onChange={(e) => handleLineChange(idx, 'femaleHigh', e.target.value)} className="w-4 bg-transparent outline-none text-center" />
                                            <span className="text-[6px] opacity-60">(F)</span>
                                        </div>
                                    ) : (
                                        line.isSingleValue ? (
                                            <input
                                                type="text"
                                                value={line.normalLow}
                                                readOnly={isHistoryMode}
                                                onChange={(e) => handleLineChange(idx, 'normalLow', e.target.value)}
                                                className="text-center bg-transparent outline-none w-full font-bold"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-1">
                                                <input type="text" value={line.normalLow} readOnly={isHistoryMode} onChange={(e) => handleLineChange(idx, 'normalLow', e.target.value)} className="w-8 bg-transparent outline-none text-right" />
                                                <span>-</span>
                                                <input type="text" value={line.normalHigh} readOnly={isHistoryMode} onChange={(e) => handleLineChange(idx, 'normalHigh', e.target.value)} className="w-8 bg-transparent outline-none text-left" />
                                            </div>
                                        )
                                    )}
                                </div>
                                <div className="text-right flex items-center justify-end gap-2">
                                    <input
                                        type="text"
                                        value={line.result || ""}
                                        readOnly={isHistoryMode}
                                        onChange={(e) => handleLineChange(idx, 'result', e.target.value)}
                                        className={`w-16 text-right border-b outline-none font-black bg-transparent transition-all ${isHistoryMode ? 'border-transparent' : 'border-slate-100 hover:border-slate-300'} ${checkAbnormal(line).isAbnormal ? 'text-rose-600' : 'text-black'}`}
                                        placeholder="0.00"
                                    />
                                    {checkAbnormal(line).isAbnormal && (
                                        <span className="text-[10px] font-black text-rose-600 animate-pulse">{checkAbnormal(line).flag}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-auto px-4">
                    {/* SIGNATURE AREA - Only on last page */}
                    {pageIdx === pages.length - 1 && (
                        <div className="grid grid-cols-2 gap-16 pt-16 mb-8 text-center no-print-inputs">
                            <div className="border-t border-slate-900 pt-2">
                                <p className="text-[10px] font-black uppercase text-slate-900">Dr. Sarah Rahman</p>
                                <p className="text-[7px] font-bold text-slate-500 uppercase">MBBS, MD (Pathology)</p>
                                <p className="text-[7px] font-bold text-slate-500 uppercase">Senior Consultant Pathologist</p>
                            </div>
                            <div className="border-t border-slate-900 pt-2">
                                <p className="text-[10px] font-black uppercase text-slate-900">Dr. Tanvir Ahmed</p>
                                <p className="text-[7px] font-bold text-slate-500 uppercase">Medical Director</p>
                                <p className="text-[7px] font-bold text-slate-500 uppercase">Al-Imaran Laboratory</p>
                            </div>
                        </div>
                    )}

                    <div className="pt-2 border-t border-slate-200 text-center">
                        <div className="flex items-center justify-between text-[6px] font-black text-slate-400 uppercase tracking-widest">
                            <p className="max-w-[70%] text-left italic">Disclaimer: This report is based on clinical findings and should be interpreted by a registered medical practitioner. Accuracy depends on sample quality.</p>
                            <div className="flex items-center gap-4">
                                <span>End of Report</span>
                                <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                <span>Page {pageIdx + 1} of {pages.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ));
    };

    return (
        <div className="min-h-screen bg-white flex relative overflow-hidden">
            {/* HAMBURGER TRIGGER */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="fixed top-6 left-6 z-50 p-2 bg-white border border-slate-200 text-slate-900 rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all no-print flex items-center justify-center overflow-hidden"
                style={{ width: '56px', height: '56px' }}
                title="Toggle Sidebar"
            >
                <img src={appLogo} alt="App Logo" className="w-full h-full object-contain" />
            </button>

            {/* SIDEBAR */}
            <aside className={`no-print fixed inset-y-0 left-0 z-40 w-72 bg-slate-50 border-r border-slate-200 transform transition-transform duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full pt-24 px-6 pb-8">
                    <div className="flex items-center gap-3 mb-8">
                        <img src={appLogo} alt="Logo" className="w-10 h-10 rounded-lg shadow-sm border border-slate-200" />
                        <div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Inventory</h3>
                            <p className="text-[9px] font-bold text-slate-400 mt-0.5">{allTemplates.length} Active Modules</p>
                        </div>
                    </div>

                    <button
                        onClick={() => onEdit({ isHistory: true })} // Trigger history view
                        className={`w-full mb-8 py-3 rounded-xl font-black text-[9px] uppercase tracking-[0.3em] transition-all shadow-sm flex items-center justify-center gap-2 group ${isHistoryMode ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white border-slate-200 text-slate-900 border hover:bg-slate-900 hover:text-white'}`}
                    >
                        <svg className={`w-4 h-4 transition-colors ${isHistoryMode ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        {isHistoryMode ? "Return to Vault" : "View Archives"}
                    </button>

                    <div className="flex items-center gap-2 mb-6">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Search tests..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold focus:border-slate-400 outline-none transition-all shadow-sm"
                            />
                            <svg className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <button
                            onClick={onAdd}
                            className="p-2.5 bg-slate-900 text-white rounded-xl shadow-md hover:bg-black transition-all active:scale-90"
                            title="Create New Template"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                        {filteredTemplates.map((t, index) => (
                            <div key={t.id} className="group relative flex items-center bg-white hover:bg-slate-50 rounded-xl border border-slate-100 shadow-sm transition-all pr-2 overflow-visible">
                                <button
                                    onClick={() => addToReport(t)}
                                    className="flex-1 text-left p-3 flex flex-col gap-0.5 overflow-hidden"
                                >
                                    <span className="text-[6px] font-black uppercase tracking-widest text-slate-400">T-{t.id}</span>
                                    <span className="text-[10px] font-black truncate text-slate-800">{t.name}</span>
                                </button>

                                <div className="relative test-menu-container">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === t.id ? null : t.id); }}
                                        className={`p-1.5 rounded-lg transition-all ${activeMenuId === t.id ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
                                    </button>

                                    {activeMenuId === t.id && (
                                        <div className={`absolute right-0 ${index > filteredTemplates.length - 4 ? 'bottom-full mb-1' : 'top-full mt-1'} w-32 bg-white border border-slate-200 shadow-xl rounded-xl py-1.5 z-50 overflow-hidden animate-in zoom-in-95 duration-200`}>
                                            <div className="flex items-center justify-between px-3 py-1 bg-slate-50 border-b border-slate-100 mb-1">
                                                <span className="text-[5px] font-black text-slate-400 uppercase tracking-widest">Options</span>
                                                <button
                                                    onClick={() => setActiveMenuId(null)}
                                                    className="p-0.5 text-slate-300 hover:text-rose-500 transition-colors"
                                                >
                                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                </button>
                                            </div>
                                            <button onClick={() => { onEdit(t); setActiveMenuId(null); }} className="w-full text-left px-3 py-1.5 text-[9px] font-black text-slate-600 hover:bg-slate-900 hover:text-white flex items-center gap-2">
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
                        ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-200 no-print space-y-3">
                        <button
                            onClick={handlePrintWorkflow}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all hover:bg-black active:scale-95 flex items-center justify-center gap-3"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                            {isHistoryMode ? "Print Report" : "Print & Save Report"}
                        </button>
                        <button
                            onClick={() => {
                                if (confirm("Clear current canvas and patient data?")) {
                                    setActiveReportLines([]);
                                    setPatientInfo({
                                        name: "WALK-IN PATIENT",
                                        id: `AL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                                        age: "",
                                        gender: "",
                                        date: new Date().toLocaleDateString(),
                                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                                        labNo: "",
                                        refBy: localStorage.getItem('lastRefBy') || "DR. SALMAN KHAN"
                                    });
                                    setIsHistoryMode(false);
                                }
                            }}
                            className="w-full py-3 bg-white border border-slate-200 text-slate-400 rounded-xl font-black text-[8px] uppercase tracking-[0.2em] hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all"
                        >
                            New Report / Reset
                        </button>
                    </div>
                </div>
            </aside>

            {/* MAIN AREA */}
            <main className={`flex-1 transition-all duration-500 ease-in-out ${isSidebarOpen ? 'pl-72' : 'pl-0'} print:pl-0 bg-slate-100/50 overflow-y-auto custom-scrollbar`}>
                <div className="a4-container py-16 px-10">
                    {activeReportLines.length > 0 ? (
                        renderPages()
                    ) : (
                        <div className="a4-page mx-auto flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 bg-white shadow-sm">
                            <div className="relative mb-6">
                                <div className="relative w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                                    <svg className="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.618.309a6 6 0 01-3.86.517l-3.158-.632a2 2 0 01-1.223-2.618 5 5 0 015.908-1.554l5.908 1.554a2 2 0 001.223 2.618z"></path></svg>
                                </div>
                            </div>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Composer Idle</h2>
                            <p className="text-[8px] mt-2 font-bold text-slate-400 uppercase tracking-widest">Select modules to begin configuration</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
