-- Only remove Administration projects with no timesheet entries (i.e. those seeded by the up
-- migration). Projects renamed from a pre-existing "Admin" are left in place to avoid losing
-- their history via the ON DELETE CASCADE on timesheet_entries.
DELETE FROM user_projects up
WHERE up.name = 'Administration'
  AND NOT EXISTS (SELECT 1 FROM timesheet_entries te WHERE te.project_id = up.id);
