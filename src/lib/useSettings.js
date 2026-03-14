import { useState, useEffect } from 'react';

const DEFAULT_SETTINGS = {
    brokerUrl: 'wss://broker.hivemq.com:8443/mqtt',
    soundListModified: false,
};

export function useSettings() {
    const [settings, setSettingsState] = useState(() => {
        const rawData = localStorage.getItem('n21_soundboard_settings');
        if (rawData) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(rawData) };
        }
        return DEFAULT_SETTINGS;
    });

    const [sounds, setSoundsState] = useState(() => {
        const savedSounds = localStorage.getItem('n21_soundboard_sounds');
        if (savedSounds) {
            return JSON.parse(savedSounds);
        }
        return []; // Empty initially
    });

    // Fetch from JSON if no saved and not modified
    useEffect(() => {
        if (sounds.length === 0 && !settings.soundListModified) {
            fetch('/assets/sounds.json')
                .then((res) => res.json())
                .then((data) => {
                    setSoundsState(data);
                })
                .catch((err) => console.error("Could not load sounds.json", err));
        }
    }, [sounds.length, settings.soundListModified]);

    const setSettings = (newSettings) => {
        const finalSettings = { ...settings, ...newSettings };
        setSettingsState(finalSettings);
        localStorage.setItem('n21_soundboard_settings', JSON.stringify(finalSettings));
    };

    const setSounds = (newSounds) => {
        setSoundsState(newSounds);
        localStorage.setItem('n21_soundboard_sounds', JSON.stringify(newSounds));
    };

    const clearCache = () => {
        localStorage.removeItem('n21_soundboard_settings');
        localStorage.removeItem('n21_soundboard_sounds');
        setSettingsState(DEFAULT_SETTINGS);
        setSoundsState([]);
        window.location.reload();
    };

    return {
        settings,
        setSettings,
        sounds,
        setSounds,
        clearCache
    };
}
