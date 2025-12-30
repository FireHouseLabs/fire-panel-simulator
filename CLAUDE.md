# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ampac FireFinder Simulator is an interactive training application for firefighters to practice using fire alarm panels. It simulates three different fire alarm control panels with high-fidelity UI/UX:
- **Ampac FireFinder Plus**: Addressable system with text-heavy LCD interface
- **Pertronic F220**: Modern visual system with color-coded high-res display
- **ZoneSense Plus**: Conventional LED-driven interface

The simulator generates randomized realistic fire alarm scenarios with various event types (fires, faults, persistent equipment failures).

## Development Commands

### Installation
```bash
npm install
```

### Running the App
```bash
npm run dev
```
Runs on `http://localhost:3000` (configured in vite.config.ts)

### Building
```bash
npm run build
```

### Preview Production Build
```bash
npm preview
```

## Architecture

### State Management
The entire application state is managed in `App.tsx` using React's `useState`. The core `PanelState` interface (defined in `types.ts`) tracks:
- Active alarms and their properties
- Isolated zones
- Buzzer and alarm silence states
- Training stats (score, actions, feedback)
- User input mode and numeric input buffer

### Audio System
Audio feedback (buzzer and siren) is implemented using the Web Audio API:
- **Buzzer**: 880Hz square wave (local panel alert)
- **Siren**: Sawtooth wave sweeping 400Hz-1200Hz (external building alarms)
- Audio logic controller in `useEffect` manages when sounds play based on alarm state and silence buttons

### Panel-Specific UI
Each panel has different operational protocols enforced in code:
- **FireFinder Plus**: Requires `alarmsSilenced` before reset
- **Pertronic F220**: Requires BOTH `buzzerSilenced` AND `alarmsSilenced` before reset
- **ZoneSense Plus**: Same as F220 but with different UI/button labels

The F220's "Disable" button acts as a bulk isolate for all active alarm zones when alarms are present.

### Training System
Training feedback is scored based on user actions:
- Silence Buzzer: +10 points
- Silence Alarms: +20 points
- Zone Isolation: +20 points per zone
- Successful Reset: +100 points + time bonus (max 100)
- Protocol violations (improper reset sequence): -50 to -60 points
- Re-alarming after reset: -30 points

Ranks are assigned based on total score: Trainee (0-49), Recruit (50-99), Firefighter (100-149), Senior Firefighter (150-199), Station Officer (200+).

### Scenario Generation
`services/geminiService.ts` (naming kept for compatibility) generates randomized fire scenarios from predefined templates. The system includes:
- 8 scenario templates covering common fire panel situations (kitchen fires, equipment faults, multi-zone events)
- 20+ realistic building locations (lobbies, server rooms, car parks, stairwells)
- 8 device types (smoke detectors, heat detectors, manual call points, etc.)
- Each event includes zone, loop, device numbers, location, status, and persistence flag
- `isPersistent` flag: determines if isolation is required to clear the alarm

### Component Structure
- `App.tsx`: Main application logic and panel rendering
- `Home.tsx`: Panel selection screen
- `LCDDisplay.tsx`: FireFinder Plus LCD component
- `F220LCD.tsx`: Pertronic F220 high-res display
- `ZoneSensePanel.tsx`: Complete ZoneSense panel UI
- `LED.tsx`: Reusable LED indicator with flash animation
- `PanelButton.tsx`: Reusable panel button with variants (default, red, yellow, green, keypad)

## TypeScript Configuration

Uses path alias `@/*` for root imports (configured in `tsconfig.json` and `vite.config.ts`). Experimental decorators enabled with `useDefineForClassFields: false`.

## Key Implementation Details

### Input Modes
The `inputTarget` state controls what numeric keypad input represents:
- `NONE`: No active input
- `ZONE`, `DEVICE`, `LOOP`: Selecting specific identifiers
- `DISABLE_SELECT`: Awaiting 1 (isolate) or 0 (enable) after zone selection

### Reset Logic
The reset flow includes a 2-second `isResetting` period, then:
1. Checks for unisolated persistent faults
2. If any exist, alarm re-triggers (re-alarming)
3. Otherwise, clears alarms and displays training results
4. Calculates final score with time-based bonus

### Alarm Display Navigation
When multiple alarms exist, use `currentDisplayIndex` to cycle through them with PREVIOUS/NEXT buttons. The "Several Alarms" indicator lights when `state.alarms.length > 1`.

### View Management
`AppView` type controls which panel is rendered. The Home view allows selection, then switches to panel-specific full UIs.
