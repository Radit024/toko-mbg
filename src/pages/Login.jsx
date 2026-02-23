import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
import { auth, googleProvider } from '../config/firebase';

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

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
            alert("Login Google Gagal: " + error.message);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[60] bg-white flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-sm">

                {/* Title */}
                <h2 className="text-3xl font-black text-slate-900 mb-6">
                    {isSignUp ? 'Buat Akun Baru' : 'Nice to see you again'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div>
                        <label className="block text-sm text-slate-500 mb-1.5">Login</label>
                        <input
                            type="email"
                            required
                            placeholder="Email or phone number"
                            className="w-full px-4 py-3 bg-slate-100 border border-transparent rounded-xl outline-none text-sm text-slate-700 placeholder:text-slate-400 focus:border-pink-400 focus:bg-white focus:ring-2 focus:ring-pink-100 transition-all"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm text-slate-500 mb-1.5">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                placeholder="Enter password"
                                className="w-full px-4 py-3 bg-slate-100 border border-transparent rounded-xl outline-none text-sm text-slate-700 placeholder:text-slate-400 focus:border-pink-400 focus:bg-white focus:ring-2 focus:ring-pink-100 transition-all pr-11"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Remember me + Forgot password */}
                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => setRememberMe(!rememberMe)}
                            className="flex items-center gap-2 select-none"
                        >
                            {/* Toggle switch */}
                            <div className={`relative w-10 h-6 rounded-full transition-colors ${rememberMe ? 'bg-pink-500' : 'bg-slate-200'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${rememberMe ? 'left-5' : 'left-1'}`} />
                            </div>
                            <span className="text-sm text-slate-600">Remember me</span>
                        </button>
                        <button type="button" className="text-sm text-pink-500 font-medium hover:underline">
                            Forgot password?
                        </button>
                    </div>

                    {/* Sign In button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-pink-200 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading
                            ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Memproses...</>
                            : isSignUp ? 'Sign up' : 'Sign in'
                        }
                    </button>
                </form>

                {/* Divider */}
                <div className="my-4" />

                {/* Google button */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    <GoogleIcon />
                    Or sign in with Google
                </button>

                {/* Sign up link */}
                <p className="text-center mt-5 text-sm text-slate-500">
                    {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                    <button onClick={() => setIsSignUp(!isSignUp)} className="text-pink-500 font-semibold hover:underline">
                        {isSignUp ? 'Sign in' : 'Sign up now'}
                    </button>
                </p>
            </div>
        </div>
    );
}
