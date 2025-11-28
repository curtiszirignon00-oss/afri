#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script pour uniformiser tous les modules en utilisant les classes CSS au lieu de Tailwind inline
"""

import re

def clean_module_html(content):
    """
    Nettoie le HTML d'un module pour utiliser les classes CSS définies
    """

    # 1. Retirer les divs space-y-8 wrapper
    content = re.sub(r'<div class="space-y-8">\s*', '', content)
    content = re.sub(r'\s*</div>\s*$', '', content)

    # 2. Convertir les objectifs pédagogiques (gradients bleus/violets)
    content = re.sub(
        r'<div class="bg-gradient-to-r from-(?:indigo|blue)-\d+ to-(?:purple|indigo)-\d+ text-white p-\d+ rounded-xl">\s*<h2[^>]*>🎯[^<]*</h2>',
        '<div class="pedagogical-objective">\n<h2>🎯 Objectif pédagogique</h2>',
        content,
        flags=re.DOTALL
    )

    # 3. Convertir les analogies (encadrés jaunes/ambre)
    content = re.sub(
        r'<div class="bg-(?:amber|orange|yellow)-50[^"]*border(?:-\d+)?\s+border-(?:amber|orange|yellow)-\d+[^"]*">',
        '<div class="analogy-box">',
        content
    )

    # 4. Convertir les exemples (encadrés oranges/violets)
    content = re.sub(
        r'<div class="bg-(?:orange|purple|pink)-50[^"]*border(?:-\d+)?\s+border-(?:orange|purple|pink)-\d+[^"]*">',
        '<div class="example-box">',
        content
    )

    # 5. Convertir les points clés (encadrés verts/bleus)
    content = re.sub(
        r'<div class="bg-(?:blue|green|emerald)-50[^"]*border(?:-l-)?\d+\s+border-(?:blue|green|emerald)-\d+[^"]*">',
        '<div class="key-points-box">',
        content
    )

    # 6. Retirer les divs border-l-4 qui servent de sections
    content = re.sub(
        r'<div class="border-l-4 border-(?:blue|green|purple|orange|red)-\d+ pl-\d+ py-\d+">\s*',
        '',
        content
    )

    # 7. Nettoyer les balises h2/h3 avec classes inline - les rendre simples
    content = re.sub(
        r'<h2 class="[^"]*">',
        '<h2>',
        content
    )
    content = re.sub(
        r'<h3 class="[^"]*">',
        '<h3>',
        content
    )
    content = re.sub(
        r'<h4 class="[^"]*">',
        '<h4>',
        content
    )

    # 8. Nettoyer les paragraphes avec classes - garder seulement text-gray-700 pour les citations
    content = re.sub(
        r'<p class="[^"]*italic[^"]*">',
        '<p><em>',
        content
    )
    content = re.sub(
        r'</p>(\s*</(?:em|blockquote)>)',
        r'</em></p>\1',
        content
    )

    # Retirer les autres classes de p sauf pour les citations
    content = re.sub(
        r'<p class="(?!text-xl italic mb-12 text-center text-gray-700)[^"]*">',
        '<p>',
        content
    )

    # 9. Simplifier les listes
    content = re.sub(
        r'<ul class="[^"]*">',
        '<ul>',
        content
    )
    content = re.sub(
        r'<ol class="[^"]*">',
        '<ol>',
        content
    )
    content = re.sub(
        r'<li class="[^"]*">',
        '<li>',
        content
    )

    # 10. Nettoyer les tableaux - retirer classes de coloration inline
    content = re.sub(
        r'<table class="[^"]*">',
        '<table>',
        content
    )
    content = re.sub(
        r'<thead class="[^"]*">',
        '<thead>',
        content
    )
    content = re.sub(
        r'<tbody class="[^"]*">',
        '<tbody>',
        content
    )
    content = re.sub(
        r'<tr class="[^"]*">',
        '<tr>',
        content
    )
    content = re.sub(
        r'<td class="[^"]*">',
        '<td>',
        content
    )
    content = re.sub(
        r'<th class="[^"]*">',
        '<th>',
        content
    )

    # 11. Convertir les sections "prochaine étape" avec gradient
    content = re.sub(
        r'<div class="bg-gradient-to-r from-(?:blue|indigo)-\d+ to-(?:blue|indigo)-\d+ text-white p-\d+ rounded-xl">\s*<h3[^>]*>🧭[^<]*</h3>',
        '<h3>🚀 Prochaine étape</h3>',
        content,
        flags=re.DOTALL
    )

    # 12. Convertir les sections "termes à maîtriser"
    content = re.sub(
        r'<div class="bg-gray-100 rounded-xl p-\d+">\s*<h2[^>]*>🧠 Les termes à maîtriser</h2>',
        '<h2>🧩 Les termes à maîtriser</h2>',
        content
    )

    # 13. Mettre les titres de section en gras
    content = re.sub(
        r'<h2>(🪶|🧩|🌍|🗺️|💥|🏛️|🔁|🚀|🧠|📊|💼|🎯|⚙️|🔍|📈)',
        r'<h2><strong>\1',
        content
    )
    content = re.sub(
        r'([–—-][^<]+)</h2>',
        r'\1</strong></h2>',
        content
    )

    # 14. Retirer div overflow-x-auto autour des tableaux
    content = re.sub(
        r'<div class="overflow-x-auto">\s*<table',
        '<table',
        content
    )
    content = re.sub(
        r'</table>\s*</div>',
        '</table>',
        content
    )

    # 15. Nettoyer les espaces multiples
    content = re.sub(r'\n\s*\n\s*\n+', '\n\n', content)

    return content.strip()


if __name__ == '__main__':
    import sys

    if len(sys.argv) > 1:
        with open(sys.argv[1], 'r', encoding='utf-8') as f:
            content = f.read()
    else:
        content = sys.stdin.read()

    cleaned = clean_module_html(content)
    print(cleaned, end='')
