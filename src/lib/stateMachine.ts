// State machine utilities
export type StateHandler<T> = (context: T) => void;

export class StateMachine<State extends string, Context = any> {
  private currentState: State;
  private handlers: Map<State, StateHandler<Context>> = new Map();
  private transitions: Map<State, Set<State>> = new Map();

  constructor(initialState: State) {
    this.currentState = initialState;
  }

  defineTransition(from: State, to: State): void {
    if (!this.transitions.has(from)) {
      this.transitions.set(from, new Set());
    }
    this.transitions.get(from)!.add(to);
  }

  onEnter(state: State, handler: StateHandler<Context>): void {
    this.handlers.set(state, handler);
  }

  canTransition(to: State): boolean {
    const allowed = this.transitions.get(this.currentState);
    return allowed ? allowed.has(to) : false;
  }

  transition(to: State, context?: Context): boolean {
    if (!this.canTransition(to)) {
      return false;
    }

    this.currentState = to;
    const handler = this.handlers.get(to);
    if (handler && context) {
      handler(context);
    }

    return true;
  }

  getState(): State {
    return this.currentState;
  }
}
