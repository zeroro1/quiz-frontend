import { COLORS, CONFIG, SCENES, QUESTION_TYPES, OPTION_LABELS } from '../utils/Constants.js'
import Network from '../utils/Network.js'
import Storage from '../utils/Storage.js'
import { gameEngine } from '../GameEngine.js'

/**
 * 答题场景
 */
export class Scene {
    constructor(engine) {
        this.engine = engine
        this.questions = []
        this.currentIndex = 0
        this.answers = []
        this.timesTaken = []
        this.timeLeft = CONFIG.TIME_PER_QUESTION
        this.timer = null
        this.loading = true
        this.showResult = false
        this.result = null
        this.touchX = 0
        this.touchY = 0
        this.optionBounds = []
        this.navBounds = { prev: null, next: null, restart: null, home: null }
        this.progressWidth = 0
        this.pulsePhase = 0
    }

    init() {
        this.loading = true
        this.showResult = false
        this.touchX = 0
        this.touchY = 0
        this.startTime = Date.now()

        // 重置触摸事件
        wx.offTouchStart()
        wx.onTouchStart((e) => {
            if (e.touches.length > 0) {
                this.touchX = e.touches[0].x
                this.touchY = e.touches[0].y
                this.handleTap(this.touchX, this.touchY)
            }
        })

        this.startNewQuiz()
    }

    startNewQuiz() {
        this.loading = true
        this.showResult = false

        if (!this.engine.userId) {
            wx.showToast({ title: '请先登录', icon: 'none' })
            this.engine.switchScene(SCENES.LOGIN)
            return
        }

        Network.startQuiz(this.engine.userId).then(data => {
            this.questions = data.questions
            this.currentIndex = 0
            this.answers = new Array(data.questions.length).fill('')
            this.timesTaken = new Array(data.questions.length).fill(0)
            this.sessionId = data.sessionId
            this.loading = false
            this.startTimer()
            this.calculateHitAreas()
        }).catch(err => {
            console.error('[QuizScene] Failed to load questions:', err)
            this.loading = false
            wx.showToast({ title: '加载失败', icon: 'none' })
            this.engine.switchScene(SCENES.HOME)
        })
    }

    startTimer() {
        if (this.timer) clearInterval(this.timer)
        this.timeLeft = CONFIG.TIME_PER_QUESTION
        this.pulsePhase = 0

        this.timer = setInterval(() => {
            this.timeLeft--
            this.pulsePhase += 0.1
            if (this.timeLeft <= 0) {
                clearInterval(this.timer)
                this.timer = null
                if (this.currentIndex < this.questions.length - 1) {
                    this.nextQuestion()
                } else {
                    this.submitQuiz()
                }
            }
        }, 1000)
    }

    calculateHitAreas() {
        const w = CONFIG.SCREEN_WIDTH
        const h = CONFIG.SCREEN_HEIGHT
        const topBarH = 80
        const questionCardY = topBarH + 20
        const optionsStartY = questionCardY + 160
        const optionH = 80
        const navY = optionsStartY + optionH * 4 + 40

        this.optionBounds = OPTION_LABELS.map((label, i) => ({
            label,
            x: 30,
            y: optionsStartY + i * (optionH + 16),
            w: w - 60,
            h: optionH
        }))

        this.navBounds.prev = { x: 30, y: navY, w: (w - 80) / 2, h: 60 }
        this.navBounds.next = { x: 30 + (w - 80) / 2 + 20, y: navY, w: (w - 80) / 2, h: 60 }
    }

    handleTap(tx, ty) {
        if (this.loading || this.showResult) return

        // 选项点击
        for (const opt of this.optionBounds) {
            if (tx >= opt.x && tx <= opt.x + opt.w && ty >= opt.y && ty <= opt.y + opt.h) {
                this.answers[this.currentIndex] = opt.label
                return
            }
        }

        // 导航按钮
        const nb = this.navBounds
        if (tx >= nb.prev.x && tx <= nb.prev.x + nb.prev.w && ty >= nb.prev.y && ty <= nb.prev.y + nb.prev.h) {
            this.prevQuestion()
        }
        if (tx >= nb.next.x && tx <= nb.next.x + nb.next.w && ty >= nb.next.y && ty <= nb.next.y + nb.next.h) {
            this.nextQuestion()
        }

        // 结果页按钮
        if (this.showResult && this.result) {
            const rH = CONFIG.SCREEN_HEIGHT
            if (ty > rH * 0.75) {
                if (ty < rH * 0.75 + 70) {
                    this.startNewQuiz()
                } else {
                    this.engine.switchScene(SCENES.HOME)
                }
            }
        }
    }

    prevQuestion() {
        if (this.currentIndex > 0 && this.timer) {
            this.timesTaken[this.currentIndex] = CONFIG.TIME_PER_QUESTION - this.timeLeft
            this.currentIndex--
            this.startTimer()
        }
    }

    nextQuestion() {
        if (this.currentIndex < this.questions.length - 1 && this.timer) {
            this.timesTaken[this.currentIndex] = CONFIG.TIME_PER_QUESTION - this.timeLeft
            this.currentIndex++
            this.startTimer()
        }
    }

    submitQuiz() {
        if (this.timer) { clearInterval(this.timer); this.timer = null }
        this.timesTaken[this.currentIndex] = CONFIG.TIME_PER_QUESTION - this.timeLeft

        Network.submitAnswers({
            sessionId: this.sessionId,
            userId: this.engine.userId,
            answers: this.questions.map((q, i) => ({
                questionIndex: i,
                answer: this.answers[i] || '',
                timeTaken: this.timesTaken[i] || CONFIG.TIME_PER_QUESTION
            }))
        }).then(res => {
            this.result = res
            this.showResult = true
            this.calculateHitAreas()
        }).catch(err => {
            console.error('[QuizScene] Submit failed:', err)
            wx.showToast({ title: '提交失败', icon: 'none' })
        })
    }

    update(delta) {
        // 计时器脉冲动画
        if (this.timeLeft <= 5 && this.timeLeft > 0) {
            this.pulsePhase += delta * 0.01
        }
    }

    draw(ctx, w, h) {
        // 背景
        ctx.fillStyle = '#F5F5F5'
        ctx.fillRect(0, 0, w, h)

        if (this.loading) {
            this.drawLoading(ctx, w, h)
            return
        }

        if (this.showResult && this.result) {
            this.drawResult(ctx, w, h)
            return
        }

        this.drawQuiz(ctx, w, h)
    }

    drawLoading(ctx, w, h) {
        ctx.fillStyle = '#F5F5F5'
        ctx.fillRect(0, 0, w, h)
        this.drawTextCenter(ctx, 'AI 正在出题...', w / 2, h / 2, 32, '#999999')
    }

    drawQuiz(ctx, w, h) {
        const q = this.questions[this.currentIndex]
        if (!q) return

        // 顶部进度条
        this.drawProgressBar(ctx, w)

        // 题目卡片
        const tagText = q.type === QUESTION_TYPES.COMMONSENSE ? '\uD83D\uDCDA 常识' : '\uD83E\uDDEA 逻辑'
        const tagColor = q.type === QUESTION_TYPES.COMMONSENSE ? '#4CAF50' : '#2196F3'
        const tagBg = q.type === QUESTION_TYPES.COMMONSENSE ? '#E8F5E9' : '#E3F2FD'

        // 标签
        ctx.font = '22px sans-serif'
        ctx.fillStyle = tagColor
        const tagW = ctx.measureText(tagText).width + 32
        const tagX = 30 + ((w - 60) - tagW) / 2
        GameEngineUtils.roundRect(ctx, tagX, 110, tagW, 36, 18)
        ctx.fill()
        this.drawTextCenter(ctx, tagText, tagX + tagW / 2, 128, 20, tagColor)

        // 题目内容
        const qY = 170
        ctx.font = 'bold 32px sans-serif'
        ctx.fillStyle = COLORS.TEXT
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillText(q.content, 30, qY, w - 60)

        // 选项
        this.drawOptions(ctx, w, h)
    }

    drawProgressBar(ctx, w) {
        // 进度信息
        ctx.font = '26px sans-serif'
        ctx.fillStyle = '#666666'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillText('第 ' + (this.currentIndex + 1) + ' / ' + this.questions.length + ' 题', 30, 20)

        // 倒计时
        const timerColor = this.timeLeft <= 5 ? COLORS.WARNING : COLORS.PRIMARY
        const pulse = this.timeLeft <= 5 ? (Math.sin(this.pulsePhase) * 0.3 + 0.7) : 1
        ctx.globalAlpha = pulse
        ctx.textAlign = 'right'
        ctx.font = 'bold 32px sans-serif'
        ctx.fillStyle = timerColor
        ctx.fillText('\u23F2 ' + this.timeLeft + 's', w - 30, 20)
        ctx.globalAlpha = 1

        // 进度条轨道
        const trackY = 65
        const trackH = 8
        const trackW = w - 60
        const trackX = 30
        GameEngineUtils.roundRect(ctx, trackX, trackY, trackW, trackH, 4)
        ctx.fillStyle = '#EEEEEE'
        ctx.fill()

        // 进度条填充
        const fillW = (this.currentIndex + 1) / this.questions.length * trackW
        GameEngineUtils.roundRect(ctx, trackX, trackY, fillW, trackH, 4)
        const grad = ctx.createLinearGradient(trackX, 0, trackX + fillW, 0)
        grad.addColorStop(0, COLORS.PRIMARY)
        grad.addColorStop(1, '#66BB6A')
        ctx.fillStyle = grad
        ctx.fill()
    }

    drawOptions(ctx, w, h) {
        const q = this.questions[this.currentIndex]
        const startY = 240
        const optionH = 80
        const gap = 16

        OPTION_LABELS.forEach((label, i) => {
            const y = startY + i * (optionH + gap)
            const isSelected = this.answers[this.currentIndex] === label
            const optText = q['option' + label] || ''

            // 选项背景
            GameEngineUtils.roundRect(ctx, 30, y, w - 60, optionH, 12)
            ctx.fillStyle = isSelected ? '#E8F5E9' : '#FFFFFF'
            ctx.fill()
            ctx.strokeStyle = isSelected ? COLORS.PRIMARY : '#E0E0E0'
            ctx.lineWidth = isSelected ? 3 : 2
            ctx.stroke()

            // 选项标记
            ctx.font = 'bold 28px sans-serif'
            ctx.fillStyle = COLORS.PRIMARY
            ctx.textAlign = 'left'
            ctx.textBaseline = 'middle'
            ctx.fillText(label + '.', 50, y + optionH / 2)

            // 选项内容
            ctx.font = '28px sans-serif'
            ctx.fillStyle = COLORS.TEXT
            ctx.fillText(optText, 110, y + optionH / 2, w - 140)
        })

        // 导航按钮
        this.drawNavButtons(ctx, w, h)
    }

    drawNavButtons(ctx, w, h) {
        const btnY = h - 140
        const btnH = 60
        const gap = 20
        const btnW = (w - 60 - gap) / 2

        // 上一题
        const prevDisabled = this.currentIndex === 0
        GameEngineUtils.roundRect(ctx, 30, btnY, btnW, btnH, 12)
        ctx.fillStyle = prevDisabled ? '#F5F5F5' : '#FFFFFF'
        ctx.fill()
        ctx.strokeStyle = prevDisabled ? '#E0E0E0' : '#DDDDDD'
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.font = '28px sans-serif'
        ctx.fillStyle = prevDisabled ? '#CCCCCC' : '#666666'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('\u25C0 上一题', 30 + btnW / 2, btnY + btnH / 2)

        // 下一题
        const nextDisabled = this.currentIndex === this.questions.length - 1
        const nextX = 30 + btnW + gap
        GameEngineUtils.roundRect(ctx, nextX, btnY, btnW, btnH, 12)
        ctx.fillStyle = nextDisabled ? '#F5F5F5' : '#FFFFFF'
        ctx.fill()
        ctx.strokeStyle = nextDisabled ? '#E0E0E0' : '#DDDDDD'
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.font = '28px sans-serif'
        ctx.fillStyle = nextDisabled ? '#CCCCCC' : '#666666'
        ctx.fillText('下一题 \u25B6', nextX + btnW / 2, btnY + btnH / 2)
    }

    drawResult(ctx, w, h) {
        const r = this.result

        // 分数圆环
        const cx = w / 2
        const cy = h * 0.22
        const radius = 100

        // 外圈
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.strokeStyle = '#EEEEEE'
        ctx.lineWidth = 12
        ctx.stroke()

        // 内圈（进度）
        ctx.beginPath()
        ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + (r.accuracy / 100) * Math.PI * 2)
        ctx.strokeStyle = COLORS.PRIMARY
        ctx.lineWidth = 12
        ctx.lineCap = 'round'
        ctx.stroke()

        // 分数文字
        this.drawTextCenter(ctx, r.correctCount + '/' + r.totalQuestions, cx, cy - 15, 48, COLORS.PRIMARY)
        this.drawTextCenter(ctx, '正确率 ' + r.accuracy.toFixed(1) + '%', cx, cy + 30, 22, '#999999')

        // 统计
        const statsY = h * 0.38
        this.drawStatRow(ctx, w, statsY, '\u23F1 总用时', r.totalTime + ' 秒')

        // 详情
        const detailStartY = statsY + 60
        r.details.forEach((item, idx) => {
            const y = detailStartY + idx * 140
            if (y + 140 > h - 200) return // 超出屏幕不绘制

            const isCorrect = item.isCorrect
            GameEngineUtils.roundRect(ctx, 20, y, w - 40, 120, 12)
            ctx.fillStyle = '#FFFFFF'
            ctx.fill()
            ctx.strokeStyle = isCorrect ? COLORS.SUCCESS : COLORS.WARNING
            ctx.lineWidth = 2
            ctx.stroke()

            // 状态
            ctx.font = 'bold 24px sans-serif'
            ctx.fillStyle = isCorrect ? COLORS.SUCCESS : COLORS.WARNING
            ctx.textAlign = 'left'
            ctx.textBaseline = 'top'
            ctx.fillText((isCorrect ? '\u2705 ' : '\u274C ') + '第' + (item.questionIndex + 1) + '题', 35, y + 10)

            // 题目
            ctx.font = '24px sans-serif'
            ctx.fillStyle = COLORS.TEXT
            ctx.fillText(item.content.substring(0, 40) + (item.content.length > 40 ? '...' : ''), 35, y + 42, w - 70)

            // 答案
            ctx.font = '20px sans-serif'
            ctx.fillStyle = '#999999'
            ctx.fillText('你的: ' + (item.userAnswer || '未答') + ' | 正确: ' + item.correctAnswer + ' | ' + item.timeTaken + 's', 35, y + 78, w - 70)
        })

        // 再来一局按钮
        const btnY = h - 200
        GameEngineUtils.roundRect(ctx, 60, btnY, w - 120, 65, 12)
        const grad = ctx.createLinearGradient(60, btnY, w - 60, btnY)
        grad.addColorStop(0, COLORS.PRIMARY)
        grad.addColorStop(1, '#66BB6A')
        ctx.fillStyle = grad
        ctx.fill()
        this.drawTextCenter(ctx, '\uD83D\uDD01 再来一局', w / 2, btnY + 33, 30, '#FFFFFF')

        // 返回首页按钮
        GameEngineUtils.roundRect(ctx, 60, btnY + 80, w - 120, 65, 12)
        ctx.fillStyle = '#FFFFFF'
        ctx.fill()
        ctx.strokeStyle = '#DDDDDD'
        ctx.lineWidth = 2
        ctx.stroke()
        this.drawTextCenter(ctx, '\uD83C\uDFE0 返回首页', w / 2, btnY + 80 + 33, 28, '#666666')
    }

    drawStatRow(ctx, w, y, label, value) {
        GameEngineUtils.roundRect(ctx, 30, y, w - 60, 50, 12)
        ctx.fillStyle = '#FFFFFF'
        ctx.fill()

        ctx.font = '26px sans-serif'
        ctx.fillStyle = '#666666'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillText(label, 50, y + 25)

        ctx.font = 'bold 26px sans-serif'
        ctx.fillStyle = COLORS.TEXT
        ctx.textAlign = 'right'
        ctx.fillText(value, w - 50, y + 25)
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
        if (this.timer) { clearInterval(this.timer); this.timer = null }
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