// Original practice questions (not copied from past papers). Teachers can edit, delete or add their own, and upload real past papers to the Library.
const Q = (cls, subject, topic, question, a, b, c, d, answer, explanation) => ({ id: 'q-' + (cls + subject + topic + question).toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 60), class: cls, subject, topic, type: 'Objective', question, a, b, c, d, answer, explanation, source: 'Practice' });
export const SAMPLE_QUESTIONS = [
Q('JSS 1', 'Mathematics', 'Fractions', 'What is 1/2 + 1/4?', '1/6', '2/6', '3/4', '1/8', 'C', '1/2 = 2/4, so 2/4 + 1/4 = 3/4.'),
Q('JSS 1', 'Mathematics', 'Fractions', 'Simplify 12/18.', '1/2', '2/3', '3/4', '4/5', 'B', 'Divide top and bottom by 6.'),
Q('JSS 1', 'Mathematics', 'Fractions', 'What is 2/3 x 3/5?', '2/5', '6/8', '5/8', '1/5', 'A', '6/15 simplifies to 2/5.'),
Q('JSS 1', 'Mathematics', 'Fractions', 'Change 7/4 to a mixed number.', '1 1/4', '1 3/4', '2 1/4', '1 2/4', 'B', '4 goes into 7 once, remainder 3.'),
Q('JSS 1', 'Mathematics', 'Fractions', 'What is 3/4 divided by 1/2?', '3/8', '1 1/2', '2/3', '1/2', 'B', 'Flip 1/2 and multiply: 3/4 x 2 = 3/2 = 1 1/2.'),
Q('JSS 1', 'English Language', 'Nouns', 'Which of these is an abstract noun?', 'table', 'honesty', 'Ibadan', 'goat', 'B', 'Honesty is a quality you cannot touch.'),
Q('JSS 1', 'English Language', 'Nouns', 'Choose the plural of "child".', 'childs', 'childes', 'children', 'childrens', 'C', 'Child has an irregular plural.'),
Q('JSS 1', 'English Language', 'Nouns', 'A flock of birds uses a ____ noun.', 'proper', 'collective', 'abstract', 'concrete', 'B', 'A collective noun names a group.'),
Q('JSS 1', 'English Language', 'Nouns', 'Pick the proper noun.', 'river', 'city', 'Nigeria', 'school', 'C', 'Proper nouns name particular places and begin with capital letters.'),
Q('JSS 1', 'English Language', 'Nouns', 'The plural of "baby" is', 'babys', 'babies', 'babyes', 'babis', 'B', 'Change y to ies after a consonant.'),
Q('Primary 4', 'Basic Science and Technology', 'Matter', 'Which state of matter has a fixed shape?', 'Solid', 'Liquid', 'Gas', 'Steam', 'A', 'A solid keeps its own shape.'),
Q('Primary 4', 'Basic Science and Technology', 'Matter', 'Ice changing to water is called', 'freezing', 'melting', 'boiling', 'condensing', 'B', 'Heat makes ice melt.'),
Q('Primary 4', 'Basic Science and Technology', 'Matter', 'Which of these is a gas?', 'Oil', 'Milk', 'Air', 'Wood', 'C', 'Air is a mixture of gases.'),
Q('Primary 4', 'Basic Science and Technology', 'Matter', 'Steam turning back to water is called', 'melting', 'freezing', 'evaporation', 'condensation', 'D', 'Cooling steam makes it condense.'),
Q('SSS 1', 'Physics', 'Motion', 'A car moves from rest to 20 m/s in 10 s. Its acceleration is', '0.5 m/s^2', '2 m/s^2', '10 m/s^2', '200 m/s^2', 'B', 'a = (v - u)/t = 20/10 = 2.'),
Q('SSS 1', 'Physics', 'Motion', 'Which of these is a vector quantity?', 'Speed', 'Distance', 'Velocity', 'Time', 'C', 'Velocity has size and direction.'),
Q('SSS 1', 'Physics', 'Motion', 'The slope of a velocity-time graph gives', 'distance', 'speed', 'acceleration', 'displacement', 'C', 'Slope = change in velocity / time.'),
Q('SSS 1', 'Physics', 'Motion', 'A stone dropped from rest falls for 2 s. (g = 10 m/s^2) Distance fallen is', '10 m', '20 m', '40 m', '5 m', 'B', 's = 1/2 x 10 x 4 = 20 m.'),
Q('SSS 1', 'Physics', 'Motion', 'Which equation is correct for uniform acceleration?', 'v = u - at^2', 'v = u + at', 'v = ut + a', 's = vt + u', 'B', 'The first equation of motion is v = u + at.'),
Q('SSS 1', 'Chemistry', 'Atomic structure', 'The number of protons in an atom is its', 'mass number', 'atomic number', 'valency', 'isotope number', 'B', 'Atomic number = number of protons.'),
Q('SSS 1', 'Chemistry', 'Atomic structure', 'An atom has Z = 11 and A = 23. Number of neutrons is', '11', '12', '23', '34', 'B', 'Neutrons = A - Z = 12.'),
Q('SSS 1', 'Chemistry', 'Atomic structure', 'The electron arrangement of chlorine (Z = 17) is', '2, 8, 7', '2, 8, 8', '2, 7, 8', '2, 8, 1', 'A', 'Fill shells 2, 8, then 7 remaining.'),
Q('SSS 1', 'Chemistry', 'Atomic structure', 'Isotopes of an element have the same number of', 'neutrons', 'protons', 'mass number', 'nucleons', 'B', 'Isotopes differ only in neutrons.'),
{ id: 'q-th-jss1-maths-1', class: 'JSS 1', subject: 'Mathematics', topic: 'Fractions', type: 'Theory', question: 'Show with working that 1/3 + 1/4 = 7/12.', answer: 'LCM of 3 and 4 is 12. 1/3 = 4/12 and 1/4 = 3/12. 4/12 + 3/12 = 7/12.', explanation: '', source: 'Practice' }
];
