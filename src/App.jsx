import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import { AU_SUBURBS, AU_SUBURB_LIST } from "./auSuburbs";

const SUPABASE_URL = "https://xvvjruoeggohktflwnak.supabase.co";
const SUPABASE_ANON = "sb_publishable_Q-vS4CYYvQSsGp0rN8OhwQ_wyDXAC6p";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// Calls the admin-actions Edge Function to perform an action on behalf of a user.
// The server verifies the caller is an admin before doing anything.
async function adminAction(payload) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-actions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session?.access_token || ""}`,
      "apikey": SUPABASE_ANON,
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(json.error || "Admin action failed");
  return json;
}

const ADMIN_EMAIL = "belvinip@gmail.com";

// Fire-and-forget transactional email via the send-email Edge Function.
// Never blocks the UI; silently no-ops if the function isn't deployed yet.
async function sendEmail(type, to, data={}) {
  if(!to) return;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: { "Content-Type":"application/json", "Authorization":`Bearer ${session?.access_token||SUPABASE_ANON}`, "apikey":SUPABASE_ANON },
      body: JSON.stringify({ type, to, data }),
    });
  } catch(e){ /* email is best-effort; never break the action */ }
}
const INDUSTRIES = ["FinTech","HealthTech","EdTech","Climate","Web3","E-commerce","SaaS","Consumer","DeepTech","Other"];
const PARTNER_ROLES = ["Business Partner","Co-Founder","Technical Partner","Marketing Partner","Operations Partner","Sales Partner","Investor","Advisor","Mentor","Contractor","Employee"];
const AU_STATES = ["VIC","NSW","QLD","WA","SA","TAS","ACT","NT"];
const AU_STATE_NAMES = {VIC:"Victoria",NSW:"New South Wales",QLD:"Queensland",WA:"Western Australia",SA:"South Australia",TAS:"Tasmania",ACT:"Australian Capital Territory",NT:"Northern Territory"};

const PALETTE = ["#7c6fe0","#a78bfa","#06b6d4","#ec4899","#10b981","#f59e0b","#ef4444","#3b82f6"];
const pal = (id) => PALETTE[(id?.charCodeAt(0)||0) % PALETTE.length];
const initials = (n) => n ? n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() : "?";
const ago = (ts) => {
  const d = Date.now() - new Date(ts).getTime(), m = Math.floor(d/60000);
  if(m<1) return "just now"; if(m<60) return `${m}m`; const h=Math.floor(m/60);
  if(h<24) return `${h}h`; return `${Math.floor(h/24)}d`;
};
const fmtDate = (ts) => new Date(ts).toLocaleDateString("en-AU",{weekday:"short",month:"short",day:"numeric",year:"numeric"});
const fmtTime = (ts) => new Date(ts).toLocaleTimeString("en-AU",{hour:"2-digit",minute:"2-digit"});

// ─── 30 Demo Profiles ─────────────────────────────────────────────────────────
const DEMO_PROFILES = [
  { id:"d1",  name:"Alex Chen",        role:"CEO / Founder",       location:"Melbourne, VIC",   bio:"Serial entrepreneur with 3 exits. Building at the intersection of AI and healthcare.",              skills:["AI/ML","Product","Strategy","Fundraising"],          project_name:"HealthAI",        project_industry:"HealthTech",  experience:8  },
  { id:"d2",  name:"Priya Sharma",     role:"CTO",                 location:"Sydney, NSW",         bio:"Full-stack engineer turned founder. Passionate about EdTech and democratising education.",          skills:["React","Node.js","System Design","FinTech"],          project_name:"EduChain",        project_industry:"EdTech",      experience:6  },
  { id:"d3",  name:"Marcus Webb",      role:"CMO",                 location:"Brisbane, QLD",           bio:"Growth hacker who scaled 2 startups to 1M+ users. Data-driven, obsessed with retention.",          skills:["Growth","Marketing","B2C","Analytics"],              project_name:"GrowthOS",        project_industry:"SaaS",        experience:5  },
  { id:"d4",  name:"Sofia Russo",      role:"CPO / Design Lead",   location:"Perth, WA",           bio:"Design-led founder. Ex-unicorn design lead. Obsessed with beautiful, functional UX.",              skills:["UX","Branding","Figma","Web3"],                      project_name:"DesignDAO",       project_industry:"Web3",        experience:7  },
  { id:"d5",  name:"Daniel Kim",       role:"CFO / COO",           location:"Adelaide, SA",            bio:"Finance & ops expert. Ex-Goldman Sachs. Loves turning messy cap tables into clean outcomes.",       skills:["Finance","Ops","Fundraising","B2B SaaS"],            project_name:"CapStack",        project_industry:"FinTech",     experience:9  },
  { id:"d6",  name:"Yuki Tanaka",      role:"Blockchain Lead",     location:"Gold Coast, QLD",         bio:"Blockchain architect and DeFi native. Building trustless systems for the real world.",              skills:["Solidity","Web3","Cryptography","Rust"],             project_name:"TrustLayer",      project_industry:"Web3",        experience:4  },
  { id:"d7",  name:"Amara Okonkwo",    role:"Founder / CEO",       location:"Newcastle, NSW",       bio:"Climate tech evangelist building carbon credit infrastructure for emerging markets.",               skills:["Climate","ESG","Strategy","B2B"],                    project_name:"CarbonBridge",    project_industry:"Climate",     experience:6  },
  { id:"d8",  name:"Jake Morrison",    role:"Full-Stack Engineer",  location:"Canberra, ACT",     bio:"10x engineer who loves shipping fast. Built and sold 2 SaaS products bootstrapped.",               skills:["TypeScript","Go","Postgres","DevOps"],               project_name:"ShipFast",        project_industry:"SaaS",        experience:7  },
  { id:"d9",  name:"Lin Wei",          role:"AI Researcher",       location:"Melbourne, VIC",      bio:"PhD in ML from MIT. Turned academic research into practical LLM applications at scale.",           skills:["LLMs","Python","MLOps","Research"],                  project_name:"ContextAI",       project_industry:"DeepTech",    experience:5  },
  { id:"d10", name:"Rachel Torres",    role:"Head of Sales",       location:"Sydney, NSW",            bio:"0-to-$10M ARR sales leader. Built sales teams from scratch at 3 hypergrowth startups.",           skills:["Sales","B2B","CRM","Revenue Ops"],                   project_name:"SalesMatrix",     project_industry:"SaaS",        experience:8  },
  { id:"d11", name:"Tom Blackwell",    role:"Hardware Engineer",   location:"Brisbane, QLD",          bio:"Ex-Apple hardware engineer. Bridging the gap between software intelligence and physical devices.",  skills:["Hardware","IoT","Embedded","C++"],                   project_name:"SenseGrid",       project_industry:"DeepTech",    experience:11 },
  { id:"d12", name:"Nadia Petrov",     role:"Founder / CMO",       location:"Perth, WA",        bio:"Brand builder and storyteller. Took 2 DTC brands from zero to $5M revenue in 18 months.",          skills:["Brand","DTC","Content","Paid Ads"],                  project_name:"StoryCommerce",   project_industry:"E-commerce",  experience:6  },
  { id:"d13", name:"Carlos Mendez",    role:"CTO / Co-Founder",    location:"Adelaide, SA",  bio:"Fintech infrastructure builder. Helped 3 neobanks in LATAM launch their core banking stack.",      skills:["FinTech","Java","Microservices","Banking APIs"],     project_name:"NovoBanco",       project_industry:"FinTech",     experience:9  },
  { id:"d14", name:"Isla MacGregor",   role:"Product Manager",     location:"Gold Coast, QLD",        bio:"Product leader with deep expertise in consumer health apps and wearables.",                         skills:["Product","Health","User Research","Roadmapping"],   project_name:"PulseTrack",      project_industry:"HealthTech",  experience:5  },
  { id:"d15", name:"Ravi Patel",       role:"DevOps / Infra Lead", location:"Newcastle, NSW",     bio:"Infrastructure wizard. Scaled systems from 10K to 10M users at a Bangalore unicorn.",             skills:["Kubernetes","AWS","Terraform","SRE"],                project_name:"CloudLaunch",     project_industry:"SaaS",        experience:7  },
  { id:"d16", name:"Mei Yamamoto",     role:"CPO",                 location:"Melbourne, VIC",         bio:"Consumer product expert. Launched 4 apps with 500K+ DAU combined on iOS and Android.",            skills:["Mobile","Swift","Kotlin","Product"],                 project_name:"DailyHabit",      project_industry:"Consumer",    experience:6  },
  { id:"d17", name:"Ethan Brooks",     role:"Founder / CEO",       location:"Sydney, NSW",           bio:"EdTech entrepreneur. Previous company acquired by Coursera. Passionate about lifelong learning.",  skills:["EdTech","B2C","Curriculum","LMS"],                   project_name:"SkillPath",       project_industry:"EdTech",      experience:10 },
  { id:"d18", name:"Zara Ahmed",       role:"UX / Product",        location:"Brisbane, QLD",           bio:"Human-centred design champion. Designed products used by 20M+ people across the Middle East.",    skills:["UX","Design Systems","Research","Arabic UX"],       project_name:"MENADesign",      project_industry:"Consumer",    experience:7  },
  { id:"d19", name:"Oliver Grant",     role:"CFO",                 location:"Perth, WA",  bio:"Ex-Credit Suisse. Structured funding for 10+ startups. Deep expertise in European VC landscape.",  skills:["Finance","VC","M&A","Fundraising"],                  project_name:"AlphaFund",       project_industry:"FinTech",     experience:14 },
  { id:"d20", name:"Aisha Diallo",     role:"CEO / Founder",       location:"Adelaide, SA",       bio:"Building mobile-first financial tools for the unbanked across Sub-Saharan Africa.",               skills:["Mobile Money","Strategy","B2C","Ops"],               project_name:"PesaPlus",        project_industry:"FinTech",     experience:5  },
  { id:"d21", name:"Ben Nakamura",     role:"ML Engineer",         location:"Melbourne, VIC",      bio:"Computer vision specialist. 3 papers published at NeurIPS. Now applying research to retail AI.",   skills:["Computer Vision","PyTorch","MLOps","Retail AI"],    project_name:"ShelfSight",      project_industry:"DeepTech",    experience:6  },
  { id:"d22", name:"Lena Kowalski",    role:"Growth Lead",         location:"Sydney, NSW",       bio:"PLG expert who drove 300% YoY user growth at a SaaS unicorn in Warsaw.",                          skills:["PLG","SEO","Analytics","Experimentation"],           project_name:"LoopGrowth",      project_industry:"SaaS",        experience:5  },
  { id:"d23", name:"David Osei",       role:"Founder / CTO",       location:"Canberra, ACT",         bio:"Full-stack builder focused on logistics tech. Making last-mile delivery work in Africa.",          skills:["React Native","Node.js","Logistics","Maps API"],    project_name:"LastMile",        project_industry:"E-commerce",  experience:4  },
  { id:"d24", name:"Sophie Laurent",   role:"COO",                 location:"Gold Coast, QLD",        bio:"Operations expert who scaled a French startup from 5 to 200 people in 3 years.",                  skills:["Ops","Hiring","Process","OKRs"],                     project_name:"ScaleOps",        project_industry:"SaaS",        experience:8  },
  { id:"d25", name:"Kai Andersen",     role:"Founder / CTO",       location:"Newcastle, NSW",  bio:"Climate fintech builder. Combining open banking and carbon data to help consumers go green.",      skills:["Open Banking","APIs","Climate","TypeScript"],        project_name:"GreenLedger",     project_industry:"Climate",     experience:5  },
  { id:"d26", name:"Fatima Al-Hassan", role:"CEO",                 location:"Perth, WA", bio:"Vision 2030 aligned founder. Building workforce reskilling platforms for the Saudi market.",       skills:["EdTech","Arabic","B2B","Government Relations"],     project_name:"ReskillSA",       project_industry:"EdTech",      experience:7  },
  { id:"d27", name:"Marco Ferretti",   role:"Founder / Designer",  location:"Melbourne, VIC",         bio:"Ex-Fiat designer turned startup founder. Applying industrial design thinking to SaaS products.",  skills:["Industrial Design","UX","Brand","Figma"],           project_name:"FormProduct",     project_industry:"SaaS",        experience:9  },
  { id:"d28", name:"Hana Park",        role:"Head of Data",        location:"Brisbane, QLD",   bio:"Data scientist turned product leader. Built recommendation engines serving 50M+ Korean users.",    skills:["Data Science","Recommender Systems","SQL","Python"],project_name:"PersonalizeKR",   project_industry:"Consumer",    experience:6  },
  { id:"d29", name:"Tyler Washington", role:"Founder / CEO",       location:"Sydney, NSW",          bio:"HealthTech entrepreneur focused on closing the racial health equity gap through technology.",       skills:["HealthTech","Community","Strategy","Fundraising"],  project_name:"EquityHealth",    project_industry:"HealthTech",  experience:6  },
  { id:"d30", name:"Nina Volkov",      role:"CTO",                 location:"Adelaide, SA",     bio:"Ex-Skype engineer. Building privacy-first communication tools for remote-first teams.",            skills:["Rust","WebRTC","Privacy","Distributed Systems"],    project_name:"SecureComms",     project_industry:"SaaS",        experience:10 },
];

// ─── 30 Demo Events ───────────────────────────────────────────────────────────
const _now = new Date();
const fd = (days,h=10,m=0) => { const d=new Date(_now); d.setDate(d.getDate()-(days*11)-7); d.setHours(h,m,0,0); return d.toISOString(); };
const pd = (days,h=18,m=0) => { const d=new Date(_now); d.setDate(d.getDate()-days); d.setHours(h,m,0,0); return d.toISOString(); };

const DEMO_EVENTS = [
  { id:"e1",  title:"AI Founders Breakfast",            description:"Casual morning meetup for founders building AI-first products. Share what you're working on over coffee and croissants.",          location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126",        event_date:fd(2,8,30),  max_attendees:25,  industry_tags:["DeepTech","SaaS"],            creator:{name:"Alex Chen",        id:"d1"  }, attendee_count:8  },
  { id:"e2",  title:"FinTech Demo Day",                 description:"10 early-stage fintech founders pitch to a room of angels and VCs. Network afterwards with top investors in the space.",           location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126",            event_date:fd(4,14,0),  max_attendees:80,  industry_tags:["FinTech"],                    creator:{name:"Daniel Kim",       id:"d5"  }, attendee_count:42 },
  { id:"e3",  title:"Web3 Builders Hackathon",          description:"48-hour hackathon building DeFi and NFT primitives on Ethereum. $10K in prizes. Teams of 2–4.",                                   location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126",              event_date:fd(6,9,0),   max_attendees:120, industry_tags:["Web3"],                       creator:{name:"Sofia Russo",      id:"d4"  }, attendee_count:67 },
  { id:"e4",  title:"EdTech Product Workshop",          description:"Hands-on workshop on building engaging learning experiences. Bring your laptop and a product idea.",                               location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126",                event_date:fd(3,16,0),  max_attendees:50,  industry_tags:["EdTech"],                     creator:{name:"Ethan Brooks",     id:"d17" }, attendee_count:29 },
  { id:"e5",  title:"Climate Tech Pitch Night",         description:"Founders working on climate solutions pitch their ideas to a panel of impact investors. Q&A session follows.",                    location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126",        event_date:fd(7,18,30), max_attendees:60,  industry_tags:["Climate"],                    creator:{name:"Amara Okonkwo",    id:"d7"  }, attendee_count:38 },
  { id:"e6",  title:"SaaS Growth Masterclass",          description:"Deep dive into product-led growth strategies that worked for $10M+ ARR companies. Real data, real examples.",                    location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126",     event_date:fd(5,10,0),  max_attendees:40,  industry_tags:["SaaS"],                       creator:{name:"Lena Kowalski",    id:"d22" }, attendee_count:31 },
  { id:"e7",  title:"Founder Speed Dating",             description:"Find your co-founder in 90 minutes. 5-minute rounds with potential matches. Structured, efficient, and surprisingly fun.",        location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126",        event_date:fd(8,18,0),  max_attendees:30,  industry_tags:["SaaS","FinTech","EdTech"],     creator:{name:"Marcus Webb",      id:"d3"  }, attendee_count:22 },
  { id:"e8",  title:"HealthTech Investor Roundtable",   description:"Closed-door roundtable connecting HealthTech founders with 8 Series A investors. Application required.",                          location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126",             event_date:fd(10,13,0), max_attendees:16,  industry_tags:["HealthTech"],                 creator:{name:"Tyler Washington", id:"d29" }, attendee_count:12 },
  { id:"e9",  title:"Women in DeepTech Mixer",          description:"Monthly mixer celebrating women building frontier technology. Allies welcome. Great speakers, better networking.",                 location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126",        event_date:fd(9,17,30), max_attendees:70,  industry_tags:["DeepTech","Climate"],         creator:{name:"Zara Ahmed",       id:"d18" }, attendee_count:45 },
  { id:"e10", title:"Open Source Dev Meetup",           description:"Monthly gathering for open source contributors and founders. Lightning talks on tooling, infra, and developer experience.",       location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126",            event_date:fd(11,18,0), max_attendees:45,  industry_tags:["SaaS","DeepTech"],            creator:{name:"Nina Volkov",      id:"d30" }, attendee_count:33 },
  { id:"e11", title:"E-commerce Founders Lunch",        description:"Intimate lunch for founders in e-commerce and DTC. Share challenges, swap playbooks, and make genuine connections.",              location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126",              event_date:fd(12,12,30),max_attendees:20,  industry_tags:["E-commerce"],                 creator:{name:"Nadia Petrov",     id:"d12" }, attendee_count:14 },
  { id:"e12", title:"Mobile-First Product Summit",      description:"Full-day summit on building exceptional mobile products. Speakers from Duolingo, Spotify, and Calm.",                            location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126", event_date:fd(14,9,0),  max_attendees:200, industry_tags:["Consumer","EdTech"],          creator:{name:"Mei Yamamoto",     id:"d16" }, attendee_count:128},
  { id:"e13", title:"Africa Tech Founder Circle",       description:"Monthly circle for African founders building pan-African or global companies. Peer support and investor intros.",                 location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126",                event_date:fd(5,17,0),  max_attendees:35,  industry_tags:["FinTech","E-commerce"],       creator:{name:"Aisha Diallo",     id:"d20" }, attendee_count:19 },
  { id:"e14", title:"B2B SaaS Metrics Deep Dive",       description:"Workshop on the metrics that matter for B2B SaaS. NRR, CAC payback, magic number — with real benchmarks.",                      location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126",         event_date:fd(6,15,0),  max_attendees:100, industry_tags:["SaaS"],                       creator:{name:"Sophie Laurent",   id:"d24" }, attendee_count:73 },
  { id:"e15", title:"Hardware & IoT Builders Meetup",   description:"For founders building in the physical world. Demos, teardowns, and war stories from the supply chain trenches.",                 location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126",        event_date:fd(15,11,0), max_attendees:40,  industry_tags:["DeepTech"],                   creator:{name:"Tom Blackwell",    id:"d11" }, attendee_count:26 },
  { id:"e16", title:"MENA Startup Showcase",            description:"Showcase of the most exciting startups from the Middle East and North Africa. Gulf and London investors attending.",              location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126",                  event_date:fd(18,14,0), max_attendees:150, industry_tags:["FinTech","EdTech","Consumer"], creator:{name:"Zara Ahmed",       id:"d18" }, attendee_count:89 },
  { id:"e17", title:"Privacy-First Product Talk",       description:"How to build products that respect user privacy without sacrificing growth. Case studies from Signal, Proton, and Brave.",       location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126",        event_date:fd(3,19,0),  max_attendees:null,industry_tags:["SaaS","DeepTech"],            creator:{name:"Nina Volkov",      id:"d30" }, attendee_count:201},
  { id:"e18", title:"Seed Funding Panel",               description:"5 seed investors break down what they look for. Bring your deck and get brutally honest feedback in small groups.",              location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126",     event_date:fd(20,14,0), max_attendees:60,  industry_tags:["SaaS","FinTech","HealthTech"], creator:{name:"Oliver Grant",     id:"d19" }, attendee_count:47 },
  { id:"e19", title:"Rust & Systems Programming Night", description:"Lightning talks on Rust in production, WebAssembly, and distributed systems. For engineers who love low-level.",                 location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126",    event_date:fd(13,18,30),max_attendees:50,  industry_tags:["DeepTech","SaaS"],            creator:{name:"Nina Volkov",      id:"d30" }, attendee_count:34 },
  { id:"e20", title:"Impact Investing Breakfast",       description:"Connecting impact-focused founders with patient capital. Focus on climate, health equity, and financial inclusion.",              location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126",       event_date:fd(7,8,30),  max_attendees:30,  industry_tags:["Climate","HealthTech"],        creator:{name:"Amara Okonkwo",    id:"d7"  }, attendee_count:21 },
  { id:"e21", title:"Design Systems Workshop",          description:"Hands-on workshop building a component library from scratch in Figma and React. Take home a production-ready design system.",    location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126",      event_date:fd(9,10,0),  max_attendees:24,  industry_tags:["SaaS","Consumer"],            creator:{name:"Sofia Russo",      id:"d4"  }, attendee_count:18 },
  { id:"e22", title:"LLM Application Builders Meetup",  description:"Monthly meetup for developers building on top of GPT, Claude, and Gemini. Show and tell, debugging sessions, best practices.",  location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126",            event_date:fd(16,18,0), max_attendees:80,  industry_tags:["DeepTech","SaaS"],            creator:{name:"Lin Wei",          id:"d9"  }, attendee_count:62 },
  { id:"e23", title:"Revenue Operations Summit",        description:"For RevOps leaders and founders wanting to build a world-class GTM machine. Tools, processes, and team structures.",              location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126",        event_date:fd(21,9,0),  max_attendees:90,  industry_tags:["SaaS"],                       creator:{name:"Rachel Torres",    id:"d10" }, attendee_count:55 },
  { id:"e24", title:"Nordic Founders Meetup",           description:"Gathering for Scandinavian founders and those building for Nordic markets. Saunas, great coffee, and genuine conversations.",    location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126",           event_date:fd(25,17,0), max_attendees:55,  industry_tags:["Climate","SaaS"],             creator:{name:"Kai Andersen",     id:"d25" }, attendee_count:40 },
  { id:"e25", title:"Consumer App Growth Workshop",     description:"Tactical workshop: push notifications, onboarding flows, virality loops, and retention strategies for consumer apps.",           location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126",                event_date:fd(4,11,0),  max_attendees:75,  industry_tags:["Consumer"],                   creator:{name:"Mei Yamamoto",     id:"d16" }, attendee_count:58 },
  { id:"e26", title:"Pitch Perfect — Founder Bootcamp", description:"Two-day intensive bootcamp on nailing your investor pitch. Deck review, mock pitches, and coaching from ex-VCs.",               location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126",     event_date:fd(28,9,0),  max_attendees:20,  industry_tags:["SaaS","FinTech","HealthTech"], creator:{name:"Oliver Grant",     id:"d19" }, attendee_count:15 },
  { id:"e27", title:"Korea Tech Networking Night",      description:"For founders building in or for South Korea and the broader APAC market. Investors from SoftBank and Kakao Ventures.",          location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126",                  event_date:fd(11,18,30),max_attendees:100, industry_tags:["Consumer","DeepTech"],        creator:{name:"Hana Park",        id:"d28" }, attendee_count:76 },
  { id:"e28", title:"HealthTech Regulatory Q&A",        description:"Expert panel on navigating FDA, CE Mark, and TGA approval for digital health products. Ask your burning compliance questions.",  location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126",                event_date:fd(17,14,0), max_attendees:60,  industry_tags:["HealthTech"],                 creator:{name:"Isla MacGregor",   id:"d14" }, attendee_count:43 },
  { id:"e29", title:"Startup Visa & Global Expansion",  description:"How to set up your company for global growth. Tax structures, visa options, EOR providers, and banking across borders.",        location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126",      event_date:fd(22,10,0), max_attendees:45,  industry_tags:["SaaS","FinTech"],             creator:{name:"Jake Morrison",    id:"d8"  }, attendee_count:30 },
  { id:"e30", title:"Founder Stories: The Hard Parts",  description:"Founders share the moments they almost quit — and what kept them going. Raw, unfiltered, deeply human conversations.",          location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC 3126",  event_date:pd(3,19,0),  max_attendees:80,  industry_tags:["SaaS","FinTech","EdTech"],    creator:{name:"Marcus Webb",      id:"d3"  }, attendee_count:72 },
];

// ════════════════════════════════════════════════════════
// GLOBAL STYLES
// ════════════════════════════════════════════════════════
const BG = "#0a0e1a";
const CARD_BG = "rgba(255,255,255,0.04)";
const BORDER = "rgba(255,255,255,0.08)";

// ─── Image Upload Helper ──────────────────────────────────────────────────────
async function uploadImage(file, bucket, pathPrefix) {
  if(!file) return null;
  // Validate
  if(file.size > 5*1024*1024) throw new Error("Image must be under 5MB");
  const ext = file.name.split(".").pop().toLowerCase();
  const fileName = `${pathPrefix}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(fileName, file, { upsert:true, cacheControl:"3600" });
  if(error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

// ════════════════════════════════════════════════════════
// UI ATOMS
// ════════════════════════════════════════════════════════
function BgGlow() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20" style={{background:"radial-gradient(circle,#1a3a4a,transparent 70%)"}}/>
      <div className="absolute bottom-1/3 left-0 w-80 h-80 rounded-full opacity-15" style={{background:"radial-gradient(circle,#1a1a3a,transparent 70%)"}}/>
    </div>
  );
}

// ── Suburb autocomplete (offline AU suburb list, auto-fills state) ──
function SuburbAutocomplete({ value, onChange, showToast }) {
  // value stored as "Suburb, STATE". Parse the suburb part for the input.
  const suburbPart=(value||"").split(",")[0]||"";
  const statePart=(value||"").split(",")[1]?.trim()||"";
  const [q,setQ]=useState(suburbPart);
  const [open,setOpen]=useState(false);
  useEffect(()=>{ setQ((value||"").split(",")[0]||""); },[value]);
  const matches = q.length>=1
    ? AU_SUBURB_LIST.filter(s=>s.toLowerCase().startsWith(q.toLowerCase())).slice(0,8)
    : [];
  function pick(s){
    const st=AU_SUBURBS[s];
    onChange(`${s}, ${st}`);
    setQ(s); setOpen(false);
  }
  return (
    <div className="relative">
      <div className="flex gap-2">
        <input value={q} onChange={e=>{setQ(e.target.value);setOpen(true);}} onFocus={()=>setOpen(true)}
          onBlur={()=>setTimeout(()=>setOpen(false),150)}
          placeholder="Start typing your suburb…"
          className="flex-1 rounded-2xl px-4 py-3 text-white placeholder-white/25 focus:outline-none"
          style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
        <div className="rounded-2xl px-4 py-3 flex items-center justify-center font-semibold flex-shrink-0"
          style={{background:"rgba(124,111,224,0.12)",border:"1px solid rgba(124,111,224,0.3)",color:statePart?"#a78bfa":"rgba(255,255,255,0.3)",minWidth:"64px",fontSize:"14px"}}>
          {statePart||"State"}
        </div>
      </div>
      {open&&matches.length>0&&(
        <div className="absolute z-50 mt-1 w-full rounded-2xl overflow-hidden" style={{background:"#161b2e",border:`1px solid ${BORDER}`,boxShadow:"0 12px 40px rgba(0,0,0,0.5)"}}>
          {matches.map(s=>(
            <button key={s} onMouseDown={()=>pick(s)}
              className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 flex items-center justify-between transition-colors">
              <span>{s}</span>
              <span className="text-white/35 text-xs">{AU_SUBURBS[s]}</span>
            </button>
          ))}
        </div>
      )}
      {open&&q.length>=1&&matches.length===0&&(
        <div className="absolute z-50 mt-1 w-full rounded-2xl px-4 py-3 text-xs text-white/40" style={{background:"#161b2e",border:`1px solid ${BORDER}`}}>
          No Australian suburb found. Try a major suburb name.
        </div>
      )}
    </div>
  );
}

// ── Full address autocomplete via OpenStreetMap Nominatim (AU only, free) ──
function AddressAutocomplete({ value, onChange, placeholder }) {
  const [q,setQ]=useState(value||"");
  const [results,setResults]=useState([]);
  const [open,setOpen]=useState(false);
  const [loading,setLoading]=useState(false);
  const tRef=useRef();
  useEffect(()=>{ setQ(value||""); },[value]);
  function onType(v){
    setQ(v); onChange(v); setOpen(true);
    clearTimeout(tRef.current);
    if(v.trim().length<3){ setResults([]); return; }
    tRef.current=setTimeout(async()=>{
      setLoading(true);
      try {
        const url=`https://nominatim.openstreetmap.org/search?format=json&countrycodes=au&addressdetails=1&limit=6&q=${encodeURIComponent(v)}`;
        const r=await fetch(url,{headers:{"Accept-Language":"en"}});
        const data=await r.json();
        setResults(Array.isArray(data)?data:[]);
      } catch(e){ setResults([]); }
      setLoading(false);
    },450);
  }
  function pick(item){
    onChange(item.display_name);
    setQ(item.display_name); setOpen(false); setResults([]);
  }
  return (
    <div className="relative">
      <input value={q} onChange={e=>onType(e.target.value)} onFocus={()=>setOpen(true)}
        onBlur={()=>setTimeout(()=>setOpen(false),200)}
        placeholder={placeholder||"Start typing the venue or address…"}
        className="w-full rounded-2xl px-4 py-3 text-white placeholder-white/25 focus:outline-none"
        style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
      {open&&(loading||results.length>0)&&(
        <div className="absolute z-50 mt-1 w-full rounded-2xl overflow-hidden" style={{background:"#161b2e",border:`1px solid ${BORDER}`,boxShadow:"0 12px 40px rgba(0,0,0,0.5)"}}>
          {loading&&<div className="px-4 py-3 text-xs text-white/40">Searching Australian addresses…</div>}
          {results.map((item,i)=>(
            <button key={i} onMouseDown={()=>pick(item)}
              className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 transition-colors border-b last:border-0" style={{borderColor:BORDER}}>
              📍 {item.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Av({ name, url, color, size="md", ring=false }) {
  const sz = {xs:"w-8 h-8 text-xs", sm:"w-10 h-10 text-sm", md:"w-12 h-12 text-sm", lg:"w-16 h-16 text-base", xl:"w-20 h-20 text-lg", "2xl":"w-28 h-28 text-2xl"};
  const c = color||"#7c6fe0";
  const base = `${sz[size]} rounded-full flex items-center justify-center font-bold flex-shrink-0 overflow-hidden`;
  const ringStyle = ring ? {padding:"2px",background:`linear-gradient(135deg,${c},#ec4899,#f59e0b)`} : {};
  const inner = url
    ? <img src={url} alt="" className="w-full h-full object-cover rounded-full"/>
    : <div className="w-full h-full rounded-full flex items-center justify-center font-bold" style={{background:`linear-gradient(135deg,${c}cc,${c}66)`,color:"#fff",fontSize:"inherit"}}>{initials(name)}</div>;
  return (
    <div className={`${base} ${ring?"p-0.5":""}`} style={ring?ringStyle:{background:c+"22"}}>
      {ring ? <div className="w-full h-full rounded-full overflow-hidden bg-[#0a0e1a]">{inner}</div> : inner}
    </div>
  );
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-white/30 focus:outline-none"
        style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)"}}/>
    </div>
  );
}

function PrimaryBtn({ children, onClick, loading, disabled, className="", small=false }) {
  return (
    <motion.button onClick={onClick} disabled={loading||disabled} whileHover={{scale:disabled?1:1.02}} whileTap={{scale:disabled?1:0.97}}
      className={`flex items-center justify-center gap-2 font-semibold text-white rounded-2xl transition-all disabled:opacity-50 ${small?"px-5 py-2.5 text-sm":"px-6 py-3.5 text-sm"} ${className}`}
      style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",boxShadow:"0 4px 20px rgba(124,111,224,0.35)"}}>
      {loading&&<svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
      {children}
    </motion.button>
  );
}

function OutlineBtn({ children, onClick, className="", small=false }) {
  return (
    <motion.button onClick={onClick} whileHover={{scale:1.02}} whileTap={{scale:0.97}}
      className={`flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all ${small?"px-4 py-2 text-xs":"px-5 py-2.5 text-sm"} ${className}`}
      style={{border:"1px solid rgba(124,111,224,0.5)",color:"#a78bfa",background:"rgba(124,111,224,0.08)"}}>
      {children}
    </motion.button>
  );
}

function Card({ children, className="", onClick }) {
  return (
    <div onClick={onClick} className={`rounded-3xl ${className}`} style={{background:CARD_BG,border:`1px solid ${BORDER}`}}>
      {children}
    </div>
  );
}

function SkillChip({ label }) {
  return (
    <span className="px-3 py-1 rounded-full text-xs font-medium" style={{background:"rgba(124,111,224,0.15)",color:"#a78bfa",border:"1px solid rgba(124,111,224,0.25)"}}>
      {label}
    </span>
  );
}

function SectionLabel({ icon, text, count }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <span className="text-white font-bold text-base">{text}</span>
      {count!=null && <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{background:"rgba(124,111,224,0.2)",color:"#a78bfa"}}>{count}</span>}
    </div>
  );
}

function Toast({ msg, type }) {
  return (
    <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} exit={{opacity:0,y:30}}
      className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl text-sm font-medium text-white whitespace-nowrap"
      style={{background:type==="error"?"rgba(239,68,68,0.9)":"rgba(124,111,224,0.9)",boxShadow:"0 8px 32px rgba(0,0,0,0.4)"}}>
      {msg}
    </motion.div>
  );
}

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// ════════════════════════════════════════════════════════
// LOGIN MODAL (Google only)
// ════════════════════════════════════════════════════════
function LoginModal({ onClose }) {
  const [loading, setLoading] = useState(false);

  function handleGoogle() {
    setLoading(true);
    supabase.auth.signInWithOAuth({ provider:"google", options:{ redirectTo: window.location.origin } });
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <motion.div initial={{scale:0.92,y:20}} animate={{scale:1,y:0}} exit={{scale:0.92,y:20}}
        className="w-full max-w-md rounded-3xl overflow-hidden relative"
        style={{background:"#0b0e18",border:`1px solid ${BORDER}`,boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}}>

        <button onClick={onClose} className="absolute top-5 right-5 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">✕</button>

        <div className="p-8">
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl" style={{background:"linear-gradient(135deg,#7cb9e8,#7c6fe0)",boxShadow:"0 8px 24px rgba(124,111,224,0.4)"}}>✦</div>
          </div>

          <h2 className="text-3xl font-bold text-center mb-2" style={{background:"linear-gradient(135deg,#7cb9e8,#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            Welcome to CoFounder AI
          </h2>
          <p className="text-white/45 text-center text-sm mb-8">
            Sign in with Google to register, match with founders, chat and join events
          </p>

          <div className="space-y-3 mb-8">
            {[["🤝","Match with co-founders"],["💬","Chat once connected"],["📅","Register for events"],["🚀","Showcase your project"]].map(([ic,tx])=>(
              <div key={tx} className="flex items-center gap-3 text-sm text-white/55">
                <span className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:"rgba(124,111,224,0.15)"}}>{ic}</span>
                {tx}
              </div>
            ))}
          </div>

          <button onClick={handleGoogle} disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-60"
            style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",boxShadow:"0 8px 24px rgba(124,111,224,0.4)"}}>
            {loading
              ? <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
              : <GoogleIcon/>}
            {loading ? "Redirecting…" : "Continue with Google"}
          </button>

          <p className="text-white/25 text-xs text-center mt-4">New users complete a quick profile setup after signing in</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
function ChatModal({ matchId, other, me, myProfile, onClose }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [menuFor, setMenuFor] = useState(null); // message id with open action menu
  const bottomRef = useRef();
  const inputRef = useRef();
  const fileRef = useRef();
  const oc = pal(other?.id);

  function fetchMsgs(first){
    supabase.from("messages").select("*, sender:profiles(name,avatar_url)").eq("match_id",matchId).order("created_at")
      .then(({data})=>{ if(data) setMsgs(data); if(first) setLoading(false); }).catch(()=>first&&setLoading(false));
  }
  async function markRead(){
    try { await supabase.from("messages").update({read_at:new Date().toISOString()}).eq("match_id",matchId).neq("sender_id",me.id).is("read_at",null); } catch(e){}
  }
  useEffect(()=>{
    fetchMsgs(true);
    markRead();
    const iv=setInterval(()=>{ fetchMsgs(false); markRead(); },3000);
    inputRef.current?.focus();
    return ()=>clearInterval(iv);
  },[matchId]);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs]);

  async function sendMsg(payload){
    const msg={match_id:matchId,sender_id:me.id,...payload};
    try {
      const {data}=await supabase.from("messages").insert(msg).select("*, sender:profiles(name,avatar_url)").single();
      if(data) setMsgs(m=>[...m,data]);
    } catch(e){}
  }

  async function send() {
    if(!text.trim()||sending) return;
    setSending(true);
    const content=text.trim(); setText("");
    await sendMsg({content, reply_to: replyTo?.content?`${replyTo.sender_id===me.id?"You":other?.name}: ${replyTo.content?.slice(0,60)}`:null});
    setReplyTo(null);
    setSending(false);
  }

  async function sendThumb(){ await sendMsg({content:"👍"}); }

  async function sendImage(e){
    const file=e.target.files?.[0]; if(!file) return;
    try {
      const url=await uploadImage(file,"avatars","chat-"+matchId);
      await sendMsg({content:"", image_url:url});
    } catch(err){}
    e.target.value="";
  }

  async function unsend(id){
    try { await supabase.from("messages").update({content:"",image_url:null,unsent:true}).eq("id",id); fetchMsgs(false); } catch(e){}
    setMenuFor(null);
  }

  function shareContactCard(){
    const c={
      name: myProfile?.name||me?.user_metadata?.full_name||"",
      business: myProfile?.business_name||"",
      mobile: myProfile?.mobile||"",
      email: me?.email||myProfile?.email||"",
      whatsapp: myProfile?.whatsapp||"",
      wechat: myProfile?.wechat||"",
      linkedin: myProfile?.linkedin_url||"",
      website: myProfile?.website_url||"",
    };
    sendMsg({content:"", contact_card: JSON.stringify(c)});
  }

  function saveContact(c){
    const nm=(c.name||"").trim();
    const parts=nm.split(/\s+/);
    const first=parts[0]||""; const last=parts.slice(1).join(" ")||"";
    const lines=["BEGIN:VCARD","VERSION:3.0"];
    lines.push(`N:${last};${first};;;`);
    lines.push(`FN:${nm}`);
    if(c.business) lines.push(`ORG:${c.business}`);
    if(c.mobile) lines.push(`TEL;TYPE=CELL,VOICE:${c.mobile}`);
    if(c.whatsapp) lines.push(`TEL;TYPE=CELL:${c.whatsapp}`);
    if(c.email) lines.push(`EMAIL;TYPE=INTERNET:${c.email}`);
    if(c.website) lines.push(`URL:${c.website}`);
    if(c.linkedin) lines.push(`URL;TYPE=LinkedIn:${c.linkedin}`);
    if(c.wechat) lines.push(`NOTE:WeChat: ${c.wechat}`);
    lines.push("END:VCARD");
    const blob=new Blob([lines.join("\r\n")],{type:"text/vcard;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download=`${(nm||"contact").replace(/\s/g,"_")}.vcf`; a.click();
    URL.revokeObjectURL(url);
  }

  const fmtTime=(d)=>{ try{ return new Date(d).toLocaleString([], {month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}); }catch{ return ""; } };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-[80] flex items-end md:items-center justify-center bg-black/70" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <motion.div initial={{y:60}} animate={{y:0}} exit={{y:60}}
        className="w-full max-w-md flex flex-col overflow-hidden rounded-t-3xl md:rounded-3xl mb-[72px] md:mb-0"
        style={{height:"72vh",background:"#0f1320",border:`1px solid ${BORDER}`}}>

        {/* Header */}
        <div className="flex-shrink-0 flex items-center gap-3 p-4 border-b" style={{borderColor:BORDER}}>
          <Av name={other?.name} url={other?.avatar_url} color={oc} size="sm" ring/>
          <div className="flex-1 min-w-0"><div className="text-white font-bold truncate">{other?.name}</div><div className="text-emerald-400 text-xs">● Connected</div></div>
          <button onClick={shareContactCard} title="Share my contact card" className="px-3 py-1.5 rounded-xl text-xs font-semibold" style={{background:"rgba(124,111,224,0.15)",color:"#a78bfa",border:"1px solid rgba(124,111,224,0.3)"}}>📇 Card</button>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">✕</button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading&&<div className="text-center text-white/30 py-8 text-sm">Loading…</div>}
          {!loading&&msgs.length===0&&<div className="text-center text-white/30 py-10 text-sm">Start a conversation! 👋</div>}
          {msgs.map((m,i)=>{
            const isMe=m.sender_id===me?.id;
            let card=null; if(m.contact_card){ try{card=JSON.parse(m.contact_card);}catch{} }
            return (
              <div key={m.id||i} className={`flex flex-col ${isMe?"items-end":"items-start"}`}>
                <div className={`flex gap-2.5 max-w-[80%] ${isMe?"flex-row-reverse":""}`}>
                  {!isMe&&<Av name={m.sender?.name} url={m.sender?.avatar_url} color={oc} size="xs"/>}
                  <div className="min-w-0">
                    {m.reply_to&&<div className="text-[11px] text-white/35 mb-0.5 px-2 truncate border-l-2 pl-2" style={{borderColor:"#7c6fe0"}}>↩ {m.reply_to}</div>}
                    {m.unsent?(
                      <div className="px-4 py-2.5 rounded-2xl text-sm italic text-white/30" style={{border:`1px dashed ${BORDER}`}}>🚫 Message unsent</div>
                    ):card?(
                      <div className="px-4 py-3 rounded-2xl" style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,minWidth:"200px"}}>
                        <div className="text-white/40 text-[10px] uppercase tracking-wide mb-1">📇 Contact Card</div>
                        <div className="text-white font-bold text-sm">{card.name}</div>
                        {card.business&&<div className="text-white/60 text-xs">{card.business}</div>}
                        <div className="mt-1 space-y-0.5 text-white/55 text-xs">
                          {card.mobile&&<div>📱 {card.mobile}</div>}
                          {card.email&&<div>📧 {card.email}</div>}
                          {card.whatsapp&&<div>💬 {card.whatsapp}</div>}
                          {card.wechat&&<div>🟢 WeChat: {card.wechat}</div>}
                          {card.linkedin&&<div className="truncate">🔗 LinkedIn</div>}
                        </div>
                        <button onClick={()=>saveContact(card)} className="w-full mt-2 py-1.5 rounded-xl text-xs font-semibold text-white" style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)"}}>💾 Save Contact</button>
                      </div>
                    ):m.image_url?(
                      <img src={m.image_url} alt="" className="rounded-2xl max-w-full" style={{maxHeight:"240px",border:`1px solid ${BORDER}`}}/>
                    ):(
                      <div onClick={()=>setMenuFor(menuFor===m.id?null:m.id)} className={`px-4 py-2.5 rounded-2xl text-sm cursor-pointer ${m.content==="👍"?"text-2xl":""} ${isMe?"rounded-tr-sm":"rounded-tl-sm"}`}
                        style={isMe?{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",color:"#fff"}:{background:"rgba(255,255,255,0.07)",border:`1px solid ${BORDER}`,color:"rgba(255,255,255,0.85)"}}>
                        {m.content}
                      </div>
                    )}
                    {/* time */}
                    <div className={`text-[10px] text-white/30 mt-0.5 ${isMe?"text-right":"text-left"} px-1`}>{fmtTime(m.created_at||new Date())}</div>
                    {/* action menu */}
                    {menuFor===m.id&&!m.unsent&&(
                      <div className={`flex gap-2 mt-1 ${isMe?"justify-end":"justify-start"}`}>
                        <button onClick={()=>{setReplyTo(m);setMenuFor(null);inputRef.current?.focus();}} className="text-xs px-2 py-1 rounded-lg text-white/60" style={{background:"rgba(255,255,255,0.06)"}}>↩ Reply</button>
                        {isMe&&<button onClick={()=>unsend(m.id)} className="text-xs px-2 py-1 rounded-lg text-red-400" style={{background:"rgba(239,68,68,0.1)"}}>🚫 Unsend</button>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef}/>
        </div>

        {/* Reply preview */}
        {replyTo&&(
          <div className="flex items-center justify-between px-4 py-2 text-xs" style={{borderTop:`1px solid ${BORDER}`,background:"rgba(124,111,224,0.08)"}}>
            <span className="text-white/55 truncate">↩ Replying to: {replyTo.content?.slice(0,40)||"message"}</span>
            <button onClick={()=>setReplyTo(null)} className="text-white/40 ml-2">✕</button>
          </div>
        )}

        {/* Composer */}
        <div className="flex-shrink-0 p-3 flex items-center gap-2" style={{borderTop:`1px solid ${BORDER}`}}>
          <button onClick={()=>fileRef.current?.click()} className="w-10 h-10 rounded-xl flex items-center justify-center text-white/50 hover:text-white flex-shrink-0" style={{background:"rgba(255,255,255,0.06)"}}>📎</button>
          <input ref={fileRef} type="file" accept="image/*" onChange={sendImage} className="hidden"/>
          <input ref={inputRef} value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
            placeholder="Type a message…"
            className="flex-1 min-w-0 rounded-2xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none"
            style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
          {text.trim()
            ? <motion.button onClick={send} disabled={sending} whileTap={{scale:0.93}} className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)"}}>↑</motion.button>
            : <motion.button onClick={sendThumb} whileTap={{scale:0.8}} className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{background:"rgba(255,255,255,0.06)"}}>👍</motion.button>}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════
// PROFILE DETAIL MODAL
// ════════════════════════════════════════════════════════
function ProfileModal({ p, onClose, onRequest, matchState, user, isAdmin, showToast, onLoginRequired }) {
  const color = pal(p.id);
  const isAccepted = matchState?.status==="accepted";
  const isPending = matchState?.status==="pending";
  const iSent = matchState?.from_user_id===user?.id;
  const isDemo = p.id?.startsWith("d");

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({name:p.name||"",role:p.role||"",bio:p.bio||"",location:p.location||"",skills:p.skills||[],linkedin_url:p.linkedin_url||"",website_url:p.website_url||"",whatsapp:p.whatsapp||""});
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingAv, setUploadingAv] = useState(false);
  const avRef = useRef();
  const [localAvatar, setLocalAvatar] = useState(p.avatar_url);

  async function reportUser() {
    const reason = prompt("Report this profile — briefly, what's the issue? (spam, fake, inappropriate, etc.)");
    if(!reason) return;
    try {
      const {error}=await supabase.from("reports").insert({reporter_id:user.id, reported_id:p.id, reason});
      if(error) throw error;
      showToast("Report submitted — our team will review it. Thank you.");
    } catch(e){ showToast("Couldn't submit report: "+e.message,"error"); }
  }

  async function saveAdminEdit() {
    setSavingEdit(true);
    try {
      const {error}=await supabase.from("profiles").update(editForm).eq("id",p.id);
      if(error) throw error;
      showToast("Profile updated ✓");
      setEditing(false);
      Object.assign(p, editForm);
    } catch(e){showToast(e.message,"error");}
    setSavingEdit(false);
  }

  async function adminUploadAvatar(e) {
    const file=e.target.files?.[0]; if(!file) return;
    setUploadingAv(true);
    try {
      const url=await uploadImage(file,"avatars",p.id+"-admin");
      const {error}=await supabase.from("profiles").update({avatar_url:url}).eq("id",p.id);
      if(error) throw error;
      setLocalAvatar(url); showToast("Photo updated ✓");
    } catch(e){showToast(e.message,"error");}
    setUploadingAv(false);
  }

  async function toggleAdminStatus() {
    const newVal=!p.is_admin;
    const {error}=await supabase.from("profiles").update({is_admin:newVal,...(newVal?{is_approved:true}:{})}).eq("id",p.id);
    if(error){showToast(error.message,"error");return;}
    p.is_admin=newVal; if(newVal) p.is_approved=true;
    showToast(newVal?"⭐ Admin granted — now a Core Member":"Admin removed");
    onClose();
  }

  async function toggleApprovalStatus() {
    const newVal=!p.is_approved;
    const {error}=await supabase.from("profiles").update({is_approved:newVal}).eq("id",p.id);
    if(error){showToast(error.message,"error");return;}
    p.is_approved=newVal;
    showToast(newVal?"✓ Approved":"Approval revoked");
    onClose();
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-[80] flex items-end md:items-center justify-center bg-black/80"
      style={{padding:0}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",damping:30,stiffness:300}}
        className="w-full md:max-w-md flex flex-col rounded-t-3xl md:rounded-3xl mb-[72px] md:mb-0"
        style={{height:"80vh",maxHeight:"680px",background:"#0f1320",border:`1px solid ${BORDER}`,boxShadow:"0 -20px 60px rgba(0,0,0,0.6)"}}>

        {/* Fixed header/banner */}
        <div className="flex-shrink-0 relative p-5 pb-4 rounded-t-3xl" style={{background:"linear-gradient(135deg,rgba(124,111,224,0.3),rgba(167,139,250,0.12))"}}>
          {/* Drag handle */}
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{background:"rgba(255,255,255,0.2)"}}/>
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-all" style={{background:"rgba(0,0,0,0.3)"}}>✕</button>
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <Av name={editing?editForm.name:p.name} url={localAvatar} color={color} size="xl" ring/>
              {isAdmin&&<button onClick={()=>avRef.current?.click()} className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full text-white text-xs flex items-center justify-center transition-all" style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",border:"2px solid #0f1320"}}>{uploadingAv?"⏳":"📷"}</button>}
              {isAdmin&&<input ref={avRef} type="file" accept="image/*" onChange={adminUploadAvatar} className="hidden"/>}
            </div>
            <div className="flex-1 min-w-0">
              {editing
                ? <input value={editForm.name} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} className="text-white font-bold text-lg bg-transparent border-b border-white/30 focus:outline-none w-full mb-1"/>
                : <div className="text-white font-bold text-lg leading-tight">{p.name}</div>}
              {editing
                ? <input value={editForm.role} onChange={e=>setEditForm(f=>({...f,role:e.target.value}))} className="text-white/60 text-sm bg-transparent border-b border-white/20 focus:outline-none w-full mt-0.5"/>
                : <div className="text-white/60 text-sm mt-0.5">{p.role}</div>}
              {!editing&&p.location&&<div className="text-white/40 text-xs mt-1">📍 {p.location}</div>}
              {editing&&<input value={editForm.location} onChange={e=>setEditForm(f=>({...f,location:e.target.value}))} placeholder="Location" className="text-white/50 text-xs bg-transparent border-b border-white/20 focus:outline-none w-full mt-1"/>}
            </div>
          </div>
          {isAdmin&&(
            <div className="mt-3 flex gap-2">
              {editing
                ? <><PrimaryBtn onClick={saveAdminEdit} loading={savingEdit} small>Save Changes</PrimaryBtn><OutlineBtn onClick={()=>setEditing(false)} small>Cancel</OutlineBtn></>
                : <OutlineBtn onClick={()=>setEditing(true)} small>✎ Edit Profile</OutlineBtn>}
            </div>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Bio */}
          {editing
            ? <div className="space-y-1.5"><div className="text-white/35 text-xs uppercase tracking-wider font-semibold">Bio</div><textarea value={editForm.bio} onChange={e=>setEditForm(f=>({...f,bio:e.target.value}))} rows={3} className="w-full rounded-2xl px-3 py-2.5 text-sm text-white focus:outline-none resize-none" style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`}}/></div>
            : p.bio&&<p className="text-white/65 text-sm leading-relaxed">{p.bio}</p>}

          {/* Project */}
          {(p.project_name||p.project_pitch)&&(
            <div className="p-3 rounded-2xl space-y-1.5" style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`}}>
              <div className="text-white/40 text-xs font-semibold">🚀 Project</div>
              {p.project_name&&<div className="text-white font-semibold text-sm">{p.project_name}</div>}
              {p.project_pitch&&<div className="text-white/55 text-xs leading-relaxed">{p.project_pitch}</div>}
              {p.project_industry&&<SkillChip label={p.project_industry}/>}
            </div>
          )}

          {/* Skills */}
          {(editing?editForm.skills:p.skills)?.length>0&&(
            <div>
              <div className="text-white/35 text-xs uppercase tracking-wider font-semibold mb-2">Skills</div>
              <div className="flex flex-wrap gap-2">{(editing?editForm.skills:p.skills).map(s=><SkillChip key={s} label={s}/>)}</div>
            </div>
          )}

          {/* Social links — always visible */}
          {(p.linkedin_url||p.website_url||p.whatsapp)&&(
            <div className="flex flex-wrap gap-2">
              {p.linkedin_url&&<a href={p.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold" style={{background:"rgba(10,102,194,0.2)",color:"#60a5fa",border:"1px solid rgba(10,102,194,0.3)"}}>🔗 LinkedIn</a>}
              {p.website_url&&<a href={p.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold" style={{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.6)",border:`1px solid ${BORDER}`}}>🌐 Website</a>}
              {p.whatsapp&&<a href={`https://wa.me/${p.whatsapp.replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold" style={{background:"rgba(37,211,102,0.15)",color:"#4ade80",border:"1px solid rgba(37,211,102,0.3)"}}>💬 WhatsApp</a>}
            </div>
          )}

          {/* Contact — BLURRED until matched */}
          <div className="p-4 rounded-2xl space-y-2 relative overflow-hidden" style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${BORDER}`}}>
            <div className="text-white/35 text-xs uppercase tracking-wider font-semibold mb-2">Contact Details</div>
            {isAccepted ? (
              <>
                <div className="text-sm text-white/70">📧 {p.email}</div>
                {p.mobile&&<div className="text-sm text-white/70">📱 {p.mobile}</div>}
                {p.whatsapp&&<div className="text-sm text-white/70">💬 {p.whatsapp}</div>}
                <div className="text-emerald-400 text-xs mt-1">✓ Connected — contact revealed</div>
              </>
            ) : (
              <>
                <div className="select-none" style={{filter:"blur(5px)",color:"rgba(255,255,255,0.5)",fontSize:"14px"}}>📧 user@example.com</div>
                <div className="select-none" style={{filter:"blur(5px)",color:"rgba(255,255,255,0.5)",fontSize:"14px"}}>📱 +61 4XX XXX XXX</div>
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl" style={{background:"rgba(15,19,32,0.6)"}}>
                  <span className="text-white/50 text-xs font-semibold px-3 py-1.5 rounded-full" style={{background:"rgba(255,255,255,0.08)",border:`1px solid ${BORDER}`}}>🔒 Connect to reveal</span>
                </div>
              </>
            )}
          </div>

          {/* Admin controls */}
          {isAdmin&&!isDemo&&(
            <div className="p-3 rounded-2xl space-y-2" style={{background:"rgba(124,111,224,0.08)",border:"1px solid rgba(124,111,224,0.2)"}}>
              <div className="text-purple-400 text-xs font-semibold uppercase tracking-wider">⭐ Admin Controls</div>
              <div className="flex gap-2">
                <OutlineBtn onClick={toggleAdminStatus} small className="flex-1">{p.is_admin?"Remove Admin":"⭐ Make Admin"}</OutlineBtn>
                <OutlineBtn onClick={toggleApprovalStatus} small className="flex-1">{p.is_approved?"Revoke Access":"✓ Approve"}</OutlineBtn>
              </div>
            </div>
          )}

          {/* CTA */}
          {!user ? (
            <PrimaryBtn onClick={()=>{onClose();onLoginRequired&&onLoginRequired();}} className="w-full">Sign in to Send Partnership Request</PrimaryBtn>
          ) : isDemo ? (
            <p className="text-white/30 text-xs text-center py-2">Demo profile — real users appear when they sign up</p>
          ) : isAccepted ? (
            <PrimaryBtn onClick={onClose} className="w-full">✓ Already Connected</PrimaryBtn>
          ) : isPending&&iSent ? (
            <div className="text-center py-2 text-white/40 text-sm">⏳ Partnership request sent — waiting for response</div>
          ) : isPending&&!iSent ? (
            <div className="space-y-2">
              <div className="text-center text-white/50 text-sm">↙ This person wants to connect with you</div>
              <div className="flex gap-2">
                <PrimaryBtn onClick={()=>{onRequest&&onRequest(p,"accepted");onClose();}} className="flex-1">✓ Accept</PrimaryBtn>
                <OutlineBtn onClick={()=>{onRequest&&onRequest(p,"declined");onClose();}} className="flex-1">✕ Decline</OutlineBtn>
              </div>
            </div>
          ) : (
            <PrimaryBtn onClick={()=>{onRequest(p);onClose();}} className="w-full">🤝 Send Partnership Request</PrimaryBtn>
          )}

          {/* Report (real profiles, not self, not demo) */}
          {user&&!isDemo&&p.id!==user.id&&(
            <button onClick={reportUser} className="w-full text-center text-white/25 hover:text-red-400/70 text-xs transition-colors py-1">
              ⚐ Report this profile
            </button>
          )}

          {/* Safe bottom padding */}
          <div className="h-4"/>
        </div>
      </motion.div>
    </motion.div>
  );
}

// MATCH TAB
// ════════════════════════════════════════════════════════
function MatchTab({ user, profile, isApproved, showToast, requireAuth, isAdmin, isViewAs }) {
  const [search, setSearch] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [realProfiles, setRealProfiles] = useState([]);
  const [matchMap, setMatchMap] = useState({});
  const [chat, setChat] = useState(null);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [incomingReqs, setIncomingReqs] = useState([]);

  async function loadRequests() {
    if(!user) return;
    const {data} = await supabase.from("match_requests").select("*").or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);
    const m={}; (data||[]).forEach(r=>{ const o=r.from_user_id===user.id?r.to_user_id:r.from_user_id; m[o]=r; }); setMatchMap(m);
    const incoming = (data||[]).filter(r=>r.to_user_id===user.id && r.status==="pending");
    if(incoming.length){
      const {data:profs} = await supabase.from("profiles").select("*").in("id", incoming.map(r=>r.from_user_id));
      setIncomingReqs(incoming.map(r=>({...r, sender:(profs||[]).find(p=>p.id===r.from_user_id)})));
    } else setIncomingReqs([]);
  }

  async function respondToRequest(reqId, status) {
    const {error}=await supabase.from("match_requests").update({status}).eq("id",reqId);
    if(error){showToast(error.message,"error");return;}
    showToast(status==="accepted"?"Match accepted! You can now chat ✓":"Request declined");
    loadRequests();
  }

  useEffect(()=>{
    // Load ALL approved profiles (needed so admins appear in Core Members)
    supabase.from("profiles").select("*").eq("is_approved",true)
      .then(({data,error})=>{ if(!error&&data?.length) setRealProfiles(data); }).catch(()=>{});
    loadRequests();
  },[user]);

  const myId = user?.id;

  // Core Members = ONLY real admin users from the database. Never demo profiles.
  const coreMembers = realProfiles.filter(p=>p.is_admin);

  // Browse list: ALL real approved users + ALL demo profiles (so you always see everyone).
  // Real users first, then demos. Exclude self and exclude demos whose name collides with a real user.
  const realBrowse = realProfiles.filter(p=>p.id!==myId);
  // Completeness score: picture is the biggest signal, then how much of the profile is filled
  function completeness(p){
    let s=0;
    if(p.avatar_url) s+=100;            // picture = top priority
    if(p.bio) s+=15;
    if(p.role) s+=10;
    if(p.location) s+=8;
    if(p.skills?.length) s+=Math.min(p.skills.length,5)*4;
    if(p.experience) s+=6;
    if(p.project_name) s+=10;
    if(p.project_pitch) s+=10;
    if(p.project_industry) s+=4;
    if(p.roles_needed?.length) s+=6;
    if(p.linkedin_url) s+=4;
    if(p.website_url) s+=4;
    if(p.whatsapp) s+=4;
    return s;
  }
  // Relevance boost: surface complementary co-founders for the current user
  function isTechnical(role){ return /cto|engineer|developer|technical|dev|architect/i.test(role||""); }
  function isBusiness(role){ return /ceo|business|marketing|sales|cmo|cfo|coo|growth|commercial|founder/i.test(role||""); }
  function relevance(p){
    let s=0;
    const myRole=profile?.role||"";
    // Complementary roles attract (technical <-> business)
    if(isTechnical(myRole)&&isBusiness(p.role)) s+=40;
    if(isBusiness(myRole)&&isTechnical(p.role)) s+=40;
    // Shared industry
    if(profile?.project_industry&&p.project_industry===profile.project_industry) s+=25;
    // They're looking for someone like me (role match against their roles_needed)
    if((p.roles_needed||[]).some(r=>myRole&&r.toLowerCase().includes(myRole.split(" ")[0]?.toLowerCase()||"___"))) s+=20;
    // Shared location (same state)
    const myState=(profile?.location||"").split(",")[1]?.trim();
    const theirState=(p.location||"").split(",")[1]?.trim();
    if(myState&&myState===theirState) s+=10;
    return s;
  }
  const sortedReal = [...realBrowse].sort((a,b)=>(relevance(b)+completeness(b))-(relevance(a)+completeness(a)));
  const realNames = new Set(realBrowse.map(p=>(p.name||"").toLowerCase()));
  const demoBrowse = DEMO_PROFILES.filter(d=>!realNames.has((d.name||"").toLowerCase()));
  // Real approved profiles always show first (sorted by completeness), demos after
  const pool = [...sortedReal, ...demoBrowse];

  // Accepted connections you can message — resolve their profile from the pool/realProfiles
  const allProfilesForLookup = [...realProfiles, ...DEMO_PROFILES];
  const acceptedConnections = Object.entries(matchMap)
    .filter(([,r])=>r.status==="accepted")
    .map(([otherId,r])=>({ req:r, other:allProfilesForLookup.find(p=>p.id===otherId) }))
    .filter(c=>c.other);

  const filtered = pool.filter(p=>{
    if(p.id===myId) return false; // don't show yourself in the browse list
    const q=search.toLowerCase();
    const matchesSearch = !search || (p.name||"").toLowerCase().includes(q)||(p.role||"").toLowerCase().includes(q)||(p.skills||[]).some(s=>s.toLowerCase().includes(q))||(p.location||"").toLowerCase().includes(q)||(p.bio||"").toLowerCase().includes(q);
    const matchesIndustry = !filterIndustry || p.project_industry===filterIndustry;
    const matchesRole = !filterRole || (p.role||"").toLowerCase().includes(filterRole.toLowerCase());
    return matchesSearch && matchesIndustry && matchesRole;
  });

  async function handleRequest(p) {
    if(requireAuth && !requireAuth()) return;
    if(!isApproved){showToast("Your account is pending admin approval","error");return;}
    if(p.id?.startsWith("d")){showToast("Demo profile — real users appear here once they sign up 😊");return;}
    try {
      if(isViewAs){
        // Admin acting on behalf of this user via secure Edge Function
        await adminAction({action:"partner_request", targetUserId:user.id, toUserId:p.id});
        showToast(`Partnership request sent to ${p.name} (on behalf) ✓`);
        loadRequests();
        return;
      }
      const {data,error}=await supabase.from("match_requests").insert({from_user_id:user.id,to_user_id:p.id}).select().single();
      if(error) throw error;
      setMatchMap(m=>({...m,[p.id]:data}));
      showToast(`Partnership request sent to ${p.name} ✓`);
      if(p.email) sendEmail("partner_request", p.email, { fromName: profile?.name||"A founder" });
      loadRequests();
    } catch(e){showToast(e.message||"Error","error");}
  }

  function openProfile(p) {
    setSelectedProfile(p);
  }

  const ROLE_FILTERS = ["CEO","CTO","CMO","CFO","COO","CPO","Founder","Engineer","Designer","Other"];

  return (
    <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-14}} transition={{duration:0.28}} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold leading-tight" style={{background:"linear-gradient(135deg,#7cb9e8,#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
          Find Your Co-Founder
        </h1>
        <p className="text-white/45 text-sm mt-1">Browse profiles and send partnership requests</p>
      </div>

      {/* Core Members — full name + clickable */}
      <div>
        <h3 className="text-white font-semibold text-sm mb-3">Core Members</h3>
        <div className="flex gap-4 overflow-x-auto pb-1">
          {coreMembers.map(p=>(
            <button key={p.id} onClick={()=>openProfile(p)} className="flex flex-col items-center gap-2 flex-shrink-0 group">
              <div className="transition-transform group-hover:scale-105">
                <Av name={p.name} url={p.avatar_url} color={pal(p.id)} size="xl" ring/>
              </div>
              <span className="text-white/70 text-xs font-medium text-center w-20 leading-tight">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages — accepted connections you can chat with */}
      {acceptedConnections.length>0&&(
        <div>
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            💬 Messages
            <span className="text-white/35 text-xs font-normal">({acceptedConnections.length})</span>
          </h3>
          <div className="space-y-2">
            {acceptedConnections.slice(0,3).map(({req,other})=>(
              <button key={req.id} onClick={()=>setChat({matchId:req.id,other})}
                className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all hover:border-white/20 text-left"
                style={{background:CARD_BG,border:`1px solid ${BORDER}`}}>
                <Av name={other.name} url={other.avatar_url} color={pal(other.id)} size="sm" ring/>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-sm truncate">{other.name}</div>
                  <div className="text-white/40 text-xs truncate">{other.role||"Tap to open chat"}</div>
                </div>
                <span className="text-white/30 text-lg">💬</span>
              </button>
            ))}
            {acceptedConnections.length>3&&(
              <button onClick={()=>setShowAllMessages(true)}
                className="w-full py-2.5 rounded-2xl text-sm font-semibold transition-all"
                style={{background:"rgba(124,111,224,0.12)",border:"1px solid rgba(124,111,224,0.3)",color:"#a78bfa"}}>
                View all messages ({acceptedConnections.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search + filter bar */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by name, role, skills, location..."/>
          </div>
          <button onClick={()=>setShowFilters(!showFilters)}
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 transition-all"
            style={showFilters||filterIndustry||filterRole?{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)"}:{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`}}>
            ⚙
          </button>
        </div>

        <AnimatePresence>
          {showFilters&&(
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} style={{overflow:"hidden"}}>
              <Card className="p-4 space-y-3">
                <div>
                  <div className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Filter by Industry</div>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={()=>setFilterIndustry("")} className="px-3 py-1 rounded-full text-xs font-medium transition-all" style={!filterIndustry?{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",color:"#fff"}:{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.5)",border:`1px solid ${BORDER}`}}>All</button>
                    {INDUSTRIES.map(ind=>(
                      <button key={ind} onClick={()=>setFilterIndustry(filterIndustry===ind?"":ind)} className="px-3 py-1 rounded-full text-xs font-medium transition-all" style={filterIndustry===ind?{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",color:"#fff"}:{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.5)",border:`1px solid ${BORDER}`}}>{ind}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Filter by Role</div>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={()=>setFilterRole("")} className="px-3 py-1 rounded-full text-xs font-medium transition-all" style={!filterRole?{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",color:"#fff"}:{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.5)",border:`1px solid ${BORDER}`}}>All</button>
                    {ROLE_FILTERS.map(r=>(
                      <button key={r} onClick={()=>setFilterRole(filterRole===r?"":r)} className="px-3 py-1 rounded-full text-xs font-medium transition-all" style={filterRole===r?{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",color:"#fff"}:{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.5)",border:`1px solid ${BORDER}`}}>{r}</button>
                    ))}
                  </div>
                </div>
                {(filterIndustry||filterRole)&&(
                  <button onClick={()=>{setFilterIndustry("");setFilterRole("");}} className="text-white/40 text-xs hover:text-white/70 transition-colors">✕ Clear all filters</button>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {(filterIndustry||filterRole)&&(
          <div className="flex gap-2 flex-wrap">
            {filterIndustry&&<span className="px-3 py-1 rounded-full text-xs font-medium" style={{background:"rgba(124,111,224,0.2)",color:"#a78bfa"}}>🎓 {filterIndustry}</span>}
            {filterRole&&<span className="px-3 py-1 rounded-full text-xs font-medium" style={{background:"rgba(124,111,224,0.2)",color:"#a78bfa"}}>👤 {filterRole}</span>}
            <span className="text-white/40 text-xs self-center">{filtered.length} result{filtered.length!==1?"s":""}</span>
          </div>
        )}
      </div>

      {/* Incoming Partnership Requests */}
      {incomingReqs.length>0&&(
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-amber-400">🔔</span>
            <span className="text-white font-bold text-base">Partnership Requests</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{background:"rgba(245,158,11,0.2)",color:"#fbbf24"}}>{incomingReqs.length}</span>
          </div>
          <div className="space-y-3">
            {incomingReqs.map(req=>{
              const s=req.sender; if(!s) return null;
              return (
                <Card key={req.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <button onClick={()=>openProfile(s)}><Av name={s.name} url={s.avatar_url} color={pal(s.id)} size="sm" ring/></button>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-bold text-sm">{s.name}</div>
                      <div className="text-white/40 text-xs">{s.role}{s.location?` · ${s.location}`:""}</div>
                      <div className="text-white/30 text-xs mt-0.5">wants to partner with you</div>
                      <div className="flex gap-2 mt-3">
                        <PrimaryBtn onClick={()=>respondToRequest(req.id,"accepted")} small className="flex-1">✓ Accept</PrimaryBtn>
                        <OutlineBtn onClick={()=>respondToRequest(req.id,"declined")} small className="flex-1">✕ Decline</OutlineBtn>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Profile Cards — clickable */}
      <div className="space-y-4">
        {filtered.map((p,i)=>{
          const color=pal(p.id);
          const matchState=matchMap[p.id];
          const isAccepted=matchState?.status==="accepted";
          const isPending=matchState?.status==="pending";
          const iSent=matchState?.from_user_id===user?.id;
          return (
            <motion.div key={p.id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}>
              <Card className="p-5 cursor-pointer hover:border-white/20 transition-all" onClick={()=>openProfile(p)}>
                <div className="flex items-start gap-3 mb-3">
                  <Av name={p.name} url={p.avatar_url} color={color} size="md" ring/>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-base">{p.name}</div>
                    <div className="text-white/50 text-sm">{p.role}</div>
                    {p.location&&<div className="text-white/35 text-xs mt-0.5">📍 {p.location}</div>}
                  </div>
                  {p.project_industry&&<SkillChip label={p.project_industry}/>}
                </div>

                {p.bio&&<p className="text-white/45 text-sm leading-relaxed mb-3 line-clamp-2">{p.bio}</p>}
                {p.skills?.length>0&&<div className="flex flex-wrap gap-1.5 mb-4">{p.skills.slice(0,4).map(s=><SkillChip key={s} label={s}/>)}</div>}

                {/* WhatsApp badge */}
                {p.whatsapp&&<div className="mb-3"><span className="text-xs px-2.5 py-1 rounded-full" style={{background:"rgba(37,211,102,0.12)",color:"#4ade80",border:"1px solid rgba(37,211,102,0.25)"}}>💬 WhatsApp available</span></div>}

                <div onClick={e=>e.stopPropagation()}>
                  <PrimaryBtn onClick={()=>!matchState&&handleRequest(p)} className="w-full" disabled={!!matchState}>
                    {isAccepted?<><span>✓</span> Connected</>
                    :isPending&&iSent?<><span>⏳</span> Request Sent</>
                    :isPending&&!iSent?<><span>↙</span> Awaiting Response</>
                    :<><span>🤝</span> Partnership Request</>}
                  </PrimaryBtn>
                  {isAccepted&&(
                    <button onClick={()=>setChat({matchId:matchState.id,other:p})}
                      className="w-full mt-2 py-2.5 rounded-2xl text-sm font-semibold transition-all"
                      style={{border:`1px solid ${BORDER}`,color:"rgba(255,255,255,0.6)"}}>
                      💬 Open Chat
                    </button>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>{chat&&<ChatModal matchId={chat.matchId} other={chat.other} me={user} myProfile={profile} onClose={()=>setChat(null)}/>}</AnimatePresence>
      <AnimatePresence>{showAllMessages&&(
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          className="fixed inset-0 z-[80] flex items-end md:items-center justify-center bg-black/80"
          onClick={e=>e.target===e.currentTarget&&setShowAllMessages(false)}>
          <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",damping:30,stiffness:300}}
            className="w-full md:max-w-md flex flex-col rounded-t-3xl md:rounded-3xl mb-[72px] md:mb-0"
            style={{height:"80vh",maxHeight:"680px",background:"#0f1320",border:`1px solid ${BORDER}`}}>
            <div className="flex-shrink-0 flex items-center justify-between p-5 border-b" style={{borderColor:BORDER}}>
              <div className="text-white font-bold text-lg">💬 All Messages</div>
              <button onClick={()=>setShowAllMessages(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white" style={{background:"rgba(255,255,255,0.06)"}}>✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {acceptedConnections.map(({req,other})=>(
                <button key={req.id} onClick={()=>{setShowAllMessages(false);setChat({matchId:req.id,other});}}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all hover:border-white/20 text-left"
                  style={{background:CARD_BG,border:`1px solid ${BORDER}`}}>
                  <Av name={other.name} url={other.avatar_url} color={pal(other.id)} size="sm" ring/>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold text-sm truncate">{other.name}</div>
                    <div className="text-white/40 text-xs truncate">{other.role||"Tap to open chat"}</div>
                  </div>
                  <span className="text-white/30 text-lg">💬</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
      <AnimatePresence>{selectedProfile&&<ProfileModal p={selectedProfile} onClose={()=>setSelectedProfile(null)} onRequest={handleRequest} matchState={matchMap[selectedProfile.id]} user={user} isAdmin={isAdmin} showToast={showToast} onLoginRequired={()=>{setSelectedProfile(null);requireAuth&&requireAuth();}}/>}</AnimatePresence>
    </motion.div>
  );
}


// ════════════════════════════════════════════════════════
// EVENTS TAB
// ════════════════════════════════════════════════════════
function EventsTab({ user, isApproved, showToast, requireAuth, isAdmin, isViewAs }) {
  const [events, setEvents] = useState([]);
  const [attSet, setAttSet] = useState({});
  const [pendingAtt, setPendingAtt] = useState({});
  const [myEventsOpen, setMyEventsOpen] = useState(true);
  const [attCounts, setAttCounts] = useState({});
  const [eventAttendees, setEventAttendees] = useState({}); // eventId -> [profiles]
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [form, setForm] = useState({title:"",description:"",location:"",event_date:"",max_attendees:"",industry_tags:[],cover_url:""});
  const coverInputRef = useRef();

  async function load() {
    try {
      const {data:evs,error}=await supabase.from("events").select("*, creator:profiles(name,id)").order("event_date");
      // Always include demo events (they show as past events) alongside any real events
      const realEvents = (error||!evs) ? [] : evs;
      setEvents([...realEvents, ...DEMO_EVENTS]);
      if(realEvents.length>0){
        // Load all attendees with their profile info + status
        const {data:att}=await supabase.from("event_attendees")
          .select("event_id, user_id, status, attended, profile:profiles(id,name,email,mobile,avatar_url,role,location)");
        const counts={}, byEvent={}, mine={}, pendingByEvent={};
        (att||[]).forEach(a=>{
          const st=a.status||"approved";
          if(st==="approved"){
            counts[a.event_id]=(counts[a.event_id]||0)+1;
            if(!byEvent[a.event_id]) byEvent[a.event_id]=[];
            if(a.profile) byEvent[a.event_id].push({...a.profile, attended:a.attended||false});
          } else if(st==="pending"){
            if(!pendingByEvent[a.event_id]) pendingByEvent[a.event_id]=[];
            if(a.profile) pendingByEvent[a.event_id].push(a.profile);
          }
          if(user && a.user_id===user.id) mine[a.event_id]=st;
        });
        setAttCounts(counts); setEventAttendees(byEvent); setAttSet(mine); setPendingAtt(pendingByEvent);
      }
    } catch(e){ setEvents(DEMO_EVENTS); }
    setLoading(false);
  }
  useEffect(()=>{ load(); },[user]);

  function openCreate() {
    if(requireAuth && !requireAuth()) return;
    if(!isApproved){showToast("Your account is pending admin approval","error");return;}
    setEditingId(null);
    setForm({title:"",description:"",location:"",event_date:"",max_attendees:"",industry_tags:[],cover_url:""});
    setShowForm(true);
  }

  function openEdit(ev) {
    setEditingId(ev.id);
    setForm({
      title:ev.title||"", description:ev.description||"", location:ev.location||"",
      event_date:ev.event_date?new Date(ev.event_date).toISOString().slice(0,16):"",
      max_attendees:ev.max_attendees||"", industry_tags:ev.industry_tags||[], cover_url:ev.cover_url||""
    });
    setSelectedEvent(null);
    setShowForm(true);
  }

  async function handleCoverUpload(e) {
    const file=e.target.files?.[0];
    if(!file) return;
    setUploadingCover(true);
    try {
      const url=await uploadImage(file,"event-covers",user.id+"-"+Date.now());
      setForm(f=>({...f,cover_url:url}));
      showToast("Cover image uploaded ✓");
    } catch(err){ showToast(err.message||"Upload failed — make sure the 'event-covers' bucket exists","error"); }
    setUploadingCover(false);
  }

  async function createEvent() {
    if(!form.title||!form.event_date){showToast("Title & date required","error");return;}
    setSaving(true);
    try {
      const payload={title:form.title,description:form.description,location:form.location,event_date:form.event_date,max_attendees:parseInt(form.max_attendees)||null,industry_tags:form.industry_tags,cover_url:form.cover_url||null};
      if(editingId){
        await supabase.from("events").update(payload).eq("id",editingId);
        showToast("Event updated ✓");
      } else {
        await supabase.from("events").insert({...payload,creator_id:user.id,is_approved: isAdmin?true:false});
        showToast(isAdmin?"Event created ✓":"Event submitted — awaiting admin approval ✓");
      }
      setShowForm(false); setEditingId(null);
      setForm({title:"",description:"",location:"",event_date:"",max_attendees:"",industry_tags:[],cover_url:""});
      load();
    } catch(e){showToast(e.message,"error");}
    setSaving(false);
  }

  async function deleteEvent(id) {
    try {
      await supabase.from("events").delete().eq("id",id);
      showToast("Event deleted"); setSelectedEvent(null); load();
    } catch(e){showToast(e.message,"error");}
  }

  async function toggleAttend(evId) {
    if(requireAuth && !requireAuth()) return;
    if(!isApproved){showToast("Your account is pending admin approval","error");return;}
    if(typeof evId==="string"&&evId.startsWith("e")){showToast("Demo event — real events you create are fully functional 😊");return;}
    const myStatus=attSet[evId];
    try {
      if(isViewAs){
        if(myStatus){ showToast("To cancel, exit view-as.","error"); return; }
        await adminAction({action:"register_event", targetUserId:user.id, eventId:evId});
        showToast("Registered on behalf — awaiting host approval ✓"); load(); return;
      }
      if(myStatus){ await supabase.from("event_attendees").delete().eq("event_id",evId).eq("user_id",user.id); showToast("Registration cancelled"); }
      else { await supabase.from("event_attendees").insert({event_id:evId,user_id:user.id,status:"pending"}); showToast("Registration sent — awaiting host approval ✓"); }
      load();
    } catch(e){showToast(e.message,"error");}
  }

  async function respondToAttendee(evId, userId, status) {
    try {
      if(isViewAs){
        await adminAction({action:"respond_registration", targetUserId:user.id, eventId:evId, attendeeId:userId, status});
        showToast(status==="approved"?"Attendee approved (on behalf) ✓":"Registration declined"); load(); return;
      }
      if(status==="approved"){ await supabase.from("event_attendees").update({status:"approved"}).eq("event_id",evId).eq("user_id",userId); showToast("Attendee approved ✓"); }
      else { await supabase.from("event_attendees").delete().eq("event_id",evId).eq("user_id",userId); showToast("Registration declined"); }
      load();
    } catch(e){showToast(e.message,"error");}
  }

  async function toggleAttended(evId, userId, cur) {
    await supabase.from("event_attendees").update({attended:!cur}).eq("event_id",evId).eq("user_id",userId);
    setEventAttendees(prev=>{
      const list=(prev[evId]||[]).map(a=>a.id===userId?{...a,attended:!cur}:a);
      return {...prev,[evId]:list};
    });
  }

  async function approveEvent(evId){
    await supabase.from("events").update({is_approved:true}).eq("id",evId);
    showToast("Event approved — now visible to everyone ✓"); load();
  }

  const now=new Date();
  const filtered = events.filter(ev=>{
    const q=search.toLowerCase();
    const matchesSearch = !search || (ev.title||"").toLowerCase().includes(q)||(ev.description||"").toLowerCase().includes(q)||(ev.location||"").toLowerCase().includes(q);
    const matchesState = !filterState || (ev.location||"").toUpperCase().includes(filterState);
    let matchesDate = true;
    if(filterDate){
      const ed = new Date(ev.event_date);
      const today = new Date(); today.setHours(0,0,0,0);
      const todayEnd = new Date(today); todayEnd.setHours(23,59,59,999);
      const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate()+7);
      const monthEnd = new Date(today); monthEnd.setMonth(monthEnd.getMonth()+1);
      if(filterDate==="today") matchesDate = ed>=today && ed<=todayEnd;
      else if(filterDate==="week") matchesDate = ed>=today && ed<=weekEnd;
      else if(filterDate==="month") matchesDate = ed>=today && ed<=monthEnd;
      else if(filterDate==="future") matchesDate = ed>=today;
      else if(filterDate==="past") matchesDate = ed<today;
    }
    return matchesSearch && matchesState && matchesDate;
  });

  const isDemo = (ev)=>typeof ev.id==="string"&&ev.id.startsWith("e");
  const isCreator = (ev) => user && ev.creator_id===user.id;       // host of this event
  const canManage = (ev) => user && (ev.creator_id===user.id || isAdmin); // edit/delete rights
  const ownsEvent = canManage; // keep existing references working for edit/delete/attendees
  const cntOf = (ev) => ev.attendee_count || attCounts[ev.id] || 0;
  const isFuture = (ev) => new Date(ev.event_date) >= now;

  // Events I created (to manage attendees + tick attendance)
  const myCreatedEvents = filtered.filter(ev=>user && ev.creator_id===user.id);
  // Events pending admin approval (admins see these to approve)
  const pendingApprovalEvents = filtered.filter(ev=>!isDemo(ev) && ev.is_approved===false);
  // Public (approved) events, split future/past
  const publicEvents = filtered.filter(ev=> isDemo(ev) || ev.is_approved!==false );
  const futureEvents = publicEvents.filter(isFuture);
  const pastEvents = publicEvents.filter(ev=>!isFuture(ev));

  return (
    <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-14}} transition={{duration:0.28}} className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold leading-tight" style={{background:"linear-gradient(135deg,#7cb9e8,#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            Community<br/>Events
          </h1>
          <p className="text-white/45 text-sm mt-1">Discover and join networking events in our community</p>
        </div>
        {isApproved&&(
          <PrimaryBtn onClick={()=>showForm?setShowForm(false):openCreate()} small>
            {showForm?"✕ Cancel":"+ Create Event"}
          </PrimaryBtn>
        )}
      </div>

      {/* Create / Edit Form */}
      <AnimatePresence>
        {showForm&&(
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} style={{overflow:"hidden"}}>
            <Card className="p-5 space-y-4">
              <div className="text-white font-bold text-base">{editingId?"Edit Event":"Create New Event"}</div>

              {/* Cover image upload */}
              <div className="space-y-1.5">
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Cover Image</label>
                {form.cover_url ? (
                  <div className="relative rounded-2xl overflow-hidden" style={{aspectRatio:"16/9"}}>
                    <img src={form.cover_url} alt="cover" className="w-full h-full object-cover"/>
                    <button onClick={()=>setForm(f=>({...f,cover_url:""}))}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-white" style={{background:"rgba(0,0,0,0.6)"}}>✕</button>
                  </div>
                ) : (
                  <button onClick={()=>coverInputRef.current?.click()} disabled={uploadingCover}
                    className="w-full rounded-2xl flex flex-col items-center justify-center gap-2 py-8 transition-all hover:bg-white/[0.04]"
                    style={{background:"rgba(255,255,255,0.03)",border:`2px dashed ${BORDER}`}}>
                    {uploadingCover
                      ? <svg className="w-6 h-6 animate-spin text-white/40" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                      : <><span className="text-2xl">🖼️</span><span className="text-white/40 text-sm">Tap to upload cover image</span></>}
                  </button>
                )}
                <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden"/>
              </div>

              {[["Title","title","text","Event title…"]].map(([lb,k,t,ph])=>(
                <div key={k} className="space-y-1.5">
                  <label className="text-white/40 text-xs font-medium uppercase tracking-wider">{lb}</label>
                  <input type={t} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={ph}
                    className="w-full rounded-2xl px-4 py-3 text-white placeholder-white/25 focus:outline-none"
                    style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
                </div>
              ))}
              {/* Event location — Australian address autocomplete */}
              <div className="space-y-1.5">
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Location (Australia only)</label>
                <AddressAutocomplete value={form.location} onChange={(v)=>setForm(f=>({...f,location:v}))} placeholder="Search venue or street address…"/>
                <p className="text-white/25 text-xs">Start typing — pick a suggested Australian address.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Max Attendees</label>
                <input type="number" value={form.max_attendees} onChange={e=>setForm(f=>({...f,max_attendees:e.target.value}))} placeholder="50"
                  className="w-full rounded-2xl px-4 py-3 text-white placeholder-white/25 focus:outline-none"
                  style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
              </div>
              <div className="space-y-1.5">
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Description</label>
                <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="What's this event about?" rows={3}
                  className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none resize-none"
                  style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`}}/>
              </div>
              <div className="space-y-1.5">
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Date & Time</label>
                <input type="datetime-local" value={form.event_date} onChange={e=>setForm(f=>({...f,event_date:e.target.value}))}
                  className="w-full rounded-2xl px-4 py-3 text-sm text-white focus:outline-none"
                  style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,colorScheme:"dark"}}/>
              </div>
              <PrimaryBtn onClick={createEvent} loading={saving} className="w-full">{editingId?"Save Changes":"Create Event"}</PrimaryBtn>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + filters */}
      <Card className="p-4 space-y-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search events by title, description, location..."/>
        <div className="flex gap-2">
          <select value={filterState} onChange={e=>setFilterState(e.target.value)}
            className="flex-1 rounded-2xl px-3 py-2.5 text-sm focus:outline-none"
            style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`,color:filterState?"white":"rgba(255,255,255,0.4)",colorScheme:"dark"}}>
            <option value="">📍 All Locations</option>
            {["VIC","NSW","QLD","WA","SA","ACT","TAS","NT"].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterDate} onChange={e=>setFilterDate(e.target.value)}
            className="flex-1 rounded-2xl px-3 py-2.5 text-sm focus:outline-none"
            style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`,color:filterDate?"white":"rgba(255,255,255,0.4)",colorScheme:"dark"}}>
            <option value="">📅 All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="future">Upcoming</option>
            <option value="past">Past Events</option>
          </select>
        </div>
        {(filterState||filterDate||search)&&(
          <button onClick={()=>{setSearch("");setFilterState("");setFilterDate("");}} className="text-white/40 text-xs hover:text-white/70 transition-colors">✕ Clear filters</button>
        )}
      </Card>

      {/* Events List */}
      <div>
        {(()=>{
          const renderCard = (ev,i) => {
            const past=new Date(ev.event_date)<now;
            const myStatus=attSet[ev.id]; // undefined | "pending" | "approved"
            const attending=!!myStatus;
            const cnt=cntOf(ev);
            const full=ev.max_attendees&&cnt>=ev.max_attendees;
            const spotsLeft = ev.max_attendees ? ev.max_attendees - cnt : null;
            return (
              <motion.div key={ev.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}>
                <Card className={`overflow-hidden cursor-pointer transition-all hover:border-white/20 ${past?"opacity-50":""}`}>
                  {ev.cover_url&&(
                    <div onClick={()=>setSelectedEvent({...ev,attending,cnt,full,past,spotsLeft})} className="w-full overflow-hidden" style={{aspectRatio:"16/9"}}>
                      <img src={ev.cover_url} alt={ev.title} className="w-full h-full object-cover"/>
                    </div>
                  )}
                  <div className="p-5">
                    <div onClick={()=>setSelectedEvent({...ev,attending,cnt,full,past,spotsLeft})}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-white text-base mb-1">{ev.title}</div>
                        {ownsEvent(ev)&&<span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{background:"rgba(124,111,224,0.15)",color:"#a78bfa"}}>Your event</span>}
                      </div>
                      <div className="text-white/40 text-sm mb-3">Hosted by {ev.creator?.name||"Community"}</div>
                      {ev.description&&<p className="text-white/50 text-sm leading-relaxed mb-4 line-clamp-2">{ev.description}</p>}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-white/45 text-sm">
                          <span>📅</span> {fmtDate(ev.event_date)}
                          <span className="ml-2">🕐</span> {fmtTime(ev.event_date)}
                        </div>
                        {ev.location&&<div className="flex items-center gap-2 text-white/45 text-sm"><span>📍</span>{ev.location}</div>}
                        <div className="flex items-center gap-2 text-white/45 text-sm">
                          <span>👥</span> {cnt}{ev.max_attendees?` / ${ev.max_attendees}`:""} attending
                          {spotsLeft!=null && spotsLeft>0 && !past && <span className="text-emerald-400/70 text-xs ml-1">· {spotsLeft} spots left</span>}
                          {full && !past && <span className="text-red-400/70 text-xs ml-1">· Full</span>}
                        </div>
                      </div>
                      {ev.industry_tags?.length>0&&(
                        <div className="flex flex-wrap gap-2 mb-4">{ev.industry_tags.map(t=><SkillChip key={t} label={t}/>)}</div>
                      )}
                    </div>
                    {ownsEvent(ev)&&(
                      <OutlineBtn onClick={()=>setSelectedEvent({...ev,attending,cnt,full,past,spotsLeft})} className="w-full mb-2" small>
                        👥 View Attendees ({cnt})
                      </OutlineBtn>
                    )}
                    {ownsEvent(ev)&&!past&&(
                      <OutlineBtn onClick={()=>openEdit(ev)} className="w-full mb-2" small>✎ Edit Event</OutlineBtn>
                    )}
                    {!past&&!isCreator(ev)&&(
                      myStatus==="approved"
                        ? <OutlineBtn onClick={()=>toggleAttend(ev.id)} className="w-full" small>✓ Registered — Cancel</OutlineBtn>
                        : myStatus==="pending"
                        ? <OutlineBtn onClick={()=>toggleAttend(ev.id)} className="w-full" small>⏳ Awaiting Host Approval — Cancel</OutlineBtn>
                        : <PrimaryBtn onClick={()=>toggleAttend(ev.id)} className="w-full" disabled={!!full}>
                            {full?"Event Full":"Register to Attend"}
                          </PrimaryBtn>
                    )}
                    {past&&<div className="text-center text-white/30 text-sm py-2">This event has ended</div>}
                  </div>
                </Card>
              </motion.div>
            );
          };
          return (
            <>
              {loading&&<div className="text-center text-white/30 py-12 text-sm">Loading events…</div>}

              {/* PENDING ADMIN APPROVAL (admins only) */}
              {isAdmin&&pendingApprovalEvents.length>0&&(
                <div className="mb-8">
                  <SectionLabel
                    icon={<span className="text-amber-400">⏳</span>}
                    text="Pending Approval" count={pendingApprovalEvents.length}/>
                  <div className="space-y-4">{pendingApprovalEvents.map((ev,i)=>(
                    <Card key={ev.id} className="p-4" style={{border:"1px solid rgba(245,158,11,0.3)"}}>
                      <div className="text-white font-bold">{ev.title}</div>
                      <div className="text-white/45 text-sm mb-1">by {ev.creator?.name||"Unknown"} · 📍 {ev.location||"TBA"}</div>
                      <div className="text-white/35 text-xs mb-3">{ev.event_date?new Date(ev.event_date).toLocaleString():""}</div>
                      <div className="flex gap-2">
                        <PrimaryBtn onClick={()=>approveEvent(ev.id)} small className="flex-1">✓ Approve Event</PrimaryBtn>
                        <OutlineBtn onClick={()=>deleteEvent(ev.id)} small className="flex-1">✕ Reject</OutlineBtn>
                      </div>
                    </Card>
                  ))}</div>
                </div>
              )}

              {/* MY EVENTS (created by me) — toggizable, with registration requests + attendance ticking */}
              {myCreatedEvents.length>0&&(
                <div className="mb-8">
                  <button onClick={()=>setMyEventsOpen(o=>!o)} className="w-full flex items-center justify-between mb-3">
                    <SectionLabel
                      icon={<svg className="w-5 h-5" style={{color:"#a78bfa"}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>}
                      text="My Events" count={myCreatedEvents.length}/>
                    <span className="text-white/40 text-lg">{myEventsOpen?"▾":"▸"}</span>
                  </button>
                  {myEventsOpen&&(
                    <>
                      {/* pending registration requests for my events */}
                      {myCreatedEvents.map(ev=>{
                        const pend=pendingAtt[ev.id]||[];
                        if(pend.length===0) return null;
                        return (
                          <Card key={"pend-"+ev.id} className="p-4 mb-3" style={{border:"1px solid rgba(245,158,11,0.3)"}}>
                            <div className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">🔔 {pend.length} pending registration{pend.length>1?"s":""} — {ev.title}</div>
                            <div className="space-y-2">{pend.map(pr=>(
                              <div key={pr.id} className="flex items-center gap-3">
                                <Av name={pr.name} url={pr.avatar_url} color={pal(pr.id)} size="xs" ring/>
                                <div className="flex-1 min-w-0"><div className="text-white text-sm font-semibold truncate">{pr.name}</div><div className="text-white/40 text-xs truncate">{pr.role}{pr.location?` · ${pr.location}`:""}</div></div>
                                <button onClick={()=>respondToAttendee(ev.id,pr.id,"approved")} className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white" style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)"}}>✓ Approve</button>
                                <button onClick={()=>respondToAttendee(ev.id,pr.id,"declined")} className="px-3 py-1.5 rounded-xl text-xs font-semibold" style={{background:"rgba(239,68,68,0.12)",color:"#f87171"}}>✕</button>
                              </div>
                            ))}</div>
                          </Card>
                        );
                      })}
                      <div className="space-y-4">{myCreatedEvents.map(renderCard)}</div>
                    </>
                  )}
                </div>
              )}

              {/* FUTURE EVENTS */}
              <div className="mb-8">
                <SectionLabel
                  icon={<svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
                  text="Future Events" count={futureEvents.length}/>
                {futureEvents.length===0
                  ? <div className="text-white/30 text-sm text-center py-6">No upcoming events.</div>
                  : <div className="space-y-4">{futureEvents.map(renderCard)}</div>}
              </div>

              {/* PAST EVENTS */}
              {pastEvents.length>0&&(
                <div>
                  <SectionLabel
                    icon={<span className="text-white/40">🕓</span>}
                    text="Past Events" count={pastEvents.length}/>
                  <div className="space-y-4" style={{opacity:0.7}}>{pastEvents.map(renderCard)}</div>
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-[80] flex items-end md:items-center justify-center bg-black/70 p-0 md:p-4"
            onClick={e=>e.target===e.currentTarget&&setSelectedEvent(null)}>
            <motion.div initial={{y:60}} animate={{y:0}} exit={{y:60}}
              className="w-full max-w-lg overflow-y-auto rounded-t-3xl md:rounded-3xl mb-[72px] md:mb-0"
              style={{maxHeight:"78vh",background:"#0f1320",border:`1px solid ${BORDER}`}}>
              {/* Cover image (if any) */}
              {selectedEvent.cover_url&&(
                <div className="relative w-full overflow-hidden" style={{aspectRatio:"16/9"}}>
                  <img src={selectedEvent.cover_url} alt={selectedEvent.title} className="w-full h-full object-cover"/>
                  <button onClick={()=>setSelectedEvent(null)}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-white transition-all" style={{background:"rgba(0,0,0,0.5)"}}>✕</button>
                </div>
              )}
              {/* Modal header banner */}
              <div className="relative p-6 pb-5" style={selectedEvent.cover_url?{}:{background:"linear-gradient(135deg,rgba(124,111,224,0.25),rgba(167,139,250,0.12))"}}>
                {!selectedEvent.cover_url&&(
                  <button onClick={()=>setSelectedEvent(null)}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-all" style={{background:"rgba(0,0,0,0.3)"}}>✕</button>
                )}
                {selectedEvent.industry_tags?.length>0&&(
                  <div className="flex flex-wrap gap-2 mb-3">{selectedEvent.industry_tags.map(t=><SkillChip key={t} label={t}/>)}</div>
                )}
                <h2 className="text-2xl font-bold text-white leading-tight">{selectedEvent.title}</h2>
                <div className="text-white/55 text-sm mt-1.5">Hosted by {selectedEvent.creator?.name||"Community"}</div>
              </div>

              <div className="p-6 space-y-5">
                {/* Status badge */}
                <div className="flex items-center gap-2">
                  {selectedEvent.past
                    ? <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{background:"rgba(239,68,68,0.15)",color:"#f87171"}}>● Event Ended</span>
                    : selectedEvent.attending
                    ? <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{background:"rgba(16,185,129,0.15)",color:"#34d399"}}>✓ You're Registered</span>
                    : selectedEvent.full
                    ? <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{background:"rgba(239,68,68,0.15)",color:"#f87171"}}>● Fully Booked</span>
                    : <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{background:"rgba(16,185,129,0.15)",color:"#34d399"}}>● Open for Registration</span>}
                </div>

                {/* Description */}
                <div>
                  <div className="text-white/35 text-xs font-semibold uppercase tracking-wider mb-2">About this event</div>
                  <p className="text-white/70 text-sm leading-relaxed">{selectedEvent.description||"No description provided."}</p>
                </div>

                {/* Details grid */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-2xl" style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`}}>
                    <span className="text-xl">📅</span>
                    <div><div className="text-white/40 text-xs">Date</div><div className="text-white text-sm font-medium">{fmtDate(selectedEvent.event_date)}</div></div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-2xl" style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`}}>
                    <span className="text-xl">🕐</span>
                    <div><div className="text-white/40 text-xs">Time</div><div className="text-white text-sm font-medium">{fmtTime(selectedEvent.event_date)}</div></div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-2xl" style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`}}>
                    <span className="text-xl">📍</span>
                    <div><div className="text-white/40 text-xs">Location</div><div className="text-white text-sm font-medium">{selectedEvent.location||"TBA"}</div></div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-2xl" style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`}}>
                    <span className="text-xl">👥</span>
                    <div className="flex-1">
                      <div className="text-white/40 text-xs">Attendance</div>
                      <div className="text-white text-sm font-medium">
                        {selectedEvent.cnt}{selectedEvent.max_attendees?` of ${selectedEvent.max_attendees}`:""} registered
                      </div>
                      {selectedEvent.max_attendees&&(
                        <div className="mt-2">
                          <div className="h-1.5 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.08)"}}>
                            <div className="h-full rounded-full" style={{width:`${Math.min(100,(selectedEvent.cnt/selectedEvent.max_attendees)*100)}%`,background:selectedEvent.full?"#f87171":"linear-gradient(90deg,#7c6fe0,#a78bfa)"}}/>
                          </div>
                          <div className="text-white/35 text-xs mt-1">{selectedEvent.spotsLeft>0?`${selectedEvent.spotsLeft} spots remaining`:"No spots available"}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Attendee list — visible to event owner */}
                {ownsEvent(selectedEvent)&&(
                  <div>
                    <div className="text-white/35 text-xs font-semibold uppercase tracking-wider mb-3">
                      Attendees ({(eventAttendees[selectedEvent.id]||[]).length}) · tap ✓ to mark attendance
                    </div>
                    {(eventAttendees[selectedEvent.id]||[]).length===0 ? (
                      <div className="text-white/30 text-sm py-3 text-center rounded-2xl" style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${BORDER}`}}>
                        No one has registered yet
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {(eventAttendees[selectedEvent.id]||[]).map(att=>(
                          <div key={att.id} className="flex items-center gap-3 p-3 rounded-2xl" style={{background:att.attended?"rgba(16,185,129,0.08)":"rgba(255,255,255,0.03)",border:att.attended?"1px solid rgba(16,185,129,0.25)":`1px solid ${BORDER}`}}>
                            <Av name={att.name} url={att.avatar_url} color={pal(att.id)} size="sm" ring/>
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-sm font-semibold truncate">{att.name||"Unnamed"}</div>
                              <div className="text-white/40 text-xs truncate">{att.role||"Member"}{att.location?` · ${att.location}`:""}</div>
                              <div className="text-white/50 text-xs mt-0.5 truncate">📧 {att.email}{att.mobile?`  ·  📱 ${att.mobile}`:""}</div>
                            </div>
                            <button onClick={()=>toggleAttended(selectedEvent.id,att.id,att.attended)}
                              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all"
                              style={att.attended?{background:"linear-gradient(135deg,#10b981,#34d399)",color:"#fff"}:{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,color:"rgba(255,255,255,0.4)"}}
                              title={att.attended?"Attended":"Mark as attended"}>
                              ✓
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Owner controls */}
                {ownsEvent(selectedEvent)&&(
                  <div className="flex gap-2">
                    <OutlineBtn onClick={()=>openEdit(selectedEvent)} className="flex-1">✎ Edit</OutlineBtn>
                    <button onClick={()=>{ if(confirm("Delete this event?")) deleteEvent(selectedEvent.id); }}
                      className="flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all"
                      style={{border:"1px solid rgba(239,68,68,0.4)",color:"#f87171",background:"rgba(239,68,68,0.08)"}}>🗑 Delete</button>
                  </div>
                )}

                {/* Action */}
                {!selectedEvent.past&&!isCreator(selectedEvent)&&(
                  selectedEvent.attending
                    ? <OutlineBtn onClick={()=>{toggleAttend(selectedEvent.id);setSelectedEvent(null);}} className="w-full">✓ Cancel Registration</OutlineBtn>
                    : <PrimaryBtn onClick={()=>{toggleAttend(selectedEvent.id);setSelectedEvent(null);}} className="w-full" disabled={!!selectedEvent.full}>
                        {selectedEvent.full?"Event Full":"Register to Attend"}
                      </PrimaryBtn>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════
// MY PROJECTS — create/edit/delete multiple projects (3 for users, 100 for admins)
// ════════════════════════════════════════════════════════
function MyProjects({ user, isAdmin, showToast }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // project being edited, or "new"
  const [saving, setSaving] = useState(false);
  const blank = {project_name:"",project_pitch:"",project_industry:"",project_stage:"",funding_status:"",team_size:"",project_website:"",roles_needed:[]};
  const [f, setF] = useState(blank);
  const LIMIT = isAdmin ? 100 : 3;

  async function load() {
    if(!user) return;
    const {data} = await supabase.from("projects").select("*").eq("owner_id",user.id).order("created_at",{ascending:false});
    setProjects(data||[]); setLoading(false);
  }
  useEffect(()=>{ load(); },[user]);

  function startNew() {
    if(projects.length>=LIMIT){ showToast(`You've reached your limit of ${LIMIT} project${LIMIT>1?"s":""}.`,"error"); return; }
    setF(blank); setEditing("new");
  }
  function startEdit(p) {
    setF({project_name:p.project_name||"",project_pitch:p.project_pitch||"",project_industry:p.project_industry||"",project_stage:p.project_stage||"",funding_status:p.funding_status||"",team_size:p.team_size||"",project_website:p.project_website||"",roles_needed:p.roles_needed||[]});
    setEditing(p.id);
  }

  async function saveProject() {
    if(!f.project_name.trim()){ showToast("Project name is required","error"); return; }
    setSaving(true);
    try {
      const payload={owner_id:user.id,project_name:f.project_name,project_pitch:f.project_pitch,project_industry:f.project_industry,project_stage:f.project_stage,funding_status:f.funding_status,team_size:parseInt(f.team_size)||null,project_website:f.project_website,roles_needed:f.roles_needed};
      if(editing==="new"){
        const {error}=await supabase.from("projects").insert(payload); if(error) throw error;
        showToast("Project created ✓");
      } else {
        const {error}=await supabase.from("projects").update(payload).eq("id",editing); if(error) throw error;
        showToast("Project updated ✓");
      }
      setEditing(null); load();
    } catch(e){ showToast(e.message,"error"); }
    setSaving(false);
  }

  async function del(id) {
    if(!confirm("Delete this project?")) return;
    const {error}=await supabase.from("projects").delete().eq("id",id);
    if(error){ showToast(error.message,"error"); return; }
    showToast("Project deleted"); load();
  }

  if(editing){
    return (
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-white font-bold">{editing==="new"?"New Project":"Edit Project"}</span>
          <button onClick={()=>setEditing(null)} className="text-white/40 text-sm">✕ Cancel</button>
        </div>
        <div className="space-y-1.5">
          <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Project Name</label>
          <input value={f.project_name} onChange={e=>setF(x=>({...x,project_name:e.target.value}))} placeholder="HealthAI Platform"
            className="w-full rounded-2xl px-4 py-3 text-white placeholder-white/25 focus:outline-none" style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
        </div>
        <div className="space-y-1.5">
          <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Elevator Pitch</label>
          <textarea value={f.project_pitch} onChange={e=>setF(x=>({...x,project_pitch:e.target.value}))} placeholder="Problem → Solution → Why now?" rows={4}
            className="w-full rounded-2xl px-4 py-3 text-white placeholder-white/25 focus:outline-none resize-none" style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
        </div>
        <div className="space-y-1.5">
          <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Industry</label>
          <div className="flex flex-wrap gap-2">{INDUSTRIES.map(ind=>(
            <button key={ind} onClick={()=>setF(x=>({...x,project_industry:ind}))} className="px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all" style={f.project_industry===ind?{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",color:"#fff"}:{background:CARD_BG,border:`1px solid ${BORDER}`,color:"rgba(255,255,255,0.45)"}}>{ind}</button>
          ))}</div>
        </div>
        <div className="space-y-1.5">
          <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Stage</label>
          <div className="flex flex-wrap gap-2">{["Idea","Prototype","MVP","Launched","Revenue","Scaling"].map(st=>(
            <button key={st} onClick={()=>setF(x=>({...x,project_stage:st}))} className="px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all" style={f.project_stage===st?{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",color:"#fff"}:{background:CARD_BG,border:`1px solid ${BORDER}`,color:"rgba(255,255,255,0.45)"}}>{st}</button>
          ))}</div>
        </div>
        <div className="space-y-1.5">
          <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Funding Status</label>
          <div className="flex flex-wrap gap-2">{["Bootstrapped","Pre-seed","Seed","Series A+","Grant funded","Seeking investment"].map(fn=>(
            <button key={fn} onClick={()=>setF(x=>({...x,funding_status:fn}))} className="px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all" style={f.funding_status===fn?{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",color:"#fff"}:{background:CARD_BG,border:`1px solid ${BORDER}`,color:"rgba(255,255,255,0.45)"}}>{fn}</button>
          ))}</div>
        </div>
        <div className="space-y-1.5">
          <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Team Size</label>
          <input type="number" value={f.team_size} onChange={e=>setF(x=>({...x,team_size:e.target.value}))} placeholder="1" className="w-full rounded-2xl px-4 py-3 text-white placeholder-white/25 focus:outline-none" style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
        </div>
        <div className="space-y-1.5">
          <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Project Website</label>
          <input value={f.project_website} onChange={e=>setF(x=>({...x,project_website:e.target.value}))} placeholder="https://yourproject.com" className="w-full rounded-2xl px-4 py-3 text-white placeholder-white/25 focus:outline-none" style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
        </div>
        <div className="space-y-2">
          <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Looking For (select all that apply)</label>
          <div className="flex flex-wrap gap-2">{PARTNER_ROLES.map(r=>{
            const sel=f.roles_needed?.includes(r);
            return <button key={r} onClick={()=>setF(x=>({...x,roles_needed:sel?x.roles_needed.filter(y=>y!==r):[...(x.roles_needed||[]),r]}))} className="px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all" style={sel?{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",color:"#fff"}:{background:CARD_BG,border:`1px solid ${BORDER}`,color:"rgba(255,255,255,0.45)"}}>{sel?"✓ ":""}{r}</button>;
          })}</div>
        </div>
        <PrimaryBtn onClick={saveProject} loading={saving} className="w-full">{editing==="new"?"Create Project":"Save Changes"}</PrimaryBtn>
      </Card>
    );
  }

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-white font-bold">My Projects</span>
          <span className="text-white/35 text-xs ml-2">{projects.length}/{LIMIT}</span>
        </div>
        <button onClick={startNew} className="px-3 py-1.5 rounded-xl text-sm font-semibold text-white" style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)"}}>+ New</button>
      </div>
      {loading&&<div className="text-white/30 text-sm text-center py-4">Loading…</div>}
      {!loading&&projects.length===0&&<div className="text-white/30 text-sm text-center py-6">No projects yet. Tap "+ New" to add one.</div>}
      {projects.map(p=>(
        <div key={p.id} className="p-3 rounded-2xl" style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`}}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-white font-semibold text-sm">{p.project_name}</div>
              {p.project_industry&&<span className="text-purple-300 text-xs">{p.project_industry}</span>}
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <button onClick={()=>startEdit(p)} className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{background:"rgba(124,111,224,0.15)",color:"#a78bfa"}}>Edit</button>
              <button onClick={()=>del(p.id)} className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{background:"rgba(239,68,68,0.12)",color:"#f87171"}}>Delete</button>
            </div>
          </div>
          {p.project_pitch&&<p className="text-white/50 text-xs mt-1.5 line-clamp-2">{p.project_pitch}</p>}
          {p.roles_needed?.length>0&&<div className="flex flex-wrap gap-1 mt-2">{p.roles_needed.map(r=><span key={r} className="px-2 py-0.5 rounded-full text-[10px]" style={{background:"rgba(124,111,224,0.15)",color:"#a78bfa"}}>{r}</span>)}</div>}
        </div>
      ))}
    </Card>
  );
}

// ════════════════════════════════════════════════════════
// PROJECT JOIN REQUESTS (shown in Profile → Project)
// ════════════════════════════════════════════════════════
function ProjectJoinRequests({ user, showToast }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if(!user) return;
    const {data} = await supabase.from("project_requests").select("*, project:projects(project_name)").eq("owner_id",user.id);
    const reqs = data||[];
    if(reqs.length){
      const {data:profs} = await supabase.from("profiles").select("*").in("id", reqs.map(r=>r.from_user_id));
      setRequests(reqs.map(r=>({...r, sender:(profs||[]).find(p=>p.id===r.from_user_id)})).filter(r=>r.sender));
    } else setRequests([]);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[user]);

  async function respond(id,status){
    const {error}=await supabase.from("project_requests").update({status}).eq("id",id);
    if(error){showToast(error.message,"error");return;}
    showToast(status==="accepted"?"Accepted! Contact details now shared ✓":"Request declined");
    load();
  }

  const pending = requests.filter(r=>r.status==="pending");
  const accepted = requests.filter(r=>r.status==="accepted");

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-amber-400">🔔</span>
        <span className="text-white font-bold text-base">Join Requests to My Project</span>
        {pending.length>0&&<span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{background:"rgba(245,158,11,0.2)",color:"#fbbf24"}}>{pending.length}</span>}
      </div>

      {loading&&<div className="text-white/30 text-sm text-center py-4">Loading…</div>}
      {!loading&&requests.length===0&&<div className="text-white/30 text-sm text-center py-4">No one has requested to join your project yet</div>}

      {pending.map(req=>{
        const s=req.sender;
        return (
          <div key={req.id} className="p-3 rounded-2xl" style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`}}>
            <div className="flex items-start gap-3">
              <Av name={s.name} url={s.avatar_url} color={pal(s.id)} size="sm" ring/>
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-sm">{s.name}</div>
                <div className="text-white/40 text-xs">{s.role}{s.location?` · ${s.location}`:""}</div>
                {req.role_applied&&<div className="text-purple-300 text-xs mt-1">wants to join <strong>{req.project?.project_name||"your project"}</strong> as <strong>{req.role_applied}</strong></div>}
                {s.skills?.length>0&&<div className="flex flex-wrap gap-1 mt-2">{s.skills.slice(0,3).map(sk=><SkillChip key={sk} label={sk}/>)}</div>}
                <div className="flex gap-2 mt-3">
                  <PrimaryBtn onClick={()=>respond(req.id,"accepted")} small className="flex-1">✓ Accept</PrimaryBtn>
                  <OutlineBtn onClick={()=>respond(req.id,"declined")} small className="flex-1">✕ Reject</OutlineBtn>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {accepted.length>0&&(
        <div className="space-y-2 pt-2">
          <div className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">✓ Accepted Members</div>
          {accepted.map(req=>{
            const s=req.sender;
            return (
              <div key={req.id} className="p-3 rounded-2xl" style={{background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.2)"}}>
                <div className="flex items-center gap-3">
                  <Av name={s.name} url={s.avatar_url} color={pal(s.id)} size="sm" ring/>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold text-sm">{s.name}{req.role_applied?` · ${req.role_applied}`:""}</div>
                    <div className="text-white/55 text-xs mt-0.5">📧 {s.email}{s.mobile?`  ·  📱 ${s.mobile}`:""}</div>
                    {s.whatsapp&&<a href={`https://wa.me/${s.whatsapp.replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" className="text-green-400 text-xs">💬 WhatsApp</a>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ════════════════════════════════════════════════════════
// PROJECTS TAB — browse & join others' projects
// ════════════════════════════════════════════════════════
function ProjectsTab({ user, profile, isApproved, showToast, requireAuth, isAdmin, isViewAs }) {
  const [search, setSearch] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [projects, setProjects] = useState([]);
  const [myRequests, setMyRequests] = useState({}); // owner_id -> request
  const [selected, setSelected] = useState(null);
  const [roleModal, setRoleModal] = useState(null); // project to apply to

  async function load() {
    // Projects now live in their own table; join owner profile for person info
    const {data} = await supabase.from("projects")
      .select("*, owner:profiles(id,name,role,avatar_url,location,email,mobile,whatsapp,linkedin_url,website_url)")
      .order("created_at",{ascending:false});
    setProjects((data||[]).filter(p=>p.owner_id!==user?.id));
    if(user){
      const {data:reqs} = await supabase.from("project_requests").select("*").eq("from_user_id",user.id);
      const m={}; (reqs||[]).forEach(r=>{ m[r.project_id]=r; }); setMyRequests(m);
    }
  }
  useEffect(()=>{ load(); },[user]);

  const filtered = projects.filter(p=>{
    const q=search.toLowerCase();
    const matchesSearch=!search||(p.project_name||"").toLowerCase().includes(q)||(p.project_pitch||"").toLowerCase().includes(q)||(p.owner?.name||"").toLowerCase().includes(q)||(p.owner?.location||"").toLowerCase().includes(q);
    const matchesIndustry=!filterIndustry||p.project_industry===filterIndustry;
    const matchesRole=!filterRole||(p.roles_needed||[]).includes(filterRole);
    return matchesSearch&&matchesIndustry&&matchesRole;
  });

  async function requestJoin(p, role) {
    if(requireAuth && !requireAuth()) return;
    if(!isApproved){showToast("Your account is pending admin approval","error");return;}
    try {
      if(isViewAs){
        await adminAction({action:"join_project", targetUserId:user.id, projectId:p.id, ownerId:p.owner_id, roleApplied:role});
        showToast(`Join request sent to ${p.project_name} (on behalf) ✓`); setRoleModal(null);
        const {data:reqs} = await supabase.from("project_requests").select("*").eq("from_user_id",user.id);
        const m={}; (reqs||[]).forEach(r=>{ m[r.project_id]=r; }); setMyRequests(m);
        return;
      }
      const {data,error}=await supabase.from("project_requests").insert({from_user_id:user.id,project_id:p.id,owner_id:p.owner_id,role_applied:role}).select().single();
      if(error) throw error;
      setMyRequests(m=>({...m,[p.id]:data}));
      showToast(`Request sent to join ${p.project_name} ✓`);
      if(p.owner?.email) sendEmail("join_request", p.owner.email, { fromName: profile?.name||"A member", projectName: p.project_name, role });
      setRoleModal(null);
    } catch(e){showToast(e.message||"Error","error");}
  }

  return (
    <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-14}} transition={{duration:0.28}} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold leading-tight" style={{background:"linear-gradient(135deg,#7cb9e8,#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Discover Projects</h1>
        <p className="text-white/45 text-sm mt-1">Find projects to join and request to partner up</p>
      </div>

      {/* Search + filter */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1"><SearchBar value={search} onChange={setSearch} placeholder="Search projects by name, pitch, founder..."/></div>
          <button onClick={()=>setShowFilters(!showFilters)} className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 transition-all" style={showFilters||filterIndustry||filterRole?{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)"}:{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`}}>⚙</button>
        </div>
        <AnimatePresence>
          {showFilters&&(
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} style={{overflow:"hidden"}}>
              <Card className="p-4 space-y-3">
                <div>
                  <div className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Industry</div>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={()=>setFilterIndustry("")} className="px-3 py-1 rounded-full text-xs font-medium transition-all" style={!filterIndustry?{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",color:"#fff"}:{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.5)",border:`1px solid ${BORDER}`}}>All</button>
                    {INDUSTRIES.map(ind=>(<button key={ind} onClick={()=>setFilterIndustry(filterIndustry===ind?"":ind)} className="px-3 py-1 rounded-full text-xs font-medium transition-all" style={filterIndustry===ind?{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",color:"#fff"}:{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.5)",border:`1px solid ${BORDER}`}}>{ind}</button>))}
                  </div>
                </div>
                <div>
                  <div className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Role Needed</div>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={()=>setFilterRole("")} className="px-3 py-1 rounded-full text-xs font-medium transition-all" style={!filterRole?{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",color:"#fff"}:{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.5)",border:`1px solid ${BORDER}`}}>All</button>
                    {PARTNER_ROLES.map(r=>(<button key={r} onClick={()=>setFilterRole(filterRole===r?"":r)} className="px-3 py-1 rounded-full text-xs font-medium transition-all" style={filterRole===r?{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",color:"#fff"}:{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.5)",border:`1px solid ${BORDER}`}}>{r}</button>))}
                  </div>
                </div>
                {(filterIndustry||filterRole)&&<button onClick={()=>{setFilterIndustry("");setFilterRole("");}} className="text-white/40 text-xs hover:text-white/70">✕ Clear filters</button>}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Project cards */}
      <div className="space-y-4">
        {filtered.length===0&&<div className="text-white/30 text-sm text-center py-10">No projects found. Be the first to add yours in Profile → Project!</div>}
        {filtered.map((p,i)=>{
          const req=myRequests[p.id];
          const status=req?.status;
          return (
            <motion.div key={p.id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}>
              <Card className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <button onClick={()=>setSelected(p)}><Av name={p.owner?.name} url={p.owner?.avatar_url} color={pal(p.owner_id)} size="md" ring/></button>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-base">{p.project_name}</div>
                    <div className="text-white/45 text-sm">by {p.owner?.name}{p.owner?.role?` · ${p.owner.role}`:""}</div>
                    {p.owner?.location&&<div className="text-white/35 text-xs mt-0.5">📍 {p.owner.location}</div>}
                  </div>
                  {p.project_industry&&<SkillChip label={p.project_industry}/>}
                </div>
                {p.project_pitch&&<p className="text-white/50 text-sm leading-relaxed mb-3 line-clamp-3">{p.project_pitch}</p>}
                {(p.project_stage||p.funding_status||p.team_size)&&(
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {p.project_stage&&<span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.6)",border:`1px solid ${BORDER}`}}>📈 {p.project_stage}</span>}
                    {p.funding_status&&<span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.6)",border:`1px solid ${BORDER}`}}>💰 {p.funding_status}</span>}
                    {p.team_size&&<span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.6)",border:`1px solid ${BORDER}`}}>👥 {p.team_size}</span>}
                  </div>
                )}
                {p.roles_needed?.length>0&&(
                  <div className="mb-4">
                    <div className="text-white/35 text-xs uppercase tracking-wider mb-1.5">Looking for</div>
                    <div className="flex flex-wrap gap-1.5">{p.roles_needed.map(r=><span key={r} className="px-2.5 py-1 rounded-full text-xs font-medium" style={{background:"rgba(124,111,224,0.15)",color:"#a78bfa",border:"1px solid rgba(124,111,224,0.25)"}}>{r}</span>)}</div>
                  </div>
                )}
                {status==="accepted"?(
                  <div className="p-3 rounded-2xl" style={{background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)"}}>
                    <div className="text-emerald-400 text-xs font-semibold mb-1">✓ You've joined — contact revealed</div>
                    <div className="text-white/60 text-xs">📧 {p.owner?.email}{p.owner?.mobile?`  ·  📱 ${p.owner.mobile}`:""}</div>
                    {p.owner?.whatsapp&&<a href={`https://wa.me/${p.owner.whatsapp.replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" className="text-green-400 text-xs">💬 WhatsApp</a>}
                  </div>
                ):status==="pending"?(
                  <PrimaryBtn disabled className="w-full">⏳ Request Pending</PrimaryBtn>
                ):status==="declined"?(
                  <PrimaryBtn disabled className="w-full">Request Declined</PrimaryBtn>
                ):(
                  <PrimaryBtn onClick={()=>{ if(requireAuth&&!requireAuth())return; setRoleModal(p); }} className="w-full">🤝 Request to Join</PrimaryBtn>
                )}
                <button onClick={()=>setSelected(p)} className="w-full mt-2 text-white/40 hover:text-white/70 text-xs transition-colors">View full profile →</button>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Role selection modal */}
      <AnimatePresence>
        {roleModal&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[85] flex items-end md:items-center justify-center bg-black/80 p-0 md:p-4" onClick={e=>e.target===e.currentTarget&&setRoleModal(null)}>
            <motion.div initial={{y:60}} animate={{y:0}} exit={{y:60}} className="w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-6 mb-[72px] md:mb-0" style={{background:"#0f1320",border:`1px solid ${BORDER}`}}>
              <div className="text-white font-bold text-lg mb-1">Join {roleModal.project_name}</div>
              <div className="text-white/45 text-sm mb-4">Which role are you applying for?</div>
              <div className="flex flex-wrap gap-2 mb-5">
                {(roleModal.roles_needed?.length?roleModal.roles_needed:PARTNER_ROLES).map(r=>(
                  <button key={r} onClick={()=>requestJoin(roleModal,r)} className="px-3 py-2 rounded-2xl text-sm font-semibold transition-all" style={{background:CARD_BG,border:`1px solid ${BORDER}`,color:"#a78bfa"}}>{r}</button>
                ))}
              </div>
              <OutlineBtn onClick={()=>setRoleModal(null)} className="w-full">Cancel</OutlineBtn>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{selected&&<ProfileModal p={{...selected.owner, project_name:selected.project_name, project_pitch:selected.project_pitch, project_industry:selected.project_industry}} onClose={()=>setSelected(null)} matchState={myRequests[selected.id]} user={user} isAdmin={isAdmin} showToast={showToast} onRequest={()=>setRoleModal(selected)} onLoginRequired={()=>{setSelected(null);requireAuth&&requireAuth();}}/>}</AnimatePresence>
    </motion.div>
  );
}


// ════════════════════════════════════════════════════════
// PROFILE TAB
// ════════════════════════════════════════════════════════
function ProfileTab({ user, profile, setProfile, showToast, isApproved }) {
  const [form, setForm] = useState({name:"",bio:"",experience:"",location:"",skills:[],mobile:"",role:"",project_name:"",project_pitch:"",project_industry:"",linkedin_url:"",website_url:"",whatsapp:"",roles_needed:[],business_name:"",wechat:"",headline:"",availability:"",project_stage:"",project_website:"",team_size:"",funding_status:""});
  const [newSkill, setNewSkill] = useState("");
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState("identity");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef();

  useEffect(()=>{
    if(profile) setForm({name:profile.name||"",bio:profile.bio||"",experience:profile.experience||"",location:profile.location||"",skills:profile.skills||[],mobile:profile.mobile||"",role:profile.role||"",project_name:profile.project_name||"",project_pitch:profile.project_pitch||"",project_industry:profile.project_industry||"",linkedin_url:profile.linkedin_url||"",website_url:profile.website_url||"",whatsapp:profile.whatsapp||"",roles_needed:profile.roles_needed||[],business_name:profile.business_name||"",wechat:profile.wechat||"",headline:profile.headline||"",availability:profile.availability||"",project_stage:profile.project_stage||"",project_website:profile.project_website||"",team_size:profile.team_size||"",funding_status:profile.funding_status||""});
  },[profile]);

  const pitchScore=(()=>{let s=0;if(form.project_name?.length>3)s+=25;if(form.project_pitch?.length>20)s+=30;if(form.project_pitch?.length>80)s+=20;if(form.project_industry)s+=25;return Math.min(s,100);})();

  async function handleAvatarUpload(e) {
    const file=e.target.files?.[0];
    if(!file) return;
    setUploadingAvatar(true);
    try {
      const url=await uploadImage(file,"avatars",user.id);
      await supabase.from("profiles").update({avatar_url:url}).eq("id",user.id);
      setProfile(p=>({...p,avatar_url:url}));
      showToast("Profile picture updated ✓");
    } catch(err){ showToast(err.message||"Upload failed — make sure the 'avatars' storage bucket exists","error"); }
    setUploadingAvatar(false);
  }

  async function save() {
    setSaving(true);
    try {
      // Validate WhatsApp — AU only (+61)
      if(form.whatsapp && !form.whatsapp.replace(/\s/g,"").match(/^\+61[0-9]{8,9}$/)){
        showToast("WhatsApp must be an Australian number starting with +61","error");
        setSaving(false); return;
      }
      const {error}=await supabase.from("profiles").update({name:form.name,bio:form.bio,experience:parseInt(form.experience)||0,location:form.location,skills:form.skills,mobile:form.mobile,role:form.role,project_name:form.project_name,project_pitch:form.project_pitch,project_industry:form.project_industry,linkedin_url:form.linkedin_url,website_url:form.website_url,whatsapp:form.whatsapp,roles_needed:form.roles_needed,business_name:form.business_name,wechat:form.wechat,headline:form.headline,availability:form.availability,project_stage:form.project_stage,project_website:form.project_website,team_size:form.team_size,funding_status:form.funding_status,updated_at:new Date().toISOString()}).eq("id",user.id);
      if(error) throw error;
      setProfile(p=>({...p,...form})); showToast("Profile saved ✓");
    } catch(e){showToast(e.message,"error");}
    setSaving(false);
  }

  function addSkill(e){if(e.key==="Enter"&&newSkill.trim()&&!form.skills.includes(newSkill.trim())){setForm(f=>({...f,skills:[...f.skills,newSkill.trim()]}));setNewSkill("");}}
  const color=pal(user?.id);

  if(!user) return (
    <div className="text-center py-20">
      <div className="text-4xl mb-4">👤</div>
      <div className="text-white/50 text-sm">Sign in to view your profile</div>
    </div>
  );

  return (
    <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-14}} transition={{duration:0.28}} className="space-y-5">
      <h1 className="text-3xl font-bold" style={{background:"linear-gradient(135deg,#7cb9e8,#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>My Profile</h1>

      {/* Profile card */}
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <Av name={form.name||profile?.name} url={profile?.avatar_url} color={color} size="xl" ring/>
            <button onClick={()=>avatarInputRef.current?.click()} disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs transition-all"
              style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",border:"2px solid #0a0e1a",boxShadow:"0 2px 8px rgba(0,0,0,0.4)"}}>
              {uploadingAvatar?<svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>:"📷"}
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden"/>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-lg">{form.name||"Your Name"}</div>
            <div className="text-white/40 text-sm">{user?.email}</div>
            <div className="flex flex-wrap gap-2 mt-2">
              {isApproved
                ?<span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{background:"rgba(16,185,129,0.15)",color:"#34d399",border:"1px solid rgba(16,185,129,0.3)"}}>✓ Approved</span>
                :<span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{background:"rgba(245,158,11,0.15)",color:"#fbbf24",border:"1px solid rgba(245,158,11,0.3)"}}>Pending Approval</span>}
              {profile?.is_admin&&<span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{background:"rgba(124,111,224,0.15)",color:"#a78bfa",border:"1px solid rgba(124,111,224,0.3)"}}>Admin</span>}
            </div>
            <button onClick={()=>avatarInputRef.current?.click()} className="text-white/40 hover:text-white/70 text-xs mt-2 transition-colors">📷 Change photo</button>
          </div>
        </div>
      </Card>

      {/* My Digital Business Card */}
      <button onClick={()=>{
        window.location.href=`${window.location.origin}${window.location.pathname}?card=${user.id}`;
      }}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-white transition-all"
        style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",boxShadow:"0 8px 24px rgba(124,111,224,0.35)"}}>
        💳 My Digital Business Card
      </button>
      <button onClick={()=>{
        const url=`${window.location.origin}${window.location.pathname}?card=${user.id}`;
        navigator.clipboard.writeText(url); showToast("Card link copied — share it anywhere ✓");
      }}
        className="w-full -mt-2 py-2 text-white/40 hover:text-white/70 text-xs transition-colors">
        🔗 Copy my card link
      </button>

      {/* Profile completeness meter */}
      {(()=>{
        const checks=[
          ["Photo",!!profile?.avatar_url],["Name",!!form.name],["Role",!!form.role],
          ["Location",!!form.location],["Bio",!!form.bio],["Skills",(form.skills||[]).length>0],
          ["Contact",!!form.mobile||!!form.whatsapp],["A project",false],
        ];
        const done=checks.filter(c=>c[1]).length;
        const pct=Math.round((done/checks.length)*100);
        const missing=checks.filter(c=>!c[1]).map(c=>c[0]);
        if(pct>=100) return null;
        return (
          <Card className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-semibold text-sm">Profile {pct}% complete</span>
              <span className="text-white/35 text-xs">{done}/{checks.length}</span>
            </div>
            <div className="h-2 rounded-full mb-3" style={{background:"rgba(255,255,255,0.07)"}}>
              <motion.div className="h-full rounded-full" style={{background:"linear-gradient(90deg,#7c6fe0,#a78bfa)",width:`${pct}%`}} animate={{width:`${pct}%`}}/>
            </div>
            {missing.length>0&&<p className="text-white/45 text-xs">A complete profile ranks higher in Match and gets more responses. Still to add: <span className="text-purple-300">{missing.join(", ")}</span></p>}
          </Card>
        );
      })()}

      {/* Section tabs */}
      <div className="flex gap-2">
        {[["identity","Identity"],["project","Project"],["contact","Contact"]].map(([id,lb])=>(
          <button key={id} onClick={()=>setSection(id)}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all"
            style={section===id?{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",color:"#fff",boxShadow:"0 4px 16px rgba(124,111,224,0.3)"}:{background:CARD_BG,border:`1px solid ${BORDER}`,color:"rgba(255,255,255,0.45)"}}>
            {lb}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {section==="identity"&&(
          <motion.div key="id" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-4">
            <Card className="p-5 space-y-4">
              {[["Full Name","name","text","Your name"],["Role / Title","role","text","CEO, CTO, Designer…"]].map(([lb,k,t,ph])=>(
                <div key={k} className="space-y-1.5">
                  <label className="text-white/40 text-xs font-medium uppercase tracking-wider">{lb}</label>
                  <input type={t} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={ph}
                    className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none"
                    style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`}}/>
                </div>
              ))}
              {/* Location — Australian suburb (auto-fills state) */}
              <div className="space-y-1.5">
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Suburb (Australia)</label>
                <SuburbAutocomplete value={form.location} onChange={(v)=>setForm(f=>({...f,location:v}))} showToast={showToast}/>
                <p className="text-white/25 text-xs">Type your suburb and select — the state fills in automatically.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Years Experience</label>
                <input type="number" value={form.experience} onChange={e=>setForm(f=>({...f,experience:e.target.value}))} placeholder="5"
                  className="w-full rounded-2xl px-4 py-3 text-white placeholder-white/25 focus:outline-none"
                  style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
              </div>
              <div className="space-y-1.5">
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Bio</label>
                <textarea value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))} placeholder="What are you building and why?" rows={3}
                  className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none resize-none"
                  style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`}}/>
              </div>
              <div className="space-y-1.5">
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Skills (Enter to add)</label>
                <div className="flex flex-wrap gap-2 mb-2">{form.skills.map((s,i)=>(
                  <button key={i} onClick={()=>setForm(f=>({...f,skills:f.skills.filter((_,j)=>j!==i)}))}
                    className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5"
                    style={{background:"rgba(124,111,224,0.15)",color:"#a78bfa",border:"1px solid rgba(124,111,224,0.25)"}}>
                    {s} <span className="opacity-50">×</span>
                  </button>
                ))}</div>
                <input value={newSkill} onChange={e=>setNewSkill(e.target.value)} onKeyDown={addSkill} placeholder="e.g. React, Fundraising, AI/ML…"
                  className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none"
                  style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`}}/>
              </div>
              <div className="space-y-1.5">
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Headline / Tagline</label>
                <input value={form.headline} onChange={e=>setForm(f=>({...f,headline:e.target.value}))} placeholder="One-line summary, e.g. 'Technical founder looking for a CMO'"
                  className="w-full rounded-2xl px-4 py-3 text-white placeholder-white/25 focus:outline-none"
                  style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
              </div>
              <div className="space-y-1.5">
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Availability</label>
                <div className="flex flex-wrap gap-2">{["Full-time","Part-time","Weekends","Advisory","Just exploring"].map(a=>(
                  <button key={a} onClick={()=>setForm(f=>({...f,availability:a}))}
                    className="px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all"
                    style={form.availability===a?{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",color:"#fff"}:{background:CARD_BG,border:`1px solid ${BORDER}`,color:"rgba(255,255,255,0.45)"}}>
                    {a}
                  </button>
                ))}</div>
              </div>
            </Card>
          </motion.div>
        )}
        {section==="project"&&(
          <motion.div key="proj" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-4">
            <MyProjects user={user} isAdmin={profile?.is_admin} showToast={showToast}/>
            <ProjectJoinRequests user={user} showToast={showToast}/>
          </motion.div>
        )}
        {section==="contact"&&(
          <motion.div key="ct" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between"><span className="text-white font-bold">Contact & Social</span><span className="text-white/30 text-xs px-2.5 py-1 rounded-full" style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`}}>🔒 Private details: mutual match only</span></div>
              <div className="space-y-1.5">
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Email (from Google)</label>
                <input value={user?.email||""} disabled className="w-full rounded-2xl px-4 py-3 text-sm opacity-50 cursor-not-allowed" style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`,color:"rgba(255,255,255,0.5)"}}/>
              </div>
              <div className="space-y-1.5">
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Mobile</label>
                <input value={form.mobile} onChange={e=>setForm(f=>({...f,mobile:e.target.value}))} placeholder="+61 4XX XXX XXX"
                  className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none"
                  style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`}}/>
              </div>
              <div className="space-y-1.5">
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider">WhatsApp (AU only — +61)</label>
                <input value={form.whatsapp} onChange={e=>setForm(f=>({...f,whatsapp:e.target.value}))} placeholder="+61 4XX XXX XXX"
                  className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none"
                  style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`}}/>
                <p className="text-white/25 text-xs">Must start with +61. WhatsApp icon will appear on your profile when filled in.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider">LinkedIn URL</label>
                <input value={form.linkedin_url} onChange={e=>setForm(f=>({...f,linkedin_url:e.target.value}))} placeholder="https://linkedin.com/in/yourname"
                  className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none"
                  style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`}}/>
              </div>
              <div className="space-y-1.5">
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Business Website</label>
                <input value={form.website_url} onChange={e=>setForm(f=>({...f,website_url:e.target.value}))} placeholder="https://yourbusiness.com.au"
                  className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none"
                  style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`}}/>
              </div>
              <div className="space-y-1.5">
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Business Name</label>
                <input value={form.business_name} onChange={e=>setForm(f=>({...f,business_name:e.target.value}))} placeholder="Your company name"
                  className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none"
                  style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`}}/>
              </div>
              <div className="space-y-1.5">
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider">WeChat ID</label>
                <input value={form.wechat} onChange={e=>setForm(f=>({...f,wechat:e.target.value}))} placeholder="your_wechat_id"
                  className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none"
                  style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`}}/>
                <p className="text-white/25 text-xs">Business Name, WeChat & the fields above are shared when you send your Contact Card in chat.</p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <PrimaryBtn onClick={save} loading={saving} className="w-full">Save Profile</PrimaryBtn>

      {/* Social links display */}
      {(profile?.linkedin_url||profile?.website_url||profile?.whatsapp)&&(
        <Card className="p-4">
          <div className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">Your Links</div>
          <div className="flex flex-wrap gap-2">
            {profile?.linkedin_url&&<a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-semibold transition-all" style={{background:"rgba(10,102,194,0.2)",color:"#60a5fa",border:"1px solid rgba(10,102,194,0.3)"}}>🔗 LinkedIn</a>}
            {profile?.website_url&&<a href={profile.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-semibold transition-all" style={{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.6)",border:`1px solid ${BORDER}`}}>🌐 Website</a>}
            {profile?.whatsapp&&<a href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-semibold transition-all" style={{background:"rgba(37,211,102,0.15)",color:"#4ade80",border:"1px solid rgba(37,211,102,0.3)"}}>💬 WhatsApp</a>}
          </div>
        </Card>
      )}

      {/* Logout */}
      <button onClick={()=>supabase.auth.signOut()}
        className="w-full py-3.5 rounded-2xl text-sm font-semibold transition-all"
        style={{border:"1px solid rgba(239,68,68,0.3)",color:"rgba(239,68,68,0.7)",background:"rgba(239,68,68,0.06)"}}>
        Sign Out
      </button>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════
// MANAGE TAB (Admin only)
// ════════════════════════════════════════════════════════
function ManageTab({ showToast, onViewAs }) {
  const [users,setUsers]=useState([]); const [loading,setLoading]=useState(true); const [filter,setFilter]=useState("all");
  async function load(){ const{data,error}=await supabase.from("profiles").select("*").order("created_at",{ascending:false}); if(!error) setUsers(data||[]); setLoading(false); }
  useEffect(()=>{ load(); },[]);

  async function toggleApprove(id,cur){
    const {error}=await supabase.from("profiles").update({is_approved:!cur}).eq("id",id);
    if(error){ showToast("DB error: "+error.message+" — run the admin RLS fix SQL","error"); return; }
    setUsers(u=>u.map(x=>x.id===id?{...x,is_approved:!cur}:x));
    showToast(!cur?"✓ Approved — user can now access the platform":"Approval revoked");
  }
  async function toggleAdmin(id,cur){
    const {error}=await supabase.from("profiles").update({is_admin:!cur}).eq("id",id);
    if(error){ showToast("DB error: "+error.message,"error"); return; }
    setUsers(u=>u.map(x=>x.id===id?{...x,is_admin:!cur}:x));
    showToast(!cur?"⭐ Admin granted — user is now a Core Member":"Admin role removed");
  }
  const filtered=filter==="pending"?users.filter(u=>!u.is_approved):filter==="approved"?users.filter(u=>u.is_approved):users;
  return (
    <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-14}} className="space-y-5">
      <div><h1 className="text-3xl font-bold" style={{background:"linear-gradient(135deg,#7cb9e8,#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Manage Users</h1><p className="text-white/45 text-sm mt-1">Approve accounts and manage access</p></div>
      <div className="grid grid-cols-3 gap-3">{[["All",users.length],["Pending",users.filter(u=>!u.is_approved).length],["Active",users.filter(u=>u.is_approved).length]].map(([l,c])=>(<Card key={l} className="p-4 text-center"><div className="text-2xl font-bold text-white">{c}</div><div className="text-white/35 text-xs mt-0.5">{l}</div></Card>))}</div>
      <div className="flex gap-2">{["all","pending","approved"].map(f=>(<button key={f} onClick={()=>setFilter(f)} className="flex-1 py-3 rounded-2xl text-sm font-semibold capitalize transition-all" style={filter===f?{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",color:"#fff"}:{background:CARD_BG,border:`1px solid ${BORDER}`,color:"rgba(255,255,255,0.45)"}}>{f}</button>))}</div>
      {loading&&<div className="text-center text-white/30 py-10 text-sm">Loading…</div>}
      <div className="space-y-3">{filtered.map((u,i)=>{const c=pal(u.id);return(
        <motion.div key={u.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}>
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Av name={u.name} url={u.avatar_url} color={c} size="sm" ring/>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-white font-bold text-sm truncate">{u.name||"Unnamed"}</div>
                    <div className="text-white/35 text-xs truncate">{u.email}</div>
                    {u.role&&<div className="text-white/30 text-xs">{u.role}</div>}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {u.is_admin&&<span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{background:"rgba(124,111,224,0.2)",color:"#a78bfa"}}>⭐ Admin</span>}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={u.is_approved?{background:"rgba(16,185,129,0.15)",color:"#34d399"}:{background:"rgba(245,158,11,0.15)",color:"#fbbf24"}}>{u.is_approved?"Active":"Pending"}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <PrimaryBtn onClick={()=>toggleApprove(u.id,u.is_approved)} small className="flex-1">{u.is_approved?"Revoke":"✓ Approve"}</PrimaryBtn>
                  <OutlineBtn onClick={()=>toggleAdmin(u.id,u.is_admin)} small className="flex-1">{u.is_admin?"Remove Admin":"⭐ Make Admin"}</OutlineBtn>
                </div>
                <button onClick={()=>onViewAs&&onViewAs(u)}
                  className="w-full mt-2 py-2.5 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                  style={{background:"rgba(124,111,224,0.12)",border:"1px solid rgba(124,111,224,0.3)",color:"#a78bfa"}}>
                  👁 View as this user
                </button>
              </div>
            </div>
          </Card>
        </motion.div>
      );})}</div>

      {/* User reports */}
      <ReportsPanel showToast={showToast}/>

      {/* SQL fix reminder */}
      <Card className="p-4">
        <div className="text-white/40 text-xs">If approvals aren't saving, run the admin RLS fix SQL in Supabase (see instructions).</div>
      </Card>
    </motion.div>
  );
}

function ReportsPanel({ showToast }) {
  const [reports,setReports]=useState([]);
  const [loaded,setLoaded]=useState(false);
  async function load(){
    try {
      const {data}=await supabase.from("reports")
        .select("*, reporter:profiles!reports_reporter_id_fkey(name), reported:profiles!reports_reported_id_fkey(name)")
        .order("created_at",{ascending:false});
      setReports(data||[]);
    } catch(e){ setReports([]); }
    setLoaded(true);
  }
  useEffect(()=>{ load(); },[]);
  async function dismiss(id){
    await supabase.from("reports").delete().eq("id",id);
    showToast("Report dismissed"); load();
  }
  if(!loaded||reports.length===0) return null;
  return (
    <Card className="p-4 space-y-3" style={{border:"1px solid rgba(239,68,68,0.25)"}}>
      <div className="text-red-400 font-semibold text-sm">⚐ User Reports ({reports.length})</div>
      {reports.map(r=>(
        <div key={r.id} className="p-3 rounded-2xl text-sm" style={{background:"rgba(239,68,68,0.06)",border:`1px solid ${BORDER}`}}>
          <div className="text-white"><strong>{r.reported?.name||"Unknown"}</strong> reported by {r.reporter?.name||"someone"}</div>
          <div className="text-white/55 text-xs mt-1">"{r.reason}"</div>
          <button onClick={()=>dismiss(r.id)} className="text-white/40 hover:text-white/70 text-xs mt-2">✕ Dismiss</button>
        </div>
      ))}
    </Card>
  );
}

// ════════════════════════════════════════════════════════
// ONBOARDING MODAL (new user profile setup)
// ════════════════════════════════════════════════════════
function OnboardingModal({ user, onComplete }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({name:user?.user_metadata?.full_name||"",role:"",location:"",bio:"",skills:[],project_name:"",project_pitch:"",project_industry:"",mobile:"",avatar_url:user?.user_metadata?.avatar_url||""});
  const [newSkill, setNewSkill] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef();

  function addSkill(e){ if(e.key==="Enter"&&newSkill.trim()&&!data.skills.includes(newSkill.trim())){ setData(d=>({...d,skills:[...d.skills,newSkill.trim()]})); setNewSkill(""); } }

  async function handleAvatar(e) {
    const file=e.target.files?.[0];
    if(!file) return;
    setUploadingAvatar(true);
    try {
      const url=await uploadImage(file,"avatars",user.id);
      setData(d=>({...d,avatar_url:url}));
    } catch(err){ alert(err.message||"Upload failed — make sure the 'avatars' storage bucket exists"); }
    setUploadingAvatar(false);
  }

  const canStep1 = data.name.trim() && data.role.trim() && data.location.trim() && data.avatar_url;
  const canStep2 = data.bio.trim() && data.skills.length>0;

  async function finish() {
    setSaving(true);
    await onComplete(data);
    setSaving(false);
  }

  const field = (label,k,ph,type="text") => (
    <div className="space-y-1.5">
      <label className="text-white/40 text-xs font-medium uppercase tracking-wider">{label}</label>
      <input type={type} value={data[k]} onChange={e=>setData(d=>({...d,[k]:e.target.value}))} placeholder={ph}
        className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none"
        style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`}}/>
    </div>
  );

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/80 p-0 md:p-4">
      <motion.div initial={{y:60}} animate={{y:0}} className="w-full max-w-lg overflow-y-auto rounded-t-3xl md:rounded-3xl" style={{maxHeight:"92vh",background:"#0f1320",border:`1px solid ${BORDER}`}}>
        {/* Header */}
        <div className="p-6 pb-4" style={{background:"linear-gradient(135deg,rgba(124,111,224,0.25),rgba(167,139,250,0.12))"}}>
          <div className="text-3xl mb-2">👋</div>
          <h2 className="text-2xl font-bold text-white">Welcome to CoFounder AI!</h2>
          <p className="text-white/55 text-sm mt-1">Let's set up your profile so others can find you. Step {step} of 3.</p>
          {/* Progress */}
          <div className="flex gap-1.5 mt-4">
            {[1,2,3].map(s=>(
              <div key={s} className="flex-1 h-1.5 rounded-full" style={{background:s<=step?"linear-gradient(90deg,#7c6fe0,#a78bfa)":"rgba(255,255,255,0.1)"}}/>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-4">
          <AnimatePresence mode="wait">
            {step===1&&(
              <motion.div key="s1" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-4">
                <div className="text-white font-bold text-lg">About You</div>

                {/* Profile photo — required */}
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full p-0.5" style={{background:data.avatar_url?"linear-gradient(135deg,#7c6fe0,#ec4899,#f59e0b)":"rgba(255,255,255,0.1)"}}>
                      {data.avatar_url
                        ? <img src={data.avatar_url} alt="" className="w-full h-full rounded-full object-cover"/>
                        : <div className="w-full h-full rounded-full flex items-center justify-center text-3xl" style={{background:"rgba(255,255,255,0.05)"}}>📷</div>}
                    </div>
                    <button onClick={()=>avatarInputRef.current?.click()} disabled={uploadingAvatar}
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                      style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",border:"2px solid #0f1320"}}>
                      {uploadingAvatar?<svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>:"+"}
                    </button>
                    <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatar} className="hidden"/>
                  </div>
                  <span className="text-white/40 text-xs">{data.avatar_url?"Looking good! ✓":"Profile photo (required)"}</span>
                </div>

                {field("Full Name","name","Your name")}
                {field("Role / Title","role","e.g. Founder, CTO, Mobile Lender")}
                {field("Location","location","e.g. Melbourne, VIC")}
              </motion.div>
            )}
            {step===2&&(
              <motion.div key="s2" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-4">
                <div className="text-white font-bold text-lg">Your Background</div>
                <div className="space-y-1.5">
                  <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Bio / Background</label>
                  <textarea value={data.bio} onChange={e=>setData(d=>({...d,bio:e.target.value}))} placeholder="Tell us about your professional background and experience…" rows={4}
                    className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none resize-none"
                    style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`}}/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Skills (Enter to add)</label>
                  <div className="flex flex-wrap gap-2 mb-2">{data.skills.map((s,i)=>(
                    <button key={i} onClick={()=>setData(d=>({...d,skills:d.skills.filter((_,j)=>j!==i)}))}
                      className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5" style={{background:"rgba(124,111,224,0.15)",color:"#a78bfa",border:"1px solid rgba(124,111,224,0.25)"}}>
                      {s} <span className="opacity-50">×</span>
                    </button>
                  ))}</div>
                  <input value={newSkill} onChange={e=>setNewSkill(e.target.value)} onKeyDown={addSkill} placeholder="e.g. Property, Lending, Marketing…"
                    className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none"
                    style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`}}/>
                </div>
              </motion.div>
            )}
            {step===3&&(
              <motion.div key="s3" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-4">
                <div className="text-white font-bold text-lg">Your Business / Project</div>
                <p className="text-white/45 text-sm -mt-2">Optional — but helps you find the right co-founder.</p>
                {field("Business / Project Name","project_name","e.g. CBA Mobile Lending")}
                <div className="space-y-1.5">
                  <label className="text-white/40 text-xs font-medium uppercase tracking-wider">What are you looking for?</label>
                  <textarea value={data.project_pitch} onChange={e=>setData(d=>({...d,project_pitch:e.target.value}))} placeholder="e.g. Looking for a referral partner in the property area…" rows={3}
                    className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none resize-none"
                    style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`}}/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Industry</label>
                  <div className="flex flex-wrap gap-2">{INDUSTRIES.map(ind=>(
                    <button key={ind} onClick={()=>setData(d=>({...d,project_industry:ind}))}
                      className="px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all"
                      style={data.project_industry===ind?{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",color:"#fff"}:{background:CARD_BG,border:`1px solid ${BORDER}`,color:"rgba(255,255,255,0.45)"}}>{ind}</button>
                  ))}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nav buttons */}
          <div className="flex gap-3 pt-2">
            {step>1&&<OutlineBtn onClick={()=>setStep(step-1)} className="flex-1">← Back</OutlineBtn>}
            {step<3
              ? <PrimaryBtn onClick={()=>setStep(step+1)} disabled={step===1?!canStep1:!canStep2} className="flex-1">Continue →</PrimaryBtn>
              : <PrimaryBtn onClick={finish} loading={saving} className="flex-1">Complete Setup ✓</PrimaryBtn>}
          </div>
          {step===1&&!canStep1&&<p className="text-white/30 text-xs text-center">Add a photo, name, role and location to continue</p>}
          {step===2&&!canStep2&&<p className="text-white/30 text-xs text-center">Add a bio and at least one skill to continue</p>}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════
// ROOT APP
// ════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════
// PUBLIC DIGITAL BUSINESS CARD — shareable, no login needed
// ════════════════════════════════════════════════════════
function BusinessCardPage({ userId }) {
  const [p, setP] = useState(undefined);
  const [copied, setCopied] = useState(false);
  const cardUrl = `${window.location.origin}${window.location.pathname}?card=${userId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&bgcolor=15-19-32&color=255-255-255&qzone=2&data=${encodeURIComponent(cardUrl)}`;

  useEffect(()=>{
    supabase.from("profiles").select("*").eq("id",userId).single()
      .then(({data})=>setP(data||null)).catch(()=>setP(null));
  },[userId]);

  function saveContact(){
    const nm=(p.name||"").trim();
    const parts=nm.split(/\s+/);
    const first=parts[0]||"";
    const last=parts.slice(1).join(" ")||"";
    const lines=["BEGIN:VCARD","VERSION:3.0"];
    // N (structured) is required by many phones so the name maps correctly
    lines.push(`N:${last};${first};;;`);
    lines.push(`FN:${nm}`);
    if(p.business_name) lines.push(`ORG:${p.business_name}`);
    if(p.role) lines.push(`TITLE:${p.role}`);
    if(p.mobile) lines.push(`TEL;TYPE=CELL,VOICE:${p.mobile}`);
    if(p.whatsapp) lines.push(`TEL;TYPE=CELL:${p.whatsapp}`);
    if(p.email) lines.push(`EMAIL;TYPE=INTERNET:${p.email}`);
    if(p.website_url) lines.push(`URL:${p.website_url}`);
    if(p.linkedin_url) lines.push(`URL;TYPE=LinkedIn:${p.linkedin_url}`);
    if(p.location) lines.push(`ADR;TYPE=WORK:;;${p.location};;;;Australia`);
    if(p.wechat) lines.push(`NOTE:WeChat: ${p.wechat}`);
    lines.push("END:VCARD");
    const blob=new Blob([lines.join("\r\n")],{type:"text/vcard;charset=utf-8"});
    const u=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=u; a.download=`${(nm||"contact").replace(/\s/g,"_")}.vcf`; a.click();
    URL.revokeObjectURL(u);
  }

  async function share(){
    if(navigator.share){ try{ await navigator.share({title:`${p.name} — Digital Business Card`, url:cardUrl}); }catch{} }
    else { navigator.clipboard.writeText(cardUrl); setCopied(true); setTimeout(()=>setCopied(false),2000); }
  }

  if(p===undefined) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:BG}}>
      <motion.div animate={{rotate:360}} transition={{duration:2,repeat:Infinity,ease:"linear"}} className="w-10 h-10 rounded-full border-2 border-transparent" style={{borderTopColor:"#7c6fe0",borderRightColor:"#a78bfa"}}/>
    </div>
  );
  if(p===null) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{background:BG}}>
      <div className="text-white/60 text-lg font-semibold mb-2">Card not found</div>
      <div className="text-white/35 text-sm mb-6">This digital business card doesn't exist or was removed.</div>
      <a href={window.location.origin} className="px-5 py-3 rounded-2xl text-white font-semibold" style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)"}}>Create your own free card</a>
    </div>
  );

  const color=pal(p.id);
  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8" style={{background:BG}}>
      <BgGlow/>
      <div className="w-full max-w-md relative">
        {/* Card */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="rounded-3xl overflow-hidden" style={{background:"#0f1320",border:`1px solid ${BORDER}`,boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}}>
          {/* Header banner */}
          <div className="p-7 pb-6 text-center relative" style={{background:"linear-gradient(135deg,rgba(124,111,224,0.35),rgba(167,139,250,0.12))"}}>
            <div className="flex justify-center mb-4"><Av name={p.name} url={p.avatar_url} color={color} size="2xl" ring/></div>
            <div className="text-white font-bold text-2xl">{p.name}</div>
            {p.role&&<div className="text-white/70 text-sm mt-1">{p.role}</div>}
            {p.business_name&&<div className="text-purple-300 text-sm mt-0.5 font-semibold">{p.business_name}</div>}
            {p.location&&<div className="text-white/45 text-xs mt-2">📍 {p.location}</div>}
            {p.headline&&<div className="text-white/55 text-sm mt-3 italic">"{p.headline}"</div>}
          </div>

          <div className="p-6 space-y-5">
            {p.bio&&<p className="text-white/65 text-sm leading-relaxed text-center">{p.bio}</p>}

            {/* Skills */}
            {p.skills?.length>0&&(
              <div className="flex flex-wrap gap-2 justify-center">{p.skills.map(s=><SkillChip key={s} label={s}/>)}</div>
            )}

            {/* Contact buttons */}
            <div className="space-y-2">
              {p.mobile&&<a href={`tel:${p.mobile}`} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-white/80" style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`}}>📱 <span>{p.mobile}</span></a>}
              {p.email&&<a href={`mailto:${p.email}`} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-white/80" style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`}}>📧 <span className="truncate">{p.email}</span></a>}
              {p.whatsapp&&<a href={`https://wa.me/${p.whatsapp.replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium" style={{background:"rgba(37,211,102,0.12)",border:"1px solid rgba(37,211,102,0.25)",color:"#4ade80"}}>💬 <span>WhatsApp</span></a>}
              {p.wechat&&<div className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-white/80" style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`}}>🟢 <span>WeChat: {p.wechat}</span></div>}
              {p.linkedin_url&&<a href={p.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium" style={{background:"rgba(10,102,194,0.15)",border:"1px solid rgba(10,102,194,0.3)",color:"#60a5fa"}}>🔗 <span>LinkedIn</span></a>}
              {p.website_url&&<a href={p.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-white/80" style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`}}>🌐 <span className="truncate">{p.website_url.replace(/^https?:\/\//,"")}</span></a>}
            </div>

            {/* Save contact */}
            <button onClick={saveContact} className="w-full py-3 rounded-2xl text-white font-semibold" style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)"}}>💾 Save to Contacts</button>

            {/* QR + share */}
            <div className="pt-4 flex flex-col items-center gap-3" style={{borderTop:`1px solid ${BORDER}`}}>
              <div className="text-white/40 text-xs uppercase tracking-wider">Scan to open this card</div>
              <img src={qrUrl} alt="QR code" className="rounded-2xl" width={180} height={180} style={{background:"#0f1320"}}/>
              <button onClick={share} className="w-full py-3 rounded-2xl text-sm font-semibold" style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,color:"white"}}>
                {copied?"✓ Link copied!":"🔗 Share this card"}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Create your own CTA */}
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.3}} className="mt-6 text-center">
          <div className="text-white/50 text-sm mb-3">Want a free digital business card like this?</div>
          <a href={window.location.origin} className="inline-block px-6 py-3.5 rounded-2xl text-white font-bold" style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",boxShadow:"0 8px 24px rgba(124,111,224,0.4)"}}>
            ✨ Create Your Own — Free
          </a>
          <div className="text-white/30 text-xs mt-3">Join our founder community to create yours</div>
        </motion.div>
      </div>
    </div>
  );
}

export default function App() {
  // ── Public Digital Business Card route — no login required ──
  const cardId = new URLSearchParams(window.location.search).get("card");
  if(cardId) return <BusinessCardPage userId={cardId}/>;

  const [session,setSession]=useState(undefined);
  const [profile,setProfile]=useState(null);
  const [tab,setTab]=useState("events");
  const [notif,setNotif]=useState({partner:0,project:0,events:0,messages:0});
  const [toast,setToast]=useState(null);
  const [showOnboard,setShowOnboard]=useState(false);
  const [showLogin,setShowLogin]=useState(false);
  const [viewAs,setViewAs]=useState(null); // admin "view as user" mode — holds the impersonated profile

  const showToast=useCallback((msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),3200); },[]);

  // Load notification counts (pending requests + unread messages) and poll.
  // Placed BEFORE any early return so hook order stays stable.
  useEffect(()=>{
    const uid=session?.user?.id;
    if(!uid){ setNotif({partner:0,project:0,events:0,messages:0}); return; }
    let cancelled=false;
    async function myMatchIds(){
      try { const {data}=await supabase.from("match_requests").select("id").eq("status","accepted").or(`from_user_id.eq.${uid},to_user_id.eq.${uid}`); return (data||[]).map(r=>r.id); }
      catch(e){ return []; }
    }
    async function loadNotif(){
      try {
        const {data:pr}=await supabase.from("match_requests").select("id").eq("to_user_id",uid).eq("status","pending");
        const {data:jr}=await supabase.from("project_requests").select("id").eq("owner_id",uid).eq("status","pending");
        const {data:myEv}=await supabase.from("events").select("id").eq("creator_id",uid);
        let evCount=0;
        if(myEv&&myEv.length){
          const {data:pend}=await supabase.from("event_attendees").select("event_id").in("event_id",myEv.map(e=>e.id)).eq("status","pending");
          evCount=(pend||[]).length;
        }
        const matchIds=await myMatchIds();
        let unreadCount=0;
        if(matchIds.length){
          const {data:unread}=await supabase.from("messages").select("id").neq("sender_id",uid).is("read_at",null).in("match_id",matchIds);
          unreadCount=(unread||[]).length;
        }
        if(!cancelled) setNotif({partner:(pr||[]).length, project:(jr||[]).length, events:evCount, messages:unreadCount});
      } catch(e){}
    }
    loadNotif();
    const iv=setInterval(loadNotif,8000);
    return ()=>{ cancelled=true; clearInterval(iv); };
  },[session]);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{ setSession(session); if(session) loadProfile(session.user); });
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_,s)=>{ setSession(s); if(s) loadProfile(s.user); else{setProfile(null);} });
    return()=>subscription.unsubscribe();
  },[]);

  async function loadProfile(u) {
    let{data}=await supabase.from("profiles").select("*").eq("id",u.id).single();
    let isNew=false;
    if(!data){
      isNew=true;
      const{data:created}=await supabase.from("profiles").upsert({id:u.id,email:u.email,name:u.user_metadata?.full_name||u.email?.split("@")[0],avatar_url:u.user_metadata?.avatar_url,is_admin:u.email===ADMIN_EMAIL,is_approved:u.email===ADMIN_EMAIL}).select().single();
      data=created;
      sendEmail("welcome", u.email, { name: data?.name });
    }
    if(u.email===ADMIN_EMAIL&&!data?.is_admin){ await supabase.from("profiles").update({is_admin:true,is_approved:true}).eq("id",u.id); data={...data,is_admin:true,is_approved:true}; }
    setProfile(data);
    // Show onboarding for new users OR users who haven't filled in their background
    if((isNew || !data?.role || !data?.bio || !(data?.skills?.length)) && u.email!==ADMIN_EMAIL){
      setShowOnboard(true);
    }
  }

  async function completeOnboarding(onboardData) {
    try {
      await supabase.from("profiles").update({...onboardData, updated_at:new Date().toISOString()}).eq("id",session.user.id);
      setProfile(p=>({...p,...onboardData}));
      setShowOnboard(false);
      showToast("Welcome aboard! Your profile is set up ✓");
    } catch(e){ showToast(e.message,"error"); }
  }

  // Is the user fully set up? (signed in + profile complete + has photo)
  function isProfileComplete(p) {
    return !!(p?.role && p?.bio && p?.skills?.length && p?.avatar_url);
  }

  // Gate any action behind login + complete profile.
  // Returns true if allowed to proceed; otherwise opens the right popup and returns false.
  function requireAuth() {
    if(!session?.user){ setShowLogin(true); return false; }
    if(profile && !isProfileComplete(profile) && profile.email!==ADMIN_EMAIL){ setShowOnboard(true); showToastRef.current?.("Please complete your profile & photo first"); return false; }
    return true;
  }
  const showToastRef = useRef();
  showToastRef.current = showToast;

  if(session===undefined) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:BG}}>
      <BgGlow/>
      <motion.div animate={{rotate:360}} transition={{duration:2,repeat:Infinity,ease:"linear"}}
        className="w-12 h-12 rounded-full border-2 border-transparent" style={{borderTopColor:"#7c6fe0",borderRightColor:"#a78bfa"}}/>
    </div>
  );

  const realUser=session?.user;
  const realProfile=profile;
  const realIsAdmin=profile?.is_admin||false;

  // When an admin is "viewing as" another user, the whole app behaves as that user
  const effectiveProfile = viewAs || profile;
  const user = viewAs ? { id:viewAs.id, email:viewAs.email, user_metadata:{ full_name:viewAs.name, avatar_url:viewAs.avatar_url } } : realUser;
  const isApproved = viewAs ? (viewAs.is_approved||false) : (profile?.is_approved||false);
  const isAdmin = viewAs ? false : realIsAdmin; // while impersonating, hide admin powers
  // setProfile that also updates viewAs when impersonating
  const setEffectiveProfile = viewAs ? (updater)=>setViewAs(prev=>typeof updater==="function"?updater(prev):updater) : setProfile;

  function exitViewAs(){ setViewAs(null); setTab("manage"); showToast("Returned to your admin account"); }

  // Nav icons matching the reference image
  const NAV = [
    { id:"events",  label:"Events",  icon:(active)=>(
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active?2.5:2}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    )},
    { id:"matching", label:"Match",  icon:(active)=>(
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active?2.5:2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    )},
    { id:"projects",    label:"Projects",    icon:(active)=>(
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active?2.5:2}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
    ), auth:true},
    { id:"profile", label:"Profile", icon:(active)=>(
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active?2.5:2}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    ), auth:true},
    ...(isAdmin?[{ id:"manage", label:"Admin", icon:(active)=>(
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active?2.5:2}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
    ), auth:true}]:[]),
  ];

  function goTab(id,auth){ if(auth&&!user){setShowLogin(true);return;} setTab(id); }

  // Badge count per tab
  const badgeFor=(id)=>{
    if(viewAs) return 0;
    if(id==="matching") return notif.partner+notif.messages;
    if(id==="projects") return notif.project;
    if(id==="events") return notif.events;
    return 0;
  };

  // Sign-in screen if not logged in and trying to access auth tab
  const needsAuth = NAV.find(n=>n.id===tab)?.auth && !user;

  return (
    <div className="min-h-screen" style={{background:BG}}>
      <BgGlow/>

      {/* Desktop Header */}
      <header className="hidden md:flex items-center justify-between px-8 py-4 sticky top-0 z-20" style={{background:"rgba(10,14,26,0.85)",backdropFilter:"blur(20px)",borderBottom:`1px solid ${BORDER}`}}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)"}}>C</div>
          <span className="text-white font-bold">CoFounder AI</span>
        </div>
        <nav className="flex items-center gap-1">
          {NAV.map(n=>{const active=tab===n.id;return(
            <button key={n.id} onClick={()=>goTab(n.id,n.auth)}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold transition-all"
              style={active?{background:"linear-gradient(135deg,rgba(124,111,224,0.2),rgba(167,139,250,0.12))",color:"#a78bfa",border:"1px solid rgba(124,111,224,0.35)"}:{color:"rgba(255,255,255,0.45)",border:"1px solid transparent"}}>
              <span style={{color:active?"#a78bfa":"rgba(255,255,255,0.35)"}}>{n.icon(active)}</span>{n.label}
              {badgeFor(n.id)>0&&<span className="min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{background:"#ef4444"}}>{badgeFor(n.id)>9?"9+":badgeFor(n.id)}</span>}
            </button>
          );})}
        </nav>
        <div className="flex items-center gap-3">
          {user?(
            <div className="flex items-center gap-2">
              <Av name={effectiveProfile?.name} url={effectiveProfile?.avatar_url} color={pal(user.id)} size="sm" ring/>
              <span className="text-white/60 text-sm">{effectiveProfile?.name?.split(" ")[0]||"You"}</span>
              {!viewAs&&<button onClick={()=>supabase.auth.signOut()} className="text-white/30 hover:text-white/60 text-xs ml-2 transition-colors">Sign out</button>}
            </div>
          ):(
            <PrimaryBtn onClick={()=>setShowLogin(true)} small>
              <GoogleIcon/> Sign in
            </PrimaryBtn>
          )}
        </div>
      </header>

      {/* VIEW AS banner */}
      {viewAs&&(
        <div className="sticky top-0 z-40 flex items-center justify-between gap-3 px-5 py-3" style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)"}}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-white text-lg">👁</span>
            <div className="min-w-0">
              <div className="text-white font-bold text-sm truncate">Viewing as {viewAs.name||viewAs.email}</div>
              <div className="text-white/80 text-xs truncate">Admin view-as mode · changes affect this user</div>
            </div>
          </div>
          <button onClick={exitViewAs} className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap" style={{background:"rgba(0,0,0,0.25)",color:"#fff"}}>
            ✕ Exit
          </button>
        </div>
      )}

      {/* Content */}
      <main className="relative z-10 max-w-lg mx-auto px-5 pt-6 pb-32 md:pb-12 md:pt-8">
        <AnimatePresence mode="wait">
          {needsAuth?(
            <motion.div key="gate" initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} className="text-center py-16">
              <div className="text-5xl mb-4">🔐</div>
              <h2 className="text-white font-bold text-xl mb-2">Sign in required</h2>
              <p className="text-white/40 text-sm mb-8">Access your profile, messages and more</p>
              <PrimaryBtn className="mx-auto" onClick={()=>setShowLogin(true)}>
                <GoogleIcon/> Sign In to Continue
              </PrimaryBtn>
            </motion.div>
          ):tab==="matching"?<MatchTab key="m" user={user} profile={effectiveProfile} isApproved={isApproved} showToast={showToast} requireAuth={requireAuth} isAdmin={isAdmin} isViewAs={!!viewAs}/>
          :tab==="events"?<EventsTab key="e" user={user} isApproved={isApproved} showToast={showToast} requireAuth={requireAuth} isAdmin={isAdmin} isViewAs={!!viewAs}/>
          :tab==="projects"?<ProjectsTab key="pr" user={user} profile={effectiveProfile} isApproved={isApproved} showToast={showToast} requireAuth={requireAuth} isAdmin={isAdmin} isViewAs={!!viewAs}/>
          :tab==="profile"?<ProfileTab key="p" user={user} profile={effectiveProfile} setProfile={setEffectiveProfile} showToast={showToast} isApproved={isApproved}/>
          :tab==="manage"&&realIsAdmin&&!viewAs?<ManageTab key="a" showToast={showToast} onViewAs={(u)=>{setViewAs(u);setTab("profile");showToast(`Now viewing as ${u.name||u.email}`);}}/>
          :null}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav — matching reference image */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30" style={{background:"rgba(10,14,26,0.95)",backdropFilter:"blur(20px)",borderTop:`1px solid ${BORDER}`}}>
        <div className="flex items-center justify-around px-2 py-3">
          {NAV.map(n=>{
            const active=tab===n.id;
            const badge=badgeFor(n.id);
            return (
              <button key={n.id} onClick={()=>goTab(n.id,n.auth)}
                className="flex flex-col items-center gap-1 px-4 py-1 rounded-2xl transition-all min-w-[56px] relative">
                <span className="relative" style={{color:active?"#a78bfa":"rgba(255,255,255,0.35)"}}>
                  {n.icon(active)}
                  {badge>0&&<span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{background:"#ef4444"}}>{badge>9?"9+":badge}</span>}
                </span>
                <span className="text-[10px] font-semibold" style={{color:active?"#a78bfa":"rgba(255,255,255,0.35)"}}>{n.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <AnimatePresence>{showLogin&&!user&&<LoginModal key="login" onClose={()=>setShowLogin(false)}/>}</AnimatePresence>
      <AnimatePresence>{showOnboard&&user&&<OnboardingModal key="onboard" user={user} onComplete={completeOnboarding}/>}</AnimatePresence>
      <AnimatePresence>{toast&&<Toast key="t" msg={toast.msg} type={toast.type}/>}</AnimatePresence>
    </div>
  );
}
