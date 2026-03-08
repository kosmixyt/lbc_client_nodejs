// ── Ad Location ──
export interface AdLocation {
  country_id: string | null;
  region_id: string | null;
  region_name: string | null;
  department_id: string | null;
  department_name: string | null;
  city_label: string | null;
  city: string | null;
  zipcode: string | null;
  lat: number | null;
  lng: number | null;
  source: string | null;
  provider: string | null;
  is_shape: boolean | null;
}

// ── Attribute ──
export interface Attribute {
  key: string | null;
  key_label: string | null;
  value: string | null;
  value_label: string | null;
  values: string[] | null;
  values_label: string[] | null;
  value_label_reader: string | null;
  generic: boolean | null;
}

// ── Ad ──
export interface Ad {
  id: number | null;
  first_publication_date: string | null;
  expiration_date: string | null;
  index_date: string | null;
  status: string | null;
  category_id: string | null;
  category_name: string | null;
  subject: string | null;
  body: string | null;
  brand: string | null;
  ad_type: string | null;
  url: string | null;
  price: number | null;
  images: string[] | null;
  attributes: Attribute[];
  location: AdLocation;
  has_phone: boolean | null;
  favorites: number | null;
  _user_id: string | null;
}

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
export interface SearchResult {
  total: number | null;
  total_all: number | null;
  total_pro: number | null;
  total_private: number | null;
  total_active: number | null;
  total_inactive: number | null;
  total_shippable: number | null;
  max_pages: number | null;
  ads: Ad[];
}

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
export interface Reply {
  in_minutes: number | null;
  text: string | null;
  rate_text: string | null;
  rate: number | null;
  reply_time_text: string | null;
}

export interface Presence {
  status: string | null;
  presence_text: string | null;
  last_activity: string | null;
  enabled: boolean | null;
}

export interface Badge {
  type: string | null;
  name: string | null;
}

export interface Feedback {
  overall_score: number | null;
  cleanness: number | null;
  communication: number | null;
  conformity: number | null;
  package_score: number | null;
  product: number | null;
  recommendation: number | null;
  respect: number | null;
  transaction: number | null;
  user_attention: number | null;
  received_count: number | null;
}

export interface UserLocation {
  address: string | null;
  district: string | null;
  city: string | null;
  label: string | null;
  lat: number | null;
  lng: number | null;
  zipcode: string | null;
  geo_source: string | null;
  geo_provider: string | null;
  region: string | null;
  region_label: string | null;
  department: string | null;
  department_label: string | null;
  country: string | null;
}

export interface Review {
  author_name: string | null;
  rating_value: number | null;
  text: string | null;
  review_time: string | null;
}

export interface Rating {
  rating_value: number | null;
  user_ratings_total: number | null;
  source: string | null;
  source_display: string | null;
  retrieval_time: string | null;
  url: string | null;
  reviews: Review[];
}

export interface Pro {
  online_store_id: number | null;
  online_store_name: string | null;
  activity_sector_id: number | null;
  activity_sector: string | null;
  category_id: number | null;
  siren: string | null;
  siret: string | null;
  store_id: number | null;
  active_since: string | null;
  location: UserLocation;
  logo: string | null;
  cover: string | null;
  slogan: string | null;
  description: string | null;
  opening_hours: string | null;
  website_url: string | null;
  rating: Rating;
}

export interface User {
  id: string | null;
  name: string | null;
  registered_at: string | null;
  location: string | null;
  feedback: Feedback;
  profile_picture: string | null;
  reply: Reply;
  presence: Presence;
  badges: Badge[];
  total_ads: number | null;
  store_id: number | null;
  account_type: string | null;
  description: string | null;
  pro: Pro | null;
  is_pro: boolean;
}

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
