import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../lib/useSettings';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X, RefreshCw, Activity, Terminal, Link } from 'lucide-react';
import mqtt from 'mqtt';

const PREDEFINED_BROKERS = [
    { label: 'HiveMQ (Public)', url: 'wss://broker.hivemq.com:8443/mqtt' },
    { label: 'Mosquitto (Public)', url: 'wss://test.mosquitto.org:8081/mqtt' },
    { label: 'EMQX (Public)', url: 'wss://broker.emqx.io:8084/mqtt' },
    { label: 'Custom URL...', url: 'custom' }
];

export default function Settings() {
    const navigate = useNavigate();
    const { settings, setSettings, sounds, setSounds, clearCache } = useSettings();

    // Custom dropdown broker logic
    const [brokerSelection, setBrokerSelection] = useState('custom');
    const [brokerInput, setBrokerInput] = useState(settings.brokerUrl);

    const [connStatus, setConnStatus] = useState(''); // 'testing', 'success', 'error'
    const [connMessage, setConnMessage] = useState('');

    // States for editing sounds
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState(null);

    useEffect(() => {
        const match = PREDEFINED_BROKERS.find(b => b.url === settings.brokerUrl);
        if (match) {
            setBrokerSelection(match.url);
        } else {
            setBrokerSelection('custom');
            setBrokerInput(settings.brokerUrl);
        }
    }, [settings.brokerUrl]);

    const handleBrokerSelectChange = (e) => {
        const val = e.target.value;
        setBrokerSelection(val);
        if (val !== 'custom') {
            setBrokerInput(val);
        } else {
            setBrokerInput('');
        }
        setConnStatus('');
    };

    const testAndSaveBroker = () => {
        const urlToTest = brokerSelection === 'custom' ? brokerInput : brokerSelection;
        if (!urlToTest) {
            alert("Alamat broker tidak boleh kosong!");
            return;
        }

        setConnStatus('testing');
        setConnMessage('MENCOBA KONEKSI...');

        let isDone = false;
        const client = mqtt.connect(urlToTest, { connectTimeout: 5000 });

        client.on('connect', () => {
            if (isDone) return;
            isDone = true;
            setConnStatus('success');
            setConnMessage(`TERHUBUNG: ${urlToTest}`);
            setSettings({ brokerUrl: urlToTest });
            client.end();
        });

        client.on('error', (err) => {
            if (isDone) return;
            isDone = true;
            setConnStatus('error');
            setConnMessage(`GAGAL: KONEKSI DITOLAK ATAU OFFLINE`);
            client.end();
        });

        client.on('offline', () => {
            if (isDone) return;
            isDone = true;
            setConnStatus('error');
            setConnMessage(`GAGAL: BROKER OFFLINE`);
            client.end();
        });

        setTimeout(() => {
            if (!isDone) {
                isDone = true;
                setConnStatus('error');
                setConnMessage(`GAGAL: TIMEOUT (Terlalu lama)`);
                client.end();
            }
        }, 6000);
    };

    const handleClearCache = () => {
        if (window.confirm("Yakin ingin mereset semua settingan & cache suara ke default awal?")) {
            clearCache();
        }
    };

    const startEdit = (sound) => {
        setEditingId(sound.id);
        setEditForm({ ...sound });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm(null);
    };

    const saveEdit = () => {
        const newSounds = sounds.map(s => s.id === editingId ? editForm : s);
        setSounds(newSounds);
        setSettings({ soundListModified: true });
        setEditingId(null);
        setEditForm(null);
    };

    const addSound = () => {
        const newId = `snd_${Date.now()}`;
        const newSound = {
            id: newId,
            name: "Sound Baru",
            file: "namafile.mp3",
            color: "#00e5ff",
            icon: "🎵"
        };
        const newSounds = [...sounds, newSound];
        setSounds(newSounds);
        setSettings({ soundListModified: true });
        startEdit(newSound); // langsung edit
    };

    const deleteSound = (id) => {
        if (window.confirm("Hapus suara ini?")) {
            const newSounds = sounds.filter(s => s.id !== id);
            setSounds(newSounds);
            setSettings({ soundListModified: true });
        }
    };

    return (
        <div className="app-container settings-page">
            <header className="tactical-header">
                <button className="back-btn" onClick={() => navigate('/')}>
                    <ArrowLeft />
                </button>
                <div className="header-titles">
                    <h1>SYSTEM CTRL</h1>
                    <p className="room-indicator">// DATA & HARDWARE SETTINGS</p>
                </div>
            </header>

            <div className="settings-grid">
                {/* LEFT SIDEBAR: CONFIGS & DANGER ZONE */}
                <div className="settings-sidebar">
                    <div className="settings-section">
                        <h2 className="section-title">MQTT BROKER CONFIG</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="edit-row">
                                <label>PILIH SERVER BROKER:</label>
                                <select
                                    value={brokerSelection}
                                    onChange={handleBrokerSelectChange}
                                    className="code-input"
                                    style={{ padding: '10px', fontSize: '1rem', cursor: 'pointer', fontFamily: 'Rajdhani', fontWeight: 'bold' }}
                                >
                                    {PREDEFINED_BROKERS.map(b => (
                                        <option key={b.url} value={b.url}>{b.label}</option>
                                    ))}
                                </select>
                            </div>

                            {brokerSelection === 'custom' && (
                                <div className="edit-row">
                                    <label>CUSTOM URL BROKER (Gunakan awalan ws:// atau wss://):</label>
                                    <input
                                        type="text"
                                        value={brokerInput}
                                        onChange={(e) => setBrokerInput(e.target.value)}
                                        className="code-input"
                                        style={{ fontSize: '1rem', padding: '10px' }}
                                        placeholder="wss://namabrokerkamu:port/mqtt"
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <button className="btn btn-primary" onClick={testAndSaveBroker} disabled={connStatus === 'testing'}>
                                    {connStatus === 'testing' ? <Activity size={20} className="spin-anim" /> : <Terminal size={20} />}
                                    {connStatus === 'testing' ? 'TESTING...' : 'TEST KONEKSI & SAVE'}
                                </button>

                                {connStatus && (
                                    <div className={`status-box ${connStatus}`}>
                                        {connStatus === 'testing' && '🟡 '}
                                        {connStatus === 'success' && '🟢 '}
                                        {connStatus === 'error' && '🔴 '}
                                        {connMessage}
                                    </div>
                                )}

                                {!connStatus && <p className="hint" style={{ textAlign: 'left', marginTop: '5px' }}>*Pastikan HP dan OBS Server terhubung lancar sebelum Live</p>}
                            </div>
                        </div>
                    </div>

                    <div className="settings-section">
                        <h2 className="section-title" style={{ color: 'var(--danger)' }}>DANGER ZONE</h2>
                        <button className="btn" style={{ background: 'var(--danger)', color: '#fff', width: '100%' }} onClick={handleClearCache}>
                            <RefreshCw size={20} /> FACTORY RESET
                        </button>
                        <p className="hint" style={{ marginTop: '10px' }}>Menghapus cache lokal, mereset broker & data list suara ke kondisi bawaan kode.</p>
                    </div>
                </div>

                {/* RIGHT SIDE: SOUND ASSETS DATABASE */}
                <div className="settings-main">
                    <div className="settings-section" style={{ height: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h2 className="section-title" style={{ margin: 0, border: 'none' }}>SOUND ASSETS DB</h2>
                            <button className="btn btn-primary btn-sm" onClick={addSound} style={{ width: 'auto', padding: '5px 15px' }}>
                                <Plus size={16} /> ADD DATA
                            </button>
                        </div>
                        <p className="hint" style={{ textAlign: 'left', marginBottom: '20px' }}>Kamu bisa menggunakan file *.mp3 lokal dari folder /assets atau memasukkan URL langsung dari website seperti MyInstants.com!</p>

                        <div className="sounds-grid-layout">
                            {sounds.length === 0 && <p className="hint" style={{ color: 'var(--danger)' }}>[ KEKOSONGAN DATA! TAMBAHKAN ENTRY BARU ]</p>}

                            {sounds.map(sound => (
                                <div key={sound.id} className="sound-edit-item" style={editingId === sound.id ? { gridColumn: '1 / -1' } : {}}>
                                    {editingId === sound.id ? (
                                        <div className="edit-form">
                                            <div className="edit-row">
                                                <label>JUDUL TOMBOL:</label>
                                                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Contoh: Awokawok" />
                                            </div>
                                            <div className="edit-row">
                                                <label>AUDIO RESOURCE (Nama mp3 lokal / Link URL http...):</label>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <Link size={20} style={{ alignSelf: 'center', color: 'var(--text-muted)' }} />
                                                    <input
                                                        value={editForm.file}
                                                        onChange={e => setEditForm({ ...editForm, file: e.target.value })}
                                                        style={{ flex: 1 }}
                                                        placeholder="bruh.mp3 ATAU https://www.myinstants.com/.../audio.mp3"
                                                    />
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                <div className="edit-row">
                                                    <label>IKON:</label>
                                                    <input value={editForm.icon} onChange={e => setEditForm({ ...editForm, icon: e.target.value })} placeholder="🎵" style={{ textAlign: 'center', fontSize: '1.2rem' }} />
                                                </div>
                                                <div className="edit-row">
                                                    <label>WARNA:</label>
                                                    <input type="color" value={editForm.color || '#ffffff'} onChange={e => setEditForm({ ...editForm, color: e.target.value })} style={{ width: '100%' }} />
                                                </div>
                                            </div>
                                            <div className="edit-actions">
                                                <button className="btn btn-primary" onClick={saveEdit}><Save size={16} /> CONFIRM</button>
                                                <button className="btn" style={{ background: '#718096', color: '#fff' }} onClick={cancelEdit}><X size={16} /> CANCEL</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="sound-view" style={{ borderLeft: `5px solid ${sound.color || '#fff'}`, flexDirection: 'column', alignItems: 'stretch' }}>
                                            <div className="sound-info" style={{ marginBottom: '10px', alignItems: 'flex-start' }}>
                                                <span className="icon" style={{ filter: `drop-shadow(0 0 5px ${sound.color})` }}>{sound.icon}</span>
                                                <div style={{ overflow: 'hidden' }}>
                                                    <strong style={{ fontSize: '1.1rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', display: 'block' }}>{sound.name}</strong>
                                                    <div className="filename" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {sound.file.startsWith('http') ? '🌐 [URL Eksternal]' : `📁 ${sound.file}`}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="sound-actions" style={{ justifyContent: 'space-between', borderTop: '1px solid var(--panel-border)', paddingTop: '10px', marginTop: 'auto' }}>
                                                <button onClick={() => startEdit(sound)} className="btn btn-sm" style={{ flex: 1, marginRight: '5px', background: 'transparent', border: '1px solid var(--panel-border)', color: 'var(--text-primary)' }}><Edit2 size={16} /> EDIT</button>
                                                <button onClick={() => deleteSound(sound.id)} className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff', width: 'auto' }}><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
