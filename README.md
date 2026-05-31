# NewProject

基于 **Cocos Creator 3.8.8** 开发的 2D 像素风双人手持枪械对战射击小游戏。

## 项目简介

一款俯视角（Top-down）像素风射击对战游戏，支持双人本地对战。游戏地图随机生成，包含多种风格的地形与掩体，玩家需要利用地形和武器进行战术对战。

## 核心功能

- **随机地图生成** — 网格地图随机铺设地板、实心墙与低矮掩体，支持种子系统复现同一地图
- **三种格子类型** — 地板（可通行）、实心墙（阻挡一切）、低矮掩体（阻挡子弹但可跨越）
- **多种美术风格** — 现代特种战术、赛博朋克街头、末日废土、搞怪趣味四种风格混合
- **种子系统** — 通过 `mapSeed` 参数可复现同一地图（适用于联机同步/回放）
- **保护区机制** — 中心 3x3 区域保证玩家出生点不被墙卡住
- **碰撞查询接口** — 提供 `getTileTypeAt()` / `isBulletBlocking()` / `isWalkable()` 等方法

## 素材来源

所有素材均来自 [OpenGameArt.org](https://opengameart.org)，采用 CC0 或 CC-BY 开源许可，全部为俯视角像素风格：

| 素材包 | 许可证 | 用途 |
|--------|--------|------|
| [Topdown Shooter](https://opengameart.org/content/topdown-shooter) | CC0 | 主地砖 48x48 + 8 种角色 |
| [Sci-Fi Facility](https://opengameart.org/content/sci-fi-facility-asset-pack) | CC0 | 赛博风地砖、守卫、特效 |
| [Pixel Art Wasteland](https://opengameart.org/content/pixel-art-wasteland) | CC0 | 废土地砖 16x16 |
| [Space Ship Shooter](https://opengameart.org/content/space-ship-shooter-pixel-art-assets) | CC0 | 激光、飞船、道具 |

## 素材统计

全部为俯视角像素风格，经过筛选去除高清插画风素材：

| 分类 | 数量 | 规格 | 说明 |
|------|------|------|------|
| tiles | 1116 | 48x48 + 16x16 | 主地砖 914 + 辅助地砖 202 |
| characters | 222 | 64x64 / ~49x43 / 16x16 | 8 种角色 + 赛博风小人 |
| weapons_and_items | 131 | 16x16 | 飞船、激光、道具 |
| fx | 33 | 16x16 | 激光、烟雾、粒子 |
| **合计** | **1502** | | |

## 目录结构

```
assets/
├── textures/
│   ├── tiles/              # 地砖素材 (1116 个)
│   ├── characters/         # 角色素材 (222 个)
│   ├── weapons_and_items/  # 武器道具 (131 个)
│   └── fx/                 # 特效素材 (33 个)
├── scripts/
│   └── MapManager.ts       # 地图管理器 (含碰撞查询接口)

scripts/
└── process_assets.py       # 素材自动切分与整理脚本

raw_assets/                 # 原始下载素材 (已 gitignore)
```

## 使用方法

1. 使用 Cocos Creator 3.8.8 打开项目
2. 创建新场景，在场景中创建空节点 `MapRoot`
3. 将 `MapManager` 组件挂载到 `MapRoot` 节点
4. 在 Inspector 中配置素材数组：
   - `floorSprites` — 拖入 48x48 地板地砖
   - `wallSprites` — 拖入 48x48 实心墙地砖
   - `coverSprites` — 拖入 48x48 低矮掩体地砖（沙袋/木箱等）
5. 调整参数：`tileSize=48`、`obstacleDensity=0.20`、`coverDensity=0.05`
6. 点击运行即可看到随机生成的射击对战地图

## 地图管理器接口

`MapManager` 提供以下接口供子弹碰撞和玩家移动使用：

```typescript
// 世界坐标查询格子类型
getTileTypeAt(worldX, worldY): TileType

// 网格坐标查询
getTileTypeAtGrid(gx, gy): TileType

// 判断是否可通行（FLOOR 和 LOW_COVER 可通行）
isWalkable(gx, gy): boolean

// 判断是否阻挡子弹（WALL 和 LOW_COVER 均阻挡）
isBulletBlocking(gx, gy): boolean

// 坐标转换
worldToGrid(worldX, worldY): { gx, gy } | null
gridToWorld(gx, gy): Vec3
```

## 许可证

- 代码: MIT License
- 素材: 各素材包遵循其原始许可证 (CC0 / CC-BY 3.0)
