import { _decorator, Component, Node, SpriteFrame, Sprite, UITransform, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

/**
 * 地图格子的逻辑类型（用于生成与后续碰撞/寻址）
 */
enum TileType {
    /** 可走平地 */
    FLOOR = 0,
    /** 障碍（墙、箱子、仙人掌等） */
    WALL = 1,
}

/**
 * 路线 B：用代码网格 + Sprite 随机铺地砖。
 *
 * 使用说明（编辑器）：
 * 1. 在场景中创建空节点 `MapRoot`，本组件挂在该节点上。
 * 2. 将若干地板、障碍的 SpriteFrame 拖入对应数组（勿留空数组，否则运行时会跳过生成）。
 * 3. 若 `mapSeed >= 0`，每局地图可完全复现（联机时服务器下发同一种子即可）。
 *
 * 说明：Gemini 原版在 createTile 里只加了 Sprite、却去 getComponent(UITransform)，会得到 null 并崩溃。
 * 这里改为显式 addComponent(UITransform)，并把锚点设为左下角，配合“从左下角往右上铺格”的坐标更直观。
 */
@ccclass('MapManager')
export class MapManager extends Component {
    @property({ type: [SpriteFrame], displayName: '地板素材库' })
    public floorSprites: SpriteFrame[] = [];

    @property({ type: [SpriteFrame], displayName: '障碍素材库' })
    public wallSprites: SpriteFrame[] = [];

    @property({ displayName: '地图宽度（格）', tooltip: '横向格子数量' })
    public mapWidth = 20;

    @property({ displayName: '地图高度（格）', tooltip: '纵向格子数量' })
    public mapHeight = 20;

    @property({
        displayName: '障碍物密度',
        tooltip: '0~1，越大墙越多。边缘永远是墙。',
        range: [0, 1, 0.01],
    })
    public obstacleDensity = 0.15;

    /**
     * 地图随机种子。
     * - 小于 0：每次运行使用 Math.random()（本地调试方便）。
     * - 大于等于 0：固定种子，generateMap 结果可复现（联机一致性 / 回放）。
     */
    @property({ displayName: '地图种子', tooltip: '负数=每次随机；>=0 可复现同一地图' })
    public mapSeed = -1;

    /** 与素材一致的像素尺寸（Kenney 该包地砖为 16x16） */
    @property({ displayName: '单格尺寸（像素）', tooltip: '通常填 16，需与 SpriteFrame 尺寸一致' })
    public tileSize = 16;

    /** 运行时网格数据，方便后续做碰撞、道具刷新等（只读使用即可） */
    public readonly grid: number[][] = [];

    private _rngState = 0;

    protected start(): void {
        this.generateMap();
    }

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

                if (isEdge || (this._rand01() < this.obstacleDensity && !inSpawnSafe)) {
                    type = TileType.WALL;
                }

                row.push(type);
                this.createTile(x, y, type);
            }
        }
    }

    private createTile(gridX: number, gridY: number, type: TileType): void {
        if (type === TileType.FLOOR && this.floorSprites.length === 0) {
            console.warn('[MapManager] 地板素材库为空，跳过绘制地板');
            return;
        }
        if (type === TileType.WALL && this.wallSprites.length === 0) {
            console.warn('[MapManager] 障碍素材库为空，跳过绘制障碍');
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

        if (type === TileType.FLOOR) {
            const idx = Math.floor(this._rand01() * this.floorSprites.length);
            sprite.spriteFrame = this.floorSprites[idx];
        } else {
            const idx = Math.floor(this._rand01() * this.wallSprites.length);
            sprite.spriteFrame = this.wallSprites[idx];
        }
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
