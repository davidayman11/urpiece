-- Create a starter announcement bar (only if none exists). Edit it in Admin > Pages & Sections > Site Settings.
INSERT INTO "SiteSection" ("id", "pageSlug", "type", "content", "isVisible", "sortOrder", "createdAt", "updatedAt")
SELECT
    'announcement-default',
    'site',
    'announcement',
    '{"messages":"Welcome to UrPiece\nYour Glow, Your Piece","speed":"25"}',
    true,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "SiteSection" WHERE "type" = 'announcement');
