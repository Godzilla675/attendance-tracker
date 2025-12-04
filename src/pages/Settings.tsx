import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor, Download, Upload, Trash2, Database, Info } from 'lucide-react';
import { exportAllData, importData, getSettings, saveSettings } from '../db/db';
import db from '../db/db';
import type { AppSettings } from '../types/types';

export function Settings() {
    const [settings, setSettings] = useState<Partial<AppSettings>>({
        theme: 'dark',
        language: 'en',
    });
    const [isExporting, setIsExporting] = useState(false);
    const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        // Apply theme
        document.documentElement.setAttribute('data-theme', settings.theme === 'system' ? 'dark' : settings.theme || 'dark');
    }, [settings.theme]);

    async function loadSettings() {
        try {
            const savedSettings = await getSettings();
            if (savedSettings) {
                setSettings(savedSettings);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    async function handleThemeChange(theme: 'light' | 'dark' | 'system') {
        setSettings((prev) => ({ ...prev, theme }));
        await saveSettings({ theme });
    }

    async function handleExport() {
        setIsExporting(true);
        try {
            const data = await exportAllData();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `attendx-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    }

    async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            await importData(text);
            setImportStatus('success');
            setTimeout(() => setImportStatus('idle'), 3000);
            window.location.reload();
        } catch (error) {
            console.error('Import failed:', error);
            setImportStatus('error');
            setTimeout(() => setImportStatus('idle'), 3000);
        }
    }

    async function handleClearData() {
        if (window.confirm('Are you sure you want to delete ALL data? This action cannot be undone!')) {
            if (window.confirm('This will permanently delete all centers, students, and attendance records. Are you absolutely sure?')) {
                try {
                    await db.delete();
                    await db.open();
                    window.location.reload();
                } catch (error) {
                    console.error('Failed to clear data:', error);
                }
            }
        }
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Settings</h1>
                <p className="page-subtitle">Customize your app preferences</p>
            </div>

            {/* Theme Settings */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-header">
                    <h3 className="card-title">Appearance</h3>
                </div>
                <div>
                    <label className="form-label">Theme</label>
                    <div className="tabs" style={{ maxWidth: '400px' }}>
                        <button
                            className={`tab ${settings.theme === 'light' ? 'active' : ''}`}
                            onClick={() => handleThemeChange('light')}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <Sun size={16} />
                            Light
                        </button>
                        <button
                            className={`tab ${settings.theme === 'dark' ? 'active' : ''}`}
                            onClick={() => handleThemeChange('dark')}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <Moon size={16} />
                            Dark
                        </button>
                        <button
                            className={`tab ${settings.theme === 'system' ? 'active' : ''}`}
                            onClick={() => handleThemeChange('system')}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <Monitor size={16} />
                            System
                        </button>
                    </div>
                </div>
            </div>

            {/* Data Management */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-header">
                    <h3 className="card-title">Data Management</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Export */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                        <div>
                            <h4 style={{ marginBottom: '4px' }}>Export Data</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                Download all your data as a JSON backup file
                            </p>
                        </div>
                        <button className="btn btn-secondary" onClick={handleExport} disabled={isExporting}>
                            <Download size={18} />
                            {isExporting ? 'Exporting...' : 'Export'}
                        </button>
                    </div>

                    {/* Import */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                        <div>
                            <h4 style={{ marginBottom: '4px' }}>Import Data</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                Restore data from a backup file (replaces existing data)
                            </p>
                            {importStatus === 'success' && (
                                <p style={{ color: 'var(--success)', fontSize: '0.875rem', marginTop: '4px' }}>
                                    ✓ Data imported successfully!
                                </p>
                            )}
                            {importStatus === 'error' && (
                                <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '4px' }}>
                                    ✗ Import failed. Please check the file format.
                                </p>
                            )}
                        </div>
                        <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                            <Upload size={18} />
                            Import
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImport}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>

                    {/* Clear Data */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger)' }}>
                        <div>
                            <h4 style={{ marginBottom: '4px', color: 'var(--danger)' }}>Clear All Data</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                Permanently delete all centers, students, and attendance records
                            </p>
                        </div>
                        <button className="btn btn-danger" onClick={handleClearData}>
                            <Trash2 size={18} />
                            Clear Data
                        </button>
                    </div>
                </div>
            </div>

            {/* About */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">About</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                            style={{
                                width: '48px',
                                height: '48px',
                                background: 'var(--accent-gradient)',
                                borderRadius: 'var(--radius-md)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                            }}
                        >
                            <Database size={24} />
                        </div>
                        <div>
                            <h4 style={{ marginBottom: '2px' }}>AttendX</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                Version 1.0.0
                            </p>
                        </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        A modern attendance tracking app for teachers. Track students across multiple centers,
                        mark attendance with ease, and generate comprehensive reports.
                    </p>
                    <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <Info size={18} style={{ color: 'var(--info)', flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            All data is stored locally on your device using IndexedDB. Your data never leaves your device
                            unless you explicitly export it. For data sync across devices, use the export/import feature.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
