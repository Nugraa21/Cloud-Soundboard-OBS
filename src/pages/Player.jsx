import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import mqtt from 'mqtt';
import { useSettings } from '../lib/useSettings';
import { Activity, Music, Volume2 } from 'lucide-react';

export default function Player() {
    const { roomId } = useParams();
    const { settings } = useSettings();
    const [mqttStatus, setMqttStatus] = useState('connecting'); // connecting, connected, error
    const [fade, setFade] = useState(false);

    // State untuk visualisasi suara di OBS
    const [nowPlaying, setNowPlaying] = useState(null);
    const hideTimer = useRef(null);

    const audioCache = useRef({});
    const globalVolume = useRef(1.0);

    useEffect(() => {
        const client = mqtt.connect(settings.brokerUrl);

        client.on('connect', () => {
            setMqttStatus('connected');
            client.subscribe(`n21-soundboard/${roomId}`);

            // Auto-hide indicator in OBS after 5 seconds to keep screen clean
            setTimeout(() => {
                setFade(true);
            }, 5000);
        });

        client.on('error', () => {
            setMqttStatus('error');
        });

        client.on('message', (topic, message) => {
            try {
                const data = JSON.parse(message.toString());

                if (data.type === 'volume') {
                    globalVolume.current = data.val;
                    showVisualNotification(`Volume: ${Math.round(data.val * 100)}%`, null, true);
                }
                else if (data.type === 'play') {
                    playSound(data.sound);
                    showVisualNotification(data.sound.name, data.sound.color || '#ffaa00', false, data.sound.icon);
                }
            } catch (err) {
                console.error("Payload MQTT Error", err);
            }
        });

        client.on('disconnect', () => {
            setFade(false);
            setMqttStatus('error');
        });

        return () => {
            client.end();
        };
    }, [roomId, settings.brokerUrl]);

    const showVisualNotification = (text, color, isVolume = false, icon = '🎵') => {
        setNowPlaying({ text, color, isVolume, icon });
        setFade(false); // Munculkan layar sesaat jika sebelumnya fade-out

        if (hideTimer.current) clearTimeout(hideTimer.current);

        // Sembunyikan lagi visualisasi tsb setelah 3 detik
        hideTimer.current = setTimeout(() => {
            setFade(true);
            setTimeout(() => setNowPlaying(null), 1000); // clear state after CSS fade
        }, 3000);
    };

    const playSound = (sound) => {
        // Mengecek apakah inputan dari user adalah URL (Myinstants dll) atau file assets lokal
        const isUrl = sound.file.startsWith('http://') || sound.file.startsWith('https://');
        const audioSource = isUrl ? sound.file : `/assets/${sound.file}`;

        let audioObject = audioCache.current[sound.id];

        if (!audioObject) {
            audioObject = new Audio(audioSource);
            audioCache.current[sound.id] = audioObject;
        } else {
            audioObject.pause();
            audioObject.currentTime = 0;
            // Berjaga-jaga jikalau sumber URL diedit on the fly di settings
            if (audioObject.src !== audioSource && !audioObject.src.includes(audioSource)) {
                audioObject = new Audio(audioSource);
                audioCache.current[sound.id] = audioObject;
            }
        }

        audioObject.volume = globalVolume.current;
        audioObject.play().catch(err => {
            console.warn("Autoplay ditolak atau link suara salah/tidak dapat diakses:", err);
        });
    };

    return (
        <div className={`obs-player ${fade ? 'fade-out' : ''}`}>
            {/* INITIAL CONNECTION OVERLAY */}
            {!nowPlaying && (
                <div className="connection-overlay">
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', margin: '20px', maxWidth: '400px', clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}>
                        {mqttStatus === 'connecting' && (
                            <>
                                <div className="spinner-hud" style={{ width: '40px', height: '40px', borderTopColor: 'var(--text-primary)' }}></div>
                                <div className="loader-text">
                                    <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>SYSTEM INITIALIZATION</h3>
                                    <p style={{ color: 'var(--accent-primary)', opacity: 1, fontWeight: 700 }}>SEARCHING BROKER SERVER...</p>
                                </div>
                            </>
                        )}
                        {mqttStatus === 'connected' && (
                            <>
                                <div className="playing-icon" style={{ fontSize: '3rem', marginBottom: '10px' }}>🟢</div>
                                <div className="loader-text">
                                    <h3 style={{ fontSize: '1.5rem', color: '#38a169' }}>CONNECTION SECURED</h3>
                                    <p style={{ color: 'var(--text-primary)', opacity: 0.9, fontWeight: 700 }}>OBS READY // ROOM ID: {roomId.toUpperCase()}</p>
                                </div>
                            </>
                        )}
                        {mqttStatus === 'error' && (
                            <>
                                <div className="playing-icon" style={{ fontSize: '3rem', marginBottom: '10px' }}>⚠️</div>
                                <div className="loader-text">
                                    <h3 style={{ fontSize: '1.5rem', color: 'var(--danger)' }}>CONNECTION LOST</h3>
                                    <p style={{ color: 'var(--danger)', opacity: 0.9, fontWeight: 700 }}>Check Internet or refresh the URL</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Tampilan Visual (Muncu di layar OBS sesaat pas suara ditekan) */}
            {nowPlaying && (
                <div className="playing-overlay" style={{ borderColor: nowPlaying.color || '#ffaa00' }}>
                    {nowPlaying.isVolume ? (
                        <Volume2 size={30} color={nowPlaying.color || '#ffaa00'} />
                    ) : (
                        <div className="playing-icon" style={{ textShadow: `0 0 10px ${nowPlaying.color}` }}>
                            {nowPlaying.icon}
                        </div>
                    )}

                    <div className="playing-info">
                        <span className="playing-label">{nowPlaying.isVolume ? 'SYSTEM CONFIG' : 'NOW PLAYING'}</span>
                        <span className="playing-name" style={{ color: nowPlaying.color || '#fff' }}>
                            {nowPlaying.text}
                        </span>
                    </div>

                    {/* EQ / Waveform Animasi Palsu Biar Keren */}
                    {!nowPlaying.isVolume && (
                        <div className="eq-waves">
                            <div className="bar" style={{ background: nowPlaying.color }}></div>
                            <div className="bar" style={{ background: nowPlaying.color }}></div>
                            <div className="bar" style={{ background: nowPlaying.color }}></div>
                            <div className="bar" style={{ background: nowPlaying.color }}></div>
                            <div className="bar" style={{ background: nowPlaying.color }}></div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
