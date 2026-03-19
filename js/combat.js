// 战斗系统
class Combat {
    constructor(player, enemy) {
        this.player = player;
        this.enemy = enemy;
        this.turn = 1;
        this.inCombat = true;
        this.log = [];
    }
    
    // 玩家攻击
    playerAttack() {
        if (!this.inCombat || this.enemy.isDead()) return null;
        
        const result = this.player.attack(this.enemy);
        const damage = this.enemy.takeDamage(result.damage);
        
        this.addLog(result.message, 'player');
        
        if (result.heal > 0) {
            this.addLog(`生命偷取恢复 ${result.heal} 点生命值`, 'heal');
        }
        
        // 检查敌人死亡
        if (this.enemy.isDead()) {
            return this.endCombat(true);
        }
        
        // 敌人反击
        return this.enemyTurn();
    }
    
    // 玩家使用技能
    playerUseSkill(skillId) {
        if (!this.inCombat || this.enemy.isDead()) return null;
        
        const result = this.player.useSkill(skillId, this.enemy);
        
        if (!result.success) {
            return { success: false, message: result.message };
        }
        
        this.addLog(result.message, 'skill');
        
        // 处理技能效果
        if (result.damage) {
            const damage = this.enemy.takeDamage(result.damage);
            this.addLog(`对 ${this.enemy.name} 造成 ${damage} 点伤害`, 'damage');
        }
        
        if (result.heal) {
            this.addLog(`恢复 ${result.heal} 点生命值`, 'heal');
        }
        
        if (result.stun) {
            this.enemy.stunned = result.stun;
            this.addLog(`${this.enemy.name} 被眩晕！`, 'stun');
        }
        
        if (result.poison) {
            this.enemy.poison = result.poison;
            this.addLog(`${this.enemy.name} 中毒了！`, 'poison');
        }
        
        if (result.shield) {
            this.player.shield = true;
            this.addLog('获得护盾！', 'buff');
        }
        
        // 检查敌人死亡
        if (this.enemy.isDead()) {
            return this.endCombat(true);
        }
        
        // 敌人回合
        return this.enemyTurn();
    }
    
    // 敌人回合
    enemyTurn() {
        if (!this.inCombat) return null;
        
        const result = this.enemy.attack(this.player);
        
        if (result.damage > 0) {
            const playerResult = this.player.takeDamage(result.damage);
            
            if (playerResult.dodged) {
                this.addLog(playerResult.message, 'dodge');
            } else if (playerResult.blocked) {
                this.addLog(playerResult.message, 'block');
            } else {
                this.addLog(`${result.message} 受到 ${playerResult.damage} 点伤害！`, 'enemy');
            }
            
            if (playerResult.counter) {
                const counterDamage = this.enemy.takeDamage(playerResult.counter);
                this.addLog(`反击造成 ${counterDamage} 点伤害！`, 'counter');
            }
            
            if (result.stun) {
                this.player.stunned = result.stun;
                this.addLog('你被眩晕了！', 'stun');
            }
        } else {
            this.addLog(result.message, 'stun');
        }
        
        // 减少冷却
        this.player.reduceCooldowns();
        this.turn++;
        
        // 检查玩家死亡
        if (this.player.isDead()) {
            return this.endCombat(false);
        }
        
        return {
            inCombat: true,
            turn: this.turn,
            playerHp: this.player.hp,
            enemyHp: this.enemy.hp,
            log: this.log
        };
    }
    
    // 结束战斗
    endCombat(playerWon) {
        this.inCombat = false;
        
        if (playerWon) {
            // 获得奖励
            const exp = this.enemy.exp;
            const gold = this.enemy.gold;
            
            this.player.gainExp(exp);
            this.player.gold += gold;
            this.player.kills++;
            
            if (this.enemy.type === 'boss') {
                this.player.bossKills++;
            }
            
            // 掉落物品
            const drops = [];
            if (Math.random() < 0.7) {
                const item = generateItem(this.player.floor);
                this.player.addToInventory(item);
                drops.push(item);
            }
            
            // Boss额外掉落
            if (this.enemy.type === 'boss') {
                const item = generateItem(this.player.floor);
                item.quality = 'rare';
                this.player.addToInventory(item);
                drops.push(item);
            }
            
            this.addLog(`战斗胜利！获得 ${exp} 经验，${gold} 金币`, 'victory');
            
            return {
                inCombat: false,
                victory: true,
                exp: exp,
                gold: gold,
                drops: drops,
                log: this.log
            };
        } else {
            return {
                inCombat: false,
                victory: false,
                log: this.log
            };
        }
    }
    
    // 添加战斗日志
    addLog(message, type = 'normal') {
        this.log.push({ message, type, turn: this.turn });
        
        // 限制日志数量
        if (this.log.length > 50) {
            this.log.shift();
        }
    }
    
    // 获取战斗状态
    getStatus() {
        return {
            inCombat: this.inCombat,
            turn: this.turn,
            player: {
                hp: this.player.hp,
                maxHp: this.player.maxHp,
                skills: this.player.activeSkills.map(s => ({
                    id: s.id,
                    name: s.name,
                    cooldown: this.player.skillCooldowns[s.id] || 0
                }))
            },
            enemy: {
                name: this.enemy.getDisplayName(),
                icon: this.enemy.icon,
                hp: this.enemy.hp,
                maxHp: this.enemy.maxHp,
                stunned: this.enemy.stunned > 0
            },
            log: this.log
        };
    }
}

// 快速战斗（用于自动战斗）
function quickCombat(player, enemy) {
    const combat = new Combat(player, enemy);
    
    while (combat.inCombat) {
        // 玩家优先攻击
        const result = combat.playerAttack();
        
        if (!result || !combat.inCombat) {
            break;
        }
    }
    
    return result;
}
