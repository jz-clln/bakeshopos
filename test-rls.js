// File: scripts/test-rls.js
//
// Tests that Row Level Security is correctly keeping two organizations'
// data separate. Creates two throwaway test shops, gives each one a
// customer, and checks that neither can see or write into the other's
// data.
//
// Usage:
//   npm install
//   node test-rls.js
//
// Run this against your DEVELOPMENT project only — it creates real
// (fake) accounts and data.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.development') });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY. Check your .env.development file.');
  process.exit(1);
}

// Supabase rejects a few reserved domains (like example.com) as
// obviously-fake, so these use gmail.com instead. Nothing is ever
// actually sent to these addresses since email confirmation is off.
const timestamp = Date.now();
const userA = { email: `bakeshopos-test-a-${timestamp}@gmail.com`, password: 'TestPassword123!', orgName: `Test Shop A ${timestamp}` };
const userB = { email: `bakeshopos-test-b-${timestamp}@gmail.com`, password: 'TestPassword123!', orgName: `Test Shop B ${timestamp}` };

let passed = 0;
let failed = 0;

function check(label, condition) {
  if (condition) {
    console.log(`  PASS - ${label}`);
    passed++;
  } else {
    console.log(`  FAIL - ${label}`);
    failed++;
  }
}

// Only used to pre-confirm test accounts so this script doesn't depend
// on the project's "Confirm email" setting. It never reads or writes
// any customers/orders/etc data, so it can't mask an RLS problem.
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createConfirmedUser(user) {
  const { data, error } = await adminClient.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: { organization_name: user.orgName },
  });
  if (error) throw new Error(`Could not create ${user.email}: ${error.message}`);
  return data.user.id;
}

async function signInAsUser(user) {
  // This client uses the anon key, same as a real app would — this is
  // the client whose RLS behavior is actually being tested.
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });
  if (error) throw new Error(`Could not sign in as ${user.email}: ${error.message}`);
  return client;
}

async function getOwnOrganizationId(client) {
  const { data, error } = await client.from('memberships').select('organization_id').limit(1);
  if (error) throw new Error(`Could not fetch membership: ${error.message}`);
  if (!data || data.length === 0) throw new Error('No membership row found for this user.');
  return data[0].organization_id;
}

async function main() {
  console.log('Setting up two test organizations...\n');

  await createConfirmedUser(userA);
  const aClient = await signInAsUser(userA);
  const orgAId = await getOwnOrganizationId(aClient);
  console.log(`User A created. Organization A ID: ${orgAId}`);

  await createConfirmedUser(userB);
  const bClient = await signInAsUser(userB);
  const orgBId = await getOwnOrganizationId(bClient);
  console.log(`User B created. Organization B ID: ${orgBId}\n`);

  console.log('Seeding one customer per organization...\n');

  const { error: insertAError } = await aClient
    .from('customers')
    .insert({ organization_id: orgAId, full_name: 'Customer A' });
  if (insertAError) throw new Error(`Could not seed Customer A: ${insertAError.message}`);

  const { error: insertBError } = await bClient
    .from('customers')
    .insert({ organization_id: orgBId, full_name: 'Customer B' });
  if (insertBError) throw new Error(`Could not seed Customer B: ${insertBError.message}`);

  console.log('Running isolation checks...\n');

  const { data: aSees } = await aClient.from('customers').select('full_name');
  check(
    'User A sees only Customer A',
    !!aSees && aSees.length === 1 && aSees[0].full_name === 'Customer A'
  );

  const { data: bSees } = await bClient.from('customers').select('full_name');
  check(
    'User B sees only Customer B',
    !!bSees && bSees.length === 1 && bSees[0].full_name === 'Customer B'
  );

  const { error: crossInsertError } = await aClient
    .from('customers')
    .insert({ organization_id: orgBId, full_name: 'Should Not Exist' });
  check(
    'User A is blocked from inserting into Organization B',
    !!crossInsertError
  );

  console.log(`\n${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    console.log('\nSomething is letting data cross between organizations. Do not start Phase 1 until this is fixed.');
    process.exitCode = 1;
  } else {
    console.log('\nRLS is correctly isolating organizations. Phase 0 gate check passed.');
  }
}

main().catch((err) => {
  console.error('\nTest script error:', err.message);
  process.exitCode = 1;
});
