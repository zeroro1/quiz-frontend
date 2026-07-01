# Knowledge Quiz Game - WeChat Mini Game

Canvas-based WeChat mini-game for knowledge quiz competitions.

## Features
- WeChat login
- 10 questions (5 commonsense + 5 logic)
- 15s countdown per question
- Leaderboard (commonsense / logic categories)
- Personal answer history

## Tech Stack
- WeChat Mini Game Canvas API
- ES6+ JavaScript
- Backend: Spring Boot + MyBatis-Plus + MySQL

## Dev
1. Open this project with WeChat DevTools
2. Ensure backend runs at http://localhost:8080
3. Build and run

## Directory
src/
  scenes/         # Game scenes
  utils/          # Utilities (Network, Storage, Constants)
  GameEngine.js   # Game engine (scene mgmt / render loop)
  assets/         # Static resources
game.js           # Entry point
app.js            # App entry
project.config.json
game.json