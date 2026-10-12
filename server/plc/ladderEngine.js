/**
 * PLC Ladder Logic Execution Engine (IEC 61131-3 virtual simulation)
 * 
 * Supports:
 * - NO Contacts (Normally Open -[ ]-)
 * - NC Contacts (Normally Closed -[/]-)
 * - Output Coils (-( )-), Set/Latch (-(S)-), Reset/Unlatch (-(R)-)
 * - Parallel Branches (OR seal-in & parallel path logic)
 * - Timers: TON (On-Delay Timer with preset & elapsed accumulation)
 * - Counters: CTU (Up-Counter with rising-edge detection)
 * - Internal Relays: M0..M15
 * - Fault condition injection & I/O forcing
 */

export const SUPPORTED_INSTRUCTIONS = ['NO', 'NC', 'COIL', 'SET', 'RESET', 'TON', 'CTU', 'BRANCH'];

/**
 * Validates ladder diagram schema and instruction integrity
 * @param {Object} ladder - { rungs: [...] }
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateLadder(ladder) {
  const errors = [];
  if (!ladder || typeof ladder !== 'object') {
    return { valid: false, errors: ['Ladder program must be a valid JSON object.'] };
  }

  if (!Array.isArray(ladder.rungs)) {
    return { valid: false, errors: ['Ladder program must contain an array of rungs.'] };
  }

  ladder.rungs.forEach((rung, rIdx) => {
    const rungPrefix = `Rung ${String(rIdx).padStart(4, '0')}`;
    if (!rung || typeof rung !== 'object') {
      errors.push(`${rungPrefix}: Invalid rung definition.`);
      return;
    }

    const elements = rung.elements || [];
    if (!Array.isArray(elements)) {
      errors.push(`${rungPrefix}: Elements must be an array.`);
      return;
    }

    function checkElement(el, path) {
      if (!el || typeof el !== 'object') {
        errors.push(`${path}: Invalid element object.`);
        return;
      }

      if (!SUPPORTED_INSTRUCTIONS.includes(el.type)) {
        errors.push(`${path}: Unsupported instruction type '${el.type}'. Supported types: ${SUPPORTED_INSTRUCTIONS.join(', ')}.`);
        return;
      }

      if (el.type === 'BRANCH') {
        if (!Array.isArray(el.branches) || el.branches.length === 0) {
          errors.push(`${path}: Parallel branch must contain at least one branch path.`);
        } else {
          el.branches.forEach((branchLeg, legIdx) => {
            if (!Array.isArray(branchLeg)) {
              errors.push(`${path} [Branch ${legIdx}]: Branch leg must be an array.`);
            } else {
              branchLeg.forEach((bEl, bIdx) => {
                checkElement(bEl, `${path} [Branch ${legIdx}, Item ${bIdx}]`);
              });
            }
          });
        }
      } else {
        if (!el.address || typeof el.address !== 'string' || el.address.trim() === '') {
          errors.push(`${path}: Instruction [${el.type}] is missing an address.`);
        } else {
          const cleanAddr = el.address.trim().toUpperCase();
          if (el.type === 'TON' && !cleanAddr.startsWith('T')) {
            errors.push(`${path}: TON timer address must begin with 'T' (e.g. T0, T1).`);
          }
          if (el.type === 'CTU' && !cleanAddr.startsWith('C')) {
            errors.push(`${path}: CTU counter address must begin with 'C' (e.g. C0, C1).`);
          }
        }
      }
    }

    elements.forEach((el, eIdx) => {
      checkElement(el, `${rungPrefix} [Element ${eIdx}]`);
    });
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

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
      M8: false, M9: false, M10: false, M11: false,
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
    this.forcedInputs = { ...(initialConfig.forcedInputs || {}) };
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
    this.forcedInputs = {};
    this.scanCount = 0;
  }

  setInputs(newInputs) {
    if (newInputs && typeof newInputs === 'object') {
      this.inputs = { ...this.inputs, ...newInputs };
    }
  }

  setFault(faultMode) {
    this.fault = faultMode || 'NORMAL';
  }

  setForcedInputs(forced) {
    this.forcedInputs = { ...(forced || {}) };
  }

  /**
   * Resolve effective address value considering active faults and forced I/O
   */
  getEffectiveAddressValue(rawAddress) {
    if (!rawAddress || typeof rawAddress !== 'string') {
      return false;
    }

    const address = rawAddress.trim().toUpperCase();

    // Check manual I/O forced overrides
    if (address in this.forcedInputs) {
      return Boolean(this.forcedInputs[address]);
    }

    // Dynamic fault mode evaluation
    if (this.fault === 'EMERGENCY_STOP') {
      // E-Stop is physically tripped: normally closed emergency contacts open (false)
      if (address === 'X1' || address.includes('ESTOP') || address.includes('STOP_PB')) {
        return false;
      }
    } else if (this.fault === 'SENSOR_FAILURE') {
      // Proximity / Level sensor stuck in continuous HIGH
      if (address === 'X2' || address === 'X1' || address.includes('SENSOR') || address.includes('LEVEL')) {
        return true;
      }
    } else if (this.fault === 'MOTOR_OVERLOAD') {
      // Thermal overload relay tripped HIGH
      if (address === 'X2' || address === 'X3' || address.includes('OVERLOAD') || address.includes('OL')) {
        return true;
      }
    } else if (this.fault === 'WIRE_BREAK') {
      // Input wire severed: reading permanently 0V (false)
      if (address === 'X0' || address.includes('START')) {
        return false;
      }
    }

    // Physical Input Table (X0..X31)
    if (address.startsWith('X')) {
      return Boolean(this.inputs[address]);
    }

    // Physical Output Table (Y0..Y31)
    if (address.startsWith('Y')) {
      return Boolean(this.outputs[address]);
    }

    // Internal Memory Relays (M0..M31)
    if (address.startsWith('M')) {
      return Boolean(this.memory[address]);
    }

    // Timer Done Bit (T0.DN..T15.DN)
    if (address.startsWith('T')) {
      const timerKey = address.split('.')[0];
      const timer = this.timers[timerKey];
      return timer ? Boolean(timer.done) : false;
    }

    // Counter Done Bit (C0.DN..C15.DN)
    if (address.startsWith('C')) {
      const counterKey = address.split('.')[0];
      const counter = this.counters[counterKey];
      return counter ? Boolean(counter.done) : false;
    }

    // Direct lookup in inputs or outputs by symbol name
    if (rawAddress in this.inputs) return Boolean(this.inputs[rawAddress]);
    if (rawAddress in this.outputs) return Boolean(this.outputs[rawAddress]);

    return false;
  }

  /**
   * Evaluates a single contact
   */
  evaluateContact(item) {
    if (!item || !item.address) return false;
    const rawVal = this.getEffectiveAddressValue(item.address);
    if (item.type === 'NO') {
      // Normally Open: Conducts when address is TRUE
      return rawVal === true;
    }
    if (item.type === 'NC') {
      // Normally Closed: Conducts when address is FALSE
      return rawVal === false;
    }
    return false;
  }

  /**
   * Evaluates a branch item or group of items in series or parallel
   */
  evaluateElement(element, depth = 0) {
    if (!element || depth > 8) return false;

    if (element.type === 'BRANCH') {
      // Parallel branch (OR logic)
      if (!Array.isArray(element.branches) || element.branches.length === 0) {
        return false;
      }
      return element.branches.some(branchElements => {
        if (!Array.isArray(branchElements) || branchElements.length === 0) return true;
        return branchElements.every(el => this.evaluateElement(el, depth + 1));
      });
    }

    if (element.type === 'NO' || element.type === 'NC') {
      return this.evaluateContact(element);
    }

    return true;
  }

  /**
   * Execute a single PLC scan cycle on the provided ladder JSON
   * @param {Object} ladder - { rungs: [...] }
   * @param {number} deltaTimeMs - elapsed time in milliseconds for timers
   */
  scan(ladder, deltaTimeMs = 50) {
    this.scanCount++;
    const rungs = (ladder && Array.isArray(ladder.rungs)) ? ladder.rungs : [];
    const rungEvaluations = [];

    // Safety clamp on number of rungs to prevent runaway execution
    const maxRungs = Math.min(rungs.length, 120);

    for (let rIdx = 0; rIdx < maxRungs; rIdx++) {
      const rung = rungs[rIdx];
      if (!rung) continue;

      let rungPower = true;
      const wireStates = [];
      const elements = Array.isArray(rung.elements) ? rung.elements : [];

      // Evaluate series elements leading up to output
      for (let eIdx = 0; eIdx < elements.length; eIdx++) {
        const el = elements[eIdx];
        if (!el) continue;

        if (['COIL', 'SET', 'RESET', 'TON', 'CTU'].includes(el.type)) {
          // Output reached - break contact evaluation
          continue;
        }

        const elResult = this.evaluateElement(el);
        rungPower = rungPower && elResult;
        wireStates.push({ index: eIdx, energized: rungPower });
      }

      // Collect outputs in this rung
      const outputsInRung = (rung.outputs && Array.isArray(rung.outputs) && rung.outputs.length > 0)
        ? rung.outputs
        : elements.filter(el => el && ['COIL', 'SET', 'RESET', 'TON', 'CTU'].includes(el.type));

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
    if (!outEl || !outEl.address || typeof outEl.address !== 'string') return;
    const address = outEl.address.trim().toUpperCase();

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
        if (address.startsWith('T') && this.timers[address]) {
          this.timers[address].elapsed = 0;
          this.timers[address].done = false;
          this.timers[address].running = false;
        }
      }
    } else if (outEl.type === 'TON') {
      // Timer On-Delay
      if (!this.timers[address]) {
        this.timers[address] = {
          preset: Number(outEl.preset) || 3000,
          elapsed: 0,
          done: false,
          running: false,
          lastInput: false
        };
      }
      const t = this.timers[address];
      if (outEl.preset && !isNaN(outEl.preset)) {
        t.preset = Number(outEl.preset);
      }

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
        this.counters[address] = {
          preset: Number(outEl.preset) || 5,
          count: 0,
          done: false,
          lastInput: false
        };
      }
      const c = this.counters[address];
      if (outEl.preset && !isNaN(outEl.preset)) {
        c.preset = Number(outEl.preset);
      }

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
 * Helper to run a single virtual PLC scan cycle for a ladder
 */
export function executeLadder(ladder, inputs, previousState = null, deltaTimeMs = 50) {
  const plc = new VirtualPLC(previousState || {});
  if (inputs) plc.setInputs(inputs);
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
