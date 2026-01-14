# 贡献指南

感谢你对 OpenCode Cowork 的关注！我们欢迎各种形式的贡献。

## 如何贡献

### 报告 Bug

1. 在 [Issues](https://github.com/Lucifer1H/open-cowork/issues) 中搜索是否已有相同问题
2. 如果没有，创建新 Issue，包含：
   - 问题描述
   - 复现步骤
   - 期望行为
   - 实际行为
   - 环境信息（OS、OpenCode 版本、Node 版本）

### 功能建议

1. 在 Issues 中创建 Feature Request
2. 描述你想要的功能和使用场景
3. 如果可能，提供实现思路

### 提交代码

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 编写代码，确保：
   - 代码风格一致
   - 添加必要的注释
   - 更新相关文档
4. 提交更改：`git commit -m 'Add: your feature description'`
5. 推送分支：`git push origin feature/your-feature`
6. 创建 Pull Request

## 代码规范

- 使用 TypeScript
- 使用 2 空格缩进
- 变量和函数使用 camelCase
- 常量使用 UPPER_SNAKE_CASE
- 添加 JSDoc 注释

## Commit 规范

使用语义化提交信息：

- `Add:` 新功能
- `Fix:` Bug 修复
- `Docs:` 文档更新
- `Refactor:` 代码重构
- `Test:` 测试相关
- `Chore:` 构建/工具相关

## 开发环境

```bash
# 克隆仓库
git clone https://github.com/Lucifer1H/open-cowork.git
cd open-cowork

# 安装依赖
npm install

# 本地测试
./install.sh
```

## 问题？

如有任何问题，欢迎在 Issues 中提问或通过其他方式联系维护者。
