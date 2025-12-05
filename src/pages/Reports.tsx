import { useEffect, useState } from 'react';
import { Download, FileText, Calendar, Filter } from 'lucide-react';
import {
    getAllCenters,
    getAllStudents,
    getAttendanceByStudent,
} from '../db/db';
import { exportCSV } from '../utils/fileExport';
import type { Center, Student, AttendanceRecord } from '../types/types';

interface StudentReport extends Student {
    centerName: string;
    centerColor: string;
    records: AttendanceRecord[];
    stats: {
        present: number;
        absent: number;
        late: number;
        excused: number;
        total: number;
        rate: number;
    };
}

export function Reports() {
    const { t } = useLanguage();
    const [centers, setCenters] = useState<Center[]>([]);
    const [students, setStudents] = useState<StudentReport[]>([]);
    const [filterCenter, setFilterCenter] = useState<number | 'all'>('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Set default date range (last 30 days)
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        setDateTo(today.toISOString().split('T')[0]);
        setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);

        loadData();
    }, []);

    async function loadData() {
        try {
            const [allCenters, allStudents] = await Promise.all([
                getAllCenters(),
                getAllStudents(),
            ]);
            setCenters(allCenters);

            // Get attendance for each student
            const studentReports = await Promise.all(
                allStudents.map(async (student) => {
                    const records = await getAttendanceByStudent(student.id!);
                    const center = allCenters.find((c) => c.id === student.centerId);

                    // Calculate stats
                    const stats = {
                        present: records.filter((r) => r.status === 'present').length,
                        absent: records.filter((r) => r.status === 'absent').length,
                        late: records.filter((r) => r.status === 'late').length,
                        excused: records.filter((r) => r.status === 'excused').length,
                        total: records.length,
                        rate: 0,
                    };
                    stats.rate = stats.total > 0
                        ? Math.round(((stats.present + stats.late) / stats.total) * 100)
                        : 0;

                    return {
                        ...student,
                        centerName: center?.name || 'Unknown',
                        centerColor: center?.color || '#6b6b7d',
                        records,
                        stats,
                    };
                })
            );

            setStudents(studentReports);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    }

    function filterRecordsByDate(records: AttendanceRecord[]): AttendanceRecord[] {
        if (!dateFrom && !dateTo) return records;

        return records.filter((r) => {
            if (dateFrom && r.date < dateFrom) return false;
            if (dateTo && r.date > dateTo) return false;
            return true;
        });
    }

    function getFilteredStudents(): StudentReport[] {
        return students
            .filter((s) => filterCenter === 'all' || s.centerId === filterCenter)
            .map((student) => {
                const filteredRecords = filterRecordsByDate(student.records);
                const stats = {
                    present: filteredRecords.filter((r) => r.status === 'present').length,
                    absent: filteredRecords.filter((r) => r.status === 'absent').length,
                    late: filteredRecords.filter((r) => r.status === 'late').length,
                    excused: filteredRecords.filter((r) => r.status === 'excused').length,
                    total: filteredRecords.length,
                    rate: 0,
                };
                stats.rate = stats.total > 0
                    ? Math.round(((stats.present + stats.late) / stats.total) * 100)
                    : 0;

                return { ...student, stats };
            });
    }

    async function exportToCSV() {
        const filteredStudents = getFilteredStudents();
        const headers = ['Name', 'Center', 'Present', 'Absent', 'Late', 'Excused', 'Total Sessions', 'Attendance Rate'];
        const rows = filteredStudents.map((s) => [
            s.name,
            s.centerName,
            s.stats.present,
            s.stats.absent,
            s.stats.late,
            s.stats.excused,
            s.stats.total,
            `${s.stats.rate}%`,
        ]);

        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const filename = `attendance-report-${dateFrom || 'all'}-to-${dateTo || 'all'}.csv`;
        await exportCSV(csv, filename);
    }

    const filteredStudents = getFilteredStudents();
    const overallStats = {
        totalSessions: filteredStudents.reduce((sum, s) => sum + s.stats.total, 0),
        avgRate: filteredStudents.length > 0
            ? Math.round(filteredStudents.reduce((sum, s) => sum + s.stats.rate, 0) / filteredStudents.length)
            : 0,
    };

    if (isLoading) {
        return (
            <div>
                <div className="page-header">
                    <h1 className="page-title">{t.reports.title}</h1>
                    <p className="page-subtitle">{t.reports.loading}</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 className="page-title">{t.reports.title}</h1>
                    <p className="page-subtitle">{t.reports.subtitle}</p>
                </div>
                <button className="btn btn-primary" onClick={exportToCSV}>
                    <Download size={18} />
                    {t.reports.exportCSV}
                </button>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Filter size={18} style={{ color: 'var(--text-muted)' }} />
                    <h3 className="card-title" style={{ marginBottom: 0 }}>{t.reports.filters}</h3>
                </div>
                <div className="filter-row" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ marginBottom: 0, flex: '1 1 auto' }}>
                        <label className="form-label">Center</label>
                        <select
                            className="form-select"
                            value={filterCenter}
                            onChange={(e) => setFilterCenter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        >
                            <option value="all">{t.reports.allCenters}</option>
                            {centers.map((center) => (
                                <option key={center.id} value={center.id}>
                                    {center.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, flex: '1 1 auto' }}>
                        <label className="form-label">From Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, flex: '1 1 auto' }}>
                        <label className="form-label">To Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Overall Stats */}
            <div className="grid-2" style={{ marginBottom: '24px' }}>
                <div className="stat-card">
                    <div className="stat-icon primary">
                        <FileText size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{overallStats.totalSessions}</div>
                        <div className="stat-label">{t.reports.totalAttendanceRecords}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon success">
                        <Calendar size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{overallStats.avgRate}%</div>
                        <div className="stat-label">{t.reports.averageAttendanceRate}</div>
                    </div>
                </div>
            </div>

            {/* Report Table */}
            {filteredStudents.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <FileText size={40} />
                        </div>
                        <h3 className="empty-state-title">{t.reports.noDataAvailable}</h3>
                        <p className="empty-state-text">
                            {t.reports.noRecordsFound}
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Mobile Card View */}
                    <div className="reports-mobile-cards">
                        {filteredStudents.map((student) => (
                            <div key={student.id} className="card" style={{ marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
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
                                            fontSize: '1rem',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {student.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: '600', marginBottom: '2px' }}>{student.name}</div>
                                        <span className="center-badge">
                                            <span
                                                className="center-badge-dot"
                                                style={{ background: student.centerColor }}
                                            />
                                            {student.centerName}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <span className="badge badge-success" style={{ marginBottom: '4px' }}>{student.stats.present}</span>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Present</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <span className="badge badge-danger" style={{ marginBottom: '4px' }}>{student.stats.absent}</span>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Absent</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <span className="badge badge-warning" style={{ marginBottom: '4px' }}>{student.stats.late}</span>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Late</div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <span className="badge badge-info" style={{ marginBottom: '4px' }}>{student.stats.excused}</span>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Excused</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        {student.stats.total} sessions
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div className="progress-bar" style={{ height: '8px' }}>
                                            <div
                                                className="progress-bar-fill"
                                                style={{
                                                    width: `${student.stats.rate}%`,
                                                    background:
                                                        student.stats.rate >= 80
                                                            ? 'var(--success)'
                                                            : student.stats.rate >= 50
                                                                ? 'var(--warning)'
                                                                : 'var(--danger)',
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <span style={{ fontWeight: '600', minWidth: '45px' }}>
                                        {student.stats.rate}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="reports-desktop-table">
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Center</th>
                                        <th style={{ textAlign: 'center' }}>Present</th>
                                        <th style={{ textAlign: 'center' }}>Absent</th>
                                        <th style={{ textAlign: 'center' }}>Late</th>
                                        <th style={{ textAlign: 'center' }}>Excused</th>
                                        <th style={{ textAlign: 'center' }}>Total</th>
                                        <th>Attendance Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map((student) => (
                                        <tr key={student.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div
                                                        style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: 'var(--radius-full)',
                                                            background: 'var(--accent-gradient)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'white',
                                                            fontWeight: '600',
                                                            fontSize: '0.9rem',
                                                        }}
                                                    >
                                                        {student.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span style={{ fontWeight: '500' }}>{student.name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="center-badge">
                                                    <span
                                                        className="center-badge-dot"
                                                        style={{ background: student.centerColor }}
                                                    />
                                                    {student.centerName}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className="badge badge-success">{student.stats.present}</span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className="badge badge-danger">{student.stats.absent}</span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className="badge badge-warning">{student.stats.late}</span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className="badge badge-info">{student.stats.excused}</span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className="badge badge-neutral">{student.stats.total}</span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div className="progress-bar" style={{ width: '80px', height: '8px' }}>
                                                        <div
                                                            className="progress-bar-fill"
                                                            style={{
                                                                width: `${student.stats.rate}%`,
                                                                background:
                                                                    student.stats.rate >= 80
                                                                        ? 'var(--success)'
                                                                        : student.stats.rate >= 50
                                                                            ? 'var(--warning)'
                                                                            : 'var(--danger)',
                                                            }}
                                                        />
                                                    </div>
                                                    <span style={{ fontWeight: '600', minWidth: '45px' }}>
                                                        {student.stats.rate}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
