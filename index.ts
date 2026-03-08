// lbc_client - TypeScript port of https://github.com/etienne-hd/lbc
// Uses CycleTLS for TLS fingerprint impersonation

export { Client, type ClientOptions } from "./client";
export {
  Category,
  AdType,
  OwnerType,
  Sort,
  Region,
  Department,
  createCity,
  proxyUrl,
  type City,
  type Proxy,
  type LocationType,
  type SortValue,
  type RegionValue,
  type DepartmentValue,
} from "./models";
export {
  type Ad,
  type AdLocation,
  type Attribute,
  type SearchResult,
  type User,
  type Feedback,
  type Reply,
  type Presence,
  type Badge,
  type Pro,
  type Rating,
  type Review,
  type UserLocation,
} from "./types";
export {
  LBCError,
  InvalidValue,
  RequestError,
  DatadomeError,
  NotFoundError,
} from "./exceptions";
