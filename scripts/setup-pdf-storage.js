import { createClient } from '@supabase/supabase-js'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY // You need to add this to .env.local

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  console.error('Please add SUPABASE_SERVICE_KEY to your .env.local file')
  console.error('You can find this in your Supabase dashboard under Settings > API')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupPDFStorage() {
  console.log('Setting up PDF storage bucket...')

  try {
    // Create the storage bucket
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('contracts', {
      public: false,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['application/pdf']
    })

    if (bucketError && bucketError.message !== 'Bucket already exists') {
      throw bucketError
    }

    console.log('✓ Storage bucket created/verified')

    // Create RLS policies for the bucket
    console.log('Setting up storage policies...')

    // Policy 1: Allow authenticated users to upload PDFs
    const uploadPolicy = `
      CREATE POLICY "Allow authenticated uploads"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'contracts');
    `

    // Policy 2: Allow anyone with the link to read PDFs
    const readPolicy = `
      CREATE POLICY "Allow public reads"
      ON storage.objects
      FOR SELECT
      TO anon, authenticated
      USING (bucket_id = 'contracts');
    `

    // Note: These policies need to be run in the SQL editor
    console.log('\nPlease run the following SQL in your Supabase SQL Editor:')
    console.log('=' * 50)
    console.log(uploadPolicy)
    console.log(readPolicy)
    console.log('=' * 50)

    console.log('\n✓ Setup complete!')
    console.log('\nNext steps:')
    console.log('1. Run the SQL policies above in your Supabase SQL Editor')
    console.log('2. Run the database migrations to add pdf_url columns')
    console.log('3. Test the PDF upload functionality')

  } catch (error) {
    console.error('Error setting up PDF storage:', error)
  }
}

// Run the setup
setupPDFStorage()