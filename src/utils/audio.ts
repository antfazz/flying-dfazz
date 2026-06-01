/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private motorOsc: OscillatorNode | null = null;
  private motorGain: GainNode | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    // Audio is initialized lazily after user interaction to comply with browser autoplay policies
  }

  private initContext() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.soundEnabled ? 0.35 : 0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  public setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(enabled ? 0.35 : 0, this.ctx.currentTime, 0.05);
    }
    if (enabled && this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  private resume() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a simple pop/laser sound for shooting
  public playShoot() {
    this.resume();
    if (!this.soundEnabled || !this.ctx || !this.masterGain) return;

    const time = this.ctx.currentTime;
    
    // Create oscillator
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    // Fast frequency sweep down from 600Hz to 150Hz
    osc.frequency.setValueAtTime(450, time);
    osc.frequency.exponentialRampToValueAtTime(120, time + 0.12);
    
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(time);
    osc.stop(time + 0.15);
  }

  // Play a magical ding for stars
  public playCollectStar() {
    this.resume();
    if (!this.soundEnabled || !this.ctx || !this.masterGain) return;

    const time = this.ctx.currentTime;
    
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Chime chord: E5 -> B5
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, time); // E5
    osc1.frequency.setValueAtTime(987.77, time + 0.06); // B5 (quick arpeggio)
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, time + 0.03); // E6
    
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.setValueAtTime(0.25, time + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);
    
    osc1.start(time);
    osc2.start(time);
    
    osc1.stop(time + 0.4);
    osc2.stop(time + 0.4);
  }

  // Play a scratchy noise explosion or eraser crumble sound
  public playExplode() {
    this.resume();
    if (!this.soundEnabled || !this.ctx || !this.masterGain) return;

    const time = this.ctx.currentTime;
    const duration = 0.25;
    
    // Create noise buffer
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Pencil scribble style noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    // Lowpass filter for crash/thud body
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, time);
    filter.frequency.exponentialRampToValueAtTime(80, time + duration);
    filter.Q.setValueAtTime(1.5, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noise.start(time);
    noise.stop(time + duration);

    // Add a quick lower oscillator thump
    const lowThump = this.ctx.createOscillator();
    const lowGain = this.ctx.createGain();
    
    lowThump.type = 'sawtooth';
    lowThump.frequency.setValueAtTime(100, time);
    lowThump.frequency.exponentialRampToValueAtTime(30, time + 0.15);
    
    lowGain.gain.setValueAtTime(0.2, time);
    lowGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    
    lowThump.connect(lowGain);
    lowGain.connect(this.masterGain);
    
    lowThump.start(time);
    lowThump.stop(time + 0.15);
  }

  // Play crash/ouch damage sound (tear or scribble)
  public playDamage() {
    this.resume();
    if (!this.soundEnabled || !this.ctx || !this.masterGain) return;

    const time = this.ctx.currentTime;
    
    // Retro buzz crash
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, time);
    osc.frequency.linearRampToValueAtTime(40, time + 0.35);
    
    gain.gain.setValueAtTime(0.35, time);
    gain.gain.linearRampToValueAtTime(0.001, time + 0.35);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(time);
    osc.stop(time + 0.35);
  }

  // Play game over sad melody
  public playGameOver() {
    this.resume();
    if (!this.soundEnabled || !this.ctx || !this.masterGain) return;

    const time = this.ctx.currentTime;
    
    const notes = [330, 294, 262, 196]; // E4, D4, C4, G3
    const durations = [0.15, 0.15, 0.15, 0.4];
    
    let currentOffset = 0;
    notes.forEach((freq, idx) => {
      const noteOsc = this.ctx!.createOscillator();
      const noteGain = this.ctx!.createGain();
      
      noteOsc.type = 'triangle';
      noteOsc.frequency.setValueAtTime(freq, time + currentOffset);
      
      noteGain.gain.setValueAtTime(0.2, time + currentOffset);
      noteGain.gain.linearRampToValueAtTime(0.001, time + currentOffset + durations[idx] - 0.02);
      
      noteOsc.connect(noteGain);
      noteGain.connect(this.masterGain!);
      
      noteOsc.start(time + currentOffset);
      noteOsc.stop(time + currentOffset + durations[idx]);
      
      currentOffset += durations[idx];
    });
  }

  // Start continuous engine propeller hum
  public startMotor() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    
    const time = this.ctx.currentTime;
    
    // Avoid double creation
    if (this.motorOsc) {
      this.stopMotor();
    }
    
    try {
      this.motorOsc = this.ctx.createOscillator();
      this.motorGain = this.ctx.createGain();
      
      // We mix a triangle wave and a tiny bit of sine to represent the cute sputtering prop engine
      this.motorOsc.type = 'triangle';
      this.motorOsc.frequency.setValueAtTime(65, time); // Low rumble (A1-B1)
      
      this.motorGain.gain.setValueAtTime(0.12, time);
      
      this.motorOsc.connect(this.motorGain);
      this.motorGain.connect(this.masterGain);
      
      this.motorOsc.start(time);
    } catch(e) {
      console.warn("Could not start motor sound", e);
    }
  }

  // Adjust propeller pitch based on speed/altitude
  public updateMotorPitch(yVelocityRatio: number, heightRatio: number) {
    if (!this.ctx || !this.motorOsc || !this.motorGain) return;
    
    const targetFreq = 58 + (heightRatio * 15) - (yVelocityRatio * 10);
    const targetVolume = 0.08 + Math.abs(yVelocityRatio) * 0.08;
    
    this.motorOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
    this.motorGain.gain.setTargetAtTime(targetVolume, this.ctx.currentTime, 0.1);
  }

  // Stop propeller motor
  public stopMotor() {
    if (this.motorOsc) {
      try {
        this.motorOsc.stop();
        this.motorOsc.disconnect();
      } catch (e) {}
      this.motorOsc = null;
    }
    if (this.motorGain) {
      try {
        this.motorGain.disconnect();
      } catch (e) {}
      this.motorGain = null;
    }
  }
}

export const audio = new AudioEngine();
