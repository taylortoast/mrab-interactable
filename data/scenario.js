window.SCENARIO_DATA = {
  id: "scenario-001",
  title: "335 TRS Sample Interactive Scenario",
  description:
    "Initial scaffold scenario used to verify local loading, building markers, and modal foundation.",
  mapImage: "../assets/maps/base-map-placeholder.svg",
  buildings: [
    {
      id: "bldg-001",
      name: "Wing HQ",
      description:
        "Main headquarters building for the wing commander and staff operations.",
      bounds: { x: 40, y: 11, width: 10, height: 7 },
      entities: [
        {
          id: "entity-001",
          type: "person",
          name: "Training Manager",
          description: "Provides initial tasking information.",
          collectionItems: [
            {
              id: "item-001",
              title: "Schedule Conflict",
              content:
                "The schedule has a conflict with another training event.",
              correctDecision: "collect",
              feedback:
                "This should be collected because it affects mission planning.",
            },
          ],
        },
      ],
    },
    {
      id: "bldg-002",
      name: "Dorms",
      description:
        "Enlisted dormitory facilities providing on-base housing for airmen.",
      bounds: { x: 53, y: 17, width: 9, height: 7 },
      entities: [],
    },
    {
      id: "bldg-003",
      name: "Chapel",
      description:
        "Religious services and spiritual care facility for base personnel.",
      bounds: { x: 45.5, y: 26, width: 9, height: 7 },
      entities: [],
    },
    {
      id: "bldg-004",
      name: "Maintenance",
      description:
        "General maintenance and repair facility for base infrastructure.",
      bounds: { x: 23, y: 25, width: 12, height: 7 },
      entities: [],
    },
    {
      id: "bldg-005",
      name: "Security Forces",
      description: "Law enforcement and base defense operations center.",
      bounds: { x: 35, y: 42, width: 15, height: 7 },
      entities: [],
    },
    {
      id: "bldg-006",
      name: "Flightline",
      description: "Aircraft parking, servicing, and ground operations area.",
      bounds: { x: 58, y: 50, width: 10, height: 7 },
      entities: [],
    },
    {
      id: "bldg-007",
      name: "Control Tower",
      description:
        "Air traffic control facility managing all airfield operations.",
      bounds: { x: 73, y: 58, width: 13, height: 7 },
      entities: [],
    },
    {
      id: "bldg-008",
      name: "Medical",
      description:
        "Medical treatment facility providing healthcare to base personnel.",
      bounds: { x: 12, y: 35.5, width: 10, height: 7 },
      entities: [],
    },
    {
      id: "bldg-009",
      name: "AMXS",
      description:
        "Aircraft Maintenance Squadron facility for aircraft maintenance and inspection.",
      bounds: { x: 14.5, y: 52.5, width: 6.5, height: 7 },
      entities: [],
    },
    {
      id: "bldg-010",
      name: "Comptroller",
      description: "Financial management and budget services for the wing.",
      bounds: { x: 35.5, y: 59.5, width: 10, height: 6 },
      entities: [],
    },
    {
      id: "bldg-011",
      name: "Family Housing",
      description:
        "On-base family housing area for military members with dependents.",
      bounds: { x: 25, y: 67, width: 14, height: 6 },
      entities: [],
    },
    {
      id: "bldg-012",
      name: "NATO/GSU",
      description:
        "NATO and geographically separated unit coordination and support facility.",
      bounds: { x: 71, y: 71, width: 11, height: 7 },
      entities: [],
    },
    {
      id: "bldg-013",
      name: "Community Center",
      description:
        "Recreational and community activities center for base members and families.",
      bounds: { x: 15.5, y: 80, width: 16, height: 7 },
      entities: [],
    },
    {
      id: "bldg-014",
      name: "Off Base",
      description:
        "Represents off-base locations or activities outside the installation boundary.",
      bounds: { x: 36, y: 85, width: 10, height: 7 },
      entities: [],
    },
    {
      id: "bldg-015",
      name: "CE",
      description: "Represents Civil Engineering building on the installation.",
      bounds: { x: 30, y: 51, width: 5, height: 7 },
      entities: [],
    },
  ],
};
