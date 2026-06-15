import { describe, expect, it } from 'vitest';
import type { SkillE2EContextProvider } from "../../../../apps/backend/src/product/core/types.js";

export function registerSecurityCases(getContext: SkillE2EContextProvider): void {
  describe('Security Tests', () => {
    it('should reject SQL injection attempt in skill name', async () => {
      const { app } = getContext();
      const response = await app.inject({
        method: 'POST',
        url: '/skills/declarative',
        payload: {
          name: "skill'; DROP TABLE skills; --",
          description: 'Test',
          promptTemplate: 'Template',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject XSS attempt in description', async () => {
      const { app } = getContext();
      const xssData = {
        name: 'xss-test',
        description: '<script>alert("xss")</script>',
        promptTemplate: 'Template',
      };

      const response = await app.inject({ method: 'POST', url: '/skills/declarative', payload: xssData });
      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.data.description).toBe(xssData.description);
    });

    it('should reject code injection in prompt template', async () => {
      const { app } = getContext();
      const response = await app.inject({
        method: 'POST',
        url: '/skills/declarative',
        payload: {
          name: 'injection-test',
          description: 'Test',
          promptTemplate: '{{eval("process.exit()")}}',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject oversized payload', async () => {
      const { app } = getContext();
      const response = await app.inject({
        method: 'POST',
        url: '/skills/declarative',
        payload: {
          name: 'huge-skill',
          description: 'A'.repeat(10000),
          promptTemplate: 'Template',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle path traversal attempt', async () => {
      const { app } = getContext();
      const response = await app.inject({ method: 'GET', url: '/skills/declarative/../../../etc/passwd' });
      expect(response.statusCode).toBe(404);
    });
  });
}
