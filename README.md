# Memory Allocation Simulator

## Project Overview

This project is an educational memory allocation simulator developed for the Operating Systems course (CCS 3361).

It demonstrates how three contiguous memory allocation algorithms work:

- First Fit
- Best Fit
- Worst Fit

The simulator is designed to help students understand memory allocation, fragmentation, and the differences between allocation strategies.

## Technologies Used

- HTML — User interface structure
- CSS — Interface styling and animations
- JavaScript — Simulation logic and interactions
- Node.js — Local HTTP server
- Git and GitHub — Version control and team collaboration

## Planned Features

- Fixed and dynamic memory allocation
- First Fit, Best Fit, and Worst Fit simulations
- Memory block and process management
- Step-by-step allocation visualization
- Memory utilization and fragmentation analysis
- Algorithm comparison charts
- Memory compaction
- Sound effects with a mute option

Note: Features are implemented and verified progressively as team development continues.

## How to Run

### Requirements

- Node.js
- A modern web browser

### Instructions

1. Download or clone this repository.
2. Open the project folder in Visual Studio Code.
3. Open a terminal in the project root directory.
4. Run:

   `npm start`

5. Open the following URL in your browser:

   `http://127.0.0.1:3000`

6. Use the simulator when the application interface is ready.

## Project Structure

```text
public/
  css/
    style.css
    animations.css
  js/
    algorithms.js
    analyzer.js
    app.js
    audio.js
    charts.js
    memory.js
    presets.js
    visualizer.js
  index.html

server.js
package.json
README.md
```

## Team Responsibilities

### Team 1 — Simulation Engine and Analysis

Khubaib Basri and Azzam Al-Khattabi

Responsible for memory models, allocation algorithms, compaction, and performance analysis.

### Team 2 — User Interface and Interaction

Wasel and Ahmed

Responsible for the application controller, visual design, memory maps, and simulation controls.

### Team 3 — Comparison, Support, and Integration

Ahmed and Haitham

Responsible for comparison charts, benchmark presets, sound effects, local server, documentation, and integration testing.

## Testing

The project will be tested for:

- Correct algorithm behavior
- Successful and failed memory allocation
- Memory utilization and fragmentation calculations
- Step-by-step simulation functionality
- Sound playback and muting
- Local HTTP server operation
- Integration between application modules

## Development Status

The project is currently under development. Features will be updated and tested as each team completes its assigned modules.
