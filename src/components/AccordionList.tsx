import { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, Filter } from 'lucide-react';
import type { ItemsMap, ItemRarity } from '../types/item';
import type { ReverseMap } from '../utils/craftingChain';
import { ItemHierarchy } from './ItemHierarchy';
import { ItemIconWithInfo } from './ItemIconWithInfo';
import { getRarityClass } from '../utils/dataLoader';
import { loadEnabledTypes, saveEnabledTypes, loadEnabledRarities, saveEnabledRarities } from '../utils/storage';

interface AccordionListProps {
  itemsMap: ItemsMap;
  goalItemIds: string[];
  reverseMap: ReverseMap;
  stashItemIds: Set<string>;
  onToggleStashItem: (itemId: string) => void;
}

export function AccordionList({ itemsMap, goalItemIds, reverseMap, stashItemIds, onToggleStashItem }: AccordionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [enabledTypes, setEnabledTypes] = useState<Set<string>>(new Set());
  const [enabledRarities, setEnabledRarities] = useState<Set<ItemRarity>>(new Set());
  const [stashSectionExpanded, setStashSectionExpanded] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get all items that are in the reverse map (i.e., needed for crafting)
  // Exclude goal items and stash items from the list
  const requiredItemIds = Array.from(reverseMap.keys()).filter(
    (id) => !goalItemIds.includes(id) && !stashItemIds.has(id)
  );

  // Get items that are in stash and were previously needed
  const stashItems = Array.from(stashItemIds)
    .map((id) => itemsMap[id])
    .filter((item) => item !== undefined)
    .sort((a, b) => a.name.en.localeCompare(b.name.en));

  // Get items and sort alphabetically
  const sortedItems = requiredItemIds
    .map((id) => itemsMap[id])
    .filter((item) => item !== undefined)
    .sort((a, b) => a.name.en.localeCompare(b.name.en));

  // Get all unique types from sorted items
  const allTypes = Array.from(
    new Set(sortedItems.map((item) => item.type))
  ).sort();

  // Get all unique rarities from sorted items
  const rarityOrder: ItemRarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
  const allRarities = Array.from(
    new Set(sortedItems.map((item) => item.rarity))
  ).sort((a, b) => rarityOrder.indexOf(a) - rarityOrder.indexOf(b));

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

  // Initialize enabled rarities from localStorage or default to all rarities
  useEffect(() => {
    if (allRarities.length > 0 && enabledRarities.size === 0) {
      const savedRarities = loadEnabledRarities();
      if (savedRarities && savedRarities.size > 0) {
        // Use saved rarities, but only include rarities that exist in current list
        const validSavedRarities = new Set(
          Array.from(savedRarities).filter((rarity) => allRarities.includes(rarity as ItemRarity))
        ) as Set<ItemRarity>;
        setEnabledRarities(validSavedRarities.size > 0 ? validSavedRarities : new Set(allRarities));
      } else {
        setEnabledRarities(new Set(allRarities));
      }
    }
  }, [allRarities.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter based on search term, enabled types, and enabled rarities
  const filteredItems = sortedItems.filter((item) => {
    // Filter by search term
    if (searchTerm.trim() && !item.name.en.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    // Filter by type
    if (!enabledTypes.has(item.type)) {
      return false;
    }
    // Filter by rarity
    if (!enabledRarities.has(item.rarity)) {
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

  const handleToggleRarity = (rarity: ItemRarity) => {
    const newEnabledRarities = new Set(enabledRarities);
    if (newEnabledRarities.has(rarity)) {
      newEnabledRarities.delete(rarity);
    } else {
      newEnabledRarities.add(rarity);
    }
    setEnabledRarities(newEnabledRarities);
    saveEnabledRarities(newEnabledRarities);
  };

  const handleEnableAllRarities = () => {
    const allRaritiesSet = new Set(allRarities);
    setEnabledRarities(allRaritiesSet);
    saveEnabledRarities(allRaritiesSet);
  };

  const handleDisableAllRarities = () => {
    const emptySet = new Set<ItemRarity>();
    setEnabledRarities(emptySet);
    saveEnabledRarities(emptySet);
  };

  const handleToggleFilters = () => {
    const newExpanded = !filtersExpanded;
    setFiltersExpanded(newExpanded);
    
    // Focus search input when expanding
    if (newExpanded) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  };

  // Build summary for collapsed state
  const getFilterSummary = () => {
    return (
      <div className="filters-summary-content">
        {searchTerm.trim() && (
          <span className="filter-summary-search">"{searchTerm}"</span>
        )}
        
        {enabledTypes.size === 0 ? (
          <span className="filter-summary-none">nothing</span>
        ) : enabledTypes.size < allTypes.length ? (
          <div className="filter-summary-badges">
            {Array.from(enabledTypes).sort().map((type) => (
              <span key={type} className="filter-summary-badge type-badge">
                {type}
              </span>
            ))}
          </div>
        ) : null}
        
        {enabledRarities.size === 0 ? (
          <span className="filter-summary-none">nothing</span>
        ) : enabledRarities.size < allRarities.length ? (
          <div className="filter-summary-badges">
            {Array.from(enabledRarities).sort((a, b) => 
              rarityOrder.indexOf(a) - rarityOrder.indexOf(b)
            ).map((rarity) => (
              <span 
                key={rarity} 
                className={`filter-summary-badge rarity-badge rarity-${rarity.toLowerCase()}`}
              >
                {rarity}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <div className="filters-section">
        <div 
          className="filters-header"
          onClick={handleToggleFilters}
        >
          <div className="filters-header-content">
            <Filter size={16} />
            {getFilterSummary()}
          </div>
          <span className="filters-toggle">
            {filtersExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </span>
        </div>

        {filtersExpanded && (
          <div className="filters-controls">
            <div className="filter-row">
              <label className="filter-label">Search</label>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Type to search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="accordion-search-input"
              />
            </div>

            {allTypes.length > 0 && (
              <div className="filter-row">
                <label className="filter-label">Type</label>
                <div className="filter-buttons">
                  <button
                    onClick={handleEnableAllTypes}
                    className="filter-action-button"
                    disabled={enabledTypes.size === allTypes.length}
                  >
                    All
                  </button>
                  <button
                    onClick={handleDisableAllTypes}
                    className="filter-action-button"
                    disabled={enabledTypes.size === 0}
                  >
                    None
                  </button>
                  {allTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => handleToggleType(type)}
                      className={`filter-button ${
                        enabledTypes.has(type) ? 'enabled' : 'disabled'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {allRarities.length > 0 && (
              <div className="filter-row">
                <label className="filter-label">Rarity</label>
                <div className="filter-buttons">
                  <button
                    onClick={handleEnableAllRarities}
                    className="filter-action-button"
                    disabled={enabledRarities.size === allRarities.length}
                  >
                    All
                  </button>
                  <button
                    onClick={handleDisableAllRarities}
                    className="filter-action-button"
                    disabled={enabledRarities.size === 0}
                  >
                    None
                  </button>
                  {allRarities.map((rarity) => (
                    <button
                      key={rarity}
                      onClick={() => handleToggleRarity(rarity)}
                      className={`filter-button filter-rarity rarity-${rarity.toLowerCase()} ${
                        enabledRarities.has(rarity) ? 'enabled' : 'disabled'
                      }`}
                    >
                      {rarity}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="accordion-items">
        {sortedItems.length === 0 ? (
          <div className="accordion-no-results">No items needed for your goals.</div>
        ) : filteredItems.length === 0 ? (
          <div className="accordion-no-results">No items found matching "{searchTerm}"</div>
        ) : (
          filteredItems.map((item) => {
            const isExpanded = expandedItemId === item.id;
            const isGoal = goalItemIds.includes(item.id);
            
            // Calculate how many goals this item contributes to
            const usageInfo = reverseMap.get(item.id) || [];
            const goalCount = new Set(
              usageInfo.flatMap(usage => usage.goalItemIds)
            ).size;
            
            // Determine priority level for styling
            let priorityLevel = 'default';
            if (goalCount >= 4) {
              priorityLevel = 'high';
            } else if (goalCount >= 2) {
              priorityLevel = 'medium';
            }

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
                } priority-${priorityLevel}`}
              >
                <div
                  className="accordion-item-header"
                  onClick={() => handleToggleItem(item.id)}
                >
                  <div className="accordion-item-header-content">
                    {item.imageFilename && (
                      <ItemIconWithInfo
                        item={item}
                        itemsMap={itemsMap}
                        className={`accordion-item-icon ${getRarityClass(item.rarity)}`}
                      />
                    )}
                    <span className="accordion-item-name">{item.name.en}</span>
                    {isGoal && <span className="accordion-item-goal-badge">Goal</span>}
                  </div>
                  <div className="accordion-item-header-right">
                    {!isGoal && (
                      <button
                        className="accordion-item-stash-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStashItem(item.id);
                        }}
                        title="I have already enough of this material"
                      >
                        −
                      </button>
                    )}
                    {goalCount > 0 && (
                      <span className={`accordion-item-goal-count priority-${priorityLevel}`}>
                        ×{goalCount}
                      </span>
                    )}
                    <span className="accordion-item-toggle">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </span>
                  </div>
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

      {stashItems.length > 0 && (
        <div className="accordion-stash-section">
          <div
            className="accordion-stash-header"
            onClick={() => setStashSectionExpanded(!stashSectionExpanded)}
          >
            <div className="accordion-stash-header-content">
              <h3 className="accordion-stash-title">Already Enough in Stash</h3>
              <span className="accordion-stash-count-badge">{stashItems.length}</span>
            </div>
            <span className="accordion-stash-toggle">
              {stashSectionExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </span>
          </div>

          {stashSectionExpanded && (
            <div className="accordion-stash-items">
              {stashItems.map((item) => (
                <div key={item.id} className="accordion-stash-item">
                  <div className="accordion-stash-item-content">
                    {item.imageFilename && (
                      <ItemIconWithInfo
                        item={item}
                        itemsMap={itemsMap}
                        className={`accordion-item-icon ${getRarityClass(item.rarity)}`}
                      />
                    )}
                    <span className="accordion-stash-item-name">{item.name.en}</span>
                  </div>
                  <button
                    className="accordion-stash-item-restore-button"
                    onClick={() => onToggleStashItem(item.id)}
                    title="Add back to required materials"
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
