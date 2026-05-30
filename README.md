# NewProject

基于 **Cocos Creator 3.8.8** 开发的 2D 像素风地牢/冒险小游戏。

## 项目简介

这是一个早期原型阶段的游戏项目，使用 Kenney 像素素材包，通过代码随机生成 2D 网格地图。

## 核心功能

- **随机地图生成** — 支持 20×20 网格地图，含地板与障碍物
- **种子系统** — 通过 `mapSeed` 参数可复现同一地图（适用于联机同步）
- **保护区机制** — 中心 3×3 区域保证玩家出生点不被墙卡住
- **可配置参数** — 地图尺寸、障碍物密度、单格像素大小均可在编辑器中调整

## 素材来源

- [Kenney Pixel Top-down](https://kenney.nl/assets/pixel-top-down-basic) — 16×16 像素图块素材

## 技术栈

- **引擎**: Cocos Creator 3.8.8
- **语言**: TypeScript
- **素材格式**: 16×16 PNG 像素图块

## 目录结构

```
assets/
├── PNG/              # 像素素材（Enemies, Players, Tiles, Weapons, Interface）
├── scenes/
│   └── 01-Main.scene # 主场景
└── scripts/
    └── MapManager.ts # 地图管理器
```

## 使用方法

1. 使用 Cocos Creator 3.8.8 打开项目
2. 打开 `assets/scenes/01-Main.scene`
3. 在 MapRoot 节点上配置地板和障碍物的 SpriteFrame
4. 点击运行即可看到随机生成的地图
