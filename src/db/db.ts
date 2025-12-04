import Dexie, { type EntityTable } from 'dexie';
import type { Center, Student, AttendanceRecord, AppSettings } from '../types/types';

// Database class extending Dexie
class AttendanceDB extends Dexie {
    centers!: EntityTable<Center, 'id'>;
    students!: EntityTable<Student, 'id'>;
    attendance!: EntityTable<AttendanceRecord, 'id'>;
    settings!: EntityTable<AppSettings, 'id'>;

    constructor() {
        super('AttendanceTracker');

        this.version(1).stores({
            centers: '++id, name, createdAt',
            students: '++id, name, centerId, status, createdAt',
            attendance: '++id, studentId, centerId, date, status, [centerId+date], [studentId+date]',
            settings: '++id',
        });
    }
}

export const db = new AttendanceDB();

// Helper functions for database operations

// Centers
export async function getAllCenters(): Promise<Center[]> {
    return db.centers.orderBy('createdAt').reverse().toArray();
}

export async function addCenter(center: Omit<Center, 'id' | 'createdAt'>): Promise<number> {
    const id = await db.centers.add({ ...center, createdAt: new Date() });
    return id as number;
}

export async function updateCenter(id: number, updates: Partial<Center>): Promise<number> {
    return db.centers.update(id, updates);
}

export async function deleteCenter(id: number): Promise<void> {
    // Also delete students and attendance records for this center
    await db.students.where('centerId').equals(id).delete();
    await db.attendance.where('centerId').equals(id).delete();
    await db.centers.delete(id);
}

export async function getCenterById(id: number): Promise<Center | undefined> {
    return db.centers.get(id);
}

// Students
export async function getAllStudents(): Promise<Student[]> {
    return db.students.orderBy('name').toArray();
}

export async function getStudentsByCenter(centerId: number): Promise<Student[]> {
    return db.students.where('centerId').equals(centerId).toArray();
}

export async function getActiveStudentsByCenter(centerId: number): Promise<Student[]> {
    return db.students
        .where('centerId')
        .equals(centerId)
        .filter((s) => s.status === 'active')
        .toArray();
}

export async function addStudent(student: Omit<Student, 'id' | 'createdAt'>): Promise<number> {
    const id = await db.students.add({ ...student, createdAt: new Date() });
    return id as number;
}

export async function updateStudent(id: number, updates: Partial<Student>): Promise<number> {
    return db.students.update(id, updates);
}

export async function deleteStudent(id: number): Promise<void> {
    await db.attendance.where('studentId').equals(id).delete();
    await db.students.delete(id);
}

export async function getStudentById(id: number): Promise<Student | undefined> {
    return db.students.get(id);
}

// Attendance
export async function getAttendanceByDate(centerId: number, date: string): Promise<AttendanceRecord[]> {
    return db.attendance.where({ centerId, date }).toArray();
}

export async function getAttendanceByStudent(studentId: number): Promise<AttendanceRecord[]> {
    return db.attendance.where('studentId').equals(studentId).reverse().sortBy('date');
}

export async function markAttendance(
    studentId: number,
    centerId: number,
    date: string,
    status: AttendanceRecord['status'],
    notes?: string
): Promise<void> {
    const existing = await db.attendance
        .where({ studentId, date })
        .first();

    if (existing) {
        await db.attendance.update(existing.id!, { status, notes });
    } else {
        await db.attendance.add({
            studentId,
            centerId,
            date,
            status,
            notes,
            createdAt: new Date(),
        });
    }
}

export async function bulkMarkAttendance(
    records: Array<{ studentId: number; centerId: number; date: string; status: AttendanceRecord['status'] }>
): Promise<void> {
    for (const record of records) {
        await markAttendance(record.studentId, record.centerId, record.date, record.status);
    }
}

// Statistics
export async function getStudentCount(): Promise<number> {
    return db.students.where('status').equals('active').count();
}

export async function getCenterCount(): Promise<number> {
    return db.centers.count();
}

export async function getStudentCountByCenter(centerId: number): Promise<number> {
    return db.students.where('centerId').equals(centerId).count();
}

export async function getTodayAttendanceStats(date: string): Promise<{
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
}> {
    const records = await db.attendance.where('date').equals(date).toArray();
    const stats = { present: 0, absent: 0, late: 0, excused: 0, total: records.length };

    records.forEach((r) => {
        stats[r.status]++;
    });

    return stats;
}

export async function getAttendanceRateForStudent(studentId: number): Promise<number> {
    const records = await db.attendance.where('studentId').equals(studentId).toArray();
    if (records.length === 0) return 0;

    const presentCount = records.filter((r) => r.status === 'present' || r.status === 'late').length;
    return Math.round((presentCount / records.length) * 100);
}

// Settings
export async function getSettings(): Promise<AppSettings | undefined> {
    return db.settings.toCollection().first();
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
    const existing = await getSettings();
    if (existing) {
        await db.settings.update(existing.id!, settings);
    } else {
        await db.settings.add({
            theme: 'system',
            language: 'en',
            ...settings,
        });
    }
}

// Export/Import
export async function exportAllData(): Promise<string> {
    const centers = await db.centers.toArray();
    const students = await db.students.toArray();
    const attendance = await db.attendance.toArray();
    const settings = await getSettings();

    return JSON.stringify({ centers, students, attendance, settings }, null, 2);
}

export async function importData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);

    await db.transaction('rw', [db.centers, db.students, db.attendance, db.settings], async () => {
        if (data.centers) {
            await db.centers.clear();
            await db.centers.bulkAdd(data.centers);
        }
        if (data.students) {
            await db.students.clear();
            await db.students.bulkAdd(data.students);
        }
        if (data.attendance) {
            await db.attendance.clear();
            await db.attendance.bulkAdd(data.attendance);
        }
        if (data.settings) {
            await db.settings.clear();
            await db.settings.add(data.settings);
        }
    });
}

export default db;
