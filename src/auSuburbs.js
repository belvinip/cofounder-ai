// Australian suburbs with their state — used for the profile location picker.
// Format: "Suburb": "STATE". Covers major suburbs across all states/territories.
export const AU_SUBURBS = {
  // VIC — Melbourne metro + regional
  "Melbourne":"VIC","Carlton":"VIC","Fitzroy":"VIC","Richmond":"VIC","South Yarra":"VIC","St Kilda":"VIC",
  "Brunswick":"VIC","Footscray":"VIC","Prahran":"VIC","Hawthorn":"VIC","Camberwell":"VIC","Box Hill":"VIC",
  "Canterbury":"VIC","Kew":"VIC","Toorak":"VIC","Brighton":"VIC","Docklands":"VIC","Southbank":"VIC",
  "Preston":"VIC","Coburg":"VIC","Essendon":"VIC","Moonee Ponds":"VIC","Williamstown":"VIC","Geelong":"VIC",
  "Ballarat":"VIC","Bendigo":"VIC","Frankston":"VIC","Dandenong":"VIC","Ringwood":"VIC","Glen Waverley":"VIC",
  "Doncaster":"VIC","Werribee":"VIC","Sunbury":"VIC","Cranbourne":"VIC","Pakenham":"VIC","Mornington":"VIC",
  // NSW — Sydney metro + regional
  "Sydney":"NSW","Parramatta":"NSW","Bondi":"NSW","Surry Hills":"NSW","Newtown":"NSW","Manly":"NSW",
  "Chatswood":"NSW","North Sydney":"NSW","Bankstown":"NSW","Liverpool":"NSW","Penrith":"NSW","Blacktown":"NSW",
  "Hornsby":"NSW","Cronulla":"NSW","Randwick":"NSW","Coogee":"NSW","Paddington":"NSW","Glebe":"NSW",
  "Marrickville":"NSW","Strathfield":"NSW","Burwood":"NSW","Castle Hill":"NSW","Ryde":"NSW","Newcastle":"NSW",
  "Wollongong":"NSW","Central Coast":"NSW","Gosford":"NSW","Maitland":"NSW","Wagga Wagga":"NSW","Albury":"NSW",
  "Byron Bay":"NSW","Coffs Harbour":"NSW","Port Macquarie":"NSW","Tamworth":"NSW","Dubbo":"NSW","Orange":"NSW",
  // QLD — Brisbane metro + regional
  "Brisbane":"QLD","South Brisbane":"QLD","Fortitude Valley":"QLD","West End":"QLD","New Farm":"QLD","Toowong":"QLD",
  "Chermside":"QLD","Mount Gravatt":"QLD","Sunnybank":"QLD","Indooroopilly":"QLD","Carindale":"QLD","Ipswich":"QLD",
  "Gold Coast":"QLD","Surfers Paradise":"QLD","Southport":"QLD","Broadbeach":"QLD","Burleigh Heads":"QLD","Robina":"QLD",
  "Sunshine Coast":"QLD","Maroochydore":"QLD","Noosa":"QLD","Caloundra":"QLD","Cairns":"QLD","Townsville":"QLD",
  "Toowoomba":"QLD","Mackay":"QLD","Rockhampton":"QLD","Bundaberg":"QLD","Hervey Bay":"QLD","Gladstone":"QLD",
  // WA — Perth metro + regional
  "Perth":"WA","Fremantle":"WA","Subiaco":"WA","Joondalup":"WA","Scarborough":"WA","Cottesloe":"WA",
  "Mandurah":"WA","Rockingham":"WA","Midland":"WA","Armadale":"WA","Cannington":"WA","Morley":"WA",
  "Bunbury":"WA","Geraldton":"WA","Kalgoorlie":"WA","Albany":"WA","Broome":"WA","Northbridge":"WA",
  // SA — Adelaide metro + regional
  "Adelaide":"SA","North Adelaide":"SA","Glenelg":"SA","Norwood":"SA","Unley":"SA","Prospect":"SA",
  "Port Adelaide":"SA","Marion":"SA","Modbury":"SA","Elizabeth":"SA","Salisbury":"SA","Mount Barker":"SA",
  "Mount Gambier":"SA","Whyalla":"SA","Gawler":"SA","Victor Harbor":"SA","Murray Bridge":"SA",
  // TAS
  "Hobart":"TAS","Launceston":"TAS","Devonport":"TAS","Burnie":"TAS","Sandy Bay":"TAS","Battery Point":"TAS",
  "Glenorchy":"TAS","Kingston":"TAS","Bellerive":"TAS",
  // ACT
  "Canberra":"ACT","Belconnen":"ACT","Gungahlin":"ACT","Woden":"ACT","Tuggeranong":"ACT","Civic":"ACT",
  "Braddon":"ACT","Dickson":"ACT","Kingston ACT":"ACT","Manuka":"ACT",
  // NT
  "Darwin":"NT","Palmerston":"NT","Casuarina":"NT","Alice Springs":"NT","Katherine":"NT","Nightcliff":"NT",
};

export const AU_SUBURB_LIST = Object.keys(AU_SUBURBS);
