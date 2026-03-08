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

export function buildSearchPayloadWithUrl(
  url: string,
  limit = 35,
  limitAlu = 3,
  page = 1
): Record<string, any> {
  const payload: Record<string, any> = {
    filters: {},
    limit,
    limit_alu: limitAlu,
    offset: limit * (page - 1),
    disable_total: true,
    extend: true,
    listing_source: page === 1 ? "direct-search" : "pagination",
  };

  const queryString = url.split("?")[1];
  if (!queryString) return payload;

  const args = queryString.split("&");
  for (const arg of args) {
    const eqIdx = arg.indexOf("=");
    if (eqIdx === -1) continue;

    const key = arg.substring(0, eqIdx);
    const value = arg.substring(eqIdx + 1);

    switch (key) {
      case "text":
        payload.filters.keywords = { text: decodeURIComponent(value) };
        break;

      case "category":
        payload.filters.category = { id: value };
        break;

      case "locations": {
        payload.filters.location = { locations: [] };
        const locations = value.split(",");
        for (const location of locations) {
          const locationParts = location.split("__");
          const prefixParts = locationParts[0]!.split("_");

          if (prefixParts[0]!.length === 1) {
            const locationId = prefixParts[1]!;
            switch (prefixParts[0]!) {
              case "d":
                payload.filters.location.locations.push({
                  locationType: "department",
                  department_id: locationId,
                });
                break;
              case "r":
                payload.filters.location.locations.push({
                  locationType: "region",
                  region_id: locationId,
                });
                break;
              case "p": {
                const areaValues = locationParts[1]!.split("_");
                payload.filters.location.locations.push({
                  locationType: "place",
                  place: locationId,
                  label: locationId,
                  area: buildArea(areaValues),
                });
                break;
              }
              default:
                throw new InvalidValue(`Unknown location type: ${prefixParts[0]}`);
            }
          } else {
            // City
            const areaValues = locationParts[1]!.split("_");
            payload.filters.location.locations.push({
              locationType: "city",
              area: buildArea(areaValues),
            });
          }
        }
        break;
      }

      case "order":
        payload.sort_order = value;
        break;

      case "sort":
        payload.sort_by = value;
        break;

      case "owner_type":
        payload.owner_type = value;
        break;

      case "shippable":
        if (value === "1") {
          if (!payload.filters.location) payload.filters.location = {};
          payload.filters.location.shippable = true;
        }
        break;

      default: {
        if (key === "page") continue;

        const dashParts = value.split("-");
        if (dashParts.length === 2) {
          // Range
          let minVal: number | null = parseInt(dashParts[0]!, 10);
          let maxVal: number | null = parseInt(dashParts[1]!, 10);
          if (isNaN(minVal)) minVal = null;
          if (isNaN(maxVal)) maxVal = null;

          if (!payload.filters.ranges) payload.filters.ranges = {};
          const ranges: Record<string, number> = {};
          if (minVal !== null) ranges.min = minVal;
          if (maxVal !== null) ranges.max = maxVal;
          if (Object.keys(ranges).length > 0) {
            payload.filters.ranges[key] = ranges;
          }
        } else {
          // Enum
          if (!payload.filters.enums) payload.filters.enums = {};
          payload.filters.enums[key] = value.split(",");
        }
        break;
      }
    }
  }

  return payload;
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
  } = options;

  const payload: Record<string, any> = {
    filters: {
      category: { id: category },
      enums: { ad_type: [adType] },
      keywords: { text: text ?? "" },
      location: {},
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
