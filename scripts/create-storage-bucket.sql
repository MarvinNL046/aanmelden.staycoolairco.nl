-- Create storage bucket for contracts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'contracts',
    'contracts', 
    false,
    10485760, -- 10MB
    ARRAY['application/pdf']
);

-- Verify bucket was created
SELECT * FROM storage.buckets WHERE name = 'contracts';