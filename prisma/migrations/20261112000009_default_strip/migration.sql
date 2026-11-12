-- Starter scrolling strip under the hero (only if none exists). Edit in Admin > Pages & Sections > Home Page.
INSERT INTO "SiteSection" ("id", "pageSlug", "type", "content", "isVisible", "sortOrder", "createdAt", "updatedAt")
SELECT
    'strip-default',
    'home',
    'marquee',
    '{"messages":"Every piece is prepared with love and care\nYour Glow, Your Piece","icon":"heart","position":"hero","speed":"30"}',
    true,
    5,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "SiteSection" WHERE "type" = 'marquee');
