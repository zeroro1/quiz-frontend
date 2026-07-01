<template>
	<view class="container">
		<view class="title">&#x1F3C6; 排行榜</view>
		<view class="tabs">
			<view class="tab" v-for="item in tabs" :key="item.key"
			      :class="{ active: activeTab === item.key }"
			      @click="onTabChange(item.key)">
				<text>{{ item.label }}</text>
			</view>
		</view>
		<view class="list" v-if="!loading">
			<view class="rank-item" v-for="item in leaderboard" :key="item.userId">
				<view class="rank-num" :class="{ top3: item.rank <= 3 }">{{ item.rank }}</view>
				<view class="rank-info">
					<text class="rank-name">{{ item.nickname || '匿名用户' }}</text>
					<view class="rank-stats">
						<text class="stat">&#x2705; {{ item.accuracy }}%</text>
						<text class="stat">&#x23F1; {{ item.avgTime.toFixed(1) }}s/题</text>
					</view>
				</view>
			</view>
		</view>
		<view class="empty" v-if="!loading && leaderboard.length === 0">
			<text>&#x1F914; 暂无数据，快来答题吧！</text>
		</view>
	</view>
</template>

<script setup>
import { ref, onShow } from 'vue'
import { getLeaderboard } from '@/utils/api.js'

const activeTab = ref('COMMONSENSE')
const tabs = [
	{ key: 'COMMONSENSE', label: '&#x1F4DA; 常识' },
	{ key: 'LOGIC', label: '&#x1F9EA; 逻辑' }
]
const leaderboard = ref([])
const loading = ref(false)

onShow(() => { loadLeaderboard() })

function onTabChange(type) { activeTab.value = type; loadLeaderboard() }

function loadLeaderboard() {
	loading.value = true
	getLeaderboard(activeTab.value).then(data => {
		leaderboard.value = data
		loading.value = false
	}).catch(err => {
		uni.showToast({ title: '加载失败', icon: 'none' })
		loading.value = false
	})
}
</script>

<style>
.container {
	min-height: 100vh;
	background: #f5f5f5;
	padding: 20rpx;
}

.title {
	font-size: 40rpx;
	font-weight: bold;
	text-align: center;
	padding: 30rpx 0;
	color: #333;
}

.tabs {
	display: flex;
	margin-bottom: 20rpx;
}

.tab {
	flex: 1;
	text-align: center;
	padding: 20rpx;
	background: #fff;
	border-radius: 12rpx;
	margin-right: 16rpx;
	font-size: 28rpx;
}

.tab:last-child { margin-right: 0; }

.tab.active {
	background: #4CAF50;
	color: #fff;
}

.rank-item {
	display: flex;
	align-items: center;
	background: #fff;
	border-radius: 12rpx;
	padding: 24rpx;
	margin-bottom: 16rpx;
}

.rank-num {
	width: 60rpx;
	height: 60rpx;
	line-height: 60rpx;
	text-align: center;
	border-radius: 50%;
	font-size: 28rpx;
	font-weight: bold;
	background: #f0f0f0;
	margin-right: 20rpx;
}

.rank-num.top3 {
	background: linear-gradient(135deg, #FFD700, #FFA500);
	color: #fff;
}

.rank-name {
	font-size: 30rpx;
	font-weight: bold;
	margin-bottom: 8rpx;
}

.rank-stats {
	display: flex;
	gap: 20rpx;
}

.stat {
	font-size: 22rpx;
	color: #999;
}

.empty {
	text-align: center;
	padding: 200rpx 0;
	color: #ccc;
	font-size: 28rpx;
}
</style>