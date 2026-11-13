"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Presets = require("../public/js/presets.js");

// Independent reference simulator. It is deliberately simple and does not
// use any other project file. Ties pick the first matching block.
function simulate(algorithm, blocks, processes, mode) {
    let holes = blocks.map((size) => ({ size, used: 0 }));
    let allocated = 0;
    let failed = 0;

    for (const processSize of processes) {
        let choice = null;
        for (const hole of holes) {
            if (hole.used || hole.size < processSize) continue;
            if (choice === null) {
                choice = hole;
                if (algorithm === "First Fit") break;
            } else if (algorithm === "Best Fit" && hole.size < choice.size) {
                choice = hole;
            } else if (algorithm === "Worst Fit" && hole.size > choice.size) {
                choice = hole;
            }
        }
        if (choice === null) {
            failed++;
            continue;
        }
        if (mode === "dynamic" && choice.size > processSize) {
            const index = holes.indexOf(choice);
            holes.splice(index, 1,
                { size: processSize, used: processSize },
                { size: choice.size - processSize, used: 0 });
        } else {
            choice.used = processSize;
        }
        allocated++;
    }
    return { allocated, failed };
}

test("there are several presets with unique ids", () => {
    const ids = Presets.getIds();
    assert.ok(ids.length >= 6);
    assert.equal(new Set(ids).size, ids.length);
});

test("every preset passes validation", () => {
    for (const preset of Presets.getAll()) {
        assert.deepEqual(Presets.validate(preset), [], preset.id);
    }
});

test("both fixed and dynamic modes are covered", () => {
    const modes = new Set(Presets.getAll().map((preset) => preset.mode));
    assert.ok(modes.has("fixed"));
    assert.ok(modes.has("dynamic"));
});

test("expected results match the independent reference simulator", () => {
    for (const preset of Presets.getAll()) {
        for (const algorithm of Presets.ALGORITHMS) {
            const result = simulate(algorithm, preset.blocks, preset.processes, preset.mode);
            assert.equal(result.allocated, preset.expected[algorithm],
                `${preset.id} / ${algorithm}`);
            assert.equal(result.allocated + result.failed, preset.processes.length);
        }
    }
});

test("expected results do not depend on how ties are broken", () => {
    // Reversing every list turns "first" into "last", so any tie-dependent
    // preset would give a different count for at least one algorithm.
    for (const preset of Presets.getAll()) {
        for (const algorithm of ["Best Fit", "Worst Fit"]) {
            const forward = simulate(algorithm, preset.blocks, preset.processes, preset.mode);
            const reversed = simulate(algorithm, preset.blocks.slice().reverse(),
                preset.processes, preset.mode);
            assert.equal(reversed.allocated, forward.allocated, `${preset.id} / ${algorithm}`);
        }
    }
});

test("the presets show each algorithm winning at least once", () => {
    const wins = { "First Fit": 0, "Best Fit": 0, "Worst Fit": 0 };
    for (const preset of Presets.getAll()) {
        const counts = Presets.ALGORITHMS.map((name) => preset.expected[name]);
        const top = Math.max(...counts);
        const winners = Presets.ALGORITHMS.filter((name) => preset.expected[name] === top);
        if (winners.length === 1) wins[winners[0]]++;
    }
    for (const name of Presets.ALGORITHMS) {
        assert.ok(wins[name] >= 1, `${name} never wins alone`);
    }
});

test("the classic textbook example matches the known answer", () => {
    const preset = Presets.getById("classic-textbook");
    assert.deepEqual(preset.blocks, [100, 500, 200, 300, 600]);
    assert.deepEqual(preset.processes, [212, 417, 112, 426]);
    assert.equal(preset.expected["Best Fit"], 4);
});

test("getById returns null for an unknown id", () => {
    assert.equal(Presets.getById("does-not-exist"), null);
});

test("returned presets are copies, so editing them is safe", () => {
    const first = Presets.getById("classic-textbook");
    first.blocks.push(999);
    first.name = "Changed";
    const second = Presets.getById("classic-textbook");
    assert.equal(second.blocks.length, 5);
    assert.equal(second.name, "Classic Textbook Example");
});

test("toSimulationInput gives the arguments of simulateAll", () => {
    const preset = Presets.getById("stress-fixed-os");
    const input = Presets.toSimulationInput(preset);
    assert.deepEqual(Object.keys(input).sort(),
        ["blockSizes", "mode", "osReserved", "processSizes"]);
    assert.equal(input.mode, "fixed");
    assert.equal(input.osReserved, 128);
    assert.deepEqual(input.blockSizes, preset.blocks);
});

test("validate reports bad presets", () => {
    assert.ok(Presets.validate(null).length > 0);
    assert.ok(Presets.validate({ id: "x", name: "x", mode: "weird",
        osReserved: 0, blocks: [1], processes: [1] }).length > 0);
    assert.ok(Presets.validate({ id: "x", name: "x", mode: "fixed",
        osReserved: -1, blocks: [1], processes: [1] }).length > 0);
    assert.ok(Presets.validate({ id: "x", name: "x", mode: "fixed",
        osReserved: 0, blocks: [0], processes: [1] }).length > 0);
    assert.ok(Presets.validate({ id: "x", name: "x", mode: "fixed",
        osReserved: 0, blocks: [10], processes: [] }).length > 0);
});

test("benchmark runs every preset through the given function", () => {
    const calls = [];
    const output = Presets.benchmark((blocks, processes, mode, osReserved) => {
        calls.push({ blocks, processes, mode, osReserved });
        return ["ok"];
    });
    assert.equal(output.length, Presets.getIds().length);
    assert.equal(calls.length, output.length);
    assert.deepEqual(output[0].results, ["ok"]);
    assert.throws(() => Presets.benchmark(null), TypeError);
});
