-- Seed contractors so matching + the admin dashboard have data to work with.
-- Four approved contractors in each of four metros (matched by the first 2 chars
-- of the FSA): M5 = Toronto, P3 = Greater Sudbury, K1 = Ottawa, V6 = Vancouver.

INSERT INTO contractors (company, contact_name, email, phone, service_area, postal_prefix, specialties, status)
SELECT * FROM (VALUES
  -- Toronto (M5)
  ('Summit Roofing Co.',     'Dave Nguyen',    'leads@summitroofing.example', '416-555-0110', 'Downtown Toronto',   'M5V', ARRAY['shingles','metal'], 'approved'),
  ('Maple Leaf Exteriors',   'Sarah Bianchi',  'quotes@mapleleaf.example',    '416-555-0134', 'Downtown Toronto',   'M5H', ARRAY['shingles','flat'],  'approved'),
  ('Lakeshore Roofing',      'Marco Silva',    'info@lakeshoreroof.example',  '416-555-0142', 'Toronto Waterfront', 'M5A', ARRAY['shingles','metal'], 'approved'),
  ('Harbourfront Exteriors', 'Amy Wong',       'hello@harbourfront.example',  '416-555-0188', 'Central Toronto',    'M5T', ARRAY['flat','metal'],     'approved'),
  -- Greater Sudbury (P3)
  ('Northern Peak Roofers',  'Tom Reyes',      'hello@northernpeak.example',  '705-555-0177', 'Greater Sudbury',    'P3A', ARRAY['metal','shingles'], 'approved'),
  ('Nickel City Roofing',    'Julie Tremblay', 'quotes@nickelcityroof.example','705-555-0181','Sudbury',            'P3B', ARRAY['shingles','flat'],  'approved'),
  ('Laurentian Exteriors',   'Ken Blais',      'office@laurentianext.example','705-555-0193', 'Sudbury South',      'P3C', ARRAY['shingles','metal'], 'approved'),
  ('Boreal Roofing Co.',     'Rita Cormier',   'info@borealroof.example',     '705-555-0166', 'New Sudbury',        'P3E', ARRAY['metal','flat'],     'approved'),
  -- Ottawa (K1)
  ('Capital Roofing',        'Sam Okoye',      'leads@capitalroofing.example','613-555-0110', 'Downtown Ottawa',    'K1P', ARRAY['shingles','metal'], 'approved'),
  ('Rideau Roofers',         'Claire Dubois',  'quotes@rideauroofers.example','613-555-0124', 'Rideau, Ottawa',     'K1N', ARRAY['shingles','flat'],  'approved'),
  ('ByWard Exteriors',       'Hassan Ali',     'office@bywardext.example',    '613-555-0137', 'ByWard Market',      'K1S', ARRAY['metal','shingles'], 'approved'),
  ('Parliament Roofing',     'Nina Roy',       'hello@parliamentroof.example','613-555-0149', 'Central Ottawa',     'K1Y', ARRAY['flat','metal'],     'approved'),
  -- Vancouver (V6)
  ('Pacific Crest Roofing',  'Leo Chan',       'leads@pacificcrest.example',  '604-555-0110', 'Downtown Vancouver', 'V6B', ARRAY['shingles','metal'], 'approved'),
  ('Gastown Roofers',        'Maya Patel',     'quotes@gastownroofers.example','604-555-0122','Gastown',            'V6E', ARRAY['flat','shingles'],  'approved'),
  ('Coastal Exteriors',      'Derek Lam',      'office@coastalext.example',   '604-555-0135', 'West End',           'V6G', ARRAY['metal','shingles'], 'approved'),
  ('Granville Roofing Co.',  'Sophie Nguyen',  'hello@granvilleroof.example', '604-555-0147', 'Yaletown',           'V6Z', ARRAY['shingles','flat'],  'approved')
) AS seed(company, contact_name, email, phone, service_area, postal_prefix, specialties, status)
WHERE NOT EXISTS (SELECT 1 FROM contractors);
