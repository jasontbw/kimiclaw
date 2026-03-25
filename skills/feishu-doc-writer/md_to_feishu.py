#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Markdown 转飞书文档（带表格支持）
使用方法: python3 md_to_feishu.py <token> <folder_token> <title> <md_file>
"""

import json
import re
import sys
import urllib.request
import urllib.error

class FeishuDocWriter:
    def __init__(self, token):
        self.token = token
        self.base_url = "https://open.feishu.cn/open-apis/docx/v1"
    
    def _request(self, method, path, data=None):
        url = f"{self.base_url}{path}"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        if data:
            data = json.dumps(data).encode('utf-8')
        
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        
        try:
            with urllib.request.urlopen(req) as response:
                return json.loads(response.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8')
            print(f"❌ API Error: {error_body}")
            raise
    
    def create_document(self, folder_token, title):
        """创建文档"""
        result = self._request("POST", "/documents", {
            "folder_token": folder_token,
            "title": title
        })
        return result["data"]["document"]["document_id"]
    
    def create_blocks(self, document_id, blocks):
        """批量创建 blocks"""
        path = f"/documents/{document_id}/blocks/{document_id}/children?document_revision_id=-1"
        return self._request("POST", path, {"children": blocks})


class MarkdownParser:
    """解析 Markdown 为 Feishu Blocks"""
    
    @staticmethod
    def parse(md_content):
        lines = md_content.split('\n')
        blocks = []
        i = 0
        
        while i < len(lines):
            line = lines[i]
            stripped = line.strip()
            
            # 空行跳过
            if not stripped:
                i += 1
                continue
            
            # 表格检测
            if stripped.startswith('|') and stripped.endswith('|'):
                table_lines = []
                while i < len(lines) and lines[i].strip().startswith('|'):
                    table_lines.append(lines[i])
                    i += 1
                table_blocks = MarkdownParser._parse_table(table_lines)
                blocks.extend(table_blocks)
                continue
            
            # 标题
            if stripped.startswith('# '):
                blocks.append(MarkdownParser._heading1(stripped[2:]))
            elif stripped.startswith('## '):
                blocks.append(MarkdownParser._heading2(stripped[3:]))
            elif stripped.startswith('### '):
                blocks.append(MarkdownParser._heading3(stripped[4:]))
            elif stripped.startswith('#### '):
                blocks.append(MarkdownParser._heading4(stripped[5:]))
            
            # 分割线
            elif stripped == '---' or stripped == '***':
                blocks.append(MarkdownParser._divider())
            
            # 无序列表
            elif stripped.startswith('- ') or stripped.startswith('* '):
                blocks.append(MarkdownParser._bullet(stripped[2:]))
            
            # 有序列表
            elif re.match(r'^\d+\.\s', stripped):
                content = re.sub(r'^\d+\.\s', '', stripped)
                blocks.append(MarkdownParser._ordered(content))
            
            # 引用
            elif stripped.startswith('> '):
                blocks.append(MarkdownParser._quote(stripped[2:]))
            
            # 普通文本
            else:
                blocks.append(MarkdownParser._text(stripped))
            
            i += 1
        
        return blocks
    
    @staticmethod
    def _parse_table(lines):
        """解析 Markdown 表格为 Feishu Table Block"""
        if len(lines) < 2:
            return []
        
        # 解析表头
        header_line = lines[0].strip()
        headers = [cell.strip() for cell in header_line.split('|')[1:-1]]
        
        # 跳过分隔行
        data_lines = lines[2:] if len(lines) > 2 and '---' in lines[1] else lines[1:]
        
        # 解析数据行
        rows = []
        for line in data_lines:
            if line.strip().startswith('|'):
                cells = [cell.strip() for cell in line.strip().split('|')[1:-1]]
                if cells:
                    rows.append(cells)
        
        # 构建 Feishu Table Block
        row_size = len(rows) + 1  # +1 for header
        column_size = len(headers)
        column_width = [150] * column_size  # 默认列宽
        
        # 生成 cell IDs
        cells = [f"cell_{i}" for i in range(row_size * column_size)]
        
        # 表格容器块
        table_block = {
            "block_type": 31,
            "table": {
                "property": {
                    "row_size": row_size,
                    "column_size": column_size,
                    "column_width": column_width,
                    "merge_info": []
                },
                "cells": cells
            }
        }
        
        blocks = [table_block]
        
        # 构建单元格内容
        all_rows = [headers] + rows
        for row_idx, row in enumerate(all_rows):
            for col_idx, cell_content in enumerate(row):
                cell_index = row_idx * column_size + col_idx
                cell_id = cells[cell_index]
                
                # 表头加粗
                is_header = row_idx == 0
                text_style = {"bold": True} if is_header else {}
                
                cell_block = {
                    "block_type": 32,
                    "table_cell": {
                        "children": [{
                            "block_type": 2,
                            "text": {
                                "elements": [{
                                    "text_run": {
                                        "content": cell_content,
                                        "text_element_style": text_style
                                    }
                                }]
                            }
                        }]
                    }
                }
                blocks.append((cell_id, cell_block))
        
        return blocks
    
    @staticmethod
    def _text(content):
        return {"block_type": 2, "text": {"elements": [{"text_run": {"content": content}}]}}
    
    @staticmethod
    def _heading1(content):
        return {"block_type": 3, "heading1": {"elements": [{"text_run": {"content": content}}]}}
    
    @staticmethod
    def _heading2(content):
        return {"block_type": 4, "heading2": {"elements": [{"text_run": {"content": content}}]}}
    
    @staticmethod
    def _heading3(content):
        return {"block_type": 5, "heading3": {"elements": [{"text_run": {"content": content}}]}}
    
    @staticmethod
    def _heading4(content):
        return {"block_type": 6, "heading4": {"elements": [{"text_run": {"content": content}}]}}
    
    @staticmethod
    def _bullet(content):
        return {"block_type": 12, "bullet": {"elements": [{"text_run": {"content": content}}]}}
    
    @staticmethod
    def _ordered(content):
        return {"block_type": 13, "ordered": {"elements": [{"text_run": {"content": content}}]}}
    
    @staticmethod
    def _quote(content):
        return {"block_type": 15, "quote": {"elements": [{"text_run": {"content": content}}]}}
    
    @staticmethod
    def _divider():
        return {"block_type": 22, "divider": {}}


def main():
    if len(sys.argv) != 5:
        print("Usage: python3 md_to_feishu.py <token> <folder_token> <title> <md_file>")
        print("")
        print("Example:")
        print('  python3 md_to_feishu.py "u-xxxx" "RTNGxxxx" "我的文档" "doc.md"')
        sys.exit(1)
    
    token = sys.argv[1]
    folder_token = sys.argv[2]
    title = sys.argv[3]
    md_file = sys.argv[4]
    
    print(f"📄 Reading {md_file}...")
    try:
        with open(md_file, 'r', encoding='utf-8') as f:
            md_content = f.read()
    except FileNotFoundError:
        print(f"❌ File not found: {md_file}")
        sys.exit(1)
    
    print("🔄 Parsing Markdown...")
    blocks = MarkdownParser.parse(md_content)
    
    # 统计
    table_count = sum(1 for b in blocks if isinstance(b, dict) and b.get("block_type") == 31)
    print(f"📊 Found {table_count} table(s), {len(blocks)} total blocks")
    
    print("📄 Creating document...")
    writer = FeishuDocWriter(token)
    
    try:
        doc_id = writer.create_document(folder_token, title)
        print(f"✅ Document created: {doc_id}")
    except Exception as e:
        print(f"❌ Failed to create document: {e}")
        sys.exit(1)
    
    print("🚀 Writing content...")
    
    # 分离表格和普通 blocks
    normal_blocks = []
    table_info = []  # (table_block, cell_blocks)
    
    i = 0
    while i < len(blocks):
        block = blocks[i]
        if isinstance(block, tuple):
            # 这是单元格 block，属于前一个表格
            if table_info:
                table_info[-1][1].append(block)
            i += 1
        elif isinstance(block, dict) and block.get("block_type") == 31:
            # 表格容器
            normal_blocks.append(block)
            table_info.append((block, []))
            i += 1
            # 收集后续的所有单元格 blocks
            while i < len(blocks) and isinstance(blocks[i], tuple):
                table_info[-1][1].append(blocks[i])
                i += 1
        else:
            normal_blocks.append(block)
            i += 1
    
    # 分批写入普通 blocks（每批50个）
    batch_size = 50
    for i in range(0, len(normal_blocks), batch_size):
        batch = normal_blocks[i:i+batch_size]
        try:
            writer.create_blocks(doc_id, batch)
            print(f"  ✓ Written blocks {i+1}-{min(i+len(batch), len(normal_blocks))}")
        except Exception as e:
            print(f"  ❌ Failed to write blocks: {e}")
    
    print("")
    print("✅ Success!")
    print(f"📄 Document URL: https://feishu.cn/docx/{doc_id}")


if __name__ == "__main__":
    main()
