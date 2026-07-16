-- Seed a few contractors so matching + the admin dashboard have data to work with.
-- Two are already approved, two are pending (so you can practice approving them).

INSERT INTO contractors (company, contact_name, email, phone, service_area, postal_prefix, specialties, status)
SELECT * FROM (VALUES
  ('Summit Roofing Co.',    'Dave Nguyen',   'leads@summitroofing.example', '416-555-0110', 'Downtown Toronto',       'M5V', ARRAY['shingles','metal'],        'approved'),
  ('Maple Leaf Exteriors',  'Sarah Bianchi', 'quotes@mapleleaf.example',    '416-555-0134', 'Downtown Toronto',       'M5H', ARRAY['shingles','flat'],         'approved'),
  ('Northern Peak Roofers', 'Tom Reyes',     'hello@northernpeak.example',  '705-555-0177', 'Greater Sudbury',        'P3A', ARRAY['metal','shingles'],        'approved'),
  ('TrueLine Roofing',      'Priya Shah',    'office@trueline.example',     '905-555-0199', 'Mississauga, Oakville',  'L5B', ARRAY['shingles','flat','metal'], 'pending')
) AS seed(company, contact_name, email, phone, service_area, postal_prefix, specialties, status)
WHERE NOT EXISTS (SELECT 1 FROM contractors);
