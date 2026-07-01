// 本地存储封装
const STORAGE_KEYS = {
    USER_ID: 'quiz_user_id',
    USER_INFO: 'quiz_user_info',
    IS_LOGGED_IN: 'quiz_logged_in'
}

export default {
    setUserId(id) {
        try { wx.setStorageSync(STORAGE_KEYS.USER_ID, id) } catch(e) {}
    },
    getUserId() {
        try { return wx.getStorageSync(STORAGE_KEYS.USER_ID) } catch(e) { return null }
    },
    setUserInfo(info) {
        try { wx.setStorageSync(STORAGE_KEYS.USER_INFO, JSON.stringify(info)) } catch(e) {}
    },
    getUserInfo() {
        try { return JSON.parse(wx.getStorageSync(STORAGE_KEYS.USER_INFO)) } catch(e) { return null }
    },
    setLoggedIn(flag) {
        try { wx.setStorageSync(STORAGE_KEYS.IS_LOGGED_IN, flag) } catch(e) {}
    },
    isLoggedIn() {
        try { return wx.getStorageSync(STORAGE_KEYS.IS_LOGGED_IN) } catch(e) { return false }
    },
    clear() {
        try {
            wx.removeStorageSync(STORAGE_KEYS.USER_ID)
            wx.removeStorageSync(STORAGE_KEYS.USER_INFO)
            wx.removeStorageSync(STORAGE_KEYS.IS_LOGGED_IN)
        } catch(e) {}
    }
}