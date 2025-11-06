#!/usr/bin/env node

/**
 * Create Test User Script
 * Creates a test user account in Supabase for development/testing
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test user credentials
const TEST_USER = {
  email: 'test@imobitools.com',
  password: 'test123456',
  fullName: 'Test User'
};

async function createTestUser() {
  console.log('🔧 Creating test user...');
  console.log('');
  console.log('Credentials:');
  console.log(`  Email: ${TEST_USER.email}`);
  console.log(`  Password: ${TEST_USER.password}`);
  console.log('');

  try {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === TEST_USER.email);

    if (existingUser) {
      console.log('ℹ️  User already exists. Deleting old user...');
      await supabase.auth.admin.deleteUser(existingUser.id);
      console.log('✅ Old user deleted');
    }

    // Create new user with admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: TEST_USER.email,
      password: TEST_USER.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: TEST_USER.fullName
      }
    });

    if (authError) {
      throw authError;
    }

    console.log('✅ User created in auth.users');
    console.log(`   User ID: ${authData.user.id}`);

    // Wait a moment for the trigger to create profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update profile with additional data
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: TEST_USER.fullName,
        account_status: 'active',
        role: 'client',
        email_verified_at: new Date().toISOString()
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.warn('⚠️  Profile update warning:', profileError.message);
    } else {
      console.log('✅ Profile updated');
    }

    // Verify user creation
    const { data: profile, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (verifyError) {
      console.warn('⚠️  Could not verify profile:', verifyError.message);
    } else {
      console.log('');
      console.log('✅ Test user created successfully!');
      console.log('');
      console.log('Profile details:');
      console.log(`  ID: ${profile.id}`);
      console.log(`  Name: ${profile.full_name}`);
      console.log(`  Email: ${authData.user.email}`);
      console.log(`  Role: ${profile.role}`);
      console.log(`  Status: ${profile.account_status}`);
      console.log('');
      console.log('🎉 You can now login at: http://localhost:3000/login.html');
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    process.exit(1);
  }
}

createTestUser();
