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

interface LayoutProps {
    children: React.ReactNode;
}

const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/centers', icon: MapPin, label: 'Centers' },
    { path: '/students', icon: Users, label: 'Students' },
    { path: '/attendance', icon: ClipboardCheck, label: 'Attendance' },
    { path: '/reports', icon: FileBarChart, label: 'Reports' },
    { path: '/settings', icon: Settings, label: 'Settings' },
];

export function Layout({ children }: LayoutProps) {
    const location = useLocation();

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
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="main-content">{children}</main>

            {/* Mobile Bottom Navigation */}
            <nav className="mobile-nav">
                {navItems.slice(0, 5).map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={`mobile-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
