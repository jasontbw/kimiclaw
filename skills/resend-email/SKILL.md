---
name: resend-email
description: Resend 邮件发送服务。发送交易邮件、营销邮件，管理邮件模板和联系人列表。
required_permissions:
  - 需要 Resend API Key
---

# Resend 邮件服务

通过 Resend API 发送邮件和管理邮件列表。

**文档**: https://resend.com/docs/api-reference

---

## API 基础

| 项目 | 值 |
|------|-----|
| Base URL | `https://api.resend.com` |
| 认证方式 | `Authorization: Bearer {api_key}` |
| Content-Type | `application/json` |

---

## 发送邮件

### 发送单封邮件

```
POST /emails
```

**请求体**:
```json
{
  "from": "onboarding@resend.dev",
  "to": "user@example.com",
  "subject": "欢迎邮件",
  "html": "<p>欢迎使用我们的服务！</p>",
  "text": "欢迎使用我们的服务！",
  "reply_to": "support@example.com"
}
```

**必填字段**:
- `from`: 发件人邮箱（需在 Resend 验证）
- `to`: 收件人邮箱（支持数组批量发送）
- `subject`: 邮件主题
- `html` 或 `text`: 邮件内容（至少一个）

**选填字段**:
- `reply_to`: 回复地址
- `cc`: 抄送
- `bcc`: 密送
- `attachments`: 附件数组

### 发送带附件的邮件

```json
{
  "from": "sender@example.com",
  "to": "recipient@example.com",
  "subject": "带附件的邮件",
  "html": "<p>请查看附件</p>",
  "attachments": [
    {
      "filename": "document.pdf",
      "content": "base64_encoded_content"
    }
  ]
}
```

### 批量发送

```json
{
  "from": "sender@example.com",
  "to": ["user1@example.com", "user2@example.com"],
  "subject": "批量邮件",
  "html": "<p>大家好</p>"
}
```

---

## 邮件模板

### 创建模板

```
POST /templates
```

```json
{
  "name": "welcome-template",
  "subject": "欢迎 {{name}}！",
  "html": "<h1>你好 {{name}}</h1><p>欢迎加入！</p>"
}
```

### 使用模板发送

```json
{
  "from": "sender@example.com",
  "to": "user@example.com",
  "template_id": "template_uuid",
  "data": {
    "name": "张三"
  }
}
```

---

## 联系人管理

### 添加联系人

```
POST /audiences/{audience_id}/contacts
```

```json
{
  "email": "user@example.com",
  "first_name": "张",
  "last_name": "三",
  "unsubscribed": false
}
```

### 更新联系人

```
PATCH /audiences/{audience_id}/contacts/{contact_id}
```

### 删除联系人

```
DELETE /audiences/{audience_id}/contacts/{contact_id}
```

---

## 查询邮件状态

### 获取邮件详情

```
GET /emails/{email_id}
```

**响应**:
```json
{
  "id": "email_uuid",
  "object": "email",
  "from": "sender@example.com",
  "to": ["recipient@example.com"],
  "subject": "测试邮件",
  "status": "sent",
  "created_at": "2024-01-01T00:00:00.000Z",
  "sent_at": "2024-01-01T00:00:01.000Z"
}
```

**状态值**:
- `scheduled`: 已计划
- `queued`: 排队中
- `sent`: 已发送
- `delivered`: 已送达
- `bounced`: 退回
- `complained`: 投诉

---

## 营销邮件（Broadcasts）

### 创建广播

```
POST /broadcasts
```

```json
{
  "audience_id": "audience_uuid",
  "from": "marketing@example.com",
  "subject": "新品发布",
  "html": "<h1>新品上市！</h1>",
  "name": "新品发布活动"
}
```

### 发送广播

```
POST /broadcasts/{broadcast_id}/send
```

---

## 最佳实践

1. **域名验证**: 发送前在 Resend 后台验证发件域名
2. **退信处理**: 监控 `bounced` 状态，清理无效邮箱
3. **退订链接**: 营销邮件必须包含退订链接
4. **频率控制**: 避免短时间内大量发送，防止进入垃圾箱
5. **使用模板**: 重复性邮件使用模板，便于统一修改

---

## 配置说明

在 OpenClaw 配置中添加 Resend API Key:

```yaml
resend:
  api_key: "re_xxxxxxxxxxxx"
```

获取 API Key: https://resend.com/api-keys

---

## 免费额度

- 每天 100 封邮件（开发环境）
- 验证域名后可增加额度
- 付费计划：https://resend.com/pricing
