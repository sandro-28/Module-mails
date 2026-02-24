export interface POI {
  id: string
  name: string
  lat: number
  lng: number
  category: 'monument' | 'church' | 'garden' | 'museum' | 'viewpoint' | 'street'
  emoji: string
  shortDescription: string
  fullDescription: string
  funFact: string
  yearBuilt?: string
  tip?: string
}

export const PRAGUE_CASTLE_CENTER = {
  lat: 50.0909,
  lng: 14.4013,
}

export const PRAGUE_POIS: POI[] = [
  {
    id: 'cathedral-st-vitus',
    name: 'Cathédrale Saint-Guy',
    lat: 50.0909,
    lng: 14.4006,
    category: 'church',
    emoji: '⛪',
    shortDescription: 'Le joyau gothique du château',
    fullDescription:
      "Vous vous trouvez devant la majestueuse Cathédrale Saint-Guy (Katedrála sv. Víta), le plus grand et le plus important édifice religieux de la République tchèque. Sa construction a débuté en 1344 sous le règne de Charles IV et n'a été achevée qu'en 1929 — près de 600 ans de travaux ! Les flèches gothiques s'élèvent à 96 mètres au-dessus de vous. À l'intérieur, ne manquez pas les vitraux Art Nouveau d'Alfons Mucha et la chapelle Saint-Venceslas ornée de pierres semi-précieuses. C'est ici que les rois de Bohême étaient couronnés et que reposent les joyaux de la couronne tchèque.",
    funFact:
      "La cathédrale abrite les joyaux de la couronne de Bohême, enfermés derrière une porte à 7 serrures — chaque clé est détenue par une personnalité différente, dont le président de la République !",
    yearBuilt: '1344-1929',
    tip: "Montez les 287 marches de la tour sud pour une vue panoramique époustouflante sur Prague.",
  },
  {
    id: 'old-royal-palace',
    name: 'Ancien Palais Royal',
    lat: 50.0905,
    lng: 14.4012,
    category: 'monument',
    emoji: '🏰',
    shortDescription: 'Siège historique du pouvoir',
    fullDescription:
      "Vous êtes à l'Ancien Palais Royal (Starý královský palác), résidence des princes et rois de Bohême du XIe au XVIe siècle. L'impressionnante Salle Vladislav, avec sa voûte en croisée d'ogives de style gothique tardif, mesure 62 mètres de long — c'était la plus grande salle profane d'Europe médiévale ! Les chevaliers y entraient même à cheval pour participer aux tournois intérieurs. C'est aussi de la fenêtre de la Chancellerie de Bohême qu'a eu lieu la célèbre Défenestration de Prague en 1618, déclenchant la Guerre de Trente Ans.",
    funFact:
      "La Salle Vladislav était si grande que des tournois de joute à cheval s'y déroulaient à l'intérieur. Les cavaliers entraient par l'escalier des Cavaliers, encore visible aujourd'hui.",
    yearBuilt: 'XIIe siècle',
    tip: "Cherchez la fenêtre de la Défenestration dans la Chancellerie de Bohême — un événement qui a changé l'histoire de l'Europe !",
  },
  {
    id: 'golden-lane',
    name: 'Ruelle d\'Or',
    lat: 50.0913,
    lng: 14.4038,
    category: 'street',
    emoji: '✨',
    shortDescription: 'La ruelle enchantée aux maisons colorées',
    fullDescription:
      "Bienvenue dans la Ruelle d'Or (Zlatá ulička), l'un des endroits les plus charmants et photographiés de Prague ! Cette minuscule ruelle bordée de petites maisons colorées du XVIe siècle était à l'origine habitée par les tireurs d'élite du château, puis par des orfèvres — d'où son nom. La légende raconte que des alchimistes y travaillaient pour transformer le plomb en or sur ordre de l'empereur Rodolphe II. Franz Kafka y a vécu au numéro 22, dans une petite maison bleue, entre 1916 et 1917, où il a écrit certaines de ses nouvelles.",
    funFact:
      "Franz Kafka a vécu et écrit dans la minuscule maison n°22 (la bleue). Il s'y réfugiait pour échapper au bruit de la ville et trouver l'inspiration.",
    yearBuilt: 'XVIe siècle',
    tip: "Visitez tôt le matin ou en fin de journée pour éviter la foule et profiter de la lumière magique sur les façades colorées.",
  },
  {
    id: 'st-george-basilica',
    name: 'Basilique Saint-Georges',
    lat: 50.0910,
    lng: 14.4020,
    category: 'church',
    emoji: '🕍',
    shortDescription: 'La plus ancienne église du château',
    fullDescription:
      "Vous êtes devant la Basilique Saint-Georges (Bazilika sv. Jiří), fondée en 920 — c'est le plus ancien édifice religieux conservé dans l'enceinte du château. Sa façade baroque rouge ocre, ajoutée au XVIIe siècle, cache un intérieur roman remarquablement préservé. L'atmosphère à l'intérieur est saisissante : les murs épais en pierre, les arcades romanes et la crypte vous transportent directement au Moyen Âge. La basilique abrite les tombeaux de la dynastie des Přemyslides et accueille aujourd'hui des concerts de musique classique à l'acoustique exceptionnelle.",
    funFact:
      "L'intérieur roman contraste totalement avec la façade baroque. C'est comme découvrir un secret médiéval derrière un masque du XVIIe siècle.",
    yearBuilt: '920',
    tip: "Si un concert est programmé, c'est une expérience magique — l'acoustique de 1100 ans est incomparable.",
  },
  {
    id: 'daliborka-tower',
    name: 'Tour Daliborka',
    lat: 50.0914,
    lng: 14.4043,
    category: 'monument',
    emoji: '🗼',
    shortDescription: 'La prison légendaire du château',
    fullDescription:
      "Vous vous trouvez à la Tour Daliborka, une tour de fortification construite en 1496 qui a longtemps servi de prison. Elle tire son nom de son premier prisonnier, le chevalier Dalibor de Kozojedy, emprisonné en 1498 pour avoir protégé des serfs en révolte. Selon la légende, Dalibor apprit à jouer du violon dans sa cellule, et sa musique était si belle que les habitants de Prague venaient l'écouter au pied de la tour. Cette histoire a inspiré l'opéra 'Dalibor' de Bedřich Smetana. Vous pouvez encore voir les instruments de torture et les cachots à l'intérieur.",
    funFact:
      "L'expression tchèque 'Nouze naučila Dalibora housti' (La nécessité a appris à Dalibor à jouer du violon) vient de cette légende et signifie que la difficulté nous pousse à développer de nouveaux talents.",
    yearBuilt: '1496',
    tip: "Descendez dans les cachots souterrains pour une expérience immersive assez frissonnante.",
  },
  {
    id: 'royal-garden',
    name: 'Jardin Royal',
    lat: 50.0932,
    lng: 14.4000,
    category: 'garden',
    emoji: '🌿',
    shortDescription: 'Un écrin de verdure Renaissance',
    fullDescription:
      "Vous entrez dans le Jardin Royal (Královská zahrada), créé en 1534 par Ferdinand Ier de Habsbourg. Ce magnifique jardin Renaissance est l'un des plus beaux espaces verts de Prague. Admirez le Belvédère de la Reine Anne (Královský letohrádek), chef-d'œuvre de l'architecture Renaissance italienne au nord des Alpes, avec ses délicates arcades. Devant se trouve la Fontaine Chantante, une fontaine en bronze dont les gouttes d'eau produisent un son mélodieux quand on se place tout près. Le jardin abrite des essences rares, dont des tulipes plantées ici avant même les Pays-Bas !",
    funFact:
      "La Fontaine Chantante doit son nom au son musical produit par les gouttes d'eau tombant dans le bassin en bronze. Placez votre oreille sous le bord pour entendre la mélodie !",
    yearBuilt: '1534',
    tip: "Mettez votre oreille sous le bord de la Fontaine Chantante — le son est vraiment magique.",
  },
  {
    id: 'lobkowicz-palace',
    name: 'Palais Lobkowicz',
    lat: 50.0905,
    lng: 14.4035,
    category: 'museum',
    emoji: '🎨',
    shortDescription: 'Art et musique dans un palais noble',
    fullDescription:
      "Vous êtes devant le Palais Lobkowicz, le seul bâtiment privé du complexe du Château de Prague. Propriété de la famille Lobkowicz depuis le XVIe siècle, il abrite une collection exceptionnelle : des peintures de Bruegel, Canaletto et Velázquez, des partitions originales annotées par Beethoven et Mozart, des instruments de musique anciens et des manuscrits rares. Beethoven a d'ailleurs dédié plusieurs œuvres aux princes Lobkowicz, dont les symphonies n°3 (Eroica) et n°5. Le palais propose aussi des concerts quotidiens dans une salle baroque somptueuse.",
    funFact:
      "Beethoven a dédié sa Symphonie n°3 'Héroïque' et sa Symphonie n°5 au prince Joseph Lobkowicz. Les partitions originales annotées de sa main sont exposées ici.",
    yearBuilt: 'XVIe siècle',
    tip: "Le concert de midi est un must — 30 minutes de musique classique dans un cadre baroque somptueux.",
  },
  {
    id: 'third-courtyard',
    name: 'Troisième Cour',
    lat: 50.0908,
    lng: 14.4010,
    category: 'monument',
    emoji: '🏛️',
    shortDescription: 'Le cœur monumental du château',
    fullDescription:
      "Vous êtes dans la Troisième Cour (Třetí nádvoří), le cœur historique du Château de Prague. Dominée par la façade sud de la Cathédrale Saint-Guy qui s'élève majestueusement, cette cour abrite aussi le monolithe en granit dédié aux victimes de la Première Guerre mondiale et la statue équestre de Saint-Georges, une copie en bronze d'un original de 1373 — l'une des plus anciennes statues équestres en plein air d'Europe centrale. Le pavement moderne en granit a été conçu par l'architecte slovène Jože Plečnik dans les années 1920.",
    funFact:
      "Sous vos pieds se trouvent les vestiges archéologiques de la ville originelle du IXe siècle. Des fouilles ont révélé des restes de l'église la plus ancienne de Bohême !",
    yearBuilt: 'IXe siècle',
    tip: "Observez le sol — les dalles de granit de Plečnik cachent des vestiges archéologiques millénaires en dessous.",
  },
  {
    id: 'first-courtyard',
    name: 'Première Cour — Cour d\'Honneur',
    lat: 50.0903,
    lng: 14.3984,
    category: 'monument',
    emoji: '💂',
    shortDescription: 'La relève de la garde',
    fullDescription:
      "Vous êtes dans la Première Cour (První nádvoří), aussi appelée Cour d'Honneur. C'est l'entrée principale du Château, flanquée de statues monumentales de Titans en combat datant de 1768. C'est ici que se déroule la célèbre Relève de la Garde, chaque heure de 7h à 20h, avec une cérémonie particulièrement spectaculaire à midi avec fanfare et échange de drapeaux. Le portail d'entrée avec sa grille en fer forgé doré offre une vue magistrale sur la ville en contrebas. Vous êtes au seuil du plus grand château fort ancien du monde (selon le Livre Guinness) !",
    funFact:
      "Le Château de Prague est inscrit au Livre Guinness des Records comme le plus grand château ancien du monde : 570 mètres de long et 130 mètres de large !",
    yearBuilt: '1768 (statues)',
    tip: "Soyez là à midi pour la grande relève de la garde avec orchestre — c'est le moment le plus spectaculaire.",
  },
  {
    id: 'south-gardens',
    name: 'Jardins du Sud',
    lat: 50.0894,
    lng: 14.4010,
    category: 'garden',
    emoji: '🌺',
    shortDescription: 'Terrasses avec vue panoramique',
    fullDescription:
      "Vous êtes dans les Jardins du Sud (Jižní zahrady), une série de terrasses en cascade qui longent le flanc sud du château. Ces jardins offrent les plus belles vues panoramiques sur Prague : les toits rouges de Malá Strana, les tours de la Vieille Ville, la Vltava qui serpente, et par temps clair, vous pouvez voir jusqu'aux collines de Bohême. Aménagés au XVIe siècle et redessinés par Plečnik dans les années 1920, ils combinent Renaissance, Baroque et Modernisme. Le Jardin sur le Rempart (Zahrada Na Valech) et le Jardin du Paradis (Rajská zahrada) sont des havres de paix.",
    funFact:
      "Depuis ces jardins, vous contemplez exactement la même vue que celle qui a inspiré des siècles d'artistes, de poètes et de musiciens, dont Mozart et Dvořák.",
    yearBuilt: 'XVIe siècle',
    tip: "C'est l'endroit idéal pour une pause photo — le coucher de soleil d'ici est inoubliable.",
  },
  {
    id: 'powder-tower',
    name: 'Tour Poudrière (Mihulka)',
    lat: 50.0917,
    lng: 14.3998,
    category: 'monument',
    emoji: '🔮',
    shortDescription: 'Le laboratoire secret des alchimistes',
    fullDescription:
      "Vous êtes à la Tour Poudrière (Prašná věž – Mihulka), construite à la fin du XVe siècle comme bastion de défense. Mais c'est sous le règne de l'empereur Rodolphe II (fin XVIe siècle) que cette tour a gagné sa réputation la plus fascinante : elle servait de laboratoire pour les alchimistes que l'empereur avait rassemblés à Prague. Ces savants-mystiques cherchaient la pierre philosophale et l'élixir de vie. Plus tard, la tour a servi d'entrepôt à poudre (d'où son nom), puis d'atelier pour les artisans du château. Aujourd'hui, elle abrite une exposition sur la garde du château.",
    funFact:
      "L'empereur Rodolphe II a transformé Prague en capitale de l'alchimie et de l'ésotérisme. Il a invité des savants de toute l'Europe, dont Tycho Brahe et Johannes Kepler !",
    yearBuilt: 'XVe siècle',
    tip: "Imaginez les alchimistes travaillant ici il y a 400 ans, cherchant à transformer le plomb en or dans cette même tour.",
  },
  {
    id: 'second-courtyard',
    name: 'Deuxième Cour',
    lat: 50.0906,
    lng: 14.3997,
    category: 'monument',
    emoji: '⛲',
    shortDescription: 'La fontaine baroque et la chapelle',
    fullDescription:
      "Vous êtes dans la Deuxième Cour (Druhé nádvoří), dominée par une splendide fontaine baroque du XVIIe siècle et un puits Renaissance recouvert d'une grille en fer forgé ouvragée. Cette cour abrite la Chapelle de la Sainte-Croix, qui contient le Trésor de la Cathédrale Saint-Guy — une collection d'objets liturgiques en or et pierres précieuses parmi les plus importantes d'Europe. C'est aussi ici que se trouvait l'extraordinaire 'cabinet de curiosités' de Rodolphe II, l'une des plus grandes collections d'art et d'objets rares de la Renaissance.",
    funFact:
      "Le 'cabinet de curiosités' de Rodolphe II contenait des milliers d'objets extraordinaires : tableaux de maîtres, automates, pierres magiques, cornes de licorne (en réalité des défenses de narval) et même un prétendu golem !",
    yearBuilt: 'XVIe-XVIIe siècle',
    tip: "Visitez la Chapelle de la Sainte-Croix pour voir le trésor — des objets liturgiques d'une richesse incroyable.",
  },
  {
    id: 'stag-moat',
    name: 'Fossé aux Cerfs',
    lat: 50.0928,
    lng: 14.4020,
    category: 'garden',
    emoji: '🦌',
    shortDescription: 'Ancien parc de chasse royal',
    fullDescription:
      "Vous êtes au Fossé aux Cerfs (Jelení příkop), un profond ravin naturel qui sépare le château des quartiers nord. Autrefois, ce fossé servait de réserve de chasse royale où les rois de Bohême élevaient des cerfs, des faisans et d'autres animaux — d'où son nom. Aujourd'hui, c'est un passage piéton verdoyant et paisible, un contraste saisissant avec l'agitation du château au-dessus. Le fossé relie le Jardin Royal aux jardins du château et offre une promenade ombragée sous les remparts. On y trouve encore un tunnel creusé dans la roche.",
    funFact:
      "Des cerfs y vivaient réellement jusqu'au XVIIIe siècle ! Le roi les chassait directement depuis le château, comme un safari privé en plein cœur de Prague.",
    yearBuilt: 'Naturel / aménagé au XVIe siècle',
    tip: "Un passage secret idéal pour une promenade au calme, loin de la foule du château.",
  },
  {
    id: 'belvedere',
    name: 'Belvédère de la Reine Anne',
    lat: 50.0938,
    lng: 14.4005,
    category: 'monument',
    emoji: '👑',
    shortDescription: 'Chef-d\'œuvre Renaissance pour une reine',
    fullDescription:
      "Vous admirez le Belvédère de la Reine Anne (Královský letohrádek), considéré comme le plus bel exemple d'architecture Renaissance italienne au nord des Alpes. Construit entre 1538 et 1563 par Ferdinand Ier comme cadeau pour son épouse bien-aimée, Anne Jagellon, cet élégant pavillon d'été possède une colonnade à arcades sur tout son pourtour. Sa toiture en cuivre inversée, en forme de coque de navire renversée, est unique en Europe. Le bâtiment accueille aujourd'hui des expositions d'art contemporain dans un cadre Renaissance sublime.",
    funFact:
      "Ferdinand Ier a fait construire ce belvédère par amour pour sa femme Anne. Tragiquement, elle est morte avant que le bâtiment ne soit terminé — il ne l'a jamais vu achevé avec elle.",
    yearBuilt: '1538-1563',
    tip: "Faites le tour complet de la colonnade pour admirer les reliefs sculptés représentant des scènes mythologiques.",
  },
  {
    id: 'black-tower',
    name: 'Tour Noire',
    lat: 50.0912,
    lng: 14.4048,
    category: 'viewpoint',
    emoji: '🌇',
    shortDescription: 'Porte orientale et panorama',
    fullDescription:
      "Vous êtes à la Tour Noire (Černá věž), la porte orientale du Château de Prague. Cette tour romane du XIIe siècle tire son nom de sa pierre noircie — probablement par un incendie historique. C'est l'une des plus anciennes structures du château encore debout. Depuis ce point, vous avez une vue spectaculaire sur les toits de Malá Strana en contrebas, les jardins en terrasses, et les clochers qui ponctuent le panorama. L'escalier en colimaçon qui descend vers la Vieille Escalier du Château (Staré zámecké schody) est l'une des sorties les plus pittoresques du complexe.",
    funFact:
      "L'escalier qui descend d'ici, le Staré zámecké schody, était l'ancienne route royale pour monter au château. Des générations de rois l'ont emprunté !",
    yearBuilt: 'XIIe siècle',
    tip: "Descendez par le vieil escalier du château pour rejoindre le métro Malostranská — c'est la sortie la plus pittoresque.",
  },
  {
    id: 'st-george-square',
    name: 'Place Saint-Georges',
    lat: 50.0909,
    lng: 14.4019,
    category: 'monument',
    emoji: '📍',
    shortDescription: 'Le carrefour historique du château',
    fullDescription:
      "Vous êtes sur la Place Saint-Georges (Náměstí U Svatého Jiří), le carrefour central de l'enceinte du château. D'ici, vous pouvez voir la Basilique Saint-Georges avec sa façade baroque rouge, l'entrée du Palais Royal, et le début de la Ruelle d'Or. Cette place existe depuis plus de 1000 ans et a vu passer tous les rois, empereurs et présidents qui ont gouverné depuis ce château. C'est un lieu de rencontre naturel où convergent les principaux chemins du complexe. Prenez un moment pour absorber l'atmosphère — vous êtes au cœur de mille ans d'histoire européenne.",
    funFact:
      "Cette place a été témoin de plus de 1000 ans d'histoire ininterrompue — des ducs de Bohême aux présidents de la République tchèque, en passant par les empereurs du Saint-Empire.",
    yearBuilt: 'Xe siècle',
    tip: "Point de repère idéal pour organiser votre visite — tous les chemins du château convergent ici.",
  },
]

export function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

export function findNearestPOI(lat: number, lng: number, excludeIds: string[] = []): POI | null {
  const available = PRAGUE_POIS.filter((poi) => !excludeIds.includes(poi.id))
  if (available.length === 0) return null

  let nearest = available[0]
  let minDist = getDistance(lat, lng, nearest.lat, nearest.lng)

  for (const poi of available) {
    const dist = getDistance(lat, lng, poi.lat, poi.lng)
    if (dist < minDist) {
      minDist = dist
      nearest = poi
    }
  }

  return nearest
}

export function findNearbyPOIs(lat: number, lng: number, radiusMeters: number = 200): (POI & { distance: number })[] {
  return PRAGUE_POIS.map((poi) => ({
    ...poi,
    distance: getDistance(lat, lng, poi.lat, poi.lng),
  }))
    .filter((poi) => poi.distance <= radiusMeters)
    .sort((a, b) => a.distance - b.distance)
}

export function getCategoryLabel(category: POI['category']): string {
  const labels: Record<POI['category'], string> = {
    monument: 'Monument',
    church: 'Église',
    garden: 'Jardin',
    museum: 'Musée',
    viewpoint: 'Point de vue',
    street: 'Rue',
  }
  return labels[category]
}
