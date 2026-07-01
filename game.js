// 微信小游戏全局入口
import { gameEngine } from './src/GameEngine.js'

// 全局挂载
globalThis.gameEngine = gameEngine

// 小游戏启动
Game onLoad(function() {
    console.log('[Game] Mini Game Loaded')
})

Game onReady(function() {
    console.log('[Game] Ready, initializing engine...')
    gameEngine.init()
})