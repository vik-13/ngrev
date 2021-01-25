import {
  DirectStateTransitionRequest, GetDataRequest, GetMetadataRequest,
  GetSymbolsRequest,
  LoadProjectRequest,
  ParentProcess,
  PrevStateRequest,
  Responder
} from './helpers/process';
import { StateManager } from './state-manager';
import { Message } from '../shared/ipc-constants';
import { WorkspaceManager } from './workspace-manager';
import { AnnotationNames, Symbol, WorkspaceSymbols } from 'ngast';
import { AppState } from './states/app.state';
import { SymbolData, SymbolIndex } from './model/symbol-index';
import { IdentifiedStaticSymbol } from '../shared/data-format';
import { ComponentTreeState } from './states/component-tree.state';

export class ChildProcess{
  private _workspaceManager?: WorkspaceManager;
  private _stateManager: StateManager = new StateManager();
  private _parentProcess = new ParentProcess();

  constructor() {
    this._attachEvents();
  }

  private _attachEvents() {
    this._parentProcess.on(Message.LoadProject, this._loadProject.bind(this));
    this._parentProcess.on(Message.GetSymbols, this._getSymbols.bind(this));
    this._parentProcess.on(Message.PrevState, this._prevState.bind(this));
    this._parentProcess.on(Message.DirectStateTransition, this._directStateTransition.bind(this));
    this._parentProcess.on(Message.GetMetadata, this._getMetadata.bind(this));
    this._parentProcess.on(Message.GetData, this._getData.bind(this));
    this._parentProcess.on(Message.ToggleLibs, this._toggleLibs.bind(this));
    this._parentProcess.on(Message.ToggleModules, this._toggleModules.bind(this));
  }

  private _loadProject(data: LoadProjectRequest, responder: Responder) {
    console.log(`Loading project: "${data.tsconfig}"`);
    this._stateManager.reset();
    this._workspaceManager = new WorkspaceManager();
    this._workspaceManager.initialize(data.tsconfig)
      .then((workspace: WorkspaceSymbols) => {
        if (this._workspaceManager.hasRoot()) {
          // this._stateManager.setRoot(new AppState(workspace, data.showLibs, data.showModules));
          this._stateManager.setRoot(new ComponentTreeState(workspace));
          console.log('Initial state created');
          responder({
            topic: Message.LoadProject,
            err: null
          });
        } else {
          responder({
            topic: Message.LoadProject,
            err: 'Cannot find the root module of your project.'
          });
        }
      })
      .catch((message: string) => {
        responder({
          topic: Message.LoadProject,
          err: message
        });
      });
  }

  private _getSymbols(data: GetSymbolsRequest, responder: Responder) {
    console.log('Get symbols');
    const res: IdentifiedStaticSymbol[] = [];
    try {
      const map = SymbolIndex.getIndex(this._workspaceManager.workspace);
      map.forEach((data: SymbolData<AnnotationNames>, id: string) => {
        if (data.symbol instanceof Symbol) {
          res.push({ id, name: data.symbol.name, annotation: data.symbol.annotation, path: data.symbol.path });
        }
      });
    } catch (e) {
      console.error(e);
    }
    responder({
      topic: Message.GetSymbols,
      symbols: res
    });
  }

  private _prevState(data: PrevStateRequest, responder: Responder) {
    this._stateManager.prev()
      .then(() => {
        console.log('Successfully moved to previous state');
        responder({
          topic: Message.PrevState,
          available: true
        });
      })
      .catch(() => {
        console.log('Unsuccessfully moved to previous state');
        responder({
          topic: Message.PrevState,
          available: false
        });
      });
  }

  // TODO: rename to toState
  private _directStateTransition(data: DirectStateTransitionRequest, responder: Responder) {
    console.log('Direct state transition', data.id);

    // TODO: remove project as an argument
    this._stateManager.to(this._workspaceManager, data.id)
      .then(() => {
        console.log('Found next state');
        responder({
          topic: Message.DirectStateTransition,
          available: true
        });
      })
      .catch(() => {
        console.log('No next state');
        responder({
          topic: Message.DirectStateTransition,
          available: false
        });
      });
  }

  private _getMetadata(data: GetMetadataRequest, responder: Responder) {
    console.log('Getting metadata', data.id);
    if (this._stateManager.state) {
      responder({
        topic: Message.GetMetadata,
        data: this._stateManager.state.getMetadata(data.id)
      });
    } else {
      responder({
        topic: Message.GetMetadata,
        data: null
      });
    }
  }

  private _getData(data: GetDataRequest, responder: Responder) {
    console.log('Getting data');
    if (this._stateManager.state) {
      const data = this._stateManager.state.getData();
      console.log('Getting data from state:', this._stateManager.state.constructor.name, 'Got', data.graph.nodes.length, 'items');
      responder({
        topic: Message.GetData,
        data
      });
    } else {
      console.log('No state to get data from');
      responder({
        topic: Message.GetData,
        data: null
      });
    }
  }

  private _toggleLibs() {
    // TODO: Implement it; Current implementation is not that smooth as it could be.
  }

  private _toggleModules() {
    // TODO: Implement it; Current implementation is not that smooth as it could be.
  }
}

new ChildProcess();
