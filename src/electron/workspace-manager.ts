import { WorkspaceSymbols } from 'ngast';
import { Index } from './model/symbol-index';

export class WorkspaceManager {
  get workspace(): WorkspaceSymbols { return this._workspace; }
  get symbols(): WorkspaceSymbols { return this._workspace; }
  private _workspace?: WorkspaceSymbols;
  private _symbols?: Index;

  initialize(tsconfig: string): Promise<WorkspaceSymbols> {
    try {
      this._workspace = new WorkspaceSymbols(tsconfig);
      return Promise.resolve(this.workspace);
    } catch (error) {
      console.log('INITIALIZING WORKSPACE');
      console.log(error);
      return Promise.reject(error);
    }
  }

  // load(tsconfig: string): Promise<WorkspaceSymbols> {
  //   try {
  //     this._workspace = new WorkspaceSymbols(tsconfig);
  //     return Promise.resolve(this.workspace);
  //   } catch (error) {
  //     return Promise.reject(error);
  //   }
  // }

  hasRoot(): boolean {
    return !!(this.workspace && this.workspace.getAllModules().length);
  }
}
