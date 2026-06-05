import { _decorator, Component, Node, Vec3, input, Input, EventKeyboard, KeyCode } from 'cc';
import { MapManager } from './MapManager';

const { ccclass, property } = _decorator;

/** 玩家编号 */
export enum PlayerID {
    PLAYER_1 = 1,
    PLAYER_2 = 2,
}

/**
 * 双人本地键盘控制器。
 *
 * - 玩家1：W A S D
 * - 玩家2：↑ ← ↓ →
 * - 碰撞：X / Y 轴独立检测，支持沿墙滑动。
 *
 * 使用说明：
 * 1. 将本组件挂在玩家节点上（节点需有 UITransform）。
 * 2. 在 Inspector 中设置 playerID（1 或 2）和 speed。
 * 3. 场景中需存在 MapManager 组件（挂在 MapRoot 节点上）。
 */
@ccclass('PlayerController')
export class PlayerController extends Component {

    @property({ displayName: '玩家编号', tooltip: '1 或 2', group: { name: '玩家设置' } })
    public playerID: PlayerID = PlayerID.PLAYER_1;

    @property({ displayName: '移动速度', tooltip: '像素/秒', group: { name: '玩家设置' } })
    public speed = 200;

    @property({ displayName: '碰撞缩放', tooltip: '碰撞体相对格子的比例 (0~1)，越小越宽松', range: [0.3, 1, 0.05], group: { name: '玩家设置' } })
    public collisionScale = 0.8;

    // 按键状态（每帧读取，不依赖事件触发）
    private _left = false;
    private _right = false;
    private _up = false;
    private _down = false;

    private _mapManager: MapManager | null = null;
    private _tempPos = new Vec3();

    // ───────────────────────── 生命周期 ─────────────────────────

    protected onLoad(): void {
        // 查找 MapManager（挂在 MapRoot 上，与玩家节点同级或祖先）
        this._mapManager = this.node.parent?.getComponentInChildren(MapManager) ?? null;
        if (!this._mapManager) {
            console.error('[PlayerController] 未找到 MapManager 组件，请确保场景中有 MapRoot 节点');
        }

        // 注册键盘事件
        input.on(Input.EventType.KEY_DOWN, this._onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this._onKeyUp, this);
    }

    protected onDestroy(): void {
        input.off(Input.EventType.KEY_DOWN, this._onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this._onKeyUp, this);
    }

    protected update(dt: number): void {
        if (!this._mapManager) return;

        // 计算方向向量
        let dx = 0;
        let dy = 0;
        if (this._left) dx -= 1;
        if (this._right) dx += 1;
        if (this._down) dy -= 1;
        if (this._up) dy += 1;

        // 对角线归一化
        if (dx !== 0 && dy !== 0) {
            const inv = 1 / Math.SQRT2;
            dx *= inv;
            dy *= inv;
        }

        if (dx === 0 && dy === 0) return;

        const moveX = dx * this.speed * dt;
        const moveY = dy * this.speed * dt;

        this.node.getPosition(this._tempPos);

        // ── X 轴碰撞检测 ──
        if (moveX !== 0) {
            const testX = this._tempPos.x + moveX;
            if (this._canMoveTo(testX, this._tempPos.y)) {
                this._tempPos.x = testX;
            }
        }

        // ── Y 轴碰撞检测 ──
        if (moveY !== 0) {
            const testY = this._tempPos.y + moveY;
            if (this._canMoveTo(this._tempPos.x, testY)) {
                this._tempPos.y = testY;
            }
        }

        this.node.setPosition(this._tempPos);
    }

    // ───────────────────────── 碰撞检测 ─────────────────────────

    /**
     * 判断目标位置是否可移动。
     * 检测碰撞体四个角点，任一角点落在不可通行格子中即判定不可移动。
     */
    private _canMoveTo(x: number, y: number): boolean {
        const half = (this._mapManager!.tileSize * this.collisionScale) / 2;

        // 检测碰撞体的四个角
        const corners = [
            [x - half, y - half],
            [x + half, y - half],
            [x - half, y + half],
            [x + half, y + half],
        ];

        for (const [cx, cy] of corners) {
            const grid = this._mapManager!.worldToGrid(cx, cy);
            if (!grid) return false; // 越界不可通行
            if (!this._mapManager!.isWalkable(grid.gx, grid.gy)) {
                return false;
            }
        }
        return true;
    }

    // ───────────────────────── 按键处理 ─────────────────────────

    private _onKeyDown(event: EventKeyboard): void {
        this._setKey(event.keyCode, true);
    }

    private _onKeyUp(event: EventKeyboard): void {
        this._setKey(event.keyCode, false);
    }

    private _setKey(code: KeyCode, pressed: boolean): void {
        if (this.playerID === PlayerID.PLAYER_1) {
            switch (code) {
                case KeyCode.KEY_A: this._left = pressed; break;
                case KeyCode.KEY_D: this._right = pressed; break;
                case KeyCode.KEY_W: this._up = pressed; break;
                case KeyCode.KEY_S: this._down = pressed; break;
            }
        } else {
            switch (code) {
                case KeyCode.ARROW_LEFT: this._left = pressed; break;
                case KeyCode.ARROW_RIGHT: this._right = pressed; break;
                case KeyCode.ARROW_UP: this._up = pressed; break;
                case KeyCode.ARROW_DOWN: this._down = pressed; break;
            }
        }
    }
}
