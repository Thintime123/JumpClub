// 玩家详情模态框模块
class PlayerModal {
    constructor() {
        this.modal = document.getElementById('playerModal');
        this.nameElement = document.getElementById('modalPlayerName');
        this.periodElement = document.getElementById('modalPlayerPeriod');
        this.detailsElement = document.getElementById('modalPlayerDetails');
        this.closeBtn = document.getElementById('closeModal');
        
        this.initEvents();
    }

    // 初始化事件监听
    initEvents() {
        // 关闭按钮事件
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                this.hideModal();
            });
        }

        // 点击背景关闭模态框
        window.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.hideModal();
            }
        });

        // 赞助模态框事件
        this.initSponsorModal();
    }

    // 初始化赞助模态框
    initSponsorModal() {
        const supportBtn = document.getElementById('supportBtn');
        const sponsorModal = document.getElementById('sponsorModal');
        const closeSponsorBtn = document.getElementById('closeSponsorModal');

        if (supportBtn) {
            supportBtn.addEventListener('click', () => {
                sponsorModal.style.display = 'flex';
            });
        }

        if (closeSponsorBtn) {
            closeSponsorBtn.addEventListener('click', () => {
                sponsorModal.style.display = 'none';
            });
        }

        // 点击背景关闭赞助模态框
        window.addEventListener('click', (event) => {
            if (event.target === sponsorModal) {
                sponsorModal.style.display = 'none';
            }
        });
    }

    // 显示玩家详情
    showPlayerDetails(playerName) {
        if (!this.modal || !this.nameElement || !this.detailsElement) return;

        this.nameElement.textContent = playerName;
        
        // 检查是否有详情数据
        if (playerDetails[playerName]) {
            const details = playerDetails[playerName];
            this.periodElement.textContent = `活跃时期: ${details.period}`;
            
            let detailsHTML = '';
            
            // 添加评分项
            detailsHTML += '<div class="rating-container">';
            for (const [key, value] of Object.entries(details.details)) {
                if (key !== '评价') {
                    detailsHTML += `
                        <div class="rating-item">
                            <div class="rating-label">${key}</div>
                            <div class="rating-value">${value}</div>
                        </div>
                    `;
                }
            }
            detailsHTML += '</div>';
            
            // 添加评价
            if (details.details['评价']) {
                detailsHTML += `
                    <div class="detail-item">
                        <h3 class="detail-title"><i class="fas fa-star"></i> 玩家评价</h3>
                        <div class="detail-content">${details.details['评价']}</div>
                    </div>
                `;
            }
            
            this.detailsElement.innerHTML = detailsHTML;
        } else {
            // 没有详情数据的情况
            this.periodElement.textContent = '';
            this.detailsElement.innerHTML = `
                <div class="no-detail">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>信息未收录</h3>
                    <p>该人物 "${playerName}" 的详细信息尚未收录，我们的团队正在努力完善资料库，请后续关注更新。</p>
                </div>
                <div class="rating-form" style="margin-top: 30px;">
                    <h3 class="detail-title"><i class="fas fa-star"></i> 用户评分</h3>
                    <p style="margin-bottom: 15px; color: #bbdefb;">为该玩家评分，帮助完善资料库</p>
                    <div class="rating-form">
                        <div class="rating-item">
                            <label class="rating-label">人品:</label>
                            <div class="rating-stars" data-category="人品">
                                <i class="far fa-star rating-star"></i>
                                <i class="far fa-star rating-star"></i>
                                <i class="far fa-star rating-star"></i>
                                <i class="far fa-star rating-star"></i>
                                <i class="far fa-star rating-star"></i>
                            </div>
                        </div>
                        <div class="rating-item">
                            <label class="rating-label">素质:</label>
                            <div class="rating-stars" data-category="素质">
                                <i class="far fa-star rating-star"></i>
                                <i class="far fa-star rating-star"></i>
                                <i class="far fa-star rating-star"></i>
                                <i class="far fa-star rating-star"></i>
                                <i class="far fa-star rating-star"></i>
                            </div>
                        </div>
                        <div class="rating-item">
                            <label class="rating-label">技术:</label>
                            <div class="rating-stars" data-category="技术">
                                <i class="far fa-star rating-star"></i>
                                <i class="far fa-star rating-star"></i>
                                <i class="far fa-star rating-star"></i>
                                <i class="far fa-star rating-star"></i>
                                <i class="far fa-star rating-star"></i>
                            </div>
                        </div>
                        <div class="rating-item">
                            <label class="rating-label">创作领域:</label>
                            <div class="rating-stars" data-category="创作领域">
                                <i class="far fa-star rating-star"></i>
                                <i class="far fa-star rating-star"></i>
                                <i class="far fa-star rating-star"></i>
                                <i class="far fa-star rating-star"></i>
                                <i class="far fa-star rating-star"></i>
                            </div>
                        </div>
                        <div class="rating-item">
                            <label class="rating-label">身法天赋:</label>
                            <div class="rating-stars" data-category="身法天赋">
                                <i class="far fa-star rating-star"></i>
                                <i class="far fa-star rating-star"></i>
                                <i class="far fa-star rating-star"></i>
                                <i class="far fa-star rating-star"></i>
                                <i class="far fa-star rating-star"></i>
                            </div>
                        </div>
                        <div class="rating-item">
                            <label class="rating-label">知名度:</label>
                            <div class="rating-stars" data-category="知名度">
                                <i class="far fa-star rating-star"></i>
                                <i class="far fa-star rating-star"></i>
                                <i class="far fa-star rating-star"></i>
                                <i class="far fa-star rating-star"></i>
                                <i class="far fa-star rating-star"></i>
                            </div>
                        </div>
                    </div>
                    <div class="rating-actions">
                        <button class="rating-btn cancel">取消</button>
                        <button class="rating-btn submit-player-rating">提交评分</button>
                    </div>
                </div>
            `;

            // 为模态框中的评分添加事件
            this.initModalRatingEvents(playerName);
        }
        
        this.showModal();
    }

    // 初始化模态框内的评分事件
    initModalRatingEvents(playerName) {
        const modalStars = this.detailsElement.querySelectorAll('.rating-star');
        modalStars.forEach(star => {
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
        });
        
        // 提交评分按钮
        const submitBtn = this.detailsElement.querySelector('.submit-player-rating');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                // 收集评分数据
                const ratings = {};
                const ratingContainers = this.detailsElement.querySelectorAll('.rating-stars');
                
                ratingContainers.forEach(container => {
                    const category = container.getAttribute('data-category');
                    const activeStars = container.querySelectorAll('.rating-star.active').length;
                    ratings[category] = activeStars;
                });
                
                // 检查是否所有类别都有评分
                const allRated = Object.values(ratings).every(rating => rating > 0);
                
                if (!allRated) {
                    alert('请为所有类别评分！');
                    return;
                }
                
                // 在实际应用中，这里会将数据发送到服务器
                alert(`为${playerName}的评分提交成功！感谢您的参与！`);
                
                // 关闭模态框
                this.hideModal();
            });
        }
        
        // 取消评分按钮
        const cancelBtn = this.detailsElement.querySelector('.rating-btn.cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                // 重置评分
                const modalStars = this.detailsElement.querySelectorAll('.rating-star');
                modalStars.forEach(star => {
                    star.classList.remove('fas', 'active');
                    star.classList.add('far');
                });
            });
        }
    }

    // 显示模态框
    showModal() {
        if (this.modal) {
            this.modal.style.display = 'flex';
        }
    }

    // 隐藏模态框
    hideModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    }
}

// 导出模块
window.PlayerModal = PlayerModal;
