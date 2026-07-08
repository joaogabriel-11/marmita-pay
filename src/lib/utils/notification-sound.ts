type NotificationSound = "new-order" | "payment-approved";

type WindowWithAudioContext = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

function getAudioContext() {
  const audioWindow = window as WindowWithAudioContext;
  const AudioContextConstructor =
    audioWindow.AudioContext ?? audioWindow.webkitAudioContext;

  return AudioContextConstructor ? new AudioContextConstructor() : null;
}

let audioUnlocked = false;

export function unlockNotificationSound() {
  if (typeof window === "undefined" || audioUnlocked) {
    return;
  }

  const context = getAudioContext();

  if (!context) {
    return;
  }

  audioUnlocked = true;
  void context.resume().finally(() => {
    void context.close();
  });
}

function playTone(
  context: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
  volume = 0.22,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(volume, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration);
}

export function playNotificationSound(sound: NotificationSound) {
  if (typeof window === "undefined") {
    return;
  }

  const context = getAudioContext();

  if (!context || !audioUnlocked) {
    return;
  }

  const now = context.currentTime;

  if (sound === "new-order") {
    playTone(context, 660, now, 0.18);
    playTone(context, 520, now + 0.2, 0.2);
  } else {
    playTone(context, 520, now, 0.16);
    playTone(context, 740, now + 0.18, 0.18);
    playTone(context, 880, now + 0.38, 0.22);
  }

  window.setTimeout(() => void context.close(), 1000);
}
