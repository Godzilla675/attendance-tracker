import { MapPin, Users } from 'lucide-react';

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
    return (
        <EmptyState
            icon={<MapPin size={40} />}
            title="No Centers Yet"
            description="Add your first teaching center to get started."
            action={
                <button className="btn btn-primary" onClick={onAdd}>
                    Add Center
                </button>
            }
        />
    );
}

export function NoStudentsEmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <EmptyState
            icon={<Users size={40} />}
            title="No Students Yet"
            description="Add students to start tracking attendance."
            action={
                <button className="btn btn-primary" onClick={onAdd}>
                    Add Student
                </button>
            }
        />
    );
}
