import { describe, expect, it } from 'vitest';
import type { SkillE2EContextProvider } from "../../../../apps/backend/src/product/core/types.js";

export function registerPerformanceCases(getContext: SkillE2EContextProvider): void {
  describe('Performance Tests', () => {
    it('should handle bulk creation efficiently', async () => {
      const { app } = getContext();
      const startTime = Date.now();
      const skills = Array.from({ length: 10 }, (_, i) => ({
        name: `bulk-skill-${i}`,
        description: `Bulk skill ${i}`,
        promptTemplate: `Template ${i}`,
      }));

      for (const skill of skills) {
        const response = await app.inject({ method: 'POST', url: '/skills/declarative', payload: skill });
        expect(response.statusCode).toBe(201);
      }

      expect(Date.now() - startTime).toBeLessThan(5000);
    });

    it('should handle concurrent requests', async () => {
      const { app } = getContext();
      const requests = Array.from({ length: 5 }, (_, i) => ({
        method: 'POST' as const,
        url: '/skills/declarative',
        payload: {
          name: `concurrent-${i}-${Date.now()}`,
          description: 'Concurrent test',
          promptTemplate: 'Template',
        },
      }));

      const startTime = Date.now();
      const responses = await Promise.all(requests.map((request) => app.inject(request)));
      const duration = Date.now() - startTime;

      responses.forEach((response) => {
        expect(response.statusCode).toBe(201);
      });
      expect(duration).toBeLessThan(3000);
    });

    it('should respond quickly to list request', async () => {
      const { app } = getContext();
      for (let i = 0; i < 5; i++) {
        await app.inject({
          method: 'POST',
          url: '/skills/declarative',
          payload: {
            name: `perf-skill-${i}`,
            description: 'Performance test',
            promptTemplate: 'Template',
          },
        });
      }

      const startTime = Date.now();
      const response = await app.inject({ method: 'GET', url: '/skills/declarative' });
      const duration = Date.now() - startTime;

      expect(response.statusCode).toBe(200);
      expect(duration).toBeLessThan(500);
    });
  });
}
