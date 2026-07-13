export interface Track {
  id: number;
  title: string;
  url: string;
}

export class PlaylistEngine {
  private tracks: Track[] = [
    {
      id: 1,
      title: "CYBER PULSE",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    },
    {
      id: 2,
      title: "NEON DRIVE",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    },
    {
      id: 3,
      title: "SYNTH WAVES",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    },
  ];

  private currentIndex = 0;

  getCurrentTrack(): Track {
    return this.tracks[this.currentIndex];
  }

  nextTrack(): Track {
    this.currentIndex = (this.currentIndex + 1) % this.tracks.length;
    return this.getCurrentTrack();
  }

  previousTrack(): Track {
    this.currentIndex =
      (this.currentIndex - 1 + this.tracks.length) % this.tracks.length;
    return this.getCurrentTrack();
  }

  getTracks(): Track[] {
    return this.tracks;
  }
}
