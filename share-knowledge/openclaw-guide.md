# OpenClaw 使用指南

## 快速命令

```bash
# 查看状态
openclaw status

# 重启 gateway
openclaw gateway restart

# 查看插件列表
openclaw plugins list

# 安装技能
clawhub install <skill-name> --force
```

## 配置文件位置

- `~/.openclaw/openclaw.json` - 主配置
- `~/.openclaw/workspace/` - 工作空间
- `~/.openclaw/extensions/` - 插件目录

## 记忆系统结构

```
workspace/
├── MEMORY.md           # 核心索引
├── AGENTS.md           # 行为规则
├── SOUL.md             # 人格设定
├── USER.md             # 用户信息
├── memory/
│   ├── projects.md     # 项目状态
│   ├── lessons.md      # 经验教训
│   └── YYYY-MM-DD.md   # 每日日志
├── learnings/          # 学习总结
└── share-knowledge/    # 共享知识
```

## 标签规范

- `#config` - 配置相关
- `#workflow` - 工作流程
- `#security` - 安全相关
- `#user-pref` - 用户偏好

---
