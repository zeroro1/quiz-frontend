// 应用全局入口
import { gameEngine } from './src/GameEngine.js'

App({
    onLaunch() {
        console.log('[App] Launch')
        this.engine = gameEngine
    },
    onShow() {
        console.log('[App] Show')
    },
    onHide() {
        console.log('[App] Hide')
    },

    /**
     * 获取游戏引擎实例
     */
    getEngine() {
        return this.engine
    }
})