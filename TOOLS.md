# TOOLS.md - 本地配置备忘

## 飞书应用配置

| 配置项 | 值 | 状态 |
|--------|-----|------|
| **AppID** | cli_a91837ce8b789bcb | ✅ |
| **AppSecret** | [已配置在openclaw.json] | ✅ |
| **权限总数** | 126项 | ✅ |
| **待开通权限** | calendar用户授权、bitable、approval等 | 🔄 |

---

## 已安装技能（Skills）

### 飞书技能（10个）
| 技能 | 能力 | 权限状态 |
|------|------|----------|
| feishu-calendar | 日历日程 | ⚠️ 需用户授权 |
| feishu-bitable | 多维表格 | ❌ 待开通 |
| feishu-approval | 审批流 | ❌ 待开通 |
| feishu-card | 交互卡片 | ✅ |
| feishu-contact | 通讯录 | ⚠️ 部分权限 |
| feishu-doc-writer | 文档写入 | ✅ |
| feishu-drive | 云空间 | ✅ |
| feishu-im | 消息群聊 | ⚠️ 部分权限 |
| feishu-task | 任务管理 | ❌ 待开通 |
| feishu-wiki | 知识库 | ⚠️ 部分权限 |

### 其他技能
- **kimi-search** — 搜索/抓取
- **kimi-claw** — 连接器

---

## 子代理配置

| 配置 | 值 |
|------|-----|
| **位置** | `/root/.openclaw/skills/liutiantuan/` |
| **最大并发** | 8个 |
| **成员数** | 7人（Miles + 6专家） |

### 六六天团成员
1. **Miles/六六** — 首席战略顾问 + 执行中枢
2. **运营总** — 运营与流程架构师
3. **财务总** — 利润与风险控制专家
4. **市场总** — 增长与市场策略官
5. **销售总** — 销售与成交专家
6. **人事总** — 组织与激励架构师
7. **社媒总** — 社交媒体操盘手

---

## 基础设施

| 配置 | 值 |
|------|-----|
| **本地仓库** | `/root/.openclaw/workspace/.git` |
| **远程仓库** | https://github.com/jasontbw/kimiclaw.git |
| **Git Token** | 已保存 |
| **主渠道** | Feishu |

---

## 常用路径

```bash
# 工作目录
cd /root/.openclaw/workspace

# 查看Git状态
git status

# 提交更改
git add -A && git commit -m "描述" && git push origin main

# 查看子代理技能
ls /root/.openclaw/skills/liutiantuan/

# 查看今日日志
cat /root/.openclaw/workspace/memory/$(date +%Y-%m-%d).md
```

---

## 待补充

- [ ] 常用SSH主机
- [ ] 摄像头/设备信息
- [ ] TTS偏好设置
- [ ] 其他环境特定配置

---

*随时更新，保持最新。*
