/**
 * 表单验证工具类
 * Form Validation Utilities for 身法俱乐部 Authentication System
 */

class FormValidator {
    constructor() {
        this.rules = {
            username: {
                required: true,
                minLength: 3,
                maxLength: 20,
                pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/,
                message: '用户名长度3-20位，只能包含字母、数字、下划线和中文'
            },
            email: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: '请输入有效的邮箱地址'
            },
            password: {
                required: true,
                minLength: 6,
                maxLength: 32,
                message: '密码长度6-32位'
            },
            confirmPassword: {
                required: true,
                match: 'password',
                message: '两次输入的密码不一致'
            },
            phone: {
                required: false,
                pattern: /^1[3-9]\d{9}$/,
                message: '请输入有效的手机号码'
            },
            captcha: {
                required: true,
                length: 4,
                message: '请输入4位验证码'
            }
        };

        this.errorMessages = {
            required: '此字段为必填项',
            minLength: '长度不能少于{min}位',
            maxLength: '长度不能超过{max}位',
            pattern: '格式不正确',
            match: '两次输入不一致',
            length: '长度必须为{length}位'
        };
    }

    /**
     * 验证单个字段
     * @param {string} fieldName 字段名
     * @param {string} value 字段值
     * @param {object} formData 完整表单数据（用于匹配验证）
     * @returns {object} 验证结果
     */
    validateField(fieldName, value, formData = {}) {
        const rule = this.rules[fieldName];
        if (!rule) {
            return { valid: true };
        }

        const result = {
            valid: true,
            errors: []
        };

        // 必填验证
        if (rule.required && (!value || value.trim() === '')) {
            result.valid = false;
            result.errors.push(this.errorMessages.required);
            return result;
        }

        // 如果不是必填且值为空，则跳过其他验证
        if (!rule.required && (!value || value.trim() === '')) {
            return result;
        }

        // 最小长度验证
        if (rule.minLength && value.length < rule.minLength) {
            result.valid = false;
            result.errors.push(
                this.errorMessages.minLength.replace('{min}', rule.minLength)
            );
        }

        // 最大长度验证
        if (rule.maxLength && value.length > rule.maxLength) {
            result.valid = false;
            result.errors.push(
                this.errorMessages.maxLength.replace('{max}', rule.maxLength)
            );
        }

        // 固定长度验证
        if (rule.length && value.length !== rule.length) {
            result.valid = false;
            result.errors.push(
                this.errorMessages.length.replace('{length}', rule.length)
            );
        }

        // 正则表达式验证
        if (rule.pattern && !rule.pattern.test(value)) {
            result.valid = false;
            result.errors.push(rule.message || this.errorMessages.pattern);
        }

        // 匹配验证（如确认密码）
        if (rule.match && value !== formData[rule.match]) {
            result.valid = false;
            result.errors.push(rule.message || this.errorMessages.match);
        }

        return result;
    }

    /**
     * 验证整个表单
     * @param {object} formData 表单数据
     * @param {array} fieldNames 要验证的字段名数组
     * @returns {object} 验证结果
     */
    validateForm(formData, fieldNames = null) {
        const fieldsToValidate = fieldNames || Object.keys(this.rules);
        const result = {
            valid: true,
            errors: {}
        };

        fieldsToValidate.forEach(fieldName => {
            const fieldResult = this.validateField(
                fieldName, 
                formData[fieldName] || '', 
                formData
            );
            
            if (!fieldResult.valid) {
                result.valid = false;
                result.errors[fieldName] = fieldResult.errors;
            }
        });

        return result;
    }

    /**
     * 密码强度检测
     * @param {string} password 密码
     * @returns {object} 强度信息
     */
    checkPasswordStrength(password) {
        if (!password) {
            return { score: 0, level: 'none', message: '请输入密码' };
        }

        let score = 0;
        const checks = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            numbers: /\d/.test(password),
            symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password),
            noRepeats: !/(.)\1{2,}/.test(password)
        };

        // 计算分数
        if (checks.length) score += 2;
        if (checks.lowercase) score += 1;
        if (checks.uppercase) score += 1;
        if (checks.numbers) score += 1;
        if (checks.symbols) score += 2;
        if (checks.noRepeats) score += 1;

        // 确定强度等级
        let level, message;
        if (score < 3) {
            level = 'weak';
            message = '密码强度：弱';
        } else if (score < 6) {
            level = 'medium';
            message = '密码强度：中等';
        } else {
            level = 'strong';
            message = '密码强度：强';
        }

        return {
            score,
            level,
            message,
            checks,
            suggestions: this.getPasswordSuggestions(checks)
        };
    }

    /**
     * 获取密码改进建议
     * @param {object} checks 密码检查结果
     * @returns {array} 建议列表
     */
    getPasswordSuggestions(checks) {
        const suggestions = [];
        
        if (!checks.length) {
            suggestions.push('密码长度至少8位');
        }
        if (!checks.lowercase) {
            suggestions.push('包含小写字母');
        }
        if (!checks.uppercase) {
            suggestions.push('包含大写字母');
        }
        if (!checks.numbers) {
            suggestions.push('包含数字');
        }
        if (!checks.symbols) {
            suggestions.push('包含特殊字符');
        }
        if (!checks.noRepeats) {
            suggestions.push('避免连续重复字符');
        }

        return suggestions;
    }

    /**
     * 邮箱格式验证
     * @param {string} email 邮箱地址
     * @returns {boolean} 是否有效
     */
    isValidEmail(email) {
        const result = this.validateField('email', email);
        return result.valid;
    }

    /**
     * 用户名格式验证
     * @param {string} username 用户名
     * @returns {boolean} 是否有效
     */
    isValidUsername(username) {
        const result = this.validateField('username', username);
        return result.valid;
    }

    /**
     * 手机号验证
     * @param {string} phone 手机号
     * @returns {boolean} 是否有效
     */
    isValidPhone(phone) {
        const result = this.validateField('phone', phone);
        return result.valid;
    }

    /**
     * 实时验证辅助函数
     * @param {HTMLElement} input 输入框元素
     * @param {string} fieldName 字段名
     * @param {object} formData 表单数据
     * @param {function} callback 验证结果回调
     */
    setupRealTimeValidation(input, fieldName, formData, callback) {
        const validate = () => {
            const result = this.validateField(fieldName, input.value, formData);
            if (callback) {
                callback(result, input);
            }
        };

        // 监听输入事件
        input.addEventListener('input', validate);
        input.addEventListener('blur', validate);
        
        return validate;
    }

    /**
     * 为表单输入框添加视觉反馈
     * @param {HTMLElement} input 输入框
     * @param {object} validationResult 验证结果
     */
    updateInputVisualFeedback(input, validationResult) {
        const container = input.closest('.form-group');
        const existingError = container.querySelector('.field-error');
        const existingSuccess = container.querySelector('.field-success');

        // 清除现有反馈
        if (existingError) existingError.remove();
        if (existingSuccess) existingSuccess.remove();
        input.classList.remove('error', 'success');

        if (!validationResult.valid) {
            // 显示错误状态
            input.classList.add('error');
            const errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${validationResult.errors[0]}`;
            container.appendChild(errorElement);
        } else if (input.value) {
            // 显示成功状态（仅当有输入时）
            input.classList.add('success');
            const successElement = document.createElement('div');
            successElement.className = 'field-success';
            successElement.innerHTML = '<i class="fas fa-check-circle"></i> 格式正确';
            container.appendChild(successElement);
        }
    }
}

/**
 * 验证码生成器
 */
class CaptchaGenerator {
    constructor() {
        this.chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        this.length = 4;
    }

    /**
     * 生成验证码
     * @returns {string} 验证码
     */
    generate() {
        let result = '';
        for (let i = 0; i < this.length; i++) {
            result += this.chars.charAt(Math.floor(Math.random() * this.chars.length));
        }
        return result;
    }

    /**
     * 渲染验证码图片
     * @param {string} code 验证码
     * @param {HTMLElement} container 容器元素
     */
    render(code, container) {
        container.innerHTML = '';
        container.style.cssText = `
            background: linear-gradient(45deg, #2962ff, #29b6f6);
            color: white;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            letter-spacing: 3px;
            transform: skew(-5deg);
        `;
        
        container.textContent = code;
        container.setAttribute('data-code', code);
    }

    /**
     * 验证验证码
     * @param {string} input 用户输入
     * @param {string} correct 正确答案
     * @returns {boolean} 是否正确
     */
    verify(input, correct) {
        return input.toUpperCase() === correct.toUpperCase();
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FormValidator, CaptchaGenerator };
} else {
    window.FormValidator = FormValidator;
    window.CaptchaGenerator = CaptchaGenerator;
}
