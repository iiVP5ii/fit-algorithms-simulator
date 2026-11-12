"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
    path.join(__dirname, "..", "public", "js", "audio.js"),
    "utf8"
);

function createAudioHarness(options = {}) {
    const events = [];
    const contexts = [];

    class FakeAudioContext {
        constructor() {
            this.state = options.suspended ? "suspended" : "running";
            this.currentTime = 10;
            this.destination = {};
            contexts.push(this);
        }

        resume() {
            events.push({ event: "resume" });
            this.state = "running";
            return Promise.resolve();
        }

        createOscillator() {
            const oscillator = {
                frequency: { value: 0 },
                type: "sine",
                connect() {},
                start(time) {
                    events.push({
                        event: "start",
                        frequency: oscillator.frequency.value,
                        type: oscillator.type,
                        time
                    });
                },
                stop(time) {
                    events.push({ event: "stop", time });
                }
            };
            return oscillator;
        }

        createGain() {
            return {
                gain: {
                    setValueAtTime(value, time) {
                        events.push({ event: "gain-start", value, time });
                    },
                    exponentialRampToValueAtTime(value, time) {
                        events.push({ event: "gain-end", value, time });
                    }
                },
                connect() {}
            };
        }
    }

    const window = options.unsupported ? {} : { AudioContext: FakeAudioContext };
    vm.runInNewContext(source, { window });
    return { soundFX: window.soundFX, events, contexts };
}

test("audio module exposes expected methods and initializes lazily", () => {
    const { soundFX, contexts } = createAudioHarness();
    assert.equal(soundFX.enabled, true);
    assert.equal(soundFX.audioContext, null);
    for (const method of [
        "init", "toggle", "playTone", "playClick",
        "playAllocate", "playFail", "playCompact"
    ]) {
        assert.equal(typeof soundFX[method], "function", method);
    }
    soundFX.playClick();
    assert.equal(contexts.length, 1);
    soundFX.playClick();
    assert.equal(contexts.length, 1, "AudioContext must be reused");
});

test("all four events create the correct tones", () => {
    const { soundFX, events } = createAudioHarness();
    soundFX.playClick();
    soundFX.playAllocate();
    soundFX.playFail();
    soundFX.playCompact();

    const starts = events.filter((event) => event.event === "start");
    assert.deepEqual(starts.map((item) => item.frequency),
        [500, 700, 220, 850]);
    assert.deepEqual(starts.map((item) => item.type),
        ["sine", "sine", "triangle", "sine"]);
    assert.equal(events.filter((event) => event.event === "stop").length, 4);
});

test("mute and unmute control actual playback", () => {
    const { soundFX, events } = createAudioHarness();
    assert.equal(soundFX.toggle(), false);
    soundFX.playAllocate();
    assert.equal(events.length, 0, "Muted playback must be silent");
    assert.equal(soundFX.toggle(), true);
    soundFX.playAllocate();
    assert.equal(events.filter((e) => e.event === "start").length, 1);
});

test("suspended browser audio is resumed", () => {
    const { soundFX, events } = createAudioHarness({ suspended: true });
    soundFX.playClick();
    assert.equal(events.filter((e) => e.event === "resume").length, 1);
});

test("unsupported Web Audio API fails gracefully", () => {
    const { soundFX } = createAudioHarness({ unsupported: true });
    assert.doesNotThrow(() => soundFX.playClick());
    assert.equal(soundFX.audioContext, null);
});
