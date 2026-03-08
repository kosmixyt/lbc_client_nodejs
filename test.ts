import {
  Client,
  Category,
  Sort,
  AdType,
  OwnerType,
  Region,
  Department,
  createCity,
  type SearchResult,
  type Ad,
  type User,
} from "./index";
import { buildSearchPayloadWithArgs, buildSearchPayloadWithUrl } from "./utils";
import { InvalidValue } from "./exceptions";

// ── Test helpers ──
let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

function assertEqual(actual: any, expected: any, message: string) {
  const match = JSON.stringify(actual) === JSON.stringify(expected);
  if (match) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    console.error(`    expected: ${JSON.stringify(expected)}`);
    console.error(`    actual:   ${JSON.stringify(actual)}`);
    failed++;
  }
}

function section(name: string) {
  console.log(`\n── ${name} ──`);
}

// ── Unit Tests (no network) ──

function testPayloadWithArgs() {
  section("buildSearchPayloadWithArgs");

  // Basic search
  const p1 = buildSearchPayloadWithArgs({ text: "maison" });
  assert(p1.filters.keywords.text === "maison", "text is set");
  assertEqual(p1.filters.enums.ad_type, [AdType.OFFER], "default ad_type is OFFER");
  assertEqual(p1.filters.category.id, Category.TOUTES_CATEGORIES, "default category");
  assertEqual(p1.limit, 35, "default limit");
  assertEqual(p1.offset, 0, "page 1 offset is 0");
  assertEqual(p1.listing_source, "direct-search", "page 1 is direct-search");

  // Pagination
  const p2 = buildSearchPayloadWithArgs({ text: "test", page: 3, limit: 10 });
  assertEqual(p2.offset, 20, "page 3 offset with limit 10");
  assertEqual(p2.listing_source, "pagination", "page > 1 is pagination");

  // Sort
  const p3 = buildSearchPayloadWithArgs({ sort: Sort.NEWEST });
  assertEqual(p3.sort_by, "time", "sort_by = time");
  assertEqual(p3.sort_order, "desc", "sort_order = desc");

  const p4 = buildSearchPayloadWithArgs({ sort: Sort.RELEVANCE });
  assertEqual(p4.sort_by, "relevance", "sort_by = relevance");
  assert(p4.sort_order === undefined, "no sort_order for relevance");

  // Location: City
  const city = createCity({ lat: 48.8599, lng: 2.338, radius: 10_000, city: "Paris" });
  const p5 = buildSearchPayloadWithArgs({
    locations: { type: "city", value: city },
  });
  const loc5 = p5.filters.location.locations[0];
  assertEqual(loc5.locationType, "city", "city locationType");
  assertEqual(loc5.area.lat, 48.8599, "city lat");
  assertEqual(loc5.area.lng, 2.338, "city lng");
  assertEqual(loc5.area.radius, 10_000, "city radius");
  assertEqual(loc5.city, "Paris", "city name");

  // Location: Region
  const p6 = buildSearchPayloadWithArgs({
    locations: { type: "region", value: Region.ILE_DE_FRANCE },
  });
  const loc6 = p6.filters.location.locations[0];
  assertEqual(loc6.locationType, "region", "region locationType");
  assertEqual(loc6.region_id, "12", "region_id IDF");

  // Location: Department
  const p7 = buildSearchPayloadWithArgs({
    locations: { type: "department", value: Department.PARIS },
  });
  const loc7 = p7.filters.location.locations[0];
  assertEqual(loc7.locationType, "department", "department locationType");
  assertEqual(loc7.department_id, "75", "department_id Paris");

  // Multiple locations
  const p8 = buildSearchPayloadWithArgs({
    locations: [
      { type: "region", value: Region.BRETAGNE },
      { type: "city", value: createCity({ lat: 48.1, lng: -1.67, city: "Rennes" }) },
    ],
  });
  assertEqual(p8.filters.location.locations.length, 2, "2 locations");

  // Extras: Ranges
  const p9 = buildSearchPayloadWithArgs({
    extras: { price: [100_000, 500_000], square: [50, 200] },
  });
  assertEqual(p9.filters.ranges.price, { min: 100_000, max: 500_000 }, "price range");
  assertEqual(p9.filters.ranges.square, { min: 50, max: 200 }, "square range");

  // Extras: Enums
  const p10 = buildSearchPayloadWithArgs({
    extras: { real_estate_type: ["3", "4"] },
  });
  assertEqual(p10.filters.enums.real_estate_type, ["3", "4"], "enum values");

  // Search in title only
  const p11 = buildSearchPayloadWithArgs({ text: "test", searchInTitleOnly: true });
  assertEqual(p11.filters.keywords.type, "subject", "search in title only");

  // Owner type
  const p12 = buildSearchPayloadWithArgs({ ownerType: OwnerType.PRIVATE });
  assertEqual(p12.owner_type, "private", "owner_type");

  // Shippable
  const p13 = buildSearchPayloadWithArgs({ shippable: true });
  assertEqual(p13.filters.location.shippable, true, "shippable");
}

function testPayloadWithUrl() {
  section("buildSearchPayloadWithUrl");

  const url =
    "https://www.leboncoin.fr/recherche?category=9&text=maison&locations=Paris__48.86_2.33_9256&square=100-200&price=500000-1000000&real_estate_type=3,4";

  const p = buildSearchPayloadWithUrl(url);
  assertEqual(p.filters.category.id, "9", "category from URL");
  assertEqual(p.filters.keywords.text, "maison", "text from URL");
  assertEqual(p.filters.location.locations.length, 1, "1 location from URL");
  assertEqual(p.filters.location.locations[0].locationType, "city", "city from URL");
  assertEqual(p.filters.ranges.square, { min: 100, max: 200 }, "square range from URL");
  assertEqual(p.filters.ranges.price, { min: 500000, max: 1000000 }, "price range from URL");
  assertEqual(p.filters.enums.real_estate_type, ["3", "4"], "enum from URL");

  // Department URL
  const url2 = "https://www.leboncoin.fr/recherche?locations=d_75";
  const p2 = buildSearchPayloadWithUrl(url2);
  assertEqual(p2.filters.location.locations[0].locationType, "department", "department from URL");
  assertEqual(p2.filters.location.locations[0].department_id, "75", "department_id from URL");

  // Region URL
  const url3 = "https://www.leboncoin.fr/recherche?locations=r_12";
  const p3 = buildSearchPayloadWithUrl(url3);
  assertEqual(p3.filters.location.locations[0].locationType, "region", "region from URL");
  assertEqual(p3.filters.location.locations[0].region_id, "12", "region_id from URL");

  // Sort from URL
  const url4 = "https://www.leboncoin.fr/recherche?sort=time&order=desc";
  const p4 = buildSearchPayloadWithUrl(url4);
  assertEqual(p4.sort_by, "time", "sort_by from URL");
  assertEqual(p4.sort_order, "desc", "sort_order from URL");

  // Pagination
  const p5 = buildSearchPayloadWithUrl(url, 10, 3, 2);
  assertEqual(p5.limit, 10, "custom limit");
  assertEqual(p5.offset, 10, "page 2 offset");
  assertEqual(p5.listing_source, "pagination", "pagination source");
}

function testInvalidExtras() {
  section("Invalid extras validation");

  let threw = false;
  try {
    buildSearchPayloadWithArgs({
      extras: { price: [100] as any }, // too few elements
    });
  } catch (e) {
    if (e instanceof InvalidValue) threw = true;
  }
  assert(threw, "throws InvalidValue for range with < 2 elements");

  threw = false;
  try {
    buildSearchPayloadWithArgs({
      extras: { bad: "not-array" as any },
    });
  } catch (e) {
    if (e instanceof InvalidValue) threw = true;
  }
  assert(threw, "throws InvalidValue for non-array extra");
}

function testModels() {
  section("Models");

  // City
  const city = createCity({ lat: 48.85, lng: 2.33 });
  assertEqual(city.radius, 10_000, "default city radius");
  assertEqual(city.city, undefined, "city name optional");

  const city2 = createCity({ lat: 48.85, lng: 2.33, radius: 5000, city: "Paris" });
  assertEqual(city2.radius, 5000, "custom city radius");
  assertEqual(city2.city, "Paris", "city name set");

  // Enums
  assertEqual(Category.IMMOBILIER, "8", "Category.IMMOBILIER");
  assertEqual(AdType.OFFER, "offer", "AdType.OFFER");
  assertEqual(OwnerType.PRO, "pro", "OwnerType.PRO");
  assertEqual(Sort.NEWEST[0], "time", "Sort.NEWEST sort_by");
  assertEqual(Sort.NEWEST[1], "desc", "Sort.NEWEST sort_order");

  // Region
  assertEqual(Region.ILE_DE_FRANCE[0], "12", "Region IDF id");
  assertEqual(Department.PARIS[2], "75", "Department Paris id");
}

// ── Integration Tests (network required) ──

async function testSearch(client: Client) {
  section("Integration: search");

  const result = await client.search({
    text: "maison",
    locations: {
      type: "city",
      value: createCity({ lat: 48.8599, lng: 2.338, city: "Paris" }),
    },
    page: 1,
    limit: 5,
    sort: Sort.NEWEST,
    adType: AdType.OFFER,
    category: Category.IMMOBILIER,
  });

  assert(result.ads !== undefined, "ads array exists");
  assert(result.ads.length > 0, "found at least 1 ad");

  const ad = result.ads[0]!;
  assert(ad.id !== null, "ad has id");
  assert(ad.subject !== null, "ad has subject");
  assert(ad.url !== null, "ad has url");
  console.log(`    first ad: [${ad.id}] ${ad.subject} - ${ad.price}€`);
}

async function testSearchWithUrl(client: Client) {
  section("Integration: search with URL");

  const result = await client.search({
    url: "https://www.leboncoin.fr/recherche?category=9&text=appartement&locations=Paris__48.86_2.33_9256",
    limit: 5,
    page: 1,
  });

  assert(result.ads !== undefined, "ads from URL search");
  assert(result.ads.length > 0, "found at least 1 ad from URL");
  console.log(`    found ${result.ads.length} ads`);
}

async function testGetAd(client: Client) {
  section("Integration: getAd");

  // First search for an ad to get a valid ID
  const searchResult = await client.search({
    text: "vélo",
    limit: 1,
    page: 1,
  });

  if (searchResult.ads.length === 0) {
    console.log("  ⚠ No ads found, skipping getAd test");
    return;
  }

  const adId = searchResult.ads[0]!.id!;
  const ad = await client.getAd(adId);
  assert(ad.id === adId, "retrieved ad has correct id");
  assert(ad.subject !== null, "ad has subject");
  console.log(`    ad: [${ad.id}] ${ad.subject}`);
}

async function testGetUser(client: Client) {
  section("Integration: getUser");

  // First search for an ad to get a user ID
  const searchResult = await client.search({
    text: "iphone",
    limit: 1,
    page: 1,
  });

  const firstAd = searchResult.ads[0];
  if (searchResult.ads.length === 0 || !firstAd?._user_id) {
    console.log("  ⚠ No ads with user found, skipping getUser test");
    return;
  }

  const userId = firstAd._user_id!;
  const user = await client.getUser(userId);
  assert(user.id !== null, "user has id");
  assert(user.name !== null, "user has name");
  console.log(`    user: ${user.name} (${user.account_type})`);
}

// ── Main ──

async function main() {
  const args = process.argv.slice(2);
  const runIntegration = args.includes("--integration") || args.includes("-i");

  console.log("╔══════════════════════════════════╗");
  console.log("║   lbc_client Test Suite           ║");
  console.log("╚══════════════════════════════════╝");

  // Unit tests (always run)
  testPayloadWithArgs();
  testPayloadWithUrl();
  testInvalidExtras();
  testModels();

  // Integration tests (optional, requires network)
  if (runIntegration) {
    console.log("\n═══ Integration Tests (network) ═══");
    const client = new Client();
    try {
      await client.init();

      await testSearch(client);
      await testSearchWithUrl(client);
      await testGetAd(client);
      await testGetUser(client);
    } catch (e: any) {
      if (e.name === "DatadomeError") {
        console.log(`\n  ⚠ Datadome blocked requests (expected without a French proxy).`);
        console.log(`    The client is working correctly — pass a proxy to bypass Datadome.`);
      } else {
        console.error(`\n  ✗ Integration error: ${e.message}`);
        failed++;
      }
    } finally {
      await client.exit();
    }
  } else {
    console.log("\n  ℹ  Skipping integration tests. Run with --integration or -i to enable.");
  }

  // Summary
  console.log("\n══════════════════════════════════");
  console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log("══════════════════════════════════\n");

  if (failed > 0) process.exit(1);
}

main();
