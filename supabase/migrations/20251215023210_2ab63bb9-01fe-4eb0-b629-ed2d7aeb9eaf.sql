-- Create storage bucket for email attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('email-attachments', 'email-attachments', false);

-- Storage policies for email attachments
CREATE POLICY "Users can upload their own attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'email-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'email-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'email-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Enable realtime for emails table
ALTER PUBLICATION supabase_realtime ADD TABLE public.emails;