import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xvvjruoeggohktflwnak.supabase.co";
const SUPABASE_ANON = "sb_publishable_Q-vS4CYYvQSsGp0rN8OhwQ_wyDXAC6p";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

const ADMIN_EMAIL = "belvinip@gmail.com";
const INDUSTRIES = ["FinTech","HealthTech","EdTech","Climate","Web3","E-commerce","SaaS","Consumer","DeepTech","Other"];

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
const fd = (days,h=10,m=0) => { const d=new Date(_now); d.setDate(d.getDate()+days); d.setHours(h,m,0,0); return d.toISOString(); };
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

function Av({ name, url, color, size="md", ring=false }) {
  const sz = {xs:"w-8 h-8 text-xs", sm:"w-10 h-10 text-sm", md:"w-12 h-12 text-sm", lg:"w-16 h-16 text-base", xl:"w-20 h-20 text-lg"};
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
function ChatModal({ matchId, other, me, onClose }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef();
  const inputRef = useRef();
  const oc = pal(other?.id);

  useEffect(()=>{
    supabase.from("messages").select("*, sender:profiles(name,avatar_url)").eq("match_id",matchId).order("created_at")
      .then(({data})=>{ setMsgs(data||[]); setLoading(false); }).catch(()=>setLoading(false));
    const iv=setInterval(()=>{
      supabase.from("messages").select("*, sender:profiles(name,avatar_url)").eq("match_id",matchId).order("created_at")
        .then(({data})=>{ if(data) setMsgs(data); }).catch(()=>{});
    },3000);
    inputRef.current?.focus();
    return ()=>clearInterval(iv);
  },[matchId]);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs]);

  async function send() {
    if(!text.trim()||sending) return;
    setSending(true);
    const msg={match_id:matchId,sender_id:me.id,content:text.trim()};
    try {
      const {data}=await supabase.from("messages").insert(msg).select().single();
      if(data) setMsgs(m=>[...m,{...data,sender:{name:me.user_metadata?.full_name||me.email}}]);
      setText("");
    } catch(e){}
    setSending(false);
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <motion.div initial={{y:60}} animate={{y:0}} exit={{y:60}}
        className="w-full max-w-md flex flex-col overflow-hidden rounded-t-3xl md:rounded-3xl"
        style={{height:"72vh",background:"#0f1320",border:`1px solid ${BORDER}`}}>
        <div className="flex items-center gap-3 p-5 border-b" style={{borderColor:BORDER}}>
          <Av name={other?.name} url={other?.avatar_url} color={oc} size="sm" ring/>
          <div className="flex-1"><div className="text-white font-bold">{other?.name}</div><div className="text-emerald-400 text-xs">● Connected</div></div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading&&<div className="text-center text-white/30 py-8 text-sm">Loading…</div>}
          {!loading&&msgs.length===0&&<div className="text-center text-white/30 py-10 text-sm">Start a conversation! 👋</div>}
          {msgs.map((m,i)=>{
            const isMe=m.sender_id===me?.id;
            return (
              <div key={m.id||i} className={`flex gap-2.5 ${isMe?"flex-row-reverse":""}`}>
                {!isMe&&<Av name={m.sender?.name} url={m.sender?.avatar_url} color={oc} size="xs"/>}
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMe?"rounded-tr-sm":"rounded-tl-sm"}`}
                  style={isMe?{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",color:"#fff"}:{background:"rgba(255,255,255,0.07)",border:`1px solid ${BORDER}`,color:"rgba(255,255,255,0.85)"}}>
                  {m.content}
                  <div className="text-[10px] opacity-50 mt-0.5 text-right">{ago(m.created_at||new Date())}</div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef}/>
        </div>
        <div className="p-4 flex gap-3" style={{borderTop:`1px solid ${BORDER}`}}>
          <input ref={inputRef} value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
            placeholder="Type a message…"
            className="flex-1 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none"
            style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`}}/>
          <motion.button onClick={send} disabled={!text.trim()||sending} whileTap={{scale:0.93}}
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white disabled:opacity-40"
            style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)"}}>↑</motion.button>
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

  // Admin editing
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({name:p.name||"",role:p.role||"",bio:p.bio||"",location:p.location||"",skills:p.skills||[],linkedin_url:p.linkedin_url||"",website_url:p.website_url||"",whatsapp:p.whatsapp||""});
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingAv, setUploadingAv] = useState(false);
  const avRef = useRef();
  const [localAvatar, setLocalAvatar] = useState(p.avatar_url);

  async function saveAdminEdit() {
    setSavingEdit(true);
    try {
      await supabase.from("profiles").update(editForm).eq("id",p.id);
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
      await supabase.from("profiles").update({avatar_url:url}).eq("id",p.id);
      setLocalAvatar(url); showToast("Photo updated ✓");
    } catch(e){showToast(e.message,"error");}
    setUploadingAv(false);
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/75 p-0 md:p-4"
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <motion.div initial={{y:60}} animate={{y:0}} exit={{y:60}}
        className="w-full max-w-md overflow-y-auto rounded-t-3xl md:rounded-3xl"
        style={{maxHeight:"90vh",background:"#0f1320",border:`1px solid ${BORDER}`}}>

        {/* Banner */}
        <div className="relative p-6 pb-4" style={{background:"linear-gradient(135deg,rgba(124,111,224,0.25),rgba(167,139,250,0.1))"}}>
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white" style={{background:"rgba(0,0,0,0.3)"}}>✕</button>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Av name={p.name} url={localAvatar} color={color} size="xl" ring/>
              {isAdmin&&<button onClick={()=>avRef.current?.click()} className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full text-white text-xs flex items-center justify-center" style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",border:"2px solid #0f1320"}}>{uploadingAv?"⏳":"📷"}</button>}
              {isAdmin&&<input ref={avRef} type="file" accept="image/*" onChange={adminUploadAvatar} className="hidden"/>}
            </div>
            <div className="flex-1">
              {editing
                ? <input value={editForm.name} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} className="text-white font-bold text-lg bg-transparent border-b border-white/30 focus:outline-none w-full mb-1"/>
                : <div className="text-white font-bold text-lg">{p.name}</div>}
              {editing
                ? <input value={editForm.role} onChange={e=>setEditForm(f=>({...f,role:e.target.value}))} className="text-white/60 text-sm bg-transparent border-b border-white/20 focus:outline-none w-full"/>
                : <div className="text-white/60 text-sm">{p.role}</div>}
              {p.location&&!editing&&<div className="text-white/40 text-xs mt-0.5">📍 {p.location}</div>}
              {editing&&<input value={editForm.location} onChange={e=>setEditForm(f=>({...f,location:e.target.value}))} placeholder="Location" className="text-white/60 text-xs bg-transparent border-b border-white/20 focus:outline-none w-full mt-1"/>}
            </div>
          </div>
          {isAdmin&&(
            <div className="mt-3">
              {editing
                ? <div className="flex gap-2"><PrimaryBtn onClick={saveAdminEdit} loading={savingEdit} small>Save</PrimaryBtn><OutlineBtn onClick={()=>setEditing(false)} small>Cancel</OutlineBtn></div>
                : <OutlineBtn onClick={()=>setEditing(true)} small>✎ Edit Profile</OutlineBtn>}
            </div>
          )}
        </div>

        <div className="p-6 pb-28 md:pb-6 space-y-4">
          {/* Bio */}
          {editing
            ? <div className="space-y-1"><div className="text-white/35 text-xs uppercase tracking-wider">Bio</div><textarea value={editForm.bio} onChange={e=>setEditForm(f=>({...f,bio:e.target.value}))} rows={3} className="w-full rounded-xl px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:outline-none resize-none"/></div>
            : p.bio&&<p className="text-white/65 text-sm leading-relaxed">{p.bio}</p>}

          {/* Project */}
          {(p.project_name||p.project_pitch)&&(
            <div className="p-3 rounded-2xl space-y-1" style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`}}>
              <div className="text-white/40 text-xs">🚀 Project</div>
              {p.project_name&&<div className="text-white font-semibold text-sm">{p.project_name}</div>}
              {p.project_pitch&&<div className="text-white/55 text-xs leading-relaxed">{p.project_pitch}</div>}
              {p.project_industry&&<SkillChip label={p.project_industry}/>}
            </div>
          )}

          {/* Skills */}
          {p.skills?.length>0&&(
            <div>
              <div className="text-white/35 text-xs uppercase tracking-wider mb-2">Skills</div>
              <div className="flex flex-wrap gap-2">{p.skills.map(s=><SkillChip key={s} label={s}/>)}</div>
            </div>
          )}

          {/* Social links (always visible) */}
          {(p.linkedin_url||p.website_url||p.whatsapp)&&(
            <div className="flex flex-wrap gap-2">
              {p.linkedin_url&&<a href={p.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold" style={{background:"rgba(10,102,194,0.2)",color:"#60a5fa",border:"1px solid rgba(10,102,194,0.3)"}}>🔗 LinkedIn</a>}
              {p.website_url&&<a href={p.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold" style={{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.6)",border:`1px solid ${BORDER}`}}>🌐 Website</a>}
              {p.whatsapp&&<a href={`https://wa.me/${p.whatsapp.replace(/[^0-9]/g,"")}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold" style={{background:"rgba(37,211,102,0.15)",color:"#4ade80",border:"1px solid rgba(37,211,102,0.3)"}}>💬 WhatsApp</a>}
            </div>
          )}

          {/* Contact (revealed only after match) */}
          {isAccepted&&(
            <div className="p-3 rounded-2xl" style={{background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)"}}>
              <div className="text-emerald-400 text-xs font-semibold mb-2">✓ Connected — Contact Revealed</div>
              <div className="space-y-1 text-xs text-white/60">
                <div>📧 {p.email}</div>
                {p.mobile&&<div>📱 {p.mobile}</div>}
              </div>
            </div>
          )}

          {/* Admin controls — make/remove admin */}
          {isAdmin&&!isDemo&&(
            <div className="pt-1">
              <div className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-2">Admin Controls</div>
              <div className="flex gap-2">
                <OutlineBtn onClick={async()=>{
                  const newVal=!p.is_admin;
                  const{error}=await supabase.from("profiles").update({is_admin:newVal,...(newVal?{is_approved:true}:{})}).eq("id",p.id);
                  if(error){showToast(error.message,"error");return;}
                  p.is_admin=newVal; if(newVal) p.is_approved=true;
                  showToast(newVal?"⭐ Admin granted — now a Core Member":"Admin removed");
                  onClose();
                }} small className="flex-1">{p.is_admin?"Remove Admin":"⭐ Make Admin"}</OutlineBtn>
                <OutlineBtn onClick={async()=>{
                  const newVal=!p.is_approved;
                  const{error}=await supabase.from("profiles").update({is_approved:newVal}).eq("id",p.id);
                  if(error){showToast(error.message,"error");return;}
                  p.is_approved=newVal;
                  showToast(newVal?"✓ Approved":"Approval revoked");
                  onClose();
                }} small className="flex-1">{p.is_approved?"Revoke Access":"✓ Approve"}</OutlineBtn>
              </div>
            </div>
          )}

          {/* Action — require login if not signed in */}
          {!user&&(
            <PrimaryBtn onClick={()=>{onClose(); onLoginRequired&&onLoginRequired();}} className="w-full">
              Sign in to Send Partnership Request
            </PrimaryBtn>
          )}
          {user&&!isDemo&&(
            isAccepted ? (
              <PrimaryBtn onClick={onClose} className="w-full">✓ Connected</PrimaryBtn>
            ) : isPending&&iSent ? (
              <PrimaryBtn disabled className="w-full">⏳ Request Sent</PrimaryBtn>
            ) : isPending&&!iSent ? (
              <PrimaryBtn disabled className="w-full">↙ Awaiting Your Response</PrimaryBtn>
            ) : (
              <PrimaryBtn onClick={()=>{onRequest(p);onClose();}} className="w-full">🤝 Send Partnership Request</PrimaryBtn>
            )
          )}
          {isDemo&&<p className="text-white/30 text-xs text-center">Demo profile — real users appear when they sign up</p>}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════
// MATCH TAB
// ════════════════════════════════════════════════════════
function MatchTab({ user, isApproved, showToast, requireAuth, isAdmin }) {
  const [search, setSearch] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [realProfiles, setRealProfiles] = useState([]);
  const [matchMap, setMatchMap] = useState({});
  const [chat, setChat] = useState(null);
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
    // Load ALL approved profiles (including self, so admins show in Core Members)
    supabase.from("profiles").select("*").eq("is_approved",true)
      .then(({data,error})=>{ if(!error&&data?.length) setRealProfiles(data); }).catch(()=>{});
    loadRequests();
  },[user]);

  // Don't show the current user in the browse list (but they can still appear in Core Members)
  const myId = user?.id;

  // Merge real users + demo profiles so the list always shows everyone
  const pool = [...realProfiles, ...DEMO_PROFILES];

  // Core Members = all admin users (real admins). Falls back to a few demos only if no real admins yet.
  const adminMembers = realProfiles.filter(p=>p.is_admin);
  const coreMembers = adminMembers.length>0 ? adminMembers : DEMO_PROFILES.slice(0,4);

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
      const {data,error}=await supabase.from("match_requests").insert({from_user_id:user.id,to_user_id:p.id}).select().single();
      if(error) throw error;
      setMatchMap(m=>({...m,[p.id]:data}));
      showToast(`Partnership request sent to ${p.name} ✓`);
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

      <AnimatePresence>{chat&&<ChatModal matchId={chat.matchId} other={chat.other} me={user} onClose={()=>setChat(null)}/>}</AnimatePresence>
      <AnimatePresence>{selectedProfile&&<ProfileModal p={selectedProfile} onClose={()=>setSelectedProfile(null)} onRequest={handleRequest} matchState={matchMap[selectedProfile.id]} user={user} isAdmin={isAdmin} showToast={showToast} onLoginRequired={()=>{setSelectedProfile(null);requireAuth&&requireAuth();}}/>}</AnimatePresence>
    </motion.div>
  );
}


// ════════════════════════════════════════════════════════
// EVENTS TAB
// ════════════════════════════════════════════════════════
function EventsTab({ user, isApproved, showToast, requireAuth, isAdmin }) {
  const [events, setEvents] = useState([]);
  const [attSet, setAttSet] = useState(new Set());
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
      if(error||!evs||evs.length===0){ setEvents(DEMO_EVENTS); }
      else {
        setEvents(evs);
        // Load all attendees with their profile info
        const {data:att}=await supabase.from("event_attendees")
          .select("event_id, user_id, profile:profiles(id,name,email,mobile,avatar_url,role,location)");
        const counts={}, byEvent={}, mine=new Set();
        (att||[]).forEach(a=>{
          counts[a.event_id]=(counts[a.event_id]||0)+1;
          if(!byEvent[a.event_id]) byEvent[a.event_id]=[];
          if(a.profile) byEvent[a.event_id].push(a.profile);
          if(user && a.user_id===user.id) mine.add(a.event_id);
        });
        setAttCounts(counts); setEventAttendees(byEvent); setAttSet(mine);
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
        await supabase.from("events").insert({...payload,creator_id:user.id});
        showToast("Event created ✓");
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
    const attending=attSet.has(evId);
    if(attending){ await supabase.from("event_attendees").delete().eq("event_id",evId).eq("user_id",user.id); }
    else { await supabase.from("event_attendees").insert({event_id:evId,user_id:user.id}); }
    load();
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

  const ownsEvent = (ev) => user && (ev.creator_id===user.id || isAdmin);
  const myEvents = filtered.filter(ev=>ownsEvent(ev));
  const otherEvents = filtered.filter(ev=>!ownsEvent(ev));
  const cntOf = (ev) => ev.attendee_count || attCounts[ev.id] || 0;

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

              {[["Title","title","text","Event title…"],["Location","location","text","City or Online…"],["Max Attendees","max_attendees","number","50"]].map(([lb,k,t,ph])=>(
                <div key={k} className="space-y-1.5">
                  <label className="text-white/40 text-xs font-medium uppercase tracking-wider">{lb}</label>
                  <input type={t} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={ph}
                    className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none"
                    style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`}}/>
                </div>
              ))}
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
            const attending=attSet.has(ev.id);
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
                    {!past&&!ownsEvent(ev)&&(
                      attending
                        ? <OutlineBtn onClick={()=>toggleAttend(ev.id)} className="w-full" small>✓ Registered — Cancel</OutlineBtn>
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

              {/* MY EVENTS */}
              {myEvents.length>0&&(
                <div className="mb-8">
                  <SectionLabel
                    icon={<svg className="w-5 h-5" style={{color:"#a78bfa"}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>}
                    text="My Events" count={myEvents.length}/>
                  <div className="space-y-4">{myEvents.map(renderCard)}</div>
                </div>
              )}

              {/* ALL EVENTS */}
              <SectionLabel
                icon={<svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
                text="All Events" count={otherEvents.length}/>
              <div className="space-y-4">{otherEvents.map(renderCard)}</div>
            </>
          );
        })()}
      </div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 p-0 md:p-4"
            onClick={e=>e.target===e.currentTarget&&setSelectedEvent(null)}>
            <motion.div initial={{y:60}} animate={{y:0}} exit={{y:60}}
              className="w-full max-w-lg overflow-y-auto rounded-t-3xl md:rounded-3xl"
              style={{maxHeight:"88vh",background:"#0f1320",border:`1px solid ${BORDER}`}}>
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
                      Attendees ({(eventAttendees[selectedEvent.id]||[]).length})
                    </div>
                    {(eventAttendees[selectedEvent.id]||[]).length===0 ? (
                      <div className="text-white/30 text-sm py-3 text-center rounded-2xl" style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${BORDER}`}}>
                        No one has registered yet
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {(eventAttendees[selectedEvent.id]||[]).map(att=>(
                          <div key={att.id} className="flex items-center gap-3 p-3 rounded-2xl" style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${BORDER}`}}>
                            <Av name={att.name} url={att.avatar_url} color={pal(att.id)} size="sm" ring/>
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-sm font-semibold truncate">{att.name||"Unnamed"}</div>
                              <div className="text-white/40 text-xs truncate">{att.role||"Member"}{att.location?` · ${att.location}`:""}</div>
                              <div className="text-white/50 text-xs mt-0.5 truncate">📧 {att.email}{att.mobile?`  ·  📱 ${att.mobile}`:""}</div>
                            </div>
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
                {!selectedEvent.past&&!ownsEvent(selectedEvent)&&(
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
// CHAT / INBOX TAB
// ════════════════════════════════════════════════════════
function ChatTab({ user, showToast }) {
  const [reqs, setReqs] = useState([]);
  const [profs, setProfs] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);

  async function load() {
    if(!user) return;
    try {
      const {data}=await supabase.from("match_requests").select("*").or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`).order("created_at",{ascending:false});
      setReqs(data||[]);
      const ids=[...new Set((data||[]).flatMap(r=>[r.from_user_id,r.to_user_id]).filter(id=>id!==user.id))];
      if(ids.length){
        const {data:p}=await supabase.from("profiles").select("*").in("id",ids);
        const m={}; (p||[]).forEach(x=>m[x.id]=x); setProfs(m);
      }
    } catch(e){}
    setLoading(false);
  }
  useEffect(()=>{ load(); },[user]);

  async function act(req,status) {
    try {
      await supabase.from("match_requests").update({status}).eq("id",req.id);
      setReqs(r=>r.map(x=>x.id===req.id?{...x,status}:x));
      showToast(status==="accepted"?"Matched! Contact revealed ✓":"Declined");
    } catch(e){showToast(e.message,"error");}
  }

  const accepted = reqs.filter(r=>r.status==="accepted");
  const pending = reqs.filter(r=>r.status==="pending"&&r.to_user_id===user?.id);

  if(!user) return (
    <div className="text-center py-20">
      <div className="text-4xl mb-4">💬</div>
      <div className="text-white/50 text-sm">Sign in to view your chats</div>
    </div>
  );

  return (
    <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-14}} transition={{duration:0.28}} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{background:"linear-gradient(135deg,#7cb9e8,#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Messages</h1>
        <p className="text-white/45 text-sm mt-1">Your connections and partnership requests</p>
      </div>

      {loading&&<div className="text-center text-white/30 py-12 text-sm">Loading…</div>}

      {/* Pending requests */}
      {pending.length>0&&(
        <div className="space-y-3">
          <SectionLabel icon={<span className="text-amber-400">🔔</span>} text="Incoming Requests" count={pending.length}/>
          {pending.map(req=>{
            const o=profs[req.from_user_id]; const c=pal(o?.id);
            return (
              <Card key={req.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Av name={o?.name} url={o?.avatar_url} color={c} size="sm" ring/>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-sm">{o?.name||"Someone"}</div>
                    <div className="text-white/40 text-xs">{o?.role}</div>
                    {o?.project_name&&<div className="text-white/30 text-xs mt-0.5">🚀 {o.project_name}</div>}
                    <div className="flex gap-2 mt-3">
                      <PrimaryBtn onClick={()=>act(req,"accepted")} small className="flex-1">✓ Accept</PrimaryBtn>
                      <OutlineBtn onClick={()=>act(req,"declined")} small className="flex-1">✕ Decline</OutlineBtn>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Active chats */}
      {accepted.length>0&&(
        <div className="space-y-3">
          <SectionLabel icon={<span>💬</span>} text="Active Chats" count={accepted.length}/>
          {accepted.map(req=>{
            const oid=req.from_user_id===user?.id?req.to_user_id:req.from_user_id;
            const o=profs[oid]; const c=pal(o?.id);
            return (
              <motion.button key={req.id} onClick={()=>setActiveChat({matchId:req.id,other:o})} className="w-full text-left" whileHover={{scale:1.01}} whileTap={{scale:0.99}}>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <Av name={o?.name} url={o?.avatar_url} color={c} size="md" ring/>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-bold text-sm">{o?.name||"Unknown"}</div>
                      <div className="text-white/40 text-xs">{o?.role}</div>
                      <div className="text-white/30 text-xs mt-0.5">📧 {o?.email}</div>
                    </div>
                    <div className="text-white/30 text-xl">›</div>
                  </div>
                </Card>
              </motion.button>
            );
          })}
        </div>
      )}

      {!loading&&reqs.length===0&&(
        <Card className="p-12 text-center">
          <div className="text-4xl mb-3">💬</div>
          <div className="text-white/50 text-sm">No conversations yet</div>
          <div className="text-white/30 text-xs mt-1">Send a partnership request to start chatting</div>
        </Card>
      )}

      <AnimatePresence>{activeChat&&<ChatModal matchId={activeChat.matchId} other={activeChat.other} me={user} onClose={()=>setActiveChat(null)}/>}</AnimatePresence>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════
// PROFILE TAB
// ════════════════════════════════════════════════════════
function ProfileTab({ user, profile, setProfile, showToast, isApproved }) {
  const [form, setForm] = useState({name:"",bio:"",experience:"",location:"",skills:[],mobile:"",role:"",project_name:"",project_pitch:"",project_industry:"",linkedin_url:"",website_url:"",whatsapp:""});
  const [newSkill, setNewSkill] = useState("");
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState("identity");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef();

  useEffect(()=>{
    if(profile) setForm({name:profile.name||"",bio:profile.bio||"",experience:profile.experience||"",location:profile.location||"",skills:profile.skills||[],mobile:profile.mobile||"",role:profile.role||"",project_name:profile.project_name||"",project_pitch:profile.project_pitch||"",project_industry:profile.project_industry||"",linkedin_url:profile.linkedin_url||"",website_url:profile.website_url||"",whatsapp:profile.whatsapp||""});
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
      const {error}=await supabase.from("profiles").update({name:form.name,bio:form.bio,experience:parseInt(form.experience)||0,location:form.location,skills:form.skills,mobile:form.mobile,role:form.role,project_name:form.project_name,project_pitch:form.project_pitch,project_industry:form.project_industry,linkedin_url:form.linkedin_url,website_url:form.website_url,whatsapp:form.whatsapp,updated_at:new Date().toISOString()}).eq("id",user.id);
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
              {[["Full Name","name","text","Your name"],["Role / Title","role","text","CEO, CTO, Designer…"],["Location","location","text","San Francisco, CA"],["Years Experience","experience","number","5"]].map(([lb,k,t,ph])=>(
                <div key={k} className="space-y-1.5">
                  <label className="text-white/40 text-xs font-medium uppercase tracking-wider">{lb}</label>
                  <input type={t} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={ph}
                    className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none"
                    style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`}}/>
                </div>
              ))}
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
            </Card>
          </motion.div>
        )}
        {section==="project"&&(
          <motion.div key="proj" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-4">
            <Card className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Project Name</label>
                <input value={form.project_name} onChange={e=>setForm(f=>({...f,project_name:e.target.value}))} placeholder="HealthAI Platform"
                  className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none"
                  style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`}}/>
              </div>
              <div className="space-y-1.5">
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Elevator Pitch</label>
                <textarea value={form.project_pitch} onChange={e=>setForm(f=>({...f,project_pitch:e.target.value}))} placeholder="Problem → Solution → Why now?" rows={4}
                  className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none resize-none"
                  style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`}}/>
              </div>
              <div className="space-y-1.5">
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Industry</label>
                <div className="flex flex-wrap gap-2">{INDUSTRIES.map(ind=>(
                  <button key={ind} onClick={()=>setForm(f=>({...f,project_industry:ind}))}
                    className="px-3 py-1.5 rounded-2xl text-xs font-semibold transition-all"
                    style={form.project_industry===ind?{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",color:"#fff"}:{background:CARD_BG,border:`1px solid ${BORDER}`,color:"rgba(255,255,255,0.45)"}}>
                    {ind}
                  </button>
                ))}</div>
              </div>
              {/* Pitch strength */}
              <div className="pt-2 space-y-2">
                <div className="flex justify-between text-xs"><span className="text-white/35 uppercase tracking-wider">Pitch Strength</span><span className="font-semibold" style={{color:pitchScore<30?"#ef4444":pitchScore<60?"#f59e0b":pitchScore<85?"#a78bfa":"#10b981"}}>{pitchScore<30?"Weak":pitchScore<60?"Developing":pitchScore<85?"Strong":"Exceptional"}</span></div>
                <div className="h-1.5 rounded-full" style={{background:"rgba(255,255,255,0.07)"}}>
                  <motion.div className="h-full rounded-full" style={{background:"linear-gradient(90deg,#7c6fe0,#a78bfa)",width:`${pitchScore}%`}} animate={{width:`${pitchScore}%`}} transition={{duration:0.5}}/>
                </div>
              </div>
            </Card>
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
function ManageTab({ showToast }) {
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
              </div>
            </div>
          </Card>
        </motion.div>
      );})}</div>

      {/* SQL fix reminder */}
      <Card className="p-4">
        <div className="text-white/40 text-xs">If approvals aren't saving, run the admin RLS fix SQL in Supabase (see instructions).</div>
      </Card>
    </motion.div>
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
export default function App() {
  const [session,setSession]=useState(undefined);
  const [profile,setProfile]=useState(null);
  const [tab,setTab]=useState("events");
  const [toast,setToast]=useState(null);
  const [showOnboard,setShowOnboard]=useState(false);
  const [showLogin,setShowLogin]=useState(false);

  const showToast=useCallback((msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),3200); },[]);

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

  const user=session?.user;
  const isApproved=profile?.is_approved||false;
  const isAdmin=profile?.is_admin||false;

  // Nav icons matching the reference image
  const NAV = [
    { id:"events",  label:"Events",  icon:(active)=>(
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active?2.5:2}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    )},
    { id:"matching", label:"Match",  icon:(active)=>(
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active?2.5:2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    )},
    { id:"chat",    label:"Chat",    icon:(active)=>(
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active?2.5:2}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    ), auth:true},
    { id:"profile", label:"Profile", icon:(active)=>(
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active?2.5:2}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    ), auth:true},
    ...(isAdmin?[{ id:"manage", label:"Admin", icon:(active)=>(
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active?2.5:2}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
    ), auth:true}]:[]),
  ];

  function goTab(id,auth){ if(auth&&!user){setShowLogin(true);return;} setTab(id); }

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
            </button>
          );})}
        </nav>
        <div className="flex items-center gap-3">
          {user?(
            <div className="flex items-center gap-2">
              <Av name={profile?.name} url={profile?.avatar_url} color={pal(user.id)} size="sm" ring/>
              <span className="text-white/60 text-sm">{profile?.name?.split(" ")[0]||"You"}</span>
              <button onClick={()=>supabase.auth.signOut()} className="text-white/30 hover:text-white/60 text-xs ml-2 transition-colors">Sign out</button>
            </div>
          ):(
            <PrimaryBtn onClick={()=>setShowLogin(true)} small>
              <GoogleIcon/> Sign in
            </PrimaryBtn>
          )}
        </div>
      </header>

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
          ):tab==="matching"?<MatchTab key="m" user={user} isApproved={isApproved} showToast={showToast} requireAuth={requireAuth} isAdmin={isAdmin}/>
          :tab==="events"?<EventsTab key="e" user={user} isApproved={isApproved} showToast={showToast} requireAuth={requireAuth} isAdmin={isAdmin}/>
          :tab==="chat"?<ChatTab key="c" user={user} showToast={showToast}/>
          :tab==="profile"?<ProfileTab key="p" user={user} profile={profile} setProfile={setProfile} showToast={showToast} isApproved={isApproved}/>
          :tab==="manage"&&isAdmin?<ManageTab key="a" showToast={showToast}/>
          :null}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav — matching reference image */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30" style={{background:"rgba(10,14,26,0.95)",backdropFilter:"blur(20px)",borderTop:`1px solid ${BORDER}`}}>
        <div className="flex items-center justify-around px-2 py-3">
          {NAV.map(n=>{
            const active=tab===n.id;
            return (
              <button key={n.id} onClick={()=>goTab(n.id,n.auth)}
                className="flex flex-col items-center gap-1 px-4 py-1 rounded-2xl transition-all min-w-[56px]">
                <span style={{color:active?"#a78bfa":"rgba(255,255,255,0.35)"}}>{n.icon(active)}</span>
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
