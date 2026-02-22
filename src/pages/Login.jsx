import React, { useState } from 'react';
import { ShoppingBasket, Mail, Lock, Eye, EyeOff, CheckSquare, Square, UserPlus, LogIn, Sparkles } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
import { auth, googleProvider } from '../config/firebase';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
                alert("Akun berhasil dibuat! Silakan masuk.");
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (error) {
            alert((isSignUp ? "Daftar Gagal: " : "Login Gagal: ") + error.message);
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Login Error:", error);
            alert("Login Google Gagal: " + error.message);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-50 flex animate-fade-in overflow-y-auto">
            {/* Left Panel (hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 to-slate-800 text-white flex-col items-center justify-center p-12 relative overflow-hidden">
                {/* decorative circles */}
                <div className="absolute -top-20 -left-20 w-72 h-72 bg-pink-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl" />

                <div className="relative z-10 text-center max-w-sm">
                    <div className="w-20 h-20 bg-gradient-to-tr from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mb-8 mx-auto shadow-xl shadow-pink-900/30">
                        <ShoppingBasket size={38} />
                    </div>
                    <h1 className="text-4xl font-black mb-3">Mutiara <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">Store</span></h1>
                    <p className="text-slate-400 leading-relaxed">Sistem manajemen toko modern — kelola penjualan, stok, dan laporan keuangan dengan mudah.</p>

                    <div className="mt-8 grid grid-cols-3 gap-3">
                        {[
                            { label: 'Penjualan', desc: 'POS Cepat' },
                            { label: 'Stok', desc: 'Inventaris' },
                            { label: 'Laporan', desc: 'Analitik' },
                        ].map(f => (
                            <div key={f.label} className="bg-white/5 border border-white/10 rounded-xl p-3">
                                <p className="font-bold text-sm">{f.label}</p>
                                <p className="text-slate-500 text-xs">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel (full width on mobile) */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6">
                {/* Mobile logo */}
                <div className="flex flex-col items-center mb-8 lg:hidden">
                    <div className="w-16 h-16 bg-gradient-to-tr from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pink-200 mb-3">
                        <ShoppingBasket size={30} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800">Mutiara <span className="text-pink-600">Store</span></h1>
                </div>

                <div className="w-full max-w-md">
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles size={14} className="text-pink-500" />
                            <span className="text-xs font-bold text-pink-500 uppercase tracking-widest">Selamat Datang</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-800">
                            {isSignUp ? 'Buat Akun Baru' : 'Masuk ke Akun'}
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                            {isSignUp ? 'Daftarkan toko Anda untuk mulai.' : 'Login dulu ya, buat kelola toko.'}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                        {/* Google Login */}
                        <button onClick={handleGoogleLogin} disabled={loading}
                            className="w-full py-3 border border-slate-200 rounded-xl font-semibold text-slate-700 text-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Masuk dengan Google
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="h-px bg-slate-100 flex-1" />
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">atau email</span>
                            <div className="h-px bg-slate-100 flex-1" />
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1"><Mail size={10} /> Email</label>
                                <input type="email" required placeholder="nama@email.com"
                                    className="input-modern"
                                    value={email} onChange={e => setEmail(e.target.value)} />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1"><Lock size={10} /> Password</label>
                                <div className="relative">
                                    <input type={showPassword ? 'text' : 'password'} required placeholder="Masukkan password"
                                        className="input-modern pr-11"
                                        value={password} onChange={e => setPassword(e.target.value)} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setRememberMe(!rememberMe)}>
                                {rememberMe
                                    ? <CheckSquare size={18} className="text-pink-600 flex-shrink-0" />
                                    : <Square size={18} className="text-slate-300 flex-shrink-0" />}
                                <span className="text-sm text-slate-600">Ingat saya (tetap login)</span>
                            </div>

                            <button type="submit" disabled={loading}
                                className="w-full py-3.5 bg-gradient-to-r from-pink-600 to-rose-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-md shadow-pink-200 flex items-center justify-center gap-2 disabled:opacity-50">
                                {loading
                                    ? <span className="flex items-center gap-2"><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Memproses...</span>
                                    : isSignUp
                                        ? <><UserPlus size={16} /> Buat Akun</>
                                        : <><LogIn size={16} /> Masuk Aplikasi</>
                                }
                            </button>
                        </form>
                    </div>

                    <p className="text-center mt-4 text-sm text-slate-500">
                        {isSignUp ? 'Sudah punya akun? ' : 'Belum punya akun? '}
                        <button onClick={() => setIsSignUp(!isSignUp)} className="text-pink-600 font-bold hover:underline">
                            {isSignUp ? 'Login di sini' : 'Daftar sekarang'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
