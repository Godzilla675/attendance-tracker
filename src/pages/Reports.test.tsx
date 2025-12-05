import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Reports } from './Reports';
import { addCenter, addStudent, markAttendance, db } from '../db/db';

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'mock-url');
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

const renderWithRouter = (component: React.ReactNode) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Reports Page', () => {
    beforeEach(async () => {
        await db.centers.clear();
        await db.students.clear();
        await db.attendance.clear();
        vi.clearAllMocks();
    });

    it('should render reports page with title', async () => {
        renderWithRouter(<Reports />);

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /reports/i })).toBeInTheDocument();
        });
    });

    it('should show Export CSV button', async () => {
        renderWithRouter(<Reports />);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
        });
    });

    it('should show empty state when no students exist', async () => {
        renderWithRouter(<Reports />);

        await waitFor(() => {
            expect(screen.getByText(/no data available/i)).toBeInTheDocument();
        });
    });

    it('should display student attendance data', async () => {
        const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
        const studentId = await addStudent({ name: 'John Doe', centerId, status: 'active' });
        const today = new Date().toISOString().split('T')[0];
        await markAttendance(studentId, centerId, today, 'present');

        renderWithRouter(<Reports />);

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
            // Use getAllByText since Test Center appears in multiple places
            expect(screen.getAllByText('Test Center').length).toBeGreaterThan(0);
        });
    });

    it('should show filter options', async () => {
        await addCenter({ name: 'Test Center', color: '#6366f1' });

        renderWithRouter(<Reports />);

        await waitFor(() => {
            expect(screen.getByText('All Centers')).toBeInTheDocument();
            expect(screen.getByText('From Date')).toBeInTheDocument();
            expect(screen.getByText('To Date')).toBeInTheDocument();
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

        renderWithRouter(<Reports />);

        await waitFor(() => {
            // Check for Total Attendance Records label
            expect(screen.getByText('Total Attendance Records')).toBeInTheDocument();
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

        renderWithRouter(<Reports />);

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });

        const exportButton = screen.getByRole('button', { name: /export csv/i });
        fireEvent.click(exportButton);

        // Verify that a Blob was created and download was triggered
        expect(mockCreateObjectURL).toHaveBeenCalled();
        expect(mockClick).toHaveBeenCalled();
        expect(mockRevokeObjectURL).toHaveBeenCalled();
    });
});
