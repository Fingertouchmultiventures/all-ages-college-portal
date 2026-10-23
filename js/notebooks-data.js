// Sample complete notebooks (full explanations). Admin/teachers can edit, replace or delete them.
const N = (cls, subject, term, title, body) => ({ id: 'nb-' + (cls + '-' + subject + '-' + title).toLowerCase().replace(/[^a-z0-9]+/g, '-'), class: cls, subject, term, title, body, teacherName: 'School sample', _std: true });
export const SAMPLE_NOTEBOOKS = [
N('JSS 1', 'Mathematics', 'First Term', 'Fractions', `# Fractions

## Objectives
By the end of this notebook you should be able to:
- Say what a fraction is and name its parts.
- Add, subtract, multiply and divide simple fractions.
- Change an improper fraction to a mixed number and back.

## 1. What is a fraction?
A fraction is a part of a whole. If a pizza is cut into 4 equal slices and you eat 1 slice, you ate 1/4 of the pizza.
- The number on top is the **numerator** (how many parts we have).
- The number at the bottom is the **denominator** (how many equal parts the whole is cut into).

## 2. Types of fractions
- **Proper fraction**: numerator is smaller than denominator, e.g. 3/5.
- **Improper fraction**: numerator is bigger than or equal to the denominator, e.g. 7/4.
- **Mixed number**: a whole number and a fraction, e.g. 1 3/4.

## 3. Equivalent fractions
Multiply or divide the top and bottom by the same number. 1/2 = 2/4 = 3/6 = 4/8.

## 4. Adding and subtracting
Same denominators: add or subtract the numerators only. 2/7 + 3/7 = 5/7.
Different denominators: find the LCM of the denominators first.
Worked example: 1/3 + 1/4. LCM of 3 and 4 is 12. So 4/12 + 3/12 = 7/12.

## 5. Multiplying
Multiply top by top and bottom by bottom. 2/3 x 3/5 = 6/15 = 2/5 (simplified).

## 6. Dividing
Keep the first fraction, change the sign to multiplication and flip the second fraction. 3/4 divided by 2/5 = 3/4 x 5/2 = 15/8 = 1 7/8.

## 7. Improper to mixed number
7/4: 4 goes into 7 one time with remainder 3, so 7/4 = 1 3/4.

## Summary
- A fraction is a part of a whole.
- Make denominators the same before adding or subtracting.
- To divide, flip the second fraction and multiply.

## Class exercise
1. Simplify 12/18.
2. Find 2/5 + 1/3.
3. Find 5/6 - 1/4.
4. Find 3/8 x 4/9.
5. Change 11/3 to a mixed number.

## Answers
1. 2/3   2. 11/15   3. 7/12   4. 1/6   5. 3 2/3`),
N('JSS 1', 'English Language', 'First Term', 'Nouns', `# Parts of Speech: Nouns

## Objectives
Pupils should be able to define a noun, name its types and use nouns correctly in sentences.

## 1. What is a noun?
A noun is a word that names a person, place, animal, thing or idea.
Examples: teacher, Ibadan, goat, book, honesty.

## 2. Types of nouns
- **Common nouns** name general things: boy, school, river.
- **Proper nouns** name particular people or places and begin with capital letters: Ade, Nigeria, Monday.
- **Collective nouns** name a group: a class of pupils, a flock of birds, a team of players.
- **Abstract nouns** name feelings, qualities or ideas that you cannot touch: love, courage, kindness.
- **Concrete nouns** can be seen or touched: table, rice, phone.
- **Countable nouns** can be counted: three pens. **Uncountable nouns** cannot: water, sand, advice.

## 3. Singular and plural
- Add s: book, books.
- Add es after s, x, z, ch, sh: box, boxes; church, churches.
- Change y to ies after a consonant: baby, babies.
- Irregular: child, children; man, men; tooth, teeth; sheep, sheep.

## 4. Nouns in sentences
- The **teacher** gave the **pupils** a **test**. (three nouns)
- **Honesty** is the best policy. (abstract noun)

## Summary
A noun names. Capital letters are used for proper nouns. Nouns can be singular or plural.

## Class exercise
1. Pick the nouns: "Ngozi carried water to the market."
2. Give the plural of: leaf, city, tooth, bus.
3. Write one sentence with an abstract noun.

## Answers
1. Ngozi, water, market   2. leaves, cities, teeth, buses`),
N('JSS 1', 'Basic Science', 'First Term', 'Cells and living things', `# The Cell: Unit of Life

## Objectives
Explain what a cell is, name the main parts of an animal and plant cell, and state their functions.

## 1. What is a cell?
All living things are made of cells. The cell is the smallest living unit. Some living things have one cell (amoeba) and some have millions (humans).

## 2. Parts of a cell and what they do
- **Cell membrane**: a thin skin that controls what enters and leaves.
- **Cytoplasm**: jelly-like liquid where the cell's activities take place.
- **Nucleus**: the control centre that holds the cell's instructions.
- **Mitochondria**: release energy from food.
Plant cells also have:
- **Cell wall**: a strong outer layer that gives shape and support.
- **Chloroplasts**: contain chlorophyll and make food by photosynthesis.
- **Large vacuole**: stores water and food.

## 3. Differences between plant and animal cells
- Plant cell: has a cell wall, chloroplasts and a large vacuole, usually fixed shape.
- Animal cell: no cell wall, no chloroplasts, small vacuoles, shape can change.

## 4. Cells, tissues, organs, systems
Cells join to make a tissue (muscle tissue). Tissues make an organ (the heart). Organs work together as a system (circulatory system). Systems make an organism.

## Summary
The cell is the unit of life. The nucleus controls, the membrane guards, mitochondria give energy, chloroplasts make food in plants.

## Class exercise
1. Name two parts found only in plant cells.
2. What is the work of the nucleus?
3. Arrange: organ, cell, system, tissue (smallest to largest).

## Answers
1. cell wall, chloroplasts   2. controls cell activities   3. cell, tissue, organ, system`),
N('Primary 4', 'Basic Science and Technology', 'Second Term', 'Matter: solids, liquids and gases', `# Matter

## What is matter?
Matter is anything that has weight and takes up space. Stone, water and air are all matter.

## Three states of matter
- **Solid**: has a fixed shape and fixed size. Examples: stone, wood, book.
- **Liquid**: has no fixed shape, it takes the shape of its container, but has a fixed size. Examples: water, oil, milk.
- **Gas**: has no fixed shape and no fixed size, it spreads everywhere. Examples: air, oxygen, steam.

## Changing state
- Heating ice makes it melt into water (solid to liquid).
- Heating water makes it boil into steam (liquid to gas).
- Cooling steam makes it condense into water (gas to liquid).
- Cooling water in a freezer makes it freeze into ice (liquid to solid).

## Activity at home
Put an ice cube in a cup and watch it for 20 minutes. Write what you see.

## Summary
Matter has three states: solid, liquid and gas. Heat and cold can change one state to another.

## Questions
1. Name two examples each of a solid, a liquid and a gas.
2. What do we call the change from water to steam?
3. Which state of matter has no fixed shape and no fixed size?

## Answers
3. Gas`),
N('SSS 1', 'Physics', 'First Term', 'Motion: speed, velocity and acceleration', `# Motion

## Objectives
Define speed, velocity and acceleration; solve problems using the equations of uniform acceleration.

## 1. Key terms
- **Distance** is the total path covered (scalar, metre).
- **Displacement** is the straight-line distance in a stated direction (vector, metre).
- **Speed** = distance / time (m/s).
- **Velocity** = displacement / time (m/s), a vector.
- **Acceleration** = change in velocity / time = (v - u) / t (m/s squared).

## 2. Equations of uniform acceleration
Where u = initial velocity, v = final velocity, a = acceleration, t = time, s = distance:
1. v = u + at
2. s = ut + 1/2 at^2
3. v^2 = u^2 + 2as

## 3. Worked example
A car starts from rest and accelerates at 2 m/s^2 for 10 s. Find its final velocity and the distance covered.
- u = 0, a = 2, t = 10.
- v = u + at = 0 + 2 x 10 = 20 m/s.
- s = ut + 1/2 at^2 = 0 + 1/2 x 2 x 100 = 100 m.

## 4. Velocity-time graph
- The slope gives acceleration.
- The area under the graph gives distance travelled.

## 5. Free fall
Objects falling near the Earth accelerate at g = 10 m/s^2 (use 9.8 if asked).

## Summary
Speed has size only, velocity has size and direction. Use v = u + at, s = ut + 1/2 at^2 and v^2 = u^2 + 2as.

## Exercise
1. A bus moves from 5 m/s to 25 m/s in 8 s. Find the acceleration.
2. A stone drops from rest for 3 s. Find its speed and the height fallen (g = 10).

## Answers
1. 2.5 m/s^2   2. v = 30 m/s, s = 45 m`),
N('SSS 1', 'Chemistry', 'First Term', 'Atomic structure', `# Atomic Structure

## Objectives
Describe the atom, state the properties of protons, neutrons and electrons, and write electron arrangements.

## 1. The atom
An atom is the smallest particle of an element that can take part in a chemical reaction. It has a central **nucleus** (protons and neutrons) surrounded by **electrons** in shells.

## 2. Sub-atomic particles
- Proton: charge +1, mass 1, in the nucleus.
- Neutron: charge 0, mass 1, in the nucleus.
- Electron: charge -1, mass almost 0, in shells around the nucleus.

## 3. Atomic number and mass number
- **Atomic number (Z)** = number of protons (= electrons in a neutral atom).
- **Mass number (A)** = protons + neutrons.
- Neutrons = A - Z.
Example: Sodium has Z = 11 and A = 23, so 11 protons, 11 electrons and 12 neutrons.

## 4. Electron arrangement
Shells hold 2, 8, 8, 2 electrons in order for the first 20 elements.
- Sodium (11): 2, 8, 1
- Chlorine (17): 2, 8, 7
- Calcium (20): 2, 8, 8, 2

## 5. Isotopes
Atoms of the same element with the same number of protons but different numbers of neutrons. Example: carbon-12 and carbon-14.

## Summary
Atomic number counts protons. Mass number counts protons and neutrons. Electrons fill shells 2, 8, 8, 2.

## Exercise
1. How many neutrons are in an atom with Z = 17 and A = 35?
2. Write the electron arrangement of magnesium (Z = 12).

## Answers
1. 18   2. 2, 8, 2`)
];
