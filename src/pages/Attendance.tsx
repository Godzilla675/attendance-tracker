import { useEffect, useState } from 'react';
import { Check, X, Clock, AlertCircle, Calendar, Save } from 'lucide-react';
import {
    getAllCenters,
    getActiveStudentsByCenter,
    getAttendanceByDate,
    markAttendance,
} from '../db/db';
import type { Center, Student, AttendanceStatus } from '../types/types';

interface StudentWithAttendance extends Student {
    attendance?: AttendanceStatus;
}

export function Attendance() {
    const [centers, setCenters] = useState<Center[]>([]);
    const [students, setStudents] = useState<StudentWithAttendance[]>([]);
    const [selectedCenter, setSelectedCenter] = useState<number | ''>('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        loadCenters();
    }, []);

    useEffect(() => {
        if (selectedCenter) {
            loadStudentsAndAttendance();
        }
    }, [selectedCenter, selectedDate]);

    async function loadCenters() {
        try {
            const allCenters = await getAllCenters();
            setCenters(allCenters);
            if (allCenters.length > 0) {
                setSelectedCenter(allCenters[0].id!);
            }
        } catch (error) {
            console.error('Failed to load centers:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function loadStudentsAndAttendance() {
        if (!selectedCenter) return;

        try {
            const [centerStudents, attendanceRecords] = await Promise.all([
                getActiveStudentsByCenter(Number(selectedCenter)),
                getAttendanceByDate(Number(selectedCenter), selectedDate),
            ]);

            // Merge attendance data with students
            const studentsWithAttendance = centerStudents.map((student) => {
                const record = attendanceRecords.find((r) => r.studentId === student.id);
                return {
                    ...student,
                    attendance: record?.status,
                };
            });

            setStudents(studentsWithAttendance);
            setHasChanges(false);
        } catch (error) {
            console.error('Failed to load students:', error);
        }
    }

    function handleStatusChange(studentId: number, status: AttendanceStatus) {
        setStudents((prev) =>
            prev.map((s) =>
                s.id === studentId ? { ...s, attendance: status } : s
            )
        );
        setHasChanges(true);
    }

    function markAllAs(status: AttendanceStatus) {
        setStudents((prev) =>
            prev.map((s) => ({ ...s, attendance: status }))
        );
        setHasChanges(true);
    }

    async function saveAttendance() {
        if (!selectedCenter) return;

        setIsSaving(true);
        try {
            for (const student of students) {
                if (student.attendance) {
                    await markAttendance(
                        student.id!,
                        Number(selectedCenter),
                        selectedDate,
                        student.attendance
                    );
                }
            }
            setHasChanges(false);
        } catch (error) {
            console.error('Failed to save attendance:', error);
        } finally {
            setIsSaving(false);
        }
    }

    const attendanceStats = {
        present: students.filter((s) => s.attendance === 'present').length,
        absent: students.filter((s) => s.attendance === 'absent').length,
        late: students.filter((s) => s.attendance === 'late').length,
        excused: students.filter((s) => s.attendance === 'excused').length,
        unmarked: students.filter((s) => !s.attendance).length,
    };

    if (isLoading) {
        return (
            <div>
                <div className="page-header">
                    <h1 className="page-title">Attendance</h1>
                    <p className="page-subtitle">Loading...</p>
                </div>
            </div>
        );
    }

    if (centers.length === 0) {
        return (
            <div>
                <div className="page-header">
                    <h1 className="page-title">Attendance</h1>
                    <p className="page-subtitle">Track student attendance</p>
                </div>
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <AlertCircle size={40} />
                        </div>
                        <h3 className="empty-state-title">No Centers Yet</h3>
                        <p className="empty-state-text">
                            You need to create centers and add students before tracking attendance.
                        </p>
                        <a href="/centers" className="btn btn-primary">
                            Add Center First
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 className="page-title">Attendance</h1>
                    <p className="page-subtitle">Track student attendance for each session</p>
                </div>
                <button
                    className="btn btn-success"
                    onClick={saveAttendance}
                    disabled={!hasChanges || isSaving}
                >
                    <Save size={18} />
                    {isSaving ? 'Saving...' : 'Save Attendance'}
                </button>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
                        <label className="form-label">Center</label>
                        <select
                            className="form-select"
                            value={selectedCenter}
                            onChange={(e) => setSelectedCenter(Number(e.target.value))}
                        >
                            {centers.map((center) => (
                                <option key={center.id} value={center.id}>
                                    {center.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, minWidth: '180px' }}>
                        <label className="form-label">Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => markAllAs('present')}>
                            Mark All Present
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => markAllAs('absent')}>
                            Mark All Absent
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card">
                    <div className="stat-icon success">
                        <Check size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{attendanceStats.present}</div>
                        <div className="stat-label">Present</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon danger">
                        <X size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{attendanceStats.absent}</div>
                        <div className="stat-label">Absent</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon warning">
                        <Clock size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{attendanceStats.late}</div>
                        <div className="stat-label">Late</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon info">
                        <Calendar size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{attendanceStats.excused}</div>
                        <div className="stat-label">Excused</div>
                    </div>
                </div>
            </div>

            {/* Student List */}
            {students.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <AlertCircle size={40} />
                        </div>
                        <h3 className="empty-state-title">No Students in This Center</h3>
                        <p className="empty-state-text">
                            Add students to this center to start tracking attendance.
                        </p>
                        <a href="/students" className="btn btn-primary">
                            Add Students
                        </a>
                    </div>
                </div>
            ) : (
                <div className="attendance-grid">
                    {students.map((student) => (
                        <div key={student.id} className="attendance-row">
                            <div
                                style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: 'var(--radius-full)',
                                    background: 'var(--accent-gradient)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: '600',
                                    flexShrink: 0,
                                }}
                            >
                                {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="attendance-row-info">
                                <div className="attendance-row-name">{student.name}</div>
                                {student.phone && (
                                    <div className="attendance-row-meta">{student.phone}</div>
                                )}
                            </div>
                            <div className="attendance-status-group">
                                <button
                                    className={`attendance-btn present ${student.attendance === 'present' ? 'active' : ''}`}
                                    onClick={() => handleStatusChange(student.id!, 'present')}
                                >
                                    <Check size={16} /> Present
                                </button>
                                <button
                                    className={`attendance-btn absent ${student.attendance === 'absent' ? 'active' : ''}`}
                                    onClick={() => handleStatusChange(student.id!, 'absent')}
                                >
                                    <X size={16} /> Absent
                                </button>
                                <button
                                    className={`attendance-btn late ${student.attendance === 'late' ? 'active' : ''}`}
                                    onClick={() => handleStatusChange(student.id!, 'late')}
                                >
                                    <Clock size={16} /> Late
                                </button>
                                <button
                                    className={`attendance-btn excused ${student.attendance === 'excused' ? 'active' : ''}`}
                                    onClick={() => handleStatusChange(student.id!, 'excused')}
                                >
                                    Excused
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Unsaved Changes Warning */}
            {hasChanges && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '80px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--warning)',
                        color: 'white',
                        padding: '12px 24px',
                        borderRadius: 'var(--radius-full)',
                        boxShadow: 'var(--shadow-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        zIndex: 50,
                    }}
                >
                    <AlertCircle size={18} />
                    You have unsaved changes
                </div>
            )}
        </div>
    );
}
