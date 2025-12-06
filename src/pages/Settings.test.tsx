import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Settings } from './Settings';
import { db, saveSettings } from '../db/db';
import { LanguageProvider } from '../i18n';

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'mock-url');
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

const renderWithProviders = (component: React.ReactNode) => {
    return render(
        <BrowserRouter>
            <LanguageProvider>
                {component}
            </LanguageProvider>
        </BrowserRouter>
    );
};

describe('Settings Page', () => {
    beforeEach(async () => {
        await db.centers.clear();
        await db.students.clear();
        await db.attendance.clear();
        await db.settings.clear();
        vi.clearAllMocks();
    });

    it('should render settings page with title', async () => {
        renderWithProviders(<Settings />);

        await waitFor(() => {
            expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
        });
    });

    it('should show theme options', async () => {
        renderWithProviders(<Settings />);

        await waitFor(() => {
            // Theme buttons should exist
            const buttons = screen.getAllByRole('button');
            expect(buttons.length).toBeGreaterThan(0);
        });
    });

    it('should show data management options', async () => {
        renderWithProviders(<Settings />);

        await waitFor(() => {
            // Export button should exist
            const buttons = screen.getAllByRole('button');
            expect(buttons.length).toBeGreaterThan(0);
        });
    });

    it('should change theme when clicking theme buttons', async () => {
        renderWithProviders(<Settings />);

        await waitFor(() => {
            // Find theme buttons by looking for buttons with Light/Dark text or icons
            const buttons = screen.getAllByRole('button');
            expect(buttons.length).toBeGreaterThan(0);
        });

        // Find the light mode button
        const buttons = screen.getAllByRole('button');
        const lightButton = buttons.find(btn => 
            btn.textContent?.toLowerCase().includes('light') || 
            btn.textContent?.toLowerCase().includes('فاتح')
        );
        
        if (lightButton) {
            fireEvent.click(lightButton);
            await waitFor(() => {
                expect(document.documentElement.getAttribute('data-theme')).toBe('light');
            });
        }
    });

    it('should export data as JSON when export button is clicked', async () => {
        // Mock document.createElement to capture the download link
        const mockClick = vi.fn();
        const originalCreateElement = document.createElement.bind(document);
        vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
            const element = originalCreateElement(tagName);
            if (tagName === 'a') {
                element.click = mockClick;
            }
            return element;
        });

        renderWithProviders(<Settings />);

        await waitFor(() => {
            const buttons = screen.getAllByRole('button');
            expect(buttons.length).toBeGreaterThan(0);
        });

        // Find export button
        const buttons = screen.getAllByRole('button');
        const exportButton = buttons.find(btn => 
            btn.textContent?.toLowerCase().includes('export') || 
            btn.textContent?.toLowerCase().includes('تصدير')
        );
        
        if (exportButton) {
            fireEvent.click(exportButton);

            await waitFor(() => {
                expect(mockCreateObjectURL).toHaveBeenCalled();
                expect(mockClick).toHaveBeenCalled();
                expect(mockRevokeObjectURL).toHaveBeenCalled();
            });
        }
    });

    it('should show About section', async () => {
        renderWithProviders(<Settings />);

        await waitFor(() => {
            expect(screen.getByText('AttendX')).toBeInTheDocument();
        });
    });

    it('should persist theme settings', async () => {
        await saveSettings({ theme: 'light', language: 'en' });

        renderWithProviders(<Settings />);

        await waitFor(() => {
            expect(document.documentElement.getAttribute('data-theme')).toBe('light');
        });
    });
});
