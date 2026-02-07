const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./database');

function createWindow() {
    const win = new BrowserWindow({
        icon: path.join(__dirname, 'src/assets/app-logo.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    win.maximize();

    // Load the app
    if (app.isPackaged) {
        // In production, load the static index.html file from the dist folder
        win.loadFile(path.join(__dirname, 'dist/index.html'));
    } else {
        // In development, load from the Vite dev server
        win.loadURL('http://localhost:3000').catch(() => {
            console.log('Dev server not available, loading from local file...');
            win.loadFile('index.html');
        });
        // Open the DevTools automatically in development
        win.webContents.openDevTools();
    }
}


app.whenReady().then(() => {
    createWindow();

    // IPC handlers for SQLite
    ipcMain.handle('get-users', () => {
        return db.prepare('SELECT * FROM users').all();
    });

    ipcMain.handle('add-user', (event, user) => {
        const stmt = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
        return stmt.run(user.name, user.email);
    });

    ipcMain.handle('get-test-templates', () => {
        return db.prepare('SELECT * FROM test_templates ORDER BY created_at DESC').all();
    });

    ipcMain.handle('add-test-template', (event, template) => {
        const stmt = db.prepare('INSERT INTO test_templates (name, items) VALUES (?, ?)');
        return stmt.run(template.name, JSON.stringify(template.items));
    });

    ipcMain.handle('update-test-template', (event, template) => {
        const stmt = db.prepare('UPDATE test_templates SET name = ?, items = ? WHERE id = ?');
        return stmt.run(template.name, JSON.stringify(template.items), template.id);
    });

    ipcMain.handle('delete-test-template', (event, id) => {
        const stmt = db.prepare('DELETE FROM test_templates WHERE id = ?');
        return stmt.run(id);
    });

    // IPC handlers for Reports
    ipcMain.handle('get-reports', () => {
        try {
            return db.prepare('SELECT id, patient_name, patient_id, created_at FROM reports ORDER BY created_at DESC').all();
        } catch (err) {
            console.error('Error fetching reports:', err);
            throw err;
        }
    });

    ipcMain.handle('get-report-by-id', (event, id) => {
        try {
            console.log('Fetching report by ID:', id);
            if (id === undefined) {
                console.error('ID is undefined!');
            }
            return db.prepare('SELECT * FROM reports WHERE id = ?').get(id);
        } catch (err) {
            console.error('Error fetching report by ID:', err);
            throw err;
        }
    });

    ipcMain.handle('save-report', (event, report) => {
        try {
            console.log('Saving report:', report.patient_name);
            const stmt = db.prepare('INSERT INTO reports (patient_name, patient_id, report_data) VALUES (?, ?, ?)');
            const result = stmt.run(report.patient_name, report.patient_id, JSON.stringify(report.report_data));
            console.log('Report saved successfully:', result);
            return result;
        } catch (err) {
            console.error('Error saving report:', err);
            throw err;
        }
    });

    ipcMain.handle('delete-report', (event, id) => {
        try {
            const stmt = db.prepare('DELETE FROM reports WHERE id = ?');
            return stmt.run(id);
        } catch (err) {
            console.error('Error deleting report:', err);
            throw err;
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
