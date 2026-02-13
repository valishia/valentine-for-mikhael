const AUDIO = {
  bgm: "assets/music.m4a",
  click: "assets/click.mp3",
  type: "assets/type.mp3"
};

const scenes = [
  {
    media: "assets/v1.gif",
    title: "Hi baby.",
    subtitle: "i made a tiny valentine present for you. click slowly, okay?",
    buttons: [{ label: "tap ‹ 𝟹", action: "next", style: "alt" }]
  },
  {
    media: "assets/v2.gif",
    title: "Happy valentine's day, sayang",
    subtitle: "every day with you feels a little softer, a little warmer.",
    buttons: [{ label: "open it ‹ 𝟹", action: "next" }]
  },
  {
    media: "assets/v3.gif",
    title: "you + me = my favorite place",
    subtitle: "i’m grateful for you — for the calm, the laughs, and the way you try.",
    buttons: [{ label: "𖹭", action: "next", style: "alt" }]
  },
  {
    type: "letter",
    media: "assets/image.png",
    title: "Happy valentine's day, my sweetheart.",
    subtitle: "i wrote this for you deep from my heart, read it slowly, okay?",
    extra: {
      letter: `Some days are marked on the calendar, but what I feel for you isn’t limited to a date.

Out of all the people in this world, somehow our paths met, and I’m grateful for that. Being around you, even in the simplest ways, makes everything feel calmer. Lighter. More meaningful.

Thank you for your patience. For understanding me, even when I’m quiet, busy, or still figuring things out. Thank you for staying and choosing this, choosing us.

I may not always be perfect, but I’ll always try. I’ll try to be better, to grow, and to protect what we have. I don’t just want to love you. I want to take care of you, support you, and be someone you can lean on.

And if one day you feel tired or overwhelmed, I hope you know you can rest here. In my arms. In my presence. In the reassurance that you’re not alone.

I love you, Mikhael. Today, tomorrow, and always. 🤍`
    },
    buttons: [
      { label: "replay", action: "replayLetter" },
      { label: "skip", action: "skipLetter", style: "alt" },
      { label: "back", action: "prev" }
    ]
  }
];

const elCard = document.getElementById("card");
const elMediaWrap = document.getElementById("mediaWrap");
const elTitle = document.getElementById("title");
const elSubtitle = document.getElementById("subtitle");
const elContent = document.getElementById("content");
const elActions = document.getElementById("actions");
const elProgress = document.getElementById("progress");
const elRainLayer = document.getElementById("rainLayer");

const bgm = document.getElementById("bgm");
const sfxClick = document.getElementById("sfxClick");
const sfxType = document.getElementById("sfxType");
const audioBtn = document.getElementById("audioBtn");

function setScrollMode(on){
  document.body.classList.toggle("scroll-page", on);
}

let i = 0;
let audioEnabled = false;

let typing = {
  timer: null,
  isTyping: false,
  fullText: "",
  index: 0,
  caretEl: null,
  targetEl: null
};

setupAudio();
preloadAssets(scenes.map(s => s.media).filter(Boolean));
renderScene(i);

audioBtn.addEventListener("click", async () => {
  audioEnabled = !audioEnabled;
  audioBtn.textContent = audioEnabled ? "🔊" : "🔈";

  if(audioEnabled){
    await safePlay(bgm);
  } else {
    bgm.pause();
  }
});

function renderScene(index){
  const s = scenes[index];

  stopTyping();
  clearRain();
  elContent.innerHTML = "";
  elMediaWrap.innerHTML = "";
  elActions.innerHTML = "";

  setScrollMode(false);

  elTitle.textContent = s.title || "";
  elSubtitle.textContent = s.subtitle || "";

  elProgress.textContent = `${index+1} / ${scenes.length}`;

  if(s.type === "letter"){
    setScrollMode(true);
    startRain(28);

    if(s.media){
      const img = document.createElement("img");
      img.className = "media";
      img.alt = "";
      img.decoding = "async";
      img.loading = "eager";
      img.src = s.media;
      elMediaWrap.appendChild(img);
    }

    const wrap = document.createElement("div");
    wrap.className = "letter-wrap";

    const box = document.createElement("div");
    box.className = "letter-box";

    const content = document.createElement("div");
    content.className = "letter-content";

    box.appendChild(content);
    wrap.appendChild(box);

    elContent.appendChild(wrap);

    (s.buttons || []).forEach(b => elActions.appendChild(makeBtn(b)));

    typewriter(content, s.extra?.letter || "", 20);

    box.addEventListener("click", () => {
      if(typing.isTyping) skipTyping();
    });

    return;
  }

  if(s.media){
    const img = document.createElement("img");
    img.className = "media";
    img.alt = "";
    img.decoding = "async";
    img.loading = "eager";
    img.src = s.media;
    elMediaWrap.appendChild(img);
  }

  (s.buttons || []).forEach(b => elActions.appendChild(makeBtn(b)));
}

function makeBtn(b){
  const btn = document.createElement("button");
  btn.className = "btn" + (b.style === "alt" ? " alt" : "");
  btn.type = "button";
  btn.textContent = b.label;

  btn.addEventListener("click", () => {
    playClick();
    handleAction(b.action);
  });

  return btn;
}

function handleAction(action){
  if(action === "next") return goTo(i + 1);
  if(action === "prev") return goTo(i - 1);

  if(action === "replayLetter"){
    const s = scenes[i];
    if(s?.type === "letter"){
      const content = document.querySelector(".letter-content");
      if(content) typewriter(content, s.extra?.letter || "", 20);
    }
    return;
  }

  if(action === "skipLetter"){
    skipTyping();
    return;
  }
}

function goTo(nextIndex){
  if(nextIndex < 0 || nextIndex >= scenes.length) return;

  elCard.classList.remove("is-entering");
  elCard.classList.add("is-leaving");

  window.setTimeout(() => {
    i = nextIndex;
    renderScene(i);

    elCard.classList.remove("is-leaving");
    elCard.classList.add("is-entering");

    window.setTimeout(() => elCard.classList.remove("is-entering"), 320);
  }, 240);
}

function stopTyping(){
  if(typing.timer) clearTimeout(typing.timer);
  typing.timer = null;
  typing.isTyping = false;
  typing.fullText = "";
  typing.index = 0;
  typing.caretEl = null;
  typing.targetEl = null;
}

function typewriter(el, text, speed = 22){
  stopTyping();
  typing.isTyping = true;
  typing.fullText = text;
  typing.index = 0;
  typing.targetEl = el;

  el.textContent = "";

  const caret = document.createElement("span");
  caret.className = "caret";
  typing.caretEl = caret;
  el.appendChild(caret);

  const tick = () => {
    if(!typing.isTyping) return;

    const t = typing.fullText;
    if(typing.index >= t.length){
      typing.isTyping = false;
      return;
    }

    const ch = t[typing.index++];
    caret.insertAdjacentText("beforebegin", ch);

    playType(ch);

    let next = speed;
    if(ch === "\n") next = 140;
    if([",",".","!","?"].includes(ch)) next = 220;

    typing.timer = setTimeout(tick, next);
  };

  tick();
}

function skipTyping(){
  if(!typing.targetEl) return;
  typing.isTyping = false;
  if(typing.timer) clearTimeout(typing.timer);
  typing.timer = null;
  typing.targetEl.textContent = typing.fullText;
}

function clearRain(){
  elRainLayer.innerHTML = "";
}

function startRain(count = 22){
  clearRain();
  const emojis = ["💗","🎀","💐","🫶🏻"];

  for(let k=0; k<count; k++){
    const d = document.createElement("span");
    d.className = "rain-drop";
    d.textContent = emojis[Math.floor(Math.random()*emojis.length)];

    const left = Math.random() * 100;
    const size = 14 + Math.random()*14;
    const dur  = 4 + Math.random()*7;
    const delay= Math.random()*3;
    const op   = 0.22 + Math.random()*0.55;
    const rot  = (Math.random()*30 - 15).toFixed(1);

    const bias = Math.random();
    const biasedLeft = bias < 0.5 ? (Math.random()*20) : (80 + Math.random()*20);

    d.style.left = `${(Math.random() < 0.60 ? biasedLeft : left)}vw`;
    d.style.fontSize = `${size}px`;
    d.style.animationDuration = `${dur}s`;
    d.style.animationDelay = `${delay}s`;
    d.style.opacity = op.toFixed(2);
    d.style.transform = `rotate(${rot}deg)`;

    elRainLayer.appendChild(d);
  }
}

function preloadAssets(urls){
  urls.forEach(url => {
    const img = new Image();
    img.src = url;
  });
}

function setupAudio(){
  bgm.src = AUDIO.bgm;
  sfxClick.src = AUDIO.click;
  sfxType.src = AUDIO.type;

  bgm.volume = 0.5;
  sfxClick.volume = 0.7;
  sfxType.volume = 0.25;
}

async function safePlay(audioEl){
  try{
    await audioEl.play();
  }catch(e){}
}

function playClick(){
  if(!audioEnabled) return;
  try{
    sfxClick.currentTime = 0;
    sfxClick.play();
  }catch(e){}
}

function playType(ch){
  if(!audioEnabled) return;
  if(ch === " " || ch === "\n") return;
  if(Math.random() < 0.55) return;

  try{
    sfxType.currentTime = 0;
    sfxType.play();
  }catch(e){}
}
