INSERT INTO companies (id, slug, name, tagline, about, industry, size_band, founded_year, headquarters, website, brand_color, verified, follower_count, employee_count, open_roles_count, created_by)
VALUES
  ('10000000-0000-0000-0000-000000000001','techcorp','TechCorp','Enterprise SaaS for design teams','We build design systems infrastructure used by Fortune 500 design orgs.','Software','201-1000',2015,'London, UK','https://techcorp.example','#1d4ed8',true,4820,420,12,'00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002','designlab','DesignLab','Agency for ambitious brands','Boutique design agency working with seed-stage and Series A companies.','Design','11-50',2018,'Manchester, UK','https://designlab.example','#0f766e',false,612,28,3,'00000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

INSERT INTO company_members (company_id, identity_id, role, title) VALUES
  ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','admin','Senior Product Designer'),
  ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','owner','Founder')
ON CONFLICT DO NOTHING;

INSERT INTO company_locations (company_id, label, city, country, is_hq) VALUES
  ('10000000-0000-0000-0000-000000000001','HQ','London','UK',true),
  ('10000000-0000-0000-0000-000000000001','Engineering','Berlin','DE',false),
  ('10000000-0000-0000-0000-000000000002','HQ','Manchester','UK',true)
ON CONFLICT DO NOTHING;

INSERT INTO company_brand (company_id, primary_color, secondary_color, values, perks) VALUES
  ('10000000-0000-0000-0000-000000000001','#1d4ed8','#0ea5e9','["craft","clarity","customer-first"]','["remote-first","learning budget","equity"]'),
  ('10000000-0000-0000-0000-000000000002','#0f766e','#14b8a6','["taste","speed","kindness"]','["4-day week","sabbaticals"]')
ON CONFLICT DO NOTHING;
