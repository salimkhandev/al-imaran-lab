import React, { useState, useEffect } from 'react';

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
        if (!confirm("Delete template?")) return;
        try {
            await window.electronAPI.deleteTestTemplate(id);
            loadTemplates();
        } catch (err) {
            console.error(err);
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
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
                                <button onClick={(e) => { e.stopPropagation(); alert('System Print Active: Connection Pending...'); }} className="bg-white p-3 rounded-lg text-slate-400 hover:text-black shadow-lg border border-slate-200 hover:scale-110 transition-all font-black" title="Print Report">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onEdit(template); }} className="bg-white p-3 rounded-lg text-slate-400 hover:text-black shadow-lg border border-slate-200 hover:scale-110 transition-all font-black" title="Modify Template">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                <button onClick={(e) => handleDelete(e, template.id)} className="bg-white p-3 rounded-lg text-slate-400 hover:text-black shadow-lg border border-slate-200 hover:scale-110 transition-all font-black" title="Archive / Delete">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
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
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-sm">Vault Empty</p>
                        <p className="text-slate-300 text-xs mt-1">No templates have been archived yet.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
