import React, { useEffect, useState } from 'react';

const SplashScreen = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, 3500);

        const progressTimer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) return 100;
                return prev + 1;
            });
        }, 30);

        return () => {
            clearTimeout(timer);
            clearInterval(progressTimer);
        };
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center overflow-hidden">
            {/* Animated Background Elements - Subtler for white theme */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-50 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-50 rounded-full blur-[100px] animate-bounce" style={{ animationDuration: '8s' }}></div>

            <div className="relative flex flex-col items-center">
                {/* Logo or Icon */}
                <div className="mb-8 relative">
                    <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-3xl rotate-12 animate-float shadow-2xl shadow-blue-500/20 flex items-center justify-center border border-white/20">
                        <span className="text-white text-4xl font-black -rotate-12 italic">AL</span>
                    </div>
                    <div className="absolute -inset-2 bg-blue-400/10 blur-xl rounded-full animate-pulse"></div>
                </div>

                {/* Animated Text */}
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-600 mb-2 drop-shadow-sm">
                    AL-IMRAN <span className="text-blue-600 italic">LABORATORY</span>
                </h1>

                <p className="text-slate-500 font-bold tracking-[0.4em] uppercase text-[10px] mb-12 opacity-0 animate-fade-in">
                    Advanced Diagnostic Excellence
                </p>

                {/* Progress Bar Container */}
                <div className="w-72 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200 relative shadow-inner">
                    <div
                        className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 transition-all duration-300 ease-out relative"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute top-0 right-0 h-full w-12 bg-white/30 blur-md"></div>
                    </div>
                </div>

                <div className="mt-5 text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                    System Initializing <span className="text-blue-600 ml-1">{progress}%</span>
                </div>
            </div>

            {/* Premium Styling */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(12deg); }
                    50% { transform: translateY(-15px) rotate(8deg); }
                }
                .animate-float {
                    animation: float 4s ease-in-out infinite;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 1.5s ease-out 0.5s forwards;
                }
            `}</style>
        </div>
    );
};

export default SplashScreen;
