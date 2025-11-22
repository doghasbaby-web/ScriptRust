// Async/Await with Decorations

/* xxx, pure: simulates async operation */
async function fetchData(/* xxx, immutable: id */ id: number): Promise<string> {
  return "Data for ID: " + id;
}

/* xxx, pure: processes fetched data */
async function processData(/* xxx, immutable: data */ data: string): Promise<string> {
  return data + " (processed)";
}

class DataManager {
  /* xxx, mut: internal cache */
  cache: Map<number, string> = new Map();

  /* xxx, ownership: borrowed */
  async getData(/* xxx, immutable: id */ id: number): Promise<string> {
    if (this.cache.has(id)) {
      console.log("Cache hit for ID:", id);
      return this.cache.get(id)!;
    }

    console.log("Fetching data for ID:", id);
    const data = await fetchData(id);
    const processed = await processData(data);

    this.cache.set(id, processed);
    return processed;
  }

  /* xxx, pure: no side effects */
  getCacheSize(): number {
    return this.cache.size;
  }
}

// Usage
async function main() {
  const manager = new DataManager();

  const result1 = await manager.getData(1);
  console.log("Result 1:", result1);

  const result2 = await manager.getData(2);
  console.log("Result 2:", result2);

  const result1Again = await manager.getData(1);
  console.log("Result 1 (cached):", result1Again);

  console.log("Cache size:", manager.getCacheSize());
}

main();
