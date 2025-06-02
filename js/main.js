// 主应用程序 - 协调所有模块
class JumpClubApp {
    constructor() {
        this.ui = null;
        this.playerModal = null;
        this.ratingSystem = null;
        this.commentSystem = null;
        
        this.init();
    }

    // 初始化应用
    async init() {
        try {
            // 等待DOM完全加载
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initModules());
            } else {
                this.initModules();
            }
        } catch (error) {
            console.error('应用初始化失败:', error);
        }
    }

    // 初始化所有模块
    initModules() {
        console.log('🚀 初始化身法俱乐部应用...');

        // 检查必要的数据是否存在
        if (typeof playersData === 'undefined' || typeof playerDetails === 'undefined') {
            console.error('❌ 数据模块未正确加载');
            return;
        }

        try {
            // 初始化UI控制器
            this.ui = new UIController();
            console.log('✅ UI控制器初始化完成');

            // 初始化玩家模态框
            this.playerModal = new PlayerModal();
            console.log('✅ 玩家模态框初始化完成');

            // 初始化评分系统
            this.ratingSystem = new RatingSystem();
            console.log('✅ 评分系统初始化完成');

            // 初始化评论系统
            this.commentSystem = new CommentSystem();
            console.log('✅ 评论系统初始化完成');

            // 设置全局引用，供其他模块使用
            window.app = this;
            window.playerModal = this.playerModal;

            // 渲染所有玩家数据
            this.ui.renderAllPlayers();
            console.log('✅ 玩家数据渲染完成');

            // 初始化其他功能
            this.initAdditionalFeatures();

            console.log('🎉 身法俱乐部应用初始化完成！');

        } catch (error) {
            console.error('❌ 模块初始化失败:', error);
            this.handleInitError(error);
        }
    }

    // 初始化额外功能
    initAdditionalFeatures() {
        // 初始化性能监控
        this.initPerformanceMonitoring();
        
        // 初始化主题切换
        this.initThemeToggle();
        
        // 初始化键盘快捷键
        this.initKeyboardShortcuts();
        
        // 初始化页面统计
        this.initPageStats();
    }

    // 性能监控
    initPerformanceMonitoring() {
        // 监控页面加载性能
        window.addEventListener('load', () => {
            if (window.performance && window.performance.timing) {
                const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
                console.log(`📊 页面加载时间: ${loadTime}ms`);
            }
        });

        // 监控内存使用（如果支持）
        if (window.performance && window.performance.memory) {
            const logMemory = () => {
                const memory = window.performance.memory;
                console.log(`💾 内存使用: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`);
            };
            
            // 每30秒记录一次内存使用
            setInterval(logMemory, 30000);
        }
    }

    // 主题切换功能
    initThemeToggle() {
        // 检查是否有保存的主题偏好
        const savedTheme = localStorage.getItem('jumpclub_theme');
        if (savedTheme) {
            document.body.setAttribute('data-theme', savedTheme);
        }

        // 监听系统主题变化
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                if (!localStorage.getItem('jumpclub_theme')) {
                    document.body.setAttribute('data-theme', e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    // 键盘快捷键
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K: 聚焦搜索框
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
            }

            // Escape: 关闭模态框
            if (e.key === 'Escape') {
                if (this.playerModal && this.playerModal.modal.style.display === 'flex') {
                    this.playerModal.hideModal();
                }
            }

            // Ctrl/Cmd + Enter: 在评论框中提交评论
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                const commentContent = document.getElementById('commentContent');
                if (commentContent && document.activeElement === commentContent) {
                    this.commentSystem.handleSubmitComment();
                }
            }
        });
    }

    // 页面统计
    initPageStats() {
        // 统计玩家数量
        const stats = {
            variation: playersData.variation.length,
            hideSeek: playersData.hideSeek.length,
            extreme: playersData.extreme.length,
            jumpPoints: playersData.jumpPoints.length,
            honorary: playersData.honorary.length,
            detailed: playersData.detailedPlayers.length,
            total: new Set([
                ...playersData.variation.map(p => p.name),
                ...playersData.hideSeek.map(p => p.name),
                ...playersData.extreme.map(p => p.name),
                ...playersData.jumpPoints.map(p => p.name),
                ...playersData.honorary
            ]).size
        };

        console.log('📈 玩家统计:', stats);
        
        // 保存统计数据
        window.jumpClubStats = stats;
    }

    // 错误处理
    handleInitError(error) {
        // 显示用户友好的错误信息
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #f44336;
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        errorDiv.innerHTML = `
            <h3>应用加载失败</h3>
            <p>抱歉，应用无法正常加载。请刷新页面重试。</p>
            <button onclick="location.reload()" style="
                background: white;
                color: #f44336;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 10px;
            ">刷新页面</button>
        `;
        document.body.appendChild(errorDiv);
    }

    // 获取应用状态
    getAppStatus() {
        return {
            initialized: !!(this.ui && this.playerModal && this.ratingSystem && this.commentSystem),
            modules: {
                ui: !!this.ui,
                playerModal: !!this.playerModal,
                ratingSystem: !!this.ratingSystem,
                commentSystem: !!this.commentSystem
            },
            stats: window.jumpClubStats || null
        };
    }

    // 重新初始化应用
    reinitialize() {
        console.log('🔄 重新初始化应用...');
        this.initModules();
    }

    // 销毁应用
    destroy() {
        console.log('💥 销毁应用...');
        
        // 清理事件监听器和引用
        this.ui = null;
        this.playerModal = null;
        this.ratingSystem = null;
        this.commentSystem = null;
        
        // 清理全局引用
        delete window.app;
        delete window.playerModal;
        
        console.log('✅ 应用已销毁');
    }
}

// 创建并初始化应用实例
const jumpClubApp = new JumpClubApp();

// 暴露到全局作用域，方便调试
window.JumpClubApp = JumpClubApp;
window.jumpClubApp = jumpClubApp;
