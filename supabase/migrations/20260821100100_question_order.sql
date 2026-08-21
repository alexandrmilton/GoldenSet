-- Step 5 asks four questions, and they were coming out in alphabetical order of
-- the answer key — baseline, direction, serve, volley — rather than the order
-- docs/RATING.md lays out. sort_order already existed but only orders the
-- options inside one question, not the questions themselves.

alter table public.onboarding_options
  add column question_order smallint not null default 1;

update public.onboarding_options set question_order = case answer_key
  when 'serve'     then 1
  when 'baseline'  then 2
  when 'direction' then 3
  when 'volley'    then 4
  else 1
end;
