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
const ud = (days,h=10,m=0) => { const d=new Date(_now); d.setDate(d.getDate()+days); d.setHours(h,m,0,0); return d.toISOString(); };
const pd = (days,h=18,m=0) => { const d=new Date(_now); d.setDate(d.getDate()-days); d.setHours(h,m,0,0); return d.toISOString(); };


// ═══ EXTRA CARD LINKS (extensible contact fields) ═══
const LINK_FIELDS = [
  {id:"instagram", label:"Instagram", emoji:"📷", ph:"@username", pre:"https://instagram.com/"},
  {id:"x",         label:"X",         emoji:"✖️", ph:"@username", pre:"https://x.com/"},
  {id:"facebook",  label:"Facebook",  emoji:"👥", ph:"Profile URL or username", pre:"https://facebook.com/"},
  {id:"youtube",   label:"YouTube",   emoji:"▶️", ph:"Channel URL", pre:""},
  {id:"tiktok",    label:"TikTok",    emoji:"🎵", ph:"@username", pre:"https://tiktok.com/@"},
  {id:"threads",   label:"Threads",   emoji:"🧵", ph:"@username", pre:"https://threads.net/@"},
  {id:"snapchat",  label:"Snapchat",  emoji:"👻", ph:"@username", pre:"https://snapchat.com/add/"},
  {id:"github",    label:"GitHub",    emoji:"💻", ph:"username", pre:"https://github.com/"},
  {id:"telegram",  label:"Telegram",  emoji:"✈️", ph:"@username", pre:"https://t.me/"},
  {id:"signal",    label:"Signal",    emoji:"🔒", ph:"Phone or link", pre:""},
  {id:"discord",   label:"Discord",   emoji:"🎮", ph:"username or invite", pre:""},
  {id:"skype",     label:"Skype",     emoji:"💬", ph:"Skype name", pre:""},
  {id:"calendly",  label:"Calendly",  emoji:"📅", ph:"Booking link", pre:""},
  {id:"paypal",    label:"PayPal",    emoji:"💳", ph:"paypal.me link", pre:""},
  {id:"venmo",     label:"Venmo",     emoji:"💵", ph:"@username", pre:""},
  {id:"yelp",      label:"Yelp",      emoji:"⭐", ph:"Business page URL", pre:""},
  {id:"address",   label:"Address",   emoji:"📍", ph:"Your address", pre:""},
  {id:"link",      label:"Other Link",emoji:"🔗", ph:"Any URL", pre:""},
];
const linkDef = (id)=>LINK_FIELDS.find(f=>f.id===id);
const linkHref = (id,val)=>{
  const d=linkDef(id); if(!d||!val) return null;
  const v=String(val).trim();
  if(d.id==="address") return `https://maps.google.com/?q=${encodeURIComponent(v)}`;
  if(/^https?:\/\//i.test(v)) return v;
  if(d.pre) return d.pre + v.replace(/^@/,"");
  return `https://${v}`;
};

// ═══ LUMA-STYLE EVENT COVER THEMES ═══
// Stored in cover_url as "theme:<id>" so no image hosting is needed.
const COVER_THEMES = [
  { id:"aurora",   grad:"linear-gradient(135deg,#7c6fe0,#a78bfa,#f0abfc)" },
  { id:"sunset",   grad:"linear-gradient(135deg,#f97316,#ec4899,#8b5cf6)" },
  { id:"ocean",    grad:"linear-gradient(135deg,#0ea5e9,#2563eb,#4f46e5)" },
  { id:"forest",   grad:"linear-gradient(135deg,#10b981,#059669,#065f46)" },
  { id:"ember",    grad:"linear-gradient(135deg,#ef4444,#f97316,#f59e0b)" },
  { id:"midnight", grad:"linear-gradient(135deg,#1e293b,#334155,#7c6fe0)" },
  { id:"candy",    grad:"linear-gradient(135deg,#ec4899,#f472b6,#fbbf24)" },
  { id:"mint",     grad:"linear-gradient(135deg,#14b8a6,#22d3ee,#a7f3d0)" },
  { id:"royal",    grad:"linear-gradient(135deg,#4c1d95,#7c3aed,#c084fc)" },
  { id:"sand",     grad:"linear-gradient(135deg,#d97706,#fbbf24,#fef3c7)" },
  { id:"slate",    grad:"linear-gradient(135deg,#0f172a,#475569,#94a3b8)" },
  { id:"bloom",    grad:"linear-gradient(135deg,#be185d,#db2777,#f9a8d4)" },
];
const themeGrad = (v) => {
  if(!v || !String(v).startsWith("theme:")) return null;
  const t = COVER_THEMES.find(x=>x.id===String(v).slice(6));
  return t ? t.grad : COVER_THEMES[0].grad;
};
// Deterministic fallback cover so every event looks designed
const autoGrad = (seed="") => {
  let h=0; for(let i=0;i<String(seed).length;i++) h=(h*31+String(seed).charCodeAt(i))>>>0;
  return COVER_THEMES[h%COVER_THEMES.length].grad;
};

// Download an .ics calendar invite for an event (works with Google/Apple/Outlook)
function downloadEventICS(ev){
  const start = new Date(ev.event_date);
  const end = new Date(start.getTime() + 2*60*60*1000);
  const dt = d => d.toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
  const esc = s => String(s||"").replace(/[\\;,]/g,m=>"\\"+m).replace(/\n/g,"\\n");
  const ics = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//ABAA//Events//EN","BEGIN:VEVENT",
    `UID:${ev.id}@abaa.au`,`DTSTAMP:${dt(new Date())}`,`DTSTART:${dt(start)}`,`DTEND:${dt(end)}`,
    `SUMMARY:${esc(ev.title)}`,`DESCRIPTION:${esc(ev.description)}`,`LOCATION:${esc(ev.location)}`,
    "END:VEVENT","END:VCALENDAR"].join("\r\n");
  const blob = new Blob([ics],{type:"text/calendar;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${(ev.title||"event").replace(/[^a-z0-9]/gi,"-").toLowerCase()}.ics`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

const DEMO_EVENTS = [
  { id:"e1", title:"AI Founders Breakfast", description:"Casual morning meetup for founders building AI-first products. Share what you're working on over coffee.", location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC", cover_url:"theme:aurora", event_date:ud(3,8,30), max_attendees:25, industry_tags:["DeepTech","SaaS"], creator:{name:"Alex Chen",id:"d1"}, attendee_count:8 },
  { id:"e2", title:"FinTech Demo Day Melbourne", description:"10 early-stage fintech founders pitch to a room of angels and VCs. Networking drinks after.", location:"Stone & Chalk, 710 Collins St, Docklands VIC", cover_url:"theme:ocean", event_date:ud(5,14,0), max_attendees:80, industry_tags:["FinTech"], creator:{name:"Daniel Kim",id:"d5"}, attendee_count:42 },
  { id:"e3", title:"Web3 Builders Hackathon", description:"48-hour hackathon building DeFi and on-chain primitives. $10K in prizes. Teams of 2-4.", location:"York Butter Factory, 62 King St, Melbourne VIC", cover_url:"theme:midnight", event_date:ud(8,9,0), max_attendees:120, industry_tags:["Web3"], creator:{name:"Sofia Russo",id:"d4"}, attendee_count:67 },
  { id:"e4", title:"EdTech Product Workshop", description:"Hands-on workshop on building engaging learning experiences. Bring your laptop and a product idea.", location:"The Cluster, 17/31 Queen St, Melbourne VIC", cover_url:"theme:mint", event_date:ud(6,16,0), max_attendees:50, industry_tags:["EdTech"], creator:{name:"Ethan Brooks",id:"d17"}, attendee_count:29 },
  { id:"e5", title:"Climate Tech Pitch Night", description:"Founders working on climate solutions pitch to a panel of impact investors. Q&A follows.", location:"Melbourne Connect, 700 Swanston St, Carlton VIC", cover_url:"theme:forest", event_date:ud(10,18,30), max_attendees:60, industry_tags:["Climate"], creator:{name:"Amara Okonkwo",id:"d7"}, attendee_count:38 },
  { id:"e6", title:"SaaS Growth Masterclass", description:"Deep dive into product-led growth strategies that took companies past $10M ARR. Real data.", location:"WeWork, 401 Collins St, Melbourne VIC", cover_url:"theme:royal", event_date:ud(7,10,0), max_attendees:40, industry_tags:["SaaS"], creator:{name:"Lena Kowalski",id:"d22"}, attendee_count:31 },
  { id:"e7", title:"Founder Speed Dating", description:"Find your co-founder in 90 minutes. 5-minute rounds with potential matches. Structured and fun.", location:"BetweenUs Cafe, 141 Maling Rd, Canterbury VIC", cover_url:"theme:candy", event_date:ud(4,18,0), max_attendees:30, industry_tags:["SaaS","FinTech"], creator:{name:"Marcus Webb",id:"d3"}, attendee_count:22 },
  { id:"e8", title:"HealthTech Investor Roundtable", description:"Closed-door roundtable connecting HealthTech founders with Series A investors. Application required.", location:"Alfred Health Precinct, Prahran VIC", cover_url:"theme:sunset", event_date:ud(12,13,0), max_attendees:16, industry_tags:["HealthTech"], creator:{name:"Tyler Washington",id:"d29"}, attendee_count:12 },
  { id:"e9", title:"Women in DeepTech Mixer", description:"Monthly mixer celebrating women building frontier technology. Allies welcome.", location:"Higher Order, 55 Elizabeth St, Melbourne VIC", cover_url:"theme:bloom", event_date:ud(9,17,30), max_attendees:70, industry_tags:["DeepTech","Climate"], creator:{name:"Zara Ahmed",id:"d18"}, attendee_count:45 },
  { id:"e10", title:"Open Source Dev Meetup", description:"Lightning talks on tooling, infra and developer experience. Pizza provided.", location:"Library at The Dock, 107 Victoria Hbr, Docklands VIC", cover_url:"theme:slate", event_date:ud(11,18,0), max_attendees:45, industry_tags:["SaaS","DeepTech"], creator:{name:"Nina Volkov",id:"d30"}, attendee_count:33 },
  { id:"e11", title:"E-commerce Founders Lunch", description:"Intimate lunch for DTC and marketplace founders. Swap playbooks, make real connections.", location:"Higher Ground, 650 Little Bourke St, Melbourne VIC", cover_url:"theme:ember", event_date:ud(13,12,30), max_attendees:20, industry_tags:["E-commerce"], creator:{name:"Nadia Petrov",id:"d12"}, attendee_count:14 },
  { id:"e12", title:"Mobile-First Product Summit", description:"Full-day summit on building exceptional mobile products. Speakers, workshops and demos.", location:"MCEC, 1 Convention Centre Pl, South Wharf VIC", cover_url:"theme:aurora", event_date:ud(16,9,0), max_attendees:200, industry_tags:["Consumer","EdTech"], creator:{name:"Mei Yamamoto",id:"d16"}, attendee_count:128 },
  { id:"e13", title:"Asian Founders Circle", description:"Monthly circle for Asian-Australian founders building global companies. Peer support and intros.", location:"Kensington Town Hall, 30 Bellair St, Kensington VIC", cover_url:"theme:sand", event_date:ud(6,17,0), max_attendees:35, industry_tags:["FinTech","E-commerce"], creator:{name:"Aisha Diallo",id:"d20"}, attendee_count:19 },
  { id:"e14", title:"B2B SaaS Metrics Deep Dive", description:"Workshop on the metrics that matter: NRR, CAC payback, magic number, with real benchmarks.", location:"Inspire9, 41 Stewart St, Richmond VIC", cover_url:"theme:ocean", event_date:ud(8,15,0), max_attendees:100, industry_tags:["SaaS"], creator:{name:"Sophie Laurent",id:"d24"}, attendee_count:73 },
  { id:"e15", title:"Property Tech Breakfast", description:"Founders and operators in proptech share what's working in a shifting market.", location:"Sofitel Melbourne, 25 Collins St, Melbourne VIC", cover_url:"theme:forest", event_date:ud(14,7,30), max_attendees:45, industry_tags:["PropTech"], creator:{name:"James Whitfield",id:"d9"}, attendee_count:27 },
  { id:"e16", title:"First-Time Founders 101", description:"Everything nobody tells you in year one: equity, hiring, burn, and staying sane.", location:"General Assembly, 60 Market St, Melbourne VIC", cover_url:"theme:mint", event_date:ud(5,18,30), max_attendees:60, industry_tags:["SaaS"], creator:{name:"Priya Sharma",id:"d11"}, attendee_count:41 },
  { id:"e17", title:"Angel Investor Office Hours", description:"Book a 15-min slot with active angels. Bring your deck and your hardest question.", location:"Tank Stream Labs, Melbourne VIC", cover_url:"theme:royal", event_date:ud(17,10,0), max_attendees:24, industry_tags:["FinTech"], creator:{name:"Robert Hayes",id:"d8"}, attendee_count:18 },
  { id:"e18", title:"Design Systems for Startups", description:"Practical session on building a design system that scales without slowing you down.", location:"Portable, witness 11 Duke St, Abbotsford VIC", cover_url:"theme:candy", event_date:ud(9,16,30), max_attendees:35, industry_tags:["SaaS"], creator:{name:"Chloe Nguyen",id:"d14"}, attendee_count:23 },
  { id:"e19", title:"Agritech Innovation Forum", description:"Founders and growers tackling yield, water and supply chain with technology.", location:"Melbourne Showgrounds, Ascot Vale VIC", cover_url:"theme:sand", event_date:ud(19,9,30), max_attendees:90, industry_tags:["AgriTech","Climate"], creator:{name:"Tom Baxter",id:"d21"}, attendee_count:52 },
  { id:"e20", title:"Bootstrapped Founders Dinner", description:"No VCs, no pitching. Just profitable founders talking about real numbers.", location:"Bar Lourinha, 37 Little Collins St, Melbourne VIC", cover_url:"theme:ember", event_date:ud(11,19,0), max_attendees:18, industry_tags:["SaaS"], creator:{name:"Grace Miller",id:"d13"}, attendee_count:16 },
  { id:"e21", title:"Cybersecurity Founder Briefing", description:"What every startup needs to know about security before enterprise customers ask.", location:"Deloitte, 477 Collins St, Melbourne VIC", cover_url:"theme:midnight", event_date:ud(15,12,0), max_attendees:55, industry_tags:["DeepTech"], creator:{name:"Omar Haddad",id:"d19"}, attendee_count:34 },
  { id:"e22", title:"Creator Economy Meetup", description:"Founders building tools for creators. Demos, discussion, and a lot of opinions.", location:"Kindred Studios, 3 Harris St, Yarraville VIC", cover_url:"theme:bloom", event_date:ud(7,18,0), max_attendees:50, industry_tags:["Consumer"], creator:{name:"Isla Fraser",id:"d25"}, attendee_count:37 },
  { id:"e23", title:"Marketplace Founders Roundtable", description:"Solving the cold-start problem: liquidity, trust, and take rates.", location:"Fishburners, Melbourne VIC", cover_url:"theme:ocean", event_date:ud(20,13,30), max_attendees:28, industry_tags:["E-commerce"], creator:{name:"Victor Lam",id:"d6"}, attendee_count:21 },
  { id:"e24", title:"No-Code Build Night", description:"Ship a working prototype in one evening using no-code tools. Beginners welcome.", location:"The Commons, 90 Maribyrnong St, Footscray VIC", cover_url:"theme:mint", event_date:ud(6,18,0), max_attendees:40, industry_tags:["SaaS"], creator:{name:"Hannah Ross",id:"d27"}, attendee_count:30 },
  { id:"e25", title:"Sustainability Startup Showcase", description:"Eight founders showcase products cutting emissions and waste. Voting and prizes.", location:"Fed Square, Swanston St, Melbourne VIC", cover_url:"theme:forest", event_date:ud(22,17,0), max_attendees:150, industry_tags:["Climate"], creator:{name:"Daniel Osei",id:"d23"}, attendee_count:88 },
  { id:"e26", title:"Legal Essentials for Founders", description:"Shareholder agreements, IP, employment: the legal basics, explained plainly.", location:"MinterEllison, 447 Collins St, Melbourne VIC", cover_url:"theme:slate", event_date:ud(10,12,30), max_attendees:60, industry_tags:["SaaS"], creator:{name:"Rachel Cohen",id:"d28"}, attendee_count:44 },
  { id:"e27", title:"Hardware & Robotics Night", description:"Show-and-tell for founders building physical products. Bring your prototype.", location:"Docklands Makerspace, Melbourne VIC", cover_url:"theme:ember", event_date:ud(18,18,0), max_attendees:45, industry_tags:["DeepTech"], creator:{name:"Ken Tanaka",id:"d15"}, attendee_count:26 },
  { id:"e28", title:"Founder Wellbeing Morning", description:"Run, coffee, and honest conversation about the mental load of building.", location:"Botanic Gardens, Birdwood Ave, Melbourne VIC", cover_url:"theme:sunset", event_date:ud(4,7,0), max_attendees:30, industry_tags:["Wellness"], creator:{name:"Emma Sullivan",id:"d26"}, attendee_count:24 },
  { id:"e29", title:"Enterprise Sales Playbook", description:"How to land your first six-figure contract. Scripts, objections, and pricing.", location:"Salesforce Tower, 180 George St, Melbourne VIC", cover_url:"theme:royal", event_date:ud(21,14,0), max_attendees:75, industry_tags:["SaaS"], creator:{name:"Michael Zhang",id:"d10"}, attendee_count:58 },
  { id:"e30", title:"ABAA Community Summer Social", description:"Our biggest community night of the year. Food, drinks, and 200+ founders.", location:"Rooftop at QT, 133 Russell St, Melbourne VIC", cover_url:"theme:aurora", event_date:ud(25,18,0), max_attendees:220, industry_tags:["Community"], creator:{name:"ABAA Team",id:"d2"}, attendee_count:161 },
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
      className={`abaa-gradient flex items-center justify-center gap-2 font-semibold text-white rounded-2xl transition-all disabled:opacity-50 ${small?"px-5 py-2.5 text-sm":"px-6 py-3.5 text-sm"} ${className}`}>
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

function Card({ children, className="", onClick, style }) {
  return (
    <div onClick={onClick} className={`abaa-lift rounded-3xl ${className}`}
      style={{background:CARD_BG,border:`1px solid ${BORDER}`,...(style||{})}}>
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
  const [projectContext, setProjectContext] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [menuFor, setMenuFor] = useState(null); // message id with open action menu
  const bottomRef = useRef();
  const inputRef = useRef();
  const fileRef = useRef();
  const emailedRef = useRef(false);
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
    supabase.from("match_requests").select("project_context").eq("id",matchId).maybeSingle()
      .then(({data})=>setProjectContext(data?.project_context||null)).catch(()=>{});
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
      // Notify recipient by email — once per open chat session to avoid spam
      if(!emailedRef.current && other?.email){
        emailedRef.current=true;
        sendEmail("new_message", other.email, { fromName: myProfile?.name||me?.user_metadata?.full_name||"Someone" });
      }
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
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold truncate">{other?.name}</div>
            <div className="text-emerald-400 text-xs">● Connected{projectContext?` · ${projectContext}`:""}</div>
          </div>
          {other?.id&&<a href={`${window.location.origin}${window.location.pathname}?card=${other.id}`} target="_blank" rel="noreferrer" title="View their digital card" className="px-3 py-1.5 rounded-xl text-xs font-semibold" style={{background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.7)",border:`1px solid ${BORDER}`}}>💳</a>}
          <button onClick={shareContactCard} title="Share my contact card" className="px-3 py-1.5 rounded-xl text-xs font-semibold" style={{background:"rgba(124,111,224,0.15)",color:"#a78bfa",border:"1px solid rgba(124,111,224,0.3)"}}>📇</button>
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
  const [showBooking, setShowBooking] = useState(false);

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
            {(isAccepted || p.id===user?.id || isAdmin) ? (
              <>
                <div className="text-sm text-white/70">📧 {p.email}</div>
                {p.mobile&&<div className="text-sm text-white/70">📱 {p.mobile}</div>}
                {p.whatsapp&&<div className="text-sm text-white/70">💬 {p.whatsapp}</div>}
                <div className="text-emerald-400 text-xs mt-1">
                  {p.id===user?.id ? "This is your own profile" : (isAccepted ? "✓ Connected — contact revealed" : "★ Visible to you as an admin")}
                </div>
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

          {/* View digital business card — available to connected members */}
          {isAccepted&&!isDemo&&(
            <a href={`${window.location.origin}${window.location.pathname}?card=${p.id}`} target="_blank" rel="noreferrer"
              className="block w-full text-center py-3 rounded-2xl text-white font-semibold" style={{background:"rgba(255,255,255,0.08)",border:`1px solid ${BORDER}`}}>
              💳 View {p.name?.split(" ")[0]||"their"}'s Digital Card
            </a>
          )}

          {/* Book a meeting (if host enabled bookings) */}
          {p.booking_enabled&&!isDemo&&p.id!==user?.id&&(
            <button onClick={()=>setShowBooking(true)} className="w-full py-3 rounded-2xl text-white font-bold" style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)"}}>📅 Book a meeting</button>
          )}
          {showBooking&&<BookingModal host={p} onClose={()=>setShowBooking(false)}/>}

          {/* #8 Block */}
          {user&&!isDemo&&p.id!==user.id&&(
            <button onClick={async()=>{
              if(!confirm(`Block ${p.name}? They will no longer appear for you, and you won't appear for them.`)) return;
              try{
                await supabase.from("blocks").insert({blocker_id:user.id,blocked_id:p.id});
                showToast(`${p.name} blocked`); onClose();
              }catch(e){ showToast(e.message||"Could not block","error"); }
            }} className="w-full text-center text-white/25 hover:text-red-400/70 text-xs transition-colors py-1">
              🚫 Block this person
            </button>
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
// ═══ #18 SKELETON LOADERS ═══
function Skeleton({ className="", style={} }){
  return <div className={`abaa-skeleton rounded-2xl ${className}`} style={style}/>;
}
function SkeletonCard(){
  return (
    <div className="rounded-3xl p-4 space-y-3" style={{background:CARD_BG,border:`1px solid ${BORDER}`}}>
      <div className="flex items-center gap-3">
        <Skeleton style={{width:"44px",height:"44px",borderRadius:"999px"}}/>
        <div className="flex-1 space-y-2">
          <Skeleton style={{height:"12px",width:"55%"}}/>
          <Skeleton style={{height:"10px",width:"35%"}}/>
        </div>
      </div>
      <Skeleton style={{height:"10px",width:"90%"}}/>
      <Skeleton style={{height:"10px",width:"70%"}}/>
    </div>
  );
}
function SkeletonList({ n=3 }){
  return <div className="space-y-3">{Array.from({length:n}).map((_,i)=><SkeletonCard key={i}/>)}</div>;
}

// ═══ #2 EMPTY STATES ═══
function EmptyState({ emoji="✨", title, body, actionLabel, onAction }){
  return (
    <div className="text-center py-10 px-6">
      <div className="text-4xl mb-3 abaa-float">{emoji}</div>
      <div className="text-white font-semibold text-sm mb-1">{title}</div>
      {body&&<div className="text-white/40 text-xs mb-4 max-w-xs mx-auto leading-relaxed">{body}</div>}
      {actionLabel&&onAction&&(
        <button onClick={onAction} className="abaa-gradient px-5 py-2.5 rounded-2xl text-white text-sm font-semibold">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ═══ #19 OFFLINE BANNER ═══
function OfflineBanner(){
  const [offline,setOffline]=useState(!navigator.onLine);
  useEffect(()=>{
    const on=()=>setOffline(false), off=()=>setOffline(true);
    window.addEventListener("online",on); window.addEventListener("offline",off);
    return ()=>{ window.removeEventListener("online",on); window.removeEventListener("offline",off); };
  },[]);
  if(!offline) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[200] py-2 text-center text-xs font-semibold text-white"
      style={{background:"linear-gradient(90deg,#f59e0b,#ef4444)"}}>
      ⚠️ You're offline — changes will retry when you reconnect
    </div>
  );
}

// ═══ #7 VERIFIED BADGE ═══
function VerifiedBadge({ verified, size="sm" }){
  if(!verified) return null;
  const s = size==="lg" ? "16px" : "13px";
  return (
    <span title="Verified member" className="inline-flex items-center justify-center rounded-full flex-shrink-0"
      style={{width:s,height:s,background:"linear-gradient(135deg,#3b82f6,#0ea5e9)",fontSize:size==="lg"?"10px":"8px",color:"#fff",fontWeight:"bold",lineHeight:1}}>✓</span>
  );
}

// ═══ #1 ONBOARDING CHECKLIST ═══
function OnboardingChecklist({ profile, connectionCount, eventCount, onGo, onDismiss }){
  const steps=[
    {id:"photo", label:"Add a profile photo", done:!!profile?.avatar_url, tab:"profile"},
    {id:"role",  label:"Add your role & location", done:!!(profile?.role&&profile?.location), tab:"profile"},
    {id:"bio",   label:"Write a short bio", done:!!profile?.bio, tab:"profile"},
    {id:"skills",label:"Add your skills", done:(profile?.skills||[]).length>0, tab:"profile"},
    {id:"conn",  label:"Make your first connection", done:connectionCount>0, tab:"matching"},
    {id:"event", label:"Register for an event", done:eventCount>0, tab:"events"},
  ];
  const done=steps.filter(s=>s.done).length;
  if(done===steps.length) return null;
  const next=steps.find(s=>!s.done);
  const pct=Math.round((done/steps.length)*100);
  return (
    <Card className="p-4" style={{border:"1px solid rgba(167,139,250,0.3)",background:"linear-gradient(135deg,rgba(124,111,224,0.12),rgba(167,139,250,0.04))"}}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-white font-bold text-sm">🚀 Get set up</div>
          <div className="text-white/45 text-xs">{done} of {steps.length} steps done</div>
        </div>
        <button onClick={onDismiss} className="text-white/25 text-xs px-1">✕</button>
      </div>
      <div className="h-1.5 rounded-full mb-3" style={{background:"rgba(255,255,255,0.08)"}}>
        <motion.div className="h-full rounded-full" animate={{width:`${pct}%`}}
          style={{background:"linear-gradient(90deg,#7c6fe0,#a78bfa)",width:`${pct}%`}}/>
      </div>
      <div className="space-y-1.5 mb-3">
        {steps.map(s=>(
          <div key={s.id} className="flex items-center gap-2 text-xs">
            <span style={{color:s.done?"#34d399":"rgba(255,255,255,0.25)"}}>{s.done?"✓":"○"}</span>
            <span style={{color:s.done?"rgba(255,255,255,0.35)":"rgba(255,255,255,0.75)",textDecoration:s.done?"line-through":"none"}}>{s.label}</span>
          </div>
        ))}
      </div>
      {next&&(
        <button onClick={()=>onGo(next.tab)} className="abaa-gradient w-full py-2.5 rounded-2xl text-white text-xs font-bold">
          Next: {next.label} →
        </button>
      )}
    </Card>
  );
}

// ═══ #11 NOTIFICATION CENTER ═══
function NotificationCenter({ user, notif, onClose, onGo }){
  const items=[];
  if(notif.partner>0) items.push({emoji:"🤝",title:`${notif.partner} partnership request${notif.partner>1?"s":""}`,body:"Someone wants to connect with you",tab:"matching"});
  if(notif.project>0) items.push({emoji:"🚀",title:`${notif.project} project join request${notif.project>1?"s":""}`,body:"People want to join your project",tab:"projects"});
  if(notif.events>0)  items.push({emoji:"🎟️",title:`${notif.events} event registration${notif.events>1?"s":""}`,body:"Awaiting your approval",tab:"events"});
  if(notif.messages>0)items.push({emoji:"💬",title:`${notif.messages} unread message${notif.messages>1?"s":""}`,body:"Open your connections to reply",tab:"matching"});
  if(notif.bookings>0)items.push({emoji:"📅",title:`${notif.bookings} meeting request${notif.bookings>1?"s":""}`,body:"Accept or decline in your profile",tab:"profile"});
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-[90] flex items-start justify-center bg-black/80 pt-16 px-4"
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <motion.div initial={{y:-20,opacity:0}} animate={{y:0,opacity:1}}
        className="w-full max-w-sm rounded-3xl overflow-hidden" style={{background:"#0f1320",border:`1px solid ${BORDER}`}}>
        <div className="flex items-center justify-between p-4" style={{borderBottom:`1px solid ${BORDER}`}}>
          <div className="text-white font-bold text-sm">🔔 Notifications</div>
          <button onClick={onClose} className="text-white/40 text-lg px-1">✕</button>
        </div>
        <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
          {items.length===0
            ? <div className="text-white/30 text-xs text-center py-8">You're all caught up ✨</div>
            : items.map((it,i)=>(
                <button key={i} onClick={()=>{onGo(it.tab);onClose();}}
                  className="w-full flex items-start gap-3 p-3 rounded-2xl text-left transition-colors hover:bg-white/5"
                  style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`}}>
                  <span className="text-lg">{it.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-semibold">{it.title}</div>
                    <div className="text-white/40 text-[11px]">{it.body}</div>
                  </div>
                  <span className="text-white/25">›</span>
                </button>
              ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══ #4 GLOBAL SEARCH ═══
function GlobalSearch({ user, onClose, onOpenProfile, onGoTab }){
  const [q,setQ]=useState("");
  const [res,setRes]=useState({people:[],projects:[],events:[]});
  const [loading,setLoading]=useState(false);
  useEffect(()=>{
    const term=q.trim();
    if(term.length<2){ setRes({people:[],projects:[],events:[]}); return; }
    setLoading(true);
    const t=setTimeout(async()=>{
      try{
        const like=`%${term}%`;
        const [pp,pj,ev]=await Promise.all([
          supabase.from("profiles").select("id,name,role,avatar_url,location,verified").eq("is_approved",true)
            .or(`name.ilike.${like},role.ilike.${like},location.ilike.${like},headline.ilike.${like}`).limit(6),
          supabase.from("projects").select("id,project_name,project_pitch,project_industry").
            or(`project_name.ilike.${like},project_pitch.ilike.${like},project_industry.ilike.${like}`).limit(6),
          supabase.from("events").select("id,title,event_date,location").eq("is_approved",true)
            .or(`title.ilike.${like},description.ilike.${like},location.ilike.${like}`).limit(6),
        ]);
        setRes({people:pp.data||[],projects:pj.data||[],events:ev.data||[]});
      }catch(e){}
      setLoading(false);
    },300);
    return ()=>clearTimeout(t);
  },[q]);
  const total=res.people.length+res.projects.length+res.events.length;
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-[90] flex items-start justify-center bg-black/85 pt-14 px-4"
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <motion.div initial={{y:-16,opacity:0}} animate={{y:0,opacity:1}}
        className="w-full max-w-md rounded-3xl overflow-hidden flex flex-col" style={{background:"#0f1320",border:`1px solid ${BORDER}`,maxHeight:"80vh"}}>
        <div className="p-4 flex gap-2" style={{borderBottom:`1px solid ${BORDER}`}}>
          <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search people, projects, events…"
            className="flex-1 rounded-2xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none"
            style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
          <button onClick={onClose} className="text-white/40 text-lg px-2">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {q.trim().length<2&&<div className="text-white/30 text-xs text-center py-8">Type at least 2 characters</div>}
          {loading&&q.trim().length>=2&&<SkeletonList n={2}/>}
          {!loading&&q.trim().length>=2&&total===0&&<div className="text-white/30 text-xs text-center py-8">No results for "{q}"</div>}
          {res.people.length>0&&(
            <div>
              <div className="text-white/35 text-[10px] uppercase tracking-wider mb-2 px-1">People</div>
              <div className="space-y-1.5">{res.people.map(p=>(
                <button key={p.id} onClick={()=>{onOpenProfile(p);onClose();}}
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl text-left hover:bg-white/5"
                  style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`}}>
                  <Av name={p.name} url={p.avatar_url} color={pal(p.id)} size="sm"/>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-semibold truncate flex items-center gap-1">{p.name}<VerifiedBadge verified={p.verified}/></div>
                    <div className="text-white/40 text-[11px] truncate">{p.role||p.location}</div>
                  </div>
                </button>
              ))}</div>
            </div>
          )}
          {res.projects.length>0&&(
            <div>
              <div className="text-white/35 text-[10px] uppercase tracking-wider mb-2 px-1">Projects</div>
              <div className="space-y-1.5">{res.projects.map(p=>(
                <button key={p.id} onClick={()=>{onGoTab("projects");onClose();}}
                  className="w-full p-2.5 rounded-2xl text-left hover:bg-white/5"
                  style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`}}>
                  <div className="text-white text-xs font-semibold truncate">🚀 {p.project_name}</div>
                  <div className="text-white/40 text-[11px] truncate">{p.project_pitch}</div>
                </button>
              ))}</div>
            </div>
          )}
          {res.events.length>0&&(
            <div>
              <div className="text-white/35 text-[10px] uppercase tracking-wider mb-2 px-1">Events</div>
              <div className="space-y-1.5">{res.events.map(e=>(
                <button key={e.id} onClick={()=>{onGoTab("events");onClose();}}
                  className="w-full p-2.5 rounded-2xl text-left hover:bg-white/5"
                  style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`}}>
                  <div className="text-white text-xs font-semibold truncate">🎟️ {e.title}</div>
                  <div className="text-white/40 text-[11px] truncate">{new Date(e.event_date).toLocaleDateString("en-AU",{day:"numeric",month:"short"})} · {e.location}</div>
                </button>
              ))}</div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══ #20 REFERRALS ═══
function ReferralCard({ user, profile, showToast }){
  const [count,setCount]=useState(null);
  const link=`${window.location.origin}?ref=${user?.id}`;
  useEffect(()=>{
    if(!user) return;
    supabase.from("profiles").select("id",{count:"exact",head:true}).eq("referred_by",user.id)
      .then(({count})=>setCount(count||0)).catch(()=>setCount(0));
  },[user]);
  const tiers=[{n:3,label:"Connector"},{n:10,label:"Community Builder"},{n:25,label:"Founding Champion"}];
  const nextTier=tiers.find(t=>(count||0)<t.n);
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-1">
        <div className="text-white font-semibold text-sm">🎁 Invite founders</div>
        {count!=null&&<div className="text-purple-300 text-xs font-bold">{count} joined</div>}
      </div>
      <div className="text-white/40 text-xs mb-3">
        {nextTier ? `${nextTier.n-(count||0)} more to unlock "${nextTier.label}"` : "You've unlocked every tier — thank you! 🏆"}
      </div>
      {nextTier&&(
        <div className="h-1.5 rounded-full mb-3" style={{background:"rgba(255,255,255,0.08)"}}>
          <div className="h-full rounded-full" style={{background:"linear-gradient(90deg,#7c6fe0,#a78bfa)",width:`${Math.min(100,((count||0)/nextTier.n)*100)}%`}}/>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={async()=>{
          try{ if(navigator.share) await navigator.share({title:"Join ABAA Community",text:"Join me on ABAA — find co-founders and partners.",url:link});
               else { await navigator.clipboard.writeText(link); showToast("Invite link copied ✓"); } }catch(e){}
        }} className="abaa-gradient flex-1 py-2.5 rounded-2xl text-white text-xs font-bold">Share invite link</button>
        <button onClick={()=>{navigator.clipboard.writeText(link);showToast("Invite link copied ✓");}}
          className="px-4 py-2.5 rounded-2xl text-white/60 text-xs font-semibold" style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`}}>Copy</button>
      </div>
    </Card>
  );
}

// ═══ #15 EVENT FEEDBACK ═══
function EventFeedback({ event, user, showToast }){
  const [rating,setRating]=useState(0);
  const [comment,setComment]=useState("");
  const [sent,setSent]=useState(false);
  const [existing,setExisting]=useState(null);
  const [avg,setAvg]=useState(null);
  const isHost = event.creator_id===user?.id;
  useEffect(()=>{
    if(String(event.id).startsWith("e")) return;
    supabase.from("event_feedback").select("*").eq("event_id",event.id)
      .then(({data})=>{
        const list=data||[];
        if(list.length) setAvg((list.reduce((s,f)=>s+(f.rating||0),0)/list.length).toFixed(1));
        const mine=list.find(f=>f.user_id===user?.id);
        if(mine){ setExisting(mine); setRating(mine.rating); setComment(mine.comment||""); }
      }).catch(()=>{});
  },[event.id,user]);
  async function send(){
    if(!rating){ showToast("Pick a star rating first","error"); return; }
    try{
      await supabase.from("event_feedback").upsert({event_id:event.id,user_id:user.id,rating,comment},{onConflict:"event_id,user_id"});
      setSent(true); showToast("Thanks for the feedback ✓");
    }catch(e){ showToast(e.message||"Could not send","error"); }
  }
  if(String(event.id).startsWith("e")) return null;
  const past=new Date(event.event_date)<new Date();
  if(!past) return null;
  return (
    <div className="rounded-2xl p-4" style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`}}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-white/70 text-xs font-semibold uppercase tracking-wider">⭐ Event feedback</div>
        {avg&&<div className="text-amber-300 text-xs font-bold">{avg} avg</div>}
      </div>
      {isHost ? (
        <div className="text-white/40 text-xs">{avg?`Your attendees rated this ${avg} out of 5.`:"No ratings yet."}</div>
      ) : sent||existing ? (
        <div className="text-emerald-400 text-xs">✓ Thanks — your feedback was recorded</div>
      ) : (
        <>
          <div className="flex gap-1 mb-2">
            {[1,2,3,4,5].map(n=>(
              <button key={n} onClick={()=>setRating(n)} className="text-xl transition-transform"
                style={{transform:rating>=n?"scale(1.1)":"scale(1)",opacity:rating>=n?1:0.3}}>⭐</button>
            ))}
          </div>
          <textarea value={comment} onChange={e=>setComment(e.target.value)} rows={2} placeholder="Any comments for the host? (optional)"
            className="w-full rounded-xl px-3 py-2 text-white placeholder-white/25 focus:outline-none resize-none mb-2"
            style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
          <button onClick={send} className="abaa-gradient w-full py-2 rounded-xl text-white text-xs font-bold">Send feedback</button>
        </>
      )}
    </div>
  );
}

// ═══ #14 POST-EVENT FOLLOW-UP ═══
function PostEventFollowUp({ events, attSet, eventAttendees, user, onConnect, showToast }){
  const [dismissed,setDismissed]=useState(()=>{ try{ return JSON.parse(localStorage.getItem("abaa_followup_dismissed")||"[]"); }catch(e){ return []; } });
  const now=new Date();
  // Events I attended that finished in the last 14 days
  const recent=(events||[]).filter(ev=>{
    if(String(ev.id).startsWith("e")) return false;
    if(attSet[ev.id]!=="approved") return false;
    const d=new Date(ev.event_date);
    const days=(now-d)/86400000;
    return days>0 && days<=14 && !dismissed.includes(ev.id);
  });
  if(recent.length===0) return null;
  const ev=recent[0];
  const others=(eventAttendees[ev.id]||[]).filter(g=>g&&g.id!==user?.id).slice(0,6);
  if(others.length===0) return null;
  function dismiss(){
    const next=[...dismissed,ev.id];
    setDismissed(next);
    try{ localStorage.setItem("abaa_followup_dismissed",JSON.stringify(next)); }catch(e){}
  }
  return (
    <Card className="p-4" style={{border:"1px solid rgba(245,158,11,0.3)",background:"linear-gradient(135deg,rgba(245,158,11,0.10),rgba(245,158,11,0.02))"}}>
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="text-white font-bold text-sm">👋 You attended {ev.title}</div>
          <div className="text-white/45 text-xs">Connect with people you met — they're just a tap away</div>
        </div>
        <button onClick={dismiss} className="text-white/25 text-xs px-1">✕</button>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {others.map(o=>(
          <button key={o.id} onClick={()=>onConnect(o)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-full transition-colors hover:bg-white/10"
            style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`}}>
            <Av name={o.name} url={o.avatar_url} color={pal(o.id)} size="xs"/>
            <span className="text-white/75 text-xs">{String(o.name).split(" ")[0]}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}

// ═══ #16 PROJECT STATUS BOARD ═══
const PROJECT_STAGES=[
  {id:"Idea",       emoji:"💡", color:"#a78bfa"},
  {id:"Validating", emoji:"🔍", color:"#7cb9e8"},
  {id:"Building",   emoji:"🔨", color:"#f59e0b"},
  {id:"Launched",   emoji:"🚀", color:"#34d399"},
];
function ProjectBoard({ projects, onEdit, onStageChange }){
  if(!projects||projects.length===0) return null;
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1" style={{scrollbarWidth:"none"}}>
      {PROJECT_STAGES.map(st=>{
        const items=projects.filter(p=>(p.project_stage||"Idea")===st.id);
        return (
          <div key={st.id} className="flex-shrink-0 rounded-2xl p-3" style={{width:"180px",background:"rgba(255,255,255,0.03)",border:`1px solid ${BORDER}`}}>
            <div className="flex items-center gap-1.5 mb-2">
              <span>{st.emoji}</span>
              <span className="text-white text-xs font-bold">{st.id}</span>
              <span className="text-white/30 text-[10px]">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.length===0&&<div className="text-white/20 text-[10px] text-center py-3">Empty</div>}
              {items.map(p=>(
                <div key={p.id} className="rounded-xl p-2.5" style={{background:CARD_BG,border:`1px solid ${BORDER}`}}>
                  <button onClick={()=>onEdit(p)} className="text-left w-full">
                    <div className="text-white text-xs font-semibold truncate">{p.project_name}</div>
                    {p.project_industry&&<div className="text-white/35 text-[10px] truncate">{p.project_industry}</div>}
                  </button>
                  <div className="flex gap-1 mt-1.5">
                    {PROJECT_STAGES.filter(s=>s.id!==st.id).map(s=>(
                      <button key={s.id} onClick={()=>onStageChange(p,s.id)} title={`Move to ${s.id}`}
                        className="text-[10px] px-1.5 py-0.5 rounded-md" style={{background:"rgba(255,255,255,0.06)",color:s.color}}>
                        {s.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══ #5 SAVED SEARCHES ═══
function SavedSearches({ user, currentFilters, onApply, showToast }){
  const [items,setItems]=useState([]);
  const [open,setOpen]=useState(false);
  async function load(){
    if(!user) return;
    try{ const {data}=await supabase.from("saved_searches").select("*").eq("user_id",user.id).order("created_at",{ascending:false});
      setItems(data||[]); }catch(e){}
  }
  useEffect(()=>{ load(); },[user]);
  async function save(){
    const name=prompt("Name this search (e.g. 'CTOs in Melbourne')");
    if(!name) return;
    try{
      await supabase.from("saved_searches").insert({user_id:user.id,name,filters:currentFilters});
      showToast("Search saved ✓"); load();
    }catch(e){ showToast(e.message||"Could not save","error"); }
  }
  async function remove(id){
    try{ await supabase.from("saved_searches").delete().eq("id",id); load(); }catch(e){}
  }
  const hasFilters = currentFilters && Object.values(currentFilters).some(v=>v&&v!=="");
  if(!user) return null;
  return (
    <div className="rounded-2xl p-3" style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${BORDER}`}}>
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center justify-between">
        <span className="text-white/60 text-xs font-semibold">🔖 Saved searches{items.length>0?` (${items.length})`:""}</span>
        <span className="text-white/30 text-xs">{open?"▾":"▸"}</span>
      </button>
      {open&&(
        <div className="mt-2 space-y-1.5">
          {items.length===0&&<div className="text-white/25 text-[11px] text-center py-2">None saved yet</div>}
          {items.map(s=>(
            <div key={s.id} className="flex items-center gap-2">
              <button onClick={()=>{onApply(s.filters||{});showToast(`Applied "${s.name}"`);}}
                className="flex-1 text-left px-3 py-2 rounded-xl text-xs text-white/75 hover:bg-white/5"
                style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`}}>
                {s.name}
              </button>
              <button onClick={()=>remove(s.id)} className="text-red-400/50 text-xs px-1">✕</button>
            </div>
          ))}
          {hasFilters&&(
            <button onClick={save} className="w-full py-2 rounded-xl text-[11px] font-semibold text-purple-300"
              style={{background:"rgba(124,111,224,0.12)",border:"1px solid rgba(124,111,224,0.3)"}}>
              + Save current filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ═══ BUSINESS CARD SCANNER (OCR → contact → invite) ═══
function parseCardText(text){
  const lines=String(text||"").split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  const joined=lines.join(" ");
  // Email
  const email=(joined.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/)||[])[0]||"";
  // Australian & international phone formats
  const phoneRaw=(joined.match(/(\+?61[\s-]?\d[\d\s-]{7,})|(\b0[2-478][\s-]?\d{4}[\s-]?\d{4}\b)|(\b04\d{2}[\s-]?\d{3}[\s-]?\d{3}\b)/)||[])[0]||"";
  const mobile=phoneRaw.replace(/[^\d+]/g,"");
  // Website (ignore the email's domain)
  let website=(joined.match(/\b(?:https?:\/\/)?(?:www\.)?[A-Za-z0-9-]+\.(?:com|com\.au|net|org|io|co|au)\b(?:\/\S*)?/i)||[])[0]||"";
  if(email && website && email.toLowerCase().includes(website.toLowerCase().replace(/^www\./,""))) website="";
  // Name = first line that looks like a person (2-3 words, no digits/@)
  const nameLine=lines.find(l=>
    /^[A-Za-z][A-Za-z.'-]*(\s+[A-Za-z][A-Za-z.'-]*){1,2}$/.test(l) &&
    !/@|\d|www|ltd|pty|inc/i.test(l) && l.length<40
  )||"";
  // Title
  const titleLine=lines.find(l=>/founder|ceo|cto|coo|cfo|director|manager|consultant|engineer|designer|advisor|partner|owner|principal|agent|specialist|lead|head of/i.test(l))||"";
  // Company: a line with a business suffix, else a non-name non-contact line
  const companyLine=lines.find(l=>/pty|ltd|limited|group|co\.|company|studio|agency|labs|holdings|services|solutions/i.test(l))
    || lines.find(l=>l!==nameLine && l!==titleLine && !/@|www|\d{4}/.test(l) && l.length>2 && l.length<40) || "";
  return { name:nameLine, email, mobile, website, title:titleLine, company:companyLine, raw:text };
}

function CardScanner({ user, profile, showToast, onClose, onSaved }){
  const [step,setStep]=useState("capture"); // capture | reading | confirm | matched | done
  const [progress,setProgress]=useState(0);
  const [fields,setFields]=useState({name:"",email:"",mobile:"",company:"",title:"",website:"",note:""});
  const [existing,setExisting]=useState(null);
  const [saving,setSaving]=useState(false);
  const fileRef=useRef();

  async function handleImage(file){
    if(!file) return;
    setStep("reading"); setProgress(0);
    try{
      const Tesseract=(await import("tesseract.js")).default;
      const { data }=await Tesseract.recognize(file,"eng",{
        logger:m=>{ if(m.status==="recognizing text") setProgress(Math.round((m.progress||0)*100)); }
      });
      const parsed=parseCardText(data?.text||"");
      setFields(f=>({...f,...parsed}));
      setStep("confirm");
    }catch(e){
      showToast("Couldn't read that image — you can type the details instead","error");
      setStep("confirm");
    }
  }

  async function save(){
    if(!fields.name.trim()||(!fields.email.trim()&&!fields.mobile.trim())){
      showToast("Need a name plus an email or phone","error"); return;
    }
    setSaving(true);
    try{
      // 1) Is this already an ABAA member?
      let match=null;
      if(fields.email.trim()){
        const {data}=await supabase.from("profiles").select("id,name,role,avatar_url,email,location,verified")
          .ilike("email",fields.email.trim()).maybeSingle();
        if(data) match=data;
      }
      if(!match && fields.mobile.trim()){
        const digits=fields.mobile.replace(/[^\d]/g,"").slice(-9);
        if(digits.length>=8){
          const {data}=await supabase.from("profiles").select("id,name,role,avatar_url,email,location,verified")
            .ilike("mobile",`%${digits}%`).limit(1);
          if(data&&data.length) match=data[0];
        }
      }

      // 2) Save the scanned contact either way
      const {data:saved}=await supabase.from("scanned_contacts").insert({
        owner_id:user.id, name:fields.name.trim(), email:fields.email.trim()||null,
        mobile:fields.mobile.trim()||null, company:fields.company.trim()||null,
        title:fields.title.trim()||null, website:fields.website.trim()||null,
        note:fields.note.trim()||null, matched_profile_id:match?.id||null,
      }).select().single();

      if(match){
        setExisting(match); setStep("matched");
      }else{
        // 3) Not a member — send them a personal intro + invite
        if(fields.email.trim()){
          const origin=window.location.origin;
          sendEmail("card_exchange", fields.email.trim(), {
            theirName: fields.name.trim(),
            fromName: profile?.name || "An ABAA member",
            fromRole: profile?.role || "",
            fromCompany: profile?.business_name || "",
            fromEmail: profile?.email || user.email || "",
            fromMobile: profile?.mobile || "",
            fromWhatsapp: profile?.whatsapp || "",
            fromLinkedin: profile?.linkedin_url || "",
            fromWebsite: profile?.website_url || "",
            fromPhoto: profile?.avatar_url || "",
            cardUrl: `${origin}?card=${user.id}`,
            bookingUrl: profile?.booking_enabled ? `${origin}?card=${user.id}` : "",
            joinUrl: `${origin}?ref=${user.id}`,
            unsubUrl: `${origin}?unsub=${encodeURIComponent(fields.email.trim())}`,
          });
        }
        setStep("done");
      }
      onSaved&&onSaved();
    }catch(e){ showToast(e.message||"Could not save contact","error"); }
    setSaving(false);
  }

  const inputCls="w-full rounded-2xl px-4 py-3 text-white placeholder-white/25 focus:outline-none";
  const inputStyle={background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"};

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-[95] flex items-end md:items-center justify-center bg-black/85 p-0 md:p-4"
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",damping:30,stiffness:300}}
        className="w-full md:max-w-md rounded-t-3xl md:rounded-3xl flex flex-col"
        style={{background:"#0f1320",border:`1px solid ${BORDER}`,maxHeight:"90vh"}}>

        <div className="p-5 pb-3 flex items-center justify-between" style={{borderBottom:`1px solid ${BORDER}`}}>
          <div>
            <div className="text-white font-bold">📷 Scan a business card</div>
            <div className="text-white/40 text-xs">Save the contact and invite them to connect</div>
          </div>
          <button onClick={onClose} className="text-white/40 text-xl px-2">✕</button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {step==="capture"&&(
            <div className="text-center py-6">
              <div className="text-5xl mb-4 abaa-float">💳</div>
              <div className="text-white/70 text-sm mb-6">Take a photo of their business card — we'll pull out the details automatically.</div>
              <label className="abaa-gradient block w-full py-3.5 rounded-2xl text-white font-bold cursor-pointer mb-3">
                📷 Take photo
                <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={e=>handleImage(e.target.files?.[0])}/>
              </label>
              <label className="block w-full py-3 rounded-2xl text-white/70 text-sm font-semibold cursor-pointer"
                style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`}}>
                🖼 Choose from gallery
                <input type="file" accept="image/*" className="hidden" onChange={e=>handleImage(e.target.files?.[0])}/>
              </label>
              <button onClick={()=>setStep("confirm")} className="text-white/35 text-xs mt-4">or enter details manually</button>
            </div>
          )}

          {step==="reading"&&(
            <div className="text-center py-12">
              <div className="text-4xl mb-4 abaa-float">🔍</div>
              <div className="text-white font-semibold text-sm mb-3">Reading the card…</div>
              <div className="h-1.5 rounded-full mx-auto max-w-xs" style={{background:"rgba(255,255,255,0.08)"}}>
                <div className="h-full rounded-full transition-all" style={{background:"linear-gradient(90deg,#7c6fe0,#a78bfa)",width:`${progress}%`}}/>
              </div>
              <div className="text-white/35 text-xs mt-2">{progress}%</div>
            </div>
          )}

          {step==="confirm"&&(
            <div className="space-y-3">
              <div className="text-white/50 text-xs">Check the details before saving — edit anything that's wrong.</div>
              <input value={fields.name} onChange={e=>setFields(f=>({...f,name:e.target.value}))} placeholder="Full name *" className={inputCls} style={inputStyle}/>
              <input value={fields.email} onChange={e=>setFields(f=>({...f,email:e.target.value}))} placeholder="Email" type="email" className={inputCls} style={inputStyle}/>
              <input value={fields.mobile} onChange={e=>setFields(f=>({...f,mobile:e.target.value}))} placeholder="Mobile" className={inputCls} style={inputStyle}/>
              <input value={fields.title} onChange={e=>setFields(f=>({...f,title:e.target.value}))} placeholder="Job title" className={inputCls} style={inputStyle}/>
              <input value={fields.company} onChange={e=>setFields(f=>({...f,company:e.target.value}))} placeholder="Company" className={inputCls} style={inputStyle}/>
              <input value={fields.website} onChange={e=>setFields(f=>({...f,website:e.target.value}))} placeholder="Website" className={inputCls} style={inputStyle}/>
              <textarea value={fields.note} onChange={e=>setFields(f=>({...f,note:e.target.value}))} rows={2} placeholder="Where did you meet? (optional)"
                className={inputCls+" resize-none"} style={inputStyle}/>
              <div className="text-white/25 text-[11px]">* Name plus an email or phone required</div>
              <button onClick={save} disabled={saving} className="abaa-gradient w-full py-3.5 rounded-2xl text-white font-bold" style={{opacity:saving?0.6:1}}>
                {saving?"Saving…":"Save contact"}
              </button>
              <button onClick={()=>setStep("capture")} className="w-full text-center text-white/35 text-xs py-1">↺ Scan a different card</button>
            </div>
          )}

          {step==="matched"&&existing&&(
            <div className="text-center py-6">
              <div className="text-4xl mb-3">🎉</div>
              <div className="text-white font-bold text-lg mb-1">They're already on ABAA!</div>
              <div className="text-white/45 text-sm mb-5">Contact saved. You can connect with them right away.</div>
              <div className="rounded-2xl p-4 mb-5" style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`}}>
                <div className="flex items-center gap-3">
                  <Av name={existing.name} url={existing.avatar_url} color={pal(existing.id)} size="md" ring/>
                  <div className="text-left min-w-0">
                    <div className="text-white font-semibold text-sm flex items-center gap-1.5">{existing.name}<VerifiedBadge verified={existing.verified}/></div>
                    <div className="text-white/45 text-xs truncate">{existing.role||existing.location||""}</div>
                  </div>
                </div>
              </div>
              <a href={`${window.location.origin}?connect=${existing.id}`}
                className="abaa-gradient block w-full py-3.5 rounded-2xl text-white font-bold mb-2">🤝 View profile & connect</a>
              <button onClick={onClose} className="w-full py-2.5 text-white/45 text-sm">Done</button>
            </div>
          )}

          {step==="done"&&(
            <div className="text-center py-6">
              <div className="text-4xl mb-3">✅</div>
              <div className="text-white font-bold text-lg mb-1">Contact saved</div>
              <div className="text-white/45 text-sm mb-5">
                {fields.email
                  ? <>We've emailed <strong className="text-white/70">{fields.name}</strong> your contact details, a link to book a catch-up, and an invitation to join ABAA.</>
                  : <>Saved to your contacts. Add an email next time and we'll send them your details automatically.</>}
              </div>
              <button onClick={()=>{ setFields({name:"",email:"",mobile:"",company:"",title:"",website:"",note:""}); setStep("capture"); }}
                className="abaa-gradient w-full py-3 rounded-2xl text-white font-bold mb-2">📷 Scan another card</button>
              <button onClick={onClose} className="w-full py-2.5 text-white/45 text-sm">Done</button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══ MY SCANNED CONTACTS ═══
function ScannedContacts({ user, refreshKey }){
  const [items,setItems]=useState([]);
  const [open,setOpen]=useState(false);
  useEffect(()=>{
    if(!user) return;
    supabase.from("scanned_contacts").select("*, matched:profiles!scanned_contacts_matched_profile_id_fkey(id,name,avatar_url,role,verified)")
      .eq("owner_id",user.id).order("created_at",{ascending:false})
      .then(({data})=>setItems(data||[])).catch(()=>setItems([]));
  },[user,refreshKey]);

  function saveVcf(c){
    const lines=["BEGIN:VCARD","VERSION:3.0",`FN:${c.name||""}`];
    if(c.name){ const p=String(c.name).split(" "); lines.push(`N:${p.slice(1).join(" ")};${p[0]};;;`); }
    if(c.company) lines.push(`ORG:${c.company}`);
    if(c.title) lines.push(`TITLE:${c.title}`);
    if(c.mobile) lines.push(`TEL;TYPE=CELL:${c.mobile}`);
    if(c.email) lines.push(`EMAIL;TYPE=WORK:${c.email}`);
    if(c.website) lines.push(`URL:${c.website}`);
    if(c.note) lines.push(`NOTE:${c.note}`);
    lines.push("END:VCARD");
    const blob=new Blob([lines.join("\r\n")],{type:"text/vcard"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob); a.download=`${(c.name||"contact").replace(/\s+/g,"-")}.vcf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  if(items.length===0) return null;
  return (
    <Card className="p-4">
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center justify-between">
        <div className="text-left">
          <div className="text-white font-semibold text-sm">💳 Scanned contacts ({items.length})</div>
          <div className="text-white/40 text-xs">Cards you've scanned</div>
        </div>
        <span className="text-white/40">{open?"▾":"▸"}</span>
      </button>
      {open&&(
        <div className="space-y-2 mt-3">
          {items.map(c=>(
            <div key={c.id} className="p-3 rounded-2xl" style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`}}>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-white text-sm font-semibold truncate flex items-center gap-1.5">
                    {c.name}
                    {c.matched&&<span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{background:"rgba(52,211,153,0.15)",color:"#34d399"}}>ABAA member</span>}
                  </div>
                  <div className="text-white/45 text-xs truncate">{[c.title,c.company].filter(Boolean).join(" · ")}</div>
                  <div className="text-white/35 text-[11px] truncate">{[c.email,c.mobile].filter(Boolean).join("  ·  ")}</div>
                  {c.note&&<div className="text-white/30 text-[11px] italic mt-0.5">"{c.note}"</div>}
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={()=>saveVcf(c)} className="flex-1 py-1.5 rounded-xl text-[11px] font-semibold text-white/70"
                  style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`}}>💾 Save to phone</button>
                {c.matched&&(
                  <a href={`${window.location.origin}?connect=${c.matched.id}`}
                    className="flex-1 py-1.5 rounded-xl text-[11px] font-semibold text-center text-white"
                    style={{background:"rgba(124,111,224,0.2)",border:"1px solid rgba(167,139,250,0.35)"}}>🤝 Connect</a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ═══ CONNECTION LABELS (how you met) ═══
const MEET_LABELS = [
  {id:"event",  emoji:"🎟️", name:"Met at an event"},
  {id:"card",   emoji:"💳", name:"Scanned their card"},
  {id:"intro",  emoji:"🤝", name:"Warm intro"},
  {id:"online", emoji:"💬", name:"Met online"},
  {id:"project",emoji:"🚀", name:"Project collaborator"},
  {id:"investor",emoji:"💰", name:"Investor / advisor"},
  {id:"client", emoji:"📋", name:"Client / prospect"},
];
const labelOf = (id) => MEET_LABELS.find(l=>l.id===id);

function ConnectionLabelPicker({ matchId, current, onSaved, showToast }){
  const [open,setOpen]=useState(false);
  const cur = labelOf(current);
  async function pick(id){
    try {
      await supabase.from("match_requests").update({meet_label:id||null}).eq("id",matchId);
      onSaved&&onSaved(id);
      showToast&&showToast(id?`Labelled: ${labelOf(id).name} ✓`:"Label removed");
    } catch(e){ showToast&&showToast("Could not save label","error"); }
    setOpen(false);
  }
  return (
    <div className="relative">
      <button onClick={(e)=>{e.stopPropagation();setOpen(o=>!o);}}
        className="px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors"
        style={cur
          ? {background:"rgba(124,111,224,0.2)",color:"#c4b5fd",border:"1px solid rgba(167,139,250,0.4)"}
          : {background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.4)",border:`1px solid ${BORDER}`}}>
        {cur?`${cur.emoji} ${cur.name}`:"+ Label"}
      </button>
      {open&&(
        <>
          <div className="fixed inset-0 z-[70]" onClick={(e)=>{e.stopPropagation();setOpen(false);}}/>
          <div className="absolute right-0 mt-1 z-[71] rounded-2xl p-1.5 w-52" style={{background:"#151a2b",border:`1px solid ${BORDER}`,boxShadow:"0 12px 32px rgba(0,0,0,0.6)"}}>
            {MEET_LABELS.map(l=>(
              <button key={l.id} onClick={(e)=>{e.stopPropagation();pick(l.id);}}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-white/75 hover:bg-white/10 transition-colors">
                {l.emoji} {l.name}
              </button>
            ))}
            {current&&<button onClick={(e)=>{e.stopPropagation();pick(null);}}
              className="w-full text-left px-3 py-2 rounded-xl text-xs text-red-400/70 hover:bg-white/10">✕ Remove label</button>}
          </div>
        </>
      )}
    </div>
  );
}

function MatchTab({ user, profile, isApproved, showToast, requireAuth, isAdmin, isViewAs, connectId, onGoTab }) {
  const [search, setSearch] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [realProfiles, setRealProfiles] = useState([]);
  const [matchMap, setMatchMap] = useState({});
  const [chat, setChat] = useState(null);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [connSearch, setConnSearch] = useState("");
  const [blockedIds, setBlockedIds] = useState([]);
  const [checklistHidden, setChecklistHidden] = useState(()=>{ try{ return localStorage.getItem("abaa_checklist_hidden")==="1"; }catch(e){ return false; } });
  const [filterAvail, setFilterAvail] = useState("");
  const [filterExp, setFilterExp] = useState("");
  const [filterVerified, setFilterVerified] = useState(false);
  const [connLabelFilter, setConnLabelFilter] = useState(null);
  const [bookingTarget, setBookingTarget] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const connectOpenedRef = useRef(false);
  const [incomingReqs, setIncomingReqs] = useState([]);

  async function loadRequests() {
    if(!user) return;
    const {data} = await supabase.from("match_requests").select("*").or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);
    const m={}; (data||[]).forEach(r=>{ const o=r.from_user_id===user.id?r.to_user_id:r.from_user_id; m[o]=r; }); setMatchMap(m);
    const incoming = (data||[]).filter(r=>r.to_user_id===user.id && r.status==="pending" && r.from_user_id!==user.id);
    if(incoming.length){
      const {data:profs} = await supabase.from("profiles").select("*").in("id", incoming.map(r=>r.from_user_id));
      setIncomingReqs(incoming.map(r=>({...r, sender:(profs||[]).find(p=>p.id===r.from_user_id)||{id:r.from_user_id,name:"A member"}})));
    } else setIncomingReqs([]);
  }

  async function respondToRequest(reqId, status) {
    const {data:updated,error}=await supabase.from("match_requests").update({status}).eq("id",reqId).select();
    if(error){showToast(error.message,"error");return;}
    if(!updated || updated.length===0){
      showToast("Couldn't save — permission denied on match_requests. Run the RLS fix SQL.","error");
      return;
    }
    showToast(status==="accepted"?"Match accepted! You can now chat ✓":"Request declined");
    if(status==="accepted"){
      const req=incomingReqs.find(r=>r.id===reqId);
      const senderId=req?.from_user_id;
      if(senderId){
        try {
          const {data:sender}=await supabase.from("profiles").select("*").eq("id",senderId).maybeSingle();
          const origin=window.location.origin;
          // Both parties get a "we're connected" email with each other's details + booking link
          const meCard = {
            name: profile?.name, role: profile?.role, email: profile?.email, mobile: profile?.mobile,
            whatsapp: profile?.whatsapp, linkedin: profile?.linkedin_url, website: profile?.website_url,
            card: `${origin}?card=${user.id}`,
            booking: profile?.booking_enabled ? `${origin}?card=${user.id}` : null,
          };
          const themCard = {
            name: sender?.name, role: sender?.role, email: sender?.email, mobile: sender?.mobile,
            whatsapp: sender?.whatsapp, linkedin: sender?.linkedin_url, website: sender?.website_url,
            card: `${origin}?card=${senderId}`,
            booking: sender?.booking_enabled ? `${origin}?card=${senderId}` : null,
          };
          if(sender?.email) sendEmail("now_connected", sender.email, { youName: sender?.name, contact: meCard });
          if(profile?.email) sendEmail("now_connected", profile.email, { youName: profile?.name, contact: themCard });
        } catch(e){}
      }
    }
    loadRequests();
    // #8 load who I've blocked (and who blocked me)
    if(user){
      supabase.from("blocks").select("blocker_id,blocked_id").or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`)
        .then(({data})=>setBlockedIds((data||[]).map(b=>b.blocker_id===user.id?b.blocked_id:b.blocker_id)))
        .catch(()=>{});
    }
  }

  useEffect(()=>{
    if(!user) return;
    const iv=setInterval(()=>{ loadRequests(); }, 15000);
    return ()=>clearInterval(iv);
  // eslint-disable-next-line
  },[user]);

  useEffect(()=>{
    // Load ALL approved profiles (needed so admins appear in Core Members)
    supabase.from("profiles").select("*").eq("is_approved",true)
      .then(({data,error})=>{
        if(!error&&data?.length){
          setRealProfiles(data);
          // Deep-link: open the scanned person's profile so the user can connect
          if(connectId && !connectOpenedRef.current){
            const target=data.find(p=>p.id===connectId);
            if(target){ connectOpenedRef.current=true; setSelectedProfile(target); }
          }
        }
      }).catch(()=>{});
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
  // #17 Explain WHY someone is suggested, so the matching feels transparent
  function matchReasons(p){
    const r=[];
    const myRole=profile?.role||"";
    if(isTechnical(myRole)&&isBusiness(p.role)) r.push("Complementary role");
    if(isBusiness(myRole)&&isTechnical(p.role)) r.push("Complementary role");
    if(profile?.project_industry&&p.project_industry===profile.project_industry) r.push("Same industry");
    const myState=(profile?.location||"").split(",")[1]?.trim();
    const theirState=(p.location||"").split(",")[1]?.trim();
    if(myState&&myState===theirState) r.push("Same state");
    const shared=(p.skills||[]).filter(s=>(profile?.skills||[]).includes(s));
    if(shared.length) r.push(`${shared.length} shared skill${shared.length>1?"s":""}`);
    if((p.roles_needed||[]).some(x=>myRole&&String(x).toLowerCase().includes(myRole.split(" ")[0]?.toLowerCase()||"___"))) r.push("Looking for your role");
    return r.slice(0,2);
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
    if(blockedIds.includes(p.id)) return false; // #8 hide blocked people
    const q=search.toLowerCase();
    const matchesSearch = !search || (p.name||"").toLowerCase().includes(q)||(p.role||"").toLowerCase().includes(q)||(p.skills||[]).some(s=>s.toLowerCase().includes(q))||(p.location||"").toLowerCase().includes(q)||(p.bio||"").toLowerCase().includes(q);
    const matchesIndustry = !filterIndustry || p.project_industry===filterIndustry;
    const matchesRole = !filterRole || (p.role||"").toLowerCase().includes(filterRole.toLowerCase());
    // #6 advanced filters
    const matchesAvail = !filterAvail || p.availability===filterAvail;
    const matchesExp = !filterExp || (
      filterExp==="0-2" ? (p.experience||0)<=2 :
      filterExp==="3-5" ? (p.experience||0)>=3&&(p.experience||0)<=5 :
      filterExp==="6-10"? (p.experience||0)>=6&&(p.experience||0)<=10 :
      (p.experience||0)>10
    );
    const matchesVerified = !filterVerified || !!p.verified;
    return matchesSearch && matchesIndustry && matchesRole && matchesAvail && matchesExp && matchesVerified;
  });

  function profileReadyToReachOut(){
    const need=[];
    if(!profile?.avatar_url) need.push("a photo");
    if(!profile?.role) need.push("your role");
    if(!profile?.bio) need.push("a short bio");
    return need;
  }

  async function handleRequest(p) {
    if(requireAuth && !requireAuth()) return;
    // #9 Profile completeness gate — keeps outreach quality high
    const missing=profileReadyToReachOut();
    if(missing.length>0){
      showToast(`Add ${missing.join(", ")} to your profile before reaching out`,"error");
      return;
    }
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
      {/* #1 Onboarding checklist */}
      {user&&!checklistHidden&&(
        <OnboardingChecklist profile={profile} connectionCount={acceptedConnections.length}
          eventCount={0}
          onGo={(t)=>{ if(t==="profile"||t==="events"||t==="projects") onGoTab&&onGoTab(t); }}
          onDismiss={()=>{ setChecklistHidden(true); try{localStorage.setItem("abaa_checklist_hidden","1");}catch(e){} }}/>
      )}

      {acceptedConnections.length>0&&(
        <button onClick={()=>setShowAllMessages(true)}
          className="abaa-lift w-full flex items-center gap-3 p-4 rounded-3xl text-left transition-all"
          style={{background:"linear-gradient(135deg,rgba(124,111,224,0.14),rgba(167,139,250,0.06))",border:"1px solid rgba(167,139,250,0.25)"}}>
          {/* Stacked avatar preview */}
          <div className="flex flex-shrink-0" style={{marginLeft:"6px"}}>
            {acceptedConnections.slice(0,4).map(({other})=>(
              <div key={other.id} style={{marginLeft:"-10px"}}>
                <Av name={other.name} url={other.avatar_url} color={pal(other.id)} size="sm" ring/>
              </div>
            ))}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-sm">My Connections</div>
            <div className="text-white/45 text-xs">{acceptedConnections.length} connected · tap to browse & message</div>
          </div>
          <span className="text-white/30 text-xl">›</span>
        </button>
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
                <div>
                  <div className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Availability</div>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={()=>setFilterAvail("")} className="px-3 py-1 rounded-full text-xs font-medium" style={!filterAvail?{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",color:"#fff"}:{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.5)",border:`1px solid ${BORDER}`}}>All</button>
                    {["Full-time","Part-time","Weekends","Advisory","Just exploring"].map(a=>(
                      <button key={a} onClick={()=>setFilterAvail(filterAvail===a?"":a)} className="px-3 py-1 rounded-full text-xs font-medium" style={filterAvail===a?{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",color:"#fff"}:{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.5)",border:`1px solid ${BORDER}`}}>{a}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Experience</div>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={()=>setFilterExp("")} className="px-3 py-1 rounded-full text-xs font-medium" style={!filterExp?{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",color:"#fff"}:{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.5)",border:`1px solid ${BORDER}`}}>Any</button>
                    {[["0-2","0–2 yrs"],["3-5","3–5 yrs"],["6-10","6–10 yrs"],["10+","10+ yrs"]].map(([v,l])=>(
                      <button key={v} onClick={()=>setFilterExp(filterExp===v?"":v)} className="px-3 py-1 rounded-full text-xs font-medium" style={filterExp===v?{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",color:"#fff"}:{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.5)",border:`1px solid ${BORDER}`}}>{l}</button>
                    ))}
                  </div>
                </div>
                <button onClick={()=>setFilterVerified(v=>!v)} className="flex items-center gap-2 text-xs font-medium"
                  style={{color:filterVerified?"#c4b5fd":"rgba(255,255,255,0.5)"}}>
                  <span>{filterVerified?"☑":"☐"}</span> Verified members only
                </button>
                <SavedSearches user={user}
                  currentFilters={{industry:filterIndustry,role:filterRole,avail:filterAvail,exp:filterExp,verified:filterVerified?"1":""}}
                  onApply={(f)=>{ setFilterIndustry(f.industry||""); setFilterRole(f.role||""); setFilterAvail(f.avail||""); setFilterExp(f.exp||""); setFilterVerified(f.verified==="1"); }}
                  showToast={showToast}/>
                {(filterIndustry||filterRole||filterAvail||filterExp||filterVerified)&&(
                  <button onClick={()=>{setFilterIndustry("");setFilterRole("");setFilterAvail("");setFilterExp("");setFilterVerified(false);}} className="text-white/40 text-xs hover:text-white/70 transition-colors">✕ Clear all filters</button>
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
                    <div className="text-white font-bold text-base flex items-center gap-1.5">{p.name}<VerifiedBadge verified={p.verified} size="lg"/></div>
                    <div className="text-white/50 text-sm">{p.role}</div>
                    {p.location&&<div className="text-white/35 text-xs mt-0.5">📍 {p.location}</div>}
                  </div>
                  {p.project_industry&&<SkillChip label={p.project_industry}/>}
                </div>

                {/* #17 Why this person is suggested */}
                {(()=>{
                  const reasons=matchReasons(p);
                  if(reasons.length===0||String(p.id||"").startsWith("d")) return null;
                  return (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {reasons.map(r=>(
                        <span key={r} className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{background:"rgba(167,139,250,0.14)",color:"#c4b5fd",border:"1px solid rgba(167,139,250,0.28)"}}>
                          ✨ {r}
                        </span>
                      ))}
                    </div>
                  );
                })()}

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
            className="w-full md:max-w-md flex flex-col rounded-t-3xl md:rounded-3xl"
            style={{height:"85vh",maxHeight:"720px",background:"#0f1320",border:`1px solid ${BORDER}`}}>

            {/* Header */}
            <div className="flex-shrink-0 p-5 pb-3" style={{borderBottom:`1px solid ${BORDER}`}}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-white font-bold text-lg">My Connections</div>
                  <div className="text-white/40 text-xs">{acceptedConnections.length} people you're connected with</div>
                </div>
                <button onClick={()=>setShowAllMessages(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white" style={{background:"rgba(255,255,255,0.06)"}}>✕</button>
              </div>
              {/* Search */}
              <input value={connSearch} onChange={e=>setConnSearch(e.target.value)} placeholder="Search by name, role or label…"
                className="w-full rounded-2xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none"
                style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
              {/* Label filter chips */}
              <div className="flex gap-1.5 overflow-x-auto pt-3 -mx-1 px-1" style={{scrollbarWidth:"none"}}>
                <button onClick={()=>setConnLabelFilter(null)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold"
                  style={!connLabelFilter?{background:"rgba(124,111,224,0.3)",color:"#c4b5fd",border:"1px solid #7c6fe0"}:{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.5)",border:`1px solid ${BORDER}`}}>
                  All
                </button>
                {MEET_LABELS.map(l=>(
                  <button key={l.id} onClick={()=>setConnLabelFilter(connLabelFilter===l.id?null:l.id)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
                    style={connLabelFilter===l.id?{background:"rgba(124,111,224,0.3)",color:"#c4b5fd",border:"1px solid #7c6fe0"}:{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.5)",border:`1px solid ${BORDER}`}}>
                    {l.emoji} {l.name}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {(()=>{
                const q=connSearch.trim().toLowerCase();
                const filtered=acceptedConnections.filter(({req,other})=>{
                  if(connLabelFilter && req.meet_label!==connLabelFilter) return false;
                  if(!q) return true;
                  const lbl=labelOf(req.meet_label)?.name?.toLowerCase()||"";
                  return (other.name||"").toLowerCase().includes(q) || (other.role||"").toLowerCase().includes(q) || lbl.includes(q);
                });
                if(filtered.length===0) return <div className="text-white/30 text-sm text-center py-10">No connections match</div>;
                return filtered.map(({req,other})=>(
                  <div key={req.id} className="abaa-lift rounded-2xl p-3.5" style={{background:CARD_BG,border:`1px solid ${BORDER}`}}>
                    <div className="flex items-center gap-3">
                      <button onClick={()=>{setShowAllMessages(false);setSelectedProfile(other);}}>
                        <Av name={other.name} url={other.avatar_url} color={pal(other.id)} size="md" ring/>
                      </button>
                      <div className="flex-1 min-w-0">
                        <button onClick={()=>{setShowAllMessages(false);setSelectedProfile(other);}} className="text-left block w-full">
                          <div className="text-white font-semibold text-sm truncate">{other.name}</div>
                          <div className="text-white/40 text-xs truncate">{other.role||other.location||"View profile"}</div>
                        </button>
                      </div>
                      <ConnectionLabelPicker matchId={req.id} current={req.meet_label} showToast={showToast}
                        onSaved={(id)=>{ req.meet_label=id; setMatchMap(m=>({...m})); }}/>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={()=>{setShowAllMessages(false);setChat({matchId:req.id,other});}}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5"
                        style={{background:"rgba(124,111,224,0.18)",border:"1px solid rgba(167,139,250,0.35)"}}>
                        💬 Message
                      </button>
                      <a href={`${window.location.origin}?card=${other.id}`} target="_blank" rel="noreferrer"
                        className="flex-1 py-2 rounded-xl text-xs font-semibold text-white/70 flex items-center justify-center gap-1.5"
                        style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`}}>
                        💳 Card
                      </a>
                      {other.booking_enabled&&(
                        <button onClick={()=>{setShowAllMessages(false);setBookingTarget(other);}}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold text-white/70 flex items-center justify-center gap-1.5"
                          style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`}}>
                          📅 Book
                        </button>
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
      <AnimatePresence>{bookingTarget&&<BookingModal key="connbooking" host={bookingTarget} onClose={()=>setBookingTarget(null)}/>}</AnimatePresence>
      <AnimatePresence>{selectedProfile&&<ProfileModal p={selectedProfile} onClose={()=>setSelectedProfile(null)} onRequest={handleRequest} matchState={matchMap[selectedProfile.id]} user={user} isAdmin={isAdmin} showToast={showToast} onLoginRequired={()=>{setSelectedProfile(null);requireAuth&&requireAuth();}}/>}</AnimatePresence>
    </motion.div>
  );
}


// ════════════════════════════════════════════════════════
// EVENTS TAB
// ════════════════════════════════════════════════════════
// ═══ QR CHECK-IN (Luma-style ticket + door scanner) ═══
function ticketCode(eventId, userId){ return `ABAA-TICKET:${eventId}:${userId}`; }
// Short code a host can type in manually at the door
function shortTicketCode(eventId, userId){
  return `${String(eventId).replace(/-/g,"").slice(0,4)}-${String(userId).replace(/-/g,"").slice(0,4)}`.toUpperCase();
}
function ticketQrUrl(eventId, userId){
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(ticketCode(eventId,userId))}`;
}

function TicketModal({ event, userId, onClose }){
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/85 p-4" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} className="w-full max-w-xs rounded-3xl p-6 text-center" style={{background:"#0f1320",border:`1px solid ${BORDER}`}}>
        <div className="text-white font-bold text-lg mb-1">Your Ticket</div>
        <div className="text-white/50 text-sm mb-4">{event.title}</div>
        <div className="inline-block p-3 rounded-2xl" style={{background:"#fff"}}>
          <img src={ticketQrUrl(event.id,userId)} alt="Ticket QR" width={180} height={180}/>
        </div>
        <div className="mt-4">
          <div className="text-white/35 text-[10px] uppercase tracking-wider mb-1">Ticket Code</div>
          <div className="text-white font-bold text-lg tracking-widest">{shortTicketCode(event.id,userId)}</div>
        </div>
        <p className="text-white/35 text-xs mt-3">Show the QR at the door, or give this code to the host</p>
        <button onClick={onClose} className="mt-5 w-full py-3 rounded-2xl text-white font-semibold" style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)"}}>Done</button>
      </motion.div>
    </motion.div>
  );
}

function CheckInScanner({ event, onCheckIn, onCheckInByShortCode, onClose, showToast }){
  const videoRef=useRef(); const [status,setStatus]=useState("Point camera at a ticket QR");
  const [manual,setManual]=useState(""); const [supported,setSupported]=useState(true);
  useEffect(()=>{
    let stream, detector, raf, stopped=false;
    async function start(){
      if(!("BarcodeDetector" in window)){ setSupported(false); return; }
      try {
        detector = new window.BarcodeDetector({ formats:["qr_code"] });
        stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:"environment" } });
        if(videoRef.current){ videoRef.current.srcObject = stream; await videoRef.current.play(); }
        const scan = async () => {
          if(stopped) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if(codes.length){
              const val = codes[0].rawValue;
              if(val && val.startsWith(`ABAA-TICKET:${event.id}:`)){
                const uid = val.split(":")[2];
                onCheckIn(uid);
                setStatus("✓ Checked in!");
                setTimeout(()=>setStatus("Point camera at a ticket QR"),1500);
              }
            }
          } catch(e){}
          raf = requestAnimationFrame(scan);
        };
        scan();
      } catch(e){ setSupported(false); }
    }
    start();
    return ()=>{ stopped=true; if(raf) cancelAnimationFrame(raf); if(stream) stream.getTracks().forEach(t=>t.stop()); };
  },[event.id]);

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[95] flex flex-col bg-black">
      <div className="p-4 flex items-center justify-between" style={{borderBottom:`1px solid ${BORDER}`}}>
        <div className="text-white font-bold">📷 Check-in Scanner</div>
        <button onClick={onClose} className="text-white/60 text-xl px-2">✕</button>
      </div>
      {supported ? (
        <>
          <div className="flex-1 relative overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline/>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-56 rounded-3xl" style={{border:"3px solid rgba(167,139,250,0.8)"}}/>
            </div>
          </div>
          <div className="p-5 pb-[calc(20px+env(safe-area-inset-bottom,0px))] space-y-3">
            <div className="text-center text-white/70 text-sm">{status}</div>
            <div className="flex gap-2">
              <input value={manual} onChange={e=>setManual(e.target.value)} placeholder="Or type ticket code (e.g. A1B2-C3D4)"
                className="flex-1 rounded-2xl px-4 py-2.5 text-white placeholder-white/25 focus:outline-none"
                style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
              <button onClick={()=>{
                const v=manual.trim();
                if(v.startsWith(`ABAA-TICKET:${event.id}:`)){ onCheckIn(v.split(":")[2]); setManual(""); }
                else if(onCheckInByShortCode(v)){ setManual(""); }
                else showToast("That code doesn't match a guest for this event","error");
              }} className="px-4 rounded-2xl text-white font-bold" style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)"}}>✓</button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 pb-[calc(24px+env(safe-area-inset-bottom,0px))] text-center">
          <div className="text-white/50 text-sm mb-4">Camera scanning isn't supported on this browser.<br/>Enter the guest's ticket code manually:</div>
          <input value={manual} onChange={e=>setManual(e.target.value)} placeholder="Paste ticket code"
            className="w-full max-w-xs rounded-2xl px-4 py-3 text-white placeholder-white/30 focus:outline-none mb-3"
            style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
          <button onClick={()=>{
            const v=manual.trim();
            if(v.startsWith(`ABAA-TICKET:${event.id}:`)){ onCheckIn(v.split(":")[2]); setManual(""); }
            else if(onCheckInByShortCode(v)) { setManual(""); }
            else showToast("That code doesn't match a guest for this event","error");
          }} className="px-6 py-3 rounded-2xl text-white font-semibold" style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)"}}>Check In</button>
        </div>
      )}
    </motion.div>
  );
}

function EventAnnouncements({ event, isHost, showToast, load }){
  const [items,setItems]=useState([]);
  const [text,setText]=useState("");
  const [sending,setSending]=useState(false);
  const [open,setOpen]=useState(false);

  async function loadItems(){
    try {
      const {data}=await supabase.from("event_announcements").select("*").eq("event_id",event.id).order("created_at",{ascending:false});
      setItems(data||[]);
    } catch(e){ setItems([]); }
  }
  useEffect(()=>{ if(!String(event.id).startsWith("e")) loadItems(); },[event.id]);

  async function send(){
    if(!text.trim()) return;
    setSending(true);
    try {
      const {error}=await supabase.from("event_announcements").insert({event_id:event.id,body:text.trim()});
      if(error) throw error;
      // Email every approved guest
      const {data:atts}=await supabase.from("event_attendees")
        .select("status, profile:profiles(email,name)").eq("event_id",event.id).eq("status","approved");
      (atts||[]).forEach(a=>{
        if(a.profile?.email) sendEmail("event_announcement", a.profile.email, { title:event.title, body:text.trim() });
      });
      showToast(`Announcement sent to ${(atts||[]).length} guest${(atts||[]).length===1?"":"s"} ✓`);
      setText(""); loadItems();
    } catch(e){ showToast(e.message||"Could not send","error"); }
    setSending(false);
  }

  if(String(event.id).startsWith("e")) return null;
  if(!isHost && items.length===0) return null;

  return (
    <div className="rounded-2xl p-4" style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`}}>
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center justify-between">
        <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">📣 Announcements{items.length>0?` (${items.length})`:""}</span>
        <span className="text-white/40">{open?"▾":"▸"}</span>
      </button>
      {open&&(
        <div className="mt-3 space-y-3">
          {isHost&&(
            <div>
              <textarea value={text} onChange={e=>setText(e.target.value)} rows={2}
                placeholder="Send an update to everyone who registered…"
                className="w-full rounded-xl px-3 py-2.5 text-white placeholder-white/25 focus:outline-none resize-none"
                style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
              <button onClick={send} disabled={sending||!text.trim()}
                className="w-full mt-2 py-2.5 rounded-xl text-white text-sm font-bold"
                style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",opacity:(sending||!text.trim())?0.5:1}}>
                {sending?"Sending…":"Send to all guests"}
              </button>
            </div>
          )}
          {items.length===0
            ? <div className="text-white/30 text-xs text-center py-2">No announcements yet</div>
            : items.map(a=>(
                <div key={a.id} className="p-3 rounded-xl" style={{background:"rgba(124,111,224,0.08)",border:"1px solid rgba(124,111,224,0.2)"}}>
                  <div className="text-white/80 text-sm whitespace-pre-wrap">{a.body}</div>
                  <div className="text-white/30 text-[10px] mt-1.5">{new Date(a.created_at).toLocaleString("en-AU",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"})}</div>
                </div>
              ))}
        </div>
      )}
    </div>
  );
}

// ═══ FEATURED CALENDARS (Luma-style follow system) ═══
function CalendarsStrip({ user, showToast, onFilter, activeCalendar }){
  const [cals,setCals]=useState([]);
  const [following,setFollowing]=useState({});
  const [showManage,setShowManage]=useState(false);

  async function load(){
    try {
      const {data}=await supabase.from("calendars")
        .select("*, owner:profiles(name,avatar_url)")
        .order("follower_count",{ascending:false}).limit(20);
      setCals(data||[]);
      if(user){
        const {data:f}=await supabase.from("calendar_follows").select("calendar_id").eq("user_id",user.id);
        const m={}; (f||[]).forEach(x=>m[x.calendar_id]=true); setFollowing(m);
      }
    } catch(e){ setCals([]); }
  }
  useEffect(()=>{ load(); },[user]);

  async function toggleFollow(cal){
    if(!user){ showToast("Sign in to follow calendars","error"); return; }
    const isFollowing=!!following[cal.id];
    setFollowing(f=>({...f,[cal.id]:!isFollowing})); // optimistic
    try {
      if(isFollowing){
        await supabase.from("calendar_follows").delete().eq("calendar_id",cal.id).eq("user_id",user.id);
        await supabase.from("calendars").update({follower_count:Math.max(0,(cal.follower_count||1)-1)}).eq("id",cal.id);
      } else {
        await supabase.from("calendar_follows").insert({calendar_id:cal.id,user_id:user.id});
        await supabase.from("calendars").update({follower_count:(cal.follower_count||0)+1}).eq("id",cal.id);
        showToast(`Following ${cal.name} ✓`);
      }
      load();
    } catch(e){ setFollowing(f=>({...f,[cal.id]:isFollowing})); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-white/50 text-xs font-semibold uppercase tracking-wider">Featured Calendars</div>
        {user&&<button onClick={()=>setShowManage(true)} className="text-purple-300 text-xs font-semibold">+ Create</button>}
      </div>
      {cals.length===0 ? (
        <div className="rounded-2xl p-4 text-center" style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`}}>
          <div className="text-white/40 text-xs">No calendars yet.{user?" Create one to group your recurring events.":""}</div>
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{scrollbarWidth:"none"}}>
          {cals.map(c=>(
            <div key={c.id} className="flex-shrink-0 rounded-2xl p-3" style={{width:"190px",
              background:activeCalendar===c.id?"rgba(124,111,224,0.18)":"rgba(255,255,255,0.05)",
              border:activeCalendar===c.id?"1px solid rgba(167,139,250,0.6)":`1px solid ${BORDER}`}}>
              <button onClick={()=>onFilter(activeCalendar===c.id?null:c.id)} className="w-full text-left">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0" style={{background:c.color||"linear-gradient(135deg,#7c6fe0,#a78bfa)"}}>
                    {c.emoji||"📅"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-white text-xs font-bold truncate">{c.name}</div>
                    <div className="text-white/35 text-[10px]">{c.follower_count||0} follower{(c.follower_count||0)===1?"":"s"}</div>
                  </div>
                </div>
                {c.description&&<div className="text-white/45 text-[11px] leading-snug mb-2" style={{display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{c.description}</div>}
              </button>
              <button onClick={()=>toggleFollow(c)}
                className="w-full py-1.5 rounded-xl text-[11px] font-bold transition-colors"
                style={following[c.id]
                  ? {background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.6)",border:`1px solid ${BORDER}`}
                  : {background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",color:"#fff"}}>
                {following[c.id]?"✓ Following":"+ Follow"}
              </button>
            </div>
          ))}
        </div>
      )}
      <AnimatePresence>
        {showManage&&<CalendarCreate key="calcreate" user={user} showToast={showToast} onClose={()=>{setShowManage(false);load();}}/>}
      </AnimatePresence>
    </div>
  );
}

function CalendarCreate({ user, showToast, onClose }){
  const [f,setF]=useState({name:"",description:"",emoji:"📅"});
  const [saving,setSaving]=useState(false);
  const EMOJIS=["📅","🚀","🤖","💡","🌱","💰","🎨","⚡","🏃","🧠","🍸","🔬"];
  async function save(){
    if(!f.name.trim()){ showToast("Give your calendar a name","error"); return; }
    setSaving(true);
    try {
      const {error}=await supabase.from("calendars").insert({
        owner_id:user.id, name:f.name.trim(), description:f.description.trim(), emoji:f.emoji, follower_count:0
      });
      if(error) throw error;
      showToast("Calendar created ✓"); onClose();
    } catch(e){ showToast(e.message||"Could not create","error"); }
    setSaving(false);
  }
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-[92] flex items-end md:items-center justify-center bg-black/85 p-0 md:p-4"
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",damping:30,stiffness:300}}
        className="w-full md:max-w-sm rounded-t-3xl md:rounded-3xl p-6" style={{background:"#0f1320",border:`1px solid ${BORDER}`}}>
        <div className="text-white font-bold text-lg mb-1">Create a Calendar</div>
        <div className="text-white/45 text-sm mb-4">Group your recurring events so people can follow them.</div>
        <div className="flex gap-1.5 flex-wrap mb-3">
          {EMOJIS.map(e=>(
            <button key={e} onClick={()=>setF(x=>({...x,emoji:e}))}
              className="w-9 h-9 rounded-xl text-base flex items-center justify-center"
              style={{background:f.emoji===e?"rgba(124,111,224,0.3)":"rgba(255,255,255,0.05)",border:f.emoji===e?"1px solid #7c6fe0":`1px solid ${BORDER}`}}>{e}</button>
          ))}
        </div>
        <input value={f.name} onChange={e=>setF(x=>({...x,name:e.target.value}))} placeholder="Calendar name, e.g. Melbourne AI Meetups"
          className="w-full rounded-2xl px-4 py-3 text-white placeholder-white/25 focus:outline-none mb-3"
          style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
        <textarea value={f.description} onChange={e=>setF(x=>({...x,description:e.target.value}))} rows={3} placeholder="What is this calendar about?"
          className="w-full rounded-2xl px-4 py-3 text-white placeholder-white/25 focus:outline-none resize-none mb-4"
          style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
        <PrimaryBtn onClick={save} loading={saving} className="w-full">Create Calendar</PrimaryBtn>
        <button onClick={onClose} className="w-full text-center text-white/40 text-sm mt-2 py-1">Cancel</button>
      </motion.div>
    </motion.div>
  );
}

// ═══ EVENT GROUP CHAT (attendees + host) ═══
function EventGroupChat({ event, user, canPost, onClose }){
  const [msgs,setMsgs]=useState([]);
  const [text,setText]=useState("");
  const [sending,setSending]=useState(false);
  const [err,setErr]=useState("");
  const bottomRef=useRef();

  async function fetchMsgs(){
    try {
      const {data}=await supabase.from("event_messages")
        .select("*, sender:profiles(id,name,avatar_url)")
        .eq("event_id",event.id).order("created_at");
      setMsgs(data||[]);
    } catch(e){}
  }
  useEffect(()=>{
    fetchMsgs();
    const iv=setInterval(fetchMsgs,4000);
    return ()=>clearInterval(iv);
  },[event.id]);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs]);

  async function send(){
    const body=text.trim(); if(!body) return;
    setSending(true); setText("");
    try {
      const {error}=await supabase.from("event_messages").insert({event_id:event.id,sender_id:user.id,body});
      if(error) throw error;
      fetchMsgs();
    } catch(e){
      setText(body);
      setErr(e.message||"Could not send — you may need to be an approved attendee");
      setTimeout(()=>setErr(""),5000);
    }
    setSending(false);
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-[95] flex items-end md:items-center justify-center bg-black/85 p-0 md:p-4"
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",damping:30,stiffness:300}}
        className="w-full md:max-w-md rounded-t-3xl md:rounded-3xl flex flex-col"
        style={{background:"#0f1320",border:`1px solid ${BORDER}`,height:"85vh",
                marginBottom:"calc(env(safe-area-inset-bottom, 0px))"}}>
        <div className="p-4 flex items-center gap-3" style={{borderBottom:`1px solid ${BORDER}`}}>
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-sm truncate">💬 {event.title}</div>
            <div className="text-white/40 text-xs">Group chat for attendees</div>
          </div>
          <button onClick={onClose} className="text-white/40 text-xl px-2">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {msgs.length===0&&<div className="text-white/30 text-sm text-center py-8">No messages yet — say hello 👋</div>}
          {msgs.map(m=>{
            const mine=m.sender_id===user?.id;
            return (
              <div key={m.id} className={`flex gap-2 ${mine?"flex-row-reverse":""}`}>
                <Av name={m.sender?.name} url={m.sender?.avatar_url} color={pal(m.sender_id)} size="xs"/>
                <div className={`max-w-[75%] ${mine?"items-end":"items-start"} flex flex-col`}>
                  {!mine&&<div className="text-white/40 text-[10px] mb-0.5 px-1">{m.sender?.name||"Member"}</div>}
                  <div className="px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap"
                    style={mine
                      ? {background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",color:"#fff"}
                      : {background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.85)"}}>
                    {m.body}
                  </div>
                  <div className="text-white/25 text-[10px] mt-0.5 px-1">{new Date(m.created_at).toLocaleTimeString("en-AU",{hour:"numeric",minute:"2-digit"})}</div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef}/>
        </div>

        {canPost ? (
          <div className="p-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))]" style={{borderTop:`1px solid ${BORDER}`}}>
            {err&&<div className="text-red-400 text-xs mb-2 px-1">{err}</div>}
            <div className="flex gap-2">
            <input value={text} onChange={e=>setText(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); send(); } }}
              placeholder="Message attendees…"
              className="flex-1 rounded-2xl px-4 py-2.5 text-white placeholder-white/25 focus:outline-none"
              style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
            <button onClick={send} disabled={sending||!text.trim()}
              className="px-4 rounded-2xl text-white font-bold" style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",opacity:(sending||!text.trim())?0.5:1}}>↑</button>
            </div>
          </div>
        ) : (
          <div className="p-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] text-center text-white/35 text-xs" style={{borderTop:`1px solid ${BORDER}`}}>
            Register and get approved to join the conversation
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function EventsTab({ user, profile, isApproved, showToast, requireAuth, isAdmin, isViewAs }) {
  const [events, setEvents] = useState([]);
  const [attSet, setAttSet] = useState({});
  const [pendingAtt, setPendingAtt] = useState({});
  const [myEventsOpen, setMyEventsOpen] = useState(true);
  const [attCounts, setAttCounts] = useState({});
  const [pendingCounts, setPendingCounts] = useState({});
  const [waitlist, setWaitlist] = useState({});
  const [eventAttendees, setEventAttendees] = useState({}); // eventId -> [profiles]
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [questionPrompt, setQuestionPrompt] = useState(null);
  const [questionAnswer, setQuestionAnswer] = useState("");
  const [showTicket, setShowTicket] = useState(null);
  const [showScanner, setShowScanner] = useState(null);
  const [calFilter, setCalFilter] = useState(null);
  const [groupChat, setGroupChat] = useState(null);
  const [myCalendars, setMyCalendars] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [form, setForm] = useState({title:"",description:"",location:"",event_date:"",max_attendees:"",industry_tags:[],cover_url:"",reg_question:"",guest_list_public:true,hide_location:false,calendar_id:"",repeat:"",repeat_count:4});
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
        const counts={}, byEvent={}, mine={}, pendingByEvent={}, pendingCounts={}, waitlistByEvent={};
        (att||[]).forEach(a=>{
          const st=a.status||"approved";
          if(st==="approved"){
            counts[a.event_id]=(counts[a.event_id]||0)+1;
            if(!byEvent[a.event_id]) byEvent[a.event_id]=[];
            if(a.profile) byEvent[a.event_id].push({...a.profile, attended:a.attended||false});
          } else if(st==="pending"){
            pendingCounts[a.event_id]=(pendingCounts[a.event_id]||0)+1;
            if(!pendingByEvent[a.event_id]) pendingByEvent[a.event_id]=[];
            if(a.profile) pendingByEvent[a.event_id].push(a.profile);
          } else if(st==="waitlisted"){
            if(!waitlistByEvent[a.event_id]) waitlistByEvent[a.event_id]=[];
            if(a.profile) waitlistByEvent[a.event_id].push(a.profile);
          }
          if(user && a.user_id===user.id) mine[a.event_id]=st;
        });
        setAttCounts(counts); setEventAttendees(byEvent); setAttSet(mine); setPendingAtt(pendingByEvent);
        setPendingCounts(pendingCounts); setWaitlist(waitlistByEvent);
      }
    } catch(e){ setEvents(DEMO_EVENTS); }
    setLoading(false);
  }
  useEffect(()=>{ load(); },[user]);
  useEffect(()=>{
    if(!user) return;
    supabase.from("calendars").select("id,name,emoji").eq("owner_id",user.id)
      .then(({data})=>setMyCalendars(data||[])).catch(()=>{});
  },[user]);

  function openCreate() {
    if(requireAuth && !requireAuth()) return;
    if(!isApproved){showToast("Your account is pending admin approval","error");return;}
    setEditingId(null);
    setForm({title:"",description:"",location:"",event_date:"",max_attendees:"",industry_tags:[],cover_url:"",reg_question:"",guest_list_public:true,hide_location:false,calendar_id:"",repeat:"",repeat_count:4});
    setShowForm(true);
  }

  function openEdit(ev) {
    setEditingId(ev.id);
    setForm({
      title:ev.title||"", description:ev.description||"", location:ev.location||"",
      event_date:ev.event_date?new Date(ev.event_date).toISOString().slice(0,16):"",
      max_attendees:ev.max_attendees||"", industry_tags:ev.industry_tags||[], cover_url:ev.cover_url||"",
      reg_question:ev.reg_question||"", guest_list_public:ev.guest_list_public!==false, hide_location:!!ev.hide_location, calendar_id:ev.calendar_id||""
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
      const payload={title:form.title,description:form.description,location:form.location,event_date:form.event_date,max_attendees:parseInt(form.max_attendees)||null,industry_tags:form.industry_tags,cover_url:form.cover_url||null,reg_question:form.reg_question||null,guest_list_public:form.guest_list_public!==false,hide_location:!!form.hide_location,calendar_id:form.calendar_id||null};
      if(editingId){
        await supabase.from("events").update(payload).eq("id",editingId);
        showToast("Event updated ✓");
      } else {
        const rows=[{...payload,creator_id:user.id,is_approved: isAdmin?true:false}];
        // #13 Recurring events — generate the extra occurrences
        if(form.repeat){
          const n=Math.min(12,Math.max(2,parseInt(form.repeat_count)||4));
          const stepDays = form.repeat==="weekly"?7 : form.repeat==="fortnightly"?14 : 0;
          for(let i=1;i<n;i++){
            const d=new Date(payload.event_date);
            if(stepDays) d.setDate(d.getDate()+stepDays*i);
            else d.setMonth(d.getMonth()+i); // monthly
            rows.push({...payload,event_date:d.toISOString(),creator_id:user.id,is_approved: isAdmin?true:false});
          }
        }
        await supabase.from("events").insert(rows);
        showToast(isAdmin?"Event created ✓":"Event submitted — awaiting admin approval ✓");
        if(!isAdmin && user.email) sendEmail("event_created", user.email, { title: payload.title });
      }
      setShowForm(false); setEditingId(null);
      setForm({title:"",description:"",location:"",event_date:"",max_attendees:"",industry_tags:[],cover_url:"",reg_question:"",guest_list_public:true,hide_location:false,calendar_id:"",repeat:"",repeat_count:4});
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

  async function toggleAttend(evId, answer) {
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
      if(myStatus){ await supabase.from("event_attendees").delete().eq("event_id",evId).eq("user_id",user.id); showToast("Registration cancelled"); promoteFromWaitlist(evId); }
      else {
        const ev=events.find(e=>e.id===evId);
        const cnt=takenOf(ev);
        const isFull = ev?.max_attendees && cnt>=ev.max_attendees;
        const status = isFull ? "waitlisted" : "pending";
        await supabase.from("event_attendees").insert({event_id:evId,user_id:user.id,status,answer:answer||null});
        showToast(isFull ? "Event is full — you're on the waitlist 📋" : "Registration sent — awaiting host approval ✓");
        // Confirm to the registrant
        if(user.email) sendEmail(isFull?"event_waitlisted":"event_register", user.email, { title: ev?.title });
        // Notify the host of a new registration
        if(ev?.creator_id){
          try { const {data:host}=await supabase.from("profiles").select("email").eq("id",ev.creator_id).maybeSingle();
            if(host?.email && !isFull) sendEmail("new_registration", host.email, { title: ev?.title, attendeeName: profile?.name||"A member" });
          } catch(e){}
        }
      }
      load();
    } catch(e){showToast(e.message,"error");}
  }

  // When a spot frees up, bump the longest-waiting waitlisted guest to pending
  async function promoteFromWaitlist(evId){
    try {
      const {data:wl}=await supabase.from("event_attendees").select("*").eq("event_id",evId).eq("status","waitlisted").order("created_at").limit(1);
      if(wl && wl.length){
        await supabase.from("event_attendees").update({status:"pending"}).eq("event_id",evId).eq("user_id",wl[0].user_id);
        const ev=events.find(e=>e.id===evId);
        const {data:prof}=await supabase.from("profiles").select("email").eq("id",wl[0].user_id).maybeSingle();
        if(prof?.email) sendEmail("waitlist_promoted", prof.email, { title: ev?.title });
        load();
      }
    } catch(e){}
  }

  async function respondToAttendee(evId, userId, status) {
    try {
      if(isViewAs){
        await adminAction({action:"respond_registration", targetUserId:user.id, eventId:evId, attendeeId:userId, status});
        showToast(status==="approved"?"Attendee approved (on behalf) ✓":"Registration declined"); load(); return;
      }
      if(status==="approved"){
        await supabase.from("event_attendees").update({status:"approved"}).eq("event_id",evId).eq("user_id",userId); showToast("Attendee approved ✓");
        const ev=events.find(e=>e.id===evId);
        try { const {data:att}=await supabase.from("profiles").select("email").eq("id",userId).maybeSingle();
          if(att?.email) sendEmail("event_approved", att.email, {
            title: ev?.title,
            when: ev?.event_date ? new Date(ev.event_date).toLocaleString("en-AU",{weekday:"long",day:"numeric",month:"long",hour:"numeric",minute:"2-digit"}) : "",
            location: ev?.hide_location ? (ev?.location||"") : (ev?.location||""),
            code: shortTicketCode(evId, userId),
            qr: ticketQrUrl(evId, userId),
          });
        } catch(e){}
      }
      else { await supabase.from("event_attendees").delete().eq("event_id",evId).eq("user_id",userId); showToast("Registration declined"); promoteFromWaitlist(evId); }
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
    const matchesSearch = !search || (ev.title||"").toLowerCase().includes(q)||(ev.description||"").toLowerCase().includes(q)||(ev.location||"").toLowerCase().includes(q)||(ev.industry_tags||[]).some(t=>String(t).toLowerCase().includes(q));
    if(calFilter && ev.calendar_id !== calFilter) return false;
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
  const takenOf = (ev) => (attCounts[ev.id]||0) + (pendingCounts[ev.id]||0); // used to trigger waitlist
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
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Cover</label>
                {/* Luma-style theme gallery */}
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{scrollbarWidth:"none"}}>
                  {COVER_THEMES.map(t=>(
                    <button key={t.id} onClick={()=>setForm(f=>({...f,cover_url:`theme:${t.id}`}))}
                      title={t.id}
                      className="flex-shrink-0 rounded-xl transition-transform"
                      style={{width:"52px",height:"34px",background:t.grad,
                        border: form.cover_url===`theme:${t.id}` ? "2.5px solid #fff" : `1px solid ${BORDER}`,
                        transform: form.cover_url===`theme:${t.id}` ? "scale(1.08)" : "scale(1)"}}/>
                  ))}
                </div>
                <div className="text-white/30 text-[11px]">Pick a theme, or upload your own image below</div>
                {form.cover_url && !String(form.cover_url).startsWith("theme:") ? (
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
              <div className="space-y-1.5">
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Repeat</label>
                <div className="flex gap-2 flex-wrap">
                  {[{id:"",label:"One-off"},{id:"weekly",label:"Weekly"},{id:"fortnightly",label:"Fortnightly"},{id:"monthly",label:"Monthly"}].map(r=>(
                    <button key={r.id} onClick={()=>setForm(f=>({...f,repeat:r.id}))}
                      className="px-3 py-2 rounded-xl text-xs font-semibold"
                      style={(form.repeat||"")===r.id?{background:"rgba(124,111,224,0.3)",border:"1px solid #7c6fe0",color:"#c4b5fd"}:{background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`,color:"rgba(255,255,255,0.5)"}}>
                      {r.label}
                    </button>
                  ))}
                </div>
                {form.repeat&&(
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-white/40 text-xs">Create</span>
                    <input type="number" min="2" max="12" value={form.repeat_count||4}
                      onChange={e=>setForm(f=>({...f,repeat_count:e.target.value}))}
                      className="w-16 rounded-xl px-2 py-1.5 text-white focus:outline-none"
                      style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
                    <span className="text-white/40 text-xs">occurrences</span>
                  </div>
                )}
              </div>

              {myCalendars.length>0&&(
                <div className="space-y-1.5">
                  <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Add to Calendar (optional)</label>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={()=>setForm(f=>({...f,calendar_id:""}))}
                      className="px-3 py-2 rounded-xl text-xs font-semibold"
                      style={{background:!form.calendar_id?"rgba(124,111,224,0.3)":"rgba(255,255,255,0.05)",border:!form.calendar_id?"1px solid #7c6fe0":`1px solid ${BORDER}`,color:!form.calendar_id?"#c4b5fd":"rgba(255,255,255,0.5)"}}>
                      None
                    </button>
                    {myCalendars.map(c=>(
                      <button key={c.id} onClick={()=>setForm(f=>({...f,calendar_id:c.id}))}
                        className="px-3 py-2 rounded-xl text-xs font-semibold"
                        style={{background:form.calendar_id===c.id?"rgba(124,111,224,0.3)":"rgba(255,255,255,0.05)",border:form.calendar_id===c.id?"1px solid #7c6fe0":`1px solid ${BORDER}`,color:form.calendar_id===c.id?"#c4b5fd":"rgba(255,255,255,0.5)"}}>
                        {c.emoji} {c.name}
                      </button>
                    ))}
                  </div>
                  <p className="text-white/25 text-xs">Followers of that calendar will discover this event.</p>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-white/40 text-xs font-medium uppercase tracking-wider">Registration Question (optional)</label>
                <input value={form.reg_question} onChange={e=>setForm(f=>({...f,reg_question:e.target.value}))} placeholder="e.g. Any dietary requirements?"
                  className="w-full rounded-2xl px-4 py-3 text-white placeholder-white/25 focus:outline-none"
                  style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
                <p className="text-white/25 text-xs">Guests will answer this when they register.</p>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl" style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`}}>
                <div>
                  <div className="text-white text-sm font-medium">Public guest list</div>
                  <div className="text-white/35 text-xs">Show who's going on the event page</div>
                </div>
                <button onClick={()=>setForm(f=>({...f,guest_list_public:!f.guest_list_public}))}
                  className="w-11 h-6 rounded-full transition-colors relative flex-shrink-0"
                  style={{background:form.guest_list_public?"#7c6fe0":"rgba(255,255,255,0.15)"}}>
                  <span className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all" style={{left:form.guest_list_public?"24px":"4px"}}/>
                </button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl" style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`}}>
                <div>
                  <div className="text-white text-sm font-medium">Hide exact location until approved</div>
                  <div className="text-white/35 text-xs">Guests see full address only after you accept them</div>
                </div>
                <button onClick={()=>setForm(f=>({...f,hide_location:!f.hide_location}))}
                  className="w-11 h-6 rounded-full transition-colors relative flex-shrink-0"
                  style={{background:form.hide_location?"#7c6fe0":"rgba(255,255,255,0.15)"}}>
                  <span className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all" style={{left:form.hide_location?"24px":"4px"}}/>
                </button>
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

      {/* #14 Post-event follow-up prompt */}
      {user&&(
        <PostEventFollowUp events={events} attSet={attSet} eventAttendees={eventAttendees} user={user}
          onConnect={(o)=>{ showToast(`Open Match to connect with ${String(o.name).split(" ")[0]}`); }}
          showToast={showToast}/>
      )}

      {/* Featured Calendars (follow system) */}
      <CalendarsStrip user={user} showToast={showToast} onFilter={setCalFilter} activeCalendar={calFilter}/>

      {/* ═══ DISCOVER: Browse by Category & City (Luma-style) ═══ */}
      {(()=>{
        const upcoming = events.filter(ev=>(isDemo(ev)||ev.is_approved!==false)&&isFuture(ev));
        // Category counts from industry tags
        const catMap = {};
        upcoming.forEach(ev=>(ev.industry_tags||[]).forEach(t=>{ catMap[t]=(catMap[t]||0)+1; }));
        const cats = Object.entries(catMap).sort((a,b)=>b[1]-a[1]).slice(0,8);
        // City counts — take the suburb/city portion of the location
        const cityMap = {};
        upcoming.forEach(ev=>{
          const parts=String(ev.location||"").split(",").map(s=>s.trim()).filter(Boolean);
          const city = parts.length>1 ? parts[parts.length-1].replace(/\s+(VIC|NSW|QLD|WA|SA|TAS|ACT|NT)\b.*$/i,"").trim() || parts[parts.length-2] : parts[0];
          if(city) cityMap[city]=(cityMap[city]||0)+1;
        });
        const cities = Object.entries(cityMap).sort((a,b)=>b[1]-a[1]).slice(0,8);
        if(cats.length===0 && cities.length===0) return null;
        const CAT_ICON = {DeepTech:"🧬",SaaS:"☁️",FinTech:"💳",Web3:"⛓️",EdTech:"🎓",Climate:"🌏",HealthTech:"🩺","E-commerce":"🛒",Consumer:"📱",PropTech:"🏠",AgriTech:"🌾",Wellness:"🧘",Community:"✨"};
        const pill = (label,count,icon,onClick,active)=>(
          <button key={label} onClick={onClick}
            className="flex-shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl transition-all"
            style={{background:active?"rgba(124,111,224,0.22)":"rgba(255,255,255,0.05)",
                    border:active?"1px solid rgba(167,139,250,0.6)":`1px solid ${BORDER}`}}>
            <span className="text-base">{icon}</span>
            <span className="text-left">
              <span className="block text-white text-xs font-semibold leading-tight">{label}</span>
              <span className="block text-white/40 text-[10px] leading-tight">{count} Event{count===1?"":"s"}</span>
            </span>
          </button>
        );
        return (
          <div className="space-y-4">
            {cats.length>0&&(
              <div>
                <div className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Browse by Category</div>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{scrollbarWidth:"none"}}>
                  {cats.map(([c,n])=>pill(c,n,CAT_ICON[c]||"🎯",()=>setSearch(search===c?"":c),search===c))}
                </div>
              </div>
            )}
            {cities.length>0&&(
              <div>
                <div className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Explore Local Events</div>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{scrollbarWidth:"none"}}>
                  {cities.map(([c,n])=>pill(c,n,"📍",()=>setSearch(search===c?"":c),search===c))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Events List */}
      <div>
        {(()=>{
          const renderCard = (ev,i) => {
            const past=new Date(ev.event_date)<now;
            const myStatus=attSet[ev.id]; // undefined | "pending" | "approved" | "waitlisted"
            const attending=!!myStatus && myStatus!=="waitlisted";
            const onWaitlist=myStatus==="waitlisted";
            const cnt=cntOf(ev);
            const full=ev.max_attendees&&takenOf(ev)>=ev.max_attendees;
            const spotsLeft = ev.max_attendees ? ev.max_attendees - cnt : null;
            return (
              <motion.div key={ev.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.03}}>
                <Card className={`overflow-hidden cursor-pointer transition-all hover:border-white/20 ${past?"opacity-50":""}`}>
                  {(()=>{
                    const g = themeGrad(ev.cover_url) || (!ev.cover_url ? autoGrad(ev.id||ev.title) : null);
                    return (
                      <div onClick={()=>setSelectedEvent({...ev,attending,onWaitlist,cnt,full,past,spotsLeft})} className="w-full overflow-hidden relative" style={{aspectRatio:"16/9",background:g||"transparent"}}>
                        {g ? (
                          <div className="absolute inset-0 flex items-center justify-center p-5">
                            <div className="text-center">
                              <div className="text-white font-bold leading-tight" style={{fontSize:"clamp(15px,4.5vw,22px)",textShadow:"0 2px 12px rgba(0,0,0,0.35)"}}>{ev.title}</div>
                              <div className="text-white/80 text-xs mt-1.5">{new Date(ev.event_date).toLocaleDateString("en-AU",{weekday:"short",day:"numeric",month:"short"})}</div>
                            </div>
                          </div>
                        ) : <img src={ev.cover_url} alt={ev.title} className="w-full h-full object-cover"/>}
                      </div>
                    );
                  })()}
                  <div className="p-5">
                    <div onClick={()=>setSelectedEvent({...ev,attending,onWaitlist,cnt,full,past,spotsLeft})}>
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
                      <OutlineBtn onClick={()=>setSelectedEvent({...ev,attending,onWaitlist,cnt,full,past,spotsLeft})} className="w-full mb-2" small>
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
                      {/* waitlist visibility for my events */}
                      {myCreatedEvents.map(ev=>{
                        const wl=waitlist[ev.id]||[];
                        if(wl.length===0) return null;
                        return (
                          <Card key={"wl-"+ev.id} className="p-4 mb-3" style={{border:`1px solid ${BORDER}`}}>
                            <div className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">📋 {wl.length} on Waitlist — {ev.title}</div>
                            <div className="flex flex-wrap gap-2">{wl.map(g=>(
                              <div key={g.id} className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{background:"rgba(255,255,255,0.05)"}}>
                                <Av name={g.name} url={g.avatar_url} color={pal(g.id)} size="xs"/>
                                <span className="text-white/60 text-xs">{g.name}</span>
                              </div>
                            ))}</div>
                            <p className="text-white/30 text-xs mt-2">They'll be automatically offered a spot if one opens up.</p>
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
                  : (()=>{
                      // Group by day, Luma-style timeline
                      const groups=[];
                      futureEvents.forEach(ev=>{
                        const d=new Date(ev.event_date); d.setHours(0,0,0,0);
                        const key=d.toISOString().slice(0,10);
                        let g=groups.find(x=>x.key===key);
                        if(!g){ g={key,date:d,items:[]}; groups.push(g); }
                        g.items.push(ev);
                      });
                      const today=new Date(); today.setHours(0,0,0,0);
                      const tomorrow=new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
                      const dayLabel=(d)=>{
                        if(d.getTime()===today.getTime()) return "Today";
                        if(d.getTime()===tomorrow.getTime()) return "Tomorrow";
                        return d.toLocaleDateString("en-AU",{weekday:"long"});
                      };
                      let n=0;
                      return (
                        <div className="relative">
                          {/* timeline rail */}
                          <div className="absolute top-2 bottom-2" style={{left:"5px",width:"1px",background:BORDER}}/>
                          {groups.map(g=>(
                            <div key={g.key} className="relative pl-7 mb-6">
                              {/* date dot */}
                              <div className="absolute rounded-full" style={{left:"0px",top:"6px",width:"11px",height:"11px",background:"#0f1320",border:"2px solid rgba(167,139,250,0.8)"}}/>
                              <div className="flex items-baseline gap-2 mb-3">
                                <span className="text-white font-bold text-sm">{dayLabel(g.date)}</span>
                                <span className="text-white/35 text-xs">{g.date.toLocaleDateString("en-AU",{day:"numeric",month:"short"})}</span>
                              </div>
                              <div className="space-y-4">{g.items.map(ev=>renderCard(ev,n++))}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
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
              {(()=>{
                const g = themeGrad(selectedEvent.cover_url) || (!selectedEvent.cover_url ? autoGrad(selectedEvent.id||selectedEvent.title) : null);
                return (
                  <div className="relative w-full overflow-hidden" style={{aspectRatio:"16/9",background:g||"transparent"}}>
                    {g ? (
                      <div className="absolute inset-0 flex items-center justify-center p-6">
                        <div className="text-center">
                          <div className="text-white font-bold leading-tight" style={{fontSize:"clamp(18px,5.5vw,28px)",textShadow:"0 2px 14px rgba(0,0,0,0.35)"}}>{selectedEvent.title}</div>
                          <div className="text-white/85 text-sm mt-2">{new Date(selectedEvent.event_date).toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"long"})}</div>
                        </div>
                      </div>
                    ) : <img src={selectedEvent.cover_url} alt={selectedEvent.title} className="w-full h-full object-cover"/>}
                    <button onClick={()=>setSelectedEvent(null)}
                      className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-white transition-all" style={{background:"rgba(0,0,0,0.5)"}}>✕</button>
                  </div>
                );
              })()}
              {/* Modal header banner */}
              <div className="relative p-6 pb-5">
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
                    : selectedEvent.onWaitlist
                    ? <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{background:"rgba(245,158,11,0.15)",color:"#fbbf24"}}>📋 You're on the Waitlist</span>
                    : selectedEvent.full
                    ? <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{background:"rgba(245,158,11,0.15)",color:"#fbbf24"}}>📋 Full — Waitlist Available</span>
                    : <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{background:"rgba(16,185,129,0.15)",color:"#34d399"}}>● Open for Registration</span>}
                </div>

                {/* Description */}
                <div>
                  {/* Luma-style quick actions */}
                  <div className="flex gap-2 mb-4">
                    <button onClick={()=>downloadEventICS(selectedEvent)}
                      className="flex-1 py-2.5 rounded-2xl text-xs font-semibold text-white" style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`}}>
                      📅 Add to Calendar
                    </button>
                    <button onClick={async()=>{
                      const url=`${window.location.origin}${window.location.pathname}?event=${selectedEvent.id}`;
                      const txt=`${selectedEvent.title} — ${fmtDate(selectedEvent.event_date)}`;
                      try { if(navigator.share) await navigator.share({title:selectedEvent.title,text:txt,url}); else { await navigator.clipboard.writeText(url); showToast("Event link copied ✓"); } }
                      catch(e){}
                    }}
                      className="flex-1 py-2.5 rounded-2xl text-xs font-semibold text-white" style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`}}>
                      🔗 Share Event
                    </button>
                  </div>
                  <div className="mb-4 space-y-3">
                    <EventAnnouncements event={selectedEvent} isHost={isCreator(selectedEvent)} showToast={showToast} load={load}/>
                    {user&&<EventFeedback event={selectedEvent} user={user} showToast={showToast}/>}
                  </div>
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
                    <div><div className="text-white/40 text-xs">Location</div><div className="text-white text-sm font-medium">
                      {selectedEvent.hide_location && !selectedEvent.attending && !isCreator(selectedEvent)
                        ? "📍 Revealed once your registration is approved"
                        : (selectedEvent.location||"TBA")}
                    </div></div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-2xl" style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`}}>
                    <span className="text-xl">👥</span>
                    <div className="flex-1">
                      <div className="text-white/40 text-xs">Attendance</div>
                      <div className="text-white text-sm font-medium">
                        {selectedEvent.cnt}{selectedEvent.max_attendees?` of ${selectedEvent.max_attendees}`:""} registered
                      </div>
                      {/* Who's coming — Luma-style social proof (host can make this private) */}
                      {(()=>{
                        const guests=(eventAttendees[selectedEvent.id]||[]).filter(g=>g&&g.name);
                        if(guests.length===0) return null;
                        if(selectedEvent.guest_list_public===false && !isCreator(selectedEvent)){
                          return <div className="text-white/30 text-xs mt-2">Guest list is private</div>;
                        }
                        return (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex" style={{marginLeft:"4px"}}>
                              {guests.slice(0,5).map((g,i)=>(
                                <div key={g.id||i} style={{marginLeft:"-8px",zIndex:5-i}}>
                                  <Av name={g.name} url={g.avatar_url} color={pal(g.id||g.name)} size="xs" ring/>
                                </div>
                              ))}
                            </div>
                            <span className="text-white/45 text-xs">
                              {guests.slice(0,2).map(g=>String(g.name).split(" ")[0]).join(", ")}
                              {guests.length>2?` and ${guests.length-2} others are going`:" going"}
                            </span>
                          </div>
                        );
                      })()}
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

                {/* Group chat */}
                {!String(selectedEvent.id).startsWith("e")&&(selectedEvent.attending||isCreator(selectedEvent))&&(
                  <button onClick={()=>setGroupChat(selectedEvent)}
                    className="w-full py-3 rounded-2xl text-white font-semibold mb-2" style={{background:"rgba(255,255,255,0.08)",border:`1px solid ${BORDER}`}}>
                    💬 Event Group Chat
                  </button>
                )}

                {/* Ticket (attendees) */}
                {selectedEvent.attending&&!selectedEvent.past&&(
                  <button onClick={()=>setShowTicket(selectedEvent)}
                    className="w-full py-3 rounded-2xl text-white font-semibold mb-2" style={{background:"rgba(255,255,255,0.08)",border:`1px solid ${BORDER}`}}>
                    🎟️ My Ticket (QR)
                  </button>
                )}

                {/* Door scanner (host) */}
                {isCreator(selectedEvent)&&!String(selectedEvent.id).startsWith("e")&&(
                  <button onClick={()=>setShowScanner(selectedEvent)}
                    className="w-full py-3 rounded-2xl text-white font-bold mb-2" style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)"}}>
                    📷 Scan Tickets / Check-in
                  </button>
                )}

                {/* Action */}
                {!selectedEvent.past&&!isCreator(selectedEvent)&&(
                  (selectedEvent.attending||selectedEvent.onWaitlist)
                    ? <OutlineBtn onClick={()=>{toggleAttend(selectedEvent.id);setSelectedEvent(null);}} className="w-full">✓ Cancel {selectedEvent.onWaitlist?"Waitlist Spot":"Registration"}</OutlineBtn>
                    : <PrimaryBtn onClick={()=>{
                        if(selectedEvent.reg_question){ setQuestionPrompt(selectedEvent); return; }
                        toggleAttend(selectedEvent.id);setSelectedEvent(null);
                      }} className="w-full">
                        {selectedEvent.full?"📋 Join Waitlist":"Register to Attend"}
                      </PrimaryBtn>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event group chat */}
      <AnimatePresence>
        {groupChat&&<EventGroupChat key="gchat" event={groupChat} user={user}
          canPost={attSet[groupChat.id]==="approved"||groupChat.creator_id===user?.id}
          onClose={()=>setGroupChat(null)}/>}
      </AnimatePresence>

      {/* Ticket & scanner */}
      <AnimatePresence>
        {showTicket&&<TicketModal key="ticket" event={showTicket} userId={user?.id} onClose={()=>setShowTicket(null)}/>}
      </AnimatePresence>
      <AnimatePresence>
        {showScanner&&<CheckInScanner key="scanner" event={showScanner} showToast={showToast}
          onCheckIn={async(uid)=>{
            try {
              await supabase.from("event_attendees").update({attended:true,status:"approved"}).eq("event_id",showScanner.id).eq("user_id",uid);
              const {data:g}=await supabase.from("profiles").select("name,email").eq("id",uid).maybeSingle();
              const when=new Date().toLocaleString("en-AU",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"});
              if(g?.email) sendEmail("checked_in", g.email, { title:showScanner.title, when, who:"you" });
              if(user?.email) sendEmail("checked_in", user.email, { title:showScanner.title, when, who:g?.name||"A guest" });
              showToast(`✓ ${g?.name||"Guest"} checked in`); load();
            } catch(e){ showToast("Check-in failed","error"); }
          }}
          onCheckInByShortCode={(code)=>{
            const all=[...(eventAttendees[showScanner.id]||[]),...(pendingAtt[showScanner.id]||[])];
            const match=all.find(g=>g&&shortTicketCode(showScanner.id,g.id).toUpperCase()===String(code).toUpperCase());
            if(!match) return false;
            (async()=>{
              try {
                await supabase.from("event_attendees").update({attended:true,status:"approved"}).eq("event_id",showScanner.id).eq("user_id",match.id);
                const when=new Date().toLocaleString("en-AU",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"});
                const {data:g}=await supabase.from("profiles").select("email").eq("id",match.id).maybeSingle();
                if(g?.email) sendEmail("checked_in", g.email, { title:showScanner.title, when, who:"you" });
                if(user?.email) sendEmail("checked_in", user.email, { title:showScanner.title, when, who:match.name||"A guest" });
                showToast(`✓ ${match.name||"Guest"} checked in`); load();
              } catch(e){ showToast("Check-in failed","error"); }
            })();
            return true;
          }}
          onClose={()=>setShowScanner(null)}/>}
      </AnimatePresence>

      {/* Registration question prompt */}
      <AnimatePresence>
        {questionPrompt&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4"
            onClick={e=>e.target===e.currentTarget&&setQuestionPrompt(null)}>
            <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} className="w-full max-w-sm rounded-3xl p-6" style={{background:"#0f1320",border:`1px solid ${BORDER}`}}>
              <div className="text-white font-bold text-base mb-1">One quick question</div>
              <div className="text-white/60 text-sm mb-4">{questionPrompt.reg_question}</div>
              <textarea value={questionAnswer} onChange={e=>setQuestionAnswer(e.target.value)} rows={3} placeholder="Your answer"
                className="w-full rounded-2xl px-4 py-3 text-white placeholder-white/25 focus:outline-none resize-none mb-4"
                style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
              <PrimaryBtn onClick={()=>{
                toggleAttend(questionPrompt.id, questionAnswer);
                setQuestionPrompt(null); setQuestionAnswer(""); setSelectedEvent(null);
              }} className="w-full">Submit Registration</PrimaryBtn>
              <button onClick={()=>setQuestionPrompt(null)} className="w-full text-center text-white/40 text-sm mt-2 py-1">Cancel</button>
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
  const [autoSaved, setAutoSaved] = useState(false);
  const [boardView, setBoardView] = useState(false);
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
        if(user?.email) sendEmail("project_created", user.email, { projectName: f.project_name });
      } else {
        const {error}=await supabase.from("projects").update(payload).eq("id",editing); if(error) throw error;
        showToast("Project updated ✓");
      }
      setEditing(null); load();
    } catch(e){ showToast(e.message,"error"); }
    setSaving(false);
  }

  // Auto-save edits to an existing project 1.2s after typing stops
  const projFirstRef = useRef(true);
  useEffect(()=>{
    if(!editing || editing==="new"){ projFirstRef.current=true; return; }
    if(projFirstRef.current){ projFirstRef.current=false; return; }
    if(!f.project_name.trim()) return;
    const t=setTimeout(async()=>{
      try {
        await supabase.from("projects").update({
          project_name:f.project_name, project_pitch:f.project_pitch, project_industry:f.project_industry,
          project_stage:f.project_stage, funding_status:f.funding_status,
          team_size:parseInt(f.team_size)||null, project_website:f.project_website, roles_needed:f.roles_needed,
        }).eq("id",editing);
        setAutoSaved(true); setTimeout(()=>setAutoSaved(false),1800);
      } catch(e){}
    },1200);
    return ()=>clearTimeout(t);
  // eslint-disable-next-line
  },[f,editing]);

  async function del(id) {
    if(!confirm("Delete this project?")) return;
    const {error}=await supabase.from("projects").delete().eq("id",id);
    if(error){ showToast(error.message,"error"); return; }
    showToast("Project deleted"); load();
  }

  if(editing){
    return (
      <Card className="p-5 space-y-4">
        {editing!=="new"&&(
          <div className="text-white/35 text-xs text-center">{autoSaved?"✓ Saved automatically":"Changes save automatically as you edit"}</div>
        )}
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
      {loading&&<SkeletonList n={2}/>}
      {!loading&&projects.length===0&&(
        <EmptyState emoji="🚀" title="No projects yet"
          body="Add your first project so founders can discover it and request to join."
          actionLabel="+ Create a project" onAction={startNew}/>
      )}
      {!loading&&projects.length>0&&(
        <>
          <div className="flex gap-2">
            <button onClick={()=>setBoardView(false)} className="px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={!boardView?{background:"rgba(124,111,224,0.3)",border:"1px solid #7c6fe0",color:"#c4b5fd"}:{background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`,color:"rgba(255,255,255,0.5)"}}>List</button>
            <button onClick={()=>setBoardView(true)} className="px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={boardView?{background:"rgba(124,111,224,0.3)",border:"1px solid #7c6fe0",color:"#c4b5fd"}:{background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`,color:"rgba(255,255,255,0.5)"}}>Board</button>
          </div>
          {boardView&&(
            <ProjectBoard projects={projects} onEdit={(p)=>startEdit(p)}
              onStageChange={async(p,stage)=>{
                try{ await supabase.from("projects").update({project_stage:stage}).eq("id",p.id); load(); showToast(`Moved to ${stage} ✓`); }
                catch(e){ showToast("Could not move","error"); }
              }}/>
          )}
        </>
      )}
      {!boardView&&projects.map(p=>(
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
    const reqs = (data||[]).filter(r=>r.from_user_id!==user.id); // ignore any self-requests
    if(reqs.length){
      const {data:profs} = await supabase.from("profiles").select("*").in("id", reqs.map(r=>r.from_user_id));
      // Keep ALL requests; attach sender if found, otherwise a fallback so it still shows + can be actioned
      setRequests(reqs.map(r=>({...r, sender:(profs||[]).find(p=>p.id===r.from_user_id)||{id:r.from_user_id,name:"A member"}})));
    } else setRequests([]);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[user]);

  async function respond(id,status){
    const {error}=await supabase.from("project_requests").update({status}).eq("id",id);
    if(error){showToast(error.message,"error");return;}
    const req=requests.find(r=>r.id===id);
    if(status==="accepted"){
      // Open a chat between owner and requester (accepted match), tagged with the project
      if(req){
        try {
          const projName=req.project?.project_name||"a project";
          // Avoid duplicate: look for an existing match between these two
          const {data:existing}=await supabase.from("match_requests").select("id")
            .or(`and(from_user_id.eq.${req.from_user_id},to_user_id.eq.${user.id}),and(from_user_id.eq.${user.id},to_user_id.eq.${req.from_user_id})`).limit(1);
          if(existing&&existing.length){
            await supabase.from("match_requests").update({status:"accepted",project_context:projName}).eq("id",existing[0].id);
          } else {
            await supabase.from("match_requests").insert({from_user_id:req.from_user_id,to_user_id:user.id,status:"accepted",project_context:projName});
          }
        } catch(e){}
      }
      if(req?.sender?.email) sendEmail("join_accepted", req.sender.email, { projectName: req.project?.project_name||"the project" });
      showToast("Accepted! You're now connected — you can chat in the Match tab ✓");
    } else showToast("Request declined");
    load();
  }

  const pending = requests.filter(r=>r.status==="pending");
  const accepted = requests.filter(r=>r.status==="accepted");

  // Don't render anything if there are no requests at all (keeps tabs clean + matches badge)
  if(!loading && requests.length===0) return null;

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-amber-400">🔔</span>
        <span className="text-white font-bold text-base">Join Requests to My Project</span>
        {pending.length>0&&<span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{background:"rgba(245,158,11,0.2)",color:"#fbbf24"}}>{pending.length}</span>}
      </div>

      {loading&&<div className="text-white/30 text-sm text-center py-4">Loading…</div>}

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

      {/* Join requests to MY projects — shown here so it matches the Projects tab badge */}
      {user&&<ProjectJoinRequests user={user} showToast={showToast}/>}

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
function BookingSettings({ form, setForm }) {
  const hours = form.booking_hours || DEFAULT_HOURS;
  const setDay=(k,patch)=>setForm(f=>({...f,booking_hours:{...(f.booking_hours||DEFAULT_HOURS),[k]:{...(f.booking_hours||DEFAULT_HOURS)[k],...patch}}}));
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-white font-semibold text-sm">📅 Meeting bookings</div>
          <div className="text-white/40 text-xs">Let people book meetings with you from your card and profile</div>
        </div>
        <button onClick={()=>setForm(f=>({...f,booking_enabled:!f.booking_enabled}))}
          className="w-12 h-7 rounded-full transition-colors relative flex-shrink-0"
          style={{background:form.booking_enabled?"#7c6fe0":"rgba(255,255,255,0.15)"}}>
          <span className="absolute top-1 w-5 h-5 rounded-full bg-white transition-all" style={{left:form.booking_enabled?"26px":"4px"}}/>
        </button>
      </div>
      {form.booking_enabled&&(
        <div className="mt-4 space-y-4">
          <div>
            <div className="text-white/50 text-xs mb-2">MEETING LENGTH</div>
            <div className="flex gap-2">
              {[15,30,45,60].map(d=>(
                <button key={d} onClick={()=>setForm(f=>({...f,booking_duration:d}))}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition-colors"
                  style={{background:form.booking_duration===d?"rgba(124,111,224,0.3)":"rgba(255,255,255,0.05)",border:form.booking_duration===d?"1px solid #7c6fe0":`1px solid ${BORDER}`,color:form.booking_duration===d?"#c4b5fd":"rgba(255,255,255,0.5)"}}>
                  {d} min
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-white/50 text-xs mb-2">WEEKLY AVAILABILITY</div>
            <div className="space-y-2">
              {["mon","tue","wed","thu","fri","sat","sun"].map(k=>(
                <div key={k} className="flex items-center gap-2">
                  <button onClick={()=>setDay(k,{on:!hours[k].on})}
                    className="w-10 h-6 rounded-full transition-colors relative flex-shrink-0"
                    style={{background:hours[k].on?"#7c6fe0":"rgba(255,255,255,0.12)"}}>
                    <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{left:hours[k].on?"18px":"2px"}}/>
                  </button>
                  <span className="text-white/70 text-xs w-20">{DAY_LABELS[k]}</span>
                  {hours[k].on?(
                    <div className="flex items-center gap-1.5 flex-1">
                      <input type="time" value={hours[k].start} onChange={e=>setDay(k,{start:e.target.value})}
                        className="flex-1 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none" style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
                      <span className="text-white/30 text-xs">–</span>
                      <input type="time" value={hours[k].end} onChange={e=>setDay(k,{end:e.target.value})}
                        className="flex-1 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none" style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
                    </div>
                  ):(
                    <span className="text-white/25 text-xs">Unavailable</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="text-white/30 text-xs">Times are Australian Eastern Time. Booked slots are automatically blocked.</div>
        </div>
      )}
    </Card>
  );
}

function MyBookings({ user, profile, showToast }) {
  const [bookings,setBookings]=useState([]);
  const [open,setOpen]=useState(true);
  async function load(){
    if(!user) return;
    const {data}=await supabase.from("bookings").select("*").eq("host_id",user.id).neq("status","cancelled").neq("status","declined")
      .gte("start_time",new Date().toISOString()).order("start_time");
    setBookings(data||[]);
  }
  useEffect(()=>{ load(); },[user]);

  function whenStr(b){ const s=new Date(b.start_time); return `${fmtDateNice(s)} at ${fmtTime12(`${s.getHours()}:${String(s.getMinutes()).padStart(2,"0")}`)}`; }

  async function accept(b){
    await supabase.from("bookings").update({status:"confirmed"}).eq("id",b.id);
    // Send both parties the confirmation + video link
    const dur=Math.round((new Date(b.end_time)-new Date(b.start_time))/60000);
    const icsData={ when:whenStr(b), link:b.meeting_link, duration:dur, startISO:b.start_time, endISO:b.end_time };
    if(b.guest_email) sendEmail("booking_accepted", b.guest_email, { ...icsData, hostName:profile?.name||"your host" });
    if(user.email) sendEmail("booking_accepted", user.email, { ...icsData, hostName:b.guest_name });
    showToast("Meeting accepted — video link sent to both of you ✓");
    load();
  }
  async function decline(b){
    if(!confirm(`Decline the meeting request from ${b.guest_name}?`)) return;
    await supabase.from("bookings").update({status:"declined"}).eq("id",b.id);
    if(b.guest_email) sendEmail("booking_declined", b.guest_email, { hostName:profile?.name||"your host", when:whenStr(b) });
    showToast("Request declined");
    load();
  }
  async function cancel(b){
    if(!confirm(`Cancel the meeting with ${b.guest_name}?`)) return;
    await supabase.from("bookings").update({status:"cancelled"}).eq("id",b.id);
    if(b.guest_email) sendEmail("booking_cancelled", b.guest_email, { hostName:profile?.name||"your host", when:whenStr(b) });
    showToast("Meeting cancelled");
    load();
  }

  if(bookings.length===0) return null;
  const pending=bookings.filter(b=>b.status==="pending");
  return (
    <Card className="p-4">
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center justify-between">
        <div className="text-left flex items-center gap-2">
          <div className="text-white font-semibold text-sm">📅 Meetings ({bookings.length})</div>
          {pending.length>0&&<span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{background:"rgba(245,158,11,0.2)",color:"#fbbf24"}}>{pending.length} new</span>}
        </div>
        <span className="text-white/40">{open?"▾":"▸"}</span>
      </button>
      {open&&(
        <div className="space-y-2 mt-3">
          {bookings.map(b=>{
            const s=new Date(b.start_time);
            const isPending=b.status==="pending";
            return (
              <div key={b.id} className="p-3 rounded-2xl" style={{background:isPending?"rgba(245,158,11,0.08)":"rgba(255,255,255,0.04)",border:isPending?"1px solid rgba(245,158,11,0.3)":`1px solid ${BORDER}`}}>
                <div className="flex items-center justify-between">
                  <div className="text-white text-sm font-semibold">{b.guest_name}</div>
                  {isPending?<span className="text-amber-400 text-xs">Awaiting your response</span>:<span className="text-emerald-400 text-xs">✓ Confirmed</span>}
                </div>
                <div className="text-purple-300 text-xs mt-0.5">{fmtDateNice(s)} · {fmtTime12(`${s.getHours()}:${String(s.getMinutes()).padStart(2,"0")}`)}</div>
                <div className="text-white/50 text-xs">{b.guest_email}</div>
                {b.guest_note&&<div className="text-white/40 text-xs mt-1 italic">"{b.guest_note}"</div>}
                {isPending?(
                  <div className="flex gap-2 mt-2">
                    <button onClick={()=>accept(b)} className="flex-1 py-2 rounded-xl text-xs font-bold text-white" style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)"}}>✓ Accept</button>
                    <button onClick={()=>decline(b)} className="flex-1 py-2 rounded-xl text-xs font-semibold text-white/60" style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`}}>Decline</button>
                  </div>
                ):(
                  <div className="flex items-center gap-3 mt-2">
                    {b.meeting_link&&<a href={b.meeting_link} target="_blank" rel="noreferrer" className="text-xs font-semibold" style={{color:"#a78bfa"}}>🎥 Join video call</a>}
                    <button onClick={()=>cancel(b)} className="text-red-400/70 text-xs">✕ Cancel</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function CardContacts({ user }) {
  const [contacts,setContacts]=useState([]);
  const [open,setOpen]=useState(false);
  useEffect(()=>{
    if(!user) return;
    supabase.from("card_contacts").select("*").eq("profile_id",user.id).order("created_at",{ascending:false})
      .then(({data})=>setContacts(data||[])).catch(()=>{});
  },[user]);
  if(contacts.length===0) return null;
  return (
    <Card className="p-4">
      <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center justify-between">
        <div className="text-left">
          <div className="text-white font-semibold text-sm">📥 Contacts from your card ({contacts.length})</div>
          <div className="text-white/40 text-xs">People who shared their details back</div>
        </div>
        <span className="text-white/40">{open?"▾":"▸"}</span>
      </button>
      {open&&(
        <div className="space-y-2 mt-3">
          {contacts.map(c=>(
            <div key={c.id} className="p-3 rounded-2xl" style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`}}>
              <div className="text-white text-sm font-semibold">{c.name}</div>
              <div className="text-white/50 text-xs">{c.email}{c.mobile?`  ·  ${c.mobile}`:""}</div>
              {c.note&&<div className="text-white/40 text-xs mt-1 italic">"{c.note}"</div>}
              <div className="text-white/25 text-[10px] mt-1">{new Date(c.created_at).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ProfileTab({ user, profile, setProfile, showToast, isApproved }) {
  const [form, setForm] = useState({name:"",bio:"",experience:"",location:"",skills:[],mobile:"",role:"",project_name:"",project_pitch:"",project_industry:"",linkedin_url:"",website_url:"",whatsapp:"",roles_needed:[],business_name:"",wechat:"",headline:"",availability:"",project_stage:"",project_website:"",team_size:"",funding_status:"",brand_color:"#7c6fe0",cover_url:"",qr_logo_url:"",links:{},businesses:[],booking_enabled:false,booking_duration:30,booking_hours:null});
  const [newSkill, setNewSkill] = useState("");
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState("identity");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [qrLogoUploading, setQrLogoUploading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanRefresh, setScanRefresh] = useState(0);
  const [autoSaved, setAutoSaved] = useState(false);
  const avatarInputRef = useRef();

  useEffect(()=>{
    if(profile) setForm({name:profile.name||"",bio:profile.bio||"",experience:profile.experience||"",location:profile.location||"",skills:profile.skills||[],mobile:profile.mobile||"",role:profile.role||"",project_name:profile.project_name||"",project_pitch:profile.project_pitch||"",project_industry:profile.project_industry||"",linkedin_url:profile.linkedin_url||"",website_url:profile.website_url||"",whatsapp:profile.whatsapp||"",roles_needed:profile.roles_needed||[],business_name:profile.business_name||"",wechat:profile.wechat||"",headline:profile.headline||"",availability:profile.availability||"",project_stage:profile.project_stage||"",project_website:profile.project_website||"",team_size:profile.team_size||"",funding_status:profile.funding_status||"",brand_color:profile.brand_color||"#7c6fe0",cover_url:profile.cover_url||"",qr_logo_url:profile.qr_logo_url||"",links:(typeof profile.links==="object"&&profile.links)||{},businesses:Array.isArray(profile.businesses)?profile.businesses:(profile.businesses?JSON.parse(profile.businesses):[]),booking_enabled:!!profile.booking_enabled,booking_duration:profile.booking_duration||30,booking_hours:profile.booking_hours||null});
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

  async function save(silent=false) {
    if(!silent) setSaving(true);
    try {
      // Validate WhatsApp — AU only (+61). On silent auto-save, skip toast but don't write a bad number.
      if(form.whatsapp && !form.whatsapp.replace(/\s/g,"").match(/^\+61[0-9]{8,9}$/)){
        if(!silent) showToast("WhatsApp must be an Australian number starting with +61","error");
        setSaving(false); return;
      }
      const toInt = (v) => { const n = parseInt(v,10); return Number.isFinite(n) ? n : null; };
      const payload = {
        name: form.name||"", bio: form.bio||"", experience: toInt(form.experience) ?? 0,
        location: form.location||"", skills: Array.isArray(form.skills)?form.skills:[],
        mobile: form.mobile||"", role: form.role||"",
        project_name: form.project_name||"", project_pitch: form.project_pitch||"", project_industry: form.project_industry||"",
        linkedin_url: form.linkedin_url||"", website_url: form.website_url||"", whatsapp: form.whatsapp||"",
        roles_needed: Array.isArray(form.roles_needed)?form.roles_needed:[],
        business_name: form.business_name||"", wechat: form.wechat||"", headline: form.headline||"", availability: form.availability||"",
        project_stage: form.project_stage||"", project_website: form.project_website||"", team_size: toInt(form.team_size),
        funding_status: form.funding_status||"", brand_color: form.brand_color||"#7c6fe0",
        cover_url: form.cover_url||"", qr_logo_url: form.qr_logo_url||"", links: form.links||{}, businesses: Array.isArray(form.businesses)?form.businesses:[],
        booking_enabled: !!form.booking_enabled, booking_duration: parseInt(form.booking_duration)||30, booking_hours: form.booking_hours||null,
        updated_at: new Date().toISOString(),
      };
      const {error}=await supabase.from("profiles").update(payload).eq("id",user.id);
      if(error) throw error;
      setProfile(p=>({...p,...form}));
      if(!silent) showToast("Profile saved ✓"); else setAutoSaved(true);
    } catch(e){ if(!silent) showToast(e.message||e.hint||e.details||"Save failed","error"); console.error("Profile save error:",e);}
    if(!silent) setSaving(false);
  }

  // Auto-save: 1.2s after the user stops editing, save silently.
  const firstRender = useRef(true);
  useEffect(()=>{
    if(!user) return;
    if(firstRender.current){ firstRender.current=false; return; } // don't save on initial load
    const t=setTimeout(()=>{ save(true); }, 1200);
    return ()=>clearTimeout(t);
  // eslint-disable-next-line
  },[form]);

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

      {/* Scan a business card */}
      {user&&(
        <button onClick={()=>setShowScanner(true)}
          className="abaa-gradient w-full py-3.5 rounded-2xl text-white font-bold flex items-center justify-center gap-2">
          📷 Scan a Business Card
        </button>
      )}
      <AnimatePresence>
        {showScanner&&(
          <CardScanner key="cardscan" user={user} profile={profile} showToast={showToast}
            onClose={()=>setShowScanner(false)}
            onSaved={()=>setScanRefresh(k=>k+1)}/>
        )}
      </AnimatePresence>
      <ScannedContacts user={user} refreshKey={scanRefresh}/>

      {/* QR preview — scan-ready from the Profile tab */}
      {user&&(
        <div className="flex flex-col items-center">
          <div className="relative rounded-2xl overflow-hidden" style={{padding:"10px",background:"#fff"}}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?card=${user.id}`)}`}
              alt="My card QR" width={170} height={170}/>
            {(form.qr_logo_url||profile?.avatar_url)&&(
              <img src={form.qr_logo_url||profile?.avatar_url} alt="" className="absolute top-1/2 left-1/2 rounded-lg"
                style={{width:"40px",height:"40px",transform:"translate(-50%,-50%)",border:"3px solid #fff",objectFit:"cover"}}/>
            )}
          </div>
          <div className="text-white/30 text-[11px] mt-2 uppercase tracking-wider">Scan to open my card</div>
        </div>
      )}

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

      {/* Card brand color picker */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-semibold text-sm">Card colour</div>
            <div className="text-white/40 text-xs">Personalise your business card's look</div>
          </div>
          <div className="flex items-center gap-2">
            {["#7c6fe0","#0a66c2","#10b981","#ef4444","#f59e0b","#ec4899","#0f172a"].map(c=>(
              <button key={c} onClick={()=>setForm(f=>({...f,brand_color:c}))}
                className="w-7 h-7 rounded-full transition-transform" style={{background:c,border:form.brand_color===c?"3px solid #fff":"2px solid rgba(255,255,255,0.2)",transform:form.brand_color===c?"scale(1.15)":"scale(1)"}}/>
            ))}
            <input type="color" value={form.brand_color} onChange={e=>setForm(f=>({...f,brand_color:e.target.value}))} className="w-7 h-7 rounded-full bg-transparent cursor-pointer" title="Custom colour"/>
          </div>
        </div>
        <p className="text-white/30 text-xs mt-2">Changes save automatically. Your QR code also shows your profile photo in the centre.</p>
      </Card>

      {/* QR logo */}
      <Card className="p-4">
        <div className="text-white font-semibold text-sm mb-1">QR code logo</div>
        <div className="text-white/40 text-xs mb-3">Shows in the centre of your QR. Defaults to your profile photo.</div>
        <div className="flex items-center gap-3">
          {(form.qr_logo_url||profile?.avatar_url)&&(
            <img src={form.qr_logo_url||profile?.avatar_url} alt="" className="w-12 h-12 rounded-xl object-cover" style={{border:`1px solid ${BORDER}`}}/>
          )}
          <label className="px-4 py-2.5 rounded-2xl text-sm font-semibold cursor-pointer text-white" style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`}}>
            {qrLogoUploading?"Uploading…":(form.qr_logo_url?"Change logo":"Upload logo")}
            <input type="file" accept="image/*" className="hidden" disabled={qrLogoUploading} onChange={async e=>{
              const file=e.target.files?.[0]; if(!file) return;
              setQrLogoUploading(true);
              try { const url=await uploadImage(file,"avatars",`qrlogo-${user.id}`); setForm(f=>({...f,qr_logo_url:url})); showToast("QR logo updated ✓"); }
              catch(err){ showToast(err.message||"Upload failed","error"); }
              setQrLogoUploading(false);
            }}/>
          </label>
          {form.qr_logo_url&&<button onClick={()=>setForm(f=>({...f,qr_logo_url:""}))} className="text-white/40 text-xs">Reset</button>}
        </div>
      </Card>

      {/* Add more links to your card */}
      <Card className="p-4">
        <div className="text-white font-semibold text-sm mb-1">More card links</div>
        <div className="text-white/40 text-xs mb-3">Tap a field to add it to your digital card.</div>
        {/* Active fields */}
        <div className="space-y-2 mb-3">
          {LINK_FIELDS.filter(f=>form.links&&form.links[f.id]!==undefined).map(f=>(
            <div key={f.id} className="flex items-center gap-2">
              <span className="w-8 text-center">{f.emoji}</span>
              <input value={form.links[f.id]||""} placeholder={f.ph}
                onChange={e=>setForm(x=>({...x,links:{...x.links,[f.id]:e.target.value}}))}
                className="flex-1 rounded-xl px-3 py-2 text-white placeholder-white/25 focus:outline-none"
                style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
              <button onClick={()=>setForm(x=>{ const l={...x.links}; delete l[f.id]; return {...x,links:l}; })}
                className="text-red-400/60 text-xs px-1">✕</button>
            </div>
          ))}
        </div>
        {/* Picker */}
        <div className="grid grid-cols-3 gap-2">
          {LINK_FIELDS.filter(f=>!form.links||form.links[f.id]===undefined).map(f=>(
            <button key={f.id} onClick={()=>setForm(x=>({...x,links:{...(x.links||{}),[f.id]:""}}))}
              className="flex flex-col items-center gap-1 py-3 rounded-2xl transition-all"
              style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`}}>
              <span className="text-lg">{f.emoji}</span>
              <span className="text-white/60 text-[10px] text-center leading-tight px-1">{f.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Cover image for the card */}
      <Card className="p-4">
        <div className="text-white font-semibold text-sm mb-1">Card cover image</div>
        <div className="text-white/40 text-xs mb-3">Shows at the top of your digital card. If none, your card colour is used.</div>
        {form.cover_url&&<img src={form.cover_url} alt="cover" className="w-full h-28 object-cover rounded-2xl mb-3" style={{border:`1px solid ${BORDER}`}}/>}
        <div className="flex gap-2">
          <label className="flex-1 text-center py-2.5 rounded-2xl text-sm font-semibold cursor-pointer text-white" style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`}}>
            {coverUploading?"Uploading…":(form.cover_url?"Change cover":"Upload cover")}
            <input type="file" accept="image/*" className="hidden" disabled={coverUploading} onChange={async e=>{
              const file=e.target.files?.[0]; if(!file) return;
              setCoverUploading(true);
              try { const url=await uploadImage(file,"avatars",`cover-${user.id}`); setForm(f=>({...f,cover_url:url})); showToast("Cover uploaded ✓"); }
              catch(err){ showToast(err.message||"Upload failed","error"); }
              setCoverUploading(false);
            }}/>
          </label>
          {form.cover_url&&<button onClick={()=>setForm(f=>({...f,cover_url:""}))} className="px-4 py-2.5 rounded-2xl text-sm text-white/50" style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`}}>Remove</button>}
        </div>
      </Card>

      {/* My Business manager */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="text-white font-semibold text-sm">My Business</div>
          <button onClick={()=>setForm(f=>({...f,businesses:[...(f.businesses||[]),{name:"",website:"",services:"",address:"",logo_url:""}]}))}
            className="text-xs font-semibold px-3 py-1.5 rounded-full text-white" style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)"}}>+ Add business</button>
        </div>
        <div className="text-white/40 text-xs mb-3">These appear in a "My Business" section on your digital card.</div>
        {(form.businesses||[]).length===0&&<div className="text-white/30 text-xs text-center py-3">No businesses added yet</div>}
        <div className="space-y-4">
          {(form.businesses||[]).map((b,i)=>(
            <div key={i} className="rounded-2xl p-3 space-y-2" style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${BORDER}`}}>
              <div className="flex items-center justify-between">
                <span className="text-white/50 text-xs font-semibold">Business {i+1}</span>
                <button onClick={()=>setForm(f=>({...f,businesses:f.businesses.filter((_,j)=>j!==i)}))} className="text-red-400/70 text-xs">✕ Remove</button>
              </div>
              <div className="flex items-center gap-3">
                {b.logo_url
                  ? <img src={b.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" style={{border:`1px solid ${BORDER}`}}/>
                  : <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white/30 text-xs" style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`}}>Logo</div>}
                <label className="text-xs font-semibold cursor-pointer text-purple-300">
                  {b.logo_url?"Change logo":"Upload logo"}
                  <input type="file" accept="image/*" className="hidden" onChange={async e=>{
                    const file=e.target.files?.[0]; if(!file) return;
                    try { const url=await uploadImage(file,"avatars",`biz-${user.id}-${i}`); setForm(f=>({...f,businesses:f.businesses.map((x,j)=>j===i?{...x,logo_url:url}:x)})); showToast("Logo uploaded ✓"); }
                    catch(err){ showToast(err.message||"Upload failed","error"); }
                  }}/>
                </label>
              </div>
              <input value={b.name} onChange={e=>setForm(f=>({...f,businesses:f.businesses.map((x,j)=>j===i?{...x,name:e.target.value}:x)}))} placeholder="Business name"
                className="w-full rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-none" style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
              <input value={b.services} onChange={e=>setForm(f=>({...f,businesses:f.businesses.map((x,j)=>j===i?{...x,services:e.target.value}:x)}))} placeholder="Services (e.g. Bookkeeping, Tax)"
                className="w-full rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-none" style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
              <input value={b.website} onChange={e=>setForm(f=>({...f,businesses:f.businesses.map((x,j)=>j===i?{...x,website:e.target.value}:x)}))} placeholder="Website"
                className="w-full rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-none" style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
              <input value={b.address} onChange={e=>setForm(f=>({...f,businesses:f.businesses.map((x,j)=>j===i?{...x,address:e.target.value}:x)}))} placeholder="Address"
                className="w-full rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-none" style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
            </div>
          ))}
        </div>
      </Card>

      {/* Booking availability (Calendly-style) */}
      <BookingSettings form={form} setForm={setForm}/>

      {/* Upcoming bookings on me */}
      <MyBookings user={user} profile={profile} showToast={showToast}/>

      {/* Contacts captured from your card */}
      <CardContacts user={user}/>

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

      <div className="space-y-2">
        <PrimaryBtn onClick={()=>save(false)} loading={saving} className="w-full">Save Profile</PrimaryBtn>
        <div className="text-center text-white/35 text-xs">{autoSaved?"✓ Changes save automatically":"Changes save automatically as you edit"}</div>
      </div>

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
// ════════════════════════════════════════════════════════
// BOOKING (Calendly-style)
// ════════════════════════════════════════════════════════
const DAY_KEYS=["sun","mon","tue","wed","thu","fri","sat"];
const DAY_LABELS={sun:"Sunday",mon:"Monday",tue:"Tuesday",wed:"Wednesday",thu:"Thursday",fri:"Friday",sat:"Saturday"};
const DEFAULT_HOURS={mon:{on:true,start:"09:00",end:"17:00"},tue:{on:true,start:"09:00",end:"17:00"},wed:{on:true,start:"09:00",end:"17:00"},thu:{on:true,start:"09:00",end:"17:00"},fri:{on:true,start:"09:00",end:"17:00"},sat:{on:false,start:"09:00",end:"17:00"},sun:{on:false,start:"09:00",end:"17:00"}};

function fmtTime12(hhmm){ const [h,m]=hhmm.split(":").map(Number); const ap=h>=12?"pm":"am"; const h12=h%12===0?12:h%12; return `${h12}:${String(m).padStart(2,"0")}${ap}`; }
function fmtDateNice(d){ return d.toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"long"}); }

// Compute free slots for a host on a given date
function computeSlots(date, hours, durationMin, taken){
  const key=DAY_KEYS[date.getDay()];
  const day=(hours||DEFAULT_HOURS)[key];
  if(!day||!day.on) return [];
  const slots=[];
  const [sh,sm]=day.start.split(":").map(Number);
  const [eh,em]=day.end.split(":").map(Number);
  const dayStart=new Date(date); dayStart.setHours(sh,sm,0,0);
  const dayEnd=new Date(date); dayEnd.setHours(eh,em,0,0);
  const now=new Date();
  for(let t=new Date(dayStart); t.getTime()+durationMin*60000<=dayEnd.getTime(); t=new Date(t.getTime()+durationMin*60000)){
    const slotEnd=new Date(t.getTime()+durationMin*60000);
    if(t<=now) continue; // no past slots
    const overlaps=(taken||[]).some(b=>{
      const bs=new Date(b.start_time).getTime(), be=new Date(b.end_time).getTime();
      return t.getTime()<be && slotEnd.getTime()>bs;
    });
    if(!overlaps) slots.push(new Date(t));
  }
  return slots;
}

function BookingModal({ host, onClose }) {
  const [step,setStep]=useState(1); // 1: date, 2: time, 3: details, 4: done
  const [selDate,setSelDate]=useState(null);
  const [selSlot,setSelSlot]=useState(null);
  const [taken,setTaken]=useState([]);
  const [guest,setGuest]=useState({name:"",email:"",note:""});
  const [saving,setSaving]=useState(false);
  const [err,setErr]=useState("");
  const duration=host.booking_duration||30;
  const hours=host.booking_hours||DEFAULT_HOURS;

  // Next 14 days that have any availability
  const days=[];
  for(let i=0;i<14;i++){
    const d=new Date(); d.setDate(d.getDate()+i); d.setHours(0,0,0,0);
    const key=DAY_KEYS[d.getDay()];
    if(hours[key]?.on) days.push(d);
  }

  useEffect(()=>{
    // Load existing bookings for the next 15 days to block taken slots
    const from=new Date(); from.setHours(0,0,0,0);
    const to=new Date(); to.setDate(to.getDate()+15);
    supabase.from("bookings").select("start_time,end_time").eq("host_id",host.id).neq("status","cancelled")
      .gte("start_time",from.toISOString()).lte("start_time",to.toISOString())
      .then(({data})=>setTaken(data||[])).catch(()=>setTaken([]));
  },[host.id]);

  const slots=selDate?computeSlots(selDate,hours,duration,taken):[];

  const [me,setMe]=useState(undefined);
  useEffect(()=>{ supabase.auth.getUser().then(({data})=>setMe(data?.user||null)); },[]);

  async function confirm(){
    setErr("");
    setSaving(true);
    try {
      // Require sign-in to finalise — captures the guest as a registered user
      const {data:{user:current}}=await supabase.auth.getUser();
      if(!current){
        // Kick off Google sign-in; after redirect they return to this card and can re-book
        await supabase.auth.signInWithOAuth({ provider:"google", options:{ redirectTo: window.location.href } });
        return;
      }
      if(current.id===host.id){ setErr("You can't book a meeting with yourself"); setSaving(false); return; }
      const end=new Date(selSlot.getTime()+duration*60000);
      // Unique Jitsi video room for this meeting
      const room=`ABAA-${host.id.slice(0,6)}-${Date.now().toString(36)}`;
      const meetingLink=`https://meet.jit.si/${room}`;
      const gName=current.user_metadata?.full_name||current.email?.split("@")[0]||"Member";
      const {error}=await supabase.from("bookings").insert({
        host_id:host.id, guest_id:current.id, guest_name:gName, guest_email:current.email, guest_note:guest.note,
        start_time:selSlot.toISOString(), end_time:end.toISOString(), status:"pending", meeting_link:meetingLink,
      });
      if(error) throw error;
      // Notify host of a booking REQUEST awaiting their acceptance
      const when=`${fmtDateNice(selSlot)} at ${fmtTime12(`${selSlot.getHours()}:${String(selSlot.getMinutes()).padStart(2,"0")}`)}`;
      if(host.email) sendEmail("booking_request", host.email, { guestName:gName, guestEmail:current.email, when, note:guest.note, duration, link:meetingLink });
      sendEmail("booking_submitted", current.email, { hostName:host.name, when, duration, link:meetingLink });
      setStep(4);
    } catch(e){ setErr(e.message||"Booking failed — please try again"); }
    setSaving(false);
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-[95] flex items-end md:items-center justify-center bg-black/85 p-0 md:p-4"
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",damping:30,stiffness:300}}
        className="w-full md:max-w-md rounded-t-3xl md:rounded-3xl flex flex-col" style={{background:"#0f1320",border:`1px solid ${BORDER}`,maxHeight:"88vh"}}>
        {/* Header */}
        <div className="p-5 pb-4 flex items-center gap-3" style={{borderBottom:`1px solid ${BORDER}`}}>
          <Av name={host.name} url={host.avatar_url} color={pal(host.id)} size="md" ring/>
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold truncate">Book with {host.name}</div>
            <div className="text-white/45 text-xs">{duration} min meeting · Times in AET</div>
          </div>
          <button onClick={onClose} className="text-white/40 text-xl px-2">✕</button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {step===1&&(
            <div className="space-y-2">
              <div className="text-white/50 text-xs uppercase tracking-wider mb-3">Select a day</div>
              {days.length===0&&<div className="text-white/40 text-sm text-center py-6">No availability set</div>}
              {days.map(d=>(
                <button key={d.toISOString()} onClick={()=>{setSelDate(d);setStep(2);}}
                  className="w-full text-left px-4 py-3.5 rounded-2xl text-white text-sm font-medium transition-colors hover:bg-white/10"
                  style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`}}>
                  {fmtDateNice(d)}
                </button>
              ))}
            </div>
          )}

          {step===2&&(
            <div>
              <button onClick={()=>setStep(1)} className="text-purple-300 text-xs mb-3">← {fmtDateNice(selDate)}</button>
              <div className="text-white/50 text-xs uppercase tracking-wider mb-3">Select a time</div>
              {slots.length===0&&<div className="text-white/40 text-sm text-center py-6">No free times this day — try another day</div>}
              <div className="grid grid-cols-3 gap-2">
                {slots.map(s=>(
                  <button key={s.toISOString()} onClick={()=>{setSelSlot(s);setStep(3);}}
                    className="py-2.5 rounded-xl text-sm font-semibold text-white transition-colors hover:bg-white/15"
                    style={{background:"rgba(124,111,224,0.15)",border:"1px solid rgba(124,111,224,0.4)"}}>
                    {fmtTime12(`${s.getHours()}:${String(s.getMinutes()).padStart(2,"0")}`)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step===3&&(
            <div className="space-y-3">
              <button onClick={()=>setStep(2)} className="text-purple-300 text-xs">← Back</button>
              <div className="p-3 rounded-2xl text-sm text-white/80" style={{background:"rgba(124,111,224,0.12)",border:"1px solid rgba(124,111,224,0.3)"}}>
                📅 {fmtDateNice(selSlot)} · {fmtTime12(`${selSlot.getHours()}:${String(selSlot.getMinutes()).padStart(2,"0")}`)} ({duration} min)
              </div>
              {me===null?(
                <div className="text-center py-2">
                  <div className="text-white/70 text-sm mb-1">One quick step to book</div>
                  <div className="text-white/40 text-xs mb-4">Sign in so {host.name} can confirm your meeting and send you the video link.</div>
                  <textarea value={guest.note} onChange={e=>setGuest(g=>({...g,note:e.target.value}))} placeholder="What would you like to discuss? (optional)" rows={2}
                    className="w-full rounded-2xl px-4 py-3 text-white placeholder-white/30 focus:outline-none resize-none mb-3" style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
                  {err&&<div className="text-red-400 text-xs mb-2">{err}</div>}
                  <button onClick={confirm} disabled={saving}
                    className="w-full py-3.5 rounded-2xl text-white font-bold flex items-center justify-center gap-2" style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",opacity:saving?0.6:1}}>
                    <span style={{background:"#fff",borderRadius:"3px",padding:"2px 5px",color:"#444",fontSize:"12px",fontWeight:"bold"}}>G</span>
                    {saving?"…":"Sign in with Google to book"}
                  </button>
                </div>
              ):(
                <>
                  <textarea value={guest.note} onChange={e=>setGuest(g=>({...g,note:e.target.value}))} placeholder="What would you like to discuss? (optional)" rows={3}
                    className="w-full rounded-2xl px-4 py-3 text-white placeholder-white/30 focus:outline-none resize-none" style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
                  {err&&<div className="text-red-400 text-xs">{err}</div>}
                  <button onClick={confirm} disabled={saving}
                    className="w-full py-3.5 rounded-2xl text-white font-bold" style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",opacity:saving?0.6:1}}>
                    {saving?"Sending request…":"Request this meeting"}
                  </button>
                </>
              )}
            </div>
          )}

          {step===4&&(
            <div className="text-center py-8">
              <div className="text-5xl mb-4">📨</div>
              <div className="text-white font-bold text-xl mb-2">Request sent!</div>
              <div className="text-white/60 text-sm mb-1">{fmtDateNice(selSlot)} · {fmtTime12(`${selSlot.getHours()}:${String(selSlot.getMinutes()).padStart(2,"0")}`)}</div>
              <div className="text-white/40 text-xs mb-6">{host.name} will confirm your meeting. You'll get an email with the video call link once it's accepted.</div>
              <button onClick={onClose} className="px-8 py-3 rounded-2xl text-white font-semibold" style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)"}}>Done</button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function BusinessCardPage({ userId }) {
  const [p, setP] = useState(undefined);
  const [copied, setCopied] = useState(false);
  const [views, setViews] = useState(null);
  const [showExchange, setShowExchange] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [exchange, setExchange] = useState({name:"",email:"",mobile:"",note:""});
  const [exchangeSent, setExchangeSent] = useState(false);
  const cardUrl = `${window.location.origin}${window.location.pathname}?card=${userId}`;
  // brand color (falls back to purple). QR uses the brand color + optional center logo.
  const brand = (p?.brand_color||"#7c6fe0").replace("#","");
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(cardUrl)}`;

  useEffect(()=>{
    supabase.from("profiles").select("*").eq("id",userId).single()
      .then(({data})=>setP(data||null)).catch(()=>setP(null));
    // Record a view (best-effort; ignores errors) and fetch the running total
    (async()=>{
      try {
        await supabase.from("card_views").insert({ profile_id: userId });
        const { count } = await supabase.from("card_views").select("*", { count:"exact", head:true }).eq("profile_id", userId);
        setViews(count);
      } catch(e){}
    })();
  },[userId]);

  async function submitExchange(){
    if(!exchange.name.trim()||(!exchange.email.trim()&&!exchange.mobile.trim())){ return; }
    try {
      await supabase.from("card_contacts").insert({
        profile_id: userId, name: exchange.name, email: exchange.email, mobile: exchange.mobile, note: exchange.note,
      });
      // Email the card owner that someone shared their details back
      if(p?.email) sendEmail("new_message", p.email, { fromName: `${exchange.name} (via your card)` });
      setExchangeSent(true);
    } catch(e){ setExchangeSent(true); } // still thank them even if storage hiccups
  }

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
    // Businesses
    let bizArr=[]; try { bizArr = Array.isArray(p.businesses)?p.businesses:(p.businesses?JSON.parse(p.businesses):[]); } catch(e){}
    if(bizArr.length){
      const b0=bizArr[0];
      if(b0?.name && !p.business_name) lines.push(`ORG:${b0.name}`);
      if(b0?.website) lines.push(`URL;TYPE=Business:${b0.website}`);
      if(b0?.address) lines.push(`ADR;TYPE=WORK:;;${b0.address};;;;`);
    }
    // Profile photo embedded so it saves into the phone contact
    if(p.avatar_url) lines.push(`PHOTO;VALUE=URI:${p.avatar_url}`);
    // Everything else into NOTE so nothing is lost
    const notes=[];
    if(p.headline) notes.push(p.headline);
    if(p.bio) notes.push(p.bio);
    if(p.wechat) notes.push(`WeChat: ${p.wechat}`);
    if((p.skills||[]).length) notes.push(`Skills: ${(p.skills||[]).join(", ")}`);
    if(bizArr.length>1) notes.push(`Also: ${bizArr.slice(1).map(b=>b.name).filter(Boolean).join(", ")}`);
    bizArr.forEach(b=>{ if(b?.services) notes.push(`${b.name||"Business"}: ${b.services}`); });
    notes.push(`ABAA profile: ${window.location.origin}?card=${p.id}`);
    if(notes.length) lines.push(`NOTE:${notes.join("\\n").replace(/\r?\n/g,"\\n")}`);
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
  const brandHex = p.brand_color || "#7c6fe0";
  const brandGrad = `linear-gradient(135deg, ${brandHex}, ${brandHex}aa)`;
  // Tint the whole page background subtly with the chosen brand colour
  const pageBg = `radial-gradient(circle at 50% 0%, ${brandHex}33, ${BG} 60%)`;
  let businesses=[]; try { businesses = Array.isArray(p.businesses)?p.businesses:(p.businesses?JSON.parse(p.businesses):[]); } catch(e){ businesses=[]; }
  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8" style={{background:pageBg}}>
      <div className="w-full max-w-md relative">
        {/* Card */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="rounded-3xl overflow-hidden" style={{background:"#0f1320",border:`1px solid ${BORDER}`,boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}}>
          {/* QR first — scan-ready before any details */}
          <div className="flex flex-col items-center pt-6 pb-4 px-6">
            <div className="relative rounded-2xl overflow-hidden" style={{padding:"10px",background:"#fff"}}>
              <img src={qrUrl} alt="QR code" width={190} height={190}/>
              {(p.qr_logo_url||p.avatar_url)&&(
                <img src={p.qr_logo_url||p.avatar_url} alt="" className="absolute top-1/2 left-1/2 rounded-lg"
                  style={{width:"44px",height:"44px",transform:"translate(-50%,-50%)",border:"3px solid #fff",objectFit:"cover"}}/>
              )}
            </div>
            <div className="text-white/30 text-[11px] mt-2 uppercase tracking-wider">Scan to open this card</div>
          </div>

          {/* Cover image (or brand colour) — Blinq style */}
          <div className="relative" style={{height:"140px",background: p.cover_url?`#0f1320`:brandGrad}}>
            {p.cover_url&&<img src={p.cover_url} alt="" className="w-full h-full object-cover"/>}
          </div>
          {/* Avatar overlapping the cover */}
          <div className="px-6 -mt-12 relative">
            <Av name={p.name} url={p.avatar_url} color={color} size="2xl" ring/>
          </div>
          {/* Identity */}
          <div className="px-6 pt-3 pb-1">
            <div className="text-white font-bold text-2xl flex items-center gap-2">{p.name}<VerifiedBadge verified={p.verified} size="lg"/></div>
            {p.role&&<div className="text-white/60 text-sm mt-1">{p.role}</div>}
            {p.location&&<div className="text-white/40 text-xs mt-2">📍 {p.location}</div>}
            {p.headline&&<div className="text-white/55 text-sm mt-3 italic">"{p.headline}"</div>}
          </div>

          <div className="p-6 space-y-5">
            {p.bio&&<p className="text-white/65 text-sm leading-relaxed">{p.bio}</p>}

            {/* Quick facts */}
            {(p.experience>0||p.availability)&&(
              <div className="flex flex-wrap gap-2">
                {p.experience>0&&<span className="px-3 py-1.5 rounded-full text-xs font-medium" style={{background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.7)",border:`1px solid ${BORDER}`}}>💼 {p.experience} yrs experience</span>}
                {p.availability&&<span className="px-3 py-1.5 rounded-full text-xs font-medium" style={{background:`${brandHex}22`,color:brandHex,border:`1px solid ${brandHex}44`}}>🟢 {p.availability}</span>}
              </div>
            )}

            {/* Skills */}
            {p.skills?.length>0&&(
              <div className="flex flex-wrap gap-2">{p.skills.map(s=><SkillChip key={s} label={s}/>)}</div>
            )}

            {/* My Business section(s) */}
            {businesses.length>0&&(
              <div className="space-y-3">
                <div className="text-white/40 text-xs uppercase tracking-wider font-semibold">My Business</div>
                {businesses.map((b,i)=>(
                  <div key={i} className="rounded-2xl p-4" style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${BORDER}`}}>
                    <div className="flex items-center gap-3">
                      {b.logo_url
                        ? <img src={b.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" style={{border:`1px solid ${BORDER}`}}/>
                        : <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold" style={{background:brandGrad}}>{(b.name||"B")[0]}</div>}
                      <div className="min-w-0">
                        <div className="text-white font-semibold text-sm truncate">{b.name}</div>
                        {b.services&&<div className="text-white/50 text-xs">{b.services}</div>}
                      </div>
                    </div>
                    {b.address&&<div className="text-white/40 text-xs mt-2">📍 {b.address}</div>}
                    {b.website&&<a href={b.website.startsWith("http")?b.website:`https://${b.website}`} target="_blank" rel="noreferrer" className="inline-block text-xs mt-2 font-medium" style={{color:brandHex}}>🌐 {b.website.replace(/^https?:\/\//,"")}</a>}
                  </div>
                ))}
              </div>
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
            {p.booking_enabled&&(
              <button onClick={()=>setShowBooking(true)} className="w-full py-3 rounded-2xl text-white font-bold" style={{background:brandGrad,boxShadow:`0 8px 24px ${brandHex}55`}}>📅 Book a meeting</button>
            )}
            <button onClick={saveContact} className="w-full py-3 rounded-2xl text-white font-semibold" style={{background:p.booking_enabled?"rgba(255,255,255,0.08)":brandGrad,border:p.booking_enabled?`1px solid ${BORDER}`:"none"}}>💾 Save to Contacts</button>

            {/* Connect on ABAA — view full profile & connect */}
            <a href={`${window.location.origin}?connect=${p.id}`}
              className="block w-full text-center py-3 rounded-2xl text-white font-bold"
              style={{background:brandGrad,boxShadow:`0 8px 24px ${brandHex}55`}}>
              🤝 Connect with {(p.name||"them").split(" ")[0]} on ABAA
            </a>

            {/* Extra links the user added */}
            {(()=>{
              const L=(p.links&&typeof p.links==="object")?p.links:{};
              const entries=LINK_FIELDS.filter(f=>L[f.id]&&String(L[f.id]).trim());
              if(entries.length===0) return null;
              return (
                <div className="space-y-2">
                  {entries.map(f=>(
                    <a key={f.id} href={linkHref(f.id,L[f.id])} target="_blank" rel="noreferrer"
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-white/80"
                      style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`}}>
                      <span>{f.emoji}</span><span className="truncate">{f.label}</span>
                    </a>
                  ))}
                </div>
              );
            })()}

            {/* Two-way: share details back */}
            <button onClick={()=>setShowExchange(true)} className="w-full py-3 rounded-2xl text-sm font-semibold" style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,color:"white"}}>
              🔄 Share your details back
            </button>

            {/* QR + share */}
            <div className="pt-4 flex flex-col items-center gap-3" style={{borderTop:`1px solid ${BORDER}`}}>
              <button onClick={share} className="w-full py-3 rounded-2xl text-sm font-semibold" style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,color:"white"}}>
                {copied?"✓ Link copied!":"🔗 Share this card"}
              </button>
              <div className="w-full">
                <button disabled className="w-full py-3 rounded-2xl text-sm font-semibold cursor-not-allowed" style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${BORDER}`,color:"rgba(255,255,255,0.35)"}}>
                  🎟️ Add to Apple / Google Wallet
                </button>
                <div className="text-center text-white/30 text-xs mt-1.5">Wallet feature coming soon</div>
              </div>
              {views!=null&&views>0&&<div className="text-white/30 text-xs">👁 Viewed {views} time{views===1?"":"s"}</div>}
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

      {/* Contact exchange modal */}
      <AnimatePresence>{showBooking&&<BookingModal key="booking" host={p} onClose={()=>setShowBooking(false)}/>}</AnimatePresence>
      <AnimatePresence>{showExchange&&(
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          className="fixed inset-0 z-[90] flex items-end md:items-center justify-center bg-black/80 p-0 md:p-4"
          onClick={e=>e.target===e.currentTarget&&setShowExchange(false)}>
          <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",damping:30,stiffness:300}}
            className="w-full md:max-w-sm rounded-t-3xl md:rounded-3xl p-6" style={{background:"#0f1320",border:`1px solid ${BORDER}`}}>
            {exchangeSent?(
              <div className="text-center py-6">
                <div className="text-4xl mb-3">✅</div>
                <div className="text-white font-bold text-lg mb-2">Details sent to {p.name}!</div>
                <div className="text-white/50 text-sm mb-6">They'll be in touch. Want your own digital card too?</div>
                <a href={window.location.origin} className="inline-block px-6 py-3 rounded-2xl text-white font-bold" style={{background:brandGrad}}>✨ Create Your Own — Free</a>
              </div>
            ):(
              <>
                <div className="text-white font-bold text-lg mb-1">Share your details with {p.name}</div>
                <div className="text-white/45 text-sm mb-4">They'll receive your contact info so they can connect back.</div>
                <div className="space-y-3">
                  <input value={exchange.name} onChange={e=>setExchange(x=>({...x,name:e.target.value}))} placeholder="Your name *"
                    className="w-full rounded-2xl px-4 py-3 text-white placeholder-white/30 focus:outline-none" style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
                  <input value={exchange.email} onChange={e=>setExchange(x=>({...x,email:e.target.value}))} placeholder="Email" type="email"
                    className="w-full rounded-2xl px-4 py-3 text-white placeholder-white/30 focus:outline-none" style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
                  <input value={exchange.mobile} onChange={e=>setExchange(x=>({...x,mobile:e.target.value}))} placeholder="Mobile"
                    className="w-full rounded-2xl px-4 py-3 text-white placeholder-white/30 focus:outline-none" style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
                  <textarea value={exchange.note} onChange={e=>setExchange(x=>({...x,note:e.target.value}))} placeholder="Note (optional) — where you met, etc." rows={2}
                    className="w-full rounded-2xl px-4 py-3 text-white placeholder-white/30 focus:outline-none resize-none" style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,fontSize:"16px"}}/>
                </div>
                <div className="text-white/30 text-xs mt-2 mb-4">* Name plus an email or mobile required</div>
                <button onClick={submitExchange} className="w-full py-3 rounded-2xl text-white font-bold mb-2" style={{background:brandGrad}}>Send my details</button>
                <button onClick={()=>setShowExchange(false)} className="w-full py-2 text-white/40 text-sm">Cancel</button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
    </div>
  );
}

// ═══ PUBLIC EVENT PAGE (Luma-style, no login needed) ═══
function PublicEventPage({ eventId }){
  const [ev,setEv]=useState(undefined);
  const [guests,setGuests]=useState([]);
  const [host,setHost]=useState(null);
  const [copied,setCopied]=useState(false);

  useEffect(()=>{
    (async()=>{
      try {
        const {data}=await supabase.from("events").select("*").eq("id",eventId).maybeSingle();
        if(!data){ setEv(null); return; }
        setEv(data);
        if(data.creator_id){
          const {data:h}=await supabase.from("profiles").select("id,name,avatar_url,role").eq("id",data.creator_id).maybeSingle();
          setHost(h||null);
        }
        if(data.guest_list_public!==false){
          const {data:atts}=await supabase.from("event_attendees")
            .select("status, profile:profiles(id,name,avatar_url)").eq("event_id",eventId).eq("status","approved");
          setGuests((atts||[]).map(a=>a.profile).filter(Boolean));
        }
      } catch(e){ setEv(null); }
    })();
  },[eventId]);

  if(ev===undefined) return <div className="min-h-screen flex items-center justify-center" style={{background:BG}}><div className="text-white/40 text-sm">Loading event…</div></div>;
  if(ev===null) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{background:BG}}>
      <div className="text-5xl mb-4">🔍</div>
      <div className="text-white font-bold text-xl mb-2">Event not found</div>
      <div className="text-white/40 text-sm mb-6">This event may have been removed or the link is incorrect.</div>
      <a href={window.location.origin} className="px-6 py-3 rounded-2xl text-white font-semibold" style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)"}}>Explore ABAA Events</a>
    </div>
  );

  const g = themeGrad(ev.cover_url) || (!ev.cover_url ? autoGrad(ev.id||ev.title) : null);
  const d = new Date(ev.event_date);
  const past = d < new Date();

  return (
    <div className="min-h-screen px-4 py-8 flex flex-col items-center" style={{background:`radial-gradient(circle at 50% 0%, rgba(124,111,224,0.18), ${BG} 60%)`}}>
      <div className="w-full max-w-md">
        <div className="rounded-3xl overflow-hidden" style={{background:"#0f1320",border:`1px solid ${BORDER}`,boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}}>
          {/* Cover */}
          <div className="relative w-full" style={{aspectRatio:"16/9",background:g||"transparent"}}>
            {g ? (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                <div>
                  <div className="text-white font-bold leading-tight" style={{fontSize:"clamp(18px,5.5vw,28px)",textShadow:"0 2px 14px rgba(0,0,0,0.35)"}}>{ev.title}</div>
                  <div className="text-white/85 text-sm mt-2">{d.toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"long"})}</div>
                </div>
              </div>
            ) : <img src={ev.cover_url} alt={ev.title} className="w-full h-full object-cover"/>}
          </div>

          <div className="p-6 space-y-5">
            <div>
              <h1 className="text-white font-bold text-2xl leading-tight">{ev.title}</h1>
              {past&&<span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold" style={{background:"rgba(239,68,68,0.15)",color:"#f87171"}}>● Event Ended</span>}
            </div>

            {/* When & where */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-lg">📅</span>
                <div>
                  <div className="text-white/40 text-xs">When</div>
                  <div className="text-white text-sm font-medium">{d.toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
                  <div className="text-white/60 text-sm">{d.toLocaleTimeString("en-AU",{hour:"numeric",minute:"2-digit"})}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">📍</span>
                <div>
                  <div className="text-white/40 text-xs">Where</div>
                  <div className="text-white text-sm font-medium">{ev.hide_location?"Revealed after your registration is approved":(ev.location||"TBA")}</div>
                </div>
              </div>
              {host&&(
                <div className="flex items-center gap-3">
                  <Av name={host.name} url={host.avatar_url} color={pal(host.id)} size="sm" ring/>
                  <div>
                    <div className="text-white/40 text-xs">Hosted by</div>
                    <div className="text-white text-sm font-medium">{host.name}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            {(ev.industry_tags||[]).length>0&&(
              <div className="flex flex-wrap gap-2">{ev.industry_tags.map(t=><SkillChip key={t} label={t}/>)}</div>
            )}

            {/* Description */}
            {ev.description&&(
              <div>
                <div className="text-white/35 text-xs font-semibold uppercase tracking-wider mb-2">About this event</div>
                <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{ev.description}</p>
              </div>
            )}

            {/* Guests */}
            {guests.length>0&&(
              <div>
                <div className="text-white/35 text-xs font-semibold uppercase tracking-wider mb-2">{guests.length} going</div>
                <div className="flex items-center">
                  {guests.slice(0,8).map((gu,i)=>(
                    <div key={gu.id||i} style={{marginLeft:i===0?0:"-8px",zIndex:8-i}}>
                      <Av name={gu.name} url={gu.avatar_url} color={pal(gu.id||gu.name)} size="xs" ring/>
                    </div>
                  ))}
                  {guests.length>8&&<span className="text-white/40 text-xs ml-2">+{guests.length-8} more</span>}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-2" style={{borderTop:`1px solid ${BORDER}`}}>
              <button onClick={()=>downloadEventICS(ev)} className="w-full py-3 rounded-2xl text-white text-sm font-semibold" style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`}}>
                📅 Add to Calendar
              </button>
              <button onClick={async()=>{
                try {
                  if(navigator.share) await navigator.share({title:ev.title,url:window.location.href});
                  else { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(()=>setCopied(false),2000); }
                } catch(e){}
              }} className="w-full py-3 rounded-2xl text-white text-sm font-semibold" style={{background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`}}>
                {copied?"✓ Link copied!":"🔗 Share Event"}
              </button>
              {!past&&(
                <a href={window.location.origin} className="block w-full text-center py-3.5 rounded-2xl text-white font-bold" style={{background:"linear-gradient(135deg,#7c6fe0,#a78bfa)",boxShadow:"0 8px 24px rgba(124,111,224,0.4)"}}>
                  ✨ Sign in to Register
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Community CTA */}
        <div className="text-center mt-6 pb-4">
          <div className="text-white/50 text-sm">Discover more founder events</div>
          <a href={window.location.origin} className="text-purple-300 text-sm font-semibold">ABAA Community →</a>
        </div>
      </div>
    </div>
  );
}

// ═══ UNSUBSCRIBE (card exchange invites) ═══
function UnsubscribePage({ email }){
  const [state,setState]=useState("working"); // working | done | error
  useEffect(()=>{
    (async()=>{
      try{
        await supabase.from("email_optouts").insert({ email: String(email).toLowerCase() });
        setState("done");
      }catch(e){
        // Already opted out is still success from the person's point of view
        setState(String(e?.message||"").includes("duplicate") ? "done" : "error");
      }
    })();
  },[email]);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{background:BG}}>
      <div className="text-5xl mb-4">{state==="done"?"✅":state==="error"?"⚠️":"⏳"}</div>
      <div className="text-white font-bold text-xl mb-2">
        {state==="done"?"You've been unsubscribed":state==="error"?"Something went wrong":"Processing…"}
      </div>
      <div className="text-white/45 text-sm mb-6 max-w-sm">
        {state==="done"
          ? <>We won't email <strong className="text-white/70">{email}</strong> again from ABAA Community.</>
          : state==="error" ? "Please try the link again, or reply to the email and we'll remove you manually."
          : "One moment."}
      </div>
      <a href={window.location.origin} className="text-purple-300 text-sm font-semibold">Visit ABAA Community →</a>
    </div>
  );
}

export default function App() {
  // ── Public Digital Business Card route — no login required ──
  const cardId = new URLSearchParams(window.location.search).get("card");
  if(cardId) return <BusinessCardPage userId={cardId}/>;

  // ── Connect deep-link from a scanned card: open Match tab ──
  try {
    const cId = new URLSearchParams(window.location.search).get("connect");
    if(cId && !window.__abaaConnectHandled){ window.__abaaConnectHandled = cId; }
  } catch(e){}

  // ── Unsubscribe route ──
  const unsubEmail = (()=>{ try { return new URLSearchParams(window.location.search).get("unsub"); } catch(e){ return null; } })();
  if(unsubEmail) return <UnsubscribePage email={unsubEmail}/>;

  // ── Public Event page — no login required ──
  const publicEventId = new URLSearchParams(window.location.search).get("event");
  if(publicEventId) return <PublicEventPage eventId={publicEventId}/>;

  const [session,setSession]=useState(undefined);
  const [profile,setProfile]=useState(null);
  const connectId = (()=>{ try { return new URLSearchParams(window.location.search).get("connect"); } catch(e){ return null; } })();
  // Remember who referred this visitor so it survives the Google sign-in redirect
  useEffect(()=>{ try { const r=new URLSearchParams(window.location.search).get("ref"); if(r) localStorage.setItem("abaa_ref",r); } catch(e){} },[]);
  const [tab,setTab]=useState(()=>{
    // Deep-link from booking emails: ?bookings=1 opens the Profile tab (where bookings live)
    try {
      const sp=new URLSearchParams(window.location.search);
      if(sp.get("bookings")) return "profile";
      if(sp.get("connect")) return "matching";
    } catch(e){}
    return "events";
  });
  const [notif,setNotif]=useState({partner:0,project:0,events:0,messages:0,bookings:0});
  const [showNotifs,setShowNotifs]=useState(false);
  const [showSearch,setShowSearch]=useState(false);
  const [checklistDismissed,setChecklistDismissed]=useState(false);
  const processedUserRef = useRef(null);
  const [toast,setToast]=useState(null);
  const [showOnboard,setShowOnboard]=useState(false);
  const [showLogin,setShowLogin]=useState(false);
  const [viewAs,setViewAs]=useState(null); // admin "view as user" mode — holds the impersonated profile

  const showToast=useCallback((msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),3200); },[]);

  // ── Global modal detection: hide the bottom nav while any overlay is open, so
  //    it can never cover a modal's buttons. Works for every modal automatically.
  const [modalOpen,setModalOpen]=useState(false);
  useEffect(()=>{
    const check=()=>{
      // A real modal is a fixed, full-screen, INTERACTIVE overlay stacked above the nav.
      // Background decoration (BgGlow) is fixed+inset-0 too, so we must exclude
      // pointer-events:none layers and anything below the nav's z-index.
      const overlays=document.querySelectorAll('div.fixed.inset-0');
      let found=false;
      overlays.forEach(el=>{
        const cs=window.getComputedStyle(el);
        if(cs.display==="none"||cs.visibility==="hidden") return;
        if(parseFloat(cs.opacity||"1")<=0.01) return;
        if(cs.pointerEvents==="none") return;              // decorative layers
        const z=parseInt(cs.zIndex,10);
        if(!Number.isFinite(z)||z<50) return;              // must sit above the nav
        if(el.offsetHeight<200) return;                    // ignore tiny click-catchers
        found=true;
      });
      setModalOpen(found);
    };
    check();
    const obs=new MutationObserver(check);
    obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class","style"]});
    return ()=>obs.disconnect();
  },[]);

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
        // Incoming partner requests awaiting MY response (not ones I sent to myself)
        const {data:pr}=await supabase.from("match_requests").select("id,from_user_id").eq("to_user_id",uid).eq("status","pending");
        const partnerCount=(pr||[]).filter(r=>r.from_user_id!==uid).length;
        // Join requests on MY projects, from someone other than me
        const {data:jr}=await supabase.from("project_requests").select("id,from_user_id").eq("owner_id",uid).eq("status","pending");
        const projectCount=(jr||[]).filter(r=>r.from_user_id!==uid).length;
        // Pending event registrations on events I host, from someone other than me
        const {data:myEv}=await supabase.from("events").select("id").eq("creator_id",uid);
        let evCount=0;
        if(myEv&&myEv.length){
          const {data:pend}=await supabase.from("event_attendees").select("event_id,user_id").in("event_id",myEv.map(e=>e.id)).eq("status","pending");
          evCount=(pend||[]).filter(a=>a.user_id!==uid).length;
        }
        const matchIds=await myMatchIds();
        let unreadCount=0;
        if(matchIds.length){
          const {data:unread}=await supabase.from("messages").select("id").neq("sender_id",uid).is("read_at",null).in("match_id",matchIds);
          unreadCount=(unread||[]).length;
        }
        const {data:bk}=await supabase.from("bookings").select("id").eq("host_id",uid).eq("status","pending");
        if(!cancelled) setNotif({partner:partnerCount, project:projectCount, events:evCount, messages:unreadCount, bookings:(bk||[]).length});
      } catch(e){}
    }
    loadNotif();
    const iv=setInterval(loadNotif,8000);
    return ()=>{ cancelled=true; clearInterval(iv); };
  },[session]);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{ setSession(session); if(session) loadProfile(session.user); });
    const{data:{subscription}}=supabase.auth.onAuthStateChange((event,s)=>{
      setSession(s);
      if(s){
        // Only treat SIGNED_IN / INITIAL_SESSION as a real login; ignore TOKEN_REFRESHED etc.
        const isFreshLogin = event==="SIGNED_IN" || event==="INITIAL_SESSION";
        loadProfile(s.user, isFreshLogin);
      } else { setProfile(null); processedUserRef.current=null; }
    });
    return()=>subscription.unsubscribe();
  },[]);

  async function loadProfile(u, isFreshLogin=false) {
    // Guard: only run the full load + email logic once per user per page session
    const alreadyProcessed = processedUserRef.current===u.id;
    let{data}=await supabase.from("profiles").select("*").eq("id",u.id).maybeSingle();
    let isNew=false;
    if(!data){
      isNew=true;
      let refBy=null;
      try { const r=new URLSearchParams(window.location.search).get("ref")||localStorage.getItem("abaa_ref"); if(r&&r!==u.id) refBy=r; } catch(e){}
      const{data:created}=await supabase.from("profiles").upsert({id:u.id,email:u.email,name:u.user_metadata?.full_name||u.email?.split("@")[0],avatar_url:u.user_metadata?.avatar_url,is_admin:u.email===ADMIN_EMAIL,is_approved:u.email===ADMIN_EMAIL,referred_by:refBy}).select().single();
      data=created;
    }
    // Welcome email — only once ever (welcomed flag), and only when not already processed this session
    if(data && !data.welcomed && !alreadyProcessed){
      // Mark welcomed FIRST to prevent any race / repeat, then send
      await supabase.from("profiles").update({welcomed:true}).eq("id",u.id);
      data={...data,welcomed:true};
      sendEmail("welcome", u.email, { name: data?.name });
    }
    processedUserRef.current=u.id;
    if(u.email===ADMIN_EMAIL&&!data?.is_admin){ await supabase.from("profiles").update({is_admin:true,is_approved:true}).eq("id",u.id); data={...data,is_admin:true,is_approved:true}; }
    setProfile(data);
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
    if(id==="matching") return notif.partner;
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
          <button onClick={()=>setShowSearch(true)} className="ml-3 w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`}} title="Search everything">
            <span className="text-sm">🔍</span>
          </button>
          {user&&(
            <button onClick={()=>setShowNotifs(true)} className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
              style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${BORDER}`}}>
              <span className="text-sm">🔔</span>
              {(notif.partner+notif.project+notif.events+notif.messages+notif.bookings)>0&&(
                <span className="abaa-pulse absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{background:"#ef4444"}}>
                  {Math.min(9,notif.partner+notif.project+notif.events+notif.messages+notif.bookings)}{(notif.partner+notif.project+notif.events+notif.messages+notif.bookings)>9?"+":""}
                </span>
              )}
            </button>
          )}
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
          ):tab==="matching"?<MatchTab key="m" user={user} profile={effectiveProfile} isApproved={isApproved} showToast={showToast} requireAuth={requireAuth} isAdmin={isAdmin} isViewAs={!!viewAs} connectId={connectId} onGoTab={setTab}/>
          :tab==="events"?<EventsTab key="e" user={user} profile={effectiveProfile} isApproved={isApproved} showToast={showToast} requireAuth={requireAuth} isAdmin={isAdmin} isViewAs={!!viewAs}/>
          :tab==="projects"?<ProjectsTab key="pr" user={user} profile={effectiveProfile} isApproved={isApproved} showToast={showToast} requireAuth={requireAuth} isAdmin={isAdmin} isViewAs={!!viewAs}/>
          :tab==="profile"?<ProfileTab key="p" user={user} profile={effectiveProfile} setProfile={setEffectiveProfile} showToast={showToast} isApproved={isApproved}/>
          :tab==="manage"&&realIsAdmin&&!viewAs?<ManageTab key="a" showToast={showToast} onViewAs={(u)=>{setViewAs(u);setTab("profile");showToast(`Now viewing as ${u.name||u.email}`);}}/>
          :null}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav — matching reference image */}
      <OfflineBanner/>
      <AnimatePresence>
        {showSearch&&<GlobalSearch key="gsearch" user={user} onClose={()=>setShowSearch(false)}
          onOpenProfile={(p)=>{ setTab("matching"); }} onGoTab={(t)=>setTab(t)}/>}
      </AnimatePresence>
      <AnimatePresence>
        {showNotifs&&<NotificationCenter key="notifs" user={user} notif={notif}
          onClose={()=>setShowNotifs(false)} onGo={(t)=>setTab(t)}/>}
      </AnimatePresence>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30"
        style={{background:"rgba(10,14,26,0.95)",backdropFilter:"blur(20px)",borderTop:`1px solid ${BORDER}`,
                transform:modalOpen?"translateY(110%)":"translateY(0)",
                opacity:modalOpen?0:1,
                pointerEvents:modalOpen?"none":"auto",
                transition:"transform .25s cubic-bezier(.2,.8,.2,1), opacity .2s ease"}}>
        <div className="flex items-center justify-around px-2 py-3">
          {NAV.map(n=>{
            const active=tab===n.id;
            const badge=badgeFor(n.id);
            return (
              <button key={n.id} onClick={()=>goTab(n.id,n.auth)}
                className="flex flex-col items-center gap-1 px-4 py-1 rounded-2xl transition-all min-w-[56px] relative">
                <motion.span className="relative" animate={{scale:active?1.15:1,y:active?-1:0}} transition={{type:"spring",stiffness:400,damping:20}} style={{color:active?"#a78bfa":"rgba(255,255,255,0.35)",display:"inline-block"}}>
                  {n.icon(active)}
                  {badge>0&&<span className="abaa-pulse absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{background:"#ef4444"}}>{badge>9?"9+":badge}</span>}
                </motion.span>
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
