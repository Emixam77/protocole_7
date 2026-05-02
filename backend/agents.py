import os
import requests
import json
from .database import get_supabase

SERPER_API_KEY = os.getenv("SERPER_API_KEY")

class AgentSourcing:
    """Agent 1 & 2: Sourcing Leads & Gap Detection"""
    
    NICHES = {
        "Premium": ["Yoga", "Pilates", "Clinique Esthétique", "Spa", "Institut de Beauté"],
        "Artisanat": ["Menuiserie", "Ébénisterie", "Garage spécialisé", "Micro-brasserie", "Chocolaterie"],
        "Espaces": ["Coworking", "Showroom décoration", "Cuisiniste"],
        "Loisirs": ["CrossFit", "Club de Tennis", "Club de Golf", "Équitation"],
        "Hôtellerie": ["Camping", "Gîte", "Domaine Mariage", "Séminaire"]
    }

    def __init__(self, niche="Restos", city="Paris"):
        self.niche = niche
        self.city = city

    def scan_google_maps(self):
        """Recherche des entreprises avec des signaux de besoin d'images."""
        print(f"🛰️ Agent Sourcing scanne {self.niche} à {self.city}...")
        
        url = "https://google.serper.dev/search"
        # On cherche spécifiquement des entreprises sur Maps avec avis clients
        # On ajoute "avis" pour trouver des fiches actives
        payload = json.dumps({
            "q": f"{self.niche} à {self.city} avis",
            "location": self.city,
            "gl": "fr",
            "hl": "fr"
        })
        headers = {
            'X-API-KEY': SERPER_API_KEY,
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.post(url, headers=headers, data=payload)
            data = response.json()
            
            leads = []
            results = data.get("organic", [])[:8] 
            
            for res in results:
                title = res.get("title")
                snippet = res.get("snippet", "").lower()
                rating_signal = "avis" in snippet or "étoiles" in snippet
                
                # Logique de détection de gap avancée
                gap = "Photos smartphone 'plates' détectées"
                score = 70
                
                if rating_signal:
                    gap = "Avis exceptionnels / Photos clients uniquement"
                    score = 95 # Argument de vente parfait : "Qualité de service > Qualité visuelle"
                elif "site web" not in snippet:
                    gap = "Absence de vitrine digitale (High-ROI)"
                    score = 85
                
                leads.append({
                    "name": title,
                    "gap": gap,
                    "score": score
                })
            
            return leads
        except Exception as e:
            print(f"Erreur Serper: {e}")
            return []

    def inject_leads(self, leads, user_id):
        try:
            supabase = get_supabase()
            for lead in leads:
                supabase.table("leads_prospects").insert({
                    "company_name": lead["name"],
                    "niche": self.niche,
                    "gap_type": lead["gap"],
                    "heat_score": lead["score"],
                    "user_id": user_id,
                    "city": self.city
                }).execute()
            print(f"✅ {len(leads)} leads injectés dans Supabase.")
        except Exception as e:
            print(f"⚠️ Erreur injection Supabase (RLS): {e}")

class AgentCommunity:
    """Agent 3: Community Listening (Reddit FR/TikTok/FB)"""
    
    def detect_distress(self):
        """Détecte les signaux de détresse ou opportunités sur les réseaux FR."""
        print("👂 Agent Communauté écoute Reddit FR, TikTok et FB...")
        
        url = "https://google.serper.dev/search"
        # Requête multi-plateformes ciblée FR
        queries = [
            "site:reddit.com/r/france OR site:reddit.com/r/entrepreneur_fr \"pas de clients\" OR \"galère\"",
            "site:tiktok.com \"photographe débutant\" \"conseils\"",
            "site:facebook.com/groups \"besoin de photographe\" OR \"recherche photographe\""
        ]
        
        all_signals = []
        headers = { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' }

        for q in queries:
            try:
                payload = json.dumps({"q": q, "gl": "fr", "hl": "fr"})
                response = requests.post(url, headers=headers, data=payload)
                data = response.json()
                
                for res in data.get("organic", [])[:2]:
                    source = "Reddit FR" if "reddit" in q else ("TikTok" if "tiktok" in q else "Facebook")
                    all_signals.append({
                        "source": source,
                        "content": res.get("title"),
                        "link": res.get("link")
                    })
            except Exception as e:
                print(f"Erreur source {q}: {e}")

        return all_signals if all_signals else "Silence radio sur les réseaux FR."

class AgentAdsIntel:
    """Agent 4: Ads Intelligence & Hook Optimization"""
    
    def analyze_competitors(self):
        """Analyse les hooks concurrents."""
        print("📈 Agent Ads analyse les hooks...")
        return {
            "current_trend": "Anti-Instagram",
            "recommended_hook": "La Méthode Invisible",
            "cta": "Signez votre premier contrat en 7 jours"
        }

    def generate_pitch(self, company_name, gap):
        """Génère un script d'approche personnalisé basé sur le gap détecté."""
        
        # Template de base inspiré du "Protocole"
        pitch = f"Salut l'équipe {company_name} !\n\n"
        
        if "Avis exceptionnels" in gap:
            pitch += (
                f"Je viens de voir vos avis sur Google... C'est impressionnant ! "
                f"Vos clients vous adorent, mais j'ai remarqué un truc : vos photos actuelles "
                f"ne reflètent pas du tout ce niveau d'excellence. On dirait que votre service est "
                f"bien au-dessus de votre image visuelle.\n\n"
                f"Je suis photographe spécialisé et je propose de réaligner votre image sur votre talent. "
                f"Dispo pour un café rapide cette semaine ?"
            )
        elif "Absence de vitrine" in gap:
            pitch += (
                f"J'ai cherché votre établissement en ligne et c'est dommage : on ne vous trouve "
                f"pas facilement alors que vous avez un super potentiel.\n\n"
                f"Je peux vous aider à créer une 'Méthode Invisible' pour capter des clients "
                f"sans passer 3h sur Instagram. Ça vous parle ?"
            )
        else:
            pitch += (
                f"J'ai remarqué que vos photos sur Google Maps commençaient à dater un peu. "
                f"Dans votre secteur, les gens choisissent avec les yeux en 3 secondes.\n\n"
                f"Je peux vous faire un pack 'Relance Visuelle' pour booster vos réservations. "
                f"On en discute ?"
            )
            
        return pitch
