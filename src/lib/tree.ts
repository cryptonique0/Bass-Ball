// Tree data structure
export interface TreeNode<T> {
  value: T;
  children: TreeNode<T>[];
  parent?: TreeNode<T>;
}

export class Tree<T> {
  root: TreeNode<T>;

  constructor(value: T) {
    this.root = { value, children: [] };
  }

  addChild(parent: TreeNode<T>, value: T): TreeNode<T> {
    const node: TreeNode<T> = { value, children: [], parent };
    parent.children.push(node);
    return node;
  }

  traverse(node: TreeNode<T>, callback: (node: TreeNode<T>) => void): void {
    callback(node);
    node.children.forEach(child => this.traverse(child, callback));
  }

  find(predicate: (value: T) => boolean): TreeNode<T> | null {
    let result: TreeNode<T> | null = null;
    this.traverse(this.root, node => {
      if (!result && predicate(node.value)) {
        result = node;
      }
    });
    return result;
  }

  getDepth(node: TreeNode<T> = this.root): number {
    if (node.children.length === 0) return 0;
    return 1 + Math.max(...node.children.map(c => this.getDepth(c)));
  }
}
