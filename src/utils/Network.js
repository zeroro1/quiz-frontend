import { CONFIG } from './Constants.js'

export default {
    /**
     * GET 请求
     * @param {string} url - 相对路径，不含 BASE_URL
     * @returns {Promise<any>}
     */
    get(url) {
        return new Promise((resolve, reject) => {
            wx.request({
                url: CONFIG.BASE_URL + url,
                method: 'GET',
                header: { 'Content-Type': 'application/json' },
                success: (res) => res.statusCode === 200 ? resolve(res.data) : reject(new Error('Status: ' + res.statusCode)),
                fail: (err) => reject(err)
            })
        })
    },

    /**
     * POST 请求
     * @param {string} url - 相对路径
     * @param {object} data - 请求体
     * @returns {Promise<any>}
     */
    post(url, data) {
        return new Promise((resolve, reject) => {
            wx.request({
                url: CONFIG.BASE_URL + url,
                method: 'POST',
                data: data,
                header: { 'Content-Type': 'application/json' },
                success: (res) => res.statusCode === 200 ? resolve(res.data) : reject(new Error('Status: ' + res.statusCode)),
                fail: (err) => reject(err)
            })
        })
    },

    /**
     * 微信登录
     * @returns {Promise<object>} 返回 {userId, nickname, avatar, isNewUser}
     */
    login() {
        return new Promise((resolve, reject) => {
            wx.login({
                success: (res) => {
                    this.post('/wx/login', { code: res.code })
                        .then(data => resolve(data))
                        .catch(reject)
                },
                fail: reject
            })
        })
    },

    /**
     * 开始答题
     * @param {number|string} userId
     * @returns {Promise<object>} 返回 {sessionId, questions}
     */
    startQuiz(userId) {
        return this.post('/quiz/start', { userId })
    },

    /**
     * 提交答案
     * @param {object} data - {sessionId, userId, answers}
     * @returns {Promise<object>} 返回得分详情
     */
    submitAnswers(data) {
        return this.post('/quiz/submit', data)
    },

    /**
     * 获取排行榜
     * @param {string} type - COMMONSENSE 或 LOGIC
     * @returns {Promise<Array>}
     */
    getLeaderboard(type) {
        return this.get('/leaderboard/' + type)
    },

    /**
     * 获取用户答题记录
     * @param {number|string} userId
     * @returns {Promise<Array>}
     */
    getUserRecords(userId) {
        return this.get('/user/records?userId=' + userId)
    },

    /**
     * 更新用户信息
     * @param {number|string} userId
     * @param {string} nickname
     * @param {string} avatar
     * @returns {Promise<object>}
     */
    updateUserInfo(userId, nickname, avatar) {
        return this.post('/wx/updateUserInfo', { userId, nickname, avatar })
    },

    /**
     * 测试用：创建用户
     * @param {string} openid
     * @param {string} nickname
     * @param {string} avatar
     * @returns {Promise<object>}
     */
    createUser(openid, nickname, avatar) {
        return this.post('/admin/createUser', { openid, nickname, avatar })
    }
}