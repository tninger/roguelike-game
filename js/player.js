// 玩家系统
class Player {
    constructor() {
        this.reset();
    }
    
    reset() {
        // 基础属性
        this.baseStats = {
            maxHp: 100,
            atk: 10,
            def: 5,
            speed: 10,
            crit: 5
        };
        
        this.hp = this.baseStats.maxHp;
        this.maxHp = this.baseStats.maxHp;
        this.level = 1;
        this.exp = 0;
        this.expToNext = 100;
        this.gold = 0;
        
        // 位置
        this.x = 0;
        this.y = 0;
        
        // 装备
        this.equipment = {
            weapon: null,
            armor: null,
            accessory: null
        };
        
        // 背包
        this.inventory = [];
        this.maxInventory = 20;
        
        // 技能
        this.skills = [];
        this.activeSkills = []; // 已装备的主动技能
        this.skillCooldowns = {};
        
        // 状态
        this.buffs = [];
        this.shield = false;
        
        // 楼层
        this.floor = 1;
        
        // 击杀统计
        this.kills = 0;
        this.bossKills = 0;
    }
    
    // 获取总属性（基础+装备+技能）
    getTotalStats() {
        const stats = { ...this.baseStats, hp: this.hp, maxHp: this.maxHp };
        
        // 装备加成
        for (const slot in this.equipment) {
            const item = this.equipment[slot];
            if (item) {
                stats.atk += item.atk || 0;
                stats.def += item.def || 0;
                stats.maxHp += item.hp || 0;
                stats.crit += item.crit || 0;
            }
        }
        
        // 被动技能加成
        this.skills.forEach(skill => {
            if (skill.type === 'passive' && skill.effect) {
                skill.effect(stats, this);
            }
        });
        
        // buff加成
        this.buffs.forEach(buff => {
            if (buff.stat && buff.value) {
                stats[buff.stat] = (stats[buff.stat] || 0) + buff.value;
            }
        });
        
        // 狂暴/堡垒效果
        if (this.hp / this.maxHp < 0.3) {
            if (stats.berserk) stats.atk = Math.floor(stats.atk * (1 + stats.berserk / 100));
            if (stats.fortress) stats.def = Math.floor(stats.def * (1 + stats.fortress / 100));
        }
        
        return stats;
    }
    
    // 获得经验
    gainExp(amount) {
        this.exp += amount;
        
        // 检查升级
        while (this.exp >= this.expToNext) {
            this.exp -= this.expToNext;
            this.levelUp();
        }
    }
    
    // 升级
    levelUp() {
        this.level++;
        this.expToNext = Math.floor(this.expToNext * 1.2);
        
        // 恢复部分生命
        this.hp = Math.min(this.hp + 30, this.maxHp);
        
        // 触发升级事件
        if (game) {
            game.onLevelUp();
        }
    }
    
    // 学习技能
    learnSkill(skill) {
        this.skills.push(skill);
        if (skill.type === 'active') {
            this.activeSkills.push(skill);
            this.skillCooldowns[skill.id] = 0;
        }
    }
    
    // 装备物品
    equipItem(item) {
        if (!item || !item.type) return false;
        
        const slot = item.type;
        if (slot === 'weapon' || slot === 'armor' || slot === 'accessory') {
            // 卸下当前装备
            if (this.equipment[slot]) {
                this.addToInventory(this.equipment[slot]);
            }
            
            this.equipment[slot] = item;
            return true;
        }
        return false;
    }
    
    // 添加物品到背包
    addToInventory(item) {
        if (this.inventory.length < this.maxInventory) {
            this.inventory.push(item);
            return true;
        }
        return false;
    }
    
    // 使用消耗品
    useItem(item, index) {
        if (item.type !== 'consumable') return false;
        
        if (item.effect === 'heal') {
            const heal = item.value;
            const actualHeal = Math.min(heal, this.maxHp - this.hp);
            this.hp += actualHeal;
            this.inventory.splice(index, 1);
            return { success: true, message: `使用了${item.name}，恢复 ${actualHeal} 点生命值` };
        } else if (item.effect === 'fullheal') {
            const heal = this.maxHp - this.hp;
            this.hp = this.maxHp;
            this.inventory.splice(index, 1);
            return { success: true, message: `使用了${item.name}，生命值全满！` };
        } else if (item.effect === 'buff') {
            this.buffs.push({
                stat: item.stat,
                value: item.value,
                turns: item.turns
            });
            this.inventory.splice(index, 1);
            return { success: true, message: `使用了${item.name}，${item.stat === 'atk' ? '攻击力' : '防御力'}提升 ${item.value} 点，持续 ${item.turns} 回合` };
        }
        
        return { success: false, message: '无法使用该物品' };
    }
    
    // 受到伤害
    takeDamage(damage) {
        // 闪避
        const stats = this.getTotalStats();
        if (stats.dodge && Math.random() * 100 < stats.dodge) {
            return { damage: 0, dodged: true, message: '闪避了攻击！' };
        }
        
        // 护盾
        if (this.shield) {
            this.shield = false;
            return { damage: 0, blocked: true, message: '护盾抵挡了伤害！' };
        }
        
        // 计算实际伤害
        const actualDamage = Math.max(1, Math.floor(damage - stats.def * 0.5));
        this.hp -= actualDamage;
        
        // 检查反击
        let counter = null;
        if (stats.counter && Math.random() * 100 < stats.counter) {
            counter = Math.floor(stats.atk * 0.5);
        }
        
        return { damage: actualDamage, counter };
    }
    
    // 攻击
    attack(target) {
        const stats = this.getTotalStats();
        
        // 暴击判定
        const isCrit = Math.random() * 100 < stats.crit;
        const multiplier = isCrit ? 2 : 1;
        
        let damage = Math.floor(stats.atk * multiplier);
        
        // 生命偷取
        let heal = 0;
        if (stats.lifeSteal) {
            heal = Math.floor(damage * stats.lifeSteal / 100);
            this.hp = Math.min(this.hp + heal, this.maxHp);
        }
        
        return {
            damage,
            crit: isCrit,
            heal,
            message: isCrit ? `暴击！造成 ${damage} 点伤害！` : `造成 ${damage} 点伤害`
        };
    }
    
    // 使用主动技能
    useSkill(skillId, target) {
        const skill = this.activeSkills.find(s => s.id === skillId);
        if (!skill) return { success: false, message: '技能未找到' };
        
        if (this.skillCooldowns[skillId] > 0) {
            return { success: false, message: `技能冷却中，还剩 ${this.skillCooldowns[skillId]} 回合` };
        }
        
        // 执行技能效果
        const result = skill.effect(this, target);
        
        // 设置冷却
        this.skillCooldowns[skillId] = skill.cooldown;
        
        return { success: true, ...result };
    }
    
    // 减少冷却
    reduceCooldowns() {
        for (const id in this.skillCooldowns) {
            if (this.skillCooldowns[id] > 0) {
                this.skillCooldowns[id]--;
            }
        }
        
        // 减少buff回合
        this.buffs = this.buffs.filter(buff => {
            buff.turns--;
            return buff.turns > 0;
        });
        
        // 生命恢复
        const stats = this.getTotalStats();
        if (stats.regen && this.hp < this.maxHp) {
            const regen = Math.floor(this.maxHp * stats.regen / 100);
            this.hp = Math.min(this.hp + regen, this.maxHp);
        }
    }
    
    // 休息恢复
    rest() {
        const heal = Math.floor(this.maxHp * 0.3);
        const actualHeal = Math.min(heal, this.maxHp - this.hp);
        this.hp += actualHeal;
        return actualHeal;
    }
    
    // 是否死亡
    isDead() {
        return this.hp <= 0;
    }
    
    // 移动到下一层
    nextFloor() {
        this.floor++;
        // 恢复部分