export const seedProblems = [
  {
    id: "prob-01",
    title: "Motor Start / Stop (3-Wire Seal-in)",
    difficulty: "Easy",
    category: "Latching Logic",
    tag: "Motor Control",
    timeLimitMs: 5000,
    description: `### Industrial Problem Statement
Implement standard 3-wire motor control logic with auxiliary contact latching (seal-in circuit) and thermal overload protection.

### Requirements:
1. When **START** push-button (\`X0\`) is pressed (even momentarily), the motor contactor (\`Y0\`) and RUN lamp (\`Y1\`) must turn **ON**.
2. When **START** (\`X0\`) is released, the motor contactor (\`Y0\`) and RUN lamp (\`Y1\`) must **remain ON** via seal-in logic (latching).
3. When **STOP** push-button (\`X1\`) is pressed (simulated as active-high stop signal in standard ladder), the motor must turn **OFF**.
4. When **THERMAL OVERLOAD** (\`X2\`) trips (TRUE), the motor must turn **OFF** immediately and cannot be started.

### Standard Ladder Architecture Hint:
- Rung 0: Branch with \`[NO X0]\` in parallel with \`[NO Y0]\`, followed by series \`[NC X1]\`, \`[NC X2]\`, terminating in \`[COIL Y0]\`.
- Rung 1: \`[NO Y0]\` terminating in \`[COIL Y1]\` (Run Lamp).`,
    inputs: [
      { address: "X0", name: "START_PB", description: "Start Pushbutton (NO momentary)", type: "momentary" },
      { address: "X1", name: "STOP_PB", description: "Stop Pushbutton (Press to Stop)", type: "momentary" },
      { address: "X2", name: "OVERLOAD_OL", description: "Motor Overload Relay Trip", type: "toggle" }
    ],
    outputs: [
      { address: "Y0", name: "MOTOR_KM1", description: "Main Motor Contactor Coil", color: "#10b981" },
      { address: "Y1", name: "RUN_LAMP", description: "Green Run Indicator Lamp", color: "#06b6d4" }
    ],
    starterLadder: {
      rungs: [
        {
          id: "rung-1",
          comment: "Motor Start/Stop with Auxiliary Contact Seal-in",
          elements: [
            {
              type: "BRANCH",
              branches: [
                [{ type: "NO", address: "X0" }],
                [{ type: "NO", address: "Y0" }]
              ]
            },
            { type: "NC", address: "X1" },
            { type: "NC", address: "X2" },
            { type: "COIL", address: "Y0" }
          ]
        },
        {
          id: "rung-2",
          comment: "Run Indicator Lamp",
          elements: [
            { type: "NO", address: "Y0" },
            { type: "COIL", address: "Y1" }
          ]
        }
      ]
    },
    publicTests: [
      {
        name: "Test 1: Initial Motor State (Off)",
        description: "All inputs low, motor must be OFF",
        steps: [
          {
            step: 1,
            description: "No buttons pressed",
            inputs: { X0: false, X1: false, X2: false },
            expected: { Y0: false, Y1: false }
          }
        ]
      },
      {
        name: "Test 2: Start Button Press and Seal-In",
        description: "Motor turns ON and stays ON after button release",
        steps: [
          {
            step: 1,
            description: "Press Start X0",
            inputs: { X0: true, X1: false, X2: false },
            expected: { Y0: true, Y1: true }
          },
          {
            step: 2,
            description: "Release Start X0 (Seal-in check)",
            inputs: { X0: false, X1: false, X2: false },
            expected: { Y0: true, Y1: true }
          }
        ]
      },
      {
        name: "Test 3: Stop Button Stops Motor",
        description: "Pressing Stop turns motor and lamp OFF",
        steps: [
          {
            step: 1,
            description: "Start the motor",
            inputs: { X0: true, X1: false, X2: false },
            expected: { Y0: true, Y1: true }
          },
          {
            step: 2,
            description: "Release Start button",
            inputs: { X0: false, X1: false, X2: false },
            expected: { Y0: true, Y1: true }
          },
          {
            step: 3,
            description: "Press Stop X1",
            inputs: { X0: false, X1: true, X2: false },
            expected: { Y0: false, Y1: false }
          },
          {
            step: 4,
            description: "Release Stop X1 (Motor remains OFF)",
            inputs: { X0: false, X1: false, X2: false },
            expected: { Y0: false, Y1: false }
          }
        ]
      }
    ],
    hiddenTests: [
      {
        name: "Hidden 1: Overload Relay Trip while running",
        steps: [
          {
            step: 1,
            description: "Run motor",
            inputs: { X0: true, X1: false, X2: false },
            expected: { Y0: true, Y1: true }
          },
          {
            step: 2,
            description: "Trip Thermal Overload (X2=true)",
            inputs: { X0: false, X1: false, X2: true },
            expected: { Y0: false, Y1: false }
          }
        ]
      },
      {
        name: "Hidden 2: Cannot start motor while Overload is active",
        steps: [
          {
            step: 1,
            description: "Attempt start with Overload active",
            inputs: { X0: true, X1: false, X2: true },
            expected: { Y0: false, Y1: false }
          }
        ]
      },
      {
        name: "Hidden 3: Simultaneous Start and Stop priority",
        steps: [
          {
            step: 1,
            description: "Both Start and Stop pressed together (Stop must win)",
            inputs: { X0: true, X1: true, X2: false },
            expected: { Y0: false, Y1: false }
          }
        ]
      }
    ]
  },
  {
    id: "prob-02",
    title: "Conveyor Belt Part Sorter & Batch Counter",
    difficulty: "Easy",
    category: "Counters",
    tag: "Factory Automation",
    description: `### Industrial Problem Statement
A manufacturing line requires automated batch counting. When an optical proximity sensor detects parts moving on the conveyor, a counter must register each item.

### Requirements:
1. When the conveyor run switch (\`X0\`) is ON, conveyor motor (\`Y0\`) runs.
2. An optical proximity sensor (\`X1\`) generates a pulse each time a component passes.
3. Use Counter \`C0\` with preset = 5.
4. When 5 parts have passed (\`C0\` is done), Diverter Gate (\`Y1\`) must actuate to route the finished bin to packing, and Warning Buzzer (\`Y2\`) must sound.
5. Pressing Reset Button (\`X2\`) resets counter \`C0\` and deactivates diverter gate \`Y1\` and buzzer \`Y2\`.`,
    inputs: [
      { address: "X0", name: "CONVEYOR_RUN", description: "Conveyor Run Toggle Switch", type: "toggle" },
      { address: "X1", name: "PART_SENSOR", description: "Optical Proximity Sensor PE1", type: "momentary" },
      { address: "X2", name: "BATCH_RESET", description: "Batch Reset Pushbutton", type: "momentary" }
    ],
    outputs: [
      { address: "Y0", name: "CONVEYOR_MOTOR", description: "Conveyor Drive Motor", color: "#3b82f6" },
      { address: "Y1", name: "DIVERT_GATE", description: "Pneumatic Diverter Gate", color: "#f59e0b" },
      { address: "Y2", name: "BATCH_BUZZER", description: "Batch Complete Buzzer", color: "#ef4444" }
    ],
    starterLadder: {
      rungs: [
        {
          id: "rung-1",
          comment: "Conveyor Run Logic",
          elements: [
            { type: "NO", address: "X0" },
            { type: "COIL", address: "Y0" }
          ]
        },
        {
          id: "rung-2",
          comment: "Part Counter (Preset 5)",
          elements: [
            { type: "NO", address: "X1" },
            { type: "CTU", address: "C0", preset: 5 }
          ]
        },
        {
          id: "rung-3",
          comment: "Batch Complete Divert & Buzzer",
          elements: [
            { type: "NO", address: "C0" },
            { type: "COIL", address: "Y1" }
          ]
        },
        {
          id: "rung-4",
          comment: "Warning Buzzer on Complete",
          elements: [
            { type: "NO", address: "C0" },
            { type: "COIL", address: "Y2" }
          ]
        },
        {
          id: "rung-5",
          comment: "Counter Reset",
          elements: [
            { type: "NO", address: "X2" },
            { type: "RESET", address: "C0" }
          ]
        }
      ]
    },
    publicTests: [
      {
        name: "Test 1: Conveyor runs with X0",
        steps: [
          {
            step: 1,
            inputs: { X0: true, X1: false, X2: false },
            expected: { Y0: true, Y1: false, Y2: false }
          }
        ]
      },
      {
        name: "Test 2: Count 5 parts triggers diverter and buzzer",
        steps: [
          { step: 1, inputs: { X0: true, X1: true, X2: false }, expected: { Y0: true, Y1: false, Y2: false } },
          { step: 2, inputs: { X0: true, X1: false, X2: false }, expected: { Y0: true, Y1: false, Y2: false } },
          { step: 3, inputs: { X0: true, X1: true, X2: false }, expected: { Y0: true, Y1: false, Y2: false } },
          { step: 4, inputs: { X0: true, X1: false, X2: false }, expected: { Y0: true, Y1: false, Y2: false } },
          { step: 5, inputs: { X0: true, X1: true, X2: false }, expected: { Y0: true, Y1: false, Y2: false } },
          { step: 6, inputs: { X0: true, X1: false, X2: false }, expected: { Y0: true, Y1: false, Y2: false } },
          { step: 7, inputs: { X0: true, X1: true, X2: false }, expected: { Y0: true, Y1: false, Y2: false } },
          { step: 8, inputs: { X0: true, X1: false, X2: false }, expected: { Y0: true, Y1: false, Y2: false } },
          { step: 9, inputs: { X0: true, X1: true, X2: false }, expected: { Y0: true, Y1: true, Y2: true } }
        ]
      }
    ],
    hiddenTests: [
      {
        name: "Hidden 1: Reset clears diverter and buzzer",
        steps: [
          { step: 1, inputs: { X0: true, X1: true, X2: false }, expected: { Y0: true } },
          { step: 2, inputs: { X0: true, X1: false, X2: false }, expected: { Y0: true } },
          { step: 3, inputs: { X0: true, X1: true, X2: false }, expected: { Y0: true } },
          { step: 4, inputs: { X0: true, X1: false, X2: false }, expected: { Y0: true } },
          { step: 5, inputs: { X0: true, X1: true, X2: false }, expected: { Y0: true } },
          { step: 6, inputs: { X0: true, X1: false, X2: false }, expected: { Y0: true } },
          { step: 7, inputs: { X0: true, X1: true, X2: false }, expected: { Y0: true } },
          { step: 8, inputs: { X0: true, X1: false, X2: false }, expected: { Y0: true } },
          { step: 9, inputs: { X0: true, X1: true, X2: false }, expected: { Y1: true, Y2: true } },
          { step: 10, inputs: { X0: true, X1: false, X2: true }, expected: { Y1: false, Y2: false } }
        ]
      }
    ]
  },
  {
    id: "prob-03",
    title: "Dual Tank Fill Level Control (Hysteresis)",
    difficulty: "Medium",
    category: "Process Automation",
    tag: "Pumps & Valves",
    description: `### Industrial Problem Statement
Design an automated water tank filling control system with low-level and high-level float switches.

### Requirements:
1. Low Level Switch (\`X0\`): Closes (TRUE) when water covers the bottom of the tank.
2. High Level Switch (\`X1\`): Closes (TRUE) when water reaches the top safe limit.
3. When water is BELOW low level (\`X0\` = false), Fill Pump (\`Y0\`) must turn **ON**.
4. The pump must **continue pumping** as the water rises above low level (\`X0\` = true).
5. When water reaches the high level (\`X1\` = true), the pump (\`Y0\`) must **shut OFF**, and Tank Full Lamp (\`Y1\`) must illuminate.
6. The pump must NOT restart while water drains until it drops below \`X0\` again!
7. If water is below low level, Low Level Alarm (\`Y2\`) sounds.`,
    inputs: [
      { address: "X0", name: "LOW_LEVEL_SW", description: "Low Level Float Switch (ON when water >= Low)", type: "toggle" },
      { address: "X1", name: "HIGH_LEVEL_SW", description: "High Level Float Switch (ON when water >= High)", type: "toggle" }
    ],
    outputs: [
      { address: "Y0", name: "FILL_PUMP", description: "Inlet Water Pump Motor", color: "#0ea5e9" },
      { address: "Y1", name: "TANK_FULL_LED", description: "High Level Indicator Lamp", color: "#10b981" },
      { address: "Y2", name: "LOW_ALARM", description: "Low Water Alarm Beacon", color: "#ef4444" }
    ],
    starterLadder: {
      rungs: [
        {
          id: "rung-1",
          comment: "Pump Seal-in: Starts on low-low, stays on until High-level opens NC X1",
          elements: [
            {
              type: "BRANCH",
              branches: [
                [{ type: "NC", address: "X0" }],
                [{ type: "NO", address: "Y0" }]
              ]
            },
            { type: "NC", address: "X1" },
            { type: "COIL", address: "Y0" }
          ]
        },
        {
          id: "rung-2",
          comment: "High Level Full Indicator",
          elements: [
            { type: "NO", address: "X1" },
            { type: "COIL", address: "Y1" }
          ]
        },
        {
          id: "rung-3",
          comment: "Low Level Alarm",
          elements: [
            { type: "NC", address: "X0" },
            { type: "COIL", address: "Y2" }
          ]
        }
      ]
    },
    publicTests: [
      {
        name: "Test 1: Empty Tank starts pump and alarm",
        steps: [
          {
            step: 1,
            inputs: { X0: false, X1: false },
            expected: { Y0: true, Y1: false, Y2: true }
          }
        ]
      },
      {
        name: "Test 2: Rising water (mid level) keeps pump running, clears alarm",
        steps: [
          {
            step: 1,
            inputs: { X0: false, X1: false },
            expected: { Y0: true, Y2: true }
          },
          {
            step: 2,
            inputs: { X0: true, X1: false },
            expected: { Y0: true, Y2: false }
          }
        ]
      },
      {
        name: "Test 3: Full tank stops pump and lights full lamp",
        steps: [
          {
            step: 1,
            inputs: { X0: true, X1: true },
            expected: { Y0: false, Y1: true, Y2: false }
          }
        ]
      }
    ],
    hiddenTests: [
      {
        name: "Hidden 1: Draining tank does not turn pump on until below low",
        steps: [
          { step: 1, inputs: { X0: true, X1: true }, expected: { Y0: false } },
          { step: 2, inputs: { X0: true, X1: false }, expected: { Y0: false } },
          { step: 3, inputs: { X0: false, X1: false }, expected: { Y0: true } }
        ]
      }
    ]
  },
  {
    id: "prob-04",
    title: "Star-Delta Motor Starter (Timer TON)",
    difficulty: "Medium",
    category: "Timers",
    tag: "Motor Starting",
    description: `### Industrial Problem Statement
To limit heavy inrush current during starting of large three-phase induction motors, a Star-Delta (Wye-Delta) starter is used.

### Requirements:
1. Pressing **START** (\`X0\`) turns ON **Main Contactor** (\`Y0\`) and **Star Contactor** (\`Y1\`), and starts **Timer \`T0\`** (Preset: 3000ms).
2. Auxiliary seal-in contact of \`Y0\` keeps the circuit energized after \`X0\` release.
3. During the 3-second timing period: \`Y0\` = ON, \`Y1\` = ON, \`Y2\` = OFF.
4. When timer \`T0\` elapses (3 seconds):
   - **Star Contactor** (\`Y1\`) turns **OFF**.
   - **Delta Contactor** (\`Y2\`) turns **ON**.
5. Pressing **STOP** (\`X1\`) immediately turns OFF all contactors (\`Y0\`, \`Y1\`, \`Y2\`) and resets timer \`T0\`.`,
    inputs: [
      { address: "X0", name: "START_PB", description: "Start Pushbutton", type: "momentary" },
      { address: "X1", name: "STOP_PB", description: "Stop Pushbutton", type: "momentary" }
    ],
    outputs: [
      { address: "Y0", name: "MAIN_CONTACTOR", description: "Main Line Contactor KM1", color: "#10b981" },
      { address: "Y1", name: "STAR_CONTACTOR", description: "Star Winding Contactor KM2", color: "#f59e0b" },
      { address: "Y2", name: "DELTA_CONTACTOR", description: "Delta Full Run Contactor KM3", color: "#3b82f6" }
    ],
    starterLadder: {
      rungs: [
        {
          id: "rung-1",
          comment: "Main Contactor Latch",
          elements: [
            {
              type: "BRANCH",
              branches: [
                [{ type: "NO", address: "X0" }],
                [{ type: "NO", address: "Y0" }]
              ]
            },
            { type: "NC", address: "X1" },
            { type: "COIL", address: "Y0" }
          ]
        },
        {
          id: "rung-2",
          comment: "Star-Delta 3-Second Transition Timer",
          elements: [
            { type: "NO", address: "Y0" },
            { type: "TON", address: "T0", preset: 3000 }
          ]
        },
        {
          id: "rung-3",
          comment: "Star Contactor (Energized while T0 is NOT done)",
          elements: [
            { type: "NO", address: "Y0" },
            { type: "NC", address: "T0" },
            { type: "COIL", address: "Y1" }
          ]
        },
        {
          id: "rung-4",
          comment: "Delta Contactor (Energized when T0 IS done)",
          elements: [
            { type: "NO", address: "Y0" },
            { type: "NO", address: "T0" },
            { type: "COIL", address: "Y2" }
          ]
        }
      ]
    },
    publicTests: [
      {
        name: "Test 1: Start phase - Main and Star ON, Delta OFF",
        steps: [
          {
            step: 1,
            inputs: { X0: true, X1: false },
            durationMs: 50,
            expected: { Y0: true, Y1: true, Y2: false }
          },
          {
            step: 2,
            inputs: { X0: false, X1: false },
            durationMs: 500,
            expected: { Y0: true, Y1: true, Y2: false }
          }
        ]
      },
      {
        name: "Test 2: After 3 seconds - Star turns OFF, Delta turns ON",
        steps: [
          {
            step: 1,
            inputs: { X0: true, X1: false },
            durationMs: 100,
            expected: { Y0: true, Y1: true, Y2: false }
          },
          {
            step: 2,
            inputs: { X0: false, X1: false },
            durationMs: 3100,
            expected: { Y0: true, Y1: false, Y2: true }
          }
        ]
      }
    ],
    hiddenTests: [
      {
        name: "Hidden 1: Stop during Star phase aborts immediately",
        steps: [
          { step: 1, inputs: { X0: true, X1: false }, durationMs: 100, expected: { Y0: true, Y1: true } },
          { step: 2, inputs: { X0: false, X1: true }, durationMs: 100, expected: { Y0: false, Y1: false, Y2: false } }
        ]
      },
      {
        name: "Hidden 2: Stop during Delta phase shuts down all",
        steps: [
          { step: 1, inputs: { X0: true, X1: false }, durationMs: 3200, expected: { Y0: true, Y2: true } },
          { step: 2, inputs: { X0: false, X1: true }, durationMs: 100, expected: { Y0: false, Y1: false, Y2: false } }
        ]
      }
    ]
  },
  {
    id: "prob-05",
    title: "Safety Guard Interlock & Emergency Stop Circuit",
    difficulty: "Easy",
    category: "Safety Systems",
    tag: "ISO 13849 Safety",
    description: `### Industrial Problem Statement
Implement a Category 3 / SIL 2 safety monitoring circuit. For human safety, an industrial stamping press must never energize power to actuators unless the safety gate interlock is closed, the Emergency Stop is healthy, and a manual Master Reset is deliberately pressed.

### Requirements:
1. **Safety Gate Switch** (\`X0\`): Closed (\`true\`) when the physical guard door is shut.
2. **Emergency Stop Button** (\`X1\`): Closed (\`true\` in healthy condition; false if struck/pressed).
3. **Master Reset Pushbutton** (\`X2\`): Momentary button used by the operator to re-arm safety power.
4. **Safety Relay Enabled** (\`Y0\`): Main 24V safety circuit power.
5. **Safety Fault Beacon** (\`Y1\`): Lights up if gate is open OR E-Stop is pressed while machine was running.`,
    inputs: [
      { address: "X0", name: "GATE_CLOSED", description: "Safety Guard Door Closed Switch", type: "toggle" },
      { address: "X1", name: "ESTOP_HEALTHY", description: "E-Stop NC contact (True=Normal, False=E-Stop Struck)", type: "toggle" },
      { address: "X2", name: "RESET_PB", description: "Master Safety Reset Pushbutton", type: "momentary" }
    ],
    outputs: [
      { address: "Y0", name: "SAFETY_POWER_OK", description: "Master Safety Relay Output", color: "#10b981" },
      { address: "Y1", name: "FAULT_BEACON", description: "Safety Trip Alarm Beacon", color: "#ef4444" }
    ],
    starterLadder: {
      rungs: [
        {
          id: "rung-1",
          comment: "Safety Relay Latch (Requires Gate + E-Stop + Reset PB)",
          elements: [
            {
              type: "BRANCH",
              branches: [
                [{ type: "NO", address: "X2" }],
                [{ type: "NO", address: "Y0" }]
              ]
            },
            { type: "NO", address: "X0" },
            { type: "NO", address: "X1" },
            { type: "COIL", address: "Y0" }
          ]
        },
        {
          id: "rung-2",
          comment: "Fault Alarm when Safety Power is tripped",
          elements: [
            { type: "NC", address: "Y0" },
            { type: "COIL", address: "Y1" }
          ]
        }
      ]
    },
    publicTests: [
      {
        name: "Test 1: Cannot power up without pressing Reset PB",
        steps: [
          {
            step: 1,
            inputs: { X0: true, X1: true, X2: false },
            expected: { Y0: false, Y1: true }
          }
        ]
      },
      {
        name: "Test 2: Armed state when Reset PB pressed with healthy conditions",
        steps: [
          {
            step: 1,
            inputs: { X0: true, X1: true, X2: true },
            expected: { Y0: true, Y1: false }
          },
          {
            step: 2,
            inputs: { X0: true, X1: true, X2: false },
            expected: { Y0: true, Y1: false }
          }
        ]
      }
    ],
    hiddenTests: [
      {
        name: "Hidden 1: Opening door trips safety power instantly",
        steps: [
          { step: 1, inputs: { X0: true, X1: true, X2: true }, expected: { Y0: true } },
          { step: 2, inputs: { X0: false, X1: true, X2: false }, expected: { Y0: false, Y1: true } }
        ]
      },
      {
        name: "Hidden 2: Pressing E-stop trips power",
        steps: [
          { step: 1, inputs: { X0: true, X1: true, X2: true }, expected: { Y0: true } },
          { step: 2, inputs: { X0: true, X1: false, X2: false }, expected: { Y0: false, Y1: true } }
        ]
      }
    ]
  }
];
