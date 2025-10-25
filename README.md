# LifeParser

A text-based life simulation game with natural language processing. Build your business empire, manage your character's needs, and make strategic decisions in this immersive simulation.

## 🎮 Features

- **Natural Language Processing**: Type commands in plain English
- **Character Development**: Manage health, energy, hunger, and skills
- **Business Simulation**: Work jobs, take loans, and build businesses
- **Dynamic World**: Explore multiple locations and interact with NPCs
- **Random Events**: Experience unexpected opportunities and challenges

## 📁 Project Structure

```
LifeParser/
├── src/                    # JavaScript source files (ES6 modules)
│   ├── main.js            # Entry point - initializes the game
│   ├── engine.js          # Game engine and command processing
│   ├── parser.js          # Natural language parser
│   ├── gameState.js       # Game state management
│   └── locations.js       # World data and locations
├── data/                  # JSON data files (for future expansion)
├── public/                # Public assets and HTML
│   ├── index.html         # Main HTML file
│   └── style.css          # Styles
├── package.json           # NPM dependencies and scripts
├── .eslintrc.json         # ESLint configuration
├── .prettierrc.json       # Prettier configuration
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## 🚀 Setup

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/aubreyhayes47/LifeParser.git
   cd LifeParser
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

   This will open the game in your default browser at `http://localhost:8080`

## 🛠️ Development

### Available Scripts

- `npm start` - Start local development server
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Automatically fix linting issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check if code is formatted correctly

### Code Style

This project uses:
- **ESLint** for code linting (enforces code quality)
- **Prettier** for code formatting (enforces consistent style)
- **ES6 modules** for modern JavaScript organization

### Making Changes

1. All JavaScript source code goes in `src/`
2. HTML and CSS go in `public/`
3. Game data (JSON) goes in `data/`
4. Run `npm run lint` before committing
5. Format your code with `npm run format`

## 🎯 How to Play

### Save System

**LifeParser** uses browser localStorage for automatic and manual game saves:

- **Auto-Save**: Your game is automatically saved after every action you take
- **Manual Save**: Type `save` to manually save your game and see save confirmation
- **Auto-Load**: When you return to the game, your last save is automatically loaded
- **Manual Load**: Type `load` to manually reload your last saved game
- **Data Persistence**: Saves are stored in your browser's localStorage and persist across sessions
- **Forward Compatibility**: The save system merges saved data with default values, ensuring compatibility with future game updates

**Note**: Clearing your browser data will delete saved games. Each browser stores saves independently.

### Basic Commands

**Movement:**
- `go to [location]` - Travel to a location
- `look around` - Examine your surroundings

**Interaction:**
- `talk to [person]` - Speak with NPCs
- `work` - Work at your current location
- `apply for job` - Get hired (at café)

**Basic Needs:**
- `sleep` - Rest at home (restores energy)
- `eat` - Get food (reduces hunger)

**Business:**
- `take loan` - Get a business loan at the bank
- `buy cafe` - Purchase the café ($50,000)

**Info:**
- `stats` - View full character stats
- `check [thing]` - Examine something
- `inventory` - View your items
- `help` - Show all available commands

## 🏗️ Architecture

The game is built with a modular architecture using ES6 modules:

- **gameState.js**: Centralized state management with localStorage-based save/load system
- **locations.js**: World data and location definitions
- **parser.js**: Natural language command parsing
- **engine.js**: Core game logic and command handlers
- **main.js**: Application entry point and event handlers

### Save System Architecture

The game uses browser localStorage for persistence:

- **Storage Key**: `lifeparser_save` stores the serialized game state as JSON
- **Timestamp Key**: `lifeparser_save_timestamp` stores the ISO timestamp of the last save
- **Auto-Save**: Triggered after every command execution
- **State Merging**: On load, saved state is merged with default state structure to ensure forward compatibility when new properties are added
- **Error Handling**: Save/load operations include try-catch blocks with user feedback

## 📝 License

ISC License

## 🤝 Contributing

Contributions are welcome! Please follow the existing code style and run linting/formatting before submitting changes.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` and `npm run format`
5. Submit a pull request
