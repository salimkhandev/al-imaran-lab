import React, { useState, useEffect } from "react";
import { IoAdd, IoClose, IoList, IoSave, IoGridOutline } from "react-icons/io5";
import { CgSpinner } from "react-icons/cg";
import Swal from 'sweetalert2';

export default function TestTemplateForm({ onTemplateCreated, initialTemplate }) {
    const [mainTestName, setMainTestName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Main Report Header Configuration
    const [mainConfig, setMainConfig] = useState({
        testLabel: "Investigation",
        unitLabel: "Unit",
        valueLabel: "Reference Range",
        resultLabel: "Result",
        subtitle: "",
        showTest: true,
        showUnit: true,
        showValue: true,
        showResult: true
    });

    const [items, setItems] = useState([
        {
            id: Date.now(),
            type: 'test',
            name: "",
            unit: "",
            isGenderSpecific: false,
            normalLow: "",
            normalHigh: "",
            maleLow: "",
            maleHigh: "",
            femaleLow: "",
            femaleHigh: "",
            isSingleValue: false,
            isMultiRange: false,
            multiRanges: [""],
            result: ""
        }
    ]);

    // Populate form if editing
    useEffect(() => {
        if (initialTemplate) {
            setMainTestName(initialTemplate.name);
            try {
                const parsed = JSON.parse(initialTemplate.items);
                if (Array.isArray(parsed)) {
                    // Legacy format
                    setItems(parsed);
                } else if (parsed && typeof parsed === 'object') {
                    // New format
                    if (parsed.meta) {
                        setMainConfig({
                            ...{
                                testLabel: "Investigation",
                                unitLabel: "Unit",
                                valueLabel: "Reference Range",
                                resultLabel: "Result",
                                subtitle: "",
                                showTest: true,
                                showUnit: true,
                                showValue: true,
                                showResult: true
                            },
                            ...parsed.meta
                        });
                    }
                    if (parsed.rows) setItems(parsed.rows);
                }
            } catch (e) {
                console.error("Failed to parse template for editing", e);
            }
        }
    }, [initialTemplate]);

    const handleItemChange = (id, field, value) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const handleMainConfigChange = (field, value) => {
        setMainConfig(prev => ({ ...prev, [field]: value }));
    };

    const toggleMainColumn = (field) => {
        setMainConfig(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const addTestRow = () => {
        setItems([...items, {
            id: Date.now() + Math.random(),
            type: 'test',
            name: "",
            unit: "",
            isGenderSpecific: false,
            normalLow: "",
            normalHigh: "",
            maleLow: "",
            maleHigh: "",
            femaleLow: "",
            femaleHigh: "",
            isSingleValue: false,
            isMultiRange: false,
            multiRanges: [""],
            isPredefined: false,
            resultOptions: [""],
            result: ""
        }]);
    };

    const addMatrixRow = () => {
        setItems([...items, {
            id: Date.now() + Math.random(),
            type: 'matrix',
            title: "",
            headers: ["1/20", "1/40", "1/80"],
            matrixRows: [
                { id: Date.now() + 1, name: "Row 1", values: ["", "", ""] }
            ],
            isPredefined: true,
            rowLabel: "Test",
            resultOptions: ["(+)", "(-)", "(---)"]
        }]);
    };

    const addSubheading = () => {
        setItems([...items, {
            id: Date.now() + Math.random(),
            type: 'subheading',
            text: "",
            subtext: "",
            testLabel: "Investigation",
            unitLabel: "Unit",
            valueLabel: "Reference Range",
            resultLabel: "Result",
            showTest: true,
            showUnit: true,
            showValue: true,
            showResult: true
        }]);
    };

    const removeItem = (id) => {
        setItems(items.filter(item => item.id !== id));
    };

    const toggleColumn = (id, columnField) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, [columnField]: !item[columnField] } : item
        ));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!mainTestName.trim()) return;

        setIsSaving(true);
        try {
            // Save structure: { meta: mainConfig, rows: items }
            const payload = {
                meta: mainConfig,
                rows: items
            };

            if (initialTemplate && initialTemplate.id) {
                // UPDATE EXISTING
                await window.electronAPI.updateTestTemplate({
                    id: initialTemplate.id,
                    name: mainTestName,
                    items: payload
                });
            } else {
                // CREATE NEW
                await window.electronAPI.addTestTemplate({
                    name: mainTestName,
                    items: payload
                });
            }

            // "Exit" effect: Reset state
            setMainTestName("");
            setMainConfig({
                testLabel: "Investigation",
                unitLabel: "Unit",
                valueLabel: "Reference Range",
                resultLabel: "Result",
                subtitle: "",
                showTest: true,
                showUnit: true,
                showValue: true,
                showResult: true
            });
            setItems([{
                id: Date.now(),
                type: 'test',
                name: "",
                unit: "",
                isGenderSpecific: false,
                normalLow: "",
                normalHigh: "",
                maleLow: "",
                maleHigh: "",
                femaleLow: "",
                femaleHigh: "",
                isSingleValue: false,
                isMultiRange: false,
                resultOptions: [""],
                isPredefined: false,
                result: ""
            }]);

            if (onTemplateCreated) onTemplateCreated();
            Swal.fire({
                title: 'Template Saved',
                text: 'The diagnostic module has been successfully registered.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
                position: 'top-end',
                toast: true
            });
        } catch (err) {
            console.error("Failed to save template:", err);
            Swal.fire({
                title: 'Deployment Failed',
                text: `Failed to save: ${err.message}. If you recently updated the app, please restart it.`,
                icon: 'error',
                confirmButtonColor: '#0f172a'
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Helper to calculate grid template based on visibility
    const getGridStyle = (config) => {
        const parts = [];
        if (config.showTest) parts.push("minmax(150px, 4fr)");
        if (config.showUnit) parts.push("minmax(80px, 1.5fr)");
        if (config.showValue) parts.push("minmax(150px, 4fr)");
        if (config.showResult) parts.push("minmax(80px, 2fr)");
        return {
            display: 'grid',
            gridTemplateColumns: parts.join(" "),
            gap: '1rem'
        };
    };

    // Main header grid style
    const mainGridStyle = getGridStyle(mainConfig);

    // Initial config for loop starts with Main Config
    let currentConfig = {
        showTest: mainConfig.showTest,
        showUnit: mainConfig.showUnit,
        showValue: mainConfig.showValue,
        showResult: mainConfig.showResult
    };

    return (
        <section className="bg-slate-900 min-h-screen w-full px-4 py-12 md:p-12">
            <div className="max-w-7xl mx-auto p-8">
                <div className="flex items-center justify-between mb-8 border-b border-slate-700 pb-6">
                    <div className="flex flex-col">
                        <h2 className="text-3xl font-black text-white tracking-tight uppercase">Template Designer</h2>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2">Structure laboratory test modules</p>
                    </div>
                    {initialTemplate && (
                        <span className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-black uppercase tracking-widest">
                            Editing: {initialTemplate.name}
                        </span>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-3">
                                <label className="text-sm font-black text-slate-300 uppercase tracking-widest ml-1">Main Report Title</label>
                                <input
                                    type="text"
                                    className="w-full text-lg font-black bg-slate-700 text-white border-2 border-slate-600 rounded-lg px-5 py-3 focus:border-blue-500 outline-none transition-all placeholder:text-slate-500 uppercase"
                                    value={mainTestName}
                                    onChange={(e) => setMainTestName(e.target.value)}
                                    placeholder="e.g. COMPLETE BLOOD COUNT"
                                    required
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-black text-slate-300 uppercase tracking-widest ml-1">Sub-Header (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full text-base font-medium bg-slate-700 text-white border-2 border-slate-600 rounded-lg px-5 py-3 focus:border-blue-500 outline-none transition-all placeholder:text-slate-500"
                                    value={mainConfig.subtitle}
                                    onChange={(e) => handleMainConfigChange('subtitle', e.target.value)}
                                    placeholder="e.g. Automated Hematology Analysis"
                                />
                            </div>
                        </div>

                        {/* MAIN HEADER CONFIGURATION */}
                        <div className="pt-8 border-t border-slate-700">
                            <div className="flex items-center justify-between mb-6">
                                <label className="text-xs font-black text-slate-300 uppercase flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    Columns Management
                                </label>

                                <div className="flex gap-2">
                                    {!mainConfig.showTest && (
                                        <button type="button" onClick={() => handleMainConfigChange('showTest', true)} className="text-[10px] bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 font-black hover:bg-blue-600 transition-all uppercase shadow-sm">
                                            + Test Name
                                        </button>
                                    )}
                                    {!mainConfig.showUnit && (
                                        <button type="button" onClick={() => handleMainConfigChange('showUnit', true)} className="text-[10px] bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 font-black hover:bg-blue-600 transition-all uppercase shadow-sm">
                                            + Unit
                                        </button>
                                    )}
                                    {!mainConfig.showValue && (
                                        <button type="button" onClick={() => handleMainConfigChange('showValue', true)} className="text-[10px] bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 font-black hover:bg-blue-600 transition-all uppercase shadow-sm">
                                            + Ref. Range
                                        </button>
                                    )}
                                    {!mainConfig.showResult && (
                                        <button type="button" onClick={() => handleMainConfigChange('showResult', true)} className="text-[10px] bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 font-black hover:bg-blue-600 transition-all uppercase shadow-sm">
                                            + Result
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div style={mainGridStyle} className="bg-slate-950 text-white rounded-xl py-4 px-6 text-[12px] font-black uppercase tracking-widest border border-slate-700 shadow-xl">
                                {mainConfig.showTest && (
                                    <div className="relative group/header flex items-center gap-2">
                                        <input
                                            value={mainConfig.testLabel}
                                            onChange={(e) => handleMainConfigChange('testLabel', e.target.value)}
                                            className="bg-transparent border-none p-0 focus:ring-0 uppercase outline-none w-full text-blue-400 focus:text-white transition-colors"
                                        />
                                        <button type="button" onClick={() => toggleMainColumn('showTest')} className="text-slate-600 hover:text-red-500 opacity-0 group-hover/header:opacity-100 transition-opacity font-bold">×</button>
                                    </div>
                                )}
                                {mainConfig.showUnit && (
                                    <div className="relative group/header text-center flex items-center justify-center gap-2">
                                        <input
                                            value={mainConfig.unitLabel}
                                            onChange={(e) => handleMainConfigChange('unitLabel', e.target.value)}
                                            className="bg-transparent border-none p-0 focus:ring-0 uppercase text-center outline-none w-full text-blue-400 focus:text-white transition-colors"
                                        />
                                        <button type="button" onClick={() => toggleMainColumn('showUnit')} className="text-slate-600 hover:text-red-500 opacity-0 group-hover/header:opacity-100 transition-opacity font-bold">×</button>
                                    </div>
                                )}
                                {mainConfig.showValue && (
                                    <div className="relative group/header text-center flex items-center justify-center gap-2">
                                        <input
                                            value={mainConfig.valueLabel}
                                            onChange={(e) => handleMainConfigChange('valueLabel', e.target.value)}
                                            className="bg-transparent border-none p-0 focus:ring-0 uppercase text-center outline-none w-full text-blue-400 focus:text-white transition-colors"
                                        />
                                        <button type="button" onClick={() => toggleMainColumn('showValue')} className="text-slate-600 hover:text-red-500 opacity-0 group-hover/header:opacity-100 transition-opacity font-bold">×</button>
                                    </div>
                                )}
                                {mainConfig.showResult && (
                                    <div className="relative group/header text-right flex items-center justify-end gap-2">
                                        <input
                                            value={mainConfig.resultLabel}
                                            onChange={(e) => handleMainConfigChange('resultLabel', e.target.value)}
                                            className="bg-transparent border-none p-0 focus:ring-0 uppercase text-right outline-none w-full text-blue-400 focus:text-white transition-colors"
                                        />
                                        <button type="button" onClick={() => toggleMainColumn('showResult')} className="text-slate-600 hover:text-red-500 opacity-0 group-hover/header:opacity-100 transition-opacity font-bold">×</button>
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-3 ml-1">
                                * Heads are editable. Use &times; to disable columns for this template.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4 relative">
                        {items.length === 0 && (
                            <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-3xl bg-slate-800/50">
                                <div className="w-20 h-20 bg-slate-700 rounded-full shadow-xl flex items-center justify-center mx-auto mb-6 border border-slate-600">
                                    <IoAdd className="h-10 w-10 text-slate-400" />
                                </div>
                                <p className="text-slate-300 font-bold text-lg uppercase tracking-widest">Add testing rows or sections below</p>
                            </div>
                        )}

                        {items.map((item, index) => {
                            if (item.type === 'subheading') {
                                currentConfig = {
                                    showTest: item.showTest !== false,
                                    showUnit: item.showUnit !== false,
                                    showValue: item.showValue !== false,
                                    showResult: item.showResult !== false
                                };
                            }

                            const rowConfig = { ...currentConfig };
                            const gridStyle = getGridStyle(rowConfig);

                            return (
                                <div key={item.id} className="relative group rounded-3xl border border-transparent hover:border-slate-700 hover:bg-slate-800/30 transition-all p-3">
                                    <button
                                        type="button"
                                        onClick={() => removeItem(item.id)}
                                        className="absolute -right-4 top-8 p-3 bg-slate-700 text-white hover:bg-red-600 rounded-full shadow-2xl border border-slate-600 opacity-0 group-hover:opacity-100 transition-all z-20 hover:scale-125"
                                    >
                                        <IoClose className="h-5 w-5" />
                                    </button>

                                    {item.type === 'subheading' ? (
                                        // ... existing subheading code ...
                                        <div className="p-8 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl space-y-6">
                                            <div className="flex gap-6">
                                                <div className="flex-1 space-y-2">
                                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Section Title</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. CHEMICAL ANALYSIS..."
                                                        value={item.text}
                                                        onChange={(e) => handleItemChange(item.id, 'text', e.target.value)}
                                                        className="w-full font-black bg-slate-700 rounded-xl px-5 py-3 outline-none text-white border-2 border-slate-600 focus:border-blue-500 focus:bg-slate-750 transition-all uppercase text-sm"
                                                    />
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Section Sub-Header</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Sub-heading..."
                                                        value={item.subtext}
                                                        onChange={(e) => handleItemChange(item.id, 'subtext', e.target.value)}
                                                        className="w-full font-bold bg-slate-700 rounded-xl px-5 py-3 outline-none text-slate-300 border-2 border-slate-600 focus:border-blue-500 focus:bg-slate-750 transition-all text-sm"
                                                    />
                                                </div>
                                            </div>

                                            <div style={gridStyle} className="bg-slate-900 rounded-xl py-3 px-6 text-[11px] font-black uppercase tracking-widest text-blue-400 border border-slate-700">
                                                {rowConfig.showTest && (
                                                    <div className="relative group/subhead flex items-center justify-between">
                                                        <input value={item.testLabel} onChange={(e) => handleItemChange(item.id, 'testLabel', e.target.value)} className="bg-transparent border-none p-0 focus:ring-0 uppercase outline-none w-full focus:text-white" />
                                                        <button type="button" onClick={() => toggleColumn(item.id, 'showTest')} className="text-slate-600 hover:text-red-500 opacity-0 group-hover/subhead:opacity-100 transition-opacity">×</button>
                                                    </div>
                                                )}
                                                {rowConfig.showUnit && (
                                                    <div className="relative group/subhead text-center flex items-center justify-center">
                                                        <input value={item.unitLabel} onChange={(e) => handleItemChange(item.id, 'unitLabel', e.target.value)} className="bg-transparent border-none p-0 focus:ring-0 uppercase text-center outline-none w-full focus:text-white" />
                                                        <button type="button" onClick={() => toggleColumn(item.id, 'showUnit')} className="text-slate-600 hover:text-red-500 opacity-0 group-hover/subhead:opacity-100 transition-opacity">×</button>
                                                    </div>
                                                )}
                                                {rowConfig.showValue && (
                                                    <div className="relative group/subhead text-center flex items-center justify-center">
                                                        <input value={item.valueLabel} onChange={(e) => handleItemChange(item.id, 'valueLabel', e.target.value)} className="bg-transparent border-none p-0 focus:ring-0 uppercase text-center outline-none w-full focus:text-white" />
                                                        <button type="button" onClick={() => toggleColumn(item.id, 'showValue')} className="text-slate-600 hover:text-red-500 opacity-0 group-hover/subhead:opacity-100 transition-opacity">×</button>
                                                    </div>
                                                )}
                                                {rowConfig.showResult && (
                                                    <div className="relative group/subhead text-right flex items-center justify-end">
                                                        <input value={item.resultLabel} onChange={(e) => handleItemChange(item.id, 'resultLabel', e.target.value)} className="bg-transparent border-none p-0 focus:ring-0 uppercase text-right outline-none w-full focus:text-white" />
                                                        <button type="button" onClick={() => toggleColumn(item.id, 'showResult')} className="text-slate-600 hover:text-red-500 opacity-0 group-hover/subhead:opacity-100 transition-opacity">×</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : item.type === 'matrix' ? (
                                        <div className="p-8 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 space-y-2">
                                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Matrix Title</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Brucella Results"
                                                        value={item.title}
                                                        onChange={(e) => handleItemChange(item.id, 'title', e.target.value)}
                                                        className="w-full font-black bg-slate-700 rounded-xl px-5 py-3 outline-none text-white border-2 border-slate-600 focus:border-blue-500 focus:bg-slate-750 transition-all uppercase text-sm"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-4 ml-6 pt-6">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Predefined Options</span>
                                                        <input
                                                            type="checkbox"
                                                            checked={item.isPredefined}
                                                            onChange={(e) => handleItemChange(item.id, 'isPredefined', e.target.checked)}
                                                            className="w-4 h-4 rounded text-blue-600 border-slate-600 bg-slate-700 cursor-pointer focus:ring-0"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Column Headers */}
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Column Headers (Dynamic Grid)</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {item.headers.map((header, hIdx) => (
                                                        <div key={hIdx} className="flex items-center gap-1 bg-slate-700 rounded-lg px-2 py-1 border border-slate-600 group/header">
                                                            <input
                                                                value={header}
                                                                onChange={(e) => {
                                                                    const newHeaders = [...item.headers];
                                                                    newHeaders[hIdx] = e.target.value;
                                                                    handleItemChange(item.id, 'headers', newHeaders);
                                                                }}
                                                                className="bg-transparent outline-none text-white font-bold text-[10px] w-16"
                                                                placeholder="1/20"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newHeaders = item.headers.filter((_, i) => i !== hIdx);
                                                                    handleItemChange(item.id, 'headers', newHeaders);
                                                                }}
                                                                className="opacity-0 group-hover/header:opacity-100 text-slate-400 hover:text-red-500 transition-all font-bold"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleItemChange(item.id, 'headers', [...item.headers, ""])}
                                                        className="px-3 py-1.5 border border-dashed border-slate-600 rounded-lg text-[10px] font-black text-slate-400 hover:bg-slate-700 hover:text-white transition-all uppercase"
                                                    >
                                                        + Add Col
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Rows definition */}
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Matrix Rows</label>
                                                <div className="space-y-2">
                                                    {item.matrixRows.map((row, rIdx) => (
                                                        <div key={row.id || rIdx} className="flex items-center gap-3 bg-slate-900/30 p-2 rounded-xl border border-slate-700/50 group/mrow">
                                                            <input
                                                                value={row.name}
                                                                onChange={(e) => {
                                                                    const newRows = [...item.matrixRows];
                                                                    newRows[rIdx] = { ...row, name: e.target.value };
                                                                    handleItemChange(item.id, 'matrixRows', newRows);
                                                                }}
                                                                className="bg-transparent border-b border-slate-700 focus:border-blue-500 text-white font-bold text-xs p-1 outline-none w-48"
                                                                placeholder="Row Name"
                                                            />
                                                            <span className="text-slate-600 text-xs">— {item.headers.length} data fields mapped</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newRows = item.matrixRows.filter((_, i) => i !== rIdx);
                                                                    handleItemChange(item.id, 'matrixRows', newRows);
                                                                }}
                                                                className="ml-auto opacity-0 group-hover/mrow:opacity-100 text-slate-400 hover:text-red-500 transition-all"
                                                            >
                                                                <IoClose className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleItemChange(item.id, 'matrixRows', [...item.matrixRows, { id: Date.now(), name: "", values: item.headers.map(() => "") }])}
                                                        className="w-full py-2 border border-dashed border-slate-600 rounded-xl text-[10px] font-black text-slate-400 hover:bg-slate-700 hover:text-white transition-all uppercase"
                                                    >
                                                        + Add Matrix Row
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Predefined Options for cells if enabled */}
                                            {item.isPredefined && (
                                                <div className="space-y-3 pt-4 border-t border-slate-700/50">
                                                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Matrix Result Options (Dropdown Values)</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.resultOptions.map((opt, oIdx) => (
                                                            <div key={oIdx} className="flex items-center gap-1 bg-blue-900/20 rounded-lg px-2 py-1 border border-blue-900/30 group/opt">
                                                                <input
                                                                    value={opt}
                                                                    onChange={(e) => {
                                                                        const newOpts = [...item.resultOptions];
                                                                        newOpts[oIdx] = e.target.value;
                                                                        handleItemChange(item.id, 'resultOptions', newOpts);
                                                                    }}
                                                                    className="bg-transparent outline-none text-blue-300 font-bold text-[10px] w-20"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newOpts = item.resultOptions.filter((_, i) => i !== oIdx);
                                                                        handleItemChange(item.id, 'resultOptions', newOpts);
                                                                    }}
                                                                    className="opacity-0 group-hover/opt:opacity-100 text-blue-400 hover:text-red-500 transition-all font-bold"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleItemChange(item.id, 'resultOptions', [...item.resultOptions, ""])}
                                                            className="px-3 py-1.5 border border-dashed border-blue-900/30 rounded-lg text-[10px] font-black text-blue-400/50 hover:bg-blue-900/30 hover:text-blue-300 transition-all uppercase"
                                                        >
                                                            + Add Option
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={gridStyle} className="items-center px-8 py-6 bg-slate-800/20 rounded-2xl border border-slate-700/50">
                                            {rowConfig.showTest && (
                                                <div className="pt-2">
                                                    <div className="flex items-center gap-4 mb-4 h-5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Single</span>
                                                            <input
                                                                type="checkbox"
                                                                checked={item.isSingleValue}
                                                                onChange={(e) => handleItemChange(item.id, 'isSingleValue', e.target.checked)}
                                                                className="w-4 h-4 rounded text-blue-600 border-slate-600 bg-slate-700 cursor-pointer focus:ring-0"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Multi</span>
                                                            <input
                                                                type="checkbox"
                                                                checked={item.isMultiRange}
                                                                onChange={(e) => handleItemChange(item.id, 'isMultiRange', e.target.checked)}
                                                                className="w-4 h-4 rounded text-blue-600 border-slate-600 bg-slate-700 cursor-pointer focus:ring-0"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Options</span>
                                                            <input
                                                                type="checkbox"
                                                                checked={item.isPredefined}
                                                                onChange={(e) => handleItemChange(item.id, 'isPredefined', e.target.checked)}
                                                                className="w-4 h-4 rounded text-blue-600 border-slate-600 bg-slate-700 cursor-pointer focus:ring-0"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gender</span>
                                                            <input
                                                                type="checkbox"
                                                                checked={item.isGenderSpecific}
                                                                onChange={(e) => handleItemChange(item.id, 'isGenderSpecific', e.target.checked)}
                                                                className="w-4 h-4 rounded text-blue-600 border-slate-600 bg-slate-700 cursor-pointer focus:ring-0"
                                                            />
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Test Name (e.g. Glucose)"
                                                        value={item.name}
                                                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                                                        className="w-full bg-transparent border-b-2 border-slate-700 focus:border-blue-500 p-0 focus:ring-0 font-black text-white text-base outline-none transition-all placeholder:text-slate-600"
                                                    />
                                                </div>
                                            )}
                                            {rowConfig.showUnit && (
                                                <div className="text-center pt-2">
                                                    <input
                                                        type="text"
                                                        placeholder="mg/dl"
                                                        value={item.unit}
                                                        onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                                                        className="w-full bg-slate-700 rounded-xl py-2 px-3 border-2 border-slate-600 focus:border-blue-500 focus:bg-slate-750 focus:ring-0 text-center text-xs text-white font-serif outline-none"
                                                    />
                                                </div>
                                            )}
                                            {rowConfig.showValue && (
                                                <div className="flex flex-col items-center pt-8">
                                                    {item.isMultiRange ? (
                                                        <div className="w-full space-y-2">
                                                            {(item.multiRanges || [""]).map((range, rIdx) => (
                                                                <div key={rIdx} className="flex items-center gap-2 h-9 bg-slate-700 rounded-xl px-3 border-2 border-slate-600 group/range focus-within:border-blue-500 transition-all">
                                                                    <input
                                                                        type="text"
                                                                        value={range}
                                                                        placeholder="Range Label: Value"
                                                                        onChange={(e) => {
                                                                            const newRanges = [...(item.multiRanges || [""])];
                                                                            newRanges[rIdx] = e.target.value;
                                                                            handleItemChange(item.id, 'multiRanges', newRanges);
                                                                        }}
                                                                        className="flex-1 bg-transparent outline-none font-serif text-sm font-bold text-white"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const newRanges = (item.multiRanges || [""]).filter((_, i) => i !== rIdx);
                                                                            handleItemChange(item.id, 'multiRanges', newRanges.length > 0 ? newRanges : [""]);
                                                                        }}
                                                                        className="opacity-0 group-hover/range:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                                                                    >
                                                                        <IoClose className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    handleItemChange(item.id, 'multiRanges', [...(item.multiRanges || [""]), ""]);
                                                                }}
                                                                className="w-full h-8 border-2 border-dashed border-slate-600 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-400 hover:bg-slate-700 hover:text-white hover:border-slate-500 transition-all uppercase tracking-widest"
                                                            >
                                                                + Add Range Line
                                                            </button>
                                                        </div>
                                                    ) : !item.isGenderSpecific ? (
                                                        item.isSingleValue ? (
                                                            <div className="w-full flex items-center justify-center h-11 bg-slate-700 rounded-xl border-2 border-slate-600 px-4 focus-within:border-blue-500 transition-all">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Static Value..."
                                                                    value={item.normalLow}
                                                                    onChange={(e) => handleItemChange(item.id, 'normalLow', e.target.value)}
                                                                    className="w-full text-center bg-transparent outline-none font-black text-white font-serif text-sm"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-center gap-3 w-full font-serif text-sm px-3 h-11 bg-slate-700 rounded-xl border-2 border-slate-600 focus-within:border-blue-500 transition-all">
                                                                <input type="text" placeholder="Min" value={item.normalLow} onChange={(e) => handleItemChange(item.id, 'normalLow', e.target.value)} className="w-full text-center bg-transparent outline-none text-white font-black" />
                                                                <span className="text-slate-500">/</span>
                                                                <input type="text" placeholder="Max" value={item.normalHigh} onChange={(e) => handleItemChange(item.id, 'normalHigh', e.target.value)} className="w-full text-center bg-transparent outline-none text-white font-black" />
                                                            </div>
                                                        )
                                                    ) : (
                                                        <div className="w-full space-y-2 px-1 pb-1">
                                                            <div className="flex items-center justify-between text-[11px] gap-3 h-9 bg-slate-700 rounded-xl px-4 border-2 border-slate-600 focus-within:border-blue-500 transition-all">
                                                                <span className="font-black text-blue-400 w-5">M</span>
                                                                <div className="flex items-center gap-2 flex-1 font-serif">
                                                                    <input type="text" value={item.maleLow} onChange={(e) => handleItemChange(item.id, 'maleLow', e.target.value)} className="w-full text-center bg-transparent outline-none text-white font-black" placeholder="0" />
                                                                    <span className="text-slate-500">-</span>
                                                                    <input type="text" value={item.maleHigh} onChange={(e) => handleItemChange(item.id, 'maleHigh', e.target.value)} className="w-full text-center bg-transparent outline-none text-white font-black" placeholder="0" />
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center justify-between text-[11px] gap-3 h-9 bg-slate-700 rounded-xl px-4 border-2 border-slate-600 focus-within:border-blue-500 transition-all">
                                                                <span className="font-black text-pink-400 w-5">F</span>
                                                                <div className="flex items-center gap-2 flex-1 font-serif">
                                                                    <input type="text" value={item.femaleLow} onChange={(e) => handleItemChange(item.id, 'femaleLow', e.target.value)} className="w-full text-center bg-transparent outline-none text-white font-black" placeholder="0" />
                                                                    <span className="text-slate-500">-</span>
                                                                    <input type="text" value={item.femaleHigh} onChange={(e) => handleItemChange(item.id, 'femaleHigh', e.target.value)} className="w-full text-center bg-transparent outline-none text-white font-black" placeholder="0" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {rowConfig.showResult && (
                                                <div className="w-full pl-6">
                                                    {item.isPredefined ? (
                                                        <div className="flex flex-col gap-2 w-full mt-2">
                                                            {(item.resultOptions || [""]).map((opt, oIdx) => (
                                                                <div key={oIdx} className="flex items-center gap-2 h-9 bg-slate-700 rounded-xl px-3 border-2 border-slate-600 group/opt focus-within:border-blue-500 transition-all">
                                                                    <input
                                                                        type="text"
                                                                        value={opt}
                                                                        placeholder="Option (e.g. Positive)"
                                                                        onChange={(e) => {
                                                                            const newOpts = [...(item.resultOptions || [""])];
                                                                            newOpts[oIdx] = e.target.value;
                                                                            handleItemChange(item.id, 'resultOptions', newOpts);
                                                                        }}
                                                                        className="flex-1 bg-transparent outline-none font-serif text-xs font-black text-white"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const newOpts = (item.resultOptions || [""]).filter((_, i) => i !== oIdx);
                                                                            handleItemChange(item.id, 'resultOptions', newOpts.length > 0 ? newOpts : [""]);
                                                                        }}
                                                                        className="opacity-0 group-hover/opt:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                                                                    >
                                                                        <IoClose className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    handleItemChange(item.id, 'resultOptions', [...(item.resultOptions || [""]), ""]);
                                                                }}
                                                                className="w-full h-8 border-2 border-dashed border-slate-600 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-400 hover:bg-slate-700 hover:text-white hover:border-slate-500 transition-all uppercase tracking-widest"
                                                            >
                                                                + Result Option
                                                            </button>
                                                        </div>
                                                    ) : !item.isGenderSpecific ? (
                                                        <div className="flex flex-col items-end pt-8">
                                                            <div className="w-full h-11 bg-slate-700/30 rounded-2xl border-2 border-slate-600 border-dashed"></div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-end">
                                                            <div className="w-full h-9 mb-2"></div>
                                                            <div className="space-y-2 w-full">
                                                                <div className="w-full h-9 bg-slate-700/30 rounded-xl border-2 border-slate-600 border-dashed"></div>
                                                                <div className="w-full h-9 bg-slate-700/30 rounded-xl border-2 border-slate-600 border-dashed"></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-3 gap-6 pt-10 border-t border-slate-700">
                        <button type="button" onClick={addTestRow} className="flex items-center justify-center gap-3 bg-slate-800 border-2 border-slate-700 py-4 rounded-2xl text-xs font-black text-slate-300 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all active:scale-95 group shadow-lg">
                            <IoAdd className="h-6 w-6" />
                            <span className="uppercase tracking-[0.2em]">Add Test Row</span>
                        </button>
                        <button type="button" onClick={addSubheading} className="flex items-center justify-center gap-3 bg-slate-800 border-2 border-slate-700 py-4 rounded-2xl text-xs font-black text-slate-300 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all active:scale-95 group shadow-lg">
                            <IoList className="h-6 w-6" />
                            <span className="uppercase tracking-[0.2em]">Add Section Header</span>
                        </button>
                        <button type="button" onClick={addMatrixRow} className="flex items-center justify-center gap-3 bg-slate-800 border-2 border-slate-700 py-4 rounded-2xl text-xs font-black text-slate-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 transition-all active:scale-95 group shadow-lg">
                            <IoGridOutline className="h-6 w-6" />
                            <span className="uppercase tracking-[0.2em]">Add Matrix Table</span>
                        </button>
                    </div>

                    <div className="pt-12 flex gap-6">
                        {initialTemplate && (
                            <button
                                type="button"
                                onClick={() => { if (onTemplateCreated) onTemplateCreated(); }}
                                className="bg-slate-800 text-slate-400 border-2 border-slate-700 py-4 px-10 rounded-2xl font-black hover:bg-slate-700 hover:text-white transition-all text-xs uppercase tracking-widest"
                            >
                                Discard Changes
                            </button>
                        )}
                        <button type="submit" disabled={isSaving} className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black hover:bg-blue-500 transition-all shadow-2xl shadow-blue-900/20 uppercase tracking-[0.3em] text-sm active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-600 flex items-center justify-center gap-4 border border-blue-400/30">
                            {isSaving ? (
                                <>
                                    <CgSpinner className="animate-spin h-6 w-6 text-white" />
                                    <span>DEPLOYING MODULE...</span>
                                </>
                            ) : (
                                <>
                                    <IoSave className="h-6 w-6" />
                                    <span>{initialTemplate ? "COMMIT UPDATES" : "SAVE & DEPLOY TEMPLATE"}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}
