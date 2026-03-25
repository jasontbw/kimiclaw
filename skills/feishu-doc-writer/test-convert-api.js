#!/usr/bin/env node
/**
 * 飞书文档 Convert API 测试工具
 * 测试 Markdown 表格转换支持
 */

const https = require('https');

// 测试 Markdown 内容（包含表格）
const testMarkdown = `# 测试文档

## 简单表格

| 列1 | 列2 | 列3 |
|-----|-----|-----|
| A   | B   | C   |
| D   | E   | F   |

## 普通文本

这是一段普通文本。

- 列表项1
- 列表项2
`;

// 调用飞书 Convert API
async function testConvertAPI(token, documentId) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      content: testMarkdown,
      content_type: "markdown"
    });
    
    const options = {
      hostname: 'open.feishu.cn',
      path: `/open-apis/docx/v1/documents/${documentId}/convert`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': data.length
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve(result);
        } catch (e) {
          resolve(body);
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// 主函数
async function main() {
  const token = process.argv[2];
  const documentId = process.argv[3];
  
  if (!token || !documentId) {
    console.log('Usage: node test-convert-api.js <tenant_access_token> <document_id>');
    console.log('');
    console.log('测试内容包含：');
    console.log('- Markdown 表格');
    console.log('- 普通文本');
    console.log('- 列表');
    console.log('');
    console.log('注意：Convert API 对表格的支持有限，表格可能被忽略或转为文本');
    process.exit(1);
  }
  
  console.log('🧪 Testing Feishu Convert API...');
  console.log('');
  console.log('Test content:');
  console.log(testMarkdown);
  console.log('');
  
  try {
    const result = await testConvertAPI(token, documentId);
    console.log('API Response:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();
