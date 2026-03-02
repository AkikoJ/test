export const INTENT_PROMPT = `分析用户的最新消息，结合对话上下文，输出一个 JSON 对象，包含以下字段：

{
  "intent": "product_query" | "comparison" | "pricing" | "specs_detail" | "general_chat" | "greeting",
  "filters": {
    "category": "产品类别（可选）",
    "keywords": ["关键词列表"],
    "priceRange": { "min": null, "max": null },
    "tags": ["用途标签"],
    "specs": {}
  },
  "needMoreInfo": true/false,
  "followUpQuestion": "如果需要更多信息，建议追问的问题"
}

注意：
- 仅输出 JSON，不要包含其他内容
- 如果用户的信息足以查询产品，needMoreInfo 设为 false
- filters 中只填写用户明确提到或可以合理推断的字段
- intent 为 general_chat 或 greeting 时，filters 可以为空对象`;
