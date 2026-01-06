# What to Loot - ARC Raiders Crafting Visualizer

A React-based web application to visualize crafting chains for ARC Raiders items, helping you quickly see what base materials you need to loot during raids.

## Features

- **Search & Add Goal Items**: Autocomplete search to find and add items you want to craft
- **Crafting Tree Visualization**: Left-to-right React Flow graphs showing complete crafting chains
- **Salvaging Support**: Displays items that can be salvaged to obtain required materials
- **Separate & Combined Views**: Toggle between individual trees or a combined view showing total materials
- **Rarity-Colored Icons**: Items displayed with color-coded borders (Common, Uncommon, Rare, Epic, Legendary)
- **LocalStorage Persistence**: Your goal items list is saved in the browser
- **Dark Theme**: Consistent with the ARC Raiders aesthetic

## Tech Stack

- **React 19** with TypeScript
- **Vite 7** for build tooling
- **React Flow 11** for graph visualization
- **Dagre** for automatic graph layout
- **SCSS** for styling
- **Data Source**: [arcraiders-data](https://github.com/RaidTheory/arcraiders-data)

## Setup

### Prerequisites

- Node.js (v20 or higher recommended)
- npm

### Installation

```bash
# Install dependencies
npm install

# Generate item data from arcraiders-data
npm run generate-data

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── components/       # React components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Sidebar.tsx
│   └── ItemNode.tsx
├── styles/          # SCSS stylesheets
│   ├── _variables.scss
│   ├── _base.scss
│   ├── _sidebar.scss
│   ├── _item-node.scss
│   └── main.scss
├── types/           # TypeScript type definitions
│   └── item.ts
├── utils/           # Utility functions
│   ├── dataLoader.ts       # Load items from JSON
│   ├── storage.ts          # LocalStorage helpers
│   ├── craftingChain.ts    # Crafting tree logic
│   └── graphBuilder.ts     # React Flow graph generation
└── App.tsx          # Main application component
```

## How It Works

1. **Data Loading**: On startup, loads all 495 items from `public/items/`
2. **Search**: Debounced autocomplete filters items by name
3. **Crafting Trees**: For each goal item, recursively resolves recipe dependencies
4. **Salvaging**: Finds items that can be salvaged to obtain required materials (excludes Basic Materials and Goal Items)
5. **Graph Layout**: Uses dagre for automatic left-to-right hierarchical layout
6. **Visualization**: Renders with React Flow showing item icons, quantities, and dependencies

## Usage

1. **Add Goal Items**: Search for items you want to craft and click the "+" button
2. **View Crafting Chain**: See the complete tree of materials needed
3. **Separate Mode** (default): Each goal item shows its own tree, stacked vertically
4. **Combined Mode**: Toggle on to see a merged view with aggregated material quantities
5. **Salvageable Items**: Dashed edges show items that can be salvaged for materials

## Data Generation

The `generate-item-data.sh` script copies item JSON files from `../arcraiders-data/items/` and creates an index for efficient loading. Run this script whenever the upstream data is updated:

```bash
npm run generate-data
```

## Credits

- Data provided by [RaidTheory/arcraiders-data](https://github.com/RaidTheory/arcraiders-data) and [arctracker.io](https://arctracker.io)
- Inspired by the quest-tracker application design

## License

ISC
