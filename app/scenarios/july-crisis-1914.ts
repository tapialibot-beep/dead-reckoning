import { Scenario } from '../types'

export const julyCrisis1914: Scenario = {
  id: 'july-crisis-1914',
  title: 'The July Crisis',
  period: 'July–August 1914',
  location: 'London, Foreign Office',
  role: 'British Foreign Secretary',
  description:
    "Navigate Britain's response to the assassination of Archduke Franz Ferdinand and the countdown to the First World War.",
  curriculumTags: ['AP European History', 'AP World History', 'WWI Causes'],

  phases: [
    {
      id: 'phase-1',
      name: 'The Shot Heard Round the World',
      description:
        'Assess the diplomatic fallout from the assassination of Archduke Franz Ferdinand in Sarajevo.',
      timeLimit: 300,
      documents: [
        {
          id: 'tel-001',
          type: 'telegram',
          title: 'Cipher Telegram: Assassination Report',
          date: '28 June 1914',
          content:
            'ARCHDUKE FRANZ FERDINAND ASSASSINATED SARAJEVO THIS AFTERNOON. ASSAILANT GAVRILO PRINCIP. AUSTRIAN CROWN CONSIDERS SERBIAN GOVERNMENT COMPLICIT. CROWDS AGITATED. EMBASSY SECURE. SITUATION DEVELOPING. FULLER REPORT FOLLOWS.',
          sender: 'Vienna Embassy',
          recipient: 'Sir Edward Grey',
          reliability: 'verified',
          isUnlocked: true,
        },
        {
          id: 'news-001',
          type: 'newspaper',
          title: 'HEIR TO AUSTRIAN THRONE SLAIN WITH HIS CONSORT BY A BOSNIAN YOUTH',
          date: 'Monday, 29 June 1914',
          content:
            'Archduke Franz Ferdinand, heir apparent to the throne of Austria-Hungary, was shot and killed in Sarajevo yesterday afternoon alongside his wife Sophie, Duchess of Hohenberg. The assassin, identified as Gavrilo Princip, a Bosnian of Serbian nationality, fired upon the Archduke\'s motorcade on the Franz Joseph Street.\n\nThe Archduke and his wife were attending the Bosnian anniversary celebrations at the invitation of General Oskar Potiorek, Military Governor of Bosnia. A first attempt on the Archduke\'s life earlier in the morning, by bomb, had failed. The fatal encounter occurred when the imperial motorcade took a wrong turning.\n\nThe Austrian government has gone into emergency session. Foreign capitals await developments with grave concern. The German Kaiser, summoned from a Baltic cruise, has returned to Berlin. Our Vienna correspondent reports the mood in the Austrian capital as one of controlled fury.',
          sender: 'Our Vienna Correspondent',
          source: 'The Times, 29 June 1914',
          reliability: 'verified',
          isUnlocked: true,
        },
      ],
      decision: {
        id: 'dec-phase1',
        prompt:
          "Vienna confirms the Archduke's assassination. How do you assess Britain's immediate strategic posture?",
        options: [
          {
            id: 'opt-1a',
            text: 'A localised Austro-Balkan dispute. Monitor developments but do not intervene.',
            outcome: 'plausible',
            consequences: [
              'Britain remains disengaged through the critical July weeks',
              'Diplomatic leverage with Vienna and Berlin is squandered',
            ],
            debriefNote:
              'Historically plausible — many in Cabinet shared this view — but Grey moved quickly to open channels with all parties.',
          },
          {
            id: 'opt-1b',
            text: 'A potential continental crisis. Open immediate diplomatic channels with Berlin, Vienna, and St. Petersburg.',
            outcome: 'correct',
            consequences: [
              'Britain positions itself as a credible mediator',
              "Grey's subsequent four-power conference proposal gains traction",
            ],
            debriefNote:
              "Grey's actual response: immediate diplomatic engagement across all major capitals.",
          },
          {
            id: 'opt-1c',
            text: 'An internal Austro-Hungarian matter. Formally communicate British disinterest.',
            outcome: 'wrong',
            consequences: [
              'Germany reads British neutrality as a green light',
              'Continental war becomes significantly more likely',
            ],
            debriefNote:
              'A formal declaration of disinterest would have been historically catastrophic. Grey understood this.',
          },
        ],
      },
    },

    {
      id: 'phase-2',
      name: 'The Ultimatum',
      description:
        'Austria-Hungary has delivered a deliberately unacceptable ultimatum to Serbia. European powers are choosing sides.',
      timeLimit: 300,
      documents: [
        {
          id: 'let-001',
          type: 'letter',
          title: "Private Letter: The King's Concern",
          date: '23 July 1914',
          content:
            "My dear Grey,\n\nI write in confidence to express my deep personal anxiety at the turn of events in South-East Europe. I have received private communications from my cousins in Berlin and St. Petersburg which leave me profoundly uneasy.\n\nThe Tsar has written that Russia cannot stand idle if Austria moves against Serbia. Willy's tone, by contrast, is brittle — I sense Berlin is encouraging Vienna rather than restraining her. If this is so, we face not a Balkan crisis but a European one.\n\nI rely upon your judgement entirely in this matter, but I urge that we do not allow ourselves to be drawn in by alliance commitments that do not directly engage British honour or British interests. The country has no stomach for a continental war.\n\nYours sincerely,\nGeorge R.",
          sender: 'King George V',
          recipient: 'Sir Edward Grey',
          source: 'Buckingham Palace',
          reliability: 'verified',
          isUnlocked: true,
        },
        {
          id: 'rep-001',
          type: 'report',
          title: 'AUSTRO-SERBIAN SITUATION: INTELLIGENCE ASSESSMENT',
          date: '24 July 1914',
          content:
            'The Austro-Hungarian ultimatum delivered to Belgrade on 23 July is without precedent in its severity. Our Belgrade legation assesses it as deliberately designed to be rejected.\n\nGerman support for Austro-Hungarian action is confirmed by three independent sources. Berlin has issued a so-called "blank cheque" of unconditional support. This transforms a bilateral Austro-Serbian dispute into a direct challenge to the Franco-Russian alliance.\n\nRussian partial mobilisation is assessed as highly probable within seventy-two hours of any Austrian military action against Serbia. French obligations under the 1894 alliance would then draw Paris into a continental war.\n\nBritain\'s treaty obligations under the 1839 guarantee of Belgian neutrality are of immediate relevance. German war plans almost certainly require violation of Belgian territory. This office assesses the probability at above eighty per cent.\n\nRecommendation: Britain should communicate to Berlin that Belgian neutrality is a British vital interest, without committing to formal belligerency at this stage.',
          sender: 'Foreign Office Intelligence Department',
          recipient: 'Sir Edward Grey',
          source: 'CONFIDENTIAL',
          reliability: 'verified',
          isUnlocked: true,
        },
      ],
      decision: {
        id: 'dec-phase2',
        prompt:
          "Austria's ultimatum expires in 48 hours. Serbia has accepted nine of ten demands. What is Britain's diplomatic posture?",
        options: [
          {
            id: 'opt-2a',
            text: 'Issue a formal warning to Vienna: military action against Serbia risks a general European war that Britain could not stand aside from.',
            outcome: 'correct',
            consequences: [
              "Germany receives the first signal that British neutrality is not guaranteed",
              'Diplomatic pressure on Vienna increases marginally',
            ],
            debriefNote:
              "Grey issued precisely this kind of warning, though too cautiously and too late to deter.",
          },
          {
            id: 'opt-2b',
            text: "Maintain strict neutrality. Britain has no formal obligations in an Austro-Serbian dispute.",
            outcome: 'wrong',
            consequences: [
              "Germany reinforced in its belief that Britain will not intervene",
              'Deterrence fails completely',
            ],
            debriefNote:
              "This was the position Germany hoped for. British ambiguity was a major contributing factor to the war's outbreak.",
          },
          {
            id: 'opt-2c',
            text: 'Propose a four-power conference of Britain, France, Germany, and Italy to mediate.',
            outcome: 'plausible',
            consequences: [
              'Grey actually proposed exactly this on 26 July',
              "Germany's rejection of the proposal was pivotal",
            ],
            debriefNote:
              'Historically, Grey made this proposal. Germany rejected it, foreclosing the last diplomatic off-ramp.',
          },
        ],
      },
    },

    {
      id: 'phase-3',
      name: 'The Guns of August',
      description:
        'Germany has declared war on Russia and France. German forces mass on the Belgian border.',
      timeLimit: 300,
      documents: [
        {
          id: 'map-001',
          type: 'map',
          title: 'EUROPEAN MILITARY DISPOSITIONS',
          date: '1 August 1914',
          content:
            'GERMAN FORCES: 1.5 million mobilised, concentrating on Franco-Belgian frontier\nRUSSIAN MOBILISATION: General mobilisation declared 31 July, approx. 4 million men\nFRENCH MOBILISATION: General mobilisation 1 August, covering force on German border\nBELGIAN ARMY: 117,000 men, deployed on Meuse and Liège fortresses\nBELGIAN FRONTIER: German demand for free passage issued 2 August, deadline 12 hours\nBRITISH EXPEDITIONARY FORCE: 6 divisions available, not yet mobilised',
          sender: 'Field assessment notes — Colonel Bridges, Military Intelligence',
          source: 'Western Front: Belgium, France, Germany',
          reliability: 'suspect',
          isUnlocked: true,
        },
      ],
      decision: {
        id: 'dec-phase3',
        prompt:
          'Germany has demanded free passage through neutral Belgium. King Albert has refused and appealed to Britain. What does Britain do?',
        options: [
          {
            id: 'opt-3a',
            text: "Declare that Britain will honour its 1839 treaty obligation. Violation of Belgian neutrality means war with Germany.",
            outcome: 'correct',
            consequences: [
              'Britain enters the war with moral authority and full Cabinet support',
              'The BEF deploys to France; the long war begins',
            ],
            debriefNote:
              'The Belgian guarantee was the issue that united the Cabinet and brought the Liberal Party to support the war.',
          },
          {
            id: 'opt-3b',
            text: 'Issue a final ultimatum to Germany but limit British involvement to naval operations only.',
            outcome: 'plausible',
            consequences: [
              'Britain patrols the Channel and North Sea',
              'France and Russia fight the land war without British ground forces',
            ],
            debriefNote:
              "A naval-only strategy was seriously debated in Cabinet. Churchill favoured full commitment; others did not.",
          },
          {
            id: 'opt-3c',
            text: 'Remain neutral. The 1839 guarantee does not legally compel British military action.',
            outcome: 'wrong',
            consequences: [
              'Germany overruns France within six weeks',
              'German hegemony over Western Europe is established',
            ],
            debriefNote:
              'Asquith and Grey both concluded that a German-dominated Europe was an existential threat to British interests.',
          },
        ],
      },
    },
  ],
}
