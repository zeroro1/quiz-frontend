import { COLORS, CONFIG, SCENES, QUESTION_TYPES } from '../utils/Constants.js'
import Network from '../utils/Network.js'
import { gameEngine } from '../GameEngine.js'

/**
 * 我的记录场景
 */
export class Scene {
    constructor(engine) {
        this.engine = engine
        this.records = []
        this.loading = true
        this.scrollY = 0
        this.maxScroll = 0
        this.touchStartY = 0
        this.touchStartX = 0
    }

    init() {
        this.loading = true
        this.scrollY = 0
        this.loadRecords()

        wx.offTouchStart()
        wx.offTouchMove()
        wx.onTouchStart((e) => {
            if (e.touches.length > 0) {
                this.touchStartX = e.touches[0].x
                this.touchStartY = e.touches[0].y
            }
        })

        wx.onTouchMove((e) => {
            if (e.touches.length > 0) {
                const dy = e.touches[0].y - this.touchStartY
                this.scrollY = Math.max(0, Math.min(this.maxScroll, this.scrollY + dy))
                this.touchStartY = e.touches[0].y
            }
        })
    }

    loadRecords() {
        if (!this.engine.userId) {
            wx.showToast({ title: '请先登录', icon: 'none' })
            this.engine.switchScene(SCENES.LOGIN)
            return
        }

        Network.getUserRecords(this.engine.userId).then(data => {
            this.records = data
            this.loading = false
            this.calculateScroll()
        }).catch(err => {
            console.error('[RecordsScene] Load failed:', err)
            this.loading = false
            wx.showToast({ title: '加载失败', icon: 'none' })
        })
    }

    calculateScroll() {
        const totalH = this.records.length * 140 + 60
        const visibleH = CONFIG.SCREEN_HEIGHT
        this.maxScroll = Math.max(0, totalH - visibleH)
    }

    draw(ctx, w, h) {
        ctx.fillStyle = '#F5F5F5'
        ctx.fillRect(0, 0, w, h)

        // 标题
        this.drawTextCenter(ctx, '\uD83D\uDCCB 我的记录', w / 2, 40, 40, COLORS.TEXT)

        if (this.loading) {
            this.drawTextCenter(ctx, '加载中...', w / 2, h / 2, 28, '#CCCCCC')
            return
        }

        if (this.records.length === 0) {
            this.drawTextCenter(ctx, '\uD83D\uDCCB 还没有答题记录哦~', w / 2, h / 2, 28, '#CCCCCC')
            return
        }

        // 记录列表（带滚动偏移）
        ctx.save()
        ctx.translate(0, -this.scrollY)

        this.records.forEach((item, idx) => {
            const y = 90 + idx * 140
            if (y + 140 > h + this.scrollY) return // 超出可视区域不绘制
            if (y < -140) return

            this.drawRecordItem(ctx, w, y, item)
        })

        ctx.restore()
    }

    drawRecordItem(ctx, w, y, item) {
        const isCorrect = item.isCorrect
        const typeLabel = item.type === QUESTION_TYPES.COMMONSENSE ? '\uD83D\uDCDA 常识' : '\uD83E\uDDEA 逻辑'

        GameEngineUtils.roundRect(ctx, 20, y, w - 40, 120, 12)
        ctx.fillStyle = '#FFFFFF'
        ctx.fill()

        // 左侧色条
        ctx.fillStyle = isCorrect ? COLORS.SUCCESS : COLORS.WARNING
        ctx.fillRect(20, y + 10, 4, 100)

        // 状态 + 类型
        ctx.font = 'bold 24px sans-serif'
        ctx.fillStyle = isCorrect ? COLORS.SUCCESS : COLORS.WARNING
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillText((isCorrect ? '\u2705 正确' : '\u274C 错误') + '     ' + typeLabel, 35, y + 12)

        // 题目
        ctx.font = '24px sans-serif'
        ctx.fillStyle = COLORS.TEXT
        ctx.fillText(item.content.substring(0, 40) + (item.content.length > 40 ? '...' : ''), 35, y + 44, w - 70)

        // 答案信息
        ctx.font = '20px sans-serif'
        ctx.fillStyle = '#999999'
        ctx.fillText('你的: ' + (item.userAnswer || '未答') + ' | 正确: ' + item.correctAnswer + ' | ' + item.timeTaken + 's', 35, y + 80, w - 70)
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
        wx.offTouchMove()
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