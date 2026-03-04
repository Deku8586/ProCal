import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// ** INSTRUCTIONS FOR MVP **
// 1. Create a Supabase project at database.new
// 2. Replace these with your actual URL and Anon Key from the Project Settings -> API
const supabaseUrl = 'https://zggmeopgesxedhmhiran.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnZ21lb3BnZXN4ZWRobWhpcmFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2Mjc1NDIsImV4cCI6MjA4ODIwMzU0Mn0.33CMbqVYpHJIBmGQziCYtn6eGRB6bEqcrdH_yPG_W8Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
