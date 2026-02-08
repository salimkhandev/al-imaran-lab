import React from 'react';

export default function GridTestSection({ section, tests, isHistoryMode, onResultChange }) {
    const labels = section.gridLabels || [];

    return (
        <div className="mt-6 mb-8 page-break-inside-avoid">
            {/* Grid Header */}
            <div className="flex justify-center mb-6">
                <div className="inline-block border-b-2 border-slate-900 pb-1 px-4">
                    <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-900 text-center">
                        {section.text || "Investigation"}
                    </h3>
                </div>
            </div>

            <div className="flex border-b-2 border-slate-900 pb-2 mb-2">
                <div className="w-1/3 font-black text-[10px] uppercase text-slate-500 tracking-widest pl-2">
                    &nbsp;
                </div>
                <div className="flex-1 flex justify-around">
                    {labels.map((label, idx) => (
                        <div key={idx} className="text-center font-black text-[10px] uppercase text-slate-900 w-full px-1">
                            {label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Grid Rows */}
            {tests.map((test, tIdx) => (
                <div key={tIdx} className="flex border-b border-slate-100 py-2 items-center hover:bg-slate-50 transition-colors group">
                    <div className="w-1/3 font-bold text-[10px] text-slate-800 uppercase tracking-tight pl-2">
                        {test.name}
                    </div>
                    <div className="flex-1 flex justify-around">
                        {labels.map((_, lIdx) => (
                            <div key={lIdx} className="w-full px-2">
                                <input
                                    type="text"
                                    value={test.gridResults?.[lIdx] || ""}
                                    readOnly={isHistoryMode}
                                    onChange={(e) => onResultChange(tIdx, lIdx, e.target.value)}
                                    className="w-full text-center border-b border-slate-200 font-black bg-transparent transition-all text-[11px] outline-none hover:border-slate-900 focus:border-blue-500 h-7"
                                    placeholder="---"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
