// 技能系统
const SKILLS = {
    // 主动技能
    active: [
        {
            id: 'fireball',
            name: '火球术',
            icon: '🔥',
            desc: '造成 200% 攻击力的火焰伤害',
            effect: (player, enemy) => {
                const damage = Math.floor(player.getTotalStats().atk * 2);
                return { damage, type: 'fire', message: `火球造成 ${damage} 点火焰伤害！` };
            },
            cooldown: 3,
            manaCost: 20
        },
        {
            id: 'heal',
            name: '治疗术',
            icon: '💚',
            desc: '恢复 30% 最大生命值',
            effect: (player) => {
                const heal = Math.floor(player.maxHp * 0.3);
                return { heal, message: `恢复了 ${heal} 点生命值！` };
            },
            cooldown: 5,
            manaCost: 15
        },
        {
            id: 'slash',
            name: '重斩',
            icon: '⚔️',
            desc: '造成 150% 攻击力的伤害，50%几率暴击',
            effect: (player, enemy) => {
                const isCrit = Math.random() < 0.5;
                const multiplier = isCrit ? 2.5 : 1.5;
                const damage = Math.floor(player.getTotalStats().atk * multiplier);
                return { damage, crit: isCrit, message: isCrit ? `暴击！重斩造成 ${damage} 点伤害！` : `重斩造成 ${damage} 点伤害！` };
            },
            cooldown: 2,
            manaCost: 10
        },
        {
            id: 'shield',
            name: '护盾',
            icon: '🛡️',
            desc: '获得护盾，抵挡下一次伤害',
            effect: (player) => {
                return { shield: true, message: '获得护盾，可抵挡一次伤害！' };
            },
            cooldown: 4,
            manaCost: 15
        },
        {
            id: 'thunder',
            name: '雷霆一击',
            icon: '⚡',
            desc: '造成 300% 攻击力的雷电伤害，眩晕敌人1回合',
            effect: (player, enemy) => {
                const damage = Math.floor(player.getTotalStats().atk * 3);
                return { damage, stun: 1, type: 'thunder', message: `雷霆一击造成 ${damage} 点伤害并眩晕敌人！` };
            },
            cooldown: 5,
            manaCost: 30
        },
        {
            id: 'poison',
            name: '毒刃',
            icon: '☠️',
            desc: '造成 100% 攻击力的伤害，使敌人中毒3回合',
            effect: (player, enemy) => {
                const damage = player.getTotalStats().atk;
                const poison = Math.floor(player.getTotalStats().atk * 0.3);
                return { damage, poison: { damage: poison, duration: 3 }, message: `毒刃造成 ${damage} 点伤害并使敌人中毒！` };
            },
            cooldown: 4,
            manaCost: 20
        }
    ],
    
    // 被动技能
    passive: [
        {
            id: 'atk_up',
            name: '攻击强化',
            icon: '💪',
            desc: '攻击力 +20%',
            effect: (stats) => { stats.atk = Math.floor(stats.atk * 1.2); }
        },
        {
            id: 'def_up',
            name: '防御强化',
            icon: '🛡️',
            desc: '防御力 +20%',
            effect: (stats) => { stats.def = Math.floor(stats.def * 1.2); }
        },
        {
            id: 'hp_up',
            name: '生命强化',
            icon: '❤️',
            desc: '最大生命值 +30%',
            effect: (stats, player) => { 
                stats.maxHp = Math.floor(stats.maxHp * 1.3); 
                stats.hp = stats.maxHp;
            }
        },
        {
            id: 'crit_up',
            name: '暴击精通',
            icon: '💥',
            desc: '暴击率 +15%',
            effect: (stats) => { stats.crit = (stats.crit || 5) + 15; }
        },
        {
            id: 'vampire',
            name: '生命偷取',
            icon: '🧛',
            desc: '造成伤害的 15% 转化为生命恢复',
            effect: (stats) => { stats.lifeSteal = 15; }
        },
        {
            id: 'regen',
            name: '生命恢复',
            icon: '💚',
            desc: '每回合恢复 5% 最大生命值',
            effect: (stats) => { stats.regen = 5; }
        },
        {
            id: 'counter',
            name: '反击',
            icon: '↩️',
            desc: '受到攻击时有 30% 几率反击',
            effect: (stats) => { stats.counter = 30; }
        },
        {
            id: 'dodge',
            name: '闪避',
            icon: '💨',
            desc: '闪避率 +20%',
            effect: (stats) => { stats.dodge = (stats.dodge || 0) + 20; }
        },
        {
            id: 'berserk',
            name: '狂暴',
            icon: '😤',
            desc: '生命值低于 30% 时，攻击力 +50%',
            effect: (stats) => { stats.berserk = 50; }
        },
        {
            id: 'fortress',
            name: '堡垒',
            icon: '🏰',
            desc: '生命值低于 30% 时，防御力 +50%',
            effect: (stats) => { stats.fortress = 50; }
        }
    ]
};

// 升级时提供3个技能选择
function getSkillChoices(level, playerSkills) {
    const choices = [];
    const availablePassives = SKILLS.passive.filter(s => !playerSkills.some(ps => ps.id === s.id));
    const availableActives = SKILLS.active.filter(s => !playerSkills.some(ps => ps.id === s.id));
    
    // 至少给一个主动技能（如果没有的话）
    if (!playerSkills.some(s => SKILLS.active.find(a => a.id === s.id)) && availableActives.length > 0) {
        choices.push({
            ...availableActives[Math.floor(Math.random() * availableActives.length)],
            type: 'active'
        });
    }
    
    // 填充剩余选项
    while (choices.length < 3) {
        const isActive = Math.random() < 0.3 && availableActives.length > 0;
        if (isActive && availableActives.length > 0) {
            const skill = availableActives[Math.floor(Math.random() * availableActives.length)];
            if (!choices.some(c => c.id === skill.id)) {
                choices.push({ ...skill, type: 'active' });
            }
        } else if (availablePassives.length > 0) {
            const skill = availablePassives[Math.floor(Math.random() * availablePassives.length)];
            if (!choices.some(c => c.id === skill.id)) {
                choices.push({ ...skill, type: 'passive' });
            }
        }
        
        // 防止死循环
        if (choices.length < 3 && availablePassives.length === 0 && availableActives.length === 0) {
            break;
        }
    }
    
    return choices;
}

// 属性加点选项
const STAT_UPGRADES = [
    { id: 'atk_up', name: '攻击力 +3', icon: '⚔️', effect: (p) => { p.baseStats.atk += 3; } },
    { id: 'def_up', name: '防御力 +2', icon: '🛡️', effect: (p) => { p.baseStats.def += 2; } },
    { id: 'hp_up', name: '生命值 +20', icon: '❤️', effect: (p) => { p.baseStats.maxHp += 20; p.hp += 20; } },
    { id: 'crit_up', name: '暴击率 +5%', icon: '💥', effect: (p) => { p.baseStats.crit = (p.baseStats.crit || 0) + 5; } }
];

function getStatChoices() {
    const choices = [...STAT_UPGRADES];
    // 随机打乱
    for (let i = choices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    return choices.slice(0, 3);
}
