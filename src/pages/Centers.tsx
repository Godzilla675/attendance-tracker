import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, MapPin, Users } from 'lucide-react';
import { Modal } from '../components/Modal';
import { NoCentersEmptyState } from '../components/EmptyState';
import {
    getAllCenters,
    addCenter,
    updateCenter,
    deleteCenter,
    getStudentCountByCenter,
} from '../db/db';
import { useLanguage } from '../i18n';
import { CENTER_COLORS, type Center } from '../types/types';

export function Centers() {
    const { t } = useLanguage();
    const [centers, setCenters] = useState<(Center & { studentCount: number })[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCenter, setEditingCenter] = useState<Center | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Form state
    const [formName, setFormName] = useState('');
    const [formAddress, setFormAddress] = useState('');
    const [formColor, setFormColor] = useState(CENTER_COLORS[0]);

    useEffect(() => {
        loadCenters();
    }, []);

    async function loadCenters() {
        try {
            const allCenters = await getAllCenters();
            const centersWithCounts = await Promise.all(
                allCenters.map(async (center) => {
                    const studentCount = await getStudentCountByCenter(center.id!);
                    return { ...center, studentCount };
                })
            );
            setCenters(centersWithCounts);
        } catch (error) {
            console.error('Failed to load centers:', error);
        } finally {
            setIsLoading(false);
        }
    }

    function openAddModal() {
        setEditingCenter(null);
        setFormName('');
        setFormAddress('');
        setFormColor(CENTER_COLORS[Math.floor(Math.random() * CENTER_COLORS.length)]);
        setIsModalOpen(true);
    }

    function openEditModal(center: Center) {
        setEditingCenter(center);
        setFormName(center.name);
        setFormAddress(center.address || '');
        setFormColor(center.color);
        setIsModalOpen(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!formName.trim()) return;

        try {
            if (editingCenter) {
                await updateCenter(editingCenter.id!, {
                    name: formName.trim(),
                    address: formAddress.trim() || undefined,
                    color: formColor,
                });
            } else {
                await addCenter({
                    name: formName.trim(),
                    address: formAddress.trim() || undefined,
                    color: formColor,
                });
            }

            setIsModalOpen(false);
            loadCenters();
        } catch (error) {
            console.error('Failed to save center:', error);
        }
    }

    async function handleDelete(id: number) {
        if (window.confirm(t.centers.confirmDelete)) {
            try {
                await deleteCenter(id);
                loadCenters();
            } catch (error) {
                console.error('Failed to delete center:', error);
            }
        }
    }

    const filteredCenters = centers.filter((center) =>
        center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        center.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div>
                <div className="page-header">
                    <h1 className="page-title">{t.centers.title}</h1>
                    <p className="page-subtitle">{t.centers.loading}</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">{t.centers.title}</h1>
                    <p className="page-subtitle">{t.centers.subtitle}</p>
                </div>
                <button className="btn btn-primary" onClick={openAddModal}>
                    <Plus size={18} />
                    {t.centers.addCenter}
                </button>
            </div>

            {centers.length === 0 ? (
                <NoCentersEmptyState onAdd={openAddModal} />
            ) : (
                <>
                    {/* Search */}
                    <div className="search-bar" style={{ marginBottom: '24px' }}>
                        <Search />
                        <input
                            type="text"
                            className="form-input"
                            placeholder={t.centers.searchCenters}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Centers Grid */}
                    <div className="grid-3">
                        {filteredCenters.map((center) => (
                            <div key={center.id} className="item-card">
                                <div
                                    className="item-card-icon"
                                    style={{ background: center.color }}
                                >
                                    <MapPin size={24} />
                                </div>
                                <div className="item-card-content">
                                    <div className="item-card-title">{center.name}</div>
                                    <div className="item-card-subtitle">
                                        {center.address || t.centers.noAddress}
                                    </div>
                                    <div className="item-card-subtitle" style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Users size={14} />
                                        {center.studentCount} {center.studentCount !== 1 ? t.centers.students : t.centers.student}
                                    </div>
                                </div>
                                <div className="item-card-actions">
                                    <button
                                        className="btn btn-ghost btn-icon btn-sm"
                                        onClick={() => openEditModal(center)}
                                        title={t.common.edit}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-icon btn-sm"
                                        onClick={() => handleDelete(center.id!)}
                                        title={t.common.delete}
                                        style={{ color: 'var(--danger)' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredCenters.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            {t.centers.noMatch}
                        </div>
                    )}
                </>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingCenter ? t.centers.editCenter : t.centers.addCenter}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                            {t.centers.cancel}
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit}>
                            {editingCenter ? t.centers.saveChanges : t.centers.addCenter}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">{t.centers.centerName} *</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder={t.centers.centerNamePlaceholder}
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">{t.centers.addressOptional}</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder={t.centers.addressPlaceholder}
                            value={formAddress}
                            onChange={(e) => setFormAddress(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">{t.centers.color}</label>
                        <div className="color-picker">
                            {CENTER_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`color-option ${formColor === color ? 'selected' : ''}`}
                                    style={{ background: color }}
                                    onClick={() => setFormColor(color)}
                                />
                            ))}
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
