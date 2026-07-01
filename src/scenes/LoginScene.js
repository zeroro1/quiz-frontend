import { COLORS, CONFIG, SCENES } from '../utils/Constants.js'
import Network from '../utils/Network.js'
import Storage from '../utils/Storage.js'
import { gameEngine } from '../GameEngine.js'

/**
 * 登录场景
 */
export class Scene {
    constructor(engine) {
        this.engine = engine
        this.ctx = null
        this.loading = false
        this.touchX = 0
        this.touchY = 0
        this.buttonBounds = null // 登录按钮区域
        this.bouncePhase = 0
    }

    init() {
        this.loading = false
        this.touchX = 0
        this.touchY = 0

        // 如果已登录，直接跳到主页
        if (this.engine.isLoggedIn) {
            this.engine.switchScene(SCENES.HOME)
            return
        }

        // 绑定触摸事件
        wx.onTouchStart((e) => {
            if (e.touches.length > 0) {
                this.touchX = e.touches[0].x
                this.touchY = e.touches[0].y
                this.checkButtonTap(this.touchX, this.touchY)
            }
        })

        // 计算登录按钮位置
        this.calculateButtonBounds()
    }

    calculateButtonBounds() {
        // 登录按钮: 居中, 宽度 300, 高度 80
        const btnW = 300
        const btnH = 80
        const btnX = (CONFIG.SCREEN_WIDTH - btnW) / 2
        const btnY = CONFIG.SCREEN_HEIGHT * 0.65
        this.buttonBounds = { x: btnX, y: btnY, w: btnW, h: btnH }
    }

    checkButtonTap(tx, ty) {
        if (this.loading) return
        const b = this.buttonBounds
        if (tx >= b.x && tx <= b.x + b.w && ty >= b.y && ty <= b.y + b.h) {
            this.doLogin()
        }
    }

    doLogin() {
        this.loading = true
        Network.login().then(data => {
            this.engine.userId = data.userId
            this.engine.userInfo = { nickname: data.nickname || '用户', avatar: data.avatar || '' }
            this.engine.isLoggedIn = true
            Storage.setUserId(data.userId)
            Storage.setUserInfo(this.engine.userInfo)
            Storage.setLoggedIn(true)
            this.engine.switchScene(SCENES.HOME)
        }).catch(err => {
            console.error('[LoginScene] Login failed:', err)
            this.loading = false
            wx.showToast({ title: '登录失败', icon: 'none' })
        })
    }

    update(delta) {
        this.bouncePhase += delta * 0.003
    }

    draw(ctx, w, h) {
        this.ctx = ctx

        // 背景渐变
        const grad = ctx.createLinearGradient(0, 0, 0, h)
        grad.addColorStop(0, COLORS.BACKGROUND)
        grad.addColorStop(1, COLORS.BACKGROUND_END)
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)

        // 装饰性浮动圆形
        this.drawDecorativeCircles(ctx, w, h)

        // Logo 图标
        const logoY = h * 0.28 + Math.sin(this.bouncePhase) * 8
        this.drawTextCenter(ctx, '\uD83C\uDFAF', w / 2, logoY, 120, '#FFFFFF')

        // 标题
        this.drawTextCenter(ctx, '知识问答竞赛', w / 2, logoY + 100, 52, '#FFFFFF')

        // 副标题
        this.drawTextCenter(ctx, '常识 + 逻辑推理 · 挑战你的智慧极限', w / 2, logoY + 160, 26, 'rgba(255,255,255,0.7)')

        // 登录按钮
        if (this.buttonBounds) {
            const b = this.buttonBounds
            const hover = this.isHoveringButton()

            ctx.save()
            GameEngineUtils.roundRect(ctx, b.x, b.y, b.w, b.h, 40)
            ctx.fillStyle = hover ? '#FFFFFF' : '#FFFFFF'
            ctx.fill()
            ctx.restore()

            ctx.save()
            GameEngineUtils.roundRect(ctx, b.x, b.y, b.w, b.h, 40)
            ctx.strokeStyle = COLORS.PRIMARY
            ctx.lineWidth = 3
            ctx.stroke()
            ctx.restore()

            this.drawTextCenter(ctx, this.loading ? '登录中...' : '微信一键登录', b.x + b.w / 2, b.y + b.h / 2, 30, hover ? COLORS.PRIMARY : COLORS.PRIMARY)
        }
    }

    isHoveringButton() {
        if (!this.buttonBounds) return false
        // 小游戏触摸检测在 onTouchStart 里处理，这里用最后记录的位置
        const b = this.buttonBounds
        return this.touchX >= b.x && this.touchX <= b.x + b.w && this.touchY >= b.y && this.touchY <= b.y + b.h
    }

    drawDecorativeCircles(ctx, w, h) {
        ctx.globalAlpha = 0.08
        const circles = [
            { x: w * 0.1, y: h * 0.15, r: 80 },
            { x: w * 0.9, y: h * 0.3, r: 60 },
            { x: w * 0.15, y: h * 0.8, r: 100 },
            { x: w * 0.85, y: h * 0.75, r: 70 },
            { x: w * 0.5, y: h * 0.1, r: 50 }
        ]
        circles.forEach(c => {
            ctx.beginPath()
            ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2)
            ctx.fillStyle = '#FFFFFF'
            ctx.fill()
        })
        ctx.globalAlpha = 1
    }

    drawTextCenter(ctx, text, x, y, size, color) {
        ctx.font = size + 'px sans-serif'
        ctx.fillStyle = color
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(text, x, y)
    }

    destroy() {
        wx.offTouchStart()
    }
}

// 工具方法
class GameEngineUtils {
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
}