/**
 * 注册页面控制器
 * 处理多步骤注册表单交互和验证
 */

class RegisterController {
    constructor() {
        this.form = document.getElementById('registerForm');
        this.steps = document.querySelectorAll('.form-step');
        this.progressSteps = document.querySelectorAll('.progress-step');
        this.currentStep = 1;
        this.maxStep = 3;
        
        // 表单字段
        this.fields = {
            username: document.getElementById('username'),
            email: document.getElementById('email'),
            phone: document.getElementById('phone'),
            password: document.getElementById('password'),
            confirmPassword: document.getElementById('confirmPassword'),
            captcha: document.getElementById('captcha'),
            agreeTerms: document.getElementById('agreeTerms')
        };

        // 验证器
        this.validator = new FormValidator({
            username: {
                required: true,
                minLength: 3,
                maxLength: 20,
                pattern: {
                    value: /^[a-zA-Z0-9_]+$/,
                    message: '用户名只能包含字母、数字和下划线'
                }
            },
            email: {
                required: true,
                email: true
            },
            phone: {
                required: false,
                pattern: {
                    value: /^1[3-9]\d{9}$/,
                    message: '请输入正确的手机号码'
                }
            },
            password: {
                required: true,
                minLength: 8,
                pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: '密码必须包含大小写字母和数字'
                }
            },
            confirmPassword: {
                required: true,
                custom: (value) => {
                    if (value !== this.fields.password.value) {
                        return { isValid: false, message: '两次输入的密码不一致' };
                    }
                    return { isValid: true };
                }
            },
            captcha: {
                required: true,
                custom: (value) => {
                    if (!this.captchaGenerator.verify(value)) {
                        return { isValid: false, message: '验证码错误' };
                    }
                    return { isValid: true };
                }
            }
        });

        // 验证码生成器
        this.captchaGenerator = new CaptchaGenerator('captchaCanvas');
        
        // 状态
        this.isSubmitting = false;
        this.usernameCheckTimeout = null;
        
        this.init();
    }

    /**
     * 初始化注册控制器
     */
    init() {
        this.bindEvents();
        this.initPasswordToggles();
        this.initPasswordStrengthIndicator();
        this.generateCaptcha();
        this.showStep(1);
        
        // 聚焦第一个输入框
        setTimeout(() => {
            this.fields.username.focus();
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

        // 步骤导航
        this.bindStepNavigation();

        // 字段验证
        this.bindFieldValidation();

        // 用户名可用性检查
        this.fields.username.addEventListener('input', AuthUtils.debounce(() => {
            this.checkUsernameAvailability();
        }, 500));

        // 密码强度检查
        this.fields.password.addEventListener('input', () => {
            this.updatePasswordStrength();
            this.validateField('password');
        });

        // 确认密码验证
        this.fields.confirmPassword.addEventListener('input', () => {
            this.validateField('confirmPassword');
        });

        // 验证码刷新
        const captchaRefresh = document.querySelector('.captcha-refresh');
        captchaRefresh.addEventListener('click', () => {
            this.generateCaptcha();
        });

        // 协议链接
        this.bindAgreementLinks();
    }

    /**
     * 绑定步骤导航
     */
    bindStepNavigation() {
        // 下一步按钮
        const nextButtons = document.querySelectorAll('.next-step');
        nextButtons.forEach(button => {
            button.addEventListener('click', () => {
                const nextStep = parseInt(button.getAttribute('data-next'));
                this.goToStep(nextStep);
            });
        });

        // 上一步按钮
        const prevButtons = document.querySelectorAll('.prev-step');
        prevButtons.forEach(button => {
            button.addEventListener('click', () => {
                const prevStep = parseInt(button.getAttribute('data-prev'));
                this.goToStep(prevStep);
            });
        });

        // 进度步骤点击
        this.progressSteps.forEach((step, index) => {
            step.addEventListener('click', () => {
                if (index + 1 <= this.currentStep) {
                    this.goToStep(index + 1);
                }
            });
        });
    }

    /**
     * 绑定字段验证
     */
    bindFieldValidation() {
        Object.keys(this.fields).forEach(fieldName => {
            const field = this.fields[fieldName];
            if (!field || fieldName === 'agreeTerms') return;

            field.addEventListener('blur', () => {
                this.validateField(fieldName);
            });

            field.addEventListener('input', AuthUtils.debounce(() => {
                if (field.value.trim()) {
                    this.validateField(fieldName);
                }
            }, 300));
        });
    }

    /**
     * 初始化密码显示切换
     */
    initPasswordToggles() {
        const passwordContainers = document.querySelectorAll('.password-container');
        
        passwordContainers.forEach(container => {
            const input = container.querySelector('input');
            const toggleButton = container.querySelector('.password-toggle');
            
            if (toggleButton) {
                toggleButton.addEventListener('click', () => {
                    const isPassword = input.type === 'password';
                    input.type = isPassword ? 'text' : 'password';
                    
                    const icon = toggleButton.querySelector('i');
                    icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
                });
            }
        });
    }

    /**
     * 初始化密码强度指示器
     */
    initPasswordStrengthIndicator() {
        this.passwordStrength = {
            bar: document.querySelector('.strength-fill'),
            text: document.querySelector('.strength-level'),
            requirements: document.querySelectorAll('.requirement')
        };
    }

    /**
     * 更新密码强度
     */
    updatePasswordStrength() {
        const password = this.fields.password.value;
        const strength = this.calculatePasswordStrength(password);
        
        // 更新强度条
        this.passwordStrength.bar.style.width = `${strength.score}%`;
        this.passwordStrength.bar.className = `strength-fill ${strength.level}`;
        
        // 更新强度文本
        this.passwordStrength.text.textContent = strength.text;
        this.passwordStrength.text.className = `strength-level ${strength.level}`;
        
        // 更新要求列表
        this.updatePasswordRequirements(password);
    }

    /**
     * 计算密码强度
     */
    calculatePasswordStrength(password) {
        let score = 0;
        let level = 'weak';
        let text = '弱';

        if (password.length >= 8) score += 25;
        if (/[a-z]/.test(password)) score += 25;
        if (/[A-Z]/.test(password)) score += 25;
        if (/\d/.test(password)) score += 25;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;

        if (score >= 85) {
            level = 'strong';
            text = '强';
        } else if (score >= 60) {
            level = 'medium';
            text = '中';
        }

        return { score, level, text };
    }

    /**
     * 更新密码要求状态
     */
    updatePasswordRequirements(password) {
        const requirements = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            number: /\d/.test(password)
        };

        this.passwordStrength.requirements.forEach(req => {
            const rule = req.getAttribute('data-rule');
            const icon = req.querySelector('i');
            
            if (requirements[rule]) {
                req.classList.add('met');
                icon.className = 'fas fa-check';
            } else {
                req.classList.remove('met');
                icon.className = 'fas fa-times';
            }
        });
    }

    /**
     * 生成验证码
     */
    generateCaptcha() {
        this.captchaGenerator.generate();
        this.fields.captcha.value = '';
    }

    /**
     * 检查用户名可用性
     */
    async checkUsernameAvailability() {
        const username = this.fields.username.value.trim();
        
        if (!username || username.length < 3) return;

        const container = this.fields.username.closest('.form-group');
        const statusDiv = container.querySelector('.input-status');
        const loadingIcon = statusDiv.querySelector('.loading-icon');
        const successIcon = statusDiv.querySelector('.success-icon');
        const errorIcon = statusDiv.querySelector('.error-icon');

        // 显示加载状态
        loadingIcon.style.display = 'block';
        successIcon.style.display = 'none';
        errorIcon.style.display = 'none';

        try {
            const result = await AuthManager.checkUsername(username);
            
            if (result.available) {
                container.classList.add('valid');
                container.classList.remove('invalid');
                successIcon.style.display = 'block';
                loadingIcon.style.display = 'none';
            } else {
                container.classList.add('invalid');
                container.classList.remove('valid');
                errorIcon.style.display = 'block';
                loadingIcon.style.display = 'none';
                
                const feedback = container.querySelector('.form-feedback');
                feedback.textContent = result.message || '用户名已被使用';
            }
        } catch (error) {
            console.error('用户名检查失败:', error);
            loadingIcon.style.display = 'none';
        }
    }

    /**
     * 绑定协议链接
     */
    bindAgreementLinks() {
        const agreementLinks = document.querySelectorAll('.agreement-link');
        agreementLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const text = link.textContent;
                NotificationManager.info(`${text}页面即将上线，敬请期待！`);
            });
        });
    }

    /**
     * 验证字段
     */
    validateField(fieldName) {
        const field = this.fields[fieldName];
        const value = field.value.trim();
        const result = this.validator.validateField(fieldName, value);
        
        this.updateFieldUI(field, result);
        return result.isValid;
    }

    /**
     * 更新字段UI状态
     */
    updateFieldUI(field, result) {
        const container = field.closest('.form-group');
        const feedback = container.querySelector('.form-feedback');
        
        container.classList.remove('valid', 'invalid');
        
        if (result.isValid) {
            container.classList.add('valid');
            feedback.textContent = '';
        } else if (result.message) {
            container.classList.add('invalid');
            feedback.textContent = result.message;
        }
    }

    /**
     * 验证当前步骤
     */
    validateCurrentStep() {
        let isValid = true;
        
        switch (this.currentStep) {
            case 1:
                isValid = this.validateField('username') && 
                         this.validateField('email') && 
                         (this.fields.phone.value === '' || this.validateField('phone'));
                break;
            case 2:
                isValid = this.validateField('password') && 
                         this.validateField('confirmPassword') && 
                         this.validateField('captcha');
                break;
            case 3:
                isValid = this.fields.agreeTerms.checked;
                if (!isValid) {
                    NotificationManager.error('请同意用户服务协议和隐私政策');
                }
                break;
        }
        
        return isValid;
    }

    /**
     * 跳转到指定步骤
     */
    goToStep(step) {
        if (step > this.currentStep && !this.validateCurrentStep()) {
            return;
        }
        
        if (step < 1 || step > this.maxStep) return;
        
        this.showStep(step);
    }

    /**
     * 显示指定步骤
     */
    showStep(step) {
        // 隐藏所有步骤
        this.steps.forEach(stepEl => {
            stepEl.classList.remove('active');
        });
        
        // 显示目标步骤
        const targetStep = document.querySelector(`[data-step="${step}"]`);
        if (targetStep) {
            targetStep.classList.add('active');
        }
        
        // 更新进度指示器
        this.updateProgressIndicator(step);
        
        // 更新当前步骤
        this.currentStep = step;
        
        // 聚焦第一个输入框
        setTimeout(() => {
            const firstInput = targetStep.querySelector('input:not([disabled])');
            if (firstInput) {
                firstInput.focus();
            }
        }, 300);
    }

    /**
     * 更新进度指示器
     */
    updateProgressIndicator(step) {
        this.progressSteps.forEach((progressStep, index) => {
            const stepNumber = index + 1;
            
            if (stepNumber < step) {
                progressStep.classList.add('completed');
                progressStep.classList.remove('active');
            } else if (stepNumber === step) {
                progressStep.classList.add('active');
                progressStep.classList.remove('completed');
            } else {
                progressStep.classList.remove('active', 'completed');
            }
        });
    }

    /**
     * 处理表单提交
     */
    async handleSubmit() {
        if (this.isSubmitting) return;
        
        // 验证所有步骤
        if (!this.validateAllSteps()) {
            NotificationManager.error('请完善所有必填信息');
            return;
        }

        this.setSubmittingState(true);

        try {
            const formData = this.collectFormData();
            const response = await AuthManager.register(formData);

            if (response.success) {
                this.showSuccessModal();
                NotificationManager.success('注册成功！');
            } else {
                throw new Error(response.message || '注册失败');
            }
        } catch (error) {
            console.error('注册错误:', error);
            NotificationManager.error(error.message || '注册失败，请稍后重试');
        } finally {
            this.setSubmittingState(false);
        }
    }

    /**
     * 验证所有步骤
     */
    validateAllSteps() {
        const originalStep = this.currentStep;
        let allValid = true;

        for (let step = 1; step <= this.maxStep; step++) {
            this.currentStep = step;
            if (!this.validateCurrentStep()) {
                allValid = false;
                if (step !== originalStep) {
                    this.showStep(step);
                }
                break;
            }
        }

        if (allValid) {
            this.currentStep = originalStep;
        }

        return allValid;
    }

    /**
     * 收集表单数据
     */
    collectFormData() {
        return {
            username: this.fields.username.value.trim(),
            email: this.fields.email.value.trim(),
            phone: this.fields.phone.value.trim(),
            password: this.fields.password.value,
            agreeTerms: this.fields.agreeTerms.checked
        };
    }

    /**
     * 设置提交状态
     */
    setSubmittingState(isSubmitting) {
        this.isSubmitting = isSubmitting;
        const submitButton = document.getElementById('registerButton');
        
        submitButton.disabled = isSubmitting;
        
        const buttonText = submitButton.querySelector('.button-text');
        const buttonLoader = submitButton.querySelector('.button-loader');
        
        if (isSubmitting) {
            buttonText.style.opacity = '0';
            buttonLoader.style.opacity = '1';
            submitButton.classList.add('loading');
        } else {
            buttonText.style.opacity = '1';
            buttonLoader.style.opacity = '0';
            submitButton.classList.remove('loading');
        }
    }

    /**
     * 显示成功模态框
     */
    showSuccessModal() {
        const modal = document.getElementById('successModal');
        modal.style.display = 'flex';
        
        // 播放成功动画
        setTimeout(() => {
            modal.classList.add('show');
        }, 100);
        
        // 添加庆祝效果
        this.addCelebrationEffect();
    }

    /**
     * 添加庆祝效果
     */
    addCelebrationEffect() {
        // 创建彩带动画
        for (let i = 0; i < 20; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: ${['#4fc3f7', '#29b6f6', '#2962ff', '#ffd54f', '#ff8a65'][Math.floor(Math.random() * 5)]};
                top: -10px;
                left: ${Math.random() * 100}vw;
                z-index: 10000;
                animation: confetti-fall ${Math.random() * 2 + 2}s linear forwards;
            `;
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, 4000);
        }
    }

    /**
     * 重置表单
     */
    resetForm() {
        this.form.reset();
        this.showStep(1);
        this.generateCaptcha();
        
        // 清除验证状态
        const formGroups = this.form.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            group.classList.remove('valid', 'invalid');
            const feedback = group.querySelector('.form-feedback');
            if (feedback) feedback.textContent = '';
        });
    }
}

// 页面加载完成后初始化注册控制器
document.addEventListener('DOMContentLoaded', () => {
    // 检查是否已经登录
    if (AuthManager.isAuthenticated()) {
        NotificationManager.info('您已经登录，正在跳转...');
        setTimeout(() => {
            window.location.href = '../dashboard.html';
        }, 1000);
        return;
    }

    // 初始化注册控制器
    const registerController = new RegisterController();
    
    // 监听认证事件
    AuthManager.onAuthEvent('register', (event) => {
        console.log('用户注册成功:', event.detail);
    });

    // 添加CSS动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes confetti-fall {
            0% {
                transform: translateY(-10px) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(100vh) rotate(360deg);
                opacity: 0;
            }
        }
        
        .requirement.met {
            color: #4caf50;
        }
        
        .requirement.met i {
            color: #4caf50;
        }
        
        .strength-fill.weak {
            background: linear-gradient(90deg, #f44336, #ff9800);
        }
        
        .strength-fill.medium {
            background: linear-gradient(90deg, #ff9800, #ffc107);
        }
        
        .strength-fill.strong {
            background: linear-gradient(90deg, #4caf50, #8bc34a);
        }
        
        .strength-level.weak {
            color: #f44336;
        }
        
        .strength-level.medium {
            color: #ff9800;
        }
        
        .strength-level.strong {
            color: #4caf50;
        }
        
        .modal.show {
            opacity: 1;
            pointer-events: all;
        }
        
        .modal.show .modal-content {
            transform: translateY(0) scale(1);
        }
    `;
    document.head.appendChild(style);
});

// 导出注册控制器供测试使用
window.RegisterController = RegisterController;
