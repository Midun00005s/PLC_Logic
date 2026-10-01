/**
 * PLC Ladder Logic Execution Engine (IEC 61131-3 virtual simulation)
 * Supports:
 * - NO Contacts (Normally Open -[ ]-)
 * - NC Contacts (Normally Closed -[/]-)
 * - Coils (-( )-), Set/Latch (-(S)-), Reset/Unlatch (-(R)-)
 * - Parallel Branches (OR seal-in logic)
 * - Timers (TON On-Delay)
 * - Counters (CTU Up-Counter with rising-edge detection)
 * - Internal Relays (M0..M7)
 * - Fault condition injection
 */

export class VirtualPLC {
  constructor(initialConfig = {}) {
    this.inputs = {
      X0: false, X1: false, X2: false, X3: false,
      X4: false, X5: false, X6: false, X7: false,
      ...(initialConfig.inputs || {})
    };

    this.outputs = {
      Y0: false, Y1: false, Y2: false, Y3: false,
      Y4: false, Y5: false, Y6: false, Y7: false,
      ...(initialConfig.outputs || {})
    };

    this.memory = {
      M0: false, M1: false, M2: false, M3: false,
      M4: false, M5: false, M6: false, M7: false,
      ...(initialConfig.memory || {})
    };

    // Timers: { T0: { preset: 3000, elapsed: 0, done: false, running: false, lastInput: false } }
    this.timers = {
      T0: { preset: 3000, elapsed: 0, done: false, running: false, lastInput: false },
      T1: { preset: 5000, elapsed: 0, done: false, running: false, lastInput: false },
      T2: { preset: 2000, elapsed: 0, done: false, running: false, lastInput: false },
      T3: { preset: 1000, elapsed: 0, done: false, running: false, lastInput: false },
      ...(initialConfig.timers || {})
    };

    // Counters: { C0: { preset: 5, count: 0, done: false, lastInput: false } }
    this.counters = {
      C0: { preset: 5, count: 0, done: false, lastInput: false },
      C1: { preset: 3, count: 0, done: false, lastInput: false },
      C2: { preset: 10, count: 0, done: false, lastInput: false },
      C3: { preset: 4, count: 0, done: false, lastInput: false },
      ...(initialConfig.counters || {})
    };

    this.fault = initialConfig.fault || 'NORMAL';
    this.scanCount = 0;
    this.lastScanTime = Date.now();
  }

  reset() {
    for (const key in this.inputs) this.inputs[key] = false;
    for (const key in this.outputs) this.outputs[key] = false;
    for (const key in this.memory) this.memory[key] = false;
    for (const key in this.timers) {
      this.timers[key].elapsed = 0;
      this.timers[key].done = false;
      this.timers[key].running = false;
      this.timers[key].lastInput = false;
    }
    for (const key in this.counters) {
      this.counters[key].count = 0;
      this.counters[key].done = false;
      this.counters[key].lastInput = false;
    }
    this.fault = 'NORMAL';
    this.scanCount = 0;
  }

  setInputs(newInputs) {
    this.inputs = { ...this.inputs, ...newInputs };
  }

  setFault(faultMode) {
    this.fault = faultMode;
  }

  /**
   * Resolve effective input value considering active fault simulation
   */
  getEffectiveAddressValue(address) {
    // Check if fault overrides this address
    if (this.fault === 'EMERGENCY_STOP') {
      // E-Stop is physically tripped: normally closed emergency stops open (false)
      if (address === 'X1' || address === 'ESTOP') return false;
    } else if (this.fault === 'SENSOR_FAILURE') {
      // Proximity / Level sensor stuck in continuous HIGH
      if (address === 'X2' || address === 'SENSOR') return true;
    } else if (this.fault === 'MOTOR_OVERLOAD') {
      // Thermal overload relay tripped (NC contact opens or overload input activates)
      if (address === 'X3' || address === 'OVERLOAD') return true;
    } else if (this.fault === 'WIRE_BREAK') {
      // Input wire severed: reading permanently 0
      if (address === 'X0') return false;
    }

    if (address.startsWith('X')) {
      return Boolean(this.inputs[address]);
    }
    if (address.startsWith('Y')) {
      return Boolean(this.outputs[address]);
    }
    if (address.startsWith('M')) {
      return Boolean(this.memory[address]);
    }
    if (address.startsWith('T')) {
      const timer = this.timers[address];
      return timer ? Boolean(timer.done) : false;
    }
    if (address.startsWith('C')) {
      const counter = this.counters[address];
      return counter ? Boolean(counter.done) : false;
    }

    // Direct lookup in inputs or outputs by name
    if (address in this.inputs) return Boolean(this.inputs[address]);
    if (address in this.outputs) return Boolean(this.outputs[address]);
    return false;
  }

  /**
   * Evaluates a single contact
   */
  evaluateContact(item) {
    const rawVal = this.getEffectiveAddressValue(item.address);
    if (item.type === 'NO') {
      // Normally Open: Conducts when address is TRUE
      return rawVal === true;
    }
    if (item.type === 'NC') {
      // Normally Closed: Conducts when address is FALSE
      return rawVal === false;
    }
    return true;
  }

  /**
   * Evaluates a branch item or group of items in series or parallel
   */
  evaluateElement(element) {
    if (element.type === 'BRANCH') {
      // Parallel branch (OR logic)
      // At least one branch path must evaluate to TRUE
      if (!Array.isArray(element.branches) || element.branches.length === 0) {
        return true;
      }
      return element.branches.some(branchElements => {
        return branchElements.every(el => this.evaluateElement(el));
      });
    }

    if (element.type === 'NO' || element.type === 'NC') {
      return this.evaluateContact(element);
    }

    // Default neutral passthrough
    return true;
  }

  /**
   * Execute a single PLC scan cycle on the provided ladder JSON
   * @param {Object} ladder - { rungs: [...] }
   * @param {number} deltaTimeMs - elapsed time in milliseconds for timers
   */
  scan(ladder, deltaTimeMs = 50) {
    this.scanCount++;
    const rungs = ladder?.rungs || [];
    const rungEvaluations = [];

    for (let rIdx = 0; rIdx < rungs.length; rIdx++) {
      const rung = rungs[rIdx];
      let rungPower = true;
      const wireStates = [];

      // Evaluate series elements leading up to output
      const elements = rung.elements || [];
      for (let eIdx = 0; eIdx < elements.length; eIdx++) {
        const el = elements[eIdx];
        if (el.type === 'COIL' || el.type === 'SET' || el.type === 'RESET' || el.type === 'TON' || el.type === 'CTU') {
          // Output reached - break into output evaluation
          continue;
        }

        const elResult = this.evaluateElement(el);
        rungPower = rungPower && elResult;
        wireStates.push({ index: eIdx, energized: rungPower });
      }

      // Check outputs in this rung
      const outputsInRung = (rung.outputs && rung.outputs.length > 0)
        ? rung.outputs
        : elements.filter(el => ['COIL', 'SET', 'RESET', 'TON', 'CTU'].includes(el.type));

      for (const outEl of outputsInRung) {
        this.executeOutput(outEl, rungPower, deltaTimeMs);
      }

      rungEvaluations.push({
        rungIndex: rIdx,
        id: rung.id || `rung-${rIdx}`,
        energized: rungPower,
        wireStates
      });
    }

    return {
      inputs: { ...this.inputs },
      outputs: { ...this.outputs },
      memory: { ...this.memory },
      timers: JSON.parse(JSON.stringify(this.timers)),
      counters: JSON.parse(JSON.stringify(this.counters)),
      fault: this.fault,
      scanCount: this.scanCount,
      rungEvaluations
    };
  }

  executeOutput(outEl, rungPower, deltaTimeMs) {
    const address = outEl.address;

    if (outEl.type === 'COIL') {
      if (address.startsWith('Y')) {
        this.outputs[address] = rungPower;
      } else if (address.startsWith('M')) {
        this.memory[address] = rungPower;
      }
    } else if (outEl.type === 'SET') {
      if (rungPower) {
        if (address.startsWith('Y')) this.outputs[address] = true;
        if (address.startsWith('M')) this.memory[address] = true;
      }
    } else if (outEl.type === 'RESET') {
      if (rungPower) {
        if (address.startsWith('Y')) this.outputs[address] = false;
        if (address.startsWith('M')) this.memory[address] = false;
        if (address.startsWith('C') && this.counters[address]) {
          this.counters[address].count = 0;
          this.counters[address].done = false;
        }
      }
    } else if (outEl.type === 'TON') {
      // Timer On-Delay
      if (!this.timers[address]) {
        this.timers[address] = { preset: outEl.preset || 3000, elapsed: 0, done: false, running: false, lastInput: false };
      }
      const t = this.timers[address];
      if (outEl.preset) t.preset = outEl.preset;

      if (rungPower) {
        t.running = true;
        t.elapsed = Math.min(t.preset, t.elapsed + deltaTimeMs);
        if (t.elapsed >= t.preset) {
          t.done = true;
        }
      } else {
        // Input drops: timer resets
        t.running = false;
        t.elapsed = 0;
        t.done = false;
      }
      t.lastInput = rungPower;
    } else if (outEl.type === 'CTU') {
      // Up Counter
      if (!this.counters[address]) {
        this.counters[address] = { preset: outEl.preset || 5, count: 0, done: false, lastInput: false };
      }
      const c = this.counters[address];
      if (outEl.preset) c.preset = outEl.preset;

      // Rising-edge detection (false -> true)
      if (rungPower && !c.lastInput) {
        c.count = Math.min(c.preset * 2, c.count + 1);
        if (c.count >= c.preset) {
          c.done = true;
        }
      }
      c.lastInput = rungPower;
    }
  }
}

/**
 * Helper to run a sequence of virtual PLC scan cycles for a ladder
 */
export function executeLadder(ladder, inputs, previousState = null, deltaTimeMs = 50) {
  const plc = new VirtualPLC(previousState || {});
  plc.setInputs(inputs);
  const result = plc.scan(ladder, deltaTimeMs);
  return {
    outputs: result.outputs,
    memory: result.memory,
    timers: result.timers,
    counters: result.counters,
    rungEvaluations: result.rungEvaluations,
    plcState: {
      inputs: plc.inputs,
      outputs: plc.outputs,
      memory: plc.memory,
      timers: plc.timers,
      counters: plc.counters,
      fault: plc.fault
    }
  };
}
