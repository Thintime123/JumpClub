/**
 * 认证系统核心模块
 * 提供统一的认证管理、API调用、存储管理等功能
 */

// API 端点配置
const API_ENDPOINTS = {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    CHECK_USERNAME: '/api/auth/check-username',
    SEND_VERIFICATION: '/api/auth/send-verification',
    RESET_PASSWORD: '/api/auth/reset-password',
    REFRESH_TOKEN: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/auth/profile'
};

// 存储键名配置
const STORAGE_KEYS = {
    ACCESS_TOKEN: 'jump_club_access_token',
    REFRESH_TOKEN: 'jump_club_refresh_token',
    USER_INFO: 'jump_club_user_info',
    REMEMBER_ME: 'jump_club_remember_me',
    LAST_USERNAME: 'jump_club_last_username'
};

/**
 * API 服务类
 * 处理所有 HTTP 请求和响应
 */
class ApiService {
    constructor() {
        this.baseURL = window.location.origin;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };
    }

    /**
     * 发送 HTTP 请求
     * @param {string} url - 请求URL
     * @param {Object} options - 请求选项
     * @returns {Promise} 请求Promise
     */
    async request(url, options = {}) {
        const config = {
            method: 'GET',
            headers: { ...this.defaultHeaders },
            ...options
        };

        // 添加认证头
        const token = StorageManager.getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // 添加 CSRF 保护
        const csrfToken = this.getCSRFToken();
        if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken;
        }

        try {
            const response = await fetch(this.baseURL + url, config);
            
            // 处理未授权响应
            if (response.status === 401) {
                await this.handleUnauthorized();
                throw new Error('认证失败，请重新登录');
            }

            // 处理服务器错误
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `请求失败: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    }

    /**
     * GET 请求
     */
    get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl);
    }

    /**
     * POST 请求
     */
    post(url, data = {}) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT 请求
     */
    put(url, data = {}) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE 请求
     */
    delete(url) {
        return this.request(url, {
            method: 'DELETE'
        });
    }

    /**
     * 获取 CSRF Token
     */
    getCSRFToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : null;
    }

    /**
     * 处理未授权响应
     */
    async handleUnauthorized() {
        await AuthManager.logout();
        NotificationManager.error('登录已过期，请重新登录');
    }
}

/**
 * 存储管理器
 * 处理本地存储和会话存储
 */
class StorageManager {
    /**
     * 设置访问令牌
     */
    static setAccessToken(token, remember = false) {
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    }

    /**
     * 获取访问令牌
     */
    static getAccessToken() {
        return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || 
               sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    }

    /**
     * 设置刷新令牌
     */
    static setRefreshToken(token, remember = false) {
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
    }

    /**
     * 获取刷新令牌
     */
    static getRefreshToken() {
        return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || 
               sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    }

    /**
     * 设置用户信息
     */
    static setUserInfo(userInfo, remember = false) {
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));
    }

    /**
     * 获取用户信息
     */
    static getUserInfo() {
        const userInfo = localStorage.getItem(STORAGE_KEYS.USER_INFO) || 
                        sessionStorage.getItem(STORAGE_KEYS.USER_INFO);
        return userInfo ? JSON.parse(userInfo) : null;
    }

    /**
     * 设置记住我状态
     */
    static setRememberMe(remember) {
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, remember.toString());
    }

    /**
     * 获取记住我状态
     */
    static getRememberMe() {
        return localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
    }

    /**
     * 设置最后使用的用户名
     */
    static setLastUsername(username) {
        localStorage.setItem(STORAGE_KEYS.LAST_USERNAME, username);
    }

    /**
     * 获取最后使用的用户名
     */
    static getLastUsername() {
        return localStorage.getItem(STORAGE_KEYS.LAST_USERNAME);
    }

    /**
     * 清除所有认证相关数据
     */
    static clearAuth() {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
    }

    /**
     * 清除敏感数据（保留用户偏好设置）
     */
    static clearSensitiveData() {
        [STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.REFRESH_TOKEN, STORAGE_KEYS.USER_INFO].forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
    }
}

/**
 * 认证管理器
 * 核心认证逻辑处理
 */
class AuthManager {
    static apiService = new ApiService();

    /**
     * 用户登录
     * @param {Object} credentials - 登录凭据
     * @returns {Promise} 登录结果
     */
    static async login(credentials) {
        try {
            const response = await this.apiService.post(API_ENDPOINTS.LOGIN, credentials);
            
            if (response.success) {
                // 保存认证信息
                const remember = credentials.rememberMe || false;
                StorageManager.setAccessToken(response.data.accessToken, remember);
                StorageManager.setRefreshToken(response.data.refreshToken, remember);
                StorageManager.setUserInfo(response.data.user, remember);
                StorageManager.setRememberMe(remember);
                StorageManager.setLastUsername(credentials.username);

                // 触发登录成功事件
                this.dispatchAuthEvent('login', response.data.user);

                return response;
            } else {
                throw new Error(response.message || '登录失败');
            }
        } catch (error) {
            console.error('登录失败:', error);
            throw error;
        }
    }

    /**
     * 用户注册
     * @param {Object} userData - 注册数据
     * @returns {Promise} 注册结果
     */
    static async register(userData) {
        try {
            const response = await this.apiService.post(API_ENDPOINTS.REGISTER, userData);
            
            if (response.success) {
                // 触发注册成功事件
                this.dispatchAuthEvent('register', response.data);
                return response;
            } else {
                throw new Error(response.message || '注册失败');
            }
        } catch (error) {
            console.error('注册失败:', error);
            throw error;
        }
    }

    /**
     * 检查用户名可用性
     * @param {string} username - 用户名
     * @returns {Promise} 检查结果
     */
    static async checkUsername(username) {
        try {
            const response = await this.apiService.get(API_ENDPOINTS.CHECK_USERNAME, { username });
            return response;
        } catch (error) {
            console.error('用户名检查失败:', error);
            return { available: false, message: '检查失败' };
        }
    }

    /**
     * 用户登出
     */
    static async logout() {
        try {
            // 尝试调用后端登出接口
            const token = StorageManager.getAccessToken();
            if (token) {
                await this.apiService.post(API_ENDPOINTS.LOGOUT);
            }
        } catch (error) {
            console.error('登出请求失败:', error);
        } finally {
            // 无论后端请求是否成功，都清除本地数据
            StorageManager.clearSensitiveData();
            
            // 触发登出事件
            this.dispatchAuthEvent('logout');
        }
    }

    /**
     * 刷新访问令牌
     */
    static async refreshToken() {
        try {
            const refreshToken = StorageManager.getRefreshToken();
            if (!refreshToken) {
                throw new Error('无刷新令牌');
            }

            const response = await this.apiService.post(API_ENDPOINTS.REFRESH_TOKEN, {
                refreshToken
            });

            if (response.success) {
                const remember = StorageManager.getRememberMe();
                StorageManager.setAccessToken(response.data.accessToken, remember);
                StorageManager.setRefreshToken(response.data.refreshToken, remember);
                return response.data.accessToken;
            } else {
                throw new Error(response.message || '令牌刷新失败');
            }
        } catch (error) {
            console.error('令牌刷新失败:', error);
            await this.logout();
            throw error;
        }
    }

    /**
     * 检查认证状态
     */
    static isAuthenticated() {
        const token = StorageManager.getAccessToken();
        const userInfo = StorageManager.getUserInfo();
        return !!(token && userInfo);
    }

    /**
     * 获取当前用户信息
     */
    static getCurrentUser() {
        return StorageManager.getUserInfo();
    }

    /**
     * 获取用户资料
     */
    static async getProfile() {
        try {
            const response = await this.apiService.get(API_ENDPOINTS.PROFILE);
            if (response.success) {
                // 更新本地用户信息
                const remember = StorageManager.getRememberMe();
                StorageManager.setUserInfo(response.data, remember);
                return response.data;
            }
            throw new Error(response.message || '获取用户资料失败');
        } catch (error) {
            console.error('获取用户资料失败:', error);
            throw error;
        }
    }

    /**
     * 分发认证事件
     */
    static dispatchAuthEvent(type, data = null) {
        const event = new CustomEvent(`auth:${type}`, {
            detail: data
        });
        document.dispatchEvent(event);
    }

    /**
     * 监听认证事件
     */
    static onAuthEvent(type, callback) {
        document.addEventListener(`auth:${type}`, callback);
    }

    /**
     * 初始化认证管理器
     */
    static init() {
        // 监听页面加载
        document.addEventListener('DOMContentLoaded', () => {
            this.initAutoTokenRefresh();
            this.initNavigationGuards();
        });
    }

    /**
     * 初始化自动令牌刷新
     */
    static initAutoTokenRefresh() {
        if (!this.isAuthenticated()) return;

        // 每 15 分钟检查一次令牌
        setInterval(async () => {
            try {
                await this.refreshToken();
            } catch (error) {
                console.error('自动令牌刷新失败:', error);
            }
        }, 15 * 60 * 1000);
    }

    /**
     * 初始化导航守卫
     */
    static initNavigationGuards() {
        // 页面离开前确认
        window.addEventListener('beforeunload', (event) => {
            // 可以在这里添加未保存数据的提示
        });

        // 监听认证状态变化
        this.onAuthEvent('logout', () => {
            // 检查是否需要重定向到登录页
            const currentPath = window.location.pathname;
            const protectedPaths = ['/dashboard', '/profile', '/settings'];
            
            if (protectedPaths.some(path => currentPath.includes(path))) {
                window.location.href = '/auth/login.html';
            }
        });
    }
}

/**
 * 通知管理器
 * 处理用户通知和消息显示
 */
class NotificationManager {
    static container = null;

    /**
     * 初始化通知容器
     */
    static init() {
        this.container = document.getElementById('notification-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        }
    }

    /**
     * 显示通知
     */
    static show(message, type = 'info', duration = 5000) {
        if (!this.container) this.init();

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icon = this.getIcon(type);
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="${icon}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // 添加关闭功能
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.remove(notification);
        });

        // 添加到容器
        this.container.appendChild(notification);

        // 触发显示动画
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // 自动隐藏
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }

        return notification;
    }

    /**
     * 移除通知
     */
    static remove(notification) {
        notification.classList.add('hide');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    /**
     * 获取图标
     */
    static getIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    /**
     * 成功通知
     */
    static success(message, duration = 5000) {
        return this.show(message, 'success', duration);
    }

    /**
     * 错误通知
     */
    static error(message, duration = 7000) {
        return this.show(message, 'error', duration);
    }

    /**
     * 警告通知
     */
    static warning(message, duration = 6000) {
        return this.show(message, 'warning', duration);
    }

    /**
     * 信息通知
     */
    static info(message, duration = 5000) {
        return this.show(message, 'info', duration);
    }
}

/**
 * 工具函数
 */
class AuthUtils {
    /**
     * 防抖函数
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 节流函数
     */
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    /**
     * 生成随机字符串
     */
    static generateRandomString(length = 10) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * 格式化时间
     */
    static formatTime(date) {
        const now = new Date();
        const diff = now - date;
        const minute = 60 * 1000;
        const hour = minute * 60;
        const day = hour * 24;

        if (diff < minute) {
            return '刚刚';
        } else if (diff < hour) {
            return Math.floor(diff / minute) + '分钟前';
        } else if (diff < day) {
            return Math.floor(diff / hour) + '小时前';
        } else {
            return Math.floor(diff / day) + '天前';
        }
    }

    /**
     * 安全的 JSON 解析
     */
    static safeJSONParse(str, defaultValue = null) {
        try {
            return JSON.parse(str);
        } catch (error) {
            return defaultValue;
        }
    }
}

// 初始化认证系统
AuthManager.init();
NotificationManager.init();

// 导出主要类供其他模块使用
window.AuthManager = AuthManager;
window.ApiService = ApiService;
window.StorageManager = StorageManager;
window.NotificationManager = NotificationManager;
window.AuthUtils = AuthUtils;
