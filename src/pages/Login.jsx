import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Store } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
import { auth, googleProvider } from '../config/firebase';

const GoogleIcon = () => (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

const inputCls = "w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm text-slate-700 placeholder:text-slate-400 focus:border-pink-400 focus:bg-white focus:ring-2 focus:ring-pink-100 transition-all";

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await setPersistence(auth, browserLocalPersistence);
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
                alert("Akun berhasil dibuat! Silakan masuk.");
                setIsSignUp(false);
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
            await setPersistence(auth, browserLocalPersistence);
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            alert("Login Google Gagal: " + error.message);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[60] font-sans flex items-center justify-center p-4 overflow-y-auto"
            style={{ background: 'linear-gradient(135deg, #fce7f3 0%, #fdf2f8 50%, #fff1f2 100%)' }}>

            {/* Card */}
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl shadow-slate-200/60 px-8 py-9">

                {/* Logo + Title */}
                <div className="flex flex-col items-center mb-7">
                    <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-pink-200">
                        <Store size={28} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900">Toko MBG</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        {isSignUp ? 'Buat akun baru untuk mulai.' : 'Selamat datang kembali!'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1.5">Email / No. HP</label>
                        <div className="relative">
                            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="email"
                                required
                                placeholder="nama@email.com"
                                className={inputCls}
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-sm font-medium text-slate-600">Kata Sandi</label>
                            <button type="button" className="text-xs text-pink-500 font-medium hover:underline">
                                Lupa Password?
                            </button>
                        </div>
                        <div className="relative">
                            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                placeholder="Masukkan kata sandi"
                                className={`${inputCls} pr-11`}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-[.98] text-white rounded-2xl font-bold text-sm transition-all shadow-md shadow-pink-200 disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
                    >
                        {loading
                            ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Memproses...</>
                            : isSignUp ? 'Daftar' : 'Masuk'
                        }
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3 my-5">
                    <div className="h-px bg-slate-100 flex-1" />
                    <span className="text-xs text-slate-400 font-semibold tracking-widest">ATAU</span>
                    <div className="h-px bg-slate-100 flex-1" />
                </div>

                {/* Google */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full py-3 border border-slate-200 bg-white hover:bg-slate-50 active:scale-[.98] text-slate-700 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    <GoogleIcon />
                    Masuk dengan Google
                </button>

                {/* Sign up */}
                <p className="text-center mt-5 text-sm text-slate-500">
                    {isSignUp ? 'Sudah punya akun? ' : 'Belum punya akun? '}
                    <button onClick={() => setIsSignUp(!isSignUp)} className="text-pink-500 font-semibold hover:underline">
                        {isSignUp ? 'Masuk' : 'Daftar Sekarang'}
                    </button>
                </p>
            </div>
        </div>
    );
}
