import { _decorator, Component, Node, Prefab, instantiate, Vec3, UITransform, Sprite, Color } from 'cc';
import { MapManager, TileType } from './MapManager';
import { PlayerController, PlayerID } from './PlayerController';

const { ccclass, property } = _decorator;

/**
 * 游戏管理器 —— 负责地图生成后动态创建双人角色。
 *
 * 使用说明（编辑器）：
 * 1. 在场景中创建空节点 `GameManager`，本组件挂在该节点上。
 * 2. 将 `MapRoot` 节点拖入 mapRoot 属性。
 * 3. 将玩家 Prefab 拖入 playerPrefab 属性（Prefab 需包含 PlayerController 组件）。
 * 4. 若不使用 Prefab，可将 useFallback 阅开，会自动生成带颜色的方块角色。
 * 5. 运行后自动在地图中心保护区生成两个玩家。
 */
@ccclass('GameManager')
export class GameManager extends Component {

    @property({ type: Node, displayName: 'MapRoot 节点', group: { name: '引用' } })
    public mapRoot: Node | null = null;

    @property({ type: Prefab, displayName: '玩家 Prefab', tooltip: '需包含 PlayerController 组件', group: { name: '引用' } })
    public playerPrefab: Prefab | null = null;

    @property({ displayName: '使用方块角色', tooltip: '无 Prefab 时自动生成红/蓝色方块作为角色', group: { name: '引用' } })
    public useFallback = true;

    /** 运行时生成的玩家节点（外部可读取） */
    public player1: Node | null = null;
    public player2: Node | null = null;

    protected start(): void {
        // 等一帧确保 MapManager.start() 已执行完毕
        this.scheduleOnce(() => {
            this._spawnPlayers();
        }, 0);
    }

    private _spawnPlayers(): void {
        if (!this.mapRoot) {
            console.error('[GameManager] mapRoot 未设置');
            return;
        }

        const mapMgr = this.mapRoot.getComponent(MapManager);
        if (!mapMgr) {
            console.error('[GameManager] MapRoot 上未找到 MapManager 组件');
            return;
        }

        // 中心保护区坐标（3x3 区域的四个角格）
        const cx = Math.floor(mapMgr.mapWidth / 2);
        const cy = Math.floor(mapMgr.mapHeight / 2);

        // 玩家1出生点：保护区左下角 (cx-1, cy-1)
        // 玩家2出生点：保护区右上角 (cx+1, cy+1)
        const spawn1 = mapMgr.gridToWorld(cx - 1, cy - 1);
        const spawn2 = mapMgr.gridToWorld(cx + 1, cy + 1);

        this.player1 = this._createPlayer(spawn1, PlayerID.PLAYER_1);
        this.player2 = this._createPlayer(spawn2, PlayerID.PLAYER_2);

        console.log(`[GameManager] 玩家1 出生于 (${cx - 1}, ${cy - 1})`);
        console.log(`[GameManager] 玩家2 出生于 (${cx + 1}, ${cy + 1})`);
    }

    private _createPlayer(worldPos: Vec3, id: PlayerID): Node {
        let playerNode: Node;

        if (this.playerPrefab) {
            // 使用 Prefab 实例化
            playerNode = instantiate(this.playerPrefab);
        } else if (this.useFallback) {
            // 无 Prefab 时生成方块角色
            playerNode = this._createFallbackPlayer(id);
        } else {
            console.error('[GameManager] 未设置 playerPrefab 且 useFallback 为 false');
            return new Node('EmptyPlayer');
        }

        playerNode.name = `Player_${id}`;
        playerNode.parent = this.node.parent; // 挂在场景根节点下

        // 设置位置（世界坐标）
        playerNode.setWorldPosition(worldPos);

        // 配置 PlayerController
        let ctrl = playerNode.getComponent(PlayerController);
        if (!ctrl) {
            ctrl = playerNode.addComponent(PlayerController);
        }
        ctrl.playerID = id;

        return playerNode;
    }

    /**
     * 创建方块角色（无 Prefab 时的后备方案）。
     * 玩家1 红色，玩家2 蓝色。
     */
    private _createFallbackPlayer(id: PlayerID): Node {
        const node = new Node(`Player_${id}_Fallback`);
        const tileSize = this.mapRoot?.getComponent(MapManager)?.tileSize ?? 48;

        const ui = node.addComponent(UITransform);
        ui.setContentSize(tileSize * 0.7, tileSize * 0.7);

        const sprite = node.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.color = id === PlayerID.PLAYER_1
            ? new Color(220, 60, 60, 255)   // 玩家1 红色
            : new Color(60, 120, 220, 255);  // 玩家2 蓝色

        return node;
    }
}
