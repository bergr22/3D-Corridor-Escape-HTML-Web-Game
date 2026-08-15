// js/audio.js - Complete Web Audio API & Sound Manager

class SoundManager {
    constructor() {
        this.ctx = null;
        this.lastStepTime = 0;
        this.isInitialized = false;

        // Volume levels (0.0 to 1.0)
        this.bgmVolume = 0.6;
        this.sfxVolume = 1.0;

        // Background Music Audio Element
        this.bgm = new Audio('soundeffects/background_music.mp3');
        this.bgm.loop = true;
        this.bgm.volume = this.bgmVolume;
        this.isBGMPlaying = false;

        // Predefined SFX Files Map
        this.sfxFiles = {
            wolf_1: 'soundeffects/wolf_1.mp3',
            wolf_2: 'soundeffects/wolf_2.mp3',
            wolf_attack: 'soundeffects/wolf_attack.mp3',
            jumpscare_1: 'soundeffects/jumpscare_1.mp3',
            jumpscare_2: 'soundeffects/jumpscare_2.mp3',
            radio: 'soundeffects/radio.wav',
            sweep: 'soundeffects/sweep.wav',
            victory: 'soundeffects/victory.mp3'
        };

        // Dynamic Radio Audio for Ending #3
        this.radioAudio = new Audio('soundeffects/radio.wav');
        this.radioAudio.loop = true;
        this.radioAudio.volume = 0.3;
        this.isRadioPlaying = false;

        this.activeSFX = [];
    }

    init() {
        if (!this.isInitialized) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
            this.isInitialized = true;
        }

        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        // Start BGM on first user interaction
        this.playBGM();
    }

    playRadio(initialVol = 0.3) {
        this.init();
        this.radioAudio.volume = Math.max(0, Math.min(1, initialVol * this.sfxVolume));
        this.radioAudio.currentTime = 0;
        this.radioAudio.play().then(() => {
            this.isRadioPlaying = true;
        }).catch(err => {
            // Radio play fallback
        });
    }

    setRadioDynamicVolume(vol) {
        if (this.radioAudio) {
            const clamped = Math.max(0, Math.min(1, vol * this.sfxVolume));
            this.radioAudio.volume = clamped;
        }
    }

    stopRadio() {
        if (this.radioAudio) {
            this.radioAudio.pause();
            this.radioAudio.currentTime = 0;
            this.isRadioPlaying = false;
        }
    }

    playBGM() {
        if (!this.isBGMPlaying) {
            this.bgm.volume = this.bgmVolume;
            this.bgm.play().then(() => {
                this.isBGMPlaying = true;
            }).catch(err => {
                // Audio autoplay policy handled on next click
            });
        }
    }

    stopBGM() {
        this.bgm.pause();
        this.isBGMPlaying = false;
    }

    playVictorySound() {
        this.stopBGM();
        this.victoryAudio = this.playSFX('victory');
        return this.victoryAudio;
    }

    fadeOutAllAudio(durationMs = 800) {
        const audioElements = [];
        if (this.victoryAudio) audioElements.push(this.victoryAudio);
        this.activeSFX.forEach(a => {
            if (a && !a.paused) audioElements.push(a);
        });
        if (this.bgm && this.isBGMPlaying) audioElements.push(this.bgm);

        if (audioElements.length === 0) return;

        const startTime = performance.now();
        const initialVolumes = audioElements.map(a => a.volume);

        const fadeInterval = setInterval(() => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(1, elapsed / durationMs);

            audioElements.forEach((audio, idx) => {
                try {
                    audio.volume = Math.max(0, initialVolumes[idx] * (1 - progress));
                } catch (e) {}
            });

            if (progress >= 1) {
                clearInterval(fadeInterval);
                audioElements.forEach((audio) => {
                    try {
                        audio.pause();
                        audio.currentTime = 0;
                    } catch (e) {}
                });
                this.activeSFX = [];
                this.victoryAudio = null;
                this.isBGMPlaying = false;
                if (this.bgm) this.bgm.volume = this.bgmVolume;
            }
        }, 30);
    }

    setBGMVolume(val) {
        this.bgmVolume = Math.max(0, Math.min(1, val));
        this.bgm.volume = this.bgmVolume;
    }

    setSFXVolume(val) {
        this.sfxVolume = Math.max(0, Math.min(1, val));
    }

    playSFX(sfxKey) {
        this.init();
        if (this.sfxFiles[sfxKey]) {
            const audio = new Audio(this.sfxFiles[sfxKey]);
            audio.volume = this.sfxVolume;
            audio.play().catch(err => console.log('SFX play error:', err));
            this.activeSFX.push(audio);
            return audio;
        }
        return null;
    }

    stopAllSFX() {
        this.activeSFX.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        this.activeSFX = [];
    }

    // Procedural Footstep Generator
    triggerStep(isSprinting = false) {
        if (!this.ctx) this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const cooldown = isSprinting ? 0.28 : 0.48;
        if (now - this.lastStepTime < cooldown) return;
        this.lastStepTime = now;

        const bufferSize = this.ctx.sampleRate * 0.09;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            const decay = Math.exp(-i / (bufferSize * 0.25));
            data[i] = (Math.random() * 2 - 1) * decay;
        }

        const noiseNode = this.ctx.createBufferSource();
        noiseNode.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(isSprinting ? 420 : 310, now);

        const gainNode = this.ctx.createGain();
        const baseVolume = (isSprinting ? 0.14 : 0.085) * (this.sfxVolume / 0.8);
        const footVar = (Math.random() * 0.02) - 0.01;
        gainNode.gain.setValueAtTime(Math.max(0.001, baseVolume + footVar), now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(isSprinting ? 85 : 70, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.08);

        oscGain.gain.setValueAtTime((isSprinting ? 0.15 : 0.09) * (this.sfxVolume / 0.8), now);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

        noiseNode.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);

        noiseNode.start(now);
        osc.start(now);
        osc.stop(now + 0.09);
    }

    // Procedural Heavy Wolf Footstep / Gallop Generator (Volume scales with proximity)
    triggerWolfStep(distanceToPlayer = 15) {
        if (!this.ctx) this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.11;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            const decay = Math.exp(-i / (bufferSize * 0.22));
            data[i] = (Math.random() * 2 - 1) * decay;
        }

        const noiseNode = this.ctx.createBufferSource();
        noiseNode.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(280, now);

        const distFactor = Math.max(0.04, Math.min(1.0, 1.0 - (distanceToPlayer / 35)));
        const volume = distFactor * 0.7 * (this.sfxVolume / 0.8);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(Math.max(0.001, volume), now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.10);

        oscGain.gain.setValueAtTime(Math.max(0.001, volume * 1.1), now);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);

        noiseNode.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);

        noiseNode.start(now);
        osc.start(now);
        osc.stop(now + 0.11);
    }
}

const gameAudio = new SoundManager();
