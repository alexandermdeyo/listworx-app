function selectContractors(contractors, maxContractors = 3) {
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

function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ FAILED: ${message}`);
  }
  console.log(`✓ ${message}`);
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`❌ FAILED: ${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
  console.log(`✓ ${message}`);
}

function runTests() {
  console.log('\n🧪 Running Contractor Referral Selection Tests\n');
  let passed = 0;
  let failed = 0;

  try {
    console.log('Test 1: Should return up to 3 contractors');
    const contractors1 = [
      { id: '1', company_name: 'A', owner_name: 'Owner A', tier_name: 'Basic', tier_priority: 3, last_referral_at: null },
      { id: '2', company_name: 'B', owner_name: 'Owner B', tier_name: 'Basic', tier_priority: 3, last_referral_at: null },
      { id: '3', company_name: 'C', owner_name: 'Owner C', tier_name: 'Basic', tier_priority: 3, last_referral_at: null },
      { id: '4', company_name: 'D', owner_name: 'Owner D', tier_name: 'Basic', tier_priority: 3, last_referral_at: null },
    ];
    const selected1 = selectContractors([...contractors1], 3);
    assertEqual(selected1.length, 3, 'Returns exactly 3 contractors');
    passed++;
  } catch (e) {
    console.error(e.message);
    failed++;
  }

  try {
    console.log('\nTest 2: Should return all contractors if fewer than 3 available');
    const contractors2 = [
      { id: '1', company_name: 'A', owner_name: 'Owner A', tier_name: 'Basic', tier_priority: 3, last_referral_at: null },
      { id: '2', company_name: 'B', owner_name: 'Owner B', tier_name: 'Basic', tier_priority: 3, last_referral_at: null },
    ];
    const selected2 = selectContractors([...contractors2], 3);
    assertEqual(selected2.length, 2, 'Returns only 2 contractors when only 2 available');
    passed++;
  } catch (e) {
    console.error(e.message);
    failed++;
  }

  try {
    console.log('\nTest 3: Should prioritize Elite tier contractors first');
    const contractors3 = [
      { id: '1', company_name: 'Basic Co', owner_name: 'Owner 1', tier_name: 'Basic', tier_priority: 3, last_referral_at: null },
      { id: '2', company_name: 'Elite Co', owner_name: 'Owner 2', tier_name: 'Elite', tier_priority: 1, last_referral_at: null },
      { id: '3', company_name: 'Preferred Co', owner_name: 'Owner 3', tier_name: 'Preferred', tier_priority: 2, last_referral_at: null },
    ];
    const selected3 = selectContractors([...contractors3], 3);
    assertEqual(selected3[0].tier_name, 'Elite', 'First contractor is Elite tier');
    assertEqual(selected3[1].tier_name, 'Preferred', 'Second contractor is Preferred tier');
    assertEqual(selected3[2].tier_name, 'Basic', 'Third contractor is Basic tier');
    passed++;
  } catch (e) {
    console.error(e.message);
    failed++;
  }

  try {
    console.log('\nTest 4: Should use fair rotation for contractors in same tier');
    const now = new Date('2024-01-01T00:00:00Z');
    const contractors4 = [
      { id: '1', company_name: 'A', owner_name: 'Owner A', tier_name: 'Basic', tier_priority: 3, last_referral_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { id: '2', company_name: 'B', owner_name: 'Owner B', tier_name: 'Basic', tier_priority: 3, last_referral_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() },
      { id: '3', company_name: 'C', owner_name: 'Owner C', tier_name: 'Basic', tier_priority: 3, last_referral_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    ];
    const selected4 = selectContractors([...contractors4], 3);
    assertEqual(selected4[0].id, '3', 'Oldest referral comes first');
    assertEqual(selected4[1].id, '1', 'Second oldest referral comes second');
    assertEqual(selected4[2].id, '2', 'Most recent referral comes last');
    passed++;
  } catch (e) {
    console.error(e.message);
    failed++;
  }

  try {
    console.log('\nTest 5: Should prioritize contractors who have never received referrals');
    const now = new Date('2024-01-01T00:00:00Z');
    const contractors5 = [
      { id: '1', company_name: 'A', owner_name: 'Owner A', tier_name: 'Basic', tier_priority: 3, last_referral_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() },
      { id: '2', company_name: 'B', owner_name: 'Owner B', tier_name: 'Basic', tier_priority: 3, last_referral_at: null },
      { id: '3', company_name: 'C', owner_name: 'Owner C', tier_name: 'Basic', tier_priority: 3, last_referral_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    ];
    const selected5 = selectContractors([...contractors5], 3);
    assertEqual(selected5[0].id, '2', 'Contractor with no referrals comes first');
    passed++;
  } catch (e) {
    console.error(e.message);
    failed++;
  }

  try {
    console.log('\nTest 6: Should not return duplicate contractors');
    const contractors6 = [
      { id: '1', company_name: 'A', owner_name: 'Owner A', tier_name: 'Basic', tier_priority: 3, last_referral_at: null },
      { id: '2', company_name: 'B', owner_name: 'Owner B', tier_name: 'Basic', tier_priority: 3, last_referral_at: null },
      { id: '3', company_name: 'C', owner_name: 'Owner C', tier_name: 'Basic', tier_priority: 3, last_referral_at: null },
    ];
    const selected6 = selectContractors([...contractors6], 3);
    const ids = selected6.map(c => c.id);
    const uniqueIds = new Set(ids);
    assertEqual(uniqueIds.size, ids.length, 'No duplicate contractor IDs');
    passed++;
  } catch (e) {
    console.error(e.message);
    failed++;
  }

  try {
    console.log('\nTest 7: Should handle mixed tier scenario correctly');
    const now = new Date('2024-01-01T00:00:00Z');
    const contractors7 = [
      { id: '1', company_name: 'Basic 1', owner_name: 'Owner 1', tier_name: 'Basic', tier_priority: 3, last_referral_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString() },
      { id: '2', company_name: 'Elite 1', owner_name: 'Owner 2', tier_name: 'Elite', tier_priority: 1, last_referral_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() },
      { id: '3', company_name: 'Preferred 1', owner_name: 'Owner 3', tier_name: 'Preferred', tier_priority: 2, last_referral_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      { id: '4', company_name: 'Preferred 2', owner_name: 'Owner 4', tier_name: 'Preferred', tier_priority: 2, last_referral_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { id: '5', company_name: 'Basic 2', owner_name: 'Owner 5', tier_name: 'Basic', tier_priority: 3, last_referral_at: null },
    ];
    const selected7 = selectContractors([...contractors7], 3);
    assertEqual(selected7[0].tier_name, 'Elite', 'First is Elite');
    assertEqual(selected7[1].tier_name, 'Preferred', 'Second is Preferred');
    assertEqual(selected7[1].id, '3', 'Older Preferred comes before newer');
    assertEqual(selected7[2].tier_name, 'Preferred', 'Third is also Preferred');
    assertEqual(selected7[2].id, '4', 'Newer Preferred fills third slot');
    passed++;
  } catch (e) {
    console.error(e.message);
    failed++;
  }

  try {
    console.log('\nTest 8: Should fill slots with lower tier if higher tier unavailable');
    const contractors8 = [
      { id: '1', company_name: 'Elite 1', owner_name: 'Owner 1', tier_name: 'Elite', tier_priority: 1, last_referral_at: null },
      { id: '2', company_name: 'Basic 1', owner_name: 'Owner 2', tier_name: 'Basic', tier_priority: 3, last_referral_at: null },
      { id: '3', company_name: 'Basic 2', owner_name: 'Owner 3', tier_name: 'Basic', tier_priority: 3, last_referral_at: null },
    ];
    const selected8 = selectContractors([...contractors8], 3);
    assertEqual(selected8.length, 3, 'Returns 3 contractors');
    assertEqual(selected8[0].tier_name, 'Elite', 'First is Elite');
    assertEqual(selected8[1].tier_name, 'Basic', 'Second is Basic');
    assertEqual(selected8[2].tier_name, 'Basic', 'Third is Basic');
    passed++;
  } catch (e) {
    console.error(e.message);
    failed++;
  }

  try {
    console.log('\nTest 9: Should return empty array if no contractors available');
    const contractors9 = [];
    const selected9 = selectContractors([...contractors9], 3);
    assertEqual(selected9.length, 0, 'Returns empty array');
    passed++;
  } catch (e) {
    console.error(e.message);
    failed++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log('✅ All tests passed!\n');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed\n');
    process.exit(1);
  }
}

runTests();
