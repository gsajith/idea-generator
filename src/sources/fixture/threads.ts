import type { FixtureThread } from "./fixture-source";

// Fake consumer threads the pipeline runs on before real sources exist. Expected output by case:
// 1. Repeated needs that should clear the idea bar (3+ signals, 3+ authors, several threads):
//    - Forgetting when home maintenance was last done: t01, t01-c1, t01-c1-r1, t01-c2, t07-c2,
//      t07-c2-r1, t23-c1, t23-c2, t23-c2-r1
//    - Not knowing if the pet was already fed or given meds: t02, t02-c1, t02-c1-r1, t02-c2,
//      t13, t13-c1-r1, t24, t24-c2
//    - Scheduling a recurring hangout with a friend group: t03, t03-c1, t03-c2, t03-c2-r1,
//      t09-c2, t09-c2-r1, t20, t20-c1, t20-c3
//    - Food going bad before it gets cooked: t04, t04-c1, t04-c1-r1, t16, t16-c1, t16-c2, t26,
//      t26-c1
// 2. Noise the filter should drop. Whole threads: t06, t10, t12, t17, t22, t27, t30. Comments:
//    t01-c3, t01-c4, t02-c3, t02-c3-r1, t03-c3, t03-c3-r1, t05-c3, t07-c3 (self-promo), t11-c3,
//    t09-c3, t13-c2, t14-c4-r1, t15-c1, t16-c2-r1, t20-c1-r1, t23-c3, t26-c2-r1, t29-c3
// 3. Need only in comments (school messages scattered across apps, email and paper): t05-c2,
//    t05-c2-r1, t05-c2-r2, t21-c1, t29-c1 (posts t05, t21, t29 are about other things)
// 4. Undercuts for the food waste idea: competitor t04-c1-r2 (Pantrio), price objection t04-c2
//    (t04-c1-r2-r1 pushes back on the competitor)
// 5. One-author need, stays emerging (tracking what clothes get worn): quietkettle in t08-c2,
//    t14-c2, t19-c3
// 6. Near-duplicate that should merge into one need (losing track of lent items): t11-c1
//    (books) and t15-c2 (drill)
// Replies that need their parent to make sense: t01-c1-r1, t04-c1-r1, t07-c2-r1, t09-c2-r1,
// t20-c3, t23-c2-r1, t03-c2-r1
// Other needs confined to one thread, fine either way: home shop orders from many channels
// (t18, t18-c1, t18-c2), proving who did their chores (t28, t28-c2), school supply costs (t29).
export const fixtureThreads: FixtureThread[] = [
  {
    title: "Just realized I have no idea when I last changed my furnace filter",
    post: {
      id: "t01",
      author: "drywall_dan",
      hoursAgo: 412,
      text: "Went to change it tonight and the one in there is gray. Not light gray. Like charcoal. I genuinely cannot remember if I changed it last fall or the fall before. We've been in the house 3 years and I think I've done it twice?\n\nHow do you all keep track of this stuff. Filter, smoke detector batteries, gutters, all of it. I know I'm supposed to but nothing reminds me until something breaks.",
      replies: [
        {
          id: "t01-c1",
          author: "maple_and_mortar",
          hoursAgo: 409,
          text: "Same with the dryer vent and the water heater flush. Every list online says 'annually' but annually since WHEN. I bought the house in 2021 and the previous owner left zero notes so I'm guessing on everything.",
          replies: [
            {
              id: "t01-c1-r1",
              author: "kettlebell_karen",
              hoursAgo: 401,
              text: "same, I'd pay for something that just tells me 'you last did this 14 months ago'",
            },
          ],
        },
        {
          id: "t01-c2",
          author: "Brisket_Theory",
          hoursAgo: 405,
          text: "I write the date on the filter frame with a sharpie when I put it in. Works great for the filter. Doesnt help for anything that isnt a physical thing you can write on lol, I have no clue when the gutters got cleaned",
        },
        {
          id: "t01-c3",
          author: "throwaway_renter_88",
          hoursAgo: 398,
          text: "lol my landlord's filter is probably from 2009",
        },
        {
          id: "t01-c4",
          author: "softpretzel44",
          hoursAgo: 360,
          text: "thanks for the reminder, going to go check mine",
        },
      ],
    },
  },
  {
    title: "Dog got breakfast twice this morning because nobody told anybody",
    post: {
      id: "t02",
      author: "ruthless_corgi_mom",
      hoursAgo: 530,
      text: "My husband fed her at 6:30 before the gym. My son fed her at 7:15 because she was sitting by the bowl looking tragic. I almost fed her a third time at 8. She is a 22 lb corgi and the vet already gave us The Talk about her weight.\n\nThere are four of us in the house and nobody knows if the dog has been fed. Every single day.",
      replies: [
        {
          id: "t02-c1",
          author: "lentil_soup_szn",
          hoursAgo: 527,
          text: "We have a magnet on the fridge that says FED on one side and HUNGRY on the other. You flip it when you feed him. It mostly works.",
          replies: [
            {
              id: "t02-c1-r1",
              author: "ruthless_corgi_mom",
              hoursAgo: 520,
              text: "We tried that! It only works if everyone remembers to flip it, and my teenager does not remember things",
            },
          ],
        },
        {
          id: "t02-c2",
          author: "two_cats_no_plan",
          hoursAgo: 515,
          text: "Ours is worse because it's meds. My cat is on thyroid pills twice a day and my partner and I have both double dosed her by accident. Now we text each other 'PILL DONE' every time but half the time one of us is asleep or in a meeting and doesn't see it.",
        },
        {
          id: "t02-c3",
          author: "bigfluffyjoe",
          hoursAgo: 512,
          text: "your dog is playing you. mine does the exact same sad face routine",
          replies: [
            {
              id: "t02-c3-r1",
              author: "ruthless_corgi_mom",
              hoursAgo: 508,
              text: "haha 100%, she knows exactly what she's doing",
            },
          ],
        },
      ],
    },
  },
  {
    title: "How do you keep a game night going without the group chat dying?",
    post: {
      id: "t03",
      author: "meeple_marauder",
      hoursAgo: 288,
      text: "We used to play every other Friday. Then two people had kids and one started working weekends and now it's every two months if we're lucky. Every time I try to set a date it turns into 40 messages of 'I could do the 14th but not the 15th unless it's after 8' and then someone just stops replying and it dies.\n\nI want to keep this group together but I'm so tired of being the one herding everyone.",
      replies: [
        {
          id: "t03-c1",
          author: "dicegoblin_",
          hoursAgo: 284,
          text: "This is exactly why our group fell apart. Nobody wanted to be the scheduler. I was it for a year and I burned out.",
        },
        {
          id: "t03-c2",
          author: "oatmilk_overlord",
          hoursAgo: 279,
          text: "We do a poll in the chat with 4 date options. Problem is half the group never votes so you end up picking a date and then two people go 'oh I can't do that one'",
          replies: [
            {
              id: "t03-c2-r1",
              author: "wren_in_the_rain",
              hoursAgo: 270,
              text: "this. the polls get ignored every time. and then they complain they weren't consulted",
            },
          ],
        },
        {
          id: "t03-c3",
          author: "cardboard_crusader",
          hoursAgo: 266,
          text: "what games do you play?",
          replies: [
            {
              id: "t03-c3-r1",
              author: "meeple_marauder",
              hoursAgo: 260,
              text: "mostly wingspan and cascadia lately, sometimes a big one if we get a full table",
            },
          ],
        },
      ],
    },
  },
  {
    title: "Threw out another bag of spinach. Every. Single. Week.",
    post: {
      id: "t04",
      author: "frugal_fern",
      hoursAgo: 196,
      text: "I buy it with the best intentions and on day 6 it's slime. Same with the half a red onion, the yogurt, the leftover rice. I did the math and we probably throw out $30 to $40 of food a week. The problem isn't buying it, it's that I forget what's in there until it's too late.",
      replies: [
        {
          id: "t04-c1",
          author: "sheetpan_sally",
          hoursAgo: 193,
          text: "What I want is something where I open it at 5pm and it says 'you have spinach, eggs and half an onion that are about to die, here's a frittata'. I don't need recipe inspiration, I need to use up what I have.",
          replies: [
            {
              id: "t04-c1-r1",
              author: "midnight_snaccer",
              hoursAgo: 189,
              text: "same, I'd pay for this",
            },
            {
              id: "t04-c1-r2",
              author: "spreadsheet_steph",
              hoursAgo: 185,
              text: "Pantrio already does this. You scan your grocery receipt and it tracks what you bought and pings you before stuff expires, plus suggests recipes from what's left.",
              replies: [
                {
                  id: "t04-c1-r2-r1",
                  author: "sheetpan_sally",
                  hoursAgo: 180,
                  text: "I tried it, the receipt scan missed half my stuff and it has no idea when I used something up. After two weeks it thought I had 9 cartons of milk",
                },
              ],
            },
          ],
        },
        {
          id: "t04-c2",
          author: "costco_cowboy",
          hoursAgo: 176,
          text: "Honestly I'd never pay for an app for this. Dry erase board on the fridge door, write down whatever's open, wipe it off when it's gone. Free and nobody has to scan anything.",
        },
        {
          id: "t04-c3",
          author: "plantmilk_pete",
          hoursAgo: 150,
          text: "Freeze the spinach the day you buy it. It's fine for smoothies and soups.",
        },
      ],
    },
  },
  {
    title: "Lunchbox ideas for a picky 7 year old?",
    post: {
      id: "t05",
      author: "bento_beginner",
      hoursAgo: 340,
      text: "He eats: plain pasta, apples (only red), cheese sticks, crackers. That's the list. He's starting full days and I'm out of ideas. What do your picky kids actually eat?",
      replies: [
        {
          id: "t05-c1",
          author: "crumbsinthecarseat",
          hoursAgo: 336,
          text: "Pinwheels! Tortilla, cream cheese, roll it up, slice. Mine thinks they're fancy. Also mini muffins.",
        },
        {
          id: "t05-c2",
          author: "tired_mom_of_three",
          hoursAgo: 331,
          text: "Not lunch related but honestly the bigger stress for me this year is all the school stuff. Permission slips come home crumpled in the backpack, the teacher uses one app, the PTA sends emails, the school posts on its facebook page, and the district texts. I missed picture day because it was only announced in the PTA newsletter. Food is the easy part lol",
          replies: [
            {
              id: "t05-c2-r1",
              author: "packed_lunch_dad",
              hoursAgo: 325,
              text: "Oh god yes. Three apps and a paper folder and I still missed the deadline for field trip money. My kid was the only one who had to stay back and I felt awful.",
            },
            {
              id: "t05-c2-r2",
              author: "glitterglue_mama",
              hoursAgo: 318,
              text: "I screenshot everything into one photo album called SCHOOL and go through it every Sunday night. It's a mess but it's one mess instead of five",
            },
          ],
        },
        {
          id: "t05-c3",
          author: "bento_beginner",
          hoursAgo: 300,
          text: "thank you all, trying the pinwheels tomorrow!",
        },
      ],
    },
  },
  {
    title: "When the recipe says 'prep time: 10 minutes'",
    post: {
      id: "t06",
      author: "onion_tears_420",
      hoursAgo: 102,
      text: "me 45 minutes later still mincing garlic like it owes me money",
      replies: [
        {
          id: "t06-c1",
          author: "saucy_santiago",
          hoursAgo: 99,
          text: "lmao the onions alone",
        },
        {
          id: "t06-c2",
          author: "whiskwhisperer",
          hoursAgo: 95,
          text: "prep time assumes you have a sous chef and everything is already washed and chopped",
        },
        {
          id: "t06-c3",
          author: "garlic_maximalist",
          hoursAgo: 90,
          text: "measure garlic with your heart",
        },
      ],
    },
  },
  {
    title: "First year homeowner, what maintenance am I forgetting?",
    post: {
      id: "t07",
      author: "new_keys_nervous",
      hoursAgo: 245,
      text: "Closed in March. So far I've mowed the lawn and that's it. What should I be doing seasonally that nobody tells you about?",
      replies: [
        {
          id: "t07-c1",
          author: "oldhouse_oliver",
          hoursAgo: 242,
          text: "Off the top of my head: furnace filter every 3 months, test smoke and CO detectors, clean gutters spring and fall, flush the water heater yearly, clean the dryer vent, check the caulk around tubs, blow out sprinklers before freeze if you have them.",
        },
        {
          id: "t07-c2",
          author: "lazy_sunday_lou",
          hoursAgo: 238,
          text: "The list is the easy part honestly, you can google a list. The hard part is remembering when you last did each thing. I made a spreadsheet my first year, kept it up for about two months, then forgot it existed. Found it last week, last entry was 2022.",
          replies: [
            {
              id: "t07-c2-r1",
              author: "porch_light_paul",
              hoursAgo: 230,
              text: "if someone made this with a big 'did it today' button and nothing else I'm in",
            },
          ],
        },
        {
          id: "t07-c3",
          author: "HomeReadyHannah",
          hoursAgo: 228,
          text: "I made a printable home maintenance checklist for exactly this! 52 tasks organized by season. Link in my profile, it's 20% off this week with code FIRSTHOME.",
        },
      ],
    },
  },
  {
    title: "Capsule wardrobe one year in, my honest thoughts",
    post: {
      id: "t08",
      author: "linen_and_lists",
      hoursAgo: 470,
      text: "Started last October with 33 pieces. I've added 4 and donated 6. I spend way less time getting dressed and I haven't impulse bought anything since spring. The downside is I'm a little bored of my own clothes by the end of each season. Happy to answer questions.",
      replies: [
        {
          id: "t08-c1",
          author: "thrift_flip_theo",
          hoursAgo: 466,
          text: "How did you decide on 33? I always see that number and it feels random",
        },
        {
          id: "t08-c2",
          author: "quietkettle",
          hoursAgo: 461,
          text: "Did you track what you actually wore? I really want to know cost per wear on my stuff, like is the $180 coat I wear every day actually cheaper than the $25 top I wore once. But I'd have to log every outfit and I never keep it up past a week.",
        },
        {
          id: "t08-c3",
          author: "linen_and_lists",
          hoursAgo: 455,
          text: "33 is from a blog I read, honestly it's random. And no I didn't track, I just noticed what I kept reaching for.",
        },
      ],
    },
  },
  {
    title: "How do you stay motivated to run in the dark months?",
    post: {
      id: "t09",
      author: "five_k_fiona",
      hoursAgo: 150,
      text: "Sun sets at like 5 now and I lose all motivation. In summer I was doing 4 runs a week, now I'm lucky to get 1. Tips?",
      replies: [
        {
          id: "t09-c1",
          author: "headlamp_hank",
          hoursAgo: 147,
          text: "A good headlamp and a reflective vest changed everything for me. Also sign up for a spring race so you have a reason.",
        },
        {
          id: "t09-c2",
          author: "negative_splits",
          hoursAgo: 141,
          text: "Group runs are the only thing that gets me out the door. But organizing them is half the battle. Every week someone asks 'are we on for thursday?' and it turns into 30 messages about who can do 6 vs 6:30 and whether we do the river loop. I just want everyone to say yes or no and be done.",
          replies: [
            {
              id: "t09-c2-r1",
              author: "trail_mix_tina",
              hoursAgo: 133,
              text: "lol our walking group is the same, we spend more time planning the walk than walking",
            },
          ],
        },
        {
          id: "t09-c3",
          author: "five_k_fiona",
          hoursAgo: 120,
          text: "Ordered a headlamp, thanks!",
        },
      ],
    },
  },
  {
    title: "City announces bulk trash pickup moves to first Monday of each month starting November",
    post: {
      id: "t10",
      author: "localnews_bot_watcher",
      hoursAgo: 60,
      text: "From the public works update: bulk item pickup (furniture, appliances without freon, mattresses in bags) will move from the third Wednesday to the first Monday starting Nov 3. Schedule a pickup online at least 48 hours ahead.",
      replies: [
        {
          id: "t10-c1",
          author: "northside_neighbor",
          hoursAgo: 57,
          text: "does this include the north side or just downtown?",
        },
        {
          id: "t10-c2",
          author: "civic_minded_cam",
          hoursAgo: 52,
          text: "whole city per the PDF",
        },
      ],
    },
  },
  {
    title: "What book did you lend to a friend and never get back?",
    post: {
      id: "t11",
      author: "dogeared_daphne",
      hoursAgo: 380,
      text: "Mine is a signed copy of a poetry collection I lent to a coworker in 2019. She moved to Denver. I think about it every week.",
      replies: [
        {
          id: "t11-c1",
          author: "marginalia_max",
          hoursAgo: 376,
          text: "The problem for me is I lend books constantly and then I can never remember who has what. Right now my copy of Piranesi is missing and I have three suspects and zero evidence. I end up rebuying books I already own because I can't figure out who to ask.",
        },
        {
          id: "t11-c2",
          author: "spine_cracker",
          hoursAgo: 370,
          text: "My entire Discworld collection. A whole ex took it.",
        },
        {
          id: "t11-c3",
          author: "booksmellenjoyer",
          hoursAgo: 365,
          text: "this is why I only lend paperbacks I'm ok never seeing again",
        },
      ],
    },
  },
  {
    title: "I built a habit tracker that's 100% free, would love feedback!",
    post: {
      id: "t12",
      author: "streakly_dev",
      hoursAgo: 90,
      text: "Hey all! After 8 months of nights and weekends I finally launched Streakly. Track unlimited habits, cute streak animations, dark mode, no ads. It's free on iOS right now, Android coming soon. Would mean a lot if you gave it a try and left a review!",
      replies: [
        {
          id: "t12-c1",
          author: "pixel_pancake",
          hoursAgo: 86,
          text: "is it on android yet?",
        },
        {
          id: "t12-c2",
          author: "mod_squad_member",
          hoursAgo: 80,
          text: "Reminder that self promotion is limited to the weekly thread.",
        },
      ],
    },
  },
  {
    title: "Senior dog on 4 different meds, how do you keep track?",
    post: {
      id: "t13",
      author: "graymuzzle_gus",
      hoursAgo: 222,
      text: "Our 14 year old lab is on joint meds, heart meds, a thyroid pill and something for his stomach. Different times of day, some with food some without. My partner works nights and I work days, and at least twice a week one of us texts the other at 2am 'did you give him the heart pill??' and doesn't get an answer until morning. We've definitely missed doses and I'm scared we've doubled some.",
      replies: [
        {
          id: "t13-c1",
          author: "vet_tech_violet",
          hoursAgo: 219,
          text: "Weekly pill organizer with AM and PM compartments, same as people use. If the compartment is empty, it's been given.",
          replies: [
            {
              id: "t13-c1-r1",
              author: "graymuzzle_gus",
              hoursAgo: 214,
              text: "We do that for the twice daily ones but the stomach med is 'as needed' and the joint one is every other day, so the organizer doesn't help. You still can't tell whether the other person already did it.",
            },
          ],
        },
        {
          id: "t13-c2",
          author: "goodboy_gallery",
          hoursAgo: 210,
          text: "sending love to your old man, give him a scratch from me",
        },
        {
          id: "t13-c3",
          author: "pawsandreflect",
          hoursAgo: 200,
          text: "Ask your vet if any of them can be combined or switched to a longer acting version. Ours got us down from 3 to 2.",
        },
      ],
    },
  },
  {
    title: "What's the most useful spreadsheet you keep?",
    post: {
      id: "t14",
      author: "pivot_table_pam",
      hoursAgo: 310,
      text: "Mine tracks every car repair with mileage and cost. Saved me when I sold the car, the buyer loved it. What's yours?",
      replies: [
        {
          id: "t14-c1",
          author: "budget_bonnie",
          hoursAgo: 306,
          text: "Monthly budget with a tab per year going back to 2016. Boring but it's how I know we spend 3x more on takeout than we did before kids.",
        },
        {
          id: "t14-c2",
          author: "quietkettle",
          hoursAgo: 301,
          text: "I tried a wardrobe sheet where I logged what I wore every day so I could see cost per wear and which stuff never gets touched. Lasted 9 days. Typing 'gray sweater, black jeans' every morning is not sustainable. I still want the data though.",
        },
        {
          id: "t14-c3",
          author: "plant_parent_priya",
          hoursAgo: 297,
          text: "Every houseplant I own, where I got it, and when it was last repotted. 41 rows.",
        },
        {
          id: "t14-c4",
          author: "giftlist_gwen",
          hoursAgo: 290,
          text: "Gift ideas for everyone in the family. Whenever someone mentions wanting something in July I add it, so in December I'm not panicking.",
          replies: [
            {
              id: "t14-c4-r1",
              author: "pivot_table_pam",
              hoursAgo: 284,
              text: "this is genius, stealing it",
            },
          ],
        },
      ],
    },
  },
  {
    title: "Finally fixed my squeaky stairs, here's how",
    post: {
      id: "t15",
      author: "stud_finder_steve",
      hoursAgo: 175,
      text: "Took about an hour. Found the squeaky tread, drilled a pilot hole at an angle into the stringer, drove a trim head screw in, filled the hole with wood filler. Did it from above since I don't have access underneath. Zero squeaks now.",
      replies: [
        {
          id: "t15-c1",
          author: "creaky_floor_club",
          hoursAgo: 171,
          text: "thanks, doing this weekend",
        },
        {
          id: "t15-c2",
          author: "shopvac_sophie",
          hoursAgo: 166,
          text: "Would have done mine months ago but my drill has been gone since April. I'm pretty sure one of the neighbors borrowed it but I couldn't tell you which one. Same thing happened with my ladder last year. I'm too awkward to knock on every door asking.",
          replies: [
            {
              id: "t15-c2-r1",
              author: "pegboard_pat",
              hoursAgo: 160,
              text: "Label your tools with your name and number. Changed my life, stuff actually comes back now",
            },
          ],
        },
        {
          id: "t15-c3",
          author: "joist_jessie",
          hoursAgo: 158,
          text: "what length screws did you use?",
          replies: [
            {
              id: "t15-c3-r1",
              author: "stud_finder_steve",
              hoursAgo: 154,
              text: "2.5 inch trim head",
            },
          ],
        },
      ],
    },
  },
  {
    title: "Meal planning every Sunday is burning me out",
    post: {
      id: "t16",
      author: "sunday_scaries_chef",
      hoursAgo: 128,
      text: "I spend 2 hours Sunday planning and shopping. By Wednesday something comes up, we get takeout, and by the weekend the zucchini is soft and the chicken is past its date. Then I feel guilty and the next Sunday I plan again like it'll be different. The plan isn't the problem, it's that it never adjusts when life happens.",
      replies: [
        {
          id: "t16-c1",
          author: "crockpot_carl",
          hoursAgo: 124,
          text: "I keep a note on my phone of what's in the fridge and when I bought it, but I never update it after I cook so it's useless by day 3.",
        },
        {
          id: "t16-c2",
          author: "leftover_lena",
          hoursAgo: 119,
          text: "We do 'use it up wednesday' where dinner has to be built from whatever is closest to dying. Helps a lot but it's still a guessing game what's actually in there until I dig through every drawer.",
          replies: [
            {
              id: "t16-c2-r1",
              author: "mealprep_mo",
              hoursAgo: 110,
              text: "stealing this name",
            },
          ],
        },
      ],
    },
  },
  {
    title: "What's everyone doing this weekend?",
    post: {
      id: "t17",
      author: "chillweekend_chad",
      hoursAgo: 30,
      text: "Supposed to be 70 and sunny here. Thinking about finally taking the kayak out.",
      replies: [
        {
          id: "t17-c1",
          author: "couchpotato_cleo",
          hoursAgo: 28,
          text: "absolutely nothing and I'm thrilled about it",
        },
        {
          id: "t17-c2",
          author: "pumpkin_patch_pat",
          hoursAgo: 25,
          text: "pumpkin patch with the kids, then carving",
        },
        {
          id: "t17-c3",
          author: "chillweekend_chad",
          hoursAgo: 22,
          text: "love it, post pics of the pumpkins",
        },
      ],
    },
  },
  {
    title: "Home bakery owners: how do you handle orders coming in from everywhere?",
    post: {
      id: "t18",
      author: "crumb_and_co_bakes",
      hoursAgo: 260,
      text: "I sell cookies and custom cakes out of my home kitchen. Orders come in through Instagram DMs, texts, my website form, and people literally stopping me at school pickup. Last month I forgot a birthday cake order because it was buried in my DMs. I wanted to cry. I can't afford real order software for maybe 15 orders a week.",
      replies: [
        {
          id: "t18-c1",
          author: "wick_and_whimsy",
          hoursAgo: 255,
          text: "Same with my candle shop. Custom orders come from 4 places and I copy them all into a paper notebook at night. If I skip a night I lose one.",
        },
        {
          id: "t18-c2",
          author: "sourdough_sam_sells",
          hoursAgo: 250,
          text: "I made a google form and reply to every DM with the link. Some people fill it out, a lot just keep DMing.",
        },
      ],
    },
  },
  {
    title: "Packing for a week away: what do you always overpack?",
    post: {
      id: "t19",
      author: "carryon_only_cora",
      hoursAgo: 205,
      text: "Trying to do a week in one carry on for the first time. What do you always bring and never use?",
      replies: [
        {
          id: "t19-c1",
          author: "wanderlust_wes",
          hoursAgo: 202,
          text: "Shoes. I bring 3 pairs and wear one.",
        },
        {
          id: "t19-c2",
          author: "hotel_soap_hoarder",
          hoursAgo: 198,
          text: "Books. I bring 3 and read half of one on the plane.",
        },
        {
          id: "t19-c3",
          author: "quietkettle",
          hoursAgo: 194,
          text: "Clothes, because I have no idea what I actually wear. I suspect I wear the same 3 shirts on every trip and at home but I've never been able to prove it. If I had a record of what I wore I'd pack half as much and probably buy less too.",
        },
      ],
    },
  },
  {
    title: "Our D&D group has played twice this year",
    post: {
      id: "t20",
      author: "dm_with_a_daycare",
      hoursAgo: 145,
      text: "Five adults, three of us with kids under 5, one nurse on rotating shifts. We all want to play. We've played twice in 2026. Every attempt at scheduling is a week of back and forth in the chat that ends in 'ok let's try next month'. The campaign is great when it happens. It just doesn't happen.",
      replies: [
        {
          id: "t20-c1",
          author: "nat20_nadia",
          hoursAgo: 141,
          text: "Scheduling is the real final boss of D&D. Our group lost a whole campaign to it.",
          replies: [
            {
              id: "t20-c1-r1",
              author: "rules_lawyer_ray",
              hoursAgo: 136,
              text: "lmao truly",
            },
          ],
        },
        {
          id: "t20-c2",
          author: "bardic_inspo",
          hoursAgo: 132,
          text: "We picked a fixed night, 2nd Tuesday, and play with whoever shows up. Quorum is 3. It's the only thing that worked.",
        },
        {
          id: "t20-c3",
          author: "tabletop_tom",
          hoursAgo: 125,
          text: "same. honestly I'd pay a few bucks for something that just looks at everyone's availability and tells us the date",
        },
      ],
    },
  },
  {
    title: "Kids' soccer season: how do you manage carpools?",
    post: {
      id: "t21",
      author: "minivan_maddie",
      hoursAgo: 270,
      text: "Three families, two practices a week plus Saturday games. We have a shared calendar but someone always forgets their day. Any systems that actually work?",
      replies: [
        {
          id: "t21-c1",
          author: "snackduty_simon",
          hoursAgo: 266,
          text: "Carpool is easy compared to school. Our school has four channels: the class app, emails from the office, the PTA newsletter, and a paper flyer in the backpack that my kid uses as a napkin. Every week I find out about something the day of. Spirit week, early dismissal, you name it.",
        },
        {
          id: "t21-c2",
          author: "orange_slices_olga",
          hoursAgo: 262,
          text: "We assign days of the week instead of rotating, so it's always Tuesday = me. Much easier to remember.",
        },
      ],
    },
  },
  {
    title: "Unpopular opinion: fitted sheets cannot be folded and anyone who says otherwise is lying",
    post: {
      id: "t22",
      author: "laundry_mountain",
      hoursAgo: 78,
      text: "I've watched the videos. I've done the corner tuck thing. It's a ball. It will always be a ball. Fight me.",
      replies: [
        {
          id: "t22-c1",
          author: "marie_kondont",
          hoursAgo: 75,
          text: "I just stuff it inside one of the pillowcases and call it organized",
        },
        {
          id: "t22-c2",
          author: "crease_police",
          hoursAgo: 71,
          text: "my grandma could fold them into perfect squares and she took the secret to her grave",
        },
      ],
    },
  },
  {
    title: "PSA: clean your dryer vent. Ours nearly caught fire last night",
    post: {
      id: "t23",
      author: "lint_trap_lisa",
      hoursAgo: 96,
      text: "Burning smell, dryer shut itself off. Pulled the vent hose and it was packed solid with lint. Firefighter neighbor said this is one of the most common house fires. Please go check yours.",
      replies: [
        {
          id: "t23-c1",
          author: "sawdust_and_sarcasm",
          hoursAgo: 92,
          text: "When are we supposed to do this?? I've lived here 6 years and I don't think I've ever done it. There are like 30 of these 'once a year' things and I don't know when I did any of them.",
        },
        {
          id: "t23-c2",
          author: "calendar_graveyard",
          hoursAgo: 88,
          text: "I put recurring calendar events for all this stuff but they just become noise I swipe away. Then when I finally do the task I can't tell when the last time was, because the calendar only shows when I was supposed to do it.",
          replies: [
            {
              id: "t23-c2-r1",
              author: "hvac_hopeful",
              hoursAgo: 81,
              text: "same, my calendar is a graveyard of 'replace fridge water filter' reminders I dismissed",
            },
          ],
        },
        {
          id: "t23-c3",
          author: "wholesome_wanda",
          hoursAgo: 85,
          text: "so glad you're all ok!!",
        },
      ],
    },
  },
  {
    title: "Roommate and I share a cat and we text 'did you feed Miso?' ten times a day",
    post: {
      id: "t24",
      author: "miso_soup_and_miso_cat",
      hoursAgo: 58,
      text: "We split the cat 50/50 since we adopted her together. Neither of us has a schedule so there's no 'mornings are mine' rule. Miso has learned that if she yells at whoever walks in, she sometimes gets a second dinner. She's getting chunky.",
      replies: [
        {
          id: "t24-c1",
          author: "tabby_tactician",
          hoursAgo: 55,
          text: "Get an automatic feeder, then nobody has to remember",
          replies: [
            {
              id: "t24-c1-r1",
              author: "miso_soup_and_miso_cat",
              hoursAgo: 50,
              text: "We had one. $150 and she figured out how to knock the lid off in a week",
            },
          ],
        },
        {
          id: "t24-c2",
          author: "kibble_counter",
          hoursAgo: 46,
          text: "We keep a tiny whiteboard taped to the food bin and write the time. Works when we're both home, useless when one of us is at work wondering if the cat sitter came.",
        },
      ],
    },
  },
  {
    title: "Quiet window AC for a bedroom?",
    post: {
      id: "t25",
      author: "sweaty_sleeper",
      hoursAgo: 560,
      text: "Mine sounds like a jet engine. Looking for something under $400 that I can actually sleep next to. 12x12 room.",
    },
  },
  {
    title: "Bought a whole bunch of cilantro for one recipe. Again.",
    post: {
      id: "t26",
      author: "herb_regret",
      hoursAgo: 40,
      text: "Recipe needed 2 tablespoons. Store sells it in a bunch the size of a bouquet. The rest is going to turn into green slime in my crisper drawer by Friday like it always does.",
      replies: [
        {
          id: "t26-c1",
          author: "batch_cook_bea",
          hoursAgo: 37,
          text: "This is why I wish recipes for the week were planned around shared ingredients. If I knew I had cilantro I'd make tacos Tuesday and rice Thursday. But I never remember what's in there until I'm cleaning out the slime.",
        },
        {
          id: "t26-c2",
          author: "windowsill_wally",
          hoursAgo: 33,
          text: "Grow it on the windowsill and snip what you need",
          replies: [
            {
              id: "t26-c2-r1",
              author: "herb_regret",
              hoursAgo: 29,
              text: "lol mine bolts in a week",
            },
          ],
        },
      ],
    },
  },
  {
    title: "Join my free 30 day declutter challenge!",
    post: {
      id: "t27",
      author: "tidyhome_tasha",
      hoursAgo: 115,
      text: "Starting Nov 1! One small task a day, a printable calendar, and a private community. Sign up at the link in my bio to get the free ebook '30 Days to Calm'. Over 4,000 people joined last round!",
      replies: [
        {
          id: "t27-c1",
          author: "skeptical_sid",
          hoursAgo: 111,
          text: "is this an ad",
        },
      ],
    },
  },
  {
    title: "Moved in with two strangers, how do you split chores without it getting weird?",
    post: {
      id: "t28",
      author: "sublet_survivor",
      hoursAgo: 330,
      text: "Found the place online, didn't know either of them before. Two weeks in and I've taken the trash out every time. I don't want to be the passive aggressive note person but I'm close.",
      replies: [
        {
          id: "t28-c1",
          author: "chore_wheel_chloe",
          hoursAgo: 326,
          text: "Chore wheel on the fridge. Sounds childish, works great. Spin it every Sunday.",
        },
        {
          id: "t28-c2",
          author: "dishes_in_the_sink",
          hoursAgo: 320,
          text: "We tried a wheel and the problem is nobody checks it off, so when someone says 'I did mine' there's no way to know. It turns into he said she said.",
        },
        {
          id: "t28-c3",
          author: "fourth_floor_walkup",
          hoursAgo: 315,
          text: "Have a house meeting now while it's still early and nobody is mad yet. Way easier than in month 6.",
        },
      ],
    },
  },
  {
    title: "Back to school supply lists are getting ridiculous",
    post: {
      id: "t29",
      author: "pencilcase_penny",
      hoursAgo: 590,
      text: "$84 for one second grader. Brand name markers only, 3 packs of wipes, a specific color of folder that no store had. Is this normal now?",
      replies: [
        {
          id: "t29-c1",
          author: "carline_carmen",
          hoursAgo: 585,
          text: "And ours came as a blurry photo of a printout in the class app, then the PTA email had a different list, and the school website had a third one from 2023. I bought the wrong folders twice. Why can't the school just put everything in one place.",
        },
        {
          id: "t29-c2",
          author: "frugal_dad_fred",
          hoursAgo: 580,
          text: "We're at $120 with two kids and I skipped the brand name stuff. Nobody has said anything.",
        },
        {
          id: "t29-c3",
          author: "gluestick_truther",
          hoursAgo: 575,
          text: "the glue sticks. why is it always 24 glue sticks. where do they go",
        },
      ],
    },
  },
  {
    title: "Study finds dog owners walk 22 more minutes per day than non-owners",
    post: {
      id: "t30",
      author: "science_snippets",
      hoursAgo: 15,
      text: "New study of 3,000 adults found dog owners averaged 22 extra minutes of walking per day, with the biggest gap in winter months.",
      replies: [
        {
          id: "t30-c1",
          author: "lazy_greyhound_lyle",
          hoursAgo: 12,
          text: "my greyhound would like a word. he walks to the couch and that's it",
        },
        {
          id: "t30-c2",
          author: "citation_needed_ned",
          hoursAgo: 9,
          text: "source?",
        },
      ],
    },
  },
];
