import React, { useState, useEffect } from 'react';
import { IoArchive, IoPrint, IoCreate, IoTrash, IoBook } from 'react-icons/io5';
import Swal from 'sweetalert2';

export default function TestTemplateList({ refreshKey, onSelect, onEdit }) {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTemplates();
    }, [refreshKey]);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const data = await window.electronAPI.getTestTemplates();
            setTemplates(data || []);
        } catch (err) {
            console.error("Failed to load templates:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        const result = await Swal.fire({
            title: 'Delete Template?',
            text: "This will remove this test structure from the vault.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, Delete'
        });

        if (!result.isConfirmed) return;

        try {
            await window.electronAPI.deleteTestTemplate(id);
            loadTemplates();
            Swal.fire({
                title: 'Deleted!',
                text: 'Template removed from vault.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Failed to delete template', 'error');
        }
    };

    // Helper to calculate grid template based on visibility - matches Form
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

    if (loading) return <div className="text-center py-10 text-slate-400">Loading templates...</div>;

    return (
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-slate-900"></div>

            <div className="flex items-center justify-between mb-12 border-b border-slate-50 pb-6">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-200">
                        <IoArchive className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Archive Vault</h2>
                        <p className="text-slate-500 text-[10px] font-medium uppercase tracking-wider">Review diagnostic template structures.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mr-2">Status: Online</span>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
            </div>

            <div className="space-y-16">
                {templates.length > 0 ? templates.map(template => {
                    let items = [];
                    let mainConfig = {
                        testLabel: "Test",
                        unitLabel: "Unite",
                        valueLabel: "N,Value",
                        resultLabel: "Result.",
                        showTest: true,
                        showUnit: true,
                        showValue: true,
                        showResult: true
                    };

                    try {
                        const parsed = JSON.parse(template.items);
                        if (Array.isArray(parsed)) {
                            items = parsed;
                        } else if (parsed && typeof parsed === 'object') {
                            items = parsed.rows || [];
                            if (parsed.meta) {
                                mainConfig = { ...mainConfig, ...parsed.meta };
                            }
                        }
                    } catch (e) {
                        console.error("Error parsing items for template", template.id, e);
                    }

                    let currentConfig = {
                        showTest: mainConfig.showTest,
                        showUnit: mainConfig.showUnit,
                        showValue: mainConfig.showValue,
                        showResult: mainConfig.showResult
                    };

                    const mainGridStyle = getGridStyle(currentConfig);

                    return (
                        <div
                            key={template.id}
                            onClick={() => onSelect && onSelect(template)}
                            className="bg-white border border-slate-100 rounded-[1.5rem] p-8 hover:border-slate-900 hover:shadow-xl transition-all cursor-pointer relative group/card"
                            style={{ maxWidth: '850px', margin: '0 auto', width: '100%' }}
                        >
                            {/* TOOLS FLOATER */}
                            <div className="absolute -top-4 right-8 flex gap-2 opacity-0 group-hover/card:opacity-100 transition-all translate-y-2 group-hover/card:translate-y-0 z-30">
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    Swal.fire({
                                        title: 'System Dispatch',
                                        text: 'System Print Active: Connection Pending...',
                                        icon: 'info',
                                        confirmButtonColor: '#0f172a'
                                    });
                                }} className="bg-white p-3 rounded-lg text-slate-400 hover:text-black shadow-lg border border-slate-200 hover:scale-110 transition-all font-black" title="Print Report">
                                    <IoPrint className="h-5 w-5" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onEdit(template); }} className="bg-white p-3 rounded-lg text-slate-400 hover:text-black shadow-lg border border-slate-200 hover:scale-110 transition-all font-black" title="Modify Template">
                                    <IoCreate className="h-5 w-5" />
                                </button>
                                <button onClick={(e) => handleDelete(e, template.id)} className="bg-white p-3 rounded-lg text-slate-400 hover:text-black shadow-lg border border-slate-200 hover:scale-110 transition-all font-black" title="Archive / Delete">
                                    <IoTrash className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-black uppercase tracking-[0.1em] text-slate-900 mb-1">{template.name}</h3>
                                {mainConfig.subtitle && (
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] bg-slate-50 inline-block px-4 py-1 rounded-lg border border-slate-100">{mainConfig.subtitle}</p>
                                )}
                                <div className="h-1 w-16 bg-slate-900 mx-auto rounded-full mt-3"></div>
                            </div>

                            {/* MAIN HEADER ROW */}
                            <div style={mainGridStyle} className="bg-slate-50 rounded-2xl py-5 px-8 mb-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 border border-slate-100">
                                {mainConfig.showTest && <div>{mainConfig.testLabel}</div>}
                                {mainConfig.showUnit && <div className="text-center">{mainConfig.unitLabel}</div>}
                                {mainConfig.showValue && <div className="text-center">{mainConfig.valueLabel}</div>}
                                {mainConfig.showResult && <div className="text-right">{mainConfig.resultLabel}</div>}
                            </div>

                            <div className="space-y-1">
                                {items.map((item, idx) => {
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
                                        <div key={idx}>
                                            {item.type === 'subheading' ? (
                                                <div className="mt-12 mb-6">
                                                    <div className="flex flex-col gap-1 border-l-4 border-slate-900 pl-6 py-1">
                                                        <div className="text-lg font-black uppercase tracking-wider text-slate-900">
                                                            {item.text || 'UNTITLED SECTION'}
                                                        </div>
                                                        {item.subtext && (
                                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                {item.subtext}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Dynamic Header Row */}
                                                    <div style={gridStyle} className="bg-slate-50/50 rounded-xl py-3 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 mt-4 border border-slate-100/50">
                                                        {rowConfig.showTest && <div>{item.testLabel || 'TEST'}</div>}
                                                        {rowConfig.showUnit && <div className="text-center">{item.unitLabel || 'UNIT'}</div>}
                                                        {rowConfig.showValue && <div className="text-center">{item.valueLabel || 'REF. RANGE'}</div>}
                                                        {rowConfig.showResult && <div className="text-right">{item.resultLabel || 'RESULT'}</div>}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={gridStyle} className="items-center text-[13px] py-4 px-6 border-b border-slate-50 hover:bg-slate-50/30 transition-colors rounded-xl">
                                                    {rowConfig.showTest && (
                                                        <div className="font-bold text-slate-800">{item.name || '---'}</div>
                                                    )}
                                                    {rowConfig.showUnit && (
                                                        <div className="text-center font-serif text-slate-500 italic">{item.unit || '-'}</div>
                                                    )}
                                                    {rowConfig.showValue && (
                                                        <div className="text-center flex flex-col items-center font-serif w-full">
                                                            {item.isMultiRange ? (
                                                                <div className="flex flex-col gap-1 w-full max-w-[140px]">
                                                                    {(item.multiRanges || [""]).map((range, rIdx) => (
                                                                        <div key={rIdx} className="py-0.5 bg-white px-3 rounded-full border border-slate-100 text-[9px] font-bold text-slate-700 truncate text-center">
                                                                            {range || '---'}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : !item.isGenderSpecific ? (
                                                                item.isSingleValue ? (
                                                                    <div className="flex items-center justify-center py-1 bg-white px-6 rounded-full border border-slate-100 text-xs font-bold text-slate-700">
                                                                        {item.normalLow || '---'}
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center justify-center gap-3 py-1 bg-white px-4 rounded-full border border-slate-100 text-xs">
                                                                        <span className="font-bold text-slate-700">{item.normalLow || '0'}</span>
                                                                        <span className="text-slate-200">/</span>
                                                                        <span className="font-bold text-slate-700">{item.normalHigh || '0'}</span>
                                                                    </div>
                                                                )
                                                            ) : (
                                                                <div className="w-full flex flex-col gap-1.5 items-center max-w-[140px]">
                                                                    <div className="h-6 w-full flex justify-between items-center px-3 bg-slate-50 rounded border border-slate-100">
                                                                        <span className="font-black text-[8px] text-slate-400">M</span>
                                                                        <span className="font-bold text-[10px] text-slate-900">{item.maleLow || '0'} - {item.maleHigh || '0'}</span>
                                                                    </div>
                                                                    <div className="h-6 w-full flex justify-between items-center px-3 bg-slate-50 rounded border border-slate-100">
                                                                        <span className="font-black text-[8px] text-slate-400">F</span>
                                                                        <span className="font-bold text-[10px] text-slate-900">{item.femaleLow || '0'} - {item.femaleHigh || '0'}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {rowConfig.showResult && (
                                                        <div className="w-full">
                                                            {!item.isGenderSpecific ? (
                                                                <div className="w-full h-8 bg-slate-50 rounded-xl border border-slate-100 border-dashed"></div>
                                                            ) : (
                                                                <div className="flex flex-col gap-1.5 w-full">
                                                                    <div className="w-full h-6 bg-slate-50 rounded-lg border border-slate-100 border-dashed"></div>
                                                                    <div className="w-full h-6 bg-slate-50 rounded-lg border border-slate-100 border-dashed"></div>
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
                        </div>
                    );
                }) : (
                    <div className="text-center py-32 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
                        <div className="w-20 h-20 bg-white rounded-full shadow-xl flex items-center justify-center mx-auto mb-6">
                            <IoBook className="h-10 w-10 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-sm">Vault Empty</p>
                        <p className="text-slate-300 text-xs mt-1">No templates have been archived yet.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
