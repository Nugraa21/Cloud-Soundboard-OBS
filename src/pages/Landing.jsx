import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MonitorPlay, Smartphone, Settings, Copy, Check, ExternalLink } from 'lucide-react';

export default function Landing() {
    const [roomCode, setRoomCode] = useState('');
    const [generatedCode, setGeneratedCode] = useState(null);
    const [copied, setCopied] = useState(false);
    const navigate = useNavigate();

    const handleCreateOBS = () => {
        // Generate 4 letter code
        const code = Math.random().toString(36).substring(2, 6).toUpperCase();
        setGeneratedCode(code);
    };

    const copyToClipboard = () => {
        const url = `${window.location.origin}/player/${generatedCode}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const goToPlayer = () => {
        navigate(`/player/${generatedCode}`);
    };

    const handleJoinRemote = (e) => {
        e.preventDefault();
        if (roomCode.length === 4) {
            navigate(`/controller/${roomCode.toUpperCase()}`);
        } else {
            alert("Kode harus 4 karakter!");
        }
    };

    return (
        <div className="landing-container">
            <div className="card" style={{ paddingBottom: '70px' }}>
                <h1 className="title">SOUNDBOARD <span className="highlight">CONNECT</span></h1>
                <p className="subtitle">Pilih metode koneksi</p>

                <div className="divider"></div>

                <div className="action-section">
                    <button className="btn btn-primary" onClick={handleCreateOBS}>
                        <MonitorPlay size={24} />
                        BUAT OBS PLAYER (HOST)
                    </button>
                    <p className="hint">Pilih ini jika di PC (OBS) untuk memutar musik</p>
                </div>

                <div className="divider text-divider">ATAU</div>

                <div className="action-section">
                    <form onSubmit={handleJoinRemote} className="join-form">
                        <input
                            type="text"
                            placeholder="KODE 4"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            maxLength={4}
                            className="code-input"
                        />
                        <button type="submit" className="btn btn-secondary">
                            <Smartphone size={24} />
                            JOIN REMOTE
                        </button>
                    </form>
                    <p className="hint">Pilih ini di HP kamu sebagai controller</p>
                </div>

                {/* Tombol ke Pengaturan */}
                <button
                    onClick={() => navigate('/settings')}
                    className="settings-btn"
                >
                    <Settings size={20} />
                    SYSTEM SETTINGS
                </button>
            </div>

            {/* OBS COPY LINK MODAL */}
            {generatedCode && (
                <div className="full-loader" style={{ zIndex: 99999 }}>
                    <div className="card" style={{ maxWidth: '500px', margin: '20px', padding: '30px', animation: 'slideInElastic 0.5s' }}>
                        <h2 style={{ fontFamily: 'Teko', fontSize: '2.5rem', marginBottom: '10px', color: 'var(--text-primary)' }}>OBS CONNECT LINK</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontWeight: 600 }}>1. Copy link di bawah ini dan Paste ke URL OBS Browser Source mu.</p>

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            <div className="code-input" style={{ flex: 1, fontSize: '1rem', letterSpacing: '0', display: 'flex', alignItems: 'center', padding: '10px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', background: 'rgba(255,255,255,0.5)' }}>
                                {window.location.origin}/player/{generatedCode}
                            </div>
                            <button onClick={copyToClipboard} className="btn btn-primary" style={{ width: 'auto', padding: '10px 20px' }}>
                                {copied ? <Check size={20} /> : <Copy size={20} />}
                                {copied ? 'COPIED!' : 'COPY'}
                            </button>
                        </div>

                        <div style={{ background: 'rgba(255,170,0,0.1)', padding: '15px', borderRadius: '12px', marginBottom: '25px', borderLeft: '4px solid var(--accent-primary)' }}>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>🔑 ROOM CODE HP-MU: <span style={{ fontSize: '1.5rem', color: 'var(--accent-primary)', fontFamily: 'Teko', letterSpacing: '2px', verticalAlign: 'middle', marginLeft: '10px' }}>{generatedCode}</span></p>
                            <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>*(Centang opsi "Control audio via OBS" di pengaturan OBS agar suara masuk live stream)*</p>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={goToPlayer} className="btn" style={{ background: '#1a202c', color: '#fff', flex: 1 }}>
                                <ExternalLink size={18} /> OPEN DI BROWSER INI
                            </button>
                            <button onClick={() => setGeneratedCode(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                                TUTUP
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
