# ⚡ PLC Logic Arena — LeetCode for Industrial PLC Ladder Logic

**Problem Statement 07: Online Ladder Logic Editor, Virtual PLC Execution, Virtual I/O, Automated Output Comparison, Scoring, and Fault Simulation.**

---

## 🌟 Overview

**PLC Logic Arena** is a full-stack, competitive programming and learning platform tailored specifically for industrial automation. Just like **LeetCode** allows software developers to solve algorithmic challenges against hidden unit tests, **PLC Logic Arena** provides automation engineers with an interactive IEC 61131-3 visual ladder editor, a virtual PLC scan cycle execution engine, interactive SCADA digital twin telemetry, and automated test runners.

---

## 🏗️ Architecture & Workflow

```
               ┌──────────────────────────────────────┐
               │              USER LOGIN              │
               │   Student / Admin / 1-Click Demo     │
               └──────────────────┬───────────────────┘
                                  ↓
               ┌──────────────────────────────────────┐
               │          PROBLEM DASHBOARD           │
               │     Easy / Medium / Hard Filters     │
               └──────────────────┬───────────────────┘
                                  ↓
               ┌──────────────────────────────────────┐
               │           SELECT PROBLEM             │
               │   "Motor Start/Stop", "Dual Tank"    │
               └──────────────────┬───────────────────┘
                                  ↓
        ┌─────────────────────────────────────────────────────────┐
        │                  LADDER LOGIC EDITOR                    │
        │                                                         │
        │   +24V (L1) ───[ X0 ]───[/ X1 ]────────( Y0 )─── 0V (N) │
        │                   |                                     │
        │                   +───[ Y0 ]──+ (Seal-In Latch)         │
        │                                                         │
        │   Contacts   Coils   Set/Reset   Timers   Counters      │
        └─────────────────────────┬───────────────────────────────┘
                                  ↓
               ┌──────────────────────────────────────┐
               │             VIRTUAL PLC              │
               │     20Hz Cyclic Scan Engine          │
               │  Read Inputs → Logic → Update Outputs│
               └──────────────────┬───────────────────┘
                                  ↓
                ┌─────────────────┴─────────────────┐
                ↓                                   ↓
        PUBLIC TEST CASES                   HIDDEN TEST CASES
        (Step-by-step trace)                (Secret Edge Cases)
                │                                   │
                └─────────────────┬─────────────────┘
                                  ↓
               ┌──────────────────────────────────────┐
               │          OUTPUT COMPARISON           │
               │    Expected (TRUE) vs Actual (TRUE)  │
               └──────────────────┬───────────────────┘
                                  ↓
               ┌──────────────────────────────────────┐
               │            SCORE & BADGES            │
               │   100% Passed • Global Leaderboard   │
               └──────────────────────────────────────┘
```

---

## 🚀 Key Features

### 1. Visual Ladder Logic Editor (IEC 61131-3)
- **Power Rails**: Red 24V DC live phase rail and Blue 0V DC neutral return rail.
- **Active Current Visualization**: Live wires illuminate in high-voltage neon green (`#00ff88`) with glow effects when conducting current.
- **Component Palette**:
  - `—[ ]—` Normally Open (NO) Contact
  - `—[/]—` Normally Closed (NC) Contact
  - `—( )—` Standard Output Coil
  - `—(S)—` Set / Latch Coil
  - `—(R)—` Reset / Unlatch Coil
  - `[TON]` Timer On-Delay (configurable preset in ms)
  - `[CTU]` Up-Counter (rising-edge trigger, configurable preset)
  - `+ Parallel Branch`: Parallel paths for auxiliary contact seal-in latching!

### 2. Virtual PLC Execution Engine
- Cyclic scan cycle (Read Inputs $\rightarrow$ Execute Rungs $\rightarrow$ Update Outputs).
- Support for internal memory flags (`M0..M7`), timer accumulators (`T0..T3`), and counter registers (`C0..C3`).
- Single scan step mode (`Step Forward`) or Continuous scan (`Scan Loop`).

### 3. Digital Twin & Virtual I/O Hardware Rack
- **Tactile Inputs**: Momentary pushbuttons (Push & Hold to mimic industrial start buttons) and toggle switches.
- **Animated Actuators**:
  - Rotating industrial induction motor with live RPM readout.
  - Conveyor sorting belt with moving packages and diverter gates.
  - High-visibility run lamps, alarm beacons, and warning buzzers.
- **Fault-Condition Simulation**:
  - Normal Operation
  - Emergency Stop Tripped
  - Motor Thermal Overload Tripped
  - Proximity Sensor Stuck Fault
  - Severed Input Wire

### 4. LeetCode-Style Testing & Verification
- **Run Public Tests**: Chronological sequence execution, displaying step-by-step inputs applied, expected outputs vs actual outputs, and color-coded diffs.
- **Submit Solution**: Evaluates both public tests and hidden industrial stress-test suites securely on the backend.
- **Scoring**: Calculates pass percentage and triggers celebratory particle confetti on 100% accepted submissions.

### 5. Leaderboard & Admin Studio
- **Leaderboard**: Global rankings tracking score points, solved problems count, and engineer badges.
- **Admin Studio**: Allows instructors to define new problems, input/output address mappings, descriptions, public tests, and hidden test suites.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Lucide Icons, Canvas-Confetti, Custom Industrial Dark CSS |
| **Backend** | Node.js, Express.js, JWT Authentication |
| **Database** | Dual Mode: MongoDB supported + Built-in resilient JSON File Store fallback |
| **PLC Engine** | JavaScript IEC 61131-3 virtual simulation engine |

---

## 🏁 Getting Started

### 1. Install & Start the Application

To run the unified server (which serves both the API and the React frontend on `http://localhost:5000`):

```bash
# Start the full-stack server
npm start
```

Or for development with Vite Hot Module Reloading:

```bash
# Terminal 1: Start Backend API (Port 5000)
npm run server

# Terminal 2: Start Frontend Dev Server (Port 5173 with proxy to 5000)
npm run client
```

### 2. Access the Application
Open your browser at:
👉 **`http://localhost:5000`**

### 3. Quick Demo Logins
- **Student Login**: Click **1-Click Demo** $\rightarrow$ **Quick Student Login**
- **Admin Login**: Click **Admin Studio** or **Quick Admin Login** (`admin@plc.com` / `admin123`)
