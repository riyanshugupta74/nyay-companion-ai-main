-- Add hidden_for column to track "Delete for Me" functionality
-- This stores an array of user IDs who have hidden this message from their view
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS hidden_for uuid[] DEFAULT '{}';

-- Create index for faster lookups when filtering hidden messages
CREATE INDEX IF NOT EXISTS idx_messages_hidden_for ON public.messages USING GIN(hidden_for);

-- Enable realtime for DELETE events on messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create RLS policy to allow message deletion by sender only
CREATE POLICY "Senders can delete their own messages"
ON public.messages
FOR DELETE
USING (auth.uid() = sender_id);

-- Create RLS policy to allow updating hidden_for for participants
CREATE POLICY "Participants can hide messages for themselves"
ON public.messages
FOR UPDATE
USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);