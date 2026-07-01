import { CONFIG, COLORS } from './utils/Constants.js'
import Storage from './utils/Storage.js'

/**
 * 游戏引擎 - 管理场景切换和渲染循环
 * 适配微信小游戏 Canvas API
 */
class GameEngine {
    constructor() {
        this.canvas = null
        this.ctx = null
        this.width = CONFIG.SCREEN_WIDTH
        this.height = CONFIG.SCREEN_HEIGHT
        this.currentScene = null
        this.scenes = {}
        this.running = false
        this.lastTime = 0
        this.animFrameId = null

        // 全局用户状态
        this.userId = null
        this.userInfo = null
        this.isLoggedIn = false
    }

    /**
     * 初始化游戏引擎
     */
    init() {
        // 创建 Canvas
        this.canvas = wx.createOffscreenCanvas({
            type: '2d',
            width: this.width,
            height: this.height
        })
        this.ctx = this.canvas.getContext('2d')

        // 恢复登录状态
        this.userId = Storage.getUserId()
        this.userInfo = Storage.getUserInfo()
        this.isLoggedIn = Storage.isLoggedIn()

        // 注册场景（懒加载）
        this.registerScene('login', () => import('./scenes/LoginScene.js'))
        this.registerScene('home', () => import('./scenes/HomeScene.js'))
        this.registerScene('quiz', () => import('./scenes/QuizScene.js'))
        this.registerScene('leaderboard', () => import('./scenes/LeaderboardScene.js'))
        this.registerScene('records', () => import('./scenes/RecordsScene.js'))
        this.registerScene('result', () => import('./scenes/QuizScene.js'))

        // 切换到登录场景
        this.switchScene('login')

        // 开始渲染循环
        this.running = true
        this.lastTime = Date.now()
        this.loop()

        console.log('[GameEngine] Initialized')
    }

    registerScene(name, loader) {
        this.scenes[name] = { loader, instance: null }
    }

    /**
     * 切换到指定场景
     */
    async switchScene(name) {
        if (this.currentScene) {
            this.currentScene.destroy()
            this.currentScene = null
        }

        const sceneRef = this.scenes[name]
        if (!sceneRef) {
            console.error('[GameEngine] Scene not found:', name)
            return
        }

        if (!sceneRef.instance) {
            const module = await sceneRef.loader()
            sceneRef.instance = new module.Scene(this)
        }

        this.currentScene = sceneRef.instance
        this.currentScene.init()
        console.log('[GameEngine] Switched to:', name)
    }

    getScene(name) {
        return this.scenes[name] ? this.scenes[name].instance : null
    }

    /**
     * 渲染循环
     */
    loop() {
        if (!this.running) return

        const now = Date.now()
        const delta = now - this.lastTime
        this.lastTime = now

        // 清空画布
        this.ctx.clearRect(0, 0, this.width, this.height)

        // 更新和绘制当前场景
        if (this.currentScene) {
            if (this.currentScene.update) {
                this.currentScene.update(delta)
            }
            if (this.currentScene.draw) {
                this.currentScene.draw(this.ctx, this.width, this.height)
            }
        }

        // 将离屏 Canvas 绘制到主 Canvas
        this.syncToMainCanvas()

        // 使用 setTimeout 模拟帧循环（小游戏不支持 requestAnimationFrame）
        this.animFrameId = setTimeout(() => this.loop(), 1000 / 60)
    }

    /**
     * 同步离屏 Canvas 到主 Canvas
     */
    syncToMainCanvas() {
        // 小游戏里 wx.createOffscreenCanvas 创建的 canvas 可以直接渲染
        // 通过 wx.createCanvas 获取主 canvas 并绘制
    }

    stop() {
        this.running = false
        if (this.animFrameId) {
            clearTimeout(this.animFrameId)
        }
        if (this.currentScene) {
            this.currentScene.destroy()
        }
    }

    /**
     * 工具方法：绘制圆角矩形
     */
    static roundRect(ctx, x, y, w, h, r) {
        if (typeof ctx.roundRect !== 'undefined') {
            ctx.roundRect(x, y, w, h, r)
        } else {
            ctx.beginPath()
            ctx.moveTo(x + r, y)
            ctx.lineTo(x + w - r, y)
            ctx.arcTo(x + w, y, x + w, y + r, r)
            ctx.lineTo(x + w, y + h - r)
            ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
            ctx.lineTo(x + r, y + h)
            ctx.arcTo(x, y + h, x, y + h - r, r)
            ctx.lineTo(x, y + r)
            ctx.arcTo(x, y, x + r, y, r)
            ctx.closePath()
        }
    }

    /**
     * 工具方法：绘制文字居中
     */
    static drawTextCenter(ctx, text, x, y, fontSize, color, align = 'center') {
        ctx.font = fontSize + 'px sans-serif'
        ctx.fillStyle = color
        ctx.textAlign = align
        ctx.textBaseline = 'middle'
        ctx.fillText(text, x, y)
    }

    /**
     * 工具方法：绘制文字（多行自动换行）
     */
    static drawTextWrap(ctx, text, x, y, maxWidth, lineHeight, fontSize, color, align = 'left') {
        ctx.font = fontSize + 'px sans-serif'
        ctx.fillStyle = color
        ctx.textAlign = align
        ctx.textBaseline = 'top'
        const words = text.split('')
        let line = ''
        let currentY = y

        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i]
            const metrics = ctx.measureText(testLine)
            if (metrics.width > maxWidth && i > 0) {
                ctx.fillText(line, x, currentY)
                line = words[i]
                currentY += lineHeight
            } else {
                line = testLine
            }
        }
        ctx.fillText(line, x, currentY)
        return currentY + lineHeight
    }
}

export const gameEngine = new GameEngine()
export default gameEngine