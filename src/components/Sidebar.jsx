import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white p-8 flex flex-col shadow-2xl z-50">
            <div className="mb-12">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-black text-xl">N</div>
                    <span className="text-xl font-black tracking-tight">NexusEnroll</span>
                </div>
                <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">Academic Control</p>
            </div>

            <nav className="flex-grow space-y-2">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full text-left px-6 py-4 rounded-2xl font-bold bg-white/10 text-white hover:bg-white/20 transition-all flex items-center gap-4 group"
                >
                    <span className="text-lg group-hover:scale-110 transition-transform">🏠</span>
                    Dashboard
                </button>
                {/* Add more links here if needed */}
            </nav>

            <div className="mt-auto pt-8 border-t border-white/10">
                <div className="flex items-center gap-4 mb-6 px-2">
                    <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center font-black text-sm uppercase">
                        {user?.username?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <p className="text-sm font-black truncate max-w-[120px]">{user?.username}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Session</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full px-6 py-4 rounded-2xl font-bold bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center gap-4 group"
                >
                    <span className="text-lg group-hover:rotate-12 transition-transform">Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
