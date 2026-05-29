import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://pcvcqvkjxlvbourkenmx.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjdmNxdmtqeGx2Ym91cmtlbm14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwODk0NDMsImV4cCI6MjA5NDY2NTQ0M30.sbWfbxjtKpqpPBqWvE39fU-xk7H_tIVJPPaHdY36MRM";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── Constants ────────────────────────────────────────────────────────────────
const ADMIN_EMAIL = "belvinip@gmail.com";
const INDUSTRIES = ["FinTech","HealthTech","EdTech","Climate","Web3","E-commerce","SaaS","Consumer","DeepTech","Other"];
const SKILL_COLORS = [
  "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 text-indigo-300",
  "from-violet-500/20 to-violet-600/10 border-violet-500/30 text-violet-300",
  "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-300",
  "from-pink-500/20 to-pink-600/10 border-pink-500/30 text-pink-300",
  "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-300",
  "from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-300",
];
const PALETTE = ["#6366f1","#8b5cf6","#06b6d4","#ec4899","#10b981","#f59e0b","#ef4444","#3b82f6"];
const pal = (id) => PALETTE[(id?.charCodeAt(0) || 0) % PALETTE.length];
const sc = (i) => SKILL_COLORS[i % SKILL_COLORS.length];
const initials = (n) => n ? n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() : "?";
const ago = (ts) => {
  const d = Date.now() - new Date(ts).getTime(), m = Math.floor(d/60000);
  if (m<1) return "just now"; if (m<60) return `${m}m ago`;
  const h = Math.floor(m/60); if (h<24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
};

// ─── 30 Demo profiles ────────────────────────────────────────────────────────
const DEMO_PROFILES = [
  { id:"d1",  name:"Alex Chen",       role:"CEO / Founder",      location:"San Francisco, CA",  bio:"Serial entrepreneur with 3 exits. Building at the intersection of AI and healthcare.",             skills:["AI/ML","Product","Strategy","Fundraising"],         project_name:"HealthAI",       project_industry:"HealthTech",  experience:8,  is_approved:true },
  { id:"d2",  name:"Priya Sharma",    role:"CTO",                location:"New York, NY",        bio:"Full-stack engineer turned founder. Passionate about EdTech and democratising education.",         skills:["React","Node.js","System Design","FinTech"],         project_name:"EduChain",       project_industry:"EdTech",      experience:6,  is_approved:true },
  { id:"d3",  name:"Marcus Webb",     role:"CMO",                location:"Austin, TX",          bio:"Growth hacker who scaled 2 startups to 1M+ users. Data-driven, obsessed with retention.",         skills:["Growth","Marketing","B2C","Analytics"],             project_name:"GrowthOS",       project_industry:"SaaS",        experience:5,  is_approved:true },
  { id:"d4",  name:"Sofia Russo",     role:"CPO / Design Lead",  location:"London, UK",          bio:"Design-led founder. Ex-unicorn design lead. Obsessed with beautiful, functional UX.",             skills:["UX","Branding","Figma","Web3"],                     project_name:"DesignDAO",      project_industry:"Web3",        experience:7,  is_approved:true },
  { id:"d5",  name:"Daniel Kim",      role:"CFO / COO",          location:"Singapore",           bio:"Finance & ops expert. Ex-Goldman Sachs. Loves turning messy cap tables into clean outcomes.",     skills:["Finance","Ops","Fundraising","B2B SaaS"],           project_name:"CapStack",       project_industry:"FinTech",     experience:9,  is_approved:true },
  { id:"d6",  name:"Yuki Tanaka",     role:"Blockchain Lead",    location:"Tokyo, Japan",        bio:"Blockchain architect and DeFi native. Building trustless systems for the real world.",            skills:["Solidity","Web3","Cryptography","Rust"],            project_name:"TrustLayer",     project_industry:"Web3",        experience:4,  is_approved:true },
  { id:"d7",  name:"Amara Okonkwo",   role:"Founder / CEO",      location:"Lagos, Nigeria",      bio:"Climate tech evangelist building carbon credit infrastructure for emerging markets.",              skills:["Climate","ESG","Strategy","B2B"],                   project_name:"CarbonBridge",   project_industry:"Climate",     experience:6,  is_approved:true },
  { id:"d8",  name:"Jake Morrison",   role:"Full-Stack Engineer", location:"Berlin, Germany",     bio:"10x engineer who loves shipping fast. Built and sold 2 SaaS products bootstrapped.",              skills:["TypeScript","Go","Postgres","DevOps"],              project_name:"ShipFast",       project_industry:"SaaS",        experience:7,  is_approved:true },
  { id:"d9",  name:"Lin Wei",         role:"AI Researcher",      location:"Shanghai, China",     bio:"PhD in ML from MIT. Turned academic research into practical LLM applications at scale.",          skills:["LLMs","Python","MLOps","Research"],                 project_name:"ContextAI",      project_industry:"DeepTech",    experience:5,  is_approved:true },
  { id:"d10", name:"Rachel Torres",   role:"Head of Sales",      location:"Miami, FL",           bio:"0-to-$10M ARR sales leader. Built sales teams from scratch at 3 hypergrowth startups.",          skills:["Sales","B2B","CRM","Revenue Ops"],                  project_name:"SalesMatrix",    project_industry:"SaaS",        experience:8,  is_approved:true },
  { id:"d11", name:"Tom Blackwell",   role:"Hardware Engineer",  location:"Seattle, WA",         bio:"Ex-Apple hardware engineer. Bridging the gap between software intelligence and physical devices.", skills:["Hardware","IoT","Embedded","C++"],                  project_name:"SenseGrid",      project_industry:"DeepTech",    experience:11, is_approved:true },
  { id:"d12", name:"Nadia Petrov",    role:"Founder / CMO",      location:"Amsterdam, Netherlands",bio:"Brand builder and storyteller. Took 2 DTC brands from zero to $5M revenue in 18 months.",      skills:["Brand","DTC","Content","Paid Ads"],                 project_name:"StoryCommerce",  project_industry:"E-commerce",  experience:6,  is_approved:true },
  { id:"d13", name:"Carlos Mendez",   role:"CTO / Co-Founder",   location:"Mexico City, Mexico", bio:"Fintech infrastructure builder. Helped 3 neobanks in LATAM launch their core banking stack.",    skills:["FinTech","Java","Microservices","Banking APIs"],    project_name:"NovoBanco",      project_industry:"FinTech",     experience:9,  is_approved:true },
  { id:"d14", name:"Isla MacGregor",  role:"Product Manager",    location:"Edinburgh, UK",       bio:"Product leader with deep expertise in consumer health apps and wearables.",                       skills:["Product","Health","User Research","Roadmapping"],  project_name:"PulseTrack",     project_industry:"HealthTech",  experience:5,  is_approved:true },
  { id:"d15", name:"Ravi Patel",      role:"DevOps / Infra Lead",location:"Bangalore, India",    bio:"Infrastructure wizard. Scaled systems from 10K to 10M users at a Bangalore unicorn.",            skills:["Kubernetes","AWS","Terraform","SRE"],               project_name:"CloudLaunch",    project_industry:"SaaS",        experience:7,  is_approved:true },
  { id:"d16", name:"Mei Yamamoto",    role:"CPO",                location:"Osaka, Japan",        bio:"Consumer product expert. Launched 4 apps with 500K+ DAU combined on iOS and Android.",           skills:["Mobile","Swift","Kotlin","Product"],                project_name:"DailyHabit",     project_industry:"Consumer",    experience:6,  is_approved:true },
  { id:"d17", name:"Ethan Brooks",    role:"Founder / CEO",      location:"Denver, CO",          bio:"EdTech entrepreneur. Previous company acquired by Coursera. Passionate about lifelong learning.", skills:["EdTech","B2C","Curriculum","LMS"],                  project_name:"SkillPath",      project_industry:"EdTech",      experience:10, is_approved:true },
  { id:"d18", name:"Zara Ahmed",      role:"UX / Product",       location:"Dubai, UAE",          bio:"Human-centred design champion. Designed products used by 20M+ people across the Middle East.",   skills:["UX","Design Systems","Research","Arabic UX"],      project_name:"MENADesign",     project_industry:"Consumer",    experience:7,  is_approved:true },
  { id:"d19", name:"Oliver Grant",    role:"CFO",                location:"Zurich, Switzerland", bio:"Ex-Credit Suisse. Structured funding for 10+ startups. Deep expertise in European VC landscape.", skills:["Finance","VC","M&A","Fundraising"],                 project_name:"AlphaFund",      project_industry:"FinTech",     experience:14, is_approved:true },
  { id:"d20", name:"Aisha Diallo",    role:"CEO / Founder",      location:"Nairobi, Kenya",      bio:"Building mobile-first financial tools for the unbanked across Sub-Saharan Africa.",              skills:["Mobile Money","Strategy","B2C","Ops"],             project_name:"PesaPlus",       project_industry:"FinTech",     experience:5,  is_approved:true },
  { id:"d21", name:"Ben Nakamura",    role:"ML Engineer",        location:"Toronto, Canada",     bio:"Computer vision specialist. 3 papers published at NeurIPS. Now applying research to retail AI.",  skills:["Computer Vision","PyTorch","MLOps","Retail AI"],   project_name:"ShelfSight",     project_industry:"DeepTech",    experience:6,  is_approved:true },
  { id:"d22", name:"Lena Kowalski",   role:"Growth Lead",        location:"Warsaw, Poland",      bio:"PLG expert who drove 300% YoY user growth at a SaaS unicorn in Warsaw. Loves experimentation.",  skills:["PLG","SEO","Analytics","Experimentation"],         project_name:"LoopGrowth",     project_industry:"SaaS",        experience:5,  is_approved:true },
  { id:"d23", name:"David Osei",      role:"Founder / CTO",      location:"Accra, Ghana",        bio:"Full-stack builder focused on logistics tech. Making last-mile delivery work in Africa.",         skills:["React Native","Node.js","Logistics","Maps API"],   project_name:"LastMile",       project_industry:"E-commerce",  experience:4,  is_approved:true },
  { id:"d24", name:"Sophie Laurent",  role:"COO",                location:"Paris, France",       bio:"Operations expert who scaled a French startup from 5 to 200 people in 3 years.",                 skills:["Ops","Hiring","Process","OKRs"],                    project_name:"ScaleOps",       project_industry:"SaaS",        experience:8,  is_approved:true },
  { id:"d25", name:"Kai Andersen",    role:"Founder / CTO",      location:"Copenhagen, Denmark", bio:"Climate fintech builder. Combining open banking and carbon data to help consumers go green.",     skills:["Open Banking","APIs","Climate","TypeScript"],      project_name:"GreenLedger",    project_industry:"Climate",     experience:5,  is_approved:true },
  { id:"d26", name:"Fatima Al-Hassan",role:"CEO",                location:"Riyadh, Saudi Arabia",bio:"Vision 2030 aligned founder. Building workforce reskilling platforms for the Saudi market.",      skills:["EdTech","Arabic","B2B","Government Relations"],    project_name:"ReskillSA",      project_industry:"EdTech",      experience:7,  is_approved:true },
  { id:"d27", name:"Marco Ferretti",  role:"Founder / Designer", location:"Milan, Italy",        bio:"Ex-Fiat designer turned startup founder. Applying industrial design thinking to SaaS products.",  skills:["Industrial Design","UX","Brand","Figma"],          project_name:"FormProduct",    project_industry:"SaaS",        experience:9,  is_approved:true },
  { id:"d28", name:"Hana Park",       role:"Head of Data",       location:"Seoul, South Korea",  bio:"Data scientist turned product leader. Built recommendation engines serving 50M+ Korean users.",   skills:["Data Science","Recommender Systems","SQL","Python"],project_name:"PersonalizeKR",  project_industry:"Consumer",    experience:6,  is_approved:true },
  { id:"d29", name:"Tyler Washington",role:"Founder / CEO",      location:"Atlanta, GA",         bio:"HealthTech entrepreneur focused on closing the racial health equity gap through technology.",      skills:["HealthTech","Community","Strategy","Fundraising"], project_name:"EquityHealth",   project_industry:"HealthTech",  experience:6,  is_approved:true },
  { id:"d30", name:"Nina Volkov",     role:"CTO",                location:"Tallinn, Estonia",    bio:"Ex-Skype engineer. Building privacy-first communication tools for remote-first teams.",           skills:["Rust","WebRTC","Privacy","Distributed Systems"],   project_name:"SecureComms",    project_industry:"SaaS",        experience:10, is_approved:true },
];

// ─── 30 Demo events ───────────────────────────────────────────────────────────
const now = new Date();
const future = (days, h=10, m=0) => { const d=new Date(now); d.setDate(d.getDate()+days); d.setHours(h,m,0,0); return d.toISOString(); };
const past   = (days, h=18, m=0) => { const d=new Date(now); d.setDate(d.getDate()-days); d.setHours(h,m,0,0); return d.toISOString(); };

const DEMO_EVENTS = [
  { id:"e1",  title:"AI Founders Breakfast",           description:"Casual morning meetup for founders building AI-first products. Share what you're working on over coffee and croissants.",                   location:"WeWork, San Francisco",       event_date:future(2,8,30),  max_attendees:25,  industry_tags:["DeepTech","SaaS"],          creator_id:"d1",  creator:{name:"Alex Chen",       avatar_url:null, id:"d1"} },
  { id:"e2",  title:"FinTech Demo Day",                description:"10 early-stage fintech founders pitch to a room of angels and VCs. Network afterwards with top investors in the space.",                    location:"500 Startups, NYC",           event_date:future(4,14,0),  max_attendees:80,  industry_tags:["FinTech"],                  creator_id:"d5",  creator:{name:"Daniel Kim",      avatar_url:null, id:"d5"} },
  { id:"e3",  title:"Web3 Builders Hackathon",         description:"48-hour hackathon building DeFi and NFT primitives on Ethereum. $10K in prizes. Teams of 2-4.",                                             location:"TechHub, London",             event_date:future(6,9,0),   max_attendees:120, industry_tags:["Web3"],                     creator_id:"d4",  creator:{name:"Sofia Russo",     avatar_url:null, id:"d4"} },
  { id:"e4",  title:"EdTech Product Workshop",         description:"Hands-on workshop on building engaging learning experiences. Bring your laptop and a product idea.",                                         location:"Online (Zoom)",               event_date:future(3,16,0),  max_attendees:50,  industry_tags:["EdTech"],                   creator_id:"d17", creator:{name:"Ethan Brooks",    avatar_url:null, id:"d17"} },
  { id:"e5",  title:"Climate Tech Pitch Night",        description:"Founders working on climate solutions pitch their ideas to a panel of impact investors. Q&A session follows.",                               location:"Climate House, Berlin",        event_date:future(7,18,30), max_attendees:60,  industry_tags:["Climate"],                  creator_id:"d7",  creator:{name:"Amara Okonkwo",  avatar_url:null, id:"d7"} },
  { id:"e6",  title:"SaaS Growth Masterclass",         description:"Deep dive into product-led growth strategies that worked for $10M+ ARR companies. Real data, real examples.",                               location:"Stripe HQ, San Francisco",    event_date:future(5,10,0),  max_attendees:40,  industry_tags:["SaaS"],                     creator_id:"d22", creator:{name:"Lena Kowalski",  avatar_url:null, id:"d22"} },
  { id:"e7",  title:"Founder Speed Dating",            description:"Find your co-founder in 90 minutes. 5-minute rounds with potential matches. Structured, efficient, and surprisingly fun.",                  location:"Founders Club, Austin",       event_date:future(8,18,0),  max_attendees:30,  industry_tags:["SaaS","FinTech","EdTech"],   creator_id:"d3",  creator:{name:"Marcus Webb",    avatar_url:null, id:"d3"} },
  { id:"e8",  title:"HealthTech Investor Roundtable",  description:"Closed-door roundtable connecting HealthTech founders with 8 Series A investors. Application required.",                                    location:"Andreessen Horowitz, Menlo",  event_date:future(10,13,0), max_attendees:16,  industry_tags:["HealthTech"],               creator_id:"d29", creator:{name:"Tyler Washington",avatar_url:null,id:"d29"} },
  { id:"e9",  title:"Women in DeepTech Mixer",         description:"Monthly mixer celebrating women building frontier technology. Allies welcome. Great speakers, better networking.",                           location:"Google Campus, Zurich",       event_date:future(9,17,30), max_attendees:70,  industry_tags:["DeepTech","Climate"],       creator_id:"d18", creator:{name:"Zara Ahmed",     avatar_url:null, id:"d18"} },
  { id:"e10", title:"Open Source Dev Meetup",          description:"Monthly gathering for open source contributors and founders. Lightning talks on tooling, infra, and developer experience.",                  location:"Basecamp Office, Chicago",    event_date:future(11,18,0), max_attendees:45,  industry_tags:["SaaS","DeepTech"],          creator_id:"d30", creator:{name:"Nina Volkov",    avatar_url:null, id:"d30"} },
  { id:"e11", title:"E-commerce Founders Lunch",       description:"Intimate lunch for founders in e-commerce and DTC. Share challenges, swap playbooks, and make genuine connections.",                         location:"Soho House, NYC",             event_date:future(12,12,30),max_attendees:20,  industry_tags:["E-commerce"],               creator_id:"d12", creator:{name:"Nadia Petrov",   avatar_url:null, id:"d12"} },
  { id:"e12", title:"Mobile-First Product Summit",     description:"Full-day summit on building exceptional mobile products. Speakers from Duolingo, Spotify, and Calm.",                                        location:"Convention Centre, Singapore",event_date:future(14,9,0),  max_attendees:200, industry_tags:["Consumer","EdTech"],        creator_id:"d16", creator:{name:"Mei Yamamoto",   avatar_url:null, id:"d16"} },
  { id:"e13", title:"Africa Tech Founder Circle",      description:"Monthly circle for African founders building pan-African or global companies. Peer support, investor intros, warm community.",               location:"iHub, Nairobi",               event_date:future(5,17,0),  max_attendees:35,  industry_tags:["FinTech","E-commerce"],     creator_id:"d20", creator:{name:"Aisha Diallo",   avatar_url:null, id:"d20"} },
  { id:"e14", title:"B2B SaaS Metrics Deep Dive",      description:"Workshop on the metrics that matter for B2B SaaS. NRR, CAC payback, magic number — we'll cover it all with real benchmarks.",              location:"Online (Google Meet)",         event_date:future(6,15,0),  max_attendees:100, industry_tags:["SaaS"],                     creator_id:"d24", creator:{name:"Sophie Laurent", avatar_url:null, id:"d24"} },
  { id:"e15", title:"Hardware & IoT Builders Meetup",  description:"For founders building in the physical world. Demos, teardowns, and war stories from the supply chain trenches.",                             location:"Pier 9, San Francisco",       event_date:future(15,11,0), max_attendees:40,  industry_tags:["DeepTech"],                 creator_id:"d11", creator:{name:"Tom Blackwell",  avatar_url:null, id:"d11"} },
  { id:"e16", title:"MENA Startup Showcase",           description:"Showcase of the most exciting startups from the Middle East and North Africa. Investors from the Gulf and London attending.",               location:"DIFC, Dubai",                 event_date:future(18,14,0), max_attendees:150, industry_tags:["FinTech","EdTech","Consumer"],creator_id:"d18",creator:{name:"Zara Ahmed",     avatar_url:null, id:"d18"} },
  { id:"e17", title:"Privacy-First Product Talk",      description:"How to build products that respect user privacy without sacrificing growth. Case studies from Signal, Proton, and Brave.",                  location:"Online (YouTube Live)",       event_date:future(3,19,0),  max_attendees:null, industry_tags:["SaaS","DeepTech"],         creator_id:"d30", creator:{name:"Nina Volkov",    avatar_url:null, id:"d30"} },
  { id:"e18", title:"Seed Funding Panel",              description:"5 seed investors break down what they look for in 2025. Bring your deck and get brutally honest feedback in small groups.",                  location:"YC Campus, Mountain View",    event_date:future(20,14,0), max_attendees:60,  industry_tags:["SaaS","FinTech","HealthTech"],creator_id:"d19",creator:{name:"Oliver Grant",   avatar_url:null, id:"d19"} },
  { id:"e19", title:"Rust & Systems Programming Night",description:"For engineers who love low-level programming. Lightning talks on Rust in production, WebAssembly, and distributed systems.",               location:"Mozilla HQ, San Francisco",   event_date:future(13,18,30),max_attendees:50,  industry_tags:["DeepTech","SaaS"],          creator_id:"d30", creator:{name:"Nina Volkov",    avatar_url:null, id:"d30"} },
  { id:"e20", title:"Impact Investing Breakfast",      description:"Connecting impact-focused founders with patient capital. Focus on climate, health equity, and financial inclusion.",                          location:"Pemberton Hall, London",      event_date:future(7,8,30),  max_attendees:30,  industry_tags:["Climate","HealthTech"],     creator_id:"d7",  creator:{name:"Amara Okonkwo",  avatar_url:null, id:"d7"} },
  { id:"e21", title:"Design Systems Workshop",         description:"Hands-on workshop building a component library from scratch in Figma and React. Take home a production-ready design system.",               location:"Figma HQ, San Francisco",     event_date:future(9,10,0),  max_attendees:24,  industry_tags:["SaaS","Consumer"],          creator_id:"d4",  creator:{name:"Sofia Russo",    avatar_url:null, id:"d4"} },
  { id:"e22", title:"LLM Application Builders Meetup", description:"Monthly meetup for developers building on top of GPT, Claude, and Gemini. Show and tell, debugging sessions, and best practices.",          location:"OpenAI Office, SF",           event_date:future(16,18,0), max_attendees:80,  industry_tags:["DeepTech","SaaS"],          creator_id:"d9",  creator:{name:"Lin Wei",        avatar_url:null, id:"d9"} },
  { id:"e23", title:"Revenue Operations Summit",       description:"For RevOps leaders and founders wanting to build a world-class GTM machine. Tools, processes, and team structures that scale.",             location:"Salesforce Tower, NYC",       event_date:future(21,9,0),  max_attendees:90,  industry_tags:["SaaS"],                     creator_id:"d10", creator:{name:"Rachel Torres",  avatar_url:null, id:"d10"} },
  { id:"e24", title:"Nordic Founders Meetup",          description:"Gathering for Scandinavian founders and those building for Nordic markets. Saunas, great coffee, and genuine conversations.",               location:"Slush HQ, Helsinki",          event_date:future(25,17,0), max_attendees:55,  industry_tags:["Climate","SaaS"],           creator_id:"d25", creator:{name:"Kai Andersen",   avatar_url:null, id:"d25"} },
  { id:"e25", title:"Consumer App Growth Workshop",    description:"Tactical workshop: push notifications, onboarding flows, virality loops, and retention strategies for consumer apps.",                       location:"Online (Zoom)",               event_date:future(4,11,0),  max_attendees:75,  industry_tags:["Consumer"],                 creator_id:"d16", creator:{name:"Mei Yamamoto",   avatar_url:null, id:"d16"} },
  { id:"e26", title:"Pitch Perfect — Founder Bootcamp",description:"Two-day intensive bootcamp on nailing your investor pitch. Deck review, mock pitches, and coaching from ex-VCs.",                          location:"General Assembly, London",    event_date:future(28,9,0),  max_attendees:20,  industry_tags:["SaaS","FinTech","HealthTech"],creator_id:"d19",creator:{name:"Oliver Grant",   avatar_url:null, id:"d19"} },
  { id:"e27", title:"Korea Tech Networking Night",     description:"For founders building in or for South Korea and the broader APAC market. Investors from SoftBank and Kakao Ventures attending.",            location:"COEX, Seoul",                 event_date:future(11,18,30),max_attendees:100, industry_tags:["Consumer","DeepTech"],      creator_id:"d28", creator:{name:"Hana Park",      avatar_url:null, id:"d28"} },
  { id:"e28", title:"HealthTech Regulatory Q&A",       description:"Expert panel on navigating FDA, CE Mark, and TGA approval for digital health products. Ask your burning compliance questions.",             location:"Online (Zoom)",               event_date:future(17,14,0), max_attendees:60,  industry_tags:["HealthTech"],               creator_id:"d14", creator:{name:"Isla MacGregor", avatar_url:null, id:"d14"} },
  { id:"e29", title:"Startup Visa & Global Expansion", description:"How to set up your company for global growth. Tax structures, visa options, EOR providers, and banking across borders.",                   location:"Stripe Atlas HQ, Dublin",     event_date:future(22,10,0), max_attendees:45,  industry_tags:["SaaS","FinTech"],           creator_id:"d8",  creator:{name:"Jake Morrison",  avatar_url:null, id:"d8"} },
  // 1 past event
  { id:"e30", title:"Founder Stories: The Hard Parts", description:"Founders share the moments they almost quit — and what kept them going. Raw, unfiltered, and deeply human conversations.",                  location:"Village Underground, London", event_date:past(3,19,0),    max_attendees:80,  industry_tags:["SaaS","FinTech","EdTech","Climate"], creator_id:"d3", creator:{name:"Marcus Webb", avatar_url:null, id:"d3"} },
];

// ════════════════════════════════════════════════════════
// UI PRIMITIVES
// ════════════════════════════════════════════════════════
function Grid() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0" style={{backgroundImage:`linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px)`,backgroundSize:"52px 52px"}}/>
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full" style={{background:"radial-gradient(circle,rgba(99,102,241,0.07),transparent 70%)"}}/>
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full" style={{background:"radial-gradient(circle,rgba(139,92,246,0.06),transparent 70%)"}}/>
    </div>
  );
}

function Av({ name, url, color, size="md" }) {
  const s = {xs:"w-6 h-6 text-[10px]",sm:"w-8 h-8 text-xs",md:"w-10 h-10 text-sm",lg:"w-16 h-16 text-base"};
  const c = color||"#6366f1";
  if (url) return <img src={url} alt="" className={`${s[size]} rounded-full object-cover flex-shrink-0`} style={{border:`1.5px solid ${c}50`,boxShadow:`0 0 10px ${c}25`}}/>;
  return <div className={`${s[size]} rounded-full flex items-center justify-center font-bold flex-shrink-0`} style={{background:`radial-gradient(circle at 35% 35%,${c}45,${c}18)`,border:`1.5px solid ${c}60`,boxShadow:`0 0 12px ${c}25`,color:c}}>{initials(name)}</div>;
}

function Card({ children, className="", glow }) {
  return <div className={`rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md ${className}`} style={glow?{boxShadow:`0 0 28px ${glow}18`}:undefined}>{children}</div>;
}

function Btn({ children, onClick, loading, disabled, className="", variant="primary", style:s }) {
  const base = "relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50";
  const vars = {
    primary:{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",boxShadow:"0 0 20px rgba(99,102,241,0.25)",color:"#fff"},
    ghost:{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.7)"},
    danger:{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",color:"#f87171"},
    success:{background:"rgba(16,185,129,0.15)",border:"1px solid rgba(16,185,129,0.3)",color:"#34d399"},
  };
  return (
    <motion.button onClick={onClick} disabled={loading||disabled} whileHover={{scale:disabled||loading?1:1.02}} whileTap={{scale:disabled||loading?1:0.97}}
      className={`${base} ${className}`} style={{...vars[variant],...s}}>
      {loading&&<svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
      {children}
    </motion.button>
  );
}

function Field({ label, value, onChange, type="text", placeholder, icon, locked, rows, disabled }) {
  const cls = "w-full bg-white/[0.05] border border-white/10 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.07] transition-all disabled:opacity-50";
  return (
    <div className="space-y-1.5">
      {label&&<label className="text-[11px] text-white/35 font-mono uppercase tracking-widest">{label}</label>}
      <div className="relative">
        {icon&&<span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-sm pointer-events-none">{icon}</span>}
        {rows
          ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} className={`${cls} px-3 py-2.5 resize-none`}/>
          : <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={locked||disabled} className={`${cls} px-3 py-2.5`} style={{paddingLeft:icon?"2.2rem":undefined}}/>
        }
        {locked&&<div className="absolute inset-0 rounded-xl flex items-center justify-end pr-3 pointer-events-none"><span className="text-[10px] text-white/25 flex items-center gap-1">🔒 Revealed on mutual match</span></div>}
      </div>
    </div>
  );
}

function Tag({ skill, idx, onRemove }) {
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-gradient-to-r ${sc(idx)}`}>{skill}{onRemove&&<button onClick={onRemove} className="opacity-40 hover:opacity-80 ml-0.5 leading-none">×</button>}</span>;
}

function Ring({ score }) {
  const r=18, c=2*Math.PI*r, col=score>=90?"#10b981":score>=75?"#6366f1":"#f59e0b";
  return (
    <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
      <svg className="absolute inset-0 -rotate-90" width="48" height="48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5"/>
        <circle cx="24" cy="24" r={r} fill="none" stroke={col} strokeWidth="2.5" strokeDasharray={`${(score/100)*c} ${c}`} strokeLinecap="round" style={{filter:`drop-shadow(0 0 4px ${col})`}}/>
      </svg>
      <span className="text-[10px] font-bold font-mono" style={{color:col}}>{score}%</span>
    </div>
  );
}

function Meter({ val }) {
  const p=Math.min(100,Math.max(0,val)), col=p<30?"#ef4444":p<60?"#f59e0b":p<85?"#6366f1":"#10b981";
  const lbl=p<30?"Weak":p<60?"Developing":p<85?"Strong":"Exceptional";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between"><span className="text-[11px] text-white/35 font-mono uppercase tracking-widest">AI Pitch Strength</span><span className="text-[11px] font-bold font-mono" style={{color:col}}>{lbl}</span></div>
      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
        <motion.div className="h-full rounded-full" style={{background:`linear-gradient(90deg,${col}70,${col})`,boxShadow:`0 0 8px ${col}`}} initial={{width:0}} animate={{width:`${p}%`}} transition={{duration:0.6,ease:"easeOut"}}/>
      </div>
    </div>
  );
}

function Pip({ children, color="indigo" }) {
  const m={indigo:"bg-indigo-500/15 border-indigo-500/30 text-indigo-400",emerald:"bg-emerald-500/15 border-emerald-500/30 text-emerald-400",amber:"bg-amber-500/15 border-amber-500/30 text-amber-400",red:"bg-red-500/15 border-red-500/25 text-red-400",cyan:"bg-cyan-500/15 border-cyan-500/30 text-cyan-400",violet:"bg-violet-500/15 border-violet-500/30 text-violet-400"};
  return <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${m[color]||m.indigo}`}>{children}</span>;
}

function Toast({ msg, type }) {
  return (
    <motion.div initial={{opacity:0,y:36,scale:0.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:36,scale:0.95}}
      className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-2.5 rounded-2xl text-sm font-medium text-white border backdrop-blur-xl whitespace-nowrap"
      style={{background:type==="error"?"rgba(239,68,68,0.18)":"rgba(99,102,241,0.18)",borderColor:type==="error"?"rgba(239,68,68,0.3)":"rgba(99,102,241,0.3)",boxShadow:type==="error"?"0 0 24px rgba(239,68,68,0.15)":"0 0 24px rgba(99,102,241,0.15)"}}>
      {msg}
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════
// PROFILE CARD (matching result)
// ════════════════════════════════════════════════════════
function ProfileCard({ p, user, isApproved, matchState, onRequest, onChat, delay=0 }) {
  const color = pal(p.id);
  const score = p._score || Math.floor(70 + Math.random()*28);
  const [pulse, setPulse] = useState(false);

  function doRequest() {
    if (matchState) return;
    setPulse(true); setTimeout(()=>setPulse(false),500);
    onRequest(p);
  }

  const isAccepted = matchState?.status === "accepted";
  const isPending = matchState?.status === "pending";
  const iSent = matchState?.from_user_id === user?.id;

  return (
    <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay}}>
      <Card className="p-4" glow={color}>
        <div className="flex items-start gap-3">
          <Av name={p.name} url={p.avatar_url} color={color} size="md"/>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-white font-semibold text-sm leading-tight">{p.name}</div>
                <div className="text-white/30 text-xs mt-0.5">{p.role||"Founder"}{p.location?` · ${p.location}`:""}</div>
              </div>
              <Ring score={score}/>
            </div>
            {p.bio&&<p className="text-white/40 text-xs mt-1.5 leading-relaxed line-clamp-2">{p.bio}</p>}
            {p.skills?.length>0&&<div className="flex flex-wrap gap-1 mt-2">{p.skills.slice(0,4).map((s,i)=><Tag key={s} skill={s} idx={i}/>)}</div>}
            {p.project_name&&(
              <div className="mt-2.5 p-2 rounded-lg bg-white/[0.03] border border-white/5">
                <span className="text-[10px] text-white/25 font-mono uppercase tracking-wider">Project · </span>
                <span className="text-white/60 text-xs font-medium">{p.project_name}</span>
                {p.project_industry&&<span className="ml-1.5 text-[10px] text-violet-400">{p.project_industry}</span>}
              </div>
            )}
            {/* Contact reveal */}
            {!isAccepted&&(
              <div className="mt-2.5 p-2.5 rounded-xl bg-white/[0.025] border border-white/[0.06] relative overflow-hidden">
                <div className="blur-sm select-none text-[11px] text-white/40 space-y-0.5 pointer-events-none">
                  <div>📧 {p.email||`${p.name?.toLowerCase().replace(/ /g,"")}@example.com`}</div>
                  <div>📱 +XX XXX XXX XXXX</div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px] rounded-xl">
                  <span className="text-[11px] text-white/35">🔒 Connect to reveal</span>
                </div>
              </div>
            )}
            {isAccepted&&(
              <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
                <div className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider mb-1">✓ Matched — Contact Revealed</div>
                <div className="text-[11px] text-white/55 space-y-0.5">
                  <div>📧 {p.email}</div>
                  {p.mobile&&<div>📱 {p.mobile}</div>}
                </div>
              </div>
            )}
            <div className="flex gap-2 mt-3">
              <motion.button animate={pulse?{scale:[1,1.1,1]}:{}} transition={{duration:0.4}}
                onClick={doRequest} disabled={!!matchState&&!isAccepted}
                className="flex-1 py-2 rounded-xl text-[11px] font-semibold transition-all disabled:cursor-default"
                style={isAccepted
                  ?{background:"rgba(16,185,129,0.12)",border:"1px solid rgba(16,185,129,0.25)",color:"#34d399"}
                  :isPending&&iSent
                  ?{background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.2)",color:"#818cf8"}
                  :isPending&&!iSent
                  ?{background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.2)",color:"#fbbf24"}
                  :{background:`${color}20`,border:`1px solid ${color}40`,color,boxShadow:`0 0 12px ${color}12`}}>
                {isAccepted?"✓ Connected":isPending&&iSent?"↗ Sent":isPending&&!iSent?"↙ Awaiting you":user?isApproved?"Request Match":"Approval needed":"Sign in to match"}
              </motion.button>
              {isAccepted&&onChat&&(
                <button onClick={()=>onChat(p,matchState)} className="px-3 py-2 rounded-xl text-[11px] font-semibold bg-indigo-500/12 border border-indigo-500/25 text-indigo-400 hover:bg-indigo-500/20 transition-all">💬</button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════
// CHAT MODAL
// ════════════════════════════════════════════════════════
function ChatModal({ matchId, other, me, myProfile, onClose }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef();
  const inputRef = useRef();
  const otherColor = pal(other?.id);

  useEffect(() => {
    supabase.from("messages").select("*, sender:profiles(name,avatar_url)").eq("match_id", matchId).order("created_at")
      .then(({ data }) => { setMsgs(data||[]); setLoading(false); });

    const ch = supabase.channel(`chat_${matchId}`)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"messages",filter:`match_id=eq.${matchId}`},
        async ({ new: row }) => {
          const { data } = await supabase.from("messages").select("*, sender:profiles(name,avatar_url)").eq("id", row.id).single();
          if (data) setMsgs(p=>[...p, data]);
        }).subscribe();
    return () => supabase.removeChannel(ch);
  }, [matchId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [msgs]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  async function send() {
    if (!text.trim()||sending) return;
    setSending(true);
    await supabase.from("messages").insert({ match_id: matchId, sender_id: me.id, content: text.trim() });
    setText(""); setSending(false);
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
      <motion.div initial={{y:60,scale:0.96}} animate={{y:0,scale:1}} exit={{y:60,scale:0.95}}
        className="w-full max-w-md flex flex-col overflow-hidden rounded-2xl border border-white/10"
        style={{height:"70vh",background:"#0a0c14",boxShadow:`0 0 40px ${otherColor}18`}}>
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-white/[0.07]">
          <Av name={other?.name} url={other?.avatar_url} color={otherColor} size="sm"/>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-semibold truncate">{other?.name}</div>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>Connected</div>
          </div>
          <button onClick={onClose} className="text-white/25 hover:text-white/60 transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5">✕</button>
        </div>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading&&<div className="text-center text-white/20 text-xs py-8">Loading…</div>}
          {!loading&&msgs.length===0&&<div className="text-center text-white/20 text-sm py-10">Say hello to {other?.name}! 👋</div>}
          {msgs.map(m=>{
            const isMe = m.sender_id===me?.id;
            return (
              <div key={m.id} className={`flex gap-2 ${isMe?"flex-row-reverse":""}`}>
                {!isMe&&<Av name={m.sender?.name} url={m.sender?.avatar_url} color={otherColor} size="xs"/>}
                <div className={`max-w-[76%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed ${isMe?"rounded-tr-sm text-white":"rounded-tl-sm text-white/75"}`}
                  style={isMe?{background:"rgba(99,102,241,0.22)",border:"1px solid rgba(99,102,241,0.28)"}:{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)"}}>
                  {m.content}
                  <div className="text-[9px] text-white/18 mt-0.5 text-right">{ago(m.created_at)}</div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef}/>
        </div>
        {/* Input */}
        <div className="p-3 border-t border-white/[0.07] flex gap-2">
          <input ref={inputRef} value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
            placeholder="Type a message…"
            className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/40 transition-all"/>
          <motion.button onClick={send} disabled={!text.trim()||sending} whileTap={{scale:0.93}}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-30 transition-all"
            style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)"}}>
            ↑
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════
// LOGIN SCREEN
// ════════════════════════════════════════════════════════
function LoginScreen() {
  const [loading, setLoading] = useState(false);
  async function signIn() {
    setLoading(true);
    await supabase.auth.signInWithOAuth({ provider:"google", options:{ redirectTo: window.location.origin } });
  }
  return (
    <div className="min-h-screen bg-[#07090f] flex items-center justify-center p-4 relative overflow-hidden">
      <Grid/>
      <motion.div initial={{opacity:0,scale:0.9,y:20}} animate={{opacity:1,scale:1,y:0}} transition={{duration:0.5,ease:[0.22,1,0.36,1]}}
        className="relative z-10 w-full max-w-sm">
        <Card className="p-8 text-center" glow="#6366f1">
          <motion.div animate={{rotate:360}} transition={{duration:22,repeat:Infinity,ease:"linear"}}
            className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center text-2xl"
            style={{background:"radial-gradient(circle at 35% 35%,rgba(99,102,241,0.22),rgba(139,92,246,0.12))",border:"1px solid rgba(99,102,241,0.35)"}}>✦</motion.div>
          <h1 className="text-[22px] font-bold text-white tracking-tight">CoFounder AI</h1>
          <p className="text-white/38 text-sm mt-1.5 mb-8 leading-relaxed">AI-powered co-founder matching<br/>for the next generation of builders</p>
          <div className="space-y-3 mb-8 text-left">
            {[["✦","AI matching across skills & vision"],["◉","Private contact reveal on mutual match"],["💬","Real-time chat once connected"],["📅","Founder events & meetups"]].map(([ic,tx])=>(
              <div key={tx} className="flex items-center gap-3 text-sm text-white/42"><span className="text-indigo-400/80 text-xs w-4 text-center">{ic}</span>{tx}</div>
            ))}
          </div>
          <motion.button onClick={signIn} disabled={loading} whileHover={{scale:1.02}} whileTap={{scale:0.97}}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/12 bg-white/[0.05] hover:bg-white/[0.08] transition-all text-sm font-semibold text-white disabled:opacity-60">
            {loading
              ?<svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
              :<svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>}
            {loading?"Redirecting…":"Continue with Google"}
          </motion.button>
          <p className="text-white/18 text-[11px] mt-4">Browse freely. Approval needed for matching & events.</p>
        </Card>
      </motion.div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// MATCHING TAB
// ════════════════════════════════════════════════════════
function MatchTab({ user, profile, isApproved, showToast }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [matchMap, setMatchMap] = useState({});
  const [chat, setChat] = useState(null);
  const [realProfiles, setRealProfiles] = useState([]);

  useEffect(() => {
    supabase.from("profiles").select("*").neq("id", user?.id||"x").eq("is_approved",true)
      .then(({data, error})=>{ if(!error && data?.length) setRealProfiles(data); })
      .catch(()=>{});
    if (user) {
      supabase.from("match_requests").select("*").or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .then(({data})=>{
          const m={};
          (data||[]).forEach(r=>{ const o=r.from_user_id===user.id?r.to_user_id:r.from_user_id; m[o]=r; });
          setMatchMap(m);
        }).catch(()=>{});
    }
  }, [user]);

  function score(p) {
    const q=query.toLowerCase(); let s=55;
    if (!q) return 55+Math.floor(Math.random()*40);
    (p.skills||[]).forEach(sk=>{ if(sk.toLowerCase().includes(q)) s+=14; });
    if ((p.bio||"").toLowerCase().includes(q)) s+=10;
    if ((p.role||"").toLowerCase().includes(q)) s+=8;
    if ((p.project_industry||"").toLowerCase().includes(q)) s+=8;
    return Math.min(99, s);
  }

  async function doMatch() {
    setScanning(true); setResults(null);
    await new Promise(r=>setTimeout(r,1400));
    const pool = realProfiles.length > 0 ? realProfiles : DEMO_PROFILES;
    const scored = pool.map(p=>({...p,_score:score(p)})).sort((a,b)=>b._score-a._score);
    setResults(scored); setScanning(false);
  }

  async function handleRequest(p) {
    if (!user) { showToast("Sign in to send match requests","error"); return; }
    if (!isApproved) { showToast("Account pending approval","error"); return; }
    try {
      const { data, error } = await supabase.from("match_requests")
        .insert({from_user_id:user.id, to_user_id:p.id}).select().single();
      if (error) throw error;
      setMatchMap(m=>({...m,[p.id]:data}));
      showToast(`Match request sent to ${p.name} ✓`);
    } catch(e) { showToast(e.message,"error"); }
  }

  return (
    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}} transition={{duration:0.3}} className="space-y-4">
      <div className="mb-5"><h2 className="text-[18px] font-bold text-white tracking-tight">AI Matching</h2><p className="text-xs text-white/35 mt-0.5">Describe what you need — or browse all founders</p></div>

      <Card className="p-4" glow="#06b6d4">
        <div className="space-y-3">
          <div className="relative">
            <span className="absolute left-3 top-3 text-cyan-400/80 text-sm pointer-events-none">✦</span>
            <textarea value={query} onChange={e=>setQuery(e.target.value)} placeholder="e.g. CTO with blockchain and Fintech experience…" rows={2}
              className="w-full bg-white/[0.05] border border-cyan-500/18 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-white/18 focus:outline-none focus:border-cyan-500/35 transition-all resize-none"/>
          </div>
          <Btn onClick={doMatch} loading={scanning} className="w-full" s={{background:"linear-gradient(135deg,#0891b2,#6366f1)"}}>
            {scanning?"Scanning profiles…":"✦ Find Co-Founders"}
          </Btn>
          {!user&&<p className="text-[11px] text-center text-white/28">Sign in to send match requests</p>}
          {user&&!isApproved&&<p className="text-[11px] text-center text-amber-400/60">⚠ Account pending approval — browsing only</p>}
        </div>
      </Card>

      <AnimatePresence>
        {results&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-3">
            <div className="text-[11px] text-white/25 font-mono uppercase tracking-widest px-0.5">{results.length} founders found</div>
            {results.map((p,i)=>(
              <ProfileCard key={p.id} p={p} user={user} isApproved={isApproved}
                matchState={matchMap[p.id]} delay={i*0.07}
                onRequest={handleRequest}
                onChat={(p,mr)=>setChat({matchId:mr.id, other:p})}/>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {chat&&<ChatModal matchId={chat.matchId} other={chat.other} me={user} myProfile={profile} onClose={()=>setChat(null)}/>}
      </AnimatePresence>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════
// PROFILE TAB
// ════════════════════════════════════════════════════════
function ProfileTab({ user, profile, setProfile, showToast, isApproved }) {
  const [form, setForm] = useState({name:"",bio:"",experience:"",location:"",skills:[],mobile:"",role:"",project_name:"",project_pitch:"",project_industry:""});
  const [newSkill, setNewSkill] = useState("");
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState("identity");

  useEffect(()=>{
    if (profile) setForm({
      name:profile.name||"",bio:profile.bio||"",experience:profile.experience||"",
      location:profile.location||"",skills:profile.skills||[],mobile:profile.mobile||"",
      role:profile.role||"",project_name:profile.project_name||"",
      project_pitch:profile.project_pitch||"",project_industry:profile.project_industry||""
    });
  },[profile]);

  const pitchScore = (()=>{
    let s=0;
    if(form.project_name?.length>3) s+=25;
    if(form.project_pitch?.length>20) s+=30;
    if(form.project_pitch?.length>80) s+=20;
    if(form.project_industry) s+=25;
    return Math.min(s,100);
  })();

  async function save() {
    setSaving(true);
    try {
      const {error} = await supabase.from("profiles").update({
        name:form.name, bio:form.bio, experience:parseInt(form.experience)||0,
        location:form.location, skills:form.skills, mobile:form.mobile, role:form.role,
        project_name:form.project_name, project_pitch:form.project_pitch,
        project_industry:form.project_industry, updated_at:new Date().toISOString()
      }).eq("id",user.id);
      if (error) throw error;
      setProfile(p=>({...p,...form}));
      showToast("Profile saved ✓");
    } catch(e) { showToast(e.message,"error"); }
    setSaving(false);
  }

  function addSkill(e) {
    if (e.key==="Enter"&&newSkill.trim()&&!form.skills.includes(newSkill.trim())) {
      setForm(f=>({...f,skills:[...f.skills,newSkill.trim()]})); setNewSkill("");
    }
  }
  const color = pal(user?.id);

  return (
    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}} transition={{duration:0.3}} className="space-y-4">
      {/* ID Card */}
      <Card className="p-5" glow={color}>
        <div className="flex items-center gap-4">
          <Av name={form.name||profile?.name} url={profile?.avatar_url} color={color} size="lg"/>
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold truncate">{form.name||"Your Name"}</div>
            <div className="text-white/35 text-xs truncate">{user?.email}</div>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/><span className="text-emerald-400 text-xs">Active</span></div>
              {isApproved?<Pip color="emerald">Approved</Pip>:<Pip color="amber">Pending</Pip>}
              {profile?.is_admin&&<Pip color="violet">Admin</Pip>}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/[0.06] text-xs">
          {[[form.experience||0,"yrs","Experience"],[form.skills.length,"","Skills"],[form.project_name||"—","","Project"]].map(([v,u,l])=>(
            <div key={l}><span className="text-white/25 block font-mono uppercase tracking-wider text-[10px] mb-0.5">{l}</span><span className="text-white font-semibold truncate block">{v}{u&&` ${u}`}</span></div>
          ))}
        </div>
      </Card>

      {/* Section switcher */}
      <div className="grid grid-cols-3 gap-1.5">
        {[["identity","◉ Identity"],["project","⬡ Project"],["contact","🔐 Contact"]].map(([id,lb])=>(
          <button key={id} onClick={()=>setSection(id)}
            className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
              section===id
                ?"text-white border-indigo-500/50"
                :"bg-white/[0.04] border-white/12 text-white/50 hover:text-white/75 hover:bg-white/[0.07]"
            }`}
            style={section===id?{background:"linear-gradient(135deg,rgba(99,102,241,0.22),rgba(139,92,246,0.14))",boxShadow:"0 0 12px rgba(99,102,241,0.15)"}:undefined}>
            {lb}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {section==="identity"&&(
          <motion.div key="id" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-3">
            <Card className="p-5 space-y-4">
              <Field label="Full Name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Your name" icon="👤"/>
              <Field label="Role / Title" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} placeholder="CEO, CTO, Designer…" icon="🏷"/>
              <Field label="Location" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="San Francisco, CA" icon="📍"/>
              <Field label="Years Experience" type="number" value={form.experience} onChange={e=>setForm(f=>({...f,experience:e.target.value}))} placeholder="5" icon="⚡"/>
              <Field label="Bio" value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))} placeholder="What are you building and why?" rows={3}/>
              <div className="space-y-1.5">
                <label className="text-[11px] text-white/35 font-mono uppercase tracking-widest">Skills</label>
                <div className="flex flex-wrap gap-1.5 mb-2">{form.skills.map((s,i)=><Tag key={i} skill={s} idx={i} onRemove={()=>setForm(f=>({...f,skills:f.skills.filter((_,j)=>j!==i)}))}/>)}</div>
                <input value={newSkill} onChange={e=>setNewSkill(e.target.value)} onKeyDown={addSkill} placeholder="Type skill → Enter to add"
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/18 focus:outline-none focus:border-indigo-500/45 transition-all"/>
              </div>
            </Card>
          </motion.div>
        )}
        {section==="project"&&(
          <motion.div key="proj" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-3">
            <Card className="p-5 space-y-4" glow="#8b5cf6">
              <Field label="Project Name" value={form.project_name} onChange={e=>setForm(f=>({...f,project_name:e.target.value}))} placeholder="HealthAI Platform" icon="🚀"/>
              <Field label="Elevator Pitch" value={form.project_pitch} onChange={e=>setForm(f=>({...f,project_pitch:e.target.value}))} placeholder="What problem, for whom, why now?" rows={4}/>
              <div className="space-y-1.5">
                <label className="text-[11px] text-white/35 font-mono uppercase tracking-widest">Industry</label>
                <div className="flex flex-wrap gap-2">{INDUSTRIES.map(ind=>(
                  <motion.button key={ind} whileTap={{scale:0.93}} onClick={()=>setForm(f=>({...f,project_industry:ind}))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${form.project_industry===ind?"bg-indigo-500/18 border-indigo-500/45 text-indigo-300":"bg-white/[0.04] border-white/8 text-white/35 hover:text-white/55 hover:border-white/18"}`}>{ind}</motion.button>
                ))}</div>
              </div>
              <div className="pt-1 border-t border-white/[0.05]"><Meter val={pitchScore}/></div>
            </Card>
          </motion.div>
        )}
        {section==="contact"&&(
          <motion.div key="contact" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2"><span className="text-sm font-semibold text-white">Private Contact</span><span className="ml-auto text-[10px] text-white/28 bg-white/[0.05] px-2 py-0.5 rounded-full border border-white/8">Mutual match only</span></div>
              <Field label="Email" value={user?.email||""} disabled icon="📧" locked/>
              <Field label="Mobile" value={form.mobile} onChange={e=>setForm(f=>({...f,mobile:e.target.value}))} placeholder="+1 415 000 0000" icon="📱" locked/>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Btn onClick={save} loading={saving} className="w-full">Save Profile</Btn>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════
// NOTIFICATIONS TAB
// ════════════════════════════════════════════════════════
function InboxTab({ user, showToast }) {
  const [requests, setRequests] = useState([]);
  const [profs, setProfs] = useState({});
  const [loading, setLoading] = useState(true);
  const [chat, setChat] = useState(null);

  async function load() {
    if (!user) return;
    const {data} = await supabase.from("match_requests").select("*")
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`).order("created_at",{ascending:false});
    setRequests(data||[]);
    const ids=[...new Set((data||[]).flatMap(r=>[r.from_user_id,r.to_user_id]).filter(id=>id!==user.id))];
    if (ids.length) {
      const {data:p} = await supabase.from("profiles").select("*").in("id",ids);
      const m={}; (p||[]).forEach(x=>m[x.id]=x); setProfs(m);
    }
    setLoading(false);
  }

  useEffect(()=>{ load(); },[user]);

  async function action(req, status) {
    const {error} = await supabase.from("match_requests").update({status}).eq("id",req.id);
    if (error) { showToast(error.message,"error"); return; }
    setRequests(r=>r.map(x=>x.id===req.id?{...x,status}:x));
    showToast(status==="accepted"?"Match accepted! Contact revealed ✓":"Request declined");
  }

  const pending = requests.filter(r=>r.status==="pending"&&r.to_user_id===user?.id);
  const rest = requests.filter(r=>r.status!=="pending"||r.from_user_id===user?.id);

  return (
    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}} transition={{duration:0.3}} className="space-y-4">
      <div className="mb-5"><h2 className="text-[18px] font-bold text-white">Inbox</h2><p className="text-xs text-white/35 mt-0.5">Match requests & connection updates</p></div>

      {loading&&<div className="text-center text-white/25 py-10 text-sm">Loading…</div>}
      {!loading&&requests.length===0&&(
        <Card className="p-10 text-center"><div className="text-3xl mb-3 opacity-40">◈</div><div className="text-white/35 text-sm">No notifications yet</div></Card>
      )}

      {pending.length>0&&(
        <div className="space-y-3">
          <div className="text-[11px] text-white/25 font-mono uppercase tracking-widest flex items-center gap-2">Incoming <Pip color="indigo">{pending.length}</Pip></div>
          {pending.map((req,i)=>{
            const o=profs[req.from_user_id]; const color=pal(o?.id);
            return (
              <motion.div key={req.id} initial={{opacity:0,x:-14}} animate={{opacity:1,x:0}} transition={{delay:i*0.06}}>
                <Card className="p-4" glow={color}>
                  <div className="flex items-start gap-3">
                    <Av name={o?.name} url={o?.avatar_url} color={color} size="sm"/>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div><div className="text-white text-sm font-semibold">{o?.name||"Unknown"}</div><div className="text-white/28 text-[11px]">{ago(req.created_at)}</div></div>
                        <Pip color="amber">Pending</Pip>
                      </div>
                      {o?.project_name&&(
                        <div className="mt-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                          <div className="text-[10px] text-white/28 font-mono uppercase tracking-wider mb-0.5">Their Project</div>
                          <div className="text-white text-sm font-medium">{o.project_name}</div>
                          {o.project_pitch&&<div className="text-white/38 text-xs mt-0.5 line-clamp-2">{o.project_pitch}</div>}
                        </div>
                      )}
                      <div className="flex gap-2 mt-3">
                        <Btn onClick={()=>action(req,"accepted")} variant="success" className="flex-1">✓ Accept & Reveal</Btn>
                        <Btn onClick={()=>action(req,"declined")} variant="danger" className="flex-1">✕ Decline</Btn>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {rest.length>0&&(
        <div className="space-y-3">
          {pending.length>0&&<div className="text-[11px] text-white/18 font-mono uppercase tracking-widest">History</div>}
          {rest.map(req=>{
            const oid = req.from_user_id===user?.id ? req.to_user_id : req.from_user_id;
            const o=profs[oid]; const color=pal(o?.id);
            const accepted = req.status==="accepted";
            return (
              <Card key={req.id} className={`p-4 ${accepted?"":"opacity-55"}`}>
                <div className="flex items-center gap-3">
                  <Av name={o?.name} url={o?.avatar_url} color={color} size="sm"/>
                  <div className="flex-1 min-w-0">
                    <div className="text-white/80 text-sm font-medium truncate">{o?.name||"Unknown"}</div>
                    <div className="text-white/28 text-[11px]">{req.from_user_id===user?.id?"You sent":"Sent you"} · {ago(req.created_at)}</div>
                    {accepted&&o&&<div className="text-[11px] text-white/45 mt-1">📧 {o.email}{o.mobile&&` · 📱 ${o.mobile}`}</div>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Pip color={req.status==="accepted"?"emerald":req.status==="declined"?"red":"indigo"}>
                      {req.status==="accepted"?"Connected":req.status==="declined"?"Declined":"Pending"}
                    </Pip>
                    {accepted&&<button onClick={()=>setChat({matchId:req.id,other:o})} className="px-2.5 py-1 rounded-lg text-xs bg-indigo-500/12 border border-indigo-500/22 text-indigo-400 hover:bg-indigo-500/20 transition-all">💬</button>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AnimatePresence>{chat&&<ChatModal matchId={chat.matchId} other={chat.other} me={user} onClose={()=>setChat(null)}/>}</AnimatePresence>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════
// EVENTS TAB
// ════════════════════════════════════════════════════════
function EventsTab({ user, isApproved, showToast }) {
  const [events, setEvents] = useState([]);
  const [attMap, setAttMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({title:"",description:"",location:"",event_date:"",max_attendees:"",industry_tags:[]});

  async function load() {
    try {
      const {data:evs, error} = await supabase.from("events").select("*, creator:profiles(name,avatar_url,id)").order("event_date");
      if (error || !evs || evs.length === 0) {
        // Table doesn't exist yet or no events — show demo events
        setEvents(DEMO_EVENTS);
      } else {
        setEvents(evs);
        const {data:att} = await supabase.from("event_attendees").select("*").in("event_id", evs.map(e=>e.id));
        const m={}; (att||[]).forEach(a=>{ if(!m[a.event_id]) m[a.event_id]=[]; m[a.event_id].push(a.user_id); });
        setAttMap(m);
      }
    } catch(e) {
      // Any error — fall back to demo events so the page always shows content
      setEvents(DEMO_EVENTS);
    }
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  async function createEvent() {
    if (!form.title||!form.event_date) { showToast("Title & date required","error"); return; }
    setSaving(true);
    const {error} = await supabase.from("events").insert({...form, creator_id:user.id, max_attendees:parseInt(form.max_attendees)||null, industry_tags:form.industry_tags});
    if (error) { showToast(error.message,"error"); setSaving(false); return; }
    showToast("Event created ✓"); setShowForm(false); setForm({title:"",description:"",location:"",event_date:"",max_attendees:"",industry_tags:[]});
    load(); setSaving(false);
  }

  async function toggleAttend(evId) {
    if (!user) { showToast("Sign in to attend events","error"); return; }
    if (!isApproved) { showToast("Account pending approval","error"); return; }
    const attending = attMap[evId]?.includes(user.id);
    if (attending) await supabase.from("event_attendees").delete().eq("event_id",evId).eq("user_id",user.id);
    else await supabase.from("event_attendees").insert({event_id:evId,user_id:user.id});
    load();
  }

  const now = new Date();

  return (
    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}} transition={{duration:0.3}} className="space-y-4">
      <div className="flex items-start justify-between mb-5">
        <div><h2 className="text-[18px] font-bold text-white">Events</h2><p className="text-xs text-white/35 mt-0.5">Founder meetups, demos & networking</p></div>
        {isApproved&&<motion.button whileHover={{scale:1.04}} whileTap={{scale:0.95}} onClick={()=>setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white"
          style={{background:showForm?"rgba(255,255,255,0.08)":"linear-gradient(135deg,#6366f1,#8b5cf6)"}}>
          {showForm?"✕ Cancel":"+ Create"}
        </motion.button>}
      </div>

      <AnimatePresence>
        {showForm&&(
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} style={{overflow:"hidden"}}>
            <Card className="p-5 space-y-4 mb-2" glow="#8b5cf6">
              <div className="text-sm font-semibold text-white">New Event</div>
              <Field label="Title" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Founder Meetup SF" icon="🗓"/>
              <Field label="Description" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="What's this about?" rows={2}/>
              <Field label="Location" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="San Francisco or Online" icon="📍"/>
              <Field label="Date & Time" type="datetime-local" value={form.event_date} onChange={e=>setForm(f=>({...f,event_date:e.target.value}))} icon="⏰"/>
              <Field label="Max Attendees" type="number" value={form.max_attendees} onChange={e=>setForm(f=>({...f,max_attendees:e.target.value}))} placeholder="50 (optional)" icon="👥"/>
              <div className="space-y-1.5">
                <label className="text-[11px] text-white/35 font-mono uppercase tracking-widest">Tags</label>
                <div className="flex flex-wrap gap-1.5">{INDUSTRIES.slice(0,8).map(ind=>(
                  <button key={ind} onClick={()=>setForm(f=>({...f,industry_tags:f.industry_tags.includes(ind)?f.industry_tags.filter(t=>t!==ind):[...f.industry_tags,ind]}))}
                    className={`px-2.5 py-1 rounded-xl text-[11px] border transition-all ${form.industry_tags.includes(ind)?"bg-indigo-500/18 border-indigo-500/38 text-indigo-300":"bg-white/[0.04] border-white/8 text-white/35"}`}>{ind}</button>
                ))}</div>
              </div>
              <Btn onClick={createEvent} loading={saving} className="w-full">Create Event</Btn>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {loading&&<div className="text-center text-white/25 py-10 text-sm">Loading events…</div>}
      {!loading&&events.length===0&&(
        <Card className="p-10 text-center"><div className="text-3xl mb-3 opacity-40">📅</div><div className="text-white/35 text-sm">No events yet</div><div className="text-white/20 text-xs mt-1">{isApproved?"Create the first one!":"Events will appear here"}</div></Card>
      )}

      <div className="space-y-3">
        {events.map((ev,i)=>{
          const d=new Date(ev.event_date), past=d<now;
          const attending=attMap[ev.id]?.includes(user?.id);
          const count=attMap[ev.id]?.length||0;
          const full=ev.max_attendees&&count>=ev.max_attendees;
          const cc=pal(ev.creator_id);
          return (
            <motion.div key={ev.id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}>
              <Card className={`p-4 ${past?"opacity-45":""}`} glow={attending?"#6366f1":undefined}>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl flex-shrink-0 flex flex-col items-center justify-center text-center"
                    style={{background:`${cc}12`,border:`1px solid ${cc}28`}}>
                    <div className="text-[10px] font-bold text-white/60 uppercase">{d.toLocaleDateString("en",{month:"short"})}</div>
                    <div className="text-xl font-bold text-white leading-none">{d.getDate()}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-white text-sm leading-tight">{ev.title}</div>
                      {past?<Pip color="red">Past</Pip>:attending?<Pip color="emerald">Going ✓</Pip>:<Pip color="indigo">Open</Pip>}
                    </div>
                    {ev.description&&<p className="text-white/38 text-xs mt-1 line-clamp-2 leading-relaxed">{ev.description}</p>}
                    <div className="flex flex-wrap gap-3 mt-1.5 text-[11px] text-white/28">
                      {ev.location&&<span>📍 {ev.location}</span>}
                      <span>⏰ {d.toLocaleTimeString("en",{hour:"2-digit",minute:"2-digit"})}</span>
                      <span>👥 {count}{ev.max_attendees?` / ${ev.max_attendees}`:""}</span>
                    </div>
                    {ev.industry_tags?.length>0&&<div className="flex flex-wrap gap-1 mt-2">{ev.industry_tags.map((t,i)=><Tag key={t} skill={t} idx={i}/>)}</div>}
                    <div className="flex items-center gap-2 mt-3">
                      <Av name={ev.creator?.name} url={ev.creator?.avatar_url} color={cc} size="xs"/>
                      <span className="text-[11px] text-white/28 flex-1 truncate">by {ev.creator?.name||"Unknown"}</span>
                      {!past&&(
                        <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.96}}
                          onClick={()=>toggleAttend(ev.id)} disabled={full&&!attending}
                          className="px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all disabled:opacity-35"
                          style={attending?{background:"rgba(239,68,68,0.14)",border:"1px solid rgba(239,68,68,0.28)",color:"#f87171"}:{background:"rgba(99,102,241,0.14)",border:"1px solid rgba(99,102,241,0.28)",color:"#818cf8"}}>
                          {attending?"Leave":full?"Full":"Attend"}
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════
// ADMIN / MANAGE TAB
// ════════════════════════════════════════════════════════
function ManageTab({ showToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  async function load() {
    const {data} = await supabase.from("profiles").select("*").order("created_at",{ascending:false});
    setUsers(data||[]); setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  async function toggleApprove(id, cur) {
    await supabase.from("profiles").update({is_approved:!cur}).eq("id",id);
    setUsers(u=>u.map(x=>x.id===id?{...x,is_approved:!cur}:x));
    showToast(!cur?"User approved ✓":"Approval revoked");
  }
  async function toggleAdmin(id, cur) {
    await supabase.from("profiles").update({is_admin:!cur}).eq("id",id);
    setUsers(u=>u.map(x=>x.id===id?{...x,is_admin:!cur}:x));
    showToast(!cur?"Admin granted ✓":"Admin revoked");
  }

  const filtered = filter==="pending"?users.filter(u=>!u.is_approved):filter==="approved"?users.filter(u=>u.is_approved):users;

  return (
    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}} transition={{duration:0.3}} className="space-y-4">
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-0.5"><h2 className="text-[18px] font-bold text-white">Manage</h2><Pip color="violet">Admin</Pip></div>
        <p className="text-xs text-white/35">Approve accounts & manage all users</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[["All",users.length],["Pending",users.filter(u=>!u.is_approved).length],["Active",users.filter(u=>u.is_approved).length]].map(([l,c])=>(
          <Card key={l} className="p-3 text-center"><div className="text-xl font-bold text-white">{c}</div><div className="text-[10px] text-white/28 mt-0.5">{l}</div></Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {["all","pending","approved"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            className={`py-2.5 rounded-xl text-xs font-semibold border capitalize transition-all ${
              filter===f?"text-white border-indigo-500/50":"bg-white/[0.04] border-white/12 text-white/50 hover:text-white/75"
            }`}
            style={filter===f?{background:"linear-gradient(135deg,rgba(99,102,241,0.22),rgba(139,92,246,0.14))",boxShadow:"0 0 12px rgba(99,102,241,0.15)"}:undefined}>
            {f}
          </button>
        ))}
      </div>

      {loading&&<div className="text-center text-white/25 py-10 text-sm">Loading…</div>}

      <div className="space-y-3">
        {filtered.map((u,i)=>{
          const color=pal(u.id);
          return (
            <motion.div key={u.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}>
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <Av name={u.name} url={u.avatar_url} color={color} size="sm"/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div><div className="text-white text-sm font-semibold truncate">{u.name||"Unnamed"}</div><div className="text-white/28 text-[11px] truncate">{u.email}</div></div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {u.is_admin&&<Pip color="violet">Admin</Pip>}
                        <Pip color={u.is_approved?"emerald":"amber"}>{u.is_approved?"Approved":"Pending"}</Pip>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-white/25">
                      {u.location&&<span>📍 {u.location}</span>}
                      {u.skills?.length>0&&<span>⚡ {u.skills.length} skills</span>}
                      <span className="ml-auto">Joined {ago(u.created_at)}</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Btn onClick={()=>toggleApprove(u.id,u.is_approved)} variant={u.is_approved?"danger":"success"} className="flex-1">
                        {u.is_approved?"Revoke":"✓ Approve"}
                      </Btn>
                      <button onClick={()=>toggleAdmin(u.id,u.is_admin)}
                        className={`px-3 py-2 rounded-xl text-[11px] font-semibold border transition-all ${u.is_admin?"bg-violet-500/15 border-violet-500/28 text-violet-300":"bg-white/[0.04] border-white/8 text-white/35 hover:text-white/55"}`}>
                        {u.is_admin?"Admin ✓":"Make Admin"}
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════
// ROOT
// ════════════════════════════════════════════════════════
export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("matching");
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type="success") => {
    setToast({msg,type}); setTimeout(()=>setToast(null),3000);
  },[]);

  useEffect(() => {
    supabase.auth.getSession().then(({data:{session}})=>{
      setSession(session);
      if (session) loadProfile(session.user);
    });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,s)=>{
      setSession(s);
      if (s) loadProfile(s.user); else { setProfile(null); }
    });
    return ()=>subscription.unsubscribe();
  },[]);

  async function loadProfile(u) {
    let {data} = await supabase.from("profiles").select("*").eq("id",u.id).single();
    if (!data) {
      const {data:created} = await supabase.from("profiles").upsert({
        id:u.id, email:u.email,
        name:u.user_metadata?.full_name||u.email?.split("@")[0],
        avatar_url:u.user_metadata?.avatar_url,
        is_admin:u.email===ADMIN_EMAIL,
        is_approved:u.email===ADMIN_EMAIL,
      }).select().single();
      data=created;
    }
    // Ensure admin flag stays for admin email
    if (u.email===ADMIN_EMAIL&&!data?.is_admin) {
      await supabase.from("profiles").update({is_admin:true,is_approved:true}).eq("id",u.id);
      data={...data,is_admin:true,is_approved:true};
    }
    setProfile(data);
  }

  // Loading
  if (session===undefined) {
    return (
      <div className="min-h-screen bg-[#07090f] flex items-center justify-center">
        <Grid/>
        <motion.div animate={{rotate:360}} transition={{duration:2,repeat:Infinity,ease:"linear"}}
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl text-indigo-400"
          style={{background:"radial-gradient(circle,rgba(99,102,241,0.2),transparent)",border:"1px solid rgba(99,102,241,0.3)"}}>✦</motion.div>
      </div>
    );
  }

  const user = session?.user;
  const isApproved = profile?.is_approved||false;
  const isAdmin = profile?.is_admin||false;

  const NAV = [
    {id:"matching",label:"Match",icon:"✦"},
    {id:"events",label:"Events",icon:"📅"},
    {id:"inbox",label:"Inbox",icon:"◈",auth:true},
    {id:"profile",label:"Profile",icon:"◉",auth:true},
    ...(isAdmin?[{id:"manage",label:"Manage",icon:"⚙",auth:true}]:[]),
  ];

  function goTab(id, auth) {
    if (auth&&!user) { showToast("Sign in to access this","error"); return; }
    setTab(id);
  }

  // Auth gate content
  const authGate = (
    <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
      <Card className="p-10 text-center" glow="#6366f1">
        <div className="text-3xl mb-3">🔐</div>
        <div className="text-white font-bold mb-1.5">Sign in required</div>
        <div className="text-white/38 text-sm mb-6 leading-relaxed">Sign in with Google to access your profile, inbox and more.</div>
        <Btn className="w-full" onClick={()=>supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.origin}})}>
          <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </Btn>
      </Card>
    </motion.div>
  );

  const needsAuth = NAV.find(n=>n.id===tab)?.auth && !user;

  return (
    <div className="min-h-screen bg-[#07090f] relative overflow-hidden">
      <Grid/>

      {/* ── Desktop header ── */}
      <header className="hidden md:flex items-center justify-between px-6 py-3.5 border-b border-white/[0.06] bg-black/25 backdrop-blur-xl relative z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-indigo-400"
            style={{background:"radial-gradient(circle,rgba(99,102,241,0.2),rgba(139,92,246,0.1))",border:"1px solid rgba(99,102,241,0.3)"}}>✦</div>
          <span className="text-white font-bold text-sm tracking-tight">CoFounder AI</span>
        </div>
        <nav className="flex items-center gap-1">
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>goTab(n.id,n.auth)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab===n.id
                  ?"text-white border"
                  :"text-white/60 hover:text-white hover:bg-white/[0.06] border border-transparent"
              }`}
              style={tab===n.id?{background:"linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.15))",borderColor:"rgba(99,102,241,0.5)",boxShadow:"0 0 16px rgba(99,102,241,0.2)"}:undefined}>
              <span className={tab===n.id?"text-indigo-300":"text-white/50"}>{n.icon}</span>
              <span>{n.label}</span>
              {tab===n.id&&<motion.div layoutId="desktop-nav-indicator" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-indigo-400" style={{boxShadow:"0 0 8px #818cf8"}}/>}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {user?(
            <>
              <div className="flex items-center gap-2">
                <Av name={profile?.name} url={profile?.avatar_url} color={pal(user.id)} size="sm"/>
                <span className="text-white/55 text-sm">{profile?.name?.split(" ")[0]||"You"}</span>
                {isApproved?<Pip color="emerald">✓</Pip>:<Pip color="amber">Pending</Pip>}
              </div>
              <button onClick={()=>supabase.auth.signOut()} className="text-white/25 hover:text-white/55 text-xs transition-colors">Sign out</button>
            </>
          ):(
            <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
              onClick={()=>supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.origin}})}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-white bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] transition-all">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Sign in with Google
            </motion.button>
          )}
        </div>
      </header>

      {/* ── Content ── */}
      <main className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-28 md:pb-12 md:pt-8">
        <AnimatePresence mode="wait">
          {needsAuth ? <div key="gate">{authGate}</div>
            : tab==="matching" ? <MatchTab key="m" user={user} profile={profile} isApproved={isApproved} showToast={showToast}/>
            : tab==="events" ? <EventsTab key="e" user={user} isApproved={isApproved} showToast={showToast}/>
            : tab==="inbox" ? <InboxTab key="i" user={user} showToast={showToast}/>
            : tab==="profile" ? <ProfileTab key="p" user={user} profile={profile} setProfile={setProfile} showToast={showToast} isApproved={isApproved}/>
            : tab==="manage"&&isAdmin ? <ManageTab key="a" showToast={showToast}/>
            : null}
        </AnimatePresence>
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-white/[0.12]" style={{background:"rgba(7,9,15,0.96)",backdropFilter:"blur(20px)"}}>
        <div className="flex items-center justify-around px-2 py-2">
          {NAV.map(n=>{
            const active=tab===n.id;
            return (
              <button key={n.id} onClick={()=>goTab(n.id,n.auth)}
                className="relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all min-w-[60px]"
                style={active?{background:"linear-gradient(135deg,rgba(99,102,241,0.22),rgba(139,92,246,0.14))",border:"1px solid rgba(99,102,241,0.4)",boxShadow:"0 0 14px rgba(99,102,241,0.18)"}:{border:"1px solid transparent"}}>
                <motion.span
                  animate={active?{scale:[1,1.15,1]}:{scale:1}}
                  transition={{duration:0.25}}
                  className="text-lg leading-none"
                  style={{
                    color: active ? "#a5b4fc" : "rgba(255,255,255,0.45)",
                    filter: active ? "drop-shadow(0 0 6px rgba(129,140,248,0.8))" : "none",
                  }}>
                  {n.icon}
                </motion.span>
                <span className="text-[10px] font-semibold leading-none" style={{color:active?"#a5b4fc":"rgba(255,255,255,0.4)"}}>
                  {n.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Toast */}
      <AnimatePresence>{toast&&<Toast key="t" msg={toast.msg} type={toast.type}/>}</AnimatePresence>
    </div>
  );
}
