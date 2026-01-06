import type { Item, ItemsMap } from '../types/item';

export async function loadAllItems(): Promise<ItemsMap> {
  const response = await fetch('/items.json');
  if (!response.ok) {
    throw new Error('Failed to load items');
  }
  
  const items: Item[] = await response.json();
  const itemsMap: ItemsMap = {};

  // Build the map
  items.forEach((item) => {
    itemsMap[item.id] = item;
  });

  return itemsMap;
}

export function getRarityClass(rarity: string): string {
  return `rarity-${rarity.toLowerCase()}`;
}
