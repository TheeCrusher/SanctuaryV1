// ============================================================
// Scripture Study Seed Data
// ============================================================
// Bible verses organized by category, plus 3 reading plans.
// Used by seed.js to populate the database.

export const SCRIPTURE_VERSES = [
  // --- Love ---
  { reference: 'John 3:16', text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.', category: 'Love' },
  { reference: '1 Corinthians 13:4-7', text: 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs.', category: 'Love' },
  { reference: '1 John 4:19', text: 'We love because he first loved us.', category: 'Love' },
  { reference: 'Romans 5:8', text: 'But God demonstrates his own love for us in this: While we were still sinners, Christ died for us.', category: 'Love' },
  { reference: 'John 15:13', text: 'Greater love has no one than this: to lay down one\'s life for one\'s friends.', category: 'Love' },

  // --- Strength ---
  { reference: 'Philippians 4:13', text: 'I can do all things through Christ who strengthens me.', category: 'Strength' },
  { reference: 'Isaiah 40:31', text: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.', category: 'Strength' },
  { reference: '2 Timothy 1:7', text: 'For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.', category: 'Strength' },
  { reference: 'Ephesians 6:10', text: 'Finally, be strong in the Lord and in his mighty power.', category: 'Strength' },
  { reference: 'Psalm 18:32', text: 'It is God who arms me with strength and keeps my way secure.', category: 'Strength' },

  // --- Hope ---
  { reference: 'Jeremiah 29:11', text: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.', category: 'Hope' },
  { reference: 'Romans 8:28', text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.', category: 'Hope' },
  { reference: 'Romans 15:13', text: 'May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.', category: 'Hope' },
  { reference: 'Lamentations 3:22-23', text: 'Because of the Lord\'s great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.', category: 'Hope' },
  { reference: 'Hebrews 11:1', text: 'Now faith is confidence in what we hope for and assurance about what we do not see.', category: 'Hope' },

  // --- Comfort ---
  { reference: 'Psalm 23:1', text: 'The Lord is my shepherd, I lack nothing.', category: 'Comfort' },
  { reference: 'Psalm 46:1', text: 'God is our refuge and strength, an ever-present help in trouble.', category: 'Comfort' },
  { reference: 'Matthew 11:28', text: 'Come to me, all you who are weary and burdened, and I will give you rest.', category: 'Comfort' },
  { reference: '2 Corinthians 1:3-4', text: 'Praise be to the God and Father of our Lord Jesus Christ, the Father of compassion and the God of all comfort, who comforts us in all our troubles.', category: 'Comfort' },
  { reference: 'Psalm 34:18', text: 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.', category: 'Comfort' },

  // --- Trust ---
  { reference: 'Proverbs 3:5-6', text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.', category: 'Trust' },
  { reference: 'Psalm 56:3', text: 'When I am afraid, I put my trust in you.', category: 'Trust' },
  { reference: 'Psalm 37:5', text: 'Commit your way to the Lord; trust in him and he will do this.', category: 'Trust' },
  { reference: 'Isaiah 26:3', text: 'You will keep in perfect peace those whose minds are steadfast, because they trust in you.', category: 'Trust' },
  { reference: 'Nahum 1:7', text: 'The Lord is good, a refuge in times of trouble. He cares for those who trust in him.', category: 'Trust' },

  // --- Courage ---
  { reference: 'Joshua 1:9', text: 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.', category: 'Courage' },
  { reference: 'Deuteronomy 31:6', text: 'Be strong and courageous. Do not be afraid or terrified because of them, for the Lord your God goes with you; he will never leave you nor forsake you.', category: 'Courage' },
  { reference: 'Isaiah 41:10', text: 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.', category: 'Courage' },
  { reference: 'Psalm 27:1', text: 'The Lord is my light and my salvation — whom shall I fear? The Lord is the stronghold of my life — of whom shall I be afraid?', category: 'Courage' },
  { reference: '1 Chronicles 28:20', text: 'Be strong and courageous, and do the work. Do not be afraid or discouraged, for the Lord God, my God, is with you.', category: 'Courage' },

  // --- Faith ---
  { reference: 'Romans 10:17', text: 'So then faith comes by hearing, and hearing by the word of God.', category: 'Faith' },
  { reference: 'Matthew 17:20', text: 'If you have faith as small as a mustard seed, you can say to this mountain, Move from here to there, and it will move. Nothing will be impossible for you.', category: 'Faith' },
  { reference: 'Galatians 2:20', text: 'I have been crucified with Christ and I no longer live, but Christ lives in me. The life I now live in the body, I live by faith in the Son of God, who loved me and gave himself for me.', category: 'Faith' },
  { reference: 'Hebrews 11:6', text: 'And without faith it is impossible to please God, because anyone who comes to him must believe that he exists and that he rewards those who earnestly seek him.', category: 'Faith' },
  { reference: 'Mark 11:22-24', text: 'Have faith in God. Truly I tell you, if anyone says to this mountain, Go, throw yourself into the sea, and does not doubt in their heart but believes that what they say will happen, it will be done for them.', category: 'Faith' },

  // --- Peace ---
  { reference: 'Philippians 4:6-7', text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.', category: 'Peace' },
  { reference: 'John 14:27', text: 'Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.', category: 'Peace' },
  { reference: 'Psalm 4:8', text: 'In peace I will lie down and sleep, for you alone, Lord, make me dwell in safety.', category: 'Peace' },
  { reference: 'Colossians 3:15', text: 'Let the peace of Christ rule in your hearts, since as members of one body you were called to peace. And be thankful.', category: 'Peace' },
  { reference: 'Romans 8:6', text: 'The mind governed by the flesh is death, but the mind governed by the Spirit is life and peace.', category: 'Peace' },

  // --- Gratitude ---
  { reference: '1 Thessalonians 5:18', text: 'Give thanks in all circumstances; for this is God\'s will for you in Christ Jesus.', category: 'Gratitude' },
  { reference: 'Psalm 107:1', text: 'Give thanks to the Lord, for he is good; his love endures forever.', category: 'Gratitude' },
  { reference: 'Colossians 3:17', text: 'And whatever you do, whether in word or deed, do it all in the name of the Lord Jesus, giving thanks to God the Father through him.', category: 'Gratitude' },
  { reference: 'Ephesians 5:20', text: 'Always giving thanks to God the Father for everything, in the name of our Lord Jesus Christ.', category: 'Gratitude' },
  { reference: 'Psalm 100:4', text: 'Enter his gates with thanksgiving and his courts with praise; give thanks to him and praise his name.', category: 'Gratitude' },

  // --- Additional verses for existing categories ---
  { reference: 'Romans 8:38-39', text: 'For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers, neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God that is in Christ Jesus our Lord.', category: 'Love' },
  { reference: 'Psalm 28:7', text: 'The Lord is my strength and my shield; my heart trusts in him, and he helps me. My heart leaps for joy, and with my song I praise him.', category: 'Strength' },
  { reference: 'Psalm 31:24', text: 'Be strong and take heart, all you who hope in the Lord.', category: 'Hope' },
  { reference: '1 Peter 5:7', text: 'Cast all your anxiety on him because he cares for you.', category: 'Comfort' },
  { reference: 'Psalm 91:2', text: 'I will say of the Lord, He is my refuge and my fortress, my God, in whom I trust.', category: 'Trust' },
  { reference: 'Psalm 118:6', text: 'The Lord is with me; I will not be afraid. What can mere mortals do to me?', category: 'Courage' },
]

export const READING_PLANS = [
  {
    name: 'Gospel of John - 21 Days',
    description: 'Journey through the Gospel of John, discovering the life and teachings of Jesus Christ.',
    totalDays: 21,
    days: Array.from({ length: 21 }, (_, i) => ({
      dayNumber: i + 1,
      title: `John ${i + 1}`,
      reference: `John ${i + 1}:1-end`
    }))
  },
  {
    name: 'Psalms of Comfort - 7 Days',
    description: 'A week of comforting psalms to bring peace and strength to your spirit.',
    totalDays: 7,
    days: [
      { dayNumber: 1, title: 'The Good Shepherd', reference: 'Psalm 23' },
      { dayNumber: 2, title: 'God Our Refuge', reference: 'Psalm 46' },
      { dayNumber: 3, title: 'Under His Wings', reference: 'Psalm 91' },
      { dayNumber: 4, title: 'My Help Comes from the Lord', reference: 'Psalm 121' },
      { dayNumber: 5, title: 'Fearfully and Wonderfully Made', reference: 'Psalm 139' },
      { dayNumber: 6, title: 'The Lord is My Light', reference: 'Psalm 27' },
      { dayNumber: 7, title: 'My Soul Finds Rest', reference: 'Psalm 62' },
    ]
  },
  {
    name: 'Proverbs Wisdom - 31 Days',
    description: 'Read one chapter of Proverbs each day for a month of practical wisdom.',
    totalDays: 31,
    days: Array.from({ length: 31 }, (_, i) => ({
      dayNumber: i + 1,
      title: `Proverbs ${i + 1}`,
      reference: `Proverbs ${i + 1}:1-end`
    }))
  }
]
