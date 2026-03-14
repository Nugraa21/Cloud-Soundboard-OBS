import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Volume2, VolumeX, ArrowLeft } from 'lucide-react';
import mqtt from 'mqtt';
import { useSettings } from '../lib/useSettings';

export default function Controller() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { settings, sounds } = useSettings();
    const [loading, setLoading] = useState(true);
    const [mqttStatus, setMqttStatus] = useState('connecting'); // connecting, connected
    const [volume, setVolume] = useState(1);
    const [activeBtn, setActiveBtn] = useState(null);

    // Ref untuk koneksi MQTT
    const mqttClient = useRef(null);

    useEffect(() => {
        // Kita tunggu sampai hook sounds ada (jika baru di clear atau load json awal)
        if (sounds && sounds.length >= 0) {
            setLoading(false);
        }

        // 2. Setup MQTT dengan Broker dinamis dari Setting Cache
        if (!mqttClient.current) {
            setMqttStatus('connecting');
            mqttClient.current = mqtt.connect(settings.brokerUrl);

            mqttClient.current.on('connect', () => {
                console.log('Connected to MQTT Broker via WebSockets');
                setTimeout(() => setMqttStatus('connected'), 800); // Fake delay biar animasi kerasa
            });

            mqttClient.current.on('error', () => {
                setMqttStatus('error');
            });
        }

        return () => {
            if (mqttClient.current) {
                mqttClient.current.end();
                mqttClient.current = null;
            }
        };
    }, [settings.brokerUrl, sounds]);

    const triggerSound = (sound) => {
        // Animasi klik
        setActiveBtn(sound.id);
        setTimeout(() => setActiveBtn(null), 300);

        // Getar HP ala recoil PUBG
        if (navigator.vibrate) {
            navigator.vibrate([20, 30, 20]);
        }

        // Tembak MQTT
        if (mqttClient.current && mqttClient.current.connected) {
            const topic = `n21-soundboard/${roomId}`;
            const payload = JSON.stringify({
                type: 'play',
                sound: sound
            });
            mqttClient.current.publish(topic, payload);
        }
    };

    const handleVolumeChange = (e) => {
        const val = parseFloat(e.target.value);
        setVolume(val);

        // Tembak MQTT
        if (mqttClient.current && mqttClient.current.connected) {
            const topic = `n21-soundboard/${roomId}`;
            const payload = JSON.stringify({
                type: 'volume',
                val: val
            });
            mqttClient.current.publish(topic, payload);
        }
    };

    return (
        <div className="app-container">
            <header className="tactical-header">
                <button className="back-btn" onClick={() => navigate('/')}>
                    <ArrowLeft />
                </button>
                <div className="header-titles">
                    <h1>CONTROLLER</h1>
                    <p className="room-indicator">ROOM ID: <span className="highlight-code">{roomId}</span></p>
                </div>
            </header>

            {loading || mqttStatus === 'connecting' ? (
                <div className="full-loader">
                    <div className="spinner-hud"></div>
                    <div className="loader-text">
                        <h3>INITIALIZING HUB...</h3>
                        <p>ESTABLISHING SECURE CONNECTION</p>
                    </div>
                </div>
            ) : mqttStatus === 'error' ? (
                <div className="full-loader error-loader">
                    <div className="loader-text" style={{ color: 'var(--danger)' }}>
                        <h3 style={{ fontSize: '3rem' }}>⚠️ ERROR</h3>
                        <p>CANNOT CONNECT TO MQTT BROKER</p>
                    </div>
                </div>
            ) : (
                <div className="sound-grid">
                    {sounds.length === 0 ? (
                        <div className="empty-state">DATA SUARA KOSONG. CEK SOUNDS.JSON</div>
                    ) : (
                        sounds.map(s => (
                            <div
                                key={s.id}
                                className={`sound-btn ${activeBtn === s.id ? 'playing' : ''}`}
                                style={s.color ? { '--accent-primary': s.color } : {}}
                                onPointerDown={(e) => { e.preventDefault(); triggerSound(s); }}
                            >
                                <div className="icon" style={s.color ? { filter: `drop-shadow(0 0 6px ${s.color})` } : {}}>
                                    {s.icon || '🎵'}
                                </div>
                                <div className="name">{s.name}</div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <div className="controls-panel" style={{ position: 'fixed', bottom: '0', left: '0', right: '0', margin: '0 auto', maxWidth: '800px', zIndex: '100' }}>
                <div className="panel-header">
                    <span>// AUDIO SYSTEM</span>
                </div>
                <div className="volume-control">
                    <VolumeX size={20} className="vol-icon" />
                    <input
                        type="range"
                        min="0" max="1" step="0.05"
                        value={volume}
                        onChange={handleVolumeChange}
                    />
                    <Volume2 size={20} className="vol-icon" />
                </div>
            </div>
        </div>
    );
}
