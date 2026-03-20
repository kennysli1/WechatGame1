# 工作流

> 完成代码后参考本文件。项目概况见 `AI_CONTEXT.md`。

---

## 常用命令

```bash
npm run dev          # 构建数据 + 启动 Vite 开发服务器 (localhost:3000)
npm run data         # Excel → JSON
npm run data:watch   # 监听 Excel 变更自动重建
npm test             # Vitest 运行单元测试
npm run build        # 生产构建 → dist/
npm run preview:static  # 生成预览快照
```

## 完成代码后的提交流程

1. 执行 `npm run preview:static` 生成 `功夫足球_preview.html`
2. 告知用户快照已更新，请双击验收
3. 等待用户确认验收通过
4. 用户确认后再执行 git add / commit / push

提交信息格式：`[Mod-X] 简要描述` 或 `[P2] 简要描述`

每次提交需同步：
- 功能代码
- 测试（新增/更新）
- 数据（如涉及 Excel 变更，先运行 `npm run data`）
- 更新 `AI_CONTEXT.md` 进度章节

## 美术资产生成后

1. 按 `docs/ART_ASSETS.md` 命名约定放置到 `assets/` 子目录
2. 更新 `docs/ART_ASSETS.md` 对应条目
3. 如新增规划外资产，更新 `asset_manifest.xlsx` 并运行 `npm run data`

## 遇到阻塞时

上报格式：

```
[阻塞] 模块: Mod-X | 阶段: PX
问题: 一句话描述
详情: 错误信息
影响: 是否阻塞其他模块
建议: 解决方案
```
