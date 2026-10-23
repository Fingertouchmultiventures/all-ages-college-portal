// Standard Nigerian (NERDC / UBE / WAEC-style) scheme of work outline, Creche to SSS 3.
// Each entry: subject -> three terms of topics. Teachers should review and adjust for the school's own scheme.
const T = (a, b, c) => [a, b, c];
const EARLY = {
  'Number work': T('Counting 1-10\nRecognising numbers 1-10\nMatching and sorting objects', 'Counting 1-20\nMore and less\nShapes: circle, square, triangle', 'Counting 1-50\nSimple addition with objects\nPatterns'),
  'Letter work': T('Letters A-H and their sounds\nTracing and pencil control', 'Letters I-P and their sounds\nSimple 3-letter words', 'Letters Q-Z and their sounds\nReading simple words and short sentences'),
  'Health habits and social studies': T('My body and personal cleanliness\nMy family', 'My home and my school\nFood we eat', 'Community helpers\nSafety at home and road'),
  'Creative arts and rhymes': T('Nursery rhymes and songs\nColouring and free drawing', 'Clay and paper craft\nAction songs', 'Drawing and painting\nSimple drama and storytelling'),
  'Nigerian language (Yoruba)': T('Greetings (Ikini)\nNumbers 1-10 in Yoruba', 'Parts of the body\nFamily members', 'Common animals and fruits\nSimple songs')
};
const PRIM = (lvl) => {
  const n = lvl;
  const maths = [
    ['Whole numbers up to 100', 'Addition and subtraction', 'Shapes and money'],
    ['Whole numbers up to 1,000', 'Addition, subtraction and multiplication tables', 'Fractions and measurement'],
    ['Place value to 10,000', 'Multiplication and division', 'Fractions, time and money'],
    ['Place value to 100,000 and rounding', 'Fractions and decimals', 'Perimeter, area and data handling'],
    ['Whole numbers to 1,000,000, LCM and HCF', 'Fractions, decimals and percentages', 'Angles, geometry and averages'],
    ['Factors, multiples and indices', 'Ratio, rate, percentages and simple interest', 'Geometry, volume and review for Common Entrance']
  ][n - 1];
  const eng = [
    ['Alphabet and phonics', 'Simple sentences', 'Reading short stories'],
    ['Phonics and word families', 'Nouns and verbs', 'Comprehension and simple composition'],
    ['Parts of speech: nouns, pronouns', 'Verbs, adjectives and tenses', 'Letter and story writing'],
    ['Comprehension and vocabulary', 'Tenses, adverbs and prepositions', 'Letter and narrative writing'],
    ['Comprehension, summary and vocabulary', 'Grammar: tenses, concord, conjunctions', 'Composition: formal and informal letters, speeches'],
    ['Comprehension, summary and lexis', 'Grammar, concord and sentence types', 'Composition and Common Entrance past questions']
  ][n - 1];
  const sci = [
    ['Living and non-living things', 'My five senses', 'Plants around us'],
    ['Parts of the human body', 'Animals and their homes', 'Weather and water'],
    ['Plants and their parts', 'Animals and their young', 'Air, water and soil'],
    ['Living things and their environment', 'Matter: solids, liquids, gases', 'Energy: light and heat'],
    ['Classification of living things', 'Forces, work and simple machines', 'Electricity and magnetism'],
    ['Reproduction in plants and animals', 'Chemical and physical changes', 'Environment, health and review']
  ][n - 1];
  const soc = [
    ['My family', 'My school', 'Our community'],
    ['The family and home', 'Neighbourhood and community', 'Traffic and road safety'],
    ['Our community and its people', 'Nigeria: our country and symbols', 'Occupations and trades'],
    ['States and capitals of Nigeria', 'Culture and ethnic groups', 'Citizenship and good governance'],
    ['Nigeria and her neighbours', 'Government and leadership', 'Human rights and responsibilities'],
    ['Nigeria in Africa', 'The Constitution and democracy', 'Review for Common Entrance']
  ][n - 1];
  const out = {
    'Mathematics': T(...maths.map(x => x.replace(/ and /g, '\n'))), 'English Language': T(...eng.map(x => x.replace(/, /g, '\n'))),
    'Basic Science and Technology': T(...sci), 'Social Studies and Citizenship': T(...soc),
    'Verbal and Quantitative Reasoning': T('Number and letter series\nOdd one out', 'Analogies\nPattern recognition', 'Mixed reasoning practice'),
    'Christian / Islamic Religious Studies': T('God the Creator\nObedience and honesty', 'Stories of faith and heroes\nPrayer and worship', 'Love, kindness and sharing\nFestivals'),
    'Civic Education': T('Rules at home and school\nGood habits', 'National symbols and pledge\nRespect for others', 'Rights and duties\nHonesty and fair play'),
    'Computer Studies': T('Parts of a computer\nUsing the mouse and keyboard', 'Using a word processor\nSafe use of computers', 'Drawing with paint tools\nIntroduction to the internet'),
    'Creative and Cultural Arts': T('Drawing and colour\nSongs and drumming', 'Craft and weaving\nTraditional dances', 'Painting and sculpture\nDrama'),
    'Physical and Health Education': T('Games and athletics\nPersonal hygiene', 'Ball games\nFirst aid basics', 'Sports day preparation\nNutrition'),
    'Yoruba Language': T('Alifabeti ati ohun\nIkini ati ihuwa', 'Oruko, ise ati apejuwe\nOwe', 'Itan ati aroko\nAsa Yoruba'),
    'Handwriting and Dictation': T('Letter formation and spelling', 'Cursive writing and dictation', 'Neat writing and spelling bee')
  };
  if (n >= 4) out['Agricultural Science'] = T('Introduction to farming\nCrops grown in Nigeria', 'Farm animals\nSimple farm tools', 'School garden project\nCrop care');
  if (n >= 4) out['Home Economics'] = T('Personal hygiene\nFood groups', 'Meal preparation basics\nClothing care', 'Home management\nSafety in the kitchen');
  if (n >= 5) out['French'] = T('Greetings and numbers\nColours', 'Family and school vocabulary\nSimple sentences', 'Daily routines\nSimple dialogues');
  return out;
};
const JSS = (n) => {
  const m = [
    ['Number and numeration: whole numbers, LCM, HCF\nFractions and decimals\nApproximation and estimation', 'Algebraic expressions and simple equations\nRatio, rate and proportion\nPercentages', 'Plane shapes and angles\nPerimeter and area\nStatistics: data collection and charts'],
    ['Indices and standard form\nLogarithms (basic)\nSets and Venn diagrams', 'Linear equations and inequalities\nVariation\nFactorisation', 'Geometry: congruence and similarity\nPythagoras theorem\nStatistics and probability'],
    ['Number bases and modular arithmetic\nSurds and indices\nQuadratic equations', 'Simultaneous equations\nGraphs of linear and quadratic functions\nTrigonometry (introduction)', 'Mensuration: area and volume\nBearing and construction\nRevision for BECE']
  ][n - 1];
  const e = [
    ['Comprehension and summary\nParts of speech\nVocabulary: synonyms and antonyms', 'Tenses and concord\nNarrative essay\nPoetry: introduction', 'Descriptive essay\nLetter writing\nOral English: vowels and consonants'],
    ['Comprehension and summary\nPhrases and clauses\nIdioms', 'Argumentative essay\nFormal letter\nDrama: introduction', 'Oral English: stress and rhythm\nProse text study\nReport writing'],
    ['Comprehension and summary\nSentence structure\nFigures of speech', 'Speech writing\nExpository essay\nLiterature: set texts', 'Oral English revision\nBECE past questions\nRevision']
  ][n - 1];
  const bs = [
    ['Living and non-living things\nCells and tissues\nClassification of living things', 'Matter and its states\nElements, compounds and mixtures\nAir and water', 'Energy forms and sources\nForces and motion\nSimple machines'],
    ['Reproduction\nGrowth and nutrition\nThe circulatory system', 'Acids, bases and salts\nChemical reactions\nHeat and temperature', 'Light and sound\nElectricity\nMagnetism'],
    ['Genetics and heredity\nEcology and conservation\nDiseases and immunity', 'Atomic structure and the periodic table\nChemical bonding\nWork, energy and power', 'Space science\nRevision for BECE\nProject work']
  ][n - 1];
  return {
    'Mathematics': T(...m), 'English Language': T(...e), 'Basic Science': T(...bs),
    'Basic Technology': T('Safety in workshops\nTechnical drawing: lines and lettering', 'Woodwork and metalwork tools\nMaterials and their properties', 'Building construction\nIntroduction to electrical work'),
    'Information and Communication Technology': T('Computer hardware and software\nKeyboarding skills', 'Word processing and spreadsheets\nInternet and e-mail safety', 'Presentation software\nIntroduction to programming'),
    'Social Studies': T('Our environment\nFamily and marriage', 'Culture and values\nPeace and conflict resolution', 'Population and resources\nSocial issues in Nigeria'),
    'Civic Education': T('Citizenship\nNational symbols and values', 'Rights and obligations\nPrinciples of democracy', 'Rule of law\nNational consciousness'),
    'Business Studies': T('Office practice\nKeyboarding and records', 'Book-keeping: introduction\nCommerce: trade', 'Shorthand basics\nBusiness communication'),
    'Agricultural Science': T('Introduction to agriculture\nCrop production', 'Animal production\nSoil and its management', 'Farm tools and machines\nAgricultural marketing'),
    'Home Economics': T('Home management\nFood and nutrition', 'Clothing and textiles\nChild care', 'Consumer education\nFamily health'),
    'Physical and Health Education': T('Athletics\nFirst aid', 'Ball games\nHealth and fitness', 'Safety education\nSports administration'),
    'Christian / Islamic Religious Studies': T('Creation and the family of faith\nWorship', 'Leadership and obedience\nFaith and work', 'Moral values\nFestivals'),
    'Cultural and Creative Arts': T('Drawing and painting\nMusic: notes and rhythm', 'Craft and design\nTraditional dance', 'Drama and theatre\nCultural heritage'),
    'Yoruba Language': T('Ede ati asa\nIsori oro', 'Litireso\nAroko', 'Owe ati oriki\nAtunyewo'),
    'French': T('Salutations\nLes nombres', 'La famille\nL\'ecole', 'La maison\nLes repas')
  };
};
const SSS = (n) => {
  const core = {
    'English Language': [['Comprehension and summary\nLexis and structure\nEssay: narrative and descriptive', 'Oral English: sounds and stress\nLetter writing\nLiterature: set texts', 'Speech and report writing\nPoetry\nRevision'], ['Comprehension and summary\nSentence analysis\nArgumentative essay', 'Oral English\nFormal letters\nProse and drama', 'Expository essay\nSpeech writing\nPast questions'], ['WAEC / NECO past questions\nSummary writing\nEssay types', 'Oral English revision\nLiterature revision', 'Final revision and mock exams']][n - 1],
    'General Mathematics': [['Number bases and indices\nLogarithms and surds\nSets', 'Quadratic equations\nVariation\nSequences and series', 'Trigonometry\nStatistics\nProbability'], ['Matrices and determinants\nCircle theorems\nCoordinate geometry', 'Differentiation (introduction)\nVectors\nMensuration', 'Probability and statistics\nRevision'], ['WAEC / NECO past questions\nAlgebra and calculus revision', 'Geometry and trigonometry revision', 'Final revision and mock exams']][n - 1],
    'Civic Education': [['Citizenship and national values\nDemocracy\nHuman rights', 'Rule of law\nPolitical apathy\nCultism and drug abuse', 'Public service\nPopulation issues'], ['Constitution\nPopular participation\nElectoral process', 'Pillars of democracy\nHIV/AIDS awareness', 'Revision'], ['Revision of national values\nWAEC / NECO past questions', 'Mock exams', 'Mock exams']][n - 1],
    'Computer Studies / ICT': [['Computer hardware and software\nOperating systems\nWord processing', 'Spreadsheet\nDatabase\nInternet', 'Programming basics\nComputer ethics'], ['Programming (BASIC/Python)\nNetworking\nWeb design', 'Data processing\nElectronic spreadsheet', 'Revision'], ['Past questions\nRevision', 'Mock exams', 'Mock exams']][n - 1]
  };
  const sci = {
    'Physics': [['Measurements and units\nScalars and vectors\nMotion', 'Newton\'s laws\nWork, energy and power\nSimple harmonic motion', 'Heat and temperature\nGas laws'], ['Waves and light\nReflection and refraction\nSound', 'Electric fields\nCurrent electricity\nMagnetism', 'Electromagnetic induction\nAtomic physics'], ['Past questions: mechanics\nPast questions: electricity', 'Past questions: waves and modern physics', 'Mock exams']][n - 1],
    'Chemistry': [['Separation of mixtures\nAtomic structure\nPeriodic table', 'Chemical bonding\nStoichiometry\nGas laws', 'Acids, bases and salts\nRedox reactions'], ['Energy changes\nRates of reaction\nChemical equilibrium', 'Electrochemistry\nOrganic chemistry: alkanes, alkenes', 'Alkanols and polymers'], ['Past questions: physical chemistry\nPast questions: inorganic', 'Past questions: organic chemistry', 'Mock exams']][n - 1],
    'Biology': [['Cell structure and function\nClassification\nNutrition', 'Transport systems\nRespiration\nExcretion', 'Reproduction\nGrowth'], ['Ecology\nGenetics and variation\nEvolution', 'Microbes and disease\nNervous system and coordination', 'Soil and conservation'], ['Past questions: cells and physiology\nPast questions: ecology and genetics', 'Practical revision', 'Mock exams']][n - 1],
    'Further Mathematics': [['Logic and functions\nPolynomials\nPartial fractions', 'Binomial theorem\nTrigonometry', 'Vectors and statics'], ['Calculus: differentiation\nIntegration', 'Probability\nPermutation and combination', 'Dynamics'], ['Past questions', 'Revision', 'Mock exams']][n - 1]
  };
  const art = {
    'Literature in English': [['Introduction to literature\nDrama texts\nPoetry appreciation', 'Prose texts\nLiterary devices', 'African and non-African texts'], ['Drama study\nPoetry study', 'Prose study\nCritical essays', 'Revision'], ['Past questions', 'Revision', 'Mock exams']][n - 1],
    'Government': [['Basic concepts of government\nStates and constitutions\nTypes of government', 'Organs of government\nCitizenship\nPolitical parties', 'Public administration'], ['Nigerian constitutions\nFederalism', 'Pressure groups\nInternational organisations (UN, AU, ECOWAS)', 'Foreign policy'], ['Past questions', 'Revision', 'Mock exams']][n - 1],
    'Economics': [['Basic economic concepts\nDemand and supply\nProduction', 'Cost and revenue\nMarket structures\nNational income', 'Money and banking'], ['Public finance\nInternational trade\nEconomic systems', 'Population\nAgriculture and industry in Nigeria', 'Economic development'], ['Past questions', 'Revision', 'Mock exams']][n - 1],
    'Financial Accounting': [['Book-keeping basics\nLedgers and trial balance\nCash book', 'Final accounts of sole traders\nAdjustments', 'Control accounts and bank reconciliation'], ['Partnership accounts\nClub and society accounts', 'Company accounts\nManufacturing accounts', 'Public sector accounting'], ['Past questions', 'Revision', 'Mock exams']][n - 1],
    'Commerce': [['Introduction to commerce\nTrade: home and foreign\nBanking', 'Insurance\nTransport and communication\nAdvertising', 'Business units and forms'], ['Stock exchange\nConsumer protection', 'Warehousing\nBusiness finance', 'E-commerce'], ['Past questions', 'Revision', 'Mock exams']][n - 1],
    'Christian / Islamic Religious Studies': [['Creation and the nature of God\nCovenant\nSin and salvation', 'Prophets and leadership\nLife of Jesus / Prophet Muhammad', 'Morals and society'], ['Early church / Caliphate\nFaith and works', 'Social issues\nFamily life', 'Revision'], ['Past questions', 'Revision', 'Mock exams']][n - 1],
    'Geography': [['Earth and solar system\nMaps and map reading\nWeather and climate', 'Landforms\nSoil and vegetation', 'Population'], ['Agriculture\nIndustry and trade', 'Transport and settlement\nRegional geography of Nigeria and West Africa', 'Environmental problems'], ['Past questions', 'Revision', 'Mock exams']][n - 1]
  };
  const trade = {
    'Agricultural Science': [['Introduction to agriculture\nSoil science\nCrop production', 'Animal production\nFarm machinery', 'Agricultural economics'], ['Pests and diseases\nForestry and fisheries', 'Farm management\nAgricultural extension', 'Revision'], ['Past questions', 'Revision', 'Mock exams']][n - 1],
    'Marketing and Entrepreneurship': [['Introduction to marketing\nMarket research\nProduct and price', 'Promotion and distribution\nStarting a business', 'Business plans'], ['Consumer behaviour\nSales and customer service', 'Entrepreneurship and innovation', 'Revision'], ['Past questions', 'Revision', 'Mock exams']][n - 1],
    'Data Processing': [['Introduction to data processing\nData collection and capture', 'Data organisation\nStorage media', 'Data security'], ['Spreadsheet and database use\nProgramming concepts', 'Systems analysis', 'Revision'], ['Past questions', 'Revision', 'Mock exams']][n - 1]
  };
  return { ...core, ...sci, ...art, ...trade };
};

const CONF = {};
const levels = {
  'Creche': EARLY, 'Nursery 1': EARLY, 'Nursery 2': { ...EARLY, 'Phonics and early reading': T('Letter sounds and blending', 'Sight words and short sentences', 'Reading simple stories') }
};
export function buildCurriculum() {
  const rows = []; const TERMS = ['First Term', 'Second Term', 'Third Term'];
  const add = (cls, subj, terms) => terms.forEach((topics, i) => rows.push({ id: 'cur-' + (cls + '-' + subj + '-' + i).toLowerCase().replace(/[^a-z0-9]+/g, '-'), class: cls, subject: subj, term: TERMS[i], topics, _std: true }));
  for (const [cls, subs] of Object.entries(levels)) for (const [s, t] of Object.entries(subs)) add(cls, s, t);
  for (let n = 1; n <= 6; n++) for (const [s, t] of Object.entries(PRIM(n))) add('Primary ' + n, s, t);
  for (let n = 1; n <= 3; n++) for (const [s, t] of Object.entries(JSS(n))) add('JSS ' + n, s, t);
  for (let n = 1; n <= 3; n++) for (const [s, t] of Object.entries(SSS(n))) add('SSS ' + n, s, t);
  return rows;
}
// A teacher-ready lesson note skeleton for one topic. Teachers edit it or attach their own PDF.
export function lessonDraft(cls, subject, term, topic, week) {
  return {
    class: cls, subject, title: topic, week: week ? 'Week ' + week : '', term,
    body: `LESSON NOTE\nClass: ${cls}\nSubject: ${subject}\nTerm: ${term}${week ? '\nWeek: ' + week : ''}\nTopic: ${topic}\n\nBEHAVIOURAL OBJECTIVES\nBy the end of the lesson pupils should be able to:\n1. State what ${topic} means.\n2. Explain the main points of ${topic} with examples.\n3. Solve or answer simple exercises on ${topic}.\n\nPREVIOUS KNOWLEDGE\nPupils have been taught the earlier topics in ${subject}.\n\nINSTRUCTIONAL MATERIALS\nCharts, textbook, chalkboard, real objects or pictures.\n\nPRESENTATION\nStep 1 (Introduction): Revise the previous lesson and introduce ${topic}.\nStep 2 (Development): Explain ${topic} with examples from daily life.\nStep 3 (Practice): Pupils work through examples in groups.\nStep 4 (Evaluation): Ask questions to test understanding.\n\nSUMMARY\nThe teacher summarises the key points on the board.\n\nASSIGNMENT\nPupils answer questions on ${topic} in their exercise books.\n\n(Draft prepared from the scheme of work. Teacher: please edit, or attach your own PDF.)`
  };
}
