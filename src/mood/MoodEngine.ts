export type MoodType = "chill" | "energy" | "focus";

export class MoodEngine {
  private currentMood: MoodType = "chill";

  constructor() {
    console.log("🎭 [MOOD ENGINE] Analizador de comportamiento emocional en línea.");
  }

  public updateMoodFromSystem(isPlaying: boolean, interactions: number): MoodType {
    if (!isPlaying) {
      this.currentMood = "focus";
    } else if (interactions > 15) {
      this.currentMood = "energy";
    } else {
      this.currentMood = "chill";
    }
    return this.currentMood;
  }

  public getMood(): MoodType {
    return this.currentMood;
  }
}
