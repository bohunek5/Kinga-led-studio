
export enum AspectRatio {
  SQUARE = "1:1",
  LANDSCAPE = "16:9",
  PORTRAIT = "9:16"
}

export enum CameraLens {
  WIDE = "Szeroki kąt (16-24mm)",
  STANDARD = "Standard (35-50mm)",
  MACRO = "Detal / Macro (85mm+)",
  ARCH = "Architektoniczny (Tilt-Shift)",
  CINEMATIC = "Cinematic (35mm, f/1.4)"
}

export enum RealismLevel {
  ULTRA = "Ultra Realistyczne Zdjęcie",
  INSTAGRAM = "Realistyczne (wygładzone)",
  RENDER = "Render 3D / Wizualizacja",
  ARTISTIC = "Ilustracja / Stylizowane"
}

export enum VisualStyle {
  MODERN_PREMIUM = "Nowoczesne wnętrze premium",
  MINIMAL_SCANDI = "Minimalistyczne / Skandynawskie",
  LOFT_INDUSTRIAL = "Loft / Industrial",
  LUXURY_HOTEL = "Luksusowy hotel / Lobby",
  RETAIL = "Sklep / Retail / Witryna",
  OFFICE = "Biuro nowoczesne",
  EXTERIOR_NIGHT = "Elewacja nocą",
  GAMING = "Gaming / Neon / Cyberpunk",
  CATALOG = "Katalogowy (czysto techniczny)",
  LIFESTYLE = "Lifestyle (żywe wnętrze)",
  DARK_NOIR = "Dark Noir / Moody (Mroczne)",
  FUTURISTIC = "Futurystyczne / Sci-Fi",
  SPA_WELLNESS = "Spa / Wellness (Relaks)",
  MUSEUM = "Muzeum / Galeria sztuki",
  CLUB_EVENT = "Klub muzyczny / Event",
  GARDEN_LANDSCAPE = "Ogród / Taras nocą",
  KITCHEN_PRO = "Kuchnia profesjonalna",
  AUTOMOTIVE = "Garaż / Showroom samochodowy",
  HOME_THEATER = "Kino domowe (Dark Room)",
  GLAMOUR = "Glamour / Fashion"
}

export interface FormData {
  scene: string;
  lightLocation: string;
  lightType: string;
  lightCharacter: string[];
  lens: string;
  detailLevel: number;
  dominantColor: string;
  realism: string;
  style: string;
  hardwareVisibility: 'light_only' | 'visible_profile' | 'visible_fixture';
  peoplePresence: 'none' | 'background' | 'center';
  contrastLevel: number;
  usage: string;
  additionalNotes: string; // Nowe pole
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  prompt: string;
  images: Record<string, string>; // Map of AspectRatio -> base64
  formData: FormData;
}
