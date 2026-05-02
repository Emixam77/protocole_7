const SUPABASE_URL = "https://pjenfyfcdvlkuvknnzdk.supabase.co";
const SUPABASE_KEY = "sb_publishable_4o2Pds0No47NSE-aZjtAng_Qm8dXxMx";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    console.log("🛰️ Radar Nexus Initialisé...");
    
    const loginModal = document.getElementById('login-modal');
    const dashboardContent = document.getElementById('dashboard-content');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const userDisplay = document.getElementById('user-display');
    const btnLogout = document.getElementById('btn-logout');

    const MISSIONS_CONFIG = {
        1: ["Scanner 20 leads potentiels", "Identifier les 'Gaps' visuels", "Verrouiller 5 cibles Commando"],
        2: ["Générer 5 pitchs personnalisés", "Contacter les décideurs", "Traquer les ouvertures"],
        3: ["Relancer les non-répondants (Invisible)", "Répondre aux premières questions", "Planifier 1 appel"],
        4: ["Réaliser un mini-audit vidéo (Loom)", "Envoyer la proposition de valeur", "Briefer sur l'offre Premium"],
        5: ["Appel de closing", "Validation du périmètre", "Accord verbal de signature"],
        6: ["Envoi de l'acompte (Stripe)", "Collecte des accès clients", "Kick-off de la mission"],
        7: ["Début de la production", "Premières livraisons", "CÉLÉBRATION DU CONTRAT 🍾"]
    };

    let userProgress = { day: 1, completed: [] };

    // Initialisation du dashboard après login
    async function showDashboard(user) {
        loginModal.style.display = 'none';
        dashboardContent.style.display = 'block';
        userDisplay.innerText = user.email.split('@')[0].toUpperCase();
        window.currentUser = user;
        
        await loadUserProgress(user.id);
        renderMissions();
        updateTimeline();
    }

    async function loadUserProgress(userId) {
        const { data, error } = await supabaseClient
            .table('user_activity')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
        
        if (data) {
            userProgress.day = data.current_day;
            userProgress.completed = data.tasks_completed || [];
        } else {
            // Création initiale si absent
            await supabaseClient.table('user_activity').insert({
                user_id: userId,
                current_day: 1,
                tasks_completed: []
            });
        }
    }

    function renderMissions() {
        const list = document.getElementById('missions-list');
        const dayDisplay = document.getElementById('current-day-display');
        const missions = MISSIONS_CONFIG[userProgress.day] || [];
        
        dayDisplay.innerText = userProgress.day;
        
        list.innerHTML = missions.map((mission, index) => {
            const isCompleted = userProgress.completed.includes(mission);
            return `
                <li style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.8rem; font-family: var(--font-mono); font-size: 0.9rem;">
                    <input type="checkbox" class="mission-check" data-task="${mission}" ${isCompleted ? 'checked' : ''} style="accent-color: var(--accent-color); width: 1.2rem; height: 1.2rem; cursor: pointer;">
                    <span style="${isCompleted ? 'text-decoration: line-through; opacity: 0.5;' : ''}">${mission}</span>
                </li>
            `;
        }).join('');

        document.querySelectorAll('.mission-check').forEach(check => {
            check.addEventListener('change', async (e) => {
                const task = e.target.getAttribute('data-task');
                if (e.target.checked) {
                    userProgress.completed.push(task);
                } else {
                    userProgress.completed = userProgress.completed.filter(t => t !== task);
                }
                await saveProgress();
                renderMissions();
            });
        });
    }

    async function saveProgress() {
        if (!window.currentUser) return;
        await supabaseClient.table('user_activity')
            .update({ 
                current_day: userProgress.day,
                tasks_completed: userProgress.completed,
                updated_at: new Date()
            })
            .eq('user_id', window.currentUser.id);
    }

    function updateTimeline() {
        document.querySelectorAll('.day-step').forEach(step => {
            const day = parseInt(step.getAttribute('data-day'));
            step.classList.remove('active', 'completed');
            if (day === userProgress.day) step.classList.add('active');
            if (day < userProgress.day) step.classList.add('completed');
        });
    }

    document.getElementById('btn-next-day').addEventListener('click', async () => {
        if (userProgress.day < 7) {
            if (confirm(`Passer au JOUR ${userProgress.day + 1} ? Tes missions actuelles seront archivées.`)) {
                userProgress.day++;
                userProgress.completed = [];
                await saveProgress();
                renderMissions();
                updateTimeline();
            }
        } else {
            alert("FÉLICITATIONS ! Tu as terminé le Protocole 7 Jours.");
        }
    });
    
    // Animation simple pour simuler la détection de signaux
    const radar = document.querySelector('.radar');
    const signalsContainer = document.querySelector('.sidebar .card p');

    async function updateRadar() {
        try {
            const res = await fetch('/radar/signals');
            const signals = await res.json();
            if (Array.isArray(signals)) {
                signalsContainer.innerHTML = signals.map(s => `
                    <span style="color: var(--danger-color)">●</span> ${s.source}: ${s.content.substring(0, 50)}...
                    <br><a href="${s.link}" target="_blank" style="color: #fff; font-size: 0.7rem;">Voir le signal</a>
                    <hr style="border: 0.5px solid #333; margin: 0.5rem 0;">
                `).join('');
            }
        } catch (e) {
            console.log("Radar en attente de connexion API...");
        }
    }

    updateRadar();
    setInterval(updateRadar, 30000); // Update every 30s

    // Gestion du Scan de Leads
    const btnScan = document.getElementById('btn-scan');
    const leadsContainer = document.getElementById('leads-container');

    btnScan.addEventListener('click', async () => {
        btnScan.innerText = "SCAN EN COURS...";
        btnScan.disabled = true;
        
        try {
            const userId = window.currentUser ? window.currentUser.id : "00000000-0000-0000-0000-000000000000";
            const niche = document.getElementById('niche-select').value;
            const city = document.getElementById('city-input').value;

            const response = await fetch('/scan/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    niche: niche,
                    city: city
                })
            });
            
            const data = await response.json();
            
            if (data.leads && data.leads.length > 0) {
                renderLeads(data.leads);
            } else {
                leadsContainer.innerHTML = '<li class="lead-item"><em>Aucun lead trouvé pour cette zone.</em></li>';
            }
            
            btnScan.innerText = "LANCER SCAN";
            btnScan.disabled = false;
        } catch (e) {
            console.error("Erreur scan:", e);
            btnScan.innerText = "ERREUR SCAN";
        }
    });

    // Gestion des Pitchs Commando
    const pitchModal = document.getElementById('pitch-modal');
    const pitchText = document.getElementById('pitch-text');
    const btnClosePitch = document.getElementById('btn-close-pitch');
    const btnCopyPitch = document.getElementById('btn-copy-pitch');

    btnClosePitch.addEventListener('click', () => pitchModal.style.display = 'none');
    btnCopyPitch.addEventListener('click', () => {
        pitchText.select();
        document.execCommand('copy');
        btnCopyPitch.innerText = "COPIÉ !";
        setTimeout(() => btnCopyPitch.innerText = "COPIER SCRIPT", 2000);
    });

    function renderLeads(leads) {
        leadsContainer.innerHTML = leads.map(lead => `
            <li class="lead-item">
                <div>
                    <strong>${lead.name}</strong>
                    <br><small>Gap: ${lead.gap}</small>
                </div>
                <div class="heat-bar">
                    <div class="heat-fill" style="width: ${lead.score}%;"></div>
                </div>
                <button class="btn btn-sm btn-commando" data-name="${lead.name}" data-gap="${lead.gap}">COMMANDO</button>
            </li>
        `).join('');
        
        document.querySelectorAll('.btn-commando').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const name = btn.getAttribute('data-name');
                const gap = btn.getAttribute('data-gap');
                
                btn.innerText = "CHARGEMENT...";
                btn.disabled = true;

                try {
                    const response = await fetch('/commando/pitch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ company_name: name, gap: gap })
                    });
                    const data = await response.json();
                    
                    pitchText.value = data.pitch;
                    document.getElementById('pitch-title').innerText = `🎯 PITCH: ${name.toUpperCase()}`;
                    pitchModal.style.display = 'flex';
                    
                    btn.innerText = "CONTACTÉ";
                    btn.style.background = "#333";
                } catch (err) {
                    console.error(err);
                    btn.innerText = "ERREUR";
                }
            });
        });
    }
    
    // --- Authentification ---
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        showDashboard(session.user);
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        console.log("🔑 Tentative de connexion pour:", email);
        
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        
        if (error) {
            console.error("❌ Erreur Auth Supabase:", error);
            loginError.style.display = 'block';
            
            let msg = error.message.toUpperCase();
            if (msg.includes("CONFIRM")) msg = "VEUILLEZ CONFIRMER VOTRE EMAIL (CHECK SPAMS)";
            if (msg.includes("INVALID LOGIN")) msg = "EMAIL OU MOT DE PASSE INCORRECT";
            
            loginError.innerText = `ERREUR: ${msg}`;
        } else {
            console.log("✅ Connexion réussie !", data.user);
            showDashboard(data.user);
        }
    });

    btnLogout.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.reload();
    });
});
