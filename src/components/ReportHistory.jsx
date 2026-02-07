import React, { useState, useEffect } from 'react';
import { IoArrowBack, IoSearch, IoDocumentTextOutline, IoCalendar, IoWarning, IoTrash, IoArrowForward } from 'react-icons/io5';
import Swal from 'sweetalert2';

export default function ReportHistory({ onSelectReport, onBack }) {
    const [reports, setReports] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [groupBy, setGroupBy] = useState('date'); // 'date' or 'patient'

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
        const result = await Swal.fire({
            title: 'Delete Report?',
            text: "Are you sure you want to permanently delete this report?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, Delete'
        });

        if (!result.isConfirmed) return;

        try {
            await window.electronAPI.deleteReport(id);
            loadReports();
            Swal.fire({
                title: 'Deleted!',
                text: 'Report has been removed.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Failed to delete report', 'error');
        }
    };

    // Extract test summary from report data
    const getTestSummary = (report) => {
        try {
            if (!report || !report.report_data) return { patientInfo: {}, modules: [] };

            const data = typeof report.report_data === 'string'
                ? JSON.parse(report.report_data)
                : report.report_data;

            const lines = data.activeReportLines || [];
            const patientInfo = data.patientInfo || {};

            // Group by test module (batchId)
            const testModules = {};
            lines.forEach(line => {
                if (line.type === 'header_main') {
                    testModules[line.batchId] = {
                        name: line.text,
                        subtitle: line.subtitle,
                        tests: []
                    };
                } else if (line.batchId && testModules[line.batchId] && line.name) {
                    const result = parseFloat(line.result);
                    let isAbnormal = false;

                    // Check if result is abnormal
                    if (!isNaN(result)) {
                        if (line.isGenderSpecific) {
                            const gender = (patientInfo.gender || "").toLowerCase();
                            const isMale = gender.includes('m');
                            const low = parseFloat(isMale ? line.maleLow : line.femaleLow);
                            const high = parseFloat(isMale ? line.maleHigh : line.femaleHigh);
                            isAbnormal = (!isNaN(low) && result < low) || (!isNaN(high) && result > high);
                        } else if (!line.isSingleValue && !line.isMultiRange) {
                            const low = parseFloat(line.normalLow);
                            const high = parseFloat(line.normalHigh);
                            isAbnormal = (!isNaN(low) && result < low) || (!isNaN(high) && result > high);
                        }
                    }

                    testModules[line.batchId].tests.push({
                        name: line.name,
                        result: line.result,
                        unit: line.unit,
                        isAbnormal
                    });
                }
            });

            return {
                patientInfo,
                modules: Object.values(testModules).filter(m => m.tests.length > 0)
            };
        } catch (e) {
            console.error("Summary parse error:", e);
            return { patientInfo: {}, modules: [] };
        }
    };

    const getAbnormalCount = (report) => {
        const summary = getTestSummary(report);
        let count = 0;
        summary.modules.forEach(module => {
            module.tests.forEach(test => {
                if (test.isAbnormal) count++;
            });
        });
        return count;
    };

    const filteredReports = reports.filter(r =>
        (r.patient_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.patient_id || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group reports by date
    const groupedByDate = filteredReports.reduce((groups, report) => {
        const summary = getTestSummary(report);
        const date = summary.patientInfo.date || new Date(report.created_at).toLocaleDateString();
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(report);
        return groups;
    }, {});

    // Sort dates (newest first)
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
        return new Date(b) - new Date(a);
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            <div className="max-w-7xl mx-auto">
                {/* HEADER */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-xl shadow-sm transition-all hover:shadow-md"
                        >
                            <IoArrowBack className="w-5 h-5" />
                        </button>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Patient History</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {filteredReports.length} {filteredReports.length === 1 ? 'Report' : 'Reports'} • Chronological View
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative w-80">
                            <input
                                type="text"
                                placeholder="SEARCH BY NAME OR ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[10px] font-black uppercase tracking-widest focus:border-slate-900 outline-none transition-all pr-12 shadow-sm"
                            />
                            <IoSearch className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        </div>
                    </div>
                </div>

                {/* CONTENT */}
                {loading ? (
                    <div className="text-center py-32">
                        <div className="inline-flex items-center gap-3 bg-white px-8 py-4 rounded-2xl shadow-lg border border-slate-200">
                            <div className="w-5 h-5 border-3 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
                            <span className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Reports...</span>
                        </div>
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl py-32 text-center shadow-sm">
                        <div className="w-20 h-20 bg-slate-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                            <IoDocumentTextOutline className="w-10 h-10 text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No records found matching your search</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {sortedDates.map(date => (
                            <div key={date} className="space-y-4">
                                {/* DATE HEADER */}
                                <div className="flex items-center gap-4">
                                    <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white px-6 py-2 rounded-xl shadow-lg">
                                        <div className="flex items-center gap-3">
                                            <IoCalendar className="w-4 h-4" />
                                            <span className="text-sm font-black uppercase tracking-wider">{date}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 h-px bg-gradient-to-r from-slate-300 to-transparent"></div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        {groupedByDate[date].length} {groupedByDate[date].length === 1 ? 'Report' : 'Reports'}
                                    </span>
                                </div>

                                {/* REPORTS FOR THIS DATE */}
                                <div className="grid grid-cols-1 gap-4">
                                    {groupedByDate[date].map(report => {
                                        const summary = getTestSummary(report);
                                        const abnormalCount = getAbnormalCount(report);

                                        return (
                                            <div
                                                key={report.id}
                                                onClick={() => onSelectReport(report.id)}
                                                className="group bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg hover:border-indigo-500 transition-all cursor-pointer"
                                            >
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 flex-1 overflow-hidden">
                                                        <h3 className="text-sm font-black text-slate-900 uppercase truncate">
                                                            {report.patient_name || "Unknown Patient"}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tight whitespace-nowrap">
                                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded">ID: {report.patient_id || "N/A"}</span>
                                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                            <span>AGE: {summary.patientInfo.age || "N/A"}</span>
                                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                            <span>{summary.patientInfo.gender || "N/A"}</span>
                                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                            <span className="text-slate-900">{summary.patientInfo.time || "N/A"}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => handleDelete(e, report.id)}
                                                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                        >
                                                            <IoTrash className="w-4 h-4" />
                                                        </button>
                                                        <div className="p-2 text-slate-300 group-hover:text-indigo-600 transition-colors">
                                                            <IoArrowForward className="w-4 h-4" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
