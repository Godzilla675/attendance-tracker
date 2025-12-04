import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    icon: LucideIcon;
    value: string | number;
    label: string;
    variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

export function StatCard({ icon: Icon, value, label, variant = 'primary' }: StatCardProps) {
    return (
        <div className="stat-card">
            <div className={`stat-icon ${variant}`}>
                <Icon size={24} />
            </div>
            <div className="stat-content">
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
            </div>
        </div>
    );
}
