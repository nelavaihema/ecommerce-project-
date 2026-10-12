export type SizeGuideKey = "tops" | "bottoms" | "dresses"

/** Body measurements in inches. Shown in the size guide drawer on the product page. */
export const SIZE_GUIDES: Record<
  SizeGuideKey,
  { title: string; columns: string[]; rows: string[][]; tip: string }
> = {
  tops: {
    title: "Tops, T-shirts, Shirts & Jackets",
    columns: ["Size", "Chest", "Length", "Shoulder"],
    rows: [
      ["XS", "34-36", "26", "16.5"],
      ["S", "36-38", "27", "17"],
      ["M", "38-40", "28", "18"],
      ["L", "40-42", "29", "19"],
      ["XL", "42-44", "30", "20"],
      ["XXL", "44-46", "31", "21"],
    ],
    tip: "Oversized styles are cut roomy on purpose. Between sizes? Size down for a regular fit.",
  },
  bottoms: {
    title: "Jeans & Pants",
    columns: ["Waist", "Waist (in)", "Hip (in)", "Inseam (in)"],
    rows: [
      ["28", "28-29", "36", "30"],
      ["30", "30-31", "38", "31"],
      ["32", "32-33", "40", "31"],
      ["34", "34-35", "42", "32"],
      ["36", "36-37", "44", "32"],
    ],
    tip: "Measure around your natural waist, keeping the tape comfortably loose.",
  },
  dresses: {
    title: "Dresses, Kurtis & Co-ords",
    columns: ["Size", "Bust", "Waist", "Hip"],
    rows: [
      ["XS", "32", "26", "35"],
      ["S", "34", "28", "37"],
      ["M", "36", "30", "39"],
      ["L", "38", "32", "41"],
      ["XL", "40", "34", "43"],
    ],
    tip: "If your bust and hip fall in different sizes, choose by the larger measurement.",
  },
}

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
]
