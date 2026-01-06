import { useState, useEffect, useRef } from 'react';
import type { ItemsMap } from '../types/item';
import type { ReverseMap } from '../utils/craftingChain';
import { ItemHierarchy } from './ItemHierarchy';
import { getRarityClass } from '../utils/dataLoader';
import { loadEnabledTypes, saveEnabledTypes } from '../utils/storage';

interface AccordionListProps {
  itemsMap: ItemsMap;
  goalItemIds: string[];
  reverseMap: ReverseMap;
}

export function AccordionList({ itemsMap, goalItemIds, reverseMap }: AccordionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [enabledTypes, setEnabledTypes] = useState<Set<string>>(new Set());
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Get all items that are in the reverse map (i.e., needed for crafting)
  // Exclude goal items from the list
  const requiredItemIds = Array.from(reverseMap.keys()).filter(
    (id) => !goalItemIds.includes(id)
  );

  // Get items and sort alphabetically
  const sortedItems = requiredItemIds
    .map((id) => itemsMap[id])
    .filter((item) => item !== undefined)
    .sort((a, b) => a.name.en.localeCompare(b.name.en));

  // Get all unique types from sorted items
  const allTypes = Array.from(
    new Set(sortedItems.map((item) => item.type))
  ).sort();

  // Initialize enabled types from localStorage or default to all types
  useEffect(() => {
    if (allTypes.length > 0 && enabledTypes.size === 0) {
      const savedTypes = loadEnabledTypes();
      if (savedTypes && savedTypes.size > 0) {
        // Use saved types, but only include types that exist in current list
        const validSavedTypes = new Set(
          Array.from(savedTypes).filter((type) => allTypes.includes(type))
        );
        setEnabledTypes(validSavedTypes.size > 0 ? validSavedTypes : new Set(allTypes));
      } else {
        setEnabledTypes(new Set(allTypes));
      }
    }
  }, [allTypes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter based on search term and enabled types
  const filteredItems = sortedItems.filter((item) => {
    // Filter by search term
    if (searchTerm.trim() && !item.name.en.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    // Filter by type
    if (!enabledTypes.has(item.type)) {
      return false;
    }
    return true;
  });

  // Auto-expand when only one result
  useEffect(() => {
    if (filteredItems.length === 1 && searchTerm.trim()) {
      setExpandedItemId(filteredItems[0].id);
    }
  }, [filteredItems, searchTerm]);

  const handleToggleItem = (itemId: string) => {
    setExpandedItemId(expandedItemId === itemId ? null : itemId);
  };

  const handleNavigateToItem = (itemId: string) => {
    setExpandedItemId(itemId);
    
    // Scroll to the item
    setTimeout(() => {
      const element = itemRefs.current.get(itemId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleToggleType = (type: string) => {
    const newEnabledTypes = new Set(enabledTypes);
    if (newEnabledTypes.has(type)) {
      newEnabledTypes.delete(type);
    } else {
      newEnabledTypes.add(type);
    }
    setEnabledTypes(newEnabledTypes);
    saveEnabledTypes(newEnabledTypes);
  };

  const handleEnableAllTypes = () => {
    const allTypesSet = new Set(allTypes);
    setEnabledTypes(allTypesSet);
    saveEnabledTypes(allTypesSet);
  };

  const handleDisableAllTypes = () => {
    const emptySet = new Set<string>();
    setEnabledTypes(emptySet);
    saveEnabledTypes(emptySet);
  };

  if (sortedItems.length === 0) {
    return (
      <div className="accordion-list-empty">
        No items needed for your goals.
      </div>
    );
  }

  return (
    <div className="accordion-list">
      <div className="accordion-search">
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="accordion-search-input"
        />
      </div>

      {allTypes.length > 0 && (
        <div className="accordion-type-filter">
          <div className="accordion-type-filter-header">
            <span className="accordion-type-filter-label">Filter by Type:</span>
            <div className="accordion-type-filter-actions">
              <button
                onClick={handleEnableAllTypes}
                className="accordion-type-filter-action"
                disabled={enabledTypes.size === allTypes.length}
              >
                Enable All
              </button>
              <button
                onClick={handleDisableAllTypes}
                className="accordion-type-filter-action"
                disabled={enabledTypes.size === 0}
              >
                Disable All
              </button>
            </div>
          </div>
          <div className="accordion-type-filter-types">
            {allTypes.map((type) => (
              <button
                key={type}
                onClick={() => handleToggleType(type)}
                className={`accordion-type-filter-type ${
                  enabledTypes.has(type) ? 'enabled' : 'disabled'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="accordion-items">
        {filteredItems.length === 0 ? (
          <div className="accordion-no-results">No items found matching "{searchTerm}"</div>
        ) : (
          filteredItems.map((item) => {
            const isExpanded = expandedItemId === item.id;
            const isGoal = goalItemIds.includes(item.id);

            return (
              <div
                key={item.id}
                ref={(el) => {
                  if (el) {
                    itemRefs.current.set(item.id, el);
                  } else {
                    itemRefs.current.delete(item.id);
                  }
                }}
                className={`accordion-item ${isExpanded ? 'expanded' : ''} ${
                  isGoal ? 'goal-item' : ''
                }`}
              >
                <div
                  className="accordion-item-header"
                  onClick={() => handleToggleItem(item.id)}
                >
                  <div className="accordion-item-header-content">
                    {item.imageFilename && (
                      <img
                        src={item.imageFilename}
                        alt={item.name.en}
                        className={`accordion-item-icon ${getRarityClass(item.rarity)}`}
                      />
                    )}
                    <span className="accordion-item-name">{item.name.en}</span>
                    {isGoal && <span className="accordion-item-goal-badge">Goal</span>}
                  </div>
                  <span className="accordion-item-toggle">{isExpanded ? '−' : '+'}</span>
                </div>

                {isExpanded && (
                  <div className="accordion-item-content">
                    <ItemHierarchy
                      itemId={item.id}
                      itemsMap={itemsMap}
                      reverseMap={reverseMap}
                      goalItemIds={goalItemIds}
                      onNavigateToItem={handleNavigateToItem}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
