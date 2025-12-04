// Database schema types for the Attendance Tracker

export interface Center {
    id?: number;
    name: string;
    address?: string;
    color: string;
    createdAt: Date;
}

export interface Student {
    id?: number;
    name: string;
    centerId: number;
    phone?: string;
    parentPhone?: string;
    notes?: string;
    status: 'active' | 'inactive';
    createdAt: Date;
}

export interface AttendanceRecord {
    id?: number;
    studentId: number;
    centerId: number;
    date: string; // YYYY-MM-DD
    status: 'present' | 'absent' | 'late' | 'excused';
    notes?: string;
    createdAt: Date;
}

export interface AppSettings {
    id?: number;
    theme: 'light' | 'dark' | 'system';
    defaultCenter?: number;
    language: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
    present: '#22c55e',
    absent: '#ef4444',
    late: '#f59e0b',
    excused: '#3b82f6',
};

export const CENTER_COLORS = [
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#f43f5e', // Rose
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#14b8a6', // Teal
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
];
