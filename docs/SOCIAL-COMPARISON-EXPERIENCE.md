# 社交媒体与社会比较课堂体验

本分支在原有 FoundPhone Studio 手机运行时上增加课堂模拟内容，保留原有 Phone、App Registry、社交皮肤和事件引擎。

## 内容入口

- `stories/template/story.json`：课堂体验默认数据。
- `redbook`：36 条小红书模拟笔记，包含学业、职业、财富、恋爱、婚姻、生育、外貌、旅行、生活方式、挫折和普通日常。
- `wechat`：朋友圈动态；`chats`：8 个好友会话与多轮消息。
- `weibo`：10 个热搜话题与 8 条不同立场的用户内容。
- `twitter`：中英文混合的跨年龄动态。
- `douyin`：短视频信息流模拟内容。
- `insights`：浏览画像 App 的入口记录。

所有人物、动态、评论与聊天均为虚构示例，不连接真实平台账号。

## 本地行为记录

`src/skins/study.ts` 通过 IntersectionObserver 记录进入可视区域的内容，以及离开可视区域时的停留时长；通过统一事件记录点赞、取消点赞、收藏、取消收藏、评论查看、评论提交、聊天打开、搜索和热搜点击。

事件保存在当前浏览器 localStorage 的 `foundphone-study-events` 键中，最多保留最近 3000 条。记录包含 App、内容 ID、内容标题、标签、时间戳和可选停留时长。标签来自内容 `meta.tags`，以逗号分隔。

行为记录仅用于描述内容关注和交互偏好，不用于诊断、推断或标注参与者的心理状态。浏览画像页提供重置记录按钮；课堂参与者更换时建议先重置。

## 画像指标

浏览画像按内容标签汇总浏览次数、点赞次数、收藏次数和停留时间，并显示重复浏览数量、进入过的平台及主题揭示文本。浏览事件与停留事件是不同事件，停留时间只在内容离开可视区或 App 卸载时累计。

## 验证

建议在项目目录执行：

```sh
npm ci
npm run story:validate
npm run story:test
npm run typecheck
npm test
npm run build
npm run test:e2e
```

行为追踪依赖浏览器 IntersectionObserver 与 localStorage；若浏览器禁用本地存储，交互仍可使用，但行为记录无法跨刷新保存。
