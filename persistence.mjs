export function createPersistenceManager({ storage, onDenied } = {}) {
  let hasPersisted = false;
  let hasRequested = false;

  const callOnDenied = () => {
    if (typeof onDenied === "function") {
      onDenied();
    }
  };

  return {
    async checkPersisted() {
      if (!storage?.persisted) {
        return false;
      }
      try {
        hasPersisted = await storage.persisted();
        return hasPersisted;
      } catch (error) {
        return false;
      }
    },
    async requestPersistenceOnce() {
      if (hasPersisted || hasRequested) {
        return hasPersisted;
      }
      if (!storage?.persist) {
        return false;
      }
      hasRequested = true;
      try {
        const granted = await storage.persist();
        if (granted) {
          hasPersisted = true;
          return true;
        }
        callOnDenied();
        return false;
      } catch (error) {
        callOnDenied();
        return false;
      }
    },
  };
}
