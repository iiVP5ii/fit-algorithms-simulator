// Memory models and compaction
// Name: Khubayb Basri
// Student ID: 461004793

class Process {
    constructor(pid, size, name = '') {
        this.pid = pid;
        this.size = Number(size);
        this.name = name || `P${pid}`;
        this.isAllocated = false;
        this.allocatedBlockId = null;
    }

    clone() {
        const copy = new Process(this.pid, this.size, this.name);
        copy.isAllocated = this.isAllocated;
        copy.allocatedBlockId = this.allocatedBlockId;
        return copy;
    }
}

class MemoryBlock {
    constructor({ id, size, originalSize = 0, process = null,
                  isOS = false, label = '', start = 0 }) {
        this.id = id;
        this.size = Number(size);
        this.originalSize = originalSize || this.size;
        this.process = process ? process.clone() : null;
        this.isOS = isOS;
        this.label = label || (isOS ? 'OS' : `B${id}`);
        this.start = start;
    }

    get end() {
        return this.start + this.size;
    }

    get isFree() {
        return !this.isOS && this.process === null;
    }

    get internalFragmentation() {
        if (this.process === null) return 0;
        return Math.max(0, this.size - this.process.size);
    }

    clone() {
        return new MemoryBlock(this);
    }
}

class CandidateEvaluation {
    constructor(blockId, label, blockSize, fits, leftover, chosen = false) {
        this.blockId = blockId;
        this.label = label;
        this.blockSize = blockSize;
        this.fits = fits;
        this.leftover = leftover;
        this.chosen = chosen;
    }
}

class AllocationStep {
    constructor({ stepNumber, process, chosenBlockId = null,
                  chosenLabel = '', status = 'ALLOCATED', message = '',
                  leftover = 0, splitLabel = '', candidates = [], snapshot = [] }) {
        this.stepNumber = stepNumber;
        this.process = process.clone();
        this.chosenBlockId = chosenBlockId;
        this.chosenLabel = chosenLabel;
        this.status = status;
        this.message = message;
        this.leftover = leftover;
        this.splitLabel = splitLabel;
        this.candidates = candidates;
        this.snapshot = snapshot.map(block => block.clone());
    }
}

function assignAddresses(blocks) {
    let address = 0;

    for (const block of blocks) {
        block.start = address;
        address += block.size;
    }

    return address;
}

function buildInitialMemory(blockSizes, osReserved = 0) {
    const blocks = [];

    if (osReserved > 0) {
        blocks.push(new MemoryBlock({
            id: 0,
            size: osReserved,
            isOS: true
        }));
    }

    for (let i = 0; i < blockSizes.length; i++) {
        blocks.push(new MemoryBlock({
            id: i + 1,
            size: blockSizes[i]
        }));
    }

    assignAddresses(blocks);
    return blocks;
}

function buildProcesses(processSizes) {
    const processes = [];

    for (let i = 0; i < processSizes.length; i++) {
        processes.push(new Process(i + 1, processSizes[i]));
    }

    return processes;
}

function performCompaction(blocks) {
    const compactedBlocks = [];
    let totalFreeMerged = 0;
    let nextId = 1;

    // Keep the operating system at the beginning.
    for (const block of blocks) {
        if (block.isOS) {
            compactedBlocks.push(block.clone());
        }
    }

    // Keep allocated blocks and collect free memory.
    for (const block of blocks) {
        nextId = Math.max(nextId, block.id + 1);

        if (block.isFree) {
            totalFreeMerged += block.size;
        } else if (!block.isOS) {
            compactedBlocks.push(block.clone());
        }
    }

    // Merge all free holes into one block.
    if (totalFreeMerged > 0) {
        compactedBlocks.push(new MemoryBlock({
            id: nextId,
            size: totalFreeMerged,
            label: 'Free (Compacted)'
        }));
    }

    assignAddresses(compactedBlocks);

    return { compactedBlocks, totalFreeMerged };
}

window.MemoryModels = {
    Process,
    MemoryBlock,
    CandidateEvaluation,
    AllocationStep,
    assignAddresses,
    buildInitialMemory,
    buildProcesses,
    performCompaction
};
