import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import Login from './components/Login';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
