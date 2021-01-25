import { State } from './states/state';
import { SymbolIndex } from './model/symbol-index';
import { WorkspaceManager } from './workspace-manager';

export class StateManager {
  get state(): State | undefined {
    return this._states[this._states.length - 1];
  }

  private _states: State[] = [];

  setRoot(state: State): void {
    this._states[0] = state;
  }

  prev(): Promise<void> {
    if (this._states.length > 1) {
      this._states.pop();
      return Promise.resolve();
    } else {
      return Promise.reject();
    }
  }

  to(workspaceManager: WorkspaceManager, id: string): Promise<State> {
    const index = SymbolIndex.getIndex(workspaceManager.workspace);
    const lastState = this._states[this._states.length - 1];
    const nextSymbol = index.get(id);
    let nextState: State | null;
    if (nextSymbol) {
      nextState = nextSymbol.stateFactory();
      if (lastState instanceof nextState.constructor && lastState.stateSymbolId === nextState.stateSymbolId) {
        nextState = lastState.nextState(id);
      }
    } else {
      // Used for templates
      nextState = lastState.nextState(id);
    }
    if (nextState) {
      this._states.push(nextState);
      return Promise.resolve(nextState);
    } else {
      return Promise.reject();
    }
  }

  destroyAll(): void {
    this._states.forEach((state: State) => state.destroy());
  }

  reset(): void {
    this.destroyAll();
    this._states = [];
    SymbolIndex.clear();
  }
}
