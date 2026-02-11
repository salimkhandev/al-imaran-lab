import React, { useState, useEffect, useCallback } from "react";
import {
    IoAdd, IoClose, IoList, IoSave, IoGridOutline,
    IoLayersOutline, IoSettingsOutline, IoReaderOutline,
    IoTrashOutline, IoCopyOutline
} from "react-icons/io5";
import { CgSpinner } from "react-icons/cg";
import Swal from 'sweetalert2';
import docLogo from '../assets/doc-logo.png';

// DND Kit Imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

// --- STYLES ---
const A4_PIXELS_W = 794; // approx at 96dpi
const A4_PIXELS_H = 1123;

// --- COMPONENTS ---

// 1. Sortable Wrapper
function SortableItem({ id, children, isSelected, onClick, disableHover, isRowActive }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : (isRowActive ? 80 : (disableHover ? 1 : 1)),
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative group mb-1 border-2 transition-all ${isSelected && !disableHover
                ? 'border-indigo-500 bg-indigo-50/30'
                : 'border-transparent'
                } ${!disableHover && !isSelected ? 'hover:border-slate-200' : ''} rounded-lg`}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
        >
            <div
                {...attributes}
                {...listeners}
                className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-indigo-500"
            >
                <IoLayersOutline className="w-5 h-5" />
            </div>
            {children}
        </div>
    );
}

export default function TestTemplateForm({ onTemplateCreated, initialTemplate }) {
    const [mainTestName, setMainTestName] = useState(initialTemplate?.name || "");
    const [isSaving, setIsSaving] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [openOptionsId, setOpenOptionsId] = useState(null);
    const [openRangeId, setOpenRangeId] = useState(null);

    // Main Report Header Configuration
    const [mainConfig, setMainConfig] = useState(initialTemplate?.items ? (JSON.parse(initialTemplate.items).meta || {
        showTest: true,
        showUnit: true,
        showValue: true,
        showResult: true,
        testLabel: "Test",
        unitLabel: "Unit",
        valueLabel: "Normal Value",
        resultLabel: "Result",
        subtitle: ""
    }) : {
        showTest: true,
        showUnit: true,
        showValue: true,
        showResult: true,
        testLabel: "Test",
        unitLabel: "Unit",
        valueLabel: "Normal Value",
        resultLabel: "Result",
        subtitle: ""
    });

    const [labInfo] = useState({
        name: localStorage.getItem('labName') || "AL-IMRAN",
        brand: localStorage.getItem('labBrand') || "MEDICAL STORE, DENTAL CLINIC AND LABORATORY",
    });

    const [addressInfo] = useState({
        line1: localStorage.getItem('addressLine1') || "Al-Madina Public School",
        line2: localStorage.getItem('addressLine2') || "Luqman Banda",
        phone1: localStorage.getItem('addressPhone1') || "+880 1234 567890",
        phone2: localStorage.getItem('addressPhone2') || "+880 1234 567890"
    });

    const [patientInfo] = useState({
        name: "ENTER PATIENT NAME",
        id: "AL-2026-0053",
        age: "AGE",
        gender: "MALE",
        date: "2/10/2026",
        time: "09:50 PM",
        refBy: ""
    });

    const [items, setItems] = useState([]);

    // Sensors for DND
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Global click listener to close popovers
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Close options if clicked outside
            if (openOptionsId && !event.target.closest('.options-popover')) {
                setOpenOptionsId(null);
            }
            // Close range if clicked outside
            if (openRangeId && !event.target.closest('.range-popover')) {
                setOpenRangeId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openOptionsId, openRangeId]);

    // Populate form if editing
    useEffect(() => {
        if (initialTemplate) {
            setMainTestName(initialTemplate.name);
            try {
                const parsed = JSON.parse(initialTemplate.items);
                if (Array.isArray(parsed)) {
                    setItems(parsed.map(i => ({ ...i, id: i.id || Date.now() + Math.random() })));
                } else if (parsed && typeof parsed === 'object') {
                    if (parsed.meta) setMainConfig({ ...mainConfig, ...parsed.meta });
                    if (parsed.rows) setItems(parsed.rows.map(i => ({ ...i, id: i.id || Date.now() + Math.random() })));
                }
            } catch (e) {
                console.error("Failed to parse template for editing", e);
            }
        } else {
            // Default initial row
            addTestRow();
        }
    }, [initialTemplate]);

    const handleItemChange = (id, field, value) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const handleMainConfigChange = (field, value) => {
        setMainConfig(prev => ({ ...prev, [field]: value }));
    };

    const addTestRow = () => {
        const newId = Date.now() + Math.random();
        setItems(prev => [...prev, {
            id: newId,
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
        setSelectedId(newId);
    };

    const addMatrixRow = () => {
        const newId = Date.now() + Math.random();
        setItems(prev => [...prev, {
            id: newId,
            type: 'matrix',
            title: "",
            headers: ["1/20", "1/40", "1/80"],
            matrixRows: [
                { id: Date.now() + 1, name: "Row 1", values: ["", "", ""] }
            ],
            isPredefined: false,
            rowLabel: "Test",
            resultOptions: [""]
        }]);
        setSelectedId(newId);
    };

    const addSubheading = () => {
        const newId = Date.now() + Math.random();
        setItems(prev => [...prev, {
            id: newId,
            type: 'subheading',
            text: "",
            subtext: "",
            testLabel: mainConfig.testLabel,
            unitLabel: mainConfig.unitLabel,
            valueLabel: mainConfig.valueLabel,
            resultLabel: mainConfig.resultLabel,
            showTest: mainConfig.showTest,
            showUnit: mainConfig.showUnit,
            showValue: mainConfig.showValue,
            showResult: mainConfig.showResult
        }]);
        setSelectedId(newId);
    };

    const removeItem = (id) => {
        setItems(prev => prev.filter(item => item.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    const duplicateItem = (id) => {
        const item = items.find(i => i.id === id);
        if (!item) return;
        const newItem = { ...item, id: Date.now() + Math.random() };
        const index = items.findIndex(i => i.id === id);
        const newItems = [...items];
        newItems.splice(index + 1, 0, newItem);
        setItems(newItems);
        setSelectedId(newItem.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!mainTestName.trim()) {
            Swal.fire({ title: 'Error', text: 'Please enter a test title.', icon: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            const payload = { meta: mainConfig, rows: items };
            if (initialTemplate && initialTemplate.id) {
                await window.electronAPI.updateTestTemplate({ id: initialTemplate.id, name: mainTestName, items: payload });
            } else {
                await window.electronAPI.addTestTemplate({ name: mainTestName, items: payload });
            }

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
            Swal.fire({ title: 'Deployment Failed', text: `Failed to save: ${err.message}`, icon: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    // --- RENDER HELPERS ---

    const getGridStyle = (config) => {
        const parts = [];
        if (config.showTest) parts.push("2.5fr");
        if (config.showUnit) parts.push("1fr");
        if (config.showValue) parts.push("2.5fr");
        if (config.showResult) parts.push("2fr");
        return {
            display: 'grid',
            gridTemplateColumns: parts.join(" "),
            gap: '1rem'
        };
    };

    const selectedItem = items.find(i => i.id === selectedId);

    const getItemHeight = (item) => {
        if (item.type === 'subheading') return 120;
        if (item.type === 'matrix') return 180 + ((item.matrixRows || []).length * 35);
        if (item.type === 'test') {
            if (item.isGenderSpecific) return 90;
            if (item.isMultiRange) return 50 + ((item.multiRanges || []).length * 30);
            return 50;
        }
        return 50;
    };

    const renderPages = () => {
        const pages = [];
        // A4 = 297mm height, 12mm padding top/bottom = 273mm usable
        // Page 1: Letterhead (~180px) + Patient info (~110px) + Title/Headers (~130px) + Footer (~80px) = ~500px overhead
        // Available for content on Page 1: ~490px
        const PAGE_1_LIMIT = 490;

        // Continuation pages: Letterhead (~180px) + Patient info (~110px) + Title(Contd.)/Headers (~100px) + Footer (~80px) = ~470px overhead
        // Available for content on continuation pages: ~520px
        const PAGE_N_LIMIT = 520;

        let currentPage = [];
        let currentHeight = 0;
        let isFirstPage = true;

        items.forEach((item) => {
            const h = getItemHeight(item);
            const limit = isFirstPage ? PAGE_1_LIMIT : PAGE_N_LIMIT;

            if (currentHeight + h > limit && currentPage.length > 0) {
                pages.push(currentPage);
                currentPage = [item];
                currentHeight = h;
                isFirstPage = false;
            } else {
                currentPage.push(item);
                currentHeight += h;
            }
        });

        if (currentPage.length > 0 || pages.length === 0) {
            pages.push(currentPage);
        }

        return pages;
    };

    return (
        <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans relative">
            {/* LEFT SIDEBAR: TOOLBOX */}
            <div className={`
                fixed lg:relative z-40 h-full w-48 bg-white border-r border-slate-200 flex flex-col shadow-xl 
                transition-transform duration-300 lg:translate-x-0
                ${selectedId ? 'translate-x-[-100%] lg:translate-x-0' : 'translate-x-0'}
            `}>
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Designer Toolbox</h2>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Insert report elements</p>
                </div>

                <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                    <button
                        onClick={addTestRow}
                        className="w-full flex items-center gap-1.5 p-2 bg-white border-2 border-slate-100 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group"
                    >
                        <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110">
                            <IoAdd className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black text-slate-700">Test Row</p>
                            <p className="text-[7px] text-slate-400 font-bold uppercase tracking-tight">Normal ranges & units</p>
                        </div>
                    </button>

                    <button
                        onClick={addSubheading}
                        className="w-full flex items-center gap-1.5 p-2 bg-white border-2 border-slate-100 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group"
                    >
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
                            <IoList className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black text-slate-700">Subheading</p>
                            <p className="text-[7px] text-slate-400 font-bold uppercase tracking-tight">Section separator</p>
                        </div>
                    </button>

                    <button
                        onClick={addMatrixRow}
                        className="w-full flex items-center gap-1.5 p-2 bg-white border-2 border-slate-100 rounded-xl hover:border-amber-500 hover:bg-amber-50/30 transition-all group"
                    >
                        <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 transition-transform group-hover:scale-110">
                            <IoGridOutline className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black text-slate-700">Matrix Row</p>
                            <p className="text-[7px] text-slate-400 font-bold uppercase tracking-tight">Tabular data grid</p>
                        </div>
                    </button>

                    <div className="pt-6 border-t border-slate-100">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Manifest Layout</h3>
                        <div className="space-y-1">
                            {items.map((item, idx) => (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedId(item.id)}
                                    className={`
                                        flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all border group/manifest
                                        ${selectedId === item.id
                                            ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-[1.02]'
                                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-600'
                                        }`}
                                >
                                    <span className="text-[9px] font-black w-3">{idx + 1}</span>
                                    <span className="text-[10px] font-bold truncate flex-1">
                                        {item.type === 'subheading' ? (item.text || 'Section Heading') : (item.name || item.title || 'New Item')}
                                    </span>

                                    <div className="flex items-center gap-1 opacity-0 group-hover/manifest:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); duplicateItem(item.id); }}
                                            className={`p-1 rounded-md transition-all ${selectedId === item.id ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-indigo-50 text-slate-300 hover:text-indigo-600'}`}
                                            title="Duplicate"
                                        >
                                            <IoCopyOutline className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                                            className={`p-1 rounded-md transition-all ${selectedId === item.id ? 'hover:bg-red-900/50 text-red-300' : 'hover:bg-red-50 text-slate-300 hover:text-red-500'}`}
                                            title="Delete"
                                        >
                                            <IoTrashOutline className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50/30">
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="w-full h-10 bg-slate-900 hover:bg-black text-white rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? <CgSpinner className="animate-spin text-lg" /> : <IoSave className="text-lg" />}
                        {isSaving ? "Saving..." : "Save Template"}
                    </button>
                </div>
            </div>

            {/* CENTER: A4 CANVAS */}
            <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-12 flex flex-col items-center bg-slate-200/50 relative scroll-smooth thin-scrollbar" onClick={() => setSelectedId(null)}>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis]}
                >
                    <SortableContext
                        items={items.map(i => i.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {renderPages().map((pageItems, pageIdx) => (
                            <div key={pageIdx} className="w-[210mm] bg-white shadow-2xl min-h-[297mm] h-[297mm] p-[12mm] border border-slate-300 relative mb-20 shrink-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>

                                {pageIdx === 0 ? (
                                    <>
                                        {/* LAB LETTERHEAD */}
                                        <div className="pb-6 mb-4 relative">
                                            <div className="flex justify-between items-start gap-4 mb-4">
                                                <div className="flex-shrink-0 -mt-6">
                                                    <img src={docLogo} alt="Lab Logo" className="h-[100px] w-auto object-contain" />
                                                </div>
                                                <div className="flex-1 flex flex-col items-center text-center px-2 -space-y-1">
                                                    <h1 className="text-5xl font-black text-slate-900 uppercase tracking-widest leading-tight font-serif">{labInfo.name}</h1>
                                                    <p className="text-[10px] font-bold text-slate-700 uppercase leading-tight font-sans">{labInfo.brand}</p>
                                                </div>
                                                <div className="flex-shrink-0 flex flex-col text-left space-y-0.5 min-w-[140px]">
                                                    <div className="flex flex-col -space-y-1 mb-0.5">
                                                        <p className="text-[10px] font-bold text-slate-600 font-sans">{addressInfo.line1}</p>
                                                        <p className="text-[10px] font-bold text-slate-600 font-sans">{addressInfo.line2}</p>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-600 font-sans">{addressInfo.phone1}</p>
                                                    <p className="text-[10px] font-bold text-slate-600 font-sans">{addressInfo.phone2}</p>
                                                </div>
                                            </div>
                                            <div className="h-1 bg-slate-900 w-full mb-2"></div>
                                        </div>

                                        {/* PATIENT INFO HEADER */}
                                        <div className="grid grid-cols-[1fr_1fr] gap-x-8 gap-y-1 mb-8 px-2 py-3 bg-slate-50 border border-slate-200 rounded-lg">
                                            <div className="space-y-1 pr-4 border-r border-slate-200">
                                                <div className="grid grid-cols-[80px_1fr] items-center">
                                                    <span className="font-black text-slate-900 uppercase text-[7px] tracking-widest">Name:</span>
                                                    <span className="font-black text-slate-400 uppercase text-[10px] px-1">{patientInfo.name}</span>
                                                </div>
                                                <div className="grid grid-cols-[80px_1fr] items-center">
                                                    <span className="font-black text-slate-900 uppercase text-[7px] tracking-widest">Age/Sex:</span>
                                                    <div className="flex gap-1 font-black text-slate-400 uppercase text-[10px] px-1">
                                                        <span>{patientInfo.age}</span>
                                                        <div className="text-slate-300">/</div>
                                                        <span>{patientInfo.gender}</span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-[80px_1fr] items-center">
                                                    <span className="font-black text-slate-900 uppercase text-[7px] tracking-widest">Pat. ID:</span>
                                                    <span className="font-black text-slate-900 uppercase text-[10px] px-1">{patientInfo.id}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1 pl-4">
                                                <div className="grid grid-cols-[80px_1fr] items-center">
                                                    <span className="font-black text-slate-900 uppercase text-[7px] tracking-widest">Date:</span>
                                                    <span className="font-black text-slate-900 uppercase text-[10px] px-1">{patientInfo.date}</span>
                                                </div>
                                                <div className="grid grid-cols-[80px_1fr] items-center">
                                                    <span className="font-black text-slate-900 uppercase text-[7px] tracking-widest">Time:</span>
                                                    <span className="font-black text-slate-900 uppercase text-[10px] px-1">{patientInfo.time}</span>
                                                </div>
                                                <div className="grid grid-cols-[80px_1fr] items-center">
                                                    <span className="font-black text-slate-900 uppercase text-[7px] tracking-widest">Ref By:</span>
                                                    <span className="font-black text-slate-900 uppercase text-[10px] px-1">-</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-12 mb-8 text-center relative px-20">
                                            <div className="inline-block border-b border-slate-400 pb-1.5 px-4 mb-2 min-w-[300px]">
                                                <input
                                                    type="text"
                                                    value={mainTestName}
                                                    onChange={(e) => setMainTestName(e.target.value)}
                                                    placeholder="CLICK TO ENTER MODULE TITLE"
                                                    className="w-full text-[16px] font-black uppercase tracking-[0.25em] text-slate-900 bg-transparent text-center outline-none hover:bg-slate-50 focus:bg-slate-50 transition-colors uppercase"
                                                />
                                            </div>
                                            <div className="flex justify-center mt-2">
                                                <div className="inline-block border-b border-slate-300 pb-0.5 px-3 min-w-[200px]">
                                                    <input
                                                        type="text"
                                                        value={mainConfig.subtitle || ""}
                                                        onChange={(e) => handleMainConfigChange('subtitle', e.target.value)}
                                                        placeholder="SUBTITLE / DESCRIPTION"
                                                        className="w-full text-[10px] font-bold text-slate-700 uppercase tracking-[0.3em] text-center bg-transparent outline-none hover:bg-slate-50 focus:bg-slate-50 transition-colors"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Column Labels */}
                                        <div style={getGridStyle(mainConfig)} className="items-center mt-8 border-b border-slate-400 pb-2 mb-2 font-black text-[9px] uppercase text-slate-500 tracking-widest cursor-default">
                                            {mainConfig.showTest && <div className="text-left">{mainConfig.testLabel}</div>}
                                            {mainConfig.showUnit && <div className="text-center">{mainConfig.unitLabel}</div>}
                                            {mainConfig.showValue && <div className="text-center">{mainConfig.valueLabel}</div>}
                                            {mainConfig.showResult && <div className="text-right">{mainConfig.resultLabel}</div>}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* LAB LETTERHEAD - Repeated on all pages */}
                                        <div className="pb-6 mb-4 relative">
                                            <div className="flex justify-between items-start gap-4 mb-4">
                                                <div className="flex-shrink-0 -mt-6">
                                                    <img src={docLogo} alt="Lab Logo" className="h-[100px] w-auto object-contain" />
                                                </div>
                                                <div className="flex-1 flex flex-col items-center text-center px-2 -space-y-1">
                                                    <h1 className="text-5xl font-black text-slate-900 uppercase tracking-widest leading-tight font-serif">{labInfo.name}</h1>
                                                    <p className="text-[10px] font-bold text-slate-700 uppercase leading-tight font-sans">{labInfo.brand}</p>
                                                </div>
                                                <div className="flex-shrink-0 flex flex-col text-left space-y-0.5 min-w-[140px]">
                                                    <div className="flex flex-col -space-y-1 mb-0.5">
                                                        <p className="text-[10px] font-bold text-slate-600 font-sans">{addressInfo.line1}</p>
                                                        <p className="text-[10px] font-bold text-slate-600 font-sans">{addressInfo.line2}</p>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-600 font-sans">{addressInfo.phone1}</p>
                                                    <p className="text-[10px] font-bold text-slate-600 font-sans">{addressInfo.phone2}</p>
                                                </div>
                                            </div>
                                            <div className="h-1 bg-slate-900 w-full mb-2"></div>
                                        </div>

                                        {/* PATIENT INFO HEADER - Repeated on all pages */}
                                        <div className="grid grid-cols-[1fr_1fr] gap-x-8 gap-y-1 mb-8 px-2 py-3 bg-slate-50 border border-slate-200 rounded-lg">
                                            <div className="space-y-1 pr-4 border-r border-slate-200">
                                                <div className="grid grid-cols-[80px_1fr] items-center">
                                                    <span className="font-black text-slate-900 uppercase text-[7px] tracking-widest">Name:</span>
                                                    <span className="font-black text-slate-400 uppercase text-[10px] px-1">{patientInfo.name}</span>
                                                </div>
                                                <div className="grid grid-cols-[80px_1fr] items-center">
                                                    <span className="font-black text-slate-900 uppercase text-[7px] tracking-widest">Age/Sex:</span>
                                                    <div className="flex gap-1 font-black text-slate-400 uppercase text-[10px] px-1">
                                                        <span>{patientInfo.age}</span>
                                                        <div className="text-slate-300">/</div>
                                                        <span>{patientInfo.gender}</span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-[80px_1fr] items-center">
                                                    <span className="font-black text-slate-900 uppercase text-[7px] tracking-widest">Pat. ID:</span>
                                                    <span className="font-black text-slate-900 uppercase text-[10px] px-1">{patientInfo.id}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1 pl-4">
                                                <div className="grid grid-cols-[80px_1fr] items-center">
                                                    <span className="font-black text-slate-900 uppercase text-[7px] tracking-widest">Date:</span>
                                                    <span className="font-black text-slate-900 uppercase text-[10px] px-1">{patientInfo.date}</span>
                                                </div>
                                                <div className="grid grid-cols-[80px_1fr] items-center">
                                                    <span className="font-black text-slate-900 uppercase text-[7px] tracking-widest">Time:</span>
                                                    <span className="font-black text-slate-900 uppercase text-[10px] px-1">{patientInfo.time}</span>
                                                </div>
                                                <div className="grid grid-cols-[80px_1fr] items-center">
                                                    <span className="font-black text-slate-900 uppercase text-[7px] tracking-widest">Ref By:</span>
                                                    <span className="font-black text-slate-900 uppercase text-[10px] px-1">-</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Template Title with (Contd.) indicator */}
                                        <div className="mt-8 mb-6 text-center">
                                            <div className="inline-block border-b border-slate-400 pb-1.5 px-4">
                                                <h2 className="text-[16px] font-black uppercase tracking-[0.25em] text-slate-900">
                                                    {mainTestName} <span className="text-slate-400 text-[14px]">(Contd.)</span>
                                                </h2>
                                            </div>
                                        </div>

                                        {/* Column Labels - Repeated on continuation pages */}
                                        <div style={getGridStyle(mainConfig)} className="items-center mt-4 border-b border-slate-400 pb-2 mb-2 font-black text-[9px] uppercase text-slate-500 tracking-widest cursor-default">
                                            {mainConfig.showTest && <div className="text-left">{mainConfig.testLabel}</div>}
                                            {mainConfig.showUnit && <div className="text-center">{mainConfig.unitLabel}</div>}
                                            {mainConfig.showValue && <div className="text-center">{mainConfig.valueLabel}</div>}
                                            {mainConfig.showResult && <div className="text-right">{mainConfig.resultLabel}</div>}
                                        </div>
                                    </>
                                )}

                                <div>
                                    {pageItems.map((item) => (
                                        <SortableItem
                                            key={item.id}
                                            id={item.id}
                                            isSelected={selectedId === item.id}
                                            onClick={() => setSelectedId(item.id)}
                                            disableHover={!!openOptionsId || !!openRangeId}
                                            isRowActive={openOptionsId === item.id || openRangeId === item.id}
                                        >
                                            <CanvasItemRenderer
                                                item={item}
                                                config={mainConfig}
                                                onChange={(f, v) => handleItemChange(item.id, f, v)}
                                                gridStyle={getGridStyle(item.type === 'subheading' ? item : mainConfig)}
                                                isOptionsOpen={openOptionsId === item.id}
                                                setOptionsOpen={(val) => setOpenOptionsId(val ? item.id : null)}
                                                isRangeOpen={openRangeId === item.id}
                                                setRangeOpen={(val) => setOpenRangeId(val ? item.id : null)}
                                            />
                                        </SortableItem>
                                    ))}

                                    {pageItems.length === 0 && pageIdx === 0 && (
                                        <div className="h-64 border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-slate-200">
                                            <IoLayersOutline className="w-16 h-16 mb-4" />
                                            <p className="font-black uppercase tracking-widest">Canvas Empty</p>
                                        </div>
                                    )}
                                </div>

                                {/* Page Footer Simulation */}
                                <div className="absolute bottom-10 left-[15mm] right-[15mm] border-t border-slate-100 pt-4 flex justify-between items-center opacity-30 pointer-events-none">
                                    <div className="text-[10px] font-serif italic text-slate-400">Report generated via Al-Imran LIMS</div>
                                    <div className="text-[10px] font-black uppercase text-slate-400">Page {String(pageIdx + 1).padStart(2, '0')}</div>
                                </div>
                            </div>
                        ))}
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
}

// --- SUB-COMPONENTS ---

function CanvasItemRenderer({ item, config, gridStyle, onChange, isOptionsOpen, setOptionsOpen, isRangeOpen, setRangeOpen }) {
    if (item.type === 'subheading') {
        return (
            <div className="py-12 text-center relative px-12 group/sub">
                {/* Primary Section Title */}
                <div className="inline-block border-b border-slate-400 pb-1.5 px-6 mb-2 min-w-[240px]">
                    <input
                        type="text"
                        value={item.text}
                        onChange={(e) => onChange('text', e.target.value)}
                        placeholder="SECTION TITLE..."
                        className="w-full text-[13px] font-black uppercase tracking-[0.2em] text-indigo-700 bg-transparent text-center outline-none hover:bg-slate-50 focus:bg-slate-50 transition-colors uppercase placeholder:text-indigo-200"
                    />
                </div>

                {/* Secondary Section Subtext/Description */}
                <div className="flex justify-center mt-2">
                    <div className="inline-block border-b border-slate-200 pb-0.5 px-4 min-w-[150px]">
                        <input
                            type="text"
                            value={item.subtext || ""}
                            onChange={(e) => onChange('subtext', e.target.value)}
                            placeholder="SECTION DESCRIPTION / NOTES"
                            className="w-full text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] text-center bg-transparent outline-none hover:bg-slate-50 focus:bg-slate-50 transition-colors placeholder:text-slate-200"
                        />
                    </div>
                </div>
            </div>
        );
    }

    if (item.type === 'matrix') {
        return (
            <div className="mt-8 mb-8 px-6 group/matrix relative">
                <div className="flex justify-center mb-6 relative">
                    <div className="inline-block border-b border-slate-400 pb-1 px-3 min-w-[200px]">
                        <input
                            type="text"
                            value={item.title}
                            onChange={(e) => onChange('title', e.target.value)}
                            className="w-full text-[12px] font-black uppercase tracking-[0.2em] text-slate-900 text-center italic bg-transparent outline-none hover:bg-slate-50 transition-colors placeholder:text-slate-200"
                            placeholder="MATRIX TITLE"
                        />
                    </div>

                    {/* Matrix Settings & Activation Toggle */}
                    <div className="absolute top-0 right-0 opacity-0 group-hover/matrix:opacity-100 transition-opacity z-[60]">
                        {item.isPredefined ? (
                            <div className="relative">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setOptionsOpen(!isOptionsOpen); }}
                                    className={`p-1.5 bg-white border border-slate-200 rounded-full shadow-sm text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all ${isOptionsOpen ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : ''}`}
                                >
                                    <IoSettingsOutline className="w-3.5 h-3.5" />
                                </button>

                                {isOptionsOpen && (
                                    <div
                                        onMouseEnter={(e) => e.stopPropagation()}
                                        onClick={(e) => e.stopPropagation()}
                                        className="options-popover absolute right-0 top-full mt-1 z-[70] w-48 bg-white border border-slate-200 rounded-xl shadow-2xl p-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200 cursor-default"
                                    >
                                        <div className="flex items-center justify-between px-1 mb-1 border-b border-slate-50 pb-1">
                                            <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Enlist Mode</span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => onChange('isPredefined', false)}
                                                    className="p-1 text-[7px] font-black uppercase text-red-400 hover:bg-red-50 rounded transition-colors"
                                                >OFF</button>
                                                <button onClick={() => setOptionsOpen(false)} className="text-slate-300 hover:text-slate-500 transition-colors"><IoClose className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </div>

                                        <div className="max-h-48 overflow-y-auto overflow-x-hidden px-1 space-y-1 custom-scrollbar">
                                            {(item.resultOptions || []).map((opt, i) => (
                                                <div key={i} className="flex items-center gap-1 group/opt py-0.5">
                                                    <input
                                                        autoFocus={i === (item.resultOptions?.length - 1)}
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const newO = [...item.resultOptions];
                                                            newO[i] = e.target.value;
                                                            onChange('resultOptions', newO);
                                                        }}
                                                        placeholder="Option..."
                                                        className="flex-1 bg-transparent text-slate-700 outline-none text-[10px] font-bold px-1 py-0.5 rounded focus:bg-slate-50 transition-colors"
                                                    />
                                                    <button
                                                        onClick={() => onChange('resultOptions', item.resultOptions.filter((_, idx) => idx !== i))}
                                                        className="text-slate-200 hover:text-red-400 opacity-0 group-hover/opt:opacity-100 transition-all flex-shrink-0"
                                                    >
                                                        <IoTrashOutline className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => onChange('resultOptions', [...(item.resultOptions || []), ""])}
                                            className="w-full py-2 flex items-center justify-center gap-2 text-slate-300 hover:text-emerald-500 transition-all text-[7px] font-black uppercase tracking-[0.2em] border-t border-slate-50 mt-1"
                                        >
                                            <IoAdd className="w-3 h-3" />
                                            <span>Add Tag</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={(e) => { e.stopPropagation(); onChange('isPredefined', true); setOptionsOpen(true); }}
                                className="h-6 flex items-center gap-1 px-3 bg-emerald-50 border border-emerald-100 rounded-full text-[7px] font-black text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all uppercase tracking-widest shadow-sm"
                            >
                                <IoAdd className="w-3 h-3" />
                                <span>Enlist</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="w-full">
                    <div className="flex border-b border-slate-900 pb-2 mb-2 group/h">
                        <div className="w-1/3 font-black text-[10px] uppercase text-slate-900 tracking-widest pl-2">
                            {item.rowLabel || 'TEST'}
                        </div>
                        <div className="flex-1 flex justify-around gap-2">
                            {(item.headers || []).map((h, hi) => (
                                <div key={hi} className="relative group/hitem w-full">
                                    <input
                                        value={h}
                                        onChange={(e) => {
                                            const newH = [...item.headers];
                                            newH[hi] = e.target.value;
                                            onChange('headers', newH);
                                        }}
                                        className="w-full text-center font-black text-[10px] uppercase text-slate-900 bg-transparent outline-none hover:bg-slate-100 rounded py-0.5"
                                        placeholder="Header"
                                    />
                                    <button
                                        onClick={() => onChange('headers', item.headers.filter((_, idx) => idx !== hi))}
                                        className="absolute -top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover/hitem:opacity-100 text-red-400 hover:text-red-500 transition-all"
                                    ><IoClose className="w-3 h-3" /></button>
                                </div>
                            ))}
                            <button
                                onClick={() => onChange('headers', [...(item.headers || []), ""])}
                                className="px-2 text-amber-500 hover:text-amber-600 opacity-0 group-hover/h:opacity-100 transition-all"
                            ><IoAdd className="w-4 h-4" /></button>
                        </div>
                    </div>

                    <div className="space-y-1">
                        {(item.matrixRows || []).map((row, ri) => (
                            <div key={row.id} className="flex border-b border-slate-100 py-1.5 group/mrow relative">
                                <input
                                    value={row.name}
                                    onChange={(e) => {
                                        const newR = [...item.matrixRows];
                                        newR[ri] = { ...newR[ri], name: e.target.value };
                                        onChange('matrixRows', newR);
                                    }}
                                    className="w-1/3 text-[11px] font-bold text-slate-800 bg-transparent outline-none hover:bg-slate-50 rounded pl-2"
                                    placeholder="Row Name"
                                />
                                <div className="flex-1 flex justify-around gap-2">
                                    {(row.values || []).map((v, vi) => (
                                        <div key={vi} className="w-full relative group/mcell">
                                            <input
                                                value={v}
                                                onChange={(e) => {
                                                    const newR = [...item.matrixRows];
                                                    const newV = [...newR[ri].values];
                                                    newV[vi] = e.target.value;
                                                    newR[ri] = { ...newR[ri], values: newV };
                                                    onChange('matrixRows', newR);
                                                }}
                                                className={`w-full text-center text-[11px] font-bold text-slate-600 bg-transparent outline-none hover:bg-slate-50 rounded py-1 transition-all focus:bg-emerald-50/30 ${item.isPredefined ? 'cursor-pointer' : ''}`}
                                                placeholder="-"
                                            />
                                            {item.isPredefined && item.resultOptions?.length > 0 && (
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 hidden group-focus-within/mcell:flex flex-col z-[80] bg-white shadow-2xl border border-slate-200 rounded-lg p-1 min-w-[80px] animate-in fade-in zoom-in-95 duration-100">
                                                    {item.resultOptions.map((opt, oi) => opt && (
                                                        <button
                                                            key={oi}
                                                            onMouseDown={(e) => {
                                                                e.preventDefault(); // Prevent focus loss
                                                                const newR = [...item.matrixRows];
                                                                const newV = [...newR[ri].values];
                                                                newV[vi] = opt;
                                                                newR[ri] = { ...newR[ri], values: newV };
                                                                onChange('matrixRows', newR);
                                                            }}
                                                            className="block w-full text-center px-2 py-1.5 text-[9px] font-black hover:bg-emerald-600 hover:text-white text-slate-600 rounded-md transition-all uppercase tracking-tighter"
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => onChange('matrixRows', item.matrixRows.filter((_, idx) => idx !== ri))}
                                    className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover/mrow:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                                ><IoTrashOutline className="w-3.5 h-3.5" /></button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => {
                            const newRow = { id: Date.now(), name: "", values: (item.headers || []).map(() => "") };
                            onChange('matrixRows', [...(item.matrixRows || []), newRow]);
                        }}
                        className="w-full py-2 mt-2 border-t border-slate-50 text-[8px] font-black uppercase text-slate-300 hover:text-amber-500 transition-all tracking-[0.2em] flex items-center justify-center gap-2 group-hover/matrix:opacity-100 opacity-0"
                    >
                        <IoAdd className="w-4 h-4" />
                        <span>Add Row</span>
                    </button>
                </div>
            </div>
        );
    }

    // Default Test Row
    return (
        <div style={gridStyle} className="report-row items-center border-b border-slate-100 py-2 font-sans px-6 relative cursor-default group/row">
            {config.showTest && (
                <input
                    type="text"
                    value={item.name}
                    onChange={(e) => onChange('name', e.target.value)}
                    placeholder="ENTER TEST NAME..."
                    className="text-[12px] font-black text-slate-800 uppercase tracking-tight bg-transparent outline-none hover:bg-slate-50 focus:bg-slate-50 transition-colors"
                />
            )}

            {config.showUnit && (
                <input
                    type="text"
                    value={item.unit}
                    onChange={(e) => onChange('unit', e.target.value)}
                    placeholder="UNIT"
                    className="text-center text-[11px] font-bold text-slate-600 bg-transparent outline-none hover:bg-slate-50 focus:bg-slate-50 transition-colors font-serif italic"
                />
            )}

            {config.showValue && (
                <div className="flex flex-col items-center justify-center text-[10px] font-bold text-slate-500 relative group/val">
                    {/* Range Mode Switcher (Hover Only) */}
                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover/val:opacity-100 transition-opacity z-[60]">
                        <button
                            onClick={(e) => { e.stopPropagation(); setRangeOpen(!isRangeOpen); }}
                            className="p-1 bg-white border border-slate-200 rounded-full shadow-sm text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                        >
                            <IoSettingsOutline className="w-3 h-3" />
                        </button>

                        {isRangeOpen && (
                            <div className="range-popover absolute left-full ml-2 top-0 bg-white border border-slate-200 rounded-lg shadow-xl p-1 flex flex-col gap-0.5 min-w-[100px] z-[70] animate-in fade-in slide-in-from-left-2 duration-200" onClick={(e) => e.stopPropagation()}>
                                {[
                                    { id: 'single', label: 'Uniform', icon: <IoReaderOutline />, active: !item.isMultiRange && !item.isGenderSpecific },
                                    { id: 'gender', label: 'Gender', icon: <IoList />, active: item.isGenderSpecific },
                                    { id: 'multi', label: 'Multiple', icon: <IoGridOutline />, active: item.isMultiRange }
                                ].map(mode => (
                                    <button
                                        key={mode.id}
                                        onClick={() => {
                                            if (mode.id === 'single') {
                                                onChange('isMultiRange', false);
                                                onChange('isGenderSpecific', false);
                                            } else if (mode.id === 'gender') {
                                                onChange('isMultiRange', false);
                                                onChange('isGenderSpecific', true);
                                            } else {
                                                onChange('isMultiRange', true);
                                                onChange('isGenderSpecific', false);
                                            }
                                            setRangeOpen(false);
                                        }}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-[8px] font-black uppercase tracking-widest transition-all ${mode.active ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        <span className="w-3 h-3">{mode.icon}</span>
                                        <span>{mode.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {item.isMultiRange ? (
                        <div className="w-full space-y-1">
                            {(item.multiRanges || ['']).map((range, idx) => (
                                <div key={idx} className="flex items-center gap-1 group/range">
                                    <input
                                        value={range}
                                        onChange={(e) => {
                                            const newR = [...item.multiRanges];
                                            newR[idx] = e.target.value;
                                            onChange('multiRanges', newR);
                                        }}
                                        placeholder="Label: Value"
                                        className="w-full text-center bg-transparent outline-none hover:bg-slate-100 rounded text-[9px] font-bold py-0.5"
                                    />
                                    {(item.multiRanges || []).length > 1 && (
                                        <button
                                            onClick={() => onChange('multiRanges', item.multiRanges.filter((_, i) => i !== idx))}
                                            className="opacity-0 group-hover/range:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                                        >
                                            <IoClose className="w-2.5 h-2.5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                onClick={() => onChange('multiRanges', [...(item.multiRanges || []), ""])}
                                className="w-full py-0.5 text-[7px] text-indigo-400 hover:text-indigo-600 font-black uppercase tracking-widest opacity-0 group-hover/val:opacity-100 transition-all"
                            >+ Add Line</button>
                        </div>
                    ) : item.isGenderSpecific ? (
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-1">
                                <span className="text-indigo-400 text-[8px] font-black uppercase w-3">M</span>
                                <div className="flex items-center">
                                    <input value={item.maleLow} onChange={(e) => onChange('maleLow', e.target.value)} placeholder="0" className="w-8 text-center bg-transparent outline-none hover:bg-slate-100 rounded" />
                                    <span className="mx-0.5 opacity-30">-</span>
                                    <input value={item.maleHigh} onChange={(e) => onChange('maleHigh', e.target.value)} placeholder="0" className="w-8 text-center bg-transparent outline-none hover:bg-slate-100 rounded" />
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-pink-400 text-[8px] font-black uppercase w-3">F</span>
                                <div className="flex items-center">
                                    <input value={item.femaleLow} onChange={(e) => onChange('femaleLow', e.target.value)} placeholder="0" className="w-8 text-center bg-transparent outline-none hover:bg-slate-100 rounded" />
                                    <span className="mx-0.5 opacity-30">-</span>
                                    <input value={item.femaleHigh} onChange={(e) => onChange('femaleHigh', e.target.value)} placeholder="0" className="w-8 text-center bg-transparent outline-none hover:bg-slate-100 rounded" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center">
                            <input value={item.normalLow} onChange={(e) => onChange('normalLow', e.target.value)} placeholder="0" className="w-10 text-center bg-transparent outline-none hover:bg-slate-100 rounded" />
                            <span className="mx-1 opacity-40">-</span>
                            <input value={item.normalHigh} onChange={(e) => onChange('normalHigh', e.target.value)} placeholder="0" className="w-10 text-center bg-transparent outline-none hover:bg-slate-100 rounded" />
                        </div>
                    )}
                </div>
            )}

            {config.showResult && (
                <div className="flex justify-end pr-2 min-w-[120px] relative transition-all group/res">
                    {item.isPredefined ? (
                        <div className="relative">
                            <button
                                onClick={(e) => { e.stopPropagation(); setOptionsOpen(!isOptionsOpen); }}
                                className={`w-24 h-7 flex items-center justify-center rounded-md text-[8px] font-black uppercase tracking-widest transition-all border border-dashed ${isOptionsOpen ? 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-500'}`}
                            >
                                <span>{item.resultOptions?.length || 0} OPTIONS</span>
                            </button>

                            {isOptionsOpen && (
                                <div
                                    onMouseEnter={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                    className="options-popover absolute right-0 top-full mt-1 z-[70] w-44 bg-white border border-slate-200 rounded-xl shadow-2xl p-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200 cursor-default"
                                >
                                    <div className="flex items-center justify-between px-1 mb-1">
                                        <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Selectable Results</span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => onChange('isPredefined', false)}
                                                className="p-1 text-[7px] font-black text-red-400 hover:bg-red-50 rounded uppercase transition-colors"
                                                title="Disable Dropdown"
                                            >OFF</button>
                                            <button onClick={() => setOptionsOpen(false)} className="text-slate-300 hover:text-slate-500 transition-colors"><IoClose className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto overflow-x-hidden px-1 space-y-1 custom-scrollbar">
                                        {(item.resultOptions || []).map((opt, i) => (
                                            <div key={i} className="flex items-center gap-1 group/opt py-0.5">
                                                <input
                                                    autoFocus
                                                    value={opt}
                                                    onChange={(e) => {
                                                        const newO = [...item.resultOptions];
                                                        newO[i] = e.target.value;
                                                        onChange('resultOptions', newO);
                                                    }}
                                                    onMouseMove={(e) => e.stopPropagation()}
                                                    placeholder="Option..."
                                                    className="flex-1 bg-transparent text-slate-700 outline-none text-[10px] font-bold px-1 py-0.5 rounded focus:ring-0 focus:outline-none focus:bg-transparent hover:bg-transparent"
                                                />
                                                <button
                                                    onClick={() => onChange('resultOptions', item.resultOptions.filter((_, idx) => idx !== i))}
                                                    className="text-slate-200 hover:text-red-400 opacity-0 group-hover/opt:opacity-100 transition-all flex-shrink-0"
                                                >
                                                    <IoTrashOutline className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => onChange('resultOptions', [...(item.resultOptions || []), ""])}
                                        className="w-full py-2 flex items-center justify-center gap-2 text-slate-300 hover:text-emerald-500 transition-all text-[7px] font-black uppercase tracking-[0.2em] border-t border-slate-50 mt-1"
                                    >
                                        <IoAdd className="w-3 h-3" />
                                        <span>Add Tag</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="relative group/enlist">
                            <button
                                onClick={() => onChange('isPredefined', true)}
                                className="w-16 h-6 bg-slate-50 border border-dashed border-slate-200 rounded-md flex items-center justify-center text-[7px] font-black text-slate-300 hover:border-emerald-300 hover:text-emerald-500 transition-all uppercase tracking-widest opacity-0 group-hover/row:opacity-100"
                            >
                                + Enlist
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}



