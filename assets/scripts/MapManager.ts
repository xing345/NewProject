import { _decorator, Component, Node, SpriteFrame, Sprite, UITransform, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

/**
 * 地图格子的逻辑类型（用于生成与后续碰撞/寻址）
 *
 * 三类格子决定了不同的游戏行为：
 * - FLOOR：玩家和子弹均可穿过
 * - WALL：玩家和子弹均被阻挡（实心墙/集装箱）
 * - LOW_COVER：玩家可穿过但子弹被阻挡（沙袋/木箱），或减速区
 */
export enum TileType {
    /** 可走平地 */
    FLOOR = 0,
    /** 实心障碍（墙、集装箱等），阻挡移动和子弹 */
    WALL = 1,
    /** 低矮掩体（沙袋、木箱等），阻挡子弹但可跨越 */
    LOW_COVER = 2,
}

/**
 * 地图管理器 —— 适配 48x48 主地砖 + 16x16 辅助地砖的射击对战地图。
 *
 * 使用说明（编辑器）：
 * 1. 在场景中创建空节点 `MapRoot`，本组件挂在该节点上。
 * 2. 将若干地板、障碍、掩体的 SpriteFrame 拖入对应数组（勿留空数组，否则运行时会跳过生成）。
 * 3. 若 `mapSeed >= 0`，每局地图可完全复现（联机时服务器下发同一种子即可）。
 * 4. 调用 getTileTypeAt(worldX, worldY) 可查询任意世界坐标对应的格子类型，用于子弹碰撞判定。
 */
@ccclass('MapManager')
export class MapManager extends Component {

    // ───────────────────────── 编辑器属性 ─────────────────────────

    @property({ type: [SpriteFrame], displayName: '地板素材库', group: { name: '素材数组' } })
    public floorSprites: SpriteFrame[] = [];

    @property({ type: [SpriteFrame], displayName: '实心墙素材库', group: { name: '素材数组' } })
    public wallSprites: SpriteFrame[] = [];

    @property({ type: [SpriteFrame], displayName: '低矮掩体素材库', group: { name: '素材数组' } })
    public coverSprites: SpriteFrame[] = [];

    @property({ displayName: '地图宽度（格）', tooltip: '横向格子数量', group: { name: '地图参数' } })
    public mapWidth = 20;

    @property({ displayName: '地图高度（格）', tooltip: '纵向格子数量', group: { name: '地图参数' } })
    public mapHeight = 20;

    @property({
        displayName: '实心墙密度',
        tooltip: '0~1，越大墙越多。边缘永远是墙。',
        range: [0, 1, 0.01],
        group: { name: '地图参数' },
    })
    public obstacleDensity = 0.20;

    @property({
        displayName: '低矮掩体密度',
        tooltip: '0~1，占非边缘区域的比例（约 5%）。掩体不会与墙重叠。',
        range: [0, 0.3, 0.01],
        group: { name: '地图参数' },
    })
    public coverDensity = 0.05;

    /**
     * 地图随机种子。
     * - 小于 0：每次运行使用 Math.random()（本地调试方便）。
     * - 大于等于 0：固定种子，generateMap 结果可复现（联机一致性 / 回放）。
     */
    @property({ displayName: '地图种子', tooltip: '负数=每次随机；>=0 可复现同一地图', group: { name: '地图参数' } })
    public mapSeed = -1;

    /** 与素材一致的像素尺寸（新素材主地砖为 48x48） */
    @property({ displayName: '单格尺寸（像素）', tooltip: '需与 SpriteFrame 尺寸一致，主地砖填 48', group: { name: '地图参数' } })
    public tileSize = 48;

    // ───────────────────────── 运行时数据 ─────────────────────────

    /** 运行时网格数据，值为 TileType 枚举。grid[x][y] 对应第 x 列第 y 行。 */
    public readonly grid: number[][] = [];

    private _rngState = 0;

    // ───────────────────────── 生命周期 ─────────────────────────

    protected start(): void {
        this.generateMap();
    }

    // ───────────────────────── 公开接口 ─────────────────────────

    /**
     * 生成（或重新生成）整张地图。
     * 若要在运行时多次调用，会先清空旧子节点并销毁。
     */
    public generateMap(): void {
        this._prepareRng();

        // 清空旧节点（必须 destroy，否则只 removeFromParent 会泄漏）
        for (let i = this.node.children.length - 1; i >= 0; i--) {
            this.node.children[i].destroy();
        }
        this.grid.length = 0;

        const cx = Math.floor(this.mapWidth / 2);
        const cy = Math.floor(this.mapHeight / 2);

        for (let x = 0; x < this.mapWidth; x++) {
            const row: number[] = [];
            this.grid.push(row);
            for (let y = 0; y < this.mapHeight; y++) {
                let type = TileType.FLOOR;

                /** 中心 3x3 保护区：避免开局刷在墙里 */
                const inSpawnSafe = Math.abs(x - cx) <= 1 && Math.abs(y - cy) <= 1;
                const isEdge = x === 0 || x === this.mapWidth - 1 || y === 0 || y === this.mapHeight - 1;

                if (isEdge) {
                    // 边缘强制为实心墙
                    type = TileType.WALL;
                } else if (!inSpawnSafe) {
                    const roll = this._rand01();
                    if (roll < this.obstacleDensity) {
                        type = TileType.WALL;
                    } else if (roll < this.obstacleDensity + this.coverDensity) {
                        type = TileType.LOW_COVER;
                    }
                }

                row.push(type);
                this.createTile(x, y, type);
            }
        }
    }

    /**
     * 根据世界坐标查询格子类型。
     *
     * 用法示例（子弹碰撞检测）：
     * ```ts
     * const mapMgr = this.node.parent.getComponent(MapManager);
     * const type = mapMgr.getTileTypeAt(bullet.worldPos.x, bullet.worldPos.y);
     * if (type === TileType.WALL) { ... }        // 完全阻挡
     * if (type === TileType.LOW_COVER) { ... }   // 子弹被阻挡，人可跨越
     * ```
     *
     * @param worldX 世界坐标 X
     * @param worldY 世界坐标 Y
     * @returns TileType 枚举值；坐标越界返回 TileType.WALL
     */
    public getTileTypeAt(worldX: number, worldY: number): TileType {
        // 将世界坐标转换为 MapRoot 本地坐标
        const ui = this.node.getComponent(UITransform)!;
        const localPos = ui.convertToNodeSpaceAR(new Vec3(worldX, worldY, 0));
        const gx = Math.floor(localPos.x / this.tileSize);
        const gy = Math.floor(localPos.y / this.tileSize);

        if (gx < 0 || gx >= this.mapWidth || gy < 0 || gy >= this.mapHeight) {
            return TileType.WALL; // 越界视为墙
        }
        return this.grid[gx][gy];
    }

    /**
     * 根据网格坐标查询格子类型（供寻路等逻辑直接使用）。
     *
     * @param gx 网格 X（列）
     * @param gy 网格 Y（行）
     * @returns TileType 枚举值；坐标越界返回 TileType.WALL
     */
    public getTileTypeAtGrid(gx: number, gy: number): TileType {
        if (gx < 0 || gx >= this.mapWidth || gy < 0 || gy >= this.mapHeight) {
            return TileType.WALL;
        }
        return this.grid[gx][gy];
    }

    /**
     * 判断某格是否可通行（玩家移动判定）。
     * FLOOR 可通行；WALL 不可通行；LOW_COVER 可通行（但可能减速）。
     */
    public isWalkable(gx: number, gy: number): boolean {
        const type = this.getTileTypeAtGrid(gx, gy);
        return type !== TileType.WALL;
    }

    /**
     * 判断某格是否阻挡子弹。
     * WALL 和 LOW_COVER 均阻挡子弹；FLOOR 不阻挡。
     */
    public isBulletBlocking(gx: number, gy: number): boolean {
        const type = this.getTileTypeAtGrid(gx, gy);
        return type === TileType.WALL || type === TileType.LOW_COVER;
    }

    /**
     * 将世界坐标转换为网格坐标。
     * @returns { gx, gy } 或 null（越界时）
     */
    public worldToGrid(worldX: number, worldY: number): { gx: number; gy: number } | null {
        const ui = this.node.getComponent(UITransform)!;
        const localPos = ui.convertToNodeSpaceAR(new Vec3(worldX, worldY, 0));
        const gx = Math.floor(localPos.x / this.tileSize);
        const gy = Math.floor(localPos.y / this.tileSize);
        if (gx < 0 || gx >= this.mapWidth || gy < 0 || gy >= this.mapHeight) {
            return null;
        }
        return { gx, gy };
    }

    /**
     * 将网格坐标转换为世界坐标（格子中心）。
     */
    public gridToWorld(gx: number, gy: number): Vec3 {
        const ui = this.node.getComponent(UITransform)!;
        const localX = gx * this.tileSize + this.tileSize / 2;
        const localY = gy * this.tileSize + this.tileSize / 2;
        return ui.convertToWorldSpaceAR(new Vec3(localX, localY, 0));
    }

    // ───────────────────────── 内部方法 ─────────────────────────

    private createTile(gridX: number, gridY: number, type: TileType): void {
        let sprites: SpriteFrame[];
        switch (type) {
            case TileType.FLOOR:
                sprites = this.floorSprites;
                break;
            case TileType.WALL:
                sprites = this.wallSprites;
                break;
            case TileType.LOW_COVER:
                sprites = this.coverSprites;
                break;
            default:
                sprites = this.floorSprites;
        }

        if (sprites.length === 0) {
            console.warn(`[MapManager] 素材库为空(type=${type})，跳过绘制 Tile_${gridX}_${gridY}`);
            return;
        }

        const tileNode = new Node(`Tile_${gridX}_${gridY}`);
        tileNode.parent = this.node;

        // 以左下角为原点向右、向上铺：第 (0,0) 格落在 MapRoot 本地坐标 (0,0)
        tileNode.setPosition(new Vec3(gridX * this.tileSize, gridY * this.tileSize, 0));

        const ui = tileNode.addComponent(UITransform);
        ui.setAnchorPoint(0, 0);
        ui.setContentSize(this.tileSize, this.tileSize);

        const sprite = tileNode.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;

        const idx = Math.floor(this._rand01() * sprites.length);
        sprite.spriteFrame = sprites[idx];
    }

    private _prepareRng(): void {
        if (this.mapSeed >= 0) {
            this._rngState = this.mapSeed >>> 0;
        }
    }

    /** 返回 [0, 1) 随机数；mapSeed < 0 时用 Math.random */
    private _rand01(): number {
        if (this.mapSeed < 0) {
            return Math.random();
        }
        // 32-bit LCG，足够小游戏原型使用
        this._rngState = (1664525 * this._rngState + 1013904223) >>> 0;
        return this._rngState / 4294967296;
    }
}
