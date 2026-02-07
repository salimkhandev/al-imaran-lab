import React, { useState, useEffect } from "react";
import { IoAdd, IoClose, IoList, IoSave } from "react-icons/io5";
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
            result: ""
        }]);
    };

    const addSubheading = () => {
        setItems([...items, {
            id: Date.now() + Math.random(),
            type: 'subheading',
            text: "",
            subtext: "",
            testLabel: "Test",
            unitLabel: "Unite",
            valueLabel: "N,Value",
            resultLabel: "Result.",
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
                testLabel: "Test",
                unitLabel: "Unite",
                valueLabel: "N,Value",
                resultLabel: "Result.",
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
        <section className="bg-transparent w-full relative">
            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-5">
                <div className="flex flex-col">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">Template Designer</h2>
                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-0.5">Structure laboratory test modules</p>
                </div>
                {initialTemplate && (
                    <span className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest">
                        Editing: {initialTemplate.name}
                    </span>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Main Report Title</label>
                            <input
                                type="text"
                                className="w-full text-sm font-black bg-white border border-slate-200 rounded-lg px-4 py-2 focus:border-slate-900 outline-none transition-all placeholder:text-slate-200 uppercase"
                                value={mainTestName}
                                onChange={(e) => setMainTestName(e.target.value)}
                                placeholder="e.g. COMPLETE BLOOD COUNT"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Sub-Header (Optional)</label>
                            <input
                                type="text"
                                className="w-full text-[11px] font-bold bg-white border border-slate-200 rounded-lg px-4 py-2 focus:border-slate-900 outline-none transition-all placeholder:text-slate-200 uppercase"
                                value={mainConfig.subtitle || ""}
                                onChange={(e) => handleMainConfigChange('subtitle', e.target.value)}
                                placeholder="e.g. HAEMATOLOGY REPORT"
                            />
                        </div>
                    </div>

                    {/* MAIN HEADER CONFIGURATION */}
                    <div className="pt-6 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-[8px] font-black text-slate-500 uppercase flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-slate-900"></span>
                                Columns Management
                            </label>

                            {/* RESTORE COLUMNS TOOLBAR */}
                            <div className="flex gap-2">
                                {!mainConfig.showTest && (
                                    <button type="button" onClick={() => handleMainConfigChange('showTest', true)} className="text-[8px] bg-white text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 font-black hover:bg-slate-50 transition-all uppercase shadow-sm">
                                        + Test Name
                                    </button>
                                )}
                                {!mainConfig.showUnit && (
                                    <button type="button" onClick={() => handleMainConfigChange('showUnit', true)} className="text-[8px] bg-white text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 font-black hover:bg-slate-50 transition-all uppercase shadow-sm">
                                        + Unit
                                    </button>
                                )}
                                {!mainConfig.showValue && (
                                    <button type="button" onClick={() => handleMainConfigChange('showValue', true)} className="text-[8px] bg-white text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 font-black hover:bg-slate-50 transition-all uppercase shadow-sm">
                                        + Ref. Range
                                    </button>
                                )}
                                {!mainConfig.showResult && (
                                    <button type="button" onClick={() => handleMainConfigChange('showResult', true)} className="text-[8px] bg-white text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 font-black hover:bg-slate-50 transition-all uppercase shadow-sm">
                                        + Result
                                    </button>
                                )}
                            </div>
                        </div>

                        <div style={mainGridStyle} className="bg-slate-900 text-white rounded-lg py-3 px-5 text-[10px] font-black uppercase tracking-widest">
                            {mainConfig.showTest && (
                                <div className="relative group/header flex items-center gap-2">
                                    <input
                                        value={mainConfig.testLabel}
                                        onChange={(e) => handleMainConfigChange('testLabel', e.target.value)}
                                        className="bg-transparent border-none p-0 focus:ring-0 uppercase outline-none w-full"
                                    />
                                    <button type="button" onClick={() => toggleMainColumn('showTest')} className="text-slate-500 hover:text-red-400 opacity-0 group-hover/header:opacity-100 transition-opacity font-bold">×</button>
                                </div>
                            )}
                            {mainConfig.showUnit && (
                                <div className="relative group/header text-center flex items-center justify-center gap-2">
                                    <input
                                        value={mainConfig.unitLabel}
                                        onChange={(e) => handleMainConfigChange('unitLabel', e.target.value)}
                                        className="bg-transparent border-none p-0 focus:ring-0 uppercase text-center outline-none w-full"
                                    />
                                    <button type="button" onClick={() => toggleMainColumn('showUnit')} className="text-slate-500 hover:text-red-400 opacity-0 group-hover/header:opacity-100 transition-opacity font-bold">×</button>
                                </div>
                            )}
                            {mainConfig.showValue && (
                                <div className="relative group/header text-center flex items-center justify-center gap-2">
                                    <input
                                        value={mainConfig.valueLabel}
                                        onChange={(e) => handleMainConfigChange('valueLabel', e.target.value)}
                                        className="bg-transparent border-none p-0 focus:ring-0 uppercase text-center outline-none w-full"
                                    />
                                    <button type="button" onClick={() => toggleMainColumn('showValue')} className="text-slate-500 hover:text-red-400 opacity-0 group-hover/header:opacity-100 transition-opacity font-bold">×</button>
                                </div>
                            )}
                            {mainConfig.showResult && (
                                <div className="relative group/header text-right flex items-center justify-end gap-2">
                                    <input
                                        value={mainConfig.resultLabel}
                                        onChange={(e) => handleMainConfigChange('resultLabel', e.target.value)}
                                        className="bg-transparent border-none p-0 focus:ring-0 uppercase text-right outline-none w-full"
                                    />
                                    <button type="button" onClick={() => toggleMainColumn('showResult')} className="text-slate-500 hover:text-red-400 opacity-0 group-hover/header:opacity-100 transition-opacity font-bold">×</button>
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
                        <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/30">
                            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-50">
                                <IoAdd className="h-8 w-8 text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-medium">Add testing rows or sections below</p>
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
                            <div key={item.id} className="relative group rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50/50 transition-all p-1.5">
                                <button
                                    type="button"
                                    onClick={() => removeItem(item.id)}
                                    className="absolute -right-2 top-6 p-2 bg-white text-slate-300 hover:text-red-500 rounded-full shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-all z-20 hover:scale-110"
                                >
                                    <IoClose className="h-4 w-4" />
                                </button>

                                {item.type === 'subheading' ? (
                                    <div className="p-5 bg-white rounded-xl border border-slate-100 shadow-sm space-y-4">
                                        <div className="flex gap-4">
                                            <div className="flex-1 space-y-1.5">
                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Section Title</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. CHEMICAL ANALYSIS..."
                                                    value={item.text}
                                                    onChange={(e) => handleItemChange(item.id, 'text', e.target.value)}
                                                    className="w-full font-bold bg-slate-50 rounded-lg px-4 py-2 outline-none text-slate-800 border border-slate-100 focus:border-slate-900 focus:bg-white transition-all uppercase text-[11px]"
                                                />
                                            </div>
                                            <div className="flex-1 space-y-1.5">
                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Section Sub-Header</label>
                                                <input
                                                    type="text"
                                                    placeholder="Sub-heading..."
                                                    value={item.subtext}
                                                    onChange={(e) => handleItemChange(item.id, 'subtext', e.target.value)}
                                                    className="w-full font-medium bg-slate-50 rounded-lg px-4 py-2 outline-none text-slate-500 border border-slate-100 focus:border-slate-900 focus:bg-white transition-all text-[10px]"
                                                />
                                            </div>
                                        </div>

                                        <div style={gridStyle} className="bg-slate-50 rounded-lg py-2 px-4 text-[9px] font-black uppercase tracking-wider text-slate-600 border border-slate-100">
                                            {rowConfig.showTest && (
                                                <div className="relative group/subhead flex items-center justify-between">
                                                    <input value={item.testLabel} onChange={(e) => handleItemChange(item.id, 'testLabel', e.target.value)} className="bg-transparent border-none p-0 focus:ring-0 uppercase outline-none w-full" />
                                                    <button type="button" onClick={() => toggleColumn(item.id, 'showTest')} className="text-slate-300 hover:text-black opacity-0 group-hover/subhead:opacity-100 transition-opacity">×</button>
                                                </div>
                                            )}
                                            {rowConfig.showUnit && (
                                                <div className="relative group/subhead text-center flex items-center justify-center">
                                                    <input value={item.unitLabel} onChange={(e) => handleItemChange(item.id, 'unitLabel', e.target.value)} className="bg-transparent border-none p-0 focus:ring-0 uppercase text-center outline-none w-full" />
                                                    <button type="button" onClick={() => toggleColumn(item.id, 'showUnit')} className="text-slate-300 hover:text-black opacity-0 group-hover/subhead:opacity-100 transition-opacity">×</button>
                                                </div>
                                            )}
                                            {rowConfig.showValue && (
                                                <div className="relative group/subhead text-center flex items-center justify-center">
                                                    <input value={item.valueLabel} onChange={(e) => handleItemChange(item.id, 'valueLabel', e.target.value)} className="bg-transparent border-none p-0 focus:ring-0 uppercase text-center outline-none w-full" />
                                                    <button type="button" onClick={() => toggleColumn(item.id, 'showValue')} className="text-slate-300 hover:text-black opacity-0 group-hover/subhead:opacity-100 transition-opacity">×</button>
                                                </div>
                                            )}
                                            {rowConfig.showResult && (
                                                <div className="relative group/subhead text-right flex items-center justify-end">
                                                    <input value={item.resultLabel} onChange={(e) => handleItemChange(item.id, 'resultLabel', e.target.value)} className="bg-transparent border-none p-0 focus:ring-0 uppercase text-right outline-none w-full" />
                                                    <button type="button" onClick={() => toggleColumn(item.id, 'showResult')} className="text-slate-300 hover:text-black opacity-0 group-hover/subhead:opacity-100 transition-opacity">×</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={gridStyle} className="items-center px-6 py-4">
                                        {rowConfig.showTest && (
                                            <div className="pt-2">
                                                <input
                                                    type="text"
                                                    placeholder="Test Name (e.g. Glucose)"
                                                    value={item.name}
                                                    onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                                                    className="w-full bg-transparent border-b border-transparent focus:border-slate-200 p-0 focus:ring-0 font-bold text-slate-800 text-sm outline-none transition-all"
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
                                                    className="w-full bg-slate-50 rounded-lg py-1 px-2 border border-slate-100 focus:bg-white focus:ring-0 text-center text-[11px] text-slate-500 font-serif outline-none"
                                                />
                                            </div>
                                        )}
                                        {rowConfig.showValue && (
                                            <div className="flex flex-col items-center">
                                                <div className="flex items-center justify-end w-full gap-3 mb-2 h-5">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[6px] font-black text-slate-300 uppercase tracking-widest">Single</span>
                                                        <input
                                                            type="checkbox"
                                                            checked={item.isSingleValue}
                                                            onChange={(e) => handleItemChange(item.id, 'isSingleValue', e.target.checked)}
                                                            className="w-3 h-3 rounded text-slate-900 border-slate-300 cursor-pointer focus:ring-0"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[6px] font-black text-slate-300 uppercase tracking-widest">Multi</span>
                                                        <input
                                                            type="checkbox"
                                                            checked={item.isMultiRange}
                                                            onChange={(e) => handleItemChange(item.id, 'isMultiRange', e.target.checked)}
                                                            className="w-3 h-3 rounded text-slate-900 border-slate-300 cursor-pointer focus:ring-0"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[6px] font-black text-slate-300 uppercase tracking-widest">Gender</span>
                                                        <input
                                                            type="checkbox"
                                                            checked={item.isGenderSpecific}
                                                            onChange={(e) => handleItemChange(item.id, 'isGenderSpecific', e.target.checked)}
                                                            className="w-3 h-3 rounded text-slate-900 border-slate-300 cursor-pointer focus:ring-0"
                                                        />
                                                    </div>
                                                </div>

                                                {item.isMultiRange ? (
                                                    <div className="w-full space-y-1">
                                                        {(item.multiRanges || [""]).map((range, rIdx) => (
                                                            <div key={rIdx} className="flex items-center gap-1 h-7 bg-slate-50 rounded px-2 border border-slate-100 group/range">
                                                                <input
                                                                    type="text"
                                                                    value={range}
                                                                    placeholder="Range Label: Value"
                                                                    onChange={(e) => {
                                                                        const newRanges = [...(item.multiRanges || [""])];
                                                                        newRanges[rIdx] = e.target.value;
                                                                        handleItemChange(item.id, 'multiRanges', newRanges);
                                                                    }}
                                                                    className="flex-1 bg-transparent outline-none font-serif text-[10px] font-bold text-slate-800"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newRanges = (item.multiRanges || [""]).filter((_, i) => i !== rIdx);
                                                                        handleItemChange(item.id, 'multiRanges', newRanges.length > 0 ? newRanges : [""]);
                                                                    }}
                                                                    className="opacity-0 group-hover/range:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-all"
                                                                >
                                                                    <IoClose className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                handleItemChange(item.id, 'multiRanges', [...(item.multiRanges || [""]), ""]);
                                                            }}
                                                            className="w-full h-6 border border-dashed border-slate-200 rounded flex items-center justify-center text-[8px] font-black text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all uppercase tracking-widest"
                                                        >
                                                            + Add Range Line
                                                        </button>
                                                    </div>
                                                ) : !item.isGenderSpecific ? (
                                                    item.isSingleValue ? (
                                                        <div className="w-full flex items-center justify-center h-9 bg-slate-50 rounded-xl border border-slate-100 px-3">
                                                            <input
                                                                type="text"
                                                                placeholder="Static Value..."
                                                                value={item.normalLow}
                                                                onChange={(e) => handleItemChange(item.id, 'normalLow', e.target.value)}
                                                                className="w-full text-center bg-transparent outline-none font-bold text-slate-800 font-serif text-xs"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-2 w-full font-serif text-xs px-2 h-9 bg-slate-50 rounded-xl border border-slate-100">
                                                            <input type="text" placeholder="Min" value={item.normalLow} onChange={(e) => handleItemChange(item.id, 'normalLow', e.target.value)} className="w-full text-center bg-transparent outline-none focus:text-slate-900 font-bold" />
                                                            <span className="text-slate-200">/</span>
                                                            <input type="text" placeholder="Max" value={item.normalHigh} onChange={(e) => handleItemChange(item.id, 'normalHigh', e.target.value)} className="w-full text-center bg-transparent outline-none focus:text-slate-900 font-bold" />
                                                        </div>
                                                    )
                                                ) : (
                                                    <div className="w-full space-y-1 px-1 pb-1">
                                                        <div className="flex items-center justify-between text-[9px] gap-2 h-7 bg-slate-50 rounded px-2 border border-slate-100">
                                                            <span className="font-black text-slate-900 w-4">M</span>
                                                            <div className="flex items-center gap-1 flex-1 font-serif">
                                                                <input type="text" value={item.maleLow} onChange={(e) => handleItemChange(item.id, 'maleLow', e.target.value)} className="w-full text-center bg-transparent outline-none text-slate-900 font-bold" placeholder="0" />
                                                                <span className="text-slate-200">-</span>
                                                                <input type="text" value={item.maleHigh} onChange={(e) => handleItemChange(item.id, 'maleHigh', e.target.value)} className="w-full text-center bg-transparent outline-none text-slate-900 font-bold" placeholder="0" />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between text-[9px] gap-2 h-7 bg-slate-50 rounded px-2 border border-slate-100">
                                                            <span className="font-black text-slate-900 w-4">F</span>
                                                            <div className="flex items-center gap-1 flex-1 font-serif">
                                                                <input type="text" value={item.femaleLow} onChange={(e) => handleItemChange(item.id, 'femaleLow', e.target.value)} className="w-full text-center bg-transparent outline-none text-slate-900 font-bold" placeholder="0" />
                                                                <span className="text-slate-200">-</span>
                                                                <input type="text" value={item.femaleHigh} onChange={(e) => handleItemChange(item.id, 'femaleHigh', e.target.value)} className="w-full text-center bg-transparent outline-none text-slate-900 font-bold" placeholder="0" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {rowConfig.showResult && (
                                            <div className="w-full pl-4">
                                                {!item.isGenderSpecific ? (
                                                    <div className="flex flex-col items-end pt-7">
                                                        <div className="w-full h-9 bg-slate-50/30 rounded-xl border border-slate-100 border-dashed"></div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-end">
                                                        <div className="w-full h-7 mb-2"></div>
                                                        <div className="space-y-1.5 w-full">
                                                            <div className="w-full h-7 bg-slate-50/30 rounded-lg border border-slate-100 border-dashed"></div>
                                                            <div className="w-full h-7 bg-slate-50/30 rounded-lg border border-slate-100 border-dashed"></div>
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

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                    <button type="button" onClick={addTestRow} className="flex items-center justify-center gap-2 bg-white border border-slate-200 py-3 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-95 group">
                        <IoAdd className="h-4 w-4" />
                        <span className="uppercase tracking-widest">Add Test Row</span>
                    </button>
                    <button type="button" onClick={addSubheading} className="flex items-center justify-center gap-2 bg-white border border-slate-200 py-3 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-95 group">
                        <IoList className="h-4 w-4" />
                        <span className="uppercase tracking-widest">Add Section</span>
                    </button>
                </div>

                <div className="pt-8 flex gap-4">
                    {initialTemplate && (
                        <button
                            type="button"
                            onClick={() => { if (onTemplateCreated) onTemplateCreated(); }}
                            className="bg-white text-slate-400 border border-slate-200 py-3 px-8 rounded-xl font-bold hover:bg-slate-100 hover:text-slate-600 transition-all text-xs uppercase"
                        >
                            Cancel
                        </button>
                    )}
                    <button type="submit" disabled={isSaving} className="flex-1 bg-slate-900 text-white py-3.5 rounded-xl font-black hover:bg-black transition-all shadow-xl shadow-slate-200 uppercase tracking-widest text-sm active:scale-[0.98] disabled:bg-slate-300 flex items-center justify-center gap-3">
                        {isSaving ? (
                            <>
                                <CgSpinner className="animate-spin h-4 w-4 text-white" />
                                <span>PROCESSING...</span>
                            </>
                        ) : (
                            <>
                                <IoSave className="h-5 w-5" />
                                <span>{initialTemplate ? "COMMIT UPDATES" : "DEPLOY NEW TEMPLATE"}</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </section>
    );
}
