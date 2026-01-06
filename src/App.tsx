import { useState, useEffect, useCallback } from 'react';
import ReactFlow, { Background, Controls, MiniMap, ReactFlowProvider, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import type { NodeChange, EdgeChange } from 'reactflow';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Sidebar } from './components/Sidebar';
import { ItemNode } from './components/ItemNode';
import { loadAllItems } from './utils/dataLoader';
import { loadGoalItems, saveGoalItems } from './utils/storage';
import { buildCraftingTree } from './utils/craftingChain';
import { buildSeparateGraphs, buildCombinedGraph } from './utils/graphBuilder';
import type { ItemsMap } from './types/item';
import './styles/main.scss';

const nodeTypes = {
  itemNode: ItemNode,
};

function FlowContent({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange,
  setNodesDirectly,
  setEdgesDirectly
}: { 
  nodes: any[]; 
  edges: any[]; 
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  setNodesDirectly: (nodes: any[]) => void;
  setEdgesDirectly: (edges: any[]) => void;
}) {
  const handlePaneClick = useCallback(() => {
    console.log('Background clicked - clearing highlights');
    // Clear all highlights when clicking on background
    const updatedNodes = nodes.map(node => {
      const { isHighlighted, ...restData } = node.data;
      return {
        ...node,
        data: restData,
      };
    });
    const updatedEdges = edges.map(edge => ({
      ...edge,
      animated: false,
      style: {
        ...edge.style,
        stroke: edge.style?.stroke || '#555',
        strokeWidth: 2,
      },
    }));
    setNodesDirectly(updatedNodes);
    setEdgesDirectly(updatedEdges);
  }, [nodes, edges, setNodesDirectly, setEdgesDirectly]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
      minZoom={0.1}
      maxZoom={2}
      onPaneClick={handlePaneClick}
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
}

function App() {
  const [itemsMap, setItemsMap] = useState<ItemsMap | null>(null);
  const [goalItemIds, setGoalItemIds] = useState<string[]>([]);
  const [combineTrees, setCombineTrees] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  // Load items on mount
  useEffect(() => {
    loadAllItems()
      .then((items) => {
        setItemsMap(items);
        setGoalItemIds(loadGoalItems());
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load items:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Build crafting trees and graph
  useEffect(() => {
    if (!itemsMap || goalItemIds.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Build crafting trees for all goal items
    const trees = goalItemIds.map((itemId) =>
      buildCraftingTree(itemId, itemsMap, goalItemIds)
    );

    // Generate React Flow graph
    const graph = combineTrees
      ? buildCombinedGraph(trees, itemsMap)
      : buildSeparateGraphs(trees, itemsMap);
    
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [itemsMap, goalItemIds, combineTrees]);

  const handleAddGoalItem = (itemId: string) => {
    if (!goalItemIds.includes(itemId)) {
      const updated = [...goalItemIds, itemId];
      setGoalItemIds(updated);
      saveGoalItems(updated);
    }
  };

  const handleRemoveGoalItem = (itemId: string) => {
    const updated = goalItemIds.filter((id) => id !== itemId);
    setGoalItemIds(updated);
    saveGoalItems(updated);
  };

  const handleToggleCombineTrees = () => {
    setCombineTrees(!combineTrees);
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#1a1a1a',
          color: '#e0e0e0',
          fontSize: '18px',
        }}
      >
        Loading item data...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#1a1a1a',
          color: '#e53935',
          fontSize: '18px',
        }}
      >
        Error: {error}
      </div>
    );
  }

  if (!itemsMap) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#1a1a1a',
          color: '#e0e0e0',
          fontSize: '18px',
        }}
      >
        No item data available
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="main-content">
        <Sidebar
          itemsMap={itemsMap}
          goalItemIds={goalItemIds}
          onAddGoalItem={handleAddGoalItem}
          onRemoveGoalItem={handleRemoveGoalItem}
          combineTrees={combineTrees}
          onToggleCombineTrees={handleToggleCombineTrees}
        />
        <div className="graph-container">
          {goalItemIds.length === 0 ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                color: '#888',
                fontSize: '16px',
              }}
            >
              Add goal items from the sidebar to see what materials you need to loot.
            </div>
          ) : (
            <FlowContent 
              nodes={nodes} 
              edges={edges} 
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              setNodesDirectly={setNodes}
              setEdgesDirectly={setEdges}
            />
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export function FlowWrapper() {
  return (
    <ReactFlowProvider>
      <App />
    </ReactFlowProvider>
  );
}
