import React, { useEffect, useState } from 'react';

const Notification = ({ message }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (message) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    if (!message || !visible) return null;

    const isError = message.type === 'error';

    return (
        <div className={`fixed top-8 right-8 z-[100] animate-in fade-in slide-in-from-top-10 duration-500`}>
            <div className={`
                flex items-center gap-4 px-6 py-4 rounded-3xl shadow-2xl border backdrop-blur-md
                ${isError
                    ? 'bg-rose-500/90 border-rose-400 text-white'
                    : 'bg-emerald-500/90 border-emerald-400 text-white'}
            `}>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                    {isError ? '!' : '✓'}
                </div>
                <div>
                    <p className="text-xs font-black uppercase tracking-wider opacity-70 mb-0.5">
                        {isError ? 'System Alert' : 'Success'}
                    </p>
                    <p className="font-bold text-sm tracking-tight">{message.text || message}</p>
                </div>
                <button onClick={() => setVisible(false)} className="ml-4 hover:scale-125 transition-transform">×</button>
            </div>
        </div>
    );
};

export default Notification;
