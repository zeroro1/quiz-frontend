<template>
	<view class="container">
		<view class="loading" v-if="loading">
			<text>AI 正在出题...</text>
		</view>
		<view v-else-if="!showResult">
			<view class="top-bar">
				<view class="progress-info">
					<text>第 {{ currentIndex + 1 }} / {{ questions.length }} 题</text>
					<text class="timer-text" :class="{ 'timer-warning': timeLeft <= 5 }">⏱ {{ timeLeft }}s</text>
				</view>
				<view class="progress-track">
					<view class="progress-fill" :style="{ width: ((currentIndex + 1) / questions.length * 100) + '%' }"></view>
				</view>
			</view>
			<view class="card question-card">
				<view class="question-tag" :class="currentQ.type === 'COMMONSENSE' ? 'tag-commonsense' : 'tag-logic'">
					{{ currentQ.type === 'COMMONSENSE' ? '📚 常识' : '🧩 逻辑' }}
				</view>
				<text class="question-text">{{ currentQ.content }}</text>
			</view>
			<view class="options">
				<view class="option" v-for="opt in optionKeys" :key="opt"
				      @click="onAnswer(opt)"
				      :class="{ selected: answers[currentIndex] === opt }">
					<text class="option-label">{{ opt }}.</text>
					<text class="option-content">{{ getOpt(opt) }}</text>
				</view>
			</view>
			<view class="nav-buttons">
				<button class="btn-nav" @click="onPrev" :disabled="currentIndex === 0">上一题</button>
				<button class="btn-nav" @click="onNext" :disabled="currentIndex === questions.length - 1">下一题</button>
			</view>
		</view>
		<view class="result-page" v-if="showResult && result">
			<view class="score-circle">
				<text class="score-number">{{ result.accuracy.toFixed(1) }}%</text>
				<text class="score-label">正确率</text>
			</view>
			<view class="result-details card">
				<view class="detail-row"><text>总题数</text><text>{{ result.totalQuestions }}</text></view>
				<view class="detail-row"><text>正确数</text><text>{{ result.correctCount }}</text></view>
				<view class="detail-row"><text>总用时</text><text>{{ result.totalTime }}秒</text></view>
			</view>
			<view class="answer-detail" v-for="(item, idx) in result.details" :key="idx">
				<view class="detail-header" :class="item.isCorrect ? 'correct' : 'wrong'">
					<text>{{ item.isCorrect ? '✅' : '❌' }} 第{{ item.questionIndex + 1 }}题</text>
				</view>
				<text class="detail-question">{{ item.content }}</text>
				<text class="detail-answer">你的答案: {{ item.userAnswer }} | 正确答案: {{ item.correctAnswer }} | 用时: {{ item.timeTaken }}s</text>
			</view>
			<button class="btn-restart" @click="onRestart">再来一局</button>
		</view>
	</view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { startQuiz, submitAnswers } from '@/utils/api.js'

const questions = ref([])
const optionKeys = ['A', 'B', 'C', 'D']
const currentIndex = ref(0)
const answers = ref([])
const timesTaken = ref([])
const loading = ref(false)
const showResult = ref(false)
const result = ref(null)
const sessionId = ref(null)
const timeLeft = ref(15)
const timer = ref(null)

const currentQ = computed(() => questions.value[currentIndex.value] || {})

onMounted(() => { startNewQuiz() })
onUnmounted(() => { clearTimer() })

function startNewQuiz() {
	loading.value = true
	showResult.value = false
	const app = getApp()
	startQuiz(app.globalData.userId).then(data => {
		questions.value = data.questions
		sessionId.value = data.sessionId
		currentIndex.value = 0
		answers.value = new Array(data.questions.length).fill('')
		timesTaken.value = new Array(data.questions.length).fill(0)
		loading.value = false
		startTimer()
	}).catch(err => {
		uni.showToast({ title: '加载失败', icon: 'none' })
		loading.value = false
	})
}

function startTimer() {
	clearTimer()
	timeLeft.value = 15
	timer.value = setInterval(() => {
		timeLeft.value--
		if (timeLeft.value <= 0) {
			clearTimer()
			if (currentIndex.value < questions.value.length - 1) onNext()
			else submitQuiz()
		}
	}, 1000)
}

function clearTimer() {
	if (timer.value) { clearInterval(timer.value); timer.value = null }
}

function getOpt(k) { return currentQ.value['option' + k] || '' }

function onPrev() {
	if (currentIndex.value > 0) {
		timesTaken.value[currentIndex.value] = 15 - timeLeft.value
		currentIndex.value--
		startTimer()
	}
}

function onNext() {
	if (currentIndex.value < questions.value.length - 1) {
		timesTaken.value[currentIndex.value] = 15 - timeLeft.value
		currentIndex.value++
		startTimer()
	}
}

function onAnswer(a) { answers.value[currentIndex.value] = a }

function submitQuiz() {
	clearTimer()
	timesTaken.value[currentIndex.value] = 15 - timeLeft.value
	const app = getApp()
	submitAnswers({
		sessionId: sessionId.value,
		userId: app.globalData.userId,
		answers: questions.value.map((q, i) => ({
			questionIndex: i,
			answer: answers.value[i] || '',
			timeTaken: timesTaken.value[i] || 15
		}))
	}).then(res => { result.value = res; showResult.value = true })
		.catch(err => { uni.showToast({ title: '提交失败', icon: 'none' }) })
}

function onRestart() { startNewQuiz() }
</script>

<style>
.loading { text-align: center; padding: 200rpx 0; color: #999; font-size: 28rpx; }
.top-bar { padding: 20rpx 30rpx; background: #fff; border-radius: 12rpx; margin-bottom: 20rpx; }
.progress-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10rpx; }
.timer-text { font-size: 32rpx; font-weight: bold; color: #4CAF50; }
.timer-warning { color: #f44336; animation: blink 0.5s ease-in-out infinite alternate; }
@keyframes blink { from { opacity: 1; } to { opacity: 0.4; } }
.progress-track { height: 8rpx; background: #eee; border-radius: 4rpx; margin-top: 10rpx; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #4CAF50, #66BB6A); border-radius: 4rpx; transition: width 0.3s; }
.question-card { margin-bottom: 30rpx; }
.question-tag { display: inline-block; padding: 6rpx 16rpx; border-radius: 20rpx; font-size: 22rpx; margin-bottom: 16rpx; }
.tag-commonsense { background: #E8F5E9; color: #4CAF50; }
.tag-logic { background: #E3F2FD; color: #2196F3; }
.question-text { font-size: 32rpx; font-weight: bold; line-height: 1.6; }
.options { display: flex; flex-direction: column; gap: 16rpx; margin-bottom: 30rpx; }
.option { background: #fff; border: 2rpx solid #e0e0e0; border-radius: 12rpx; padding: 24rpx; display: flex; align-items: flex-start; }
.option.selected { border-color: #4CAF50; background: #E8F5E9; }
.option-label { font-weight: bold; margin-right: 12rpx; color: #4CAF50; }
.option-content { flex: 1; font-size: 28rpx; line-height: 1.5; }
.nav-buttons { display: flex; justify-content: space-between; margin-bottom: 20rpx; }
.btn-nav { background: #fff; color: #666; border: 2rpx solid #ddd; border-radius: 12rpx; padding: 16rpx 40rpx; font-size: 28rpx; flex: 1; margin: 0 8rpx; }
.result-page { padding: 20rpx; }
.score-circle { text-align: center; padding: 60rpx 0; background: #fff; border-radius: 16rpx; margin-bottom: 20rpx; }
.score-number { font-size: 80rpx; font-weight: bold; color: #4CAF50; }
.score-label { display: block; font-size: 24rpx; color: #999; margin-top: 10rpx; }
.detail-row { display: flex; justify-content: space-between; padding: 16rpx 0; border-bottom: 1rpx solid #f0f0f0; font-size: 28rpx; }
.answer-detail { background: #fff; border-radius: 12rpx; padding: 20rpx; margin-bottom: 16rpx; }
.detail-header { font-size: 26rpx; font-weight: bold; padding-bottom: 10rpx; }
.detail-header.correct { color: #4CAF50; }
.detail-header.wrong { color: #f44336; }
.detail-question { font-size: 28rpx; line-height: 1.5; margin-bottom: 10rpx; }
.detail-answer { font-size: 22rpx; color: #999; }
.btn-restart { background: linear-gradient(135deg, #4CAF50, #66BB6A); color: #fff; border: none; border-radius: 12rpx; padding: 24rpx; font-size: 32rpx; margin-top: 20rpx; }
</style>
