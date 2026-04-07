/**
 * City configuration for Full Body Checkup city-specific landing pages.
 * Used by /full-body-checkup/[city]/page.tsx and sitemap.ts
 */

export interface CityData {
  name: string;
  slug: string;
  state: string;
  lat: number;
  lng: number;
  /** Short, unique SEO description for this city's landing page (2–3 sentences). */
  description: string;
  /** Unique opening blurb for the page body — city-specific content for thin-content avoidance */
  bodyBlurb: string;
  /** Approximate delivery time note */
  deliveryNote?: string;
}

export const CITIES: CityData[] = [
  {
    name: "Delhi",
    slug: "delhi",
    state: "Delhi",
    lat: 28.6139,
    lng: 77.209,
    description:
      "Book full body checkup in Delhi with free home sample collection from Thyrocare-certified phlebotomists. Available across all major Delhi NCR pin codes.",
    bodyBlurb:
      "Delhi NCR, home to over 30 million residents, has one of India's highest rates of lifestyle diseases — including diabetes (prevalence ~25%), hypertension, and Vitamin D deficiency due to indoor office lifestyles and air pollution. An annual full body checkup is particularly important for Delhi residents. Ayropath covers all major Delhi NCR zones: South Delhi, North Delhi, East Delhi, Dwarka, Rohini, Noida, Gurugram, Faridabad, and Ghaziabad.",
    deliveryNote: "Reports delivered within 24 hours for most Delhi NCR bookings.",
  },
  {
    name: "Mumbai",
    slug: "mumbai",
    state: "Maharashtra",
    lat: 19.076,
    lng: 72.8777,
    description:
      "Book full body checkup in Mumbai with Thyrocare home sample collection. Covers Mumbai City, Western Suburbs, Thane, Navi Mumbai, and Pune Metro.",
    bodyBlurb:
      "Mumbai's fast-paced lifestyle and high pollution levels make preventive health screening essential. With sedentary desk jobs, irregular meal timings, and stress-related conditions prevalent across the city, a comprehensive full body checkup helps Mumbaikars catch thyroid disorders, lipid imbalances, and diabetes early. Ayropath covers all Mumbai zones: Andheri, Bandra, Borivali, Dadar, Kurla, Thane, Navi Mumbai, and Vasai-Virar.",
    deliveryNote: "Reports delivered within 24–48 hours for Mumbai bookings.",
  },
  {
    name: "Bengaluru",
    slug: "bengaluru",
    state: "Karnataka",
    lat: 12.9716,
    lng: 77.5946,
    description:
      "Book full body checkup in Bengaluru with Thyrocare free home collection. Covers IT hubs: Whitefield, Electronic City, HSR Layout, Koramangala.",
    bodyBlurb:
      "Bengaluru's booming IT sector workforce — often working 10–14 hour desk shifts — is among India's most at-risk groups for Vitamin D deficiency, metabolic syndrome, and stress-related cardiac issues. Preventive full body checkups are especially recommended for software professionals over 28. Ayropath covers all Bengaluru zones: Whitefield, Electronic City, HSR Layout, Koramangala, Indiranagar, Jayanagar, Malleshwaram, Yelahanka, and Sarjapur Road.",
    deliveryNote: "Reports delivered in 24–48 hours for most Bengaluru areas.",
  },
  {
    name: "Hyderabad",
    slug: "hyderabad",
    state: "Telangana",
    lat: 17.385,
    lng: 78.4867,
    description:
      "Book full body checkup in Hyderabad with free Thyrocare home collection. Covers HITEC City, Gachibowli, Secunderabad, and all major areas.",
    bodyBlurb:
      "Hyderabad, Telangana's capital and a major pharmaceutical and IT hub, has seen a surge in lifestyle diseases among its young working population. The high-carbohydrate diet common in the region makes diabetes screening and HbA1c testing especially important. Ayropath covers all Hyderabad zones: HITEC City, Gachibowli, Jubilee Hills, Banjara Hills, Secunderabad, Kukatpally, Miyapur, and LB Nagar.",
    deliveryNote: "Reports delivered within 24–48 hours for Hyderabad bookings.",
  },
  {
    name: "Chennai",
    slug: "chennai",
    state: "Tamil Nadu",
    lat: 13.0827,
    lng: 80.2707,
    description:
      "Book full body checkup in Chennai with Thyrocare free home sample collection. Covers T. Nagar, Anna Nagar, Velachery, OMR, and all city zones.",
    bodyBlurb:
      "Chennai's high humidity and coastal climate, combined with a rapidly growing IT corridor along OMR and Old Mahabalipuram Road, has made preventive health screening a growing priority. Tamil Nadu has one of the highest rates of diabetes and hypertension in south India. Ayropath covers all Chennai zones: T. Nagar, Adyar, Velachery, Anna Nagar, OMR, Sholinganallur, Porur, Ambattur, and Chromepet.",
    deliveryNote: "Reports in 24–48 hours for Chennai bookings.",
  },
  {
    name: "Pune",
    slug: "pune",
    state: "Maharashtra",
    lat: 18.5204,
    lng: 73.8567,
    description:
      "Book full body checkup in Pune with Thyrocare free home collection. Covers Hinjewadi, Kothrud, Baner, Wakad, and Pune Metro area.",
    bodyBlurb:
      "Pune, Maharashtra's second-largest city and a rapidly growing IT and education hub, has a young demographic that often overlooks preventive healthcare. With a large student and working population aged 22–35, conditions like Vitamin D deficiency, thyroid disorders, and anaemia are common but undiagnosed. Ayropath covers central and suburban Pune: Hinjewadi, Baner, Wakad, Kothrud, Shivajinagar, Viman Nagar, Hadapsar, and PCMC.",
    deliveryNote: "Reports delivered in 24–48 hours for Pune bookings.",
  },
  {
    name: "Kolkata",
    slug: "kolkata",
    state: "West Bengal",
    lat: 22.5726,
    lng: 88.3639,
    description:
      "Book full body checkup in Kolkata with free Thyrocare home sample collection. Covers Salt Lake, Howrah, Durgapur, and Kolkata Metro.",
    bodyBlurb:
      "Kolkata, historically known for rich culinary traditions high in refined carbohydrates and oil, has a high prevalence of diabetes, hypertensive heart disease, and thyroid disorders — particularly hypothyroidism in women. Preventive screening is strongly recommended by ICMR for adults above 30 in Eastern India. Ayropath covers the Kolkata Metro area: Salt Lake City, New Town, Howrah, Dum Dum, Jadavpur, Behala, and Baguiati.",
    deliveryNote: "Reports in 24–48 hours for Kolkata bookings.",
  },
  {
    name: "Ahmedabad",
    slug: "ahmedabad",
    state: "Gujarat",
    lat: 23.0225,
    lng: 72.5714,
    description:
      "Book full body checkup in Ahmedabad with Thyrocare home collection. Covers SG Highway, Navrangpura, Satellite, Anand, and Gandhinagar.",
    bodyBlurb:
      "Gujarat, with Ahmedabad as its commercial capital, has a notably high prevalence of type 2 diabetes among its Gujarati Hindu and Jain communities — a pattern attributed to a predominantly vegetarian diet high in ghee and sugar. Routine annual health checkups, particularly for lipid profile, HbA1c, and Vitamin B12 (common deficiency in vegetarians), are strongly recommended. Ayropath covers Ahmedabad and the surrounding BRTS and metro zones.",
  },
  {
    name: "Jaipur",
    slug: "jaipur",
    state: "Rajasthan",
    lat: 26.9124,
    lng: 75.7873,
    description:
      "Book full body checkup in Jaipur with Thyrocare home sample collection. Covers all zones including Malviya Nagar, Vaishali Nagar, and C-Scheme.",
    bodyBlurb:
      "Jaipur, Rajasthan's capital, combines a growing urban middle class with a high-fat Rajasthani diet — creating elevated cardiovascular risk factors in the population. Lipid profile testing, cardiac biomarkers, and thyroid screening are among the most recommended tests for Jaipur residents above 35. Ayropath provides pan-Jaipur full body checkup home collection service across Malviya Nagar, Vaishali Nagar, Mansarovar, C-Scheme, and Jagatpura.",
  },
  {
    name: "Lucknow",
    slug: "lucknow",
    state: "Uttar Pradesh",
    lat: 26.8467,
    lng: 80.9462,
    description:
      "Book full body checkup in Lucknow with Thyrocare free home collection. Covers Gomti Nagar, Hazratganj, Aliganj, Indira Nagar, and LDA Colony.",
    bodyBlurb:
      "Lucknow, Uttar Pradesh's state capital, has one of North India's fastest-growing middle-class populations. Rising awareness of preventive healthcare, combined with affordable Thyrocare packages, has made full body checkups increasingly accessible to Lucknow residents. Common conditions detected through routine screening include anaemia, hypothyroidism, and early-stage diabetes. Ayropath covers Gomti Nagar, Hazratganj, Alambagh, Aliganj, Indira Nagar, and Vikas Nagar.",
  },
  {
    name: "Ranchi",
    slug: "ranchi",
    state: "Jharkhand",
    lat: 23.3441,
    lng: 85.3096,
    description:
      "Book full body checkup in Ranchi with Thyrocare free home sample collection. Covers Harmu, Lalpur, Doranda, Kanke Road, and all major Ranchi areas.",
    bodyBlurb:
      "Ranchi, the capital of Jharkhand and a rapidly urbanising city, has seen a sharp rise in lifestyle diseases driven by changing dietary habits and sedentary work patterns. Anaemia — particularly among women and adolescents — and Vitamin D deficiency are among the most commonly detected conditions in routine health screenings across Jharkhand. With limited access to large multi-specialty hospitals, preventive diagnostics through Ayropath's Thyrocare-backed home collection service offer Ranchi residents a convenient and affordable alternative. Ayropath covers Harmu, Lalpur, Doranda, Kanke Road, Bariatu, Morabadi, and Namkum.",
    deliveryNote: "Reports delivered within 24–48 hours for Ranchi bookings.",
  },
  {
    name: "Jamshedpur",
    slug: "jamshedpur",
    state: "Jharkhand",
    lat: 22.8046,
    lng: 86.2029,
    description:
      "Book full body checkup in Jamshedpur with Thyrocare free home collection. Covers Bistupur, Sakchi, Adityapur, Telco, and surrounding steel city areas.",
    bodyBlurb:
      "Jamshedpur, India's steel city and one of Jharkhand's most industrialised urban centres, has a large workforce population with high occupational health risks including cardiovascular disease, respiratory conditions, and heavy metal exposure. Routine full body checkups — including liver function tests, CBC, and lipid profiles — are particularly recommended for workers in the manufacturing and industrial sectors. Ayropath brings Thyrocare's NABL-accredited diagnostic services to Jamshedpur through hassle-free home sample collection. Coverage areas include Bistupur, Sakchi, Adityapur, Telco, Kadma, Sonari, and Mango.",
    deliveryNote: "Reports delivered in 24–48 hours for Jamshedpur bookings.",
  },
];

export function getCityBySlug(slug: string): CityData | undefined {
  return CITIES.find((c) => c.slug === slug);
}
