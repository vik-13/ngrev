import { State } from './state';
import {
  getId,
  Graph,
  isAngularSymbol, isThirdParty,
  Layout,
  Metadata,
  Node,
  SymbolTypes,
  VisualizationConfig
} from '../../shared/data-format';
import { Trie } from '../utils/trie';
import { ComponentSymbol, DirectiveSymbol, TemplateNode, WorkspaceSymbols } from 'ngast';
import { getDirectiveMetadata } from '../formatters/model-formatter';

const CompositeStateID = '$$$composite-state$$$';

export class ComponentTreeState extends State {
  trie: Trie<ComponentSymbol | DirectiveSymbol> =
    new Trie<ComponentSymbol | DirectiveSymbol>((str: string) => str.split(/\/|#/));
  graph: Graph<ComponentSymbol | DirectiveSymbol> = {
    nodes: [],
    edges: []
  };

  constructor(private _workspace: WorkspaceSymbols) {
    super(CompositeStateID, _workspace);

    this._parse();
  }

  getData(): VisualizationConfig<any> {
    console.log(this.graph);
    return {
      title: `Components tree`,
      graph: this.graph,
      layout: Layout.HierarchicalUDDirected
    };
  }

  getMetadata(id: string): Metadata | null {
    return getDirectiveMetadata(this.trie.get(id));
  }

  nextState(id: string): State | null {
    return null;
  }

  private _parse() {
    const existingNodes = new Set();

    this._workspace.getAllDirectives().forEach((directive: DirectiveSymbol) => {
      const symbolId = getId(directive);
      if (!existingNodes.has(symbolId)) {
        this.trie.insert(getId(directive), directive);
        this.graph.nodes.push({
          id: symbolId,
          label: directive.metadata.selector,
          type: {
            angular: isAngularSymbol(directive),
            type: SymbolTypes.Directive
          }
        });

        existingNodes.add(symbolId);
      }
    });

    this._workspace.getAllComponents().forEach((component: ComponentSymbol) => {
      const symbolId = getId(component);
      if (!existingNodes.has(symbolId)) {
        this.trie.insert(getId(component), component);
        this.graph.nodes.push({
          id: symbolId,
          label: component.metadata.selector,
          type: {
            angular: isAngularSymbol(component),
            type: SymbolTypes.Component
          }
        });

        existingNodes.add(symbolId);
      }

      const templateAst = component.getTemplateAst();
      if (!templateAst) {
        return;
      }

      const addEdges = () => {

      }

      addEdges();
    });
  }
}
