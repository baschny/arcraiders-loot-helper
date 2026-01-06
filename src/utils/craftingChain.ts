import type { ItemsMap } from '../types/item';

export interface CraftingNode {
  itemId: string;
  quantity: number;
  children: CraftingNode[];
  salvageableFrom?: { itemId: string; method: 'salvage' | 'recycle' }[]; // Items and their method
}

export interface CraftingTree {
  goalItemId: string;
  root: CraftingNode;
}

/**
 * Builds a crafting tree for a goal item, resolving all recipe dependencies
 * and including salvageable sources
 */
export function buildCraftingTree(
  goalItemId: string,
  itemsMap: ItemsMap,
  goalItemIds: string[]
): CraftingTree {
  const visited = new Set<string>();
  
  function buildNode(itemId: string, quantity: number, depth: number = 0): CraftingNode {
    const item = itemsMap[itemId];
    if (!item) {
      console.warn(`Item not found: ${itemId}`);
      return { itemId, quantity, children: [] };
    }

    // Avoid infinite recursion
    const visitKey = `${itemId}-${depth}`;
    if (depth > 10 || visited.has(visitKey)) {
      return { itemId, quantity, children: [] };
    }
    visited.add(visitKey);

    const node: CraftingNode = {
      itemId,
      quantity,
      children: [],
    };

    // If item has a recipe, expand it
    if (item.recipe) {
      for (const [ingredientId, ingredientQty] of Object.entries(item.recipe)) {
        const totalNeeded = ingredientQty * quantity;
        const childNode = buildNode(ingredientId, totalNeeded, depth + 1);
        node.children.push(childNode);

        // Find salvageable sources for this ingredient
        const salvageableSources = findSalvageableSources(
          ingredientId,
          itemsMap,
          goalItemIds
        );
        if (salvageableSources.length > 0) {
          childNode.salvageableFrom = salvageableSources;
        }
      }
    }

    return node;
  }

  const root = buildNode(goalItemId, 1);
  return { goalItemId, root };
}

/**
 * Find items that can be salvaged/recycled to produce the target material
 * Excludes Basic Materials, goal items, weapons, and modifications
 */
function findSalvageableSources(
  targetMaterialId: string,
  itemsMap: ItemsMap,
  goalItemIds: string[]
): { itemId: string; method: 'salvage' | 'recycle' }[] {
  const sources: { itemId: string; method: 'salvage' | 'recycle' }[] = [];
  
  // Check if the target material is a Basic Material
  const targetItem = itemsMap[targetMaterialId];
  if (targetItem && targetItem.type === 'Basic Material') {
    // Don't show salvageable sources for Basic Materials
    return sources;
  }

  for (const item of Object.values(itemsMap)) {
    // Skip if this item is a Basic Material
    if (item.type === 'Basic Material') {
      continue;
    }

    // Skip if this item is in the goal items list
    if (goalItemIds.includes(item.id)) {
      continue;
    }
    
    // Skip weapons and modifications
    if (item.isWeapon || item.type === 'Modification') {
      continue;
    }

    // Check if this item salvages OR recycles into the target material
    const canSalvage = item.salvagesInto && item.salvagesInto[targetMaterialId];
    const canRecycle = item.recyclesInto && item.recyclesInto[targetMaterialId];
    
    if (canSalvage) {
      sources.push({ itemId: item.id, method: 'salvage' });
    } else if (canRecycle) {
      sources.push({ itemId: item.id, method: 'recycle' });
    }
  }

  return sources;
}

/**
 * Flattens a crafting tree into a list of all required materials
 * with their total quantities
 */
export function flattenCraftingTree(tree: CraftingTree): Map<string, number> {
  const materials = new Map<string, number>();

  function traverse(node: CraftingNode) {
    // If node has no children (leaf node), it's a base material
    if (node.children.length === 0) {
      const current = materials.get(node.itemId) || 0;
      materials.set(node.itemId, current + node.quantity);
    }

    // Traverse children
    for (const child of node.children) {
      traverse(child);
    }
  }

  traverse(tree.root);
  return materials;
}

/**
 * Combines multiple crafting trees, aggregating common materials
 */
export function combineCraftingTrees(trees: CraftingTree[]): Map<string, number> {
  const combinedMaterials = new Map<string, number>();

  for (const tree of trees) {
    const treeMaterials = flattenCraftingTree(tree);
    for (const [itemId, quantity] of treeMaterials.entries()) {
      const current = combinedMaterials.get(itemId) || 0;
      combinedMaterials.set(itemId, current + quantity);
    }
  }

  return combinedMaterials;
}
