// ImpactBridge 3D WebGL Visualization Engine (Powered by Three.js)
// Includes:
// 1. Globe3D: Interactive Global Innovation Globe with Hotspot Beacons & Orbital Flow
// 2. CADViewer3D: 3D Hardware Digital Twin & Exploded BOM Inspector for University Prototypes
// 3. EscrowVault3D: 3D Holographic Escrow Vault & Smart Contract Grant Matrix

const ThreeEngine = {
    globe: null,
    cad: null,
    vault: null,

    initAll() {
        if (!window.THREE) {
            console.warn("Three.js not loaded yet. Retrying in 100ms...");
            setTimeout(() => this.initAll(), 100);
            return;
        }

        this.initRobot();
        this.initGlobe();
        this.initCADViewer();
        this.initEscrowVault();
    },

    // =========================================================================
    // 1. GLOBE 3D: Interactive Innovation Hotspots
    // =========================================================================
    initGlobe(containerId = "homeGlobeContainer") {
        let container = document.getElementById(containerId);
        if (!container) {
            container = document.getElementById("globe3dContainer");
        }
        if (!container) return;

        const width = container.clientWidth || 480;
        const height = container.clientHeight || 340;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 5, 22);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.innerHTML = "";
        container.appendChild(renderer.domElement);

        let controls;
        if (window.THREE.OrbitControls) {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.enableZoom = true;
            controls.minDistance = 12;
            controls.maxDistance = 35;
            controls.autoRotate = true;
            controls.autoRotateSpeed = 0.6;
        }

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.4);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(15, 20, 15);
        scene.add(dirLight);

        const blueLight = new THREE.PointLight(0x3b82f6, 2, 50);
        blueLight.position.set(-15, -10, -10);
        scene.add(blueLight);

        // Earth Base Sphere
        const radius = 7.5;
        const sphereGeo = new THREE.SphereGeometry(radius, 48, 48);
        
        // Procedural Grid Texture on Dark Sapphire Sphere
        const globeMat = new THREE.MeshPhongMaterial({
            color: 0x0c1938,
            emissive: 0x050c1e,
            specular: 0x3b82f6,
            shininess: 40,
            wireframe: false
        });
        const earthMesh = new THREE.Mesh(sphereGeo, globeMat);
        scene.add(earthMesh);

        // Outer Wireframe Grid Shell
        const wireGeo = new THREE.SphereGeometry(radius * 1.008, 24, 24);
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0x1e3a8a,
            wireframe: true,
            transparent: true,
            opacity: 0.35
        });
        const wireMesh = new THREE.Mesh(wireGeo, wireMat);
        scene.add(wireMesh);

        // Atmosphere Glow Halo
        const atmoGeo = new THREE.SphereGeometry(radius * 1.15, 32, 32);
        const atmoMat = new THREE.MeshBasicMaterial({
            color: 0x3b82f6,
            transparent: true,
            opacity: 0.09,
            side: THREE.BackSide
        });
        const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
        scene.add(atmoMesh);

        // Hotspot Coordinates on Globe
        const hotspots = [
            { id: 'belagavi', name: 'Belagavi Arid Agro-Belt', lat: 15.8497, lon: 74.4977, color: 0x3b82f6, size: 0.35, desc: 'Precision Irrigation IoT' },
            { id: 'sundarbans', name: 'Sundarbans Coastal Delta', lat: 21.9497, lon: 89.1833, color: 0x10b981, size: 0.35, desc: 'Saline Water Desalination' },
            { id: 'thar', name: 'Thar Solar Corridor', lat: 26.9157, lon: 70.9083, color: 0xf59e0b, size: 0.35, desc: 'Off-Grid Cold Storage' },
            { id: 'vidarbha', name: 'Vidarbha Agritech Basin', lat: 20.9374, lon: 77.7796, color: 0xa855f7, size: 0.35, desc: 'Bio-Composting Telemetry' },
            { id: 'iitb', name: 'IIT Bombay Innovation Hub', lat: 19.0760, lon: 72.8777, color: 0x38bdf8, size: 0.45, desc: 'Lead Research Lab' },
            { id: 'nairobi', name: 'East Africa Drylands Partner', lat: -1.2863, lon: 36.8172, color: 0xec4899, size: 0.3, desc: 'Grassroots Community Network' }
        ];

        const pinGroup = new THREE.Group();
        const pinMeshes = [];

        function latLonToVector3(lat, lon, r) {
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lon + 180) * (Math.PI / 180);
            return new THREE.Vector3(
                -(r * Math.sin(phi) * Math.cos(theta)),
                (r * Math.cos(phi)),
                (r * Math.sin(phi) * Math.sin(theta))
            );
        }

        hotspots.forEach(h => {
            const pos = latLonToVector3(h.lat, h.lon, radius + 0.1);
            
            // Pin Mesh (Glowing Cylinder / Cone)
            const pinGeo = new THREE.CylinderGeometry(0.08, 0.22, 1.2, 12);
            pinGeo.rotateX(Math.PI / 2);
            const pinMat = new THREE.MeshBasicMaterial({ color: h.color });
            const pinMesh = new THREE.Mesh(pinGeo, pinMat);
            pinMesh.position.copy(pos);
            pinMesh.lookAt(new THREE.Vector3(0, 0, 0));
            pinMesh.position.addScaledVector(pos.clone().normalize(), 0.6);
            pinMesh.userData = h;

            // Beacon Pulsing Sphere
            const beaconGeo = new THREE.SphereGeometry(h.size, 16, 16);
            const beaconMat = new THREE.MeshBasicMaterial({ color: h.color });
            const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
            beaconMesh.position.copy(pos).addScaledVector(pos.clone().normalize(), 1.2);
            beaconMesh.userData = h;

            // Pulsing Ring
            const ringGeo = new THREE.RingGeometry(0.3, 0.5, 24);
            const ringMat = new THREE.MeshBasicMaterial({ color: h.color, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
            const ringMesh = new THREE.Mesh(ringGeo, ringMat);
            ringMesh.position.copy(pos).addScaledVector(pos.clone().normalize(), 0.05);
            ringMesh.lookAt(new THREE.Vector3(0, 0, 0));

            pinGroup.add(pinMesh);
            pinGroup.add(beaconMesh);
            pinGroup.add(ringMesh);
            pinMeshes.push(beaconMesh);
        });

        // Orbital Data Arcs connecting IIT Bombay to regional hotspots
        const iitbPos = latLonToVector3(19.0760, 72.8777, radius + 0.1);
        hotspots.filter(h => h.id !== 'iitb').forEach(h => {
            const destPos = latLonToVector3(h.lat, h.lon, radius + 0.1);
            const midPos = iitbPos.clone().add(destPos).multiplyScalar(0.5);
            midPos.normalize().multiplyScalar(radius * 1.35); // Arc height

            const curve = new THREE.QuadraticBezierCurve3(iitbPos, midPos, destPos);
            const points = curve.getPoints(30);
            const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
            const arcMat = new THREE.LineBasicMaterial({
                color: 0x38bdf8,
                transparent: true,
                opacity: 0.6,
                linewidth: 2
            });
            const arcLine = new THREE.Line(arcGeo, arcMat);
            pinGroup.add(arcLine);
        });

        scene.add(pinGroup);

        // Raycasting for interactive 3D pin selection
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        renderer.domElement.addEventListener('click', (e) => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(pinMeshes);

            if (intersects.length > 0) {
                const data = intersects[0].object.userData;
                AppState.showToast(`3D Hotspot Focus: ${data.name} (${data.desc})`, "info");
                ChallengesUI.filterByRegion(data.id === 'belagavi' ? 'Belagavi' : data.id === 'sundarbans' ? 'Sundarbans' : data.id === 'thar' ? 'Rajasthan' : data.id === 'vidarbha' ? 'Maharashtra' : null);
            }
        });

        // Animation Loop
        let pulseTime = 0;
        const animate = () => {
            requestAnimationFrame(animate);
            pulseTime += 0.04;

            earthMesh.rotation.y += 0.0012;
            wireMesh.rotation.y += 0.0012;
            pinGroup.rotation.y += 0.0012;

            if (controls) controls.update();
            renderer.render(scene, camera);
        };
        animate();

        window.addEventListener("resize", () => {
            if (!container) return;
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        });

        this.globe = { scene, camera, renderer, controls };
    },

    // =========================================================================
    // 2. CAD VIEWER 3D: Hardware Digital Twin & Exploded Prototype Inspector
    // =========================================================================
    initCADViewer() {
        const container = document.getElementById("cad3dContainer");
        if (!container) return;

        const width = container.clientWidth || 600;
        const height = container.clientHeight || 380;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(8, 7, 14);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.innerHTML = "";
        container.appendChild(renderer.domElement);

        let controls;
        if (window.THREE.OrbitControls) {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
        }

        // Studio Lighting
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.2);
        scene.add(hemiLight);

        const mainDirLight = new THREE.DirectionalLight(0x60a5fa, 1.5);
        mainDirLight.position.set(10, 15, 10);
        scene.add(mainDirLight);

        const rimLight = new THREE.PointLight(0x10b981, 2, 30);
        rimLight.position.set(-10, -5, -8);
        scene.add(rimLight);

        // Ground Reflection Grid
        const gridHelper = new THREE.GridHelper(16, 16, 0x3b82f6, 0x1e293b);
        gridHelper.position.y = -3.5;
        scene.add(gridHelper);

        // Create Procedural 3D Prototype: "HydroMesh LoRa Subsurface Soil Probe"
        const cadModelGroup = new THREE.Group();
        const explodedParts = [];

        // 1. Central Weatherproof Enclosure (Chassis)
        const chassisGeo = new THREE.CylinderGeometry(1.4, 1.4, 4.2, 32);
        const chassisMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            metalness: 0.6,
            roughness: 0.25,
            wireframe: false
        });
        const chassis = new THREE.Mesh(chassisGeo, chassisMat);
        chassis.userData = { name: "IP68 Polycarbonate Enclosure", origY: 0, explodeY: 0 };
        cadModelGroup.add(chassis);
        explodedParts.push(chassis);

        // 2. Solar Photovoltaic Top Cap
        const solarCapGeo = new THREE.CylinderGeometry(1.8, 1.5, 0.6, 32);
        const solarCapMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            metalness: 0.9,
            roughness: 0.1
        });
        const solarCap = new THREE.Mesh(solarCapGeo, solarCapMat);
        solarCap.position.y = 2.4;
        solarCap.userData = { name: "Monocrystalline Solar Collector (5V)", origY: 2.4, explodeY: 4.8 };
        cadModelGroup.add(solarCap);
        explodedParts.push(solarCap);

        // 3. Omnidirectional LoRa Antenna
        const antennaGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.2, 16);
        const antennaMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2 });
        const antenna = new THREE.Mesh(antennaGeo, antennaMat);
        antenna.position.y = 4.3;
        antenna.userData = { name: "868MHz LoRaWAN Long-Range Antenna", origY: 4.3, explodeY: 7.2 };
        cadModelGroup.add(antenna);
        explodedParts.push(antenna);

        // 4. Subsurface Soil Moisture Sensor Blades (3 Prongs)
        const prongMat = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.9, roughness: 0.1 });
        const prongsGroup = new THREE.Group();
        [-0.7, 0, 0.7].forEach((xOffset, idx) => {
            const prongGeo = new THREE.BoxGeometry(0.18, 3.2, 0.4);
            const prong = new THREE.Mesh(prongGeo, prongMat);
            prong.position.set(xOffset, -3.2, 0);
            prongsGroup.add(prong);
        });
        prongsGroup.userData = { name: "TDR Dielectric Permittivity Moisture Blades", origY: 0, explodeY: -3.5 };
        cadModelGroup.add(prongsGroup);
        explodedParts.push(prongsGroup);

        // 5. Internal PCB Microcontroller Core (ESP32-S3 + LoRa Transceiver)
        const pcbGeo = new THREE.BoxGeometry(1.8, 2.6, 0.15);
        const pcbMat = new THREE.MeshStandardMaterial({ color: 0x059669, emissive: 0x047857, emissiveIntensity: 0.3 });
        const pcb = new THREE.Mesh(pcbGeo, pcbMat);
        pcb.position.set(0, 0, 0);
        pcb.userData = { name: "Dual-Core ESP32-S3 ML Inference PCB", origY: 0, explodeY: 1.5 };
        cadModelGroup.add(pcb);
        explodedParts.push(pcb);

        // 6. Glowing Status Telemetry LED Ring
        const ledGeo = new THREE.TorusGeometry(1.42, 0.08, 16, 32);
        const ledMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const ledRing = new THREE.Mesh(ledGeo, ledMat);
        ledRing.rotation.x = Math.PI / 2;
        ledRing.position.y = 1.8;
        ledRing.userData = { name: "Heartbeat Telemetry Indicator", origY: 1.8, explodeY: 3.2 };
        cadModelGroup.add(ledRing);
        explodedParts.push(ledRing);

        scene.add(cadModelGroup);

        // State Flags
        let isExploded = false;
        let isWireframe = false;
        let isAutoRotating = true;

        const animate = () => {
            requestAnimationFrame(animate);

            if (isAutoRotating) {
                cadModelGroup.rotation.y += 0.008;
            }

            // Smooth Interpolation for Exploded View
            explodedParts.forEach(part => {
                const targetY = isExploded ? part.userData.explodeY : part.userData.origY;
                part.position.y += (targetY - part.position.y) * 0.08;
            });

            // LED pulse
            const pulse = (Math.sin(Date.now() * 0.005) + 1) * 0.5;
            ledMat.color.setRGB(0.2, 0.5 + 0.5 * pulse, 1);

            if (controls) controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // Control API for UI Buttons
        this.cad = {
            scene, camera, renderer, controls, cadModelGroup,
            toggleExploded() {
                isExploded = !isExploded;
                AppState.showToast(isExploded ? "Exploded BOM Disassembly Mode Activated" : "Hardware Assembled View Restored", "info");
                return isExploded;
            },
            toggleWireframe() {
                isWireframe = !isWireframe;
                cadModelGroup.traverse(child => {
                    if (child.isMesh) {
                        child.material.wireframe = isWireframe;
                    }
                });
                AppState.showToast(isWireframe ? "X-Ray / Wireframe Inspection Mode" : "Standard PBR Shading Restored", "info");
                return isWireframe;
            },
            toggleRotation() {
                isAutoRotating = !isAutoRotating;
                return isAutoRotating;
            },
            resetView() {
                camera.position.set(8, 7, 14);
                if (controls) controls.target.set(0, 0, 0);
            }
        };

        window.addEventListener("resize", () => {
            if (!container) return;
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        });
    },

    // =========================================================================
    // 3. ESCROW VAULT 3D: Holographic Smart Contract Vault
    // =========================================================================
    initEscrowVault() {
        const container = document.getElementById("escrowVault3dContainer");
        if (!container) return;

        const width = container.clientWidth || 400;
        const height = container.clientHeight || 280;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 4, 12);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.innerHTML = "";
        container.appendChild(renderer.domElement);

        let controls;
        if (window.THREE.OrbitControls) {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.enableZoom = false;
        }

        // Lighting
        const light = new THREE.DirectionalLight(0x10b981, 2);
        light.position.set(5, 10, 7);
        scene.add(light);

        const fill = new THREE.PointLight(0x3b82f6, 1.5, 20);
        fill.position.set(-5, -5, 5);
        scene.add(fill);

        // 3D Metallic Vault Octahedron Core
        const vaultGeo = new THREE.OctahedronGeometry(2.4, 0);
        const vaultMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            metalness: 0.95,
            roughness: 0.15,
            wireframe: false
        });
        const vaultMesh = new THREE.Mesh(vaultGeo, vaultMat);
        scene.add(vaultMesh);

        // Concentric Holographic Laser Security Rings
        const ringGroup = new THREE.Group();
        const ring1 = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.04, 16, 48), new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.8 }));
        const ring2 = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.04, 16, 48), new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.6 }));
        const ring3 = new THREE.Mesh(new THREE.TorusGeometry(4.8, 0.04, 16, 48), new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.4 }));

        ring1.rotation.x = Math.PI / 3;
        ring2.rotation.y = Math.PI / 4;
        ring3.rotation.z = Math.PI / 6;

        ringGroup.add(ring1);
        ringGroup.add(ring2);
        ringGroup.add(ring3);
        scene.add(ringGroup);

        const animate = () => {
            requestAnimationFrame(animate);
            vaultMesh.rotation.y += 0.01;
            vaultMesh.rotation.x += 0.005;

            ring1.rotation.x += 0.015;
            ring2.rotation.y += 0.012;
            ring3.rotation.z += 0.008;

            if (controls) controls.update();
            renderer.render(scene, camera);
        };
        animate();

        this.vault = { scene, camera, renderer, vaultMesh, ringGroup };
    },

    // =========================================================================
    // 4. ROBOT 3D: Interactive AI Robotics Companion ("Nova Bot")
    // =========================================================================
    robot: null,

    initRobot(containerId = "robot3dContainer") {
        const container = document.getElementById(containerId);
        if (!container) return;

        const width = container.clientWidth || 440;
        const height = container.clientHeight || 340;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 1.5, 12);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.innerHTML = "";
        container.appendChild(renderer.domElement);

        let controls;
        if (window.THREE.OrbitControls) {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.enableZoom = false; // keep focused on robot
            controls.maxPolarAngle = Math.PI / 2 + 0.2;
            controls.minPolarAngle = Math.PI / 3;
        }

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
        scene.add(ambientLight);

        const cyanKeyLight = new THREE.DirectionalLight(0x38bdf8, 2.5);
        cyanKeyLight.position.set(5, 8, 5);
        scene.add(cyanKeyLight);

        const purpleRimLight = new THREE.DirectionalLight(0xa855f7, 2.0);
        purpleRimLight.position.set(-5, -2, -4);
        scene.add(purpleRimLight);

        // Main Robot Master Group
        const robotGroup = new THREE.Group();
        scene.add(robotGroup);

        // Materials: Sleek Metallic Grey & Polished Silver Chrome Palette
        const greyBodyMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8, // Titanium Silver Grey
            metalness: 0.88,
            roughness: 0.22
        });

        const chromeSilverMat = new THREE.MeshStandardMaterial({
            color: 0xe2e8f0, // Polished Bright Silver Chrome
            metalness: 0.95,
            roughness: 0.12
        });

        const darkGunmetalMat = new THREE.MeshStandardMaterial({
            color: 0x475569, // Deep Gunmetal Grey Accent
            metalness: 0.9,
            roughness: 0.28
        });

        const cyanGlowMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            emissive: 0x38bdf8,
            emissiveIntensity: 1.6,
            roughness: 0.1
        });

        const emeraldBeaconMat = new THREE.MeshStandardMaterial({
            color: 0x10b981,
            emissive: 0x10b981,
            emissiveIntensity: 1.8
        });

        // 1. HEAD & VISOR GROUP
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 1.8, 0);

        // Head Base Box in Titanium Silver Grey
        const headMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.1, 1.5, 16), greyBodyMat);
        headGroup.add(headMesh);

        // Head Top Helmet Dome in Polished Chrome
        const helmetDome = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), chromeSilverMat);
        helmetDome.position.set(0, 0.75, 0);
        headGroup.add(helmetDome);

        // Digital Visor Shield
        const visorMesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.65, 0.6), new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            metalness: 0.92,
            roughness: 0.1
        }));
        visorMesh.position.set(0, 0.15, 0.95);
        headGroup.add(visorMesh);

        // Glowing Digital Eyes
        const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), cyanGlowMat);
        eyeLeft.position.set(-0.45, 0.15, 1.22);
        eyeLeft.scale.set(1.4, 0.8, 0.5);

        const eyeRight = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), cyanGlowMat);
        eyeRight.position.set(0.45, 0.15, 1.22);
        eyeRight.scale.set(1.4, 0.8, 0.5);

        headGroup.add(eyeLeft);
        headGroup.add(eyeRight);

        // Antenna with Pulsing Beacon
        const antennaStem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8), chromeSilverMat);
        antennaStem.position.set(0, 1.6, 0);
        headGroup.add(antennaStem);

        const beaconBall = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), emeraldBeaconMat);
        beaconBall.position.set(0, 2.05, 0);
        headGroup.add(beaconBall);

        // Ear Audio Modules
        const earLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12), chromeSilverMat);
        earLeft.rotation.z = Math.PI / 2;
        earLeft.position.set(-1.25, 0.1, 0);

        const earRight = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12), chromeSilverMat);
        earRight.rotation.z = Math.PI / 2;
        earRight.position.set(1.25, 0.1, 0);

        headGroup.add(earLeft);
        headGroup.add(earRight);

        robotGroup.add(headGroup);

        // 2. TORSO & CHEST PLASMA REACTOR
        const torsoGroup = new THREE.Group();
        torsoGroup.position.set(0, 0, 0);

        const chestMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 0.9, 1.8, 6), greyBodyMat);
        torsoGroup.add(chestMesh);

        // Glowing Arc Reactor Core in Chest
        const arcReactor = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.08, 16, 24), cyanGlowMat);
        arcReactor.position.set(0, 0.1, 1.0);
        torsoGroup.add(arcReactor);

        const reactorCenter = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        reactorCenter.position.set(0, 0.1, 1.0);
        torsoGroup.add(reactorCenter);

        const coreLight = new THREE.PointLight(0x38bdf8, 2, 6);
        coreLight.position.set(0, 0.1, 1.2);
        torsoGroup.add(coreLight);

        // Armor Accent Stripes in Gunmetal Grey
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 0.05), darkGunmetalMat);
        stripe.position.set(0, -0.2, 0.95);
        torsoGroup.add(stripe);

        robotGroup.add(torsoGroup);

        // 3. LEFT ARM (Neutral Resting Pose)
        const leftArmGroup = new THREE.Group();
        leftArmGroup.position.set(-1.45, 0.6, 0);

        const leftShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), chromeSilverMat);
        leftArmGroup.add(leftShoulder);

        const leftUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 1.1, 8), greyBodyMat);
        leftUpperArm.position.set(-0.2, -0.6, 0);
        leftUpperArm.rotation.z = 0.2;
        leftArmGroup.add(leftUpperArm);

        const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), darkGunmetalMat);
        leftHand.position.set(-0.35, -1.2, 0);
        leftArmGroup.add(leftHand);

        robotGroup.add(leftArmGroup);

        // 4. RIGHT ARM (HIGH-ENERGY ARTICULATED WAVING ARM)
        const rightShoulderPivot = new THREE.Group();
        rightShoulderPivot.position.set(1.45, 0.6, 0);

        const rightShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 16), chromeSilverMat);
        rightShoulderPivot.add(rightShoulder);

        // Upper arm extends outwards and up to elbow
        const rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.9, 12), greyBodyMat);
        rightUpperArm.position.set(0.35, 0.45, 0);
        rightUpperArm.rotation.z = -0.5; // Angled up and out
        rightShoulderPivot.add(rightUpperArm);

        // Elbow Pivot at top of upper arm
        const elbowPivot = new THREE.Group();
        elbowPivot.position.set(0.7, 0.9, 0);

        const rightElbow = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 16), chromeSilverMat);
        elbowPivot.add(rightElbow);

        // Forearm extends up
        const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.9, 12), greyBodyMat);
        rightForearm.position.set(0, 0.5, 0);
        elbowPivot.add(rightForearm);

        // Wrist & Hand Pivot
        const wristPivot = new THREE.Group();
        wristPivot.position.set(0, 1.0, 0);

        // Robotic Palm (Metallic Grey)
        const rightPalm = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.46, 0.14), greyBodyMat);
        wristPivot.add(rightPalm);

        // Glowing Cyan Palm Repulsor Light
        const palmLight = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.16, 16), cyanGlowMat);
        palmLight.rotation.x = Math.PI / 2;
        palmLight.position.set(0, 0, 0.02);
        wristPivot.add(palmLight);

        // 4 Articulated Chrome Fingers + Thumb
        const fingerPositions = [-0.14, -0.05, 0.05, 0.14];
        fingerPositions.forEach(fx => {
            const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.32, 8), chromeSilverMat);
            finger.position.set(fx, 0.38, 0);
            wristPivot.add(finger);
        });

        // Angled Thumb
        const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.24, 8), chromeSilverMat);
        thumb.position.set(-0.25, 0.08, 0);
        thumb.rotation.z = 0.6;
        wristPivot.add(thumb);

        elbowPivot.add(wristPivot);
        rightShoulderPivot.add(elbowPivot);
        robotGroup.add(rightShoulderPivot);

        // 5. HOVER BASE & REPULSOR RINGS
        const hoverGroup = new THREE.Group();
        hoverGroup.position.set(0, -1.2, 0);

        const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.08, 12, 24), chromeSilverMat);
        ring1.rotation.x = Math.PI / 2;
        hoverGroup.add(ring1);

        const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 12, 24), darkGunmetalMat);
        ring2.rotation.x = Math.PI / 2;
        ring2.position.set(0, -0.25, 0);
        hoverGroup.add(ring2);

        // Glowing Thruster Cone
        const thrusterCone = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.9, 12, 1, true), new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.65,
            side: THREE.DoubleSide
        }));
        thrusterCone.position.set(0, -0.7, 0);
        hoverGroup.add(thrusterCone);

        robotGroup.add(hoverGroup);

        // Mouse Gaze Tracking Logic
        let mouseX = 0;
        let mouseY = 0;
        let targetHeadRotY = 0;
        let targetHeadRotX = 0;

        window.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            targetHeadRotY = Math.max(-0.6, Math.min(0.6, mouseX * 0.7));
            targetHeadRotX = Math.max(-0.35, Math.min(0.35, -mouseY * 0.4));
        });

        // Waving state & speed multiplier
        let waveMultiplier = 1.0;
        let waveTimer = null;

        const clock = new THREE.Clock();

        const animate = () => {
            requestAnimationFrame(animate);
            const delta = clock.getDelta();
            const time = clock.getElapsedTime();

            // 1. Floating Hover Bobbing Motion
            robotGroup.position.y = Math.sin(time * 2.2) * 0.25;
            robotGroup.rotation.y = Math.sin(time * 0.8) * 0.08;

            // 2. Head Smooth Gaze Tracking
            headGroup.rotation.y += (targetHeadRotY - headGroup.rotation.y) * 0.08;
            headGroup.rotation.x += (targetHeadRotX - headGroup.rotation.x) * 0.08;

            // 3. Digital Eye Blinking
            const blinkFactor = Math.sin(time * 3);
            if (blinkFactor > 0.97) {
                eyeLeft.scale.y = 0.1;
                eyeRight.scale.y = 0.1;
            } else {
                eyeLeft.scale.y = 0.8;
                eyeRight.scale.y = 0.8;
            }

            // 4. HIGH-ENERGY WAVING ARM ANIMATION
            const waveSpeed = 7.5 * waveMultiplier;
            // Forearm sweeps smoothly left and right in a wide arc
            elbowPivot.rotation.z = Math.sin(time * waveSpeed) * 0.65;
            elbowPivot.rotation.y = Math.cos(time * waveSpeed * 0.5) * 0.3;

            // Wrist and hand rock with the wave
            wristPivot.rotation.z = Math.sin(time * waveSpeed + 0.4) * 0.45;

            // Shoulder gently sways with happy robotic energy
            rightShoulderPivot.rotation.z = Math.sin(time * 2.5) * 0.12;
            rightShoulderPivot.rotation.x = Math.sin(time * 3) * 0.1;

            // 5. Thruster Pulse
            thrusterCone.scale.y = 0.9 + Math.sin(time * 12) * 0.2;
            ring1.rotation.z += 0.03;
            ring2.rotation.z -= 0.04;
            beaconBall.scale.setScalar(1 + Math.sin(time * 6) * 0.15);

            if (controls) controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // Robot Controller API
        this.robot = {
            scene,
            camera,
            renderer,
            robotGroup,
            headGroup,
            wave(durationMs = 4000) {
                waveMultiplier = 1.6;
                if (waveTimer) clearTimeout(waveTimer);
                waveTimer = setTimeout(() => {
                    waveMultiplier = 1.0;
                }, durationMs);
            },
            sayHello() {
                this.wave(5000);
                const speechText = "Hello! Welcome to ImpactBridge! I am Nova, your AI Robotics Guide. Let's solve real-world crises together!";
                this.typeSpeech(speechText);
                this.speakAudio("Hello! Welcome to Impact Bridge. I am Nova, your AI Robotics Guide. Let's solve real world problems together!");
            },
            typeSpeech(text) {
                const textEl = document.getElementById("robotSpeechText");
                if (!textEl) return;
                textEl.textContent = "";
                let i = 0;
                const interval = setInterval(() => {
                    if (i < text.length) {
                        textEl.textContent += text.charAt(i);
                        i++;
                    } else {
                        clearInterval(interval);
                    }
                }, 22);
            },
            speakAudio(text) {
                if ('speechSynthesis' in window) {
                    try {
                        window.speechSynthesis.cancel();
                        const utterance = new SpeechSynthesisUtterance(text);
                        utterance.pitch = 1.3;
                        utterance.rate = 1.02;
                        const voices = window.speechSynthesis.getVoices();
                        const enVoice = voices.find(v => v.lang.includes("en")) || voices[0];
                        if (enVoice) utterance.voice = enVoice;
                        window.speechSynthesis.speak(utterance);
                    } catch (e) {
                        console.log("SpeechSynthesis error:", e);
                    }
                }
            }
        };

        // Trigger greeting on load
        setTimeout(() => {
            if (this.robot) {
                this.robot.sayHello();
            }
        }, 600);
    }
};

// Initialize 3D Engine on load
document.addEventListener("DOMContentLoaded", () => {
    ThreeEngine.initAll();
});

