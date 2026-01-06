const GOAL_ITEMS_KEY = 'what-to-loot-goal-items';

export function loadGoalItems(): string[] {
  try {
    const stored = localStorage.getItem(GOAL_ITEMS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load goal items from localStorage:', error);
    return [];
  }
}

export function saveGoalItems(itemIds: string[]): void {
  try {
    localStorage.setItem(GOAL_ITEMS_KEY, JSON.stringify(itemIds));
  } catch (error) {
    console.error('Failed to save goal items to localStorage:', error);
  }
}

export function addGoalItem(itemId: string): string[] {
  const items = loadGoalItems();
  if (!items.includes(itemId)) {
    items.push(itemId);
    saveGoalItems(items);
  }
  return items;
}

export function removeGoalItem(itemId: string): string[] {
  const items = loadGoalItems();
  const filtered = items.filter((id) => id !== itemId);
  saveGoalItems(filtered);
  return filtered;
}
