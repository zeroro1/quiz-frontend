const BASE_URL = 'http://localhost:8080/api'

function request(url, method, data) {
	return new Promise((resolve, reject) => {
		uni.request({
			url: BASE_URL + url,
			method: method,
			data: data,
			header: {
				'Content-Type': 'application/json'
			},
			success: (res) => {
				if (res.statusCode === 200) {
					resolve(res.data)
				} else {
					reject(new Error('Request failed: ' + res.statusCode))
				}
			},
			fail: (err) => {
				reject(err)
			}
		})
	})
}

export function login() {
	return new Promise((resolve, reject) => {
		uni.login({
			provider: 'weixin',
			success: (res) => {
				request('/wx/login', 'POST', { code: res.code })
					.then(data => resolve(data))
					.catch(reject)
			},
			fail: reject
		})
	})
}

export function updateUserInfo(userId, nickname, avatar) {
	return request('/wx/updateUserInfo', 'POST', { userId, nickname, avatar })
}

export function startQuiz(userId) {
	return request('/quiz/start', 'POST', { userId })
}

export function submitAnswers(data) {
	return request('/quiz/submit', 'POST', data)
}

export function getLeaderboard(type) {
	return request('/leaderboard/' + type, 'GET')
}

export function getUserRecords(userId) {
	return request('/user/records?userId=' + userId, 'GET')
}

export function createUser(openid, nickname, avatar) {
	return request('/admin/createUser', 'POST', { openid, nickname, avatar })
}