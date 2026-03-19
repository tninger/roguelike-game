// 敌人系统
const ENEMY_TYPES = {
    // 普通敌人
    normal: [
        { name: '史莱姆', icon: '🟢', hp: 30, atk: 5, def: 2, exp: 15, gold: 10 },
        { name: '哥布林', icon: '👺', hp: 40, atk: 8, def: 3, exp: 20, gold: 15 },
        { name: '蝙蝠', icon: '🦇', hp: 25, atk: 10, def: 1, exp: 18, gold: 12 },
        { name: '骷髅', icon: '💀', hp: 50, atk: 12, def: 5, exp: 25, gold: 18 },
        { name: '僵尸', icon: '🧟', hp: 60, atk: 10, def: 8, exp: 30, gold: 20 },
        { name: '蜘蛛', icon: '🕷️', hp: 35, atk: 15, def: 2, exp: 28, gold: 16 },
        { name: '狼', icon: '🐺', hp: 45, atk: 14, def: 4, exp: 32, gold: 22 },
        { name: '野猪', icon: '🐗', hp: 55, atk: 12, def: 6, exp: 35, gold: 25 }
    ],
    
    // 精英敌人
    elite: [
        { name: '兽人战士', icon: '👹', hp: 100, atk: 20, def: 10, exp: 80, gold: 60 },
        { name: '暗影刺客', icon: '🥷', hp: 80, atk: 28, def: 5, exp: 90, gold: 70 },
        { name: '亡灵法师', icon: '🧙', hp: 90, atk: 25, def: 8, exp: 85, gold: 65 },
        { name: '巨魔', icon: '👾', hp: 150, atk: 22, def: 15, exp: 100, gold: 80 }
    ],
    
    // Boss
    bosses: [
        { 
            name: '巨龙', 
            icon: '🐉', 
            hp: 500, 
            atk: 50, 
            def: 30, 
            exp: 500, 
            gold: 500,
            skills: ['fire_breath', 'tail_sweep']
        },
        { 
            name: '魔王', 
            icon: '👿', 
            hp: 600, 
            atk: 45, 
            def: 35, 
            exp: 600, 
            gold: 600,
            skills: ['dark_magic', 'summon']
        },
        { 
            name: '远古巨人', 
            icon: '🗿', 
            hp: 800, 
            atk: 40, 
            def: 40, 
            exp: 700, 
            gold: 700,
            skills: ['ground_slam', 'rock_throw']
        }
    ]
};

// Boss技能
const BOSS_SKILLS = {
    fire_breath: {
        name: '火焰吐息',
        damage: 1.5,
        message: '巨龙喷出炽热的火焰！'
    },
    tail_sweep: {
        name: '尾击',
        damage: 1.2,
        stun: 1,
        message: '巨龙的尾巴横扫而来！'
    },
    dark_magic: {
        name: '黑暗魔法',
        damage: 1.3,
        heal: 0.2,
        message: '魔王释放出黑暗能量！'
    },
    summon: {
        name: '召唤仆从',
        summon: true,
        message: '魔王召唤了小怪！'
    },
    ground_slam: {
        name: '大地震击',
        damage: 1.4,
        message: '远古巨人猛击地面！'
    },
    rock_throw: {
        name: '投掷巨石',
        damage: 1.3,
        message: '远古巨人向你投掷巨石！'
    }
};

class Enemy {
    constructor(type, floor) {
        this.type = type;
        this.floor = floor;
        this.stunned = 0;
        this.poison = null;
        
        // 根据类型创建
        let template;
        if (type === 'elite') {
            template = ENEMY_TYPES.elite[Math.floor(Math.random() * ENEMY_TYPES.elite.length)];
        } else if (type === 'boss') {
            template = ENEMY_TYPES.bosses[Math.floor(Math.random() * ENEMY_TYPES.bosses.length)];
        } else {
            template = ENEMY_TYPES.normal[Math.floor(Math.random() * ENEMY_TYPES.normal.length)];
        }
        
        // 根据楼层增强
        const multiplier = 1 + (floor - 1) * 0.1;
        
        this.name = template.name;
        this.icon = template.icon;
        this.maxHp = Math.floor(template.hp * multiplier);
        this.hp = this.maxHp;
        this.atk = Math.floor(template.atk * multiplier);
        this.def = Math.floor(template.def * multiplier);
        this.exp = Math.floor(template.exp * multiplier);
        this.gold = Math.floor(template.gold * multiplier);
        this.skills = template.skills || [];
        
        // Boss特殊属性
        if (type === 'boss') {
            this.skillCooldown = 0;
        }
    }
    
    // 受到伤害
    takeDamage(damage) {
        const actualDamage = Math.max(1, Math.floor(damage - this.def * 0.5));
        this.hp -= actualDamage;
        
        // 中毒效果
        if (this.poison) {
            const poisonDamage = this.poison.damage;
            this.hp -= poisonDamage;
            this.poison.duration--;
            if (this.poison.duration <= 0) {
                this.poison = null;
            }
        }
        
        return actualDamage;
    }
    
    // 攻击玩家
    attack(player) {
        // 眩晕检查
        if (this.stunned > 0) {
            this.stunned--;
            return { damage: 0, message: `${this.name} 处于眩晕状态！` };
        }
        
        // Boss技能
        if (this.type === 'boss' && this.skills.length > 0) {
            this.skillCooldown--;
            if (this.skillCooldown <= 0 && Math.random() < 0.4) {
                return this.useSkill(player);
            }
        }
        
        // 普通攻击
        const isCrit = Math.random() < 0.1;
        const multiplier = isCrit ? 1.5 : 1;
        const damage = Math.floor(this.atk * multiplier);
        
        return {
            damage,
            crit: isCrit,
            message: isCrit ? `${this.name} 暴击！` : `${this.name} 发动攻击！`
        };
    }
    
    // 使用技能
    useSkill(player) {
        const skillId = this.skills[Math.floor(Math.random() * this.skills.length)];
        const skill = BOSS_SKILLS[skillId];
        
        this.skillCooldown = 3;
        
        const damage = Math.floor(this.atk * skill.damage);
        
        return {
            damage,
            stun: skill.stun || 0,
            message: skill.message
        };
    }
    
    // 是否死亡
    isDead() {
        return this.hp <= 0;
    }
    
    // 获取显示名称
    getDisplayName() {
        const typePrefix = this.type === 'boss' ? '【BOSS】' : this.type === 'elite' ? '【精英】' : '';
        return `${typePrefix}${this.name}`;
    }
}

// 生成敌人
function spawnEnemy(floor) {
    const rand = Math.random();
    
    // 每5层一个Boss
    if (floor % 5 === 0) {
        return new Enemy('boss', floor);
    }
    
    // 精英概率随层数增加
    const eliteChance = 0.1 + floor * 0.02;
    if (rand < eliteChance) {
        return new Enemy('elite', floor);
    }
    
    return new Enemy('normal', floor);
}
