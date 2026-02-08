import React, { useState, useEffect } from 'react';
import { IoClose } from 'react-icons/io5';
import TestTemplateForm from './components/TestTemplateForm';
import ReportWorkspace from './components/ReportWorkspace';
import ReportHistory from './components/ReportHistory';

function App() {
    // ... existing states ...
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
            {/* FULLSCREEN LAYER FOR TEMPLATE DESIGNER */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[200] no-print bg-slate-950 overflow-y-auto custom-scrollbar">
                    <TestTemplateForm
                        initialTemplate={editingTemplate}
                        onTemplateCreated={handleTemplateSaved}
                    />

                    {/* CLOSE BUTTON OVERLAY - Styled for the dark designer */}
                    <button
                        onClick={() => setIsFormOpen(false)}
                        className="fixed top-8 right-10 p-4 bg-slate-800/80 backdrop-blur-md text-slate-400 hover:text-white hover:bg-rose-600 rounded-2xl transition-all z-[210] shadow-2xl border border-slate-700/50 group active:scale-95"
                    >
                        <IoClose className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>
            )}

            {/* GLOBAL STYLES FOR ANIMATIONS & SWEETALERT OVERRIDES */}
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes zoom-in-95 { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @keyframes slide-in-from-bottom-10 { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .animate-in { animation-fill-mode: forwards; }
                .fade-in { animation-name: fade-in; }
                .zoom-in-95 { animation-name: zoom-in-95; }
                .slide-in-from-bottom-10 { animation-name: slide-in-from-bottom-10; }

                /* SweetAlert2 Small Styles */
                .swal2-popup {
                    padding: 1rem !important;
                    width: 24rem !important;
                    border-radius: 1.5rem !important;
                    font-family: inherit !important;
                }
                .swal2-title {
                    font-size: 1rem !important;
                    font-weight: 900 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                }
                .swal2-html-container {
                    font-size: 0.75rem !important;
                    font-weight: 500 !important;
                    margin: 0.5rem 0 0 !important;
                }
                .swal2-actions {
                    margin-top: 1rem !important;
                }
                .swal2-confirm, .swal2-cancel {
                    font-size: 0.7rem !important;
                    font-weight: 900 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.1em !important;
                    padding: 0.6rem 1.5rem !important;
                    border-radius: 0.75rem !important;
                }
                .swal2-icon {
                    transform: scale(0.7) !important;
                    margin-bottom: 0 !important;
                }
            `}</style>
        </div>
    );
}

export default App;
