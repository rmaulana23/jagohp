import { createClient } from '@supabase/supabase-js';

// Hardcode the Supabase URL and anon key as requested.
const supabaseUrl = 'https://wczyjyfjhypobwduvxgp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjenlqeWZqaHlwb2J3ZHV2eGdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MjYyMjYsImV4cCI6MjA3NDMwMjIyNn0.9LwXn1fJ2yHw1d_5crO5M2d2wsMTlTCcv9Pj-hvqzOs';

// Ekspor klien Supabase jika dikonfigurasi, jika tidak, null.
// Komponen akan menangani kasus null dengan baik, menonaktifkan caching.
export const supabase = (supabaseUrl && supabaseKey) 
    ? createClient(supabaseUrl, supabaseKey)
    : null;
