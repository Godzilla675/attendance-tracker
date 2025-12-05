import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Users,
    MapPin,
    UserCheck,
    UserX,
    TrendingUp,
    Clock,
    Plus,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import {
    getCenterCount,
    getStudentCount,
    getTodayAttendanceStats,
    getAllCenters,
    getActiveStudentsByCenter,
} from '../db/db';
import { useLanguage } from '../i18n';
import type { Center } from '../types/types';

export function Dashboard() {
    const { t } = useLanguage();
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalCenters: 0,
        presentToday: 0,
        absentToday: 0,
        attendanceRate: 0,
    });
    const [centers, setCenters] = useState<(Center & { studentCount: number })[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const [centerCount, studentCount, todayStats, allCenters] = await Promise.all([
                getCenterCount(),
                getStudentCount(),
                getTodayAttendanceStats(today),
                getAllCenters(),
            ]);

            // Get student counts per center
            const centersWithCounts = await Promise.all(
                allCenters.map(async (center) => {
                    const students = await getActiveStudentsByCenter(center.id!);
                    return { ...center, studentCount: students.length };
                })
            );

            const attendanceRate =
                todayStats.total > 0
                    ? Math.round(((todayStats.present + todayStats.late) / todayStats.total) * 100)
                    : 0;

            setStats({
                totalStudents: studentCount,
                totalCenters: centerCount,
                presentToday: todayStats.present + todayStats.late,
                absentToday: todayStats.absent,
                attendanceRate,
            });
            setCenters(centersWithCounts);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    }

    if (isLoading) {
        return (
            <div>
                <div className="page-header">
                    <h1 className="page-title">{t.dashboard.title}</h1>
                    <p className="page-subtitle">{t.dashboard.loading}</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">{t.dashboard.title}</h1>
                <p className="page-subtitle">
                    {t.dashboard.subtitle}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <StatCard
                    icon={Users}
                    value={stats.totalStudents}
                    label={t.dashboard.totalStudents}
                    variant="primary"
                />
                <StatCard
                    icon={MapPin}
                    value={stats.totalCenters}
                    label={t.dashboard.teachingCenters}
                    variant="info"
                />
                <StatCard
                    icon={UserCheck}
                    value={stats.presentToday}
                    label={t.dashboard.presentToday}
                    variant="success"
                />
                <StatCard
                    icon={UserX}
                    value={stats.absentToday}
                    label={t.dashboard.absentToday}
                    variant="danger"
                />
            </div>

            {/* Quick Actions & Centers */}
            <div className="grid-2">
                {/* Quick Actions */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">{t.dashboard.quickActions}</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <Link to="/attendance" className="btn btn-primary" style={{ width: '100%' }}>
                            <Clock size={18} />
                            {t.dashboard.takeAttendance}
                        </Link>
                        <Link to="/students" className="btn btn-secondary" style={{ width: '100%' }}>
                            <Plus size={18} />
                            {t.dashboard.addStudent}
                        </Link>
                        <Link to="/centers" className="btn btn-secondary" style={{ width: '100%' }}>
                            <MapPin size={18} />
                            {t.dashboard.addCenter}
                        </Link>
                    </div>
                </div>

                {/* Attendance Rate */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">{t.dashboard.todayAttendanceRate}</h3>
                        <TrendingUp size={20} style={{ color: 'var(--success)' }} />
                    </div>
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div
                            style={{
                                fontSize: '3.5rem',
                                fontWeight: '700',
                                background: 'var(--accent-gradient)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            {stats.attendanceRate}%
                        </div>
                        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                            {stats.presentToday} {t.dashboard.studentsPresent} {stats.presentToday + stats.absentToday}
                        </p>
                    </div>
                    <div className="progress-bar">
                        <div
                            className="progress-bar-fill"
                            style={{
                                width: `${stats.attendanceRate}%`,
                                background: 'var(--accent-gradient)',
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Centers Overview */}
            <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header">
                    <h3 className="card-title">{t.dashboard.yourCenters}</h3>
                    <Link to="/centers" className="btn btn-ghost btn-sm">
                        {t.dashboard.viewAll}
                    </Link>
                </div>
                {centers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        <MapPin size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                        <p>{t.dashboard.addFirstCenter}</p>
                        <Link to="/centers" className="btn btn-primary btn-sm" style={{ marginTop: '16px' }}>
                            {t.dashboard.addCenter}
                        </Link>
                    </div>
                ) : (
                    <div className="grid-3" style={{ marginTop: '8px' }}>
                        {centers.slice(0, 6).map((center) => (
                            <div
                                key={center.id}
                                className="item-card"
                                style={{ cursor: 'default' }}
                            >
                                <div
                                    className="item-card-icon"
                                    style={{ background: center.color }}
                                >
                                    {center.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="item-card-content">
                                    <div className="item-card-title">{center.name}</div>
                                    <div className="item-card-subtitle">
                                        {center.studentCount} {center.studentCount !== 1 ? t.dashboard.students : t.dashboard.student}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
