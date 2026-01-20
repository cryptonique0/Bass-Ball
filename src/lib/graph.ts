// Graph data structure
export class Graph<T> {
  private nodes: Map<string, T> = new Map();
  private edges: Map<string, Set<string>> = new Map();

  addNode(id: string, value: T): void {
    this.nodes.set(id, value);
    if (!this.edges.has(id)) {
      this.edges.set(id, new Set());
    }
  }

  addEdge(from: string, to: string): void {
    if (!this.nodes.has(from) || !this.nodes.has(to)) {
      throw new Error('Node not found');
    }
    this.edges.get(from)!.add(to);
  }

  getNode(id: string): T | undefined {
    return this.nodes.get(id);
  }

  getNeighbors(id: string): T[] {
    const neighbors = this.edges.get(id) || new Set();
    return Array.from(neighbors).map(nId => this.nodes.get(nId)!);
  }

  hasPath(from: string, to: string): boolean {
    const visited = new Set<string>();
    const queue = [from];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === to) return true;
      if (visited.has(current)) continue;

      visited.add(current);
      const neighbors = this.edges.get(current) || new Set();
      queue.push(...Array.from(neighbors));
    }

    return false;
  }
}
