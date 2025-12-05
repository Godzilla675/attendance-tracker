import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Attendance } from './Attendance';
import { addCenter, addStudent, db, getAttendanceByDate } from '../db/db';

const renderWithRouter = (component: React.ReactNode) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Attendance Page', () => {
    beforeEach(async () => {
        await db.centers.clear();
        await db.students.clear();
        await db.attendance.clear();
    });

    it('should render attendance page with title', async () => {
        renderWithRouter(<Attendance />);

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /attendance/i })).toBeInTheDocument();
        });
    });

    it('should show empty state when no centers exist', async () => {
        renderWithRouter(<Attendance />);

        await waitFor(() => {
            expect(screen.getByText(/no centers yet/i)).toBeInTheDocument();
        });
    });

    it('should show empty state when no students in selected center', async () => {
        await addCenter({ name: 'Empty Center', color: '#6366f1' });

        renderWithRouter(<Attendance />);

        await waitFor(() => {
            expect(screen.getByText(/no students in this center/i)).toBeInTheDocument();
        });
    });

    it('should display students for attendance marking', async () => {
        const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
        await addStudent({ name: 'John Doe', centerId, status: 'active' });

        renderWithRouter(<Attendance />);

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });
    });

    it('should show attendance status buttons for each student', async () => {
        const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
        await addStudent({ name: 'John Doe', centerId, status: 'active' });

        renderWithRouter(<Attendance />);

        await waitFor(() => {
            // Use more specific selectors - attendance buttons have specific classes
            const attendanceButtons = screen.getAllByRole('button');
            const presentButtons = attendanceButtons.filter(btn => 
                btn.classList.contains('attendance-btn') && btn.textContent?.includes('Present')
            );
            expect(presentButtons.length).toBeGreaterThan(0);
        });
    });

    it('should mark student as present when clicking present button', async () => {
        const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
        await addStudent({ name: 'John Doe', centerId, status: 'active' });

        renderWithRouter(<Attendance />);

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });

        // Find the attendance present button (has class attendance-btn)
        const buttons = screen.getAllByRole('button');
        const presentButton = buttons.find(btn => 
            btn.classList.contains('attendance-btn') && btn.textContent?.includes('Present')
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

        renderWithRouter(<Attendance />);

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });

        // Mark as present
        const buttons = screen.getAllByRole('button');
        const presentButton = buttons.find(btn => 
            btn.classList.contains('attendance-btn') && btn.textContent?.includes('Present')
        );
        fireEvent.click(presentButton!);

        // Save button should be enabled
        const saveButton = screen.getByRole('button', { name: /save attendance/i });
        expect(saveButton).not.toBeDisabled();

        fireEvent.click(saveButton);

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

        renderWithRouter(<Attendance />);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /mark all present/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /mark all absent/i })).toBeInTheDocument();
        });
    });

    it('should mark all students as present when clicking Mark All Present', async () => {
        const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
        await addStudent({ name: 'Student 1', centerId, status: 'active' });
        await addStudent({ name: 'Student 2', centerId, status: 'active' });

        renderWithRouter(<Attendance />);

        await waitFor(() => {
            expect(screen.getByText('Student 1')).toBeInTheDocument();
            expect(screen.getByText('Student 2')).toBeInTheDocument();
        });

        const markAllPresentButton = screen.getByRole('button', { name: /mark all present/i });
        fireEvent.click(markAllPresentButton);

        await waitFor(() => {
            // Check that both attendance buttons have active class
            const buttons = screen.getAllByRole('button');
            const presentButtons = buttons.filter(btn => 
                btn.classList.contains('attendance-btn') && 
                btn.classList.contains('present') &&
                btn.classList.contains('active')
            );
            expect(presentButtons.length).toBe(2);
        });
    });

    it('should show unsaved changes warning after marking attendance', async () => {
        const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
        await addStudent({ name: 'John Doe', centerId, status: 'active' });

        renderWithRouter(<Attendance />);

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });

        const buttons = screen.getAllByRole('button');
        const presentButton = buttons.find(btn => 
            btn.classList.contains('attendance-btn') && btn.textContent?.includes('Present')
        );
        fireEvent.click(presentButton!);

        await waitFor(() => {
            expect(screen.getByText(/you have unsaved changes/i)).toBeInTheDocument();
        });
    });
});
