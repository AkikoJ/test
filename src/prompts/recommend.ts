export function buildRecommendPrompt(
  productsJson: string,
  userProfileJson: string,
): string {
  return `基于以下产品数据和用户画像，生成推荐回复。

## 匹配到的产品
${productsJson}

## 用户画像
${userProfileJson}

## 输出要求
请生成两部分内容，用 "---SPLIT---" 分隔：

第一部分：给用户的推荐回复（自然语言，适合微信阅读，不超过500字）
---SPLIT---
第二部分：从本轮对话中提取/更新的用户画像信息（JSON格式），包含：
{
  "industry": "行业",
  "useCase": "使用场景",
  "budget": "预算水平: 低/中/高",
  "preferredSpecs": ["偏好规格"],
  "lastIntent": "最近意图",
  "tags": ["用户标签"]
}
仅输出有变化或新增的字段，没有变化的字段不要包含。`;
}
