/*
 * Memory Allocation Simulator
 * Benchmark presets (example workloads)
 * Team 3 - Student 1: Ahmed Algarrah (ID 451029933)
 *
 * Ready-made workloads that the application controller can load with one
 * click. Every preset has the same shape as the simulator input:
 *
 *   blocks      - memory partition sizes in KB, in address order
 *   processes   - process sizes in KB, in arrival order
 *   mode        - "fixed"   : a block is given to one process as a whole
 *                             (the unused rest is internal fragmentation)
 *                 "dynamic" : a block is split, and the rest becomes a new
 *                             free hole (external fragmentation)
 *   osReserved  - KB reserved for the operating system at address 0
 *
 * Each preset also carries `expected`: how many processes each algorithm
 * should place. These numbers were worked out by hand and double-checked by
 * an independent reference simulator in tests/presets.test.js. Block sizes
 * are chosen so that no two candidate holes tie, which keeps the expected
 * result independent of tie-breaking rules.
 *
 * Public API (window.Presets):
 *   MODES                     -> { FIXED: "fixed", DYNAMIC: "dynamic" }
 *   getAll()                  -> copies of every preset
 *   getIds()                  -> list of preset ids
 *   getById(id)               -> a copy of one preset, or null
 *   toSimulationInput(preset) -> { blockSizes, processSizes, mode, osReserved }
 *                                (the arguments of MemoryAnalyzer.simulateAll)
 *   validate(preset)          -> list of problems (empty list = valid)
 *   benchmark(simulateAll)    -> run every preset through a simulate function
 */

"use strict";

(function (root) {
    const MODES = Object.freeze({ FIXED: "fixed", DYNAMIC: "dynamic" });
    const ALGORITHMS = Object.freeze(["First Fit", "Best Fit", "Worst Fit"]);

    function deepFreeze(value) {
        if (value && typeof value === "object" && !Object.isFrozen(value)) {
            Object.freeze(value);
            Object.values(value).forEach(deepFreeze);
        }
        return value;
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    const PRESETS = deepFreeze([
        {
            id: "classic-textbook",
            name: "Classic Textbook Example",
            description:
                "The well-known example from the Operating System Concepts " +
                "textbook. Best Fit is the only algorithm that places all " +
                "four processes.",
            mode: MODES.DYNAMIC,
            osReserved: 0,
            blocks: [100, 500, 200, 300, 600],
            processes: [212, 417, 112, 426],
            expected: { "First Fit": 3, "Best Fit": 4, "Worst Fit": 3 }
        },
        {
            id: "first-fit-advantage",
            name: "First Fit Advantage",
            description:
                "First Fit places every process. Best Fit and Worst Fit use " +
                "up the blocks that a later process needed.",
            mode: MODES.DYNAMIC,
            osReserved: 0,
            blocks: [250, 600, 100, 150, 450, 400],
            processes: [260, 350, 140, 360, 310],
            expected: { "First Fit": 5, "Best Fit": 4, "Worst Fit": 4 }
        },
        {
            id: "best-fit-advantage",
            name: "Best Fit Advantage",
            description:
                "Fixed partitions. Best Fit keeps the large blocks free for " +
                "the large process at the end, so it is the only one that " +
                "places all four processes.",
            mode: MODES.FIXED,
            osReserved: 0,
            blocks: [600, 300, 550, 150, 250, 450],
            processes: [120, 330, 280, 500],
            expected: { "First Fit": 3, "Best Fit": 4, "Worst Fit": 3 }
        },
        {
            id: "worst-fit-advantage",
            name: "Worst Fit Advantage",
            description:
                "Worst Fit leaves large leftover holes that later processes " +
                "can still use, so it places one more process than the others.",
            mode: MODES.DYNAMIC,
            osReserved: 0,
            blocks: [100, 450, 50, 350, 600],
            processes: [400, 170, 460, 310, 230],
            expected: { "First Fit": 3, "Best Fit": 3, "Worst Fit": 4 }
        },
        {
            id: "internal-fragmentation",
            name: "High Internal Fragmentation",
            description:
                "Fixed partitions with small processes in large blocks: " +
                "lots of memory is wasted inside the blocks. Worst Fit wastes " +
                "the most.",
            mode: MODES.FIXED,
            osReserved: 0,
            blocks: [200, 400, 300, 600, 500],
            processes: [110, 90, 230, 150, 310],
            expected: { "First Fit": 5, "Best Fit": 5, "Worst Fit": 4 }
        },
        {
            id: "compaction-demo",
            name: "External Fragmentation and Compaction",
            description:
                "Dynamic partitions. The last process (300 KB) fails even " +
                "though enough total memory is free, because the free space " +
                "is split into small holes. Use compaction to fix it.",
            mode: MODES.DYNAMIC,
            osReserved: 0,
            blocks: [200, 150, 180, 120, 250],
            processes: [130, 90, 110, 70, 160, 300],
            expected: { "First Fit": 5, "Best Fit": 5, "Worst Fit": 4 }
        },
        {
            id: "stress-dynamic",
            name: "Stress Test (Dynamic)",
            description:
                "Ten blocks and twelve processes with dynamic partitions. " +
                "Memory is almost full, so poor choices show up quickly.",
            mode: MODES.DYNAMIC,
            osReserved: 0,
            blocks: [80, 250, 120, 400, 60, 300, 180, 500, 90, 350],
            processes: [75, 230, 110, 380, 55, 290, 170, 480, 85, 340, 200, 420],
            expected: { "First Fit": 10, "Best Fit": 10, "Worst Fit": 8 }
        },
        {
            id: "stress-fixed-os",
            name: "Stress Test (Fixed, with OS)",
            description:
                "The same workload with fixed partitions and 128 KB " +
                "reserved for the operating system. Worst Fit fails most " +
                "processes here.",
            mode: MODES.FIXED,
            osReserved: 128,
            blocks: [80, 250, 120, 400, 60, 300, 180, 500, 90, 350],
            processes: [75, 230, 110, 380, 55, 290, 170, 480, 85, 340, 200, 420],
            expected: { "First Fit": 10, "Best Fit": 10, "Worst Fit": 6 }
        },
        {
            id: "everything-fits",
            name: "Everything Fits (Sanity Check)",
            description:
                "A small workload that every algorithm places completely. " +
                "Good for a quick check that the simulator works.",
            mode: MODES.FIXED,
            osReserved: 0,
            blocks: [100, 200, 300, 400, 500],
            processes: [90, 190, 290, 95],
            expected: { "First Fit": 4, "Best Fit": 4, "Worst Fit": 4 }
        }
    ]);

    function isPositiveInteger(value) {
        return Number.isInteger(value) && value > 0;
    }

    function validate(preset) {
        const problems = [];
        if (!preset || typeof preset !== "object") {
            return ["Preset must be an object."];
        }
        if (typeof preset.id !== "string" || preset.id === "") {
            problems.push("Missing id.");
        }
        if (typeof preset.name !== "string" || preset.name === "") {
            problems.push("Missing name.");
        }
        if (preset.mode !== MODES.FIXED && preset.mode !== MODES.DYNAMIC) {
            problems.push('Mode must be "fixed" or "dynamic".');
        }
        if (!Number.isInteger(preset.osReserved) || preset.osReserved < 0) {
            problems.push("osReserved must be a whole number of 0 or more.");
        }
        if (!Array.isArray(preset.blocks) || preset.blocks.length === 0 ||
            !preset.blocks.every(isPositiveInteger)) {
            problems.push("Blocks must be a non-empty list of positive whole numbers.");
        }
        if (!Array.isArray(preset.processes) || preset.processes.length === 0 ||
            !preset.processes.every(isPositiveInteger)) {
            problems.push("Processes must be a non-empty list of positive whole numbers.");
        }
        return problems;
    }

    function getAll() {
        return clone(PRESETS);
    }

    function getIds() {
        return PRESETS.map((preset) => preset.id);
    }

    function getById(id) {
        const found = PRESETS.find((preset) => preset.id === id);
        return found ? clone(found) : null;
    }

    // Converts a preset into the arguments expected by
    // MemoryAnalyzer.simulateAll(blockSizes, processSizes, mode, osReserved).
    function toSimulationInput(preset) {
        return {
            blockSizes: preset.blocks.slice(),
            processSizes: preset.processes.slice(),
            mode: preset.mode,
            osReserved: preset.osReserved || 0
        };
    }

    // Runs every preset through `simulateAll` (normally
    // MemoryAnalyzer.simulateAll) and returns one entry per preset.
    function benchmark(simulateAll) {
        if (typeof simulateAll !== "function") {
            throw new TypeError("benchmark() needs a simulateAll function.");
        }
        return PRESETS.map((preset) => {
            const input = toSimulationInput(preset);
            return {
                preset: clone(preset),
                results: simulateAll(
                    input.blockSizes,
                    input.processSizes,
                    input.mode,
                    input.osReserved
                )
            };
        });
    }

    const api = {
        MODES,
        ALGORITHMS,
        getAll,
        getIds,
        getById,
        toSimulationInput,
        validate,
        benchmark
    };

    root.Presets = api;
    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    }
})(typeof window !== "undefined" ? window : globalThis);
