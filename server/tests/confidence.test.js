const { computeConfidence } = require('../src/utils/confidence');

describe('computeConfidence()', () => {
  const baseContext = {
    week_start: '2026-06-01',
    goal: { deadline: '2026-12-31' },
    weekly_target_hours: 5,
    preferred_time: 'morning',
    existing_tasks: [],
  };

  it('should return high when all signals are strong', () => {
    expect(computeConfidence(baseContext)).toBe('high');
  });

  it('should return low when no preferred_time and many existing tasks', () => {
    const ctx = {
      ...baseContext,
      preferred_time: null,
      existing_tasks: Array.from({ length: 10 }, (_, i) => ({
        title: `Task ${i + 1}`,
        planned_date: '2026-06-01',
        planned_slot: 'morning',
      })),
    };
    expect(computeConfidence(ctx)).toBe('low');
  });

  it('should return average when preferred_time missing but deadline is close', () => {
    const ctx = {
      ...baseContext,
      preferred_time: null,
      goal: { deadline: '2026-06-01' },
    };
    expect(computeConfidence(ctx)).toBe('average');
  });

  it('should return average when deadline is this week and occupancy is moderate', () => {
    const ctx = {
      ...baseContext,
      goal: { deadline: '2026-06-01' },
      existing_tasks: Array.from({ length: 4 }, (_, i) => ({
        title: `Task ${i + 1}`,
        planned_date: '2026-06-01',
        planned_slot: 'morning',
      })),
    };
    expect(computeConfidence(ctx)).toBe('average');
  });

  it('should return low when multiple negatives combine', () => {
    const ctx = {
      ...baseContext,
      preferred_time: null,
      goal: { deadline: '2026-06-01' },
      existing_tasks: Array.from({ length: 10 }, (_, i) => ({
        title: `Task ${i + 1}`,
        planned_date: '2026-06-01',
        planned_slot: 'morning',
      })),
    };
    expect(computeConfidence(ctx)).toBe('low');
  });

  it('should return high when occupancy is low and deadline is far', () => {
    const ctx = {
      ...baseContext,
      existing_tasks: [],
    };
    expect(computeConfidence(ctx)).toBe('high');
  });

  it('should handle missing goal gracefully', () => {
    const ctx = {
      week_start: '2026-06-01',
      weekly_target_hours: 5,
      preferred_time: 'morning',
      existing_tasks: [],
    };
    expect(computeConfidence(ctx)).toBe('high');
  });

  it('should handle zero weekly_target_hours gracefully', () => {
    const ctx = {
      ...baseContext,
      weekly_target_hours: 0,
      preferred_time: null,
      existing_tasks: Array.from({ length: 10 }, (_, i) => ({
        title: `Task ${i + 1}`,
        planned_date: '2026-06-01',
        planned_slot: 'morning',
      })),
    };
    expect(computeConfidence(ctx)).toBe('low');
  });
});
