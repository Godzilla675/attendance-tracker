import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    MapPin,
    Users,
    ClipboardCheck,
    FileBarChart,
    Settings,
    GraduationCap,
} from 'lucide-react';
import { useLanguage } from '../i18n';

interface LayoutProps {
    children: React.ReactNode;
}

const navItems = [
    { path: '/', icon: LayoutDashboard, labelKey: 'dashboard' as const },
    { path: '/centers', icon: MapPin, labelKey: 'centers' as const },
    { path: '/students', icon: Users, labelKey: 'students' as const },
    { path: '/attendance', icon: ClipboardCheck, labelKey: 'attendance' as const },
    { path: '/reports', icon: FileBarChart, labelKey: 'reports' as const },
    { path: '/settings', icon: Settings, labelKey: 'settings' as const },
];

export function Layout({ children }: LayoutProps) {
    const location = useLocation();
    const { t } = useLanguage();

    return (
        <div className="app-layout">
            {/* Desktop Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon">
                            <GraduationCap size={24} />
                        </div>
                        <h1>AttendX</h1>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            <item.icon size={20} />
                            <span>{t.nav[item.labelKey]}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="main-content">{children}</main>

            {/* Mobile Bottom Navigation */}
            <nav className="mobile-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={`mobile-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        <span>{t.nav[item.labelKey]}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
