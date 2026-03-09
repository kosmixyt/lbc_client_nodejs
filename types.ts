import { z } from "zod";

// ── Ad Location ──
export const AdLocationSchema = z.object({
  country_id: z.string().nullable(),
  region_id: z.string().nullable(),
  region_name: z.string().nullable(),
  department_id: z.string().nullable(),
  department_name: z.string().nullable(),
  city_label: z.string().nullable(),
  city: z.string().nullable(),
  zipcode: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  source: z.string().nullable(),
  provider: z.string().nullable(),
  is_shape: z.boolean().nullable(),
});
export type AdLocation = z.infer<typeof AdLocationSchema>;

// ── Attribute ──
export const AttributeSchema = z.object({
  key: z.string().nullable(),
  key_label: z.string().nullable(),
  value: z.string().nullable(),
  value_label: z.string().nullable(),
  values: z.array(z.string()).nullable(),
  values_label: z.array(z.string()).nullable(),
  value_label_reader: z.string().nullable(),
  generic: z.boolean().nullable(),
});
export type Attribute = z.infer<typeof AttributeSchema>;

// ── Ad ──
export const AdSchema = z.object({
  id: z.number().nullable(),
  first_publication_date: z.string().nullable(),
  expiration_date: z.string().nullable(),
  index_date: z.string().nullable(),
  status: z.string().nullable(),
  category_id: z.string().nullable(),
  category_name: z.string().nullable(),
  subject: z.string().nullable(),
  body: z.string().nullable(),
  brand: z.string().nullable(),
  ad_type: z.string().nullable(),
  url: z.string().nullable(),
  price: z.number().nullable(),
  images: z.array(z.string()).nullable(),
  attributes: z.array(AttributeSchema),
  location: AdLocationSchema,
  has_phone: z.boolean().nullable(),
  favorites: z.number().nullable(),
  _user_id: z.string().nullable(),
});
export type Ad = z.infer<typeof AdSchema>;

export function buildAd(raw: Record<string, any>): Ad {
  const attributes: Attribute[] = (raw.attributes ?? []).map((a: any) => ({
    key: a.key ?? null,
    key_label: a.key_label ?? null,
    value: a.value ?? null,
    value_label: a.value_label ?? null,
    values: a.values ?? null,
    values_label: a.values_label ?? null,
    value_label_reader: a.value_label_reader ?? null,
    generic: a.generic ?? null,
  }));

  const loc = raw.location ?? {};
  const location: AdLocation = {
    country_id: loc.country_id ?? null,
    region_id: loc.region_id ?? null,
    region_name: loc.region_name ?? null,
    department_id: loc.department_id ?? null,
    department_name: loc.department_name ?? null,
    city_label: loc.city_label ?? null,
    city: loc.city ?? null,
    zipcode: loc.zipcode ?? null,
    lat: loc.lat ?? null,
    lng: loc.lng ?? null,
    source: loc.source ?? null,
    provider: loc.provider ?? null,
    is_shape: loc.is_shape ?? null,
  };

  const owner = raw.owner ?? {};

  return {
    id: raw.list_id ?? null,
    first_publication_date: raw.first_publication_date ?? null,
    expiration_date: raw.expiration_date ?? null,
    index_date: raw.index_date ?? null,
    status: raw.status ?? null,
    category_id: raw.category_id ?? null,
    category_name: raw.category_name ?? null,
    subject: raw.subject ?? null,
    body: raw.body ?? null,
    brand: raw.brand ?? null,
    ad_type: raw.ad_type ?? null,
    url: raw.url ?? null,
    price: raw.price_cents ? raw.price_cents / 100 : null,
    images: raw.images?.urls_large ?? null,
    attributes,
    location,
    has_phone: raw.has_phone ?? null,
    favorites: raw.counters?.favorites ?? null,
    _user_id: owner.user_id ?? null,
  };
}

// ── Search Result ──
export const SearchResultSchema = z.object({
  total: z.number().nullable(),
  total_all: z.number().nullable(),
  total_pro: z.number().nullable(),
  total_private: z.number().nullable(),
  total_active: z.number().nullable(),
  total_inactive: z.number().nullable(),
  total_shippable: z.number().nullable(),
  max_pages: z.number().nullable(),
  ads: z.array(AdSchema),
});
export type SearchResult = z.infer<typeof SearchResultSchema>;

export function buildSearchResult(raw: Record<string, any>): SearchResult {
  const ads = (raw.ads ?? []).map((ad: any) => buildAd(ad));

  return {
    total: raw.total ?? null,
    total_all: raw.total_all ?? null,
    total_pro: raw.total_pro ?? null,
    total_private: raw.total_private ?? null,
    total_active: raw.total_active ?? null,
    total_inactive: raw.total_inactive ?? null,
    total_shippable: raw.total_shippable ?? null,
    max_pages: raw.max_pages ?? null,
    ads,
  };
}

// ── User types ──
export const ReplySchema = z.object({
  in_minutes: z.number().nullable(),
  text: z.string().nullable(),
  rate_text: z.string().nullable(),
  rate: z.number().nullable(),
  reply_time_text: z.string().nullable(),
});
export type Reply = z.infer<typeof ReplySchema>;

export const PresenceSchema = z.object({
  status: z.string().nullable(),
  presence_text: z.string().nullable(),
  last_activity: z.string().nullable(),
  enabled: z.boolean().nullable(),
});
export type Presence = z.infer<typeof PresenceSchema>;

export const BadgeSchema = z.object({
  type: z.string().nullable(),
  name: z.string().nullable(),
});
export type Badge = z.infer<typeof BadgeSchema>;

export const FeedbackSchema = z.object({
  overall_score: z.number().nullable(),
  cleanness: z.number().nullable(),
  communication: z.number().nullable(),
  conformity: z.number().nullable(),
  package_score: z.number().nullable(),
  product: z.number().nullable(),
  recommendation: z.number().nullable(),
  respect: z.number().nullable(),
  transaction: z.number().nullable(),
  user_attention: z.number().nullable(),
  received_count: z.number().nullable(),
});
export type Feedback = z.infer<typeof FeedbackSchema>;

export const UserLocationSchema = z.object({
  address: z.string().nullable(),
  district: z.string().nullable(),
  city: z.string().nullable(),
  label: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  zipcode: z.string().nullable(),
  geo_source: z.string().nullable(),
  geo_provider: z.string().nullable(),
  region: z.string().nullable(),
  region_label: z.string().nullable(),
  department: z.string().nullable(),
  department_label: z.string().nullable(),
  country: z.string().nullable(),
});
export type UserLocation = z.infer<typeof UserLocationSchema>;

export const ReviewSchema = z.object({
  author_name: z.string().nullable(),
  rating_value: z.number().nullable(),
  text: z.string().nullable(),
  review_time: z.string().nullable(),
});
export type Review = z.infer<typeof ReviewSchema>;

export const RatingSchema = z.object({
  rating_value: z.number().nullable(),
  user_ratings_total: z.number().nullable(),
  source: z.string().nullable(),
  source_display: z.string().nullable(),
  retrieval_time: z.string().nullable(),
  url: z.string().nullable(),
  reviews: z.array(ReviewSchema),
});
export type Rating = z.infer<typeof RatingSchema>;

export const ProSchema = z.object({
  online_store_id: z.number().nullable(),
  online_store_name: z.string().nullable(),
  activity_sector_id: z.number().nullable(),
  activity_sector: z.string().nullable(),
  category_id: z.number().nullable(),
  siren: z.string().nullable(),
  siret: z.string().nullable(),
  store_id: z.number().nullable(),
  active_since: z.string().nullable(),
  location: UserLocationSchema,
  logo: z.string().nullable(),
  cover: z.string().nullable(),
  slogan: z.string().nullable(),
  description: z.string().nullable(),
  opening_hours: z.string().nullable(),
  website_url: z.string().nullable(),
  rating: RatingSchema,
});
export type Pro = z.infer<typeof ProSchema>;

export const UserSchema = z.object({
  id: z.string().nullable(),
  name: z.string().nullable(),
  registered_at: z.string().nullable(),
  location: z.string().nullable(),
  feedback: FeedbackSchema,
  profile_picture: z.string().nullable(),
  reply: ReplySchema,
  presence: PresenceSchema,
  badges: z.array(BadgeSchema),
  total_ads: z.number().nullable(),
  store_id: z.number().nullable(),
  account_type: z.string().nullable(),
  description: z.string().nullable(),
  pro: ProSchema.nullable(),
  is_pro: z.boolean(),
});
export type User = z.infer<typeof UserSchema>;

export function buildUser(userData: Record<string, any>, proData?: Record<string, any> | null): User {
  const rawFeedback = userData.feedback ?? {};
  const catScores = rawFeedback.category_scores ?? {};
  const feedback: Feedback = {
    overall_score: rawFeedback.overall_score ?? null,
    cleanness: catScores.CLEANNESS ?? null,
    communication: catScores.COMMUNICATION ?? null,
    conformity: catScores.CONFORMITY ?? null,
    package_score: catScores.PACKAGE ?? null,
    product: catScores.PRODUCT ?? null,
    recommendation: catScores.RECOMMENDATION ?? null,
    respect: catScores.RESPECT ?? null,
    transaction: catScores.TRANSACTION ?? null,
    user_attention: catScores.USER_ATTENTION ?? null,
    received_count: rawFeedback.received_count ?? null,
  };

  const rawReply = userData.reply ?? {};
  const reply: Reply = {
    in_minutes: rawReply.in_minutes ?? null,
    text: rawReply.text ?? null,
    rate_text: rawReply.rate_text ?? null,
    rate: rawReply.rate ?? null,
    reply_time_text: rawReply.reply_time_text ?? null,
  };

  const rawPresence = userData.presence ?? {};
  const presence: Presence = {
    status: rawPresence.status ?? null,
    presence_text: rawPresence.presence_text ?? null,
    last_activity: rawPresence.last_activity ?? null,
    enabled: rawPresence.enabled ?? null,
  };

  const badges: Badge[] = (userData.badges ?? []).map((b: any) => ({
    type: b.type ?? null,
    name: b.name ?? null,
  }));

  let pro: Pro | null = null;
  if (proData) {
    const rawProLoc = proData.location ?? {};
    const proLocation: UserLocation = {
      address: rawProLoc.address ?? null,
      district: rawProLoc.district ?? null,
      city: rawProLoc.city ?? null,
      label: rawProLoc.label ?? null,
      lat: rawProLoc.lat ?? null,
      lng: rawProLoc.lng ?? null,
      zipcode: rawProLoc.zipcode ?? null,
      geo_source: rawProLoc.geo_source ?? null,
      geo_provider: rawProLoc.geo_provider ?? null,
      region: rawProLoc.region ?? null,
      region_label: rawProLoc.region_label ?? null,
      department: rawProLoc.department ?? null,
      department_label: rawProLoc.dpt_label ?? null,
      country: rawProLoc.country ?? null,
    };

    const rawProRating = proData.rating ?? {};
    const proReviews: Review[] = (rawProRating.reviews ?? []).map((r: any) => ({
      author_name: r.author_name ?? null,
      rating_value: r.rating_value ?? null,
      text: r.text ?? null,
      review_time: r.review_time ?? null,
    }));

    const proRating: Rating = {
      rating_value: rawProRating.rating_value ?? null,
      user_ratings_total: rawProRating.user_ratings_total ?? null,
      source: rawProRating.source ?? null,
      source_display: rawProRating.source_display ?? null,
      retrieval_time: rawProRating.retrieval_time ?? null,
      url: rawProRating.url ?? null,
      reviews: proReviews,
    };

    const proOwner = proData.owner ?? {};
    const proBrand = proData.brand ?? {};
    const proInfo = proData.information ?? {};

    pro = {
      online_store_id: proData.online_store_id ?? null,
      online_store_name: proData.online_store_name ?? null,
      activity_sector_id: proOwner.activitySectorID ?? null,
      activity_sector: proOwner.activitySector ?? null,
      category_id: proOwner.categoryId ?? null,
      siren: proOwner.siren ?? null,
      siret: proOwner.siret ?? null,
      store_id: proOwner.storeId ?? null,
      active_since: proOwner.activeSince ?? null,
      location: proLocation,
      logo: proBrand.logo?.large ?? null,
      cover: proBrand.cover?.large ?? null,
      slogan: proBrand.slogan ?? null,
      description: proInfo.description ?? null,
      opening_hours: proInfo.opening_hours ?? null,
      website_url: proInfo.website_url ?? null,
      rating: proRating,
    };
  }

  return {
    id: userData.user_id ?? null,
    name: userData.name ?? null,
    registered_at: userData.registered_at ?? null,
    location: userData.location ?? null,
    feedback,
    profile_picture: userData.profile_picture?.extra_large_url ?? null,
    reply,
    presence,
    badges,
    total_ads: userData.total_ads ?? null,
    store_id: userData.store_id ?? null,
    account_type: userData.account_type ?? null,
    description: userData.description ?? null,
    pro,
    is_pro: userData.account_type === "pro",
  };
}
