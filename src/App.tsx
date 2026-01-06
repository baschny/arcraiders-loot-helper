import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Sidebar } from './components/Sidebar';
import { AccordionList } from './components/AccordionList';
import { loadAllItems } from './utils/dataLoader';
import { loadGoalItems, saveGoalItems, loadDisabledItems, saveDisabledItems } from './utils/storage';
import { buildCraftingTree, buildReverseMap } from './utils/craftingChain';
import type { ItemsMap } from './types/item';
import type { ReverseMap } from './utils/craftingChain';
import './styles/main.scss';
import './styles/accordion.scss';

function App() {
  const [itemsMap, setItemsMap] = useState<ItemsMap | null>(null);
  const [goalItemIds, setGoalItemIds] = useState<string[]>([]);
  const [disabledItemIds, setDisabledItemIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reverseMap, setReverseMap] = useState<ReverseMap>(new Map());

  // Load items on mount
  useEffect(() => {
    loadAllItems()
      .then((items) => {
        setItemsMap(items);
        setGoalItemIds(loadGoalItems());
        setDisabledItemIds(loadDisabledItems());
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load items:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Build crafting trees and reverse map
  useEffect(() => {
    if (!itemsMap || goalItemIds.length === 0) {
      setReverseMap(new Map());
      return;
    }

    // Build crafting trees only for enabled goal items
    const enabledGoalIds = goalItemIds.filter((id) => !disabledItemIds.has(id));
    
    if (enabledGoalIds.length === 0) {
      setReverseMap(new Map());
      return;
    }

    const trees = enabledGoalIds.map((itemId) =>
      buildCraftingTree(itemId, itemsMap, goalItemIds)
    );

    // Build reverse map for accordion display
    const reverseMapData = buildReverseMap(trees, itemsMap);
    setReverseMap(reverseMapData);
  }, [itemsMap, goalItemIds, disabledItemIds]);

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
    
    // Also remove from disabled set
    const newDisabled = new Set(disabledItemIds);
    newDisabled.delete(itemId);
    setDisabledItemIds(newDisabled);
    saveDisabledItems(newDisabled);
  };

  const handleToggleGoalItem = (itemId: string) => {
    const newDisabled = new Set(disabledItemIds);
    if (newDisabled.has(itemId)) {
      newDisabled.delete(itemId);
    } else {
      newDisabled.add(itemId);
    }
    setDisabledItemIds(newDisabled);
    saveDisabledItems(newDisabled);
  };

  const handleReorderGoalItems = (reorderedIds: string[]) => {
    setGoalItemIds(reorderedIds);
    saveGoalItems(reorderedIds);
  };

  const handleEnableAllGoalItems = () => {
    const newDisabled = new Set<string>();
    setDisabledItemIds(newDisabled);
    saveDisabledItems(newDisabled);
  };

  const handleDisableAllGoalItems = () => {
    const newDisabled = new Set(goalItemIds);
    setDisabledItemIds(newDisabled);
    saveDisabledItems(newDisabled);
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
          disabledItemIds={disabledItemIds}
          onAddGoalItem={handleAddGoalItem}
          onRemoveGoalItem={handleRemoveGoalItem}
          onToggleGoalItem={handleToggleGoalItem}
          onReorderGoalItems={handleReorderGoalItems}
          onEnableAllGoalItems={handleEnableAllGoalItems}
          onDisableAllGoalItems={handleDisableAllGoalItems}
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
            <AccordionList
              itemsMap={itemsMap}
              goalItemIds={goalItemIds.filter((id) => !disabledItemIds.has(id))}
              reverseMap={reverseMap}
            />
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default App;
