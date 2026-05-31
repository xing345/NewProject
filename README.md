# NewProject

基于 **Cocos Creator 3.8.8** 开发的 2D 像素风双人手持枪械对战射击小游戏。

## 项目简介

一款俯视角（Top-down）像素风射击对战游戏，支持双人本地对战。游戏地图随机生成，包含多种风格的地形与掩体，玩家需要利用地形和武器进行战术对战。

## 核心功能

- **随机地图生成** — 网格地图随机铺设地板与障碍物，支持种子系统复现同一地图
- **多种美术风格** — 现代特种战术、赛博朋克街头、末日废土、搞怪趣味四种风格混合
- **种子系统** — 通过 `mapSeed` 参数可复现同一地图（适用于联机同步/回放）
- **保护区机制** — 中心区域保证玩家出生点不被墙卡住
- **可配置参数** — 地图尺寸、障碍物密度、单格像素大小均可在编辑器中调整

## 素材来源

所有素材均来自 [OpenGameArt.org](https://opengameart.org)，采用 CC0 或 CC-BY 开源许可：

| 素材包 | 许可证 | 用途 |
|--------|--------|------|
| [Topdown Shooter](https://opengameart.org/content/topdown-shooter) | CC0 | 主地砖 (48x48) + 8 种角色 |
| [Sci-Fi Facility](https://opengameart.org/content/sci-fi-facility-asset-pack) | CC0 | 赛博风地砖、守卫、特效 |
| [Pixel Art Wasteland](https://opengameart.org/content/pixel-art-wasteland) | CC0 | 废土地砖 (16x16) |
| [Characters/Zombies/Weapons](https://opengameart.org/content/characters-zombies-and-weapons-oh-my) | CC0 | 角色部件 |
| [Animated Survivor](https://opengameart.org/content/animated-top-down-survivor-player) | CC-BY 3.0 | 玩家角色 (步枪/霰弹枪/刀) |
| [Animated Zombie](https://opengameart.org/content/animated-top-down-zombie) | CC0 | 骷髅/僵尸敌人 |
| [Space Ship Shooter](https://opengameart.org/content/space-ship-shooter-pixel-art-assets) | CC0 | 激光、飞船、道具 |

## 技术栈

- **引擎**: Cocos Creator 3.8.8
- **语言**: TypeScript
- **素材处理**: Python (Pillow) 自动切分 Spritesheet
- **素材规格**: 48x48 主地砖 + 16x16 辅助地砖 + 多尺寸角色/特效

## 目录结构

```
assets/
├── textures/
│   ├── tiles/              # 地砖素材 (1121 个: 48x48 主力 + 16x16 辅助)
│   ├── characters/         # 角色素材 (686 个: 战术/赛博/废土/搞怪风格)
│   ├── weapons_and_items/  # 武器道具 (131 个: 飞船/激光/道具)
│   └── fx/                 # 特效素材 (33 个: 激光/烟雾/粒子)
├── scripts/
│   └── MapManager.ts       # 地图管理器
└── scenes/                 # 场景文件 (需在编辑器中创建)

scripts/
└── process_assets.py       # 素材自动切分与整理脚本

raw_assets/                 # 原始下载素材 (已 gitignore)
```

## 使用方法

1. 使用 Cocos Creator 3.8.8 打开项目
2. 创建新场景，在场景中创建空节点 `MapRoot`
3. 将 `MapManager` 组件挂载到 `MapRoot` 节点
4. 将 `assets/textures/tiles/` 中的地砖拖入 `floorSprites` 和 `wallSprites` 数组
5. 调整 `tileSize` 为 48（主地砖尺寸）
6. 点击运行即可看到随机生成的射击对战地图

## 素材处理脚本

项目包含 Python 脚本用于自动切分和整理 Spritesheet：

```bash
# 安装依赖
pip install Pillow

# 运行素材处理
python scripts/process_assets.py
```

脚本功能：
- 自动下载并解压 OpenGameArt 素材包
- 将 Spritesheet 按像素规格切分为单张小图
- 分类整理到 `assets/textures/` 对应目录
- 支持 CC0 和 CC-BY 许可证素材

## 许可证

- 代码: MIT License
- 素材: 各素材包遵循其原始许可证 (CC0 / CC-BY 3.0)
