<template>
	<view class="container">
		<view class="title">我的答题记录</view>
		<view class="record-item" v-for="(item, idx) in records" :key="idx">
			<view class="record-header" :class="item.isCorrect ? 'correct' : 'wrong'">
				<text>{{ item.isCorrect ? '✅ 正确' : '❌ 错误' }}</text>
				<text>{{ item.type === 'COMMONSENSE' ? '📚 常识' : '🧩 逻辑' }}</text>
			</view>
			<text class="record-question">{{ item.content }}</text>
			<text class="record-answer">你的答案: {{ item.userAnswer }} | 正确: {{ item.correctAnswer }} | 用时: {{ item.timeTaken }}s</text>
		</view>
		<view class="empty" v-if="!loading && records.length === 0">
			<text>还没有答题记录哦～</text>
		</view>
	</view>
</template>

<script setup>
import { ref, onShow } from 'vue'
import { getUserRecords } from '@/utils/api.js'

const records = ref([])
const loading = ref(false)

onShow(() => { loadRecords() })

function loadRecords() {
	const app = getApp()
	const userId = app.globalData.userId
	if (!userId) {
		uni.showToast({ title: '请先登录', icon: 'none' })
		return
	}
	loading.value = true
	getUserRecords(userId).then(data => {
		records.value = data
		loading.value = false
	}).catch(err => {
		uni.showToast({ title: '加载失败', icon: 'none' })
		loading.value = false
	})
}
</script>

<style>
.title { font-size: 36rpx; font-weight: bold; padding: 20rpx 0; }
.record-item { background: #fff; border-radius: 12rpx; padding: 24rpx; margin-bottom: 16rpx; }
.record-header { font-size: 26rpx; font-weight: bold; margin-bottom: 12rpx; display: flex; justify-content: space-between; }
.record-header.correct { color: #4CAF50; }
.record-header.wrong { color: #f44336; }
.record-question { font-size: 28rpx; line-height: 1.5; margin-bottom: 10rpx; }
.record-answer { font-size: 22rpx; color: #999; }
.empty { text-align: center; padding: 200rpx 0; color: #ccc; font-size: 28rpx; }
</style>
