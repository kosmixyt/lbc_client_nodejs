import {
  type City,
  type LocationType,
  type RegionValue,
  type DepartmentValue,
  type SortValue,
  Category,
  Sort,
  AdType,
  OwnerType,
} from "./models";
import { InvalidValue } from "./exceptions";

function buildArea(areaValues: string[]): Record<string, any> {
  const area: Record<string, any> = {
    lat: parseFloat(areaValues[0]!),
    lng: parseFloat(areaValues[1]!),
  };
  if (areaValues.length >= 3) {
    area.default_radius = parseInt(areaValues[2]!, 10);
  }
  if (areaValues.length >= 4) {
    area.radius = parseInt(areaValues[3]!, 10);
  }
  return area;
}



export function buildSearchPayloadWithArgs(options: {
  text?: string;
  category?: Category;
  sort?: SortValue;
  locations?: LocationType | LocationType[];
  limit?: number;
  limitAlu?: number;
  page?: number;
  adType?: AdType;
  ownerType?: OwnerType;
  shippable?: boolean;
  searchInTitleOnly?: boolean;
  priceRange?: [number, number];
  extras?: Record<string, number[] | string[]>;
}): Record<string, any> {
  const {
    text,
    category = Category.TOUTES_CATEGORIES,
    sort = Sort.RELEVANCE,
    locations,
    limit = 35,
    limitAlu = 3,
    page = 1,
    adType = AdType.OFFER,
    ownerType,
    shippable,
    searchInTitleOnly = false,
    extras,
    priceRange
  } = options;

  const payload: Record<string, any> = {
    filters: {
      category: { id: category },
      enums: { ad_type: [adType] },
      keywords: { text: text ?? "" },
      location: {},
      ranges: {},
    },
    limit,
    limit_alu: limitAlu,
    offset: limit * (page - 1),
    disable_total: true,
    extend: true,
    listing_source: page === 1 ? "direct-search" : "pagination",
  };

  if (text) {
    payload.filters.keywords = { text };
  }
  if (priceRange) {
    payload.filters.ranges.price = {
      min: priceRange[0],
      max: priceRange[1],
    };
  }

  if (ownerType) {
    payload.owner_type = ownerType;
  }

  // Sort
  const [sortBy, sortOrder] = sort;
  payload.sort_by = sortBy;
  if (sortOrder) {
    payload.sort_order = sortOrder;
  }

  // Locations
  let locationList: LocationType[] | undefined;
  if (locations) {
    locationList = Array.isArray(locations) ? locations : [locations];
  }

  if (locationList && locationList.length > 0) {
    payload.filters.location = { locations: [] };
    for (const loc of locationList) {
      switch (loc.type) {
        case "region":
          payload.filters.location.locations.push({
            locationType: "region",
            region_id: loc.value[0],
          });
          break;
        case "department":
          payload.filters.location.locations.push({
            locationType: "department",
            region_id: loc.value[0],
            department_id: loc.value[2],
          });
          break;
        case "city":
          payload.filters.location.locations.push({
            area: {
              lat: loc.value.lat,
              lng: loc.value.lng,
              radius: loc.value.radius ?? 10_000,
            },
            city: loc.value.city,
            label: loc.value.city ? `${loc.value.city} (toute la ville)` : null,
            locationType: "city",
          });
          break;
        default:
          throw new InvalidValue(
            "The provided location is invalid. It must be a region, department, or city."
          );
      }
    }
  }

  // Search in title only
  if (text && searchInTitleOnly) {
    payload.filters.keywords.type = "subject";
  }

  if (shippable) {
    if (!payload.filters.location) payload.filters.location = {};
    payload.filters.location.shippable = true;
  }

  // Extra kwargs (ranges and enums)
  if (extras) {
    for (const [key, value] of Object.entries(extras)) {
      if (!Array.isArray(value)) {
        throw new InvalidValue(`The value of '${key}' must be an array.`);
      }
      // Range (all numbers)
      if (value.every((x) => typeof x === "number")) {
        if (value.length < 2) {
          throw new InvalidValue(`The value of '${key}' must have at least two elements.`);
        }
        if (!payload.filters.ranges) payload.filters.ranges = {};
        payload.filters.ranges[key] = {
          min: value[0],
          max: value[1],
        };
      }
      // Enum (all strings)
      else if (value.every((x) => typeof x === "string")) {
        if (!payload.filters.enums) payload.filters.enums = {};
        payload.filters.enums[key] = value;
      } else {
        throw new InvalidValue(
          `The value of '${key}' must be an array containing only numbers or only strings.`
        );
      }
    }
  }

  return payload;
}
