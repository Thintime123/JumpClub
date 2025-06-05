/**
 * 登录页面控制器
 * 处理登录表单交互和验证
 */

class LoginController {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.rememberMeCheckbox = document.getElementById('rememberMe');
        this.loginButton = document.getElementById('loginButton');
        
        this.validator = new FormValidator({
            username: {
                required: true,
                minLength: 3,
                pattern: {
                    value: /^[a-zA-Z0-9_@.]+$/,
                    message: '用户名只能包含字母、数字、下划线、@和.'
                }
            },
            password: {
                required: true,
                minLength: 6
            }
        });

        this.isSubmitting = false;
        this.init();
    }

    /**
     * 初始化登录控制器
     */
    init() {
        this.bindEvents();
        this.initPasswordToggle();
        this.initDemoAccounts();
        this.initSocialLogin();
        this.loadRememberedData();
        this.addBackgroundAnimations();
        
        // 聚焦第一个输入框
        setTimeout(() => {
            this.usernameInput.focus();
        }, 500);
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 表单提交
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // 实时验证
        this.usernameInput.addEventListener('input', AuthUtils.debounce(() => {
            this.validateField('username');
        }, 300));

        this.passwordInput.addEventListener('input', AuthUtils.debounce(() => {
            this.validateField('password');
        }, 300));

        // 输入框聚焦效果
        [this.usernameInput, this.passwordInput].forEach(input => {
            input.addEventListener('focus', (e) => {
                this.addFocusEffect(e.target);
            });

            input.addEventListener('blur', (e) => {
                this.removeFocusEffect(e.target);
                this.validateField(e.target.name);
            });
        });

        // 键盘事件
        this.form.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleSubmit();
            }
        });

        // 记住我选项
        this.rememberMeCheckbox.addEventListener('change', () => {
            this.updateRememberMeState();
        });
    }

    /**
     * 初始化密码显示/隐藏切换
     */
    initPasswordToggle() {
        const passwordContainer = this.passwordInput.closest('.password-container');
        const toggleButton = passwordContainer.querySelector('.password-toggle');
        
        toggleButton.addEventListener('click', () => {
            const isPassword = this.passwordInput.type === 'password';
            this.passwordInput.type = isPassword ? 'text' : 'password';
            
            const icon = toggleButton.querySelector('i');
            icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
            
            // 添加切换动画
            toggleButton.classList.add('toggle-active');
            setTimeout(() => {
                toggleButton.classList.remove('toggle-active');
            }, 200);
        });
    }

    /**
     * 初始化演示账号功能
     */
    initDemoAccounts() {
        const demoButtons = document.querySelectorAll('.demo-btn');
        
        demoButtons.forEach(button => {
            button.addEventListener('click', () => {
                const username = button.getAttribute('data-username');
                const password = button.getAttribute('data-password');
                
                this.fillDemoAccount(username, password);
            });
        });
    }

    /**
     * 填充演示账号信息
     */
    fillDemoAccount(username, password) {
        // 添加填充动画
        this.usernameInput.classList.add('demo-filling');
        this.passwordInput.classList.add('demo-filling');

        // 模拟打字效果
        this.typeText(this.usernameInput, username, () => {
            this.typeText(this.passwordInput, password, () => {
                this.usernameInput.classList.remove('demo-filling');
                this.passwordInput.classList.remove('demo-filling');
                
                // 验证字段
                this.validateField('username');
                this.validateField('password');
                
                NotificationManager.info('演示账号已填充，点击登录按钮继续');
            });
        });
    }

    /**
     * 打字机效果
     */
    typeText(input, text, callback) {
        input.value = '';
        let index = 0;
        
        const typeInterval = setInterval(() => {
            input.value += text[index];
            index++;
            
            if (index >= text.length) {
                clearInterval(typeInterval);
                if (callback) callback();
            }
        }, 50);
    }

    /**
     * 初始化第三方登录
     */
    initSocialLogin() {
        const socialButtons = document.querySelectorAll('.social-btn');
        
        socialButtons.forEach(button => {
            button.addEventListener('click', () => {
                const provider = button.getAttribute('data-provider');
                this.handleSocialLogin(provider);
            });
        });
    }

    /**
     * 处理第三方登录
     */
    handleSocialLogin(provider) {
        NotificationManager.info(`${provider.toUpperCase()} 登录功能即将上线，敬请期待！`);
        
        // 这里可以添加实际的第三方登录逻辑
        // 例如跳转到第三方认证页面
        const authUrls = {
            qq: '/auth/qq',
            wechat: '/auth/wechat',
            github: '/auth/github'
        };
        
        // window.location.href = authUrls[provider];
    }

    /**
     * 加载记住的登录信息
     */
    loadRememberedData() {
        const rememberMe = StorageManager.getRememberMe();
        const lastUsername = StorageManager.getLastUsername();
        
        if (rememberMe && lastUsername) {
            this.usernameInput.value = lastUsername;
            this.rememberMeCheckbox.checked = true;
            this.passwordInput.focus();
        }
    }

    /**
     * 更新记住我状态
     */
    updateRememberMeState() {
        const isChecked = this.rememberMeCheckbox.checked;
        StorageManager.setRememberMe(isChecked);
        
        if (!isChecked) {
            StorageManager.setLastUsername('');
        }
    }

    /**
     * 添加背景动画
     */
    addBackgroundAnimations() {
        // 添加浮动粒子
        this.createFloatingParticles();
        
        // 添加光晕动画
        this.animateGlowOrbs();
    }

    /**
     * 创建浮动粒子
     */
    createFloatingParticles() {
        const particlesContainer = document.querySelector('.floating-particles');
        if (!particlesContainer) return;

        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 4 + 2}px;
                height: ${Math.random() * 4 + 2}px;
                background: rgba(79, 195, 247, ${Math.random() * 0.5 + 0.2});
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: float ${Math.random() * 10 + 10}s infinite linear;
            `;
            particlesContainer.appendChild(particle);
        }
    }

    /**
     * 光晕动画
     */
    animateGlowOrbs() {
        const orbs = document.querySelectorAll('.orb');
        orbs.forEach((orb, index) => {
            orb.style.animationDelay = `${index * 2}s`;
        });
    }

    /**
     * 验证字段
     */
    validateField(fieldName) {
        const input = document.getElementById(fieldName);
        const value = input.value.trim();
        const result = this.validator.validateField(fieldName, value);
        
        this.updateFieldUI(input, result);
        return result.isValid;
    }

    /**
     * 更新字段UI状态
     */
    updateFieldUI(input, result) {
        const container = input.closest('.form-group');
        const feedback = container.querySelector('.form-feedback');
        
        // 清除之前的状态
        container.classList.remove('valid', 'invalid');
        
        if (result.isValid) {
            container.classList.add('valid');
            feedback.textContent = '';
        } else if (result.message) {
            container.classList.add('invalid');
            feedback.textContent = result.message;
            this.addShakeAnimation(input);
        }
    }

    /**
     * 添加聚焦效果
     */
    addFocusEffect(input) {
        const container = input.closest('.input-container');
        container.classList.add('focused');
    }

    /**
     * 移除聚焦效果
     */
    removeFocusEffect(input) {
        const container = input.closest('.input-container');
        container.classList.remove('focused');
    }

    /**
     * 添加摇摆动画
     */
    addShakeAnimation(element) {
        element.classList.add('shake');
        setTimeout(() => {
            element.classList.remove('shake');
        }, 600);
    }

    /**
     * 处理表单提交
     */
    async handleSubmit() {
        if (this.isSubmitting) return;

        // 验证所有字段
        const isUsernameValid = this.validateField('username');
        const isPasswordValid = this.validateField('password');

        if (!isUsernameValid || !isPasswordValid) {
            NotificationManager.error('请填写正确的登录信息');
            return;
        }

        this.setSubmittingState(true);

        try {
            const credentials = {
                username: this.usernameInput.value.trim(),
                password: this.passwordInput.value,
                rememberMe: this.rememberMeCheckbox.checked
            };

            // 尝试登录
            const response = await AuthManager.login(credentials);

            if (response.success) {
                NotificationManager.success('登录成功！正在跳转...');
                
                // 延迟跳转，让用户看到成功消息
                setTimeout(() => {
                    // 根据用户角色跳转到不同页面
                    const user = response.data.user;
                    if (user.role === 'admin') {
                        window.location.href = '../admin/dashboard.html';
                    } else {
                        window.location.href = '../dashboard.html';
                    }
                }, 1500);
            } else {
                throw new Error(response.message || '登录失败');
            }
        } catch (error) {
            console.error('登录错误:', error);
            NotificationManager.error(error.message || '登录失败，请检查用户名和密码');
            
            // 重置密码字段
            this.passwordInput.value = '';
            this.passwordInput.focus();
        } finally {
            this.setSubmittingState(false);
        }
    }

    /**
     * 设置提交状态
     */
    setSubmittingState(isSubmitting) {
        this.isSubmitting = isSubmitting;
        this.loginButton.disabled = isSubmitting;
        
        const buttonText = this.loginButton.querySelector('.button-text');
        const buttonLoader = this.loginButton.querySelector('.button-loader');
        
        if (isSubmitting) {
            buttonText.style.opacity = '0';
            buttonLoader.style.opacity = '1';
            this.loginButton.classList.add('loading');
        } else {
            buttonText.style.opacity = '1';
            buttonLoader.style.opacity = '0';
            this.loginButton.classList.remove('loading');
        }
    }

    /**
     * 重置表单
     */
    resetForm() {
        this.form.reset();
        
        // 清除验证状态
        const formGroups = this.form.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            group.classList.remove('valid', 'invalid');
            const feedback = group.querySelector('.form-feedback');
            if (feedback) feedback.textContent = '';
        });
        
        this.usernameInput.focus();
    }

    /**
     * 销毁控制器
     */
    destroy() {
        // 清理事件监听器和定时器
        // 这里可以添加清理逻辑
    }
}

// 页面加载完成后初始化登录控制器
document.addEventListener('DOMContentLoaded', () => {
    // 检查是否已经登录
    if (AuthManager.isAuthenticated()) {
        const user = AuthManager.getCurrentUser();
        NotificationManager.info('您已经登录，正在跳转...');
        
        setTimeout(() => {
            if (user.role === 'admin') {
                window.location.href = '../admin/dashboard.html';
            } else {
                window.location.href = '../dashboard.html';
            }
        }, 1000);
        return;
    }

    // 初始化登录控制器
    const loginController = new LoginController();
    
    // 监听认证事件
    AuthManager.onAuthEvent('login', (event) => {
        console.log('用户登录成功:', event.detail);
    });

    // 添加全局错误处理
    window.addEventListener('error', (event) => {
        console.error('页面错误:', event.error);
        NotificationManager.error('页面出现错误，请刷新重试');
    });

    // 添加CSS动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-10px) rotate(120deg); }
            66% { transform: translateY(5px) rotate(240deg); }
        }
        
        .shake {
            animation: shake 0.6s ease-in-out;
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .demo-filling {
            background: linear-gradient(90deg, transparent, rgba(79, 195, 247, 0.3), transparent);
            background-size: 200% 100%;
            animation: demo-fill 1s ease-in-out;
        }
        
        @keyframes demo-fill {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
        
        .toggle-active {
            transform: scale(1.1);
            transition: transform 0.2s ease;
        }
    `;
    document.head.appendChild(style);
});

// 导出登录控制器供测试使用
window.LoginController = LoginController;
