// 评论系统模块
class CommentSystem {
    constructor() {
        this.commentsContainer = document.getElementById('commentsList');
        this.commentForm = document.querySelector('.comment-form');
        this.nameInput = document.getElementById('commentName');
        this.contentInput = document.getElementById('commentContent');
        this.submitBtn = document.getElementById('submitComment');
        this.clearBtn = document.querySelector('.comment-form .rating-btn.cancel');
        
        this.initEvents();
        this.loadComments();
    }

    // 初始化事件监听
    initEvents() {
        // 提交评论按钮
        if (this.submitBtn) {
            this.submitBtn.addEventListener('click', () => {
                this.handleSubmitComment();
            });
        }

        // 清空表单按钮
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => {
                this.clearForm();
            });
        }

        // 回车提交评论
        if (this.contentInput) {
            this.contentInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    this.handleSubmitComment();
                }
            });
        }
    }

    // 处理提交评论
    handleSubmitComment() {
        const name = this.nameInput ? this.nameInput.value.trim() : '';
        const content = this.contentInput ? this.contentInput.value.trim() : '';
        
        if (!name || !content) {
            alert('请填写昵称和评论内容！');
            return;
        }

        if (name.length > 20) {
            alert('昵称不能超过20个字符！');
            return;
        }

        if (content.length > 500) {
            alert('评论内容不能超过500个字符！');
            return;
        }
        
        this.addComment(name, content);
        this.clearForm();
    }

    // 添加评论
    addComment(author, content) {
        const comment = {
            id: Date.now(),
            author: this.sanitizeInput(author),
            content: this.sanitizeInput(content),
            date: new Date().toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }),
            likes: 0
        };
        
        // 保存到本地存储
        let comments = this.getComments();
        comments.push(comment);
        this.saveComments(comments);
        
        // 重新加载评论
        this.loadComments();
        
        // 显示成功消息
        this.showMessage('评论发布成功！', 'success');
    }

    // 加载评论
    loadComments() {
        if (!this.commentsContainer) return;

        const comments = this.getComments();
        
        if (comments.length === 0) {
            this.commentsContainer.innerHTML = `
                <div class="no-comments">
                    <i class="fas fa-comment-slash" style="font-size: 3rem; margin-bottom: 15px;"></i>
                    <p>暂无评论，成为第一个评论者！</p>
                </div>
            `;
            return;
        }
        
        this.commentsContainer.innerHTML = '';
        
        // 按时间倒序排序
        comments.sort((a, b) => b.id - a.id);
        
        comments.forEach(comment => {
            const commentElement = this.createCommentElement(comment);
            this.commentsContainer.appendChild(commentElement);
        });
    }

    // 创建评论元素
    createCommentElement(comment) {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        commentElement.innerHTML = `
            <div class="comment-header">
                <div class="comment-author">${comment.author}</div>
                <div class="comment-date">${comment.date}</div>
            </div>
            <div class="comment-content">${comment.content}</div>
            <div class="comment-actions">
                <div class="comment-action like-comment" data-id="${comment.id}">
                    <i class="far fa-thumbs-up"></i> <span>${comment.likes || 0}</span>
                </div>
                <div class="comment-action reply-comment" data-id="${comment.id}">
                    <i class="far fa-comment"></i> 回复
                </div>
                <div class="comment-action delete-comment" data-id="${comment.id}">
                    <i class="far fa-trash-alt"></i> 删除
                </div>
            </div>
        `;

        // 添加事件监听
        this.addCommentEvents(commentElement, comment.id);
        
        return commentElement;
    }

    // 添加评论事件
    addCommentEvents(commentElement, commentId) {
        // 点赞事件
        const likeBtn = commentElement.querySelector('.like-comment');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => {
                this.likeComment(commentId);
            });
        }

        // 回复事件
        const replyBtn = commentElement.querySelector('.reply-comment');
        if (replyBtn) {
            replyBtn.addEventListener('click', () => {
                this.replyToComment(commentId);
            });
        }

        // 删除事件
        const deleteBtn = commentElement.querySelector('.delete-comment');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.deleteComment(commentId);
            });
        }
    }

    // 点赞评论
    likeComment(commentId) {
        let comments = this.getComments();
        const commentIndex = comments.findIndex(c => c.id === commentId);
        
        if (commentIndex !== -1) {
            // 检查是否已经点赞过
            const likedComments = JSON.parse(localStorage.getItem('likedComments')) || [];
            if (likedComments.includes(commentId)) {
                this.showMessage('您已经点赞过这条评论了！', 'warning');
                return;
            }

            // 增加点赞数
            comments[commentIndex].likes = (comments[commentIndex].likes || 0) + 1;
            this.saveComments(comments);
            
            // 记录点赞状态
            likedComments.push(commentId);
            localStorage.setItem('likedComments', JSON.stringify(likedComments));
            
            // 更新显示
            this.loadComments();
            this.showMessage('点赞成功！', 'success');
        }
    }

    // 回复评论
    replyToComment(commentId) {
        const comments = this.getComments();
        const comment = comments.find(c => c.id === commentId);
        
        if (comment && this.contentInput) {
            this.contentInput.value = `@${comment.author} `;
            this.contentInput.focus();
        }
    }

    // 删除评论
    deleteComment(commentId) {
        if (!confirm('确定要删除这条评论吗？此操作不可撤销。')) {
            return;
        }

        let comments = this.getComments();
        comments = comments.filter(c => c.id !== commentId);
        this.saveComments(comments);
        
        // 更新显示
        this.loadComments();
        this.showMessage('评论已删除！', 'success');
    }

    // 清空表单
    clearForm() {
        if (this.nameInput) this.nameInput.value = '';
        if (this.contentInput) this.contentInput.value = '';
    }

    // 获取评论数据
    getComments() {
        try {
            return JSON.parse(localStorage.getItem('jumpclub_comments')) || [];
        } catch (e) {
            console.error('读取评论数据失败:', e);
            return [];
        }
    }

    // 保存评论数据
    saveComments(comments) {
        try {
            localStorage.setItem('jumpclub_comments', JSON.stringify(comments));
        } catch (e) {
            console.error('保存评论数据失败:', e);
            alert('保存评论失败，可能是存储空间不足！');
        }
    }

    // 输入内容净化
    sanitizeInput(input) {
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    // 显示消息
    showMessage(message, type = 'info') {
        // 创建消息元素
        const messageElement = document.createElement('div');
        messageElement.className = `message message-${type}`;
        messageElement.textContent = message;
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            transition: all 0.3s ease;
            ${type === 'success' ? 'background: #4caf50;' : ''}
            ${type === 'warning' ? 'background: #ff9800;' : ''}
            ${type === 'error' ? 'background: #f44336;' : ''}
            ${type === 'info' ? 'background: #2196f3;' : ''}
        `;

        document.body.appendChild(messageElement);

        // 3秒后自动移除
        setTimeout(() => {
            messageElement.style.opacity = '0';
            messageElement.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.parentNode.removeChild(messageElement);
                }
            }, 300);
        }, 3000);
    }

    // 获取评论统计
    getCommentStats() {
        const comments = this.getComments();
        return {
            total: comments.length,
            totalLikes: comments.reduce((sum, comment) => sum + (comment.likes || 0), 0),
            mostLiked: comments.reduce((max, comment) => 
                (comment.likes || 0) > (max.likes || 0) ? comment : max, {}),
            recent: comments.slice(-5).reverse()
        };
    }

    // 清空所有评论
    clearAllComments() {
        if (!confirm('确定要清空所有评论吗？此操作不可撤销！')) {
            return;
        }

        localStorage.removeItem('jumpclub_comments');
        localStorage.removeItem('likedComments');
        this.loadComments();
        this.showMessage('所有评论已清空！', 'success');
    }
}

// 导出模块
window.CommentSystem = CommentSystem;
