import { useState, useEffect, useRef } from 'react';
import type { Item, ItemsMap } from '../types/item';
import { getRarityClass } from '../utils/dataLoader';

interface SidebarProps {
  itemsMap: ItemsMap;
  goalItemIds: string[];
  onAddGoalItem: (itemId: string) => void;
  onRemoveGoalItem: (itemId: string) => void;
  combineTrees: boolean;
  onToggleCombineTrees: () => void;
}

export function Sidebar({
  itemsMap,
  goalItemIds,
  onAddGoalItem,
  onRemoveGoalItem,
  combineTrees,
  onToggleCombineTrees,
}: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<number | undefined>(undefined);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.trim().length < 2) {
      setFilteredItems([]);
      setShowDropdown(false);
      return;
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      const searchLower = searchTerm.toLowerCase();
      const results = Object.values(itemsMap)
        .filter((item) => 
          item.name.en.toLowerCase().includes(searchLower)
        )
        .slice(0, 20); // Limit results
      
      setFilteredItems(results);
      setShowDropdown(results.length > 0);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, itemsMap]);

  const handleAddItem = (itemId: string) => {
    onAddGoalItem(itemId);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const goalItems = goalItemIds
    .map((id) => itemsMap[id])
    .filter((item) => item !== undefined);

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        {/* Search Section */}
        <div className="sidebar-section">
          <div className="search-box">
            <label>Goal Items</label>
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => {
                if (filteredItems.length > 0) {
                  setShowDropdown(true);
                }
              }}
            />
            
            {showDropdown && (
              <div className="autocomplete-dropdown">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="autocomplete-dropdown-item"
                    onClick={() => handleAddItem(item.id)}
                  >
                    {item.imageFilename && (
                      <img
                        src={item.imageFilename}
                        alt={item.name.en}
                        className={`autocomplete-dropdown-item-icon ${getRarityClass(item.rarity)}`}
                      />
                    )}
                    <span className="autocomplete-dropdown-item-name">
                      {item.name.en}
                    </span>
                    <div className="autocomplete-dropdown-item-add">+</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Goal Items List */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">Your Goals</div>
          {goalItems.length === 0 ? (
            <div className="goal-items-list-empty">
              No goal items yet. Search and add items above.
            </div>
          ) : (
            <div className="goal-items-list">
              {goalItems.map((item) => (
                <div key={item.id} className="goal-items-list-item">
                  {item.imageFilename && (
                    <img
                      src={item.imageFilename}
                      alt={item.name.en}
                      className={`goal-items-list-item-icon ${getRarityClass(item.rarity)}`}
                    />
                  )}
                  <span className="goal-items-list-item-name">{item.name.en}</span>
                  <button
                    className="goal-items-list-item-remove"
                    onClick={() => onRemoveGoalItem(item.id)}
                    title="Remove from goals"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Combine Toggle */}
        {goalItems.length > 1 && (
          <div className="sidebar-section">
            <div className="combine-toggle">
              <input
                type="checkbox"
                id="combine-toggle"
                checked={combineTrees}
                onChange={onToggleCombineTrees}
              />
              <label htmlFor="combine-toggle">Combine Trees</label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
