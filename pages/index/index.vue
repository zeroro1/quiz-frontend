<template>
	<view class="container">
		<!-- 登录前 -->
		<view class="login-page" v-if="!isLoggedIn">
			<view class="logo-area">
				<text class="logo-icon">&#x1F3AF;</text>
				<text class="app-title">知识问答竞赛</text>
				<text class="app-subtitle">常识 + 逻辑推理，挑战你的智慧极限！</text>
			</view>
			<button class="btn-login" @click="onLogin" :loading="loginLoading">
				{{ loginLoading ? '登录中...' : '微信一键登录' }}
			</button>
		</view>

		<!-- 登录后主菜单 -->
		<view class="menu-page" v-else>
			<view class="user-info">
				<image class="avatar" :src="userInfo.avatar || '/static/user.png'" mode="aspectFill"></image>
				<text class="nickname">{{ userInfo.nickname }}</text>
			</view>

			<view class="menu-grid">
				<view class="menu-item" @click="onStartQuiz">
					<view class="menu-icon">&#x1F3AF;</view>
					<text class="menu-label">开始答题</text>
					<text class="menu-desc">10道题 · 每题15秒</text>
				</view>
				<view class="menu-item" @click="onSwitchTab(0)">
					<view class="menu-icon">&#x1F4DA;</view>
					<text class="menu-label">常识问答</text>
					<text class="menu-desc">生活常识 · 历史地理</text>
				</view>
				<view class="menu-item" @click="onSwitchTab(1)">
					<view class="menu-icon">&#x1F9EA;</view>
					<text class="menu-label">逻辑推理</text>
					<text class="menu-desc">找规律 · 智力测试</text>
				</view>
				<view class="menu-item" @click="onSwitchTab(2)">
					<view class="menu-icon">&#x1F3C6;</view>
					<text class="menu-label">排行榜</text>
					<text class="menu-desc">看看谁是第一名</text>
				</view>
				<view class="menu-item" @click="onSwitchTab(3)">
					<view class="menu-icon">&#x1F4CB;</view>
					<text class="menu-label">我的记录</text>
					<text class="menu-desc">查看历史答题记录</text>
				</view>
			</view>

			<view class="footer-hint">
				<text>每次答题包含 5道常识 + 5道逻辑推理</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { login } from '@/utils/api.js'

const userInfo = ref(null)
const userId = ref(null)
const isLoggedIn = ref(false)
const loginLoading = ref(false)

const app = getApp()

function checkLogin() {
	if (app.globalData && app.globalData.userId) {
		userId.value = app.globalData.userId
		userInfo.value = app.globalData.userInfo
		isLoggedIn.value = true
	}
}

function onLogin() {
	loginLoading.value = true
	uni.login({
		provider: 'weixin',
		success: (res) => {
			login().then(data => {
				app.globalData.userId = data.userId
				app.globalData.userInfo = {
					nickname: data.nickname || '用户',
					avatar: data.avatar || ''
				}
				app.globalData.isLoggedIn = true
				userId.value = data.userId
				userInfo.value = app.globalData.userInfo
				isLoggedIn.value = true
				loginLoading.value = false
				uni.showToast({ title: '登录成功', icon: 'success' })
			}).catch(err => {
				loginLoading.value = false
				uni.showToast({ title: '登录失败', icon: 'none' })
				console.error(err)
			})
		},
		fail: (err) => {
			loginLoading.value = false
			uni.showToast({ title: '登录失败', icon: 'none' })
			console.error(err)
		}
	})
}

function onStartQuiz() {
	uni.switchTab({ url: '/pages/quiz/quiz' })
}

function onSwitchTab(index) {
	const urls = ['/pages/index/index', '/pages/quiz/quiz', '/pages/leaderboard/leaderboard', '/pages/records/records']
	uni.switchTab({ url: urls[index] })
}

checkLogin()
</script>

<style>
.container {
	min-height: 100vh;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-page {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 100vh;
	padding: 60rpx;
}

.logo-area {
	text-align: center;
	margin-bottom: 80rpx;
}

.logo-icon {
	font-size: 120rpx;
	display: block;
	margin-bottom: 30rpx;
}

.app-title {
	display: block;
	font-size: 52rpx;
	font-weight: bold;
	color: #fff;
	margin-bottom: 20rpx;
}

.app-subtitle {
	display: block;
	font-size: 26rpx;
	color: rgba(255,255,255,0.8);
	line-height: 1.6;
}

.btn-login {
	background: #fff;
	color: #667eea;
	border: none;
	border-radius: 50rpx;
	padding: 24rpx 80rpx;
	font-size: 34rpx;
	font-weight: bold;
}

.menu-page {
	padding: 40rpx 30rpx;
}

.user-info {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 40rpx 0;
}

.avatar {
	width: 100rpx;
	height: 100rpx;
	border-radius: 50%;
	margin-right: 20rpx;
	border: 4rpx solid #fff;
}

.nickname {
	font-size: 36rpx;
	font-weight: bold;
	color: #fff;
}

.menu-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 20rpx;
	margin-top: 30rpx;
}

.menu-item {
	background: rgba(255,255,255,0.95);
	border-radius: 20rpx;
	padding: 30rpx 20rpx;
	text-align: center;
	box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.1);
}

.menu-icon {
	font-size: 56rpx;
	margin-bottom: 12rpx;
}

.menu-label {
	display: block;
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 6rpx;
}

.menu-desc {
	display: block;
	font-size: 22rpx;
	color: #999;
}

.footer-hint {
	text-align: center;
	padding: 40rpx 0;
}

.footer-hint text {
	font-size: 22rpx;
	color: rgba(255,255,255,0.6);
}
</style>