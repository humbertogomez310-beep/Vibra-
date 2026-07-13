export class PlayerEngine {
  private audio: HTMLAudioElement;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null; 
  private filterNode: BiquadFilterNode | null = null; // El ecualizador real de hardware
  private dataArray: Uint8Array = new Uint8Array(32);
  private isInitialized: boolean = false;

  constructor() {
    this.audio = new Audio();
    this.audio.crossOrigin = "anonymous";
  }

  public load(url: string) {
    this.audio.src = url;
    this.audio.load();
    console.log("🎵 [PLAYER ENGINE] Pista de audio cargada en el buffer.");
  }

  private initAudioContext() {
    if (this.isInitialized) return;

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 64; 

    this.gainNode = this.audioContext.createGain();
    
    // Inicializar el filtro del Ecualizador
    this.filterNode = this.audioContext.createBiquadFilter();
    this.filterNode.type = "peaking"; 

    const source = this.audioContext.createMediaElementSource(this.audio);
    
    // CONEXIÓN DE HARDWARE: Origen -> Volumen -> Ecualizador -> Analizador -> Altavoces
    source.connect(this.gainNode);
    this.gainNode.connect(this.filterNode);
    this.filterNode.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.isInitialized = true;
    console.log("🎛️ [PLAYER ENGINE] Hardware Web Audio con Ecualizador conectado.");
  }

  public play() {
    this.initAudioContext();
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
    this.audio.play().catch(err => console.error("Error al adquirir el hardware de audio:", err));
  }

  public stop() {
    this.audio.pause();
  }

  public setHardwareVolume(level: number) {
    this.initAudioContext();
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(level, this.audioContext!.currentTime);
    }
  }

  // NUEVO MÉTODO: Aplica los cambios de frecuencia reales según el botón de la UI
  public setPreset(preset: "Cálido" | "Vibrante" | "Bajo" | "Triplicar" | "Normal") {
    this.initAudioContext();
    if (!this.filterNode || !this.audioContext) return;

    const now = this.audioContext.currentTime;

    switch (preset) {
      case "Bajo":
        this.filterNode.type = "lowshelf"; 
        this.filterNode.frequency.setValueAtTime(200, now); 
        this.filterNode.gain.setValueAtTime(12, now); 
        break;
      case "Triplicar":
        this.filterNode.type = "highshelf"; 
        this.filterNode.frequency.setValueAtTime(4000, now); 
        this.filterNode.gain.setValueAtTime(10, now); 
        break;
      case "Cálido":
        this.filterNode.type = "peaking";
        this.filterNode.frequency.setValueAtTime(1000, now); 
        this.filterNode.gain.setValueAtTime(6, now);
        this.filterNode.Q.setValueAtTime(1.0, now);
        break;
      case "Vibrante":
        this.filterNode.type = "peaking";
        this.filterNode.frequency.setValueAtTime(2500, now); 
        this.filterNode.gain.setValueAtTime(8, now);
        this.filterNode.Q.setValueAtTime(1.5, now);
        break;
      default:
        this.filterNode.type = "peaking";
        this.filterNode.gain.setValueAtTime(0, now); 
        break;
    }
    console.log(`🎛️ [PRESET] Ecualizador de hardware cambiado a modo: ${preset}`);
  }

  public getFrequencies(): Uint8Array {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.dataArray);
    }
    return this.dataArray;
  }
}
