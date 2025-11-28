#!/usr/bin/env python3
"""
Script de reformatage automatique des modules AfriBourse
Supprime les doublons de titres et applique les bonnes classes CSS
"""

import re
import sys

def clean_module_content(html_content):
    """
    Nettoie le contenu HTML d'un module :
    1. Supprime les titres doublés
    2. Supprime les numéros de section en double (1.1, 1.2, etc.)
    3. Ajoute les classes CSS correctes
    """

    # 1. Supprimer les titres doublés (quand un h2 ou h3 apparaît 2 fois de suite)
    # Exemple : "🧩 1.1 Titre\n🧩 1.1 Titre" → "🧩 1.1 Titre"
    html_content = re.sub(r'(<h[23][^>]*>.*?</h[23]>)\s*\1', r'\1', html_content, flags=re.DOTALL)

    # 2. Supprimer les numéros de section dans les titres (garder juste l'emoji et le titre)
    # Exemple : "🧩 1.1 Qu'est-ce..." → "🧩 Qu'est-ce..."
    html_content = re.sub(r'(<h[23][^>]*>)\s*\d+\.\d+\s+', r'\1', html_content)
    html_content = re.sub(r'(<h[23][^>]*>)\s*\d+\s+', r'\1', html_content)

    # 3. Wrapper l'objectif pédagogique dans la bonne classe
    objective_pattern = r'(?:<div[^>]*>)?\s*(?:<h[23][^>]*>)?\s*🎯\s*Objectif[^<]*</h[23]>'
    if re.search(objective_pattern, html_content, re.IGNORECASE):
        # Trouver le début et la fin du bloc objectif
        start_match = re.search(objective_pattern, html_content, re.IGNORECASE)
        if start_match:
            start_pos = start_match.start()
            # Chercher la fin (avant le prochain h2)
            next_h2 = re.search(r'<h2[^>]*>(?!.*Objectif)', html_content[start_pos:])
            if next_h2:
                end_pos = start_pos + next_h2.start()
                objective_block = html_content[start_pos:end_pos]

                # Nettoyer et restructurer le bloc objectif
                if 'pedagogical-objective' not in objective_block:
                    # Extraire le contenu
                    intro_match = re.search(r'(?:À la fin.*?:|vous serez capable[^:]*:)(.*?)(?=<h2|$)',
                                          objective_block, re.DOTALL | re.IGNORECASE)
                    if intro_match:
                        content = intro_match.group(1).strip()

                        # Créer le nouveau bloc
                        new_objective = f'''<div class="pedagogical-objective">
  <h2>🎯 Objectif Pédagogique</h2>
  <p>À la fin de ce module, vous serez capable :</p>
  {content}
</div>

'''
                        html_content = html_content[:start_pos] + new_objective + html_content[end_pos:]

    # 4. Wrapper les analogies dans la classe analogy-box
    analogy_patterns = [
        (r'<div[^>]*>\s*💡[^<]*L\'analogie[^<]*</[^>]+>(.*?)(?=<h[23]|<div class=|$)', 'analogy'),
        (r'<div[^>]*>\s*<h[34][^>]*>💡[^<]*L\'analogie[^<]*</h[34]>(.*?)(?=<h[23]|<div class=|$)', 'analogy'),
    ]

    for pattern, box_type in analogy_patterns:
        matches = list(re.finditer(pattern, html_content, re.DOTALL | re.IGNORECASE))
        for match in reversed(matches):  # Reverse pour ne pas décaler les positions
            if 'analogy-box' not in match.group(0):
                original = match.group(0)
                content = match.group(1).strip() if match.lastindex >= 1 else ''

                new_block = f'''<div class="analogy-box">
  <h3>💡 L'analogie à retenir</h3>
  {content}
</div>'''
                html_content = html_content[:match.start()] + new_block + html_content[match.end():]

    # 5. Wrapper les exemples dans example-box
    example_patterns = [
        (r'<div[^>]*>\s*🎯\s*Exemple[^<]*</[^>]+>(.*?)(?=<h[23]|<div class=|$)', 'example'),
        (r'<div[^>]*>\s*<h[34][^>]*>🎯\s*Exemple[^<]*</h[34]>(.*?)(?=<h[23]|<div class=|$)', 'example'),
    ]

    for pattern, box_type in example_patterns:
        matches = list(re.finditer(pattern, html_content, re.DOTALL | re.IGNORECASE))
        for match in reversed(matches):
            if 'example-box' not in match.group(0):
                original = match.group(0)
                content = match.group(1).strip() if match.lastindex >= 1 else ''

                new_block = f'''<div class="example-box">
  <h3>🎯 Exemple</h3>
  {content}
</div>'''
                html_content = html_content[:match.start()] + new_block + html_content[match.end():]

    # 6. Wrapper les points clés dans key-points-box
    key_points_patterns = [
        (r'<div[^>]*>\s*💡\s*À retenir[^<]*</[^>]+>(.*?)(?=<h[23]|<div class=|$)', 'key-points'),
        (r'<div[^>]*>\s*💎\s*À retenir[^<]*</[^>]+>(.*?)(?=<h[23]|<div class=|$)', 'key-points'),
    ]

    for pattern, box_type in key_points_patterns:
        matches = list(re.finditer(pattern, html_content, re.DOTALL | re.IGNORECASE))
        for match in reversed(matches):
            if 'key-points-box' not in match.group(0):
                original = match.group(0)
                content = match.group(1).strip() if match.lastindex >= 1 else ''

                new_block = f'''<div class="key-points-box">
  <h3>💎 À retenir</h3>
  {content}
</div>'''
                html_content = html_content[:match.start()] + new_block + html_content[match.end():]

    # 7. Nettoyer les espaces multiples
    html_content = re.sub(r'\n{3,}', '\n\n', html_content)

    return html_content.strip()


def format_module_for_db(title, content):
    """
    Formate un module complet pour l'insertion en base de données
    """
    cleaned_content = clean_module_content(content)

    return {
        'title': title,
        'content': cleaned_content
    }


# Script pour lire depuis stdin et écrire vers stdout
if __name__ == '__main__':
    # Lire le contenu depuis stdin ou fichier
    if len(sys.argv) > 1:
        # Mode fichier : python clean_modules.py fichier.html
        with open(sys.argv[1], 'r', encoding='utf-8') as f:
            content = f.read()
    else:
        # Mode stdin : cat fichier.html | python clean_modules.py
        content = sys.stdin.read()

    # Nettoyer le contenu
    cleaned = clean_module_content(content)

    # Afficher le résultat sur stdout
    print(cleaned, end='')
