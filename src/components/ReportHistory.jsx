import React, { useState, useEffect } from 'react';

export default function ReportHistory({ onSelectReport, onBack }) {
    const [reports, setReports] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        setLoading(true);
        try {
            const data = await window.electronAPI.getReports();
            setReports(data || []);
        } catch (err) {
            console.error("Failed to load reports", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to permanentely delete this report?")) return;
        try {
            await window.electronAPI.deleteReport(id);
            loadReports();
        } catch (err) {
            console.error(err);
        }
    };

    const filteredReports = reports.filter(r =>
        (r.patient_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.patient_id || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-100 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-xl shadow-sm transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Archive Vault</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Historical Patient Diagnostics</p>
                        </div>
                    </div>

                    <div className="relative w-80">
                        <input
                            type="text"
                            placeholder="SEARCH BY NAME OR ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[10px] font-black uppercase tracking-widest focus:border-slate-900 outline-none transition-all pr-12"
                        />
                        <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-32 text-slate-400 font-black uppercase tracking-widest text-xs">Accessing Archives...</div>
                ) : filteredReports.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] py-32 text-center">
                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No records found matching your search</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredReports.map(report => (
                            <div
                                key={report.id}
                                onClick={() => onSelectReport(report.id)}
                                className="group relative bg-white border border-slate-100 rounded-[2rem] p-6 hover:shadow-2xl hover:border-slate-900 transition-all cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">#{report.id}</span>
                                    <button
                                        onClick={(e) => handleDelete(e, report.id)}
                                        className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                                <h3 className="text-lg font-black text-slate-900 uppercase truncate mb-1">{report.patient_name || "Unknown Patient"}</h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-6">ID: {report.patient_id || "N/A"}</p>

                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        {new Date(report.created_at).toLocaleDateString()}
                                    </span>
                                    <div className="flex items-center gap-2 text-indigo-600 group-hover:translate-x-1 transition-transform">
                                        <span className="text-[9px] font-black uppercase tracking-widest">View Details</span>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
