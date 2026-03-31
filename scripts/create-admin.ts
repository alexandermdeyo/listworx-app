import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdminUser() {
  console.log('Creating admin user...');

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'admin@listworx.co',
    password: 'ListWorx2026!Admin',
    email_confirm: true,
    user_metadata: {
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  if (authError) {
    console.error('Error creating auth user:', authError);
    return;
  }

  console.log('Auth user created:', authData.user.id);

  const { data: userData, error: userError } = await supabase
    .from('users')
    .upsert({
      id: authData.user.id,
      name: 'Admin User',
      email: 'admin@listworx.co',
      role: 'ADMIN',
      email_verified: true,
    }, {
      onConflict: 'id'
    });

  if (userError) {
    console.error('Error creating public user:', userError);
    return;
  }

  console.log('Admin user created successfully!');
  console.log('Email: admin@listworx.co');
  console.log('Password: ListWorx2026!Admin');
  console.log('⚠️  CHANGE THIS PASSWORD IN PRODUCTION!');
}

createAdminUser();
