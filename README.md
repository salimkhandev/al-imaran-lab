# Al-Imran Lab LIMS

A modern, high-performance **Laboratory Information Management System (LIMS)** designed specifically for Medical Stores, Dental Clinics, and Diagnostic Laboratories. This application provides a seamless workflow for managing patient tests, designing custom templates, and generating professional reports.

## 🚀 Use Case
**Al-Imran Lab LIMS** is built to digitize laboratory operations. It allows lab technicians and doctors to:
- Create and manage complex test templates.
- Record patient data and test results securely.
- Generate and print formatted medical reports.
- Track report history for quick retrieval.
- Receive seamless background updates via GitHub.

## 💻 Tech Stack
The application is built using a modern desktop development stack:

- **Framework**: [Electron](https://www.electronjs.org/) (Desktop Native Experience)
- **Frontend**: [React.js](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [SQLite](https://www.sqlite.org/) (via `better-sqlite3`)
- **State Management & UI**: React Hooks, [React Icons](https://react-icons.github.io/react-icons/), and [SweetAlert2](https://sweetalert2.github.io/)
- **Build Tooling**: [electron-builder](https://www.electron.build/)
- **Updates**: [electron-updater](https://www.npmjs.com/package/electron-updater)

## 🖥️ Target Device
- **Operating System**: Windows (Primary support)
- **Architecture**: x64 / x86
- **Format**: Installable `.exe` (via NSIS installer)

## 🛠️ Development & Build

### Prerequisites
- [Node.js](https://nodejs.org/) (Latest LTS)
- [pnpm](https://pnpm.io/) (Highly Recommended)

### Installation
```bash
pnpm install
```

### Running in Development
```bash
pnpm start
```

### Building for Production
```bash
pnpm dist
```

## 📦 Features
- **Dynamic Template Designer**: Flexible UI to create various laboratory test formats.
- **Local Persistence**: All data is stored locally in a high-speed SQLite database.
- **One-Click Printing**: Optimized print layouts for report generation.
- **Auto-Update**: Integrated with GitHub Releases for hassle-free updates.

---
Developed by **Salim Khan Dev** for **Al-Imran Lab**.
