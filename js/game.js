// 游戏主逻辑
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.player = new Player();
        this.map = new GameMap(MAP_WIDTH, MAP_HEIGHT);
        this.ui = new UI(this);
        this.combat = null;
        
        this.tileSize = TILE_SIZE;
        this.camera = { x: 0, y: 0 };
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.init();
    }
    
    resize() {
        const container = document.getElementById('map-container');
        const containerWidth = container.clientWidth || 320;
        const containerHeight = container.clientHeight || 400;
        const size = Math.min(containerWidth, containerHeight, 600);
        this.canvas.width = size;
        this.canvas.height = size;
        this.tileSize = Math.floor(size / Math.max(MAP_WIDTH, MAP_HEIGHT));
        console.log('Canvas size:', size, 'Tile size:', this.tileSize);
    }
    
    init() {
        // 生成第一层地图
        const startPos = this.map.generate(this.player.floor);
        this.player.x = startPos.x;
        this.player.y = startPos.y;
        
        this.map.updateVisibility(this.player.x, this.player.y);
        this.ui.updateStatusBar();
        this.ui.addMessage('欢迎来到地牢！使用方向键或按钮移动。', 'important');
        
        this.render();
        this.gameLoop();
    }
    
    // 游戏主循环
    gameLoop() {
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    // 渲染游戏
    render() {
        const ctx = this.ctx;
        const ts = this.tileSize || 20;
        
        // 清空画布
        ctx.fillStyle = '#0f0f23';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 调试信息
        if (!this.renderedOnce) {
            console.log('Rendering map, tileSize:', ts, 'canvas:', this.canvas.width, 'x', this.canvas.height);
            this.renderedOnce = true;
        }
        
        // 计算相机偏移
        const offsetX = (this.canvas.width - MAP_WIDTH * ts) / 2;
        const offsetY = (this.canvas.height - MAP_HEIGHT * ts) / 2;
        
        // 绘制地图
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const tile = this.map.tiles[y][x];
                const explored = this.map.explored[y][x];
                const visible = this.map.visible[y][x];
                
                if (!explored) continue;
                
                const px = offsetX + x * ts;
                const py = offsetY + y * ts;
                
                // 绘制格子背景
                if (tile === TILES.WALL) {
                    ctx.fillStyle = visible ? '#444' : '#222';
                    ctx.fillRect(px, py, ts, ts);
                } else {
                    ctx.fillStyle = visible ? '#333' : '#1a1a1a';
                    ctx.fillRect(px, py, ts, ts);
                }
                
                // 绘制内容
                ctx.font = `${ts * 0.7}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                let icon = '';
                let color = '#fff';
                
                switch(tile) {
                    case TILES.WALL:
                        icon = '🧱';
                        color = visible ? '#888' : '#444';
                        break;
                    case TILES.STAIRS_DOWN:
                        icon = '⬇️';
                        color = '#0ff';
                        break;
                    case TILES.CHEST:
                        icon = '🎁';
                        color = '#ffd700';
                        break;
                }
                
                if (icon && visible) {
                    ctx.fillStyle = color;
                    ctx.fillText(icon, px + ts/2, py + ts/2 + ts*0.1);
                }
                
                // 绘制敌人
                if (visible) {
                    const enemy = this.map.getEnemyAt(x, y);
                    if (enemy) {
                        ctx.fillStyle = enemy.type === 'boss' ? '#f00' : enemy.type === 'elite' ? '#f80' : '#fff';
                        ctx.fillText(enemy.icon, px + ts/2, py + ts/2 + ts*0.1);
                    }
                }
                
                // 战争迷雾
                if (!visible) {
                    ctx.fillStyle = 'rgba(0,0,0,0.7)';
                    ctx.fillRect(px, py, ts, ts);
                }
            }
        }
        
        // 绘制玩家
        const px = offsetX + this.player.x * ts;
        const py = offsetY + this.player.y * ts;
        ctx.font = `${ts * 0.7}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#0f0';
        ctx.fillText('🧙', px + ts/2, py + ts/2 + ts*0.1);
    }
    
    // 移动玩家
    movePlayer(direction) {
        if (this.combat && this.combat.inCombat) {
            this.ui.addMessage('战斗中无法移动！', 'important');
            return;
        }
        
        let dx = 0, dy = 0;
        switch(direction) {
            case 'up': dy = -1; break;
            case 'down': dy = 1; break;
            case 'left': dx = -1; break;
            case 'right': dx = 1; break;
        }
        
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        
        // 检查是否可以移动
        if (!this.map.canMove(newX, newY)) {
            return;
        }
        
        // 检查敌人
        const enemy = this.map.getEnemyAt(newX, newY);
        if (enemy) {
            this.startCombat(enemy);
            return;
        }
        
        // 移动
        this.player.x = newX;
        this.player.y = newY;
        
        // 更新视野
        this.map.updateVisibility(this.player.x, this.player.y);
        
        // 检查楼梯
        if (this.map.tiles[newY][newX] === TILES.STAIRS_DOWN) {
            this.nextFloor();
            return;
        }
        
        // 检查宝箱
        if (this.map.tiles[newY][newX] === TILES.CHEST) {
            const item = this.map.openChest(newX, newY, this.player.floor);
            if (item) {
                this.ui.addMessage(`打开宝箱获得：${item.icon} ${item.name}！`, 'loot');
            }
        }
        
        this.render();
    }
    
    // 开始战斗
    startCombat(enemy) {
        this.combat = new Combat(this.player, enemy);
        this.ui.addMessage(`遭遇 ${enemy.getDisplayName()}！`, 'important');
        this.updateCombatUI();
    }
    
    // 玩家攻击
    playerAttack() {
        if (!this.combat || !this.combat.inCombat) {
            // 检查周围是否有敌人
            const directions = [[0,-1], [0,1], [-1,0], [1,0]];
            for (const [dx, dy] of directions) {
                const enemy = this.map.getEnemyAt(this.player.x + dx, this.player.y + dy);
                if (enemy) {
                    this.startCombat(enemy);
                    return;
                }
            }
            this.ui.addMessage('附近没有敌人！', 'important');
            return;
        }
        
        const result = this.combat.playerAttack();
        this.processCombatResult(result);
    }
    
    // 处理战斗结果
    processCombatResult(result) {
        if (!result) return;
        
        // 显示战斗日志
        if (result.log) {
            result.log.forEach(log => {
                this.ui.addMessage(log.message, log.type);
            });
        }
        
        // 战斗结束
        if (!result.inCombat) {
            this.combat = null;
            
            if (result.victory) {
                this.ui.addMessage(`战斗胜利！获得 ${result.exp} 经验，${result.gold} 金币`, 'levelup');
                
                if (result.drops && result.drops.length > 0) {
                    result.drops.forEach(item => {
                        this.ui.addMessage(`掉落：${item.icon} ${item.name}`, 'loot');
                    });
                }
                
                // 移除死亡的敌人
                const enemy = this.map.getEnemyAt(this.player.x, this.player.y);
                if (enemy && enemy.isDead()) {
                    this.map.removeEnemy(enemy);
                }
            } else {
                this.gameOver();
            }
        }
        
        this.ui.updateStatusBar();
    }
    
    // 更新战斗UI
    updateCombatUI() {
        if (!this.combat) return;
        
        const status = this.combat.getStatus();
        // 可以在这里更新战斗专用的UI元素
    }
    
    // 玩家休息
    playerRest() {
        if (this.combat && this.combat.inCombat) {
            this.ui.addMessage('战斗中无法休息！', 'important');
            return;
        }
        
        const heal = this.player.rest();
        this.ui.addMessage(`休息恢复 ${heal} 点生命值`, 'heal');
        this.ui.updateStatusBar();
    }
    
    // 下一层
    nextFloor() {
        this.player.nextFloor();
        this.ui.addMessage(`进入第 ${this.player.floor} 层！`, 'important');
        
        // 生成新地图
        const startPos = this.map.generate(this.player.floor);
        this.player.x = startPos.x;
        this.player.y = startPos.y;
        
        this.map.updateVisibility(this.player.x, this.player.y);
        this.ui.updateStatusBar();
    }
    
    // 升级处理
    onLevelUp() {
        this.ui.addMessage(`升级了！当前等级：${this.player.level}`, 'levelup');
        
        // 先选择属性
        const statChoices = getStatChoices();
        this.ui.showStatSelection(statChoices, (stat) => {
            stat.effect(this.player);
            this.ui.addMessage(`选择了：${stat.name}`, 'levelup');
            this.ui.updateStatusBar();
            
            // 然后选择技能
            const skillChoices = getSkillChoices(this.player.level, this.player.skills);
            if (skillChoices.length > 0) {
                this.ui.showSkillSelection(skillChoices, (skill) => {
                    this.player.learnSkill(skill);
                    this.ui.addMessage(`学会了技能：${skill.name}！`, 'levelup');
                });
            }
        });
    }
    
    // 游戏结束
    gameOver() {
        const content = `
            <div class="game-over">
                <h2>游戏结束</h2>
                <div class="stats">
                    <div class="stat-row"><span>到达层数</span><span>${this.player.floor}</span></div>
                    <div class="stat-row"><span>最终等级</span><span>${this.player.level}</span></div>
                    <div class="stat-row"><span>击杀敌人</span><span>${this.player.kills}</span></div>
                    <div class="stat-row"><span>击败BOSS</span><span>${this.player.bossKills}</span></div>
                    <div class="stat-row"><span>获得金币</span><span>${this.player.gold}</span></div>
                </div>
            </div>
        `;
        
        this.ui.showModal('游戏结束', content, [
            { text: '重新开始', action: () => { location.reload(); } }
        ]);
    }
}

// 启动游戏
let game;
window.onload = () => {
    game = new Game();
};
