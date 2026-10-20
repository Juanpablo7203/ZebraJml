// Web Audio API Zebra Barcode Decode Beep & Haptic Vibration Utility

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playZebraBeep(
  type: 'success' | 'warning' | 'error' = 'success',
  enabled = true,
  volume = 80,
  frequency = 1800
) {
  if (!enabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const gainNode = ctx.createGain();
    const osc = ctx.createOscillator();
    const now = ctx.currentTime;
    const vol = Math.max(0.01, Math.min(1, volume / 100));

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === 'success') {
      // Classic Zebra TC27 high-pitch crisp decode beep
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, now);
      gainNode.gain.setValueAtTime(vol * 0.4, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'warning') {
      // Double click / notice tone
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      gainNode.gain.setValueAtTime(vol * 0.35, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);

      // Second chirp
      const osc2 = ctx.createOscillator();
      const gainNode2 = ctx.createGain();
      osc2.connect(gainNode2);
      gainNode2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, now + 0.08);
      gainNode2.gain.setValueAtTime(vol * 0.35, now + 0.08);
      gainNode2.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.16);
    } else {
      // Low dual error buzz
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      gainNode.gain.setValueAtTime(vol * 0.45, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    }
  } catch (err) {
    console.warn('Audio playback not allowed or unsupported yet:', err);
  }
}

export function triggerZebraHaptic(
  type: 'success' | 'warning' | 'error' = 'success',
  enabled = true
) {
  if (!enabled || typeof navigator === 'undefined' || !navigator.vibrate) return;

  try {
    if (type === 'success') {
      navigator.vibrate(45);
    } else if (type === 'warning') {
      navigator.vibrate([40, 40, 40]);
    } else {
      navigator.vibrate([100, 60, 100]);
    }
  } catch {
    // Ignore unsupported vibration errors
  }
}
