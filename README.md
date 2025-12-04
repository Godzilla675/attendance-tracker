# AttendX - Attendance Tracker

A modern attendance tracking web application for teachers who teach at multiple centers/locations. Built with React, TypeScript, and Vite.

![AttendX](https://img.shields.io/badge/AttendX-v1.0.0-6366f1?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript)
![Capacitor](https://img.shields.io/badge/Capacitor-7.4-119EFF?style=for-the-badge&logo=capacitor)

## ✨ Features

- 📍 **Multi-Center Support** - Manage multiple teaching locations with color-coded identification
- 👨‍🎓 **Student Management** - Track students per center with contact info and notes
- ✅ **Quick Attendance** - One-tap attendance marking (present/absent/late/excused)
- 📊 **Statistics Dashboard** - Real-time stats with visual progress bars
- 📈 **Reports** - View attendance reports with date filtering and CSV export
- 🌙 **Dark/Light Theme** - Eye-friendly theme options
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 💾 **Offline-First** - Works completely offline with IndexedDB storage
- 📤 **Backup/Restore** - Export and import all data as JSON

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/attendance-tracker.git
cd attendance-tracker

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

## 📱 Android App (Capacitor)

### Setup Android

```bash
# Build the web app
npm run build

# Add Android platform
npm run cap:android

# Sync web assets to Android
npm run cap:sync

# Open in Android Studio
npm run cap:open
```

### Requirements for Android

- Android Studio
- Java 17+
- Android SDK

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **Database**: Dexie.js (IndexedDB wrapper)
- **Icons**: Lucide React
- **Routing**: React Router v7
- **Mobile**: Capacitor (Android)
- **Styling**: Vanilla CSS with CSS Variables

## 📁 Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── Layout.tsx   # Main app layout with navigation
│   ├── Modal.tsx    # Modal dialog component
│   ├── StatCard.tsx # Statistics card component
│   └── EmptyState.tsx
├── pages/           # Page components
│   ├── Dashboard.tsx
│   ├── Centers.tsx
│   ├── Students.tsx
│   ├── Attendance.tsx
│   ├── Reports.tsx
│   └── Settings.tsx
├── db/              # Database layer
│   └── db.ts        # Dexie.js setup and operations
├── types/           # TypeScript interfaces
│   └── types.ts
├── App.tsx          # Main app with routing
├── main.tsx         # Entry point
└── index.css        # Global styles and design system
```

## 🎨 Design System

The app uses a custom CSS design system with:

- CSS Custom Properties for theming
- Dark mode by default, light mode available
- Responsive breakpoints at 768px and 1024px
- Modern glassmorphism and gradient effects
- Smooth animations and micro-interactions

## 📊 Data Storage

All data is stored locally using IndexedDB (via Dexie.js):

- **Centers**: Teaching locations with name, address, and color
- **Students**: Student info linked to centers
- **Attendance**: Attendance records with status and dates
- **Settings**: App preferences including theme

Data never leaves your device unless you explicitly export it.

## 🔮 Future Plans

- [ ] Electron wrapper for desktop (PC/Mac)
- [ ] Cloud sync between devices
- [ ] Bulk student import via CSV
- [ ] PDF report generation
- [ ] Notifications for low attendance
- [ ] Multiple languages support

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
