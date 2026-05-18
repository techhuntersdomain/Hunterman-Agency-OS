-- Hunterman Agency OS — Sample / test data
-- Module: Local Growth Pipeline
--
-- Run this AFTER migrations/001_initial_schema.sql.
-- Safe to re-run: it removes the three sample leads first (matched by email),
-- so you always end up with exactly these three rows.

DELETE FROM leads
WHERE email IN (
  'kontakt@glanzklar-berlin.de',
  'info@malerei-hoffmann.de',
  'service@elektro-koeln.de'
);

INSERT INTO leads
  (business_name, contact_name, email, phone, website, industry, location, status, source, notes, score)
VALUES
  (
    'GlanzKlar Gebäudereinigung',
    'Mehmet Yıldız',
    'kontakt@glanzklar-berlin.de',
    '+49 30 1234567',
    NULL,
    'Cleaning Services',
    'Berlin',
    'new',
    'sample-seed',
    'Small cleaning company, no website yet. Strong word-of-mouth in Kreuzberg.',
    62
  ),
  (
    'Malerei Hoffmann',
    'Anke Hoffmann',
    'info@malerei-hoffmann.de',
    '+49 211 7654321',
    'http://malerei-hoffmann.de',
    'Painting & Decorating',
    'Düsseldorf',
    'researching',
    'sample-seed',
    'Outdated single-page website, no booking form. Good Google rating.',
    71
  ),
  (
    'Elektro Köln Meisterbetrieb',
    'Stefan Brandt',
    'service@elektro-koeln.de',
    '+49 221 9988776',
    NULL,
    'Electrical Services',
    'Cologne',
    'qualified',
    'sample-seed',
    'Master electrician, 12 Google reviews. Ready for a demo site.',
    84
  );
