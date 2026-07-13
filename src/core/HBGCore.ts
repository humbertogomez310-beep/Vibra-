import { PlayerEngine } from "../player/PlayerEngine";
import { MoodEngine } from "../mood/MoodEngine";
import { MemoryEngine } from "./MemoryEngine";
import { VolumeEngine } from "./VolumeEngine";
import { PlaylistEngine, Track } from "../player/PlaylistEngine";

export class HBGCore {
  public player = new PlayerEngine();
  public mood = new MoodEngine();
  public memory = new MemoryEngine();
  public volumeEngine = new VolumeEngine();
  public playlist = new PlaylistEngine();
  private totalInteractions = 0;

  constructor() {
    const saved = this.memory.loadState();
    if (saved) {
      this.totalInteractions = saved.totalInteractions;
      if (saved.volume !== undefined) {
        this.volumeEngine.setVolume(saved.volume);
        this.player.setHardwareVolume(saved.volume);
      }
    }
  }

  public play() { this.player.play(); this.audit("USER_PLAY"); }
  public stop() { this.player.stop(); this.audit("USER_HALT"); }

  public nextTrack(): Track {
    this.player.stop();
    const next = this.playlist.nextTrack();
    this.player.load(next.url);
    this.audit("TRACK_SKIP");
    this.player.play();
    return next;
  }

  public setVolume(level: number) { this.audit("VOLUME_CHANGE", level); }

  private audit(eventType: string, data?: number) {
    this.totalInteractions++;
    if (eventType === "VOLUME_CHANGE" && data !== undefined) {
      this.volumeEngine.setVolume(data);
      this.player.setHardwareVolume(data);
    }
    this.mood.updateMoodFromSystem(eventType === "USER_PLAY" || eventType === "TRACK_SKIP", this.totalInteractions);
    this.memory.saveState({
      currentMood: this.mood.getMood(),
      volume: this.volumeEngine.getVolume(),
      totalInteractions: this.totalInteractions
    });
  }

  public getInteractionCount() { return this.totalInteractions; }
  public getMood() { return this.mood.getMood(); }
  public getVolume() { return this.volumeEngine.getVolume(); }
  public getCurrentTrack() { return this.playlist.getCurrentTrack(); }
  public getFrequencies() { return this.player.getFrequencies(); }
}
