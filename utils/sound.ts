// Simple Sound Manager
// In a real app, these would be local files. Using generic placeholder URLs for now.

type SoundType = 'move' | 'capture' | 'check' | 'win' | 'lose' | 'click';

const SOUNDS: Record<SoundType, string> = {
    // Using short robust sounds (placeholders)
    move: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Wood click
    capture: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3', // Harder click
    check: 'https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3', // Alert/Gong
    win: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Success
    lose: 'https://assets.mixkit.co/active_storage/sfx/952/952-preview.mp3', // Failure/Gong
    click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3' // UI Click
};

const audioCache: Partial<Record<SoundType, HTMLAudioElement>> = {};

export const preloadSounds = () => {
    Object.entries(SOUNDS).forEach(([key, url]) => {
        const audio = new Audio(url);
        audio.preload = 'auto';
        audioCache[key as SoundType] = audio;
    });
};

export const playSound = (type: SoundType) => {
    try {
        const audio = audioCache[type] || new Audio(SOUNDS[type]);
        audio.currentTime = 0;
        audio.volume = type === 'move' ? 0.5 : 1.0; 
        audio.play().catch(e => console.warn("Audio play blocked", e));
        
        if (!audioCache[type]) {
            audioCache[type] = audio;
        }
    } catch (error) {
        console.warn("Sound error:", error);
    }
};
