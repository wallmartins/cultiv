import { describe, expect, it } from 'vitest';
import type { SkillE2EContextProvider } from "../../../../apps/backend/src/product/core/types.js";

export function registerEdgeCases(getContext: SkillE2EContextProvider): void {
  describe('Edge Cases', () => {
    it('should handle special characters in skill name', async () => {
      const { app } = getContext();
      const specialNames = ['skill_with_underscores', 'skill-with-hyphens', 'skill123'];

      for (const name of specialNames) {
        const response = await app.inject({
          method: 'POST',
          url: '/skills/declarative',
          payload: {
            name,
            description: 'Test',
            promptTemplate: 'Template',
          },
        });
        expect(response.statusCode).toBe(201);
      }
    });

    it('should reject duplicate skill names', async () => {
      const { app } = getContext();
      const skillData = {
        name: 'duplicate-test',
        description: 'Test',
        promptTemplate: 'Template',
      };

      const firstResponse = await app.inject({ method: 'POST', url: '/skills/declarative', payload: skillData });
      expect(firstResponse.statusCode).toBe(201);

      const secondResponse = await app.inject({ method: 'POST', url: '/skills/declarative', payload: skillData });
      expect(secondResponse.statusCode).toBe(409);
    });

    it('should handle empty update payload gracefully', async () => {
      const { app } = getContext();
      await app.inject({
        method: 'POST',
        url: '/skills/declarative',
        payload: {
          name: 'update-empty-test',
          description: 'Test',
          promptTemplate: 'Template',
        },
      });

      const response = await app.inject({
        method: 'PUT',
        url: '/skills/declarative/update-empty-test',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 404 for non-existent skill', async () => {
      const { app } = getContext();
      const response = await app.inject({
        method: 'GET',
        url: '/skills/declarative/non-existent-skill-12345',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });

    it('should handle pagination', async () => {
      const { app } = getContext();
      for (let i = 0; i < 5; i++) {
        await app.inject({
          method: 'POST',
          url: '/skills/declarative',
          payload: {
            name: `pagination-skill-${i}`,
            description: 'Test',
            promptTemplate: 'Template',
          },
        });
      }

      const response = await app.inject({
        method: 'GET',
        url: '/skills/declarative?limit=2',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.length).toBeGreaterThanOrEqual(2);
      expect(body.meta).toBeDefined();
      expect(body.meta.total).toBeGreaterThanOrEqual(5);
      expect(body.meta.limit).toBeDefined();
      expect(body.meta.offset).toBeDefined();
    });
  });
}
