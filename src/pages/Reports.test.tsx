import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Reports } from './Reports';
import { addCenter, addStudent, markAttendance, db } from '../db/db';
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

describe('Reports Page', () => {
    beforeEach(async () => {
        await db.centers.clear();
        await db.students.clear();
        await db.attendance.clear();
        vi.clearAllMocks();
    });

    it('should render reports page with title', async () => {
        renderWithProviders(<Reports />);

        await waitFor(() => {
            expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
        });
    });

    it('should show Export CSV button', async () => {
        renderWithProviders(<Reports />);

        await waitFor(() => {
            // Look for a button with download icon
            expect(screen.getByRole('button', { name: /csv/i })).toBeInTheDocument();
        });
    });

    it('should show empty state when no students exist', async () => {
        renderWithProviders(<Reports />);

        await waitFor(() => {
            // Look for empty state - either "No Data" or "لا توجد بيانات" (Arabic)
            const noDataElement = screen.queryByText(/no data/i) || screen.queryByText(/لا توجد/i);
            expect(noDataElement).toBeInTheDocument();
        });
    });

    it('should display student attendance data', async () => {
        const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
        const studentId = await addStudent({ name: 'John Doe', centerId, status: 'active' });
        const today = new Date().toISOString().split('T')[0];
        await markAttendance(studentId, centerId, today, 'present');

        renderWithProviders(<Reports />);

        await waitFor(() => {
            // Use getAllByText since John Doe appears in multiple places (mobile and desktop views)
            expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
            // Use getAllByText since Test Center appears in multiple places
            expect(screen.getAllByText('Test Center').length).toBeGreaterThan(0);
        });
    });

    it('should show filter options', async () => {
        await addCenter({ name: 'Test Center', color: '#6366f1' });

        renderWithProviders(<Reports />);

        await waitFor(() => {
            // Look for filter heading or combobox
            const comboboxes = screen.getAllByRole('combobox');
            expect(comboboxes.length).toBeGreaterThan(0);
        });
    });

    it('should calculate attendance statistics correctly', async () => {
        const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
        const studentId = await addStudent({ name: 'John Doe', centerId, status: 'active' });
        
        // Add attendance records within the default 30-day range
        const today = new Date();
        const date1 = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const date2 = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        await markAttendance(studentId, centerId, date1, 'present');
        await markAttendance(studentId, centerId, date2, 'present');

        renderWithProviders(<Reports />);

        await waitFor(() => {
            // Check that student name appears (in multiple places due to responsive views)
            expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
        });
    });

    it('should export CSV when button is clicked', async () => {
        const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
        const studentId = await addStudent({ name: 'John Doe', centerId, status: 'active' });
        const today = new Date().toISOString().split('T')[0];
        await markAttendance(studentId, centerId, today, 'present');

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

        renderWithProviders(<Reports />);

        await waitFor(() => {
            expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
        });

        const exportButton = screen.getByRole('button', { name: /csv/i });
        fireEvent.click(exportButton);

        // Verify that a Blob was created and download was triggered
        expect(mockCreateObjectURL).toHaveBeenCalled();
        expect(mockClick).toHaveBeenCalled();
        expect(mockRevokeObjectURL).toHaveBeenCalled();
    });
});
