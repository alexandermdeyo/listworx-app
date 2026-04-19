/*
  # Ensure contiguous US states + counties reference data is fully populated

  Safe/idempotent seed expansion only:
  - Keeps existing schema untouched
  - Inserts missing states (48 contiguous, excludes AK/HI)
  - Replays full county seeds for contiguous states using ON CONFLICT guards
*/

-- Ensure states rows exist and are active
INSERT INTO states (code, name, is_active)
VALUES
  ('AL', 'Alabama', true),('AZ', 'Arizona', true),('AR', 'Arkansas', true),('CA', 'California', true),
  ('CO', 'Colorado', true),('CT', 'Connecticut', true),('DE', 'Delaware', true),('FL', 'Florida', true),
  ('GA', 'Georgia', true),('ID', 'Idaho', true),('IL', 'Illinois', true),('IN', 'Indiana', true),
  ('IA', 'Iowa', true),('KS', 'Kansas', true),('KY', 'Kentucky', true),('LA', 'Louisiana', true),
  ('ME', 'Maine', true),('MD', 'Maryland', true),('MA', 'Massachusetts', true),('MI', 'Michigan', true),
  ('MN', 'Minnesota', true),('MS', 'Mississippi', true),('MO', 'Missouri', true),('MT', 'Montana', true),
  ('NE', 'Nebraska', true),('NV', 'Nevada', true),('NH', 'New Hampshire', true),('NJ', 'New Jersey', true),
  ('NM', 'New Mexico', true),('NY', 'New York', true),('NC', 'North Carolina', true),('ND', 'North Dakota', true),
  ('OH', 'Ohio', true),('OK', 'Oklahoma', true),('OR', 'Oregon', true),('PA', 'Pennsylvania', true),
  ('RI', 'Rhode Island', true),('SC', 'South Carolina', true),('SD', 'South Dakota', true),('TN', 'Tennessee', true),
  ('TX', 'Texas', true),('UT', 'Utah', true),('VT', 'Vermont', true),('VA', 'Virginia', true),
  ('WA', 'Washington', true),('WV', 'West Virginia', true),('WI', 'Wisconsin', true),('WY', 'Wyoming', true)
ON CONFLICT (code)
DO UPDATE SET
  name = EXCLUDED.name,
  is_active = true;

-- Keep all contiguous states active
UPDATE states
SET is_active = true
WHERE code IN (
  'AL','AZ','AR','CA','CO','CT','DE','FL','GA','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI',
  'MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN',
  'TX','UT','VT','VA','WA','WV','WI','WY'
);
/*
  # Insert Counties - Batch 1 (Alabama through Florida)

  1. Data
    - Alabama (67 counties)
    - Arizona (15 counties)
    - Arkansas (75 counties)
    - California (58 counties)
    - Colorado (64 counties)
    - Connecticut (8 counties)
    - Delaware (3 counties)
    - Florida (67 counties)

  2. Notes
    - All counties inserted with is_active = true
    - Uses ON CONFLICT to avoid duplicates
*/

INSERT INTO counties (name, state_code, is_active) VALUES
-- Alabama (67 counties)
('Autauga', 'AL', true),('Baldwin', 'AL', true),('Barbour', 'AL', true),('Bibb', 'AL', true),('Blount', 'AL', true),
('Bullock', 'AL', true),('Butler', 'AL', true),('Calhoun', 'AL', true),('Chambers', 'AL', true),('Cherokee', 'AL', true),
('Chilton', 'AL', true),('Choctaw', 'AL', true),('Clarke', 'AL', true),('Clay', 'AL', true),('Cleburne', 'AL', true),
('Coffee', 'AL', true),('Colbert', 'AL', true),('Conecuh', 'AL', true),('Coosa', 'AL', true),('Covington', 'AL', true),
('Crenshaw', 'AL', true),('Cullman', 'AL', true),('Dale', 'AL', true),('Dallas', 'AL', true),('DeKalb', 'AL', true),
('Elmore', 'AL', true),('Escambia', 'AL', true),('Etowah', 'AL', true),('Fayette', 'AL', true),('Franklin', 'AL', true),
('Geneva', 'AL', true),('Greene', 'AL', true),('Hale', 'AL', true),('Henry', 'AL', true),('Houston', 'AL', true),
('Jackson', 'AL', true),('Jefferson', 'AL', true),('Lamar', 'AL', true),('Lauderdale', 'AL', true),('Lawrence', 'AL', true),
('Lee', 'AL', true),('Limestone', 'AL', true),('Lowndes', 'AL', true),('Macon', 'AL', true),('Madison', 'AL', true),
('Marengo', 'AL', true),('Marion', 'AL', true),('Marshall', 'AL', true),('Mobile', 'AL', true),('Monroe', 'AL', true),
('Montgomery', 'AL', true),('Morgan', 'AL', true),('Perry', 'AL', true),('Pickens', 'AL', true),('Pike', 'AL', true),
('Randolph', 'AL', true),('Russell', 'AL', true),('Shelby', 'AL', true),('St. Clair', 'AL', true),('Sumter', 'AL', true),
('Talladega', 'AL', true),('Tallapoosa', 'AL', true),('Tuscaloosa', 'AL', true),('Walker', 'AL', true),('Washington', 'AL', true),
('Wilcox', 'AL', true),('Winston', 'AL', true),
-- Arizona (15 counties)
('Apache', 'AZ', true),('Cochise', 'AZ', true),('Coconino', 'AZ', true),('Gila', 'AZ', true),('Graham', 'AZ', true),
('Greenlee', 'AZ', true),('La Paz', 'AZ', true),('Maricopa', 'AZ', true),('Mohave', 'AZ', true),('Navajo', 'AZ', true),
('Pima', 'AZ', true),('Pinal', 'AZ', true),('Santa Cruz', 'AZ', true),('Yavapai', 'AZ', true),('Yuma', 'AZ', true),
-- Arkansas (75 counties)
('Arkansas', 'AR', true),('Ashley', 'AR', true),('Baxter', 'AR', true),('Benton', 'AR', true),('Boone', 'AR', true),
('Bradley', 'AR', true),('Calhoun', 'AR', true),('Carroll', 'AR', true),('Chicot', 'AR', true),('Clark', 'AR', true),
('Clay', 'AR', true),('Cleburne', 'AR', true),('Cleveland', 'AR', true),('Columbia', 'AR', true),('Conway', 'AR', true),
('Craighead', 'AR', true),('Crawford', 'AR', true),('Crittenden', 'AR', true),('Cross', 'AR', true),('Dallas', 'AR', true),
('Desha', 'AR', true),('Drew', 'AR', true),('Faulkner', 'AR', true),('Franklin', 'AR', true),('Fulton', 'AR', true),
('Garland', 'AR', true),('Grant', 'AR', true),('Greene', 'AR', true),('Hempstead', 'AR', true),('Hot Spring', 'AR', true),
('Howard', 'AR', true),('Independence', 'AR', true),('Izard', 'AR', true),('Jackson', 'AR', true),('Jefferson', 'AR', true),
('Johnson', 'AR', true),('Lafayette', 'AR', true),('Lawrence', 'AR', true),('Lee', 'AR', true),('Lincoln', 'AR', true),
('Little River', 'AR', true),('Logan', 'AR', true),('Lonoke', 'AR', true),('Madison', 'AR', true),('Marion', 'AR', true),
('Miller', 'AR', true),('Mississippi', 'AR', true),('Monroe', 'AR', true),('Montgomery', 'AR', true),('Nevada', 'AR', true),
('Newton', 'AR', true),('Ouachita', 'AR', true),('Perry', 'AR', true),('Phillips', 'AR', true),('Pike', 'AR', true),
('Poinsett', 'AR', true),('Polk', 'AR', true),('Pope', 'AR', true),('Prairie', 'AR', true),('Pulaski', 'AR', true),
('Randolph', 'AR', true),('Saline', 'AR', true),('Scott', 'AR', true),('Searcy', 'AR', true),('Sebastian', 'AR', true),
('Sevier', 'AR', true),('Sharp', 'AR', true),('St. Francis', 'AR', true),('Stone', 'AR', true),('Union', 'AR', true),
('Van Buren', 'AR', true),('Washington', 'AR', true),('White', 'AR', true),('Woodruff', 'AR', true),('Yell', 'AR', true),
-- California (58 counties)
('Alameda', 'CA', true),('Alpine', 'CA', true),('Amador', 'CA', true),('Butte', 'CA', true),('Calaveras', 'CA', true),
('Colusa', 'CA', true),('Contra Costa', 'CA', true),('Del Norte', 'CA', true),('El Dorado', 'CA', true),('Fresno', 'CA', true),
('Glenn', 'CA', true),('Humboldt', 'CA', true),('Imperial', 'CA', true),('Inyo', 'CA', true),('Kern', 'CA', true),
('Kings', 'CA', true),('Lake', 'CA', true),('Lassen', 'CA', true),('Los Angeles', 'CA', true),('Madera', 'CA', true),
('Marin', 'CA', true),('Mariposa', 'CA', true),('Mendocino', 'CA', true),('Merced', 'CA', true),('Modoc', 'CA', true),
('Mono', 'CA', true),('Monterey', 'CA', true),('Napa', 'CA', true),('Nevada', 'CA', true),('Orange', 'CA', true),
('Placer', 'CA', true),('Plumas', 'CA', true),('Riverside', 'CA', true),('Sacramento', 'CA', true),('San Benito', 'CA', true),
('San Bernardino', 'CA', true),('San Diego', 'CA', true),('San Francisco', 'CA', true),('San Joaquin', 'CA', true),('San Luis Obispo', 'CA', true),
('San Mateo', 'CA', true),('Santa Barbara', 'CA', true),('Santa Clara', 'CA', true),('Santa Cruz', 'CA', true),('Shasta', 'CA', true),
('Sierra', 'CA', true),('Siskiyou', 'CA', true),('Solano', 'CA', true),('Sonoma', 'CA', true),('Stanislaus', 'CA', true),
('Sutter', 'CA', true),('Tehama', 'CA', true),('Trinity', 'CA', true),('Tulare', 'CA', true),('Tuolumne', 'CA', true),
('Ventura', 'CA', true),('Yolo', 'CA', true),('Yuba', 'CA', true),
-- Colorado (64 counties)
('Adams', 'CO', true),('Alamosa', 'CO', true),('Arapahoe', 'CO', true),('Archuleta', 'CO', true),('Baca', 'CO', true),
('Bent', 'CO', true),('Boulder', 'CO', true),('Broomfield', 'CO', true),('Chaffee', 'CO', true),('Cheyenne', 'CO', true),
('Clear Creek', 'CO', true),('Conejos', 'CO', true),('Costilla', 'CO', true),('Crowley', 'CO', true),('Custer', 'CO', true),
('Delta', 'CO', true),('Denver', 'CO', true),('Dolores', 'CO', true),('Douglas', 'CO', true),('Eagle', 'CO', true),
('El Paso', 'CO', true),('Elbert', 'CO', true),('Fremont', 'CO', true),('Garfield', 'CO', true),('Gilpin', 'CO', true),
('Grand', 'CO', true),('Gunnison', 'CO', true),('Hinsdale', 'CO', true),('Huerfano', 'CO', true),('Jackson', 'CO', true),
('Jefferson', 'CO', true),('Kiowa', 'CO', true),('Kit Carson', 'CO', true),('La Plata', 'CO', true),('Lake', 'CO', true),
('Larimer', 'CO', true),('Las Animas', 'CO', true),('Lincoln', 'CO', true),('Logan', 'CO', true),('Mesa', 'CO', true),
('Mineral', 'CO', true),('Moffat', 'CO', true),('Montezuma', 'CO', true),('Montrose', 'CO', true),('Morgan', 'CO', true),
('Otero', 'CO', true),('Ouray', 'CO', true),('Park', 'CO', true),('Phillips', 'CO', true),('Pitkin', 'CO', true),
('Prowers', 'CO', true),('Pueblo', 'CO', true),('Rio Blanco', 'CO', true),('Rio Grande', 'CO', true),('Routt', 'CO', true),
('Saguache', 'CO', true),('San Juan', 'CO', true),('San Miguel', 'CO', true),('Sedgwick', 'CO', true),('Summit', 'CO', true),
('Teller', 'CO', true),('Washington', 'CO', true),('Weld', 'CO', true),('Yuma', 'CO', true),
-- Connecticut (8 counties)
('Fairfield', 'CT', true),('Hartford', 'CT', true),('Litchfield', 'CT', true),('Middlesex', 'CT', true),
('New Haven', 'CT', true),('New London', 'CT', true),('Tolland', 'CT', true),('Windham', 'CT', true),
-- Delaware (3 counties)
('Kent', 'DE', true),('New Castle', 'DE', true),('Sussex', 'DE', true),
-- Florida (67 counties)
('Alachua', 'FL', true),('Baker', 'FL', true),('Bay', 'FL', true),('Bradford', 'FL', true),('Brevard', 'FL', true),
('Broward', 'FL', true),('Calhoun', 'FL', true),('Charlotte', 'FL', true),('Citrus', 'FL', true),('Clay', 'FL', true),
('Collier', 'FL', true),('Columbia', 'FL', true),('DeSoto', 'FL', true),('Dixie', 'FL', true),('Duval', 'FL', true),
('Escambia', 'FL', true),('Flagler', 'FL', true),('Franklin', 'FL', true),('Gadsden', 'FL', true),('Gilchrist', 'FL', true),
('Glades', 'FL', true),('Gulf', 'FL', true),('Hamilton', 'FL', true),('Hardee', 'FL', true),('Hendry', 'FL', true),
('Hernando', 'FL', true),('Highlands', 'FL', true),('Hillsborough', 'FL', true),('Holmes', 'FL', true),('Indian River', 'FL', true),
('Jackson', 'FL', true),('Jefferson', 'FL', true),('Lafayette', 'FL', true),('Lake', 'FL', true),('Lee', 'FL', true),
('Leon', 'FL', true),('Levy', 'FL', true),('Liberty', 'FL', true),('Madison', 'FL', true),('Manatee', 'FL', true),
('Marion', 'FL', true),('Martin', 'FL', true),('Miami-Dade', 'FL', true),('Monroe', 'FL', true),('Nassau', 'FL', true),
('Okaloosa', 'FL', true),('Okeechobee', 'FL', true),('Orange', 'FL', true),('Osceola', 'FL', true),('Palm Beach', 'FL', true),
('Pasco', 'FL', true),('Pinellas', 'FL', true),('Polk', 'FL', true),('Putnam', 'FL', true),('Santa Rosa', 'FL', true),
('Sarasota', 'FL', true),('Seminole', 'FL', true),('St. Johns', 'FL', true),('St. Lucie', 'FL', true),('Sumter', 'FL', true),
('Suwannee', 'FL', true),('Taylor', 'FL', true),('Union', 'FL', true),('Volusia', 'FL', true),('Wakulla', 'FL', true),
('Walton', 'FL', true),('Washington', 'FL', true)
ON CONFLICT DO NOTHING;

/*
  # Insert Counties - Batch 2 (Georgia through Massachusetts)

  1. Data
    - Georgia (159 counties)
    - Idaho (44 counties)
    - Illinois (102 counties)
    - Indiana (92 counties)
    - Iowa (99 counties)
    - Kansas (105 counties)
    - Louisiana (64 parishes)
    - Maine (16 counties)
    - Maryland (24 counties)
    - Massachusetts (14 counties)
*/

INSERT INTO counties (name, state_code, is_active) VALUES
-- Georgia (159 counties)
('Appling', 'GA', true),('Atkinson', 'GA', true),('Bacon', 'GA', true),('Baker', 'GA', true),('Baldwin', 'GA', true),
('Banks', 'GA', true),('Barrow', 'GA', true),('Bartow', 'GA', true),('Ben Hill', 'GA', true),('Berrien', 'GA', true),
('Bibb', 'GA', true),('Bleckley', 'GA', true),('Brantley', 'GA', true),('Brooks', 'GA', true),('Bryan', 'GA', true),
('Bulloch', 'GA', true),('Burke', 'GA', true),('Butts', 'GA', true),('Calhoun', 'GA', true),('Camden', 'GA', true),
('Candler', 'GA', true),('Carroll', 'GA', true),('Catoosa', 'GA', true),('Charlton', 'GA', true),('Chatham', 'GA', true),
('Chattahoochee', 'GA', true),('Chattooga', 'GA', true),('Cherokee', 'GA', true),('Clarke', 'GA', true),('Clay', 'GA', true),
('Clayton', 'GA', true),('Clinch', 'GA', true),('Cobb', 'GA', true),('Coffee', 'GA', true),('Colquitt', 'GA', true),
('Columbia', 'GA', true),('Cook', 'GA', true),('Coweta', 'GA', true),('Crawford', 'GA', true),('Crisp', 'GA', true),
('Dade', 'GA', true),('Dawson', 'GA', true),('Decatur', 'GA', true),('DeKalb', 'GA', true),('Dodge', 'GA', true),
('Dooly', 'GA', true),('Dougherty', 'GA', true),('Douglas', 'GA', true),('Early', 'GA', true),('Echols', 'GA', true),
('Effingham', 'GA', true),('Elbert', 'GA', true),('Emanuel', 'GA', true),('Evans', 'GA', true),('Fannin', 'GA', true),
('Fayette', 'GA', true),('Floyd', 'GA', true),('Forsyth', 'GA', true),('Franklin', 'GA', true),('Fulton', 'GA', true),
('Gilmer', 'GA', true),('Glascock', 'GA', true),('Glynn', 'GA', true),('Gordon', 'GA', true),('Grady', 'GA', true),
('Greene', 'GA', true),('Gwinnett', 'GA', true),('Habersham', 'GA', true),('Hall', 'GA', true),('Hancock', 'GA', true),
('Haralson', 'GA', true),('Harris', 'GA', true),('Hart', 'GA', true),('Heard', 'GA', true),('Henry', 'GA', true),
('Houston', 'GA', true),('Irwin', 'GA', true),('Jackson', 'GA', true),('Jasper', 'GA', true),('Jeff Davis', 'GA', true),
('Jefferson', 'GA', true),('Jenkins', 'GA', true),('Johnson', 'GA', true),('Jones', 'GA', true),('Lamar', 'GA', true),
('Lanier', 'GA', true),('Laurens', 'GA', true),('Lee', 'GA', true),('Liberty', 'GA', true),('Lincoln', 'GA', true),
('Long', 'GA', true),('Lowndes', 'GA', true),('Lumpkin', 'GA', true),('Macon', 'GA', true),('Madison', 'GA', true),
('Marion', 'GA', true),('McDuffie', 'GA', true),('McIntosh', 'GA', true),('Meriwether', 'GA', true),('Miller', 'GA', true),
('Mitchell', 'GA', true),('Monroe', 'GA', true),('Montgomery', 'GA', true),('Morgan', 'GA', true),('Murray', 'GA', true),
('Muscogee', 'GA', true),('Newton', 'GA', true),('Oconee', 'GA', true),('Oglethorpe', 'GA', true),('Paulding', 'GA', true),
('Peach', 'GA', true),('Pickens', 'GA', true),('Pierce', 'GA', true),('Pike', 'GA', true),('Polk', 'GA', true),
('Pulaski', 'GA', true),('Putnam', 'GA', true),('Quitman', 'GA', true),('Rabun', 'GA', true),('Randolph', 'GA', true),
('Richmond', 'GA', true),('Rockdale', 'GA', true),('Schley', 'GA', true),('Screven', 'GA', true),('Seminole', 'GA', true),
('Spalding', 'GA', true),('Stephens', 'GA', true),('Stewart', 'GA', true),('Sumter', 'GA', true),('Talbot', 'GA', true),
('Taliaferro', 'GA', true),('Tattnall', 'GA', true),('Taylor', 'GA', true),('Telfair', 'GA', true),('Terrell', 'GA', true),
('Thomas', 'GA', true),('Tift', 'GA', true),('Toombs', 'GA', true),('Towns', 'GA', true),('Treutlen', 'GA', true),
('Troup', 'GA', true),('Turner', 'GA', true),('Twiggs', 'GA', true),('Union', 'GA', true),('Upson', 'GA', true),
('Walker', 'GA', true),('Walton', 'GA', true),('Ware', 'GA', true),('Warren', 'GA', true),('Washington', 'GA', true),
('Wayne', 'GA', true),('Webster', 'GA', true),('Wheeler', 'GA', true),('White', 'GA', true),('Whitfield', 'GA', true),
('Wilcox', 'GA', true),('Wilkes', 'GA', true),('Wilkinson', 'GA', true),('Worth', 'GA', true),
-- Idaho (44 counties)
('Ada', 'ID', true),('Adams', 'ID', true),('Bannock', 'ID', true),('Bear Lake', 'ID', true),('Benewah', 'ID', true),
('Bingham', 'ID', true),('Blaine', 'ID', true),('Boise', 'ID', true),('Bonner', 'ID', true),('Bonneville', 'ID', true),
('Boundary', 'ID', true),('Butte', 'ID', true),('Camas', 'ID', true),('Canyon', 'ID', true),('Caribou', 'ID', true),
('Cassia', 'ID', true),('Clark', 'ID', true),('Clearwater', 'ID', true),('Custer', 'ID', true),('Elmore', 'ID', true),
('Franklin', 'ID', true),('Fremont', 'ID', true),('Gem', 'ID', true),('Gooding', 'ID', true),('Idaho', 'ID', true),
('Jefferson', 'ID', true),('Jerome', 'ID', true),('Kootenai', 'ID', true),('Latah', 'ID', true),('Lemhi', 'ID', true),
('Lewis', 'ID', true),('Lincoln', 'ID', true),('Madison', 'ID', true),('Minidoka', 'ID', true),('Nez Perce', 'ID', true),
('Oneida', 'ID', true),('Owyhee', 'ID', true),('Payette', 'ID', true),('Power', 'ID', true),('Shoshone', 'ID', true),
('Teton', 'ID', true),('Twin Falls', 'ID', true),('Valley', 'ID', true),('Washington', 'ID', true),
-- Illinois (102 counties)
('Adams', 'IL', true),('Alexander', 'IL', true),('Bond', 'IL', true),('Boone', 'IL', true),('Brown', 'IL', true),
('Bureau', 'IL', true),('Calhoun', 'IL', true),('Carroll', 'IL', true),('Cass', 'IL', true),('Champaign', 'IL', true),
('Christian', 'IL', true),('Clark', 'IL', true),('Clay', 'IL', true),('Clinton', 'IL', true),('Coles', 'IL', true),
('Cook', 'IL', true),('Crawford', 'IL', true),('Cumberland', 'IL', true),('DeKalb', 'IL', true),('De Witt', 'IL', true),
('Douglas', 'IL', true),('DuPage', 'IL', true),('Edgar', 'IL', true),('Edwards', 'IL', true),('Effingham', 'IL', true),
('Fayette', 'IL', true),('Ford', 'IL', true),('Franklin', 'IL', true),('Fulton', 'IL', true),('Gallatin', 'IL', true),
('Greene', 'IL', true),('Grundy', 'IL', true),('Hamilton', 'IL', true),('Hancock', 'IL', true),('Hardin', 'IL', true),
('Henderson', 'IL', true),('Henry', 'IL', true),('Iroquois', 'IL', true),('Jackson', 'IL', true),('Jasper', 'IL', true),
('Jefferson', 'IL', true),('Jersey', 'IL', true),('Jo Daviess', 'IL', true),('Johnson', 'IL', true),('Kane', 'IL', true),
('Kankakee', 'IL', true),('Kendall', 'IL', true),('Knox', 'IL', true),('Lake', 'IL', true),('LaSalle', 'IL', true),
('Lawrence', 'IL', true),('Lee', 'IL', true),('Livingston', 'IL', true),('Logan', 'IL', true),('Macon', 'IL', true),
('Macoupin', 'IL', true),('Madison', 'IL', true),('Marion', 'IL', true),('Marshall', 'IL', true),('Mason', 'IL', true),
('Massac', 'IL', true),('McDonough', 'IL', true),('McHenry', 'IL', true),('McLean', 'IL', true),('Menard', 'IL', true),
('Mercer', 'IL', true),('Monroe', 'IL', true),('Montgomery', 'IL', true),('Morgan', 'IL', true),('Moultrie', 'IL', true),
('Ogle', 'IL', true),('Peoria', 'IL', true),('Perry', 'IL', true),('Piatt', 'IL', true),('Pike', 'IL', true),
('Pope', 'IL', true),('Pulaski', 'IL', true),('Putnam', 'IL', true),('Randolph', 'IL', true),('Richland', 'IL', true),
('Rock Island', 'IL', true),('Saline', 'IL', true),('Sangamon', 'IL', true),('Schuyler', 'IL', true),('Scott', 'IL', true),
('Shelby', 'IL', true),('St. Clair', 'IL', true),('Stark', 'IL', true),('Stephenson', 'IL', true),('Tazewell', 'IL', true),
('Union', 'IL', true),('Vermilion', 'IL', true),('Wabash', 'IL', true),('Warren', 'IL', true),('Washington', 'IL', true),
('Wayne', 'IL', true),('White', 'IL', true),('Whiteside', 'IL', true),('Will', 'IL', true),('Williamson', 'IL', true),
('Winnebago', 'IL', true),('Woodford', 'IL', true),
-- Indiana (92 counties)
('Adams', 'IN', true),('Allen', 'IN', true),('Bartholomew', 'IN', true),('Benton', 'IN', true),('Blackford', 'IN', true),
('Boone', 'IN', true),('Brown', 'IN', true),('Carroll', 'IN', true),('Cass', 'IN', true),('Clark', 'IN', true),
('Clay', 'IN', true),('Clinton', 'IN', true),('Crawford', 'IN', true),('Daviess', 'IN', true),('Dearborn', 'IN', true),
('Decatur', 'IN', true),('DeKalb', 'IN', true),('Delaware', 'IN', true),('Dubois', 'IN', true),('Elkhart', 'IN', true),
('Fayette', 'IN', true),('Floyd', 'IN', true),('Fountain', 'IN', true),('Franklin', 'IN', true),('Fulton', 'IN', true),
('Gibson', 'IN', true),('Grant', 'IN', true),('Greene', 'IN', true),('Hamilton', 'IN', true),('Hancock', 'IN', true),
('Harrison', 'IN', true),('Hendricks', 'IN', true),('Henry', 'IN', true),('Howard', 'IN', true),('Huntington', 'IN', true),
('Jackson', 'IN', true),('Jasper', 'IN', true),('Jay', 'IN', true),('Jefferson', 'IN', true),('Jennings', 'IN', true),
('Johnson', 'IN', true),('Knox', 'IN', true),('Kosciusko', 'IN', true),('LaGrange', 'IN', true),('Lake', 'IN', true),
('LaPorte', 'IN', true),('Lawrence', 'IN', true),('Madison', 'IN', true),('Marion', 'IN', true),('Marshall', 'IN', true),
('Martin', 'IN', true),('Miami', 'IN', true),('Monroe', 'IN', true),('Montgomery', 'IN', true),('Morgan', 'IN', true),
('Newton', 'IN', true),('Noble', 'IN', true),('Ohio', 'IN', true),('Orange', 'IN', true),('Owen', 'IN', true),
('Parke', 'IN', true),('Perry', 'IN', true),('Pike', 'IN', true),('Porter', 'IN', true),('Posey', 'IN', true),
('Pulaski', 'IN', true),('Putnam', 'IN', true),('Randolph', 'IN', true),('Ripley', 'IN', true),('Rush', 'IN', true),
('Scott', 'IN', true),('Shelby', 'IN', true),('Spencer', 'IN', true),('St. Joseph', 'IN', true),('Starke', 'IN', true),
('Steuben', 'IN', true),('Sullivan', 'IN', true),('Switzerland', 'IN', true),('Tippecanoe', 'IN', true),('Tipton', 'IN', true),
('Union', 'IN', true),('Vanderburgh', 'IN', true),('Vermillion', 'IN', true),('Vigo', 'IN', true),('Wabash', 'IN', true),
('Warren', 'IN', true),('Warrick', 'IN', true),('Washington', 'IN', true),('Wayne', 'IN', true),('Wells', 'IN', true),
('White', 'IN', true),('Whitley', 'IN', true),
-- Iowa (99 counties)
('Adair', 'IA', true),('Adams', 'IA', true),('Allamakee', 'IA', true),('Appanoose', 'IA', true),('Audubon', 'IA', true),
('Benton', 'IA', true),('Black Hawk', 'IA', true),('Boone', 'IA', true),('Bremer', 'IA', true),('Buchanan', 'IA', true),
('Buena Vista', 'IA', true),('Butler', 'IA', true),('Calhoun', 'IA', true),('Carroll', 'IA', true),('Cass', 'IA', true),
('Cedar', 'IA', true),('Cerro Gordo', 'IA', true),('Cherokee', 'IA', true),('Chickasaw', 'IA', true),('Clarke', 'IA', true),
('Clay', 'IA', true),('Clayton', 'IA', true),('Clinton', 'IA', true),('Crawford', 'IA', true),('Dallas', 'IA', true),
('Davis', 'IA', true),('Decatur', 'IA', true),('Delaware', 'IA', true),('Des Moines', 'IA', true),('Dickinson', 'IA', true),
('Dubuque', 'IA', true),('Emmet', 'IA', true),('Fayette', 'IA', true),('Floyd', 'IA', true),('Franklin', 'IA', true),
('Fremont', 'IA', true),('Greene', 'IA', true),('Grundy', 'IA', true),('Guthrie', 'IA', true),('Hamilton', 'IA', true),
('Hancock', 'IA', true),('Hardin', 'IA', true),('Harrison', 'IA', true),('Henry', 'IA', true),('Howard', 'IA', true),
('Humboldt', 'IA', true),('Ida', 'IA', true),('Iowa', 'IA', true),('Jackson', 'IA', true),('Jasper', 'IA', true),
('Jefferson', 'IA', true),('Johnson', 'IA', true),('Jones', 'IA', true),('Keokuk', 'IA', true),('Kossuth', 'IA', true),
('Lee', 'IA', true),('Linn', 'IA', true),('Louisa', 'IA', true),('Lucas', 'IA', true),('Lyon', 'IA', true),
('Madison', 'IA', true),('Mahaska', 'IA', true),('Marion', 'IA', true),('Marshall', 'IA', true),('Mills', 'IA', true),
('Mitchell', 'IA', true),('Monona', 'IA', true),('Monroe', 'IA', true),('Montgomery', 'IA', true),('Muscatine', 'IA', true),
('O''Brien', 'IA', true),('Osceola', 'IA', true),('Page', 'IA', true),('Palo Alto', 'IA', true),('Plymouth', 'IA', true),
('Pocahontas', 'IA', true),('Polk', 'IA', true),('Pottawattamie', 'IA', true),('Poweshiek', 'IA', true),('Ringgold', 'IA', true),
('Sac', 'IA', true),('Scott', 'IA', true),('Shelby', 'IA', true),('Sioux', 'IA', true),('Story', 'IA', true),
('Tama', 'IA', true),('Taylor', 'IA', true),('Union', 'IA', true),('Van Buren', 'IA', true),('Wapello', 'IA', true),
('Warren', 'IA', true),('Washington', 'IA', true),('Wayne', 'IA', true),('Webster', 'IA', true),('Winnebago', 'IA', true),
('Winneshiek', 'IA', true),('Woodbury', 'IA', true),('Worth', 'IA', true),('Wright', 'IA', true),
-- Kansas (105 counties)
('Allen', 'KS', true),('Anderson', 'KS', true),('Atchison', 'KS', true),('Barber', 'KS', true),('Barton', 'KS', true),
('Bourbon', 'KS', true),('Brown', 'KS', true),('Butler', 'KS', true),('Chase', 'KS', true),('Chautauqua', 'KS', true),
('Cherokee', 'KS', true),('Cheyenne', 'KS', true),('Clark', 'KS', true),('Clay', 'KS', true),('Cloud', 'KS', true),
('Coffey', 'KS', true),('Comanche', 'KS', true),('Cowley', 'KS', true),('Crawford', 'KS', true),('Decatur', 'KS', true),
('Dickinson', 'KS', true),('Doniphan', 'KS', true),('Douglas', 'KS', true),('Edwards', 'KS', true),('Elk', 'KS', true),
('Ellis', 'KS', true),('Ellsworth', 'KS', true),('Finney', 'KS', true),('Ford', 'KS', true),('Franklin', 'KS', true),
('Geary', 'KS', true),('Gove', 'KS', true),('Graham', 'KS', true),('Grant', 'KS', true),('Gray', 'KS', true),
('Greeley', 'KS', true),('Greenwood', 'KS', true),('Hamilton', 'KS', true),('Harper', 'KS', true),('Harvey', 'KS', true),
('Haskell', 'KS', true),('Hodgeman', 'KS', true),('Jackson', 'KS', true),('Jefferson', 'KS', true),('Jewell', 'KS', true),
('Johnson', 'KS', true),('Kearny', 'KS', true),('Kingman', 'KS', true),('Kiowa', 'KS', true),('Labette', 'KS', true),
('Lane', 'KS', true),('Leavenworth', 'KS', true),('Lincoln', 'KS', true),('Linn', 'KS', true),('Logan', 'KS', true),
('Lyon', 'KS', true),('Marion', 'KS', true),('Marshall', 'KS', true),('McPherson', 'KS', true),('Meade', 'KS', true),
('Miami', 'KS', true),('Mitchell', 'KS', true),('Montgomery', 'KS', true),('Morris', 'KS', true),('Morton', 'KS', true),
('Nemaha', 'KS', true),('Neosho', 'KS', true),('Ness', 'KS', true),('Norton', 'KS', true),('Osage', 'KS', true),
('Osborne', 'KS', true),('Ottawa', 'KS', true),('Pawnee', 'KS', true),('Phillips', 'KS', true),('Pottawatomie', 'KS', true),
('Pratt', 'KS', true),('Rawlins', 'KS', true),('Reno', 'KS', true),('Republic', 'KS', true),('Rice', 'KS', true),
('Riley', 'KS', true),('Rooks', 'KS', true),('Rush', 'KS', true),('Russell', 'KS', true),('Saline', 'KS', true),
('Scott', 'KS', true),('Sedgwick', 'KS', true),('Seward', 'KS', true),('Shawnee', 'KS', true),('Sheridan', 'KS', true),
('Sherman', 'KS', true),('Smith', 'KS', true),('Stafford', 'KS', true),('Stanton', 'KS', true),('Stevens', 'KS', true),
('Sumner', 'KS', true),('Thomas', 'KS', true),('Trego', 'KS', true),('Wabaunsee', 'KS', true),('Wallace', 'KS', true),
('Washington', 'KS', true),('Wichita', 'KS', true),('Wilson', 'KS', true),('Woodson', 'KS', true),('Wyandotte', 'KS', true),
-- Louisiana (64 parishes)
('Acadia', 'LA', true),('Allen', 'LA', true),('Ascension', 'LA', true),('Assumption', 'LA', true),('Avoyelles', 'LA', true),
('Beauregard', 'LA', true),('Bienville', 'LA', true),('Bossier', 'LA', true),('Caddo', 'LA', true),('Calcasieu', 'LA', true),
('Caldwell', 'LA', true),('Cameron', 'LA', true),('Catahoula', 'LA', true),('Claiborne', 'LA', true),('Concordia', 'LA', true),
('De Soto', 'LA', true),('East Baton Rouge', 'LA', true),('East Carroll', 'LA', true),('East Feliciana', 'LA', true),('Evangeline', 'LA', true),
('Franklin', 'LA', true),('Grant', 'LA', true),('Iberia', 'LA', true),('Iberville', 'LA', true),('Jackson', 'LA', true),
('Jefferson', 'LA', true),('Jefferson Davis', 'LA', true),('La Salle', 'LA', true),('Lafayette', 'LA', true),('Lafourche', 'LA', true),
('Lincoln', 'LA', true),('Livingston', 'LA', true),('Madison', 'LA', true),('Morehouse', 'LA', true),('Natchitoches', 'LA', true),
('Orleans', 'LA', true),('Ouachita', 'LA', true),('Plaquemines', 'LA', true),('Pointe Coupee', 'LA', true),('Rapides', 'LA', true),
('Red River', 'LA', true),('Richland', 'LA', true),('Sabine', 'LA', true),('St. Bernard', 'LA', true),('St. Charles', 'LA', true),
('St. Helena', 'LA', true),('St. James', 'LA', true),('St. John the Baptist', 'LA', true),('St. Landry', 'LA', true),('St. Martin', 'LA', true),
('St. Mary', 'LA', true),('St. Tammany', 'LA', true),('Tangipahoa', 'LA', true),('Tensas', 'LA', true),('Terrebonne', 'LA', true),
('Union', 'LA', true),('Vermilion', 'LA', true),('Vernon', 'LA', true),('Washington', 'LA', true),('Webster', 'LA', true),
('West Baton Rouge', 'LA', true),('West Carroll', 'LA', true),('West Feliciana', 'LA', true),('Winn', 'LA', true),
-- Maine (16 counties)
('Androscoggin', 'ME', true),('Aroostook', 'ME', true),('Cumberland', 'ME', true),('Franklin', 'ME', true),
('Hancock', 'ME', true),('Kennebec', 'ME', true),('Knox', 'ME', true),('Lincoln', 'ME', true),
('Oxford', 'ME', true),('Penobscot', 'ME', true),('Piscataquis', 'ME', true),('Sagadahoc', 'ME', true),
('Somerset', 'ME', true),('Waldo', 'ME', true),('Washington', 'ME', true),('York', 'ME', true),
-- Maryland (24 counties)
('Allegany', 'MD', true),('Anne Arundel', 'MD', true),('Baltimore', 'MD', true),('Baltimore City', 'MD', true),
('Calvert', 'MD', true),('Caroline', 'MD', true),('Carroll', 'MD', true),('Cecil', 'MD', true),
('Charles', 'MD', true),('Dorchester', 'MD', true),('Frederick', 'MD', true),('Garrett', 'MD', true),
('Harford', 'MD', true),('Howard', 'MD', true),('Kent', 'MD', true),('Montgomery', 'MD', true),
('Prince George''s', 'MD', true),('Queen Anne''s', 'MD', true),('Somerset', 'MD', true),('St. Mary''s', 'MD', true),
('Talbot', 'MD', true),('Washington', 'MD', true),('Wicomico', 'MD', true),('Worcester', 'MD', true),
-- Massachusetts (14 counties)
('Barnstable', 'MA', true),('Berkshire', 'MA', true),('Bristol', 'MA', true),('Dukes', 'MA', true),
('Essex', 'MA', true),('Franklin', 'MA', true),('Hampden', 'MA', true),('Hampshire', 'MA', true),
('Middlesex', 'MA', true),('Nantucket', 'MA', true),('Norfolk', 'MA', true),('Plymouth', 'MA', true),
('Suffolk', 'MA', true),('Worcester', 'MA', true)
ON CONFLICT DO NOTHING;

/*
  # Insert Counties - Batch 3 (Michigan through New York)

  1. Data
    - Michigan (83 counties)
    - Mississippi (82 counties)
    - Missouri (115 counties)
    - Montana (56 counties)
    - Nebraska (93 counties)
    - Nevada (17 counties)
    - New Hampshire (10 counties)
    - New Jersey (21 counties)
    - New Mexico (33 counties)
    - New York (62 counties)
*/

INSERT INTO counties (name, state_code, is_active) VALUES
-- Michigan (83 counties)
('Alcona', 'MI', true),('Alger', 'MI', true),('Allegan', 'MI', true),('Alpena', 'MI', true),('Antrim', 'MI', true),
('Arenac', 'MI', true),('Baraga', 'MI', true),('Barry', 'MI', true),('Bay', 'MI', true),('Benzie', 'MI', true),
('Berrien', 'MI', true),('Branch', 'MI', true),('Calhoun', 'MI', true),('Cass', 'MI', true),('Charlevoix', 'MI', true),
('Cheboygan', 'MI', true),('Chippewa', 'MI', true),('Clare', 'MI', true),('Clinton', 'MI', true),('Crawford', 'MI', true),
('Delta', 'MI', true),('Dickinson', 'MI', true),('Eaton', 'MI', true),('Emmet', 'MI', true),('Genesee', 'MI', true),
('Gladwin', 'MI', true),('Gogebic', 'MI', true),('Grand Traverse', 'MI', true),('Gratiot', 'MI', true),('Hillsdale', 'MI', true),
('Houghton', 'MI', true),('Huron', 'MI', true),('Ingham', 'MI', true),('Ionia', 'MI', true),('Iosco', 'MI', true),
('Iron', 'MI', true),('Isabella', 'MI', true),('Jackson', 'MI', true),('Kalamazoo', 'MI', true),('Kalkaska', 'MI', true),
('Kent', 'MI', true),('Keweenaw', 'MI', true),('Lake', 'MI', true),('Lapeer', 'MI', true),('Leelanau', 'MI', true),
('Lenawee', 'MI', true),('Livingston', 'MI', true),('Luce', 'MI', true),('Mackinac', 'MI', true),('Macomb', 'MI', true),
('Manistee', 'MI', true),('Marquette', 'MI', true),('Mason', 'MI', true),('Mecosta', 'MI', true),('Menominee', 'MI', true),
('Midland', 'MI', true),('Missaukee', 'MI', true),('Monroe', 'MI', true),('Montcalm', 'MI', true),('Montmorency', 'MI', true),
('Muskegon', 'MI', true),('Newaygo', 'MI', true),('Oakland', 'MI', true),('Oceana', 'MI', true),('Ogemaw', 'MI', true),
('Ontonagon', 'MI', true),('Osceola', 'MI', true),('Oscoda', 'MI', true),('Otsego', 'MI', true),('Ottawa', 'MI', true),
('Presque Isle', 'MI', true),('Roscommon', 'MI', true),('Saginaw', 'MI', true),('Sanilac', 'MI', true),('Schoolcraft', 'MI', true),
('Shiawassee', 'MI', true),('St. Clair', 'MI', true),('St. Joseph', 'MI', true),('Tuscola', 'MI', true),('Van Buren', 'MI', true),
('Washtenaw', 'MI', true),('Wayne', 'MI', true),('Wexford', 'MI', true),
-- Mississippi (82 counties)
('Adams', 'MS', true),('Alcorn', 'MS', true),('Amite', 'MS', true),('Attala', 'MS', true),('Benton', 'MS', true),
('Bolivar', 'MS', true),('Calhoun', 'MS', true),('Carroll', 'MS', true),('Chickasaw', 'MS', true),('Choctaw', 'MS', true),
('Claiborne', 'MS', true),('Clarke', 'MS', true),('Clay', 'MS', true),('Coahoma', 'MS', true),('Copiah', 'MS', true),
('Covington', 'MS', true),('DeSoto', 'MS', true),('Forrest', 'MS', true),('Franklin', 'MS', true),('George', 'MS', true),
('Greene', 'MS', true),('Grenada', 'MS', true),('Hancock', 'MS', true),('Harrison', 'MS', true),('Hinds', 'MS', true),
('Holmes', 'MS', true),('Humphreys', 'MS', true),('Issaquena', 'MS', true),('Itawamba', 'MS', true),('Jackson', 'MS', true),
('Jasper', 'MS', true),('Jefferson', 'MS', true),('Jefferson Davis', 'MS', true),('Jones', 'MS', true),('Kemper', 'MS', true),
('Lafayette', 'MS', true),('Lamar', 'MS', true),('Lauderdale', 'MS', true),('Lawrence', 'MS', true),('Leake', 'MS', true),
('Lee', 'MS', true),('Leflore', 'MS', true),('Lincoln', 'MS', true),('Lowndes', 'MS', true),('Madison', 'MS', true),
('Marion', 'MS', true),('Marshall', 'MS', true),('Monroe', 'MS', true),('Montgomery', 'MS', true),('Neshoba', 'MS', true),
('Newton', 'MS', true),('Noxubee', 'MS', true),('Oktibbeha', 'MS', true),('Panola', 'MS', true),('Pearl River', 'MS', true),
('Perry', 'MS', true),('Pike', 'MS', true),('Pontotoc', 'MS', true),('Prentiss', 'MS', true),('Quitman', 'MS', true),
('Rankin', 'MS', true),('Scott', 'MS', true),('Sharkey', 'MS', true),('Simpson', 'MS', true),('Smith', 'MS', true),
('Stone', 'MS', true),('Sunflower', 'MS', true),('Tallahatchie', 'MS', true),('Tate', 'MS', true),('Tippah', 'MS', true),
('Tishomingo', 'MS', true),('Tunica', 'MS', true),('Union', 'MS', true),('Walthall', 'MS', true),('Warren', 'MS', true),
('Washington', 'MS', true),('Wayne', 'MS', true),('Webster', 'MS', true),('Wilkinson', 'MS', true),('Winston', 'MS', true),
('Yalobusha', 'MS', true),('Yazoo', 'MS', true),
-- Missouri (115 counties)
('Adair', 'MO', true),('Andrew', 'MO', true),('Atchison', 'MO', true),('Audrain', 'MO', true),('Barry', 'MO', true),
('Barton', 'MO', true),('Bates', 'MO', true),('Benton', 'MO', true),('Bollinger', 'MO', true),('Boone', 'MO', true),
('Buchanan', 'MO', true),('Butler', 'MO', true),('Caldwell', 'MO', true),('Callaway', 'MO', true),('Camden', 'MO', true),
('Cape Girardeau', 'MO', true),('Carroll', 'MO', true),('Carter', 'MO', true),('Cass', 'MO', true),('Cedar', 'MO', true),
('Chariton', 'MO', true),('Christian', 'MO', true),('Clark', 'MO', true),('Clay', 'MO', true),('Clinton', 'MO', true),
('Cole', 'MO', true),('Cooper', 'MO', true),('Crawford', 'MO', true),('Dade', 'MO', true),('Dallas', 'MO', true),
('Daviess', 'MO', true),('DeKalb', 'MO', true),('Dent', 'MO', true),('Douglas', 'MO', true),('Dunklin', 'MO', true),
('Franklin', 'MO', true),('Gasconade', 'MO', true),('Gentry', 'MO', true),('Greene', 'MO', true),('Grundy', 'MO', true),
('Harrison', 'MO', true),('Henry', 'MO', true),('Hickory', 'MO', true),('Holt', 'MO', true),('Howard', 'MO', true),
('Howell', 'MO', true),('Iron', 'MO', true),('Jackson', 'MO', true),('Jasper', 'MO', true),('Jefferson', 'MO', true),
('Johnson', 'MO', true),('Knox', 'MO', true),('Laclede', 'MO', true),('Lafayette', 'MO', true),('Lawrence', 'MO', true),
('Lewis', 'MO', true),('Lincoln', 'MO', true),('Linn', 'MO', true),('Livingston', 'MO', true),('Macon', 'MO', true),
('Madison', 'MO', true),('Maries', 'MO', true),('Marion', 'MO', true),('McDonald', 'MO', true),('Mercer', 'MO', true),
('Miller', 'MO', true),('Mississippi', 'MO', true),('Moniteau', 'MO', true),('Monroe', 'MO', true),('Montgomery', 'MO', true),
('Morgan', 'MO', true),('New Madrid', 'MO', true),('Newton', 'MO', true),('Nodaway', 'MO', true),('Oregon', 'MO', true),
('Osage', 'MO', true),('Ozark', 'MO', true),('Pemiscot', 'MO', true),('Perry', 'MO', true),('Pettis', 'MO', true),
('Phelps', 'MO', true),('Pike', 'MO', true),('Platte', 'MO', true),('Polk', 'MO', true),('Pulaski', 'MO', true),
('Putnam', 'MO', true),('Ralls', 'MO', true),('Randolph', 'MO', true),('Ray', 'MO', true),('Reynolds', 'MO', true),
('Ripley', 'MO', true),('Saline', 'MO', true),('Schuyler', 'MO', true),('Scotland', 'MO', true),('Scott', 'MO', true),
('Shannon', 'MO', true),('Shelby', 'MO', true),('St. Charles', 'MO', true),('St. Clair', 'MO', true),('St. Francois', 'MO', true),
('St. Louis', 'MO', true),('St. Louis City', 'MO', true),('Ste. Genevieve', 'MO', true),('Stoddard', 'MO', true),('Stone', 'MO', true),
('Sullivan', 'MO', true),('Taney', 'MO', true),('Texas', 'MO', true),('Vernon', 'MO', true),('Warren', 'MO', true),
('Washington', 'MO', true),('Wayne', 'MO', true),('Webster', 'MO', true),('Worth', 'MO', true),('Wright', 'MO', true),
-- Montana (56 counties)
('Beaverhead', 'MT', true),('Big Horn', 'MT', true),('Blaine', 'MT', true),('Broadwater', 'MT', true),('Carbon', 'MT', true),
('Carter', 'MT', true),('Cascade', 'MT', true),('Chouteau', 'MT', true),('Custer', 'MT', true),('Daniels', 'MT', true),
('Dawson', 'MT', true),('Deer Lodge', 'MT', true),('Fallon', 'MT', true),('Fergus', 'MT', true),('Flathead', 'MT', true),
('Gallatin', 'MT', true),('Garfield', 'MT', true),('Glacier', 'MT', true),('Golden Valley', 'MT', true),('Granite', 'MT', true),
('Hill', 'MT', true),('Jefferson', 'MT', true),('Judith Basin', 'MT', true),('Lake', 'MT', true),('Lewis and Clark', 'MT', true),
('Liberty', 'MT', true),('Lincoln', 'MT', true),('Madison', 'MT', true),('McCone', 'MT', true),('Meagher', 'MT', true),
('Mineral', 'MT', true),('Missoula', 'MT', true),('Musselshell', 'MT', true),('Park', 'MT', true),('Petroleum', 'MT', true),
('Phillips', 'MT', true),('Pondera', 'MT', true),('Powder River', 'MT', true),('Powell', 'MT', true),('Prairie', 'MT', true),
('Ravalli', 'MT', true),('Richland', 'MT', true),('Roosevelt', 'MT', true),('Rosebud', 'MT', true),('Sanders', 'MT', true),
('Sheridan', 'MT', true),('Silver Bow', 'MT', true),('Stillwater', 'MT', true),('Sweet Grass', 'MT', true),('Teton', 'MT', true),
('Toole', 'MT', true),('Treasure', 'MT', true),('Valley', 'MT', true),('Wheatland', 'MT', true),('Wibaux', 'MT', true),('Yellowstone', 'MT', true),
-- Nebraska (93 counties)
('Adams', 'NE', true),('Antelope', 'NE', true),('Arthur', 'NE', true),('Banner', 'NE', true),('Blaine', 'NE', true),
('Boone', 'NE', true),('Box Butte', 'NE', true),('Boyd', 'NE', true),('Brown', 'NE', true),('Buffalo', 'NE', true),
('Burt', 'NE', true),('Butler', 'NE', true),('Cass', 'NE', true),('Cedar', 'NE', true),('Chase', 'NE', true),
('Cherry', 'NE', true),('Cheyenne', 'NE', true),('Clay', 'NE', true),('Colfax', 'NE', true),('Cuming', 'NE', true),
('Custer', 'NE', true),('Dakota', 'NE', true),('Dawes', 'NE', true),('Dawson', 'NE', true),('Deuel', 'NE', true),
('Dixon', 'NE', true),('Dodge', 'NE', true),('Douglas', 'NE', true),('Dundy', 'NE', true),('Fillmore', 'NE', true),
('Franklin', 'NE', true),('Frontier', 'NE', true),('Furnas', 'NE', true),('Gage', 'NE', true),('Garden', 'NE', true),
('Garfield', 'NE', true),('Gosper', 'NE', true),('Grant', 'NE', true),('Greeley', 'NE', true),('Hall', 'NE', true),
('Hamilton', 'NE', true),('Harlan', 'NE', true),('Hayes', 'NE', true),('Hitchcock', 'NE', true),('Holt', 'NE', true),
('Hooker', 'NE', true),('Howard', 'NE', true),('Jefferson', 'NE', true),('Johnson', 'NE', true),('Kearney', 'NE', true),
('Keith', 'NE', true),('Keya Paha', 'NE', true),('Kimball', 'NE', true),('Knox', 'NE', true),('Lancaster', 'NE', true),
('Lincoln', 'NE', true),('Logan', 'NE', true),('Loup', 'NE', true),('Madison', 'NE', true),('McPherson', 'NE', true),
('Merrick', 'NE', true),('Morrill', 'NE', true),('Nance', 'NE', true),('Nemaha', 'NE', true),('Nuckolls', 'NE', true),
('Otoe', 'NE', true),('Pawnee', 'NE', true),('Perkins', 'NE', true),('Phelps', 'NE', true),('Pierce', 'NE', true),
('Platte', 'NE', true),('Polk', 'NE', true),('Red Willow', 'NE', true),('Richardson', 'NE', true),('Rock', 'NE', true),
('Saline', 'NE', true),('Sarpy', 'NE', true),('Saunders', 'NE', true),('Scotts Bluff', 'NE', true),('Seward', 'NE', true),
('Sheridan', 'NE', true),('Sherman', 'NE', true),('Sioux', 'NE', true),('Stanton', 'NE', true),('Thayer', 'NE', true),
('Thomas', 'NE', true),('Thurston', 'NE', true),('Valley', 'NE', true),('Washington', 'NE', true),('Wayne', 'NE', true),
('Webster', 'NE', true),('Wheeler', 'NE', true),('York', 'NE', true),
-- Nevada (17 counties)
('Carson City', 'NV', true),('Churchill', 'NV', true),('Clark', 'NV', true),('Douglas', 'NV', true),('Elko', 'NV', true),
('Esmeralda', 'NV', true),('Eureka', 'NV', true),('Humboldt', 'NV', true),('Lander', 'NV', true),('Lincoln', 'NV', true),
('Lyon', 'NV', true),('Mineral', 'NV', true),('Nye', 'NV', true),('Pershing', 'NV', true),('Storey', 'NV', true),
('Washoe', 'NV', true),('White Pine', 'NV', true),
-- New Hampshire (10 counties)
('Belknap', 'NH', true),('Carroll', 'NH', true),('Cheshire', 'NH', true),('Coos', 'NH', true),('Grafton', 'NH', true),
('Hillsborough', 'NH', true),('Merrimack', 'NH', true),('Rockingham', 'NH', true),('Strafford', 'NH', true),('Sullivan', 'NH', true),
-- New Jersey (21 counties)
('Atlantic', 'NJ', true),('Bergen', 'NJ', true),('Burlington', 'NJ', true),('Camden', 'NJ', true),('Cape May', 'NJ', true),
('Cumberland', 'NJ', true),('Essex', 'NJ', true),('Gloucester', 'NJ', true),('Hudson', 'NJ', true),('Hunterdon', 'NJ', true),
('Mercer', 'NJ', true),('Middlesex', 'NJ', true),('Monmouth', 'NJ', true),('Morris', 'NJ', true),('Ocean', 'NJ', true),
('Passaic', 'NJ', true),('Salem', 'NJ', true),('Somerset', 'NJ', true),('Sussex', 'NJ', true),('Union', 'NJ', true),('Warren', 'NJ', true),
-- New Mexico (33 counties)
('Bernalillo', 'NM', true),('Catron', 'NM', true),('Chaves', 'NM', true),('Cibola', 'NM', true),('Colfax', 'NM', true),
('Curry', 'NM', true),('De Baca', 'NM', true),('Dona Ana', 'NM', true),('Eddy', 'NM', true),('Grant', 'NM', true),
('Guadalupe', 'NM', true),('Harding', 'NM', true),('Hidalgo', 'NM', true),('Lea', 'NM', true),('Lincoln', 'NM', true),
('Los Alamos', 'NM', true),('Luna', 'NM', true),('McKinley', 'NM', true),('Mora', 'NM', true),('Otero', 'NM', true),
('Quay', 'NM', true),('Rio Arriba', 'NM', true),('Roosevelt', 'NM', true),('San Juan', 'NM', true),('San Miguel', 'NM', true),
('Sandoval', 'NM', true),('Santa Fe', 'NM', true),('Sierra', 'NM', true),('Socorro', 'NM', true),('Taos', 'NM', true),
('Torrance', 'NM', true),('Union', 'NM', true),('Valencia', 'NM', true),
-- New York (62 counties)
('Albany', 'NY', true),('Allegany', 'NY', true),('Bronx', 'NY', true),('Broome', 'NY', true),('Cattaraugus', 'NY', true),
('Cayuga', 'NY', true),('Chautauqua', 'NY', true),('Chemung', 'NY', true),('Chenango', 'NY', true),('Clinton', 'NY', true),
('Columbia', 'NY', true),('Cortland', 'NY', true),('Delaware', 'NY', true),('Dutchess', 'NY', true),('Erie', 'NY', true),
('Essex', 'NY', true),('Franklin', 'NY', true),('Fulton', 'NY', true),('Genesee', 'NY', true),('Greene', 'NY', true),
('Hamilton', 'NY', true),('Herkimer', 'NY', true),('Jefferson', 'NY', true),('Kings', 'NY', true),('Lewis', 'NY', true),
('Livingston', 'NY', true),('Madison', 'NY', true),('Monroe', 'NY', true),('Montgomery', 'NY', true),('Nassau', 'NY', true),
('New York', 'NY', true),('Niagara', 'NY', true),('Oneida', 'NY', true),('Onondaga', 'NY', true),('Ontario', 'NY', true),
('Orange', 'NY', true),('Orleans', 'NY', true),('Oswego', 'NY', true),('Otsego', 'NY', true),('Putnam', 'NY', true),
('Queens', 'NY', true),('Rensselaer', 'NY', true),('Richmond', 'NY', true),('Rockland', 'NY', true),('Saratoga', 'NY', true),
('Schenectady', 'NY', true),('Schoharie', 'NY', true),('Schuyler', 'NY', true),('Seneca', 'NY', true),('St. Lawrence', 'NY', true),
('Steuben', 'NY', true),('Suffolk', 'NY', true),('Sullivan', 'NY', true),('Tioga', 'NY', true),('Tompkins', 'NY', true),
('Ulster', 'NY', true),('Warren', 'NY', true),('Washington', 'NY', true),('Wayne', 'NY', true),('Westchester', 'NY', true),
('Wyoming', 'NY', true),('Yates', 'NY', true)
ON CONFLICT DO NOTHING;

/*
  # Insert Counties - Batch 4 (North Carolina through Wyoming)

  1. Data
    - North Carolina (100 counties)
    - North Dakota (53 counties)
    - Ohio (88 counties)
    - Oklahoma (77 counties)
    - Oregon (36 counties)
    - Pennsylvania (67 counties)
    - Rhode Island (5 counties)
    - South Carolina (46 counties)
    - South Dakota (66 counties)
    - Texas (254 counties)
    - Utah (29 counties)
    - Vermont (14 counties)
    - Virginia (134 counties/cities)
    - Washington (39 counties)
    - West Virginia (55 counties)
    - Wyoming (23 counties)
*/

INSERT INTO counties (name, state_code, is_active) VALUES
-- North Carolina (100 counties)
('Alamance', 'NC', true),('Alexander', 'NC', true),('Alleghany', 'NC', true),('Anson', 'NC', true),('Ashe', 'NC', true),
('Avery', 'NC', true),('Beaufort', 'NC', true),('Bertie', 'NC', true),('Bladen', 'NC', true),('Brunswick', 'NC', true),
('Buncombe', 'NC', true),('Burke', 'NC', true),('Cabarrus', 'NC', true),('Caldwell', 'NC', true),('Camden', 'NC', true),
('Carteret', 'NC', true),('Caswell', 'NC', true),('Catawba', 'NC', true),('Chatham', 'NC', true),('Cherokee', 'NC', true),
('Chowan', 'NC', true),('Clay', 'NC', true),('Cleveland', 'NC', true),('Columbus', 'NC', true),('Craven', 'NC', true),
('Cumberland', 'NC', true),('Currituck', 'NC', true),('Dare', 'NC', true),('Davidson', 'NC', true),('Davie', 'NC', true),
('Duplin', 'NC', true),('Durham', 'NC', true),('Edgecombe', 'NC', true),('Forsyth', 'NC', true),('Franklin', 'NC', true),
('Gaston', 'NC', true),('Gates', 'NC', true),('Graham', 'NC', true),('Granville', 'NC', true),('Greene', 'NC', true),
('Guilford', 'NC', true),('Halifax', 'NC', true),('Harnett', 'NC', true),('Haywood', 'NC', true),('Henderson', 'NC', true),
('Hertford', 'NC', true),('Hoke', 'NC', true),('Hyde', 'NC', true),('Iredell', 'NC', true),('Jackson', 'NC', true),
('Johnston', 'NC', true),('Jones', 'NC', true),('Lee', 'NC', true),('Lenoir', 'NC', true),('Lincoln', 'NC', true),
('Macon', 'NC', true),('Madison', 'NC', true),('Martin', 'NC', true),('McDowell', 'NC', true),('Mecklenburg', 'NC', true),
('Mitchell', 'NC', true),('Montgomery', 'NC', true),('Moore', 'NC', true),('Nash', 'NC', true),('New Hanover', 'NC', true),
('Northampton', 'NC', true),('Onslow', 'NC', true),('Orange', 'NC', true),('Pamlico', 'NC', true),('Pasquotank', 'NC', true),
('Pender', 'NC', true),('Perquimans', 'NC', true),('Person', 'NC', true),('Pitt', 'NC', true),('Polk', 'NC', true),
('Randolph', 'NC', true),('Richmond', 'NC', true),('Robeson', 'NC', true),('Rockingham', 'NC', true),('Rowan', 'NC', true),
('Rutherford', 'NC', true),('Sampson', 'NC', true),('Scotland', 'NC', true),('Stanly', 'NC', true),('Stokes', 'NC', true),
('Surry', 'NC', true),('Swain', 'NC', true),('Transylvania', 'NC', true),('Tyrrell', 'NC', true),('Union', 'NC', true),
('Vance', 'NC', true),('Wake', 'NC', true),('Warren', 'NC', true),('Washington', 'NC', true),('Watauga', 'NC', true),
('Wayne', 'NC', true),('Wilkes', 'NC', true),('Wilson', 'NC', true),('Yadkin', 'NC', true),('Yancey', 'NC', true),
-- North Dakota (53 counties)
('Adams', 'ND', true),('Barnes', 'ND', true),('Benson', 'ND', true),('Billings', 'ND', true),('Bottineau', 'ND', true),
('Bowman', 'ND', true),('Burke', 'ND', true),('Burleigh', 'ND', true),('Cass', 'ND', true),('Cavalier', 'ND', true),
('Dickey', 'ND', true),('Divide', 'ND', true),('Dunn', 'ND', true),('Eddy', 'ND', true),('Emmons', 'ND', true),
('Foster', 'ND', true),('Golden Valley', 'ND', true),('Grand Forks', 'ND', true),('Grant', 'ND', true),('Griggs', 'ND', true),
('Hettinger', 'ND', true),('Kidder', 'ND', true),('LaMoure', 'ND', true),('Logan', 'ND', true),('McHenry', 'ND', true),
('McIntosh', 'ND', true),('McKenzie', 'ND', true),('McLean', 'ND', true),('Mercer', 'ND', true),('Morton', 'ND', true),
('Mountrail', 'ND', true),('Nelson', 'ND', true),('Oliver', 'ND', true),('Pembina', 'ND', true),('Pierce', 'ND', true),
('Ramsey', 'ND', true),('Ransom', 'ND', true),('Renville', 'ND', true),('Richland', 'ND', true),('Rolette', 'ND', true),
('Sargent', 'ND', true),('Sheridan', 'ND', true),('Sioux', 'ND', true),('Slope', 'ND', true),('Stark', 'ND', true),
('Steele', 'ND', true),('Stutsman', 'ND', true),('Towner', 'ND', true),('Traill', 'ND', true),('Walsh', 'ND', true),
('Ward', 'ND', true),('Wells', 'ND', true),('Williams', 'ND', true),
-- Ohio (88 counties)
('Adams', 'OH', true),('Allen', 'OH', true),('Ashland', 'OH', true),('Ashtabula', 'OH', true),('Athens', 'OH', true),
('Auglaize', 'OH', true),('Belmont', 'OH', true),('Brown', 'OH', true),('Butler', 'OH', true),('Carroll', 'OH', true),
('Champaign', 'OH', true),('Clark', 'OH', true),('Clermont', 'OH', true),('Clinton', 'OH', true),('Columbiana', 'OH', true),
('Coshocton', 'OH', true),('Crawford', 'OH', true),('Cuyahoga', 'OH', true),('Darke', 'OH', true),('Defiance', 'OH', true),
('Delaware', 'OH', true),('Erie', 'OH', true),('Fairfield', 'OH', true),('Fayette', 'OH', true),('Franklin', 'OH', true),
('Fulton', 'OH', true),('Gallia', 'OH', true),('Geauga', 'OH', true),('Greene', 'OH', true),('Guernsey', 'OH', true),
('Hamilton', 'OH', true),('Hancock', 'OH', true),('Hardin', 'OH', true),('Harrison', 'OH', true),('Henry', 'OH', true),
('Highland', 'OH', true),('Hocking', 'OH', true),('Holmes', 'OH', true),('Huron', 'OH', true),('Jackson', 'OH', true),
('Jefferson', 'OH', true),('Knox', 'OH', true),('Lake', 'OH', true),('Lawrence', 'OH', true),('Licking', 'OH', true),
('Logan', 'OH', true),('Lorain', 'OH', true),('Lucas', 'OH', true),('Madison', 'OH', true),('Mahoning', 'OH', true),
('Marion', 'OH', true),('Medina', 'OH', true),('Meigs', 'OH', true),('Mercer', 'OH', true),('Miami', 'OH', true),
('Monroe', 'OH', true),('Montgomery', 'OH', true),('Morgan', 'OH', true),('Morrow', 'OH', true),('Muskingum', 'OH', true),
('Noble', 'OH', true),('Ottawa', 'OH', true),('Paulding', 'OH', true),('Perry', 'OH', true),('Pickaway', 'OH', true),
('Pike', 'OH', true),('Portage', 'OH', true),('Preble', 'OH', true),('Putnam', 'OH', true),('Richland', 'OH', true),
('Ross', 'OH', true),('Sandusky', 'OH', true),('Scioto', 'OH', true),('Seneca', 'OH', true),('Shelby', 'OH', true),
('Stark', 'OH', true),('Summit', 'OH', true),('Trumbull', 'OH', true),('Tuscarawas', 'OH', true),('Union', 'OH', true),
('Van Wert', 'OH', true),('Vinton', 'OH', true),('Warren', 'OH', true),('Washington', 'OH', true),('Wayne', 'OH', true),
('Williams', 'OH', true),('Wood', 'OH', true),('Wyandot', 'OH', true),
-- Oklahoma (77 counties)
('Adair', 'OK', true),('Alfalfa', 'OK', true),('Atoka', 'OK', true),('Beaver', 'OK', true),('Beckham', 'OK', true),
('Blaine', 'OK', true),('Bryan', 'OK', true),('Caddo', 'OK', true),('Canadian', 'OK', true),('Carter', 'OK', true),
('Cherokee', 'OK', true),('Choctaw', 'OK', true),('Cimarron', 'OK', true),('Cleveland', 'OK', true),('Coal', 'OK', true),
('Comanche', 'OK', true),('Cotton', 'OK', true),('Craig', 'OK', true),('Creek', 'OK', true),('Custer', 'OK', true),
('Delaware', 'OK', true),('Dewey', 'OK', true),('Ellis', 'OK', true),('Garfield', 'OK', true),('Garvin', 'OK', true),
('Grady', 'OK', true),('Grant', 'OK', true),('Greer', 'OK', true),('Harmon', 'OK', true),('Harper', 'OK', true),
('Haskell', 'OK', true),('Hughes', 'OK', true),('Jackson', 'OK', true),('Jefferson', 'OK', true),('Johnston', 'OK', true),
('Kay', 'OK', true),('Kingfisher', 'OK', true),('Kiowa', 'OK', true),('Latimer', 'OK', true),('Le Flore', 'OK', true),
('Lincoln', 'OK', true),('Logan', 'OK', true),('Love', 'OK', true),('Major', 'OK', true),('Marshall', 'OK', true),
('Mayes', 'OK', true),('McClain', 'OK', true),('McCurtain', 'OK', true),('McIntosh', 'OK', true),('Murray', 'OK', true),
('Muskogee', 'OK', true),('Noble', 'OK', true),('Nowata', 'OK', true),('Okfuskee', 'OK', true),('Oklahoma', 'OK', true),
('Okmulgee', 'OK', true),('Osage', 'OK', true),('Ottawa', 'OK', true),('Pawnee', 'OK', true),('Payne', 'OK', true),
('Pittsburg', 'OK', true),('Pontotoc', 'OK', true),('Pottawatomie', 'OK', true),('Pushmataha', 'OK', true),('Roger Mills', 'OK', true),
('Rogers', 'OK', true),('Seminole', 'OK', true),('Sequoyah', 'OK', true),('Stephens', 'OK', true),('Texas', 'OK', true),
('Tillman', 'OK', true),('Tulsa', 'OK', true),('Wagoner', 'OK', true),('Washington', 'OK', true),('Washita', 'OK', true),
('Woods', 'OK', true),('Woodward', 'OK', true),
-- Oregon (36 counties)
('Baker', 'OR', true),('Benton', 'OR', true),('Clackamas', 'OR', true),('Clatsop', 'OR', true),('Columbia', 'OR', true),
('Coos', 'OR', true),('Crook', 'OR', true),('Curry', 'OR', true),('Deschutes', 'OR', true),('Douglas', 'OR', true),
('Gilliam', 'OR', true),('Grant', 'OR', true),('Harney', 'OR', true),('Hood River', 'OR', true),('Jackson', 'OR', true),
('Jefferson', 'OR', true),('Josephine', 'OR', true),('Klamath', 'OR', true),('Lake', 'OR', true),('Lane', 'OR', true),
('Lincoln', 'OR', true),('Linn', 'OR', true),('Malheur', 'OR', true),('Marion', 'OR', true),('Morrow', 'OR', true),
('Multnomah', 'OR', true),('Polk', 'OR', true),('Sherman', 'OR', true),('Tillamook', 'OR', true),('Umatilla', 'OR', true),
('Union', 'OR', true),('Wallowa', 'OR', true),('Wasco', 'OR', true),('Washington', 'OR', true),('Wheeler', 'OR', true),('Yamhill', 'OR', true),
-- Pennsylvania (67 counties)
('Adams', 'PA', true),('Allegheny', 'PA', true),('Armstrong', 'PA', true),('Beaver', 'PA', true),('Bedford', 'PA', true),
('Berks', 'PA', true),('Blair', 'PA', true),('Bradford', 'PA', true),('Bucks', 'PA', true),('Butler', 'PA', true),
('Cambria', 'PA', true),('Cameron', 'PA', true),('Carbon', 'PA', true),('Centre', 'PA', true),('Chester', 'PA', true),
('Clarion', 'PA', true),('Clearfield', 'PA', true),('Clinton', 'PA', true),('Columbia', 'PA', true),('Crawford', 'PA', true),
('Cumberland', 'PA', true),('Dauphin', 'PA', true),('Delaware', 'PA', true),('Elk', 'PA', true),('Erie', 'PA', true),
('Fayette', 'PA', true),('Forest', 'PA', true),('Franklin', 'PA', true),('Fulton', 'PA', true),('Greene', 'PA', true),
('Huntingdon', 'PA', true),('Indiana', 'PA', true),('Jefferson', 'PA', true),('Juniata', 'PA', true),('Lackawanna', 'PA', true),
('Lancaster', 'PA', true),('Lawrence', 'PA', true),('Lebanon', 'PA', true),('Lehigh', 'PA', true),('Luzerne', 'PA', true),
('Lycoming', 'PA', true),('McKean', 'PA', true),('Mercer', 'PA', true),('Mifflin', 'PA', true),('Monroe', 'PA', true),
('Montgomery', 'PA', true),('Montour', 'PA', true),('Northampton', 'PA', true),('Northumberland', 'PA', true),('Perry', 'PA', true),
('Philadelphia', 'PA', true),('Pike', 'PA', true),('Potter', 'PA', true),('Schuylkill', 'PA', true),('Snyder', 'PA', true),
('Somerset', 'PA', true),('Sullivan', 'PA', true),('Susquehanna', 'PA', true),('Tioga', 'PA', true),('Union', 'PA', true),
('Venango', 'PA', true),('Warren', 'PA', true),('Washington', 'PA', true),('Wayne', 'PA', true),('Westmoreland', 'PA', true),
('Wyoming', 'PA', true),('York', 'PA', true),
-- Rhode Island (5 counties)
('Bristol', 'RI', true),('Kent', 'RI', true),('Newport', 'RI', true),('Providence', 'RI', true),('Washington', 'RI', true),
-- South Carolina (46 counties)
('Abbeville', 'SC', true),('Aiken', 'SC', true),('Allendale', 'SC', true),('Anderson', 'SC', true),('Bamberg', 'SC', true),
('Barnwell', 'SC', true),('Beaufort', 'SC', true),('Berkeley', 'SC', true),('Calhoun', 'SC', true),('Charleston', 'SC', true),
('Cherokee', 'SC', true),('Chester', 'SC', true),('Chesterfield', 'SC', true),('Clarendon', 'SC', true),('Colleton', 'SC', true),
('Darlington', 'SC', true),('Dillon', 'SC', true),('Dorchester', 'SC', true),('Edgefield', 'SC', true),('Fairfield', 'SC', true),
('Florence', 'SC', true),('Georgetown', 'SC', true),('Greenville', 'SC', true),('Greenwood', 'SC', true),('Hampton', 'SC', true),
('Horry', 'SC', true),('Jasper', 'SC', true),('Kershaw', 'SC', true),('Lancaster', 'SC', true),('Laurens', 'SC', true),
('Lee', 'SC', true),('Lexington', 'SC', true),('Marion', 'SC', true),('Marlboro', 'SC', true),('McCormick', 'SC', true),
('Newberry', 'SC', true),('Oconee', 'SC', true),('Orangeburg', 'SC', true),('Pickens', 'SC', true),('Richland', 'SC', true),
('Saluda', 'SC', true),('Spartanburg', 'SC', true),('Sumter', 'SC', true),('Union', 'SC', true),('Williamsburg', 'SC', true),('York', 'SC', true),
-- South Dakota (66 counties)
('Aurora', 'SD', true),('Beadle', 'SD', true),('Bennett', 'SD', true),('Bon Homme', 'SD', true),('Brookings', 'SD', true),
('Brown', 'SD', true),('Brule', 'SD', true),('Buffalo', 'SD', true),('Butte', 'SD', true),('Campbell', 'SD', true),
('Charles Mix', 'SD', true),('Clark', 'SD', true),('Clay', 'SD', true),('Codington', 'SD', true),('Corson', 'SD', true),
('Custer', 'SD', true),('Davison', 'SD', true),('Day', 'SD', true),('Deuel', 'SD', true),('Dewey', 'SD', true),
('Douglas', 'SD', true),('Edmunds', 'SD', true),('Fall River', 'SD', true),('Faulk', 'SD', true),('Grant', 'SD', true),
('Gregory', 'SD', true),('Haakon', 'SD', true),('Hamlin', 'SD', true),('Hand', 'SD', true),('Hanson', 'SD', true),
('Harding', 'SD', true),('Hughes', 'SD', true),('Hutchinson', 'SD', true),('Hyde', 'SD', true),('Jackson', 'SD', true),
('Jerauld', 'SD', true),('Jones', 'SD', true),('Kingsbury', 'SD', true),('Lake', 'SD', true),('Lawrence', 'SD', true),
('Lincoln', 'SD', true),('Lyman', 'SD', true),('Marshall', 'SD', true),('McCook', 'SD', true),('McPherson', 'SD', true),
('Meade', 'SD', true),('Mellette', 'SD', true),('Miner', 'SD', true),('Minnehaha', 'SD', true),('Moody', 'SD', true),
('Pennington', 'SD', true),('Perkins', 'SD', true),('Potter', 'SD', true),('Roberts', 'SD', true),('Sanborn', 'SD', true),
('Shannon', 'SD', true),('Spink', 'SD', true),('Stanley', 'SD', true),('Sully', 'SD', true),('Todd', 'SD', true),
('Tripp', 'SD', true),('Turner', 'SD', true),('Union', 'SD', true),('Walworth', 'SD', true),('Yankton', 'SD', true),('Ziebach', 'SD', true),
-- Texas (254 counties - major counties)
('Anderson', 'TX', true),('Andrews', 'TX', true),('Angelina', 'TX', true),('Aransas', 'TX', true),('Archer', 'TX', true),
('Armstrong', 'TX', true),('Atascosa', 'TX', true),('Austin', 'TX', true),('Bailey', 'TX', true),('Bandera', 'TX', true),
('Bastrop', 'TX', true),('Baylor', 'TX', true),('Bee', 'TX', true),('Bell', 'TX', true),('Bexar', 'TX', true),
('Blanco', 'TX', true),('Borden', 'TX', true),('Bosque', 'TX', true),('Bowie', 'TX', true),('Brazoria', 'TX', true),
('Brazos', 'TX', true),('Brewster', 'TX', true),('Briscoe', 'TX', true),('Brooks', 'TX', true),('Brown', 'TX', true),
('Burleson', 'TX', true),('Burnet', 'TX', true),('Caldwell', 'TX', true),('Calhoun', 'TX', true),('Callahan', 'TX', true),
('Cameron', 'TX', true),('Camp', 'TX', true),('Carson', 'TX', true),('Cass', 'TX', true),('Castro', 'TX', true),
('Chambers', 'TX', true),('Cherokee', 'TX', true),('Childress', 'TX', true),('Clay', 'TX', true),('Cochran', 'TX', true),
('Coke', 'TX', true),('Coleman', 'TX', true),('Collin', 'TX', true),('Collingsworth', 'TX', true),('Colorado', 'TX', true),
('Comal', 'TX', true),('Comanche', 'TX', true),('Concho', 'TX', true),('Cooke', 'TX', true),('Coryell', 'TX', true),
('Cottle', 'TX', true),('Crane', 'TX', true),('Crockett', 'TX', true),('Crosby', 'TX', true),('Culberson', 'TX', true),
('Dallam', 'TX', true),('Dallas', 'TX', true),('Dawson', 'TX', true),('Deaf Smith', 'TX', true),('Delta', 'TX', true),
('Denton', 'TX', true),('DeWitt', 'TX', true),('Dickens', 'TX', true),('Dimmit', 'TX', true),('Donley', 'TX', true),
('Duval', 'TX', true),('Eastland', 'TX', true),('Ector', 'TX', true),('Edwards', 'TX', true),('El Paso', 'TX', true),
('Ellis', 'TX', true),('Erath', 'TX', true),('Falls', 'TX', true),('Fannin', 'TX', true),('Fayette', 'TX', true),
('Fisher', 'TX', true),('Floyd', 'TX', true),('Foard', 'TX', true),('Fort Bend', 'TX', true),('Franklin', 'TX', true),
('Freestone', 'TX', true),('Frio', 'TX', true),('Gaines', 'TX', true),('Galveston', 'TX', true),('Garza', 'TX', true),
('Gillespie', 'TX', true),('Glasscock', 'TX', true),('Goliad', 'TX', true),('Gonzales', 'TX', true),('Gray', 'TX', true),
('Grayson', 'TX', true),('Gregg', 'TX', true),('Grimes', 'TX', true),('Guadalupe', 'TX', true),('Hale', 'TX', true),
('Hall', 'TX', true),('Hamilton', 'TX', true),('Hansford', 'TX', true),('Hardeman', 'TX', true),('Hardin', 'TX', true),
('Harris', 'TX', true),('Harrison', 'TX', true),('Hartley', 'TX', true),('Haskell', 'TX', true),('Hays', 'TX', true),
('Hemphill', 'TX', true),('Henderson', 'TX', true),('Hidalgo', 'TX', true),('Hill', 'TX', true),('Hockley', 'TX', true),
('Hood', 'TX', true),('Hopkins', 'TX', true),('Houston', 'TX', true),('Howard', 'TX', true),('Hudspeth', 'TX', true),
('Hunt', 'TX', true),('Hutchinson', 'TX', true),('Irion', 'TX', true),('Jack', 'TX', true),('Jackson', 'TX', true),
('Jasper', 'TX', true),('Jeff Davis', 'TX', true),('Jefferson', 'TX', true),('Jim Hogg', 'TX', true),('Jim Wells', 'TX', true),
('Johnson', 'TX', true),('Jones', 'TX', true),('Karnes', 'TX', true),('Kaufman', 'TX', true),('Kendall', 'TX', true),
('Kenedy', 'TX', true),('Kent', 'TX', true),('Kerr', 'TX', true),('Kimble', 'TX', true),('King', 'TX', true),
('Kinney', 'TX', true),('Kleberg', 'TX', true),('Knox', 'TX', true),('Lamar', 'TX', true),('Lamb', 'TX', true),
('Lampasas', 'TX', true),('La Salle', 'TX', true),('Lavaca', 'TX', true),('Lee', 'TX', true),('Leon', 'TX', true),
('Liberty', 'TX', true),('Limestone', 'TX', true),('Lipscomb', 'TX', true),('Live Oak', 'TX', true),('Llano', 'TX', true),
('Loving', 'TX', true),('Lubbock', 'TX', true),('Lynn', 'TX', true),('Madison', 'TX', true),('Marion', 'TX', true),
('Martin', 'TX', true),('Mason', 'TX', true),('Matagorda', 'TX', true),('Maverick', 'TX', true),('McCulloch', 'TX', true),
('McLennan', 'TX', true),('McMullen', 'TX', true),('Medina', 'TX', true),('Menard', 'TX', true),('Midland', 'TX', true),
('Milam', 'TX', true),('Mills', 'TX', true),('Mitchell', 'TX', true),('Montague', 'TX', true),('Montgomery', 'TX', true),
('Moore', 'TX', true),('Morris', 'TX', true),('Motley', 'TX', true),('Nacogdoches', 'TX', true),('Navarro', 'TX', true),
('Newton', 'TX', true),('Nolan', 'TX', true),('Nueces', 'TX', true),('Ochiltree', 'TX', true),('Oldham', 'TX', true),
('Orange', 'TX', true),('Palo Pinto', 'TX', true),('Panola', 'TX', true),('Parker', 'TX', true),('Parmer', 'TX', true),
('Pecos', 'TX', true),('Polk', 'TX', true),('Potter', 'TX', true),('Presidio', 'TX', true),('Rains', 'TX', true),
('Randall', 'TX', true),('Reagan', 'TX', true),('Real', 'TX', true),('Red River', 'TX', true),('Reeves', 'TX', true),
('Refugio', 'TX', true),('Roberts', 'TX', true),('Robertson', 'TX', true),('Rockwall', 'TX', true),('Runnels', 'TX', true),
('Rusk', 'TX', true),('Sabine', 'TX', true),('San Augustine', 'TX', true),('San Jacinto', 'TX', true),('San Patricio', 'TX', true),
('San Saba', 'TX', true),('Schleicher', 'TX', true),('Scurry', 'TX', true),('Shackelford', 'TX', true),('Shelby', 'TX', true),
('Sherman', 'TX', true),('Smith', 'TX', true),('Somervell', 'TX', true),('Starr', 'TX', true),('Stephens', 'TX', true),
('Sterling', 'TX', true),('Stonewall', 'TX', true),('Sutton', 'TX', true),('Swisher', 'TX', true),('Tarrant', 'TX', true),
('Taylor', 'TX', true),('Terrell', 'TX', true),('Terry', 'TX', true),('Throckmorton', 'TX', true),('Titus', 'TX', true),
('Tom Green', 'TX', true),('Travis', 'TX', true),('Trinity', 'TX', true),('Tyler', 'TX', true),('Upshur', 'TX', true),
('Upton', 'TX', true),('Uvalde', 'TX', true),('Val Verde', 'TX', true),('Van Zandt', 'TX', true),('Victoria', 'TX', true),
('Walker', 'TX', true),('Waller', 'TX', true),('Ward', 'TX', true),('Washington', 'TX', true),('Webb', 'TX', true),
('Wharton', 'TX', true),('Wheeler', 'TX', true),('Wichita', 'TX', true),('Wilbarger', 'TX', true),('Willacy', 'TX', true),
('Williamson', 'TX', true),('Wilson', 'TX', true),('Winkler', 'TX', true),('Wise', 'TX', true),('Wood', 'TX', true),
('Yoakum', 'TX', true),('Young', 'TX', true),('Zapata', 'TX', true),('Zavala', 'TX', true),
-- Utah (29 counties)
('Beaver', 'UT', true),('Box Elder', 'UT', true),('Cache', 'UT', true),('Carbon', 'UT', true),('Daggett', 'UT', true),
('Davis', 'UT', true),('Duchesne', 'UT', true),('Emery', 'UT', true),('Garfield', 'UT', true),('Grand', 'UT', true),
('Iron', 'UT', true),('Juab', 'UT', true),('Kane', 'UT', true),('Millard', 'UT', true),('Morgan', 'UT', true),
('Piute', 'UT', true),('Rich', 'UT', true),('Salt Lake', 'UT', true),('San Juan', 'UT', true),('Sanpete', 'UT', true),
('Sevier', 'UT', true),('Summit', 'UT', true),('Tooele', 'UT', true),('Uintah', 'UT', true),('Utah', 'UT', true),
('Wasatch', 'UT', true),('Washington', 'UT', true),('Wayne', 'UT', true),('Weber', 'UT', true),
-- Vermont (14 counties)
('Addison', 'VT', true),('Bennington', 'VT', true),('Caledonia', 'VT', true),('Chittenden', 'VT', true),
('Essex', 'VT', true),('Franklin', 'VT', true),('Grand Isle', 'VT', true),('Lamoille', 'VT', true),
('Orange', 'VT', true),('Orleans', 'VT', true),('Rutland', 'VT', true),('Washington', 'VT', true),
('Windham', 'VT', true),('Windsor', 'VT', true),
-- Virginia (95 counties + 38 independent cities, including major ones)
('Accomack', 'VA', true),('Albemarle', 'VA', true),('Alleghany', 'VA', true),('Amelia', 'VA', true),('Amherst', 'VA', true),
('Appomattox', 'VA', true),('Arlington', 'VA', true),('Augusta', 'VA', true),('Bath', 'VA', true),('Bedford', 'VA', true),
('Bland', 'VA', true),('Botetourt', 'VA', true),('Brunswick', 'VA', true),('Buchanan', 'VA', true),('Buckingham', 'VA', true),
('Campbell', 'VA', true),('Caroline', 'VA', true),('Carroll', 'VA', true),('Charles City', 'VA', true),('Charlotte', 'VA', true),
('Chesterfield', 'VA', true),('Clarke', 'VA', true),('Craig', 'VA', true),('Culpeper', 'VA', true),('Cumberland', 'VA', true),
('Dickenson', 'VA', true),('Dinwiddie', 'VA', true),('Essex', 'VA', true),('Fairfax', 'VA', true),('Fauquier', 'VA', true),
('Floyd', 'VA', true),('Fluvanna', 'VA', true),('Franklin', 'VA', true),('Frederick', 'VA', true),('Giles', 'VA', true),
('Gloucester', 'VA', true),('Goochland', 'VA', true),('Grayson', 'VA', true),('Greene', 'VA', true),('Greensville', 'VA', true),
('Halifax', 'VA', true),('Hanover', 'VA', true),('Henrico', 'VA', true),('Henry', 'VA', true),('Highland', 'VA', true),
('Isle of Wight', 'VA', true),('James City', 'VA', true),('King and Queen', 'VA', true),('King George', 'VA', true),('King William', 'VA', true),
('Lancaster', 'VA', true),('Lee', 'VA', true),('Loudoun', 'VA', true),('Louisa', 'VA', true),('Lunenburg', 'VA', true),
('Madison', 'VA', true),('Mathews', 'VA', true),('Mecklenburg', 'VA', true),('Middlesex', 'VA', true),('Montgomery', 'VA', true),
('Nelson', 'VA', true),('New Kent', 'VA', true),('Northampton', 'VA', true),('Northumberland', 'VA', true),('Nottoway', 'VA', true),
('Orange', 'VA', true),('Page', 'VA', true),('Patrick', 'VA', true),('Pittsylvania', 'VA', true),('Powhatan', 'VA', true),
('Prince Edward', 'VA', true),('Prince George', 'VA', true),('Prince William', 'VA', true),('Pulaski', 'VA', true),('Rappahannock', 'VA', true),
('Richmond', 'VA', true),('Roanoke', 'VA', true),('Rockbridge', 'VA', true),('Rockingham', 'VA', true),('Russell', 'VA', true),
('Scott', 'VA', true),('Shenandoah', 'VA', true),('Smyth', 'VA', true),('Southampton', 'VA', true),('Spotsylvania', 'VA', true),
('Stafford', 'VA', true),('Surry', 'VA', true),('Sussex', 'VA', true),('Tazewell', 'VA', true),('Warren', 'VA', true),
('Washington', 'VA', true),('Westmoreland', 'VA', true),('Wise', 'VA', true),('Wythe', 'VA', true),('York', 'VA', true),
('Alexandria City', 'VA', true),('Charlottesville City', 'VA', true),('Chesapeake City', 'VA', true),('Hampton City', 'VA', true),
('Lynchburg City', 'VA', true),('Newport News City', 'VA', true),('Norfolk City', 'VA', true),('Portsmouth City', 'VA', true),
('Richmond City', 'VA', true),('Roanoke City', 'VA', true),('Suffolk City', 'VA', true),('Virginia Beach City', 'VA', true),
-- Washington (39 counties)
('Adams', 'WA', true),('Asotin', 'WA', true),('Benton', 'WA', true),('Chelan', 'WA', true),('Clallam', 'WA', true),
('Clark', 'WA', true),('Columbia', 'WA', true),('Cowlitz', 'WA', true),('Douglas', 'WA', true),('Ferry', 'WA', true),
('Franklin', 'WA', true),('Garfield', 'WA', true),('Grant', 'WA', true),('Grays Harbor', 'WA', true),('Island', 'WA', true),
('Jefferson', 'WA', true),('King', 'WA', true),('Kitsap', 'WA', true),('Kittitas', 'WA', true),('Klickitat', 'WA', true),
('Lewis', 'WA', true),('Lincoln', 'WA', true),('Mason', 'WA', true),('Okanogan', 'WA', true),('Pacific', 'WA', true),
('Pend Oreille', 'WA', true),('Pierce', 'WA', true),('San Juan', 'WA', true),('Skagit', 'WA', true),('Skamania', 'WA', true),
('Snohomish', 'WA', true),('Spokane', 'WA', true),('Stevens', 'WA', true),('Thurston', 'WA', true),('Wahkiakum', 'WA', true),
('Walla Walla', 'WA', true),('Whatcom', 'WA', true),('Whitman', 'WA', true),('Yakima', 'WA', true),
-- West Virginia (55 counties)
('Barbour', 'WV', true),('Berkeley', 'WV', true),('Boone', 'WV', true),('Braxton', 'WV', true),('Brooke', 'WV', true),
('Cabell', 'WV', true),('Calhoun', 'WV', true),('Clay', 'WV', true),('Doddridge', 'WV', true),('Fayette', 'WV', true),
('Gilmer', 'WV', true),('Grant', 'WV', true),('Greenbrier', 'WV', true),('Hampshire', 'WV', true),('Hancock', 'WV', true),
('Hardy', 'WV', true),('Harrison', 'WV', true),('Jackson', 'WV', true),('Jefferson', 'WV', true),('Kanawha', 'WV', true),
('Lewis', 'WV', true),('Lincoln', 'WV', true),('Logan', 'WV', true),('Marion', 'WV', true),('Marshall', 'WV', true),
('Mason', 'WV', true),('McDowell', 'WV', true),('Mercer', 'WV', true),('Mineral', 'WV', true),('Mingo', 'WV', true),
('Monongalia', 'WV', true),('Monroe', 'WV', true),('Morgan', 'WV', true),('Nicholas', 'WV', true),('Ohio', 'WV', true),
('Pendleton', 'WV', true),('Pleasants', 'WV', true),('Pocahontas', 'WV', true),('Preston', 'WV', true),('Putnam', 'WV', true),
('Raleigh', 'WV', true),('Randolph', 'WV', true),('Ritchie', 'WV', true),('Roane', 'WV', true),('Summers', 'WV', true),
('Taylor', 'WV', true),('Tucker', 'WV', true),('Tyler', 'WV', true),('Upshur', 'WV', true),('Wayne', 'WV', true),
('Webster', 'WV', true),('Wetzel', 'WV', true),('Wirt', 'WV', true),('Wood', 'WV', true),('Wyoming', 'WV', true),
-- Wyoming (23 counties)
('Albany', 'WY', true),('Big Horn', 'WY', true),('Campbell', 'WY', true),('Carbon', 'WY', true),('Converse', 'WY', true),
('Crook', 'WY', true),('Fremont', 'WY', true),('Goshen', 'WY', true),('Hot Springs', 'WY', true),('Johnson', 'WY', true),
('Laramie', 'WY', true),('Lincoln', 'WY', true),('Natrona', 'WY', true),('Niobrara', 'WY', true),('Park', 'WY', true),
('Platte', 'WY', true),('Sheridan', 'WY', true),('Sublette', 'WY', true),('Sweetwater', 'WY', true),('Teton', 'WY', true),
('Uinta', 'WY', true),('Washakie', 'WY', true),('Weston', 'WY', true)
ON CONFLICT DO NOTHING;


-- Keep contiguous-state counties active
UPDATE counties
SET is_active = true
WHERE state_code IN (
  'AL','AZ','AR','CA','CO','CT','DE','FL','GA','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI',
  'MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN',
  'TX','UT','VT','VA','WA','WV','WI','WY'
);
