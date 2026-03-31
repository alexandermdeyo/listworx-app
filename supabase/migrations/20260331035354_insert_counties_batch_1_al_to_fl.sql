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
