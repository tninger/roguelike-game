// 装备系统
const ITEMS = {
    // 武器
    weapons: [
        { name: '生锈的剑', icon: '🗡️', atk: 3, def: 0, hp: 0, quality: 'common' },
        { name: '铁剑', icon: '⚔️', atk: 5, def: 0, hp: 0, quality: 'common' },
        { name: '精钢剑', icon: '🗡️', atk: 8, def: 1, hp: 0, quality: 'uncommon' },
        { name: '火焰剑', icon: '🔥', atk: 12, def: 0, hp: 5, quality: 'rare' },
        { name: '冰霜剑', icon: '❄️', atk: 10, def: 2, hp: 10, quality: 'rare' },
        { name: '雷霆之刃', icon: '⚡', atk: 15, def: 0, hp: 0, crit: 10, quality: 'epic' },
        { name: '屠龙剑', icon: '🐉', atk: 20, def: 5, hp: 20, quality: 'legendary' },
        { name: '圣光之剑', icon: '✨', atk: 18, def: 3, hp: 30, crit: 5, quality: 'legendary' }
    ],
    
    // 防具
    armors: [
        { name: '破旧布衣', icon: '👕', atk: 0, def: 2, hp: 5, quality: 'common' },
        { name: '皮甲', icon: '🦺', atk: 0, def: 4, hp: 10, quality: 'common' },
        { name: '铁甲', icon: '👔', atk: 0, def: 7, hp: 15, quality: 'uncommon' },
        { name: '钢甲', icon: '🛡️', atk: 0, def: 10, hp: 25, quality: 'rare' },
        { name: '龙鳞甲', icon: '🐲', atk: 2, def: 15, hp: 40, quality: 'epic' },
        { name: '神圣铠甲', icon: '👑', atk: 5, def: 20, hp: 60, quality: 'legendary' }
    ],
    
    // 饰品
    accessories: [
        { name: '铜戒指', icon: '💍', atk: 1, def: 1, hp: 5, quality: 'common' },
        { name: '银项链', icon: '📿', atk: 2, def: 0, hp: 10, crit: 3, quality: 'uncommon' },
        { name: '力量护符', icon: '🔱', atk: 5, def: 0, hp: 0, quality: 'rare' },
        { name: '守护徽章', icon: '🛡️', atk: 0, def: 5, hp: 20, quality: 'rare' },
        { name: '暴击戒指', icon: '💎', atk: 3, def: 0, hp: 0, crit: 15, quality: 'epic' },
        { name: '生命之石', icon: '❤️', atk: 0, def: 0, hp: 50, quality: 'epic' },
        { name: '王者之冠', icon: '👑', atk: 8, def: 8, hp: 30, crit: 10, quality: 'legendary' }
    ],
    
    // 消耗品
    consumables: [
        { name: '小血瓶', icon: '🧪', effect: 'heal', value: 30, quality: 'common' },
        { name: '中血瓶', icon: '🧪', effect: 'heal', value: 60, quality: 'uncommon' },
        { name: '大血瓶', icon: '🧪', effect: 'heal', value: 100, quality: 'rare' },
        { name: '全满药水', icon: '❤️', effect: 'fullheal', value: 999, quality: 'epic' },
        { name: '力量药水', icon: '💪', effect: 'buff', stat: 'atk', value: 5, turns: 10, quality: 'uncommon' },
        { name: '防御药水', icon: '🛡️', effect: 'buff', stat: 'def', value: 5, turns: 10, quality: 'uncommon' }
    ],
    
    // 金币
    gold: [
        { name: '少量金币', icon: '🪙', min: 10, max: 30 },
        { name: '一堆金币', icon: '💰', min: 30, max: 80 },
        { name: '大量金币', icon: '💎', min: 80, max: 200 }
    ]
};

// 品质颜色
const QUALITY_COLORS = {
    common: '#aaaaaa',
    uncommon: '#00ff00',
    rare: '#0088ff',
    epic: '#aa00ff',
    legendary: '#ff8800'
};

// 品质中文名
const QUALITY_NAMES = {
    common: '普通',
    uncommon: '优秀',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
};

// 根据层数生成装备
function generateItem(floor) {
    const rand = Math.random();
    let quality;
    
    // 品质概率随层数提升
    const legendaryChance = 0.01 + floor * 0.002;
    const epicChance = 0.05 + floor * 0.005;
    const rareChance = 0.15 + floor * 0.01;
    const uncommonChance = 0.35;
    
    if (rand < legendaryChance) quality = 'legendary';
    else if (rand < legendaryChance + epicChance) quality = 'epic';
    else if (rand < legendaryChance + epicChance + rareChance) quality = 'rare';
    else if (rand < legendaryChance + epicChance + rareChance + uncommonChance) quality = 'uncommon';
    else quality = 'common';
    
    // 随机选择装备类型
    const typeRand = Math.random();
    let item;
    if (typeRand < 0.4) {
        // 武器
        const weapons = ITEMS.weapons.filter(w => quality === 'legendary' || 
            (quality === 'epic' && ['epic', 'rare', 'uncommon', 'common'].includes(w.quality)) ||
            (quality === 'rare' && ['rare', 'uncommon', 'common'].includes(w.quality)) ||
            (quality === 'uncommon' && ['uncommon', 'common'].includes(w.quality)) ||
            (quality === 'common' && w.quality === 'common'));
        item = { ...weapons[Math.floor(Math.random() * weapons.length)], type: 'weapon' };
    } else if (typeRand < 0.7) {
        // 防具
        const armors = ITEMS.armors.filter(a => quality === 'legendary' || 
            (quality === 'epic' && ['epic', 'rare', 'uncommon', 'common'].includes(a.quality)) ||
            (quality === 'rare' && ['rare', 'uncommon', 'common'].includes(a.quality)) ||
            (quality === 'uncommon' && ['uncommon', 'common'].includes(a.quality)) ||
            (quality === 'common' && a.quality === 'common'));
        item = { ...armors[Math.floor(Math.random() * armors.length)], type: 'armor' };
    } else if (typeRand < 0.9) {
        // 饰品
        const accessories = ITEMS.accessories.filter(a => quality === 'legendary' || 
            (quality === 'epic' && ['epic', 'rare', 'uncommon', 'common'].includes(a.quality)) ||
            (quality === 'rare' && ['rare', 'uncommon', 'common'].includes(a.quality)) ||
            (quality === 'uncommon' && ['uncommon', 'common'].includes(a.quality)) ||
            (quality === 'common' && a.quality === 'common'));
        item = { ...accessories[Math.floor(Math.random() * accessories.length)], type: 'accessory' };
    } else {
        // 消耗品
        const consumables = ITEMS.consumables;
        item = { ...consumables[Math.floor(Math.random() * consumables.length)], type: 'consumable' };
    }
    
    return { ...item, id: Date.now() + Math.random() };
}

// 生成金币
function generateGold(floor) {
    const rand = Math.random();
    let goldType;
    if (rand < 0.6) goldType = ITEMS.gold[0];
    else if (rand < 0.9) goldType = ITEMS.gold[1];
    else goldType = ITEMS.gold[2];
    
    const amount = Math.floor(Math.random() * (goldType.max - goldType.min) + goldType.min);
    return { ...goldType, amount, type: 'gold' };
}
