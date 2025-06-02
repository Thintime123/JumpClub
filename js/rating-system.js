// 评分系统模块
class RatingSystem {
    constructor() {
        this.ratingContainer = document.querySelector('.rating-system');
        this.initEvents();
    }

    // 初始化事件监听
    initEvents() {
        this.initStarRating();
        this.initSubmitButton();
        this.initCancelButton();
    }

    // 初始化星级评分功能
    initStarRating() {
        const stars = document.querySelectorAll('.rating-system .rating-star');
        stars.forEach(star => {
            star.addEventListener('click', function() {
                const container = this.parentElement;
                const stars = container.querySelectorAll('.rating-star');
                const index = Array.from(stars).indexOf(this);
                
                // 重置所有星星
                stars.forEach(s => {
                    s.classList.remove('fas', 'active');
                    s.classList.add('far');
                });
                
                // 点亮点击的星星及其之前的星星
                for (let i = 0; i <= index; i++) {
                    stars[i].classList.remove('far');
                    stars[i].classList.add('fas', 'active');
                }
            });

            // 添加悬停效果
            star.addEventListener('mouseenter', function() {
                const container = this.parentElement;
                const stars = container.querySelectorAll('.rating-star');
                const index = Array.from(stars).indexOf(this);
                
                // 临时高亮
                stars.forEach((s, i) => {
                    if (i <= index) {
                        s.style.color = '#FFD700';
                        s.style.transform = 'scale(1.1)';
                    } else {
                        s.style.color = '';
                        s.style.transform = '';
                    }
                });
            });

            star.addEventListener('mouseleave', function() {
                const container = this.parentElement;
                const stars = container.querySelectorAll('.rating-star');
                
                // 恢复原状
                stars.forEach(s => {
                    if (!s.classList.contains('active')) {
                        s.style.color = '';
                        s.style.transform = '';
                    }
                });
            });
        });
    }

    // 初始化提交按钮
    initSubmitButton() {
        const submitBtn = document.querySelector('.rating-system .rating-btn:not(.cancel)');
        if (!submitBtn) return;

        submitBtn.addEventListener('click', () => {
            // 收集评分数据
            const ratings = this.collectRatings();
            
            // 检查是否所有类别都有评分
            const allRated = Object.values(ratings).every(rating => rating > 0);
            
            if (!allRated) {
                alert('请为所有类别评分！');
                return;
            }
            
            // 在实际应用中，这里会将数据发送到服务器
            console.log('提交的评分数据:', ratings);
            alert('评分提交成功！感谢您的参与！');
            
            // 重置评分
            this.resetRatings();
        });
    }

    // 初始化取消按钮
    initCancelButton() {
        const cancelBtn = document.querySelector('.rating-system .rating-btn.cancel');
        if (!cancelBtn) return;

        cancelBtn.addEventListener('click', () => {
            this.resetRatings();
        });
    }

    // 收集评分数据
    collectRatings() {
        const ratings = {};
        const ratingContainers = document.querySelectorAll('.rating-system .rating-stars');
        
        ratingContainers.forEach(container => {
            const category = container.getAttribute('data-category');
            const activeStars = container.querySelectorAll('.rating-star.active').length;
            ratings[category] = activeStars;
        });
        
        return ratings;
    }

    // 重置评分
    resetRatings() {
        const stars = document.querySelectorAll('.rating-system .rating-star');
        stars.forEach(star => {
            star.classList.remove('fas', 'active');
            star.classList.add('far');
            star.style.color = '';
            star.style.transform = '';
        });
    }

    // 设置评分
    setRating(category, rating) {
        const container = document.querySelector(`.rating-system .rating-stars[data-category="${category}"]`);
        if (!container) return;

        const stars = container.querySelectorAll('.rating-star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.remove('far');
                star.classList.add('fas', 'active');
            } else {
                star.classList.remove('fas', 'active');
                star.classList.add('far');
            }
        });
    }

    // 获取指定类别的评分
    getRating(category) {
        const container = document.querySelector(`.rating-system .rating-stars[data-category="${category}"]`);
        if (!container) return 0;

        return container.querySelectorAll('.rating-star.active').length;
    }

    // 获取所有评分
    getAllRatings() {
        return this.collectRatings();
    }

    // 检查是否有评分
    hasAnyRating() {
        const ratings = this.collectRatings();
        return Object.values(ratings).some(rating => rating > 0);
    }

    // 检查是否所有类别都有评分
    hasAllRatings() {
        const ratings = this.collectRatings();
        return Object.values(ratings).every(rating => rating > 0);
    }
}

// 导出模块
window.RatingSystem = RatingSystem;
