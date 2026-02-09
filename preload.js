const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    getUsers: () => ipcRenderer.invoke('get-users'),
    addUser: (user) => ipcRenderer.invoke('add-user', user),
    getTestTemplates: () => ipcRenderer.invoke('get-test-templates'),
    addTestTemplate: (template) => ipcRenderer.invoke('add-test-template', template),
    updateTestTemplate: (template) => ipcRenderer.invoke('update-test-template', template),
    deleteTestTemplate: (id) => ipcRenderer.invoke('delete-test-template', id),
    // Report APIs
    getReports: () => ipcRenderer.invoke('get-reports'),
    getReportById: (id) => ipcRenderer.invoke('get-report-by-id', id),
    saveReport: (report) => ipcRenderer.invoke('save-report', report),
    updateReport: (report) => ipcRenderer.invoke('update-report', report),
    deleteReport: (id) => ipcRenderer.invoke('delete-report', id),
    // Database Management
    exportDb: () => ipcRenderer.invoke('export-db'),
    importDb: () => ipcRenderer.invoke('import-db'),

    // Next ID
    getNextPatientId: () => ipcRenderer.invoke('get-next-patient-id'),
    // Delete All
    deleteAllReports: () => ipcRenderer.invoke('delete-all-reports'),
    deleteAllTestTemplates: () => ipcRenderer.invoke('delete-all-test-templates'),
    // Printing
    printWindow: () => ipcRenderer.invoke('print-window'),

    // Auto Update
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    startDownload: () => ipcRenderer.invoke('start-download'),
    installUpdate: () => ipcRenderer.invoke('install-update'),
    onUpdateMessage: (callback) => ipcRenderer.on('update-message', (event, msg) => callback(msg)),
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (event, info) => callback(info)),
    onUpdateError: (callback) => ipcRenderer.on('update-error', (event, err) => callback(err)),
    onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, progress) => callback(progress)),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (event, info) => callback(info)),
});

