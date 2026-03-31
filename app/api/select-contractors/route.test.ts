import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

type ContractorWithTier = {
  id: string;
  company_name: string;
  owner_name: string;
  tier_name: string;
  tier_priority: number;
  last_referral_at: string | null;
};

function selectContractors(
  contractors: ContractorWithTier[],
  maxContractors: number = 3
): ContractorWithTier[] {
  contractors.sort((a, b) => {
    if (a.tier_priority !== b.tier_priority) {
      return a.tier_priority - b.tier_priority;
    }

    const aTime = a.last_referral_at ? new Date(a.last_referral_at).getTime() : 0;
    const bTime = b.last_referral_at ? new Date(b.last_referral_at).getTime() : 0;
    return aTime - bTime;
  });

  return contractors.slice(0, maxContractors);
}

describe('Contractor Referral Selection Logic', () => {
  it('should return up to 3 contractors', () => {
    const contractors: ContractorWithTier[] = [
      { id: '1', company_name: 'A', owner_name: 'Owner A', tier_name: 'Basic', tier_priority: 3, last_referral_at: null },
      { id: '2', company_name: 'B', owner_name: 'Owner B', tier_name: 'Basic', tier_priority: 3, last_referral_at: null },
      { id: '3', company_name: 'C', owner_name: 'Owner C', tier_name: 'Basic', tier_priority: 3, last_referral_at: null },
      { id: '4', company_name: 'D', owner_name: 'Owner D', tier_name: 'Basic', tier_priority: 3, last_referral_at: null },
    ];

    const selected = selectContractors(contractors, 3);
    expect(selected.length).toBe(3);
  });

  it('should return all contractors if fewer than 3 available', () => {
    const contractors: ContractorWithTier[] = [
      { id: '1', company_name: 'A', owner_name: 'Owner A', tier_name: 'Basic', tier_priority: 3, last_referral_at: null },
      { id: '2', company_name: 'B', owner_name: 'Owner B', tier_name: 'Basic', tier_priority: 3, last_referral_at: null },
    ];

    const selected = selectContractors(contractors, 3);
    expect(selected.length).toBe(2);
  });

  it('should prioritize Elite tier contractors first', () => {
    const contractors: ContractorWithTier[] = [
      { id: '1', company_name: 'Basic Co', owner_name: 'Owner 1', tier_name: 'Basic', tier_priority: 3, last_referral_at: null },
      { id: '2', company_name: 'Elite Co', owner_name: 'Owner 2', tier_name: 'Elite', tier_priority: 1, last_referral_at: null },
      { id: '3', company_name: 'Preferred Co', owner_name: 'Owner 3', tier_name: 'Preferred', tier_priority: 2, last_referral_at: null },
    ];

    const selected = selectContractors(contractors, 3);
    expect(selected[0].tier_name).toBe('Elite');
    expect(selected[1].tier_name).toBe('Preferred');
    expect(selected[2].tier_name).toBe('Basic');
  });

  it('should use fair rotation for contractors in same tier', () => {
    const now = new Date('2024-01-01T00:00:00Z');
    const contractors: ContractorWithTier[] = [
      { id: '1', company_name: 'A', owner_name: 'Owner A', tier_name: 'Basic', tier_priority: 3, last_referral_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { id: '2', company_name: 'B', owner_name: 'Owner B', tier_name: 'Basic', tier_priority: 3, last_referral_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() },
      { id: '3', company_name: 'C', owner_name: 'Owner C', tier_name: 'Basic', tier_priority: 3, last_referral_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    ];

    const selected = selectContractors(contractors, 3);
    expect(selected[0].id).toBe('3');
    expect(selected[1].id).toBe('1');
    expect(selected[2].id).toBe('2');
  });

  it('should prioritize contractors who have never received referrals', () => {
    const now = new Date('2024-01-01T00:00:00Z');
    const contractors: ContractorWithTier[] = [
      { id: '1', company_name: 'A', owner_name: 'Owner A', tier_name: 'Basic', tier_priority: 3, last_referral_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() },
      { id: '2', company_name: 'B', owner_name: 'Owner B', tier_name: 'Basic', tier_priority: 3, last_referral_at: null },
      { id: '3', company_name: 'C', owner_name: 'Owner C', tier_name: 'Basic', tier_priority: 3, last_referral_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    ];

    const selected = selectContractors(contractors, 3);
    expect(selected[0].id).toBe('2');
  });

  it('should not return duplicate contractors', () => {
    const contractors: ContractorWithTier[] = [
      { id: '1', company_name: 'A', owner_name: 'Owner A', tier_name: 'Basic', tier_priority: 3, last_referral_at: null },
      { id: '2', company_name: 'B', owner_name: 'Owner B', tier_name: 'Basic', tier_priority: 3, last_referral_at: null },
      { id: '3', company_name: 'C', owner_name: 'Owner C', tier_name: 'Basic', tier_priority: 3, last_referral_at: null },
    ];

    const selected = selectContractors(contractors, 3);
    const ids = selected.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should handle mixed tier scenario correctly', () => {
    const now = new Date('2024-01-01T00:00:00Z');
    const contractors: ContractorWithTier[] = [
      { id: '1', company_name: 'Basic 1', owner_name: 'Owner 1', tier_name: 'Basic', tier_priority: 3, last_referral_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString() },
      { id: '2', company_name: 'Elite 1', owner_name: 'Owner 2', tier_name: 'Elite', tier_priority: 1, last_referral_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() },
      { id: '3', company_name: 'Preferred 1', owner_name: 'Owner 3', tier_name: 'Preferred', tier_priority: 2, last_referral_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      { id: '4', company_name: 'Preferred 2', owner_name: 'Owner 4', tier_name: 'Preferred', tier_priority: 2, last_referral_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { id: '5', company_name: 'Basic 2', owner_name: 'Owner 5', tier_name: 'Basic', tier_priority: 3, last_referral_at: null },
    ];

    const selected = selectContractors(contractors, 3);
    expect(selected[0].tier_name).toBe('Elite');
    expect(selected[1].tier_name).toBe('Preferred');
    expect(selected[1].id).toBe('3');
    expect(selected[2].tier_name).toBe('Preferred');
    expect(selected[2].id).toBe('4');
  });

  it('should fill slots with lower tier if higher tier unavailable', () => {
    const contractors: ContractorWithTier[] = [
      { id: '1', company_name: 'Elite 1', owner_name: 'Owner 1', tier_name: 'Elite', tier_priority: 1, last_referral_at: null },
      { id: '2', company_name: 'Basic 1', owner_name: 'Owner 2', tier_name: 'Basic', tier_priority: 3, last_referral_at: null },
      { id: '3', company_name: 'Basic 2', owner_name: 'Owner 3', tier_name: 'Basic', tier_priority: 3, last_referral_at: null },
    ];

    const selected = selectContractors(contractors, 3);
    expect(selected.length).toBe(3);
    expect(selected[0].tier_name).toBe('Elite');
    expect(selected[1].tier_name).toBe('Basic');
    expect(selected[2].tier_name).toBe('Basic');
  });

  it('should return empty array if no contractors available', () => {
    const contractors: ContractorWithTier[] = [];
    const selected = selectContractors(contractors, 3);
    expect(selected.length).toBe(0);
  });
});

console.log('All contractor referral selection tests defined. Run with a test runner like Jest to execute.');
