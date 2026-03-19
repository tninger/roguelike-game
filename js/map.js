// 地图系统
const TILE_SIZE = 32;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 15;

const TILES = {
    WALL: '#',
    FLOOR: '.',
    DOOR: '+',
    STAIRS_DOWN: '>',
    STAIRS_UP: '<',
    CHEST: '$',
    ENEMY: 'E',
    BOSS: 'B',
    PLAYER: '@'
};

class GameMap {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = [];
        this.rooms = [];
        this.enemies = [];
        this.items = [];
        this.explored = [];
        this.visible = [];
        
        this.init();
    }
    
    init() {
        // 初始化地图
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            this.explored[y] = [];
            this.visible[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = TILES.WALL;
                this.explored[y][x] = false;
                this.visible[y][x] = false;
            }
        }
    }
    
    // 生成地图
    generate(floor) {
        this.init();
        this.rooms = [];
        this.enemies = [];
        this.items = [];
        
        // 生成房间
        const roomCount = 5 + Math.floor(Math.random() * 4);
        for (let i = 0; i < roomCount; i++) {
            this.addRoom();
        }
        
        // 连接房间
        this.connectRooms();
        
        // 添加楼梯
        this.placeStairs();
        
        // 添加敌人
        this.placeEnemies(floor);
        
        // 添加宝箱
        this.placeChests(floor);
        
        return this.getPlayerStart();
    }
    
    // 添加房间
    addRoom() {
        const minSize = 4;
        const maxSize = 8;
        
        let attempts = 0;
        while (attempts < 50) {
            const w = minSize + Math.floor(Math.random() * (maxSize - minSize));
            const h = minSize + Math.floor(Math.random() * (maxSize - minSize));
            const x = 1 + Math.floor(Math.random() * (this.width - w - 2));
            const y = 1 + Math.floor(Math.random() * (this.height - h - 2));
            
            // 检查是否重叠
            if (!this.intersects(x, y, w, h)) {
                this.createRoom(x, y, w, h);
                this.rooms.push({ x, y, w, h, cx: x + Math.floor(w/2), cy: y + Math.floor(h/2) });
                return;
            }
            attempts++;
        }
    }
    
    // 创建房间
    createRoom(x, y, w, h) {
        for (let dy = y; dy < y + h; dy++) {
            for (let dx = x; dx < x + w; dx++) {
                this.tiles[dy][dx] = TILES.FLOOR;
            }
        }
    }
    
    // 检查房间是否重叠
    intersects(x, y, w, h) {
        for (const room of this.rooms) {
            if (x < room.x + room.w + 1 && x + w + 1 > room.x &&
                y < room.y + room.h + 1 && y + h + 1 > room.y) {
                return true;
            }
        }
        return false;
    }
    
    // 连接房间
    connectRooms() {
        for (let i = 0; i < this.rooms.length - 1; i++) {
            const r1 = this.rooms[i];
            const r2 = this.rooms[i + 1];
            
            // 随机选择起点和终点
            const x1 = r1.cx;
            const y1 = r1.cy;
            const x2 = r2.cx;
            const y2 = r2.cy;
            
            // 先水平后垂直，或先垂直后水平
            if (Math.random() < 0.5) {
                this.createHCorridor(x1, x2, y1);
                this.createVCorridor(y1, y2, x2);
            } else {
                this.createVCorridor(y1, y2, x1);
                this.createHCorridor(x1, x2, y2);
            }
        }
    }
    
    // 创建水平走廊
    createHCorridor(x1, x2, y) {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        for (let x = minX; x <= maxX; x++) {
            this.tiles[y][x] = TILES.FLOOR;
        }
    }
    
    // 创建垂直走廊
    createVCorridor(y1, y2, x) {
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        for (let y = minY; y <= maxY; y++) {
            this.tiles[y][x] = TILES.FLOOR;
        }
    }
    
    // 放置楼梯
    placeStairs() {
        // 在最后一个房间放置下楼楼梯
        const lastRoom = this.rooms[this.rooms.length - 1];
        this.tiles[lastRoom.cy][lastRoom.cx] = TILES.STAIRS_DOWN;
    }
    
    // 放置敌人
    placeEnemies(floor) {
        const enemyCount = 3 + Math.floor(Math.random() * 3) + Math.floor(floor / 3);
        
        for (let i = 0; i < enemyCount; i++) {
            const pos = this.getRandomFloorTile();
            if (pos) {
                const enemy = spawnEnemy(floor);
                enemy.x = pos.x;
                enemy.y = pos.y;
                this.enemies.push(enemy);
            }
        }
    }
    
    // 放置宝箱
    placeChests(floor) {
        const chestCount = 2 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < chestCount; i++) {
            const pos = this.getRandomFloorTile();
            if (pos) {
                this.tiles[pos.y][pos.x] = TILES.CHEST;
                this.items.push({
                    x: pos.x,
                    y: pos.y,
                    type: 'chest',
                    opened: false
                });
            }
        }
    }
    
    // 获取随机地板位置
    getRandomFloorTile() {
        const floors = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.tiles[y][x] === TILES.FLOOR) {
                    floors.push({ x, y });
                }
            }
        }
        
        if (floors.length === 0) return null;
        return floors[Math.floor(Math.random() * floors.length)];
    }
    
    // 获取玩家起始位置
    getPlayerStart() {
        const firstRoom = this.rooms[0];
        return { x: firstRoom.cx, y: firstRoom.cy };
    }
    
    // 更新视野 - 取消战争迷雾，全地图可见
    updateVisibility(px, py, radius = 5) {
        // 全地图可见
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.visible[y][x] = true;
                this.explored[y][x] = true;
            }
        }
    }
    
    // 检查是否可以移动
    canMove(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        return this.tiles[y][x] !== TILES.WALL;
    }
    
    // 获取指定位置的敌人
    getEnemyAt(x, y) {
        return this.enemies.find(e => e.x === x && e.y === y && !e.isDead());
    }
    
    // 获取指定位置的物品
    getItemAt(x, y) {
        return this.items.find(i => i.x === x && i.y === y);
    }
    
    // 移除敌人
    removeEnemy(enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
        }
    }
    
    // 移除物品
    removeItem(item) {
        const index = this.items.indexOf(item);
        if (index > -1) {
            this.items.splice(index, 1);
        }
    }
    
    // 打开宝箱
    openChest(x, y, floor) {
        const item = this.getItemAt(x, y);
        if (item && item.type === 'chest' && !item.opened) {
            item.opened = true;
            this.tiles[y][x] = TILES.FLOOR;
            return generateItem(floor);
        }
        return null;
    }
    
    // 渲染地图
    render(ctx, player) {
        const tileSize = TILE_SIZE;
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                // 简化的渲染逻辑
            }
        }
    }
}
