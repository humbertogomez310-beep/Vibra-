type EventCallback<T = unknown> = (payload: T) => void;

class EventBus {
  private events = new Map<string, EventCallback[]>();

  on<T>(event: string, callback: EventCallback<T>) {
    const callbacks = this.events.get(event) || [];
    callbacks.push(callback as EventCallback);
    this.events.set(event, callbacks);
  }

  emit<T>(event: string, payload: T) {
    const callbacks = this.events.get(event);

    if (!callbacks) return;

    callbacks.forEach(cb => cb(payload));
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.events.get(event);

    if (!callbacks) return;

    this.events.set(
      event,
      callbacks.filter(cb => cb !== callback)
    );
  }
}

export const eventBus = new EventBus();

export function subscribeToCatalogEvents(callback: () => void): () => void {
  const events = ['library:tracks:hydrated', 'library:tracks:added', 'library:tracks:updated', 'library:tracks:removed'];

  events.forEach((event) => {
    eventBus.on(event, callback);
  });

  return () => {
    events.forEach((event) => {
      eventBus.off(event, callback);
    });
  };
}