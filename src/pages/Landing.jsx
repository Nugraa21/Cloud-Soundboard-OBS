import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MonitorPlay, Smartphone, Settings } from 'lucide-react';

export default function Landing() {
    const [roomCode, setRoomCode] = useState('');
    const navigate = useNavigate();

    const handleCreateOBS = () => {
        // Generate 4 letter code
        const code = Math.random().toString(36).substring(2, 6).toUpperCase();
        navigate(`/player/${code}`);
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
        </div>
    );
}
