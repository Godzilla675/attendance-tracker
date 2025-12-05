import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './i18n';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Centers } from './pages/Centers';
import { Students } from './pages/Students';
import { Attendance } from './pages/Attendance';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import './index.css';

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/centers" element={<Centers />} />
            <Route path="/students" element={<Students />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
