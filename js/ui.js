// UI系统
class UI {
    constructor(game) {
        this.game = game;
        this.messageLog = document.getElementById('message-log');
        this.modal = document.getElementById('modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalBody = document.getElementById('modal-body');
        this.modalButtons = document.getElementById('modal-buttons');
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // 方向键
        document.querySelectorAll('.d-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dir = e.target.dataset.dir;
                if (dir) {
                    this.game.movePlayer(dir);
                }
            });
        });
        
        // 动作按钮
        document.getElementById('btn-attack').addEventListener('click', () => {
            this.game.playerAttack();
        });
        
        document.getElementById('btn-skill').addEventListener('click', () => {
            this.showSkillMenu();
        });
        
        document.getElementById('btn-item').addEventListener('click', () => {
            this.showInventory();
        });
        
        document.getElementById('btn-rest').addEventListener('click', () => {
            this.game.playerRest();
        });
        
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            if (this.modal.classList.contains('hidden')) {
                switch(e.key) {
                    case 'ArrowUp':
                    case 'w':
                    case 'W':
                        this.game.movePlayer('up');
                        break;
                    case 'ArrowDown':
                    case 's':
                    case 'S':
                        this.game.movePlayer('down');
                        break;
                    case 'ArrowLeft':
                    case 'a':
                    case 'A':
                        this.game.movePlayer('left');
                        break;
                    case 'ArrowRight':
                    case 'd':
                    case 'D':
                        this.game.movePlayer('right');
                        break;
                    case ' ':
                    case 'Enter':
                        this.game.playerAttack();
                        break;
                }
            }
        });
    }
    
    // 更新状态栏
    updateStatusBar() {
        const player = this.game.player;
        const stats = player.getTotalStats();
        
        document.getElementById('hp').textContent = `${player.hp}/${stats.maxHp}`;
        document.getElementById('atk').textContent = stats.atk;
        document.getElementById('def').textContent = stats.def;
        document.getElementById('level').textContent = `Lv.${player.level}`;
        document.getElementById('gold').textContent = player.gold;
    }
    
    // 添加消息
    addMessage(message, type = 'normal') {
        const div = document.createElement('div');
        div.className = 'message';
        div.textContent = message;
        
        if (type === 'important') div.classList.add('important');
        if (type === 'loot') div.classList.add('loot');
        if (type === 'levelup') div.classList.add('levelup');
        
        this.messageLog.appendChild(div);
        this.messageLog.scrollTop = this.messageLog.scrollHeight;
        
        // 限制消息数量
        while (this.messageLog.children.length > 20) {
            this.messageLog.removeChild(this.messageLog.firstChild);
        }
    }
    
    // 显示模态窗口
    showModal(title, content, buttons = []) {
        this.modalTitle.textContent = title;
        this.modalBody.innerHTML = content;
        this.modalButtons.innerHTML = '';
        
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = 'modal-btn';
            button.textContent = btn.text;
            button.addEventListener('click', () => {
                if (btn.action) btn.action();
                if (btn.close !== false) {
                    this.hideModal();
                }
            });
            this.modalButtons.appendChild(button);
        });
        
        this.modal.classList.remove('hidden');
    }
    
    // 隐藏模态窗口
    hideModal() {
        this.modal.classList.add('hidden');
    }
    
    // 显示技能选择
    showSkillSelection(skills, callback) {
        let content = '<div class="skill-selection">';
        skills.forEach((skill, index) => {
            content += `
                <div class="skill-option" data-index="${index}">
                    <div class="skill-name">${skill.icon} ${skill.name}</div>
                    <div class="skill-desc">${skill.desc}</div>
                </div>
            `;
        });
        content += '</div>';
        
        this.showModal('选择技能', content, []);
        
        // 添加点击事件
        this.modalBody.querySelectorAll('.skill-option').forEach(el => {
            el.addEventListener('click', () => {
                const index = parseInt(el.dataset.index);
                this.hideModal();
                callback(skills[index]);
            });
        });
    }
    
    // 显示属性选择
    showStatSelection(stats, callback) {
        let content = '<div class="stat-selection">';
        stats.forEach((stat, index) => {
            content += `
                <div class="skill-option" data-index="${index}">
                    <div class="skill-name">${stat.icon} ${stat.name}</div>
                </div>
            `;
        });
        content += '</div>';
        
        this.showModal('选择属性加成', content, []);
        
        this.modalBody.querySelectorAll('.skill-option').forEach(el => {
            el.addEventListener('click', () => {
                const index = parseInt(el.dataset.index);
                this.hideModal();
                callback(stats[index]);
            });
        });
    }
    
    // 显示背包
    showInventory() {
        const player = this.game.player;
        
        let content = '<div class="inventory-grid">';
        
        // 装备栏
        content += '<div style="grid-column: span 4; margin-bottom: 10px;"><strong>装备</strong></div>';
        for (const slot in player.equipment) {
            const item = player.equipment[slot];
            const slotName = slot === 'weapon' ? '武器' : slot === 'armor' ? '防具' : '饰品';
            if (item) {
                content += `
                    <div class="inventory-item quality-${item.quality}" data-slot="${slot}">
                        <span>${item.icon}</span>
                        <span class="item-name">${slotName}</span>
                    </div>
                `;
            } else {
                content += `
                    <div class="inventory-item" style="opacity: 0.5;">
                        <span>❓</span>
                        <span class="item-name">${slotName}</span>
                    </div>
                `;
            }
        }
        
        // 背包
        content += '<div style="grid-column: span 4; margin: 10px 0;"><strong>背包</strong></div>';
        player.inventory.forEach((item, index) => {
            content += `
                <div class="inventory-item quality-${item.quality}" data-index="${index}">
                    <span>${item.icon}</span>
                    <span class="item-name">${item.name}</span>
                </div>
            `;
        });
        
        // 填充空位
        for (let i = player.inventory.length; i < player.maxInventory; i++) {
            content += `
                <div class="inventory-item" style="opacity: 0.3;">
                    <span>⬜</span>
                </div>
            `;
        }
        content += '</div>';
        this.showModal('背包', content, [{ text: '关闭', close: true }]);
        
        // 添加点击事件 - 点击背包物品装备
        this.modalBody.querySelectorAll('.inventory-item[data-index]').forEach(el => {
            el.addEventListener('click', () => {
                const index = parseInt(el.dataset.index);
                const item = player.inventory[index];
                if (item) {
                    if (item.type === 'weapon' || item.type === 'armor' || item.type === 'accessory') {
                        // 装备物品
                        player.equipItem(item);
                        // 从背包移除
                        player.inventory.splice(index, 1);
                        this.addMessage(`装备了 ${item.icon} ${item.name}`, 'loot');
                        this.hideModal();
                        this.updateStatusBar();
                    } else if (item.type === 'consumable') {
                        // 使用消耗品
                        const result = player.useItem(item, index);
                        if (result.success) {
                            this.addMessage(result.message, 'heal');
                            this.hideModal();
                            this.updateStatusBar();
                        }
                    }
                }
            });
        });
    }
    
    // 显示技能菜单
    showSkillMenu() {
        const player = this.game.player;
        if (player.activeSkills.length === 0) {
            this.addMessage('还没有学会任何技能！', 'important');
            return;
        }
        
        let content = '<div class="skill-selection">';
        player.activeSkills.forEach(skill => {
            const cooldown = player.skillCooldowns[skill.id] || 0;
            content += `
                <div class="skill-option">
                    <div class="skill-name">${skill.icon} ${skill.name}</div>
                    <div class="skill-desc">${skill.desc}</div>
                    <div class="skill-cooldown">${cooldown > 0 ? '冷却: ' + cooldown + ' 回合' : '可用'}</div>
                </div>
            `;
        });
        content += '</div>';
        this.showModal('技能', content, [{ text: '关闭', close: true }]);
    }
}