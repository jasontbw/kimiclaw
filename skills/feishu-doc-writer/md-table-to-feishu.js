#!/usr/bin/env node
/**
 * Markdown Table to Feishu Docx Table Converter
 * 
 * 将 Markdown 表格转换为飞书 Docx API 的 Table Block 结构
 * 
 * 使用方法：
 * node md-table-to-feishu.js <input.md> <output.json>
 */

const fs = require('fs');

/**
 * 解析 Markdown 表格
 * @param {string} markdown - Markdown 内容
 * @returns {Array} 解析后的表格数据
 */
function parseMarkdownTable(markdown) {
  const lines = markdown.split('\n').filter(line => line.trim());
  const tables = [];
  let currentTable = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 检测表格行（以 | 开头和结尾）
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
      
      // 检测分隔行（包含 --- 或 :-:）
      const isSeparator = cells.every(cell => /^[-:]+$/.test(cell.replace(/-/g, '').replace(/:/g, '')));
      
      if (!isSeparator) {
        if (!currentTable) {
          currentTable = {
            headers: cells,
            rows: []
          };
        } else {
          currentTable.rows.push(cells);
        }
      }
    } else if (currentTable) {
      tables.push(currentTable);
      currentTable = null;
    }
  }
  
  if (currentTable) {
    tables.push(currentTable);
  }
  
  return tables;
}

/**
 * 生成飞书 Table Block
 * @param {Object} table - 解析后的表格数据
 * @returns {Object} 飞书 Block 结构
 */
function generateFeishuTableBlock(table) {
  const rowSize = table.rows.length + 1; // +1 for header
  const columnSize = table.headers.length;
  const columnWidth = Math.floor(600 / columnSize); // 平均分配宽度
  
  // 生成单元格 ID
  const cells = [];
  for (let i = 0; i < rowSize * columnSize; i++) {
    cells.push(`cell_${i}`);
  }
  
  // 构建表格块
  const tableBlock = {
    block_type: 31,
    table: {
      property: {
        row_size: rowSize,
        column_size: columnSize,
        column_width: Array(columnSize).fill(columnWidth),
        merge_info: []
      },
      cells: cells
    }
  };
  
  // 构建单元格块
  const cellBlocks = [];
  
  // 表头单元格
  table.headers.forEach((header, index) => {
    cellBlocks.push({
      block_type: 32,
      table_cell: {
        children: [{
          block_type: 2,
          text: {
            elements: [{
              text_run: {
                content: header,
                text_element_style: {
                  bold: true
                }
              }
            }]
          }
        }]
      }
    });
  });
  
  // 数据单元格
  table.rows.forEach(row => {
    row.forEach(cell => {
      cellBlocks.push({
        block_type: 32,
        table_cell: {
          children: [{
            block_type: 2,
            text: {
              elements: [{
                text_run: {
                  content: cell
                }
              }]
            }
          }]
        }
      });
    });
  });
  
  return {
    tableBlock,
    cellBlocks,
    cells
  };
}

/**
 * 将 Markdown 内容转换为飞书 Blocks（包含表格处理）
 * @param {string} markdown - Markdown 内容
 * @returns {Array} 飞书 Block 数组
 */
function markdownToFeishuBlocks(markdown) {
  const lines = markdown.split('\n');
  const blocks = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // 检测表格开始
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      // 收集完整表格
      let tableLines = [line];
      i++;
      
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      
      // 解析并转换表格
      const tableMarkdown = tableLines.join('\n');
      const tables = parseMarkdownTable(tableMarkdown);
      
      tables.forEach(table => {
        const { tableBlock, cellBlocks, cells } = generateFeishuTableBlock(table);
        
        // 注意：这里返回的是结构定义，实际写入需要分两步
        // 1. 先创建 tableBlock，获取 block_id
        // 2. 再用 block_id 作为 parent 创建 cellBlocks
        blocks.push({
          type: 'table',
          tableBlock,
          cellBlocks,
          cells
        });
      });
      
      continue;
    }
    
    // 处理其他 Markdown 元素（简化版）
    if (line.startsWith('# ')) {
      blocks.push({
        type: 'block',
        block_type: 3,
        heading1: {
          elements: [{ text_run: { content: line.substring(2) } }]
        }
      });
    } else if (line.startsWith('## ')) {
      blocks.push({
        type: 'block',
        block_type: 4,
        heading2: {
          elements: [{ text_run: { content: line.substring(3) } }]
        }
      });
    } else if (line.startsWith('### ')) {
      blocks.push({
        type: 'block',
        block_type: 5,
        heading3: {
          elements: [{ text_run: { content: line.substring(4) } }]
        }
      });
    } else if (line.startsWith('- ')) {
      blocks.push({
        type: 'block',
        block_type: 12,
        bullet: {
          elements: [{ text_run: { content: line.substring(2) } }]
        }
      });
    } else if (line.match(/^\d+\.\s/)) {
      blocks.push({
        type: 'block',
        block_type: 13,
        ordered: {
          elements: [{ text_run: { content: line.replace(/^\d+\.\s/, '') } }]
        }
      });
    } else if (line.trim() === '---') {
      blocks.push({
        type: 'block',
        block_type: 22,
        divider: {}
      });
    } else if (line.trim()) {
      blocks.push({
        type: 'block',
        block_type: 2,
        text: {
          elements: [{ text_run: { content: line } }]
        }
      });
    }
    
    i++;
  }
  
  return blocks;
}

/**
 * 生成完整的飞书 API 请求体
 * @param {Array} blocks - Block 数组
 * @returns {Object} API 请求体
 */
function generateApiRequest(blocks) {
  const children = [];
  const tableOperations = [];
  
  blocks.forEach(block => {
    if (block.type === 'table') {
      // 表格需要特殊处理：先创建表格容器，再创建单元格
      children.push(block.tableBlock);
      
      // 记录单元格创建操作（需要在获取表格 block_id 后执行）
      tableOperations.push({
        type: 'table_cells',
        cellBlocks: block.cellBlocks,
        cells: block.cells
      });
    } else if (block.type === 'block') {
      const { type, ...blockData } = block;
      children.push(blockData);
    }
  });
  
  return {
    children,
    tableOperations
  };
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: node md-table-to-feishu.js <input.md> [output.json]');
    process.exit(1);
  }
  
  const inputFile = args[0];
  const outputFile = args[1] || 'feishu-blocks.json';
  
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: File not found ${inputFile}`);
    process.exit(1);
  }
  
  const markdown = fs.readFileSync(inputFile, 'utf-8');
  const blocks = markdownToFeishuBlocks(markdown);
  const apiRequest = generateApiRequest(blocks);
  
  fs.writeFileSync(outputFile, JSON.stringify(apiRequest, null, 2));
  
  console.log(`✅ Converted ${inputFile} to ${outputFile}`);
  console.log(`📊 Found ${blocks.filter(b => b.type === 'table').length} table(s)`);
  console.log(`📝 Total blocks: ${blocks.length}`);
}

// 导出函数供其他模块使用
module.exports = {
  parseMarkdownTable,
  generateFeishuTableBlock,
  markdownToFeishuBlocks,
  generateApiRequest
};

// 如果是直接运行
if (require.main === module) {
  main();
}
