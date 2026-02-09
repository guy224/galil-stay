import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ychaduxkdozmhmnflgxi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaGFkdXhrZG96bWhtbmZsZ3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDE4NDcsImV4cCI6MjA4NjIxNzg0N30.D6APRF-jxuRn9yTPv1hDHtFMK0R7iXCxZPcG1p7zsRg';

export const supabase = createClient(supabaseUrl, supabaseKey);
