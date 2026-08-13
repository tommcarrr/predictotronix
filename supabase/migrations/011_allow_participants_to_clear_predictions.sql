-- Allow participants to clear only their own predictions before kickoff.
-- The Server Action also enforces the season clock lock in application code.
create policy "predictions_delete_own_before_kickoff"
  on public.predictions for delete
  using (
    participant_id = public.get_participant_id()
    and (
      select kickoff from public.fixtures where id = fixture_id
    ) > now()
  );
