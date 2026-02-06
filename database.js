const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const fs = require('fs');

const userDataPath = app.getPath('userData');
const dbFilePath = path.join(userDataPath, 'database.db');

// Ensure the userData directory exists
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}

// Copy database template if it doesn't exist in userData
if (!fs.existsSync(dbFilePath)) {
  let sourcePath = path.join(__dirname, 'database.db');

  if (app.isPackaged) {
    const prodPath = path.join(process.resourcesPath, 'database.db');
    if (fs.existsSync(prodPath)) sourcePath = prodPath;
  }

  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, dbFilePath);
  }
}

const db = new Database(dbFilePath);

// Initialize table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT
  );

  CREATE TABLE IF NOT EXISTS test_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    items TEXT NOT NULL, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_name TEXT,
    patient_id TEXT,
    report_data TEXT NOT NULL, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;


