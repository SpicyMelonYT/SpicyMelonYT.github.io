class SMEvent {
  constructor() {
    this.callbacks = [];
  }

  on(callback = (...args) => {}) {
    this.callbacks.push(callback);
  }

  remove(callback = (...args) => {}) {
    this.callbacks = this.callbacks.filter((c) => c !== callback);
  }

  trigger(...args) {
    let results = [];
    for (let callback of this.callbacks) {
      results.push(callback(...args));
    }
    return results;
  }

  async triggerAsync(...args) {
    let results = [];
    for (let callback of this.callbacks) {
      results.push(await callback(...args));
    }
    return results;
  }
}
