export interface AudioPreferences {
  readonly muted: boolean;
}

export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = { muted: false };

// WC-10 owns production audio. WC-02 only establishes a presentation-only boundary.
