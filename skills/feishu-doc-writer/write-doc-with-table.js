#!/usr/bin/env node
/**
 * Feishu Doc Writer with Table Support
 * 
 * 支持 Markdown 表格的飞书文档写入工具
 * 
 * 使用方法：
 * node write-doc-with-table.js --token <access_token> --folder <folder_token> --title "文档标题" --file <input.md>
 */

const fs = require('fs');
const https = require('https');

// 导入转换模块
const { markdownToFeishuBlocks, generateApiRequest } = require('./md-table-to-feishu');

/**
 * 发送 HTTP 请求
 */
function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

/**
 * 创建文档
 */
async function createDocument(token, folderToken, title) {
  const result = await request({
    hostname: 'open.feishu.cn',
    path: '/open-apis/docx/v1/documents',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, {
    folder_token: folderToken,
    title: title
  });
  
  if (result.code !== 0) {
    throw new Error(`Create document failed: ${result.msg}`);
  }
  
  return result.data.document.document_id;
}

/**
 * 批量创建 Blocks
 */
async function createBlocks(token, documentId, blocks) {
  // 分离表格和普通 blocks
  const normalBlocks = [];
  const tableBlocks = [];
  
  blocks.forEach((block, index) => {
    if (block.type === 'table') {
      tableBlocks.push({ ...block, index });
    } else if (block.type === 'block') {
      const { type, ...blockData } = block;
      normalBlocks.push(blockData);
    }
  });
  
  // 先创建普通 blocks
  if (normalBlocks.length > 0) {
    const result = await request({
      hostname: 'open.feishu.cn',
      path: `/open-apis/docx/v1/documents/${documentId}/blocks/${documentId}/children?document_revision_id=-1`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, { children: normalBlocks });
    
    if (result.code !== 0) {
      throw new Error(`Create blocks failed: ${result.msg}`);
    }
  }
  
  // 再创建表格（每个表格需要两步：先创建容器，再创建单元格）
  for (const tableBlock of tableBlocks) {
    // 第1步：创建表格容器
    const tableResult = await request({
      hostname: 'open.feishu.cn',
      path: `/open-apis/docx/v1/documents/${documentId}/blocks/${documentId}/children?document_revision_id=-1`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, { children: [tableBlock.tableBlock] });
    
    if (tableResult.code !== 0) {
      console.error('Table container creation failed:', tableResult.msg);
      continue;
    }
    
    // 获取表格 block_id
    const tableBlockId = tableResult.data?.block_ids?.[0];
    if (!tableBlockId) {
      console.error('Failed to get table block_id');
      continue;
    }
    
    // 第2步：创建单元格
    // 注意：单元格需要作为表格的子块创建
    for (let i = 0; i < tableBlock.cellBlocks.length; i++) {
      const cellBlock = tableBlock.cellBlocks[i];
      const cellId = tableBlock.cells[i];
      
      // 使用 cells 中的 ID 作为 parent
      const cellResult = await request({
        hostname: 'open.feishu.cn',
        path: `/open-apis/docx/v1/documents/${documentId}/blocks/${cellId}/children?document_revision_id=-1`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }, { children: cellBlock.table_cell.children });
      
      if (cellResult.code !== 0) {
        console.error(`Cell ${i} creation failed:`, cellResult.msg);
      }
    }
    
    console.log(`✅ Table created with ${tableBlock.cellBlocks.length} cells`);
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const params = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    params[key] = args[i + 1];
  }
  
  if (!params.token || !params.folder || !params.title || !params.file) {
    console.log('Usage:');
    console.log('  node write-doc-with-table.js --token <access_token> --folder <folder_token> --title "文档标题" --file <input.md>');
    console.log('');
    console.log('Example:');
    console.log('  node write-doc-with-table.js --token "u-xxx" --folder "RTNGxxx" --title "我的文档" --file "doc.md"');
    process.exit(1);
  }
  
  if (!fs.existsSync(params.file)) {
    console.error(`Error: File not found ${params.file}`);
    process.exit(1);
  }
  
  try {
    console.log('📝 Reading markdown file...');
    const markdown = fs.readFileSync(params.file, 'utf-8');
    
    console.log('🔄 Converting markdown to Feishu blocks...');
    const blocks = markdownToFeishuBlocks(markdown);
    
    console.log(`📊 Found ${blocks.filter(b => b.type === 'table').length} table(s)`);
    console.log(`📝 Total blocks: ${blocks.length}`);
    
    console.log('📄 Creating document...');
    const documentId = await createDocument(params.token, params.folder, params.title);
    console.log(`✅ Document created: ${documentId}`);
    
    console.log('🚀 Writing blocks...');
    await createBlocks(params.token, documentId, blocks);
    
    console.log('');
    console.log('✅ Success!');
    console.log(`📄 Document URL: https://feishu.cn/docx/${documentId}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// 如果是直接运行
if (require.main === module) {
  main();
}

module.exports = { createDocument, createBlocks };
