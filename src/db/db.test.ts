import { describe, it, expect, beforeEach } from 'vitest';
import {
    db,
    addCenter,
    getAllCenters,
    updateCenter,
    deleteCenter,
    getCenterById,
    addStudent,
    getAllStudents,
    getStudentsByCenter,
    getActiveStudentsByCenter,
    updateStudent,
    deleteStudent,
    getStudentById,
    markAttendance,
    getAttendanceByDate,
    getAttendanceByStudent,
    getStudentCount,
    getCenterCount,
    getTodayAttendanceStats,
    getAttendanceRateForStudent,
    exportAllData,
    importData,
    getSettings,
    saveSettings,
} from './db';

describe('Database Operations', () => {
    beforeEach(async () => {
        await db.centers.clear();
        await db.students.clear();
        await db.attendance.clear();
        await db.settings.clear();
    });

    describe('Centers', () => {
        it('should add a center', async () => {
            const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
            expect(centerId).toBeDefined();
            expect(typeof centerId).toBe('number');
        });

        it('should get all centers', async () => {
            await addCenter({ name: 'Center 1', color: '#6366f1' });
            await addCenter({ name: 'Center 2', color: '#8b5cf6' });

            const centers = await getAllCenters();
            expect(centers).toHaveLength(2);
        });

        it('should get center by id', async () => {
            const centerId = await addCenter({ name: 'Test Center', color: '#6366f1', address: '123 Main St' });
            const center = await getCenterById(centerId);

            expect(center).toBeDefined();
            expect(center?.name).toBe('Test Center');
            expect(center?.address).toBe('123 Main St');
        });

        it('should update a center', async () => {
            const centerId = await addCenter({ name: 'Old Name', color: '#6366f1' });
            await updateCenter(centerId, { name: 'New Name' });

            const center = await getCenterById(centerId);
            expect(center?.name).toBe('New Name');
        });

        it('should delete a center and cascade delete students and attendance', async () => {
            const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
            const studentId = await addStudent({ name: 'John', centerId, status: 'active' });
            await markAttendance(studentId, centerId, '2024-01-01', 'present');

            await deleteCenter(centerId);

            const centers = await getAllCenters();
            const students = await getAllStudents();
            const attendance = await getAttendanceByStudent(studentId);

            expect(centers).toHaveLength(0);
            expect(students).toHaveLength(0);
            expect(attendance).toHaveLength(0);
        });
    });

    describe('Students', () => {
        it('should add a student', async () => {
            const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
            const studentId = await addStudent({
                name: 'John Doe',
                centerId,
                status: 'active',
                phone: '123-456-7890',
            });

            expect(studentId).toBeDefined();
            expect(typeof studentId).toBe('number');
        });

        it('should get all students', async () => {
            const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
            await addStudent({ name: 'John', centerId, status: 'active' });
            await addStudent({ name: 'Jane', centerId, status: 'active' });

            const students = await getAllStudents();
            expect(students).toHaveLength(2);
        });

        it('should get students by center', async () => {
            const center1 = await addCenter({ name: 'Center 1', color: '#6366f1' });
            const center2 = await addCenter({ name: 'Center 2', color: '#8b5cf6' });

            await addStudent({ name: 'John', centerId: center1, status: 'active' });
            await addStudent({ name: 'Jane', centerId: center2, status: 'active' });

            const center1Students = await getStudentsByCenter(center1);
            expect(center1Students).toHaveLength(1);
            expect(center1Students[0].name).toBe('John');
        });

        it('should get only active students by center', async () => {
            const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
            await addStudent({ name: 'Active Student', centerId, status: 'active' });
            await addStudent({ name: 'Inactive Student', centerId, status: 'inactive' });

            const activeStudents = await getActiveStudentsByCenter(centerId);
            expect(activeStudents).toHaveLength(1);
            expect(activeStudents[0].name).toBe('Active Student');
        });

        it('should update a student', async () => {
            const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
            const studentId = await addStudent({ name: 'John', centerId, status: 'active' });

            await updateStudent(studentId, { name: 'John Updated', status: 'inactive' });

            const student = await getStudentById(studentId);
            expect(student?.name).toBe('John Updated');
            expect(student?.status).toBe('inactive');
        });

        it('should delete a student and cascade delete attendance', async () => {
            const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
            const studentId = await addStudent({ name: 'John', centerId, status: 'active' });
            await markAttendance(studentId, centerId, '2024-01-01', 'present');

            await deleteStudent(studentId);

            const students = await getAllStudents();
            const attendance = await getAttendanceByStudent(studentId);

            expect(students).toHaveLength(0);
            expect(attendance).toHaveLength(0);
        });
    });

    describe('Attendance', () => {
        it('should mark attendance for a student', async () => {
            const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
            const studentId = await addStudent({ name: 'John', centerId, status: 'active' });

            await markAttendance(studentId, centerId, '2024-01-01', 'present');

            const attendance = await getAttendanceByDate(centerId, '2024-01-01');
            expect(attendance).toHaveLength(1);
            expect(attendance[0].status).toBe('present');
        });

        it('should update existing attendance instead of creating duplicate', async () => {
            const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
            const studentId = await addStudent({ name: 'John', centerId, status: 'active' });

            await markAttendance(studentId, centerId, '2024-01-01', 'present');
            await markAttendance(studentId, centerId, '2024-01-01', 'absent');

            const attendance = await getAttendanceByDate(centerId, '2024-01-01');
            expect(attendance).toHaveLength(1);
            expect(attendance[0].status).toBe('absent');
        });

        it('should get attendance by student', async () => {
            const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
            const studentId = await addStudent({ name: 'John', centerId, status: 'active' });

            await markAttendance(studentId, centerId, '2024-01-01', 'present');
            await markAttendance(studentId, centerId, '2024-01-02', 'absent');
            await markAttendance(studentId, centerId, '2024-01-03', 'late');

            const attendance = await getAttendanceByStudent(studentId);
            expect(attendance).toHaveLength(3);
        });

        it('should support all attendance statuses', async () => {
            const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
            const studentId = await addStudent({ name: 'John', centerId, status: 'active' });

            await markAttendance(studentId, centerId, '2024-01-01', 'present');
            await markAttendance(studentId, centerId, '2024-01-02', 'absent');
            await markAttendance(studentId, centerId, '2024-01-03', 'late');
            await markAttendance(studentId, centerId, '2024-01-04', 'excused');

            const attendance = await getAttendanceByStudent(studentId);
            const statuses = attendance.map(a => a.status);

            expect(statuses).toContain('present');
            expect(statuses).toContain('absent');
            expect(statuses).toContain('late');
            expect(statuses).toContain('excused');
        });
    });

    describe('Statistics', () => {
        it('should get student count (active only)', async () => {
            const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
            await addStudent({ name: 'Active', centerId, status: 'active' });
            await addStudent({ name: 'Inactive', centerId, status: 'inactive' });

            const count = await getStudentCount();
            expect(count).toBe(1);
        });

        it('should get center count', async () => {
            await addCenter({ name: 'Center 1', color: '#6366f1' });
            await addCenter({ name: 'Center 2', color: '#8b5cf6' });

            const count = await getCenterCount();
            expect(count).toBe(2);
        });

        it('should get today attendance stats', async () => {
            const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
            const student1 = await addStudent({ name: 'Student 1', centerId, status: 'active' });
            const student2 = await addStudent({ name: 'Student 2', centerId, status: 'active' });
            const student3 = await addStudent({ name: 'Student 3', centerId, status: 'active' });
            const student4 = await addStudent({ name: 'Student 4', centerId, status: 'active' });

            const today = new Date().toISOString().split('T')[0];
            await markAttendance(student1, centerId, today, 'present');
            await markAttendance(student2, centerId, today, 'absent');
            await markAttendance(student3, centerId, today, 'late');
            await markAttendance(student4, centerId, today, 'excused');

            const stats = await getTodayAttendanceStats(today);

            expect(stats.present).toBe(1);
            expect(stats.absent).toBe(1);
            expect(stats.late).toBe(1);
            expect(stats.excused).toBe(1);
            expect(stats.total).toBe(4);
        });

        it('should calculate attendance rate for student', async () => {
            const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
            const studentId = await addStudent({ name: 'John', centerId, status: 'active' });

            await markAttendance(studentId, centerId, '2024-01-01', 'present');
            await markAttendance(studentId, centerId, '2024-01-02', 'present');
            await markAttendance(studentId, centerId, '2024-01-03', 'late');
            await markAttendance(studentId, centerId, '2024-01-04', 'absent');

            const rate = await getAttendanceRateForStudent(studentId);
            // 3 out of 4 (present + late count as attendance)
            expect(rate).toBe(75);
        });

        it('should return 0 attendance rate for student with no records', async () => {
            const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
            const studentId = await addStudent({ name: 'John', centerId, status: 'active' });

            const rate = await getAttendanceRateForStudent(studentId);
            expect(rate).toBe(0);
        });
    });

    describe('Settings', () => {
        it('should save and retrieve settings', async () => {
            await saveSettings({ theme: 'dark', language: 'en' });

            const settings = await getSettings();
            expect(settings?.theme).toBe('dark');
            expect(settings?.language).toBe('en');
        });

        it('should update existing settings', async () => {
            await saveSettings({ theme: 'dark', language: 'en' });
            await saveSettings({ theme: 'light' });

            const settings = await getSettings();
            expect(settings?.theme).toBe('light');
        });
    });

    describe('Export/Import', () => {
        it('should export all data as JSON', async () => {
            const centerId = await addCenter({ name: 'Test Center', color: '#6366f1' });
            const studentId = await addStudent({ name: 'John', centerId, status: 'active' });
            await markAttendance(studentId, centerId, '2024-01-01', 'present');

            const exportedData = await exportAllData();
            const parsed = JSON.parse(exportedData);

            expect(parsed.centers).toHaveLength(1);
            expect(parsed.students).toHaveLength(1);
            expect(parsed.attendance).toHaveLength(1);
            expect(parsed.centers[0].name).toBe('Test Center');
            expect(parsed.students[0].name).toBe('John');
        });

        it('should import data from JSON', async () => {
            const jsonData = JSON.stringify({
                centers: [{ id: 1, name: 'Imported Center', color: '#6366f1', createdAt: new Date() }],
                students: [{ id: 1, name: 'Imported Student', centerId: 1, status: 'active', createdAt: new Date() }],
                attendance: [{ id: 1, studentId: 1, centerId: 1, date: '2024-01-01', status: 'present', createdAt: new Date() }],
            });

            await importData(jsonData);

            const centers = await getAllCenters();
            const students = await getAllStudents();
            const attendance = await getAttendanceByStudent(1);

            expect(centers).toHaveLength(1);
            expect(centers[0].name).toBe('Imported Center');
            expect(students).toHaveLength(1);
            expect(students[0].name).toBe('Imported Student');
            expect(attendance).toHaveLength(1);
        });

        it('should replace existing data on import', async () => {
            // Add existing data
            await addCenter({ name: 'Existing Center', color: '#6366f1' });

            // Import new data
            const jsonData = JSON.stringify({
                centers: [{ id: 1, name: 'New Center', color: '#8b5cf6', createdAt: new Date() }],
                students: [],
                attendance: [],
            });

            await importData(jsonData);

            const centers = await getAllCenters();
            expect(centers).toHaveLength(1);
            expect(centers[0].name).toBe('New Center');
        });
    });
});
