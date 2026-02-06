import React, { useState, useEffect } from 'react';
import TestTemplateForm from './components/TestTemplateForm';
import ReportWorkspace from './components/ReportWorkspace';
import ReportHistory from './components/ReportHistory';

function App() {
    // UI Layout States
    const [activeTemplate, setActiveTemplate] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [currentView, setCurrentView] = useState('composer'); // 'composer' or 'history'

    // Global Refresh Trigger
    const triggerRefresh = () => setRefreshKey(prev => prev + 1);

    const handleOpenCreate = () => {
        setEditingTemplate(null);
        setIsFormOpen(true);
    };

    const handleOpenEditOrHistory = (template) => {
        if (template && template.isHistory) {
            setCurrentView('history');
        } else {
            setEditingTemplate(template);
            setIsFormOpen(true);
        }
    };

    const handleSelectReport = (reportId) => {
        setActiveTemplate({ id: reportId, isHistory: true });
        setCurrentView('composer');
    };

    const handleTemplateSaved = () => {
        setIsFormOpen(false);
        triggerRefresh();
    };

    if (currentView === 'history') {
        return (
            <ReportHistory
                onSelectReport={handleSelectReport}
                onBack={() => setCurrentView('composer')}
            />
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 overflow-hidden relative">
            {/* MAIN APP CONTAINER */}
            <ReportWorkspace
                key={refreshKey}
                initialSelect={activeTemplate}
                onEdit={handleOpenEditOrHistory}
                onAdd={handleOpenCreate}
            />

            {/* MODAL OVERLAY FOR TEMPLATE CREATION/EDITING */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 no-print">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300"
                        onClick={() => setIsFormOpen(false)}
                    ></div>

                    <div className="relative w-full max-w-7xl max-h-[95vh] overflow-y-auto bg-white rounded-[2rem] shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-5 duration-500 custom-scrollbar">
                        {/* MODAL CLOSE BUTTON */}
                        <button
                            onClick={() => setIsFormOpen(false)}
                            className="absolute top-6 right-6 p-3 bg-slate-100 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-all z-50 shadow-sm"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>

                        <div className="p-8 transform scale-90 origin-top">
                            <TestTemplateForm
                                initialTemplate={editingTemplate}
                                onTemplateCreated={handleTemplateSaved}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* GLOBAL STYLES FOR ANIMATIONS */}
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes zoom-in-95 { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @keyframes slide-in-from-bottom-10 { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .animate-in { animation-fill-mode: forwards; }
                .fade-in { animation-name: fade-in; }
                .zoom-in-95 { animation-name: zoom-in-95; }
                .slide-in-from-bottom-10 { animation-name: slide-in-from-bottom-10; }
            `}</style>
        </div>
    );
}

export default App;
