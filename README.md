# Tetris Game

A responsive, dark-mode Tetris game built with React and TypeScript.

## Features

- 🎮 Full gameplay with movement, rotation, hard drop
- 📱 Mobile-friendly controls overlay
- 🌙 Dark theme with neon accents
- 📊 Score tracking and high scores
- ⏸️ Pause and game over screens
- 📱 Responsive design for desktop and mobile
- 🔊 Sound and visual effects

## Quick Start

### Development Mode

```bash
cd /home/styx/projects/games/tetris
npm run dev
```

Access the game at: http://localhost:5173

### Production Mode (Service)

```bash
cd /home/styx/projects/games/tetris
./start-tetris.sh
```

Access the game at: http://0.0.0.0:18181

### Systemd User Service (Ubuntu, no root needed)

```bash
sudo loginctl enable-linger styx
mkdir -p ~/.config/systemd/user
cp tetris.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now tetris
systemctl --user status tetris
```

That's it: Tetris starts once per boot and stays running, bound only to port 18181 / 0.0.0.0:18181 for "Tetris" only, no other service is touched.

## Game Controls

### Keyboard
- Arrow keys or WASD: Move left/right
- Down arrow or S: Soft drop
- Up arrow or W/X: Rotate
- Space or A: Hard drop
- C or Z or Shift: Hold piece
- P or ESC: Pause

### Mobile/Touch
Use the on-screen controls overlay that appears when you click "Show Controls".

## Technical Details

- **Framework**: React 19 + TypeScript
- **Build**: Vite with ES modules
- **Styling**: Custom CSS with dark theme
- **Game Logic**: Pure JavaScript/TS with requestAnimationFrame
- **State Management**: useState + useReducer pattern

## Project Structure

```
/games/tetris/
├── src/
│   ├── App.tsx           # Main game component
│   ├── game.ts           # Core game logic
│   ├── keyboard.ts       # Keyboard handling
│   ├── ControlsOverlay.tsx # Mobile controls
│   ├── styles.css        # Dark theme styles
│   └── types.ts          # TypeScript types
├── public/               # Static assets
├── tetris.service        # Systemd service file
├── start-tetris.sh       # Service startup script
├── run-tetris.sh         # Development runner
├── package.json
└── README.md
```

## Accessibility

- Keyboard navigation fully supported
- Screen reader compatible (ARIA labels)
- High contrast theme
- Resize-friendly for all screen sizes

## Customization

### Change Theme Colors
Edit `src/styles.css` and modify the CSS variables under `:root`:

```css
:root {
  --bg: #your-bg-color;
  --board-bg: #your-board-bg;
  --accent: #your-accent-color;
}
```

### Adjust Cell Size
Modify `--cell-size` in `src/styles.css`:

```css
:root {
  --cell-size: clamp(16px, 4. fille, 32px);
}
```

## Troubleshooting

### Game Doesn't Load
```bash
# Clear cache and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Access Denied
Make sure the service has proper permissions:
```bash
chmod +x run-tetris.sh
chmod 755 start-tetris.sh
```

### Port Already in Use
Change the port in the service files from `18181` to another available port.

## License

MIT

## Credits

- Tetris game concept by Alexey Pajitnov
- This implementation is inspired by classic Tetris mechanics
- Dark theme and UI design custom-made for this project