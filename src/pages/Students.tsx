import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, Phone, AlertCircle } from 'lucide-react';
import { Modal } from '../components/Modal';
import { NoStudentsEmptyState } from '../components/EmptyState';
import {
    getAllStudents,
    addStudent,
    updateStudent,
    deleteStudent,
    getAllCenters,
    getAttendanceRateForStudent,
} from '../db/db';
import type { Student, Center } from '../types/types';

export function Students() {
    const [students, setStudents] = useState<(Student & { attendanceRate: number; centerName: string; centerColor: string })[]>([]);
    const [centers, setCenters] = useState<Center[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCenter, setFilterCenter] = useState<number | 'all'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Form state
    const [formName, setFormName] = useState('');
    const [formCenterId, setFormCenterId] = useState<number | ''>('');
    const [formPhone, setFormPhone] = useState('');
    const [formParentPhone, setFormParentPhone] = useState('');
    const [formNotes, setFormNotes] = useState('');
    const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [allStudents, allCenters] = await Promise.all([
                getAllStudents(),
                getAllCenters(),
            ]);
            setCenters(allCenters);

            // Enrich students with attendance rates and center info
            const enrichedStudents = await Promise.all(
                allStudents.map(async (student) => {
                    const attendanceRate = await getAttendanceRateForStudent(student.id!);
                    const center = allCenters.find((c) => c.id === student.centerId);
                    return {
                        ...student,
                        attendanceRate,
                        centerName: center?.name || 'Unknown',
                        centerColor: center?.color || '#6b6b7d',
                    };
                })
            );

            setStudents(enrichedStudents);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    }

    function openAddModal() {
        setEditingStudent(null);
        setFormName('');
        setFormCenterId(centers[0]?.id || '');
        setFormPhone('');
        setFormParentPhone('');
        setFormNotes('');
        setFormStatus('active');
        setIsModalOpen(true);
    }

    function openEditModal(student: Student) {
        setEditingStudent(student);
        setFormName(student.name);
        setFormCenterId(student.centerId);
        setFormPhone(student.phone || '');
        setFormParentPhone(student.parentPhone || '');
        setFormNotes(student.notes || '');
        setFormStatus(student.status);
        setIsModalOpen(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!formName.trim() || !formCenterId) return;

        try {
            if (editingStudent) {
                await updateStudent(editingStudent.id!, {
                    name: formName.trim(),
                    centerId: Number(formCenterId),
                    phone: formPhone.trim() || undefined,
                    parentPhone: formParentPhone.trim() || undefined,
                    notes: formNotes.trim() || undefined,
                    status: formStatus,
                });
            } else {
                await addStudent({
                    name: formName.trim(),
                    centerId: Number(formCenterId),
                    phone: formPhone.trim() || undefined,
                    parentPhone: formParentPhone.trim() || undefined,
                    notes: formNotes.trim() || undefined,
                    status: formStatus,
                });
            }

            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error('Failed to save student:', error);
        }
    }

    async function handleDelete(id: number) {
        if (window.confirm('Are you sure you want to delete this student? All attendance records for this student will also be deleted.')) {
            try {
                await deleteStudent(id);
                loadData();
            } catch (error) {
                console.error('Failed to delete student:', error);
            }
        }
    }

    const filteredStudents = students.filter((student) => {
        const matchesSearch =
            student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.phone?.includes(searchQuery) ||
            student.parentPhone?.includes(searchQuery);
        const matchesCenter = filterCenter === 'all' || student.centerId === filterCenter;
        return matchesSearch && matchesCenter;
    });

    if (isLoading) {
        return (
            <div>
                <div className="page-header">
                    <h1 className="page-title">Students</h1>
                    <p className="page-subtitle">Loading...</p>
                </div>
            </div>
        );
    }

    if (centers.length === 0) {
        return (
            <div>
                <div className="page-header">
                    <h1 className="page-title">Students</h1>
                    <p className="page-subtitle">Manage your students</p>
                </div>
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <AlertCircle size={40} />
                        </div>
                        <h3 className="empty-state-title">No Centers Yet</h3>
                        <p className="empty-state-text">
                            You need to create at least one center before adding students.
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
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">Students</h1>
                    <p className="page-subtitle">Manage your students across all centers</p>
                </div>
                <button className="btn btn-primary" onClick={openAddModal}>
                    <Plus size={18} />
                    Add Student
                </button>
            </div>

            {students.length === 0 ? (
                <NoStudentsEmptyState onAdd={openAddModal} />
            ) : (
                <>
                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                        <div className="search-bar" style={{ flex: 1, minWidth: '200px' }}>
                            <Search />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <select
                            className="form-select"
                            style={{ width: 'auto', minWidth: '180px' }}
                            value={filterCenter}
                            onChange={(e) => setFilterCenter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        >
                            <option value="all">All Centers</option>
                            {centers.map((center) => (
                                <option key={center.id} value={center.id}>
                                    {center.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Students Table */}
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Center</th>
                                    <th>Phone</th>
                                    <th>Attendance</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((student) => (
                                    <tr key={student.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div
                                                    style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: 'var(--radius-full)',
                                                        background: 'var(--accent-gradient)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: 'white',
                                                        fontWeight: '600',
                                                    }}
                                                >
                                                    {student.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '500' }}>{student.name}</div>
                                                    {student.notes && (
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                            {student.notes}
                                                        </div>
                                                    )}
                                                </div>
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
                                        <td>
                                            {student.phone ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                                                    {student.phone}
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)' }}>—</span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div
                                                    className="progress-bar"
                                                    style={{ width: '60px', height: '6px' }}
                                                >
                                                    <div
                                                        className="progress-bar-fill"
                                                        style={{
                                                            width: `${student.attendanceRate}%`,
                                                            background:
                                                                student.attendanceRate >= 80
                                                                    ? 'var(--success)'
                                                                    : student.attendanceRate >= 50
                                                                        ? 'var(--warning)'
                                                                        : 'var(--danger)',
                                                        }}
                                                    />
                                                </div>
                                                <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                                                    {student.attendanceRate}%
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${student.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    className="btn btn-ghost btn-icon btn-sm"
                                                    onClick={() => openEditModal(student)}
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className="btn btn-ghost btn-icon btn-sm"
                                                    onClick={() => handleDelete(student.id!)}
                                                    title="Delete"
                                                    style={{ color: 'var(--danger)' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredStudents.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            No students match your search.
                        </div>
                    )}
                </>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingStudent ? 'Edit Student' : 'Add Student'}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit}>
                            {editingStudent ? 'Save Changes' : 'Add Student'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Student Name *</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter student name"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Center *</label>
                        <select
                            className="form-select"
                            value={formCenterId}
                            onChange={(e) => setFormCenterId(Number(e.target.value))}
                            required
                        >
                            <option value="">Select a center</option>
                            {centers.map((center) => (
                                <option key={center.id} value={center.id}>
                                    {center.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Phone (Optional)</label>
                            <input
                                type="tel"
                                className="form-input"
                                placeholder="Student's phone"
                                value={formPhone}
                                onChange={(e) => setFormPhone(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Parent Phone (Optional)</label>
                            <input
                                type="tel"
                                className="form-input"
                                placeholder="Parent's phone"
                                value={formParentPhone}
                                onChange={(e) => setFormParentPhone(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Notes (Optional)</label>
                        <textarea
                            className="form-textarea"
                            placeholder="Any notes about this student..."
                            value={formNotes}
                            onChange={(e) => setFormNotes(e.target.value)}
                            style={{ minHeight: '80px' }}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <div className="tabs" style={{ marginBottom: 0 }}>
                            <button
                                type="button"
                                className={`tab ${formStatus === 'active' ? 'active' : ''}`}
                                onClick={() => setFormStatus('active')}
                            >
                                Active
                            </button>
                            <button
                                type="button"
                                className={`tab ${formStatus === 'inactive' ? 'active' : ''}`}
                                onClick={() => setFormStatus('inactive')}
                            >
                                Inactive
                            </button>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
