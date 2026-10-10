/** Idiom & word-game boards from the Use of English Jeopardy series.
 *  Each game is one 5x5 round; original (funny) category names preserved. */
export interface UoeClue { clue: string; answer: string }
export interface UoeCategory { name: string; clues: UoeClue[] }
export interface UoeGame {
  id: string;
  title: string;
  letter: string;
  categories: UoeCategory[];
}

export const UOE_GAMES: UoeGame[] = [
 {
  "id": "uoe-ac",
  "title": "Use of English Jeopardy · Game AC",
  "letter": "AC",
  "categories": [
   {
    "name": "Praising Things",
    "clues": [
     {
      "clue": "My new laptop is miles ______ of my old one. (much more advanced than)",
      "answer": "MILES AHEAD OF"
     },
     {
      "clue": "The workmen have done a first-______ job on our kitchen. (superb)",
      "answer": "FIRST-CLASS"
     },
     {
      "clue": "Chan’s store only sells watches that are top of the ______. (the best quality)",
      "answer": "TOP OF THE LINE"
     },
     {
      "clue": "The gallery has a mind-______ collection of modern art. (amazing)",
      "answer": "MIND-BLOWING"
     },
     {
      "clue": "Abel is a top-______ reporter. He’s interviewed some famous actors. (highest quality)",
      "answer": "TOP-NOTCH"
     }
    ]
   },
   {
    "name": "Criticizing Things",
    "clues": [
     {
      "clue": "Pete’s habit of dropping litter leaves a bad ______ in my mouth. (makes me feel very uncomfortable)",
      "answer": "LEAVES A BAD TASTE IN MY MOUTH"
     },
     {
      "clue": "The clothes in this store are second ______. They don’t last long. (low-quality)",
      "answer": "SECOND RATE"
     },
     {
      "clue": "Noah’s old car is past its ______. He’s been driving it for years. (in a bad condition, too old)",
      "answer": "PAST ITS PRIME"
     },
     {
      "clue": "The hotel was cheap and ______. The rooms were dirty. (affordable but low-quality)",
      "answer": "CHEAP AND NASTY"
     },
     {
      "clue": "We had been looking forward to the meal, but the food was a let-______. (a disappointment)",
      "answer": "A LET-DOWN"
     }
    ]
   },
   {
    "name": "Animal Idioms",
    "clues": [
     {
      "clue": "Don’t let the ______ out of the bag about the party! (reveal a secret)",
      "answer": "CAT"
     },
     {
      "clue": "Hold your ______! We haven’t decided anything yet. (wait, be patient)",
      "answer": "HORSES"
     },
     {
      "clue": "At the dance class I felt like a ______ out of water. (uncomfortable in an unfamiliar situation)",
      "answer": "FISH"
     },
     {
      "clue": "Nobody wanted to mention the ______ in the room. (an obvious problem everyone avoids discussing)",
      "answer": "ELEPHANT"
     },
     {
      "clue": "Take an umbrella, it’s raining ______ and dogs. (raining very heavily)",
      "answer": "CATS"
     }
    ]
   },
   {
    "name": "Colour Idioms",
    "clues": [
     {
      "clue": "Out of the ______, she got a call from her old school friend. (unexpectedly)",
      "answer": "BLUE"
     },
     {
      "clue": "My dad sees ______ when someone parks in front of our gate. (becomes very angry)",
      "answer": "RED"
     },
     {
      "clue": "I was ______ with envy when I saw her new bike. (very jealous)",
      "answer": "GREEN"
     },
     {
      "clue": "I told a ______ lie and said I loved the present. (a small harmless lie)",
      "answer": "WHITE"
     },
     {
      "clue": "We only see our cousins once in a ______ moon. (very rarely)",
      "answer": "BLUE"
     }
    ]
   },
   {
    "name": "Scrambled Abbreviations",
    "clues": [
     {
      "clue": "IBF (US federal investigators)",
      "answer": "FBI (Federal Bureau of Investigation)"
     },
     {
      "clue": "OFU (An unidentified object in the sky)",
      "answer": "UFO (unidentified flying object)"
     },
     {
      "clue": "OEC (The top boss of a company)",
      "answer": "CEO (chief executive officer)"
     },
     {
      "clue": "OHW (The United Nations health organisation)",
      "answer": "WHO (World Health Organization)"
     },
     {
      "clue": "TAE (The time a plane or train is expected to arrive)",
      "answer": "ETA (estimated time of arrival)"
     }
    ]
   }
  ]
 },
 {
  "id": "uoe-ad",
  "title": "Use of English Jeopardy · Game AD",
  "letter": "AD",
  "categories": [
   {
    "name": "Praising and Criticizing",
    "clues": [
     {
      "clue": "World-______ athletes need to train for hours every day. (among the best in the world)",
      "answer": "WORLD-CLASS"
     },
     {
      "clue": "The crème de la ______ of the fashion world were at the launch party. (the very best people)",
      "answer": "CRÈME DE LA CRÈME"
     },
     {
      "clue": "His voice is OK, but he’s not going to set the world on ______. (not going to be very exciting or successful)",
      "answer": "NOT GOING TO SET THE WORLD ON FIRE"
     },
     {
      "clue": "It’s time you got rid of that moth-______ old sofa. (shabby, in a bad condition)",
      "answer": "MOTH-EATEN"
     },
     {
      "clue": "My old computer is past its sell-by ______. It takes ages to start. (in need of replacing)",
      "answer": "PAST ITS SELL-BY DATE"
     }
    ]
   },
   {
    "name": "Attitudes and Behaviour",
    "clues": [
     {
      "clue": "Elisa has just moved into the house of her ______. (that she has fantasized about having)",
      "answer": "THE HOUSE OF HER DREAMS"
     },
     {
      "clue": "Ann often looks straight ______ you, but I think she’s just short-sighted. (behaves as if she doesn’t see you)",
      "answer": "LOOK STRAIGHT / RIGHT THROUGH SOMEONE"
     },
     {
      "clue": "We wouldn’t ______ of leaving without saying thank you. (would never do something because it is wrong)",
      "answer": "WOULDN’T DREAM OF"
     },
     {
      "clue": "Next to the news of the flood, my problems faded into ______. (seemed unimportant by comparison)",
      "answer": "FADED / PALED INTO INSIGNIFICANCE"
     },
     {
      "clue": "Sales fell ______ of expectations last month. (were not as good as expected)",
      "answer": "FELL SHORT OF EXPECTATIONS"
     }
    ]
   },
   {
    "name": "Number Idioms",
    "clues": [
     {
      "clue": "When she heard she’d passed, she was on cloud ______. (extremely happy)",
      "answer": "NINE"
     },
     {
      "clue": "I’m a terrible dancer, I have two left ______. (very clumsy at dancing)",
      "answer": "FEET"
     },
     {
      "clue": "The office was at sixes and ______ after the move. (in a state of confusion)",
      "answer": "SEVENS"
     },
     {
      "clue": "They changed the plan at the ______ hour. (at the last possible moment)",
      "answer": "ELEVENTH"
     },
     {
      "clue": "The experiment failed, so we’re back to square ______. (back to the beginning)",
      "answer": "ONE"
     }
    ]
   },
   {
    "name": "Homophones",
    "clues": [
     {
      "clue": "Don’t walk on the hot sand in ______ (bear) feet. Write the correct spelling.",
      "answer": "BARE"
     },
     {
      "clue": "There’s a crack in the ______ (sealing) of my bedroom. Write the correct spelling.",
      "answer": "CEILING"
     },
     {
      "clue": "Let’s ______ (meat) outside the cinema at six. Write the correct spelling.",
      "answer": "MEET"
     },
     {
      "clue": "Would you like another ______ (peace) of cake? Write the correct spelling.",
      "answer": "PIECE"
     },
     {
      "clue": "Turn ______ (write) at the traffic lights. Write the correct spelling.",
      "answer": "RIGHT"
     }
    ]
   },
   {
    "name": "Compound Word Finder",
    "clues": [
     {
      "clue": "One word goes before all three: fish, light, gazer",
      "answer": "STAR (starfish, starlight, stargazer)"
     },
     {
      "clue": "One word goes before all three: shine, burn, flower",
      "answer": "SUN (sunshine, sunburn, sunflower)"
     },
     {
      "clue": "One word goes before all three: case, mark, shelf",
      "answer": "BOOK (bookcase, bookmark, bookshelf)"
     },
     {
      "clue": "One word goes before all three: mate, room, work",
      "answer": "CLASS (classmate, classroom, classwork)"
     },
     {
      "clue": "One word goes before all three: ball, print, step",
      "answer": "FOOT (football, footprint, footstep)"
     }
    ]
   }
  ]
 },
 {
  "id": "uoe-h",
  "title": "Use of English Jeopardy · Game H",
  "letter": "H",
  "categories": [
   {
    "name": "Finish the Saying",
    "clues": [
     {
      "clue": "Birds of a feather ___",
      "answer": "flock together"
     },
     {
      "clue": "Actions speak ___",
      "answer": "louder than words"
     },
     {
      "clue": "Two heads are ___",
      "answer": "better than one"
     },
     {
      "clue": "Blood is ___",
      "answer": "thicker than water"
     },
     {
      "clue": "Give credit where ___",
      "answer": "credit is due"
     }
    ]
   },
   {
    "name": "Endings and Beginnings",
    "clues": [
     {
      "clue": "Gun ___ cracker",
      "answer": "FIRE (gunfire, firecracker)"
     },
     {
      "clue": "Wheel ___ man",
      "answer": "CHAIR (wheelchair, chairman)"
     },
     {
      "clue": "Home ___ fill",
      "answer": "LAND (homeland, landfill)"
     },
     {
      "clue": "Flash ___ bulb",
      "answer": "LIGHT (flashlight, lightbulb)"
     },
     {
      "clue": "Boy ___ ship",
      "answer": "FRIEND (boyfriend, friendship)"
     }
    ]
   },
   {
    "name": "Hidden Animals",
    "clues": [
     {
      "clue": "WH _ _ _ BARROW — a cart with one wheel",
      "answer": "EEL (wheelbarrow)"
     },
     {
      "clue": "_ _ _ ASTROPHE — a disaster",
      "answer": "CAT (catastrophe)"
     },
     {
      "clue": "_ _ _ HTUB — a place for a relaxing soak",
      "answer": "BAT (bathtub)"
     },
     {
      "clue": "FRIS _ _ _ — a plastic disc you throw",
      "answer": "BEE (frisbee)"
     },
     {
      "clue": "KN _ _ _ EDGE — what you learn and remember",
      "answer": "OWL (knowledge)"
     }
    ]
   },
   {
    "name": "Homonyms",
    "clues": [
     {
      "clue": "Consumed; or, seven plus one",
      "answer": "ATE / EIGHT"
     },
     {
      "clue": "A blossom; or, a basic baking ingredient",
      "answer": "FLOWER / FLOUR"
     },
     {
      "clue": "A part in a play; or, dinner bread",
      "answer": "ROLE / ROLL"
     },
     {
      "clue": "The period in which a king rules; or, precipitation",
      "answer": "REIGN / RAIN"
     },
     {
      "clue": "A long slender rod; or, a survey of opinions",
      "answer": "POLE / POLL"
     }
    ]
   },
   {
    "name": "Missing Numbers",
    "clues": [
     {
      "clue": "The ___ Commandments",
      "answer": "TEN"
     },
     {
      "clue": "Around the World in ___ Days",
      "answer": "EIGHTY"
     },
     {
      "clue": "Ali Baba and the ___ Thieves",
      "answer": "FORTY"
     },
     {
      "clue": "A stitch in time saves ___",
      "answer": "NINE"
     },
     {
      "clue": "Shakespeare wrote ___ sonnets",
      "answer": "154"
     }
    ]
   }
  ]
 },
 {
  "id": "uoe-i",
  "title": "Use of English Jeopardy · Game I",
  "letter": "I",
  "categories": [
   {
    "name": "Palindromes",
    "clues": [
     {
      "clue": "A baby dog",
      "answer": "PUP"
     },
     {
      "clue": "A mature female sheep",
      "answer": "EWE"
     },
     {
      "clue": "A one-night job for a rock band",
      "answer": "GIG"
     },
     {
      "clue": "A polite, formal term of address for a woman",
      "answer": "MADAM"
     },
     {
      "clue": "A lightweight one-person canoe",
      "answer": "KAYAK"
     }
    ]
   },
   {
    "name": "What a Pair",
    "clues": [
     {
      "clue": "Sleeping furniture … and the morning meal",
      "answer": "BED and BREAKFAST"
     },
     {
      "clue": "Garfield … and Mickey",
      "answer": "CAT and MOUSE"
     },
     {
      "clue": "Siamese and Manx … and boxers and beagles",
      "answer": "CATS and DOGS"
     },
     {
      "clue": "Enclosure for a pig … and the liquid released by a squid",
      "answer": "PEN and INK"
     },
     {
      "clue": "Court proceeding … and a mistake or miscalculation",
      "answer": "TRIAL and ERROR"
     }
    ]
   },
   {
    "name": "Portmanteaus",
    "clues": [
     {
      "clue": "Brunch",
      "answer": "BREAKFAST + LUNCH"
     },
     {
      "clue": "Motel",
      "answer": "MOTOR + HOTEL"
     },
     {
      "clue": "Spanglish",
      "answer": "SPANISH + ENGLISH"
     },
     {
      "clue": "Intercom",
      "answer": "INTERNAL + COMMUNICATION"
     },
     {
      "clue": "Chortle",
      "answer": "CHUCKLE + SNORT"
     }
    ]
   },
   {
    "name": "Rhyme Time",
    "clues": [
     {
      "clue": "Fish enticer; and one less than nine",
      "answer": "BAIT / EIGHT"
     },
     {
      "clue": "Strike with a fist; and the midday meal",
      "answer": "PUNCH / LUNCH"
     },
     {
      "clue": "A royal chair; and a piece of a skeleton",
      "answer": "THRONE / BONE"
     },
     {
      "clue": "Domestic fowls; and the author of Oliver Twist",
      "answer": "CHICKENS / DICKENS"
     },
     {
      "clue": "Ten-pin or candlepin; and walking casually",
      "answer": "BOWLING / STROLLING"
     }
    ]
   },
   {
    "name": "Double Trouble",
    "clues": [
     {
      "clue": "Bow, coat, drop, forest",
      "answer": "RAIN"
     },
     {
      "clue": "Beam, shine, walk, light",
      "answer": "MOON"
     },
     {
      "clue": "Proof, melon, fall, color",
      "answer": "WATER"
     },
     {
      "clue": "Quake, shaking, worm",
      "answer": "EARTH"
     },
     {
      "clue": "Maker, stick, box, book",
      "answer": "MATCH"
     }
    ]
   }
  ]
 },
 {
  "id": "uoe-j",
  "title": "Use of English Jeopardy · Game J",
  "letter": "J",
  "categories": [
   {
    "name": "Backwords",
    "clues": [
     {
      "clue": "Forward it's a state of armed conflict; backward it's uncooked.",
      "answer": "WAR / RAW"
     },
     {
      "clue": "Forward it's the movement of a river; backward it's the largest member of the dog family.",
      "answer": "FLOW / WOLF"
     },
     {
      "clue": "Forward they're spinning toys; backward it's a small stain on a shirt.",
      "answer": "TOPS / SPOT"
     },
     {
      "clue": "Forward it's a collective term for Fidos and Fluffys; backward it means to put one foot in front of the other.",
      "answer": "PETS / STEP"
     },
     {
      "clue": "Forward it's a main feature of a bureau; backward it's a sum of money offered for help solving a crime.",
      "answer": "DRAWER / REWARD"
     }
    ]
   },
   {
    "name": "Kangaroo Words",
    "clues": [
     {
      "clue": "Myself",
      "answer": "ME"
     },
     {
      "clue": "Banish",
      "answer": "BAN"
     },
     {
      "clue": "Enjoyment",
      "answer": "JOY"
     },
     {
      "clue": "Blossom",
      "answer": "BLOOM"
     },
     {
      "clue": "Salvage",
      "answer": "SAVE"
     }
    ]
   },
   {
    "name": "Hidden Anatomy",
    "clues": [
     {
      "clue": "OB _ _ _ D — did as you were told",
      "answer": "EYE (obeyed)"
     },
     {
      "clue": "P _ _ _ L — an oyster's offering",
      "answer": "EAR (pearl)"
     },
     {
      "clue": "C _ _ _ MUNK — a small striped rodent",
      "answer": "HIP (chipmunk)"
     },
     {
      "clue": "PAPER _ _ _ _ — a book with a flexible cover",
      "answer": "BACK (paperback)"
     },
     {
      "clue": "OR _ _ _ _ _ RA — a large group of musicians",
      "answer": "CHEST (orchestra)"
     }
    ]
   },
   {
    "name": "Idioms with ON",
    "clues": [
     {
      "clue": "If a waiter brings you a free appetizer, you're getting it on the ___.",
      "answer": "on the HOUSE"
     },
     {
      "clue": "If your new assistant is capable and well-informed, she is on the ___.",
      "answer": "on the BALL"
     },
     {
      "clue": "If you're having success after success, you're on a ___.",
      "answer": "on a ROLL"
     },
     {
      "clue": "If you tell guests to arrive at seven o'clock exactly, they should come on the ___.",
      "answer": "on the DOT"
     },
     {
      "clue": "If you know a word but can't quite recall it, it's on the ___ (four words).",
      "answer": "on the TIP OF YOUR TONGUE"
     }
    ]
   },
   {
    "name": "Up and Down",
    "clues": [
     {
      "clue": "With “up” it means to stop talking. With “down” it means to close a factory or turn off a computer.",
      "answer": "SHUT (shut up / shut down)"
     },
     {
      "clue": "With “up” it means to make a small improvement. With “down” it's a way to score in American football.",
      "answer": "TOUCH (touch up / touchdown)"
     },
     {
      "clue": "With “up” it means to appear suddenly. With “down” it's what a chambermaid does to prepare the bed.",
      "answer": "TURN (turn up / turn down)"
     },
     {
      "clue": "With “up” it means to end a relationship. With “down” it's a sudden collapse.",
      "answer": "BREAK (break up / breakdown)"
     },
     {
      "clue": "With “up” it's what a pitcher does before throwing. With “down” it means to slowly come to an end.",
      "answer": "WIND (wind up / wind down)"
     }
    ]
   }
  ]
 },
 {
  "id": "uoe-k",
  "title": "Use of English Jeopardy · Game K",
  "letter": "K",
  "categories": [
   {
    "name": "Down to the Wire",
    "clues": [
     {
      "clue": "___ to the chase",
      "answer": "CUT"
     },
     {
      "clue": "___ to the brim",
      "answer": "FILLED"
     },
     {
      "clue": "___ to the nines",
      "answer": "DRESSED"
     },
     {
      "clue": "___ to the choir",
      "answer": "PREACHING"
     },
     {
      "clue": "___ to the grindstone",
      "answer": "NOSE"
     }
    ]
   },
   {
    "name": "Geographical Double Meanings",
    "clues": [
     {
      "clue": "An Asian country … or ceramic tableware",
      "answer": "CHINA"
     },
     {
      "clue": "A river in South America … or an online retailer",
      "answer": "AMAZON"
     },
     {
      "clue": "A county in southern California … or a citrus fruit",
      "answer": "ORANGE"
     },
     {
      "clue": "A city on Lake Erie … or a bison",
      "answer": "BUFFALO"
     },
     {
      "clue": "An ancient English city … or a nice, long soak",
      "answer": "BATH"
     }
    ]
   },
   {
    "name": "Word Parts",
    "clues": [
     {
      "clue": "The opposite of out + verdict deciders",
      "answer": "INJURY (in + jury)"
     },
     {
      "clue": "Water barrier + writing instrument",
      "answer": "DAMPEN (dam + pen)"
     },
     {
      "clue": "Nearest star + devoid of moisture",
      "answer": "SUNDRY (sun + dry)"
     },
     {
      "clue": "The final part + organ of hearing",
      "answer": "ENDEAR (end + ear)"
     },
     {
      "clue": "Hospital section + attire for a judge",
      "answer": "WARDROBE (ward + robe)"
     }
    ]
   },
   {
    "name": "Finish the Food Idiom",
    "clues": [
     {
      "clue": "Couch ___",
      "answer": "POTATO"
     },
     {
      "clue": "Flat as a ___",
      "answer": "PANCAKE"
     },
     {
      "clue": "Spill the ___",
      "answer": "BEANS"
     },
     {
      "clue": "The big ___",
      "answer": "CHEESE"
     },
     {
      "clue": "Walk on ___",
      "answer": "EGGSHELLS"
     }
    ]
   },
   {
    "name": "Replace the Animal",
    "clues": [
     {
      "clue": "To Kill a ARMADILLO (Harper Lee)",
      "answer": "MOCKINGBIRD"
     },
     {
      "clue": "The Velveteen ARMADILLO (Margery Williams)",
      "answer": "RABBIT"
     },
     {
      "clue": "Of ARMADILLOS and Men (John Steinbeck)",
      "answer": "MICE"
     },
     {
      "clue": "The ARMADILLO of the Baskervilles (Arthur Conan Doyle)",
      "answer": "HOUND"
     },
     {
      "clue": "The Maltese ARMADILLO (Dashiell Hammett)",
      "answer": "FALCON"
     }
    ]
   }
  ]
 },
 {
  "id": "uoe-n",
  "title": "Use of English Jeopardy · Game N",
  "letter": "N",
  "categories": [
   {
    "name": "Big Bang (B & B)",
    "clues": [
     {
      "clue": "London's famous timekeeper.",
      "answer": "BIG BEN"
     },
     {
      "clue": "An insect … or a brand of tuna fish.",
      "answer": "BUMBLE BEE"
     },
     {
      "clue": "A gymnastic apparatus that looks like a two-by-four on legs.",
      "answer": "BALANCE BEAM"
     },
     {
      "clue": "Nickname for anyone born between 1946 and 1964.",
      "answer": "BABY BOOMER"
     },
     {
      "clue": "Halitosis.",
      "answer": "BAD BREATH"
     }
    ]
   },
   {
    "name": "It's CH-arming",
    "clues": [
     {
      "clue": "A fowl meal.",
      "answer": "CHICKEN"
     },
     {
      "clue": "Swiss or Jack.",
      "answer": "CHEESE"
     },
     {
      "clue": "The fastest mammal on earth.",
      "answer": "CHEETAH"
     },
     {
      "clue": "A board game with kings, queens, and knights.",
      "answer": "CHESS"
     },
     {
      "clue": "A hired driver.",
      "answer": "CHAUFFEUR"
     }
    ]
   },
   {
    "name": "Brrrr! (BR-)",
    "clues": [
     {
      "clue": "The largest country in South America.",
      "answer": "BRAZIL"
     },
     {
      "clue": "The organ of thought and feeling.",
      "answer": "BRAIN"
     },
     {
      "clue": "An adornment worn on the wrist.",
      "answer": "BRACELET"
     },
     {
      "clue": "An illegal gift, usually money, to influence an official.",
      "answer": "BRIBE"
     },
     {
      "clue": "The person who earns the money to support a family.",
      "answer": "BREADWINNER"
     }
    ]
   },
   {
    "name": "Rhyming Words",
    "clues": [
     {
      "clue": "A compendium of recipes.",
      "answer": "COOKBOOK"
     },
     {
      "clue": "A bag often used by students to carry books.",
      "answer": "BACKPACK"
     },
     {
      "clue": "A portable two-way radio device.",
      "answer": "WALKIE-TALKIE"
     },
     {
      "clue": "A minor car accident.",
      "answer": "FENDER BENDER"
     },
     {
      "clue": "The exodus of an intellectual elite.",
      "answer": "BRAIN DRAIN"
     }
    ]
   },
   {
    "name": "Just One Letter",
    "clues": [
     {
      "clue": "A very casual shirt.",
      "answer": "T (T-shirt)"
     },
     {
      "clue": "The mark on a pirate's map showing where the treasure is.",
      "answer": "X"
     },
     {
      "clue": "A hand gesture for winning or peace.",
      "answer": "V"
     },
     {
      "clue": "A kind of turn … or a German submarine.",
      "answer": "U (U-turn / U-boat)"
     },
     {
      "clue": "The acceleration force astronauts experience during blastoff.",
      "answer": "G (G-force)"
     }
    ]
   }
  ]
 },
 {
  "id": "uoe-o",
  "title": "Use of English Jeopardy · Game O",
  "letter": "O",
  "categories": [
   {
    "name": "Just J's",
    "clues": [
     {
      "clue": "You need this to change a tire.",
      "answer": "JACK"
     },
     {
      "clue": "A carpenter's tool … or a kind of puzzle.",
      "answer": "JIGSAW"
     },
     {
      "clue": "Olympic event that involves throwing a spear.",
      "answer": "JAVELIN"
     },
     {
      "clue": "Duke Ellington and Louis Armstrong were early innovators of this type of music.",
      "answer": "JAZZ"
     },
     {
      "clue": "A person or thing that brings bad luck.",
      "answer": "JINX"
     }
    ]
   },
   {
    "name": "Patchwork (PAT-)",
    "clues": [
     {
      "clue": "A paved area in the backyard.",
      "answer": "PATIO"
     },
     {
      "clue": "Legal proof that you invented something.",
      "answer": "PATENT"
     },
     {
      "clue": "This is a virtue.",
      "answer": "PATIENCE"
     },
     {
      "clue": "Official name of the kneecap.",
      "answer": "PATELLA"
     },
     {
      "clue": "You buy croissants here; it's the French word for “bakery.”",
      "answer": "PATISSERIE"
     }
    ]
   },
   {
    "name": "X, Y or Z",
    "clues": [
     {
      "clue": "Striped equine animal.",
      "answer": "ZEBRA"
     },
     {
      "clue": "This is often a child's first musical instrument.",
      "answer": "XYLOPHONE"
     },
     {
      "clue": "A large pleasure boat.",
      "answer": "YACHT"
     },
     {
      "clue": "It promotes fermentation and makes bread rise.",
      "answer": "YEAST"
     },
     {
      "clue": "Afraid of anything foreign.",
      "answer": "XENOPHOBIC"
     }
    ]
   },
   {
    "name": "Sheesh (SH… / …SH)",
    "clues": [
     {
      "clue": "A delicious crustacean.",
      "answer": "SHRIMP"
     },
     {
      "clue": "This tool helps you put your loafers on.",
      "answer": "SHOEHORN"
     },
     {
      "clue": "The national plant and emblem of Ireland.",
      "answer": "SHAMROCK"
     },
     {
      "clue": "A small, round, pungent root, mostly used in salads.",
      "answer": "RADISH"
     },
     {
      "clue": "Pilfering small items from a store.",
      "answer": "SHOPLIFTING"
     }
    ]
   },
   {
    "name": "Endings & Beginnings",
    "clues": [
     {
      "clue": "Super ___ power",
      "answer": "MAN (superman, manpower)"
     },
     {
      "clue": "Drug ___ front",
      "answer": "STORE (drugstore, storefront)"
     },
     {
      "clue": "Turn ___ cloth",
      "answer": "TABLE (turntable, tablecloth)"
     },
     {
      "clue": "Ear ___ leader",
      "answer": "RING (earring, ringleader)"
     },
     {
      "clue": "Bell ___ scotch",
      "answer": "HOP (bellhop, hopscotch)"
     }
    ]
   }
  ]
 },
 {
  "id": "uoe-p",
  "title": "Use of English Jeopardy · Game P",
  "letter": "P",
  "categories": [
   {
    "name": "Golly Gee (G & G)",
    "clues": [
     {
      "clue": "This San Francisco bridge is actually red.",
      "answer": "GOLDEN GATE"
     },
     {
      "clue": "Charlie Brown's favorite saying.",
      "answer": "GOOD GRIEF"
     },
     {
      "clue": "Term for a very fuel-inefficient car.",
      "answer": "GAS GUZZLER"
     },
     {
      "clue": "You don't want this to get too near “E” on a long drive.",
      "answer": "GAS GAUGE"
     },
     {
      "clue": "A phrase for the strained understanding between young people and their parents.",
      "answer": "GENERATION GAP"
     }
    ]
   },
   {
    "name": "Homonyms",
    "clues": [
     {
      "clue": "The top of a mountain; or, a quick, furtive glance.",
      "answer": "PEAK / PEEK"
     },
     {
      "clue": "A man who served the king in the Middle Ages; or, the period from sunset to sunrise.",
      "answer": "KNIGHT / NIGHT"
     },
     {
      "clue": "Temporary stop in speech; or, an animal's feet.",
      "answer": "PAUSE / PAWS"
     },
     {
      "clue": "To bide one's time; or, a measurement of heaviness.",
      "answer": "WAIT / WEIGHT"
     },
     {
      "clue": "Not working, lazy; or, a person who is greatly admired.",
      "answer": "IDLE / IDOL"
     }
    ]
   },
   {
    "name": "Finish the Saying",
    "clues": [
     {
      "clue": "Beauty is only ___",
      "answer": "skin deep"
     },
     {
      "clue": "Honesty is ___",
      "answer": "the best policy"
     },
     {
      "clue": "It takes two ___",
      "answer": "to tango"
     },
     {
      "clue": "A man's home ___",
      "answer": "is his castle"
     },
     {
      "clue": "Good fences ___",
      "answer": "make good neighbors"
     }
    ]
   },
   {
    "name": "Missing Numbers",
    "clues": [
     {
      "clue": "The ___ Musketeers",
      "answer": "THREE"
     },
     {
      "clue": "There are ___ days in a leap year.",
      "answer": "366"
     },
     {
      "clue": "The ___ original colonies",
      "answer": "THIRTEEN"
     },
     {
      "clue": "The ___ deadly sins",
      "answer": "SEVEN"
     },
     {
      "clue": "Catch-___ (Joseph Heller's novel)",
      "answer": "22"
     }
    ]
   },
   {
    "name": "Hidden Anatomy",
    "clues": [
     {
      "clue": "H _ _ _ ONY — notes sung together pleasingly",
      "answer": "ARM (harmony)"
     },
     {
      "clue": "DIAG _ _ _ _ D — identified an illness",
      "answer": "NOSE (diagnosed)"
     },
     {
      "clue": "_ _ _ _ AGE — a length of film",
      "answer": "FOOT (footage)"
     },
     {
      "clue": "TH _ _ _ _ _ SS — unappreciative; ungrateful",
      "answer": "ANKLE (thankless)"
     },
     {
      "clue": "DE _ _ _ _ _ Y — items brought to someone",
      "answer": "LIVER (delivery)"
     }
    ]
   }
  ]
 },
 {
  "id": "uoe-q",
  "title": "Use of English Jeopardy · Game Q",
  "letter": "Q",
  "categories": [
   {
    "name": "It's a K-ick",
    "clues": [
     {
      "clue": "Six-foot-tall Australian marsupial.",
      "answer": "KANGAROO"
     },
     {
      "clue": "Menswear, Scottish style.",
      "answer": "KILT"
     },
     {
      "clue": "A musical toy that buzzes when you hum into it.",
      "answer": "KAZOO"
     },
     {
      "clue": "One seed of corn.",
      "answer": "KERNEL"
     },
     {
      "clue": "An oven for firing pottery.",
      "answer": "KILN"
     }
    ]
   },
   {
    "name": "What a Pair",
    "clues": [
     {
      "clue": "The staff of life … and a dairy spread.",
      "answer": "BREAD and BUTTER"
     },
     {
      "clue": "Steak or chicken … and Yukon golds.",
      "answer": "MEAT and POTATOES"
     },
     {
      "clue": "Ivory … and what comes out of the tap.",
      "answer": "SOAP and WATER"
     },
     {
      "clue": "Torso or carcass … and the spiritual part of a human.",
      "answer": "BODY and SOUL"
     },
     {
      "clue": "Lockable container for valuables … and any type of noise.",
      "answer": "SAFE and SOUND"
     }
    ]
   },
   {
    "name": "Kangaroo Words",
    "clues": [
     {
      "clue": "Stocking",
      "answer": "SOCK"
     },
     {
      "clue": "Alone",
      "answer": "ONE"
     },
     {
      "clue": "History",
      "answer": "STORY"
     },
     {
      "clue": "Masculine",
      "answer": "MALE"
     },
     {
      "clue": "Rampage",
      "answer": "RAGE"
     }
    ]
   },
   {
    "name": "Finish the Food Idiom",
    "clues": [
     {
      "clue": "Bring home the ___",
      "answer": "BACON"
     },
     {
      "clue": "Nutty as a ___",
      "answer": "FRUITCAKE"
     },
     {
      "clue": "Packed in like ___",
      "answer": "SARDINES"
     },
     {
      "clue": "Selling like ___",
      "answer": "HOTCAKES"
     },
     {
      "clue": "The best thing since ___",
      "answer": "SLICED BREAD"
     }
    ]
   },
   {
    "name": "What Do They Have in Common?",
    "clues": [
     {
      "clue": "An airplane, a tuxedo, a comet, and a horse",
      "answer": "They all have TAILS."
     },
     {
      "clue": "A pen, a newspaper, and a squid",
      "answer": "They all have INK."
     },
     {
      "clue": "A monarch, Miss America, and a broken tooth",
      "answer": "They all have CROWNS."
     },
     {
      "clue": "Corn, cane, beet, and maple",
      "answer": "They are all types of SUGAR."
     },
     {
      "clue": "Pike, ray, chub, and tang",
      "answer": "They are all FISH."
     }
    ]
   }
  ]
 },
 {
  "id": "uoe-r",
  "title": "Use of English Jeopardy · Game R",
  "letter": "R",
  "categories": [
   {
    "name": "Daily Double (D & D)",
    "clues": [
     {
      "clue": "Chicago-style pizza.",
      "answer": "DEEP DISH"
     },
     {
      "clue": "Nickname for the two-story red buses in London.",
      "answer": "DOUBLE DECKER"
     },
     {
      "clue": "A product for washing plates and cups.",
      "answer": "DISH DETERGENT"
     },
     {
      "clue": "A jump-rope game where two ropes are swung in opposite directions at once.",
      "answer": "DOUBLE DUTCH"
     },
     {
      "clue": "The period of extreme summer heat, usually late July and early August.",
      "answer": "DOG DAYS"
     }
    ]
   },
   {
    "name": "Backwords",
    "clues": [
     {
      "clue": "Forward they're cartographical charts; backward it's unwanted e-mail.",
      "answer": "MAPS / SPAM"
     },
     {
      "clue": "Forward it's the movement of the ocean; backward it means to correct written material.",
      "answer": "TIDE / EDIT"
     },
     {
      "clue": "Forward they're tasty seeds such as almonds or cashews; backward it means to astonish or shock.",
      "answer": "NUTS / STUN"
     },
     {
      "clue": "Forward it's the collective term for cakes, pies, and ice cream; backward it's how you feel under strain.",
      "answer": "DESSERTS / STRESSED"
     },
     {
      "clue": "Forward it means to bring a package to the right person; backward it means hated or despised.",
      "answer": "DELIVER / REVILED"
     }
    ]
   },
   {
    "name": "Red, White or Blue",
    "clues": [
     {
      "clue": "A common, noisy backyard North American bird.",
      "answer": "BLUE JAY"
     },
     {
      "clue": "What British soldiers were called in colonial America.",
      "answer": "REDCOATS"
     },
     {
      "clue": "Nickname for a late-night cross-country flight.",
      "answer": "REDEYE"
     },
     {
      "clue": "A deliberate concealment of someone's mistakes to make them look better.",
      "answer": "WHITEWASH"
     },
     {
      "clue": "It's a flower … and a hat worn by pioneer women.",
      "answer": "BLUEBONNET"
     }
    ]
   },
   {
    "name": "Rhyme Time",
    "clues": [
     {
      "clue": "A coquette or tease; and a garment for the upper body.",
      "answer": "FLIRT / SHIRT"
     },
     {
      "clue": "The skin and fur of an animal; and to liquefy a solid by heat.",
      "answer": "PELT / MELT"
     },
     {
      "clue": "A well-known 1960s dance; and the joint connecting hand and arm.",
      "answer": "TWIST / WRIST"
     },
     {
      "clue": "An involuntary tremble from cold or fright; and the Rhône or the Rhine.",
      "answer": "SHIVER / RIVER"
     },
     {
      "clue": "Office supplies for fastening paper; and a city in Italy or Florida.",
      "answer": "STAPLES / NAPLES"
     }
    ]
   },
   {
    "name": "Double Trouble",
    "clues": [
     {
      "clue": "Sick, work, land, room",
      "answer": "HOME"
     },
     {
      "clue": "Land, berg, box, breaker",
      "answer": "ICE"
     },
     {
      "clue": "Back, house, land, grocer",
      "answer": "GREEN"
     },
     {
      "clue": "Cushion, stripe, wheel, point",
      "answer": "PIN"
     },
     {
      "clue": "Study, wear, privileged",
      "answer": "UNDER"
     }
    ]
   }
  ]
 }
];
