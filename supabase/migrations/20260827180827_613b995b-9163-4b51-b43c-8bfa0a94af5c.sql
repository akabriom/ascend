CREATE TABLE public.gym_state (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gym_state TO authenticated;
GRANT ALL ON public.gym_state TO service_role;

ALTER TABLE public.gym_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own gym data"
  ON public.gym_state FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);