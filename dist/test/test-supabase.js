"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_1 = require("../config/supabase");
const databaseService_1 = require("../src/services/databaseService");
async function testSupabaseConnection() {
    try {
        console.log('Testing Supabase connection...');
        // Test the connection
        const { data, error } = await supabase_1.supabase.from('users').select('count(*)');
        if (error) {
            console.error('Error connecting to Supabase:', error);
            return;
        }
        console.log('Successfully connected to Supabase!');
        console.log('User count:', data[0].count);
        // Test database service
        console.log('\nTesting DatabaseService...');
        // Get a sample user (if any)
        const { data: users, error: usersError } = await supabase_1.supabase
            .from('users')
            .select('*')
            .limit(1);
        if (usersError || !users || users.length === 0) {
            console.log('No users found. Create a user first.');
            return;
        }
        const testUser = users[0];
        console.log('Test user:', testUser);
        // Test getUserById
        const user = await databaseService_1.DatabaseService.getUserById(testUser.id);
        console.log('getUserById result:', user);
        console.log('\nAll tests completed successfully!');
    }
    catch (error) {
        console.error('Error testing Supabase:', error);
    }
}
testSupabaseConnection();
//# sourceMappingURL=test-supabase.js.map