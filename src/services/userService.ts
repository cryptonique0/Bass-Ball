// User service
export interface User {
  id: string;
  walletAddress: string;
  username: string;
  email?: string;
  createdAt: number;
}

export class UserService {
  private users: Map<string, User> = new Map();

  createUser(user: User): void {
    this.users.set(user.id, user);
  }

  getUser(id: string): User | null {
    return this.users.get(id) || null;
  }

  getUserByWallet(walletAddress: string): User | null {
    for (const user of this.users.values()) {
      if (user.walletAddress === walletAddress) {
        return user;
      }
    }
    return null;
  }

  updateUser(id: string, updates: Partial<User>): void {
    const user = this.users.get(id);
    if (user) {
      this.users.set(id, { ...user, ...updates });
    }
  }

  getAll(): User[] {
    return Array.from(this.users.values());
  }
}

export const userService = new UserService();
