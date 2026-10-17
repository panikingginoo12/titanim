export type Light = 'full-sun' | 'bright-indirect' | 'medium' | 'low';
export type Humidity = 'low' | 'medium' | 'high';
export type Category = 'foliage' | 'flowering' | 'succulent' | 'fern' | 'edible';

export type CareProfile = {
  /** Typical days between waterings in a warm Philippine home. Always check the soil first. */
  waterEveryDays: number;
  /** Days between feeding with diluted fertilizer; null if it rarely needs it. */
  fertilizeEveryDays: number | null;
  light: Light;
  humidity: Humidity;
  /** true = toxic to cats/dogs, false = generally considered safe, null = not sure. */
  toxicToPets: boolean | null;
  tips: string[];
};

export type Species = {
  id: string;
  scientificName: string;
  /** First name is the display name. Tagalog names are included for search. */
  commonNames: string[];
  category: Category;
  care: CareProfile;
};

type Row = [
  id: string,
  scientificName: string,
  commonNames: string[],
  category: Category,
  water: number,
  fertilize: number | null,
  light: Light,
  humidity: Humidity,
  toxic: boolean | null,
  tips: string[],
];

// General care guidance for common plants kept by Filipino plantitos and plantitas.
// These are starting points, not rules: pots, soil, and weather change how fast plants dry out.
const rows: Row[] = [
  // Foliage
  ['monstera-deliciosa', 'Monstera deliciosa', ['Monstera', 'Swiss cheese plant'], 'foliage', 7, 30, 'bright-indirect', 'medium', true,
    ['Let the top 3–5 cm of soil dry before watering.', 'Give it a moss pole so the leaves grow bigger and more split.']],
  ['epipremnum-aureum', 'Epipremnum aureum', ['Pothos', 'Golden pothos', 'Devil\'s ivy'], 'foliage', 7, 30, 'medium', 'medium', true,
    ['Drooping leaves usually mean it is thirsty.', 'Trim long vines and root the cuttings in water.']],
  ['dracaena-trifasciata', 'Dracaena trifasciata', ['Snake plant', 'Sansevieria', 'Dila-dila', 'Espada'], 'foliage', 14, 60, 'medium', 'low', true,
    ['Overwatering is the most common way to kill it. When in doubt, wait.', 'Handles low light but grows faster near a bright window.']],
  ['zamioculcas-zamiifolia', 'Zamioculcas zamiifolia', ['ZZ plant', 'Zanzibar gem'], 'foliage', 14, 60, 'low', 'low', true,
    ['Its thick rhizomes store water, so water only when the soil is fully dry.', 'Yellow leaves often mean too much water.']],
  ['aglaonema', 'Aglaonema commutatum', ['Aglaonema', 'Chinese evergreen'], 'foliage', 6, 30, 'medium', 'medium', true,
    ['Red and pink varieties need brighter light to keep their color.', 'Keep away from cold aircon drafts.']],
  ['philodendron-hederaceum', 'Philodendron hederaceum', ['Philodendron', 'Heartleaf philodendron'], 'foliage', 7, 30, 'medium', 'medium', true,
    ['Water when the top few centimeters are dry.', 'Pinch the tips to make it bushier.']],
  ['goeppertia', 'Goeppertia insignis', ['Calathea', 'Prayer plant', 'Rattlesnake plant'], 'foliage', 4, 30, 'medium', 'high', false,
    ['Keep the soil lightly moist, never soggy.', 'Crispy edges mean low humidity or hard water. Rainwater helps.']],
  ['anthurium-andraeanum', 'Anthurium andraeanum', ['Anthurium', 'Flamingo flower', 'Buntot-paboreal'], 'foliage', 5, 30, 'bright-indirect', 'high', true,
    ['Use a chunky, fast-draining mix.', 'More bright, indirect light means more blooms.']],
  ['spathiphyllum', 'Spathiphyllum wallisii', ['Peace lily'], 'foliage', 5, 30, 'medium', 'high', true,
    ['It droops dramatically when thirsty and perks up after watering.', 'Wipe the leaves so they can take in light.']],
  ['chlorophytum-comosum', 'Chlorophytum comosum', ['Spider plant'], 'foliage', 5, 30, 'bright-indirect', 'medium', false,
    ['Brown tips can come from tap water. Let water sit overnight first.', 'Plant the baby "spiderettes" to make new plants.']],
  ['alocasia-macrorrhizos', 'Alocasia macrorrhizos', ['Alocasia', 'Elephant ear', 'Biga'], 'foliage', 4, 30, 'bright-indirect', 'high', true,
    ['Losing an old leaf when a new one opens is normal.', 'Watch for spider mites under the leaves.']],
  ['caladium-bicolor', 'Caladium bicolor', ['Caladium', 'Corazon de Maria'], 'foliage', 4, 30, 'bright-indirect', 'high', true,
    ['Keep the soil evenly moist while it is growing.', 'It may go dormant in the dry season. Let the bulb rest.']],
  ['ficus-lyrata', 'Ficus lyrata', ['Fiddle-leaf fig'], 'foliage', 7, 30, 'bright-indirect', 'medium', true,
    ['Pick a bright spot and avoid moving it around.', 'Water deeply, then let the top half of the soil dry.']],
  ['ficus-elastica', 'Ficus elastica', ['Rubber plant', 'Goma'], 'foliage', 7, 30, 'bright-indirect', 'medium', true,
    ['Wipe the big leaves with a damp cloth.', 'The sap can irritate skin. Wear gloves when pruning.']],
  ['syngonium-podophyllum', 'Syngonium podophyllum', ['Syngonium', 'Arrowhead plant'], 'foliage', 5, 30, 'medium', 'medium', true,
    ['Trim climbing stems to keep the arrowhead leaf shape.', 'Likes slightly moist soil.']],
  ['dieffenbachia', 'Dieffenbachia seguine', ['Dieffenbachia', 'Dumb cane'], 'foliage', 6, 30, 'medium', 'medium', true,
    ['The sap is irritating. Keep away from kids and pets.', 'Rotate it so it does not lean toward the window.']],
  ['dracaena-fragrans', 'Dracaena fragrans', ['Fortune plant', 'Mais-mais', 'Corn plant'], 'foliage', 7, 45, 'medium', 'medium', true,
    ['Brown tips often come from fluoride in tap water.', 'Let the top of the soil dry between waterings.']],
  ['codiaeum-variegatum', 'Codiaeum variegatum', ['Croton', 'San Francisco'], 'foliage', 4, 30, 'full-sun', 'medium', true,
    ['More sun means brighter leaf colors.', 'It sulks and drops leaves after being moved. Give it time.']],
  ['cordyline-fruticosa', 'Cordyline fruticosa', ['Ti plant', 'Baston ni San Jose'], 'foliage', 4, 30, 'bright-indirect', 'medium', true,
    ['Easy to grow from stem cuttings.', 'Keep the soil lightly moist in hot months.']],
  ['tradescantia-zebrina', 'Tradescantia zebrina', ['Wandering dude', 'Inch plant'], 'foliage', 4, 30, 'bright-indirect', 'medium', true,
    ['Pinch it often to keep it full.', 'Cuttings root fast in water.']],
  ['dracaena-sanderiana', 'Dracaena sanderiana', ['Lucky bamboo'], 'foliage', 7, null, 'medium', 'medium', true,
    ['If grown in water, change the water every week.', 'Keep it out of harsh direct sun.']],
  ['schefflera-arboricola', 'Schefflera arboricola', ['Umbrella plant', 'Schefflera'], 'foliage', 7, 30, 'bright-indirect', 'medium', true,
    ['Prune to control height and shape.', 'Let the top of the soil dry between waterings.']],
  ['peperomia-obtusifolia', 'Peperomia obtusifolia', ['Peperomia', 'Baby rubber plant'], 'foliage', 7, 45, 'medium', 'medium', false,
    ['Its thick leaves store water. Do not overwater.', 'Small pot, fast-draining mix.']],

  // Ferns
  ['nephrolepis-exaltata', 'Nephrolepis exaltata', ['Boston fern', 'Pako'], 'fern', 3, 30, 'medium', 'high', false,
    ['Never let it dry out completely.', 'Hang it where it gets morning light.']],
  ['asplenium-nidus', 'Asplenium nidus', ['Bird\'s nest fern', 'Pakpak-lawin'], 'fern', 4, 30, 'medium', 'high', false,
    ['Water the soil, not the center "nest", to avoid rot.', 'Loves humid spots like a shaded garden.']],
  ['platycerium', 'Platycerium bifurcatum', ['Staghorn fern', 'Sungay-usa'], 'fern', 7, 60, 'bright-indirect', 'high', false,
    ['Soak the mount when the moss feels light and dry.', 'The brown shield fronds at the base are normal. Do not remove them.']],

  // Flowering
  ['bougainvillea', 'Bougainvillea spectabilis', ['Bougainvillea', 'Bogambilya'], 'flowering', 5, 30, 'full-sun', 'low', false,
    ['It blooms more when kept a little dry.', 'Prune after a flowering flush to get more blooms.']],
  ['jasminum-sambac', 'Jasminum sambac', ['Sampaguita', 'Arabian jasmine'], 'flowering', 3, 30, 'full-sun', 'medium', false,
    ['Needs at least 4–6 hours of sun to flower well.', 'Feed during the growing months for more blooms.']],
  ['hibiscus-rosa-sinensis', 'Hibiscus rosa-sinensis', ['Gumamela', 'Hibiscus'], 'flowering', 3, 30, 'full-sun', 'medium', false,
    ['Water often in hot weather. Dropped buds can mean thirst.', 'Check under the leaves for mealybugs and aphids.']],
  ['ixora-coccinea', 'Ixora coccinea', ['Santan', 'Ixora'], 'flowering', 3, 30, 'full-sun', 'medium', false,
    ['Yellow leaves with green veins can mean it needs iron or acidic soil.', 'Trim lightly after blooming.']],
  ['phalaenopsis', 'Phalaenopsis amabilis', ['Moth orchid', 'Phalaenopsis', 'Mariposa'], 'flowering', 7, 14, 'bright-indirect', 'high', false,
    ['Water when the roots turn silvery, then drain well.', 'Use weak orchid fertilizer, "weakly, weekly" or every two weeks.']],
  ['dendrobium', 'Dendrobium', ['Dendrobium orchid'], 'flowering', 4, 14, 'bright-indirect', 'high', false,
    ['Bright light and good airflow help it bloom.', 'Let the medium dry slightly between waterings.']],
  ['vanda', 'Vanda', ['Vanda orchid'], 'flowering', 2, 14, 'bright-indirect', 'high', false,
    ['Bare-root vandas need roots soaked or misted daily in hot weather.', 'Give plenty of bright light.']],
  ['euphorbia-milii', 'Euphorbia milii', ['Crown of thorns', 'Koronang tinik'], 'flowering', 10, 30, 'full-sun', 'low', true,
    ['The milky sap is irritating. Wear gloves.', 'Very drought-tolerant. Let the soil dry fully.']],
  ['adenium-obesum', 'Adenium obesum', ['Desert rose', 'Adenium'], 'flowering', 7, 30, 'full-sun', 'low', true,
    ['Keep it dry during long rainy spells.', 'Its sap is toxic. Keep away from pets.']],
  ['portulaca-grandiflora', 'Portulaca grandiflora', ['Portulaca', 'Moss rose'], 'flowering', 4, 30, 'full-sun', 'low', true,
    ['Flowers open in full sun and close on cloudy days.', 'Easy to grow from cuttings.']],
  ['catharanthus-roseus', 'Catharanthus roseus', ['Periwinkle', 'Tsitsirika'], 'flowering', 4, 30, 'full-sun', 'low', true,
    ['Tough and drought-tolerant once established.', 'All parts are toxic if eaten.']],
  ['rosa', 'Rosa', ['Rose', 'Rosas'], 'flowering', 2, 14, 'full-sun', 'medium', false,
    ['Water at the base in the morning to avoid leaf spots.', 'Remove spent flowers to encourage new buds.']],

  // Succulents
  ['aloe-vera', 'Aloe vera', ['Aloe vera', 'Sabila'], 'succulent', 14, 60, 'full-sun', 'low', true,
    ['Use a gritty, fast-draining mix and a pot with holes.', 'Keep it out of heavy rain.']],
  ['echeveria', 'Echeveria elegans', ['Echeveria', 'Mexican snowball'], 'succulent', 10, 60, 'full-sun', 'low', false,
    ['Stretching means it needs more sun.', 'Water the soil, not the rosette.']],
  ['crassula-ovata', 'Crassula ovata', ['Jade plant'], 'succulent', 14, 60, 'full-sun', 'low', true,
    ['Wrinkled leaves mean it is thirsty.', 'Easy to grow from a single leaf.']],
  ['haworthiopsis', 'Haworthiopsis fasciata', ['Haworthia', 'Zebra plant'], 'succulent', 14, 60, 'bright-indirect', 'low', false,
    ['Prefers bright shade over harsh afternoon sun.', 'Let the soil dry completely.']],

  // Edible garden
  ['moringa-oleifera', 'Moringa oleifera', ['Malunggay', 'Moringa'], 'edible', 3, 45, 'full-sun', 'low', false,
    ['Prune often to keep it bushy and easy to harvest.', 'Grows easily from thick stem cuttings.']],
  ['capsicum-frutescens', 'Capsicum frutescens', ['Siling labuyo', 'Bird\'s eye chili'], 'edible', 2, 14, 'full-sun', 'medium', false,
    ['Water regularly when it is flowering and fruiting.', 'Pick ripe chilies often to get more.']],
  ['capsicum-annuum', 'Capsicum annuum', ['Siling haba', 'Siling pang-sigang', 'Chili pepper'], 'edible', 2, 14, 'full-sun', 'medium', false,
    ['Needs full sun and steady watering.', 'Support heavy plants with a stick.']],
  ['citrus-microcarpa', 'Citrus × microcarpa', ['Calamansi', 'Kalamansi'], 'edible', 3, 30, 'full-sun', 'medium', true,
    ['Feed regularly. Yellow leaves can mean it is hungry.', 'Watch for leaf miners and scale insects.']],
  ['ipomoea-aquatica', 'Ipomoea aquatica', ['Kangkong', 'Water spinach'], 'edible', 1, 14, 'full-sun', 'high', false,
    ['Keep the soil wet. It can even grow in water.', 'Cut the tops to harvest and it regrows.']],
  ['solanum-lycopersicum', 'Solanum lycopersicum', ['Kamatis', 'Tomato'], 'edible', 2, 14, 'full-sun', 'medium', true,
    ['Water deeply and evenly to prevent cracked fruit.', 'Stake or cage the plant as it grows.']],
  ['solanum-melongena', 'Solanum melongena', ['Talong', 'Eggplant'], 'edible', 2, 14, 'full-sun', 'medium', true,
    ['Needs lots of sun and regular feeding.', 'Check for fruit borers on young fruit.']],
  ['momordica-charantia', 'Momordica charantia', ['Ampalaya', 'Bitter gourd'], 'edible', 2, 14, 'full-sun', 'medium', null,
    ['Give it a trellis to climb.', 'Harvest while the fruit is still green.']],
  ['ocimum-basilicum', 'Ocimum basilicum', ['Basil', 'Balanoy'], 'edible', 2, 30, 'full-sun', 'medium', false,
    ['Pinch off flower buds to keep the leaves tasty.', 'Harvest from the top to make it bushy.']],
  ['plectranthus-amboinicus', 'Coleus amboinicus', ['Oregano', 'Cuban oregano', 'Suganda'], 'edible', 4, 45, 'full-sun', 'low', null,
    ['Let the soil dry a bit. It rots if kept wet.', 'Grows easily from cuttings.']],
  ['cymbopogon-citratus', 'Cymbopogon citratus', ['Tanglad', 'Lemongrass'], 'edible', 3, 45, 'full-sun', 'medium', true,
    ['Divide big clumps to make more plants.', 'Cut the stalks near the base to harvest.']],
  ['mentha', 'Mentha × villosa', ['Yerba buena', 'Mint'], 'edible', 2, 30, 'bright-indirect', 'medium', true,
    ['Keep the soil moist. It spreads fast, so a pot is best.', 'Harvest often to keep it from flowering.']],
  ['allium-fistulosum', 'Allium fistulosum', ['Dahon ng sibuyas', 'Spring onion', 'Green onion'], 'edible', 2, 30, 'full-sun', 'medium', true,
    ['Replant the white roots from store-bought onions.', 'Snip the leaves and it keeps growing.']],
  ['pandanus-amaryllifolius', 'Pandanus amaryllifolius', ['Pandan'], 'edible', 3, 45, 'bright-indirect', 'medium', null,
    ['Likes moist soil and partial shade.', 'Plant the side shoots to make new plants.']],
];

export const SPECIES: Species[] = rows.map(
  ([id, scientificName, commonNames, category, water, fertilize, light, humidity, toxic, tips]) => ({
    id,
    scientificName,
    commonNames,
    category,
    care: { waterEveryDays: water, fertilizeEveryDays: fertilize, light, humidity, toxicToPets: toxic, tips },
  }),
);

const byId = new Map(SPECIES.map((s) => [s.id, s]));

export function getSpecies(id: string | null | undefined): Species | undefined {
  return id ? byId.get(id) : undefined;
}

export const LIGHT_LABEL: Record<Light, string> = {
  'full-sun': 'Full sun',
  'bright-indirect': 'Bright, indirect light',
  medium: 'Medium light',
  low: 'Low light OK',
};

export const HUMIDITY_LABEL: Record<Humidity, string> = {
  low: 'Low humidity is fine',
  medium: 'Average humidity',
  high: 'Likes high humidity',
};

export const CATEGORY_LABEL: Record<Category, string> = {
  foliage: 'Foliage',
  flowering: 'Flowering',
  succulent: 'Succulents',
  fern: 'Ferns',
  edible: 'Edible garden',
};
