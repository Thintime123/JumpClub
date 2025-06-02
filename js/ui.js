// UI交互模块
class UIController {
    constructor() {
        this.initTabs();
        this.initSearch();
        this.initScrollTop();
    }

    // 初始化标签页功能
    initTabs() {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // 移除所有active类
                tabs.forEach(t => t.classList.remove('active'));
                // 为当前标签添加active类
                this.classList.add('active');
                
                // 滚动到对应区域
                const targetId = this.getAttribute('data-target');
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    // 初始化搜索功能
    initSearch() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.trim().toLowerCase();
            const allPlayerCards = document.querySelectorAll('.player-card');
            
            if (searchTerm === '') {
                allPlayerCards.forEach(card => {
                    card.style.display = 'block';
                    // 清除高亮
                    const nameElement = card.querySelector('.player-name');
                    if (nameElement) {
                        nameElement.innerHTML = nameElement.textContent;
                    }
                });
                return;
            }
            
            allPlayerCards.forEach(card => {
                const nameElement = card.querySelector('.player-name');
                if (!nameElement) return;

                const playerName = nameElement.textContent.toLowerCase();
                if (playerName.includes(searchTerm)) {
                    card.style.display = 'block';
                    
                    // 高亮匹配部分
                    const originalName = nameElement.textContent;
                    const regex = new RegExp(`(${searchTerm})`, 'gi');
                    const highlighted = originalName.replace(regex, '<span class="highlight">$1</span>');
                    nameElement.innerHTML = highlighted;
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // 初始化置顶按钮
    initScrollTop() {
        const scrollTopBtn = document.getElementById('scrollTop');
        if (!scrollTopBtn) return;

        // 监听滚动事件
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        });

        // 点击置顶按钮
        scrollTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // 渲染玩家列表
    renderPlayers(sectionId, players) {
        const container = document.querySelector(`#${sectionId} .players-container`);
        if (!container) return;

        container.innerHTML = '';
        
        players.forEach(player => {
            const isDetailed = playersData.detailedPlayers.includes(player.name);
            const playerCard = this.createPlayerCard(player.name, player.period, isDetailed);
            container.appendChild(playerCard);
        });
    }

    // 创建玩家卡片
    createPlayerCard(name, period, isDetailed = false) {
        const card = document.createElement('div');
        card.className = 'player-card';
        
        // 添加详情人物特殊样式
        if (isDetailed) {
            card.classList.add('detailed');
        }
        
        card.innerHTML = `
            ${isDetailed ? 
                '<div class="stars-container">' + 
                '<i class="fas fa-star star"></i>'.repeat(6) + 
                '</div>' : 
                ''
            }
            <div class="player-name">${name}</div>
            <div class="player-period">${period}</div>
        `;
        
        card.addEventListener('click', function() {
            if (window.playerModal) {
                window.playerModal.showPlayerDetails(name);
            }
        });
        
        return card;
    }

    // 渲染所有区域的玩家
    renderAllPlayers() {
        // 渲染各区域玩家
        this.renderPlayers('variation', playersData.variation);
        this.renderPlayers('hide-seek', playersData.hideSeek);
        this.renderPlayers('extreme', playersData.extreme);
        this.renderPlayers('jump-points', playersData.jumpPoints);
        
        // 渲染荣誉提名
        const honoraryContainer = document.querySelector('#honorary .players-container');
        if (honoraryContainer) {
            honoraryContainer.innerHTML = '';
            playersData.honorary.forEach(player => {
                const playerCard = this.createPlayerCard(player, "荣誉提名", false);
                honoraryContainer.appendChild(playerCard);
            });
        }
        
        // 渲染详情人物一览表
        this.renderDetailPlayers();
    }

    // 渲染详情人物一览表
    renderDetailPlayers() {
        const detailPlayersContainer = document.querySelector('#detail-players .players-container');
        if (!detailPlayersContainer) return;

        // 收集所有人物（去重）
        const allPlayersSet = new Set();
        
        // 添加各个分类的玩家
        playersData.variation.forEach(p => allPlayersSet.add(p.name));
        playersData.hideSeek.forEach(p => allPlayersSet.add(p.name));
        playersData.extreme.forEach(p => allPlayersSet.add(p.name));
        playersData.jumpPoints.forEach(p => allPlayersSet.add(p.name));
        playersData.honorary.forEach(p => allPlayersSet.add(p));
        playersData.detailedPlayers.forEach(p => allPlayersSet.add(p));
        
        // 转换为数组并排序
        const allPlayersArray = Array.from(allPlayersSet).sort((a, b) => a.localeCompare(b, 'zh-CN'));
        
        // 清空容器
        detailPlayersContainer.innerHTML = '';
        
        // 渲染详情人物一览表
        allPlayersArray.forEach(playerName => {
            // 获取玩家活跃时期
            let period = "未知";
            if (playerDetails[playerName]) {
                period = playerDetails[playerName].period;
            } else {
                // 尝试从其他分类中获取时期
                const foundInVariation = playersData.variation.find(p => p.name === playerName);
                const foundInHideSeek = playersData.hideSeek.find(p => p.name === playerName);
                const foundInExtreme = playersData.extreme.find(p => p.name === playerName);
                const foundInJumpPoints = playersData.jumpPoints.find(p => p.name === playerName);
                
                if (foundInVariation) period = foundInVariation.period;
                else if (foundInHideSeek) period = foundInHideSeek.period;
                else if (foundInExtreme) period = foundInExtreme.period;
                else if (foundInJumpPoints) period = foundInJumpPoints.period;
                else period = "荣誉提名";
            }
            
            // 判断是否为详情人物
            const isDetailed = playersData.detailedPlayers.includes(playerName);
            
            const playerCard = this.createPlayerCard(playerName, period, isDetailed);
            detailPlayersContainer.appendChild(playerCard);
        });
    }
}

// 创建全局UI控制器实例
window.uiController = new UIController();
