// ---- js/data/config.js ----
// ============================================================
// config.js — all tunable numbers live here so game balance can
// be changed without touching engine or UI code.
// ============================================================

const XP_VALUES = {
  FLASHCARD_CORRECT: 5,
  FLASHCARD_EASY_BONUS: 3,
  CONJUGATION_CORRECT: 10,
  CONJUGATION_TIMED_BONUS: 5,
  SENTENCE_CORRECT: 12,
  CHALLENGE_CORRECT: 8,
  VERB_COMPLETE: 50,
  TENSE_MASTERED: 75,
  PERFECT_ROUND: 100,
  NEW_WORD_MASTERED: 25,
  NEW_WORD_DISCOVERED: 2,
};

// Cumulative XP required to REACH each level. Index 0 = level 1.
const LEVEL_THRESHOLDS = [
  { level: 1, name: 'Beginner', xpRequired: 0 },
  { level: 2, name: 'Beginner+', xpRequired: 150 },
  { level: 3, name: 'Elementary', xpRequired: 400 },
  { level: 4, name: 'Elementary+', xpRequired: 800 },
  { level: 5, name: 'Intermediate', xpRequired: 1500 },
  { level: 6, name: 'Intermediate+', xpRequired: 2600 },
  { level: 7, name: 'Mastered', xpRequired: 4200 },
];

// Spaced-repetition tuning (lightweight, not true SM-2).
const SRS = {
  AGAIN: { intervalMult: 0, intervalMinDays: 0, scoreDelta: -18, easeDelta: -0.2 },
  HARD:  { intervalMult: 1.2, intervalMinDays: 1, scoreDelta: 4, easeDelta: -0.05 },
  GOOD:  { intervalMult: 2.2, intervalMinDays: 1, scoreDelta: 10, easeDelta: 0 },
  EASY:  { intervalMult: 3.2, intervalMinDays: 2, scoreDelta: 16, easeDelta: 0.1 },
  STARTING_INTERVAL_DAYS: 0.4, // ~10 hours for a brand new item's first correct answer
  MIN_EASE: 1.3,
  MAX_EASE: 3.0,
  DEFAULT_EASE: 2.3,
  MASTERED_SCORE: 90,
  MASTERED_MIN_INTERVAL_DAYS: 14,
  LEARNING_MAX_SCORE: 40,
};

const VERB_MASTERY = {
  CORRECT_DELTA: 9,
  INCORRECT_DELTA: -12,
  TENSE_MASTERED_SCORE: 90,
};

const QUICK_PLAY = {
  TARGET_QUESTIONS: 20, // roughly a 5-10 min session
  MIX: {
    vocabulary: 8,
    conjugation: 6,
    adjectiveAgreement: 3,
    sentenceBuilder: 3,
    newWords: 2,
  },
};

const DIFFICULTY_SETTINGS = {
  easy:   { timedSeconds: 15, choiceCount: 3 },
  normal: { timedSeconds: 10, choiceCount: 4 },
  hard:   { timedSeconds: 6,  choiceCount: 4 },
};

const STORAGE_KEY = 'spanishGame.playerState.v1';
const SCHEMA_VERSION = 1;


// ---- js/data/vocabulary.js ----
// ============================================================
// vocabulary.js — THE dedicated vocabulary data file.
// To add words: add a row to the relevant tuple array below.
// Everything else (flashcards, quick play, challenge mode,
// mastery tracking) picks new words up automatically.
//
// Tuple shape per category is documented above each array.
// build() below expands tuples into full VocabItem objects:
// { id, spanish, english, category, type, gender, plural,
//   notes, exampleSentence, difficulty }
// ============================================================

let _id = 0;
const nextId = (prefix) => `${prefix}_${(_id++).toString(36)}`;

function assignDifficulty(index, total) {
  const ratio = index / Math.max(1, total - 1);
  if (ratio < 0.45) return 1;
  if (ratio < 0.8) return 2;
  return 3;
}

function build(rows, { category, type, prefix, exampleTemplate }) {
  return rows.map((row, i) => {
    const [spanish, english, extra = {}] = row;
    const item = {
      id: nextId(prefix),
      spanish,
      english,
      category,
      type,
      gender: extra.gender || null,
      plural: extra.plural || null,
      notes: extra.notes || '',
      exampleSentence: extra.example || (exampleTemplate ? exampleTemplate(spanish, english) : ''),
      difficulty: extra.difficulty || assignDifficulty(i, rows.length),
    };
    return item;
  });
}

function mergeExternalVocabularyRows() {
  const external = window.EXTERNAL_SPANISH_VOCABULARY;
  if (!external || typeof external !== 'object') return;

  const appendNewRows = (targetRows, sourceRows) => {
    if (!Array.isArray(sourceRows)) return;
    sourceRows.forEach((row) => {
      if (!Array.isArray(row) || row.length === 0) return;
      const spanish = row[0];
      if (!spanish) return;
      const exists = targetRows.some((existing) => existing[0] === spanish);
      if (!exists) {
        targetRows.push(row);
      }
    });
  };

  appendNewRows(VERB_ROWS, external.verbs);
  appendNewRows(NOUN_ROWS, external.nouns);
  appendNewRows(ADJECTIVE_ROWS, external.adjectives);
  appendNewRows(ADVERB_ROWS, external.adverbs);
  appendNewRows(CONNECTOR_ROWS, external.connectors);
  appendNewRows(DETERMINER_ROWS, external.determiners);
  appendNewRows(PRONOUN_ROWS, external.pronouns);
  appendNewRows(NUMBER_ROWS, external.numbers);
  appendNewRows(TIME_ROWS, external.time);
  appendNewRows(PREPOSITION_ROWS, external.prepositions);
  appendNewRows(EXPRESSION_ROWS, external.expressions);
  appendNewRows(CONSTRUCTION_ROWS, external.commonVerbConstructions);
  appendNewRows(FILLER_ROWS, external.conversationalFillers);
}

// ---------------- NOUNS: [spanish, english, {gender, plural}] ----------------
const NOUN_ROWS = [
  ['casa', 'house', { gender: 'f', plural: 'casas' }],
  ['perro', 'dog', { gender: 'm', plural: 'perros' }],
  ['gato', 'cat', { gender: 'm', plural: 'gatos' }],
  ['coche', 'car', { gender: 'm', plural: 'coches' }],
  ['libro', 'book', { gender: 'm', plural: 'libros' }],
  ['mesa', 'table', { gender: 'f', plural: 'mesas' }],
  ['silla', 'chair', { gender: 'f', plural: 'sillas' }],
  ['agua', 'water', { gender: 'f', plural: 'aguas', notes: 'uses "el" despite being feminine' }],
  ['comida', 'food', { gender: 'f', plural: 'comidas' }],
  ['amigo', 'friend (m)', { gender: 'm', plural: 'amigos' }],
  ['amiga', 'friend (f)', { gender: 'f', plural: 'amigas' }],
  ['familia', 'family', { gender: 'f', plural: 'familias' }],
  ['madre', 'mother', { gender: 'f', plural: 'madres' }],
  ['padre', 'father', { gender: 'm', plural: 'padres' }],
  ['hermano', 'brother', { gender: 'm', plural: 'hermanos' }],
  ['hermana', 'sister', { gender: 'f', plural: 'hermanas' }],
  ['hijo', 'son', { gender: 'm', plural: 'hijos' }],
  ['hija', 'daughter', { gender: 'f', plural: 'hijas' }],
  ['ciudad', 'city', { gender: 'f', plural: 'ciudades' }],
  ['país', 'country', { gender: 'm', plural: 'países' }],
  ['calle', 'street', { gender: 'f', plural: 'calles' }],
  ['trabajo', 'work / job', { gender: 'm', plural: 'trabajos' }],
  ['escuela', 'school', { gender: 'f', plural: 'escuelas' }],
  ['universidad', 'university', { gender: 'f', plural: 'universidades' }],
  ['dinero', 'money', { gender: 'm', plural: null }],
  ['tiempo', 'time / weather', { gender: 'm', plural: 'tiempos' }],
  ['día', 'day', { gender: 'm', plural: 'días', notes: 'ends in -a but is masculine' }],
  ['noche', 'night', { gender: 'f', plural: 'noches' }],
  ['año', 'year', { gender: 'm', plural: 'años' }],
  ['semana', 'week', { gender: 'f', plural: 'semanas' }],
  ['mes', 'month', { gender: 'm', plural: 'meses' }],
  ['hombre', 'man', { gender: 'm', plural: 'hombres' }],
  ['mujer', 'woman', { gender: 'f', plural: 'mujeres' }],
  ['niño', 'boy / child', { gender: 'm', plural: 'niños' }],
  ['niña', 'girl', { gender: 'f', plural: 'niñas' }],
  ['puerta', 'door', { gender: 'f', plural: 'puertas' }],
  ['ventana', 'window', { gender: 'f', plural: 'ventanas' }],
  ['cama', 'bed', { gender: 'f', plural: 'camas' }],
  ['cocina', 'kitchen', { gender: 'f', plural: 'cocinas' }],
  ['baño', 'bathroom', { gender: 'm', plural: 'baños' }],
  ['ciudadano', 'citizen', { gender: 'm', plural: 'ciudadanos' }],
  ['restaurante', 'restaurant', { gender: 'm', plural: 'restaurantes' }],
  ['playa', 'beach', { gender: 'f', plural: 'playas' }],
  ['montaña', 'mountain', { gender: 'f', plural: 'montañas' }],
  ['río', 'river', { gender: 'm', plural: 'ríos' }],
  ['árbol', 'tree', { gender: 'm', plural: 'árboles' }],
  ['flor', 'flower', { gender: 'f', plural: 'flores' }],
  ['cielo', 'sky', { gender: 'm', plural: 'cielos' }],
  ['sol', 'sun', { gender: 'm', plural: 'soles' }],
  ['luna', 'moon', { gender: 'f', plural: 'lunas' }],
  ['problema', 'problem', { gender: 'm', plural: 'problemas', notes: 'ends in -a but is masculine' }],
  ['idea', 'idea', { gender: 'f', plural: 'ideas' }],
  ['vida', 'life', { gender: 'f', plural: 'vidas' }],
  ['mano', 'hand', { gender: 'f', plural: 'manos', notes: 'ends in -o but is feminine' }],
  ['cabeza', 'head', { gender: 'f', plural: 'cabezas' }],
  ['ojo', 'eye', { gender: 'm', plural: 'ojos' }],
  ['boca', 'mouth', { gender: 'f', plural: 'bocas' }],
  ['pie', 'foot', { gender: 'm', plural: 'pies' }],
  ['camino', 'path / way', { gender: 'm', plural: 'caminos' }],
  ['viaje', 'trip', { gender: 'm', plural: 'viajes' }],
  ['fiesta', 'party', { gender: 'f', plural: 'fiestas' }],
  ['música', 'music', { gender: 'f', plural: null }],
  ['película', 'movie', { gender: 'f', plural: 'películas' }],
  ['juego', 'game', { gender: 'm', plural: 'juegos' }],
  ['equipo', 'team', { gender: 'm', plural: 'equipos' }],
  ['ciencia', 'science', { gender: 'f', plural: 'ciencias' }],
  ['historia', 'history / story', { gender: 'f', plural: 'historias' }],
  ['clase', 'class', { gender: 'f', plural: 'clases' }],
  ['profesor', 'teacher (m)', { gender: 'm', plural: 'profesores' }],
  ['profesora', 'teacher (f)', { gender: 'f', plural: 'profesoras' }],
  ['estudiante', 'student', { gender: 'm/f', plural: 'estudiantes' }],
];

// ---------------- VERBS (vocabulary entries; full conjugation data lives in verbs.js) ----------------
const VERB_ROWS = [
  ['ser', 'to be (permanent)'],
  ['estar', 'to be (state/location)'],
  ['tener', 'to have'],
  ['hacer', 'to do / make'],
  ['ir', 'to go'],
  ['poder', 'to be able to / can'],
  ['querer', 'to want / love'],
  ['decir', 'to say / tell'],
  ['venir', 'to come'],
  ['poner', 'to put'],
  ['saber', 'to know (facts)'],
  ['conocer', 'to know (people/places)'],
  ['dar', 'to give'],
  ['ver', 'to see'],
  ['salir', 'to leave / go out'],
  ['traer', 'to bring'],
  ['oír', 'to hear'],
  ['caer', 'to fall'],
  ['andar', 'to walk'],
  ['haber', 'to have (auxiliary)'],
  ['hablar', 'to speak'],
  ['comer', 'to eat'],
  ['vivir', 'to live'],
  ['trabajar', 'to work'],
  ['estudiar', 'to study'],
  ['comprar', 'to buy'],
  ['necesitar', 'to need'],
  ['buscar', 'to look for'],
  ['llegar', 'to arrive'],
  ['empezar', 'to begin'],
  ['pensar', 'to think'],
  ['volver', 'to return'],
  ['dormir', 'to sleep'],
  ['pedir', 'to ask for / order'],
  ['servir', 'to serve'],
  ['sentir', 'to feel'],
  ['preferir', 'to prefer'],
  ['entender', 'to understand'],
  ['cerrar', 'to close'],
  ['mostrar', 'to show'],
  ['recordar', 'to remember'],
  ['jugar', 'to play'],
  ['leer', 'to read'],
  ['creer', 'to believe'],
  ['incluir', 'to include'],
  ['pagar', 'to pay'],
  ['sacar', 'to take out'],
  ['cruzar', 'to cross'],
  ['seguir', 'to follow / continue'],
  ['elegir', 'to choose'],
  ['producir', 'to produce'],
  ['abrir', 'to open'],
  ['escribir', 'to write'],
  ['aprender', 'to learn'],
  ['viajar', 'to travel'],
  ['ayudar', 'to help'],
  ['llamar', 'to call'],
  ['llevar', 'to carry / wear'],
  ['tomar', 'to take / drink'],
  ['escuchar', 'to listen'],
  ['mirar', 'to look at / watch'],
];

// ---------------- ADJECTIVES: [spanish (masc. sing.), english, {plural (masc.)}] ----------------
const ADJECTIVE_ROWS = [
  ['grande', 'big', { plural: 'grandes' }],
  ['pequeño', 'small', { plural: 'pequeños' }],
  ['bueno', 'good', { plural: 'buenos' }],
  ['malo', 'bad', { plural: 'malos' }],
  ['feliz', 'happy', { plural: 'felices' }],
  ['triste', 'sad', { plural: 'tristes' }],
  ['nuevo', 'new', { plural: 'nuevos' }],
  ['viejo', 'old', { plural: 'viejos' }],
  ['joven', 'young', { plural: 'jóvenes' }],
  ['bonito', 'pretty', { plural: 'bonitos' }],
  ['feo', 'ugly', { plural: 'feos' }],
  ['alto', 'tall', { plural: 'altos' }],
  ['bajo', 'short (height)', { plural: 'bajos' }],
  ['largo', 'long', { plural: 'largos' }],
  ['corto', 'short (length)', { plural: 'cortos' }],
  ['rápido', 'fast', { plural: 'rápidos' }],
  ['lento', 'slow', { plural: 'lentos' }],
  ['fácil', 'easy', { plural: 'fáciles' }],
  ['difícil', 'difficult', { plural: 'difíciles' }],
  ['importante', 'important', { plural: 'importantes' }],
  ['interesante', 'interesting', { plural: 'interesantes' }],
  ['aburrido', 'boring', { plural: 'aburridos' }],
  ['divertido', 'fun', { plural: 'divertidos' }],
  ['rico', 'rich / tasty', { plural: 'ricos' }],
  ['pobre', 'poor', { plural: 'pobres' }],
  ['fuerte', 'strong', { plural: 'fuertes' }],
  ['débil', 'weak', { plural: 'débiles' }],
  ['caliente', 'hot', { plural: 'calientes' }],
  ['frío', 'cold', { plural: 'fríos' }],
  ['limpio', 'clean', { plural: 'limpios' }],
  ['sucio', 'dirty', { plural: 'sucios' }],
  ['caro', 'expensive', { plural: 'caros' }],
  ['barato', 'cheap', { plural: 'baratos' }],
  ['claro', 'clear', { plural: 'claros' }],
  ['oscuro', 'dark', { plural: 'oscuros' }],
  ['libre', 'free', { plural: 'libres' }],
  ['ocupado', 'busy', { plural: 'ocupados' }],
  ['cansado', 'tired', { plural: 'cansados' }],
  ['enfermo', 'sick', { plural: 'enfermos' }],
  ['sano', 'healthy', { plural: 'sanos' }],
  ['guapo', 'good-looking', { plural: 'guapos' }],
  ['inteligente', 'intelligent', { plural: 'inteligentes' }],
  ['amable', 'kind', { plural: 'amables' }],
  ['simpático', 'nice / likeable', { plural: 'simpáticos' }],
  ['antipático', 'unpleasant', { plural: 'antipáticos' }],
  ['tranquilo', 'calm', { plural: 'tranquilos' }],
  ['nervioso', 'nervous', { plural: 'nerviosos' }],
  ['seguro', 'sure / safe', { plural: 'seguros' }],
  ['peligroso', 'dangerous', { plural: 'peligrosos' }],
  ['famoso', 'famous', { plural: 'famosos' }],
  ['moderno', 'modern', { plural: 'modernos' }],
  ['antiguo', 'ancient / old', { plural: 'antiguos' }],
  ['gordo', 'fat', { plural: 'gordos' }],
  ['delgado', 'thin', { plural: 'delgados' }],
  ['dulce', 'sweet', { plural: 'dulces' }],
  ['salado', 'salty', { plural: 'salados' }],
  ['ligero', 'light (weight)', { plural: 'ligeros' }],
  ['pesado', 'heavy', { plural: 'pesados' }],
  ['roja', 'red', { plural: 'rojas', gender: 'f' }],
  ['azul', 'blue', { plural: 'azules' }],
  ['verde', 'green', { plural: 'verdes' }],
];

// ---------------- ADVERBS ----------------
const ADVERB_ROWS = [
  ['muy', 'very'], ['mucho', 'a lot'], ['poco', 'little / not much'], ['bien', 'well'],
  ['mal', 'badly'], ['siempre', 'always'], ['nunca', 'never'], ['a veces', 'sometimes'],
  ['a menudo', 'often'], ['hoy', 'today'], ['mañana', 'tomorrow'], ['ayer', 'yesterday'],
  ['ahora', 'now'], ['luego', 'later / then'], ['pronto', 'soon'], ['tarde', 'late'],
  ['temprano', 'early'], ['aquí', 'here'], ['allí', 'there'], ['cerca', 'near'],
  ['lejos', 'far'], ['arriba', 'up / above'], ['abajo', 'down / below'], ['dentro', 'inside'],
  ['fuera', 'outside'], ['todavía', 'still / yet'], ['ya', 'already'], ['también', 'also'],
  ['tampoco', 'neither / not either'], ['solo', 'only'], ['casi', 'almost'], ['bastante', 'quite / enough'],
  ['demasiado', 'too much'], ['despacio', 'slowly'], ['rápidamente', 'quickly'], ['fácilmente', 'easily'],
  ['claramente', 'clearly'], ['realmente', 'really'], ['probablemente', 'probably'], ['generalmente', 'generally'],
  ['específicamente', 'specifically'], ['además', 'besides / also'], ['entonces', 'then / so'], ['así', 'like this / so'],
  ['por fin', 'finally'], ['de repente', 'suddenly'], ['de nuevo', 'again'], ['en seguida', 'right away'],
  ['adelante', 'forward'], ['atrás', 'backward'],
];

// ---------------- CONNECTORS ----------------
const CONNECTOR_ROWS = [
  ['y', 'and'], ['o', 'or'], ['pero', 'but'], ['porque', 'because'], ['que', 'that / which'],
  ['si', 'if'], ['aunque', 'although'], ['entonces', 'then'], ['además', 'moreover'], ['sin embargo', 'however'],
  ['por lo tanto', 'therefore'], ['mientras', 'while'], ['cuando', 'when'], ['como', 'as / since / like'],
  ['ni', 'nor'], ['o sea', 'that is / I mean'], ['es decir', 'that is to say'], ['por eso', 'that is why'],
  ['a pesar de', 'despite'], ['en cambio', 'on the other hand'], ['por otro lado', 'on the other hand'],
  ['además de', 'in addition to'], ['de hecho', 'in fact'], ['en fin', 'in short'], ['en resumen', 'in summary'],
  ['tanto...como', 'both...and'], ['ya que', 'since / given that'], ['puesto que', 'since'],
  ['a menos que', 'unless'], ['para que', 'so that'],
];

// ---------------- DETERMINERS ----------------
const DETERMINER_ROWS = [
  ['el', 'the (m. sing.)'], ['la', 'the (f. sing.)'], ['los', 'the (m. pl.)'], ['las', 'the (f. pl.)'],
  ['un', 'a / an (m.)'], ['una', 'a / an (f.)'], ['unos', 'some (m.)'], ['unas', 'some (f.)'],
  ['este', 'this (m.)'], ['esta', 'this (f.)'], ['ese', 'that (m.)'], ['esa', 'that (f.)'],
  ['mi', 'my'], ['tu', 'your (informal)'], ['su', 'his / her / their / your (formal)'],
];

// ---------------- PRONOUNS ----------------
const PRONOUN_ROWS = [
  ['yo', 'I'], ['tú', 'you (informal)'], ['él', 'he'], ['ella', 'she'], ['usted', 'you (formal)'],
  ['nosotros', 'we'], ['vosotros', 'you all (Spain, informal)'], ['ellos', 'they (m.)'],
  ['ellas', 'they (f.)'], ['ustedes', 'you all'], ['me', 'me (object)'], ['te', 'you (object)'],
  ['lo', 'him / it (object)'], ['la', 'her / it (object)'], ['nos', 'us (object)'],
];

// ---------------- NUMBERS ----------------
const NUMBER_WORDS = ['cero','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez',
  'once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve','veinte',
  'treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa','cien','mil'];
const NUMBER_ROWS = NUMBER_WORDS.map((w, i) => {
  const englishMap = { cero:'zero', uno:'one', dos:'two', tres:'three', cuatro:'four', cinco:'five',
    seis:'six', siete:'seven', ocho:'eight', nueve:'nine', diez:'ten', once:'eleven', doce:'twelve',
    trece:'thirteen', catorce:'fourteen', quince:'fifteen', dieciséis:'sixteen', diecisiete:'seventeen',
    dieciocho:'eighteen', diecinueve:'nineteen', veinte:'twenty', treinta:'thirty', cuarenta:'forty',
    cincuenta:'fifty', sesenta:'sixty', setenta:'seventy', ochenta:'eighty', noventa:'ninety',
    cien:'one hundred', mil:'one thousand' };
  return [w, englishMap[w]];
});

// ---------------- TIME VOCABULARY ----------------
const TIME_ROWS = [
  ['lunes', 'Monday'], ['martes', 'Tuesday'], ['miércoles', 'Wednesday'], ['jueves', 'Thursday'],
  ['viernes', 'Friday'], ['sábado', 'Saturday'], ['domingo', 'Sunday'], ['enero', 'January'],
  ['febrero', 'February'], ['marzo', 'March'], ['abril', 'April'], ['mayo', 'May'], ['junio', 'June'],
  ['julio', 'July'], ['agosto', 'August'], ['septiembre', 'September'], ['octubre', 'October'],
  ['noviembre', 'November'], ['diciembre', 'December'], ['hora', 'hour'], ['minuto', 'minute'],
  ['segundo', 'second'], ['mañana', 'morning'], ['tarde', 'afternoon'], ['noche', 'night'],
  ['medianoche', 'midnight'], ['mediodía', 'noon'],
];

// ---------------- PREPOSITIONS ----------------
const PREPOSITION_ROWS = [
  ['a', 'to / at'], ['de', 'of / from'], ['en', 'in / on'], ['con', 'with'], ['sin', 'without'],
  ['por', 'for / by / through'], ['para', 'for / in order to'], ['sobre', 'about / on top of'],
  ['entre', 'between'], ['hacia', 'toward'], ['hasta', 'until / up to'], ['desde', 'since / from'],
  ['durante', 'during'], ['contra', 'against'], ['según', 'according to'], ['bajo', 'under'],
  ['ante', 'before / in front of'], ['tras', 'after / behind'],
];

// ---------------- EXPRESSIONS ----------------
const EXPRESSION_ROWS = [
  ['hola', 'hello'], ['adiós', 'goodbye'], ['por favor', 'please'], ['gracias', 'thank you'],
  ['de nada', "you're welcome"], ['lo siento', "I'm sorry"], ['perdón', 'excuse me / sorry'],
  ['buenos días', 'good morning'], ['buenas tardes', 'good afternoon'], ['buenas noches', 'good night'],
  ['¿cómo estás?', 'how are you?'], ['¿qué tal?', "what's up?"], ['no entiendo', "I don't understand"],
  ['no sé', "I don't know"], ['tengo hambre', "I'm hungry"], ['tengo sed', "I'm thirsty"],
  ['tengo frío', "I'm cold"], ['tengo calor', "I'm hot"], ['tengo miedo', "I'm afraid"],
  ['tengo prisa', "I'm in a hurry"], ['tengo razón', "I'm right"], ['tengo sueño', "I'm sleepy"],
  ['¡buena suerte!', 'good luck!'], ['¡felicidades!', 'congratulations!'], ['¡cuídate!', 'take care!'],
  ['¿qué hora es?', 'what time is it?'], ['me gusta', 'I like'], ['me encanta', 'I love'],
  ['no me importa', "I don't care"], ['claro que sí', 'of course'], ['ni idea', 'no idea'],
  ['vale', 'okay (Spain)'], ['¿verdad?', "right? / isn't it?"], ['por supuesto', 'of course'],
  ['a propósito', 'by the way'], ['en serio', 'seriously'], ['¡qué bien!', 'how nice!'],
  ['¡qué pena!', 'what a shame!'], ['¡ojalá!', 'hopefully! / I wish!'], ['¡vamos!', "let's go!"],
];

// ---------------- COMMON VERB CONSTRUCTIONS ----------------
const CONSTRUCTION_ROWS = [
  ['tener que + infinitivo', 'to have to do something'],
  ['ir a + infinitivo', 'to be going to do something'],
  ['acabar de + infinitivo', 'to have just done something'],
  ['querer + infinitivo', 'to want to do something'],
  ['poder + infinitivo', 'to be able to do something'],
  ['deber + infinitivo', 'should / must do something'],
  ['gustar + infinitivo', 'to like doing something'],
  ['empezar a + infinitivo', 'to start doing something'],
  ['dejar de + infinitivo', 'to stop doing something'],
  ['volver a + infinitivo', 'to do something again'],
  ['estar + gerundio', 'to be doing something'],
  ['seguir + gerundio', 'to keep doing something'],
];

// ---------------- CONVERSATIONAL FILLERS ----------------
const FILLER_ROWS = [
  ['bueno', 'well...'], ['pues', 'well / so'], ['o sea', 'I mean / that is'], ['este...', 'um...'],
  ['a ver', "let's see"], ['la verdad', 'to be honest'], ['digamos', "let's say"],
  ['no sé qué decir', "I don't know what to say"], ['como que', 'like / kind of'],
  ['en plan', 'like / sort of (Spain slang)'], ['osea nada', 'anyway / whatever'],
  ['total', 'so / anyway'],
];

mergeExternalVocabularyRows();

const VOCABULARY = [
  ...build(NOUN_ROWS, { category: 'Nouns', type: 'noun', prefix: 'n' }),
  ...build(VERB_ROWS, { category: 'Verbs', type: 'verb', prefix: 'v' }),
  ...build(ADJECTIVE_ROWS, { category: 'Adjectives', type: 'adjective', prefix: 'adj' }),
  ...build(ADVERB_ROWS, { category: 'Adverbs', type: 'adverb', prefix: 'adv' }),
  ...build(CONNECTOR_ROWS, { category: 'Connectors', type: 'connector', prefix: 'conn' }),
  ...build(DETERMINER_ROWS, { category: 'Determiners', type: 'determiner', prefix: 'det' }),
  ...build(PRONOUN_ROWS, { category: 'Pronouns', type: 'pronoun', prefix: 'pro' }),
  ...build(NUMBER_ROWS, { category: 'Numbers', type: 'number', prefix: 'num' }),
  ...build(TIME_ROWS, { category: 'Time', type: 'time', prefix: 'time' }),
  ...build(PREPOSITION_ROWS, { category: 'Prepositions', type: 'preposition', prefix: 'prep' }),
  ...build(EXPRESSION_ROWS, { category: 'Expressions', type: 'expression', prefix: 'expr' }),
  ...build(CONSTRUCTION_ROWS, { category: 'Common verb constructions', type: 'expression', prefix: 'cvc' }),
  ...build(FILLER_ROWS, { category: 'Conversational fillers', type: 'expression', prefix: 'fill' }),
];

const CATEGORIES = [...new Set(VOCABULARY.map((v) => v.category))];

function getVocabById(id) {
  return VOCABULARY.find((v) => v.id === id);
}

function getVocabByCategory(category) {
  if (!category || category === 'All') return VOCABULARY;
  return VOCABULARY.filter((v) => v.category === category);
}


// ---- js/data/verbs.js ----
// ============================================================
// verbs.js — dedicated verb-conjugation data file.
// Each verb needs only: id, english, class (ar/er/ir).
// Stem-changers add `stemChange`. Spelling-change verbs add
// `spelling`. Anything genuinely irregular adds targeted
// overrides — the engine (conjugationEngine.js) always checks
// overrides FIRST before generating a form from rules, so a
// verb can override just one cell without duplicating the rest.
// ============================================================

const VERBS = {
  ser: {
    id: 'ser', english: 'to be (permanent)', class: 'er',
    overrides: {
      present: ['soy', 'eres', 'es', 'somos', 'sois', 'son'],
      preterite: ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'],
      imperfect: ['era', 'eras', 'era', 'éramos', 'erais', 'eran'],
    },
    subjOverride: ['sea', 'seas', 'sea', 'seamos', 'seáis', 'sean'],
    pastParticiple: 'sido', gerund: 'siendo', imperativeIrregularTu: 'sé',
  },
  estar: {
    id: 'estar', english: 'to be (state/location)', class: 'ar',
    overrides: {
      present: ['estoy', 'estás', 'está', 'estamos', 'estáis', 'están'],
      preterite: ['estuve', 'estuviste', 'estuvo', 'estuvimos', 'estuvisteis', 'estuvieron'],
    },
    subjOverride: ['esté', 'estés', 'esté', 'estemos', 'estéis', 'estén'],
    pastParticiple: 'estado', gerund: 'estando', imperativeIrregularTu: 'está',
  },
  ir: {
    id: 'ir', english: 'to go', class: 'ir',
    overrides: {
      present: ['voy', 'vas', 'va', 'vamos', 'vais', 'van'],
      preterite: ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'],
      imperfect: ['iba', 'ibas', 'iba', 'íbamos', 'ibais', 'iban'],
    },
    subjOverride: ['vaya', 'vayas', 'vaya', 'vayamos', 'vayáis', 'vayan'],
    pastParticiple: 'ido', gerund: 'yendo', imperativeIrregularTu: 've',
  },
  tener: {
    id: 'tener', english: 'to have', class: 'er', irregularYo: 'tengo', stemChange: 'e-ie',
    overrides: { preterite: ['tuve', 'tuviste', 'tuvo', 'tuvimos', 'tuvisteis', 'tuvieron'] },
    futureStem: 'tendr', pastParticiple: 'tenido', imperativeIrregularTu: 'ten',
  },
  hacer: {
    id: 'hacer', english: 'to do / make', class: 'er', irregularYo: 'hago',
    overrides: { preterite: ['hice', 'hiciste', 'hizo', 'hicimos', 'hicisteis', 'hicieron'] },
    futureStem: 'har', pastParticiple: 'hecho', imperativeIrregularTu: 'haz',
  },
  poder: {
    id: 'poder', english: 'to be able to / can', class: 'er', stemChange: 'o-ue',
    futureStem: 'podr', pastParticiple: 'podido', gerund: 'pudiendo',
  },
  querer: {
    id: 'querer', english: 'to want / love', class: 'er', stemChange: 'e-ie',
    overrides: { preterite: ['quise', 'quisiste', 'quiso', 'quisimos', 'quisisteis', 'quisieron'] },
    futureStem: 'querr', pastParticiple: 'querido',
  },
  decir: {
    id: 'decir', english: 'to say / tell', class: 'ir', irregularYo: 'digo', stemChange: 'e-i',
    overrides: { preterite: ['dije', 'dijiste', 'dijo', 'dijimos', 'dijisteis', 'dijeron'] },
    futureStem: 'dir', pastParticiple: 'dicho', gerund: 'diciendo', imperativeIrregularTu: 'di',
  },
  venir: {
    id: 'venir', english: 'to come', class: 'ir', irregularYo: 'vengo', stemChange: 'e-ie',
    overrides: { preterite: ['vine', 'viniste', 'vino', 'vinimos', 'vinisteis', 'vinieron'] },
    futureStem: 'vendr', pastParticiple: 'venido', gerund: 'viniendo', imperativeIrregularTu: 'ven',
  },
  poner: {
    id: 'poner', english: 'to put', class: 'er', irregularYo: 'pongo',
    overrides: { preterite: ['puse', 'pusiste', 'puso', 'pusimos', 'pusisteis', 'pusieron'] },
    futureStem: 'pondr', pastParticiple: 'puesto', imperativeIrregularTu: 'pon',
  },
  saber: {
    id: 'saber', english: 'to know (facts)', class: 'er',
    overrides: {
      present: ['sé', 'sabes', 'sabe', 'sabemos', 'sabéis', 'saben'],
      preterite: ['supe', 'supiste', 'supo', 'supimos', 'supisteis', 'supieron'],
    },
    subjOverride: ['sepa', 'sepas', 'sepa', 'sepamos', 'sepáis', 'sepan'],
    futureStem: 'sabr', pastParticiple: 'sabido',
  },
  conocer: {
    id: 'conocer', english: 'to know (people/places)', class: 'er', spelling: 'cer-zc',
    pastParticiple: 'conocido',
  },
  dar: {
    id: 'dar', english: 'to give', class: 'ar',
    overrides: {
      present: ['doy', 'das', 'da', 'damos', 'dais', 'dan'],
      preterite: ['di', 'diste', 'dio', 'dimos', 'disteis', 'dieron'],
    },
    subjOverride: ['dé', 'des', 'dé', 'demos', 'deis', 'den'],
    pastParticiple: 'dado',
  },
  ver: {
    id: 'ver', english: 'to see', class: 'er', irregularYo: 'veo',
    overrides: { imperfect: ['veía', 'veías', 'veía', 'veíamos', 'veíais', 'veían'] },
    pastParticiple: 'visto',
  },
  salir: {
    id: 'salir', english: 'to leave / go out', class: 'ir', irregularYo: 'salgo',
    futureStem: 'saldr', pastParticiple: 'salido', imperativeIrregularTu: 'sal',
  },
  traer: {
    id: 'traer', english: 'to bring', class: 'er', irregularYo: 'traigo',
    overrides: { preterite: ['traje', 'trajiste', 'trajo', 'trajimos', 'trajisteis', 'trajeron'] },
    pastParticiple: 'traído', gerund: 'trayendo',
  },
  oír: {
    id: 'oír', english: 'to hear', class: 'ir',
    overrides: {
      present: ['oigo', 'oyes', 'oye', 'oímos', 'oís', 'oyen'],
      preterite: ['oí', 'oíste', 'oyó', 'oímos', 'oísteis', 'oyeron'],
    },
    pastParticiple: 'oído', gerund: 'oyendo',
  },
  caer: {
    id: 'caer', english: 'to fall', class: 'er', irregularYo: 'caigo',
    overrides: { preterite: ['caí', 'caíste', 'cayó', 'caímos', 'caísteis', 'cayeron'] },
    pastParticiple: 'caído', gerund: 'cayendo',
  },
  andar: {
    id: 'andar', english: 'to walk', class: 'ar',
    overrides: { preterite: ['anduve', 'anduviste', 'anduvo', 'anduvimos', 'anduvisteis', 'anduvieron'] },
    pastParticiple: 'andado',
  },
  haber: {
    id: 'haber', english: 'to have (auxiliary)', class: 'er',
    overrides: {
      present: ['he', 'has', 'ha', 'hemos', 'habéis', 'han'],
      preterite: ['hube', 'hubiste', 'hubo', 'hubimos', 'hubisteis', 'hubieron'],
    },
    subjOverride: ['haya', 'hayas', 'haya', 'hayamos', 'hayáis', 'hayan'],
    futureStem: 'habr', pastParticiple: 'habido', gerund: 'habiendo',
  },

  hablar: { id: 'hablar', english: 'to speak', class: 'ar' },
  comer: { id: 'comer', english: 'to eat', class: 'er' },
  vivir: { id: 'vivir', english: 'to live', class: 'ir' },
  trabajar: { id: 'trabajar', english: 'to work', class: 'ar' },
  estudiar: { id: 'estudiar', english: 'to study', class: 'ar' },
  comprar: { id: 'comprar', english: 'to buy', class: 'ar' },
  necesitar: { id: 'necesitar', english: 'to need', class: 'ar' },
  buscar: { id: 'buscar', english: 'to look for', class: 'ar', spelling: 'car' },
  llegar: { id: 'llegar', english: 'to arrive', class: 'ar', spelling: 'gar' },
  empezar: { id: 'empezar', english: 'to begin', class: 'ar', stemChange: 'e-ie', spelling: 'zar' },
  pensar: { id: 'pensar', english: 'to think', class: 'ar', stemChange: 'e-ie' },
  volver: { id: 'volver', english: 'to return', class: 'er', stemChange: 'o-ue', pastParticiple: 'vuelto' },
  dormir: { id: 'dormir', english: 'to sleep', class: 'ir', stemChange: 'o-ue', gerund: 'durmiendo' },
  pedir: { id: 'pedir', english: 'to ask for / order', class: 'ir', stemChange: 'e-i' },
  servir: { id: 'servir', english: 'to serve', class: 'ir', stemChange: 'e-i' },
  sentir: { id: 'sentir', english: 'to feel', class: 'ir', stemChange: 'e-ie', gerund: 'sintiendo' },
  preferir: { id: 'preferir', english: 'to prefer', class: 'ir', stemChange: 'e-ie', gerund: 'prefiriendo' },
  entender: { id: 'entender', english: 'to understand', class: 'er', stemChange: 'e-ie' },
  cerrar: { id: 'cerrar', english: 'to close', class: 'ar', stemChange: 'e-ie' },
  mostrar: { id: 'mostrar', english: 'to show', class: 'ar', stemChange: 'o-ue' },
  recordar: { id: 'recordar', english: 'to remember', class: 'ar', stemChange: 'o-ue' },
  jugar: { id: 'jugar', english: 'to play', class: 'ar', stemChange: 'u-ue', spelling: 'gar' },
  leer: { id: 'leer', english: 'to read', class: 'er', spelling: 'eer-y', gerund: 'leyendo', pastParticiple: 'leído' },
  creer: { id: 'creer', english: 'to believe', class: 'er', spelling: 'eer-y', gerund: 'creyendo', pastParticiple: 'creído' },
  incluir: { id: 'incluir', english: 'to include', class: 'ir', spelling: 'uir-y', gerund: 'incluyendo' },
  pagar: { id: 'pagar', english: 'to pay', class: 'ar', spelling: 'gar' },
  sacar: { id: 'sacar', english: 'to take out', class: 'ar', spelling: 'car' },
  cruzar: { id: 'cruzar', english: 'to cross', class: 'ar', spelling: 'zar' },
  seguir: { id: 'seguir', english: 'to follow / continue', class: 'ir', stemChange: 'e-i', spelling: 'guir-g', gerund: 'siguiendo' },
  elegir: { id: 'elegir', english: 'to choose', class: 'ir', stemChange: 'e-i', spelling: 'gir-j', gerund: 'eligiendo' },
  producir: {
    id: 'producir', english: 'to produce', class: 'ir', spelling: 'cer-zc',
    overrides: { preterite: ['produje', 'produjiste', 'produjo', 'produjimos', 'produjisteis', 'produjeron'] },
    pastParticiple: 'producido',
  },
  abrir: { id: 'abrir', english: 'to open', class: 'ir', pastParticiple: 'abierto' },
  escribir: { id: 'escribir', english: 'to write', class: 'ir', pastParticiple: 'escrito' },
  aprender: { id: 'aprender', english: 'to learn', class: 'er' },
  viajar: { id: 'viajar', english: 'to travel', class: 'ar' },
  ayudar: { id: 'ayudar', english: 'to help', class: 'ar' },
  llamar: { id: 'llamar', english: 'to call', class: 'ar' },
  llevar: { id: 'llevar', english: 'to carry / wear', class: 'ar' },
  tomar: { id: 'tomar', english: 'to take / drink', class: 'ar' },
  escuchar: { id: 'escuchar', english: 'to listen', class: 'ar' },
  mirar: { id: 'mirar', english: 'to look at / watch', class: 'ar' },
};

function getVerb(id) {
  return VERBS[id];
}

function allVerbIds() {
  return Object.keys(VERBS);
}


// ---- js/data/tenses.js ----
// ============================================================
// tenses.js — dedicated data file describing every tense.
// Adding a new tense = add one entry here, then (if it needs
// special derivation) teach conjugationEngine.js how to build it.
// ============================================================

const PERSONS = ['yo', 'tu', 'el', 'nosotros', 'vosotros', 'ellos'];

const PERSON_LABELS = {
  yo: 'Yo',
  tu: 'Tú',
  el: 'Él / Ella / Usted',
  nosotros: 'Nosotros',
  vosotros: 'Vosotros',
  ellos: 'Ellos / Ellas / Ustedes',
};

const PERSON_SUBJECTS = {
  yo: 'Yo',
  tu: 'Tú',
  el: 'Él',
  nosotros: 'Nosotros',
  vosotros: 'Vosotros',
  ellos: 'Ellos',
};

// type: 'simple' (endings table applied to stem) | 'stemAdd' (endings appended
// to full infinitive/irregular future-conditional stem) | 'compound' (haber + participle)
// | 'progressive' (estar + gerund) | 'derived' (built programmatically, e.g. imperfect subjunctive)
const TENSES = {
  present: {
    id: 'present', name: 'Present', level: 'beginner', type: 'simple',
    english: 'simple present (I do / I am doing)',
    endings: {
      ar: ['o', 'as', 'a', 'amos', 'áis', 'an'],
      er: ['o', 'es', 'e', 'emos', 'éis', 'en'],
      ir: ['o', 'es', 'e', 'imos', 'ís', 'en'],
    },
  },
  preterite: {
    id: 'preterite', name: 'Preterite', level: 'beginner', type: 'simple',
    english: 'simple past (I did)',
    endings: {
      ar: ['é', 'aste', 'ó', 'amos', 'asteis', 'aron'],
      er: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'],
      ir: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'],
    },
  },
  imperfect: {
    id: 'imperfect', name: 'Imperfect', level: 'beginner', type: 'simple',
    english: 'past habitual / ongoing (I used to do / I was doing)',
    endings: {
      ar: ['aba', 'abas', 'aba', 'ábamos', 'abais', 'aban'],
      er: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'],
      ir: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'],
    },
  },
  future: {
    id: 'future', name: 'Future', level: 'beginner', type: 'stemAdd',
    english: 'will do',
    endings: ['é', 'ás', 'á', 'emos', 'éis', 'án'],
  },
  conditional: {
    id: 'conditional', name: 'Conditional', level: 'beginner', type: 'stemAdd',
    english: 'would do',
    endings: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'],
  },
  presentProgressive: {
    id: 'presentProgressive', name: 'Present Progressive', level: 'intermediate', type: 'progressive',
    english: 'is doing right now',
  },
  presentPerfect: {
    id: 'presentPerfect', name: 'Present Perfect', level: 'intermediate', type: 'compound',
    english: 'have done', auxTense: 'present',
  },
  pastPerfect: {
    id: 'pastPerfect', name: 'Past Perfect', level: 'intermediate', type: 'compound',
    english: 'had done', auxTense: 'imperfect',
  },
  futurePerfect: {
    id: 'futurePerfect', name: 'Future Perfect', level: 'intermediate', type: 'compound',
    english: 'will have done', auxTense: 'future',
  },
  conditionalPerfect: {
    id: 'conditionalPerfect', name: 'Conditional Perfect', level: 'intermediate', type: 'compound',
    english: 'would have done', auxTense: 'conditional',
  },
  presentSubjunctive: {
    id: 'presentSubjunctive', name: 'Present Subjunctive', level: 'advanced', type: 'simple',
    english: '(that) I do — subjunctive mood',
    endings: {
      ar: ['e', 'es', 'e', 'emos', 'éis', 'en'],
      er: ['a', 'as', 'a', 'amos', 'áis', 'an'],
      ir: ['a', 'as', 'a', 'amos', 'áis', 'an'],
    },
  },
  imperfectSubjunctive: {
    id: 'imperfectSubjunctive', name: 'Imperfect Subjunctive', level: 'advanced', type: 'derived',
    english: '(that) I did / were to do — subjunctive mood',
  },
  presentPerfectSubjunctive: {
    id: 'presentPerfectSubjunctive', name: 'Present Perfect Subjunctive', level: 'advanced', type: 'compound',
    english: '(that) I have done — subjunctive mood', auxTense: 'presentSubjunctive',
  },
  pastPerfectSubjunctive: {
    id: 'pastPerfectSubjunctive', name: 'Past Perfect Subjunctive', level: 'advanced', type: 'compound',
    english: '(that) I had done — subjunctive mood', auxTense: 'imperfectSubjunctive',
  },
  imperative: {
    id: 'imperative', name: 'Imperative', level: 'advanced', type: 'imperative',
    english: 'command form (Do it!)',
  },
};

const TENSE_LEVELS = {
  beginner: ['present', 'preterite', 'imperfect', 'future', 'conditional'],
  intermediate: ['presentProgressive', 'presentPerfect', 'pastPerfect', 'futurePerfect', 'conditionalPerfect'],
  advanced: ['presentSubjunctive', 'imperfectSubjunctive', 'presentPerfectSubjunctive', 'pastPerfectSubjunctive', 'imperative'],
};

function getTense(id) {
  return TENSES[id];
}

function allTenseIds() {
  return Object.keys(TENSES);
}


// ---- js/data/achievementsData.js ----
// ============================================================
// achievementsData.js — dedicated data file. Each achievement
// has an id, name, description, icon, and a `check(stats)`
// predicate. `stats` is the summarized-state object built by
// engine/achievements.js from the player state.
// ============================================================

const ACHIEVEMENTS = [
  {
    id: 'first_word', name: 'First Word', icon: '🌱',
    description: 'Learn your first word.',
    check: (s) => s.wordsDiscovered >= 1,
  },
  {
    id: 'first_verb', name: 'First Verb', icon: '⚡',
    description: 'Complete your first verb in the Conjugation Arena.',
    check: (s) => s.verbsCompleted >= 1,
  },
  {
    id: 'hundred_words', name: '100 Words', icon: '📚',
    description: 'Learn 100 words.',
    check: (s) => s.wordsDiscovered >= 100,
  },
  {
    id: 'verb_master', name: 'Verb Master', icon: '🏆',
    description: 'Master all six persons of a verb in one tense.',
    check: (s) => s.tensesMastered >= 1,
  },
  {
    id: 'tense_master', name: 'Tense Master', icon: '🎯',
    description: 'Master a complete tense across a verb.',
    check: (s) => s.tensesMastered >= 1,
  },
  {
    id: 'perfect_round', name: 'Perfect Round', icon: '💎',
    description: 'Complete a Challenge Mode round without a single mistake.',
    check: (s) => s.perfectRounds >= 1,
  },
  {
    id: 'seven_day_streak', name: '7 Day Streak', icon: '🔥',
    description: 'Practice for seven consecutive days.',
    check: (s) => s.longestStreak >= 7,
  },
  {
    id: 'thousand_xp', name: '1000 XP', icon: '✨',
    description: 'Earn 1,000 XP.',
    check: (s) => s.totalXp >= 1000,
  },
  {
    id: 'hundred_questions', name: '100 Questions', icon: '🧠',
    description: 'Answer 100 questions.',
    check: (s) => s.totalQuestions >= 100,
  },
];

function getAchievement(id) {
  return ACHIEVEMENTS.find((a) => a.id === id);
}


// ---- js/engine/conjugationEngine.js ----
// ============================================================
// conjugationEngine.js — GAME LOGIC, no UI, no data literals
// (all word data comes from data/verbs.js and data/tenses.js).
//
// Design: never hand-wave a Spanish conjugation with naive
// string slicing alone. Regular endings + stem-changes +
// spelling-changes are modeled as explicit rules, and any verb
// can override individual cells. Overrides always win.
// ============================================================



const VOWELS = 'aeiouáéíóú';

function stripAccents(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function classEnding(cls) {
  return cls; // 'ar' | 'er' | 'ir'
}

function getStem(infinitive, cls) {
  return infinitive.slice(0, infinitive.length - 2);
}

// ---- stem-change application (present, present subjunctive, and the
// "boot" pattern: applies to yo/tu/el/ellos, NOT nosotros/vosotros) ----
function applyBootStemChange(stem, type) {
  const map = {
    'e-ie': () => lastVowelReplace(stem, 'e', 'ie'),
    'o-ue': () => lastVowelReplace(stem, 'o', 'ue'),
    'e-i': () => lastVowelReplace(stem, 'e', 'i'),
    'u-ue': () => lastVowelReplace(stem, 'u', 'ue'),
  };
  return map[type] ? map[type]() : stem;
}

function lastVowelReplace(stem, from, to) {
  const idx = stem.lastIndexOf(from);
  if (idx === -1) return stem;
  return stem.slice(0, idx) + to + stem.slice(idx + from.length);
}

// -ir stem-changers get a SECONDARY change in preterite (3rd persons),
// imperfect subjunctive (derived from those), and the gerund:
// e-ie -> e-i, o-ue -> o-u, e-i stays e-i
function secondaryChange(type) {
  return { 'e-ie': 'e-i', 'o-ue': 'o-u', 'e-i': 'e-i', 'u-ue': null }[type] || null;
}

function applySecondaryStemChange(stem, secType) {
  if (!secType) return stem;
  const [from, to] = secType.split('-');
  return lastVowelReplace(stem, from, to);
}

// ---- spelling-change rules, applied to a stem+ending combination based
// on the letter that FOLLOWS (mimicking Spanish orthographic rules) ----
function applySpellingChange(stem, spelling, endingFirstLetterRaw) {
  if (!spelling) return stem;
  const endingFirstLetter = stripAccents(endingFirstLetterRaw);
  const front = 'ei'; // soft vowels trigger the changes
  const isFront = front.includes(endingFirstLetter);
  switch (spelling) {
    case 'car': return isFront ? stem.replace(/c$/, 'qu') : stem;
    case 'gar': return isFront ? stem.replace(/g$/, 'gu') : stem;
    case 'zar': return isFront ? stem.replace(/z$/, 'c') : stem;
    case 'cer-zc': return 'ao'.includes(endingFirstLetter) ? stem.replace(/c$/, 'zc') : stem;
    case 'ger-j': return 'ao'.includes(endingFirstLetter) ? stem.replace(/g$/, 'j') : stem;
    case 'gir-j': return 'ao'.includes(endingFirstLetter) ? stem.replace(/g$/, 'j') : stem;
    case 'guir-g': return 'ao'.includes(endingFirstLetter) ? stem.replace(/gu$/, 'g') : stem;
    default: return stem;
  }
}

// -uir verbs (not -guir) insert "y" between stem and ending, except before
// endings that already start with "i" (nosotros/vosotros: -imos, -ís)
function applyUirY(stem, ending) {
  if (stripAccents(ending).startsWith('i')) return stem + ending;
  return stem + 'y' + ending;
}

function addAccentToLastVowel(stem) {
  const map = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };
  for (let i = stem.length - 1; i >= 0; i--) {
    if ('aeiou'.includes(stem[i])) {
      return stem.slice(0, i) + map[stem[i]] + stem.slice(i + 1);
    }
  }
  return stem;
}

// ============================================================
// Simple-tense generator: present, preterite, imperfect,
// presentSubjunctive (endings tables live in data/tenses.js)
// ============================================================
function generateSimpleTense(verb, tenseId) {
  const tense = getTense(tenseId);
  const endings = tense.endings[verb.class];

  // presentSubjunctive: the stem is normally derived from the irregular YO
  // present (minus final -o) or the cer/cir->zc spelling change, which
  // correctly captures tener->tenga, hacer->haga, decir->diga, venir->venga,
  // salir->salga, conocer->conozca, producir->produzca, etc. This takes
  // priority over boot stem-changes, which would otherwise misfire (e.g.
  // "tiena" instead of "tenga").
  if (tenseId === 'presentSubjunctive') {
    let irregularStem = null;
    if (verb.irregularYo) irregularStem = verb.irregularYo.replace(/o$/, '');
    else if (verb.spelling === 'cer-zc') irregularStem = getStem(verb.id, verb.class).replace(/c$/, 'zc');
    if (irregularStem) return endings.map((e) => irregularStem + e);
  }

  const forms = [];
  for (let i = 0; i < 6; i++) {
    let stem = getStem(verb.id, verb.class);
    const ending = endings[i];

    // present / presentSubjunctive: boot stem-change applies to persons
    // 0,1,2,5 (yo, tu, el, ellos) but NOT 3,4 (nosotros, vosotros)
    if ((tenseId === 'present' || tenseId === 'presentSubjunctive') && verb.stemChange) {
      if ([0, 1, 2, 5].includes(i)) stem = applyBootStemChange(stem, verb.stemChange);
    }

    // preterite: -ir stem-changers get the secondary change on el/ellos (2,5)
    if (tenseId === 'preterite' && verb.stemChange && verb.class === 'ir') {
      if ([2, 5].includes(i)) stem = applySecondaryStemChange(stem, secondaryChange(verb.stemChange));
    }

    // presentSubjunctive: -ir stem-changers ALSO change nosotros/vosotros (3,4) with secondary change
    if (tenseId === 'presentSubjunctive' && verb.stemChange && verb.class === 'ir') {
      if ([3, 4].includes(i)) stem = applySecondaryStemChange(stem, secondaryChange(verb.stemChange));
    }

    // spelling changes keyed off the letter the ending starts with
    if (verb.spelling && verb.spelling !== 'uir-y') {
      stem = applySpellingChange(stem, verb.spelling, ending[0]);
    }

    let word;
    if (verb.spelling === 'uir-y' && tenseId === 'present') {
      word = applyUirY(stem, ending);
    } else if (verb.spelling === 'uir-y' && tenseId === 'preterite' && (i === 2 || i === 5)) {
      // incluir -> incluyó / incluyeron (unstressed i between vowels becomes y)
      word = stem + ending.replace(/^i/, 'y');
    } else if (verb.spelling === 'eer-y' && tenseId === 'preterite' && (i === 2 || i === 5)) {
      // leer -> leyó / leyeron  (unstressed i between vowels becomes y)
      word = stem + ending.replace(/^i/, 'y');
    } else if (verb.spelling === 'eer-y' && tenseId === 'preterite' && [1, 3, 4].includes(i)) {
      // leer -> leíste / leímos / leísteis (accent breaks the vowel hiatus)
      word = stem + ending.replace(/^i/, 'í');
    } else {
      word = stem + ending;
    }
    forms.push(word);
  }

  return forms;
}

function generatePresentWithIrregularYo(forms, verb) {
  if (verb.irregularYo) forms[0] = verb.irregularYo;
  return forms;
}

function generateStemAddTense(verb, tenseId) {
  const tense = getTense(tenseId);
  const base = verb.futureStem || verb.id; // full infinitive by default
  return tense.endings.map((e) => base + e);
}

function getGerund(verb) {
  if (verb.gerund) return verb.gerund;
  const stem = getStem(verb.id, verb.class);
  if (verb.class === 'ar') return stem + 'ando';
  return stem + 'iendo';
}

function getPastParticiple(verb) {
  if (verb.pastParticiple) return verb.pastParticiple;
  const stem = getStem(verb.id, verb.class);
  return verb.class === 'ar' ? stem + 'ado' : stem + 'ido';
}

const HABER = {
  present: ['he', 'has', 'ha', 'hemos', 'habéis', 'han'],
  imperfect: ['había', 'habías', 'había', 'habíamos', 'habíais', 'habían'],
  future: ['habré', 'habrás', 'habrá', 'habremos', 'habréis', 'habrán'],
  conditional: ['habría', 'habrías', 'habría', 'habríamos', 'habríais', 'habrían'],
  presentSubjunctive: ['haya', 'hayas', 'haya', 'hayamos', 'hayáis', 'hayan'],
};

const ESTAR_PRESENT = ['estoy', 'estás', 'está', 'estamos', 'estáis', 'están'];

function generateImperfectSubjunctive(verb) {
  const preteriteForms = conjugate(verb.id, 'preterite');
  const ellosForm = preteriteForms[5];
  const stem = ellosForm.replace(/ron$/, '');
  return [
    stem + 'ra',
    stem + 'ras',
    stem + 'ra',
    addAccentToLastVowel(stem) + 'ramos',
    stem + 'rais',
    stem + 'ran',
  ];
}

function generateCompoundTense(verb, tenseId) {
  const tense = getTense(tenseId);
  const auxForms = tense.auxTense === 'imperfectSubjunctive'
    ? generateImperfectSubjunctive({ id: 'haber', class: 'er' })
    : HABER[tense.auxTense];
  const participle = getPastParticiple(verb);
  return auxForms.map((h) => `${h} ${participle}`);
}

function generateProgressive(verb) {
  const gerund = getGerund(verb);
  return ESTAR_PRESENT.map((e) => `${e} ${gerund}`);
}

// Imperative: affirmative commands. Yo has no imperative (marked null).
// tú = present él/ella form (regular) unless verb.imperativeIrregularTu.
// usted / nosotros / vosotros / ustedes derive from present subjunctive,
// except vosotros = infinitive minus final -r, plus -d.
function generateImperative(verb) {
  const subjunctive = conjugate(verb.id, 'presentSubjunctive');
  const presentForms = conjugate(verb.id, 'present');
  const tu = verb.imperativeIrregularTu || presentForms[2]; // él form
  const usted = subjunctive[2];
  const nosotros = subjunctive[3];
  const vosotros = verb.id.slice(0, -1) + 'd';
  const ustedes = subjunctive[5];
  // Order matches PERSONS array for consistent UI, yo has no imperative.
  return [null, tu, usted, nosotros, vosotros, ustedes];
}

const cache = new Map();

/**
 * Returns an array of 6 conjugated forms (order = data/tenses.js PERSONS)
 * for the given verbId + tenseId. Always checks verb.overrides first.
 */
function conjugate(verbId, tenseId) {
  const cacheKey = `${verbId}:${tenseId}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const verb = getVerb(verbId);
  if (!verb) throw new Error(`Unknown verb: ${verbId}`);
  const tense = getTense(tenseId);
  if (!tense) throw new Error(`Unknown tense: ${tenseId}`);

  // 1. Full manual override for this exact tense wins outright.
  if (verb.overrides && verb.overrides[tenseId]) {
    cache.set(cacheKey, verb.overrides[tenseId]);
    return verb.overrides[tenseId];
  }

  let forms;
  if (tenseId === 'presentSubjunctive' && verb.subjOverride) {
    forms = verb.subjOverride;
  } else if (tense.type === 'simple') {
    forms = generateSimpleTense(verb, tenseId);
    if (tenseId === 'present') forms = generatePresentWithIrregularYo(forms, verb);
  } else if (tense.type === 'stemAdd') {
    forms = generateStemAddTense(verb, tenseId);
  } else if (tense.type === 'compound') {
    forms = generateCompoundTense(verb, tenseId);
  } else if (tense.type === 'progressive') {
    forms = generateProgressive(verb);
  } else if (tense.type === 'derived') {
    forms = generateImperfectSubjunctive(verb);
  } else if (tense.type === 'imperative') {
    forms = generateImperative(verb);
  } else {
    throw new Error(`No generator for tense type ${tense.type}`);
  }

  cache.set(cacheKey, forms);
  return forms;
}

function conjugatePerson(verbId, tenseId, person) {
  const idx = PERSONS.indexOf(person);
  return conjugate(verbId, tenseId)[idx];
}


// ---- js/engine/mastery.js ----
// ============================================================
// mastery.js — GAME LOGIC for tracking what the player knows.
// Two parallel systems:
//   1. Vocabulary mastery (flashcards) — lightweight SRS.
//   2. Verb/tense mastery (conjugation) — per-person scores.
// Both live under playerState and are pure data; this module
// only contains functions that transform that data.
// ============================================================



const DAY_MS = 24 * 60 * 60 * 1000;

function newVocabRecord() {
  return {
    score: 0,
    interval: 0,
    ease: SRS.DEFAULT_EASE,
    dueDate: Date.now(),
    lastSeen: null,
    seenCount: 0,
    correctCount: 0,
    status: 'new', // new | learning | review | mastered
  };
}

function deriveStatus(record) {
  if (record.seenCount === 0) return 'new';
  if (record.score >= SRS.MASTERED_SCORE && record.interval >= SRS.MASTERED_MIN_INTERVAL_DAYS) return 'mastered';
  if (record.score <= SRS.LEARNING_MAX_SCORE || record.interval < 1) return 'learning';
  return 'review';
}

/**
 * Apply a flashcard rating (AGAIN/HARD/GOOD/EASY) to a vocab record.
 * Returns a NEW record object (does not mutate input).
 */
function applyFlashcardRating(record, rating) {
  const rule = SRS[rating];
  if (!rule) throw new Error(`Unknown rating: ${rating}`);
  const next = { ...record };

  next.ease = clamp(next.ease + rule.easeDelta, SRS.MIN_EASE, SRS.MAX_EASE);
  next.score = clamp(next.score + rule.scoreDelta, 0, 100);
  next.seenCount += 1;
  next.lastSeen = Date.now();

  if (rating === 'AGAIN') {
    next.interval = 0;
    next.dueDate = Date.now(); // due again immediately/this session
  } else {
    next.correctCount += 1;
    const baseInterval = next.interval > 0 ? next.interval : SRS.STARTING_INTERVAL_DAYS;
    next.interval = Math.max(rule.intervalMinDays, baseInterval * rule.intervalMult * (next.ease / SRS.DEFAULT_EASE));
    next.dueDate = Date.now() + next.interval * DAY_MS;
  }

  next.status = deriveStatus(next);
  return next;
}

function isDue(record) {
  return record.status === 'new' || Date.now() >= record.dueDate;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// ---------------- Verb / tense mastery ----------------

function newVerbTenseRecord() {
  const perPerson = {};
  PERSONS.forEach((p) => { perPerson[p] = 0; });
  return { perPerson, attempts: 0, correct: 0 };
}

/**
 * Apply a right/wrong conjugation answer for one person of one tense.
 * Returns a NEW record.
 */
function applyConjugationResult(record, person, wasCorrect) {
  const next = { ...record, perPerson: { ...record.perPerson } };
  const delta = wasCorrect ? VERB_MASTERY.CORRECT_DELTA : VERB_MASTERY.INCORRECT_DELTA;
  next.perPerson[person] = clamp((next.perPerson[person] || 0) + delta, 0, 100);
  next.attempts += 1;
  if (wasCorrect) next.correct += 1;
  return next;
}

function tenseScore(record) {
  const values = Object.values(record.perPerson);
  if (!values.length) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function isTenseMastered(record) {
  return Object.values(record.perPerson).every((v) => v >= VERB_MASTERY.TENSE_MASTERED_SCORE);
}

function verbOverallScore(verbState) {
  const tenseIds = Object.keys(verbState || {});
  if (!tenseIds.length) return 0;
  const scores = tenseIds.map((t) => tenseScore(verbState[t]));
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}


// ---- js/engine/xpLevels.js ----
// ============================================================
// xpLevels.js — GAME LOGIC for XP totals and level lookups.
// ============================================================


function levelForXp(totalXp) {
  let current = LEVEL_THRESHOLDS[0];
  for (const tier of LEVEL_THRESHOLDS) {
    if (totalXp >= tier.xpRequired) current = tier;
    else break;
  }
  return current;
}

function xpProgress(totalXp) {
  const idx = LEVEL_THRESHOLDS.findIndex((t) => t.level === levelForXp(totalXp).level);
  const current = LEVEL_THRESHOLDS[idx];
  const next = LEVEL_THRESHOLDS[idx + 1];
  if (!next) return { current, next: null, pct: 1, xpIntoLevel: totalXp - current.xpRequired, xpForLevel: 0 };
  const span = next.xpRequired - current.xpRequired;
  const into = totalXp - current.xpRequired;
  return { current, next, pct: clamp01(into / span), xpIntoLevel: into, xpForLevel: span };
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}


// ---- js/engine/achievements.js ----
// ============================================================
// achievements.js — GAME LOGIC. Summarizes playerState into a
// flat stats object, then checks it against data/achievementsData.js.
// ============================================================



function buildStatsSummary(state) {
  const wordsDiscovered = Object.values(state.vocabMastery).filter((r) => r.seenCount > 0).length;
  let tensesMastered = 0;
  let verbsCompleted = state.stats.verbsCompleted || 0;
  Object.values(state.verbMastery).forEach((tenseMap) => {
    Object.values(tenseMap).forEach((record) => {
      if (isTenseMastered(record)) tensesMastered += 1;
    });
  });

  return {
    wordsDiscovered,
    tensesMastered,
    verbsCompleted,
    perfectRounds: state.stats.perfectRounds || 0,
    longestStreak: state.streak.longest || 0,
    totalXp: state.xp || 0,
    totalQuestions: state.stats.totalQuestions || 0,
  };
}

/**
 * Checks all achievements against current state. Returns the list of
 * achievement ids that are newly unlocked (weren't before, are now).
 */
function checkAchievements(state) {
  const stats = buildStatsSummary(state);
  const newlyUnlocked = [];
  ACHIEVEMENTS.forEach((ach) => {
    const already = state.achievements[ach.id]?.earned;
    if (!already && ach.check(stats)) {
      state.achievements[ach.id] = { earned: true, earnedDate: Date.now() };
      newlyUnlocked.push(ach.id);
    }
  });
  return newlyUnlocked;
}


// ---- js/engine/questionGenerator.js ----
// ============================================================
// questionGenerator.js — GAME LOGIC. Produces structured
// question objects: { id, type, prompt, correctAnswer, choices,
// explanation, vocabularyIds, verbId, tense, person, difficulty }
// so the mastery system always knows exactly what was tested.
// ============================================================





let qid = 0;
const nextQid = () => `q_${Date.now().toString(36)}_${(qid++).toString(36)}`;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sample(arr, n) {
  return shuffle(arr).slice(0, n);
}

// ---------------- Vocabulary questions ----------------

function buildVocabTranslationQuestion(vocabItem, direction = 'es-en') {
  const isEsToEn = direction === 'mixed' ? Math.random() < 0.5 : direction === 'es-en';
  const correct = isEsToEn ? vocabItem.english : vocabItem.spanish;
  const pool = isEsToEn ? VOCABULARY.map((v) => v.english) : VOCABULARY.map((v) => v.spanish);
  return {
    id: nextQid(),
    type: 'VOCABULARY_TRANSLATION',
    prompt: isEsToEn ? vocabItem.spanish : vocabItem.english,
    correctAnswer: correct,
    choices: null,
    wordBank: buildWordBankForAnswer(correct, pool, 4),
    explanation: vocabItem.exampleSentence || `${vocabItem.spanish} = ${vocabItem.english}`,
    vocabularyIds: [vocabItem.id],
    verbId: null, tense: null, person: null,
    difficulty: vocabItem.difficulty,
    direction: isEsToEn ? 'es-en' : 'en-es',
  };
}

function buildVocabMultipleChoiceQuestion(vocabItem, pool, direction = 'es-en', choiceCount = 4) {
  const isEsToEn = direction === 'mixed' ? Math.random() < 0.5 : direction === 'es-en';
  const correct = isEsToEn ? vocabItem.english : vocabItem.spanish;
  const distractorPool = pool.filter((v) => v.id !== vocabItem.id && v.category === vocabItem.category);
  const fallbackPool = pool.filter((v) => v.id !== vocabItem.id);
  const source = distractorPool.length >= choiceCount - 1 ? distractorPool : fallbackPool;
  const distractors = sample(source, choiceCount - 1).map((v) => (isEsToEn ? v.english : v.spanish));
  const choices = shuffle([correct, ...distractors]);
  return {
    id: nextQid(),
    type: 'VOCABULARY_MULTIPLE_CHOICE',
    prompt: isEsToEn ? vocabItem.spanish : vocabItem.english,
    correctAnswer: correct,
    choices,
    explanation: vocabItem.exampleSentence || `${vocabItem.spanish} = ${vocabItem.english}`,
    vocabularyIds: [vocabItem.id],
    verbId: null, tense: null, person: null,
    difficulty: vocabItem.difficulty,
  };
}

// ---------------- Conjugation questions ----------------

function buildConjugationQuestion(verbId, tenseId, person, mode = 'production', choiceCount = 4) {
  const verb = VERBS[verbId];
  const forms = conjugate(verbId, tenseId);
  const idx = PERSONS.indexOf(person);
  const correctAnswer = forms[idx];
  const subject = PERSON_SUBJECTS[person];

  let choices = null;
  let wordBank = null;
  const otherPersonForms = forms.filter((f, i) => i !== idx && f);
  const otherVerbForms = sample(allVerbIds().filter((v) => v !== verbId), 3)
    .map((v) => conjugate(v, tenseId)[idx])
    .filter(Boolean);
  const distractorSource = [...new Set([...otherPersonForms, ...otherVerbForms])].filter((f) => f !== correctAnswer);

  if (mode === 'recognition') {
    choices = shuffle([correctAnswer, ...sample(distractorSource, choiceCount - 1)]);
  } else {
    wordBank = buildWordBankForAnswer(correctAnswer, distractorSource, 4);
  }

  const prompt = mode === 'recognition'
    ? `${subject} ______ ${sentenceTail(verbId)}`
    : `Conjugate ${verb.id}: ${subject} ${verb.id} ${sentenceTail(verbId)}`;

  return {
    id: nextQid(),
    type: mode === 'recognition' ? 'CONJUGATION_MULTIPLE_CHOICE' : 'CONJUGATION_INPUT',
    prompt,
    correctAnswer,
    choices,
    wordBank,
    explanation: `${subject} + ${verb.english.replace(/^to /, '')} → ${correctAnswer}`,
    vocabularyIds: [],
    verbId, tense: tenseId, person,
    difficulty: 1,
  };
}

// A tiny bit of flavor text so conjugation prompts don't feel like bare blanks.
const OBJECT_HINTS = {
  tener: 'un coche.', hacer: 'la tarea.', ir: 'a la playa.', poder: 'venir hoy.',
  querer: 'un café.', decir: 'la verdad.', venir: 'a la fiesta.', poner: 'la mesa.',
  saber: 'la respuesta.', conocer: 'a María.', dar: 'un regalo.', ver: 'una película.',
  salir: 'de casa.', comer: 'una manzana.', vivir: 'en Madrid.', hablar: 'español.',
  estudiar: 'para el examen.', trabajar: 'mucho.', comprar: 'pan.', jugar: 'al fútbol.',
  dormir: 'ocho horas.', pedir: 'ayuda.', leer: 'un libro.', escribir: 'una carta.',
};
function sentenceTail(verbId) {
  return OBJECT_HINTS[verbId] || '.';
}

// ---------------- Adjective agreement ----------------

const ADJ_TAIL_NOUNS = [
  { es: 'la casa', gender: 'f', plural: false }, { es: 'el coche', gender: 'm', plural: false },
  { es: 'las flores', gender: 'f', plural: true }, { es: 'los libros', gender: 'm', plural: true },
];

function agree(adjective, gender, plural) {
  let base = adjective.spanish;
  // very lightweight agreement: strip trailing -o for masculine base adjectives
  if (gender === 'f') {
    if (base.endsWith('o')) base = base.slice(0, -1) + 'a';
  }
  if (plural) {
    if (/[aeiouáéíóú]$/.test(base)) base += 's';
    else if (base.endsWith('z')) base = base.slice(0, -1) + 'ces';
    else base += 'es';
  }
  return base;
}

function buildAdjectiveAgreementQuestion(adjectiveVocab) {
  const noun = ADJ_TAIL_NOUNS[Math.floor(Math.random() * ADJ_TAIL_NOUNS.length)];
  const correctAnswer = agree(adjectiveVocab, noun.gender, noun.plural);
  const verb = (noun.gender === 'f' ? (noun.plural ? 'son' : 'es') : (noun.plural ? 'son' : 'es'));
  const distractorForms = shuffle(ADJECTIVE_ROWS)
    .map((adj) => agree({ spanish: adj[0] }, noun.gender, noun.plural))
    .filter((form) => form !== correctAnswer)
    .slice(0, 3);
  return {
    id: nextQid(),
    type: 'ADJECTIVE_AGREEMENT',
    prompt: `${capitalize(noun.es)} ${verb} ______.`,
    correctAnswer,
    choices: null,
    wordBank: shuffle([correctAnswer, ...distractorForms]),
    explanation: `"${adjectiveVocab.spanish}" agrees in gender and number with "${noun.es}" → ${correctAnswer}.`,
    vocabularyIds: [adjectiveVocab.id],
    verbId: null, tense: null, person: null,
    difficulty: adjectiveVocab.difficulty,
  };
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ---------------- Sentence builder ----------------

const SENTENCE_TEMPLATES = [
  {
    english: 'I have a big house.', words: ['yo', 'tengo', 'una', 'casa', 'grande'],
    correctOrder: ['yo', 'tengo', 'una', 'casa', 'grande'],
    explanation: 'Grande agrees with casa and comes after the noun.',
  },
  {
    english: 'I want a small car.', words: ['quiero', 'un', 'coche', 'pequeño', 'yo'],
    correctOrder: ['yo', 'quiero', 'un', 'coche', 'pequeño'],
    explanation: 'Descriptive adjectives like pequeño usually follow the noun.',
  },
  {
    english: 'She is very intelligent.', words: ['ella', 'es', 'muy', 'inteligente'],
    correctOrder: ['ella', 'es', 'muy', 'inteligente'],
    explanation: 'Muy intensifies the adjective and sits right before it.',
  },
  {
    english: "We don't understand the question.", words: ['no', 'entendemos', 'la', 'pregunta', 'nosotros'],
    correctOrder: ['nosotros', 'no', 'entendemos', 'la', 'pregunta'],
    explanation: 'No goes immediately before the conjugated verb.',
  },
  {
    english: 'They are going to the beach tomorrow.', words: ['ellos', 'van', 'a', 'la', 'playa', 'mañana'],
    correctOrder: ['ellos', 'van', 'a', 'la', 'playa', 'mañana'],
    explanation: 'Ir a + place is the standard way to say "going to" a location.',
  },
  {
    english: 'My sister works in the city.', words: ['mi', 'hermana', 'trabaja', 'en', 'la', 'ciudad'],
    correctOrder: ['mi', 'hermana', 'trabaja', 'en', 'la', 'ciudad'],
    explanation: 'Possessives like mi come before the noun they modify.',
  },
  {
    english: 'You always arrive late.', words: ['tú', 'siempre', 'llegas', 'tarde'],
    correctOrder: ['tú', 'siempre', 'llegas', 'tarde'],
    explanation: 'Frequency adverbs like siempre typically go right before the verb.',
  },
  {
    english: 'I need to buy bread today.', words: ['necesito', 'comprar', 'pan', 'hoy', 'yo'],
    correctOrder: ['yo', 'necesito', 'comprar', 'pan', 'hoy'],
    explanation: 'Necesitar + infinitive expresses needing to do something.',
  },
];

function buildSentenceBuilderQuestion() {
  const t = SENTENCE_TEMPLATES[Math.floor(Math.random() * SENTENCE_TEMPLATES.length)];
  return {
    id: nextQid(),
    type: 'SENTENCE_BUILDER',
    prompt: t.english,
    correctAnswer: t.correctOrder.join(' '),
    choices: shuffle(t.words),
    explanation: t.explanation,
    vocabularyIds: [],
    verbId: null, tense: null, person: null,
    difficulty: 1,
  };
}

// ---------------- Translation (free sentences) ----------------

const TRANSLATION_PAIRS = [
  { es: 'No entiendo.', en: "I don't understand." },
  { es: '¿Cómo estás?', en: 'How are you?' },
  { es: 'Tengo hambre.', en: "I'm hungry." },
  { es: 'Me gusta el café.', en: 'I like coffee.' },
  { es: '¿Dónde está el baño?', en: 'Where is the bathroom?' },
  { es: 'Voy a estudiar mañana.', en: "I'm going to study tomorrow." },
  { es: 'Ella trabaja mucho.', en: 'She works a lot.' },
  { es: 'Necesito ayuda.', en: 'I need help.' },
];

const COMMON_ENGLISH_WORDS = ['the', 'to', 'and', 'is', 'am', 'are', 'have', 'I', 'you', 'he', 'she', 'we', 'they', 'really', 'very', 'good', 'bad', 'please'];
const COMMON_SPANISH_WORDS = ['el', 'la', 'los', 'las', 'un', 'una', 'yo', 'tú', 'él', 'ella', 'es', 'son', 'no', 'sí', 'por', 'para'];

function buildTranslationQuestion() {
  const pair = TRANSLATION_PAIRS[Math.floor(Math.random() * TRANSLATION_PAIRS.length)];
  const esToEn = Math.random() < 0.5;
  const correctAnswer = esToEn ? pair.en : pair.es;
  const extras = esToEn ? COMMON_ENGLISH_WORDS : COMMON_SPANISH_WORDS;
  return {
    id: nextQid(),
    type: 'TRANSLATION',
    prompt: esToEn ? pair.es : pair.en,
    correctAnswer,
    choices: null,
    wordBank: buildWordBankFromPhrase(correctAnswer, extras),
    explanation: `${pair.es} = ${pair.en}`,
    vocabularyIds: [],
    verbId: null, tense: null, person: null,
    difficulty: 2,
  };
}

function allTensesForLevel(level) {
  return TENSE_LEVELS[level] || TENSE_LEVELS.beginner;
}

function buildWordBankForAnswer(correctAnswer, pool = [], count = 4) {
  const answer = String(correctAnswer || '').trim();
  const candidates = pool
    .map((item) => String(item || '').trim())
    .filter((item) => item && item !== answer);
  const distractors = sample(candidates, Math.min(count - 1, candidates.length));
  return shuffle([answer, ...distractors]);
}

function buildWordBankFromPhrase(correctAnswer, extras = [], maxTokens = 10) {
  const tokens = [...new Set(String(correctAnswer || '').split(/\s+/).filter(Boolean))];
  const extraTokens = extras.filter((token) => token && !tokens.includes(token)).slice(0, maxTokens - tokens.length);
  return shuffle([...tokens, ...extraTokens]);
}


// ---- js/engine/quickPlay.js ----
// ============================================================
// quickPlay.js — GAME LOGIC. The single most important feature:
// press one button, get a personalized session built from what
// the player actually needs to practice.
// ============================================================








function weightedShuffle(items, weightFn) {
  return items
    .map((item) => ({ item, sortKey: Math.random() * weightFn(item) }))
    .sort((a, b) => b.sortKey - a.sortKey)
    .map((x) => x.item);
}

function getVocabRecord(state, vocabId) {
  return state.vocabMastery[vocabId] || newVocabRecord();
}

/** Vocab items ranked by "how much the player needs this right now". */
function rankedVocabPool(state) {
  return weightedShuffle(VOCABULARY, (v) => {
    const rec = getVocabRecord(state, v.id);
    if (rec.seenCount === 0) return 1; // new words: modest weight
    const dueBoost = isDue(rec) ? 3 : 0.3;
    const weaknessBoost = (100 - rec.score) / 20; // lower score => higher weight
    return dueBoost + weaknessBoost;
  });
}

/** Verb/tense combos ranked by weakness (lower score = higher priority). */
function rankedVerbTensePool(state, level = 'beginner') {
  const tenseIds = TENSE_LEVELS[level];
  const combos = [];
  allVerbIds().forEach((verbId) => {
    tenseIds.forEach((tenseId) => {
      const record = state.verbMastery[verbId]?.[tenseId] || newVerbTenseRecord();
      combos.push({ verbId, tenseId, score: tenseScore(record) });
    });
  });
  return weightedShuffle(combos, (c) => (100 - c.score) / 20 + 0.5);
}

/**
 * Builds a Quick Play session: an ordered array of question objects
 * mixing vocab review, conjugation, adjective agreement, and sentence
 * building, prioritizing low-mastery / due / recently-missed material.
 */
function buildQuickPlaySession(state) {
  const mix = QUICK_PLAY.MIX;
  const difficulty = DIFFICULTY_SETTINGS[state.settings.difficulty] || DIFFICULTY_SETTINGS.normal;
  const questions = [];

  // Vocabulary reviews — prioritize due/weak, mix multiple-choice and typed.
  const vocabPool = rankedVocabPool(state);
  const seenPool = vocabPool.filter((v) => getVocabRecord(state, v.id).seenCount > 0);
  const newPool = vocabPool.filter((v) => getVocabRecord(state, v.id).seenCount === 0);

  const vocabReviewItems = (seenPool.length ? seenPool : vocabPool).slice(0, mix.vocabulary);
  vocabReviewItems.forEach((v, i) => {
    questions.push(i % 2 === 0
      ? buildVocabMultipleChoiceQuestion(v, VOCABULARY, 'mixed', difficulty.choiceCount)
      : buildVocabTranslationQuestion(v, 'mixed'));
  });

  // A couple of brand-new words to expand the player's catalog.
  newPool.slice(0, mix.newWords).forEach((v) => {
    questions.push(buildVocabMultipleChoiceQuestion(v, VOCABULARY, 'es-en', difficulty.choiceCount));
  });

  // Conjugations — prioritize weakest verb/tense combos, spread across persons.
  const verbTenseCombos = rankedVerbTensePool(state).slice(0, mix.conjugation);
  verbTenseCombos.forEach((combo, i) => {
    const person = PERSONS[Math.floor(Math.random() * PERSONS.length)];
    const mode = i % 3 === 0 ? 'recognition' : 'production';
    questions.push(buildConjugationQuestion(combo.verbId, combo.tenseId, person, mode, difficulty.choiceCount));
  });

  // Adjective agreement questions.
  const adjectives = VOCABULARY.filter((v) => v.type === 'adjective');
  weightedShuffle(adjectives, () => 1).slice(0, mix.adjectiveAgreement).forEach((adj) => {
    questions.push(buildAdjectiveAgreementQuestion(adj));
  });

  // Sentence builders.
  for (let i = 0; i < mix.sentenceBuilder; i++) {
    questions.push(buildSentenceBuilderQuestion());
  }

  return weightedShuffle(questions, () => 1);
}


// ---- js/storage/persistence.js ----
// ============================================================
// persistence.js — the ONLY module that touches localStorage.
// Everything else reads/writes the in-memory playerState object
// this module hands out. To move to a backend later: keep the
// same load()/save() function signatures, swap the internals.
// ============================================================



function freshState() {
  const achievements = {};
  ACHIEVEMENTS.forEach((a) => { achievements[a.id] = { earned: false, earnedDate: null }; });
  return {
    version: SCHEMA_VERSION,
    xp: 0,
    vocabMastery: {},   // vocabId -> mastery record (see engine/mastery.js)
    verbMastery: {},    // verbId -> { tenseId -> tense record }
    questionHistory: [], // capped ring buffer of recent question results
    arenaRecords: [],
    achievements,
    settings: { difficulty: 'normal', soundEnabled: true },
    streak: { current: 0, longest: 0, lastPracticeDate: null },
    stats: {
      totalQuestions: 0,
      totalCorrect: 0,
      verbsCompleted: 0,
      perfectRounds: 0,
    },
  };
}

let cachedState = null;

function loadState() {
  if (cachedState) return cachedState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cachedState = freshState();
      return cachedState;
    }
    const parsed = JSON.parse(raw);
    cachedState = migrate(parsed);
  } catch (e) {
    console.error('Failed to load player state, starting fresh.', e);
    cachedState = freshState();
  }
  return cachedState;
}

function migrate(state) {
  // Backfill any keys added since the player last saved, and make sure
  // every currently-defined achievement exists in the saved state.
  const fresh = freshState();
  const merged = { ...fresh, ...state };
  merged.vocabMastery = state.vocabMastery || {};
  merged.verbMastery = state.verbMastery || {};
  merged.arenaRecords = state.arenaRecords || [];
  merged.achievements = { ...fresh.achievements, ...(state.achievements || {}) };
  merged.settings = { ...fresh.settings, ...(state.settings || {}) };
  merged.streak = { ...fresh.streak, ...(state.streak || {}) };
  merged.stats = { ...fresh.stats, ...(state.stats || {}) };
  merged.questionHistory = state.questionHistory || [];
  return merged;
}

let saveTimer = null;
function saveState(state) {
  cachedState = state;
  // Debounce writes slightly so rapid-fire answers don't hammer localStorage.
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save player state.', e);
    }
  }, 150);
}

function saveStateNow(state) {
  cachedState = state;
  clearTimeout(saveTimer);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save player state.', e);
  }
}

function resetState() {
  cachedState = freshState();
  saveStateNow(cachedState);
  return cachedState;
}

function recordPracticeToday(state) {
  const todayKey = new Date().toDateString();
  const lastKey = state.streak.lastPracticeDate ? new Date(state.streak.lastPracticeDate).toDateString() : null;
  if (lastKey === todayKey) return state; // already recorded today

  const oneDayMs = 24 * 60 * 60 * 1000;
  const wasYesterday = state.streak.lastPracticeDate && (Date.now() - state.streak.lastPracticeDate) < oneDayMs * 2 &&
    (Date.now() - state.streak.lastPracticeDate) > 0;

  state.streak.current = wasYesterday ? state.streak.current + 1 : 1;
  state.streak.longest = Math.max(state.streak.longest, state.streak.current);
  state.streak.lastPracticeDate = Date.now();
  return state;
}


// ---- js/ui/components.js ----
// ============================================================
// components.js — UI COMPONENTS ONLY. These functions take
// plain data and return DOM elements or HTML strings. No
// mastery math, no persistence, no XP rules live here.
// ============================================================

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c === null || c === undefined) return;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return node;
}

function progressBar(pct, opts = {}) {
  const clamped = Math.max(0, Math.min(100, pct));
  const wrap = el('div', { class: `pbar ${opts.size || ''}` });
  const fill = el('div', { class: 'pbar-fill', style: `width:${clamped}%; background:${opts.color || ''}` });
  wrap.appendChild(fill);
  if (opts.label) wrap.appendChild(el('span', { class: 'pbar-label' }, `${clamped}%`));
  return wrap;
}

function statPill(label, value) {
  return el('div', { class: 'stat-pill' }, [
    el('span', { class: 'stat-value' }, String(value)),
    el('span', { class: 'stat-label' }, label),
  ]);
}

let toastTimer = null;
function showToast(message, kind = 'info') {
  let host = document.getElementById('toast-host');
  if (!host) {
    host = el('div', { id: 'toast-host' });
    document.body.appendChild(host);
  }
  const toast = el('div', { class: `toast toast-${kind}` }, message);
  host.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}

function xpBurst(amount, targetEl) {
  const rect = targetEl ? targetEl.getBoundingClientRect() : { left: window.innerWidth / 2, top: 100 };
  const burst = el('div', { class: 'xp-burst', style: `left:${rect.left}px; top:${rect.top}px;` }, `+${amount} XP`);
  document.body.appendChild(burst);
  requestAnimationFrame(() => burst.classList.add('rise'));
  setTimeout(() => burst.remove(), 1200);
}

function card(children, extraClass = '') {
  return el('div', { class: `card ${extraClass}` }, children);
}

function button(label, onClick, opts = {}) {
  return el('button', { class: `btn ${opts.variant || ''}`, onclick: onClick, disabled: opts.disabled ? 'true' : null }, label);
}

function iconButton(icon, label, onClick, opts = {}) {
  return el('button', { class: `icon-btn ${opts.variant || ''}`, onclick: onClick }, [
    el('span', { class: 'icon-btn-icon' }, icon),
    el('span', { class: 'icon-btn-label' }, label),
  ]);
}

function emptyState(title, subtitle) {
  return el('div', { class: 'empty-state' }, [
    el('div', { class: 'empty-title' }, title),
    el('div', { class: 'empty-subtitle' }, subtitle),
  ]);
}


// ---- js/app.js ----
// ============================================================
// app.js — MAIN CONTROLLER. Owns playerState, renders views,
// wires up events. Delegates all data to data/*, all game
// logic to engine/*, all persistence to storage/*, and all
// generic rendering primitives to ui/components.js.
// ============================================================














function stripAccents(s) {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function normalizeAnswer(s) {
  return stripAccents(String(s || '')).trim().toLowerCase().replace(/\s+/g, ' ');
}

function formatMs(milliseconds) {
  const seconds = Math.round(milliseconds / 100);
  const whole = Math.floor(seconds / 10);
  const tenths = seconds % 10;
  return `${whole}.${tenths}s`;
}

class App {
  constructor(root) {
    this.root = root;
    this.state = loadState();
    this.section = 'home';
    this.practiceTab = 'arena';
  }

  init() {
    recordPracticeToday(this.state);
    saveStateNow(this.state);
    this.render();
  }

  persist() {
    saveState(this.state);
  }

  awardXp(amount) {
    this.state.xp += amount;
    this.state.stats.totalQuestions += 0; // no-op, kept for clarity
  }

  recordQuestionResult({ correct, vocabularyIds = [] }) {
    this.state.stats.totalQuestions += 1;
    if (correct) this.state.stats.totalCorrect += 1;
    vocabularyIds.forEach((id) => {
      if (!this.state.vocabMastery[id]) this.state.vocabMastery[id] = newVocabRecord();
    });
  }

  runAchievementCheck() {
    const unlocked = checkAchievements(this.state);
    unlocked.forEach((id) => {
      const ach = ACHIEVEMENTS.find((a) => a.id === id);
      showToast(`🏅 Achievement unlocked: ${ach.name}`, 'achievement');
    });
    return unlocked;
  }

  navigate(section) {
    this.section = section;
    this.render();
  }

  render() {
    this.root.innerHTML = '';
    this.root.appendChild(this.renderShell());
  }

  renderShell() {
    const shell = el('div', { class: 'app-shell' });
    const content = el('div', { class: 'app-content' });
    content.appendChild(this.renderCurrentSection());
    shell.appendChild(content);
    shell.appendChild(this.renderBottomNav());
    return shell;
  }

  renderTopBar() {
    const { current, pct } = xpProgress(this.state.xp);
    const bar = el('div', { class: 'topbar' }, [
      el('div', { class: 'brand' }, [
        el('span', { class: 'brand-mark' }, '¡Ánimo!'),
        el('span', { class: 'brand-sub' }, 'Spanish Arena'),
      ]),
      el('div', { class: 'topbar-stats' }, [
        el('div', { class: 'level-chip' }, [
          el('span', { class: 'level-num' }, `Lv ${current.level}`),
          el('span', { class: 'level-name' }, current.name),
        ]),
        (() => {
          const wrap = el('div', { class: 'xp-chip' });
          wrap.appendChild(progressBar(pct * 100, { size: 'sm' }));
          wrap.appendChild(el('span', { class: 'xp-chip-label' }, `${this.state.xp} XP`));
          return wrap;
        })(),
        el('div', { class: 'streak-chip' }, `🔥 ${this.state.streak.current}`),
      ]),
    ]);
    return bar;
  }

  renderBottomNav() {
    const items = [
      { id: 'home', label: 'Home', icon: '🏠' },
      { id: 'study', label: 'Study', icon: '🗂️' },
      { id: 'practice', label: 'Practice', icon: '🎮' },
      { id: 'progress', label: 'Progress', icon: '📊' },
    ];
    return el('nav', { class: 'bottom-nav' }, items.map((it) => el('button', {
      class: `nav-btn ${this.section === it.id ? 'active' : ''}`,
      onclick: () => this.navigate(it.id),
    }, [el('span', { class: 'nav-icon' }, it.icon), el('span', { class: 'nav-label' }, it.label)])));
  }

  renderCurrentSection() {
    switch (this.section) {
      case 'study': return this.renderStudy();
      case 'practice': return this.renderPractice();
      case 'progress': return this.renderProgress();
      default: return this.renderHome();
    }
  }

  // ============================================================
  // HOME — Quick Play front and center (UX principle: one tap to play)
  // ============================================================
  renderHome() {
    const wrap = el('div', { class: 'view view-home' });

    wrap.appendChild(card([
      button('▶  QUICK PLAY', () => this.startQuickPlay(), { variant: 'primary hero-cta' }),
    ], 'hero-card'));

    const stats = buildStatsSummary(this.state);
    const statRow = el('div', { class: 'stat-row' }, [
      statPill('Words seen', stats.wordsDiscovered),
      statPill('Total XP', stats.totalXp),
      statPill('Questions', stats.totalQuestions),
      statPill('Accuracy', stats.totalQuestions ? `${Math.round((this.state.stats.totalCorrect / stats.totalQuestions) * 100)}%` : '—'),
    ]);
    wrap.appendChild(statRow);

    const recent = el('div', { class: 'section-heading' }, 'Jump in');
    wrap.appendChild(recent);
    const quickLinks = el('div', { class: 'quick-links' }, [
      this.quickLinkCard('🗂️', 'Flashcards', 'Study vocabulary at your own pace', () => this.navigate('study')),
      this.quickLinkCard('🌀', 'Conjugation Arena', 'Master a verb, one person at a time', () => { this.practiceTab = 'arena'; this.navigate('practice'); }),
      this.quickLinkCard('🧩', 'Sentence Builder', 'Build sentences word by word', () => { this.practiceTab = 'sentence'; this.navigate('practice'); }),
      this.quickLinkCard('⚡', 'Challenge Mode', 'A random mix that gets harder as you go', () => { this.practiceTab = 'challenge'; this.navigate('practice'); }),
    ]);
    wrap.appendChild(quickLinks);

    return wrap;
  }

  quickLinkCard(icon, title, sub, onClick) {
    return el('button', { class: 'quick-link-card', onclick: onClick }, [
      el('span', { class: 'quick-link-icon' }, icon),
      el('span', { class: 'quick-link-title' }, title),
      el('span', { class: 'quick-link-sub' }, sub),
    ]);
  }

  startQuickPlay() {
    const session = buildQuickPlaySession(this.state);
    this.runSession(session, { title: 'Quick Play', onComplete: () => this.navigate('home') });
  }

  // ============================================================
  // STUDY — Flashcard system
  // ============================================================
  renderStudy() {
    if (!this.flashcardConfig) {
      this.flashcardConfig = { category: 'All', direction: 'es-en', difficultyFilter: 'All' };
    }
    const wrap = el('div', { class: 'view view-study' });
    wrap.appendChild(el('h2', { class: 'view-title' }, 'Flashcards'));

    const cfg = this.flashcardConfig;
    const configCard = card([
      this.selectRow('Category', ['All', ...CATEGORIES], cfg.category, (v) => { cfg.category = v; this.render(); }),
      this.selectRow('Direction', [
        ['es-en', 'Spanish → English'], ['en-es', 'English → Spanish'], ['mixed', 'Mixed'],
      ], cfg.direction, (v) => { cfg.direction = v; this.render(); }),
      this.selectRow('Difficulty', ['All', 'New', 'Learning', 'Review', 'Mastered'], cfg.difficultyFilter, (v) => { cfg.difficultyFilter = v; this.render(); }),
    ], 'config-card');
    wrap.appendChild(configCard);

    const pool = this.filteredFlashcardPool(cfg);
    wrap.appendChild(el('p', { class: 'pool-count' }, `${pool.length} card${pool.length === 1 ? '' : 's'} match this filter.`));

    if (!pool.length) {
      wrap.appendChild(button('Start anyway with all cards', () => { cfg.difficultyFilter = 'All'; cfg.category = 'All'; this.render(); }));
      return wrap;
    }

    wrap.appendChild(button('▶  Start Flashcards', () => this.startFlashcards(pool, cfg.direction), { variant: 'primary' }));
    return wrap;
  }

  selectRow(label, options, value, onChange) {
    const select = el('select', { class: 'select-input', onchange: (e) => onChange(e.target.value) });
    options.forEach((opt) => {
      const [val, text] = Array.isArray(opt) ? opt : [opt, opt];
      select.appendChild(el('option', { value: val, selected: val === value ? 'true' : null }, text));
    });
    return el('label', { class: 'config-row' }, [el('span', {}, label), select]);
  }

  filteredFlashcardPool(cfg) {
    let pool = getVocabByCategory(cfg.category);
    if (cfg.difficultyFilter !== 'All') {
      pool = pool.filter((v) => {
        const rec = this.state.vocabMastery[v.id] || newVocabRecord();
        const status = rec.seenCount === 0 ? 'New' : ({ new: 'New', learning: 'Learning', review: 'Review', mastered: 'Mastered' }[rec.status]);
        return status === cfg.difficultyFilter;
      });
    }
    return pool;
  }

  startFlashcards(pool, direction) {
    this.flashcardSession = { pool: [...pool].sort(() => Math.random() - 0.5), index: 0, correct: 0, direction };
    this.renderFlashcardRunner();
  }

  renderFlashcardRunner() {
    const session = this.flashcardSession;
    this.root.innerHTML = '';
    const shell = el('div', { class: 'app-shell session-shell' });

    if (session.index >= session.pool.length) {
      shell.appendChild(this.renderSessionSummary({
        title: 'Flashcards complete!', correct: session.correct, total: session.pool.length,
        onDone: () => { this.flashcardSession = null; this.navigate('study'); },
      }));
      this.root.appendChild(shell);
      return;
    }

    const vocab = session.pool[session.index];
    const isEsToEn = session.direction === 'mixed' ? (session.index % 2 === 0) : session.direction === 'es-en';
    const front = isEsToEn ? vocab.spanish : vocab.english;
    const back = isEsToEn ? vocab.english : vocab.spanish;

    const header = el('div', { class: 'session-header' }, [
      el('button', { class: 'exit-btn', onclick: () => { this.flashcardSession = null; this.navigate('study'); } }, '✕'),
      el('div', { class: 'session-progress-track' }, [
        el('div', { class: 'session-progress-fill', style: `width:${(session.index / session.pool.length) * 100}%` }),
      ]),
      el('span', { class: 'session-counter' }, `${session.index + 1}/${session.pool.length}`),
    ]);
    shell.appendChild(header);

    const body = el('div', { class: 'session-body' });
    const flashcard = el('div', { class: 'flashcard' }, [
      el('div', { class: 'flashcard-word' }, front),
      vocab.gender ? el('div', { class: 'flashcard-meta' }, `(${vocab.gender})`) : null,
    ]);
    body.appendChild(flashcard);

    if (!session.revealed) {
      body.appendChild(button('Show answer', () => { session.revealed = true; this.renderFlashcardRunner(); }, { variant: 'primary wide' }));
    } else {
      flashcard.appendChild(el('div', { class: 'flashcard-divider' }));
      flashcard.appendChild(el('div', { class: 'flashcard-answer' }, back));
      if (vocab.exampleSentence) flashcard.appendChild(el('div', { class: 'flashcard-example' }, vocab.exampleSentence));

      const ratingRow = el('div', { class: 'rating-row' }, [
        button('AGAIN', () => this.rateFlashcard(vocab.id, 'AGAIN'), { variant: 'rate rate-again' }),
        button('HARD', () => this.rateFlashcard(vocab.id, 'HARD'), { variant: 'rate rate-hard' }),
        button('GOOD', () => this.rateFlashcard(vocab.id, 'GOOD'), { variant: 'rate rate-good' }),
        button('EASY', () => this.rateFlashcard(vocab.id, 'EASY'), { variant: 'rate rate-easy' }),
      ]);
      body.appendChild(ratingRow);
    }
    shell.appendChild(body);
    this.root.appendChild(shell);
  }

  rateFlashcard(vocabId, rating) {
    const session = this.flashcardSession;
    const before = this.state.vocabMastery[vocabId] || newVocabRecord();
    const wasNew = before.seenCount === 0;
    const after = applyFlashcardRating(before, rating);
    this.state.vocabMastery[vocabId] = after;

    let xp = 0;
    if (rating !== 'AGAIN') {
      xp += XP_VALUES.FLASHCARD_CORRECT;
      if (rating === 'EASY') xp += XP_VALUES.FLASHCARD_EASY_BONUS;
      session.correct += 1;
    }
    if (wasNew) xp += XP_VALUES.NEW_WORD_DISCOVERED;
    if (after.status === 'mastered' && before.status !== 'mastered') xp += XP_VALUES.NEW_WORD_MASTERED;
    this.awardXp(xp);
    if (xp > 0) showToast(`+${xp} XP`, 'xp');

    this.state.stats.totalQuestions += 1;
    if (rating !== 'AGAIN') this.state.stats.totalCorrect += 1;
    this.runAchievementCheck();
    this.persist();

    session.index += 1;
    session.revealed = false;
    this.renderFlashcardRunner();
  }

  // ============================================================
  // PRACTICE — Conjugation Arena / Sentence Builder / Challenge Mode
  // ============================================================
  renderPractice() {
    const wrap = el('div', { class: 'view view-practice' });
    const tabs = el('div', { class: 'subtabs' }, [
      this.subtabBtn('arena', 'Conjugation Arena'),
      this.subtabBtn('sentence', 'Sentence Builder'),
      this.subtabBtn('challenge', 'Challenge Mode'),
    ]);
    wrap.appendChild(tabs);

    if (this.practiceTab === 'arena') wrap.appendChild(this.renderArenaConfig());
    else if (this.practiceTab === 'sentence') wrap.appendChild(this.renderSentenceConfig());
    else wrap.appendChild(this.renderChallengeConfig());
    return wrap;
  }

  subtabBtn(id, label) {
    return el('button', {
      class: `subtab-btn ${this.practiceTab === id ? 'active' : ''}`,
      onclick: () => { this.practiceTab = id; this.render(); },
    }, label);
  }

  // ---------------- Conjugation Arena ----------------
  renderArenaConfig() {
    if (!this.arenaConfig) {
      this.arenaConfig = { verbId: 'tener', tenseId: 'present', mode: 'timed', level: 'beginner' };
    }
    const cfg = this.arenaConfig;
    const wrap = card([
      el('h3', {}, 'Conjugation Arena'),
      el('p', { class: 'muted' }, 'Work through all six persons of a verb in a chosen tense. Correct answers move you straight to the next question.'),
      this.selectRow('Level', [['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced']], cfg.level, (v) => { cfg.level = v; cfg.tenseId = TENSE_LEVELS[v][0]; this.render(); }),
      this.selectRow('Verb', allVerbIds().map((id) => [id, `${id} — ${getVerb(id).english}`]), cfg.verbId, (v) => { cfg.verbId = v; this.render(); }),
      this.selectRow('Tense', TENSE_LEVELS[cfg.level].map((id) => [id, TENSES[id].name]), cfg.tenseId, (v) => { cfg.tenseId = v; this.render(); }),
      this.selectRow('Mode', [['recognition', 'Recognition (multiple choice)'], ['production', 'Production (type it)'], ['timed', 'Timed']], cfg.mode, (v) => { cfg.mode = v; this.render(); }),
      button('▶  Enter the Arena', () => this.startArena(cfg), { variant: 'primary wide' }),
    ]);
    wrap.appendChild(this.renderArenaLeaderboard(cfg));
    return wrap;
  }

  renderArenaLeaderboard(cfg) {
    const records = (this.state.arenaRecords || []).filter((rec) => rec.verbId === cfg.verbId && rec.tenseId === cfg.tenseId && rec.mode === cfg.mode);
    const wrap = el('div', { class: 'arena-leaderboard-card' }, [
      el('h4', {}, 'Recent Arena Records'),
      records.length ? el('div', { class: 'arena-records-grid' }, [
        el('div', { class: 'arena-records-header' }, ['Date', 'Score', 'Time'].map((label) => el('div', { class: 'arena-records-col' }, label))),
        ...records.slice(-5).reverse().map((rec) => el('div', { class: 'arena-record-row' }, [
          el('div', { class: 'arena-records-col' }, new Date(rec.date).toLocaleDateString()),
          el('div', { class: 'arena-records-col' }, `${rec.correct}/${rec.total}`),
          el('div', { class: 'arena-records-col' }, formatMs(rec.durationMs)),
        ])),
      ]) : el('div', { class: 'arena-records-empty' }, 'No arena records yet. Complete a run to save your best time.'),
    ]);
    return wrap;
  }

  startArena(cfg) {
    this.arenaSession = {
      verbId: cfg.verbId, tenseId: cfg.tenseId, mode: cfg.mode,
      personIndex: 0, correct: 0, answered: false,
      startTime: Date.now(),
    };
    this.renderArenaRunner();
  }

  renderArenaRunner() {
    const s = this.arenaSession;
    this.root.innerHTML = '';
    const shell = el('div', { class: 'app-shell session-shell' });

    if (s.personIndex >= PERSONS.length) {
      const record = this.getVerbTenseRecord(s.verbId, s.tenseId);
      const score = tenseScore(record);
      const durationMs = Date.now() - s.startTime;
      if (!s.completionRecorded) {
        s.completionRecorded = true;
        const percent = Math.round((s.correct / PERSONS.length) * 100);
        this.awardXp(XP_VALUES.VERB_COMPLETE);
        this.state.stats.verbsCompleted = (this.state.stats.verbsCompleted || 0) + 1;
        if (isTenseMastered(record)) this.awardXp(XP_VALUES.TENSE_MASTERED);
        this.state.arenaRecords = this.state.arenaRecords || [];
        this.state.arenaRecords.push({
          verbId: s.verbId,
          tenseId: s.tenseId,
          mode: s.mode,
          correct: s.correct,
          total: PERSONS.length,
          percent,
          durationMs,
          date: Date.now(),
        });
        if (this.state.arenaRecords.length > 50) {
          this.state.arenaRecords.shift();
        }
        this.persist();
        this.runAchievementCheck();
      }
      const summary = el('div', { class: 'session-summary' }, [
        el('div', { class: 'summary-badge' }, '✓ VERB COMPLETE!'),
        el('div', { class: 'summary-xp' }, `+${XP_VALUES.VERB_COMPLETE} XP`),
        el('div', { class: 'summary-line' }, `${TENSES[s.tenseId].name} mastery for ${s.verbId}:`),
        progressBar(score, { label: true }),
        el('div', { class: 'summary-line' }, `Correct: ${s.correct}/6 • Time: ${formatMs(durationMs)}`),
        button('Replay this verb', () => this.startArena(this.arenaConfig), { variant: 'primary' }),
        button('Back to Practice', () => { this.arenaSession = null; this.navigate('practice'); }),
      ]);
      shell.appendChild(summary);
      this.root.appendChild(shell);
      return;
    }

    const person = PERSONS[s.personIndex];
    const difficulty = DIFFICULTY_SETTINGS[this.state.settings.difficulty] || DIFFICULTY_SETTINGS.normal;
    const question = buildConjugationQuestion(s.verbId, s.tenseId, person, s.mode === 'timed' ? 'production' : s.mode, difficulty.choiceCount);

    const header = el('div', { class: 'session-header' }, [
      el('button', { class: 'exit-btn', onclick: () => { this.arenaSession = null; this.navigate('practice'); } }, '✕'),
      el('div', { class: 'session-progress-track' }, [
        el('div', { class: 'session-progress-fill', style: `width:${(s.personIndex / PERSONS.length) * 100}%` }),
      ]),
      el('span', { class: 'session-counter' }, `${s.personIndex + 1}/6`),
    ]);
    shell.appendChild(header);

    const body = el('div', { class: 'session-body' });
    body.appendChild(el('div', { class: 'arena-verb-title' }, `${s.verbId.toUpperCase()} — ${TENSES[s.tenseId].name}`));
    body.appendChild(el('div', { class: 'question-prompt' }, question.prompt));

    if (s.mode === 'timed' && !s.answered) {
      body.appendChild(this.renderTimer(difficulty.timedSeconds, () => this.submitArenaAnswer(question, null)));
    }

    body.appendChild(this.renderAnswerInput(question, (answer) => this.submitArenaAnswer(question, answer)));
    if (s.feedback) body.appendChild(s.feedback);
    shell.appendChild(body);
    this.root.appendChild(shell);
  }

  renderTimer(seconds, onExpire) {
    const label = el('div', { class: 'timer' }, `${seconds.toFixed(1)}s`);
    let remaining = seconds;
    const tick = () => {
      remaining -= 0.1;
      if (remaining <= 0) { label.textContent = '0.0s'; onExpire(); return; }
      label.textContent = `${remaining.toFixed(1)}s`;
      this._timerHandle = setTimeout(tick, 100);
    };
    this._timerHandle = setTimeout(tick, 100);
    return label;
  }

  clearTimer() {
    if (this._timerHandle) { clearTimeout(this._timerHandle); this._timerHandle = null; }
  }

  renderAnswerInput(question, onSubmit) {
    if (question.choices) {
      return el('div', { class: 'choice-grid' }, question.choices.map((choice) => button(choice, () => onSubmit(choice), { variant: 'choice' })));
    }

    const input = el('input', {
      class: 'text-input', type: 'text', placeholder: 'Type your answer...', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
    });
    const submit = () => onSubmit(input.value);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    setTimeout(() => input.focus(), 0);

    const children = [];
    if (question.wordBank && question.wordBank.length) {
      const bank = el('div', { class: 'word-bank' });
      question.wordBank.forEach((token) => {
        bank.appendChild(el('button', {
          class: 'word-bank-token',
          type: 'button',
          onclick: () => {
            const value = input.value.trim();
            input.value = value ? `${value} ${token}` : token;
            input.focus();
          },
        }, token));
      });
      children.push(el('div', { class: 'word-bank-wrapper' }, [el('div', { class: 'word-bank-label' }, 'Word bank:'), bank]));
    }

    children.push(el('div', { class: 'input-row' }, [input, button('Check', submit, { variant: 'primary' })]));
    return el('div', {}, children);
  }

  submitArenaAnswer(question, answer) {
    this.clearTimer();
    const s = this.arenaSession;
    if (s.answered) return;
    const correct = answer !== null && normalizeAnswer(answer) === normalizeAnswer(question.correctAnswer);

    const record = this.getVerbTenseRecord(s.verbId, s.tenseId);
    const updated = applyConjugationResult(record, question.person, correct);
    this.setVerbTenseRecord(s.verbId, s.tenseId, updated);

    let xp = 0;
    if (correct) {
      xp = XP_VALUES.CONJUGATION_CORRECT;
      s.correct += 1;
    }
    this.awardXp(xp);
    this.recordQuestionResult({ correct, vocabularyIds: [] });
    if (isTenseMastered(updated)) this.runAchievementCheck();
    this.persist();

    if (correct) {
      showToast(`✓ Correct! +${xp} XP`, 'success');
      s.personIndex += 1;
      s.answered = false;
      s.feedback = null;
      this.renderArenaRunner();
      return;
    }

    s.answered = true;
    s.feedback = el('div', { class: 'feedback feedback-wrong' }, [
      el('div', { class: 'feedback-headline' }, '✗ Not quite.'),
      el('div', { class: 'feedback-answer' }, [
        el('span', {}, 'Correct answer: '), el('strong', {}, question.correctAnswer),
      ]),
      el('div', { class: 'feedback-explanation' }, question.explanation),
      button('Continue', () => { s.personIndex += 1; s.answered = false; s.feedback = null; this.renderArenaRunner(); }, { variant: 'primary wide' }),
    ]);
    this.renderArenaRunner();
  }

  getVerbTenseRecord(verbId, tenseId) {
    return this.state.verbMastery[verbId]?.[tenseId] || newVerbTenseRecord();
  }
  setVerbTenseRecord(verbId, tenseId, record) {
    if (!this.state.verbMastery[verbId]) this.state.verbMastery[verbId] = {};
    this.state.verbMastery[verbId][tenseId] = record;
  }

  // ---------------- Sentence Builder (standalone practice) ----------------
  renderSentenceConfig() {
    return card([
      el('h3', {}, 'Sentence Builder'),
      el('p', { class: 'muted' }, 'Drag or tap words into the right order to build a Spanish sentence.'),
      button('▶  Start Sentence Practice', () => this.startSentenceSession(), { variant: 'primary wide' }),
    ]);
  }

  startSentenceSession() {
    const questions = Array.from({ length: 8 }, () => buildSentenceBuilderQuestion());
    this.runSession(questions, { title: 'Sentence Builder', onComplete: () => this.navigate('practice') });
  }

  // ---------------- Challenge Mode ----------------
  renderChallengeConfig() {
    return card([
      el('h3', {}, 'Challenge Mode'),
      el('p', { class: 'muted' }, 'A random mix of everything — vocabulary, conjugation, adjective agreement, sentences, and translation. Gets harder as you go.'),
      button('▶  Start Challenge', () => this.startChallenge(), { variant: 'primary wide' }),
    ]);
  }

  startChallenge() {
    const questions = this.buildChallengeQuestions(12);
    this.runSession(questions, { title: 'Challenge Mode', onComplete: () => this.navigate('practice'), isChallenge: true });
  }

  buildChallengeQuestions(count) {
    const builders = [
      () => {
        const v = VOCABULARY[Math.floor(Math.random() * VOCABULARY.length)];
        return buildVocabTranslationQuestion(v, 'mixed');
      },
      () => {
        const verbId = allVerbIds()[Math.floor(Math.random() * allVerbIds().length)];
        const tenseId = TENSE_LEVELS.beginner[Math.floor(Math.random() * TENSE_LEVELS.beginner.length)];
        const person = PERSONS[Math.floor(Math.random() * PERSONS.length)];
        return buildConjugationQuestion(verbId, tenseId, person, 'production');
      },
      () => {
        const adjectives = VOCABULARY.filter((v) => v.type === 'adjective');
        return buildAdjectiveAgreementQuestion(adjectives[Math.floor(Math.random() * adjectives.length)]);
      },
      () => buildSentenceBuilderQuestion(),
      () => buildTranslationQuestion(),
    ];
    return Array.from({ length: count }, (_, i) => builders[i % builders.length]());
  }

  // ============================================================
  // GENERIC SESSION RUNNER — used by Quick Play, Sentence practice,
  // Challenge Mode. Handles vocab/conjugation/adjective/translation
  // question types uniformly; sentence builder gets tile UI.
  // ============================================================
  runSession(questions, opts) {
    this.session = {
      questions, index: 0, correct: 0, mistakes: 0, opts,
      startTime: Date.now(),
    };
    this.renderSessionRunner();
  }

  renderSessionRunner() {
    const s = this.session;
    this.clearTimer();
    this.root.innerHTML = '';
    const shell = el('div', { class: 'app-shell session-shell' });

    if (s.index >= s.questions.length) {
      const perfect = s.mistakes === 0;
      if (perfect) {
        this.awardXp(XP_VALUES.PERFECT_ROUND);
        this.state.stats.perfectRounds = (this.state.stats.perfectRounds || 0) + 1;
      }
      this.persist();
      this.runAchievementCheck();
      shell.appendChild(this.renderSessionSummary({
        title: `${s.opts.title} complete!`, correct: s.correct, total: s.questions.length,
        perfect, onDone: () => { this.session = null; s.opts.onComplete(); },
      }));
      this.root.appendChild(shell);
      return;
    }

    const q = s.questions[s.index];
    const header = el('div', { class: 'session-header' }, [
      el('button', { class: 'exit-btn', onclick: () => { this.session = null; s.opts.onComplete(); } }, '✕'),
      el('div', { class: 'session-progress-track' }, [
        el('div', { class: 'session-progress-fill', style: `width:${(s.index / s.questions.length) * 100}%` }),
      ]),
      el('span', { class: 'session-counter' }, `${s.index + 1}/${s.questions.length}`),
    ]);
    shell.appendChild(header);

    const body = el('div', { class: 'session-body' });
    body.appendChild(el('div', { class: 'question-type-tag' }, this.friendlyTypeName(q.type)));
    body.appendChild(el('div', { class: 'question-prompt' }, q.prompt));

    if (q.type === 'SENTENCE_BUILDER') {
      body.appendChild(this.renderSentenceTiles(q, (answer) => this.submitSessionAnswer(answer)));
    } else {
      body.appendChild(this.renderAnswerInput(q, (answer) => this.submitSessionAnswer(answer)));
    }
    if (s.feedback) body.appendChild(s.feedback);
    shell.appendChild(body);
    this.root.appendChild(shell);
  }

  friendlyTypeName(type) {
    return ({
      VOCABULARY_TRANSLATION: 'Vocabulary', VOCABULARY_MULTIPLE_CHOICE: 'Vocabulary',
      CONJUGATION_MULTIPLE_CHOICE: 'Conjugation', CONJUGATION_INPUT: 'Conjugation',
      SENTENCE_BUILDER: 'Sentence Builder', ADJECTIVE_AGREEMENT: 'Adjective Agreement',
      TRANSLATION: 'Translation', FILL_IN_BLANK: 'Fill in the Blank',
    })[type] || type;
  }

  renderSentenceTiles(question, onSubmit) {
    const wrap = el('div', { class: 'sentence-builder' });
    const chosen = [];
    const bank = el('div', { class: 'tile-bank' });
    const chosenRow = el('div', { class: 'tile-chosen' });

    const renderTiles = () => {
      bank.innerHTML = '';
      chosenRow.innerHTML = '';
      question.choices.forEach((word, i) => {
        if (chosen.includes(i)) return;
        bank.appendChild(el('button', { class: 'word-tile', onclick: () => { chosen.push(i); renderTiles(); } }, word));
      });
      chosen.forEach((i) => {
        chosenRow.appendChild(el('button', { class: 'word-tile chosen', onclick: () => { chosen.splice(chosen.indexOf(i), 1); renderTiles(); } }, question.choices[i]));
      });
    };
    renderTiles();

    wrap.appendChild(el('div', { class: 'tile-target-label' }, 'Your sentence:'));
    wrap.appendChild(chosenRow);
    wrap.appendChild(el('div', { class: 'tile-target-label' }, 'Available words:'));
    wrap.appendChild(bank);
    wrap.appendChild(button('Check sentence', () => onSubmit(chosen.map((i) => question.choices[i]).join(' ')), { variant: 'primary wide' }));
    return wrap;
  }

  submitSessionAnswer(rawAnswer) {
    const s = this.session;
    const q = s.questions[s.index];
    const correct = normalizeAnswer(rawAnswer) === normalizeAnswer(q.correctAnswer);

    if (q.vocabularyIds.length) {
      q.vocabularyIds.forEach((id) => {
        const before = this.state.vocabMastery[id] || newVocabRecord();
        this.state.vocabMastery[id] = applyFlashcardRating(before, correct ? 'GOOD' : 'AGAIN');
      });
    }
    if (q.verbId) {
      const record = this.getVerbTenseRecord(q.verbId, q.tense);
      this.setVerbTenseRecord(q.verbId, q.tense, applyConjugationResult(record, q.person, correct));
    }

    let xp = 0;
    if (correct) {
      s.correct += 1;
      xp = ({
        VOCABULARY_TRANSLATION: XP_VALUES.FLASHCARD_CORRECT, VOCABULARY_MULTIPLE_CHOICE: XP_VALUES.FLASHCARD_CORRECT,
        CONJUGATION_MULTIPLE_CHOICE: XP_VALUES.CONJUGATION_CORRECT, CONJUGATION_INPUT: XP_VALUES.CONJUGATION_CORRECT,
        SENTENCE_BUILDER: XP_VALUES.SENTENCE_CORRECT, ADJECTIVE_AGREEMENT: XP_VALUES.CHALLENGE_CORRECT,
        TRANSLATION: XP_VALUES.CHALLENGE_CORRECT,
      })[q.type] || XP_VALUES.CHALLENGE_CORRECT;
      this.awardXp(xp);
    } else {
      s.mistakes += 1;
    }
    this.recordQuestionResult({ correct, vocabularyIds: q.vocabularyIds });
    this.persist();

    s.feedback = el('div', { class: `feedback ${correct ? 'feedback-correct' : 'feedback-wrong'}` }, [
      el('div', { class: 'feedback-headline' }, correct ? `✓ Correct! +${xp} XP` : '✗ Incorrect'),
      !correct ? el('div', { class: 'feedback-answer' }, [el('span', {}, 'Correct answer: '), el('strong', {}, q.correctAnswer)]) : null,
      el('div', { class: 'feedback-explanation' }, q.explanation),
      button('Continue', () => { s.index += 1; s.feedback = null; this.renderSessionRunner(); }, { variant: 'primary wide' }),
    ]);
    this.renderSessionRunner();
  }

  renderSessionSummary({ title, correct, total, perfect, onDone }) {
    return el('div', { class: 'session-summary' }, [
      el('div', { class: 'summary-badge' }, `✓ ${title}`),
      el('div', { class: 'summary-line' }, `${correct}/${total} correct`),
      perfect ? el('div', { class: 'summary-perfect' }, `💎 Perfect round! +${XP_VALUES.PERFECT_ROUND} XP`) : null,
      button('Continue', onDone, { variant: 'primary wide' }),
    ]);
  }

  // ============================================================
  // PROGRESS DASHBOARD
  // ============================================================
  renderProgress() {
    const wrap = el('div', { class: 'view view-progress' });
    wrap.appendChild(el('h2', { class: 'view-title' }, 'Progress'));

    const stats = buildStatsSummary(this.state);
    wrap.appendChild(el('div', { class: 'stat-row' }, [
      statPill('Total words', VOCABULARY.length),
      statPill('Words learning', stats.wordsDiscovered),
      statPill('Total XP', stats.totalXp),
      statPill('Questions answered', stats.totalQuestions),
      statPill('Accuracy', stats.totalQuestions ? `${Math.round((this.state.stats.totalCorrect / stats.totalQuestions) * 100)}%` : '—'),
    ]));

    wrap.appendChild(el('h3', { class: 'section-heading' }, 'Category mastery'));
    const catCard = card(CATEGORIES.map((cat) => {
      const items = getVocabByCategory(cat);
      const avg = Math.round(items.reduce((sum, v) => sum + (this.state.vocabMastery[v.id]?.score || 0), 0) / items.length);
      return el('div', { class: 'mastery-row' }, [
        el('span', { class: 'mastery-label' }, cat),
        progressBar(avg, { label: true }),
      ]);
    }));
    wrap.appendChild(catCard);

    wrap.appendChild(el('h3', { class: 'section-heading' }, 'Verb mastery'));
    const verbsWithData = allVerbIds().filter((id) => this.state.verbMastery[id]);
    if (!verbsWithData.length) {
      wrap.appendChild(card([el('p', { class: 'muted' }, 'Practice in the Conjugation Arena to see verb mastery here.')]));
    } else {
      verbsWithData.forEach((verbId) => {
        const tenseMap = this.state.verbMastery[verbId];
        wrap.appendChild(card([
          el('div', { class: 'verb-mastery-title' }, `${verbId} — ${getVerb(verbId).english}`),
          ...Object.keys(tenseMap).map((tenseId) => el('div', { class: 'mastery-row' }, [
            el('span', { class: 'mastery-label' }, TENSES[tenseId].name),
            progressBar(tenseScore(tenseMap[tenseId]), { label: true }),
          ])),
        ]));
      });
    }

    wrap.appendChild(el('h3', { class: 'section-heading' }, 'Achievements'));
    const achGrid = el('div', { class: 'achievement-grid' }, ACHIEVEMENTS.map((a) => {
      const earned = this.state.achievements[a.id]?.earned;
      return el('div', { class: `achievement-badge ${earned ? 'earned' : 'locked'}` }, [
        el('div', { class: 'achievement-icon' }, a.icon),
        el('div', { class: 'achievement-name' }, a.name),
        el('div', { class: 'achievement-desc' }, a.description),
      ]);
    }));
    wrap.appendChild(achGrid);

    wrap.appendChild(el('div', { class: 'settings-block' }, [
      el('h3', { class: 'section-heading' }, 'Settings'),
      this.selectRow('Difficulty', [['easy', 'Easy'], ['normal', 'Normal'], ['hard', 'Hard']], this.state.settings.difficulty, (v) => { this.state.settings.difficulty = v; this.persist(); }),
      button('Reset all progress', () => {
        if (confirm('This will erase all progress permanently. Continue?')) {
          this.state = resetState();
          this.navigate('home');
        }
      }, { variant: 'danger' }),
    ]));

    return wrap;
  }
}

function startApp(rootId) {
  const root = document.getElementById(rootId);
  const app = new App(root);
  app.init();
  return app;
}


// ---- bootstrap ----
// Deliberately does NOT auto-run. This script may be injected long after
// DOMContentLoaded (e.g. lazy-loaded on a button click), so the host page
// is responsible for calling startApp('some-container-id') once this
// script has finished loading.