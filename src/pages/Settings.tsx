import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor, Download, Upload, Trash2, Database, Info, Globe } from 'lucide-react';
import { exportAllData, importData, getSettings, saveSettings } from '../db/db';
import db from '../db/db';
import { useLanguage, type Language } from '../i18n';
import type { AppSettings } from '../types/types';

export function Settings() {
    const { t, language, setLanguage } = useLanguage();
    const [settings, setSettings] = useState<Partial<AppSettings>>({
        theme: 'dark',
        language: 'ar',
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

    async function handleLanguageChange(lang: Language) {
        setSettings((prev) => ({ ...prev, language: lang }));
        await setLanguage(lang);
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
        if (window.confirm(t.settings.confirmClear1)) {
            if (window.confirm(t.settings.confirmClear2)) {
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
                <h1 className="page-title">{t.settings.title}</h1>
                <p className="page-subtitle">{t.settings.subtitle}</p>
            </div>

            {/* Theme Settings */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-header">
                    <h3 className="card-title">{t.settings.appearance}</h3>
                </div>
                <div>
                    <label className="form-label">{t.settings.theme}</label>
                    <div className="tabs" style={{ maxWidth: '400px' }}>
                        <button
                            className={`tab ${settings.theme === 'light' ? 'active' : ''}`}
                            onClick={() => handleThemeChange('light')}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <Sun size={16} />
                            {t.settings.light}
                        </button>
                        <button
                            className={`tab ${settings.theme === 'dark' ? 'active' : ''}`}
                            onClick={() => handleThemeChange('dark')}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <Moon size={16} />
                            {t.settings.dark}
                        </button>
                        <button
                            className={`tab ${settings.theme === 'system' ? 'active' : ''}`}
                            onClick={() => handleThemeChange('system')}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <Monitor size={16} />
                            {t.settings.system}
                        </button>
                    </div>
                </div>
            </div>

            {/* Language Settings */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-header">
                    <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Globe size={20} />
                        {t.settings.language}
                    </h3>
                </div>
                <div>
                    <div className="tabs" style={{ maxWidth: '300px' }}>
                        <button
                            className={`tab ${language === 'ar' ? 'active' : ''}`}
                            onClick={() => handleLanguageChange('ar')}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            {t.settings.arabic}
                        </button>
                        <button
                            className={`tab ${language === 'en' ? 'active' : ''}`}
                            onClick={() => handleLanguageChange('en')}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            {t.settings.english}
                        </button>
                    </div>
                </div>
            </div>

            {/* Data Management */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-header">
                    <h3 className="card-title">{t.settings.dataManagement}</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Export */}
                    <div className="data-management-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                        <div>
                            <h4 style={{ marginBottom: '4px' }}>{t.settings.exportData}</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                {t.settings.exportDescription}
                            </p>
                        </div>
                        <button className="btn btn-secondary" onClick={handleExport} disabled={isExporting}>
                            <Download size={18} />
                            {isExporting ? t.settings.exporting : t.settings.export}
                        </button>
                    </div>

                    {/* Import */}
                    <div className="data-management-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                        <div>
                            <h4 style={{ marginBottom: '4px' }}>{t.settings.importData}</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                {t.settings.importDescription}
                            </p>
                            {importStatus === 'success' && (
                                <p style={{ color: 'var(--success)', fontSize: '0.875rem', marginTop: '4px' }}>
                                    {t.settings.importSuccess}
                                </p>
                            )}
                            {importStatus === 'error' && (
                                <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '4px' }}>
                                    {t.settings.importError}
                                </p>
                            )}
                        </div>
                        <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                            <Upload size={18} />
                            {t.settings.import}
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImport}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>

                    {/* Clear Data */}
                    <div className="data-management-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger)' }}>
                        <div>
                            <h4 style={{ marginBottom: '4px', color: 'var(--danger)' }}>{t.settings.clearAllData}</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                {t.settings.clearDescription}
                            </p>
                        </div>
                        <button className="btn btn-danger" onClick={handleClearData}>
                            <Trash2 size={18} />
                            {t.settings.clearData}
                        </button>
                    </div>
                </div>
            </div>

            {/* About */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">{t.settings.about}</h3>
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
                                {t.settings.version} 1.0.0
                            </p>
                        </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {t.settings.appDescription}
                    </p>
                    <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <Info size={18} style={{ color: 'var(--info)', flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {t.settings.dataStorageInfo}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
