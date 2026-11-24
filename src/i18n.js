// ═══════════════════════════════════════════════════════════════
// ABAA Community — English / 繁體中文 switch
//
// How it works: the app is written in English. When Chinese is chosen,
// a lightweight translator swaps known interface phrases on screen for
// their Traditional Chinese versions (Hong Kong usage). Only exact,
// whole interface phrases are swapped, so member-written content —
// names, bios, posts, event titles — is left exactly as typed.
// The choice is remembered on the device.
// ═══════════════════════════════════════════════════════════════

const KEY = "abaa_lang";
let current = "en";
let observer = null;

// ── Dictionary: English interface phrase → 繁體中文 ──
const DICT = {
  // Navigation & headings
  "Events": "活動", "Match": "配對", "Scan": "掃描", "Community": "社群", "Profile": "個人檔案", "Projects": "項目",
  "Community Events": "社群活動", "Find Your Co-Founder": "尋找你的聯合創辦人", "My Profile": "我的檔案",
  "Discover Projects": "探索項目", "Help each other grow": "互相幫助，一起成長",
  "Discover and join networking events in our community": "探索並參加社群內的交流活動",
  "Browse profiles and send partnership requests": "瀏覽會員檔案並發送合作邀請",
  "Find projects to join and request to partner up": "尋找可加入的項目並申請合作",
  "Notifications": "通知", "Search everything": "搜尋全部", "Search people, projects, events": "搜尋會員、項目、活動",
  "Sign in": "登入", "Sign out": "登出", "Sign Out": "登出", "Sign in required": "需要登入",
  "Access your profile, messages and more": "登入以查看你的檔案、訊息等",
  "Sign In to Continue": "登入以繼續", "Continue with Google": "以 Google 繼續",
  "Sign in with Google to register, match with founders, chat and join events": "以 Google 登入即可註冊、配對創辦人、聊天及參加活動",
  "Welcome to CoFounder AI": "歡迎加入 ABAA 社群",

  // Common actions
  "Accept": "接受", "Decline": "拒絕", "Cancel": "取消", "Close": "關閉", "Done": "完成", "Save": "儲存", "Saved": "已儲存",
  "Delete": "刪除", "Edit": "編輯", "Remove": "移除", "Reset": "重設", "Back": "返回", "Next": "下一步", "Send": "發送",
  "Reply": "回覆", "Reply ›": "回覆 ›", "Copy": "複製", "Copied ✓": "已複製 ✓", "View": "查看", "Join": "加入", "Follow": "關注",
  "Following": "已關注", "Create": "建立", "Approve": "批准", "Reject": "拒絕", "Revoke": "撤銷", "Dismiss": "關閉",
  "Got it": "明白", "Install": "安裝", "Turn on": "開啟", "See all": "查看全部", "Continue →": "繼續 →", "Pick": "選擇",
  "Loading": "載入中", "Saving": "儲存中", "Sending": "發送中", "Processing": "處理中", "Redirecting": "跳轉中",
  "Validating": "驗證中", "One moment": "請稍候", "Something went wrong": "出現問題", "Error": "錯誤",
  "Save Changes": "儲存變更", "Save Profile": "儲存檔案", "Saved automatically": "已自動儲存",
  "Changes save automatically": "變更會自動儲存", "Changes save automatically as you edit": "編輯時會自動儲存",
  "Link copied": "已複製連結", "Message": "訊息", "Open Chat": "開啟聊天", "Exit": "離開", "Unsend": "收回",
  "Message unsent": "已收回訊息", "Type a message": "輸入訊息", "Close chat": "關閉聊天",
  "All": "全部", "Any": "任何", "None": "無", "Other": "其他", "New": "新", "Empty": "空白", "General": "一般",
  "Everyone": "所有人", "Today": "今天", "This Week": "本週", "This Month": "本月", "Upcoming": "即將舉行",
  "Pending": "待處理", "Active": "活躍", "Approved": "已批准", "Confirmed": "已確認", "Unavailable": "不可用",
  "You": "你", "Member": "會員", "Guest": "嘉賓", "Someone": "有人", "A founder": "一位創辦人", "A member": "一位會員",
  "Unknown": "未知", "Unnamed": "未命名", "TBA": "待定", "Admin": "管理員", "Your Name": "你的名字",

  // Events
  "Create Event": "建立活動", "Create New Event": "建立新活動", "Edit Event": "編輯活動", "Event": "活動",
  "Search events by title, description, location": "按標題、描述或地點搜尋活動",
  "All Locations": "所有地點", "All Dates": "所有日期", "Featured Calendars": "精選日曆", "Browse by Category": "按類別瀏覽",
  "Explore Local Events": "探索本地活動", "Future Events": "未來活動", "Past Events": "過往活動", "Past events": "過往活動",
  "No upcoming events": "暫無即將舉行的活動", "Loading events": "正在載入活動", "Loading event": "正在載入活動",
  "About this event": "關於此活動", "Date": "日期", "Time": "時間", "Location": "地點", "Attendance": "出席情況",
  "registered": "已登記", "going": "出席", "spots left": "個名額", "spots remaining": "個名額剩餘", "No spots available": "名額已滿",
  "Guest list is private": "嘉賓名單不公開", "Register to Attend": "登記出席", "Join Waitlist": "加入候補名單",
  "Cancel Registration": "取消登記", "Cancel Waitlist Spot": "取消候補", "Registered — Cancel": "已登記 — 取消",
  "Awaiting Host Approval — Cancel": "等待主辦方批准 — 取消", "Sign in to Register": "登入以登記",
  "You're Registered": "你已登記", "You're on the Waitlist": "你在候補名單上", "Event Full": "活動已滿",
  "Full — Waitlist Available": "已滿 — 可加入候補", "Open for Registration": "開放登記", "Event Ended": "活動已結束",
  "This event has ended": "此活動已結束", "Event Group Chat": "活動群組聊天", "Group chat for attendees": "出席者群組聊天",
  "Register and get approved to join the conversation": "登記並獲批准後即可加入對話",
  "Scan Tickets / Check-in": "掃描門票 / 簽到", "Check-in Scanner": "簽到掃描器", "Check In": "簽到",
  "Check-in failed": "簽到失敗", "Your ticket": "你的門票", "Your Ticket": "你的門票", "Ticket code": "門票編號",
  "Ticket Code": "門票編號", "My Ticket (QR)": "我的門票 (QR)",
  "Show this QR at the door, or give the code to the host": "入場時出示此 QR 碼，或把編號告訴主辦方",
  "Show the QR at the door, or give this code to the host": "入場時出示此 QR 碼，或把編號告訴主辦方",
  "Point camera at a ticket QR": "將鏡頭對準門票 QR 碼", "Paste ticket code": "貼上門票編號",
  "Or type ticket code (e.g. A1B2-C3D4)": "或輸入門票編號（例如 A1B2-C3D4）",
  "Enter the guest's ticket code manually": "手動輸入嘉賓門票編號",
  "That code doesn't match a guest for this event": "此編號與本活動的嘉賓不符",
  "Camera scanning isn't supported on this browser": "此瀏覽器不支援鏡頭掃描",
  "Attendees": "出席者", "tap a name to view profile, ✓ to check in": "點選名字查看檔案，按 ✓ 簽到",
  "arrived": "已到場", "Checked in": "已簽到", "Not yet arrived": "未到場", "No one has checked in yet": "尚未有人簽到",
  "Everyone has arrived 🎉": "全部人已到場 🎉", "No one has registered yet": "尚未有人登記",
  "Mark as attended": "標記為已出席", "Attended — tap to undo": "已出席 — 點擊取消",
  "View Attendees": "查看出席者", "Hosted by": "主辦方", "Share Event": "分享活動", "Event link copied ✓": "已複製活動連結 ✓",
  "Add to Calendar": "加入日曆", "Add to Calendar (optional)": "加入日曆（可選）", "Announcements": "公告",
  "No announcements yet": "暫無公告", "Message attendees": "通知出席者", "Send to all guests": "發送給所有嘉賓",
  "Send an update to everyone who registered": "向所有已登記人士發送最新消息", "Event feedback": "活動評價",
  "Send feedback": "提交評價", "Pick a star rating first": "請先選擇星級", "Thanks for the feedback ✓": "多謝你的評價 ✓",
  "Thanks — your feedback was recorded": "多謝 — 已記錄你的評價", "Any comments for the host? (optional)": "有話想對主辦方說嗎？（可選）",
  "Who you met": "你認識的人", "Connect with people from this event — they'll get a request from you.": "與活動中認識的人聯繫 — 對方會收到你的邀請。",
  "Connect with people from this event — they'll get a request from you": "與活動中認識的人聯繫 — 對方會收到你的邀請",
  "were there — connect while it's fresh": "人出席 — 趁記憶猶新快聯繫",
  "No other guests to show yet": "暫無其他嘉賓", "Connect with all": "一鍵聯繫全部",
  "Title & date required": "需要填寫標題和日期", "Event created ✓": "已建立活動 ✓", "Event updated ✓": "已更新活動 ✓",
  "Event deleted": "已刪除活動", "Event submitted — awaiting admin approval ✓": "已提交活動 — 等待管理員批准 ✓",
  "Event approved — now visible to everyone ✓": "活動已批准 — 所有人都可看到 ✓", "Approve Event": "批准活動",
  "Event is full — you're on the waitlist 📋": "活動已滿 — 你已加入候補名單 📋", "Registration cancelled": "已取消登記",
  "Registration sent — awaiting host approval ✓": "已發送登記 — 等待主辦方批准 ✓", "Registration declined": "登記被拒絕",
  "Attendee approved ✓": "已批准出席者 ✓", "Registration": "登記", "Submit Registration": "提交登記",
  "One quick question": "一條簡單問題", "Your answer": "你的答案", "Registration Question (optional)": "登記問題（可選）",
  "Guests will answer this when they register": "嘉賓登記時會回答此問題", "e.g. Any dietary requirements": "例如：有否飲食要求",
  "Max Attendees": "人數上限", "Repeat": "重複", "One-off": "單次", "Weekly": "每週", "Fortnightly": "每兩週", "Monthly": "每月",
  "Public guest list": "公開嘉賓名單", "Show who's going on the event page": "在活動頁顯示出席者",
  "Hide exact location until approved": "批准前隱藏確切地點", "Guests see full address only after you accept them": "嘉賓獲批准後才會看到完整地址",
  "Revealed once your registration is approved": "登記獲批准後顯示", "Cover": "封面", "Upload cover": "上載封面",
  "Pick a theme, or upload your own image below": "選擇主題，或在下方上載你的圖片", "Cover image uploaded ✓": "已上載封面 ✓",
  "Description": "描述", "What's this event about": "這個活動是關於甚麼", "Address": "地址",
  "Start typing the venue or address": "輸入場地或地址", "Search venue or street address": "搜尋場地或街道地址",
  "Searching Australian addresses": "正在搜尋澳洲地址", "Start typing — pick a suggested Australian address": "開始輸入 — 選擇建議的澳洲地址",
  "Create a Calendar": "建立日曆", "Create Calendar": "建立日曆", "Calendar created ✓": "已建立日曆 ✓",
  "No calendars yet": "暫無日曆", "Give your calendar a name": "為你的日曆命名", "What is this calendar about": "這個日曆是關於甚麼",
  "Calendar name, e.g. Melbourne AI Meetups": "日曆名稱，例如：墨爾本 AI 聚會",
  "Group your recurring events so people can follow them": "把定期活動歸類，方便大家關注",
  "Followers of that calendar will discover this event": "關注該日曆的人會看到此活動", "Sign in to follow calendars": "登入以關注日曆",
  "Discover more founder events": "探索更多創辦人活動", "Explore ABAA Events": "探索 ABAA 活動",
  "Event not found": "找不到活動", "This event may have been removed or the link is incorrect": "此活動可能已被移除，或連結有誤",
  "Demo event — real events you create are fully functional 😊": "示範活動 — 你建立的真實活動可正常使用 😊",
  "When": "時間", "Where": "地點", "Your event": "你的活動",

  // Match
  "Core Members": "核心會員", "My Connections": "我的聯繫", "Search by name, role, skills, location": "按名字、職位、技能、地點搜尋",
  "Search by name, role or label": "按名字、職位或標籤搜尋", "Filter by Industry": "按行業篩選", "Filter by Role": "按職位篩選",
  "Availability": "可投入時間", "Experience": "經驗", "Verified members only": "只顯示已認證會員", "Clear all filters": "清除所有篩選",
  "Clear filters": "清除篩選", "Saved searches": "已儲存的搜尋", "Save current filters": "儲存目前篩選", "Search saved ✓": "已儲存搜尋 ✓",
  "None saved yet": "暫未儲存", "Partnership Requests": "合作邀請", "Partnership Request": "合作邀請",
  "wants to partner with you": "想與你合作", "Send Partnership Request": "發送合作邀請",
  "Sign in to Send Partnership Request": "登入以發送合作邀請", "Already Connected": "已聯繫",
  "Partnership request sent — waiting for response": "已發送合作邀請 — 等待回覆",
  "This person wants to connect with you": "對方想與你聯繫", "Connect to reveal": "聯繫後顯示", "Contact Details": "聯絡資料",
  "Connected — contact revealed": "已聯繫 — 已顯示聯絡資料", "Visible to you as an admin": "你是管理員，所以可以看到",
  "This is your own profile": "這是你自己的檔案", "Demo profile — real users appear when they sign up": "示範檔案 — 真實會員註冊後會顯示",
  "Demo profile — real users appear here once they sign up 😊": "示範檔案 — 真實會員註冊後會在此顯示 😊",
  "Match accepted! You can now chat ✓": "已接受配對！現在可以聊天 ✓", "Request declined": "已拒絕邀請",
  "Request Pending": "等待回覆", "Request Sent": "已發送邀請", "Request sent": "已發送邀請", "Awaiting Response": "等待回覆",
  "Awaiting your response": "等待你回覆", "Request already sent ✓": "已發送過邀請 ✓", "You're already connected ✓": "你們已經聯繫 ✓",
  "Sign in to connect": "登入以聯繫", "Connect": "聯繫", "Connected": "已聯繫", "Requested": "已發送", "✓ Connected": "✓ 已聯繫",
  "Couldn't send request": "無法發送邀請", "No connections match": "沒有符合的聯繫",
  "Start a conversation! 👋": "開始對話吧！👋", "No messages yet — say hello 👋": "暫無訊息 — 打個招呼吧 👋",
  "Block this person": "封鎖此人", "Report this profile": "檢舉此檔案", "Could not block": "無法封鎖",
  "Report submitted — our team will review it. Thank you": "已提交檢舉 — 我們會跟進，多謝",
  "View full profile →": "查看完整檔案 →", "View profile": "查看檔案", "Verified member": "已認證會員",
  "Your account is pending admin approval": "你的帳戶正等待管理員批准", "Skills": "技能", "Bio": "簡介",
  "Project": "項目", "Contact": "聯絡", "Remove label": "移除標籤", "Could not save label": "無法儲存標籤",
  "Accepted! You're now connected — you can chat in the Match tab ✓": "已接受！你們已聯繫 — 可在配對頁聊天 ✓",
  "Make your first connection": "建立你的第一個聯繫", "people you're connected with": "位已聯繫的人",

  // Open to
  "Open to": "開放", "open to": "開放", "I'm open to": "我開放", "Co-founder": "聯合創辦人", "Hiring": "招聘中",
  "Investing": "投資", "Mentoring": "導師指導", "New customers": "尋找客戶", "Partnerships": "合作機會", "Seeking advice": "尋求意見",
  "Shown on your profile so the right people reach out. Tap to turn on or off.": "會顯示在你的檔案上，讓合適的人主動聯絡你。點擊開啟或關閉。",
  "Shown on your profile so the right people reach out. Tap to turn on or off": "會顯示在你的檔案上，讓合適的人主動聯絡你。點擊開啟或關閉",
  "✓ Saved": "✓ 已儲存", "person": "人", "people": "人",

  // Community hub
  "Asks & Offers": "需求與提供", "Perks": "會員優惠", "Mentors": "導師", "Ask": "需求", "Offer": "提供", "Asks": "需求", "Offers": "提供",
  "My posts": "我的帖子", "Ask the community": "向社群求助", "+ New ask or offer": "+ 發佈需求或提供", "New ask or offer": "發佈需求或提供",
  "Need an intro, a supplier or advice? Or have something to offer? Members reply to you privately.": "需要引薦、供應商或意見？或者有資源想分享？會員會私下回覆你。",
  "Need an intro, a supplier or advice? Or have something to offer? Members reply to you privately": "需要引薦、供應商或意見？或者有資源想分享？會員會私下回覆你",
  "Nothing here yet": "暫時未有內容", "You haven't posted yet": "你還未發佈帖子",
  "Be the first — post what you need or what you can offer.": "做第一個 — 發佈你的需要或可以提供的資源。",
  "Be the first — post what you need or what you can offer": "做第一個 — 發佈你的需要或可以提供的資源",
  "New post": "新帖子", "Members reply to you privately": "會員會私下回覆你", "I'm looking for…": "我正在尋找…", "I can offer…": "我可以提供…",
  "Add a little detail (optional)": "補充少少細節（可選）", "Category": "類別", "Post my ask": "發佈我的需求", "Post my offer": "發佈我的提供",
  "Add a short headline first": "請先加入簡短標題", "Your ask is live ✓": "你的需求已發佈 ✓", "Your offer is live ✓": "你的提供已發佈 ✓",
  "e.g. Looking for a customs broker for food imports": "例如：尋找食品進口報關代理", "e.g. Free 30-min review of your pitch deck": "例如：免費 30 分鐘審閱你的簡報",
  "Introductions": "引薦", "Suppliers": "供應商", "Funding": "融資", "Advice": "意見", "Services": "服務",
  "Private replies": "私人回覆", "All replies": "所有回覆", "Resolved": "已解決", "✓ Mark resolved": "✓ 標記為已解決", "Mark resolved": "標記為已解決",
  "Reopen": "重新開放", "Marked as resolved ✓": "已標記為已解決 ✓", "Reopened ✓": "已重新開放 ✓", "Post deleted": "已刪除帖子",
  "Admin: delete post": "管理員：刪除帖子", "reply": "個回覆", "replies": "個回覆",
  "No replies yet. Members who can help will message you here.": "暫無回覆。能幫忙的會員會在這裡聯絡你。",
  "Can you help? Reply privately — only you and the poster will see it.": "你能幫忙嗎？私下回覆 — 只有你和發帖人看到。",
  "Interested? Reply privately — only you and the poster will see it.": "有興趣？私下回覆 — 只有你和發帖人看到。",
  "This has been resolved, but you can still send a message.": "此帖已解決，但你仍可發送訊息。",
  "Couldn't post": "無法發佈", "Couldn't send": "無法發送", "Couldn't save": "無法儲存",
  "Member perks": "會員優惠", "Member Perks": "會員優惠", "Exclusive deals from fellow members": "會員專享的獨家優惠",
  "+ Offer a perk": "+ 提供優惠", "Offer a perk": "提供優惠", "No perks yet": "暫無優惠",
  "Own a business? Offer ABAA members a deal — it's a free way to win new customers.": "有自己的生意？為 ABAA 會員提供優惠 — 免費吸引新客戶。",
  "Offer the first perk": "提供第一個優惠", "Offer a member perk": "提供會員優惠",
  "A deal for ABAA members — great for getting new customers": "為 ABAA 會員而設的優惠 — 吸引新客戶的好方法",
  "Publish perk": "發佈優惠", "Business name *": "商業名稱 *", "The offer * — e.g. 15% off, Free first session": "優惠 * — 例如：85 折、首次免費",
  "What it's for * — e.g. Bookkeeping for startups": "適用於 * — 例如：初創公司簿記", "Details and conditions (optional)": "詳情及條款（可選）",
  "How to claim — e.g. code ABAA15, or mention ABAA": "使用方法 — 例如：優惠碼 ABAA15，或提及 ABAA", "Website (optional)": "網站（可選）",
  "Ends on (optional)": "結束日期（可選）", "Your perk is live ✓": "你的優惠已發佈 ✓",
  "Add your business, the offer and what it's for": "請填寫商業名稱、優惠及適用範圍", "How to claim": "使用方法",
  "Visit website ↗": "瀏覽網站 ↗", "Offered by": "提供者", "Remove perk": "移除優惠", "Perk removed": "已移除優惠", "Ends": "結束",
  "Professional services": "專業服務", "Software & tools": "軟件與工具", "Food & venues": "餐飲與場地", "Travel": "旅遊", "Yours": "你的",
  "Mentor office hours": "導師諮詢時間", "Book a free chat with experienced founders and operators": "與經驗豐富的創辦人及營運專家預約免費傾談",
  "Become a mentor": "成為導師", "Give back with a few short chats a month": "每月抽少少時間傾談，回饋社群",
  "Search by topic, name or role…": "按主題、名字或職位搜尋…", "No mentors yet": "暫無導師", "No mentors match": "沒有符合的導師",
  "Try a different topic.": "試試其他主題。", "Experienced members can turn on office hours from their Profile.": "有經驗的會員可在個人檔案開啟諮詢時間。",
  "Connect to arrange a time": "聯繫後安排時間", "This is you — members can find you here": "這是你 — 會員可以在這裡找到你",
  "Mentor · offers free office hours": "導師 · 提供免費諮詢時間", "Offer mentor office hours": "提供導師諮詢時間",
  "Offer short free chats to other founders. You'll appear in Community → Mentors.": "為其他創辦人提供簡短免費傾談。你會出現在「社群 → 導師」。",
  "What can you help with? e.g. fundraising, export to Asia, hiring your first team": "你可以幫忙甚麼？例如：融資、出口亞洲、招聘首批團隊",
  "Members can book time from your booking calendar": "會員可透過你的預約日曆預約時間",
  "Turn on your booking calendar so members can book a time with you.": "開啟你的預約日曆，讓會員可以預約時間。",
  "You're now listed as a mentor ✓": "你已登記成為導師 ✓", "Booking calendar on ✓ — set your hours below": "已開啟預約日曆 ✓ — 請在下方設定時間",
  "is almost ready": "即將推出", "It's being switched on. Check back shortly.": "正在啟用中，請稍後再來。",
  "This feature is being switched on — please try again shortly": "此功能正在啟用中 — 請稍後再試",
  "Only you and": "只有你和", "can see this conversation.": "可以看到此對話。", "re:": "關於：",

  // Language & install
  "Applies on this device": "只適用於此裝置", "Get the ABAA app": "下載 ABAA 應用程式", "Add it to your home screen": "加到主畫面",
  "Opens full-screen from your home screen — free, no App Store needed": "從主畫面全螢幕開啟 — 免費，毋須經 App Store",
  "Add ABAA to your home screen": "把 ABAA 加到主畫面", "Takes 10 seconds": "只需 10 秒",
  "Open app.abaa.au in Safari": "用 Safari 開啟 app.abaa.au", "Other browsers on iPhone can't install apps.": "iPhone 上的其他瀏覽器無法安裝應用程式。",
  "Tap the Share button": "點擊「分享」按鈕", "The square with an arrow pointing up, at the bottom or top of Safari.": "即 Safari 底部或頂部有向上箭咀的方格。",
  "Choose “Add to Home Screen”": "選擇「加至主畫面」", "Scroll down the list if you don't see it.": "如果看不到，請向下捲動清單。",
  "Tap “Add”": "點擊「新增」", "ABAA now opens like any other app.": "ABAA 會像其他應用程式一樣開啟。",
  "Open your browser menu": "開啟瀏覽器選單", "The ⋮ or ⋯ button next to the address bar.": "即網址列旁的 ⋮ 或 ⋯ 按鈕。",
  "Choose “Install app” or “Add to Home screen”": "選擇「安裝應用程式」或「加到主畫面」", "The wording depends on your browser.": "字眼視乎你的瀏覽器而定。",
  "Confirm": "確認",

  // Profile
  "Admin Controls": "管理員控制", "Approve members, review reports, view as user": "批准會員、處理檢舉、以會員身份檢視",
  "Scan a Business Card": "掃描名片", "Scan a business card": "掃描名片", "My Digital Business Card": "我的電子名片",
  "Copy my card link": "複製我的名片連結", "Card link copied — share it anywhere ✓": "已複製名片連結 — 隨處分享 ✓",
  "Scan to open my card": "掃描以開啟我的名片", "Scan to open this card": "掃描以開啟此名片", "Card colour": "名片顏色",
  "Personalise your business card's look": "個人化你的名片外觀", "Custom colour": "自訂顏色",
  "Changes save automatically. Your QR code also shows your profile photo in the centre.": "變更會自動儲存。你的 QR 碼中央亦會顯示你的頭像。",
  "QR code logo": "QR 碼標誌", "Shows in the centre of your QR. Defaults to your profile photo.": "顯示在 QR 碼中央，預設為你的頭像。",
  "Upload logo": "上載標誌", "Change logo": "更換標誌", "Logo": "標誌", "Logo uploaded ✓": "已上載標誌 ✓", "QR logo updated ✓": "已更新 QR 標誌 ✓",
  "More card links": "更多名片連結", "Tap a field to add it to your digital card": "點擊欄位以加入你的電子名片",
  "Card cover image": "名片封面", "Tap to upload cover image": "點擊上載封面", "Change cover": "更換封面", "Cover uploaded ✓": "已上載封面 ✓",
  "Shows at the top of your digital card. If none, your card colour is used.": "顯示在電子名片頂部；如沒有，會使用名片顏色。",
  "My Business": "我的生意", "Add business": "新增生意", "No businesses added yet": "暫未新增生意",
  "These appear in a \"My Business\" section on your digital card.": "這些會顯示在你電子名片的「我的生意」部分。",
  "Change photo": "更換相片", "Profile picture updated ✓": "已更新頭像 ✓", "Photo updated ✓": "已更新相片 ✓",
  "Pending Approval": "等待批准", "Identity": "身份", "Contact Card": "聯絡卡", "Your Links": "你的連結",
  "Profile saved ✓": "已儲存檔案 ✓", "Profile updated ✓": "已更新檔案 ✓", "Save failed": "儲存失敗", "Could not save": "無法儲存",
  "Name": "名字", "Role": "職位", "Mobile": "手提電話", "Email": "電郵", "Website": "網站", "Industry": "行業", "Stage": "階段",
  "Team Size": "團隊人數", "Funding Status": "融資狀況", "Years Experience": "年資", "Headline / Tagline": "標題 / 標語",
  "Bio / Background": "簡介 / 背景", "Write a short bio": "寫一段簡短介紹", "Your Background": "你的背景",
  "Tell us about your professional background and experience": "介紹一下你的專業背景和經驗",
  "Location (Australia only)": "地點（只限澳洲）", "Suburb (Australia)": "區域（澳洲）", "Start typing your suburb": "輸入你的區域",
  "Type your suburb and select — the state fills in automatically": "輸入區域並選擇 — 州份會自動填上",
  "No Australian suburb found. Try a major suburb name": "找不到澳洲區域，請試試較大的區域名稱", "State": "州份",
  "Skills (Enter to add)": "技能（按 Enter 新增）", "e.g. React, Fundraising, AI/ML": "例如：React、融資、AI/ML",
  "Your Business / Project": "你的生意 / 項目", "Project Name": "項目名稱", "Elevator Pitch": "電梯簡報",
  "Problem → Solution → Why now": "問題 → 方案 → 為何是現在", "Project Website": "項目網站", "Role Needed": "所需職位",
  "Looking For (select all that apply)": "正在尋找（可多選）", "Looking for": "正在尋找",
  "Optional — but helps you find the right co-founder": "可選 — 但有助你找到合適的聯合創辦人",
  "WhatsApp (AU only — +61)": "WhatsApp（只限澳洲 — +61）", "WhatsApp must be an Australian number starting with +61": "WhatsApp 必須是以 +61 開頭的澳洲號碼",
  "Must start with +61. WhatsApp icon will appear on your profile when filled in.": "必須以 +61 開頭。填寫後，你的檔案會顯示 WhatsApp 圖示。",
  "LinkedIn URL": "LinkedIn 網址", "WeChat ID": "微信 ID", "Business name": "商業名稱", "Business Name": "商業名稱", "Your company name": "你的公司名稱",
  "Business Website": "公司網站", "Services (e.g. Bookkeeping, Tax)": "服務（例如：簿記、稅務）",
  "e.g. Property, Lending, Marketing": "例如：地產、借貸、市場推廣",
  "One-line summary, e.g. 'Technical founder looking for a CMO'": "一句總結，例如：「技術創辦人尋找市場總監」",
  "Language · 語言": "語言 · Language",
  "Meeting bookings": "會議預約", "Let people book meetings with you from your card and profile": "讓人透過你的名片和檔案預約會議",
  "MEETING LENGTH": "會議長度", "WEEKLY AVAILABILITY": "每週可預約時間", "No availability set": "未設定可預約時間",
  "Times are Australian Eastern Time. Booked slots are automatically blocked.": "時間為澳洲東部時間。已預約的時段會自動封鎖。",
  "Contacts from your card": "透過名片取得的聯絡人", "People who shared their details back": "回傳資料給你的人",
  "Scanned contacts": "已掃描的聯絡人", "Cards you've scanned": "你掃描過的名片",
  "Profile photo (required)": "頭像（必須）", "Add a profile photo": "加入頭像", "Add your role & location": "加入職位和地點",
  "Add your skills": "加入技能", "Register for an event": "登記參加活動", "Get set up": "完成設定", "steps done": "個步驟已完成",
  "You're all caught up ✨": "你已看完所有通知 ✨", "Invite founders": "邀請創辦人", "Share invite link": "分享邀請連結",
  "Invite link copied ✓": "已複製邀請連結 ✓", "Community Builder": "社群建立者", "Founding Champion": "創會大使",
  "Complete Setup ✓": "完成設定 ✓", "Welcome aboard! Your profile is set up ✓": "歡迎加入！你的檔案已設定好 ✓",
  "Add a photo, name, role and location to continue": "加入相片、名字、職位和地點以繼續",
  "Add a bio and at least one skill to continue": "加入簡介和至少一項技能以繼續",

  // Card scanner
  "Save the contact and invite them to connect": "儲存聯絡人並邀請對方聯繫",
  "Take a photo of their business card — we'll pull out the details automatically.": "為對方的名片拍照 — 我們會自動擷取資料。",
  "Take photo": "拍照", "Choose from gallery": "從相簿選擇", "or enter details manually": "或手動輸入資料", "Reading the card…": "正在讀取名片…",
  "Reading the card": "正在讀取名片", "Check the details before saving — edit anything that's wrong.": "儲存前請檢查資料 — 如有錯誤請修改。",
  "Full name *": "全名 *", "Job title": "職銜", "Company": "公司", "Where did you meet? (optional)": "你們在哪裡認識？（可選）",
  "* Name plus an email or phone required": "* 需要名字及電郵或電話", "Save contact": "儲存聯絡人", "Save Contact": "儲存聯絡人",
  "↺ Scan a different card": "↺ 掃描另一張名片", "Scan a different card": "掃描另一張名片", "Scan another card": "再掃描一張",
  "Tap the line from the card to use": "點選名片上要使用的一行", "They're already on ABAA!": "對方已經是 ABAA 會員！",
  "Contact saved. You can connect with them right away.": "已儲存聯絡人，可以即時聯繫對方。", "Contact saved": "已儲存聯絡人",
  "Need a name plus an email or phone": "需要名字及電郵或電話", "Could not save contact": "無法儲存聯絡人",
  "Couldn't read that image — you can type the details instead": "無法讀取該圖片 — 你可以手動輸入資料",

  // Bookings
  "Book a meeting": "預約會議", "Select a day": "選擇日子", "Select a time": "選擇時間", "Request this meeting": "申請此會議",
  "No free times this day — try another day": "這天沒有空檔 — 請試另一天", "What would you like to discuss? (optional)": "你想討論甚麼？（可選）",
  "Join video call": "加入視像通話", "Meeting cancelled": "已取消會議", "Booking failed — please try again": "預約失敗 — 請再試",
  "Meeting accepted — video link sent to both of you ✓": "已接受會議 — 視像連結已發送給雙方 ✓", "One quick step to book": "預約前只差一步",

  // Projects
  "Create a project": "建立項目", "Create Project": "建立項目", "New Project": "新項目", "Edit Project": "編輯項目", "My Projects": "我的項目",
  "Search projects by name, pitch, founder…": "按名稱、簡介或創辦人搜尋項目…", "Search projects by name, pitch, founder": "按名稱、簡介或創辦人搜尋項目",
  "No projects yet": "暫無項目", "Request to Join": "申請加入", "Join Requests to My Project": "我的項目的加入申請",
  "Which role are you applying for": "你申請哪個職位", "wants to join": "想加入", "Project created ✓": "已建立項目 ✓",
  "Project updated ✓": "已更新項目 ✓", "Project deleted": "已刪除項目", "Project name is required": "需要填寫項目名稱",
  "Board": "看板", "List": "列表", "Idea": "構思", "Building": "開發中", "Launched": "已推出",
  "Add your first project so founders can discover it and request to join": "加入你的第一個項目，讓創辦人發現並申請加入",

  // Business card page
  "Save to Contacts": "儲存至聯絡人", "Save to phone": "儲存到手機", "Share this card": "分享此名片", "Card not found": "找不到名片",
  "This digital business card doesn't exist or was removed": "此電子名片不存在或已被移除", "Create your own free card": "建立你的免費名片",
  "Create Your Own — Free": "免費建立你的名片", "Want a free digital business card like this": "想要一張這樣的免費電子名片嗎",
  "Join our founder community to create yours": "加入我們的創辦人社群，建立你的名片", "Share your details back": "回傳你的資料",
  "Send my details": "發送我的資料", "Book": "預約", "Add to Apple / Google Wallet": "加入 Apple / Google 錢包", "Wallet feature coming soon": "錢包功能即將推出",

  // Admin
  "Manage Users": "管理會員", "Make Admin": "設為管理員", "Remove Admin": "移除管理員", "Revoke Access": "撤銷權限",
  "View as this user": "以此會員身份檢視", "Returned to your admin account": "已返回你的管理員帳戶", "Viewing as": "正在檢視：",

  // Misc
  "You're offline — changes will retry when you reconnect": "你已離線 — 重新連線後會再嘗試",
  "Upload failed": "上載失敗", "Type at least 2 characters": "請輸入至少 2 個字", "No results for \"": "找不到「",
  "Founder": "創辦人", "Engineer": "工程師", "Designer": "設計師", "Investor": "投資者", "Advisor": "顧問", "Mentor": "導師",
  "Contractor": "承包商", "Employee": "僱員", "Business Partner": "商業夥伴", "Technical Partner": "技術夥伴",
  "Marketing Partner": "市場推廣夥伴", "Operations Partner": "營運夥伴", "Sales Partner": "銷售夥伴", "Co-Founder": "聯合創辦人",
  "Marketing": "市場推廣", "Full-time": "全職", "Part-time": "兼職", "Weekends": "週末", "Advisory": "顧問形式", "Just exploring": "隨便看看",
  "No description provided": "未有描述",
};

// Day / month names for dates rendered by the app
const DAYS = { Sun:"日", Mon:"一", Tue:"二", Wed:"三", Thu:"四", Fri:"五", Sat:"六" };
const MONTHS = { Jan:1, Feb:2, Mar:3, Apr:4, May:5, Jun:6, Jul:7, Aug:8, Sep:9, Oct:10, Nov:11, Dec:12 };
const dayZh = (d) => "星期" + DAYS[d.slice(0,3)];

// Patterns for short dynamic phrases (counts, times, dates)
const PATTERNS = [
  [/^just now$/i, () => "剛剛"],
  [/^(\d+)m ago$/, (m) => `${m[1]} 分鐘前`],
  [/^(\d+)h ago$/, (m) => `${m[1]} 小時前`],
  [/^(\d+)d ago$/, (m) => `${m[1]} 日前`],
  [/^(\d+) Events?$/, (m) => `${m[1]} 個活動`],
  [/^(\d+) \/ (\d+) arrived$/, (m) => `${m[1]} / ${m[2]} 已到場`],
  [/^(\d+) (?:reply|replies)$/, (m) => `${m[1]} 個回覆`],
  [/^(\d+) (?:person|people) open to (.+)$/, (m) => `${m[1]} 人開放${DICT[m[2].replace(/^./,c=>c.toUpperCase())]||m[2]}`],
  [/^(\d+) (?:person|people) were there — connect while it's fresh$/, (m) => `${m[1]} 人出席 — 趁記憶猶新快聯繫`],
  [/^Book a (\d+)-min chat$/, (m) => `預約 ${m[1]} 分鐘傾談`],
  [/^Connect with all (\d+)$/, (m) => `一鍵聯繫全部 ${m[1]} 人`],
  [/^Reply privately to (.+?)…?$/, (m) => `私下回覆 ${m[1]}`],
  [/^Only you and (.+) can see this conversation\.?$/, (m) => `只有你和 ${m[1]} 可以看到此對話。`],
  [/^Request sent to (.+) ✓$/, (m) => `已向 ${m[1]} 發送邀請 ✓`],
  [/^(\d+) of (\d+) registered$/, (m) => `已登記 ${m[1]} / ${m[2]}`],
  [/^(\d+) spots remaining$/, (m) => `剩餘 ${m[1]} 個名額`],
  [/^Attendees \((\d+)\) · tap a name to view profile, ✓ to check in$/, (m) => `出席者（${m[1]}）· 點選名字查看檔案，按 ✓ 簽到`],
  [/^Checked in \((\d+)\)$/, (m) => `已簽到（${m[1]}）`],
  [/^Not yet arrived \((\d+)\)$/, (m) => `未到場（${m[1]}）`],
  [/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)[a-z]*,? (\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*,?(?: (\d{4}))?$/, (m) => `${m[4]?m[4]+"年":""}${MONTHS[m[3]]}月${m[2]}日（${dayZh(m[1])}）`],
  [/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)[a-z]*,? (\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*,? (\d{4}),? (?:at )?(.+)$/, (m) => `${m[4]}年${MONTHS[m[3]]}月${m[2]}日（${dayZh(m[1])}）${m[5]}`],
  [/^(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*(?: (\d{4}))?$/, (m) => `${m[3]?m[3]+"年":""}${MONTHS[m[2]]}月${m[1]}日`],
  [/^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)$/, (m) => dayZh(m[1])],
  [/^Ends (\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* (\d{4})$/, (m) => `${m[3]}年${MONTHS[m[2]]}月${m[1]}日結束`],
];

const LOOKUP = new Map();
for (const [k, v] of Object.entries(DICT)) LOOKUP.set(k.toLowerCase(), v);
const ZH_VALUES = new Set(Object.values(DICT));

const PUNCT = { ":": "：", "?": "？", "!": "！", "(": "（" };

function translateString(text) {
  if (!text || !/[A-Za-z]/.test(text)) return null;
  // Whole string first (keeps phrases that include emoji/punctuation)
  const whole = text.trim();
  let hit = LOOKUP.get(whole.toLowerCase());
  if (hit != null) return text.replace(whole, hit);
  // Split leading symbols/emoji and trailing punctuation
  const m = text.match(/^(\s*[^A-Za-z0-9"“]*?)([A-Za-z0-9"“][\s\S]*?)([\s.:!?…(]*)$/);
  if (!m) return null;
  const [, pre, core, suf] = m;
  hit = LOOKUP.get(core.toLowerCase());
  if (hit == null) {
    for (const [re, fn] of PATTERNS) {
      const mm = core.match(re);
      if (mm) { hit = fn(mm); break; }
    }
  }
  if (hit == null) return null;
  const endsZh = /[。！？…）]$/.test(hit);
  const sufZh = suf.replace(/\.\.\.|…/g, "…").replace(/\.(?!\.)/g, endsZh ? "" : "。").replace(/\s+\(/, "(").replace(/[:?!(]/g, (c) => PUNCT[c]);
  return pre + hit + sufZh;
}

// ── DOM translation ──
const textState = new WeakMap();   // Text node → { en, zh }
const attrState = new WeakMap();   // Element → { [attr]: { en, zh } }
const ATTRS = ["placeholder", "title", "aria-label"];

function skip(el) {
  if (!el || el.nodeType !== 1) return false;
  const tag = el.tagName;
  if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA" || tag === "CODE") return true;
  return !!el.closest?.('[translate="no"],.notranslate,[contenteditable="true"]');
}

function applyText(node) {
  const v = node.nodeValue;
  const rec = textState.get(node);
  if (current === "zh") {
    if (rec && v === rec.zh) return;
    if (skip(node.parentElement)) return;
    const tr = translateString(v);
    if (tr != null && tr !== v) { textState.set(node, { en: v, zh: tr }); node.nodeValue = tr; }
    else if (rec) textState.delete(node);
  } else if (rec) {
    if (v === rec.zh) node.nodeValue = rec.en;
    textState.delete(node);
  }
}

function applyAttrs(el) {
  if (el.nodeType !== 1) return;
  let recs = attrState.get(el);
  for (const a of ATTRS) {
    if (!el.hasAttribute(a)) continue;
    const v = el.getAttribute(a);
    const rec = recs?.[a];
    if (current === "zh") {
      if (rec && v === rec.zh) continue;
      if (skip(el) && el.tagName !== "TEXTAREA") continue;
      const tr = translateString(v);
      if (tr != null && tr !== v) {
        if (!recs) { recs = {}; attrState.set(el, recs); }
        recs[a] = { en: v, zh: tr };
        el.setAttribute(a, tr);
      }
    } else if (rec) {
      if (v === rec.zh) el.setAttribute(a, rec.en);
      delete recs[a];
    }
  }
}

function walk(root) {
  if (!root) return;
  if (root.nodeType === 3) { applyText(root); return; }
  if (root.nodeType !== 1) return;
  applyAttrs(root);
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n = tw.nextNode();
  while (n) {
    if (n.nodeType === 3) applyText(n); else applyAttrs(n);
    n = tw.nextNode();
  }
}

function startObserver() {
  if (observer || typeof MutationObserver === "undefined") return;
  observer = new MutationObserver((muts) => {
    if (current !== "zh") return;
    for (const m of muts) {
      if (m.type === "characterData") applyText(m.target);
      else if (m.type === "attributes") applyAttrs(m.target);
      else m.addedNodes.forEach(walk);
    }
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}

export function getLang() {
  try { const v = localStorage.getItem(KEY); if (v === "en" || v === "zh") return v; } catch (e) {}
  const n = (typeof navigator !== "undefined" && (navigator.language || "")).toLowerCase();
  return /^zh-(hk|tw|mo|hant)/.test(n) ? "zh" : "en";
}

export function setLang(lang) {
  current = lang === "zh" ? "zh" : "en";
  try { localStorage.setItem(KEY, current); } catch (e) {}
  document.documentElement.lang = current === "zh" ? "zh-Hant-HK" : "en";
  startObserver();
  walk(document.body);
  window.dispatchEvent(new CustomEvent("abaa-lang", { detail: current }));
}

export function initI18n() {
  current = getLang();
  document.documentElement.lang = current === "zh" ? "zh-Hant-HK" : "en";
  startObserver();
  if (current === "zh") walk(document.body);
}

// Exposed for tests
export const __translate = translateString;
export const __hasZh = (s) => ZH_VALUES.has(s);
