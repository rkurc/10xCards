/**
 * Test script to verify the auth.users to profiles synchronization
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { setTimeout } from "timers/promises";

// Setup environment
dotenv.config();

// Initialize Supabase client
const supabase = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.PUBLIC_SUPABASE_ANON_KEY);

// Function to create a test user
async function createTestUser() {
  const email = `test-${Date.now()}@example.com`;
  const password = "password123";

  console.log(`Creating test user: ${email}`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: "Test User",
      },
    },
  });

  if (error) {
    console.error("Error creating user:", error);
    return null;
  }

  console.log("User created successfully:", data.user.id);
  return data.user;
}

// Function to check if profile exists
async function checkProfile(userId) {
  console.log(`Checking for profile with ID: ${userId}`);

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

  if (error) {
    console.error("Error checking profile:", error);
    return false;
  }

  console.log("Profile found:", data);
  return !!data;
}

// Main test function
async function testUserSync() {
  // Create a test user
  const user = await createTestUser();
  if (!user) {
    console.error("Failed to create test user");
    return;
  }

  // Give some time for the trigger to run
  console.log("Waiting for trigger to run...");
  await setTimeout(1000);

  // Check if profile was created
  const hasProfile = await checkProfile(user.id);
  if (hasProfile) {
    console.log("SUCCESS: Profile was automatically created!");
  } else {
    console.error("FAILURE: Profile was not created");
  }
}

testUserSync().catch(console.error);
