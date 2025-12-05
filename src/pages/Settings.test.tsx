import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Settings } from './Settings';
import { db, saveSettings } from '../db/db';

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'mock-url');
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

const renderWithRouter = (component: React.ReactNode) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
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
        renderWithRouter(<Settings />);

        expect(screen.getByRole('heading', { name: /settings/i, level: 1 })).toBeInTheDocument();
    });

    it('should show theme options', async () => {
        renderWithRouter(<Settings />);

        expect(screen.getByRole('button', { name: /light/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /dark/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /system/i })).toBeInTheDocument();
    });

    it('should show data management options', async () => {
        renderWithRouter(<Settings />);

        expect(screen.getByRole('heading', { name: /data management/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^export$/i })).toBeInTheDocument();
        expect(screen.getByText(/import data/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /clear data/i })).toBeInTheDocument();
    });

    it('should change theme when clicking theme buttons', async () => {
        renderWithRouter(<Settings />);

        const lightButton = screen.getByRole('button', { name: /light/i });
        fireEvent.click(lightButton);

        await waitFor(() => {
            expect(document.documentElement.getAttribute('data-theme')).toBe('light');
        });

        const darkButton = screen.getByRole('button', { name: /dark/i });
        fireEvent.click(darkButton);

        await waitFor(() => {
            expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        });
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

        renderWithRouter(<Settings />);

        const exportButton = screen.getByRole('button', { name: /^export$/i });
        fireEvent.click(exportButton);

        await waitFor(() => {
            expect(mockCreateObjectURL).toHaveBeenCalled();
            expect(mockClick).toHaveBeenCalled();
            expect(mockRevokeObjectURL).toHaveBeenCalled();
        });
    });

    it('should show About section', async () => {
        renderWithRouter(<Settings />);

        expect(screen.getByRole('heading', { name: /about/i })).toBeInTheDocument();
        expect(screen.getByText('AttendX')).toBeInTheDocument();
        expect(screen.getByText('Version 1.0.0')).toBeInTheDocument();
    });

    it('should persist theme settings', async () => {
        await saveSettings({ theme: 'light', language: 'en' });

        renderWithRouter(<Settings />);

        await waitFor(() => {
            expect(document.documentElement.getAttribute('data-theme')).toBe('light');
        });
    });
});
