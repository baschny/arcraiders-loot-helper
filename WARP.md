# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

A React-based web application that visualizes crafting chains for ARC Raiders items. Users can add goal items they want to craft and see the complete dependency tree of materials needed, including salvageable alternatives.

## Development Commands

### Setup and Data Generation
```bash
# Install dependencies
npm install

# Generate item data from arcraiders-data repository
npm run generate-data
```

**Important:** The `generate-data` script requires:
- The `arcraiders-data` repository to exist at `../arcraiders-data/`
- `jq` command-line JSON processor to be installed

### Development
```bash
# Start development server (Vite)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Architecture

### Data Flow
1. **Data Loading**: App loads consolidated items from `/public/items.json` (495 items) via `dataLoader.ts`
2. **Crafting Trees**: For each goal item, `craftingChain.ts` recursively resolves recipe dependencies
3. **Reverse Mapping**: `buildReverseMap()` creates a lookup showing what each item is used for
4. **Accordion Display**: Items are displayed in an expandable accordion list, showing hierarchical usage

### Key Modules

**`src/utils/craftingChain.ts`**
- `buildCraftingTree()`: Recursively resolves recipes into a tree structure (max depth 10)
- `findSalvageableSources()`: Finds items that salvage/recycle into required materials
- `buildReverseMap()`: Creates itemId → usage info lookup (what items use this material)
- Excludes Basic Materials, goal items, weapons, and modifications from salvageable sources

**`src/utils/graphBuilder.ts`**
- Previously used for React Flow visualization (now replaced with accordion)
- Uses dagre for automatic graph layout
- Supports both separate and combined tree views
- Distinguishes salvage (dashed cyan) vs recycle (dotted orange) edges

**`src/utils/dataLoader.ts`**
- `loadAllItems()`: Fetches and converts item array to ItemsMap
- `getRarityClass()`: Returns CSS class for rarity-based styling

**`src/utils/storage.ts`**
- LocalStorage persistence for goal items list

### Component Structure

**`AccordionList`**: Main display component
- Searchable list of all required materials
- Auto-expands when search narrows to single result
- Click to navigate between related items

**`ItemHierarchy`**: Shows usage tree for individual items
- Displays recipes that use the item
- Shows salvage/recycle relationships
- Links to related items (clickable navigation)

**`Sidebar`**: Goal item management
- Debounced autocomplete search
- Add/remove goal items
- Persists to localStorage

**`ItemNode`**: Custom React Flow node (legacy, may be removed)
- Displays item icon with rarity-colored border
- Shows quantity needed
- Indicates salvage method if applicable

### Type System

**`src/types/item.ts`**
- `Item`: Core data structure from arcraiders-data
- `ItemRarity`: Common, Uncommon, Rare, Epic, Legendary
- Key properties: `recipe`, `salvagesInto`, `recyclesInto`

### Styling

**SCSS Architecture** (uses `@use` not `@import`):
- `_variables.scss`: All design tokens (colors, spacing, shadows)
- `_base.scss`: Global styles
- `_sidebar.scss`: Sidebar component styles
- `_item-node.scss`: Item display styles
- `accordion.scss`: Accordion list styles
- `main.scss`: Entry point that imports all modules

**Design System**:
- Dark theme with ARC Raiders aesthetic
- Rarity colors: Common (#888), Uncommon (#4caf50), Rare (#2196f3), Epic (#9c27b0), Legendary (#ffd700)
- Salvage edges: dashed cyan (#4fc3f7)
- Recycle edges: dotted orange (#ffa726)

## Data Source

Item data comes from `../arcraiders-data/items/` (external repository). The `generate-item-data.sh` script:
1. Validates source directory and `jq` availability
2. Consolidates all JSON files into single `public/items.json`
3. Strips unnecessary properties to reduce bundle size
4. Reports total item count

## Development Notes

### When modifying crafting logic:
- Circular dependency protection is depth-limited (max 10 levels)
- Salvageable sources are filtered by type (excludes Basic Materials, weapons, modifications, goal items)
- The reverse map aggregates across all goal items and uses max quantity

### When adding features:
- Goal items persist in localStorage (`goal-items` key)
- Search is case-insensitive and debounced
- All item references use itemId as key

### Testing approach:
- This project has no automated tests
- Manual testing focuses on edge cases (circular dependencies, missing items)
- Validate by building and running in dev mode

## Node Version
Uses Node.js v20 or higher (managed with nvm).
