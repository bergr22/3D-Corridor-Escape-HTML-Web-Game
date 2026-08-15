// js/game.js - First Person Horror Engine AAA Main Menu & Wolf AI

let scene, camera, renderer;
let wallTexture, floorTexture, ceilingTexture, doorTexture, dirtTexture, wolfFurTexture, pineLeafTexture, dontLookBackTexture, lavaTexture;
let lights = [];
let forestAmbient = null;

// Game States
let isMainMenuActive = true;
let currentStage = 1;
const maxStages = 15;
let isPaused = false;
let isTransitioning = false;
let isCutsceneActive = false;
let isNoClipActive = false;

// Ending #2 (DONT LOOK BACK) References
let ending2Active = false;
let ending2Triggered = false;
let ending2ScareDone = false;
let triangleEntityGroup = null;
let ending2EndLight = null;
let ending2TextWallMesh = null;

// Ending #3 (LAVA) References
let ending3Active = false;
let ending3Dying = false;
let lavaMesh = null;
let lavaLight = null;
let lavaY = -0.5;

let gameStartTimeMs = 0;
let pauseStartTimeMs = 0;
let totalPausedDurationMs = 0;
let gameDifficulty = 'MEDIUM';

function getFormattedGameTime() {
    if (!gameStartTimeMs) return '00:00:00';
    let now = (isPaused && pauseStartTimeMs > 0) ? pauseStartTimeMs : performance.now();
    let totalMs = Math.max(0, (now - gameStartTimeMs) - totalPausedDurationMs);

    let mins = Math.floor(totalMs / 60000);
    let secs = Math.floor((totalMs % 60000) / 1000);
    let cs = Math.floor((totalMs % 1000) / 10);

    let mStr = String(mins).padStart(2, '0');
    let sStr = String(secs).padStart(2, '0');
    let cStr = String(cs).padStart(2, '0');

    return `${mStr}:${sStr}:${cStr}`;
}

// Settings State
let mouseSensitivity = 1.0;

// Mobile Touch Controls State
let touchMoveX = 0; // -1 to 1 (left to right)
let touchMoveY = 0; // -1 to 1 (forward to backward: -1 is forward W, +1 is backward S)
let touchSprinting = false;
let joystickActive = false;
let joystickTouchId = null;
let joystickCenter = { x: 0, y: 0 };
const joystickMaxRadius = 55; // max radius in px
const joystickSprintThreshold = 36; // threshold to activate Shift (Sprint)

let touchLookTouchId = null;
let touchLookLastPos = { x: 0, y: 0 };

// Movement & Controls State
const keys = { KeyW: false, KeyS: false, KeyA: false, KeyD: false, Space: false, ShiftLeft: false, ShiftRight: false };
let isRightMouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;

const moveSpeedWalk = 3.4;
const moveSpeedSprint = 6.6;

function resetCameraRotation() {
    if (typeof camera !== 'undefined' && camera) {
        camera.quaternion.set(0, 0, 0, 1);
    }
}

let headBobTime = 0;
const baseCameraY = 1.6;

// Clock
const clock = new THREE.Clock();

// Interactive Doors & Night Forest Wolf References
let doors = [];
let activePromptDoor = null;
let wolfMeshGroup = null;
let wolfEyeLights = [];
let wolfLegFL = null, wolfLegFR = null, wolfLegBL = null, wolfLegBR = null;
let wolfTail = null;
let wolfRunCycle = 0;
let wolfStepTimer = 0;
let isWolfChasing = false;
let wolfIsPouncing = false;
let wolfPounceProgress = 0;
const wolfSpeed = 11.8; // Realistic natural chase speed

// Campfire references
let campfireLight = null;
let campfireLight2 = null;
let campfireFireMesh = null;

let currentLanguage = 'en'; // Default language state: 'en' or 'tr'
let activeChoiceRooms = []; // Stores references to chalkboard meshes and question data

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

let photoDeck = [];
let lastPhotoIndex = -1;

function getNextPhotoIndex() {
    const totalPhotos = (typeof paintingTextures !== 'undefined' && paintingTextures && paintingTextures.length > 0) ? paintingTextures.length : 12;
    if (photoDeck.length === 0) {
        let indices = Array.from({ length: totalPhotos }, (_, i) => i);
        indices = shuffleArray(indices);
        if (indices[indices.length - 1] === lastPhotoIndex && totalPhotos > 1) {
            const temp = indices[indices.length - 1];
            indices[indices.length - 1] = indices[0];
            indices[0] = temp;
        }
        photoDeck = indices;
    }
    lastPhotoIndex = photoDeck.pop();
    return lastPhotoIndex;
}

// ===== DIFFICULTY BASED QUESTION POOLS (20 QUESTIONS EACH) =====

// 1. EASY QUESTION POOL (20 QUESTIONS)
const easyQuestionPool = [
    {
        id: 1,
        tr: { question: "Bir Haftada Kaç\nGün Vardır?", left: "7 GÜN", right: "10 GÜN" },
        en: { question: "How Many Days\nin a Week?", left: "7 DAYS", right: "10 DAYS" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 2,
        tr: { question: "Gündüz Gökyüzü Ne\nRenktir?", left: "MAVİ", right: "KIRMIZI" },
        en: { question: "What Color is the\nDaytime Sky?", left: "BLUE", right: "RED" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 3,
        tr: { question: "Saf Su Kaç Derecede\nDonar?", left: "0 °C", right: "100 °C" },
        en: { question: "At What Temp Does\nPure Water Freeze?", left: "0 °C", right: "100 °C" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 4,
        tr: { question: "Türkiye'nin Başkenti\nHangi Şehirdir?", left: "ANKARA", right: "İSTANBUL" },
        en: { question: "What is the Capital\nof Turkey?", left: "ANKARA", right: "ISTANBUL" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 5,
        tr: { question: "Tavukların Kaç Tane\nBacağı Vardır?", left: "2 BACAK", right: "4 BACAK" },
        en: { question: "How Many Legs\nDoes a Chicken Have?", left: "2 LEGS", right: "4 LEGS" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 6,
        tr: { question: "Bir Yılda Kaç\nAy Vardır?", left: "12 AY", right: "24 AY" },
        en: { question: "How Many Months\nin a Year?", left: "12 MONTHS", right: "24 MONTHS" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 7,
        tr: { question: "Güneş Hangi Yönden\nDoğar?", left: "DOĞUDAN", right: "BATI'DAN" },
        en: { question: "Which Direction Does\nthe Sun Rise From?", left: "EAST", right: "WEST" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 8,
        tr: { question: "Dünyamızın Doğal\nUydusu Hangisidir?", left: "AY", right: "GÜNEŞ" },
        en: { question: "What is Earth's\nNatural Satellite?", left: "THE MOON", right: "THE SUN" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 9,
        tr: { question: "Bir Saatte Kaç\nDakika Vardır?", left: "60 DAKİKA", right: "100 DAKİKA" },
        en: { question: "How Many Minutes\nin One Hour?", left: "60 MINUTES", right: "100 MINUTES" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 10,
        tr: { question: "Aşağıdakilerden Hangisi\nBir Meyvedir?", left: "ELMA", right: "EKMEK" },
        en: { question: "Which One of These\nis a Fruit?", left: "APPLE", right: "BREAD" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 11,
        tr: { question: "5 + 5 İşleminin\nSonucu Kaçtır?", left: "10", right: "20" },
        en: { question: "What is the Result\nof 5 + 5?", left: "10", right: "20" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 12,
        tr: { question: "Aşağıdakilerden Hangisi\nBir Evcil Hayvandır?", left: "KEDİ", right: "ASLAN" },
        en: { question: "Which One is a\nDomestic Pet?", left: "CAT", right: "LION" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 13,
        tr: { question: "Ateşe Dokunulduğunda\nNasıldır?", left: "SICAKTIR", right: "SOĞUKTUR" },
        en: { question: "How Does Fire Feel\nWhen Touched?", left: "HOT", right: "COLD" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 14,
        tr: { question: "İnsanlar Yaşamak İçin\nNe Solur?", left: "OKSİJEN", right: "KARBON" },
        en: { question: "What Gas Do Humans\nBreathe to Survive?", left: "OXYGEN", right: "CARBON" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 15,
        tr: { question: "Aşağıdakilerden Hangisi\nBir Renktir?", left: "KIRMIZI", right: "TAŞ" },
        en: { question: "Which One of These\nis a Color?", left: "RED", right: "STONE" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 16,
        tr: { question: "Gece Gökyüzünde Parlayan\nNesneler Nedir?", left: "YILDIZLAR", right: "BULUTLAR" },
        en: { question: "What Are the Glowing Objects\nin Night Sky?", left: "STARS", right: "CLOUDS" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 17,
        tr: { question: "Bir Üçgenin Kaç Tane\nKenarı Vardır?", left: "3 KENAR", right: "4 KENAR" },
        en: { question: "How Many Sides Does\na Triangle Have?", left: "3 SIDES", right: "4 SIDES" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 18,
        tr: { question: "Şekerin Tadı Genelde\nNasıldır?", left: "TATLIDIR", right: "TUZLUDUR" },
        en: { question: "How Does Sugar\nUsually Taste?", left: "SWEET", right: "SALTY" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 19,
        tr: { question: "Balıklar Doğal Olarak\nNerede Yaşar?", left: "SUDA", right: "AĞAÇTA" },
        en: { question: "Where Do Fish Live\nNaturally?", left: "IN WATER", right: "IN TREES" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 20,
        tr: { question: "Bir Elimizde Normalde Kaç\nParmak Vardır?", left: "5 PARMAK", right: "8 PARMAK" },
        en: { question: "How Many Fingers on\na Normal Human Hand?", left: "5 FINGERS", right: "8 FINGERS" },
        isLeftCorrect: true, isRightCorrect: false
    }
];

// 2. MEDIUM QUESTION POOL (20 QUESTIONS)
const mediumQuestionPool = [
    {
        id: 1,
        tr: { question: "Sıradaki Sayı Hangisidir?\n(2, 6, 12, 20, ?)", left: "30", right: "28" },
        en: { question: "What is the Next Number?\n(2, 6, 12, 20, ?)", left: "30", right: "28" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 2,
        tr: { question: "Hangi Sesi Gece Duysan\nDaha Çok Korkarsın?", left: "ÇIĞLIK", right: "FISILTI" },
        en: { question: "Which Sound Scares You\nMore At Night?", left: "SCREAM", right: "WHISPER" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 3,
        tr: { question: "Dünyanın En Çok Konuşulan\nAnadili Hangisidir?", left: "ÇİNCEDİR", right: "İNGİLİZCEDİR" },
        en: { question: "What is the Most Spoken\nNative Language?", left: "CHINESE", right: "ENGLISH" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 4,
        tr: { question: "İnsanlığın Ay'a İlk Ayak\nBastığı Uzay Görevi?", left: "APOLLO 11", right: "SPUTNIK 1" },
        en: { question: "First Manned Moon\nLanding Mission?", left: "APOLLO 11", right: "SPUTNIK 1" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 5,
        tr: { question: "Güneş Sisteminin En Sıcak\nGezegeni Hangisidir?", left: "VENÜS", right: "MERKÜR" },
        en: { question: "Which Planet is the Hottest\nin the Solar System?", left: "VENUS", right: "MERCURY" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 6,
        tr: { question: "Olimpiyat Halkalarında\nKaç Renk Vardır?", left: "5 RENK", right: "6 RENK" },
        en: { question: "How Many Colors Are In\nThe Olympic Rings?", left: "5 COLORS", right: "6 COLORS" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 7,
        tr: { question: "Işık Hızı Yaklaşık Kaç\nKm/Saniyedir?", left: "300.000 KM/S", right: "460.000 KM/S" },
        en: { question: "Approximate Speed of Light\nin Km/Second?", left: "300,000 KM/S", right: "460,000 KM/S" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 8,
        tr: { question: "Dünyanın En Uzun Nehri\nHangi Nehirdir?", left: "NİL NEHRİ", right: "AMAZON NEHRİ" },
        en: { question: "What is the Longest\nRiver in the World?", left: "NILE RIVER", right: "AMAZON RIVER" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 9,
        tr: { question: "Aşağıdaki Sayılardan\nHangisi Daha Büyük?", left: "43", right: "87" },
        en: { question: "Which Number is\nLarger?", left: "43", right: "87" },
        isLeftCorrect: false, isRightCorrect: true
    },
    {
        id: 10,
        tr: { question: "İnsan Kalbinde Kaç Tane\nOdacık Vardır?", left: "4 ODACIK", right: "2 ODACIK" },
        en: { question: "How Many Chambers Are\nIn The Human Heart?", left: "4 CHAMBERS", right: "2 CHAMBERS" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 11,
        tr: { question: "Dünyanın En Büyük\nOkyanusu Hangisidir?", left: "PASİFİK", right: "ATLAS" },
        en: { question: "What is the Largest\nOcean in the World?", left: "PACIFIC", right: "ATLANTIC" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 12,
        tr: { question: "Atom Çekirdeğindeki Pozitif\nYüklü Parçacık?", left: "PROTON", right: "ELEKTRON" },
        en: { question: "Positively Charged Particle\nIn Atom Nucleus?", left: "PROTON", right: "ELECTRON" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 13,
        tr: { question: "Dünyanın En Tehlikeli\nDağı Hangisidir?", left: "EVEREST", right: "K2 DAĞI" },
        en: { question: "What is the Most Dangerous\nMountain in the World?", left: "EVEREST", right: "K2 MOUNTAIN" },
        isLeftCorrect: false, isRightCorrect: true
    },
    {
        id: 14,
        tr: { question: "'Yıldızlı Gece' Tablosu\nHangi Ressama Aittir?", left: "VAN GOGH", right: "PICASSO" },
        en: { question: "Who Painted\n'The Starry Night'?", left: "VAN GOGH", right: "PICASSO" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 15,
        tr: { question: "Dünyanın En Küçük Bağımsız\nÜlkesi Hangisidir?", left: "VATİKAN", right: "MONAKO" },
        en: { question: "What is the Smallest Independent\nCountry in the World?", left: "VATICAN", right: "MONACO" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 16,
        tr: { question: "Dünyanın Denize Kıyısı Olmayan\nEn Büyük Ülkesi?", left: "KAZAKİSTAN", right: "MOĞOLİSTAN" },
        en: { question: "Largest Landlocked Country\nin the World?", left: "KAZAKHSTAN", right: "MONGOLIA" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 17,
        tr: { question: "Hücrede Enerji Üretiminden\nSorumlu Organel?", left: "MİTOKONDRİ", right: "RİBOZOM" },
        en: { question: "Cell Organelle Responsible\nFor Energy Production?", left: "MITOCHONDRIA", right: "RIBOSOME" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 18,
        tr: { question: "Birinci Dünya Savaşı\nHangi Yılda Başlamıştır?", left: "1914", right: "1939" },
        en: { question: "Which Year Did\nWorld War I Start?", left: "1914", right: "1939" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 19,
        tr: { question: "Hangi Kıta Tamamen\nGüney Yarımkürededir?", left: "AVUSTRALYA", right: "AFRİKA" },
        en: { question: "Which Continent is Entirely\nin Southern Hemisphere?", left: "AUSTRALIA", right: "AFRICA" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 20,
        tr: { question: "Periyodik Cetvelde 'Fe'\nHangi Elementtir?", left: "DEMİR", right: "FLOR" },
        en: { question: "What Element Has\nThe Symbol 'Fe'?", left: "IRON", right: "FLUORINE" },
        isLeftCorrect: true, isRightCorrect: false
    }
];

// 3. HARD QUESTION POOL (20 QUESTIONS)
const hardQuestionPool = [
    {
        id: 1,
        tr: { question: "Pi Sayısının Virgülden\nSonraki İlk 3 Basamağı?", left: "141", right: "145" },
        en: { question: "First 3 Decimals of\nPi Number (3.?)", left: "141", right: "145" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 2,
        tr: { question: "Dünyanın En Derin Noktası\nHangi Çukurdur?", left: "MARİANA", right: "PUERTO RİKO" },
        en: { question: "Deepest Point on Earth\nIs Which Trench?", left: "MARIANA", right: "PUERTO RICO" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 3,
        tr: { question: "Mona Lisa Tablosu Hangi\nMüzede Sergilenir?", left: "LOUVRE", right: "PRADO" },
        en: { question: "Which Museum Displays\nthe Mona Lisa?", left: "LOUVRE", right: "PRADO" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 4,
        tr: { question: "Fizikte Mutlak Sıfır\nKaç °C'dir?", left: "-273.15 °C", right: "-100 °C" },
        en: { question: "What is Absolute Zero\nin Celsius?", left: "-273.15 °C", right: "-100 °C" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 5,
        tr: { question: "Sıradaki Asal Sayı\nHangisidir? (13, 17, 19, ?)", left: "23", right: "21" },
        en: { question: "What is the Next Prime?\n(13, 17, 19, ?)", left: "23", right: "21" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 6,
        tr: { question: "Satürn'ün En Büyük Uydusu\nHangisidir?", left: "TITAN", right: "EUROPA" },
        en: { question: "What is the Largest\nMoon of Saturn?", left: "TITAN", right: "EUROPA" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 7,
        tr: { question: "Periyodik Tabloda 'Au'\nHangi Elementtir?", left: "ALTIN", right: "GÜMÜŞ" },
        en: { question: "Which Element Has\nthe Symbol 'Au'?", left: "GOLD", right: "SILVER" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 8,
        tr: { question: "Osmanlı İmparatorluğu'nun\nİlk Padişahı Kimdir?", left: "OSMAN GAZİ", right: "ORHAN GAZİ" },
        en: { question: "Who Was the First Sultan\nof Ottoman Empire?", left: "OSMAN I", right: "ORHAN" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 9,
        tr: { question: "İnsan Vücudundaki En Uzun\nKemik Hangisidir?", left: "UYLUK (FEMUR)", right: "KAVAL (TIBIA)" },
        en: { question: "What is the Longest Bone\nin Human Body?", left: "FEMUR", right: "TIBIA" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 10,
        tr: { question: "Deniz Seviyesinde Ses Hızı\nYaklaşık Kaç m/sn'dir?", left: "343 M/SN", right: "1000 M/SN" },
        en: { question: "Approximate Speed of Sound\nat Sea Level?", left: "343 M/S", right: "1000 M/S" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 11,
        tr: { question: "Güneş Sisteminin En Yoğun\nGezegeni Hangisidir?", left: "DÜNYA", right: "JÜPİTER" },
        en: { question: "Which Planet is the Most\nDense in Solar System?", left: "EARTH", right: "JUPITER" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 12,
        tr: { question: "Dünyanın En Yüksek Kesintisiz\nŞelalesi Hangisidir?", left: "ANGEL ŞELALESİ", right: "NIAGARA" },
        en: { question: "World's Highest Uninterrupted\nWaterfall?", left: "ANGEL FALLS", right: "NIAGARA" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 13,
        tr: { question: "Doğada Bilinen En Sert\nDoğal Madde Nedir?", left: "ELMAS", right: "KUVARS" },
        en: { question: "What is the Hardest Known\nNatural Substance?", left: "DIAMOND", right: "QUARTZ" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 14,
        tr: { question: "İkinci Dünya Savaşı Hangi\nYılda Sona Ermiştir?", left: "1945", right: "1948" },
        en: { question: "Which Year Did World War II\nOfficially End?", left: "1945", right: "1948" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 15,
        tr: { question: "Aşağıdakilerden Hangisi\nBir Asal Sayı Değildir?", left: "91", right: "97" },
        en: { question: "Which Number is NOT\na Prime Number?", left: "91", right: "97" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 16,
        tr: { question: "Işık Yılı Hangi Niceliğin\nÖlçü Birimidir?", left: "MESAFE", right: "ZAMAN" },
        en: { question: "Light Year is a Unit of\nWhich Measurement?", left: "DISTANCE", right: "TIME" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 17,
        tr: { question: "İnsan Vücudunda Kan Şekerini\nDüşüren Hormon?", left: "İNSÜLİN", right: "ADRENALİN" },
        en: { question: "Hormone That Lowers Blood\nGlucose Levels?", left: "INSULIN", right: "ADRENALINE" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 18,
        tr: { question: "Dünyanın En Kalabalık\nNüfuslu Ülkesi Hangisidir?", left: "HİNDİSTAN", right: "ÇİN" },
        en: { question: "Most Populous Country in\nthe World (Current)?", left: "INDIA", right: "CHINA" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 19,
        tr: { question: "Görelilik Kuramını Hangi\nFizikçi Geliştirmiştir?", left: "ALBERT EINSTEIN", right: "ISAAC NEWTON" },
        en: { question: "Who Developed the Theory\nof General Relativity?", left: "ALBERT EINSTEIN", right: "ISAAC NEWTON" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 20,
        tr: { question: "Dünya Atmosferinde En Bol\nBulunan Gaz Hangisidir?", left: "AZOT (%78)", right: "OKSİJEN (%21)" },
        en: { question: "Most Abundant Gas in\nEarth's Atmosphere?", left: "NITROGEN", right: "OXYGEN" },
        isLeftCorrect: true, isRightCorrect: false
    }
];

// 4. ULTIMATE QUESTION POOL (20 EXTREMELY DIFFICULT QUESTIONS)
const ultimateQuestionPool = [
    {
        id: 1,
        tr: { question: "Euler Özdeşliğinde e^(iπ) + 1\nİşleminin Sonucu Kaçtır?", left: "0", right: "1" },
        en: { question: "In Euler's Identity, What is\ne^(iπ) + 1 Equal To?", left: "0", right: "1" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 2,
        tr: { question: "Schrödinger Denklemi Hangi\nFizik Dalının Temelidir?", left: "KUANTUM", right: "GÖRELİLİK" },
        en: { question: "Schrödinger Equation is Foundational\nin Which Field?", left: "QUANTUM", right: "RELATIVITY" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 3,
        tr: { question: "NP-Tam Problemler Hangi\nKarmaşıklık Sınıfındadır?", left: "NP", right: "P" },
        en: { question: "NP-Complete Problems Belong\nto Which Complexity Class?", left: "NP", right: "P" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 4,
        tr: { question: "En Küçük Çift Asal\nSayı Hangisidir?", left: "2", right: "4" },
        en: { question: "What is the Smallest\nEven Prime Number?", left: "2", right: "4" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 5,
        tr: { question: "Kara Deliğin Kaçış Hızının Işık\nHızına Eşit Olduğu Sınır?", left: "OLAY UFKU", right: "TEKİLLİK" },
        en: { question: "Boundary Where Escape Velocity\nEquals Light Speed?", left: "EVENT HORIZON", right: "SINGULARITY" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 6,
        tr: { question: "Termodinamiğin 2. Yasası Hangi\nBüyüklüğün Arttığını Söyler?", left: "ENTROPİ", right: "ENTALPİ" },
        en: { question: "2nd Law of Thermodynamics Says\nWhich Quantity Increases?", left: "ENTROPY", right: "ENTHALPY" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 7,
        tr: { question: "Gödel'in Eksiklik Teoremi Neyi\nKanıtlamıştır?", left: "YETERSİZLİK", right: "TAM TUTARLILIK" },
        en: { question: "What Did Gödel's Incompleteness\nTheorem Prove?", left: "INCOMPLETENESS", right: "FULL CONSISTENCY" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 8,
        tr: { question: "Tek Yüzü ve Tek Kenarı\nOlan Yüzey Hangisidir?", left: "MÖBIUS ŞERİDİ", right: "TORUS" },
        en: { question: "A Surface With Only One\nSide and One Boundary?", left: "MÖBIUS STRIP", right: "TORUS" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 9,
        tr: { question: "RSA Şifreleme Hangisinin\nZorluğuna Dayanır?", left: "ASAL ÇARPAN", right: "AYRIK LOG" },
        en: { question: "RSA Encryption Relies on the\nDifficulty of What?", left: "FACTORIZATION", right: "DISCRETE LOG" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 10,
        tr: { question: "Genel Görelilikte Kütle Çekimi\nNeyin Bükülmesidir?", left: "UZAY-ZAMAN", right: "MANYETİZMA" },
        en: { question: "In General Relativity, Gravity is\nthe Curvature of What?", left: "SPACETIME", right: "MAGNETISM" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 11,
        tr: { question: "Bir Matrisin Tersinin Olması İçin\nDeterminant Ne Olmalıdır?", left: "SIFIR DEĞİL", right: "SIFIR" },
        en: { question: "For a Matrix to be Invertible,\nDeterminant Must Be?", left: "NON-ZERO", right: "ZERO" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 12,
        tr: { question: "Platon'un Mağara Benzetmesi\nHangi Kavramı İşler?", left: "İDEALAR", right: "HEDONİZM" },
        en: { question: "Plato's Allegory of the Cave\nIllustrates Which Concept?", left: "FORMS/IDEAS", right: "HEDONISM" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 13,
        tr: { question: "DNA'da Guanin Karşısına Hangi\nOrganik Baz Gelir?", left: "SİTOZİN", right: "TIMİN" },
        en: { question: "In DNA, Which Base Pairs\nWith Guanine?", left: "CYTOSINE", right: "THYMINE" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 14,
        tr: { question: "Evrenin İvmelenerek Genişlediğini\nGösteren Gizemli Güç?", left: "KARANLIK ENERJİ", right: "NÖTRİNO" },
        en: { question: "Mysterious Force Causing Accelerated\nCosmic Expansion?", left: "DARK ENERGY", right: "NEUTRINO" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 15,
        tr: { question: "Kütle Kazandıran Standart Model\nParçacığı Hangisidir?", left: "HIGGS BOZONU", right: "FOTON" },
        en: { question: "Standard Model Particle That\nImparts Mass?", left: "HIGGS BOSON", right: "PHOTON" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 16,
        tr: { question: "Altın Oran (Phi) Değeri Yaklaşık\nKaçtır?", left: "1.618", right: "2.718" },
        en: { question: "Approximate Value of the\nGolden Ratio (Phi)?", left: "1.618", right: "2.718" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 17,
        tr: { question: "En Kötü Durum Karmaşıklığı\nO(n log n) Olan Sıralama?", left: "MERGE SORT", right: "QUICK SORT" },
        en: { question: "Sorting Algorithm With Worst-Case\nComplexity O(n log n)?", left: "MERGE SORT", right: "QUICK SORT" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 18,
        tr: { question: "Einstein'ın 'Mesafe Kateden Ürkünç\nEylem' Dediği Olgu?", left: "DOLANIKLIK", right: "KIRINIM" },
        en: { question: "What Einstein Called 'Spooky Action\nat a Distance'?", left: "ENTANGLEMENT", right: "DIFFRACTION" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 19,
        tr: { question: "Periyodik Cetveli İlk Defa Düzenleyen\nRus Kimyager Kimdir?", left: "MENDELEYEV", right: "NOBEL" },
        en: { question: "Russian Chemist Who First Created\nthe Periodic Table?", left: "MENDELEEV", right: "NOBEL" },
        isLeftCorrect: true, isRightCorrect: false
    },
    {
        id: 20,
        tr: { question: "Tüm Berberleri Berber Tıraş Ederse\nBerberi Kim Tıraş Eder?", left: "RUSSELL PARADOKSU", right: "FERMAT TEOREMİ" },
        en: { question: "If Barber Shaves All Who Don't,\nWho Shaves Barber?", left: "RUSSELL PARADOX", right: "FERMAT THEOREM" },
        isLeftCorrect: true, isRightCorrect: false
    }
];

// Active pool pointer (defaults to medium pool)
let questionPool = mediumQuestionPool;

function initGame() {
    // 1. Scene & Renderer Setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040305);
    scene.fog = new THREE.FogExp2(0x060508, 0.04);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.rotation.order = 'YXZ'; // Prevents head tilting ("kafa yamulması")
    camera.position.set(0, baseCameraY, 2);

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('webgl-canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.98;

    // 2. Generate Base Textures
    wallTexture = createWallTexture();
    floorTexture = createFloorTexture();
    ceilingTexture = createCeilingTexture();
    doorTexture = createDoorTexture();
    dirtTexture = createDirtFloorTexture();
    wolfFurTexture = createWolfFurTexture();
    pineLeafTexture = createPineLeafTexture();
    dontLookBackTexture = createDontLookBackTexture();
    lavaTexture = createLavaTexture();

    wallTexture.repeat.set(8, 1);
    floorTexture.repeat.set(1, 12);
    ceilingTexture.repeat.set(2, 12);

    // Initialize 12 Classic Painting textures & image file loader
    initPaintingTextures();
    photoDeck = [];
    lastPhotoIndex = -1;

    // 3. Build All 20 Level Stages dynamically with Randomized Questions
    const shuffled = shuffleArray(questionPool);
    activeChoiceRooms = [];
    doors = [];

    for (let i = 0; i < shuffled.length; i++) {
        const corridorZStart = i * -200;
        const corridorZEnd = corridorZStart - 24;
        const choiceRoomZ = corridorZStart - 100;
        const nextCorridorZ = corridorZStart - 200;

        buildCorridor(corridorZStart, 0, corridorZEnd, i + 1, choiceRoomZ);
        buildChoiceRoom(choiceRoomZ, shuffled[i], nextCorridorZ, i + 1);
    }

    // Build 3D Night Forest Environment (Placed at Z = -10000)
    buildNightForestScene(-10000);

    // Build 3D Ending #2 (DONT LOOK BACK) Long Corridor (Placed at Z = -12000)
    buildEnding2Scene(-12000);

    // Build 3D Ending #3 (LAVA Trap) Corridor (Placed at Z = -14000)
    buildEnding3Scene(-14000);

    // 4. Setup Lighting
    setupLighting();


    // 5. Setup Controls & Input Listeners
    setupInputListeners();
    setupTouchControls();
    setupDevConsoleInputListeners();

    // Update Counter HUD
    updateRoomCounterHUD();

    // Window Resize
    window.addEventListener('resize', onWindowResize);

    // Animation Loop
    animate();
}

function updateRoomCounterHUD() {
    const counterEl = document.getElementById('room-counter');
    if (counterEl) {
        const timeStr = getFormattedGameTime();
        counterEl.innerText = `${currentStage} / ${maxStages}   ${timeStr}`;
    }
}

/**
 * Builds a standard Connecting Corridor leading to a door
 */
function buildCorridor(zStart, zCenterOffset, zEnd, stageNum, nextTargetZ) {
    const corridorWidth = 5;
    const corridorHeight = 3.8;
    const actualZStart = (zStart === 0) ? 3.5 : zStart;
    const corridorLength = Math.abs(zEnd - actualZStart);
    const zCenter = actualZStart - corridorLength / 2;

    const wallMat = new THREE.MeshStandardMaterial({ map: wallTexture, roughness: 0.7 });
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTexture, roughness: 0.8 });
    const ceilingMat = new THREE.MeshStandardMaterial({ map: ceilingTexture, roughness: 0.9 });

    // Left & Right Walls
    const wallGeo = new THREE.PlaneGeometry(corridorLength, corridorHeight);
    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-corridorWidth / 2, corridorHeight / 2, zCenter);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.position.set(corridorWidth / 2, corridorHeight / 2, zCenter);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Floor & Ceiling
    const floorGeo = new THREE.PlaneGeometry(corridorWidth, corridorLength);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, 0, zCenter);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const ceiling = new THREE.Mesh(floorGeo, ceilingMat);
    ceiling.position.set(0, corridorHeight, zCenter);
    ceiling.rotation.x = Math.PI / 2;
    scene.add(ceiling);

    // End Wall & Door
    const backWallGeo = new THREE.PlaneGeometry(corridorWidth, corridorHeight);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, corridorHeight / 2, zEnd);
    scene.add(backWall);

    const doorGeo = new THREE.PlaneGeometry(2.2, 3.2);
    const doorMat = new THREE.MeshStandardMaterial({ map: doorTexture, roughness: 0.5, metalness: 0.2 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 1.6, zEnd + 0.05);
    door.castShadow = true;
    scene.add(door);

    doors.push({
        mesh: door,
        isCorridorDoor: true,
        targetZ: nextTargetZ,
        position: door.position.clone()
    });

    // Start Wall (Seals the back of EVERY corridor so no open void is visible looking backward)
    const startWall = new THREE.Mesh(backWallGeo, wallMat);
    startWall.position.set(0, corridorHeight / 2, actualZStart);
    startWall.rotation.y = Math.PI;
    startWall.receiveShadow = true;
    scene.add(startWall);

    // --- 3D Metallic Stage/Floor Plaque Mounted Beside Door (Right Side) ---
    const plaqueMesh = createFloorPlaqueMesh(stageNum);
    plaqueMesh.position.set(1.65, 1.8, zEnd + 0.05);
    scene.add(plaqueMesh);

    // --- 3D Modern Hotel-Style Wall Sconce Lamp Mounted Beside Door (Left Side) ---
    const sconceMesh = createWallSconceMesh();
    sconceMesh.position.set(-1.65, 1.8, zEnd + 0.05);
    scene.add(sconceMesh);

    // --- 3D Framed Painting Placement on Corridor Walls ---
    // Pick 2 photos sequentially from photo deck so all 12 user uploaded PNGs (pic1.png to pic12.png) appear without missing any
    // Photo 1: Left Corridor Wall
    const leftPhotoIdx = getNextPhotoIndex();
    const leftFrame = createFramedPaintingMesh(leftPhotoIdx);
    const leftZ = actualZStart - corridorLength * (0.2 + Math.random() * 0.3);
    const leftY = 1.8 + (Math.random() - 0.5) * 0.3;
    leftFrame.position.set(-corridorWidth / 2 + 0.05, leftY, leftZ);
    leftFrame.rotation.y = Math.PI / 2;
    scene.add(leftFrame);

    // Photo 2: Right Corridor Wall
    const rightPhotoIdx = getNextPhotoIndex();
    const rightFrame = createFramedPaintingMesh(rightPhotoIdx);
    const rightZ = actualZStart - corridorLength * (0.55 + Math.random() * 0.3);
    const rightY = 1.8 + (Math.random() - 0.5) * 0.3;
    rightFrame.position.set(corridorWidth / 2 - 0.05, rightY, rightZ);
    rightFrame.rotation.y = -Math.PI / 2;
    scene.add(rightFrame);
}

/**
 * Builds a Choice Room (T-Junction) with custom chalkboard question & sealed 1-tick darker walls
 */
function buildChoiceRoom(zBase, arg2, arg3, arg4, arg5, arg6, arg7) {
    let questionText, leftText, rightText, isLeftCorrect, isRightCorrect, nextCorridorZ;
    let questionObj = null;

    if (typeof arg2 === 'object' && arg2 !== null) {
        questionObj = arg2;
        nextCorridorZ = arg3;
        const qData = questionObj[currentLanguage] || questionObj['tr'];
        questionText = qData.question;
        leftText = qData.left;
        rightText = qData.right;
        isLeftCorrect = questionObj.isLeftCorrect;
        isRightCorrect = questionObj.isRightCorrect;
    } else {
        questionText = arg2;
        leftText = arg3;
        rightText = arg4;
        isLeftCorrect = arg5;
        isRightCorrect = arg6;
        nextCorridorZ = arg7;
    }

    const group = new THREE.Group();
    group.position.set(0, 0, zBase);

    const corridorWidth = 5;
    const corridorHeight = 3.8;
    const mainDepth = 16;
    const branchLength = 10;
    const stemWallLength = mainDepth - corridorWidth; // 11

    // Choice Room Wall Material - Exactly 1 tick darker (0xcccccc) using same wall texture
    const choiceWallMat = new THREE.MeshStandardMaterial({
        map: wallTexture,
        color: 0xcccccc, // 1 tick darker color tint
        roughness: 0.7
    });
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTexture, roughness: 0.8 });
    const ceilingMat = new THREE.MeshStandardMaterial({ map: ceilingTexture, roughness: 0.9 });

    // Main Hall Floor & Ceiling
    const floorGeo = new THREE.PlaneGeometry(corridorWidth, mainDepth);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, 0, -mainDepth / 2);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    group.add(floor);

    const ceiling = new THREE.Mesh(floorGeo, ceilingMat);
    ceiling.position.set(0, corridorHeight, -mainDepth / 2);
    ceiling.rotation.x = Math.PI / 2;
    group.add(ceiling);

    // 1. Entrance Back Wall at Z = 0 (closes void behind player when entering choice room)
    const entranceWallGeo = new THREE.PlaneGeometry(corridorWidth, corridorHeight);
    const entranceWall = new THREE.Mesh(entranceWallGeo, choiceWallMat);
    entranceWall.position.set(0, corridorHeight / 2, 0);
    entranceWall.rotation.y = Math.PI;
    group.add(entranceWall);

    // 2. Main Hall Stem Left & Right Walls
    const stemWallGeo = new THREE.PlaneGeometry(stemWallLength, corridorHeight);

    const stemLeftWall = new THREE.Mesh(stemWallGeo, choiceWallMat);
    stemLeftWall.position.set(-corridorWidth / 2, corridorHeight / 2, -stemWallLength / 2);
    stemLeftWall.rotation.y = Math.PI / 2;
    stemLeftWall.receiveShadow = true;
    group.add(stemLeftWall);

    const stemRightWall = new THREE.Mesh(stemWallGeo, choiceWallMat);
    stemRightWall.position.set(corridorWidth / 2, corridorHeight / 2, -stemWallLength / 2);
    stemRightWall.rotation.y = -Math.PI / 2;
    stemRightWall.receiveShadow = true;
    group.add(stemRightWall);

    // --- 3D Framed Painting Placement on Choice Room Entrance Stem Walls ---
    const choiceLeftPhotoIdx = getNextPhotoIndex();
    const choiceLeftFrame = createFramedPaintingMesh(choiceLeftPhotoIdx);
    choiceLeftFrame.position.set(-corridorWidth / 2 + 0.05, 1.8, -3.5);
    choiceLeftFrame.rotation.y = Math.PI / 2;
    group.add(choiceLeftFrame);

    const choiceRightPhotoIdx = getNextPhotoIndex();
    const choiceRightFrame = createFramedPaintingMesh(choiceRightPhotoIdx);
    choiceRightFrame.position.set(corridorWidth / 2 - 0.05, 1.8, -7.5);
    choiceRightFrame.rotation.y = -Math.PI / 2;
    group.add(choiceRightFrame);

    // 3. Left Branch (Floor, Ceiling, Back Wall, Front Wall & Door)
    const branchFloorGeo = new THREE.PlaneGeometry(branchLength, corridorWidth);
    const leftBranchFloor = new THREE.Mesh(branchFloorGeo, floorMat);
    leftBranchFloor.position.set(-corridorWidth / 2 - branchLength / 2, 0, -mainDepth + corridorWidth / 2);
    leftBranchFloor.rotation.x = -Math.PI / 2;
    leftBranchFloor.receiveShadow = true;
    group.add(leftBranchFloor);

    const leftBranchCeiling = new THREE.Mesh(branchFloorGeo, ceilingMat);
    leftBranchCeiling.position.set(-corridorWidth / 2 - branchLength / 2, corridorHeight, -mainDepth + corridorWidth / 2);
    leftBranchCeiling.rotation.x = Math.PI / 2;
    group.add(leftBranchCeiling);

    const branchWallGeo = new THREE.PlaneGeometry(branchLength, corridorHeight);

    const leftBranchBackWall = new THREE.Mesh(branchWallGeo, choiceWallMat);
    leftBranchBackWall.position.set(-corridorWidth / 2 - branchLength / 2, corridorHeight / 2, -mainDepth + corridorWidth);
    leftBranchBackWall.rotation.y = Math.PI;
    leftBranchBackWall.receiveShadow = true;
    group.add(leftBranchBackWall);

    const leftBranchFrontWall = new THREE.Mesh(branchWallGeo, choiceWallMat);
    leftBranchFrontWall.position.set(-corridorWidth / 2 - branchLength / 2, corridorHeight / 2, -mainDepth);
    leftBranchFrontWall.receiveShadow = true;
    group.add(leftBranchFrontWall);

    const doorMat = new THREE.MeshStandardMaterial({ map: doorTexture, roughness: 0.5 });
    const doorGeo = new THREE.PlaneGeometry(2.2, 3.2);

    const leftEndWall = new THREE.Mesh(entranceWallGeo, choiceWallMat);
    leftEndWall.position.set(-corridorWidth / 2 - branchLength, corridorHeight / 2, -mainDepth + corridorWidth / 2);
    leftEndWall.rotation.y = Math.PI / 2;
    leftEndWall.receiveShadow = true;
    group.add(leftEndWall);

    const leftDoor = new THREE.Mesh(doorGeo, doorMat);
    leftDoor.position.set(-corridorWidth / 2 - branchLength + 0.05, 1.6, -mainDepth + corridorWidth / 2);
    leftDoor.rotation.y = Math.PI / 2;
    group.add(leftDoor);

    const leftSconce = createWallSconceMesh();
    leftSconce.position.set(-corridorWidth / 2 - branchLength + 0.05, 1.8, -mainDepth + corridorWidth / 2 + 1.65);
    leftSconce.rotation.y = Math.PI / 2;
    group.add(leftSconce);

    // 4. Right Branch (Floor, Ceiling, Back Wall, Front Wall & Door)
    const rightBranchFloor = new THREE.Mesh(branchFloorGeo, floorMat);
    rightBranchFloor.position.set(corridorWidth / 2 + branchLength / 2, 0, -mainDepth + corridorWidth / 2);
    rightBranchFloor.rotation.x = -Math.PI / 2;
    rightBranchFloor.receiveShadow = true;
    group.add(rightBranchFloor);

    const rightBranchCeiling = new THREE.Mesh(branchFloorGeo, ceilingMat);
    rightBranchCeiling.position.set(corridorWidth / 2 + branchLength / 2, corridorHeight, -mainDepth + corridorWidth / 2);
    rightBranchCeiling.rotation.x = Math.PI / 2;
    group.add(rightBranchCeiling);

    const rightBranchBackWall = new THREE.Mesh(branchWallGeo, choiceWallMat);
    rightBranchBackWall.position.set(corridorWidth / 2 + branchLength / 2, corridorHeight / 2, -mainDepth + corridorWidth);
    rightBranchBackWall.rotation.y = Math.PI;
    rightBranchBackWall.receiveShadow = true;
    group.add(rightBranchBackWall);

    const rightBranchFrontWall = new THREE.Mesh(branchWallGeo, choiceWallMat);
    rightBranchFrontWall.position.set(corridorWidth / 2 + branchLength / 2, corridorHeight / 2, -mainDepth);
    rightBranchFrontWall.receiveShadow = true;
    group.add(rightBranchFrontWall);

    const rightEndWall = new THREE.Mesh(entranceWallGeo, choiceWallMat);
    rightEndWall.position.set(corridorWidth / 2 + branchLength, corridorHeight / 2, -mainDepth + corridorWidth / 2);
    rightEndWall.rotation.y = -Math.PI / 2;
    rightEndWall.receiveShadow = true;
    group.add(rightEndWall);

    const rightDoor = new THREE.Mesh(doorGeo, doorMat);
    rightDoor.position.set(corridorWidth / 2 + branchLength - 0.05, 1.6, -mainDepth + corridorWidth / 2);
    rightDoor.rotation.y = -Math.PI / 2;
    group.add(rightDoor);

    const rightSconce = createWallSconceMesh();
    rightSconce.position.set(corridorWidth / 2 + branchLength - 0.05, 1.8, -mainDepth + corridorWidth / 2 - 1.65);
    rightSconce.rotation.y = -Math.PI / 2;
    group.add(rightSconce);

    // Front Wall Chalkboard
    const chalkboardTex = createChalkboardTexture(questionText, leftText, rightText);
    const chalkboardMat = new THREE.MeshStandardMaterial({ map: chalkboardTex, roughness: 0.6 });
    const frontWall = new THREE.Mesh(entranceWallGeo, chalkboardMat);
    frontWall.position.set(0, corridorHeight / 2, -mainDepth);
    group.add(frontWall);

    const leftDoorObj = {
        mesh: leftDoor,
        isChoiceDoor: true,
        isCorrect: isLeftCorrect,
        nextCorridorZ: nextCorridorZ,
        position: leftDoor.position.clone().add(group.position)
    };

    const rightDoorObj = {
        mesh: rightDoor,
        isChoiceDoor: true,
        isCorrect: isRightCorrect,
        nextCorridorZ: nextCorridorZ,
        position: rightDoor.position.clone().add(group.position)
    };

    if (questionObj) {
        activeChoiceRooms.push({
            mesh: frontWall,
            questionData: questionObj,
            leftDoor: leftDoorObj,
            rightDoor: rightDoorObj
        });
    }

    doors.push(leftDoorObj);
    doors.push(rightDoorObj);

    scene.add(group);
}

function resetQuestionSequence() {
    if (activeChoiceRooms.length === 0) return;
    const shuffled = shuffleArray(questionPool);
    activeChoiceRooms.forEach((item, index) => {
        const qObj = shuffled[index % shuffled.length];
        item.questionData = qObj;
        const q = qObj[currentLanguage] || qObj['tr'];
        if (q && item.mesh) {
            const newTex = createChalkboardTexture(q.question, q.left, q.right);
            item.mesh.material.map = newTex;
            item.mesh.material.needsUpdate = true;
        }
        if (item.leftDoor) item.leftDoor.isCorrect = qObj.isLeftCorrect;
        if (item.rightDoor) item.rightDoor.isCorrect = qObj.isRightCorrect;
    });
}

function updateLanguage(lang) {
    currentLanguage = lang;

    // 1. Update Choice Room Chalkboard Textures
    activeChoiceRooms.forEach((item) => {
        if (!item.questionData) return;
        const q = item.questionData[lang] || item.questionData['tr'];
        if (q && item.mesh) {
            const newTex = createChalkboardTexture(q.question, q.left, q.right);
            item.mesh.material.map = newTex;
            item.mesh.material.needsUpdate = true;
        }
    });

    // 2. Update Settings UI labels
    const langLabel = document.getElementById('lang-label');
    const bgmLabel = document.getElementById('bgm-label');
    const sfxLabel = document.getElementById('sfx-label');
    const sensLabel = document.getElementById('sens-label');

    if (langLabel) langLabel.innerText = (lang === 'tr') ? "Dil / Language" : "Language / Dil";
    if (bgmLabel) bgmLabel.innerText = (lang === 'tr') ? "Müzik Sesi (BGM)" : "Music Volume (BGM)";
    if (sfxLabel) sfxLabel.innerText = (lang === 'tr') ? "Efekt Sesi (SFX)" : "Effects Volume (SFX)";
    if (sensLabel) sensLabel.innerText = (lang === 'tr') ? "Fare Hassasiyeti" : "Mouse Sensitivity";
}

/**
 * Builds 3D Night Forest Clearing, Realistic Campfire & Multi-Part Anatomical Wolf 
 */
function buildNightForestScene(zBase) {
    const forestGroup = new THREE.Group();
    forestGroup.position.set(0, 0, zBase);

    // 1. Warm Brown Earth / Dirt Soil Clearing Floor 
    const floorRadius = 16;
    const pathGeo = new THREE.CircleGeometry(floorRadius, 40);
    const pathMat = new THREE.MeshStandardMaterial({ map: dirtTexture, color: 0xa8744d, roughness: 0.92 });
    const pathFloor = new THREE.Mesh(pathGeo, pathMat);
    pathFloor.position.set(0, 0, -12);
    pathFloor.rotation.x = -Math.PI / 2;
    pathFloor.receiveShadow = true;
    forestGroup.add(pathFloor);

    // Black Teleportation / Spawn Spot 
    const spawnSpotGeo = new THREE.CircleGeometry(1.4, 32);
    const spawnSpotMat = new THREE.MeshBasicMaterial({ color: 0x060504, transparent: true, opacity: 0.92 });
    const spawnSpot = new THREE.Mesh(spawnSpotGeo, spawnSpotMat);
    spawnSpot.position.set(0, 0.02, -12); // Player spawns at Z = -12 in forestGroup (World Z = -512)
    spawnSpot.rotation.x = -Math.PI / 2;
    forestGroup.add(spawnSpot);

    // 2. 3D GLOWING MOON IN THE SKY 
    const moonGeo = new THREE.SphereGeometry(2.4, 24, 24);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xfffae0 });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.set(0, 22, -35);
    forestGroup.add(moonMesh);

    // Bright Pale Moonlight Filtering Down with soft shadows
    const moonLight = new THREE.DirectionalLight(0x6084ad, 2.4);
    moonLight.position.set(0, 25, -20);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    forestGroup.add(moonLight);

    // Forest Ambient Fill Light (dynamically activated only inside forest clearing)
    forestAmbient = new THREE.AmbientLight(0x384a60, 0.0);
    forestGroup.add(forestAmbient);

    // 3. 3D CAMPFIRE (KAMP ATEŞİ) - Positioned 2 steps (~2.5m) in front of spawn (Spawn = Z: -512)
    const campfireGroup = new THREE.Group();
    campfireGroup.position.set(0, 0, -14.5);

    // Ring of Campfire Base Stones
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
    const stoneGeo = new THREE.DodecahedronGeometry(0.22, 0);
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const stone = new THREE.Mesh(stoneGeo, stoneMat);
        stone.position.set(Math.cos(angle) * 0.75, 0.08, Math.sin(angle) * 0.75);
        stone.scale.set(1 + Math.random() * 0.3, 0.8 + Math.random() * 0.4, 1 + Math.random() * 0.3);
        campfireGroup.add(stone);
    }

    // Wooden Fire Logs
    const logMat = new THREE.MeshStandardMaterial({ color: 0x1f120a, roughness: 0.85 });
    const logGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.95, 8);
    for (let i = 0; i < 5; i++) {
        const log = new THREE.Mesh(logGeo, logMat);
        const angle = (i / 5) * Math.PI;
        log.position.set(0, 0.15, 0);
        log.rotation.y = angle;
        log.rotation.z = Math.PI / 4;
        campfireGroup.add(log);
    }

    // Glowing Embers Core
    const emberMat = new THREE.MeshStandardMaterial({ color: 0xff3300, emissive: 0xff4400, emissiveIntensity: 1.6 });
    const emberGeo = new THREE.SphereGeometry(0.28, 8, 8);
    const embers = new THREE.Mesh(emberGeo, emberMat);
    embers.position.set(0, 0.1, 0);
    campfireGroup.add(embers);

    // Animated Fire Flame Cones
    const fireMat1 = new THREE.MeshBasicMaterial({ color: 0xff7700, transparent: true, opacity: 0.85 });
    const fireGeo1 = new THREE.ConeGeometry(0.42, 0.95, 7);
    fireMesh1 = new THREE.Mesh(fireGeo1, fireMat1);
    fireMesh1.position.set(0, 0.5, 0);
    campfireGroup.add(fireMesh1);

    const fireMat2 = new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true, opacity: 0.9 });
    const fireGeo2 = new THREE.ConeGeometry(0.26, 0.75, 6);
    fireMesh2 = new THREE.Mesh(fireGeo2, fireMat2);
    fireMesh2.position.set(0, 0.45, 0);
    campfireGroup.add(fireMesh2);

    // Dynamic Campfire Light (Illuminates Surroundings & Casts Shadows)
    campfireLight = new THREE.PointLight(0xff7722, 3.6, 22, 1.5);
    campfireLight.position.set(0, 0.8, 0);
    campfireLight.castShadow = true;
    campfireLight.shadow.bias = -0.002;
    campfireGroup.add(campfireLight);

    campfireLight2 = new THREE.PointLight(0xffaa33, 1.6, 12);
    campfireLight2.position.set(0, 1.2, 0);
    campfireGroup.add(campfireLight2);

    forestGroup.add(campfireGroup);

    // 4. 360-DEGREE DENSE CIRCULAR RING OF REALISTIC PINE TREES (60+ Trees in Double Staggered Rings)
    const treeMat1 = new THREE.MeshStandardMaterial({ map: pineLeafTexture, color: 0x2bb050, roughness: 0.8 });  // Evergreen Green
    const treeMat2 = new THREE.MeshStandardMaterial({ map: pineLeafTexture, color: 0x1e873e, roughness: 0.85 }); // Dark Forest Green
    const treeMat3 = new THREE.MeshStandardMaterial({ map: pineLeafTexture, color: 0x34c45e, roughness: 0.75 }); // Mid Pine Green
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6e4324, roughness: 0.85 }); // Bark Brown

    const totalTrees = 64;
    for (let i = 0; i < totalTrees; i++) {
        const angle = (i / totalTrees) * Math.PI * 2;
        const ring = (i % 2 === 0) ? 1.0 : 2.2;
        const radius = floorRadius + ring + Math.random() * 2.0;
        const tx = Math.cos(angle) * radius;
        const tz = Math.sin(angle) * radius - 12;

        const leafMatChoice = (i % 3 === 0) ? treeMat1 : (i % 3 === 1 ? treeMat2 : treeMat3);
        const heightScale = 0.85 + Math.random() * 0.35; // Realistic height (~6.5m to 8.5m)
        createPineTree(forestGroup, tx, tz, leafMatChoice, trunkMat, heightScale);
    }

    // 5. ANATOMICAL REALISTIC 3D WOLF MESH (Scaled to natural realistic wolf dimensions)
    wolfMeshGroup = new THREE.Group();

    // Primary Wolf Fur Material
    const wolfFurMat = new THREE.MeshStandardMaterial({ map: wolfFurTexture, color: 0xd0d5db, roughness: 0.75 });
    const wolfManeMat = new THREE.MeshStandardMaterial({ color: 0xbfb6aa, roughness: 0.8 }); // Silver-tan neck fluff/chest mane
    const wolfSnoutMat = new THREE.MeshStandardMaterial({ color: 0x222228, roughness: 0.7 }); // Dark snout tip

    // Torso / Ribcage
    const bodyGeo = new THREE.BoxGeometry(1.1, 1.25, 2.3);
    const body = new THREE.Mesh(bodyGeo, wolfFurMat);
    body.position.set(0, 1.2, 0);
    body.castShadow = true;
    wolfMeshGroup.add(body);

    // Fluffy Silver Neck Mane & Shoulder Collar (Per Photo)
    const maneGeo = new THREE.ConeGeometry(0.9, 1.2, 8);
    const mane = new THREE.Mesh(maneGeo, wolfManeMat);
    mane.position.set(0, 1.5, 0.7);
    mane.rotation.x = -Math.PI / 4;
    wolfMeshGroup.add(mane);

    // Head & Muzzle
    const headGeo = new THREE.BoxGeometry(0.85, 0.85, 1.0);
    const head = new THREE.Mesh(headGeo, wolfFurMat);
    head.position.set(0, 1.75, 1.3);
    wolfMeshGroup.add(head);

    // Tapered Muzzle / Snout (Per Photo)
    const snoutGeo = new THREE.ConeGeometry(0.4, 0.9, 6);
    const snout = new THREE.Mesh(snoutGeo, wolfFurMat);
    snout.position.set(0, 1.58, 1.9);
    snout.rotation.x = Math.PI / 2;
    wolfMeshGroup.add(snout);

    // Nose Tip
    const noseGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const nose = new THREE.Mesh(noseGeo, wolfSnoutMat);
    nose.position.set(0, 1.62, 2.32);
    wolfMeshGroup.add(nose);

    // Pointy Ears with Dark Rim (Per Photo)
    const earGeo = new THREE.ConeGeometry(0.22, 0.55, 4);
    const earL = new THREE.Mesh(earGeo, wolfFurMat);
    earL.position.set(-0.32, 2.4, 1.2);
    wolfMeshGroup.add(earL);

    const earR = new THREE.Mesh(earGeo, wolfFurMat);
    earR.position.set(0.32, 2.4, 1.2);
    wolfMeshGroup.add(earR);

    // REALISTIC DARK WOLF EYES 
    const eyeGeo = new THREE.SphereGeometry(0.09, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x24180d, roughness: 0.3 });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x050505 });

    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.24, 1.9, 1.8);
    const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), pupilMat);
    pupilL.position.set(-0.24, 1.9, 1.86);
    wolfMeshGroup.add(eyeL);
    wolfMeshGroup.add(pupilL);

    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.24, 1.9, 1.8);
    const pupilR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), pupilMat);
    pupilR.position.set(0.24, 1.9, 1.86);
    wolfMeshGroup.add(eyeR);
    wolfMeshGroup.add(pupilR);

    // Scale wolf down to natural realistic wolf dimensions 
    wolfMeshGroup.scale.set(0.52, 0.52, 0.52);

    // 4 ARTICULATED LEG PIVOTS (FOR REALISTIC GALLOPING RUN ANIMATION)
    const legThighGeo = new THREE.CylinderGeometry(0.18, 0.13, 0.7, 8);
    const legPawGeo = new THREE.CylinderGeometry(0.13, 0.16, 0.55, 8);

    // Front Left Leg
    wolfLegFL = new THREE.Group();
    wolfLegFL.position.set(-0.42, 1.0, 0.7);
    const thighFL = new THREE.Mesh(legThighGeo, wolfFurMat);
    thighFL.position.y = -0.35;
    const pawFL = new THREE.Mesh(legPawGeo, wolfFurMat);
    pawFL.position.y = -0.8;
    wolfLegFL.add(thighFL);
    wolfLegFL.add(pawFL);
    wolfMeshGroup.add(wolfLegFL);

    // Front Right Leg
    wolfLegFR = new THREE.Group();
    wolfLegFR.position.set(0.42, 1.0, 0.7);
    const thighFR = new THREE.Mesh(legThighGeo, wolfFurMat);
    thighFR.position.y = -0.35;
    const pawFR = new THREE.Mesh(legPawGeo, wolfFurMat);
    pawFR.position.y = -0.8;
    wolfLegFR.add(thighFR);
    wolfLegFR.add(pawFR);
    wolfMeshGroup.add(wolfLegFR);

    // Back Left Leg
    wolfLegBL = new THREE.Group();
    wolfLegBL.position.set(-0.42, 1.0, -0.7);
    const thighBL = new THREE.Mesh(legThighGeo, wolfFurMat);
    thighBL.position.y = -0.35;
    const pawBL = new THREE.Mesh(legPawGeo, wolfFurMat);
    pawBL.position.y = -0.8;
    wolfLegBL.add(thighBL);
    wolfLegBL.add(pawBL);
    wolfMeshGroup.add(wolfLegBL);

    // Back Right Leg
    wolfLegBR = new THREE.Group();
    wolfLegBR.position.set(0.42, 1.0, -0.7);
    const thighBR = new THREE.Mesh(legThighGeo, wolfFurMat);
    thighBR.position.y = -0.35;
    const pawBR = new THREE.Mesh(legPawGeo, wolfFurMat);
    pawBR.position.y = -0.8;
    wolfLegBR.add(thighBR);
    wolfLegBR.add(pawBR);
    wolfMeshGroup.add(wolfLegBR);

    // BUSHY ANGLE TAIL (Per Photo)
    wolfTail = new THREE.Group();
    wolfTail.position.set(0, 1.2, -1.1);
    const tailCone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.1, 8), wolfFurMat);
    tailCone.position.set(0, -0.5, -0.3);
    tailCone.rotation.x = -Math.PI / 4;
    wolfTail.add(tailCone);
    wolfMeshGroup.add(wolfTail);

    // Initial position hidden out of sight behind tree line (Z = -42 in forest group)
    wolfMeshGroup.position.set(0, 0, -42);
    forestGroup.add(wolfMeshGroup);

    scene.add(forestGroup);
}

function createPineTree(group, x, z, leafMat, trunkMat, scale = 1.0) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, 0, z);

    // Distinct Brown Bark Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.35 * scale, 0.5 * scale, 3.2 * scale, 8);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = (1.6 * scale);
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Multi-Tiered Layered Pine Foliage Cones (Realistic height ~6.5m to 8.5m)
    const tiers = 3;
    for (let i = 0; i < tiers; i++) {
        const coneGeo = new THREE.ConeGeometry((2.3 - i * 0.55) * scale, 3.6 * scale, 8);
        const cone = new THREE.Mesh(coneGeo, leafMat);
        cone.position.y = (3.2 + i * 1.9) * scale;
        cone.castShadow = true;
        treeGroup.add(cone);
    }

    group.add(treeGroup);
}

/**
 * Builds Ending #2 Stage: 48m Long Corridor, "DONT LOOK BACK" wall writing & 3D Triangle Entity 
 */
function buildEnding2Scene(zStart) {
    const corridorWidth = 5;
    const corridorHeight = 3.8;
    const corridorLength = 48; // 2x normal corridor length
    const zEnd = zStart - corridorLength;
    const zCenter = zStart - corridorLength / 2;

    const wallMat = new THREE.MeshStandardMaterial({ map: wallTexture, roughness: 0.7 });
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTexture, roughness: 0.8 });
    const ceilingMat = new THREE.MeshStandardMaterial({ map: ceilingTexture, roughness: 0.9 });
    const dontLookBackMat = new THREE.MeshStandardMaterial({ map: dontLookBackTexture, roughness: 0.6 });

    // Left & Right Walls
    const wallGeo = new THREE.PlaneGeometry(corridorLength, corridorHeight);
    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-corridorWidth / 2, corridorHeight / 2, zCenter);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.position.set(corridorWidth / 2, corridorHeight / 2, zCenter);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Floor & Ceiling
    const floorGeo = new THREE.PlaneGeometry(corridorWidth, corridorLength);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, 0, zCenter);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const ceiling = new THREE.Mesh(floorGeo, ceilingMat);
    ceiling.position.set(0, corridorHeight, zCenter);
    ceiling.rotation.x = Math.PI / 2;
    scene.add(ceiling);

    // Back Wall with Standard Corridor Wall Texture
    const backWallGeo = new THREE.PlaneGeometry(corridorWidth, corridorHeight);
    ending2TextWallMesh = new THREE.Mesh(backWallGeo, wallMat);
    ending2TextWallMesh.position.set(0, corridorHeight / 2, zEnd);
    scene.add(ending2TextWallMesh);

    // Exit Door
    const doorGeo = new THREE.PlaneGeometry(2.2, 3.2);
    const doorMat = new THREE.MeshStandardMaterial({ map: doorTexture, roughness: 0.5 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 1.6, zEnd + 0.05);
    scene.add(door);

    ending2DoorObj = {
        mesh: door,
        isCorridorDoor: true,
        targetZ: -100, // Move to next stage
        position: door.position.clone()
    };
    doors.push(ending2DoorObj);

    // Lights on first half of corridor only
    const lightPositions = [zStart - 8, zStart - 18, zStart - 26];
    lightPositions.forEach((z, idx) => {
        createCeilingFixture(0, 3.65, z, 500 + idx);
    });

    // Dark end pointlight (initially intensity = 0)
    ending2EndLight = new THREE.PointLight(0xdbeaff, 0, 16);
    ending2EndLight.position.set(0, 3.2, zEnd + 6);
    scene.add(ending2EndLight);

    // 3D TRIANGLE ENTITY 
    triangleEntityGroup = new THREE.Group();

    // Black Pyramid / Cone Body
    const pyramidGeo = new THREE.ConeGeometry(1.6, 2.7, 3); // 3 sides = triangle pyramid
    const pyramidMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.95 });
    const pyramid = new THREE.Mesh(pyramidGeo, pyramidMat);
    pyramid.position.set(0, 1.35, 0);
    pyramid.rotation.y = Math.PI;
    triangleEntityGroup.add(pyramid);

    // 2 GLOWING WHITE RING EYES 
    const ringGeo = new THREE.TorusGeometry(0.18, 0.035, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const ringL = new THREE.Mesh(ringGeo, ringMat);
    ringL.position.set(-0.35, 1.45, 0.45);
    ringL.rotation.y = Math.PI;
    triangleEntityGroup.add(ringL);

    const ringR = new THREE.Mesh(ringGeo, ringMat);
    ringR.position.set(0.35, 1.45, 0.45);
    ringR.rotation.y = Math.PI;
    triangleEntityGroup.add(ringR);

    // Initially hidden
    triangleEntityGroup.visible = false;
    scene.add(triangleEntityGroup);
}

/**
 * Builds Ending #3 Stage: LAVA Trap Corridor with animated rising molten magma plane & flickering light
 */
function buildEnding3Scene(zStart) {
    const corridorWidth = 5;
    const corridorHeight = 3.8;
    const corridorLength = 24;
    const zEnd = zStart - corridorLength;
    const zCenter = zStart - corridorLength / 2;

    const wallMat = new THREE.MeshStandardMaterial({ map: wallTexture, roughness: 0.7 });
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTexture, roughness: 0.8 });
    const ceilingMat = new THREE.MeshStandardMaterial({ map: ceilingTexture, roughness: 0.9 });

    // Left & Right Walls
    const wallGeo = new THREE.PlaneGeometry(corridorLength, corridorHeight);
    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-corridorWidth / 2, corridorHeight / 2, zCenter);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.position.set(corridorWidth / 2, corridorHeight / 2, zCenter);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Sub-Floor & Ceiling
    const floorGeo = new THREE.PlaneGeometry(corridorWidth, corridorLength);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, 0, zCenter);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const ceiling = new THREE.Mesh(floorGeo, ceilingMat);
    ceiling.position.set(0, corridorHeight, zCenter);
    ceiling.rotation.x = Math.PI / 2;
    scene.add(ceiling);

    // End Wall
    const backWallGeo = new THREE.PlaneGeometry(corridorWidth, corridorHeight);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, corridorHeight / 2, zEnd);
    scene.add(backWall);

    // RISING ANIMATED LAVA PLANE (Molten Magma)
    const lavaMat = new THREE.MeshStandardMaterial({
        map: lavaTexture,
        roughness: 0.35,
        emissive: 0xff3300,
        emissiveIntensity: 0.80
    });
    lavaMesh = new THREE.Mesh(new THREE.PlaneGeometry(corridorWidth, corridorLength), lavaMat);
    lavaY = -0.45;
    lavaMesh.position.set(0, lavaY, zCenter);
    lavaMesh.rotation.x = -Math.PI / 2;
    scene.add(lavaMesh);

    // Dynamic Magma Point Light (Casts warm glowing orange light on walls/ceiling)
    lavaLight = new THREE.PointLight(0xff5500, 3.8, 20);
    lavaLight.position.set(0, 0.4, zCenter);
    scene.add(lavaLight);

    // Ceiling fixtures
    createCeilingFixture(0, 3.65, zStart - 6, 701);
    createCeilingFixture(0, 3.65, zStart - 18, 702);
}

/**
 * Builds Ending #4 Stage: Massive 200m x 200m Textured Minecraft Open World Map
 * (All lights & meshes are isolated inside ending4Group so they NEVER bleed into Main Menu or corridors!)
 */
function buildEnding4Scene(zStart) {
    ending4Group = new THREE.Group();
    const worldSize = 200; // 200m x 200m huge Minecraft map!
    const zCenter = zStart - worldSize / 2; // Z = -18100 center

    // Realistic Sky Dome with Soft Procedural Clouds & Golden Sun
    const skyTex = generateSkyCloudTexture();
    const skyGeo = new THREE.SphereGeometry(220, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false });
    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    skyDome.position.set(0, 0, zCenter);
    ending4Group.add(skyDome);

    // Dedicated Outdoor Sun & Hemisphere Sky Lights (Attached ONLY to ending4Group!)
    const mapHemiLight = new THREE.HemisphereLight(0x7ec0ee, 0x55a044, 2.8);
    mapHemiLight.position.set(0, 150, zCenter);
    ending4Group.add(mapHemiLight);

    const mapSunLight = new THREE.DirectionalLight(0xfff8ee, 3.2);
    mapSunLight.position.set(0, 150, zCenter);
    ending4Group.add(mapSunLight);

    const mapSunAngle = new THREE.DirectionalLight(0xfffae6, 2.0);
    mapSunAngle.position.set(80, 100, zCenter + 50);
    ending4Group.add(mapSunAngle);

    const mapSkyLight = new THREE.DirectionalLight(0x9bd0ff, 1.6);
    mapSkyLight.position.set(-80, 80, zCenter - 50);
    ending4Group.add(mapSkyLight);

    // High Quality Procedural Minecraft Grass Ground Plane with Dirt & Flower Noise Texture
    const grassTex = generateMinecraftGrassTexture();
    const grassMat = new THREE.MeshStandardMaterial({
        map: grassTex,
        roughness: 0.6,
        metalness: 0.0,
        emissive: 0x336622,
        emissiveIntensity: 0.40 // Self-illuminates grass so it is 100% bright, radiant, and sunny everywhere!
    });
    const groundGeo = new THREE.PlaneGeometry(worldSize, worldSize);
    const ground = new THREE.Mesh(groundGeo, grassMat);
    ground.position.set(0, 0, zCenter);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ending4Group.add(ground);

    // Boundary Walls so player stays inside the 200m x 200m map
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x448833, roughness: 0.9 });
    const bWallGeo = new THREE.PlaneGeometry(worldSize, 25);

    const wallNorth = new THREE.Mesh(bWallGeo, wallMat);
    wallNorth.position.set(0, 12.5, zStart);
    wallNorth.rotation.y = Math.PI;
    ending4Group.add(wallNorth);

    const wallSouth = new THREE.Mesh(bWallGeo, wallMat);
    wallSouth.position.set(0, 12.5, zStart - worldSize);
    ending4Group.add(wallSouth);

    const wallEast = new THREE.Mesh(bWallGeo, wallMat);
    wallEast.position.set(worldSize / 2, 12.5, zCenter);
    wallEast.rotation.y = -Math.PI / 2;
    ending4Group.add(wallEast);

    const wallWest = new THREE.Mesh(bWallGeo, wallMat);
    wallWest.position.set(-worldSize / 2, 12.5, zCenter);
    wallWest.rotation.y = Math.PI / 2;
    ending4Group.add(wallWest);

    // 55+ Scatter Blocky Minecraft Oak Trees across the 200m map
    for (let i = 0; i < 55; i++) {
        const tree = createMinecraftTreeMesh();
        const rx = (Math.random() - 0.5) * 180;
        const rz = zCenter + (Math.random() - 0.5) * 180;
        if (Math.abs(rx) > 8 || Math.abs(rz - (zStart - 10)) > 8) {
            tree.position.set(rx, 0, rz);
            ending4Group.add(tree);
        }
    }

    // 8 Blocky Minecraft Village Houses
    const houseCoords = [
        [-25, zCenter + 30],
        [35, zCenter + 45],
        [-45, zCenter - 20],
        [50, zCenter - 30],
        [-20, zCenter - 60],
        [25, zCenter - 70],
        [-35, zCenter + 75],
        [40, zCenter - 85]
    ];
    houseCoords.forEach(([hx, hz]) => {
        const house = createMinecraftHouseMesh();
        house.position.set(hx, 0, hz);
        house.rotation.y = Math.random() * Math.PI;
        ending4Group.add(house);
    });

    // 120+ 3D Grass Tufts & Plants Scattered Randomly
    for (let g = 0; g < 130; g++) {
        const tuft = createPlantTuftMesh();
        const gx = (Math.random() - 0.5) * 184;
        const gz = zCenter + (Math.random() - 0.5) * 184;
        tuft.position.set(gx, 0, gz);
        const s = 0.7 + Math.random() * 0.6;
        tuft.scale.set(s, s, s);
        ending4Group.add(tuft);
    }

    // 60+ Red Poppies & Yellow Dandelions Scattered Randomly
    const flowerColors = [0xff2244, 0xffdd00, 0xffffff, 0xff77aa];
    for (let f = 0; f < 65; f++) {
        const c = flowerColors[f % flowerColors.length];
        const flower = createFlowerMesh(c);
        const fx = (Math.random() - 0.5) * 184;
        const fz = zCenter + (Math.random() - 0.5) * 184;
        flower.position.set(fx, 0, fz);
        ending4Group.add(flower);
    }

    // Initially hidden so sunlight NEVER bleeds into Main Menu or corridors!
    ending4Group.visible = false;
    scene.add(ending4Group);
}

function setupLighting() {
    lights = [];
    let lightIdx = 0;
    for (let stage = 0; stage < 20; stage++) {
        const offset = stage * -200;
        createCeilingFixture(0, 3.65, offset - 3, lightIdx++);
        createCeilingFixture(0, 3.65, offset - 8, lightIdx++);
        createCeilingFixture(0, 3.65, offset - 14, lightIdx++);
        createCeilingFixture(0, 3.65, offset - 20, lightIdx++);
        createCeilingFixture(0, 3.65, offset - 104, lightIdx++);
        createCeilingFixture(0, 3.65, offset - 112, lightIdx++);
    }

    const ambient = new THREE.AmbientLight(0xffeedd, 0.18);
    scene.add(ambient);
}

function createCeilingFixture(x, y, z, index) {
    const lightGroup = new THREE.Group();
    lightGroup.position.set(x, y, z);

    const frameGeo = new THREE.BoxGeometry(2.4, 0.12, 0.4);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 });
    lightGroup.add(new THREE.Mesh(frameGeo, frameMat));

    const tubeGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.1, 12);
    tubeGeo.rotateZ(Math.PI / 2);
    const tubeMat = new THREE.MeshBasicMaterial({ color: 0xfff4ea });

    const tube1 = new THREE.Mesh(tubeGeo, tubeMat);
    tube1.position.set(0, -0.06, -0.1);
    lightGroup.add(tube1);

    const tube2 = new THREE.Mesh(tubeGeo, tubeMat);
    tube2.position.set(0, -0.06, 0.1);
    lightGroup.add(tube2);

    const light = new THREE.PointLight(0xfff4ea, 1.5, 9.2, 2.0);
    light.position.set(0, -0.2, 0);
    lightGroup.add(light);

    scene.add(lightGroup);
    lights.push({ light: light, tubeMat: tubeMat, baseIntensity: 1.5, index: index });
}

function setupInputListeners() {
    const canvas = document.getElementById('webgl-canvas');

    window.addEventListener('keydown', (e) => {
        // If we're rebinding a key, let the rebind listener handle it
        if (rebindingButton) return;

        // Toggle Sleek Grey Developer Console when pressing the key under Esc (Backquote / " / é / ° / ^)
        if (e.code === 'Backquote' || e.key === '"' || e.key === 'é' || e.key === '`' || e.key === '°' || e.key === '^') {
            e.preventDefault();
            toggleDevConsoleModal();
            return;
        }

        if (e.code === 'Escape') {
            const devConsole = document.getElementById('dev-console-modal');
            if (devConsole && !devConsole.classList.contains('hidden')) {
                // Console is open -> Esc does NOTHING to console and does not toggle pause menu
                return;
            }
            togglePause();
            return;
        }

        if (isMainMenuActive || isPaused || isTransitioning || isCutsceneActive) return;

        if (e.code in keys) keys[e.code] = true;
        gameAudio.init();

        if (e.code === keyBindings.interact && activePromptDoor) {
            triggerDoorTransition(activePromptDoor);
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code in keys) keys[e.code] = false;
    });

    window.addEventListener('mousedown', (e) => {
        if (isMainMenuActive || isPaused || isTransitioning || isCutsceneActive) return;
        gameAudio.init();
        if (e.button === 2) {
            isRightMouseDown = true;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        }
    });

    window.addEventListener('mouseup', (e) => {
        if (e.button === 2) isRightMouseDown = false;
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('mousemove', (e) => {
        if (isMainMenuActive || isPaused || isTransitioning) return;

        if (isRightMouseDown) {
            let dx = (e.movementX !== undefined && e.movementX !== 0) ? e.movementX : (e.clientX - lastMouseX);
            let dy = (e.movementY !== undefined && e.movementY !== 0) ? e.movementY : (e.clientY - lastMouseY);
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;

            // Clamp max single-frame deltas for smooth right-click panning
            dx = Math.max(-35, Math.min(35, dx));
            dy = Math.max(-25, Math.min(25, dy));

            const sensitivity = 0.0028 * mouseSensitivity;
            const euler = new THREE.Euler(0, 0, 0, 'YXZ');
            euler.setFromQuaternion(camera.quaternion);

            euler.y -= dx * sensitivity;
            euler.x -= dy * sensitivity;

            // Clamp pitch angle between -1.25 and 1.25 radians (~71 degrees)
            euler.x = Math.max(-1.25, Math.min(1.25, euler.x));

            camera.quaternion.setFromEuler(euler);
        }
    });

    const victoryBtn = document.getElementById('victory-main-menu-btn');
    if (victoryBtn) {
        const handleVictoryBtn = (e) => {
            if (e && e.cancelable) e.preventDefault();
            executeReturnToMainMenu();
        };
        victoryBtn.addEventListener('click', handleVictoryBtn);
        victoryBtn.addEventListener('touchstart', handleVictoryBtn, { passive: false });
    }

    const secretConsoleBtn = document.getElementById('secret-console-btn');
    if (secretConsoleBtn) {
        let lastTouchTime = 0;
        secretConsoleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (performance.now() - lastTouchTime < 400) return; // Ignore ghost click after touch
            toggleDevConsoleModal();
        });
        secretConsoleBtn.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            if (e.cancelable) e.preventDefault();
            lastTouchTime = performance.now();
            toggleDevConsoleModal();
        }, { passive: false });
    }
}

function setupTouchControls() {
    const joystickContainer = document.getElementById('mobile-joystick-container');
    const joystickKnob = document.getElementById('joystick-knob');
    const joystickSprintRing = document.getElementById('joystick-sprint-ring');
    const mobileInteractBtn = document.getElementById('mobile-interact-btn');

    if (!joystickContainer || !joystickKnob || !mobileInteractBtn) return;

    // --- 1. MOBILE INTERACT BUTTON ---
    const triggerTouchInteract = (e) => {
        if (e && e.cancelable) e.preventDefault();
        mobileInteractBtn.classList.add('active-touch');
        setTimeout(() => mobileInteractBtn.classList.remove('active-touch'), 150);
        gameAudio.init();

        if (activePromptDoor) {
            triggerDoorTransition(activePromptDoor);
        }
    };

    mobileInteractBtn.addEventListener('touchstart', triggerTouchInteract, { passive: false });
    mobileInteractBtn.addEventListener('click', triggerTouchInteract);

    // --- 2. VIRTUAL JOYSTICK & SPRINT THRESHOLD (SHIFT) ---
    const updateJoystickPosition = (clientX, clientY) => {
        const dx = clientX - joystickCenter.x;
        const dy = clientY - joystickCenter.y;
        const dist = Math.hypot(dx, dy);

        const clampedDist = Math.min(dist, joystickMaxRadius);
        const angle = Math.atan2(dy, dx);

        const knobX = Math.cos(angle) * clampedDist;
        const knobY = Math.sin(angle) * clampedDist;

        joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

        // Normalized joystick movement vectors (-1 to 1)
        touchMoveX = knobX / joystickMaxRadius;
        touchMoveY = knobY / joystickMaxRadius;

        // Check Sprint Threshold (Passing inner circle activates Shift)
        if (dist >= joystickSprintThreshold) {
            touchSprinting = true;
            joystickKnob.classList.add('sprinting');
            if (joystickSprintRing) joystickSprintRing.classList.add('sprinting');
        } else {
            touchSprinting = false;
            joystickKnob.classList.remove('sprinting');
            if (joystickSprintRing) joystickSprintRing.classList.remove('sprinting');
        }
    };

    const resetJoystick = () => {
        touchMoveX = 0;
        touchMoveY = 0;
        touchSprinting = false;
        joystickActive = false;
        joystickTouchId = null;
        if (joystickKnob) {
            joystickKnob.style.transform = 'translate(0px, 0px)';
            joystickKnob.classList.remove('sprinting');
        }
        if (joystickSprintRing) {
            joystickSprintRing.classList.remove('sprinting');
        }
    };

    joystickContainer.addEventListener('touchstart', (e) => {
        if (joystickTouchId !== null) return;
        const touch = e.changedTouches[0];
        joystickTouchId = touch.identifier;
        joystickActive = true;

        const rect = joystickContainer.getBoundingClientRect();
        joystickCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };

        updateJoystickPosition(touch.clientX, touch.clientY);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (!joystickActive || joystickTouchId === null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === joystickTouchId) {
                updateJoystickPosition(touch.clientX, touch.clientY);
                break;
            }
        }
    }, { passive: true });

    const handleJoystickTouchEnd = (e) => {
        if (!joystickActive || joystickTouchId === null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === joystickTouchId) {
                resetJoystick();
                break;
            }
        }
    };

    window.addEventListener('touchend', handleJoystickTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleJoystickTouchEnd, { passive: true });

    // --- MOUSE DRAG SUPPORT FOR JOYSTICK ON DESKTOP PC ---
    let isMouseDraggingJoystick = false;

    joystickContainer.addEventListener('mousedown', (e) => {
        isMouseDraggingJoystick = true;
        joystickActive = true;
        const rect = joystickContainer.getBoundingClientRect();
        joystickCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
        updateJoystickPosition(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
        if (isMouseDraggingJoystick) {
            updateJoystickPosition(e.clientX, e.clientY);
        }
    });

    window.addEventListener('mouseup', () => {
        if (isMouseDraggingJoystick) {
            isMouseDraggingJoystick = false;
            resetJoystick();
        }
    });

    // --- 3. TOUCH SCREEN SWIPE TO LOOK AROUND ---
    window.addEventListener('touchstart', (e) => {
        if (isMainMenuActive || isPaused || isTransitioning || isCutsceneActive) return;

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const target = touch.target;

            // Ignore touches on joystick, interact button, settings button or menu UI
            if (target && (target.closest('#mobile-controls') || target.closest('#in-game-settings-btn') || target.closest('#pause-modal') || target.closest('#main-menu') || target.closest('#dev-panel'))) {
                continue;
            }

            if (touchLookTouchId === null) {
                touchLookTouchId = touch.identifier;
                touchLookLastPos = { x: touch.clientX, y: touch.clientY };
                break;
            }
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (isMainMenuActive || isPaused || isTransitioning || touchLookTouchId === null) return;

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === touchLookTouchId) {
                let dx = touch.clientX - touchLookLastPos.x;
                let dy = touch.clientY - touchLookLastPos.y;
                touchLookLastPos = { x: touch.clientX, y: touch.clientY };

                // Filter single-frame touch jump spikes (> 80px)
                if (Math.abs(dx) > 80) dx = 0;
                if (Math.abs(dy) > 80) dy = 0;

                const sensitivity = 0.0028 * mouseSensitivity;
                const euler = new THREE.Euler(0, 0, 0, 'YXZ');
                euler.setFromQuaternion(camera.quaternion);

                euler.y -= dx * sensitivity;
                euler.x -= dy * sensitivity * 0.6; // Soft vertical pitch dampening for thumb comfort

                // Clamp pitch angle between -1.1 and 1.1 radians (~63 degrees)
                euler.x = Math.max(-1.1, Math.min(1.1, euler.x));

                camera.quaternion.setFromEuler(euler);
                break;
            }
        }
    }, { passive: true });

    const handleLookTouchEnd = (e) => {
        if (touchLookTouchId === null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === touchLookTouchId) {
                touchLookTouchId = null;
                break;
            }
        }
    };

    window.addEventListener('touchend', handleLookTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleLookTouchEnd, { passive: true });
}

function updateMovement(delta) {
    if (isMainMenuActive || isPaused || isTransitioning || isCutsceneActive) return;

    // 0. NOCLIP MODE (Free 3D Flying through walls & boundaries)
    if (isNoClipActive) {
        const isSprinting = keys[keyBindings.sprint] || keys.ShiftRight || touchSprinting;
        const flySpeed = isSprinting ? 12.0 : 6.0;

        const flyForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const flyRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);

        if (keys[keyBindings.forward]) camera.position.addScaledVector(flyForward, flySpeed * delta);
        if (keys[keyBindings.backward]) camera.position.addScaledVector(flyForward, -flySpeed * delta);
        if (keys[keyBindings.left]) camera.position.addScaledVector(flyRight, -flySpeed * delta);
        if (keys[keyBindings.right]) camera.position.addScaledVector(flyRight, flySpeed * delta);

        if (touchMoveX !== 0 || touchMoveY !== 0) {
            camera.position.addScaledVector(flyRight, touchMoveX * flySpeed * delta);
            camera.position.addScaledVector(flyForward, -touchMoveY * flySpeed * delta);
        }
        return; // Skip normal wall collision clamping & headbob physics!
    }

    const moveVector = new THREE.Vector3();
    const isSprinting = keys[keyBindings.sprint] || keys.ShiftRight || touchSprinting;
    const speed = isSprinting ? moveSpeedSprint : moveSpeedWalk;

    // Calculate movement directions relative to current camera.quaternion
    const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    forwardDir.y = 0;
    if (forwardDir.lengthSq() > 0) forwardDir.normalize();

    const rightDir = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    rightDir.y = 0;
    if (rightDir.lengthSq() > 0) rightDir.normalize();

    if (keys[keyBindings.forward]) moveVector.add(forwardDir);
    if (keys[keyBindings.backward]) moveVector.sub(forwardDir);
    if (keys[keyBindings.left]) moveVector.sub(rightDir);
    if (keys[keyBindings.right]) moveVector.add(rightDir);

    // Incorporate Touch Joystick movement
    if (touchMoveX !== 0 || touchMoveY !== 0) {
        moveVector.addScaledVector(rightDir, touchMoveX);
        moveVector.addScaledVector(forwardDir, -touchMoveY);
    }

    if (moveVector.lengthSq() > 0) {
        if (moveVector.lengthSq() > 1) {
            moveVector.normalize();
        }

        camera.position.x += moveVector.x * speed * delta;
        camera.position.z += moveVector.z * speed * delta;

        // 1. Corridor Back Wall Collision Clamp (Prevents walking backwards through the back wall of any stage)
        const stageZStart = (currentStage === 1) ? 2.5 : (currentStage - 1) * -200;
        if (camera.position.z > stageZStart) {
            camera.position.z = stageZStart;
        }

        // 2. Choice Rooms & Corridor Bounds Clamping
        if (camera.position.z < -9800 && camera.position.z > -10200) {
            // Night Forest Clearing Circular Bounds
            const distFromCenter = Math.sqrt(camera.position.x * camera.position.x + (camera.position.z + 10012) * (camera.position.z + 10012));
            if (distFromCenter > 11) {
                const angle = Math.atan2(camera.position.z + 10012, camera.position.x);
                camera.position.x = Math.cos(angle) * 11;
                camera.position.z = Math.sin(angle) * 11 - 10012;
            }
        } else if (camera.position.z <= -12000 && camera.position.z >= -12048) {
            // Ending #2 Long Corridor Bounds
            camera.position.x = Math.max(-2.1, Math.min(2.1, camera.position.x));
            camera.position.z = Math.max(-12047, Math.min(-12001, camera.position.z));
        } else if (camera.position.z <= -14000 && camera.position.z >= -14024) {
            // Ending #3 Lava Corridor Bounds
            camera.position.x = Math.max(-2.1, Math.min(2.1, camera.position.x));
            camera.position.z = Math.max(-14023, Math.min(-14001, camera.position.z));
        } else if (camera.position.z <= -18000 && camera.position.z >= -18200) {
            // Ending #4 Minecraft Open World Bounds (200m x 200m)
            camera.position.x = Math.max(-98, Math.min(98, camera.position.x));
            camera.position.z = Math.max(-18198, Math.min(-18002, camera.position.z));
        } else {
            // Check if player is inside any Choice Room (zBase = -100, -300, -500, ..., -3900)
            const roomIndex = Math.round((-camera.position.z - 100) / 200);
            const zBase = -100 - roomIndex * 200;
            const deltaZ = camera.position.z - zBase;

            if (deltaZ <= 0.5 && deltaZ >= -16.5 && Math.abs(camera.position.x) < 14) {
                // Choice Rooms (T-Junctions) Strict Wall Collision Clamping
                // Prevent walking backwards out of choice room entrance
                camera.position.z = Math.min(zBase + 0.5, camera.position.z);
                // Prevent walking past front chalkboard wall
                camera.position.z = Math.max(zBase - 15.5, camera.position.z);

                if (camera.position.z <= (zBase - 10.5)) {
                    // T-Junction Branch Crossbar: Clamp x to stay inside branch end walls (x = +-12.5)
                    camera.position.x = Math.max(-11.8, Math.min(11.8, camera.position.x));
                } else {
                    // T-Junction Stem Hallway: Clamp x to stem side walls (x = +-2.5)
                    camera.position.x = Math.max(-2.1, Math.min(2.1, camera.position.x));
                }
            } else {
                // Standard Corridors
                camera.position.x = Math.max(-2.1, Math.min(2.1, camera.position.x));
            }
        }

        const bobFreq = isSprinting ? 14 : 9;
        headBobTime += delta * bobFreq;
        const bob = Math.sin(headBobTime) * (isSprinting ? 0.065 : 0.035);
        camera.position.y = baseCameraY + bob;

        if (Math.sin(headBobTime) < -0.85) {
            gameAudio.triggerStep(isSprinting);
        }
    } else {
        camera.position.y += (baseCameraY - camera.position.y) * 0.1;
    }
}

/**
 * Checks player position and turn-around angle in Ending #2 corridor
 */
function checkEnding2TurnAround(delta) {
    if (!ending2Active || ending2Triggered || ending2ScareDone) return;

    // If player reaches the dark zone near the end of the 48m corridor (Z <= -12036)
    if (camera.position.z <= -12036 && camera.position.z >= -12048) {
        const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        if (forwardDir.z > 0.4) {
            ending2Triggered = true;

            // Position 3D Triangle Entity directly in front of player's camera view
            const spawnDist = 2.8;
            const targetX = camera.position.x - Math.sin(yaw) * spawnDist;
            const targetZ = camera.position.z - Math.cos(yaw) * spawnDist;

            if (triangleEntityGroup) {
                triangleEntityGroup.position.set(targetX, 0, targetZ);
                triangleEntityGroup.lookAt(camera.position.x, 1.6, camera.position.z);
                triangleEntityGroup.visible = true;
            }

            // Play jumpscare audio & display red scare flash overlay
            gameAudio.playSFX('jumpscare_1');
            document.getElementById('jumpscare-overlay').classList.add('active');

            // Zoom entity rapidly towards player camera for scare duration
            let scareTime = 0;
            const scareInterval = setInterval(() => {
                scareTime += 0.04;
                if (triangleEntityGroup) {
                    triangleEntityGroup.position.x += (camera.position.x - triangleEntityGroup.position.x) * 0.15;
                    triangleEntityGroup.position.z += (camera.position.z - triangleEntityGroup.position.z) * 0.15;
                }
                if (scareTime >= 1.6) {
                    clearInterval(scareInterval);
                    document.getElementById('jumpscare-overlay').classList.remove('active');
                    if (triangleEntityGroup) triangleEntityGroup.visible = false;

                    ending2ScareDone = true;
                    // Do NOT reset currentStage - return player back to current stage progress!
                    setTimeout(() => {
                        ending2Active = false;
                        const returnZ = (currentStage - 1) * -200;
                        fadeToBlackAndMove(returnZ);
                    }, 500);
                }
            }, 40);
        }
    }
}

function updateLighting(time) {
    lights.forEach((item) => {
        let intensity = item.baseIntensity;
        if (Math.random() < 0.003) {
            intensity *= 0.35;
        }

        item.light.intensity = intensity;
        item.tubeMat.color.setHSL(0.58, 0.25, intensity / 2.2);
    });

    // Dynamic Forest Ambient Fill Light (only active inside Night Forest clearing Z < -450)
    if (forestAmbient) {
        if (camera.position.z < -450 && camera.position.z > -590) {
            forestAmbient.intensity = 0.70;
        } else {
            forestAmbient.intensity = 0.0;
        }
    }

    // Dynamic Campfire Flame Flickering & Ember Glow
    if (campfireLight) {
        campfireLight.intensity = 3.2 + Math.sin(time * 14) * 0.45 + (Math.random() - 0.5) * 0.4;
    }
    if (campfireLight2) {
        campfireLight2.intensity = 1.4 + Math.cos(time * 10) * 0.3;
    }
    if (fireMesh1) {
        fireMesh1.scale.set(1 + Math.sin(time * 16) * 0.12, 1 + Math.cos(time * 12) * 0.18, 1 + Math.sin(time * 16) * 0.12);
    }
    if (fireMesh2) {
        fireMesh2.scale.set(1 + Math.cos(time * 18) * 0.15, 1 + Math.sin(time * 14) * 0.2, 1 + Math.cos(time * 18) * 0.15);
    }
}

/**
 * Active Wolf AI Tracking, Gallop Leg Animation & Pounce Attack Chase Logic
 */
function updateWolfAI(delta) {
    if (!isWolfChasing || !wolfMeshGroup) return;

    // Gallop Running Leg Animation (Asynchronous leg pair movement)
    wolfRunCycle += delta * 15.0;
    if (wolfLegFL) wolfLegFL.rotation.x = Math.sin(wolfRunCycle) * 0.75;
    if (wolfLegFR) wolfLegFR.rotation.x = -Math.sin(wolfRunCycle) * 0.75;
    if (wolfLegBL) wolfLegBL.rotation.x = -Math.sin(wolfRunCycle) * 0.75;
    if (wolfLegBR) wolfLegBR.rotation.x = Math.sin(wolfRunCycle) * 0.75;
    if (wolfTail) wolfTail.rotation.z = Math.sin(wolfRunCycle * 0.5) * 0.25;

    const targetPos = camera.position.clone();
    targetPos.y = 0; // Wolf tracks ground position

    const wolfWorldPos = new THREE.Vector3();
    wolfMeshGroup.getWorldPosition(wolfWorldPos);
    const distanceToPlayer = wolfWorldPos.distanceTo(camera.position);

    // Trigger Heavy Galloping Wolf Footsteps (Volume & Pitch scale with proximity)
    wolfStepTimer += delta * 14.0;
    if (wolfStepTimer >= Math.PI) {
        wolfStepTimer = 0;
        gameAudio.triggerWolfStep(distanceToPlayer);
    }

    wolfWorldPos.y = 0;
    const dir = new THREE.Vector3().subVectors(targetPos, wolfWorldPos);

    if (!wolfIsPouncing) {
        if (distanceToPlayer > 2.8) {
            dir.normalize();
            // Wolf runs towards player position
            wolfMeshGroup.position.addScaledVector(dir, wolfSpeed * delta);
            wolfMeshGroup.lookAt(targetPos.x, 0, targetPos.z);
        } else {
            // Close enough! Initiate dramatic pounce / leap attack!
            wolfIsPouncing = true;
            wolfPounceProgress = 0;
        }
    } else {
        // High-speed pounce jump in air towards player camera head!
        wolfPounceProgress += delta * 4.8;
        dir.normalize();
        wolfMeshGroup.position.addScaledVector(dir, (wolfSpeed + 5.5) * delta);

        const leapArcY = Math.sin(Math.min(1.0, wolfPounceProgress) * Math.PI) * 1.8;
        wolfMeshGroup.position.y = leapArcY;
        wolfMeshGroup.lookAt(camera.position.x, camera.position.y, camera.position.z);

        if (wolfPounceProgress >= 0.85 || distanceToPlayer < 0.9) {
            // Wolf hit player! Trigger death jumpscare!
            isWolfChasing = false;
            wolfIsPouncing = false;
            gameAudio.playSFX('wolf_attack');
            document.getElementById('jumpscare-overlay').classList.add('active');

            setTimeout(() => {
                document.getElementById('jumpscare-overlay').classList.remove('active');
                const fadeScreen = document.getElementById('fade-overlay');
                fadeScreen.classList.add('active');

                setTimeout(() => {
                    currentStage = 1;
                    resetQuestionSequence();
                    updateRoomCounterHUD();

                    if (wolfMeshGroup) {
                        wolfMeshGroup.position.set(0, 0, -42);
                        wolfMeshGroup.position.y = 0;
                    }
                    camera.position.set(0, baseCameraY, 2);
                    yaw = 0;
                    pitch = 0;

                    fadeScreen.classList.remove('active');
                }, 800);
            }, 1300);
        }
    }
}

function checkDoorInteraction() {
    if (isMainMenuActive || isTransitioning || isCutsceneActive) return;

    let nearestDoor = null;
    let minDist = 3.6;

    doors.forEach((d) => {
        const dist = camera.position.distanceTo(d.position);
        if (dist < minDist) {
            nearestDoor = d;
        }
    });

    const promptEl = document.getElementById('interaction-prompt');
    const mobileInteractBtn = document.getElementById('mobile-interact-btn');

    if (nearestDoor) {
        activePromptDoor = nearestDoor;
        promptEl.innerText = `[${getKeyDisplayName(keyBindings.interact)}]`;
        promptEl.classList.add('visible');
        if (mobileInteractBtn) mobileInteractBtn.classList.add('prompt-near');
    } else {
        activePromptDoor = null;
        promptEl.classList.remove('visible');
        if (mobileInteractBtn) mobileInteractBtn.classList.remove('prompt-near');
    }
}

function triggerDoorTransition(doorObj) {
    if (isTransitioning || isCutsceneActive) return;

    if (doorObj.isCorridorDoor) {
        if (doorObj === ending2DoorObj) {
            ending2Active = false;
            const targetZ = (currentStage - 1) * -200;
            fadeToBlackAndMove(targetZ);
        } else {
            fadeToBlackAndMove(doorObj.targetZ);
        }
    } else if (doorObj.isChoiceDoor) {
        if (doorObj.isCorrect) {
            if (currentStage >= maxStages) {
                // Reached Stage 15 Victory!
                triggerVictorySequence();
            } else {
                currentStage++;
                updateRoomCounterHUD();
                fadeToBlackAndMove(doorObj.nextCorridorZ);
            }
        } else {
            // Wrong choice! Trigger a random terrifying horror scene animation!
            triggerWrongChoiceEnding();
        }
    }
}

function triggerVictorySequence() {
    isCutsceneActive = true;

    // Release mouse pointer lock so user can click MAIN MENU button
    if (document.exitPointerLock) document.exitPointerLock();

    // Freeze final completed time
    const finalTimeStr = getFormattedGameTime();
    let totalMs = Math.max(0, (performance.now() - gameStartTimeMs) - totalPausedDurationMs);

    // Save or update best record in localStorage if better time!
    checkAndUpdateRecord(gameDifficulty, totalMs, finalTimeStr);

    // Format difficulty capitalized and map class (easy, medium, hard, ultimate)
    const diffClass = gameDifficulty.toLowerCase();
    const formattedDiff = gameDifficulty.charAt(0).toUpperCase() + gameDifficulty.slice(1).toLowerCase();

    // Update Header innerHTML with difficulty color & red time underline
    const victoryHeader = document.getElementById('victory-header-text');
    if (victoryHeader) {
        victoryHeader.innerHTML = `Congratulations, you completed the <span class="diff-highlight ${diffClass}">${formattedDiff}</span> level in <span class="victory-time-underline">${finalTimeStr}</span>.`;
    }

    // Play victory sound (plays victory.mp3)
    if (gameAudio) gameAudio.playVictorySound();

    const fadeScreen = document.getElementById('fade-overlay');
    if (fadeScreen) fadeScreen.classList.add('active');

    setTimeout(() => {
        if (fadeScreen) fadeScreen.classList.remove('active');
        const victoryModal = document.getElementById('victory-modal');
        if (victoryModal) victoryModal.classList.remove('hidden');
    }, 600);
}

function triggerWrongChoiceEnding() {
    const roll = Math.random();
    if (roll < 0.33) {
        triggerEndingWolfAttack(); // 33% Wolf Attack Forest Scene
    } else if (roll < 0.66) {
        devTestEnding2(); // 33% DONT LOOK BACK Entity Scene
    } else {
        devTestEnding3(); // 34% Rising LAVA Trap Scene
    }
}

function fadeToBlackAndMove(targetZ) {
    isTransitioning = true;

    const fadeScreen = document.getElementById('fade-overlay');
    const promptEl = document.getElementById('interaction-prompt');
    promptEl.classList.remove('visible');

    fadeScreen.classList.add('active');

    setTimeout(() => {
        camera.position.set(0, baseCameraY, targetZ);
        resetCameraRotation();

        setTimeout(() => {
            fadeScreen.classList.remove('active');
            isTransitioning = false;
        }, 400);

    }, 800);
}

/**
 * REFINED ENDING #1: Night Forest Wolf Tracking Sequence
 * 1. Teleport to black spot in 3D Night Forest Clearing (Z = -10012).
 * 2. Player can freely walk/sprint & look around for 11 seconds.
 * 3. T = 0s: wolf_1.mp3 plays.
 * 4. T = 5s: wolf_2.mp3 echoes.
 * 5. T = 11s: Wolf emerges from between trees & actively TRACKS & GALLOPS toward player!
 */
function triggerEndingWolfAttack() {
    isCutsceneActive = false; // Allow full player movement during free walk!
    isWolfChasing = false;
    wolfIsPouncing = false;

    const fadeScreen = document.getElementById('fade-overlay');
    const promptEl = document.getElementById('interaction-prompt');
    promptEl.classList.remove('visible');

    fadeScreen.classList.add('active');

    setTimeout(() => {
        // Teleport player to center spawn point in 3D Night Forest Clearing (World Z = -10012)
        camera.position.set(0, baseCameraY, -10012);
        yaw = 0;
        pitch = 0;
        camera.rotation.set(0, 0, 0, 'YXZ');

        // Wolf starts hidden out of sight behind trees (local Z = -42, world Z = -10042)
        if (wolfMeshGroup) {
            wolfMeshGroup.position.set(0, 0, -42);
            wolfMeshGroup.position.y = 0;
        }

        fadeScreen.classList.remove('active');

        // Lock pointer so player can immediately move and look around freely!
        const canvas = document.getElementById('webgl-canvas');
        if (canvas) canvas.requestPointerLock();

        // T = 0s: wolf_1.mp3 plays
        gameAudio.playSFX('wolf_1');

        // T = 5s: wolf_2.mp3 plays
        setTimeout(() => {
            gameAudio.playSFX('wolf_2');
        }, 5000);

        // T = 11s: Wolf emerges from between trees & gallops towards player position!
        setTimeout(() => {
            isWolfChasing = true;
        }, 11000);

    }, 800);
}

let currentDifficulty = 'medium';

function toggleDifficultyMenu() {
    const subMenu = document.getElementById('difficulty-sub-menu');
    const icon = document.getElementById('start-btn-icon');
    if (subMenu) {
        const isHidden = subMenu.classList.contains('hidden');
        if (isHidden) {
            subMenu.classList.remove('hidden');
            if (icon) icon.innerText = '▼';
        } else {
            subMenu.classList.add('hidden');
            if (icon) icon.innerText = '▶';
        }
    }
}

function rebuildLevelQuestions(difficulty = 'medium') {
    currentDifficulty = difficulty;
    let pool = mediumQuestionPool;
    if (difficulty === 'easy') pool = easyQuestionPool;
    else if (difficulty === 'hard') pool = hardQuestionPool;
    else if (difficulty === 'ultimate') pool = ultimateQuestionPool;

    questionPool = pool;
    const shuffled = shuffleArray(pool);

    activeChoiceRooms.forEach((item, index) => {
        const qObj = shuffled[index % shuffled.length];
        item.questionData = qObj;
        const q = qObj[currentLanguage] || qObj['tr'];
        if (q && item.mesh) {
            const newTex = createChalkboardTexture(q.question, q.left, q.right);
            item.mesh.material.map = newTex;
            item.mesh.material.needsUpdate = true;
        }
        if (item.leftDoor) item.leftDoor.isCorrect = qObj.isLeftCorrect;
        if (item.rightDoor) item.rightDoor.isCorrect = qObj.isRightCorrect;
    });
}

// AAA Main Menu & Navigation Functions
function startGameFromMenu(difficulty = 'medium') {
    gameAudio.init();
    isMainMenuActive = false;
    gameDifficulty = difficulty.toUpperCase();

    // Reset game timer
    gameStartTimeMs = performance.now();
    pauseStartTimeMs = 0;
    totalPausedDurationMs = 0;
    currentStage = 1;

    // Apply difficulty question pool
    rebuildLevelQuestions(difficulty);
    updateRoomCounterHUD();

    document.getElementById('main-menu').classList.remove('active');
    document.getElementById('room-counter').classList.remove('hidden');
    document.getElementById('crosshair').classList.remove('hidden');

    const subMenu = document.getElementById('difficulty-sub-menu');
    if (subMenu) subMenu.classList.add('hidden');
    const icon = document.getElementById('start-btn-icon');
    if (icon) icon.innerText = '▼';

    camera.position.set(0, baseCameraY, 2);
    resetCameraRotation();
}

function returnToMainMenu() {
    resumeGame();
    isMainMenuActive = true;

    scene.background = new THREE.Color(0x040305);
    scene.fog = new THREE.FogExp2(0x060508, 0.04);
    camera.far = 100;
    camera.updateProjectionMatrix();

    document.getElementById('main-menu').classList.add('active');
    document.getElementById('room-counter').classList.add('hidden');
    document.getElementById('crosshair').classList.add('hidden');
    document.getElementById('dev-panel').classList.add('hidden');
}

function confirmReturnToMainMenu() {
    document.getElementById('pause-modal').classList.add('active');
    openSubMenu('confirm-mainmenu');
}

function executeReturnToMainMenu() {
    if (document.exitPointerLock) document.exitPointerLock();

    // Smoothly fade out victory music and active SFX when returning to main menu
    if (gameAudio) gameAudio.fadeOutAllAudio(800);

    const victoryModal = document.getElementById('victory-modal');
    if (victoryModal) victoryModal.classList.add('hidden');
    const pauseModal = document.getElementById('pause-modal');
    if (pauseModal) pauseModal.classList.remove('active');

    // Reset player stage, HUD and timer state
    currentStage = 1;
    gameStartTimeMs = 0;
    pauseStartTimeMs = 0;
    totalPausedDurationMs = 0;
    updateRoomCounterHUD();

    // Reset player position and camera angles
    camera.position.set(0, baseCameraY, 2);
    resetCameraRotation();

    // Reset all ending states & AI triggers
    isTransitioning = false;
    isCutsceneActive = false;
    ending2Active = false;
    ending2Triggered = false;
    ending2ScareDone = false;
    ending3Active = false;
    ending3Dying = false;
    lavaY = -0.5;
    isWolfChasing = false;
    wolfIsPouncing = false;

    if (wolfMeshGroup) {
        wolfMeshGroup.position.set(0, 0, -42);
        wolfMeshGroup.position.y = 0;
    }

    // Hide any active overlays
    const fadeScreen = document.getElementById('fade-overlay');
    if (fadeScreen) fadeScreen.classList.remove('active');
    const jumpscare = document.getElementById('jumpscare-overlay');
    if (jumpscare) jumpscare.classList.remove('active');

    // Reset question pool & chalkboard textures
    resetQuestionSequence();

    // Return to main menu UI
    returnToMainMenu();
}

function openMenuHowToPlay() {
    document.getElementById('pause-modal').classList.add('active');
    openSubMenu('how-to-play');
}

function openMenuSettings() {
    document.getElementById('pause-modal').classList.add('active');
    openSubMenu('settings');
}

function openMenuDevPanel() {
    document.getElementById('dev-panel').classList.remove('hidden');
}

function openMenuCredits() {
    document.getElementById('pause-modal').classList.add('active');
    openSubMenu('credits');
}

function closeSubMenu() {
    if (isMainMenuActive) {
        document.getElementById('pause-modal').classList.remove('active');
    } else {
        openSubMenu('main');
    }
}

// Developer Menu Controls & Forest Scene Testing
function toggleDevPanel() {
    const body = document.getElementById('dev-body');
    body.classList.toggle('collapsed');
}

function toggleDevPanelFromMenu() {
    resumeGame();
    document.getElementById('dev-panel').classList.remove('hidden');
}

/**
 * DEV TEST: Forest Scene with 3D Campfire, 11s Free Walk & Wolf Chase
 */
function devTestForestScene() {
    if (isMainMenuActive) {
        isMainMenuActive = false;
        document.getElementById('main-menu').classList.remove('active');
        document.getElementById('room-counter').classList.remove('hidden');
        document.getElementById('crosshair').classList.remove('hidden');
    }
    if (isPaused) resumeGame();
    triggerEndingWolfAttack();
}

/**
 * DEV TEST: Placeholder for Endings #2 to #5
 */
function devTestPlaceholderEnding(endingNum) {
    alert(`Ending #${endingNum} DEV Slot - Ready for implementation when you describe Wrong Choice #${endingNum}!`);
}

/**
 * DEV TEST: Instant Wolf Attack (No 11s delay)
 */
function devTestInstantWolf() {
    if (isMainMenuActive) {
        isMainMenuActive = false;
        document.getElementById('main-menu').classList.remove('active');
        document.getElementById('room-counter').classList.remove('hidden');
        document.getElementById('crosshair').classList.remove('hidden');
    }
    if (isPaused) resumeGame();

    isWolfChasing = true;
    wolfIsPouncing = false;

    const fadeScreen = document.getElementById('fade-overlay');
    fadeScreen.classList.add('active');

    setTimeout(() => {
        camera.position.set(0, baseCameraY, -10012);
        yaw = 0;
        pitch = 0;
        camera.rotation.set(0, 0, 0, 'YXZ');

        if (wolfMeshGroup) {
            wolfMeshGroup.position.set(0, 0, -28);
            wolfMeshGroup.position.y = 0;
        }

        fadeScreen.classList.remove('active');

        const canvas = document.getElementById('webgl-canvas');
        if (canvas) canvas.requestPointerLock();

        gameAudio.playSFX('wolf_1');
    }, 500);
}

function devTestEnding1() {
    devTestForestScene();
}

/**
 * DEV TEST: Ending #2 (DONT LOOK BACK - Non-lethal 3D Triangle Entity Scare)
 */
function devTestEnding2() {
    if (isMainMenuActive) {
        isMainMenuActive = false;
        document.getElementById('main-menu').classList.remove('active');
        document.getElementById('room-counter').classList.remove('hidden');
        document.getElementById('crosshair').classList.remove('hidden');
    }
    if (isPaused) resumeGame();

    ending2Active = true;
    ending2Triggered = false;
    ending2ScareDone = false;
    if (triangleEntityGroup) triangleEntityGroup.visible = false;
    if (ending2EndLight) ending2EndLight.intensity = 0;

    // Reset back wall text material to dontLookBackTexture
    if (ending2TextWallMesh) {
        ending2TextWallMesh.material = new THREE.MeshStandardMaterial({ map: dontLookBackTexture, roughness: 0.6 });
    }

    const fadeScreen = document.getElementById('fade-overlay');
    fadeScreen.classList.add('active');

    setTimeout(() => {
        camera.position.set(0, baseCameraY, -12002); // Start of 48m corridor (zBase = -12000)
        yaw = 0;
        pitch = 0;
        camera.rotation.set(0, 0, 0, 'YXZ');

        fadeScreen.classList.remove('active');
        const canvas = document.getElementById('webgl-canvas');
        if (canvas) canvas.requestPointerLock();
    }, 600);
}

/**
 * Updates Lava rising animation, dynamic radio volume scaling, and player death fall
 */
function updateLavaTrap(delta) {
    if (!ending3Active || ending3Dying) return;

    // 1. Lava rises gradually
    lavaY += delta * 0.16; // Rises at ~0.16m/s
    if (lavaMesh) lavaMesh.position.y = lavaY;
    if (lavaLight) lavaLight.position.y = lavaY + 0.4;

    // Animate lava surface scroll
    if (lavaTexture) lavaTexture.offset.y += delta * 0.08;

    // 2. Radio Audio volume scales from 30% to 100% as lava rises!
    const progress = Math.max(0, Math.min(1.0, (lavaY - (-0.45)) / 2.0));
    const radioVol = 0.3 + progress * 0.7; // 0.30 to 1.00
    gameAudio.setRadioDynamicVolume(radioVol);

    // Flickering magma light
    if (lavaLight) {
        lavaLight.intensity = 3.5 + Math.sin(clock.getElapsedTime() * 12.0) * 0.6;
    }

    // 3. When lava reaches camera height -> Trigger lethal fall & death!
    if (lavaY >= camera.position.y - 0.25 || lavaY >= 1.48) {
        triggerLavaDeath();
    }
}

/**
 * Executes player fall & death animation into lava
 */
function triggerLavaDeath() {
    ending3Dying = true;
    isCutsceneActive = true;

    gameAudio.playSFX('sweep');

    const fadeScreen = document.getElementById('fade-overlay');
    fadeScreen.classList.add('active');

    let fallTime = 0;
    const fallInterval = setInterval(() => {
        fallTime += 0.04;
        // Camera falls downward towards floor into lava & tilts pitch down
        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion(camera.quaternion);
        euler.x = Math.max(-1.3, euler.x - 0.06);
        camera.quaternion.setFromEuler(euler);

        if (fallTime >= 1.4) {
            clearInterval(fallInterval);
            gameAudio.stopRadio();
            fadeScreen.classList.remove('active');

            // Reset game to Stage 1
            currentStage = 1;
            resetQuestionSequence();
            updateRoomCounterHUD();

            ending3Active = false;
            ending3Dying = false;
            isCutsceneActive = false;

            camera.position.set(0, baseCameraY, 2);
            yaw = 0;
            pitch = 0;
        }
    }, 40);
}

/**
 * DEV TEST: Ending #3 (LAVA Trap - Yükselen Lav & Radyo Sesi)
 */
function devTestEnding3() {
    if (isMainMenuActive) {
        isMainMenuActive = false;
        document.getElementById('main-menu').classList.remove('active');
        document.getElementById('room-counter').classList.remove('hidden');
        document.getElementById('crosshair').classList.remove('hidden');
    }
    if (isPaused) resumeGame();

    ending3Active = true;
    ending3Dying = false;
    lavaY = -0.45;

    if (lavaMesh) lavaMesh.position.y = lavaY;
    if (lavaLight) lavaLight.position.y = 0.4;

    const fadeScreen = document.getElementById('fade-overlay');
    fadeScreen.classList.add('active');

    setTimeout(() => {
        camera.position.set(0, baseCameraY, -14002); // Start of Lava Corridor (zBase = -14000)
        yaw = 0;
        pitch = 0;
        camera.rotation.set(0, 0, 0, 'YXZ');

        fadeScreen.classList.remove('active');
        const canvas = document.getElementById('webgl-canvas');
        if (canvas) canvas.requestPointerLock();

        // Start radio audio at 30% volume
        gameAudio.playRadio(0.3);
    }, 600);
}



function devJumpToStage(stageNum) {
    const stage = parseInt(stageNum, 10);
    if (isNaN(stage) || stage < 1 || stage > 15) return;

    currentStage = stage;
    updateRoomCounterHUD();

    if (isMainMenuActive) {
        isMainMenuActive = false;
        document.getElementById('main-menu').classList.remove('active');
        document.getElementById('room-counter').classList.remove('hidden');
        document.getElementById('crosshair').classList.remove('hidden');
    }
    if (isPaused) resumeGame();

    // Teleport camera position directly to that stage corridor start!
    const targetZ = (stage === 1) ? 2 : (stage - 1) * -200 + 2;
    camera.position.set(0, baseCameraY, targetZ);
    resetCameraRotation();
}

function toggleDevConsoleModal() {
    const modal = document.getElementById('dev-console-modal');
    const input = document.getElementById('dev-console-input');
    if (!modal || !input) return;

    if (modal.classList.contains('hidden')) {
        if (document.exitPointerLock) {
            try { document.exitPointerLock(); } catch (e) {}
        }
        input.value = '';
        modal.classList.remove('hidden');
        // Synchronous focus & click to trigger mobile virtual keyboard automatically
        input.focus();
        try { input.click(); } catch (e) {}
    } else {
        modal.classList.add('hidden');
        input.blur();
    }
}

function setupDevConsoleInputListeners() {
    const input = document.getElementById('dev-console-input');
    if (!input) return;

    input.addEventListener('input', () => {
        // Enforce 50 max char limit & filter out any non-alphanumeric/underscore characters
        input.value = input.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 50);
    });

    input.addEventListener('keydown', (e) => {
        // Prevent typing inside console input from moving player with WASD / Shift
        e.stopPropagation();

        // Close console ONLY when pressing the console key under Esc (Backquote / " / é / ° / ^)
        if (e.code === 'Backquote' || e.key === '"' || e.key === 'é' || e.key === '`' || e.key === '°' || e.key === '^') {
            e.preventDefault();
            toggleDevConsoleModal();
            return;
        }

        if (e.key === 'Escape') {
            e.preventDefault();
            // Esc key intentionally does NOT close the console as per user directive!
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            const val = input.value.trim().toLowerCase();

            if (val === 'devtestmenu') {
                document.getElementById('dev-console-modal').classList.add('hidden');
                const devPanel = document.getElementById('dev-panel');
                if (devPanel) {
                    devPanel.classList.toggle('hidden');
                }
            } else if (val === 'noclip1') {
                isNoClipActive = !isNoClipActive;
                document.getElementById('dev-console-modal').classList.add('hidden');
            } else {
                // Silently clear input on wrong/unrecognized command without showing any error or warning!
                input.value = '';
            }
        }
    });
}



function devSimulateWrongDoor() {
    if (isMainMenuActive) {
        isMainMenuActive = false;
        document.getElementById('main-menu').classList.remove('active');
        document.getElementById('room-counter').classList.remove('hidden');
        document.getElementById('crosshair').classList.remove('hidden');
    }
    if (isPaused) resumeGame();
    const roll = Math.random();
    if (roll <= 0.20) {
        triggerEndingWolfAttack();
    } else {
        currentStage = 1;
        updateRoomCounterHUD();
        fadeToBlackAndMove(2);
    }
}

// ==========================================
//  PERSISTENT BEST RECORDS SYSTEM (localStorage)
// ==========================================
const RECORDS_STORAGE_KEY = 'corridor_escape_records_v1';

function getSavedRecords() {
    try {
        const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.error('Failed to load records from localStorage', e);
    }
    return {
        EASY: null,
        MEDIUM: null,
        HARD: null,
        ULTIMATE: null
    };
}

function checkAndUpdateRecord(difficulty, timeMs, timeStr) {
    const records = getSavedRecords();
    const key = (difficulty || 'MEDIUM').toUpperCase();

    const existing = records[key];
    // Save if no record exists OR if new completion time is faster!
    if (!existing || timeMs < existing.timeMs) {
        records[key] = {
            timeMs: timeMs,
            timeStr: timeStr,
            date: new Date().toLocaleDateString()
        };
        try {
            localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
        } catch (e) {
            console.error('Failed to save record to localStorage', e);
        }
        return true;
    }
    return false;
}

function renderRecordsUI() {
    const container = document.getElementById('records-content-container');
    if (!container) return;

    const records = getSavedRecords();
    const difficulties = [
        { key: 'EASY', label: 'EASY', class: 'easy' },
        { key: 'MEDIUM', label: 'MEDIUM', class: 'medium' },
        { key: 'HARD', label: 'HARD', class: 'hard' },
        { key: 'ULTIMATE', label: 'ULTIMATE', class: 'ultimate' }
    ];

    const hasAnyRecord = Object.values(records).some(rec => rec && rec.timeStr);

    if (!hasAnyRecord) {
        container.innerHTML = `
            <div class="records-empty-msg">
                You have no records yet. Complete a game to set a record!
            </div>
        `;
        return;
    }

    let html = '';
    difficulties.forEach(diff => {
        const rec = records[diff.key];
        if (rec && rec.timeStr) {
            html += `
                <div class="record-row">
                    <span class="record-diff-title ${diff.class}">${diff.label}</span>
                    <span class="record-time-val has-record">${rec.timeStr}</span>
                </div>
            `;
        } else {
            html += `
                <div class="record-row">
                    <span class="record-diff-title ${diff.class}">${diff.label}</span>
                    <span class="record-time-val no-record">--:--:--</span>
                </div>
            `;
        }
    });

    container.innerHTML = html;
}

function openMenuRecords() {
    document.getElementById('pause-modal').classList.add('active');
    openSubMenu('records');
}

// Settings & Menu Controls
function openSubMenu(menuName) {
    document.getElementById('pause-main-view').classList.add('hidden');
    document.getElementById('pause-settings-view').classList.add('hidden');
    document.getElementById('pause-credits-view').classList.add('hidden');
    document.getElementById('pause-how-to-play-view').classList.add('hidden');
    const recordsView = document.getElementById('pause-records-view');
    if (recordsView) recordsView.classList.add('hidden');
    const confirmView = document.getElementById('pause-confirm-mainmenu-view');
    if (confirmView) confirmView.classList.add('hidden');
    const controllersView = document.getElementById('pause-controllers-view');
    if (controllersView) controllersView.classList.add('hidden');

    if (menuName === 'main') {
        document.getElementById('pause-main-view').classList.remove('hidden');
    } else if (menuName === 'settings') {
        document.getElementById('pause-settings-view').classList.remove('hidden');
    } else if (menuName === 'credits') {
        document.getElementById('pause-credits-view').classList.remove('hidden');
    } else if (menuName === 'how-to-play') {
        document.getElementById('pause-how-to-play-view').classList.remove('hidden');
    } else if (menuName === 'records') {
        renderRecordsUI();
        if (recordsView) recordsView.classList.remove('hidden');
    } else if (menuName === 'confirm-mainmenu') {
        if (confirmView) confirmView.classList.remove('hidden');
    } else if (menuName === 'controllers') {
        if (controllersView) controllersView.classList.remove('hidden');
    }
}

function updateMobileControlsVisibility() {
    const settingsBtn = document.getElementById('in-game-settings-btn');
    const mobileControls = document.getElementById('mobile-controls');

    const inGameplay = !isMainMenuActive && !isPaused;

    if (settingsBtn) {
        settingsBtn.classList.toggle('hidden', !inGameplay);
    }

    if (mobileControls) {
        mobileControls.classList.toggle('hidden', !(inGameplay && touchUIEnabled));
    }
}

// ==========================================
//  KEYBINDING SYSTEM
// ==========================================
const keyBindings = {
    forward: 'KeyW',
    left: 'KeyA',
    backward: 'KeyS',
    right: 'KeyD',
    sprint: 'ShiftLeft',
    interact: 'KeyE'
};

let rebindingButton = null; // currently listening keybind button

function getKeyDisplayName(code) {
    const map = {
        'KeyW': 'W', 'KeyA': 'A', 'KeyS': 'S', 'KeyD': 'D',
        'KeyE': 'E', 'KeyF': 'F', 'KeyG': 'G', 'KeyH': 'H',
        'KeyI': 'I', 'KeyJ': 'J', 'KeyK': 'K', 'KeyL': 'L',
        'KeyM': 'M', 'KeyN': 'N', 'KeyO': 'O', 'KeyP': 'P',
        'KeyQ': 'Q', 'KeyR': 'R', 'KeyT': 'T', 'KeyU': 'U',
        'KeyV': 'V', 'KeyX': 'X', 'KeyY': 'Y', 'KeyZ': 'Z',
        'Digit0': '0', 'Digit1': '1', 'Digit2': '2', 'Digit3': '3',
        'Digit4': '4', 'Digit5': '5', 'Digit6': '6', 'Digit7': '7',
        'Digit8': '8', 'Digit9': '9',
        'ShiftLeft': 'SHIFT', 'ShiftRight': 'R-SHIFT',
        'ControlLeft': 'CTRL', 'ControlRight': 'R-CTRL',
        'AltLeft': 'ALT', 'AltRight': 'R-ALT',
        'Space': 'SPACE', 'Tab': 'TAB', 'CapsLock': 'CAPS',
        'ArrowUp': '↑', 'ArrowDown': '↓', 'ArrowLeft': '←', 'ArrowRight': '→',
        'Enter': 'ENTER', 'Backspace': 'BKSP',
    };
    return map[code] || code.replace('Key', '').replace('Digit', '');
}

function startRebind(btnElement) {
    if (rebindingButton) {
        rebindingButton.classList.remove('listening');
    }
    rebindingButton = btnElement;
    btnElement.classList.add('listening');
    btnElement.innerText = '...';
}

// Rebind listener — attaches once
window.addEventListener('keydown', function rebindListener(e) {
    if (!rebindingButton) return;

    // Ignore Escape during rebind (cancel)
    if (e.code === 'Escape') {
        const action = rebindingButton.dataset.action;
        rebindingButton.innerText = getKeyDisplayName(action);
        rebindingButton.classList.remove('listening');
        rebindingButton = null;
        return;
    }

    const newCode = e.code;
    const oldAction = rebindingButton.dataset.action;

    // Find which binding this button controls
    for (const [bindName, bindCode] of Object.entries(keyBindings)) {
        if (bindCode === oldAction) {
            keyBindings[bindName] = newCode;
            break;
        }
    }

    rebindingButton.dataset.action = newCode;
    rebindingButton.innerText = getKeyDisplayName(newCode);
    rebindingButton.classList.remove('listening');
    rebindingButton = null;

    // Rebuild the keys object so updateMovement works with new bindings
    rebuildKeysObject();

    e.preventDefault();
    e.stopPropagation();
}, true);

function rebuildKeysObject() {
    // Reset all keys
    for (const k in keys) keys[k] = false;

    // Re-add current binding codes as tracked keys
    for (const [, code] of Object.entries(keyBindings)) {
        keys[code] = false;
    }
    // Always keep ShiftRight for sprint
    keys['ShiftRight'] = false;
}

function resetKeybindings() {
    keyBindings.forward = 'KeyW';
    keyBindings.left = 'KeyA';
    keyBindings.backward = 'KeyS';
    keyBindings.right = 'KeyD';
    keyBindings.sprint = 'ShiftLeft';
    keyBindings.interact = 'KeyE';

    rebuildKeysObject();

    const keysList = document.querySelectorAll('#ctrl-panel-keyboard .keybind-key:not(.disabled)');
    const defaultCodes = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'KeyE'];
    keysList.forEach((btn, idx) => {
        if (defaultCodes[idx]) {
            btn.dataset.action = defaultCodes[idx];
            btn.innerText = getKeyDisplayName(defaultCodes[idx]);
            btn.classList.remove('listening');
        }
    });

    if (rebindingButton) {
        rebindingButton.classList.remove('listening');
        rebindingButton = null;
    }
}

// ==========================================
//  CONTROLLER TAB SWITCHING
// ==========================================
function switchControllerTab(tab) {
    const kbTab = document.getElementById('ctrl-tab-keyboard');
    const mbTab = document.getElementById('ctrl-tab-mobile');
    const kbPanel = document.getElementById('ctrl-panel-keyboard');
    const mbPanel = document.getElementById('ctrl-panel-mobile');

    if (tab === 'keyboard') {
        kbTab.classList.add('active');
        mbTab.classList.remove('active');
        kbPanel.classList.remove('hidden');
        mbPanel.classList.add('hidden');
    } else {
        kbTab.classList.remove('active');
        mbTab.classList.add('active');
        kbPanel.classList.add('hidden');
        mbPanel.classList.remove('hidden');
    }
}

// ==========================================
//  MOBILE SETTINGS: TOUCH UI TOGGLE, OPACITY & SIZE
// ==========================================
let touchUIEnabled = true;
let touchUIOpacity = 0.5;
let touchUISize = 25;

function toggleTouchUI(checked) {
    touchUIEnabled = checked;
    const mobileControls = document.getElementById('mobile-controls');
    if (mobileControls) {
        if (!checked) {
            mobileControls.classList.add('hidden');
        }
    }
}

function updateTouchOpacity(val) {
    touchUIOpacity = parseFloat(val);
    const percent = Math.round(touchUIOpacity * 100);
    const valLabel = document.getElementById('touch-opacity-val');
    if (valLabel) valLabel.innerText = `${percent}%`;

    const mobileControls = document.getElementById('mobile-controls');
    const settingsBtn = document.getElementById('in-game-settings-btn');
    if (mobileControls) mobileControls.style.opacity = touchUIOpacity;
    if (settingsBtn) settingsBtn.style.opacity = touchUIOpacity;
}

function updateTouchSize(val) {
    touchUISize = parseInt(val);
    const valLabel = document.getElementById('touch-size-val');
    if (valLabel) valLabel.innerText = touchUISize;

    const scale = touchUISize / 25;

    const interactBtn = document.getElementById('mobile-interact-btn');
    const joystickContainer = document.getElementById('mobile-joystick-container');
    const settingsBtn = document.getElementById('in-game-settings-btn');

    if (interactBtn) {
        interactBtn.style.transform = `scale(${scale})`;
        interactBtn.style.transformOrigin = 'bottom right';
    }
    if (joystickContainer) {
        joystickContainer.style.transform = `scale(${scale})`;
        joystickContainer.style.transformOrigin = 'bottom left';
    }
    if (settingsBtn) {
        settingsBtn.style.transform = `scale(${scale})`;
        settingsBtn.style.transformOrigin = 'top right';
    }
}

function resetMobileSettings() {
    touchUIEnabled = true;
    touchUIOpacity = 0.7;
    touchUISize = 25;

    const toggleEl = document.getElementById('toggle-touch-ui');
    if (toggleEl) toggleEl.checked = true;

    const opacitySlider = document.getElementById('touch-opacity-slider');
    if (opacitySlider) opacitySlider.value = 0.7;

    const sizeSlider = document.getElementById('touch-size-slider');
    if (sizeSlider) sizeSlider.value = 25;

    updateTouchOpacity(0.7);
    updateTouchSize(25);
    toggleTouchUI(true);
}

function updateBGMVolume(val) {
    gameAudio.setBGMVolume(parseFloat(val));
    document.getElementById('bgm-val').innerText = `${Math.round(val * 100)}%`;
}

function updateSFXVolume(val) {
    gameAudio.setSFXVolume(parseFloat(val));
    document.getElementById('sfx-val').innerText = `${Math.round(val * 100)}%`;
}

function updateSensitivity(val) {
    mouseSensitivity = parseFloat(val);
    document.getElementById('sens-val').innerText = `${val}x`;
}

function togglePause() {
    if (isMainMenuActive || isCutsceneActive) return;

    isPaused = !isPaused;
    const pauseModal = document.getElementById('pause-modal');

    if (isPaused) {
        pauseStartTimeMs = performance.now();
        openSubMenu('main');
        pauseModal.classList.add('active');
    } else {
        if (pauseStartTimeMs > 0) {
            totalPausedDurationMs += (performance.now() - pauseStartTimeMs);
            pauseStartTimeMs = 0;
        }
        pauseModal.classList.remove('active');
    }
}

function resumeGame() {
    if (isPaused && pauseStartTimeMs > 0) {
        totalPausedDurationMs += (performance.now() - pauseStartTimeMs);
        pauseStartTimeMs = 0;
    }
    isPaused = false;
    const pauseModal = document.getElementById('pause-modal');
    if (pauseModal) pauseModal.classList.remove('active');
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

const targetFPS = 60;
const frameInterval = 1000 / targetFPS;
let lastFrameTime = performance.now();

function animate(currentTime) {
    requestAnimationFrame(animate);

    if (!currentTime) currentTime = performance.now();
    const elapsed = currentTime - lastFrameTime;

    // Strict 60 FPS Lock: skip rendering frame if executed under 16.66ms interval
    if (elapsed < frameInterval) {
        return;
    }

    lastFrameTime = currentTime - (elapsed % frameInterval);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // Cinematic 3D Panning Camera when Main Menu is Active
    if (isMainMenuActive) {
        const menuYaw = Math.sin(elapsedTime * 0.12) * 0.25;
        const menuPitch = Math.cos(elapsedTime * 0.18) * 0.04;
        const euler = new THREE.Euler(menuPitch, menuYaw, 0, 'YXZ');
        camera.quaternion.setFromEuler(euler);
        camera.position.x = Math.sin(elapsedTime * 0.1) * 1.2;
        camera.position.z = 2 + Math.cos(elapsedTime * 0.12) * 0.6;
    } else {
        updateMovement(delta);
        updateRoomCounterHUD();
    }

    updateLighting(elapsedTime);
    updateWolfAI(delta);
    checkEnding2TurnAround(delta);
    updateLavaTrap(delta);
    checkDoorInteraction();
    updateMobileControlsVisibility();

    renderer.render(scene, camera);
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
