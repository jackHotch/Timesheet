-- Rename any pre-existing "Admin" project to "Administration", unless the user already has one
UPDATE user_projects up
SET name = 'Administration'
WHERE up.name = 'Admin'
  AND NOT EXISTS (
    SELECT 1 FROM user_projects up2
    WHERE up2.user_id = up.user_id AND up2.name = 'Administration'
  );

-- Remove any leftover "Admin" project (the rename above was skipped because the user already had
-- a real "Administration" project) that has no timesheet entries tied to it
DELETE FROM user_projects up
WHERE up.name = 'Admin'
  AND NOT EXISTS (SELECT 1 FROM timesheet_entries te WHERE te.project_id = up.id);

-- Seed a default "Administration" project for any user who still doesn't have one
INSERT INTO user_projects (user_id, name, color_index)
SELECT u.id, 'Administration', 0
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_projects up WHERE up.user_id = u.id AND up.name = 'Administration'
);
