import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, Chrome, Loader2 } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login, signup, loginWithGoogle } = useAuth();

    const translateError = (message) => {
        // Conflicto de métodos (ej: intentar entrar con Google cuando se registró con Email)
        if (message.includes('account-exists-with-different-credential')) {
            return 'Este correo ya está vinculado a una cuenta con contraseña. Por favor, ingresa usando tu Email y Clave en lugar de Google.';
        }

        // Errores de credenciales (typos)
        if (message.includes('invalid-credential') || message.includes('wrong-password') || message.includes('user-not-found')) {
            return 'Correo o contraseña incorrectos. Verifica tus datos o el método de ingreso (Email vs Google).';
        }

        // Errores de registro
        if (message.includes('email-already-in-use')) {
            return 'Este correo ya tiene una cuenta activa. Si no recuerdas cómo entraste, intenta con el otro método (Google o Email).';
        }

        if (message.includes('weak-password')) {
            return 'La contraseña es muy débil (mínimo 6 caracteres).';
        }

        return message.replace('Firebase: ', '');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isRegistering) {
                await signup(email, password);
            } else {
                await login(email, password);
            }
        } catch (err) {
            console.error(err);
            setError(translateError(err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);
        try {
            await loginWithGoogle();
        } catch (err) {
            console.error(err);
            setError(translateError(err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'var(--bg-dark)'
        }}>
            <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem',
                        color: 'white'
                    }}>
                        <LogIn size={30} />
                    </div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                        {isRegistering ? 'Crear Cuenta' : 'Bienvenido'}
                    </h2>
                    <p style={{ color: 'var(--text-dim)' }}>
                        {isRegistering ? 'Regístrate para empezar a controlar tus gastos' : 'Ingresa para ver tus finanzas'}
                    </p>
                </div>

                {error && (
                    <div style={{
                        padding: '0.75rem',
                        background: 'rgba(244, 63, 94, 0.1)',
                        border: '1px solid rgba(244, 63, 94, 0.2)',
                        borderRadius: '0.5rem',
                        color: 'var(--danger)',
                        fontSize: '0.85rem',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '0.5rem', display: 'block' }}>Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                            <input
                                type="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 2.8rem',
                                    borderRadius: '0.75rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    color: 'var(--text-main)'
                                }}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '0.5rem', display: 'block' }}>Contraseña</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem 0.75rem 2.8rem',
                                    borderRadius: '0.75rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    color: 'var(--text-main)'
                                }}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="add-btn"
                        style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', marginTop: '0.5rem' }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (isRegistering ? 'Crear Cuenta' : 'Entrar')}
                    </button>
                </form>

                <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>o</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="action-btn"
                    style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}
                >
                    <Chrome size={20} /> Continuar con Google
                </button>

                <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                    {isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
                    <button
                        onClick={() => setIsRegistering(!isRegistering)}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer', marginLeft: '0.5rem' }}
                    >
                        {isRegistering ? 'Entrar' : 'Regístrate aquí'}
                    </button>
                </p>

                <p style={{
                    textAlign: 'center',
                    marginTop: '1.5rem',
                    fontSize: '0.75rem',
                    color: 'rgba(148, 163, 184, 0.5)',
                    padding: '0 1rem',
                    lineHeight: '1.4'
                }}>
                    💡 Tip: Usa siempre el mismo método para no perder de vista tus datos guardados.
                </p>
            </div>
        </div>
    );
};

export default Login;
