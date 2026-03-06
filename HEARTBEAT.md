# HEARTBEAT.md - 心跳检查清单

## 每次心跳检查（轮换执行）

### 检查项
- [ ] 读取 memory/heartbeat-state.json（如存在）
- [ ] 检查是否有紧急事项需要处理
- [ ] 检查今日日志是否已创建

## 每日任务（周一、三、五）
- [ ] 读取最近 3 天的日志文件
- [ ] 检查 projects.md 中的待办状态
- [ ] 如有重要进展，更新 MEMORY.md 索引

## 每周任务（周日）
- [ ] 读取过去 7 天的 memory/YYYY-MM-DD.md
- [ ] 提取重要决策和教训
- [ ] 更新 MEMORY.md 中的相关章节
- [ ] 更新 projects.md 项目状态
- [ ] 将新教训写入 lessons.md
- [ ] 删除/归档过时的信息

## 触发条件
**只在以下情况发送消息：**
- 有紧急事项需要注意
- 发现配置异常
- 需要用户确认/决策

**否则回复：** HEARTBEAT_OK

## 记录状态
检查完成后更新 memory/heartbeat-state.json：
```json
{
  "lastChecks": {
    "daily": 1708675200,
    "weekly": 1708660800
  }
}
```
