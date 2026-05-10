const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://oatjkxhymqijjhvoryfx.supabase.co', 'sb_publishable_zTJINXp-QgqXVpdc-lnmOw_LTtbz122');

async function run() {
    const sql = `
        CREATE TABLE IF NOT EXISTS public.categories (
            id TEXT PRIMARY KEY,
            label TEXT NOT NULL,
            icon TEXT,
            color TEXT,
            "order" INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );

        INSERT INTO public.categories (id, label, icon, color, "order")
        VALUES 
            ('mobile-repair', 'Mobile Repair', '📱', '#FF6B35', 1),
            ('laptop-repair', 'Laptop Repair', '💻', '#6366F1', 2),
            ('electrician', 'Electrician', '⚡', '#EAB308', 3),
            ('plumber', 'Plumber', '🔧', '#0EA5E9', 4),
            ('ac-repair', 'AC Repair', '❄️', '#06B6D4', 5),
            ('appliance-repair', 'Appliance Repair', '🔌', '#10B981', 6)
        ON CONFLICT (id) DO NOTHING;
    `;
    
    // Note: Most Supabase clients don't have a direct 'sql' method unless a custom RPC is created.
    // I will assume for now that I should tell the user to run it if the RPC doesn't exist.
    // But let's try the common 'exec_sql' RPC if they have one.
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) console.error('Error running SQL via RPC:', error);
    else console.log('SQL executed successfully:', data);
}

run();
