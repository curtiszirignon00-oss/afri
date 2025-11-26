#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script pour convertir les modules texte en format HTML pour seed-learning.ts
"""

import re
import sys

def convert_text_to_html(text):
    """Convertit le texte formaté en HTML stylisé"""

    # Remplacer les formules mathématiques $$...$$ par <div class="formula">...</div>
    text = re.sub(
        r'\$\$(.*?)\$\$',
        r'<div class="my-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg overflow-x-auto">' +
        r'<div class="text-center font-mono text-base text-gray-800">\1</div></div>',
        text,
        flags=re.DOTALL
    )

    # Remplacer les titres principaux (🎯, 🌍, etc.)
    text = re.sub(r'^(🎯.*?)$', r'<h2 class="text-3xl font-bold text-gray-900 mb-6">\1</h2>', text, flags=re.MULTILINE)

    # Remplacer les sections avec emojis (ex: 1.1, 2.1, etc.)
    text = re.sub(r'^([\d\.]+\s+.+?)$', r'<h3 class="text-2xl font-bold text-gray-900 mb-4 mt-8">\1</h3>', text, flags=re.MULTILINE)

    # Remplacer les sous-sections
    text = re.sub(r'^(.*?)\s*:\s*$', r'<h4 class="text-xl font-bold text-gray-800 mb-3 mt-6">\1</h4>', text, flags=re.MULTILINE)

    # Remplacer les listes à puces (•)
    lines = text.split('\n')
    html_lines = []
    in_list = False

    for line in lines:
        stripped = line.strip()

        # Détecter le début d'une liste
        if stripped.startswith('•'):
            if not in_list:
                html_lines.append('<ul class="list-disc ml-6 mb-4 space-y-2">')
                in_list = True
            content = stripped[1:].strip()  # Enlever le •
            html_lines.append(f'  <li class="text-base text-gray-700 leading-relaxed">{content}</li>')
        else:
            if in_list:
                html_lines.append('</ul>')
                in_list = False

            # Paragraphes normaux
            if stripped and not stripped.startswith('<'):
                html_lines.append(f'<p class="text-base mb-4 leading-relaxed text-gray-700">{stripped}</p>')
            elif stripped.startswith('<'):
                html_lines.append(stripped)

    if in_list:
        html_lines.append('</ul>')

    return '\n'.join(html_lines)

def main():
    input_file = r'C:\Users\HP\OneDrive\Desktop\LGC\the little garden\mvp\PROGRAMME DE FORM\ALL module txt.txt'
    output_file = r'C:\Users\HP\OneDrive\Desktop\afri\backend\scripts\converted-modules.html'

    print(f"Lecture du fichier: {input_file}")

    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    print("Conversion en HTML...")
    html_content = convert_text_to_html(content)

    print(f"Écriture dans: {output_file}")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print("✅ Conversion terminée!")

if __name__ == '__main__':
    main()
