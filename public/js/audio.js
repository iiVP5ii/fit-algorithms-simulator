
/*
 * Memory Allocation Simulator
 * Sound Effects Module
 * Team 3 - HAYTHAM
 */

class SoundFX {
    constructor() {
        this.enabled = true;
        this.audioContext = null;
    }

    // Create the audio context when needed.
    init() {
        if (!this.audioContext) {
            const AudioContextClass =
                window.AudioContext || window.webkitAudioContext;

            if (AudioContextClass) {
                this.audioContext = new AudioContextClass();
            }
        }
    }

    // Enable or disable sound effects.
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    // Generate a simple sound.
    playTone(frequency, duration, type = "sine") {
        if (!this.enabled) return;

        this.init();
        if (!this.audioContext) return;

        const ctx = this.audioContext;

        if (ctx.state === "suspended") {
            ctx.resume().catch(() => {});
        }

        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            now + duration
        );

        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    // Sound when a button is clicked.
    playClick() {
        this.playTone(500, 0.08);
    }

    // Sound when memory allocation succeeds.
    playAllocate() {
        this.playTone(700, 0.15);
    }

    // Sound when memory allocation fails.
    playFail() {
        this.playTone(220, 0.3, "triangle");
    }

    // Sound when memory compaction occurs.
    playCompact() {
        this.playTone(850, 0.2);
    }
}

// Create one shared sound controller.
window.soundFX = new SoundFX();
