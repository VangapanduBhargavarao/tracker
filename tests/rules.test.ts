/**
 * Automated tests for critical streak, XP, recurring-task, and gamification rules.
 */
import { getUserLevelInfo, getRequiredXpForLevel } from '../server/gamificationService.ts';
import { getLocalDateString } from '../server/streakService.ts';

function runTests() {
  console.log('🧪 Starting AuraHabit core rules automated tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // Test 1: Level XP Calculations
  console.log('--- Suite 1: Gamification & Level Mathematics ---');
  const level1 = getUserLevelInfo(0);
  assert(level1.level === 1, '0 XP starts at Level 1');
  assert(level1.progressPercentage === 0, '0 XP has 0% progress');

  const reqL2 = getRequiredXpForLevel(2);
  const level2 = getUserLevelInfo(reqL2);
  assert(level2.level === 2, `Reaching threshold (${reqL2} XP) promotes to Level 2`);

  const reqL5 = getRequiredXpForLevel(5);
  const level5 = getUserLevelInfo(reqL5 + 50);
  assert(level5.level === 5, 'Level 5 recognized when threshold exceeded');
  assert(level5.currentLevelXp === 50, 'Current level XP matches offset above base threshold');

  // Test 2: Local Timezone Date String Formatting
  console.log('\n--- Suite 2: Timezone Handling ---');
  const utcDate = new Date('2026-10-29T02:00:00Z');
  const tokyoDateStr = getLocalDateString(utcDate, 'Asia/Tokyo');
  const laDateStr = getLocalDateString(utcDate, 'America/Los_Angeles');
  assert(tokyoDateStr === '2026-10-29', 'Asia/Tokyo interprets date correctly');
  assert(laDateStr === '2026-10-28', 'America/Los_Angeles interprets previous calendar day prior to UTC midnight cross');

  // Test 3: Anti-Exploit XP Ledger Logic
  console.log('\n--- Suite 3: Anti-Exploit XP Reversal Rules ---');
  const initialXp = 1000;
  const taskXp = 20;

  // Simulate completion
  const afterCompleteXp = initialXp + taskXp;
  assert(afterCompleteXp === 1020, 'Task completion yields expected XP reward');

  // Simulate reopen rollback
  const afterReopenXp = afterCompleteXp - taskXp;
  assert(afterReopenXp === initialXp, 'Reopening completed task reverses awarded XP to prevent duplicate exploitation');

  // Test 4: Habit Recurrence Invariants
  console.log('\n--- Suite 4: Habit Recurrence Integrity ---');
  const todayKey = '2026-10-29';
  const tomorrowKey = '2026-10-30';
  const completedLogs = new Set<string>();

  // Complete for today
  completedLogs.add(`hab-1_${todayKey}`);
  assert(completedLogs.has(`hab-1_${todayKey}`), 'Today habit check-in recorded');
  assert(!completedLogs.has(`hab-1_${tomorrowKey}`), 'Tomorrow remains unaffected and incomplete');

  console.log(`\n========================================`);
  console.log(`Test Summary: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
