import Groq from 'groq-sdk';
import 'dotenv/config';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function selectModel(msg) {
  return msg.length < 100
    ? (process.env.GROQ_MODEL_FAST || 'llama-3.1-8b-instant')
    : (process.env.GROQ_MODEL || 'llama-3.3-70b-versatile');
}

async function ask(question) {
  const model = selectModel(question);
  console.log(`\n❓ "${question.slice(0, 60)}..."`);
  console.log(`   → Modèle sélectionné : ${model}`);
  const res = await groq.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: 'Tu es un coach financier BRVM. Réponds en français, brièvement.' },
      { role: 'user', content: question },
    ],
    max_tokens: 200,
    temperature: 0.7,
  });
  console.log(`   ✅ Réponse : ${res.choices[0].message.content?.slice(0, 200)}`);
}

console.log('═'.repeat(65));
console.log('   AFRIBOURSE — Test routing intelligent Groq');
console.log('═'.repeat(65));

// Question courte → 8B
await ask("C'est quoi la BRVM ?");

// Question longue → 70B
await ask("Peux-tu m'expliquer en détail comment fonctionne le mécanisme de formation des prix sur la BRVM, notamment le système de cotation et les règles de variation journalière des titres ?");

console.log('\n' + '═'.repeat(65));
console.log('   🎉 Routing intelligent opérationnel !');
console.log(`   8B  → llama-3.1-8b-instant   (questions < 100 chars)`);
console.log(`   70B → llama-3.3-70b-versatile (questions complexes)`);
console.log('═'.repeat(65));
