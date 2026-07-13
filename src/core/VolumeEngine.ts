export class VolumeEngine {
  private currentVolume: number = 0.5; // Volumen por defecto (50%)

  constructor() {
    console.log("🎛️ [VOLUME ENGINE] Controlador de ganancia acústica acoplado.");
  }

  public setVolume(level: number) {
    // Asegurar que el volumen esté entre 0.0 y 1.0
    this.currentVolume = Math.max(0, Math.min(1, level));
    console.log(`🔊 [VOLUME ENGINE] Ganancia del sistema establecida en: ${Math.round(this.currentVolume * 100)}%`);
    
    // Aquí se conectará directamente con la ganancia del PlayerEngine en el futuro si es necesario
  }

  public getVolume(): number {
    return this.currentVolume;
  }
}
