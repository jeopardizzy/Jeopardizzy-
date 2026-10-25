/** Seasonal Specials — themed boards, free updates inside Full Club.
 *  Same all-ages rules as every other set (see tests/unit/contentRating.test.ts).
 *  Clues run easy → hard within each category. */
import type { BoardGame } from "./boardGames";

export const SEASONAL_BOARDS: BoardGame[] = [
  {
    id: "winter-1",
    title: "Winter Wordplay I",
    categories: [
      {
        name: "Snowy Sayings",
        clues: [
          { clue: "To break the ____: to ease the awkward silence when people first meet.", answer: "Ice" },
          { clue: "To leave someone out in the ____: to leave them out of the group.", answer: "Cold" },
          { clue: "To get cold ____: to lose your nerve just before a big moment.", answer: "Feet" },
          { clue: "The ____ of the iceberg: only a small, visible part of a much bigger problem.", answer: "Tip" },
          { clue: "To be snowed ____: to have far more work than you can handle.", answer: "Under" },
        ],
      },
      {
        name: "Winter Rhymes",
        clues: [
          { clue: "Rhyming pair: little rodents made of frozen water.", answer: "Ice Mice" },
          { clue: "Rhyming pair: a cold slope that is perfect for sledding.", answer: "Chill Hill" },
          { clue: "Rhyming pair: a farm animal with horns, wrapped up in a warm jacket.", answer: "Coat Goat" },
          { clue: "Rhyming pair: a young cat wearing winter gloves.", answer: "Mitten Kitten" },
          { clue: "Rhyming pair: the snow monster's favorite noodle dinner.", answer: "Yeti Spaghetti" },
        ],
      },
      {
        name: "Frosty Homophones",
        clues: [
          {
            clue: "Sounds the same: a winter illness, and what the geese did when they headed south.",
            answer: "Flu / Flew",
          },
          {
            clue: "Sounds the same: a snowy ride pulled by reindeer, and a word meaning to defeat a dragon.",
            answer: "Sleigh / Slay",
          },
          {
            clue: "Sounds the same: icy balls that fall in a storm, and a word meaning healthy, as in “___ and hearty”.",
            answer: "Hail / Hale",
          },
          {
            clue: "Sounds the same: someone riding a snowboard, and the line between two countries.",
            answer: "Boarder / Border",
          },
          {
            clue: "Sounds the same: to turn into ice, and a decorated band running along the top of a wall.",
            answer: "Freeze / Frieze",
            note: "A frieze is a long band of carving or painting, often seen on old buildings.",
          },
        ],
      },
      {
        name: "Snowy Compounds",
        clues: [
          { clue: "A white winter figure with a carrot nose.", answer: "Snowman" },
          { clue: "A frozen sphere you throw at your friends.", answer: "Snowball" },
          { clue: "The cozy spot in a room where logs crackle.", answer: "Fireplace" },
          { clue: "A winter sport where you ride down a hill on one wide board.", answer: "Snowboard" },
          {
            clue: "The harm cold can do to fingers and toes.",
            answer: "Frostbite",
            note: "Keep mittens and thick socks on when it's very cold!",
          },
        ],
      },
      {
        name: "Winter Animals",
        clues: [
          { clue: "This black-and-white bird can't fly, but it swims beautifully in icy southern seas.", answer: "Penguin" },
          { clue: "In winter, the Arctic fox's coat turns this color to match the snow.", answer: "White" },
          { clue: "This big white bear hunts seals on the Arctic sea ice.", answer: "Polar bear" },
          { clue: "Many animals do this, resting in a deep sleep-like state to get through the winter.", answer: "Hibernate" },
          { clue: "Seals and walruses keep warm under a thick layer of this fat.", answer: "Blubber" },
        ],
      },
    ],
  },
  {
    id: "winter-2",
    title: "Winter Wordplay II",
    categories: [
      {
        name: "Snowy Sayings II",
        clues: [
          { clue: "To skate on thin ____: to take a risky chance.", answer: "Ice" },
          { clue: "To pour cold ____ on an idea: to discourage it.", answer: "Water" },
          { clue: "To give someone the cold ____: to ignore them on purpose.", answer: "Shoulder" },
          { clue: "Frozen in ____: something that hasn't changed for many years.", answer: "Time" },
          { clue: "When a small problem grows bigger and bigger, we say it starts to ____.", answer: "Snowball" },
        ],
      },
      {
        name: "Winter Rhymes II",
        clues: [
          { clue: "Rhyming pair: tossing a handful of winter flakes.", answer: "Snow Throw" },
          { clue: "Rhyming pair: frozen cubes for rolling in a board game.", answer: "Ice Dice" },
          { clue: "Rhyming pair: a place to sleep that slides down hills.", answer: "Sled Bed" },
          { clue: "Rhyming pair: a birthday treat dusted with snow.", answer: "Flake Cake" },
          { clue: "Rhyming pair: a bird of peace wearing a mitten.", answer: "Glove Dove" },
        ],
      },
      {
        name: "Frosty Homophones II",
        clues: [
          {
            clue: "Sounds the same: a big furry animal that sleeps through winter, and a word meaning uncovered, like winter trees.",
            answer: "Bear / Bare",
          },
          {
            clue: "Sounds the same: the part of your face that turns red in the cold, and a word meaning “is aware”.",
            answer: "Nose / Knows",
          },
          {
            clue: "Sounds the same: what you put on the fire, and the word in “I ___ like some cocoa”.",
            answer: "Wood / Would",
          },
          {
            clue: "Sounds the same: feeling cold, and a spicy bean stew that warms you up.",
            answer: "Chilly / Chili",
          },
          {
            clue: "Sounds the same: snow, rain or sunshine, and a word meaning “if”.",
            answer: "Weather / Whether",
          },
        ],
      },
      {
        name: "Icy Compounds",
        clues: [
          { clue: "A huge chunk of ice floating in the sea.", answer: "Iceberg" },
          { clue: "Fluffy warmers that cover your ears.", answer: "Earmuffs" },
          { clue: "A deep heap of snow piled up by the wind.", answer: "Snowdrift" },
          { clue: "A single icy pellet that falls in a storm.", answer: "Hailstone" },
          { clue: "How much colder the wind makes the air feel.", answer: "Windchill" },
        ],
      },
      {
        name: "Winter Science",
        clues: [
          { clue: "A long, pointed spike of ice hanging from a roof.", answer: "Icicle" },
          { clue: "Feathery ice crystals that cover windows and grass on a cold morning.", answer: "Frost" },
          { clue: "Most snowflakes have this many sides or points.", answer: "Six" },
          {
            clue: "Water freezes at zero degrees on this temperature scale.",
            answer: "Celsius",
            note: "On the Fahrenheit scale, water freezes at 32 degrees.",
          },
          { clue: "The shortest day of the year is called the winter ____.", answer: "Solstice" },
        ],
      },
    ],
  },
  {
      id: "autumn-1",
      title: "Autumn Wordplay I",
      categories: [
        {
          name: "Autumn Sayings",
          clues: [
            {
              clue: "To turn over a new ____: to make a fresh start.",
              answer: "Leaf"
            },
            {
              clue: "The apple doesn't fall far from the ____: children are often a lot like their parents.",
              answer: "Tree"
            },
            {
              clue: "To be the apple of someone's ____: to be their favorite.",
              answer: "Eye"
            },
            {
              clue: "To compare apples and ____: to compare two very different things.",
              answer: "Oranges"
            },
            {
              clue: "You reap what you ____: your actions decide what happens to you later.",
              answer: "Sow",
              note: "To sow is to plant seeds; to reap is to gather the crop."
            }
          ]
        },
        {
          name: "Autumn Rhymes",
          clues: [
            {
              clue: "Rhyming pair: a dance party held in autumn.",
              answer: "Fall Ball"
            },
            {
              clue: "Rhyming pair: a juicy fruit picked for a big furry animal.",
              answer: "Bear Pear"
            },
            {
              clue: "Rhyming pair: someone who sneaks off with fallen leaves.",
              answer: "Leaf Thief"
            },
            {
              clue: "Rhyming pair: a midday meal of crispy apples.",
              answer: "Crunch Lunch"
            },
            {
              clue: "Rhyming pair: a bath towel for a bird that hoots at night.",
              answer: "Owl Towel"
            }
          ]
        },
        {
          name: "Harvest Homophones",
          clues: [
            {
              clue: "Sounds the same: a fruit picked in autumn, and a word for two of something.",
              answer: "Pear / Pair"
            },
            {
              clue: "Sounds the same: a small juicy fruit, and what a squirrel does with its nuts.",
              answer: "Berry / Bury"
            },
            {
              clue: "Sounds the same: a cooking herb, and what a clock measures.",
              answer: "Thyme / Time"
            },
            {
              clue: "Sounds the same: a long vegetable related to the onion, and water dripping through a hole.",
              answer: "Leek / Leak"
            },
            {
              clue: "Sounds the same: another word for corn, and a puzzle of winding paths.",
              answer: "Maize / Maze",
              note: "Some farms cut a giant maze into a field of maize every autumn."
            }
          ]
        },
        {
          name: "Farmyard Compounds",
          clues: [
            {
              clue: "A straw figure that keeps birds away from a field.",
              answer: "Scarecrow"
            },
            {
              clue: "A snack that pops in a hot pan.",
              answer: "Popcorn"
            },
            {
              clue: "A tall pile of dried grass in a field.",
              answer: "Haystack"
            },
            {
              clue: "A tall yellow flower with seeds that birds love.",
              answer: "Sunflower"
            },
            {
              clue: "A one-wheeled cart a gardener pushes.",
              answer: "Wheelbarrow"
            }
          ]
        },
        {
          name: "Autumn Nature",
          clues: [
            {
              clue: "This big orange squash is carved into lanterns in October.",
              answer: "Pumpkin"
            },
            {
              clue: "Squirrels bury these little nuts from oak trees.",
              answer: "Acorn"
            },
            {
              clue: "Many birds fly south for the winter; this long seasonal journey is called ____.",
              answer: "Migration"
            },
            {
              clue: "Trees that lose all their leaves every autumn are called this.",
              answer: "Deciduous"
            },
            {
              clue: "This green substance in leaves fades in autumn, letting the reds and yellows show.",
              answer: "Chlorophyll"
            }
          ]
        }
      ]
    },
    {
      id: "autumn-2",
      title: "Autumn Wordplay II",
      categories: [
        {
          name: "Autumn Sayings II",
          clues: [
            {
              clue: "Easy as ____: very simple (and a tasty autumn dessert).",
              answer: "Pie"
            },
            {
              clue: "One bad ____ spoils the bunch: one troublemaker can affect a whole group.",
              answer: "Apple"
            },
            {
              clue: "In a ____: summed up in just a few words.",
              answer: "Nutshell"
            },
            {
              clue: "Full of ____: bursting with energy.",
              answer: "Beans"
            },
            {
              clue: "To go against the ____: to do the opposite of what most people do.",
              answer: "Grain"
            }
          ]
        },
        {
          name: "Autumn Rhymes II",
          clues: [
            {
              clue: "Rhyming pair: a tiny house where a squirrel stores its acorns.",
              answer: "Nut Hut"
            },
            {
              clue: "Rhyming pair: a performance put on by big black birds.",
              answer: "Crow Show"
            },
            {
              clue: "Rhyming pair: a trumpet made from an ear of maize.",
              answer: "Corn Horn"
            },
            {
              clue: "Rhyming pair: a friend who loves jumping in puddles.",
              answer: "Muddy Buddy"
            },
            {
              clue: "Rhyming pair: a hang-glider flown by an eight-legged web-spinner.",
              answer: "Spider Glider"
            }
          ]
        },
        {
          name: "Harvest Homophones II",
          clues: [
            {
              clue: "Sounds the same: the powder you bake pumpkin bread with, and a blossom.",
              answer: "Flour / Flower"
            },
            {
              clue: "Sounds the same: to press and fold bread dough, and a word meaning “to require”.",
              answer: "Knead / Need"
            },
            {
              clue: "Sounds the same: the part of a plant under the ground, and the way you travel somewhere.",
              answer: "Root / Route",
              note: "In some places “route” rhymes with “out”; in others it sounds just like “root”."
            },
            {
              clue: "Sounds the same: the word in “the pumpkins have ___ so big”, and a sound of complaint.",
              answer: "Grown / Groan"
            },
            {
              clue: "Sounds the same: a single grain of corn, and an army officer.",
              answer: "Kernel / Colonel"
            }
          ]
        },
        {
          name: "Harvest Compounds",
          clues: [
            {
              clue: "A waterproof jacket.",
              answer: "Raincoat"
            },
            {
              clue: "The woody seed holder that falls from a pine tree.",
              answer: "Pinecone"
            },
            {
              clue: "A golden bread made from maize.",
              answer: "Cornbread"
            },
            {
              clue: "The open area around farm buildings where animals roam.",
              answer: "Barnyard"
            },
            {
              clue: "A building whose sails turn to grind grain.",
              answer: "Windmill"
            }
          ]
        },
        {
          name: "Harvest Science",
          clues: [
            {
              clue: "Gathering ripe crops from the fields is called this.",
              answer: "Harvest"
            },
            {
              clue: "Tiny drops of water that cover the grass on cool autumn mornings.",
              answer: "Dew"
            },
            {
              clue: "Bears eat lots in autumn to build up this, which keeps them going through winter.",
              answer: "Fat"
            },
            {
              clue: "The autumn day when daytime and nighttime are about the same length is the autumn ____.",
              answer: "Equinox"
            },
            {
              clue: "The process plants use to make food from sunlight.",
              answer: "Photosynthesis"
            }
          ]
        }
      ]
    }
  
];
