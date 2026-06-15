---
title: Examples and Tutorials
doc_type: reference
status: active
domain: reference
last_updated: 2026-05-16
---

# Declarative Skills API - Examples and Tutorials

This document provides practical examples for creating and using declarative skills via the REST API.

## Base URL

```bash
BASE_URL="http://localhost:3000"
```

## API Documentation

Interactive documentation available at: `http://localhost:3000/docs`

---

## Quick Start - Create Your First Skill

### Step 1: Create a Simple Skill

```bash
curl -X POST "$BASE_URL/skills/declarative" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "greeting-generator",
    "description": "Generates personalized greeting messages",
    "promptTemplate": "Write a friendly greeting for {{name}} who is a {{role}}. Make it sound welcoming and professional."
  }'
```

Expected response (201):
```json
{
  "success": true,
  "data": {
    "name": "greeting-generator",
    "description": "Generates personalized greeting messages",
    "promptTemplate": "Write a friendly greeting for {{name}} who is a {{role}}. Make it sound welcoming and professional.",
    "inputMapping": null,
    "createdAt": "2026-05-04T16:00:00.000Z"
  }
}
```

### Step 2: List All Skills

```bash
curl -X GET "$BASE_URL/skills/declarative"
```

### Step 3: Use the Skill in a Pipeline

```bash
curl -X POST "$BASE_URL/run" \
  -H "Content-Type: application/json" \
  -d '{
    "pipeline": {
      "name": "greeting-pipeline",
      "steps": [
        {
          "name": "greet",
          "skill": "greeting-generator"
        }
      ]
    },
    "context": {
      "name": "Maria",
      "role": "software engineer"
    }
  }'
```

---

## Advanced Examples

### Example 1: Skill with Input Mapping

Create a skill that maps incoming context variables to different template variables:

```bash
curl -X POST "$BASE_URL/skills/declarative" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "email-drafter",
    "description": "Drafts professional emails",
    "promptTemplate": "Write a {{tone}} email to {{recipient}} about {{subject}}. Keep it concise and actionable.",
    "inputMapping": {
      "recipient": "to",
      "subject": "topic",
      "tone": "emailStyle"
    }
  }'
```

### Example 2: Update a Skill

```bash
curl -X PUT "$BASE_URL/skills/declarative/greeting-generator" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Generates personalized greeting messages with emoji",
    "promptTemplate": "Write a friendly greeting for {{name}} who is a {{role}}. Add an appropriate emoji at the end."
  }'
```

### Example 3: Get a Specific Skill

```bash
curl -X GET "$BASE_URL/skills/declarative/greeting-generator"
```

### Example 4: Delete a Skill

```bash
curl -X DELETE "$BASE_URL/skills/declarative/greeting-generator"
```

### Example 5: Pagination

```bash
curl -X GET "$BASE_URL/skills/declarative?limit=10&offset=0"
```

---

## Error Handling Examples

### Duplicate Skill Name (409 Conflict)

```bash
# Attempt to create a skill that already exists
curl -X POST "$BASE_URL/skills/declarative" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "existing-skill",
    "description": "Test",
    "promptTemplate": "Test"
  }'

# First create succeeds (201)
# Second create fails (409):
# {"success":false,"error":"Skill \"existing-skill\" already exists"}
```

### Validation Error (400 Bad Request)

```bash
# Missing required fields
curl -X POST "$BASE_URL/skills/declarative" \
  -H "Content-Type: application/json" \
  -d '{"name": "test"}'

# Response (400):
# {"success":false,"error":"Validation failed","details":["must have required property 'description'","must have required property 'promptTemplate'"]}
```

### Invalid Name Pattern

```bash
# Name can only contain letters, numbers, underscores, hyphens
curl -X POST "$BASE_URL/skills/declarative" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "invalid name!",
    "description": "Test",
    "promptTemplate": "Test"
  }'

# Response (400):
# {"success":false,"error":"Validation failed","details":["body/name must match pattern \"^[a-zA-Z0-9_-]+$\""]}
```

### Skill Not Found (404)

```bash
curl -X GET "$BASE_URL/skills/declarative/nonexistent"

# Response (404):
# {"success":false,"error":"Skill \"nonexistent\" not found"}
```

---

## Common Use Cases

### Use Case 1: Content Rewriter

```bash
curl -X POST "$BASE_URL/skills/declarative" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "content-rewriter",
    "description": "Rewrites content in a different style",
    "promptTemplate": "Rewrite the following text in a {{style}} style: {{content}}"
  }'
```

### Use Case 2: Summary Generator

```bash
curl -X POST "$BASE_URL/skills/declarative" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "text-summarizer",
    "description": "Generates concise summaries",
    "promptTemplate": "Create a {{length}} summary of the following text: {{content}}"
  }'
```

### Use Case 3: Sentiment Analyzer

```bash
curl -X POST "$BASE_URL/skills/declarative" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "sentiment-analyzer",
    "description": "Analyzes text sentiment",
    "promptTemplate": "Analyze the sentiment of this text and explain your reasoning: {{text}}"
  }'
```

### Use Case 4: Question Answering

```bash
curl -X POST "$BASE_URL/skills/declarative" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "qa-bot",
    "description": "Answers questions based on context",
    "promptTemplate": "Based on the following context:\n{{context}}\n\nAnswer this question:\n{{question}}"
  }'
```

---

## Testing Your Skills

### Using the API Docs

1. Open `http://localhost:3000/docs` in your browser
2. Navigate to the "Declarative Skills" section
3. Click on an endpoint to expand it
4. Click "Try it out" to test interactively

### Using JavaScript/Fetch

```javascript
const response = await fetch('http://localhost:3000/skills/declarative', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'test-skill',
    description: 'Test skill',
    promptTemplate: 'Say hello to {{name}}'
  })
});
const data = await response.json();
console.log(data);
```

### Using Python

```python
import requests

response = requests.post(
    'http://localhost:3000/skills/declarative',
    json={
        'name': 'test-skill',
        'description': 'Test skill',
        'promptTemplate': 'Say hello to {{name}}'
    }
)
print(response.json())
```

---

## Best Practices

1. **Use descriptive names**: `email-drafter` instead of `skill1`
2. **Add clear descriptions**: Help other developers understand the skill's purpose
3. **Use inputMapping**: Map context variables to meaningful template names
4. **Test with the API docs**: Use `/docs` to interactively test before integrating
5. **Handle errors gracefully**: Always check for `success: false` in responses
6. **Use pagination**: When listing many skills, use `limit` and `offset`

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| NODE_ENV | development | Environment (development/production) |

---

## See Also

- [OpenAPI Documentation](http://localhost:3000/docs)
- [API Reference](/docs) - Full API specification
- [Architecture](../architecture/architecture.md) - System design
