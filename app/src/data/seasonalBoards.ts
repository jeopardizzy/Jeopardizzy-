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
          { clue: "Add a word to SNOW: a white winter figure with a carrot nose.", answer: "Snowman" },
          { clue: "Add a word to SNOW: a frozen sphere you throw at your friends.", answer: "Snowball" },
          { clue: "Add a word to FIRE: the cozy spot in a room where logs crackle.", answer: "Fireplace" },
          { clue: "Add a word to SNOW: a winter sport where you ride down a hill on one wide board.", answer: "Snowboard" },
          {
            clue: "Add a word to FROST: the harm cold can do to fingers and toes.",
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
          { clue: "Add a word to ICE: a huge chunk of ice floating in the sea.", answer: "Iceberg" },
          { clue: "Add a word to EAR: fluffy warmers that cover your ears.", answer: "Earmuffs" },
          { clue: "Add a word to SNOW: a deep heap of snow piled up by the wind.", answer: "Snowdrift" },
          { clue: "Add a word to HAIL: a single icy pellet that falls in a storm.", answer: "Hailstone" },
          { clue: "Add a word to WIND: how much colder the wind makes the air feel.", answer: "Windchill" },
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
];
