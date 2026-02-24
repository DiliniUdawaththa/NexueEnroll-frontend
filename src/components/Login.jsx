import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(username, password);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
            <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8 backdrop-blur-sm">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-white mb-2">NexusEnroll</h1>
                    <p className="text-slate-400">Sign in to access your portal</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 transform active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>

{/*                     <div className="pt-4 text-center "> */}
{/*                         <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-4">Demo Credentials</p> */}
{/*                         <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400"> */}
{/*                             <div className="bg-slate-700/30 p-2 rounded-lg border border-slate-700"> */}
{/*                                 <p className="text-white font-bold">Admin</p> */}
{/*                                 <p>admin / admin123</p> */}
{/*                             </div> */}
{/*                             <div className="bg-slate-700/30 p-2 rounded-lg border border-slate-700"> */}
{/*                                 <p className="text-white font-bold">Student</p> */}
{/*                                 <p>kasun.p / student123</p> */}
{/*                             </div> */}
{/*                             <div className="bg-slate-700/30 p-2 rounded-lg border border-slate-700"> */}
{/*                                 <p className="text-white font-bold">Faculty</p> */}
{/*                                 <p>rohan.g / faculty123</p> */}
{/*                             </div> */}
{/*                         </div> */}
{/*                     </div> */}
                </form>
            </div>
        </div>
    );
};

export default Login;
