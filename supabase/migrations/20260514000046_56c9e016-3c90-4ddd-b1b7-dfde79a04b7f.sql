ALTER TABLE public.reply_tokens DROP CONSTRAINT IF EXISTS reply_tokens_action_check;
ALTER TABLE public.reply_tokens ADD CONSTRAINT reply_tokens_action_check
  CHECK (action IN ('done','in_progress','blocked','update'));