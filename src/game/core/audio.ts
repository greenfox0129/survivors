let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined" || !window.AudioContext) {
    return null;
  }
  audioContext ??= new window.AudioContext();
  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }
  return audioContext;
}

function playTone(
  startFrequency: number,
  endFrequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine"
): void {
  const context = getAudioContext();
  if (!context) return;

  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(startFrequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

function playNoise(duration: number, volume: number): void {
  const context = getAudioContext();
  if (!context) return;

  const buffer = context.createBuffer(1, context.sampleRate * duration, context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < channel.length; i++) {
    channel[i] = Math.random() * 2 - 1;
  }

  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const now = context.currentTime;
  source.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(900, now);
  filter.frequency.exponentialRampToValueAtTime(120, now + duration);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  source.start(now);
}

let lastHitSound = 0;

export function playHitSound(): void {
  const now = performance.now();
  if (now - lastHitSound < 30) return;
  lastHitSound = now;
  playTone(180, 70, 0.07, 0.045, "square");
}

export function playHurtSound(): void {
  playNoise(0.12, 0.08);
  playTone(150, 65, 0.18, 0.08, "sawtooth");
}

export function playXpPickupSound(amount: number): void {
  const pitch = Math.min(1.35, 1 + amount * 0.03);
  playTone(620 * pitch, 980 * pitch, 0.1, 0.055, "sine");
}

export function playLevelUpSound(): void {
  playTone(440, 660, 0.16, 0.07, "sine");
  window.setTimeout(() => playTone(660, 990, 0.2, 0.065, "sine"), 90);
}

export function playGameOverSound(): void {
  playTone(220, 90, 0.4, 0.07, "sawtooth");
}
