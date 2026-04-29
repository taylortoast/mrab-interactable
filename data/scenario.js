window.SCENARIO_DATA = {
  "id": "scenario-1",
  "title": "335 TRS Sample Interactive Scenario",
  "description": "Initial scaffold scenario used to verify local loading, building markers, and modal foundation.",
  "mapImage": "../assets/maps/base-map-placeholder.svg",
  "buildings": [
    {
      "id": "bldg-001",
      "name": "Wing HQ",
      "description": "Main headquarters building for the wing commander and staff operations.",
      "bounds": {
        "x": 40,
        "y": 11,
        "width": 10,
        "height": 7
      },
      "entities": [
        {
          "id": "entity-001",
          "type": "person",
          "name": "Commander",
          "description": "Leads the entire installation and sets mission priorities, culture, and expectations across all units. The chapel engages the commander when advising on morale, resilience, or spiritual climate, supporting response to critical incidents, and providing input on ethical or religious matters.",
          "image": "",
          "collectionItems": [
            {
              "id": "item-001",
              "title": "Commander Priorities",
              "content": "The commander's current priorities shape the entire installation's focus. Understanding these helps the chapel align its programs and ministry to support mission success.",
              "correctDecision": "collect",
              "feedback": "Correct. Commander priorities directly inform how chapel programs should be oriented to support the mission.",
              "image": ""
            },
            {
              "id": "item-002",
              "title": "Base Concerns",
              "content": "The commander has expressed concerns about recent morale indicators and a rise in referrals to helping agencies across the installation.",
              "correctDecision": "collect",
              "feedback": "Correct. Base-wide concerns are critical context for chapel ministry planning and outreach.",
              "image": ""
            },
            {
              "id": "item-003",
              "title": "Chapel Expectations",
              "content": "The commander has specific expectations for how the chapel supports installation programs, critical incident response, and unit morale.",
              "correctDecision": "collect",
              "feedback": "Correct. Knowing the commander's expectations for chapel directly guides ministry priorities.",
              "image": ""
            },
            {
              "id": "item-004",
              "title": "Recent Incidents",
              "content": "Several critical incidents have occurred on base in the past 90 days, including a line-of-duty death and two Airmen in crisis situations.",
              "correctDecision": "collect",
              "feedback": "Correct. Recent incidents require coordinated chapel response and awareness for ongoing pastoral care.",
              "image": ""
            },
            {
              "id": "item-005",
              "title": "Future Focus",
              "content": "The commander is planning a major wing reorganization over the next fiscal year to improve operational efficiency.",
              "correctDecision": "doNotCollect",
              "feedback": "Future organizational restructuring is an administrative matter outside the chapel's immediate ministry scope.",
              "image": ""
            }
          ]
        },
        {
          "id": "entity-002",
          "type": "person",
          "name": "Senior Enlisted Leader (SEL)",
          "description": "Serves as the senior enlisted advisor to the commander, focusing on enlisted force health, morale, and discipline. The chapel engages the SEL when identifying morale issues across units, coordinating support for struggling Airmen, and gaining enlisted perspective on base climate.",
          "image": "",
          "collectionItems": [
            {
              "id": "item-006",
              "title": "Enlisted Morale",
              "content": "The SEL reports that enlisted morale has declined in two squadrons following a high operational tempo period with limited family time.",
              "correctDecision": "collect",
              "feedback": "Correct. Enlisted morale data is central to the chapel's mission of supporting Airmen wellbeing.",
              "image": ""
            },
            {
              "id": "item-007",
              "title": "Discipline Trends",
              "content": "Article 15s and counseling actions have increased by 18% over the past quarter, primarily in two units.",
              "correctDecision": "doNotCollect",
              "feedback": "Discipline and UCMJ trends are primarily an administrative and legal matter. The chapel does not collect judicial data as part of ministry assessment.",
              "image": ""
            },
            {
              "id": "item-008",
              "title": "NCO Challenges",
              "content": "Mid-level NCOs are reporting burnout and feeling unsupported in their leadership roles, particularly in high-deployment units.",
              "correctDecision": "collect",
              "feedback": "Correct. NCO challenges directly inform pastoral care priorities and chapel programming for mid-level leaders.",
              "image": ""
            },
            {
              "id": "item-009",
              "title": "Dorm Climate",
              "content": "The SEL has observed isolation and low community engagement among junior Airmen living in the dorms.",
              "correctDecision": "collect",
              "feedback": "Correct. Dorm climate affects the welfare of junior Airmen and directly informs chapel outreach and community-building efforts.",
              "image": ""
            }
          ]
        },
        {
          "id": "entity-003",
          "type": "person",
          "name": "First Sergeant",
          "description": "Provides direct support to Airmen at the unit level, focusing on morale, welfare, and discipline. The chapel engages First Sergeants when supporting high-risk Airmen, responding to family or personal crises, and coordinating care for individuals in distress.",
          "image": "",
          "collectionItems": [
            {
              "id": "item-010",
              "title": "Current Issues by Unit",
              "content": "The First Sergeant has flagged recurring stress indicators in two units related to deployment schedules and supervisor relationships.",
              "correctDecision": "collect",
              "feedback": "Correct. Unit-level issues help the chapel target ministry efforts and coordinate care with appropriate helping agencies.",
              "image": ""
            },
            {
              "id": "item-011",
              "title": "High-Risk Airmen",
              "content": "Three Airmen have been identified as high-risk due to recent personal crises, including financial hardship and relationship problems.",
              "correctDecision": "collect",
              "feedback": "Correct. High-risk Airmen are a primary focus of chapel ministry and coordinated care.",
              "image": ""
            },
            {
              "id": "item-012",
              "title": "Family Emergencies",
              "content": "Two Airmen are dealing with active family emergencies — one involving a critically ill parent and one involving a custody dispute.",
              "correctDecision": "collect",
              "feedback": "Correct. Family emergencies require pastoral response and coordination with chapel and helping agencies.",
              "image": ""
            },
            {
              "id": "item-013",
              "title": "Discipline / UCMJ Trends",
              "content": "The First Sergeant is managing several open UCMJ cases and expects additional administrative separations this quarter.",
              "correctDecision": "doNotCollect",
              "feedback": "UCMJ proceedings are a legal and administrative matter. Collecting this information is outside the chapel's ministry role and may compromise confidentiality.",
              "image": ""
            }
          ]
        },
        {
          "id": "entity-004",
          "type": "section",
          "name": "CSS / Executive Staff",
          "description": "Manages administrative operations for leadership, ensuring coordination and task completion across the wing. The chapel engages the CSS when scheduling meetings with leadership, gaining access to command teams, and tracking taskers related to chapel programs.",
          "image": "",
          "collectionItems": [
            {
              "id": "item-014",
              "title": "Commander Schedule",
              "content": "The commander has designated quarterly commander's calls and monthly leadership engagements as key windows for chapel input.",
              "correctDecision": "collect",
              "feedback": "Correct. Knowing the commander's schedule is essential for the chapel to coordinate timely engagement with leadership.",
              "image": ""
            },
            {
              "id": "item-015",
              "title": "Meeting Access",
              "content": "The CSS can route chapel requests directly to the executive officer, streamlining access to command leadership.",
              "correctDecision": "collect",
              "feedback": "Correct. Understanding meeting access pathways helps the chapel engage leadership effectively and efficiently.",
              "image": ""
            },
            {
              "id": "item-016",
              "title": "Taskers / Suspenses",
              "content": "The wing has 47 open administrative taskers tracked through the CSS, most related to inspection preparation and policy updates.",
              "correctDecision": "doNotCollect",
              "feedback": "Administrative taskers and suspenses are an internal wing management matter not relevant to chapel ministry planning.",
              "image": ""
            },
            {
              "id": "item-017",
              "title": "Wing Priorities Tracker",
              "content": "The wing priorities tracker lists readiness, mental health, and family support as top focus areas for the current quarter.",
              "correctDecision": "collect",
              "feedback": "Correct. The wing priorities tracker provides the chapel with direct alignment context for programming and outreach efforts.",
              "image": ""
            }
          ]
        }
      ]
    },
    {
      "id": "bldg-002",
      "name": "Dorms",
      "description": "Enlisted dormitory facilities providing on-base housing for airmen.",
      "bounds": {
        "x": 53,
        "y": 17,
        "width": 9,
        "height": 7
      },
      "entities": []
    },
    {
      "id": "bldg-003",
      "name": "Chapel",
      "description": "Religious services and spiritual care facility for base personnel.",
      "bounds": {
        "x": 45.5,
        "y": 26,
        "width": 9,
        "height": 7
      },
      "entities": []
    },
    {
      "id": "bldg-004",
      "name": "Maintenance",
      "description": "General maintenance and repair facility for base infrastructure.",
      "bounds": {
        "x": 23,
        "y": 25,
        "width": 12,
        "height": 7
      },
      "entities": []
    },
    {
      "id": "bldg-005",
      "name": "Security Forces",
      "description": "Law enforcement and base defense operations center.",
      "bounds": {
        "x": 35,
        "y": 42,
        "width": 15,
        "height": 7
      },
      "entities": []
    },
    {
      "id": "bldg-006",
      "name": "Flightline",
      "description": "Aircraft parking, servicing, and ground operations area.",
      "bounds": {
        "x": 58,
        "y": 50,
        "width": 10,
        "height": 7
      },
      "entities": []
    },
    {
      "id": "bldg-007",
      "name": "Control Tower",
      "description": "Air traffic control facility managing all airfield operations.",
      "bounds": {
        "x": 73,
        "y": 58,
        "width": 13,
        "height": 7
      },
      "entities": []
    },
    {
      "id": "bldg-008",
      "name": "Medical",
      "description": "Medical treatment facility providing healthcare to base personnel.",
      "bounds": {
        "x": 12,
        "y": 35.5,
        "width": 10,
        "height": 7
      },
      "entities": []
    },
    {
      "id": "bldg-009",
      "name": "AMXS",
      "description": "Aircraft Maintenance Squadron facility for aircraft maintenance and inspection.",
      "bounds": {
        "x": 14.5,
        "y": 52.5,
        "width": 6.5,
        "height": 7
      },
      "entities": []
    },
    {
      "id": "bldg-010",
      "name": "Comptroller",
      "description": "Financial management and budget services for the wing.",
      "bounds": {
        "x": 35.5,
        "y": 59.5,
        "width": 10,
        "height": 6
      },
      "entities": []
    },
    {
      "id": "bldg-011",
      "name": "Family Housing",
      "description": "On-base family housing area for military members with dependents.",
      "bounds": {
        "x": 25,
        "y": 67,
        "width": 14,
        "height": 6
      },
      "entities": []
    },
    {
      "id": "bldg-012",
      "name": "NATO/GSU",
      "description": "NATO and geographically separated unit coordination and support facility.",
      "bounds": {
        "x": 71,
        "y": 71,
        "width": 11,
        "height": 7
      },
      "entities": []
    },
    {
      "id": "bldg-013",
      "name": "Community Center",
      "description": "Recreational and community activities center for base members and families.",
      "bounds": {
        "x": 15.5,
        "y": 80,
        "width": 16,
        "height": 7
      },
      "entities": []
    },
    {
      "id": "bldg-014",
      "name": "Off Base",
      "description": "Represents off-base locations or activities outside the installation boundary.",
      "bounds": {
        "x": 36,
        "y": 85,
        "width": 10,
        "height": 7
      },
      "entities": []
    },
    {
      "id": "bldg-015",
      "name": "CE",
      "description": "Represents Civil Engineering building on the installation.",
      "bounds": {
        "x": 30,
        "y": 51,
        "width": 5,
        "height": 7
      },
      "entities": []
    }
  ]
};
