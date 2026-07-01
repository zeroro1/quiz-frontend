import { COLORS, CONFIG, SCENES } from '../utils/Constants.js'
import Storage from '../utils/Storage.js'
import { gameEngine } from '../GameEngine.js'

/**
 * 主页场景 - 功能入口
 */
export class Scene {
    constructor(engine) {
        this.engine = engine
        this.touchX = 0
        this.touchY = 0
        this.buttons = []
        this.bouncePhase = 0
    }

    init() {
        this.touchX = 0
        this.touchY = 0
        this.bouncePhase = 0
        this.buildButtons()

        wx.onTouchStart((e) => {
            if (e.touches.length > 0) {
                this.touchX = e.touches[0].x
                this.touchY = e.touches[0].y
                this.handleTap(this.touchX, this.touchY)
            }
        })
    }

    buildButtons() {
        const w = CONFIG.SCREEN_WIDTH
        const h = CONFIG.SCREEN_HEIGHT
        const startY = h * 0.35
        const gap = 100
        const btnW = 500
        const btnH = 90

        this.buttons = [
            { id: 'start', label: '开始答题', icon: '\uD83C\uDFAF', desc: '10道题 · 每题15秒', y: startY, w: btnW, h: btnH },
            { id: 'commonsense', label: '常识问答', icon: '\uD83D\uDCDA', desc: '生活常识 · 历史地理', y: startY + gap, w: btnW, h: btnH },
            { id: 'logic', label: '逻辑推理', icon: '\uD83E\uDDEA', desc: '找规律 · 智力测试', y: startY + gap * 2, w: btnW, h: btnH },
            { id: 'leaderboard', label: '排行榜', icon: '\uD83C\uDFC6', desc: '看看谁是第一名', y: startY + gap * 3, w: btnW, h: btnH },
            { id: 'records', label: '我的记录', icon: '\uD83D\uDCCB', desc: '查看历史答题记录', y: startY + gap * 4, w: btnW, h: btnH }
        ]
    }

    handleTap(tx, ty) {
        for (const btn of this.buttons) {
            if (tx >= btn.x && tx <= btn.x + btn.w && ty >= btn.y && ty <= btn.y + btn.h) {
                if (btn.id === 'start' || btn.id === 'commonsense' || btn.id === 'logic') {
                    this.engine.switchScene(SCENES.QUIZ)
                } else if (btn.id === 'leaderboard') {
                    this.engine.switchScene(SCENES.LEADERBOARD)
                } else if (btn.id === 'records') {
                    this.engine.switchScene(SCENES.RECORDS)
                }
                return
            }
        }
    }

    update(delta) {
        this.bouncePhase += delta * 0.002
    }

    draw(ctx, w, h) {
        // 背景
        const grad = ctx.createLinearGradient(0, 0, 0, h)
        grad.addColorStop(0, COLORS.BACKGROUND)
        grad.addColorStop(1, COLORS.BACKGROUND_END)
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)

        // 用户信息
        this.drawUserInfo(ctx, w, h)

        // 按钮
        const startY = h * 0.35
        const gap = 100
        const btnW = 500
        const btnH = 90

        this.buttons.forEach((btn, i) => {
            btn.x = (w - btnW) / 2
            btn.y = startY + gap * i
            this.drawButton(ctx, btn, i === 0)
        })

        // 底部提示
        this.drawTextCenter(ctx, '每次答题包含 5道常识 + 5道逻辑推理', w / 2, h * 0.92, 22, 'rgba(255,255,255,0.5)')
    }

    drawUserInfo(ctx, w, h) {
        const avatarR = 50
        const avatarY = h * 0.22 + Math.sin(this.bouncePhase) * 5

        // 头像
        ctx.save()
        ctx.beginPath()
        ctx.arc(w / 2, avatarY, avatarR, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        ctx.fill()
        ctx.restore()

        this.drawTextCenter(ctx, '\uD83D\uDC64', w / 2, avatarY, 50, '#FFFFFF')

        // 昵称
        const name = this.engine.userInfo?.nickname || '用户'
        this.drawTextCenter(ctx, name, w / 2, avatarY + 70, 32, '#FFFFFF')
    }

    drawButton(ctx, btn, isFirst) {
        const b = btn
        const hover = this.isHovering(b)

        ctx.save()
        GameEngineUtils.roundRect(ctx, b.x, b.y, b.w, b.h, 20)
        ctx.fillStyle = hover ? '#F0FFF0' : '#FFFFFF'
        ctx.fill()
        ctx.restore()

        ctx.save()
        GameEngineUtils.roundRect(ctx, b.x, b.y, b.w, b.h, 20)
        ctx.strokeStyle = isFirst ? COLORS.PRIMARY : 'rgba(0,0,0,0.06)'
        ctx.lineWidth = isFirst ? 3 : 1
        ctx.stroke()
        ctx.restore()

        // 图标
        this.drawTextCenter(ctx, b.icon, b.x + 50, b.y + b.h / 2, 40, COLORS.TEXT)

        // 标签
        ctx.font = 'bold 28px sans-serif'
        ctx.fillStyle = COLORS.TEXT
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillText(b.label, b.x + 100, b.y + b.h / 2 - 12)

        // 描述
        ctx.font = '22px sans-serif'
        ctx.fillStyle = COLORS.TEXT_LIGHT
        ctx.fillText(b.desc, b.x + 100, b.y + b.h / 2 + 18)
    }

    isHovering(btn) {
        return this.touchX >= btn.x && this.touchX <= btn.x + btn.w && this.touchY >= btn.y && this.touchY <= btn.y + btn.h
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