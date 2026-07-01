-- Seed a few contractors so matching + the admin dashboard have data to work with.
-- Two are already approved, two are pending (so you can practice approving them).

INSERT INTO contractors (company, contact_name, email, phone, service_area, postal_prefix, specialties, status)
VALUES
  ('Summit Roofing Co.',     'Dave Nguyen',   'leads@summitroofing.example',   '416-555-0110', 'Toronto & GTA',      'M', ARRAY['shingles','metal'],        'approved'),
  ('Maple Leaf Exteriors',   'Sarah Bianchi', 'quotes@mapleleaf.example',      '416-555-0134', 'Toronto core',       'M', ARRAY['shingles','flat'],         'approved'),
  ('Northern Peak Roofers',  'Tom Reyes',     'hello@northernpeak.example',    '905-555-0177', 'North York, Vaughan','M', ARRAY['metal'],                   'pending'),
  ('TrueLine Roofing',       'Priya Shah',    'office@trueline.example',       '905-555-0199', 'Mississauga, Oakville','L', ARRAY['shingles','flat','metal'], 'pending')
ON CONFLICT DO NOTHING;
