import { MapPin, Users } from 'lucide-react';
import { useLanguage } from '../i18n';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="empty-state">
            <div className="empty-state-icon">{icon || <MapPin size={40} />}</div>
            <h3 className="empty-state-title">{title}</h3>
            <p className="empty-state-text">{description}</p>
            {action}
        </div>
    );
}

// Preset empty states
export function NoCentersEmptyState({ onAdd }: { onAdd: () => void }) {
    const { t } = useLanguage();
    return (
        <EmptyState
            icon={<MapPin size={40} />}
            title={t.centers.noCentersYet}
            description={t.centers.addFirstCenter}
            action={
                <button className="btn btn-primary" onClick={onAdd}>
                    {t.centers.addCenter}
                </button>
            }
        />
    );
}

export function NoStudentsEmptyState({ onAdd }: { onAdd: () => void }) {
    const { t } = useLanguage();
    return (
        <EmptyState
            icon={<Users size={40} />}
            title={t.students.noStudentsYet}
            description={t.students.addStudentsStart}
            action={
                <button className="btn btn-primary" onClick={onAdd}>
                    {t.students.addStudent}
                </button>
            }
        />
    );
}
