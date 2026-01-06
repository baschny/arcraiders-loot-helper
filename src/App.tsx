import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Sidebar } from './components/Sidebar';
import { AccordionList } from './components/AccordionList';
import { loadAllItems } from './utils/dataLoader';
import { loadGoalItems, saveGoalItems, loadDisabledItems, saveDisabledItems, loadStashItems, saveStashItems } from './utils/storage';
import { buildCraftingTree, buildReverseMap } from './utils/craftingChain';
import type { ItemsMap } from './types/item';
import type { ReverseMap } from './utils/craftingChain';
import './styles/main.scss';
import './styles/accordion.scss';

function App() {
  const [itemsMap, setItemsMap] = useState<ItemsMap | null>(null);
  const [goalItemIds, setGoalItemIds] = useState<string[]>([]);
  const [disabledGoalItemIds, setDisabledGoalItemIds] = useState<Set<string>>(new Set());
  const [stashItemIds, setStashItemIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reverseMap, setReverseMap] = useState<ReverseMap>(new Map());

  // Load items on mount
  useEffect(() => {
    loadAllItems()
      .then((items) => {
        setItemsMap(items);
        setGoalItemIds(loadGoalItems());
        setDisabledGoalItemIds(loadDisabledItems());
        setStashItemIds(loadStashItems());
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
    const enabledGoalIds = goalItemIds.filter((id) => !disabledGoalItemIds.has(id));
    
    if (enabledGoalIds.length === 0) {
      setReverseMap(new Map());
      return;
    }

    const trees = enabledGoalIds.map((itemId) =>
      buildCraftingTree(itemId, itemsMap, goalItemIds, stashItemIds)
    );

    // Build reverse map for accordion display
    const reverseMapData = buildReverseMap(trees, itemsMap, stashItemIds);
    setReverseMap(reverseMapData);
  }, [itemsMap, goalItemIds, disabledGoalItemIds, stashItemIds]);

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
    const newDisabled = new Set(disabledGoalItemIds);
    newDisabled.delete(itemId);
    setDisabledGoalItemIds(newDisabled);
    saveDisabledItems(newDisabled);
  };

  const handleToggleGoalItem = (itemId: string) => {
    const newDisabled = new Set(disabledGoalItemIds);
    if (newDisabled.has(itemId)) {
      newDisabled.delete(itemId);
    } else {
      newDisabled.add(itemId);
    }
    setDisabledGoalItemIds(newDisabled);
    saveDisabledItems(newDisabled);
  };

  const handleReorderGoalItems = (reorderedIds: string[]) => {
    setGoalItemIds(reorderedIds);
    saveGoalItems(reorderedIds);
  };

  const handleEnableAllGoalItems = () => {
    const newDisabled = new Set<string>();
    setDisabledGoalItemIds(newDisabled);
    saveDisabledItems(newDisabled);
  };

  const handleDisableAllGoalItems = () => {
    const newDisabled = new Set(goalItemIds);
    setDisabledGoalItemIds(newDisabled);
    saveDisabledItems(newDisabled);
  };

  const handleToggleStashItem = (itemId: string) => {
    // Prevent goal items from being added to stash
    if (goalItemIds.includes(itemId)) {
      return;
    }

    const newStash = new Set(stashItemIds);
    if (newStash.has(itemId)) {
      newStash.delete(itemId);
    } else {
      newStash.add(itemId);
    }
    setStashItemIds(newStash);
    saveStashItems(newStash);
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
          disabledItemIds={disabledGoalItemIds}
          onAddGoalItem={handleAddGoalItem}
          onRemoveGoalItem={handleRemoveGoalItem}
          onToggleGoalItem={handleToggleGoalItem}
          onReorderGoalItems={handleReorderGoalItems}
          onEnableAllGoalItems={handleEnableAllGoalItems}
          onDisableAllGoalItems={handleDisableAllGoalItems}
        />
        <div className="main-content-area">
          {goalItemIds.length === 0 ? (
            <div className="empty-state">
              Add goal items from the sidebar to see what materials you need to loot.
            </div>
          ) : (
            <AccordionList
              itemsMap={itemsMap}
              goalItemIds={goalItemIds.filter((id) => !disabledGoalItemIds.has(id))}
              reverseMap={reverseMap}
              stashItemIds={stashItemIds}
              onToggleStashItem={handleToggleStashItem}
            />
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default App;
