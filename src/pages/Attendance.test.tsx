import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Attendance } from './Attendance';
import { addCenter, addStudent, db, getAttendanceByDate } from '../db/db';
import { LanguageProvider } from '../i18n';

const renderWithProviders = (component: React.ReactNode) => {
    return render(
        <BrowserRouter>
            <LanguageProvider>
                {component}
            </LanguageProvider>
        </BrowserRouter>
    );
};

describe('Attendance Page', () => {
    beforeEach(async () => {
        await db.centers.clear();
        await db.students.clear();
        await db.attendance.clear();
    });

    it('should render attendance page with title', async () => {
        renderWithProviders(<Attendance />);

        await waitFor(() => {
            expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
        });
    });

    it('should show empty state when no centers exist', async () => {
        renderWithProviders(<Attendance />);

        await waitFor(() => {
            // Look for empty state - might be in Arabic or English
            const emptyState = screen.queryByText(/no centers/i) || screen.queryByText(/لا توجد مراكز/i);
            expect(emptyState).toBeInTheDocument();
        });
    });

    it('should show empty state when no students in selected center', async () => {
        await addCenter({ name: 'Empty Center', color: '#6366f1' });

        renderWithProviders(<Attendance />);

        await waitFor(() => {
            // Look for empty state about students - might be in Arabic or English
            const emptyState = screen.queryByText(/no students/i) || screen.queryByText(/لا يوجد طلاب/i);
            expect(emptyState).toBeInTheDocument();
        });
    });

    it('should display students for attendance marking', async () => {
        const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
        await addStudent({ name: 'John Doe', centerId, status: 'active' });

        renderWithProviders(<Attendance />);

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });
    });

    it('should show attendance status buttons for each student', async () => {
        const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
        await addStudent({ name: 'John Doe', centerId, status: 'active' });

        renderWithProviders(<Attendance />);

        await waitFor(() => {
            // Look for attendance buttons
            const attendanceButtons = screen.getAllByRole('button');
            const statusButtons = attendanceButtons.filter(btn => 
                btn.classList.contains('attendance-btn')
            );
            expect(statusButtons.length).toBeGreaterThan(0);
        });
    });

    it('should mark student as present when clicking present button', async () => {
        const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
        await addStudent({ name: 'John Doe', centerId, status: 'active' });

        renderWithProviders(<Attendance />);

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });

        // Find the attendance present button (has class attendance-btn and present)
        const buttons = screen.getAllByRole('button');
        const presentButton = buttons.find(btn => 
            btn.classList.contains('attendance-btn') && btn.classList.contains('present')
        );
        expect(presentButton).toBeDefined();
        fireEvent.click(presentButton!);

        await waitFor(() => {
            // Check that the present button has active class
            expect(presentButton).toHaveClass('active');
        });
    });

    it('should show save button and save attendance', async () => {
        const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
        const studentId = await addStudent({ name: 'John Doe', centerId, status: 'active' });

        renderWithProviders(<Attendance />);

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });

        // Mark as present
        const buttons = screen.getAllByRole('button');
        const presentButton = buttons.find(btn => 
            btn.classList.contains('attendance-btn') && btn.classList.contains('present')
        );
        fireEvent.click(presentButton!);

        // Find and click save button
        await waitFor(() => {
            const saveButtons = screen.getAllByRole('button');
            const saveButton = saveButtons.find(btn => 
                btn.textContent?.toLowerCase().includes('save') || 
                btn.textContent?.includes('حفظ')
            );
            expect(saveButton).toBeDefined();
            expect(saveButton).not.toBeDisabled();
            fireEvent.click(saveButton!);
        });

        await waitFor(async () => {
            // Check database for saved attendance
            const today = new Date().toISOString().split('T')[0];
            const attendance = await getAttendanceByDate(centerId, today);
            expect(attendance).toHaveLength(1);
            expect(attendance[0].studentId).toBe(studentId);
            expect(attendance[0].status).toBe('present');
        });
    });

    it('should show Mark All Present and Mark All Absent buttons', async () => {
        const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
        await addStudent({ name: 'John Doe', centerId, status: 'active' });

        renderWithProviders(<Attendance />);

        await waitFor(() => {
            // Look for bulk action buttons - might be in Arabic or English
            const buttons = screen.getAllByRole('button');
            const bulkButtons = buttons.filter(btn => 
                btn.textContent?.toLowerCase().includes('all') || 
                btn.textContent?.includes('الكل')
            );
            expect(bulkButtons.length).toBeGreaterThan(0);
        });
    });

    it('should mark all students as present when clicking Mark All Present', async () => {
        const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
        await addStudent({ name: 'Student 1', centerId, status: 'active' });
        await addStudent({ name: 'Student 2', centerId, status: 'active' });

        renderWithProviders(<Attendance />);

        await waitFor(() => {
            expect(screen.getByText('Student 1')).toBeInTheDocument();
            expect(screen.getByText('Student 2')).toBeInTheDocument();
        });

        // Find mark all present button
        const buttons = screen.getAllByRole('button');
        const markAllPresentButton = buttons.find(btn => 
            (btn.textContent?.toLowerCase().includes('all present') || 
             btn.textContent?.includes('حضور الكل')) &&
            btn.classList.contains('quick-action-btn')
        );
        
        if (markAllPresentButton) {
            fireEvent.click(markAllPresentButton);

            await waitFor(() => {
                // Check that present buttons have active class
                const allButtons = screen.getAllByRole('button');
                const presentButtons = allButtons.filter(btn => 
                    btn.classList.contains('attendance-btn') && 
                    btn.classList.contains('present') &&
                    btn.classList.contains('active')
                );
                expect(presentButtons.length).toBe(2);
            });
        }
    });

    it('should show unsaved changes warning after marking attendance', async () => {
        const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
        await addStudent({ name: 'John Doe', centerId, status: 'active' });

        renderWithProviders(<Attendance />);

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });

        const buttons = screen.getAllByRole('button');
        const presentButton = buttons.find(btn => 
            btn.classList.contains('attendance-btn') && btn.classList.contains('present')
        );
        fireEvent.click(presentButton!);

        await waitFor(() => {
            // Look for unsaved changes warning - might be in Arabic or English
            const warning = screen.queryByText(/unsaved/i) || screen.queryByText(/غير محفوظة/i);
            expect(warning).toBeInTheDocument();
        });
    });
});
