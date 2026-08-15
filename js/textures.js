// js/textures.js - Procedural Textures matching user's Paint drawings

function createWallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base yellow/tan wallpaper color matching drawing
    ctx.fillStyle = '#e5b367';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grunge gradient
    const grad = ctx.createRadialGradient(512, 512, 100, 512, 512, 700);
    grad.addColorStop(0, 'rgba(255, 235, 180, 0.15)');
    grad.addColorStop(1, 'rgba(100, 60, 20, 0.35)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Paint-style Brown Grid/Crosshatch pattern
    ctx.strokeStyle = 'rgba(145, 85, 45, 0.65)';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';

    const step = 128;
    // Diagonal crosshatch lines like in the paint drawing
    for (let x = -1024; x < 2048; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 1024, 1024);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + 1024, 0);
        ctx.lineTo(x, 1024);
        ctx.stroke();
    }

    // Secondary subtle fine wallpaper lines
    ctx.strokeStyle = 'rgba(110, 60, 25, 0.3)';
    ctx.lineWidth = 6;
    for (let y = 0; y <= canvas.height; y += 64) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Add noise detail for quality wall texture feel
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 16;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

function createFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Outer brown floorboards (Dark wood)
    ctx.fillStyle = '#4a2f1d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Floorboard seams
    ctx.fillStyle = '#2b190e';
    for (let y = 0; y < canvas.height; y += 128) {
        ctx.fillRect(0, y, canvas.width, 6);
    }
    for (let x = 0; x < canvas.width; x += 256) {
        ctx.fillRect(x, 0, 6, canvas.height);
    }

    // Center Orange/Brown Carpet Runner (as depicted in the drawing)
    const runnerWidth = 600;
    const runnerX = (canvas.width - runnerWidth) / 2;

    // Carpet Base
    ctx.fillStyle = '#cc6324';
    ctx.fillRect(runnerX, 0, runnerWidth, canvas.height);

    // Carpet Fringe / Edges
    ctx.fillStyle = '#e88938';
    ctx.fillRect(runnerX, 0, 24, canvas.height);
    ctx.fillRect(runnerX + runnerWidth - 24, 0, 24, canvas.height);

    // Carpet organic scribbly weave pattern matching user's drawing
    ctx.strokeStyle = 'rgba(230, 130, 40, 0.4)';
    ctx.lineWidth = 5;
    for (let i = 0; i < 40; i++) {
        ctx.beginPath();
        let startY = (i * 30) % canvas.height;
        ctx.moveTo(runnerX + 30, startY);
        ctx.bezierCurveTo(
            runnerX + 200, startY + 50,
            runnerX + 400, startY - 30,
            runnerX + runnerWidth - 30, startY + 20
        );
        ctx.stroke();
    }

    // Noise for carpet texture
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 20;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

function createCeilingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Grey ceiling color matching drawing
    ctx.fillStyle = '#6b7278';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines for ceiling panels
    ctx.strokeStyle = '#484e54';
    ctx.lineWidth = 8;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    ctx.strokeRect(canvas.width / 2, 0, canvas.width / 2, canvas.height);
    ctx.strokeRect(0, canvas.height / 2, canvas.width, canvas.height / 2);

    // Grunge texture
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 15;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

function createDoorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Rich Dark Wooden Door Base
    ctx.fillStyle = '#3d2314';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Door Frame border
    ctx.fillStyle = '#26140a';
    ctx.fillRect(0, 0, 30, canvas.height);
    ctx.fillRect(canvas.width - 30, 0, 30, canvas.height);
    ctx.fillRect(0, 0, canvas.width, 30);

    // Door Panels (Inlaid Rectangles)
    ctx.fillStyle = '#4f2e1b';
    ctx.strokeStyle = '#1d0e06';
    ctx.lineWidth = 12;

    // Top Panel
    ctx.fillRect(60, 60, 392, 400);
    ctx.strokeRect(60, 60, 392, 400);

    // Bottom Panel
    ctx.fillRect(60, 520, 392, 440);
    ctx.strokeRect(60, 520, 392, 440);

    // Brass Handle Plate & Knob
    ctx.fillStyle = '#c49d45';
    ctx.fillRect(400, 500, 40, 100);
    ctx.fillStyle = '#e0bd60';
    ctx.beginPath();
    ctx.arc(420, 530, 14, 0, Math.PI * 2);
    ctx.fill();

    // Keyhole
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(420, 570, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(418, 570, 4, 12);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

/**
 * Stage 2 Front Wall Texture Generator (Matching 2nd Paint drawing)
 * Features: Dark burgundy background, auto-centered text/questions, chalk-style arrows, and left/right labels
 */
function createChalkboardTexture(mainText = "GO TO RIGHT", leftText = "YES", rightText = "NO") {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Dark Maroon / Burgundy Wall Background matching Paint Drawing
    ctx.fillStyle = '#22080c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Wood / Metal Trim Frame around wall
    ctx.strokeStyle = '#3a2024';
    ctx.lineWidth = 24;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Subtle Chalkboard Texture Noise
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 14;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // 1. AUTO-CENTERED MAIN TEXT / QUESTION AT TOP
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e8d5cc'; // Off-white chalk color
    ctx.font = 'bold 54px "Courier New", monospace';

    // Support multiline text if containing '\n'
    const lines = mainText.split('\n');
    const startY = 320 - ((lines.length - 1) * 35);
    lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, startY + (index * 70));
    });

    // 2. DRAW CHALK ARROWS (Darker Burgundy fill with thin red outline, reduced size)
    ctx.fillStyle = '#1a060a'; // Darker bordo/burgundy than wall (#22080c)
    ctx.strokeStyle = '#ff2222'; // Vibrant thin red outline for high visibility
    ctx.lineWidth = 5;

    // LEFT ARROW (<--) - Scaled ~60% (Compact Size)
    ctx.beginPath();
    ctx.moveTo(302, 568);
    ctx.lineTo(242, 568);
    ctx.lineTo(242, 544);
    ctx.lineTo(188, 580);
    ctx.lineTo(242, 616);
    ctx.lineTo(242, 592);
    ctx.lineTo(302, 592);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // RIGHT ARROW (-->) - Scaled ~60% (Compact Size)
    ctx.beginPath();
    ctx.moveTo(722, 568);
    ctx.lineTo(782, 568);
    ctx.lineTo(782, 544);
    ctx.lineTo(836, 580);
    ctx.lineTo(782, 616);
    ctx.lineTo(782, 592);
    ctx.lineTo(722, 592);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. DRAW LEFT & RIGHT LABELS UNDER ARROWS (e.g. YES / NO)
    ctx.fillStyle = '#d6cac5';
    ctx.font = 'bold 44px "Courier New", monospace';
    ctx.fillText(leftText, 245, 680);
    ctx.fillText(rightText, 779, 680);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

/**
 * Procedural Brown Earth / Dirt Soil Floor Texture (Matching Paint Drawing #3)
 */
function createDirtFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Rich warm soil brown base matching Paint drawing (#4a321f)
    ctx.fillStyle = '#48301d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Organic earth patches & dark dirt variations
    for (let i = 0; i < 90; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const r = 25 + Math.random() * 140;
        const grad = ctx.createRadialGradient(x, y, 5, x, y, r);
        const isDark = Math.random() > 0.4;
        const color = isDark ? 'rgba(52, 32, 16, 0.45)' : 'rgba(102, 70, 42, 0.4)';
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // High detail soil noise & sand grains
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 32;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
}

/**
 * Procedural Realistic Wolf Fur Texture Generator (Matching User's Uploaded Wolf Photo)
 * Generates multi-tone charcoal grey, tan/brown undertones, and silver mane fur
 */
function createWolfFurTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base Charcoal / Slate Grey Fur
    ctx.fillStyle = '#4a4e52';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Warm Tan / Brown Undertone Patches (as seen on ribs and legs in photo)
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const r = 20 + Math.random() * 80;
        const grad = ctx.createRadialGradient(x, y, 5, x, y, r);
        grad.addColorStop(0, 'rgba(145, 115, 85, 0.45)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Darker Spine / Back Saddle Streak
    const spineGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    spineGrad.addColorStop(0, 'rgba(25, 28, 32, 0.6)');
    spineGrad.addColorStop(0.5, 'rgba(50, 55, 60, 0.3)');
    spineGrad.addColorStop(1, 'rgba(180, 185, 190, 0.4)'); // Light chest/belly
    ctx.fillStyle = spineGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Fine Fur Hair Strokes Directional Noise
    ctx.strokeStyle = 'rgba(220, 225, 230, 0.18)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 600; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const len = 8 + Math.random() * 14;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random() - 0.5) * 4, y + len);
        ctx.stroke();
    }

    // Dark Hair Strokes
    ctx.strokeStyle = 'rgba(15, 18, 22, 0.25)';
    for (let i = 0; i < 500; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const len = 6 + Math.random() * 12;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random() - 0.5) * 4, y + len);
        ctx.stroke();
    }

    // High detail noise filter for organic fur feel
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 24;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

/**
 * Procedural High-Quality Pine Leaf Texture Generator
 * Creates realistic evergreen pine needle clusters, branch veins, and depth
 */
function createPineLeafTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Deep Forest Pine Green Base (#12421e)
    ctx.fillStyle = '#12421e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dark Evergreen Shadow Patches
    for (let i = 0; i < 45; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const r = 20 + Math.random() * 70;
        const grad = ctx.createRadialGradient(x, y, 5, x, y, r);
        grad.addColorStop(0, 'rgba(8, 25, 12, 0.6)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Bright Pine Needle Strokes
    ctx.strokeStyle = 'rgba(42, 115, 56, 0.4)';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 700; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const angle = (Math.random() - 0.5) * 1.2 + Math.PI / 4;
        const len = 10 + Math.random() * 18;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
        ctx.stroke();
    }

    // Dark Pine Needle Strokes
    ctx.strokeStyle = 'rgba(5, 20, 8, 0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 500; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const angle = (Math.random() - 0.5) * 1.2 - Math.PI / 4;
        const len = 8 + Math.random() * 15;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
        ctx.stroke();
    }

    // High detail noise filter
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 20;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
}

/**
 * Stage Ending #2 Wall Writing Texture Generator ("DONT LOOK BACK")
 * Features dark grunge wall with scary grey/tan creepy font
 */
function createDontLookBackTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base yellow/tan wallpaper color matching corridor
    ctx.fillStyle = '#b88d4d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dark grunge dirt overlay
    const grad = ctx.createRadialGradient(512, 512, 50, 512, 512, 600);
    grad.addColorStop(0, 'rgba(40, 25, 12, 0.4)');
    grad.addColorStop(1, 'rgba(10, 5, 2, 0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Paint-style Brown Grid/Crosshatch pattern
    ctx.strokeStyle = 'rgba(95, 55, 25, 0.5)';
    ctx.lineWidth = 12;
    for (let x = -1024; x < 2048; x += 128) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 1024, 1024);
        ctx.stroke();
    }

    // SCARY CREEPY GREY WALL TEXT: "DONT LOOK BACK"
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#8f8880'; // Creepy grey tone
    ctx.font = 'bold 78px "Courier New", monospace';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 24;

    ctx.fillText("DONT LOOK BACK", canvas.width / 2, 480);

    // Dripping paint streaks under the text
    ctx.fillStyle = 'rgba(60, 55, 50, 0.6)';
    for (let i = 0; i < 18; i++) {
        const dropX = 140 + i * 45;
        const dropLen = 40 + Math.random() * 90;
        ctx.fillRect(dropX, 520, 6, dropLen);
    }

    // High detail noise
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 22;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

/**
 * Procedural Molten Lava / Magma Surface Texture Generator
 * Features glowing orange/yellow magma rivers, dark volcanic crust patches, and high emissive contrast
 */
function createLavaTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Deep Glowing Magma Red Base (#cc2200)
    ctx.fillStyle = '#cc2200';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Glowing Bright Orange & Yellow Magma Veins
    ctx.strokeStyle = '#ff9900';
    ctx.lineWidth = 14;
    ctx.shadowColor = '#ff3300';
    ctx.shadowBlur = 18;

    for (let i = 0; i < 18; i++) {
        const x1 = Math.random() * canvas.width;
        const y1 = Math.random() * canvas.height;
        const x2 = x1 + (Math.random() - 0.5) * 200;
        const y2 = y1 + (Math.random() - 0.5) * 200;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(
            x1 + (Math.random() - 0.5) * 100, y1 + (Math.random() - 0.5) * 100,
            x2 + (Math.random() - 0.5) * 100, y2 + (Math.random() - 0.5) * 100,
            x2, y2
        );
        ctx.stroke();
    }

    // Core Yellow Hotspots
    ctx.strokeStyle = '#ffee44';
    ctx.lineWidth = 6;
    for (let i = 0; i < 12; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 15 + Math.random() * 35, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Cooling Dark Basalt Crust Patches (#220502)
    ctx.shadowBlur = 0;
    for (let i = 0; i < 35; i++) {
        const cx = Math.random() * canvas.width;
        const cy = Math.random() * canvas.height;
        const r = 25 + Math.random() * 65;

        const crustGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, r);
        crustGrad.addColorStop(0, 'rgba(25, 6, 2, 0.92)');
        crustGrad.addColorStop(0.7, 'rgba(40, 10, 4, 0.75)');
        crustGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = crustGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // High detail noise
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 18;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 6);
    return texture;
}

// Global array holding the 12 photo textures (pic1.png..pic12.png)
let paintingTextures = [];

/**
 * Initializes textures for the 12 user images (images/pic1.png to images/pic12.png).
 */
function initPaintingTextures() {
    paintingTextures = [];
    const loader = new THREE.TextureLoader();

    for (let i = 1; i <= 12; i++) {
        const imagePath = `images/pic${i}.png`;

        const texture = loader.load(
            imagePath,
            (loadedTex) => {
                loadedTex.encoding = THREE.sRGBEncoding;
                loadedTex.needsUpdate = true;
            },
            undefined,
            (err) => {
                console.warn(`Failed to load ${imagePath}:`, err);
            }
        );
        texture.encoding = THREE.sRGBEncoding;
        paintingTextures.push(texture);
    }
}

/**
 * Creates a 3D Framed Painting Mesh with raised 3D light-brown wood bezel
 * textureIndex: 0..11 corresponding to the 12 photo options (pic1.png..pic12.png)
 */
function createFramedPaintingMesh(textureIndex) {
    if (textureIndex === undefined || textureIndex === null || textureIndex < 0 || (paintingTextures.length > 0 && textureIndex >= paintingTextures.length)) {
        textureIndex = Math.floor(Math.random() * (paintingTextures.length || 12));
    }

    const group = new THREE.Group();

    const frameWidth = 1.6;
    const frameHeight = 1.15;
    const frameDepth = 0.08;
    const borderThick = 0.12;

    // Outer Raised Wooden Frame (Hafif Kahverengi Ahşap İskelet)
    const woodMat = new THREE.MeshStandardMaterial({
        color: 0x8b5a2b, // Light Brown / Hafif kahverengi ahşap
        roughness: 0.5,
        metalness: 0.1
    });

    // 4 Frame Bezel sides (Top, Bottom, Left, Right) creating hollow 3D raised bezel
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(frameWidth, borderThick, frameDepth), woodMat);
    topBar.position.set(0, frameHeight / 2 - borderThick / 2, 0);
    topBar.castShadow = true;
    group.add(topBar);

    const bottomBar = new THREE.Mesh(new THREE.BoxGeometry(frameWidth, borderThick, frameDepth), woodMat);
    bottomBar.position.set(0, -frameHeight / 2 + borderThick / 2, 0);
    bottomBar.castShadow = true;
    group.add(bottomBar);

    const leftBar = new THREE.Mesh(new THREE.BoxGeometry(borderThick, frameHeight - borderThick * 2, frameDepth), woodMat);
    leftBar.position.set(-frameWidth / 2 + borderThick / 2, 0, 0);
    leftBar.castShadow = true;
    group.add(leftBar);

    const rightBar = new THREE.Mesh(new THREE.BoxGeometry(borderThick, frameHeight - borderThick * 2, frameDepth), woodMat);
    rightBar.position.set(frameWidth / 2 - borderThick / 2, 0, 0);
    rightBar.castShadow = true;
    group.add(rightBar);

    // Rear Backing Panel
    const backGeo = new THREE.BoxGeometry(frameWidth - borderThick * 0.8, frameHeight - borderThick * 0.8, 0.02);
    const backMat = new THREE.MeshStandardMaterial({ color: 0x22160d, roughness: 0.9 });
    const backMesh = new THREE.Mesh(backGeo, backMat);
    backMesh.position.set(0, 0, -frameDepth / 2 + 0.01);
    group.add(backMesh);

    // Inner Cream Passe-partout (Paspartu Kenarlığı)
    const matGeo = new THREE.PlaneGeometry(frameWidth - borderThick * 1.2, frameHeight - borderThick * 1.2);
    const matMat = new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.65 });
    const matMesh = new THREE.Mesh(matGeo, matMat);
    matMesh.position.set(0, 0, 0.01);
    group.add(matMesh);

    // Photo Image Surface Plane (MeshBasicMaterial guarantees 100% vivid color rendering, unaffected by shadows)
    const photoWidth = 1.22;
    const photoHeight = 0.78;
    const photoGeo = new THREE.PlaneGeometry(photoWidth, photoHeight);

    const pTexture = (paintingTextures && paintingTextures[textureIndex]) ? paintingTextures[textureIndex] : null;

    const photoMat = new THREE.MeshBasicMaterial({
        map: pTexture
    });

    const photoMesh = new THREE.Mesh(photoGeo, photoMat);
    photoMesh.position.set(0, 0, 0.015);
    group.add(photoMesh);

    return group;
}

/**
 * Procedural AAA Brass/Gold Floor Stage Plaque Texture Generator
 */
function createFloorPlaqueTexture(stageNum) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // 1. Dark Brushed Metal / Bronze Background
    const grad = ctx.createLinearGradient(0, 0, 512, 256);
    grad.addColorStop(0, '#1c1917');
    grad.addColorStop(0.5, '#2b2622');
    grad.addColorStop(1, '#181513');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Polished Brass / Gold Double Outer Frame
    ctx.strokeStyle = '#c89d36';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    ctx.strokeStyle = '#e6c667';
    ctx.lineWidth = 3;
    ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

    // Corner rivets (screws)
    ctx.fillStyle = '#d4af37';
    const rivets = [
        [28, 28], [canvas.width - 28, 28],
        [28, canvas.height - 28], [canvas.width - 28, canvas.height - 28]
    ];
    rivets.forEach(([rx, ry]) => {
        ctx.beginPath();
        ctx.arc(rx, ry, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    // 3. Typography
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Top Label: "STAGE"
    ctx.fillStyle = '#b89230';
    ctx.font = 'bold 26px "Courier New", monospace';
    ctx.fillText("STAGE", canvas.width / 2, 58);

    // Large Stage Number: "01", "02", etc.
    const numStr = stageNum < 10 ? `0${stageNum}` : `${stageNum}`;
    ctx.fillStyle = '#f5d77f'; // Bright metallic gold
    ctx.shadowColor = 'rgba(245, 215, 127, 0.4)';
    ctx.shadowBlur = 12;
    ctx.font = 'bold 96px "Courier New", monospace';
    ctx.fillText(numStr, canvas.width / 2, 138);

    // Reset shadow
    ctx.shadowBlur = 0;

    // Bottom Decorative Bar & Subtext
    ctx.strokeStyle = '#c89d36';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 200);
    ctx.lineTo(432, 200);
    ctx.stroke();

    ctx.fillStyle = '#9e7b28';
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.fillText("CORRIDOR ESCAPE", canvas.width / 2, 222);

    // Subtle noise for metal texture feel
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 12;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

/**
 * Creates 3D Floor / Stage Plaque Mesh with raised metallic frame
 */
function createFloorPlaqueMesh(stageNum) {
    const plaqueGroup = new THREE.Group();

    const pWidth = 0.8;
    const pHeight = 0.42;
    const pDepth = 0.03;

    // Brass outer frame backing
    const backGeo = new THREE.BoxGeometry(pWidth, pHeight, pDepth);
    const backMat = new THREE.MeshStandardMaterial({
        color: 0x8f6a1e, // Polished brass / dark gold frame
        metalness: 0.8,
        roughness: 0.3
    });
    const backMesh = new THREE.Mesh(backGeo, backMat);
    backMesh.castShadow = true;
    plaqueGroup.add(backMesh);

    // Plaque Front Face Texture
    const plaqueTex = createFloorPlaqueTexture(stageNum);
    const faceGeo = new THREE.PlaneGeometry(pWidth - 0.04, pHeight - 0.04);
    const faceMat = new THREE.MeshStandardMaterial({
        map: plaqueTex,
        roughness: 0.4,
        metalness: 0.2
    });
    const faceMesh = new THREE.Mesh(faceGeo, faceMat);
    faceMesh.position.set(0, 0, pDepth / 2 + 0.005);
    plaqueGroup.add(faceMesh);

    return plaqueGroup;
}

/**
 * Creates 3D Modern Hotel-Style Wall Sconce Lamp (matching user's reference photo)
 * Features cylindrical cream fabric shade, brushed metal mounting plate, angled mini spotlight, and soft warm point light
 */
function createWallSconceMesh() {
    const group = new THREE.Group();

    // 1. Brushed Metal Wall Mounting Plate
    const plateGeo = new THREE.BoxGeometry(0.12, 0.42, 0.025);
    const metalMat = new THREE.MeshStandardMaterial({
        color: 0xd4c4a8, // Brushed nickel / warm silver
        metalness: 0.8,
        roughness: 0.3
    });
    const plate = new THREE.Mesh(plateGeo, metalMat);
    plate.castShadow = true;
    group.add(plate);

    // Vertical mount stem rod
    const stemGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.25, 8);
    const stem = new THREE.Mesh(stemGeo, metalMat);
    stem.position.set(0, 0.15, 0.08);
    group.add(stem);

    // Horizontal arm connecting plate to shade
    const armGeo = new THREE.BoxGeometry(0.02, 0.02, 0.12);
    const arm = new THREE.Mesh(armGeo, metalMat);
    arm.position.set(0, 0.2, 0.05);
    group.add(arm);

    // 2. Cylindrical Cream Fabric Lamp Shade (Matching reference photo)
    const shadeRadius = 0.15;
    const shadeHeight = 0.32;
    const shadeGeo = new THREE.CylinderGeometry(shadeRadius, shadeRadius, shadeHeight, 24, 1, true);
    const shadeMat = new THREE.MeshStandardMaterial({
        color: 0xfff6ea,
        emissive: 0xffd9aa,
        emissiveIntensity: 0.45,
        roughness: 0.8,
        side: THREE.DoubleSide
    });
    const shade = new THREE.Mesh(shadeGeo, shadeMat);
    shade.position.set(0, 0.22, 0.12);
    group.add(shade);

    // Top & Bottom Inner Glow Caps
    const capGeo = new THREE.CircleGeometry(shadeRadius * 0.95, 16);
    const capMat = new THREE.MeshBasicMaterial({ color: 0xffe6c2, side: THREE.DoubleSide });

    const topCap = new THREE.Mesh(capGeo, capMat);
    topCap.position.set(0, 0.22 + shadeHeight / 2 - 0.01, 0.12);
    topCap.rotation.x = Math.PI / 2;
    group.add(topCap);

    const bottomCap = new THREE.Mesh(capGeo, capMat);
    bottomCap.position.set(0, 0.22 - shadeHeight / 2 + 0.01, 0.12);
    bottomCap.rotation.x = Math.PI / 2;
    group.add(bottomCap);

    // 3. Angled Mini Reading Spotlight Cylinder at Bottom (Matching reference photo)
    const spotCylGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.14, 12);
    const spotCyl = new THREE.Mesh(spotCylGeo, metalMat);
    spotCyl.position.set(0, -0.08, 0.06);
    spotCyl.rotation.x = Math.PI / 3; // Angled ~60 degrees downward
    group.add(spotCyl);

    // Glowing Lens at tip of mini spotlight
    const lensGeo = new THREE.CircleGeometry(0.024, 12);
    const lensMat = new THREE.MeshBasicMaterial({ color: 0xfffae6 });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(0, -0.13, 0.09);
    lens.rotation.x = Math.PI / 3 + Math.PI / 2;
    group.add(lens);

    // 4. Soft Warm Point Light (Dim cozy illumination near door)
    const dimWarmLight = new THREE.PointLight(0xffcf88, 0.85, 5.5);
    dimWarmLight.position.set(0, 0.1, 0.18);
    dimWarmLight.castShadow = false;
    group.add(dimWarmLight);

    return group;
}

/**
 * Creates 3D Blocky Minecraft Oak Tree Mesh
 */
function createMinecraftTreeMesh() {
    const treeGroup = new THREE.Group();

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x3a7d32, roughness: 0.8 });

    // Trunk (Wood blocks)
    const trunkGeo = new THREE.BoxGeometry(0.9, 4.5, 0.9);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(0, 2.25, 0);
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Leaves Canopy (Blocky Clusters)
    const leafGeo1 = new THREE.BoxGeometry(3.5, 1.5, 3.5);
    const leaves1 = new THREE.Mesh(leafGeo1, leafMat);
    leaves1.position.set(0, 4.2, 0);
    leaves1.castShadow = true;
    treeGroup.add(leaves1);

    const leafGeo2 = new THREE.BoxGeometry(2.5, 1.5, 2.5);
    const leaves2 = new THREE.Mesh(leafGeo2, leafMat);
    leaves2.position.set(0, 5.2, 0);
    leaves2.castShadow = true;
    treeGroup.add(leaves2);

    const leafGeo3 = new THREE.BoxGeometry(1.5, 1.0, 1.5);
    const leaves3 = new THREE.Mesh(leafGeo3, leafMat);
    leaves3.position.set(0, 6.2, 0);
    treeGroup.add(leaves3);

    return treeGroup;
}

/**
 * Creates 3D Blocky Minecraft Village House Mesh
 */
function createMinecraftHouseMesh() {
    const houseGroup = new THREE.Group();

    const plankMat = new THREE.MeshStandardMaterial({ color: 0x9c7a53, roughness: 0.85 });
    const logMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x6e4a27, roughness: 0.8 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xadd8e6, roughness: 0.3, transparent: true, opacity: 0.7 });

    // Base Walls (5m x 4m x 5m)
    const wallGeo = new THREE.BoxGeometry(5.0, 3.6, 5.0);
    const walls = new THREE.Mesh(wallGeo, plankMat);
    walls.position.set(0, 1.8, 0);
    walls.castShadow = true;
    walls.receiveShadow = true;
    houseGroup.add(walls);

    // Corner Log Pillars
    const pillarGeo = new THREE.BoxGeometry(0.8, 3.8, 0.8);
    const offsets = [[-2.3, -2.3], [2.3, -2.3], [-2.3, 2.3], [2.3, 2.3]];
    offsets.forEach(([px, pz]) => {
        const pillar = new THREE.Mesh(pillarGeo, logMat);
        pillar.position.set(px, 1.9, pz);
        houseGroup.add(pillar);
    });

    // Pitched Wooden Roof
    const roofGeo = new THREE.ConeGeometry(4.2, 2.2, 4);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 4.7, 0);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    houseGroup.add(roof);

    // Glass Windows
    const winGeo = new THREE.BoxGeometry(1.2, 1.2, 0.1);
    const win1 = new THREE.Mesh(winGeo, glassMat);
    win1.position.set(0, 2.2, 2.51);
    houseGroup.add(win1);

    const win2 = new THREE.Mesh(winGeo, glassMat);
    win2.position.set(-2.51, 2.2, 0);
    win2.rotation.y = Math.PI / 2;
    houseGroup.add(win2);

    return houseGroup;
}

/**
 * Creates 22-Meter Tall 3D Minecraft Sun-Headed Colossus Giant Entity
 * (Matching user's uploaded reference screenshot 1:1!)
 */
function createSunGiantMesh() {
    const giantGroup = new THREE.Group();

    const darkMat = new THREE.MeshStandardMaterial({
        color: 0x08080a,
        roughness: 0.95,
        metalness: 0.05
    });
    const sunMat = new THREE.MeshStandardMaterial({
        color: 0xe0e0e8,
        roughness: 0.5,
        metalness: 0.1
    });
    const faceFeatureMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    // 1. Long Spindly Legs (Height: 11m)
    const legGeo = new THREE.BoxGeometry(0.7, 11.0, 0.7);
    const legL = new THREE.Mesh(legGeo, darkMat);
    legL.position.set(-1.2, 5.5, 0);
    legL.castShadow = true;
    giantGroup.add(legL);

    const legR = new THREE.Mesh(legGeo, darkMat);
    legR.position.set(1.2, 5.5, 0);
    legR.castShadow = true;
    giantGroup.add(legR);

    // 2. High Towering Torso (Height: 6.5m)
    const torsoGeo = new THREE.BoxGeometry(2.6, 6.5, 1.8);
    const torso = new THREE.Mesh(torsoGeo, darkMat);
    torso.position.set(0, 14.25, 0);
    torso.castShadow = true;
    giantGroup.add(torso);

    // 3. Tall Neck (Height: 3.5m)
    const neckGeo = new THREE.BoxGeometry(0.8, 3.5, 0.8);
    const neck = new THREE.Mesh(neckGeo, darkMat);
    neck.position.set(0, 19.25, 0);
    giantGroup.add(neck);

    // 4. Multi-Jointed Spindly Arms with Claw Fingers (Matching Screenshot 1:1)
    for (let side = -1; side <= 1; side += 2) {
        const armGroup = new THREE.Group();
        armGroup.position.set(side * 1.6, 17.0, 0);

        // Upper Arm
        const upperArmGeo = new THREE.BoxGeometry(0.5, 4.5, 0.5);
        const upperArm = new THREE.Mesh(upperArmGeo, darkMat);
        upperArm.position.set(side * 0.4, -2.25, 0);
        upperArm.rotation.z = side * -0.2;
        armGroup.add(upperArm);

        // Forearm / Joint
        const forearmGeo = new THREE.BoxGeometry(0.4, 4.5, 0.4);
        const forearm = new THREE.Mesh(forearmGeo, darkMat);
        forearm.position.set(side * 0.8, -6.0, 0.3);
        forearm.rotation.x = 0.2;
        armGroup.add(forearm);

        // Claw Fingers
        for (let f = -1; f <= 1; f++) {
            const clawGeo = new THREE.BoxGeometry(0.12, 1.6, 0.12);
            const claw = new THREE.Mesh(clawGeo, darkMat);
            claw.position.set(side * 0.8 + f * 0.18, -8.5, 0.5);
            claw.rotation.x = 0.3;
            armGroup.add(claw);
        }

        giantGroup.add(armGroup);
    }

    // 5. SUN-HEADED STARBURST FACE WHEEL (Matching Screenshot 1:1!)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 21.5, 0);

    // Center Face Disk (Radius 1.2m)
    const centerDiskGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.15, 16);
    const centerDisk = new THREE.Mesh(centerDiskGeo, sunMat);
    centerDisk.rotation.x = Math.PI / 2;
    headGroup.add(centerDisk);

    // 16 Starburst Sun Rays pointing outwards around head
    const rayCount = 16;
    for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2;
        const rayLen = 1.6 + (i % 2 === 0 ? 0.6 : 0.2); // Alternating short & long spikes
        const rayGeo = new THREE.ConeGeometry(0.18, rayLen, 4);
        const ray = new THREE.Mesh(rayGeo, sunMat);

        const r = 1.2 + rayLen / 2;
        ray.position.set(Math.cos(angle) * r, Math.sin(angle) * r, 0);
        ray.rotation.z = angle - Math.PI / 2;
        headGroup.add(ray);
    }

    // Creepy Drawn Face Features on Mask (Eyes & Creepy Line Smile)
    const eyeGeo = new THREE.BoxGeometry(0.22, 0.12, 0.05);
    const eyeL = new THREE.Mesh(eyeGeo, faceFeatureMat);
    eyeL.position.set(-0.35, 0.3, 0.1);
    headGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, faceFeatureMat);
    eyeR.position.set(0.35, 0.3, 0.1);
    headGroup.add(eyeR);

    // Creepy Smile Line
    const mouthGeo = new THREE.BoxGeometry(0.7, 0.08, 0.05);
    const mouth = new THREE.Mesh(mouthGeo, faceFeatureMat);
    mouth.position.set(0, -0.3, 0.1);
    headGroup.add(mouth);

    giantGroup.userData = {
        headGroup: headGroup
    };

    return giantGroup;
}

/**
 * Generates High Quality Procedural Minecraft Grass Canvas Texture with flowers & dirt speckles
 */
function generateMinecraftGrassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base Grass Green
    ctx.fillStyle = '#53a042';
    ctx.fillRect(0, 0, 512, 512);

    // Pixelated Grass Variations & Soil Noise
    const colors = ['#4a923b', '#5cb649', '#3e7b30', '#66c453', '#438334', '#6fd159', '#63472d'];
    const tileSize = 8;

    for (let x = 0; x < 512; x += tileSize) {
        for (let y = 0; y < 512; y += tileSize) {
            if (Math.random() < 0.65) {
                ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
                ctx.fillRect(x, y, tileSize, tileSize);
            }
        }
    }

    // Grid Outlines for Voxel Block Texture Feel
    ctx.strokeStyle = 'rgba(40, 90, 30, 0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 512; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
        ctx.stroke();
    }

    // Scatter Colorful Flower Pixels (Red Poppies & Yellow Dandelions)
    const flowerColors = ['#ff3355', '#ffcc00', '#ffffff', '#ff66aa'];
    for (let i = 0; i < 90; i++) {
        const fx = Math.floor(Math.random() * (512 / tileSize)) * tileSize;
        const fy = Math.floor(Math.random() * (512 / tileSize)) * tileSize;

        ctx.fillStyle = flowerColors[Math.floor(Math.random() * flowerColors.length)];
        ctx.fillRect(fx, fy, tileSize, tileSize);
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(fx + 2, fy + 2, 4, 4);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(50, 50); // Repeat across 200m floor plane
    return tex;
}

/**
 * Generates Realistic Sky Texture with Soft Fluffy Procedural Clouds, Golden Sun & Horizon Gradient
 */
function generateSkyCloudTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Vibrant Sunny Daylight Sky Gradient (Rich Zenith Blue -> Soft Horizon)
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.0, '#1976d2'); // Rich vibrant sunny blue
    grad.addColorStop(0.35, '#42a5f5'); // Radiant cyan blue
    grad.addColorStop(0.7, '#90caf9'); // Soft horizon light blue
    grad.addColorStop(1.0, '#e3f2fd'); // Crisp white-blue horizon reflection
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // Glowing Golden Sun Disc in Sky Canvas
    const sunGrad = ctx.createRadialGradient(512, 110, 0, 512, 110, 100);
    sunGrad.addColorStop(0.0, 'rgba(255, 255, 220, 1.0)');
    sunGrad.addColorStop(0.25, 'rgba(255, 245, 170, 0.85)');
    sunGrad.addColorStop(0.6, 'rgba(255, 225, 140, 0.4)');
    sunGrad.addColorStop(1.0, 'rgba(255, 215, 120, 0.0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(512, 110, 100, 0, Math.PI * 2);
    ctx.fill();

    // Render Soft Fluffy Procedural White Clouds
    function drawCloud(cx, cy, r) {
        const cloudGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        cloudGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.98)');
        cloudGrad.addColorStop(0.5, 'rgba(242, 248, 255, 0.70)');
        cloudGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
        ctx.fillStyle = cloudGrad;

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Scatter 35 Fluffy Cloud Puffs across top sky dome
    for (let c = 0; c < 35; c++) {
        const basePos = { x: Math.random() * 1024, y: 40 + Math.random() * 220 };
        const puffs = 6 + Math.floor(Math.random() * 6);
        for (let p = 0; p < puffs; p++) {
            const px = basePos.x + (Math.random() - 0.5) * 180;
            const py = basePos.y + (Math.random() - 0.5) * 50;
            const pr = 45 + Math.random() * 55;
            drawCloud(px, py, pr);
        }
    }

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
}

/**
 * Creates 3D Grass Tuft Plant Mesh (Crossed planes)
 */
function createPlantTuftMesh() {
    const group = new THREE.Group();

    const plantMat = new THREE.MeshStandardMaterial({
        color: 0x489638,
        roughness: 0.8,
        side: THREE.DoubleSide
    });

    const geo = new THREE.PlaneGeometry(0.75, 0.75);

    const plane1 = new THREE.Mesh(geo, plantMat);
    plane1.position.y = 0.375;
    group.add(plane1);

    const plane2 = new THREE.Mesh(geo, plantMat);
    plane2.position.y = 0.375;
    plane2.rotation.y = Math.PI / 2;
    group.add(plane2);

    return group;
}

/**
 * Creates 3D Flower Mesh (Red Poppy or Yellow Dandelion)
 */
function createFlowerMesh(colorHex = 0xff2244) {
    const group = new THREE.Group();

    const stemMat = new THREE.MeshStandardMaterial({ color: 0x3a7d32, roughness: 0.8 });
    const petalMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.5 });
    const centerMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });

    // Stem
    const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.25;
    group.add(stem);

    // Petals Head (5-pointed star/disc)
    const petalGeo = new THREE.CircleGeometry(0.18, 5);
    const petals = new THREE.Mesh(petalGeo, petalMat);
    petals.position.y = 0.5;
    petals.rotation.x = -Math.PI / 3;
    group.add(petals);

    // Center Dot
    const centerGeo = new THREE.CircleGeometry(0.06, 8);
    const center = new THREE.Mesh(centerGeo, centerMat);
    center.position.set(0, 0.51, 0.02);
    center.rotation.x = -Math.PI / 3;
    group.add(center);

    return group;
}

