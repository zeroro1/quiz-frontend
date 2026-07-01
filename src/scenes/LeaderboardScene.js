import { COLORS, CONFIG, SCENES } from '../utils/Constants.js'
import Network from '../utils/Network.js'
import { gameEngine } from '../GameEngine.js'

/**
 * 排行榜场景
 */
export class Scene {
    constructor(engine) {
        this.engine = engine
        this.activeTab = 'COMMONSENSE'
        this.leaderboard = []
        this.loading = true
        this.touchX = 0
        this.touchY = 0
        this.tabs = [
            { key: 'COMMONSENSE', label: '\uD83D\uDCDA 常识' },
            { key: 'LOGIC', label: '\uD83E\uDDEA 逻辑' }
        ]
    }

    init() {
        this.loading = true
        this.touchX = 0
        this.touchY = 0
        this.loadLeaderboard()

        wx.offTouchStart()
        wx.onTouchStart((e) => {
            if (e.touches.length > 0) {
                this.touchX = e.touches[0].x
                this.touchY = e.touches[0].y
                this.handleTap(this.touchX, this.touchY)
            }
        })
    }

    loadLeaderboard() {
        Network.getLeaderboard(this.activeTab).then(data => {
            this.leaderboard = data
            this.loading = false
        }).catch(err => {
            console.error('[LeaderboardScene] Load failed:', err)
            this.loading = false
            wx.showToast({ title: '加载失败', icon: 'none' })
        })
    }

    handleTap(tx, ty) {
        // Tab 点击
        const tabW = (CONFIG.SCREEN_WIDTH - 60) / 2
        const tabH = 50
        const tabY = 100

        this.tabs.forEach((tab, i) => {
            const tabX = 30 + i * (tabW + 16)
            if (tx >= tabX && tx <= tabX + tabW && ty >= tabY && ty <= tabY + tabH) {
                this.activeTab = tab.key
                this.loadLeaderboard()
            }
        })
    }

    draw(ctx, w, h) {
        ctx.fillStyle = '#F5F5F5'
        ctx.fillRect(0, 0, w, h)

        // 标题
        this.drawTextCenter(ctx, '\uD83C\uDFC6 排行榜', w / 2, 40, 40, COLORS.TEXT)

        // Tabs
        this.drawTabs(ctx, w)

        if (this.loading) {
            this.drawTextCenter(ctx, '加载中...', w / 2, h / 2, 28, '#CCCCCC')
            return
        }

        if (this.leaderboard.length === 0) {
            this.drawTextCenter(ctx, '\uD83E\uDD14 暂无数据，快来答题吧！', w / 2, h / 2, 28, '#CCCCCC')
            return
        }

        // 列表
        this.leaderboard.forEach((item, i) => {
            this.drawRankItem(ctx, w, 170 + i * 90, item, i)
        })
    }

    drawTabs(ctx, w) {
        const tabW = (w - 60 - 16) / 2
        const tabH = 50
        const tabY = 100

        this.tabs.forEach((tab, i) => {
            const tabX = 30 + i * (tabW + 16)
            const isActive = this.activeTab === tab.key

            GameEngineUtils.roundRect(ctx, tabX, tabY, tabW, tabH, 12)
            ctx.fillStyle = isActive ? COLORS.PRIMARY : '#FFFFFF'
            ctx.fill()
            ctx.strokeStyle = isActive ? COLORS.PRIMARY : '#E0E0E0'
            ctx.lineWidth = 2
            ctx.stroke()

            this.drawTextCenter(ctx, tab.label, tabX + tabW / 2, tabY + tabH / 2, 24, isActive ? '#FFFFFF' : COLORS.TEXT)
        })
    }

    drawRankItem(ctx, w, y, item, index) {
        const rank = index + 1
        const itemH = 70

        GameEngineUtils.roundRect(ctx, 30, y, w - 60, itemH, 12)
        ctx.fillStyle = '#FFFFFF'
        ctx.fill()

        // 排名徽章
        let badgeColor = '#F0F0F0'
        if (rank === 1) badgeColor = COLORS.GOLD
        else if (rank === 2) badgeColor = COLORS.SILVER
        else if (rank === 3) badgeColor = COLORS.BRONZE

        ctx.beginPath()
        ctx.arc(65, y + itemH / 2, 24, 0, Math.PI * 2)
        ctx.fillStyle = badgeColor
        ctx.fill()

        ctx.font = 'bold 22px sans-serif'
        ctx.fillStyle = rank <= 3 ? '#FFFFFF' : '#666666'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(rank.toString(), 65, y + itemH / 2)

        // 昵称
        ctx.font = 'bold 28px sans-serif'
        ctx.fillStyle = COLORS.TEXT
        ctx.textAlign = 'left'
        ctx.fillText(item.nickname || '匿名用户', 105, y + 24)

        // 统计
        ctx.font = '20px sans-serif'
        ctx.fillStyle = '#999999'
        ctx.fillText('\u2705 ' + item.accuracy + '%    \u23F1 ' + item.avgTime.toFixed(1) + 's/\u9898', 105, y + 50)
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