export class MemoryEngine {
  private storageKey = "vibra_pro_metadata";

  constructor() {
    console.log("💾 [MEMORY ENGINE] Sistema de almacenamiento persistente acoplado.");
  }

  // Guarda cualquier cambio de estado de forma inmediata
  public saveState(state: { currentMood: string; volume: number; totalInteractions: number }) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
      console.log("📝 [MEMORY ENGINE] Estado del ecosistema respaldado con éxito.");
    } catch (error) {
      console.error("❌ [MEMORY ENGINE] Fallo al escribir en disco local:", error);
    }
  }

  // Recupera la memoria al iniciar la app
  public loadState(): { currentMood: string; volume: number; totalInteractions: number } | null {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("❌ [MEMORY ENGINE] Error al leer el disco local:", error);
      return null;
    }
  }
}
